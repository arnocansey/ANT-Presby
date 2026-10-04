const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

/**
 * Attendance Model - check-ins for events (members and walk-in guests)
 */

const personSelect = { id: true, firstName: true, lastName: true, email: true };

const toPerson = (user) => ({
  user_id: user.id,
  first_name: user.firstName,
  last_name: user.lastName,
  email: user.email,
});

// Pure: turns an event with its registrations and attendance into the check-in sheet.
const buildAttendanceSummary = (event) => {
  const memberRecords = new Map();
  const guests = [];

  event.attendance.forEach((record) => {
    if (record.userId && record.user) {
      memberRecords.set(record.userId, record);
    } else if (record.guestName) {
      guests.push({ record_id: record.id, guest_name: record.guestName, checked_in_at: record.checkedInAt });
    }
  });

  const registeredIds = new Set();
  const registered = event.registrations.map((registration) => {
    registeredIds.add(registration.userId);
    const record = memberRecords.get(registration.userId);
    return {
      ...toPerson(registration.user),
      checked_in: Boolean(record),
      record_id: record ? record.id : null,
      checked_in_at: record ? record.checkedInAt : null,
    };
  });

  const walkInMembers = [...memberRecords.values()]
    .filter((record) => !registeredIds.has(record.userId))
    .map((record) => ({ ...toPerson(record.user), record_id: record.id, checked_in_at: record.checkedInAt }));

  return {
    event: {
      id: event.id,
      name: event.name,
      event_date: event.eventDate,
      location: event.location,
      status: event.status,
    },
    registered,
    walk_in_members: walkInMembers,
    guests,
    totals: {
      registered: registered.length,
      checked_in_members: memberRecords.size,
      guests: guests.length,
      total: memberRecords.size + guests.length,
    },
  };
};

const getEventAttendance = async (eventId) => {
  const event = await prisma.event.findUnique({
    where: { id: Number(eventId) },
    select: {
      id: true,
      name: true,
      eventDate: true,
      location: true,
      status: true,
      registrations: {
        orderBy: { registeredAt: 'asc' },
        select: { userId: true, user: { select: personSelect } },
      },
      attendance: {
        orderBy: { checkedInAt: 'asc' },
        select: { id: true, userId: true, guestName: true, checkedInAt: true, user: { select: personSelect } },
      },
    },
  });

  return event ? buildAttendanceSummary(event) : undefined;
};

const findEventForCheckIn = (eventId) =>
  prisma.event.findUnique({
    where: { id: Number(eventId) },
    select: { id: true, status: true },
  });

const findMemberRecord = (eventId, userId) =>
  prisma.attendanceRecord.findFirst({ where: { eventId, userId } });

// Idempotent: a member already checked in gets their existing record back. The partial unique
// index makes a concurrent duplicate fail with P2002, in which case the winner's record is returned.
const checkInMember = async ({ eventId, userId, checkedInBy }) => {
  const existing = await findMemberRecord(eventId, userId);
  if (existing) {
    return { record: toSnakeCaseObject(existing), created: false };
  }

  try {
    const record = await prisma.attendanceRecord.create({ data: { eventId, userId, checkedInBy } });
    return { record: toSnakeCaseObject(record), created: true };
  } catch (error) {
    if (error?.code === 'P2002') {
      const winner = await findMemberRecord(eventId, userId);
      if (winner) {
        return { record: toSnakeCaseObject(winner), created: false };
      }
    }
    throw error;
  }
};

const checkInGuest = async ({ eventId, guestName, checkedInBy }) => {
  const record = await prisma.attendanceRecord.create({ data: { eventId, guestName, checkedInBy } });
  return toSnakeCaseObject(record);
};

const deleteRecord = async (recordId) => {
  const id = Number(recordId);
  const record = await prisma.attendanceRecord.findUnique({ where: { id }, select: { id: true, eventId: true } });

  if (!record) {
    return undefined;
  }

  await prisma.attendanceRecord.deleteMany({ where: { id } });
  return { id: record.id, event_id: record.eventId };
};

const toSummaryRow = (event) => {
  const members = event.attendance.filter((record) => record.userId !== null).length;
  return {
    event_id: event.id,
    name: event.name,
    event_date: event.eventDate,
    registered: event._count.registrations,
    members,
    guests: event.attendance.length - members,
    total: event.attendance.length,
  };
};

// Headcounts for the most recent events that have already started (newest first).
const getAttendanceSummary = async (limit = 10) => {
  const events = await prisma.event.findMany({
    where: { eventDate: { lte: new Date() } },
    orderBy: { eventDate: 'desc' },
    take: Number(limit),
    select: {
      id: true,
      name: true,
      eventDate: true,
      _count: { select: { registrations: true } },
      attendance: { select: { userId: true } },
    },
  });

  return events.map(toSummaryRow);
};

module.exports = {
  buildAttendanceSummary,
  toSummaryRow,
  getEventAttendance,
  findEventForCheckIn,
  checkInMember,
  checkInGuest,
  deleteRecord,
  getAttendanceSummary,
};
