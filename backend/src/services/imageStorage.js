const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

/**
 * Image storage - the only module that talks to Cloudinary.
 * Without the CLOUDINARY_* settings (local development, tests) images are written to uploads/ as before.
 */

const ROOT_FOLDER = 'antpresby';
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

// Each kind: its Cloudinary folder (antpresby/<kind>) and its disk-fallback directory and file prefix.
const KINDS = {
  profile: { dir: 'profile-images', prefix: 'user' },
  news: { dir: 'news-images', prefix: 'news' },
  series: { dir: 'series-images', prefix: 'series' },
  events: { dir: 'event-images', prefix: 'event' },
};

const EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const CLOUDINARY_IMAGE_URL =
  /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(?:v\d+\/)?(antpresby\/([a-z]+)\/[A-Za-z0-9_-]+)\.(jpg|jpeg|png|webp|gif)$/;

const isConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const client = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
};

const storageUnavailable = () => {
  const error = new Error('Image storage is unavailable, please try again');
  error.statusCode = 502;
  return error;
};

const kindConfig = (kind) => {
  const config = KINDS[kind];
  if (!config) throw new Error(`Unknown image kind: ${kind}`);
  return config;
};

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = client().uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) =>
      error ? reject(error) : resolve(result)
    );
    stream.end(buffer);
  });

const uploadImage = async (file, { kind, actorId }) => {
  const config = kindConfig(kind);

  if (isConfigured()) {
    try {
      const result = await uploadToCloudinary(file.buffer, `${ROOT_FOLDER}/${kind}`);
      return { url: result.secure_url, publicId: result.public_id, fileName: result.public_id };
    } catch (error) {
      console.warn('Cloudinary upload failed:', error.message);
      throw storageUnavailable();
    }
  }

  // The extension comes from the checked mimetype, never from the client's filename.
  const fileName = `${config.prefix}-${Number(actorId) || 'system'}-${Date.now()}${EXTENSIONS[file.mimetype]}`;
  const dir = path.join(UPLOADS_ROOT, config.dir);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(path.join(dir, fileName), file.buffer);
  return { url: `/uploads/${config.dir}/${fileName}`, publicId: null, fileName };
};

// Our Cloudinary image (this cloud, under antpresby/): its public id and kind; otherwise null.
const parseOwnCloudinaryUrl = (url) => {
  const match = CLOUDINARY_IMAGE_URL.exec(String(url || ''));
  if (!match || !process.env.CLOUDINARY_CLOUD_NAME || match[1] !== process.env.CLOUDINARY_CLOUD_NAME) {
    return null;
  }
  return { publicId: match[2], kind: match[3] };
};

// True for an image we stored ourselves for this kind: a local upload or our Cloudinary folder.
const isOwnImageUrl = (url, kind) => {
  const config = KINDS[kind];
  if (!config || !url) return false;
  const local = new RegExp(`^/uploads/${config.dir}/[A-Za-z0-9_-]+\\.(jpg|png|webp|gif)$`);
  if (local.test(String(url))) return true;
  const own = parseOwnCloudinaryUrl(url);
  return Boolean(own && own.kind === kind);
};

// Best-effort removal of a replaced image; only our Cloudinary images, never local files.
const deleteImage = async (url) => {
  const own = parseOwnCloudinaryUrl(url);
  if (!own || !isConfigured()) return false;
  try {
    await client().uploader.destroy(own.publicId, { resource_type: 'image' });
    return true;
  } catch (error) {
    console.warn('Image cleanup failed:', error.message);
    return false;
  }
};

module.exports = {
  KINDS,
  isConfigured,
  uploadImage,
  isOwnImageUrl,
  deleteImage,
};
