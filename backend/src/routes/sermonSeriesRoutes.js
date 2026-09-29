const express = require('express');
const sermonSeriesController = require('../controllers/sermonSeriesController');

const router = express.Router();

// Public sermon series
router.get('/', sermonSeriesController.listSeries);
router.get('/:id', sermonSeriesController.getSeries);

module.exports = router;
