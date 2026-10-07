const express = require('express');
const liveController = require('../controllers/liveController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { handleValidationErrors, validateLiveStart } = require('../middleware/validators');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.post('/start', validateLiveStart, handleValidationErrors, liveController.startLive);
router.post('/end', liveController.endLive);

module.exports = router;
