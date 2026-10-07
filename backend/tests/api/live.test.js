const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createFakeLivePrisma } = require('../helpers/fakeLivePrisma');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const as = (userId, role = 'member') => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET)}`;
const admin = () => as(1, 'admin');

const ID = 'dQw4w9WgXcQ';
const YOUTUBE = `https://www.youtube.com/live/${ID}`;
const FACEBOOK = 'https://www.facebook.com/antpresby/videos/123';
const NOT_LIVE = {
  is_live: false,
  title: null,
  youtube_url: null,
  facebook_url: null,
  youtube_embed_url: null,
  started_at: null,
};

const buildApp = (fake, mocks) => {
  jest.resetModules();
  jest.doMock('../../src/config/prisma', () => fake.prisma);
  jest.doMock('../../src/services/notificationService', () => mocks.notificationService);
  jest.doMock('../../src/models/auditLogModel', () => mocks.auditLogModel);

  const app = express();
  app.use(express.json());
  app.use('/api/live', require('../../src/routes/liveRoutes'));
  app.use('/api/admin/live', require('../../src/routes/adminLiveRoutes'));
  const { errorHandler } = require('../../src/middleware/errorHandler');
  app.use(errorHandler);
  return app;
};

describe('Livestream API', () => {
  let fake;
  let mocks;
  let app;

  const setup = (initialRow = null) => {
    fake = createFakeLivePrisma(initialRow);
    mocks = {
      notificationService: { notifyAll: jest.fn().mockResolvedValue({ inApp: 3, push: 2 }) },
      auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
    };
    app = buildApp(fake, mocks);
  };

  const start = (body, auth = admin()) => request(app).post('/api/admin/live/start').set('Authorization', auth).send(body);
  const end = (auth = admin()) => request(app).post('/api/admin/live/end').set('Authorization', auth).send({});

  beforeEach(() => setup());

  test('GET /api/live with no row yet says not live', async () => {
    const response = await request(app).get('/api/live');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(NOT_LIVE);
  });

  test('only admins can start or end', async () => {
    const anonymous = await request(app).post('/api/admin/live/start').send({ title: 'Sunday Service', youtubeUrl: YOUTUBE });
    const memberStart = await start({ title: 'Sunday Service', youtubeUrl: YOUTUBE }, as(7));
    const memberEnd = await end(as(7));

    expect(anonymous.status).toBe(401);
    expect(memberStart.status).toBe(403);
    expect(memberEnd.status).toBe(403);
    expect(mocks.notificationService.notifyAll).not.toHaveBeenCalled();
  });

  test('going live notifies everyone once, is audited, and returns the embed URL', async () => {
    const response = await start({ title: '  Sunday Service ', youtubeUrl: YOUTUBE, facebookUrl: FACEBOOK });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      is_live: true,
      title: 'Sunday Service',
      youtube_url: YOUTUBE,
      facebook_url: FACEBOOK,
      youtube_embed_url: `https://www.youtube.com/embed/${ID}`,
      notified: true,
    });
    expect(response.body.data.started_at).toEqual(expect.any(String));
    expect(mocks.notificationService.notifyAll).toHaveBeenCalledTimes(1);
    expect(mocks.notificationService.notifyAll).toHaveBeenCalledWith({
      title: "We're live: Sunday Service",
      message: 'Tap to watch the livestream.',
      type: 'live',
      entityType: 'live',
      entityId: null,
    });
    expect(mocks.auditLogModel.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: 1, entityType: 'live', entityId: 1, action: 'start' })
    );

    const state = await request(app).get('/api/live');
    expect(state.body.data).toMatchObject({ is_live: true, title: 'Sunday Service', youtube_url: YOUTUBE });
  });

  test('starting while already live updates the links without notifying again', async () => {
    const startedAt = new Date('2026-10-04T09:00:00Z');
    setup({ isLive: true, title: 'Sunday Service', youtubeUrl: 'https://youtu.be/aaaaaaaaaaa', startedAt });

    const response = await start({ title: 'Sunday Service', youtubeUrl: YOUTUBE });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ youtube_url: YOUTUBE, notified: false, started_at: startedAt.toISOString() });
    expect(mocks.notificationService.notifyAll).not.toHaveBeenCalled();
    expect(mocks.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));
  });

  test('two simultaneous starts send one notification', async () => {
    const body = { title: 'Sunday Service', youtubeUrl: YOUTUBE };

    const [first, second] = await Promise.all([start(body), start(body)]);

    expect([first.status, second.status]).toEqual([200, 200]);
    expect([first.body.data.notified, second.body.data.notified].filter(Boolean)).toHaveLength(1);
    expect(mocks.notificationService.notifyAll).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['a missing title', { youtubeUrl: YOUTUBE }],
    ['a title over 255 characters', { title: 'x'.repeat(256), youtubeUrl: YOUTUBE }],
    ['no link at all', { title: 'Sunday Service' }],
    ['both links blank', { title: 'Sunday Service', youtubeUrl: '  ', facebookUrl: '' }],
    ['a plain-http YouTube link', { title: 'Sunday Service', youtubeUrl: `http://www.youtube.com/watch?v=${ID}` }],
    ['a lookalike YouTube host', { title: 'Sunday Service', youtubeUrl: `https://youtube.com.evil.example/watch?v=${ID}` }],
    ['another site in the YouTube field', { title: 'Sunday Service', youtubeUrl: `https://vimeo.com/${ID}` }],
    ['a YouTube link in the Facebook field', { title: 'Sunday Service', facebookUrl: YOUTUBE }],
    ['a javascript: link', { title: 'Sunday Service', facebookUrl: 'javascript:alert(1)' }],
    ['a link over 500 characters', { title: 'Sunday Service', youtubeUrl: `${YOUTUBE}?x=${'a'.repeat(500)}` }],
  ])('refuses %s with 400 and does not go live', async (_label, body) => {
    const response = await start(body);

    expect(response.status).toBe(400);
    expect(mocks.notificationService.notifyAll).not.toHaveBeenCalled();
    expect(fake.state.row).toBeNull();
  });

  test('a Facebook-only stream goes live with no embed', async () => {
    const response = await start({ title: 'Prayer Night', facebookUrl: 'https://fb.watch/abcDEF123/' });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      is_live: true,
      youtube_url: null,
      facebook_url: 'https://fb.watch/abcDEF123/',
      youtube_embed_url: null,
    });
  });

  test("a channel's live page is accepted but has no embed", async () => {
    const response = await start({ title: 'Sunday Service', youtubeUrl: 'https://www.youtube.com/@antpresby/live' });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      youtube_url: 'https://www.youtube.com/@antpresby/live',
      youtube_embed_url: null,
    });
  });

  test('ending is audited and safe to repeat', async () => {
    setup({ isLive: true, title: 'Sunday Service', youtubeUrl: YOUTUBE, startedAt: new Date() });

    const first = await end();
    const second = await end();

    expect(first.status).toBe(200);
    expect(first.body.data.is_live).toBe(false);
    expect(first.body.message).toBe('Livestream ended');
    expect(second.status).toBe(200);
    expect(second.body.data.is_live).toBe(false);
    expect(mocks.auditLogModel.createAuditLog).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ entityType: 'live', action: 'end', metadata: { wasLive: true } })
    );
    expect(mocks.auditLogModel.createAuditLog).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ entityType: 'live', action: 'end', metadata: { wasLive: false } })
    );
    expect(mocks.notificationService.notifyAll).not.toHaveBeenCalled();
  });

  test('ending before anything was ever started returns not live', async () => {
    const response = await end();

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(NOT_LIVE);
  });

  test('after End the public state hides the old title and links', async () => {
    setup({ isLive: true, title: 'Sunday Service', youtubeUrl: YOUTUBE, facebookUrl: FACEBOOK, startedAt: new Date() });

    await end();
    const response = await request(app).get('/api/live');

    expect(response.body.data).toEqual(NOT_LIVE);
  });
});
