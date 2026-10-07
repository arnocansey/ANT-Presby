const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const as = (userId, role) => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET)}`;
const admin = () => as(1, 'admin');
const PID = (n) => `antpresby/albums/3/photo${n}`;

const photo = (n) => ({
  id: n,
  album_id: 3,
  public_id: PID(n),
  url: `https://res.cloudinary.com/demo/image/upload/v1/${PID(n)}.jpg`,
  width: 800,
  height: 600,
  bytes: 1000,
  format: 'jpg',
  sort_order: n,
  created_at: '2026-10-05T10:00:00.000Z',
});

const album = (overrides = {}) => ({
  id: 3,
  title: 'Harvest Sunday',
  description: null,
  event_id: 4,
  event_name: 'Harvest',
  external_url: null,
  cover_photo_id: null,
  is_published: true,
  notified_at: null,
  created_at: '2026-10-05T10:00:00.000Z',
  updated_at: '2026-10-05T10:00:00.000Z',
  photo_count: 2,
  cover: { public_id: PID(1), url: photo(1).url },
  photos: [photo(1), photo(2)],
  ...overrides,
});

const draft = () => album({ is_published: false, photo_count: 0, cover: null, photos: [] });
const verifiedPhoto = (n) => ({ publicId: PID(n), url: photo(n).url, width: 800, height: 600, bytes: 1000, format: 'jpg' });

const validBody = {
  title: 'Harvest Sunday',
  description: 'Thanksgiving service',
  eventId: 4,
  externalUrl: 'https://drive.google.com/drive/folders/abc123',
  isPublished: true,
};

const buildModels = () => ({
  photoAlbumModel: {
    listPublished: jest.fn().mockResolvedValue([album()]),
    countPublished: jest.fn().mockResolvedValue(1),
    getPublishedById: jest.fn().mockResolvedValue(album()),
    listAll: jest.fn().mockResolvedValue([draft(), album()]),
    getById: jest.fn().mockResolvedValue(album()),
    eventExists: jest.fn().mockResolvedValue(true),
    createAlbum: jest.fn().mockResolvedValue(draft()),
    updateAlbum: jest.fn().mockResolvedValue(album()),
    deleteAlbum: jest.fn().mockResolvedValue(1),
    addPhotos: jest.fn().mockResolvedValue(1),
    deletePhoto: jest.fn().mockResolvedValue(photo(2)),
    setCover: jest.fn().mockResolvedValue(true),
    claimNotification: jest.fn().mockResolvedValue(true),
  },
  imageStorage: {
    isOwnImageUrl: jest.fn().mockReturnValue(false),
    isConfigured: jest.fn().mockReturnValue(true),
    displayUrl: jest.fn((id) => `display:${id}`),
    thumbnailUrl: jest.fn((id) => `thumb:${id}`),
    downloadUrl: jest.fn((id) => `download:${id}`),
    albumArchiveUrl: jest.fn().mockReturnValue('https://api.cloudinary.com/v1_1/demo/image/generate_archive?signed=1'),
    createAlbumUploadSignature: jest.fn().mockReturnValue({
      cloudName: 'demo',
      apiKey: 'test-placeholder-key',
      timestamp: 1700000000,
      signature: 'abc123',
      folder: 'antpresby/albums/3',
      allowedFormats: 'jpg,jpeg,png,webp,heic',
      maxFileSize: 10485760,
    }),
    verifyAlbumAssets: jest.fn().mockResolvedValue({ verified: [verifiedPhoto(5)], rejected: [] }),
    deleteAlbumPhoto: jest.fn().mockResolvedValue(true),
    deleteAlbumFolder: jest.fn().mockResolvedValue(true),
  },
  notificationService: { notify: jest.fn(), notifyAll: jest.fn().mockResolvedValue({ inApp: 40, push: 12 }) },
  auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
});

const buildApp = (models) => {
  jest.resetModules();
  jest.doMock('../../src/models/photoAlbumModel', () => models.photoAlbumModel);
  jest.doMock('../../src/services/imageStorage', () => models.imageStorage);
  jest.doMock('../../src/services/notificationService', () => models.notificationService);
  jest.doMock('../../src/models/auditLogModel', () => models.auditLogModel);

  const app = express();
  app.use(express.json());
  app.use('/api/albums', require('../../src/routes/albumRoutes'));
  app.use('/api/admin/albums', require('../../src/routes/adminAlbumRoutes'));
  app.use(require('../../src/middleware/errorHandler').errorHandler);
  return app;
};

