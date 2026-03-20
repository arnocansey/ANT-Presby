const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

/**
 * Sermon Model - Database operations for sermons
 */

// Create sermon
const createSermon = async (
  title,
  speaker,
  description,
  videoUrl,
  sermonDate,
  ministryId
) => {
  const sermon = await prisma.sermon.create({
    data: {
      title,
      speaker,
      description,
      videoUrl,
      sermonDate: new Date(sermonDate),
      ministryId: ministryId ? Number(ministryId) : null,
    },
  });

  return toSnakeCaseObject(sermon);
};

// Get all sermons with pagination
const getAllSermons = async (offset, limit, filters = {}) => {
  const where = {};

  if (filters.ministryId) {
    where.ministryId = Number(filters.ministryId);
  }

  if (filters.speaker) {
    where.speaker = {
      contains: filters.speaker,
      mode: 'insensitive',
    };
  }

  const sermons = await prisma.sermon.findMany({
    where,
    skip: Number(offset),
    take: Number(limit),
    orderBy: { sermonDate: 'desc' },
    include: {
      ministry: {
        select: { name: true },
      },
    },
  });

  return sermons.map((item) => {
    const mapped = toSnakeCaseObject(item);
    mapped.ministry_name = item.ministry ? item.ministry.name : null;
    delete mapped.ministry;
    return mapped;
  });
};

// Count sermons
const countSermons = async (filters = {}) => {
  const where = {};

  if (filters.ministryId) {
    where.ministryId = Number(filters.ministryId);
  }

  if (filters.speaker) {
    where.speaker = {
      contains: filters.speaker,
      mode: 'insensitive',
    };
  }

  return prisma.sermon.count({ where });
};

// Get sermon by ID
const getSermonById = async (sermonId) => {
  const sermon = await prisma.sermon.findUnique({
    where: { id: Number(sermonId) },
    include: {
      ministry: {
        select: { name: true },
      },
    },
  });

  if (!sermon) {
    return undefined;
  }

  const mapped = toSnakeCaseObject(sermon);
  mapped.ministry_name = sermon.ministry ? sermon.ministry.name : null;
  delete mapped.ministry;
  return mapped;
};

const buildSermonUpdateData = (updates) => {
  const data = {};

  if (updates.title !== undefined) data.title = updates.title;
  if (updates.speaker !== undefined) data.speaker = updates.speaker;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.videoUrl !== undefined) data.videoUrl = updates.videoUrl;
  if (updates.sermonDate !== undefined) data.sermonDate = new Date(updates.sermonDate);
  if (updates.ministryId !== undefined) {
    data.ministryId = updates.ministryId === null ? null : Number(updates.ministryId);
  }

  return data;
};

// Update sermon
const updateSermon = async (sermonId, updates) => {
  const id = Number(sermonId);
  const data = buildSermonUpdateData(updates);

  if (Object.keys(data).length === 0) {
    return getSermonById(id);
  }

  const updated = await prisma.sermon.updateMany({
    where: { id },
    data,
  });

  if (updated.count === 0) {
    return undefined;
  }

  const sermon = await prisma.sermon.findUnique({
    where: { id },
  });

  return toSnakeCaseObject(sermon);
};

// Delete sermon
const deleteSermon = async (sermonId) => {
  const id = Number(sermonId);
  const deleted = await prisma.sermon.deleteMany({
    where: { id },
  });

  if (deleted.count === 0) {
    return undefined;
  }

  return { id };
};

// Get recent sermons
const getRecentSermons = async (limit = 5) => {
  const sermons = await prisma.sermon.findMany({
    take: Number(limit),
    orderBy: { sermonDate: 'desc' },
    include: {
      ministry: {
        select: { name: true },
      },
    },
  });

  return sermons.map((item) => {
    const mapped = toSnakeCaseObject(item);
    mapped.ministry_name = item.ministry ? item.ministry.name : null;
    delete mapped.ministry;
    return mapped;
  });
};

// Search sermons
const searchSermons = async (searchTerm, offset = 0, limit = 10) => {
  const sermons = await prisma.sermon.findMany({
    where: {
      OR: [
        {
          title: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          speaker: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ],
    },
    skip: Number(offset),
    take: Number(limit),
    orderBy: { sermonDate: 'desc' },
    include: {
      ministry: {
        select: { name: true },
      },
    },
  });

  return sermons.map((item) => {
    const mapped = toSnakeCaseObject(item);
    mapped.ministry_name = item.ministry ? item.ministry.name : null;
    delete mapped.ministry;
    return mapped;
  });
};

module.exports = {
  createSermon,
  getAllSermons,
  countSermons,
  getSermonById,
  updateSermon,
  deleteSermon,
  getRecentSermons,
  searchSermons,
};
