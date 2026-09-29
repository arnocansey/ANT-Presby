const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

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

module.exports = {
  withSermonCount,
  mapSeries,
  getSeriesById,
};
