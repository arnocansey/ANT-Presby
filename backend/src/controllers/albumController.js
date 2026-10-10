const { apiResponse, parseId, getPagination, buildPaginationMeta } = require('../utils/helpers');
const photoAlbumModel = require('../models/photoAlbumModel');
const auditLogModel = require('../models/auditLogModel');
const imageStorage = require('../services/imageStorage');
const { notifyAll } = require('../services/notificationService');

/**
 * Album Controller - the public photo gallery and admin album management.
 */

const NOT_FOUND = 'Album not found';
const NEEDS_CLOUDINARY = 'Photo uploads need Cloudinary to be configured';
const fail = (res, status, message, data = null) => res.status(status).json(apiResponse(false, data, message));

const coverUrl = (cover) => (cover ? imageStorage.thumbnailUrl(cover.public_id) || cover.url : null);

const presentPhoto = (photo) => ({
  id: photo.id,
  url: imageStorage.displayUrl(photo.public_id) || photo.url,
  thumb_url: imageStorage.thumbnailUrl(photo.public_id) || photo.url,
  download_url: imageStorage.downloadUrl(photo.public_id) || photo.url,
  width: photo.width,
  height: photo.height,
  format: photo.format,
});

const presentSummary = (album) => ({
  id: album.id,
  title: album.title,
  description: album.description,
  event_id: album.event_id,
  event_name: album.event_name,
  cover_url: coverUrl(album.cover),
  photo_count: album.photo_count,
  external_url: album.external_url,
  created_at: album.created_at,
});

const presentAdmin = (album) => ({
  ...presentSummary(album),
  is_published: album.is_published,
  cover_photo_id: album.cover_photo_id,
  notified_at: album.notified_at,
  updated_at: album.updated_at,
});

const withPhotos = (album, present) => ({ ...present(album), photos: album.photos.map(presentPhoto) });

const findPublished = (req) => {
  const id = parseId(req.params.id);
  return id ? photoAlbumModel.getPublishedById(id) : undefined;
};

const findAlbum = (req) => {
  const id = parseId(req.params.id);
  return id ? photoAlbumModel.getById(id) : undefined;
};

// ---- Public ----

const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const { offset, limitNum } = getPagination(page, limit);
    const [albums, total] = await Promise.all([
      photoAlbumModel.listPublished({ offset, limit: limitNum }),
      photoAlbumModel.countPublished(),
    ]);
    res.json(apiResponse(true, albums.map(presentSummary), 'Albums retrieved', buildPaginationMeta(total, page, limit)));
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const album = await findPublished(req);
    if (!album) return fail(res, 404, NOT_FOUND);
    res.json(apiResponse(true, withPhotos(album, presentSummary), 'Album retrieved'));
  } catch (error) {
    next(error);
  }
};

// A zip of the whole album, built by Cloudinary; the link is generated per request and never stored.
const download = async (req, res, next) => {
  try {
    const album = await findPublished(req);
    if (!album) return fail(res, 404, NOT_FOUND);
    if (album.photos.length === 0) return fail(res, 404, 'No photos yet');
    if (!imageStorage.isConfigured()) return fail(res, 503, 'Downloads need Cloudinary to be configured');
    const url = imageStorage.albumArchiveUrl(album.id, album.title);
    res.json(apiResponse(true, { url }, 'Download ready'));
  } catch (error) {
    next(error);
  }
};

// ---- Admin ----

const audit = (req, action, entityId, summary, metadata = {}) =>
  auditLogModel.createAuditLog({ actorUserId: req.user.userId, entityType: 'album', entityId, action, summary, metadata });

const pickInput = (body) => ({
  title: body.title,
  description: body.description,
  eventId: body.eventId,
  externalUrl: body.externalUrl,
  isPublished: body.isPublished,
});

const unknownEvent = async (eventId) => Boolean(eventId) && !(await photoAlbumModel.eventExists(eventId));

// Everyone is told once, the first time the album is both published and has photos.
const notifyIfReady = async (album) => {
  if (!album.is_published || album.photo_count === 0) return false;
  if (!(await photoAlbumModel.claimNotification(album.id))) return false;
  await notifyAll({
    title: `New photos: ${album.title}`,
    message: album.event_name ? `Photos from ${album.event_name} are in the gallery.` : 'New photos are in the gallery.',
    type: 'album',
    entityType: 'album',
    entityId: album.id,
  });
  return true;
};

const adminList = async (req, res, next) => {
  try {
    const albums = await photoAlbumModel.listAll();
    res.json(apiResponse(true, albums.map(presentAdmin), 'Albums retrieved'));
  } catch (error) {
    next(error);
  }
};

const adminGet = async (req, res, next) => {
  try {
    const album = await findAlbum(req);
    if (!album) return fail(res, 404, NOT_FOUND);
    res.json(apiResponse(true, withPhotos(album, presentAdmin), 'Album retrieved'));
  } catch (error) {
    next(error);
  }
};

// A new album has no photos yet, so creating one never notifies.
const adminCreate = async (req, res, next) => {
  try {
    if (await unknownEvent(req.body.eventId)) return fail(res, 400, 'Event not found');
    const album = await photoAlbumModel.createAlbum(pickInput(req.body), req.user.userId);
    await audit(req, 'create', album.id, `Created album "${album.title}"`);
    res.status(201).json(apiResponse(true, withPhotos(album, presentAdmin), 'Album created'));
  } catch (error) {
    next(error);
  }
};

