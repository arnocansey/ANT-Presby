const express = require('express');
const newsController = require('../controllers/newsController');

const router = express.Router();

router.get('/', newsController.getPublishedNews);
router.get('/:id', newsController.getNewsById);

module.exports = router;
