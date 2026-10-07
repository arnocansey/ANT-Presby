const express = require('express');
const albumController = require('../controllers/albumController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  handleValidationErrors,
  validateAlbum,
  validateAlbumPhotos,
  validateAlbumCover,
} = require('../middleware/validators');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', albumController.adminList);
router.post('/', validateAlbum, handleValidationErrors, albumController.adminCreate);
router.get('/:id', albumController.adminGet);
router.put('/:id', validateAlbum, handleValidationErrors, albumController.adminUpdate);
router.delete('/:id', albumController.adminDelete);
router.post('/:id/upload-signature', albumController.adminUploadSignature);
router.post('/:id/photos', validateAlbumPhotos, handleValidationErrors, albumController.adminAddPhotos);
router.delete('/:id/photos/:photoId', albumController.adminDeletePhoto);
router.patch('/:id/cover', validateAlbumCover, handleValidationErrors, albumController.adminSetCover);

module.exports = router;
