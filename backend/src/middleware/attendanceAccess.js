const userModel = require('../models/userModel');
const { apiResponse } = require('../utils/helpers');

// Admins, and members whose "Can take attendance" switch is on. The switch is read from the
// database on every request (not the token), so turning it off takes effect immediately.
const requireAttendanceStaff = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (req.user.role === 'admin') {
      return next();
    }

    const access = await userModel.getAttendanceAccess(req.user.userId);
    if (access && access.is_active && access.can_take_attendance) {
      return next();
    }

    return res.status(403).json(apiResponse(false, null, 'Attendance access required'));
  } catch (error) {
    return next(error);
  }
};

module.exports = { requireAttendanceStaff };
