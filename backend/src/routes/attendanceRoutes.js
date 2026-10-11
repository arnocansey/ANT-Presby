const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireAttendanceStaff } = require('../middleware/attendanceAccess');
const { handleValidationErrors, validateCheckIn, validateHeadcount } = require('../middleware/validators');

// Check-in for admins and ushers. Reports and exports stay under /api/admin/attendance.
const router = express.Router();

router.use(verifyToken, requireAttendanceStaff);

router.get('/events', attendanceController.listCheckInEvents);
router.get('/events/:eventId', attendanceController.getEventAttendance);
router.post('/events/:eventId/check-in', validateCheckIn, handleValidationErrors, attendanceController.checkIn);
router.post('/events/:eventId/headcount', validateHeadcount, handleValidationErrors, attendanceController.adjustHeadcount);
router.delete('/records/:id', attendanceController.removeCheckIn);
router.get('/members', attendanceController.searchMembers);

module.exports = router;
