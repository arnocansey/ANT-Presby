const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const tokenFor = (userId, role = 'member') =>
  jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET, { expiresIn: '10m' });
const admin = () => `Bearer ${tokenFor(1, 'admin')}`;

const buildModels = () => ({
  sermonModel: {
    createSermon: jest.fn().mockResolvedValue({ id: 5 }),
    getAllSermons: jest.fn().mockResolvedValue([]),
    countSermons: jest.fn().mockResolvedValue(0),
    getSermonById: jest.fn().mockResolvedValue({ id: 5 }),
    updateSermon: jest.fn().mockResolvedValue({ id: 5 }),
    deleteSermon: jest.fn().mockResolvedValue({ id: 5 }),
    getRecentSermons: jest.fn().mockResolvedValue([]),
    searchSermons: jest.fn().mockResolvedValue([]),
  },
  sermonSeriesModel: {
    getSeriesById: jest.fn().mockResolvedValue({ id: 3, title: 'Romans' }),
    listSeries: jest.fn().mockResolvedValue([]),
    getSeriesWithSermons: jest.fn().mockResolvedValue(undefined),
    createSeries: jest.fn().mockResolvedValue({ id: 3, title: 'Romans' }),
    updateSeries: jest.fn().mockResolvedValue({ id: 3, title: 'Romans' }),
    deleteSeries: jest.fn().mockResolvedValue({ id: 3 }),
  },
  auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
  mediaAssetModel: { createMediaAsset: jest.fn().mockResolvedValue({ id: 1, url: '/uploads/series-images/x.png' }) },
});

const buildApp = (models) => {
  jest.resetModules();
  jest.doMock('../../src/models/sermonModel', () => models.sermonModel);
  jest.doMock('../../src/models/sermonSeriesModel', () => models.sermonSeriesModel);
  jest.doMock('../../src/models/auditLogModel', () => models.auditLogModel);
  jest.doMock('../../src/models/mediaAssetModel', () => models.mediaAssetModel);

  const app = express();
  app.use(express.json());
  app.use('/api/sermons', require('../../src/routes/sermonRoutes'));
  app.use('/api/admin/sermons', require('../../src/routes/adminSermonRoutes'));
  app.use('/api/sermon-series', require('../../src/routes/sermonSeriesRoutes'));
  app.use('/api/admin/sermon-series', require('../../src/routes/adminSermonSeriesRoutes'));
  const { errorHandler } = require('../../src/middleware/errorHandler');
  app.use(errorHandler);
  return app;
};

const sermonBody = {
  title: 'Grace',
  speaker: 'Rev. Ofori',
  description: 'On grace',
  videoUrl: 'https://youtube.com/watch?v=abc',
  sermonDate: '2026-09-20',
  ministryId: 1,
};

