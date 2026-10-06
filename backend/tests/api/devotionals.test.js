const request = require('supertest');
const { buildModels, buildApp } = require('../helpers/devotionalTestApp');

describe('Public devotionals API', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test("GET /today returns today's devotional using the church date", async () => {
    const response = await request(app).get('/api/devotionals/today');

    expect(response.status).toBe(200);
    expect(models.devotionalModel.getTodayDevotional).toHaveBeenCalledWith('2026-10-06');
    expect(response.body.data.is_today).toBe(true);
  });

  test('GET /today returns null data (not an error) when nothing is published', async () => {
    models.devotionalModel.getTodayDevotional.mockResolvedValue(null);

    const response = await request(app).get('/api/devotionals/today');

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
  });

  test('GET / lists the archive up to today with pagination', async () => {
    const response = await request(app).get('/api/devotionals?page=1&limit=5');

    expect(response.status).toBe(200);
    expect(models.devotionalModel.listPublished).toHaveBeenCalledWith({ offset: 0, limit: 5, today: '2026-10-06' });
    expect(models.devotionalModel.countPublished).toHaveBeenCalledWith('2026-10-06');
    expect(response.body.meta.total).toBe(1);
  });

  test('GET /:id returns a published devotional', async () => {
    const response = await request(app).get('/api/devotionals/4');

    expect(response.status).toBe(200);
    expect(models.devotionalModel.getPublishedById).toHaveBeenCalledWith(4, '2026-10-06');
  });

  test('GET /:id returns 404 for a draft or future devotional (model finds nothing)', async () => {
    models.devotionalModel.getPublishedById.mockResolvedValue(undefined);
    const response = await request(app).get('/api/devotionals/5');
    expect(response.status).toBe(404);
  });

  test('GET /:id returns 404 for a malformed id without querying', async () => {
    const response = await request(app).get('/api/devotionals/abc');

    expect(response.status).toBe(404);
    expect(models.devotionalModel.getPublishedById).not.toHaveBeenCalled();
  });

  test('/today is not swallowed by /:id', async () => {
    await request(app).get('/api/devotionals/today');
    expect(models.devotionalModel.getPublishedById).not.toHaveBeenCalled();
  });
});