describe('Albums API (public)', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('lists published albums with a cover thumbnail and paging', async () => {
    const response = await request(app).get('/api/albums');

    expect(response.status).toBe(200);
    expect(models.photoAlbumModel.listPublished).toHaveBeenCalledWith({ offset: 0, limit: 12 });
    expect(response.body.data).toEqual([
      {
        id: 3,
        title: 'Harvest Sunday',
        description: null,
        event_id: 4,
        event_name: 'Harvest',
        cover_url: `thumb:${PID(1)}`,
        photo_count: 2,
        external_url: null,
        created_at: '2026-10-05T10:00:00.000Z',
      },
    ]);
    expect(response.body.meta).toEqual(expect.objectContaining({ total: 1, has_more: false }));
  });

  test('an album shows its photos with display, thumbnail and download links', async () => {
    const response = await request(app).get('/api/albums/3');

    expect(response.status).toBe(200);
    expect(response.body.data.photos[0]).toEqual({
      id: 1,
      url: `display:${PID(1)}`,
      thumb_url: `thumb:${PID(1)}`,
      download_url: `download:${PID(1)}`,
      width: 800,
      height: 600,
      format: 'jpg',
    });
    expect(response.body.data).not.toHaveProperty('is_published');
  });

  test('a draft or unknown album is 404', async () => {
    models.photoAlbumModel.getPublishedById.mockResolvedValue(undefined);

    const response = await request(app).get('/api/albums/3');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Album not found');
  });

  test('an invalid id is 404 without touching the database', async () => {
    const response = await request(app).get('/api/albums/abc');

    expect(response.status).toBe(404);
    expect(models.photoAlbumModel.getPublishedById).not.toHaveBeenCalled();
  });

  test('download returns a zip link for every photo, named after the album', async () => {
    const response = await request(app).get('/api/albums/3/download');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ url: 'https://api.cloudinary.com/v1_1/demo/image/generate_archive?signed=1' });
    expect(models.imageStorage.albumArchiveUrl).toHaveBeenCalledWith(3, [PID(1), PID(2)], 'Harvest Sunday');
  });

  test('downloading an empty album is 404 "No photos yet"', async () => {
    models.photoAlbumModel.getPublishedById.mockResolvedValue(album({ photos: [], photo_count: 0, cover: null }));

    const response = await request(app).get('/api/albums/3/download');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('No photos yet');
    expect(models.imageStorage.albumArchiveUrl).not.toHaveBeenCalled();
  });
});

