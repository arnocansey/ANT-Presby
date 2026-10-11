const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Admin-only attendance reports. Check-in itself lives under /api/attendance (admins and ushers).
const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/summary', attendanceController.getSummary);
router.get('/events/:eventId/export.csv', attendanceController.exportEvent);
router.get('/export.csv', attendanceController.exportRange);

module.exports = router;