const adminUpdate = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 404, NOT_FOUND);
    if (await unknownEvent(req.body.eventId)) return fail(res, 400, 'Event not found');
    const album = await photoAlbumModel.updateAlbum(id, pickInput(req.body));
    if (!album) return fail(res, 404, NOT_FOUND);

    const notified = await notifyIfReady(album);
    await audit(req, 'update', id, `Updated album "${album.title}"${notified ? ' and notified everyone' : ''}`, {
      isPublished: album.is_published,
    });
    res.json(
      apiResponse(true, withPhotos(album, presentAdmin), notified ? 'Album published and everyone notified' : 'Album updated')
    );
  } catch (error) {
    next(error);
  }
};

const adminDelete = async (req, res, next) => {
  try {
    const album = await findAlbum(req);
    if (!album) return fail(res, 404, NOT_FOUND);
    // The record goes first: if it fails, the album and its photos are untouched.
    // Then a best-effort Cloudinary cleanup (logged, never blocks).
    await photoAlbumModel.deleteAlbum(album.id);
    await imageStorage.deleteAlbumFolder(album.id);
    await audit(req, 'delete', album.id, `Deleted album "${album.title}"`, { photoCount: album.photo_count });
    res.json(apiResponse(true, null, 'Album deleted'));
  } catch (error) {
    next(error);
  }
};

const adminUploadSignature = async (req, res, next) => {
  try {
    const album = await findAlbum(req);
    if (!album) return fail(res, 404, NOT_FOUND);
    if (!imageStorage.isConfigured()) return fail(res, 503, NEEDS_CLOUDINARY);
    res.json(apiResponse(true, imageStorage.createAlbumUploadSignature(album.id), 'Upload signature issued'));
  } catch (error) {
    next(error);
  }
};

// Records photos the client uploaded to Cloudinary, after Cloudinary confirms each one.
const adminAddPhotos = async (req, res, next) => {
  try {
    const album = await findAlbum(req);
    if (!album) return fail(res, 404, NOT_FOUND);
    if (!imageStorage.isConfigured()) return fail(res, 503, NEEDS_CLOUDINARY);

    const publicIds = [...new Set(req.body.publicIds)];
    const { verified, rejected } = await imageStorage.verifyAlbumAssets(album.id, publicIds);
    if (verified.length === 0) {
      return fail(res, 400, 'None of the photos could be added', { added: 0, rejected });
    }

    // Tag first: only tagged photos go into the album zip, so a photo is never recorded untagged.
    await imageStorage.tagAlbumPhotos(album.id, verified.map((photo) => photo.publicId));
    const added = await photoAlbumModel.addPhotos(album.id, verified);
    await audit(req, 'add_photos', album.id, `Added ${added} photo(s) to album "${album.title}"`, {
      added,
      rejected: rejected.length,
    });

    const updated = await photoAlbumModel.getById(album.id);
    const notified = updated ? await notifyIfReady(updated) : false;
    const message = `${added} photo(s) added${notified ? ' and everyone notified' : ''}`;
    res.json(apiResponse(true, { added, rejected }, message));
  } catch (error) {
    next(error);
  }
};

// The photo first leaves the album zip (its tag); if that fails nothing changes. Then the record goes,
// so a Cloudinary hiccup during file cleanup can never leave a broken photo in the album or the zip.
const adminDeletePhoto = async (req, res, next) => {
  try {
    const albumId = parseId(req.params.id);
    const photoId = parseId(req.params.photoId);
    const album = albumId && photoId ? await photoAlbumModel.getById(albumId) : undefined;
    const target = album?.photos?.find((item) => Number(item.id) === photoId);
    if (!target) return fail(res, 404, 'Photo not found');

    await imageStorage.untagAlbumPhoto(albumId, target.public_id);
    const photo = await photoAlbumModel.deletePhoto(albumId, photoId);
    if (!photo) return fail(res, 404, 'Photo not found');

    await imageStorage.deleteAlbumPhoto(photo.public_id);
    await audit(req, 'delete_photo', albumId, `Deleted photo #${photoId}`, { publicId: photo.public_id });
    res.json(apiResponse(true, null, 'Photo deleted'));
  } catch (error) {
    next(error);
  }
};

const adminSetCover = async (req, res, next) => {
  try {
    const album = await findAlbum(req);
    if (!album) return fail(res, 404, NOT_FOUND);
    const photoId = Number(req.body.photoId);
    if (!(await photoAlbumModel.setCover(album.id, photoId))) {
      return fail(res, 400, 'That photo is not in this album');
    }
    await audit(req, 'set_cover', album.id, `Set the cover of album "${album.title}"`, { photoId });
    const updated = await photoAlbumModel.getById(album.id);
    res.json(apiResponse(true, updated ? withPhotos(updated, presentAdmin) : null, 'Cover updated'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  getOne,
  download,
  adminList,
  adminGet,
  adminCreate,
  adminUpdate,
  adminDelete,
  adminUploadSignature,
  adminAddPhotos,
  adminDeletePhoto,
  adminSetCover,
};
