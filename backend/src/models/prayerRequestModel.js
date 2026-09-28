const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

/**
 * Prayer Request Model - Database operations for prayer requests
 */

// Create prayer request
const createPrayerRequest = async (
  userId,
  title,
  description,
  category,
  isAnonymous = false,
  shareOnWall = false
) => {
  const prayerRequest = await prisma.prayerRequest.create({
    data: {
      userId: Number(userId),
      title,
      description,
      category,
      isAnonymous,
      shareOnWall,
      status: 'pending',
    },
  });

  return toSnakeCaseObject(prayerRequest);
};

// Get all prayer requests with pagination
const getAllPrayerRequests = async (offset, limit, filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  const prayerRequests = await prisma.prayerRequest.findMany({
    where,
    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      status: true,
      isAnonymous: true,
      shareOnWall: true,
      prayerCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return toSnakeCaseObject(prayerRequests);
};

// Count prayer requests
const countPrayerRequests = async (filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  return prisma.prayerRequest.count({ where });
};

// Get prayer request by ID
const getPrayerRequestById = async (requestId) => {
  const prayerRequest = await prisma.prayerRequest.findUnique({
    where: { id: Number(requestId) },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!prayerRequest) {
    return undefined;
  }

  const mapped = toSnakeCaseObject(prayerRequest);
  mapped.requester_name = prayerRequest.isAnonymous
    ? 'Anonymous'
    : `${prayerRequest.user?.firstName || ''} ${prayerRequest.user?.lastName || ''}`.trim();
  delete mapped.user;
  return mapped;
};

// Get user's prayer requests
const getUserPrayerRequests = async (userId, offset = 0, limit = 10) => {
  const prayerRequests = await prisma.prayerRequest.findMany({
    where: { userId: Number(userId) },
    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
  });

  return toSnakeCaseObject(prayerRequests);
};

// Update prayer request status
const updatePrayerRequestStatus = async (requestId, status, approvedBy = null) => {
  const id = Number(requestId);
  const updated = await prisma.prayerRequest.updateMany({
    where: { id },
    data: {
      status,
      approvedBy: approvedBy ? Number(approvedBy) : null,
    },
  });

  if (updated.count === 0) {
    return undefined;
  }

  const prayerRequest = await prisma.prayerRequest.findUnique({
    where: { id },
  });

  return toSnakeCaseObject(prayerRequest);
};

const buildPrayerRequestUpdateData = (updates) => {
  const data = {};

  if (updates.title !== undefined) data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.category !== undefined) data.category = updates.category;
  if (updates.status !== undefined) data.status = updates.status;
  if (updates.isAnonymous !== undefined) data.isAnonymous = updates.isAnonymous;
  if (updates.shareOnWall !== undefined) data.shareOnWall = updates.shareOnWall;
  if (updates.approvedBy !== undefined) {
    data.approvedBy = updates.approvedBy === null ? null : Number(updates.approvedBy);
  }

  return data;
};

// Update prayer request
const updatePrayerRequest = async (requestId, updates) => {
  const id = Number(requestId);
  const data = buildPrayerRequestUpdateData(updates);

  if (Object.keys(data).length === 0) {
    return getPrayerRequestById(id);
  }

  const updated = await prisma.prayerRequest.updateMany({
    where: { id },
    data,
  });

  if (updated.count === 0) {
    return undefined;
  }

  const prayerRequest = await prisma.prayerRequest.findUnique({
    where: { id },
  });

  return toSnakeCaseObject(prayerRequest);
};

// Delete prayer request
const deletePrayerRequest = async (requestId) => {
  const id = Number(requestId);
  const deleted = await prisma.prayerRequest.deleteMany({
    where: { id },
  });

  if (deleted.count === 0) {
    return undefined;
  }

  return { id };
};

// Get pending prayer requests
const getPendingPrayerRequests = async (limit = 20) => {
  const prayerRequests = await prisma.prayerRequest.findMany({
    where: { status: 'pending' },
    take: Number(limit),
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      createdAt: true,
    },
  });

  return toSnakeCaseObject(prayerRequests);
};

// Get prayer statistics
const getPrayerStatistics = async () => {
  const [totalRequests, pendingCount, approvedCount, answeredCount] = await Promise.all([
    prisma.prayerRequest.count(),
    prisma.prayerRequest.count({ where: { status: 'pending' } }),
    prisma.prayerRequest.count({ where: { status: 'approved' } }),
    prisma.prayerRequest.count({ where: { status: 'answered' } }),
  ]);

  return {
    total_requests: totalRequests,
    pending_count: pendingCount,
    approved_count: approvedCount,
    answered_count: answeredCount,
  };
};

// ---- Prayer wall ----

const WALL_STATUSES = ['approved', 'answered'];
const ANONYMOUS_NAME = 'A church member';

const buildWallWhere = (category) => ({
  shareOnWall: true,
  status: { in: WALL_STATUSES },
  ...(category ? { category } : {}),
});

// Builds the public wall shape field by field so nothing identifying can leak.
const toWallItem = (row) => {
  const fullName = `${row.user?.firstName || ''} ${row.user?.lastName || ''}`.trim();

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    requester_name: row.isAnonymous || !fullName ? ANONYMOUS_NAME : fullName,
    prayer_count: row.prayerCount,
    prayed_by_me: Array.isArray(row.intercessions) && row.intercessions.length > 0,
    created_at: row.createdAt,
  };
};

