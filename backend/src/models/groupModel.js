const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

/**
 * Small Group Model - groups, memberships, join requests and leaders
 */

const nameSelect = { id: true, firstName: true, lastName: true };

// Active leaders always; plus the viewer's own membership (any status) so my_status/my_role can be reported.
const groupInclude = (viewerUserId) => ({
  ministry: { select: { name: true } },
  memberships: {
    where: {
      OR: [
        { status: 'active', role: 'leader' },
        ...(viewerUserId ? [{ userId: Number(viewerUserId) }] : []),
      ],
    },
    select: { userId: true, role: true, status: true, user: { select: nameSelect } },
  },
  _count: { select: { memberships: { where: { status: 'active' } } } },
});

const mapGroupSummary = (row, viewerUserId = null) => {
  // eslint-disable-next-line no-unused-vars
  const { ministry, memberships = [], _count: count, ...rest } = row;
  const viewerId = viewerUserId ? Number(viewerUserId) : null;
  const mine = viewerId ? memberships.find((membership) => membership.userId === viewerId) : undefined;

  return {
    ...toSnakeCaseObject(rest),
    ministry_name: ministry ? ministry.name : null,
    member_count: count?.memberships ?? 0,
    leaders: memberships
      .filter((membership) => membership.status === 'active' && membership.role === 'leader')
      .map((membership) => ({
        user_id: membership.userId,
        first_name: membership.user.firstName,
        last_name: membership.user.lastName,
      })),
    my_status: mine ? mine.status : null,
    my_role: mine ? mine.role : null,
  };
};

// Member list entries carry names and role only, never contact details.
const toMemberItem = (membership) => ({
  user_id: membership.userId,
  first_name: membership.user.firstName,
  last_name: membership.user.lastName,
  role: membership.role,
});

const listActiveGroups = async (viewerUserId = null) => {
  const rows = await prisma.smallGroup.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: groupInclude(viewerUserId),
  });
  return rows.map((row) => mapGroupSummary(row, viewerUserId));
};

const listAllGroups = async () => {
  const rows = await prisma.smallGroup.findMany({ orderBy: { name: 'asc' }, include: groupInclude(null) });
  return rows.map((row) => mapGroupSummary(row, null));
};

const listMyGroups = async (userId) => {
  const rows = await prisma.smallGroup.findMany({
    where: { isActive: true, memberships: { some: { userId: Number(userId) } } },
    orderBy: { name: 'asc' },
    include: groupInclude(userId),
  });
  return rows.map((row) => mapGroupSummary(row, userId));
};

const getGroupById = async (groupId) => {
  const row = await prisma.smallGroup.findUnique({ where: { id: Number(groupId) }, include: groupInclude(null) });
  return row ? mapGroupSummary(row, null) : undefined;
};

const getGroupDetail = async (groupId, viewerUserId = null) => {
  const id = Number(groupId);
  const row = await prisma.smallGroup.findUnique({ where: { id }, include: groupInclude(viewerUserId) });

  if (!row) {
    return undefined;
  }

  const members = await prisma.groupMembership.findMany({
    where: { groupId: id, status: 'active' },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    select: { userId: true, role: true, user: { select: nameSelect } },
  });

  return { ...mapGroupSummary(row, viewerUserId), members: members.map(toMemberItem) };
};

const getMembership = (groupId, userId) =>
  prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId: Number(groupId), userId: Number(userId) } },
    select: { userId: true, role: true, status: true },
  });

const createJoinRequest = (groupId, userId) =>
  prisma.groupMembership.create({
    data: { groupId: Number(groupId), userId: Number(userId), role: 'member', status: 'pending' },
  });

const approveRequest = async (groupId, userId) => {
  const result = await prisma.groupMembership.updateMany({
    where: { groupId: Number(groupId), userId: Number(userId), status: 'pending' },
    data: { status: 'active' },
  });
  return result.count;
};

const declineRequest = async (groupId, userId) => {
  const result = await prisma.groupMembership.deleteMany({
    where: { groupId: Number(groupId), userId: Number(userId), status: 'pending' },
  });
  return result.count;
};

const deleteMembership = async (groupId, userId) => {
  const result = await prisma.groupMembership.deleteMany({
    where: { groupId: Number(groupId), userId: Number(userId) },
  });
  return result.count;
};

const countActiveLeaders = (groupId) =>
  prisma.groupMembership.count({ where: { groupId: Number(groupId), role: 'leader', status: 'active' } });

const getLeaderIds = async (groupId) => {
  const leaders = await prisma.groupMembership.findMany({
    where: { groupId: Number(groupId), role: 'leader', status: 'active' },
    select: { userId: true },
  });
  return leaders.map((leader) => leader.userId);
};

const listPendingRequests = async (groupId) => {
  const requests = await prisma.groupMembership.findMany({
    where: { groupId: Number(groupId), status: 'pending' },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true, user: { select: { ...nameSelect, email: true } } },
  });

  return requests.map((request) => ({
    user_id: request.user.id,
    first_name: request.user.firstName,
    last_name: request.user.lastName,
    email: request.user.email,
    requested_at: request.createdAt,
  }));
};

// Build Prisma data from API input. Empty strings and null clear optional fields.
const toGroupData = (input = {}) => {
  const data = {};
  const optionalText = (value) => (value === undefined ? undefined : value ? String(value).trim() || null : null);

  if (input.name !== undefined) data.name = String(input.name).trim();
  ['description', 'meetingDay', 'meetingTime', 'location'].forEach((field) => {
    const value = optionalText(input[field]);
    if (value !== undefined) data[field] = value;
  });
  if (input.capacity !== undefined) {
    data.capacity = input.capacity === null || input.capacity === '' ? null : Number(input.capacity);
  }
  if (input.ministryId !== undefined) {
    data.ministryId = input.ministryId === null || input.ministryId === '' ? null : Number(input.ministryId);
  }
  if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);

  return data;
};

const createGroup = async (input) => {
  const group = await prisma.smallGroup.create({ data: toGroupData(input) });
  return getGroupById(group.id);
};

const updateGroup = async (groupId, input) => {
  const id = Number(groupId);
  const updated = await prisma.smallGroup.updateMany({ where: { id }, data: toGroupData(input) });
  return updated.count === 0 ? undefined : getGroupById(id);
};

const deactivateGroup = async (groupId) => {
  const result = await prisma.smallGroup.updateMany({ where: { id: Number(groupId) }, data: { isActive: false } });
  return result.count;
};

// Exactly the listed users become active leaders; previous leaders not listed become members.
const setLeaders = async (groupId, userIds) => {
  const id = Number(groupId);

  await prisma.$transaction(async (tx) => {
    await tx.groupMembership.updateMany({
      where: { groupId: id, role: 'leader', userId: { notIn: userIds } },
      data: { role: 'member' },
    });

    for (const userId of userIds) {
      await tx.groupMembership.upsert({
        where: { groupId_userId: { groupId: id, userId } },
        create: { groupId: id, userId, role: 'leader', status: 'active' },
        update: { role: 'leader', status: 'active' },
      });
    }
  });

  return getGroupById(id);
};

module.exports = {
  mapGroupSummary,
  toMemberItem,
  listActiveGroups,
  listAllGroups,
  listMyGroups,
  getGroupById,
  getGroupDetail,
  getMembership,
  createJoinRequest,
  approveRequest,
  declineRequest,
  deleteMembership,
  countActiveLeaders,
  getLeaderIds,
  listPendingRequests,
  createGroup,
  updateGroup,
  deactivateGroup,
  setLeaders,
};
