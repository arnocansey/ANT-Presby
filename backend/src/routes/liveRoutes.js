const express = require('express');
const liveController = require('../controllers/liveController');

const router = express.Router();

router.get('/', liveController.getLive);

module.exports = router;
