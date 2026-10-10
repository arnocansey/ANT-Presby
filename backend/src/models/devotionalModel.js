const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');
const { dateOnly } = require('../utils/dates');

/**
 * Devotional Model - one devotional per day; members only ever see published, non-future ones.
 */

const toDevotional = (row) => {
  // eslint-disable-next-line no-unused-vars
  const { author, ...rest } = row;
  const mapped = toSnakeCaseObject(rest);
  mapped.publish_date = row.publishDate.toISOString().slice(0, 10);
  return mapped;
};

const visibleWhere = (today) => ({ status: 'published', publishDate: { lte: dateOnly(today) } });

const getTodayDevotional = async (today) => {
  const exact = await prisma.devotional.findFirst({ where: { status: 'published', publishDate: dateOnly(today) } });
  if (exact) {
    return { ...toDevotional(exact), is_today: true };
  }

  const latest = await prisma.devotional.findFirst({ where: visibleWhere(today), orderBy: { publishDate: 'desc' } });
  return latest ? { ...toDevotional(latest), is_today: false } : null;
};

const listPublished = async ({ offset = 0, limit = 10, today }) => {
  const rows = await prisma.devotional.findMany({
    where: visibleWhere(today),
    orderBy: { publishDate: 'desc' },
    skip: Number(offset),
    take: Number(limit),
  });
  return rows.map(toDevotional);
};

const countPublished = (today) => prisma.devotional.count({ where: visibleWhere(today) });

const getPublishedById = async (id, today) => {
  const row = await prisma.devotional.findFirst({ where: { id: Number(id), ...visibleWhere(today) } });
  return row ? toDevotional(row) : undefined;
};

const listAll = async () => {
  const rows = await prisma.devotional.findMany({ orderBy: { publishDate: 'desc' } });
  return rows.map(toDevotional);
};

const getById = async (id) => {
  const row = await prisma.devotional.findUnique({ where: { id: Number(id) } });
  return row ? toDevotional(row) : undefined;
};

const toData = (input = {}) => {
  const data = {};
  ['title', 'scriptureReference', 'scriptureText', 'body'].forEach((field) => {
    if (input[field] !== undefined) data[field] = String(input[field]).trim();
  });
  if (input.prayer !== undefined) data.prayer = input.prayer ? String(input.prayer).trim() || null : null;
  if (input.publishDate !== undefined) data.publishDate = dateOnly(input.publishDate);
  if (input.status !== undefined) data.status = input.status;
  return data;
};

const createDevotional = async (input, authorId) => {
  const row = await prisma.devotional.create({ data: { ...toData(input), authorId: authorId ? Number(authorId) : null } });
  return toDevotional(row);
};

const updateDevotional = async (id, input) => {
  const data = toData(input);
  // Moving an already-notified devotional to a new day lets it notify again on that day.
  if (data.publishDate) {
    await prisma.devotional.updateMany({
      where: { id: Number(id), NOT: { publishDate: data.publishDate } },
      data: { notifiedAt: null },
    });
  }
  const updated = await prisma.devotional.updateMany({ where: { id: Number(id) }, data });
  return updated.count === 0 ? undefined : getById(id);
};

const deleteDevotional = async (id) => {
  const result = await prisma.devotional.deleteMany({ where: { id: Number(id) } });
  return result.count;
};

const publish = async (id) => {
  const updated = await prisma.devotional.updateMany({ where: { id: Number(id) }, data: { status: 'published' } });
  return updated.count === 0 ? undefined : getById(id);
};

// Atomic claim: only the one caller whose update sets notified_at gets true, so a notification is sent once.
const claimNotification = async (id) => {
  const result = await prisma.devotional.updateMany({
    where: { id: Number(id), notifiedAt: null, status: 'published' },
    data: { notifiedAt: new Date() },
  });
  return result.count === 1;
};

module.exports = {
  toDevotional,
  getTodayDevotional,
  listPublished,
  countPublished,
  getPublishedById,
  listAll,
  getById,
  createDevotional,
  updateDevotional,
  deleteDevotional,
  publish,
  claimNotification,
};
