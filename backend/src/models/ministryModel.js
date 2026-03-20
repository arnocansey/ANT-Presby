const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

/**
 * Ministry Model - Database operations for ministries
 */

// Create ministry
const createMinistry = async (name, description, leaderName = null) => {
  const ministry = await prisma.ministry.create({
    data: {
      name,
      description,
      leaderName,
    },
  });

  return toSnakeCaseObject(ministry);
};

// Get all ministries with pagination
const getAllMinistries = async (offset = 0, limit = 50) => {
  const ministries = await prisma.ministry.findMany({
    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { sermons: true },
      },
    },
  });

  return ministries.map((item) => {
    const mapped = toSnakeCaseObject(item);
    mapped.sermon_count = item._count.sermons;
    delete mapped._count;
    return mapped;
  });
};

// Count ministries
const countMinistries = async () => {
  return prisma.ministry.count();
};

// Get ministry by ID
const getMinistryById = async (ministryId) => {
  const ministry = await prisma.ministry.findUnique({
    where: { id: Number(ministryId) },
    include: {
      _count: {
        select: { sermons: true },
      },
    },
  });

  if (!ministry) {
    return undefined;
  }

  const mapped = toSnakeCaseObject(ministry);
  mapped.sermon_count = ministry._count.sermons;
  delete mapped._count;
  return mapped;
};

// Get ministry with sermons
const getMinistryWithSermons = async (ministryId, offset = 0, limit = 10) => {
  const ministry = await prisma.ministry.findUnique({
    where: { id: Number(ministryId) },
    include: {
      sermons: {
        orderBy: { sermonDate: 'desc' },
        skip: Number(offset),
        take: Number(limit),
      },
    },
  });

  return toSnakeCaseObject(ministry);
};

const buildMinistryUpdateData = (updates) => {
  const data = {};

  if (updates.name !== undefined) data.name = updates.name;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.leaderName !== undefined) data.leaderName = updates.leaderName;

  return data;
};

// Update ministry
const updateMinistry = async (ministryId, updates) => {
  const id = Number(ministryId);
  const data = buildMinistryUpdateData(updates);

  if (Object.keys(data).length === 0) {
    return getMinistryById(id);
  }

  const updated = await prisma.ministry.updateMany({
    where: { id },
    data,
  });

  if (updated.count === 0) {
    return undefined;
  }

  const ministry = await prisma.ministry.findUnique({
    where: { id },
  });

  return toSnakeCaseObject(ministry);
};

// Delete ministry
const deleteMinistry = async (ministryId) => {
  const id = Number(ministryId);
  const deleted = await prisma.ministry.deleteMany({
    where: { id },
  });

  if (deleted.count === 0) {
    return undefined;
  }

  return { id };
};

module.exports = {
  createMinistry,
  getAllMinistries,
  countMinistries,
  getMinistryById,
  getMinistryWithSermons,
  updateMinistry,
  deleteMinistry,
};