describe('Linking sermons to series', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('creating a sermon with an existing series passes seriesId to the model', async () => {
    const response = await request(app)
      .post('/api/admin/sermons')
      .set('Authorization', admin())
      .send({ ...sermonBody, seriesId: 3 });

    expect(response.status).toBe(201);
    expect(models.sermonSeriesModel.getSeriesById).toHaveBeenCalledWith(3);
    expect(models.sermonModel.createSermon).toHaveBeenCalledWith(
      'Grace',
      'Rev. Ofori',
      'On grace',
      'https://youtube.com/watch?v=abc',
      '2026-09-20',
      1,
      3
    );
  });

  test('creating a sermon with a missing series returns 400 and creates nothing', async () => {
    models.sermonSeriesModel.getSeriesById.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/admin/sermons')
      .set('Authorization', admin())
      .send({ ...sermonBody, seriesId: 99 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Sermon series not found');
    expect(models.sermonModel.createSermon).not.toHaveBeenCalled();
  });

  test('creating a sermon without a series stores null', async () => {
    await request(app).post('/api/admin/sermons').set('Authorization', admin()).send(sermonBody);

    expect(models.sermonSeriesModel.getSeriesById).not.toHaveBeenCalled();
    expect(models.sermonModel.createSermon.mock.calls[0][6]).toBeNull();
  });

  test('updating with seriesId null clears the series without a lookup', async () => {
    const response = await request(app)
      .put('/api/admin/sermons/5')
      .set('Authorization', admin())
      .send({ seriesId: null });

    expect(response.status).toBe(200);
    expect(models.sermonSeriesModel.getSeriesById).not.toHaveBeenCalled();
    expect(models.sermonModel.updateSermon).toHaveBeenCalledWith('5', { seriesId: null });
  });

  test('updating with a missing series returns 400', async () => {
    models.sermonSeriesModel.getSeriesById.mockResolvedValue(undefined);

    const response = await request(app)
      .put('/api/admin/sermons/5')
      .set('Authorization', admin())
      .send({ seriesId: 42 });

    expect(response.status).toBe(400);
    expect(models.sermonModel.updateSermon).not.toHaveBeenCalled();
  });

  test('a non-integer seriesId is rejected by validation', async () => {
    const response = await request(app)
      .put('/api/admin/sermons/5')
      .set('Authorization', admin())
      .send({ seriesId: 'abc' });

    expect(response.status).toBe(400);
    expect(models.sermonModel.updateSermon).not.toHaveBeenCalled();
  });

  test('GET /api/sermons?series_id filters by series', async () => {
    const response = await request(app).get('/api/sermons?series_id=3');

    expect(response.status).toBe(200);
    expect(models.sermonModel.getAllSermons).toHaveBeenCalledWith(0, 10, { seriesId: 3 });
    expect(models.sermonModel.countSermons).toHaveBeenCalledWith({ seriesId: 3 });
  });

  test('GET /api/sermons?series_id=abc returns 400', async () => {
    const response = await request(app).get('/api/sermons?series_id=abc');

    expect(response.status).toBe(400);
    expect(models.sermonModel.getAllSermons).not.toHaveBeenCalled();
  });
});

describe('Public sermon series API', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('GET /api/sermon-series lists series', async () => {
    models.sermonSeriesModel.listSeries.mockResolvedValue([{ id: 3, title: 'Romans', sermon_count: 4 }]);

    const response = await request(app).get('/api/sermon-series');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ id: 3, title: 'Romans', sermon_count: 4 }]);
  });

  test('GET /api/sermon-series/:id returns the series with its sermons', async () => {
    models.sermonSeriesModel.getSeriesWithSermons.mockResolvedValue({ id: 3, title: 'Romans', sermons: [{ id: 5 }] });

    const response = await request(app).get('/api/sermon-series/3');

    expect(response.status).toBe(200);
    expect(models.sermonSeriesModel.getSeriesWithSermons).toHaveBeenCalledWith(3);
    expect(response.body.data.sermons).toHaveLength(1);
  });

  test('GET /api/sermon-series/:id returns 404 for a missing series', async () => {
    const response = await request(app).get('/api/sermon-series/99');
    expect(response.status).toBe(404);
  });

  test('GET /api/sermon-series/:id returns 404 for a malformed id without querying', async () => {
    const response = await request(app).get('/api/sermon-series/abc');

    expect(response.status).toBe(404);
    expect(models.sermonSeriesModel.getSeriesWithSermons).not.toHaveBeenCalled();
  });
});

describe('Sermon series routes are mounted in the server', () => {
  test('GET /api/sermon-series is served by the real app', async () => {
    const models = buildModels();
    models.sermonSeriesModel.listSeries.mockResolvedValue([]);
    jest.resetModules();
    jest.doMock('../../src/models/sermonSeriesModel', () => models.sermonSeriesModel);
    const server = require('../../src/server');

    const response = await request(server).get('/api/sermon-series');

    expect(response.status).toBe(200);
    expect(models.sermonSeriesModel.listSeries).toHaveBeenCalled();
  });
});