describe('Albums API (admin)', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('members cannot manage albums', async () => {
    const response = await request(app).post('/api/admin/albums').set('Authorization', as(7, 'member')).send(validBody);

    expect(response.status).toBe(403);
    expect(models.photoAlbumModel.createAlbum).not.toHaveBeenCalled();
  });

  test('lists every album including drafts', async () => {
    const response = await request(app).get('/api/admin/albums').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(models.photoAlbumModel.listAll).toHaveBeenCalled();
    expect(response.body.data[0]).toEqual(expect.objectContaining({ is_published: false, cover_url: null }));
  });

  test('creates an album and audits it', async () => {
    const response = await request(app).post('/api/admin/albums').set('Authorization', admin()).send(validBody);

    expect(response.status).toBe(201);
    expect(models.photoAlbumModel.eventExists).toHaveBeenCalledWith(4);
    expect(models.photoAlbumModel.createAlbum).toHaveBeenCalledWith(validBody, 1);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'album', action: 'create', entityId: 3 })
    );
  });

  test('an unknown event is 400', async () => {
    models.photoAlbumModel.eventExists.mockResolvedValue(false);

    const response = await request(app).post('/api/admin/albums').set('Authorization', admin()).send(validBody);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Event not found');
    expect(models.photoAlbumModel.createAlbum).not.toHaveBeenCalled();
  });

  test.each([
    ['a missing title', { title: '   ' }],
    ['a plain http folder link', { externalUrl: 'http://drive.google.com/drive/folders/abc123' }],
    ['a script link', { externalUrl: 'javascript:alert(1)' }],
    ['a non-boolean published flag', { isPublished: 'yes' }],
  ])('rejects %s with 400', async (_label, overrides) => {
    const response = await request(app)
      .post('/api/admin/albums')
      .set('Authorization', admin())
      .send({ ...validBody, ...overrides });

    expect(response.status).toBe(400);
    expect(models.photoAlbumModel.createAlbum).not.toHaveBeenCalled();
  });

  test('updating a missing album is 404', async () => {
    models.photoAlbumModel.updateAlbum.mockResolvedValue(undefined);

    const response = await request(app).put('/api/admin/albums/99').set('Authorization', admin()).send(validBody);

    expect(response.status).toBe(404);
  });

  test('publishing an album with photos notifies everyone', async () => {
    const response = await request(app).put('/api/admin/albums/3').set('Authorization', admin()).send(validBody);

    expect(response.status).toBe(200);
    expect(models.photoAlbumModel.claimNotification).toHaveBeenCalledWith(3);
    expect(models.notificationService.notifyAll).toHaveBeenCalledWith({
      title: 'New photos: Harvest Sunday',
      message: 'Photos from Harvest are in the gallery.',
      type: 'album',
      entityType: 'album',
      entityId: 3,
    });
    expect(response.body.message).toBe('Album published and everyone notified');
  });

  test('republishing an album that already notified does not notify again', async () => {
    models.photoAlbumModel.claimNotification.mockResolvedValue(false);

    const response = await request(app).put('/api/admin/albums/3').set('Authorization', admin()).send(validBody);

    expect(response.status).toBe(200);
    expect(models.notificationService.notifyAll).not.toHaveBeenCalled();
    expect(response.body.message).toBe('Album updated');
  });

  test('publishing an empty album waits for photos before notifying', async () => {
    models.photoAlbumModel.updateAlbum.mockResolvedValue(album({ photos: [], photo_count: 0, cover: null }));

    await request(app).put('/api/admin/albums/3').set('Authorization', admin()).send(validBody);

    expect(models.photoAlbumModel.claimNotification).not.toHaveBeenCalled();
    expect(models.notificationService.notifyAll).not.toHaveBeenCalled();
  });

  test('the first photos added to a published album notify once', async () => {
    models.photoAlbumModel.claimNotification.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await request(app).post('/api/admin/albums/3/photos').set('Authorization', admin()).send({ publicIds: [PID(5)] });
    await request(app).post('/api/admin/albums/3/photos').set('Authorization', admin()).send({ publicIds: [PID(6)] });

    expect(models.notificationService.notifyAll).toHaveBeenCalledTimes(1);
    expect(models.notificationService.notifyAll).toHaveBeenCalledWith(expect.objectContaining({ type: 'album', entityId: 3 }));
  });

  test('issues an upload signature for the album', async () => {
    const response = await request(app).post('/api/admin/albums/3/upload-signature').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(models.imageStorage.createAlbumUploadSignature).toHaveBeenCalledWith(3);
    expect(response.body.data).toEqual(expect.objectContaining({ folder: 'antpresby/albums/3', signature: 'abc123' }));
  });

  test('without Cloudinary the upload signature is 503', async () => {
    models.imageStorage.isConfigured.mockReturnValue(false);

    const response = await request(app).post('/api/admin/albums/3/upload-signature').set('Authorization', admin());

    expect(response.status).toBe(503);
    expect(response.body.message).toBe('Photo uploads need Cloudinary to be configured');
    expect(models.imageStorage.createAlbumUploadSignature).not.toHaveBeenCalled();
  });

  test('records verified photos once each and reports the rejected ones', async () => {
    models.imageStorage.verifyAlbumAssets.mockResolvedValue({ verified: [verifiedPhoto(5)], rejected: ['antpresby/albums/9/x1'] });

    const response = await request(app)
      .post('/api/admin/albums/3/photos')
      .set('Authorization', admin())
      .send({ publicIds: [PID(5), PID(5), 'antpresby/albums/9/x1'] });

    expect(response.status).toBe(200);
    expect(models.imageStorage.verifyAlbumAssets).toHaveBeenCalledWith(3, [PID(5), 'antpresby/albums/9/x1']);
    expect(models.photoAlbumModel.addPhotos).toHaveBeenCalledWith(3, [verifiedPhoto(5)]);
    expect(response.body.data).toEqual({ added: 1, rejected: ['antpresby/albums/9/x1'] });
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'add_photos', entityId: 3 }));
  });

  test('when no photo can be verified it is 400 and nothing is recorded', async () => {
    models.imageStorage.verifyAlbumAssets.mockResolvedValue({ verified: [], rejected: [PID(5)] });

    const response = await request(app).post('/api/admin/albums/3/photos').set('Authorization', admin()).send({ publicIds: [PID(5)] });

    expect(response.status).toBe(400);
    expect(response.body.data).toEqual({ added: 0, rejected: [PID(5)] });
    expect(models.photoAlbumModel.addPhotos).not.toHaveBeenCalled();
  });

  test('more than 100 photos in one request is 400', async () => {
    const publicIds = Array.from({ length: 101 }, (_, i) => PID(i));

    const response = await request(app).post('/api/admin/albums/3/photos').set('Authorization', admin()).send({ publicIds });

    expect(response.status).toBe(400);
    expect(models.imageStorage.verifyAlbumAssets).not.toHaveBeenCalled();
  });

  test('without Cloudinary recording photos is 503', async () => {
    models.imageStorage.isConfigured.mockReturnValue(false);

    const response = await request(app).post('/api/admin/albums/3/photos').set('Authorization', admin()).send({ publicIds: [PID(5)] });

    expect(response.status).toBe(503);
    expect(models.imageStorage.verifyAlbumAssets).not.toHaveBeenCalled();
  });

  test('a Cloudinary outage while checking photos is 502 and records nothing', async () => {
    models.imageStorage.verifyAlbumAssets.mockRejectedValue(
      Object.assign(new Error('Image storage is unavailable, please try again'), { statusCode: 502 })
    );
    const quiet = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(app).post('/api/admin/albums/3/photos').set('Authorization', admin()).send({ publicIds: [PID(5)] });

    expect(response.status).toBe(502);
    expect(models.photoAlbumModel.addPhotos).not.toHaveBeenCalled();
    quiet.mockRestore();
  });

  test('deleting a photo removes the record, then the Cloudinary image', async () => {
    const response = await request(app).delete('/api/admin/albums/3/photos/2').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(models.photoAlbumModel.deletePhoto).toHaveBeenCalledWith(3, 2);
    expect(models.imageStorage.deleteAlbumPhoto).toHaveBeenCalledWith(PID(2));
    expect(models.photoAlbumModel.deletePhoto.mock.invocationCallOrder[0]).toBeLessThan(
      models.imageStorage.deleteAlbumPhoto.mock.invocationCallOrder[0]
    );
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete_photo', entityId: 3 }));
  });

  test('deleting a photo that is not in the album is 404', async () => {
    models.photoAlbumModel.deletePhoto.mockResolvedValue(undefined);

    const response = await request(app).delete('/api/admin/albums/3/photos/77').set('Authorization', admin());

    expect(response.status).toBe(404);
    expect(models.imageStorage.deleteAlbumPhoto).not.toHaveBeenCalled();
  });

  test('the cover must be a photo of this album', async () => {
    models.photoAlbumModel.setCover.mockResolvedValue(false);

    const response = await request(app).patch('/api/admin/albums/3/cover').set('Authorization', admin()).send({ photoId: 77 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('That photo is not in this album');
  });

  test('sets the cover and audits it', async () => {
    const response = await request(app).patch('/api/admin/albums/3/cover').set('Authorization', admin()).send({ photoId: 2 });

    expect(response.status).toBe(200);
    expect(models.photoAlbumModel.setCover).toHaveBeenCalledWith(3, 2);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'set_cover', entityId: 3, metadata: { photoId: 2 } })
    );
  });

  test('deleting an album cleans up its Cloudinary folder, then deletes it and audits', async () => {
    const response = await request(app).delete('/api/admin/albums/3').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(models.imageStorage.deleteAlbumFolder).toHaveBeenCalledWith(3);
    expect(models.photoAlbumModel.deleteAlbum).toHaveBeenCalledWith(3);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete', entityId: 3 }));
  });
});
