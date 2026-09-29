const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');
const { mapSermon, sermonInclude } = require('./sermonModel');

/**
 * Sermon Series Model - Database operations for sermon series
 */

const withSermonCount = { _count: { select: { sermons: true } } };

// Snake-case a series row and replace Prisma's _count with sermon_count.
const mapSeries = (row) => {
  // eslint-disable-next-line no-unused-vars
  const { _count: count, sermons, ...rest } = row;
  const mapped = toSnakeCaseObject(rest);
  mapped.sermon_count = count?.sermons ?? 0;
  return mapped;
};

const getSeriesById = async (seriesId) => {
  const series = await prisma.sermonSeries.findUnique({
    where: { id: Number(seriesId) },
    include: withSermonCount,
  });

  return series ? mapSeries(series) : undefined;
};

// Newest series first; series without a start date go last.
const listSeries = async () => {
  const rows = await prisma.sermonSeries.findMany({
    orderBy: [{ startDate: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    include: withSermonCount,
  });

  return rows.map(mapSeries);
};

// A series and its sermons, oldest first (the order they were preached).
const getSeriesWithSermons = async (seriesId) => {
  const series = await prisma.sermonSeries.findUnique({
    where: { id: Number(seriesId) },
    include: {
      ...withSermonCount,
      sermons: { orderBy: { sermonDate: 'asc' }, include: sermonInclude },
    },
  });

  if (!series) {
    return undefined;
  }

  return { ...mapSeries(series), sermons: series.sermons.map(mapSermon) };
};

module.exports = {
  withSermonCount,
  mapSeries,
  getSeriesById,
  listSeries,
  getSeriesWithSermons,
};