describe('Admin sermon series API', () => {
  let models;
  let app;
  const validSeries = { title: 'Romans', description: 'Verse by verse', startDate: '2026-09-01', endDate: '2026-11-30' };

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('members cannot manage series', async () => {
    const response = await request(app)
      .post('/api/admin/sermon-series')
      .set('Authorization', `Bearer ${tokenFor(7)}`)
      .send(validSeries);

    expect(response.status).toBe(403);
    expect(models.sermonSeriesModel.createSeries).not.toHaveBeenCalled();
  });

  test('an admin creates a series and it is audited', async () => {
    const response = await request(app).post('/api/admin/sermon-series').set('Authorization', admin()).send(validSeries);

    expect(response.status).toBe(201);
    expect(models.sermonSeriesModel.createSeries).toHaveBeenCalledWith(expect.objectContaining({ title: 'Romans' }));
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'sermon_series', action: 'create', entityId: 3, actorUserId: 1 })
    );
  });

  test('a missing title is rejected', async () => {
    const response = await request(app)
      .post('/api/admin/sermon-series')
      .set('Authorization', admin())
      .send({ ...validSeries, title: '   ' });

    expect(response.status).toBe(400);
  });

  test('an end date before the start date is rejected', async () => {
    const response = await request(app)
      .post('/api/admin/sermon-series')
      .set('Authorization', admin())
      .send({ ...validSeries, startDate: '2026-11-30', endDate: '2026-09-01' });

    expect(response.status).toBe(400);
    expect(models.sermonSeriesModel.createSeries).not.toHaveBeenCalled();
  });

  test.each(['https://evil.example/x.png', 'javascript:alert(1)', '/uploads/profile-images/user-1.png', '/uploads/series-images/../x'])(
    'a cover image outside our series uploads is rejected: %s',
    async (coverImageUrl) => {
      const response = await request(app)
        .post('/api/admin/sermon-series')
        .set('Authorization', admin())
        .send({ ...validSeries, coverImageUrl });

      expect(response.status).toBe(400);
    }
  );

  test('an uploaded series cover is accepted', async () => {
    const response = await request(app)
      .post('/api/admin/sermon-series')
      .set('Authorization', admin())
      .send({ ...validSeries, coverImageUrl: '/uploads/series-images/series-1-123.png' });

    expect(response.status).toBe(201);
  });

  test('a duplicate title returns 409', async () => {
    models.sermonSeriesModel.createSeries.mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }));

    const response = await request(app).post('/api/admin/sermon-series').set('Authorization', admin()).send(validSeries);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('A series with this title already exists');
  });

  test('renaming to a duplicate title returns 409', async () => {
    models.sermonSeriesModel.updateSeries.mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }));

    const response = await request(app).put('/api/admin/sermon-series/3').set('Authorization', admin()).send(validSeries);

    expect(response.status).toBe(409);
  });

  test('updating a series is audited', async () => {
    const response = await request(app).put('/api/admin/sermon-series/3').set('Authorization', admin()).send(validSeries);

    expect(response.status).toBe(200);
    expect(models.sermonSeriesModel.updateSeries).toHaveBeenCalledWith(3, expect.objectContaining({ title: 'Romans' }));
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));
  });

  test('updating a missing series returns 404', async () => {
    models.sermonSeriesModel.updateSeries.mockResolvedValue(undefined);

    const response = await request(app).put('/api/admin/sermon-series/99').set('Authorization', admin()).send(validSeries);

    expect(response.status).toBe(404);
  });

  test('malformed ids return 404 without querying', async () => {
    const put = await request(app).put('/api/admin/sermon-series/1.5').set('Authorization', admin()).send(validSeries);
    const del = await request(app).delete('/api/admin/sermon-series/abc').set('Authorization', admin());

    expect(put.status).toBe(404);
    expect(del.status).toBe(404);
    expect(models.sermonSeriesModel.updateSeries).not.toHaveBeenCalled();
    expect(models.sermonSeriesModel.deleteSeries).not.toHaveBeenCalled();
  });

  test('deleting a series is audited', async () => {
    const response = await request(app).delete('/api/admin/sermon-series/3').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(models.sermonSeriesModel.deleteSeries).toHaveBeenCalledWith(3);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete' }));
  });

  test('deleting a missing series returns 404', async () => {
    models.sermonSeriesModel.deleteSeries.mockResolvedValue(undefined);

    const response = await request(app).delete('/api/admin/sermon-series/99').set('Authorization', admin());

    expect(response.status).toBe(404);
  });

  test('uploading without a file returns 400', async () => {
    const response = await request(app).post('/api/admin/sermon-series/upload-image').set('Authorization', admin());

    expect(response.status).toBe(400);
  });

  test('uploading a cover stores it under series-images and returns its url', async () => {
    const response = await request(app)
      .post('/api/admin/sermon-series/upload-image')
      .set('Authorization', admin())
      .attach('image', Buffer.from('fake-png-bytes'), { filename: 'cover.html', contentType: 'image/png' });

    expect(response.status).toBe(200);
    expect(response.body.data.url).toMatch(/^\/uploads\/series-images\/series-1-\d+\.png$/);
    fs.rmSync(path.join(__dirname, '..', '..', response.body.data.url), { force: true });
  });
});
