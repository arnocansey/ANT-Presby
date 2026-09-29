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

// Build Prisma data from API input. Empty strings clear optional fields.
const toSeriesData = (input = {}) => {
  const data = {};

  if (input.title !== undefined) data.title = String(input.title).trim();
  if (input.description !== undefined) data.description = input.description || null;
  if (input.coverImageUrl !== undefined) data.coverImageUrl = input.coverImageUrl || null;
  if (input.startDate !== undefined) data.startDate = input.startDate ? new Date(input.startDate) : null;
  if (input.endDate !== undefined) data.endDate = input.endDate ? new Date(input.endDate) : null;

  return data;
};

const createSeries = async (input) => {
  const series = await prisma.sermonSeries.create({
    data: toSeriesData(input),
    include: withSermonCount,
  });

  return mapSeries(series);
};

const updateSeries = async (seriesId, input) => {
  const id = Number(seriesId);
  const updated = await prisma.sermonSeries.updateMany({
    where: { id },
    data: toSeriesData(input),
  });

  if (updated.count === 0) {
    return undefined;
  }

  return getSeriesById(id);
};

// Sermons keep existing: the sermons.series_id foreign key is ON DELETE SET NULL.
const deleteSeries = async (seriesId) => {
  const id = Number(seriesId);
  const deleted = await prisma.sermonSeries.deleteMany({ where: { id } });

  return deleted.count === 0 ? undefined : { id };
};

module.exports = {
  withSermonCount,
  mapSeries,
  getSeriesById,
  listSeries,
  getSeriesWithSermons,
  createSeries,
  updateSeries,
  deleteSeries,
};