const getWallPrayerRequests = async ({ offset = 0, limit = 10, category, viewerUserId }) => {
  const rows = await prisma.prayerRequest.findMany({
    where: buildWallWhere(category),
    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      status: true,
      isAnonymous: true,
      prayerCount: true,
      createdAt: true,
      user: { select: { firstName: true, lastName: true } },
      intercessions: {
        where: { userId: Number(viewerUserId) },
        select: { id: true },
      },
    },
  });

  return rows.map(toWallItem);
};

const countWallPrayerRequests = async ({ category } = {}) =>
  prisma.prayerRequest.count({ where: buildWallWhere(category) });

// Records one prayer per member per wall request. Safe under double taps and races:
// the unique (prayer_request_id, user_id) constraint makes the insert a no-op for repeats,
// and the counter only moves when a row was actually inserted.
const recordIntercession = async ({ prayerRequestId, userId }) => {
  const id = Number(prayerRequestId);
  const memberId = Number(userId);

  return prisma.$transaction(async (tx) => {
    const request = await tx.prayerRequest.findFirst({
      where: { id, shareOnWall: true, status: { in: WALL_STATUSES } },
      select: { id: true, userId: true, title: true },
    });

    if (!request) {
      return null;
    }

    const inserted = await tx.prayerIntercession.createMany({
      data: [{ prayerRequestId: id, userId: memberId }],
      skipDuplicates: true,
    });

    if (inserted.count === 0) {
      const current = await tx.prayerRequest.findUnique({
        where: { id },
        select: { prayerCount: true },
      });
      return { request, prayerCount: current.prayerCount, created: false };
    }

    const updated = await tx.prayerRequest.update({
      where: { id },
      data: { prayerCount: { increment: 1 } },
      select: { prayerCount: true },
    });

    return { request, prayerCount: updated.prayerCount, created: true };
  });
};

module.exports = {
  WALL_STATUSES,
  toWallItem,
  getWallPrayerRequests,
  countWallPrayerRequests,
  recordIntercession,
  createPrayerRequest,
  getAllPrayerRequests,
  countPrayerRequests,
  getPrayerRequestById,
  getUserPrayerRequests,
  updatePrayerRequestStatus,
  updatePrayerRequest,
  deletePrayerRequest,
  getPendingPrayerRequests,
  getPrayerStatistics,
};
