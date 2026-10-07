const multer = require('multer');

// Only these image types are accepted. Files are held in memory and stored by services/imageStorage,
// which chooses the stored extension from the mimetype, never from the client's filename.
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const imageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      const error = new Error('Only JPEG, PNG, WebP, or GIF images are allowed');
      error.statusCode = 400;
      return cb(error);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  imageUpload,
  profilePhotoUpload: imageUpload,
  newsImageUpload: imageUpload,
  seriesImageUpload: imageUpload,
  eventImageUpload: imageUpload,
};
