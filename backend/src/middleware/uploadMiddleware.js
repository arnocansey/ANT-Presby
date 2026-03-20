const fs = require('fs');
const path = require('path');
const multer = require('multer');

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
};

const createImageUpload = ({ directoryName, filePrefix }) => {
  const uploadDir = ensureDir(path.join(__dirname, '..', '..', 'uploads', directoryName));

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const safeExt = path.extname(file.originalname || '').toLowerCase() || '.jpg';
      const actorId = req.user?.userId || 'system';
      const fileName = `${filePrefix}-${actorId}-${Date.now()}${safeExt}`;
      cb(null, fileName);
    },
  });

  return multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (!file.mimetype || !file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'));
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });
};

const profilePhotoUpload = createImageUpload({
  directoryName: 'profile-images',
  filePrefix: 'user',
});

const newsImageUpload = createImageUpload({
  directoryName: 'news-images',
  filePrefix: 'news',
});

module.exports = {
  profilePhotoUpload,
  newsImageUpload,
};
