const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

/**
 * Sermon Model - Database operations for sermons
 */

// Every sermon read includes its ministry and series names.
const sermonInclude = {
  ministry: { select: { name: true } },
  series: { select: { id: true, title: true } },
};

const mapSermon = (row) => {
  const { ministry, series, ...rest } = row;
  const mapped = toSnakeCaseObject(rest);
  mapped.ministry_name = ministry ? ministry.name : null;
  mapped.series_title = series ? series.title : null;
  return mapped;
};

const buildSermonWhere = (filters = {}) => {
  const where = {};

  if (filters.ministryId) {
    where.ministryId = Number(filters.ministryId);
  }

  if (filters.seriesId) {
    where.seriesId = Number(filters.seriesId);
  }

  if (filters.speaker) {
    where.speaker = {
      contains: filters.speaker,
      mode: 'insensitive',
    };
  }

  return where;
};

// Create sermon
const createSermon = async (
  title,
  speaker,
  description,
  videoUrl,
  sermonDate,
  ministryId,
  seriesId = null
) => {
  const sermon = await prisma.sermon.create({
    data: {
      title,
      speaker,
      description,
      videoUrl,
      sermonDate: new Date(sermonDate),
      ministryId: ministryId ? Number(ministryId) : null,
      seriesId: seriesId ? Number(seriesId) : null,
    },
    include: sermonInclude,
  });

  return mapSermon(sermon);
};

// Get all sermons with pagination
const getAllSermons = async (offset, limit, filters = {}) => {
  const sermons = await prisma.sermon.findMany({
    where: buildSermonWhere(filters),
    skip: Number(offset),
    take: Number(limit),
    orderBy: { sermonDate: 'desc' },
    include: sermonInclude,
  });

  return sermons.map(mapSermon);
};

// Count sermons
const countSermons = async (filters = {}) => prisma.sermon.count({ where: buildSermonWhere(filters) });

// Get sermon by ID
const getSermonById = async (sermonId) => {
  const sermon = await prisma.sermon.findUnique({
    where: { id: Number(sermonId) },
    include: sermonInclude,
  });

  return sermon ? mapSermon(sermon) : undefined;
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
  if (updates.seriesId !== undefined) {
    data.seriesId = updates.seriesId === null ? null : Number(updates.seriesId);
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
    include: sermonInclude,
  });

  return mapSermon(sermon);
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
    include: sermonInclude,
  });

  return sermons.map(mapSermon);
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
    include: sermonInclude,
  });

  return sermons.map(mapSermon);
};

module.exports = {
  sermonInclude,
  mapSermon,
  createSermon,
  getAllSermons,
  countSermons,
  getSermonById,
  updateSermon,
  deleteSermon,
  getRecentSermons,
  searchSermons,
};
