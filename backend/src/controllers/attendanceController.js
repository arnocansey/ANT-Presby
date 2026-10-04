const { apiResponse, parseId } = require('../utils/helpers');
const attendanceModel = require('../models/attendanceModel');
const userModel = require('../models/userModel');
const auditLogModel = require('../models/auditLogModel');

/**
 * Attendance Controller (admin only)
 */

const SUMMARY_DEFAULT_LIMIT = 10;
const SUMMARY_MAX_LIMIT = 50;

const notFound = (res, message) => res.status(404).json(apiResponse(false, null, message));

const audit = (req, action, entityId, summary, metadata = {}) =>
  auditLogModel.createAuditLog({
    actorUserId: req.user.userId,
    entityType: 'attendance',
    entityId,
    action,
    summary,
    metadata,
  });

// The check-in sheet for one event
const getEventAttendance = async (req, res, next) => {
  try {
    const eventId = parseId(req.params.eventId);
    const attendance = eventId ? await attendanceModel.getEventAttendance(eventId) : undefined;

    if (!attendance) {
      return notFound(res, 'Event not found');
    }

    res.json(apiResponse(true, attendance, 'Attendance retrieved'));
  } catch (error) {
    next(error);
  }
};

// Check in a member ({ userId }) or a walk-in guest ({ guestName })
const checkIn = async (req, res, next) => {
  try {
    const eventId = parseId(req.params.eventId);
    const event = eventId ? await attendanceModel.findEventForCheckIn(eventId) : null;

    if (!event) {
      return notFound(res, 'Event not found');
    }

    if (event.status === 'cancelled') {
      return res.status(409).json(apiResponse(false, null, 'This event was cancelled'));
    }

    const { userId, guestName } = req.body;
    const checkedInBy = req.user.userId;

    if (userId !== undefined && userId !== null) {
      const member = await userModel.findUserById(userId);
      if (!member) {
        return notFound(res, 'Member not found');
      }

      const { record, created } = await attendanceModel.checkInMember({
        eventId,
        userId: Number(userId),
        checkedInBy,
      });

      if (created) {
        await audit(req, 'check_in', record.id, `Checked in member #${userId} to event #${eventId}`, { eventId });
      }

      return res
        .status(created ? 201 : 200)
        .json(apiResponse(true, record, created ? 'Checked in' : 'Already checked in'));
    }

    const record = await attendanceModel.checkInGuest({ eventId, guestName, checkedInBy });
    await audit(req, 'check_in', record.id, `Checked in guest "${guestName}" to event #${eventId}`, { eventId });
    res.status(201).json(apiResponse(true, record, 'Guest checked in'));
  } catch (error) {
    next(error);
  }
};

// Undo a check-in
const removeCheckIn = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const removed = id ? await attendanceModel.deleteRecord(id) : undefined;

    if (!removed) {
      return notFound(res, 'Check-in not found');
    }

    await audit(req, 'undo_check_in', removed.id, `Undid check-in #${removed.id} for event #${removed.event_id}`, {
      eventId: removed.event_id,
    });
    res.json(apiResponse(true, null, 'Check-in removed'));
  } catch (error) {
    next(error);
  }
};

// Headcounts for recent events (trend)
const getSummary = async (req, res, next) => {
  try {
    const parsed = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, SUMMARY_MAX_LIMIT) : SUMMARY_DEFAULT_LIMIT;
    const rows = await attendanceModel.getAttendanceSummary(limit);

    res.json(apiResponse(true, rows, 'Attendance summary retrieved'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEventAttendance,
  checkIn,
  removeCheckIn,
  getSummary,
};
