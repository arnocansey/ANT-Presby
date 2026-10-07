const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const tokenFor = (userId, role = 'member') =>
  `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET, { expiresIn: '10m' })}`;
const CLOUD = 'https://res.cloudinary.com/demo/image/upload/v1';

const storageFailure = () => Object.assign(new Error('Image storage is unavailable, please try again'), { statusCode: 502 });

describe('Uploads go through image storage', () => {
  const savedCloud = process.env.CLOUDINARY_CLOUD_NAME;
  let storage;
  let models;

  const buildApp = () => {
    jest.resetModules();
    const actual = jest.requireActual('../../src/services/imageStorage');
    storage = {
      ...actual,
      uploadImage: jest.fn().mockResolvedValue({
        url: `${CLOUD}/antpresby/series/new123.png`,
        publicId: 'antpresby/series/new123',
        fileName: 'antpresby/series/new123',
      }),
      deleteImage: jest.fn().mockResolvedValue(true),
    };
    models = {
      userModel: {
        findUserById: jest.fn().mockResolvedValue({ id: 7, profile_image_url: `${CLOUD}/antpresby/profile/old123.png` }),
        updateUserProfileImage: jest.fn((id, url) => Promise.resolve({ id, profile_image_url: url })),
      },
      sermonSeriesModel: {
        getSeriesById: jest.fn().mockResolvedValue({ id: 3, title: 'Romans' }),
        listSeries: jest.fn().mockResolvedValue([]),
        getSeriesWithSermons: jest.fn().mockResolvedValue(undefined),
        createSeries: jest.fn().mockResolvedValue({ id: 3, title: 'Romans' }),
        updateSeries: jest.fn().mockResolvedValue({ id: 3, title: 'Romans' }),
        deleteSeries: jest.fn().mockResolvedValue({ id: 3 }),
      },
      mediaAssetModel: { createMediaAsset: jest.fn().mockResolvedValue({ id: 1 }) },
      auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
    };
    jest.doMock('../../src/services/imageStorage', () => storage);
    jest.doMock('../../src/models/userModel', () => models.userModel);
    jest.doMock('../../src/models/sermonSeriesModel', () => models.sermonSeriesModel);
    jest.doMock('../../src/models/mediaAssetModel', () => models.mediaAssetModel);
    jest.doMock('../../src/models/auditLogModel', () => models.auditLogModel);

    const app = express();
    app.use(express.json());
    app.use('/api/users', require('../../src/routes/userRoutes'));
    app.use('/api/admin/sermon-series', require('../../src/routes/adminSermonSeriesRoutes'));
    app.use(require('../../src/middleware/errorHandler').errorHandler);
    return app;
  };

  beforeEach(() => {
    process.env.CLOUDINARY_CLOUD_NAME = 'demo';
  });

  afterEach(() => {
    if (savedCloud === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
    else process.env.CLOUDINARY_CLOUD_NAME = savedCloud;
  });

  test('a series cover is uploaded from memory as kind "series" and recorded as a media asset', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/api/admin/sermon-series/upload-image')
      .set('Authorization', tokenFor(1, 'admin'))
      .attach('image', Buffer.from('fake-png'), { filename: 'cover.png', contentType: 'image/png' });

    expect(response.status).toBe(200);
    expect(response.body.data.url).toBe(`${CLOUD}/antpresby/series/new123.png`);
    const [file, options] = storage.uploadImage.mock.calls[0];
    expect(Buffer.isBuffer(file.buffer)).toBe(true);
    expect(options).toEqual({ kind: 'series', actorId: 1 });
    expect(models.mediaAssetModel.createMediaAsset).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: 'antpresby/series/new123', url: `${CLOUD}/antpresby/series/new123.png` })
    );
  });

  test('when storage is down the series upload returns 502 and records nothing', async () => {
    const app = buildApp();
    storage.uploadImage.mockRejectedValue(storageFailure());

    const response = await request(app)
      .post('/api/admin/sermon-series/upload-image')
      .set('Authorization', tokenFor(1, 'admin'))
      .attach('image', Buffer.from('fake-png'), { filename: 'cover.png', contentType: 'image/png' });

    expect(response.status).toBe(502);
    expect(models.mediaAssetModel.createMediaAsset).not.toHaveBeenCalled();
  });

  test('a new profile photo replaces the old one, which is deleted after saving', async () => {
    const app = buildApp();
    storage.uploadImage.mockResolvedValue({ url: `${CLOUD}/antpresby/profile/new123.png`, publicId: 'antpresby/profile/new123', fileName: 'x' });

    const response = await request(app)
      .put('/api/users/profile/photo')
      .set('Authorization', tokenFor(7))
      .attach('photo', Buffer.from('fake-png'), { filename: 'me.png', contentType: 'image/png' });

    expect(response.status).toBe(200);
    expect(storage.uploadImage.mock.calls[0][1]).toEqual({ kind: 'profile', actorId: 7 });
    expect(models.userModel.updateUserProfileImage).toHaveBeenCalledWith(7, `${CLOUD}/antpresby/profile/new123.png`);
    expect(storage.deleteImage).toHaveBeenCalledWith(`${CLOUD}/antpresby/profile/old123.png`);
  });

  test('when storage is down the profile photo is left unchanged', async () => {
    const app = buildApp();
    storage.uploadImage.mockRejectedValue(storageFailure());

    const response = await request(app)
      .put('/api/users/profile/photo')
      .set('Authorization', tokenFor(7))
      .attach('photo', Buffer.from('fake-png'), { filename: 'me.png', contentType: 'image/png' });

    expect(response.status).toBe(502);
    expect(models.userModel.updateUserProfileImage).not.toHaveBeenCalled();
    expect(storage.deleteImage).not.toHaveBeenCalled();
  });

  test('a series may use a cover from our Cloudinary series folder', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/api/admin/sermon-series')
      .set('Authorization', tokenFor(1, 'admin'))
      .send({ title: 'Romans', coverImageUrl: `${CLOUD}/antpresby/series/new123.png` });

    expect(response.status).toBe(201);
  });

  test('a cover from someone else\'s Cloudinary cloud is rejected', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/api/admin/sermon-series')
      .set('Authorization', tokenFor(1, 'admin'))
      .send({ title: 'Romans', coverImageUrl: 'https://res.cloudinary.com/evil/image/upload/v1/antpresby/series/x.png' });

    expect(response.status).toBe(400);
    expect(models.sermonSeriesModel.createSeries).not.toHaveBeenCalled();
  });
});
