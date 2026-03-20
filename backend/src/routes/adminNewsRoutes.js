const express = require('express');
const newsController = require('../controllers/newsController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { newsImageUpload } = require('../middleware/uploadMiddleware');
const { validateNewsPost, handleValidationErrors } = require('../middleware/validators');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', newsController.getAdminNews);
router.post('/upload-image', newsImageUpload.single('image'), newsController.uploadNewsImage);
router.post('/', validateNewsPost, handleValidationErrors, newsController.createNewsPost);
router.put('/:id', newsController.updateNewsPost);
router.delete('/:id', newsController.deleteNewsPost);

module.exports = router;
