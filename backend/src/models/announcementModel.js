const prisma = require('../config/prisma');

/**
 * Announcement Model - who receives an announcement, and the record of what was sent.
 */

const getGroupMemberIds = async (groupId) => {
  const rows = await prisma.groupMembership.findMany({
    where: { groupId: Number(groupId), status: 'active' },
    select: { userId: true },
  });
  return rows.map((row) => row.userId);
};

// Registered for the event, or checked in as a member; each person once.
const getEventAudienceIds = async (eventId) => {
  const id = Number(eventId);
  const [registrations, checkIns] = await Promise.all([
    prisma.eventRegistration.findMany({ where: { eventId: id }, select: { userId: true } }),
    prisma.attendanceRecord.findMany({ where: { eventId: id, userId: { not: null } }, select: { userId: true } }),
  ]);
  return [...new Set([...registrations, ...checkIns].map((row) => row.userId))];
};

const getLedGroupIds = async (userId) => {
  const rows = await prisma.groupMembership.findMany({
    where: { userId: Number(userId), role: 'leader', status: 'active' },
    select: { groupId: true },
  });
  return rows.map((row) => row.groupId);
};

const createAnnouncement = (data) => prisma.announcement.create({ data });

const setPushCount = (id, pushCount) => prisma.announcement.update({ where: { id: Number(id) }, data: { pushCount } });

const toAnnouncement = (row) => ({
  id: row.id,
  title: row.title,
  message: row.message,
  audience: row.audience,
  group_id: row.groupId,
  group_name: row.group ? row.group.name : null,
  event_id: row.eventId,
  event_name: row.event ? row.event.name : null,
  sender_name: row.sender ? `${row.sender.firstName || ''} ${row.sender.lastName || ''}`.trim() : null,
  recipient_count: row.recipientCount,
  push_count: row.pushCount,
  created_at: row.createdAt,
});

// Most recent 50; null = all (admin), otherwise only announcements to these groups.
const listSent = async (groupIds) => {
  const rows = await prisma.announcement.findMany({
    where: groupIds ? { audience: 'group', groupId: { in: groupIds } } : {},
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      group: { select: { name: true } },
      event: { select: { name: true } },
      sender: { select: { firstName: true, lastName: true } },
    },
  });
  return rows.map(toAnnouncement);
};

module.exports = {
  getGroupMemberIds,
  getEventAudienceIds,
  getLedGroupIds,
  createAnnouncement,
  setPushCount,
  toAnnouncement,
  listSent,
};
