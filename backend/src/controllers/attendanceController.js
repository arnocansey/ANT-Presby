const { apiResponse, parseId } = require('../utils/helpers');
const attendanceModel = require('../models/attendanceModel');
const userModel = require('../models/userModel');
const auditLogModel = require('../models/auditLogModel');
const { parseScannedCode } = require('../utils/checkInCode');

/**
 * Attendance Controller (staff: admins and ushers; reports and exports admin only)
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

// Events to choose from for check-in: two weeks back (late entries) to two weeks ahead.
const CHECK_IN_WINDOW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const listCheckInEvents = async (req, res, next) => {
  try {
    const now = Date.now();
    const to = new Date(now + CHECK_IN_WINDOW_DAYS * DAY_MS);
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const events =
      q.length >= 2
        ? await attendanceModel.searchCheckInEvents({ q, to })
        : await attendanceModel.listCheckInEvents({ from: new Date(now - CHECK_IN_WINDOW_DAYS * DAY_MS), to });

    res.json(apiResponse(true, events, 'Check-in events retrieved'));
  } catch (error) {
    next(error);
  }
};

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

// The event must exist and not be cancelled before anyone is checked in or counted.
const loadOpenEvent = async (req, res) => {
  const eventId = parseId(req.params.eventId);
  const event = eventId ? await attendanceModel.findEventForCheckIn(eventId) : null;
  if (!event) {
    notFound(res, 'Event not found');
    return null;
  }
  if (event.status === 'cancelled') {
    res.status(409).json(apiResponse(false, null, 'This event was cancelled'));
    return null;
  }
  return eventId;
};

const respondMemberCheckIn = async (req, res, { eventId, member, method }) => {
  const { record, created } = await attendanceModel.checkInMember({ eventId, userId: member.id, checkedInBy: req.user.userId });
  if (created) {
    const byCard = method === 'code';
    await audit(
      req,
      'check_in',
      record.id,
      `Checked in member #${member.id} to event #${eventId}${byCard ? ' by card' : ''}`,
      byCard ? { eventId, method } : { eventId }
    );
  }
  const data = { ...record, member: { first_name: member.first_name, last_name: member.last_name } };
  return res.status(created ? 201 : 200).json(apiResponse(true, data, created ? 'Checked in' : 'Already checked in'));
};

// Check in a member ({ userId }), a scanned card ({ code }) or a walk-in guest ({ guestName })
const checkIn = async (req, res, next) => {
  try {
    const eventId = await loadOpenEvent(req, res);
    if (!eventId) return undefined;

    const { userId, guestName, code } = req.body;

    if (code !== undefined && code !== null) {
      const parsed = parseScannedCode(code);
      const member = parsed ? await userModel.findMemberByCheckInCode(parsed) : undefined;
      if (!member) return notFound(res, 'Card not recognised');
      if (!member.is_active) {
        return res.status(403).json(apiResponse(false, null, "This member's account is inactive"));
      }
      return respondMemberCheckIn(req, res, { eventId, member, method: 'code' });
    }

    if (userId !== undefined && userId !== null) {
      const member = await userModel.findUserById(userId);
      if (!member) return notFound(res, 'Member not found');
      return respondMemberCheckIn(req, res, { eventId, member: { ...member, id: Number(userId) }, method: 'id' });
    }

    const record = await attendanceModel.checkInGuest({ eventId, guestName, checkedInBy: req.user.userId });
    await audit(req, 'check_in', record.id, `Checked in guest "${guestName}" to event #${eventId}`, { eventId });
    return res.status(201).json(apiResponse(true, record, 'Guest checked in'));
  } catch (error) {
    return next(error);
  }
};

const adjustHeadcount = async (req, res, next) => {
  try {
    const eventId = await loadOpenEvent(req, res);
    if (!eventId) return undefined;

    const adults = req.body.adults ?? 0;
    const children = req.body.children ?? 0;
    const counts = await attendanceModel.adjustHeadcount({ eventId, adults, children, updatedBy: req.user.userId });
    await audit(req, 'headcount_change', eventId, `Headcount for event #${eventId}: adults ${counts.adults}, children ${counts.children}`, {
      eventId,
      adults,
      children,
    });
    return res.json(apiResponse(true, counts, 'Headcount updated'));
  } catch (error) {
    return next(error);
  }
};

const MEMBER_SEARCH_LIMIT = 20;

// Name or email lookup for the check-in sheet
const searchMembers = async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const members = q.length >= 2 ? await userModel.searchActiveMembers(q, MEMBER_SEARCH_LIMIT) : [];
    res.json(apiResponse(true, members, 'Members retrieved'));
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
  listCheckInEvents,
  getEventAttendance,
  checkIn,
  adjustHeadcount,
  searchMembers,
  removeCheckIn,
  getSummary,
};
