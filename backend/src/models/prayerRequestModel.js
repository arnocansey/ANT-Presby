const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

/**
 * Prayer Request Model - Database operations for prayer requests
 */

// Create prayer request
const createPrayerRequest = async (userId, title, description, category, isAnonymous = false) => {
  const prayerRequest = await prisma.prayerRequest.create({
    data: {
      userId: Number(userId),
      title,
      description,
      category,
      isAnonymous,
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

module.exports = {
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
