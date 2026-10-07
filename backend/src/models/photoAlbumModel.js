const prisma = require('../config/prisma');

/**
 * Photo Album Model - albums of photos stored on Cloudinary.
 * Members only ever see published albums; drafts are admin-only.
 */

const PHOTO_ORDER = [{ sortOrder: 'asc' }, { id: 'asc' }];
const NEWEST_FIRST = [{ createdAt: 'desc' }, { id: 'desc' }];

const SUMMARY_INCLUDE = {
  event: { select: { name: true } },
  photos: { orderBy: PHOTO_ORDER, take: 1, select: { id: true, publicId: true, url: true } },
  _count: { select: { photos: true } },
};

const DETAIL_INCLUDE = {
  event: { select: { name: true } },
  photos: { orderBy: PHOTO_ORDER },
};

const toPhoto = (row) => ({
  id: row.id,
  album_id: row.albumId,
  public_id: row.publicId,
  url: row.url,
  width: row.width ?? null,
  height: row.height ?? null,
  bytes: row.bytes ?? null,
  format: row.format ?? null,
  sort_order: row.sortOrder,
  created_at: row.createdAt,
});

const toAlbum = (row, cover, photoCount) => ({
  id: row.id,
  title: row.title,
  description: row.description ?? null,
  event_id: row.eventId ?? null,
  event_name: row.event?.name ?? null,
  external_url: row.externalUrl ?? null,
  cover_photo_id: row.coverPhotoId ?? null,
  is_published: row.isPublished,
  notified_at: row.notifiedAt ?? null,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
  photo_count: photoCount,
  cover: cover ? { public_id: cover.publicId, url: cover.url } : null,
});

// The chosen cover when it still belongs to the album, otherwise the first photo.
const withCovers = async (rows) => {
  const coverIds = rows.map((row) => row.coverPhotoId).filter(Boolean);
  const covers = coverIds.length
    ? await prisma.albumPhoto.findMany({
        where: { id: { in: coverIds } },
        select: { id: true, albumId: true, publicId: true, url: true },
      })
    : [];
  const byId = new Map(covers.map((photo) => [photo.id, photo]));
  return rows.map((row) => {
    const chosen = byId.get(row.coverPhotoId);
    const cover = chosen && chosen.albumId === row.id ? chosen : row.photos[0];
    return toAlbum(row, cover, row._count.photos);
  });
};

const toDetail = (row) => {
  const cover = row.photos.find((photo) => photo.id === row.coverPhotoId) || row.photos[0];
  return { ...toAlbum(row, cover, row.photos.length), photos: row.photos.map(toPhoto) };
};

const listPublished = async ({ offset = 0, limit = 12 } = {}) => {
  const rows = await prisma.photoAlbum.findMany({
    where: { isPublished: true },
    orderBy: NEWEST_FIRST,
    skip: Number(offset),
    take: Number(limit),
    include: SUMMARY_INCLUDE,
  });
  return withCovers(rows);
};

const countPublished = () => prisma.photoAlbum.count({ where: { isPublished: true } });

const getPublishedById = async (id) => {
  const row = await prisma.photoAlbum.findFirst({ where: { id: Number(id), isPublished: true }, include: DETAIL_INCLUDE });
  return row ? toDetail(row) : undefined;
};

const listAll = async () => {
  const rows = await prisma.photoAlbum.findMany({ orderBy: NEWEST_FIRST, include: SUMMARY_INCLUDE });
  return withCovers(rows);
};

const getById = async (id) => {
  const row = await prisma.photoAlbum.findUnique({ where: { id: Number(id) }, include: DETAIL_INCLUDE });
  return row ? toDetail(row) : undefined;
};

const eventExists = async (eventId) => (await prisma.event.count({ where: { id: Number(eventId) } })) > 0;

const optionalText = (value) => (value ? String(value).trim() || null : null);

const toData = (input = {}) => {
  const data = {};
  if (input.title !== undefined) data.title = String(input.title).trim();
  if (input.description !== undefined) data.description = optionalText(input.description);
  if (input.eventId !== undefined) data.eventId = input.eventId ? Number(input.eventId) : null;
  if (input.externalUrl !== undefined) data.externalUrl = optionalText(input.externalUrl);
  if (input.isPublished !== undefined) data.isPublished = Boolean(input.isPublished);
  return data;
};

const createAlbum = async (input, createdBy) => {
  const row = await prisma.photoAlbum.create({
    data: { ...toData(input), createdBy: createdBy ? Number(createdBy) : null },
  });
  return getById(row.id);
};

const updateAlbum = async (id, input) => {
  const updated = await prisma.photoAlbum.updateMany({ where: { id: Number(id) }, data: toData(input) });
  return updated.count === 0 ? undefined : getById(id);
};

const deleteAlbum = async (id) => {
  const result = await prisma.photoAlbum.deleteMany({ where: { id: Number(id) } });
  return result.count;
};

// Inserts verified photos after the album's last one; a public id that is already recorded is skipped.
const addPhotos = async (albumId, photos) => {
  const { _max: max } = await prisma.albumPhoto.aggregate({
    where: { albumId: Number(albumId) },
    _max: { sortOrder: true },
  });
  let next = (max?.sortOrder ?? -1) + 1;
  const result = await prisma.albumPhoto.createMany({
    data: photos.map((photo) => ({
      albumId: Number(albumId),
      publicId: photo.publicId,
      url: photo.url,
      width: photo.width ?? null,
      height: photo.height ?? null,
      bytes: photo.bytes ?? null,
      format: photo.format ?? null,
      sortOrder: next++,
    })),
    skipDuplicates: true,
  });
  return result.count;
};

// Deletes one photo of this album; if it was the cover, the album falls back to its first photo.
const deletePhoto = async (albumId, photoId) => {
  const photo = await prisma.albumPhoto.findFirst({ where: { id: Number(photoId), albumId: Number(albumId) } });
  if (!photo) return undefined;
  await prisma.$transaction([
    prisma.albumPhoto.deleteMany({ where: { id: photo.id } }),
    prisma.photoAlbum.updateMany({ where: { id: Number(albumId), coverPhotoId: photo.id }, data: { coverPhotoId: null } }),
  ]);
  return toPhoto(photo);
};

// The cover must be one of the album's own photos.
const setCover = async (albumId, photoId) => {
  const photo = await prisma.albumPhoto.findFirst({
    where: { id: Number(photoId), albumId: Number(albumId) },
    select: { id: true },
  });
  if (!photo) return false;
  const updated = await prisma.photoAlbum.updateMany({ where: { id: Number(albumId) }, data: { coverPhotoId: photo.id } });
  return updated.count === 1;
};

// Atomic claim: only the one caller whose update sets notified_at gets true, so everyone is notified once.
const claimNotification = async (id) => {
  const result = await prisma.photoAlbum.updateMany({
    where: { id: Number(id), isPublished: true, notifiedAt: null, photos: { some: {} } },
    data: { notifiedAt: new Date() },
  });
  return result.count === 1;
};

module.exports = {
  listPublished,
  countPublished,
  getPublishedById,
  listAll,
  getById,
  eventExists,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addPhotos,
  deletePhoto,
  setCover,
  claimNotification,
};
