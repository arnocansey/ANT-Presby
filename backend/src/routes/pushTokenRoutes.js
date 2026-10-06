const express = require('express');
const pushTokenController = require('../controllers/pushTokenController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { handleValidationErrors, validatePushToken } = require('../middleware/validators');

const router = express.Router();

router.post('/', isAuthenticated, validatePushToken, handleValidationErrors, pushTokenController.registerToken);
router.delete('/', isAuthenticated, pushTokenController.removeToken);

module.exports = router;
