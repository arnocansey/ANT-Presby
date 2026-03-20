const express = require('express');
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', notificationController.getMyNotifications);
router.post('/read-all', notificationController.markAllNotificationsRead);
router.post('/:id/read', notificationController.markNotificationRead);

module.exports = router;
