const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

const mapNewsWithAuthor = (item) => {
  const mapped = toSnakeCaseObject(item);
  mapped.first_name = item.creator ? item.creator.firstName : null;
  mapped.last_name = item.creator ? item.creator.lastName : null;
  delete mapped.creator;
  return mapped;
};

const normalizeSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const createUniqueSlug = async (title, excludeId = null) => {
  const baseSlug = normalizeSlug(title) || 'post';
  let slug = baseSlug;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    const existing = await prisma.newsPost.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: Number(excludeId) } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      isUnique = true;
      continue;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
};

const resolveWorkflowFields = (payload, existing = null) => {
  const requestedStatus = payload.status;
  const legacyPublished =
    payload.isPublished !== undefined ? payload.isPublished : payload.is_published;
  const scheduledFor =
    payload.scheduledFor !== undefined ? payload.scheduledFor : payload.scheduled_for;

  let status = requestedStatus || existing?.status || 'draft';
  if (!requestedStatus && legacyPublished === true) status = 'published';
  if (!requestedStatus && legacyPublished === false) status = 'draft';

  const nextScheduledFor = scheduledFor
    ? new Date(scheduledFor)
    : scheduledFor === null
      ? null
      : existing?.scheduledFor || null;

  let isPublished = existing?.isPublished || false;
  let publishedAt = existing?.publishedAt || null;

  switch (status) {
    case 'published':
      isPublished = true;
      publishedAt = payload.publishedAt
        ? new Date(payload.publishedAt)
        : existing?.publishedAt || new Date();
      break;
    case 'scheduled':
      isPublished = false;
      publishedAt = null;
      break;
    default:
      isPublished = false;
      publishedAt = null;
      break;
  }

  return {
    status,
    isPublished,
    publishedAt,
    scheduledFor: status === 'scheduled' ? nextScheduledFor : null,
  };
};

const createNewsPost = async (payload, createdBy) => {
  const slug = payload.slug ? await createUniqueSlug(payload.slug) : await createUniqueSlug(payload.title);
  const workflow = resolveWorkflowFields(payload);

  const post = await prisma.newsPost.create({
    data: {
      title: payload.title,
      slug,
      summary: payload.summary,
      content: payload.content,
      imageUrl: payload.imageUrl || payload.image_url || null,
      featured: Boolean(payload.featured),
      status: workflow.status,
      isPublished: workflow.isPublished,
      publishedAt: workflow.publishedAt,
      scheduledFor: workflow.scheduledFor,
      createdBy: Number(createdBy),
    },
    include: {
      creator: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return mapNewsWithAuthor(post);
};

const buildPublishedWhere = (search = null) => {
  const where = {
    status: 'published',
    isPublished: true,
    OR: [
      { publishedAt: { lte: new Date() } },
      { publishedAt: null },
    ],
  };

  if (search) {
    where.AND = [{
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ],
    }];
  }

  return where;
};

const getPublishedNews = async (offset = 0, limit = 10, search = null) => {
  const items = await prisma.newsPost.findMany({
    where: buildPublishedWhere(search),
    skip: Number(offset),
    take: Number(limit),
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      creator: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return items.map(mapNewsWithAuthor);
};

const countPublishedNews = async (search = null) =>
  prisma.newsPost.count({ where: buildPublishedWhere(search) });

const getNewsById = async (id, includeUnpublished = false) => {
  const where = { id: Number(id) };

  if (!includeUnpublished) {
    Object.assign(where, buildPublishedWhere(null));
  }

  const item = await prisma.newsPost.findFirst({
    where,
    include: {
      creator: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!item) return undefined;
  return mapNewsWithAuthor(item);
};

const getAdminNews = async (offset = 0, limit = 20, filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { summary: { contains: filters.search, mode: 'insensitive' } },
      { content: { contains: filters.search, mode: 'insensitive' } },
      { slug: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const items = await prisma.newsPost.findMany({
    where,
    skip: Number(offset),
    take: Number(limit),
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      creator: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return items.map(mapNewsWithAuthor);
};

const countAdminNews = async (filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { summary: { contains: filters.search, mode: 'insensitive' } },
      { content: { contains: filters.search, mode: 'insensitive' } },
      { slug: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.newsPost.count({ where });
};

const buildNewsUpdateData = async (updates, existing) => {
  const data = {};

  if (updates.title !== undefined) data.title = updates.title;
  if (updates.summary !== undefined) data.summary = updates.summary;
  if (updates.content !== undefined) data.content = updates.content;
  if (updates.imageUrl !== undefined) data.imageUrl = updates.imageUrl;
  if (updates.image_url !== undefined) data.imageUrl = updates.image_url;
  if (updates.featured !== undefined) data.featured = Boolean(updates.featured);
  if (updates.slug !== undefined && updates.slug !== existing.slug) {
    data.slug = await createUniqueSlug(updates.slug, existing.id);
  }
  if (updates.title !== undefined && updates.slug === undefined && updates.title !== existing.title) {
    data.slug = await createUniqueSlug(updates.title, existing.id);
  }

  const workflow = resolveWorkflowFields(updates, existing);
  data.status = workflow.status;
  data.isPublished = workflow.isPublished;
  data.publishedAt = workflow.publishedAt;
  data.scheduledFor = workflow.scheduledFor;

  return data;
};

const updateNewsPost = async (id, updates) => {
  const postId = Number(id);
  const existing = await prisma.newsPost.findUnique({
    where: { id: postId },
  });

  if (!existing) {
    return undefined;
  }

  const data = await buildNewsUpdateData(updates, existing);

  const item = await prisma.newsPost.update({
    where: { id: postId },
    data,
    include: {
      creator: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return mapNewsWithAuthor(item);
};

const deleteNewsPost = async (id) => {
  const postId = Number(id);
  const deleted = await prisma.newsPost.deleteMany({
    where: { id: postId },
  });

  if (deleted.count === 0) {
    return undefined;
  }

  return { id: postId };
};

module.exports = {
  createNewsPost,
  getPublishedNews,
  countPublishedNews,
  getNewsById,
  getAdminNews,
  countAdminNews,
  updateNewsPost,
  deleteNewsPost,
};
