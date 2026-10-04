const express = require('express');
const sermonSeriesController = require('../controllers/sermonSeriesController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { handleValidationErrors, validateSermonSeries } = require('../middleware/validators');
const { seriesImageUpload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', sermonSeriesController.listSeries);
router.post('/upload-image', seriesImageUpload.single('image'), sermonSeriesController.uploadSeriesImage);
router.post('/', validateSermonSeries, handleValidationErrors, sermonSeriesController.createSeries);
router.put('/:id', validateSermonSeries, handleValidationErrors, sermonSeriesController.updateSeries);
router.delete('/:id', sermonSeriesController.deleteSeries);

module.exports = router;
