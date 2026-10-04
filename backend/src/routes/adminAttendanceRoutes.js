const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { handleValidationErrors, validateCheckIn } = require('../middleware/validators');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/summary', attendanceController.getSummary);
router.get('/events/:eventId', attendanceController.getEventAttendance);
router.post('/events/:eventId/check-in', validateCheckIn, handleValidationErrors, attendanceController.checkIn);
router.delete('/records/:id', attendanceController.removeCheckIn);

module.exports = router;
