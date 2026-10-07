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

// ---- Photo albums (phase 7b) ----
// Album photos are uploaded by the browser or phone straight to antpresby/albums/<id>/ with a signature
// issued here, then re-checked with the Admin API before they are recorded.

const ALBUM_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
const ALBUM_MAX_BYTES = 10 * 1024 * 1024;
const ALBUM_PUBLIC_ID = /^antpresby\/albums\/(\d+)\/[A-Za-z0-9_-]+$/;

const albumFolder = (albumId) => `${ROOT_FOLDER}/albums/${Number(albumId)}`;

const isAlbumPublicId = (publicId, albumId) => {
  const match = ALBUM_PUBLIC_ID.exec(String(publicId || ''));
  if (!match) return false;
  return albumId === undefined || Number(match[1]) === Number(albumId);
};

// Everything the client needs to upload one batch; the API secret never leaves the server.
const createAlbumUploadSignature = (albumId) => {
  const folder = albumFolder(albumId);
  const timestamp = Math.round(Date.now() / 1000);
  const allowedFormats = ALBUM_FORMATS.join(',');
  const signature = client().utils.api_sign_request(
    { allowed_formats: allowedFormats, folder, timestamp },
    process.env.CLOUDINARY_API_SECRET
  );
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    allowedFormats,
    maxFileSize: ALBUM_MAX_BYTES,
  };
};

// Keeps only ids that sit in this album's folder and that Cloudinary confirms are small enough images.
const verifyAlbumAssets = async (albumId, publicIds) => {
  const unique = [...new Set((publicIds || []).map(String))];
  const candidates = unique.filter((publicId) => isAlbumPublicId(publicId, albumId));
  const rejected = unique.filter((publicId) => !candidates.includes(publicId));
  if (candidates.length === 0) return { verified: [], rejected };

  let resources;
  try {
    const result = await client().api.resources_by_ids(candidates);
    resources = result?.resources || [];
  } catch (error) {
    console.warn('Cloudinary asset check failed:', error.message);
    throw storageUnavailable();
  }

  const byId = new Map(resources.map((resource) => [resource.public_id, resource]));
  const verified = [];
  candidates.forEach((publicId) => {
    const asset = byId.get(publicId);
    const bytes = Number(asset?.bytes);
    const ok =
      asset &&
      asset.resource_type === 'image' &&
      ALBUM_FORMATS.includes(String(asset.format).toLowerCase()) &&
      bytes > 0 &&
      bytes <= ALBUM_MAX_BYTES;
    if (ok) {
      verified.push({
        publicId,
        url: asset.secure_url,
        width: asset.width ?? null,
        height: asset.height ?? null,
        bytes,
        format: String(asset.format).toLowerCase(),
      });
    } else {
      rejected.push(publicId);
    }
  });
  return { verified, rejected };
};

const deliveryUrl = (publicId, options) =>
  publicId && isConfigured() ? client().url(publicId, { secure: true, ...options }) : null;

// Full size, in a format every browser can show (HEIC included).
const displayUrl = (publicId) => deliveryUrl(publicId, { quality: 'auto', fetch_format: 'auto' });
const thumbnailUrl = (publicId) =>
  deliveryUrl(publicId, { crop: 'fill', width: 400, height: 400, quality: 'auto', fetch_format: 'auto' });
// The original file, served with Content-Disposition: attachment.
const downloadUrl = (publicId) => deliveryUrl(publicId, { flags: 'attachment' });

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

// Every recorded photo carries its album's tag; uploads that were never recorded, and deleted photos, don't.
const ALBUM_TAG_BATCH = 1000;
const albumTag = (albumId) => `${ROOT_FOLDER}-album-${Number(albumId)}`;

const tagAlbumPhotos = async (albumId, publicIds) => {
  try {
    for (let i = 0; i < publicIds.length; i += ALBUM_TAG_BATCH) {
      await client().uploader.add_tag(albumTag(albumId), publicIds.slice(i, i + ALBUM_TAG_BATCH));
    }
  } catch (error) {
    console.warn('Album photo tagging failed:', error.message);
    throw storageUnavailable();
  }
};

const untagAlbumPhoto = async (albumId, publicId) => {
  try {
    await client().uploader.remove_tag(albumTag(albumId), [publicId]);
  } catch (error) {
    console.warn('Album photo untagging failed:', error.message);
    throw storageUnavailable();
  }
};

// A signed link that makes Cloudinary build the zip on its side. Generated on request; never stored.
// Zipping by the album's tag keeps the URL short at any size and includes only recorded photos.
const albumArchiveUrl = (albumId, title) =>
  client().utils.download_zip_url({
    resource_type: 'image',
    flatten_folders: true,
    target_public_id: slugify(title) || `album-${Number(albumId)}`,
    tags: albumTag(albumId),
  });

// Best-effort removal of one album photo; never throws.
const deleteAlbumPhoto = async (publicId) => {
  if (!isAlbumPublicId(publicId) || !isConfigured()) return false;
  try {
    await client().uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
    return true;
  } catch (error) {
    console.warn('Album photo cleanup failed:', error.message);
    return false;
  }
};

// Best-effort removal of everything in an album's folder. The trailing slash keeps album 1 away from album 10.
const deleteAlbumFolder = async (albumId) => {
  if (!isConfigured()) return false;
  const folder = albumFolder(albumId);
  try {
    await client().api.delete_resources_by_prefix(`${folder}/`);
  } catch (error) {
    console.warn('Album cleanup failed:', error.message);
    return false;
  }
  try {
    await client().api.delete_folder(folder);
  } catch (error) {
    // The folder may already be gone or never have existed; the photos are deleted either way.
    console.warn('Album folder removal skipped:', error.message);
  }
  return true;
};

module.exports = {
  KINDS,
  isConfigured,
  uploadImage,
  isOwnImageUrl,
  deleteImage,
  ALBUM_FORMATS,
  ALBUM_MAX_BYTES,
  albumFolder,
  isAlbumPublicId,
  createAlbumUploadSignature,
  verifyAlbumAssets,
  displayUrl,
  thumbnailUrl,
  downloadUrl,
  albumArchiveUrl,
  tagAlbumPhotos,
  untagAlbumPhoto,
  deleteAlbumPhoto,
  deleteAlbumFolder,
};
