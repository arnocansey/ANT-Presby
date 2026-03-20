const express = require('express');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

module.exports = router;
