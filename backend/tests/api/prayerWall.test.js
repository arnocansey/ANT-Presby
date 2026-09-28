const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const tokenFor = (userId, role = 'member') =>
  jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET, { expiresIn: '10m' });

describe('Prayer requests and prayer wall', () => {
  let app;
  let prayerRequestModel;
  let notificationService;

  beforeEach(() => {
    jest.resetModules();

    prayerRequestModel = {
      createPrayerRequest: jest.fn().mockResolvedValue({ id: 1 }),
      getAllPrayerRequests: jest.fn().mockResolvedValue([]),
      countPrayerRequests: jest.fn().mockResolvedValue(0),
      getPrayerRequestById: jest.fn(),
      getUserPrayerRequests: jest.fn().mockResolvedValue([]),
      updatePrayerRequestStatus: jest.fn().mockResolvedValue({ id: 1 }),
      updatePrayerRequest: jest.fn().mockResolvedValue({ id: 1 }),
      deletePrayerRequest: jest.fn().mockResolvedValue({ id: 1 }),
      getPrayerStatistics: jest.fn().mockResolvedValue({}),
      getWallPrayerRequests: jest.fn().mockResolvedValue([]),
      countWallPrayerRequests: jest.fn().mockResolvedValue(0),
      recordIntercession: jest.fn(),
    };
    notificationService = {
      notify: jest.fn().mockResolvedValue({ inApp: 1, push: 0 }),
      notifyAll: jest.fn().mockResolvedValue({ inApp: 0, push: 0 }),
    };

    jest.doMock('../../src/models/prayerRequestModel', () => prayerRequestModel);
    jest.doMock('../../src/services/notificationService', () => notificationService);

    const prayerRoutes = require('../../src/routes/prayerRequestRoutes');
    const { errorHandler } = require('../../src/middleware/errorHandler');

    app = express();
    app.use(express.json());
    app.use('/api/prayers', prayerRoutes);
    app.use(errorHandler);
  });

  describe('GET /api/prayers/:id', () => {
    test("returns 404 for another member's request", async () => {
      prayerRequestModel.getPrayerRequestById.mockResolvedValue({ id: 9, user_id: 99, title: 'Private' });

      const response = await request(app)
        .get('/api/prayers/9')
        .set('Authorization', `Bearer ${tokenFor(7)}`);

      expect(response.status).toBe(404);
    });

    test('returns the request to its owner', async () => {
      prayerRequestModel.getPrayerRequestById.mockResolvedValue({ id: 9, user_id: 7, title: 'Mine' });

      const response = await request(app)
        .get('/api/prayers/9')
        .set('Authorization', `Bearer ${tokenFor(7)}`);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Mine');
    });

    test('returns any request to an admin', async () => {
      prayerRequestModel.getPrayerRequestById.mockResolvedValue({ id: 9, user_id: 99, title: 'Private' });

      const response = await request(app)
        .get('/api/prayers/9')
        .set('Authorization', `Bearer ${tokenFor(1, 'admin')}`);

      expect(response.status).toBe(200);
    });

    test('returns 404 for a malformed id without querying the database', async () => {
      const response = await request(app)
        .get('/api/prayers/abc')
        .set('Authorization', `Bearer ${tokenFor(7)}`);

      expect(response.status).toBe(404);
      expect(prayerRequestModel.getPrayerRequestById).not.toHaveBeenCalled();
    });
  });

  describe('sharing on the wall', () => {
    const validBody = {
      title: 'Healing',
      description: 'Please pray for my mother',
      category: 'health',
    };

    test('create passes shareOnWall to the model', async () => {
      const response = await request(app)
        .post('/api/prayers')
        .set('Authorization', `Bearer ${tokenFor(7)}`)
        .send({ ...validBody, shareOnWall: true });

      expect(response.status).toBe(201);
      expect(prayerRequestModel.createPrayerRequest).toHaveBeenCalledWith(
        7,
        'Healing',
        'Please pray for my mother',
        'health',
        false,
        true
      );
    });

    test('create rejects a non-boolean shareOnWall', async () => {
      const response = await request(app)
        .post('/api/prayers')
        .set('Authorization', `Bearer ${tokenFor(7)}`)
        .send({ ...validBody, shareOnWall: 'yes please' });

      expect(response.status).toBe(400);
    });

    test('an owner editing the text of an approved request sends it back to pending', async () => {
      prayerRequestModel.getPrayerRequestById.mockResolvedValue({
        id: 9,
        user_id: 7,
        status: 'approved',
        ...validBody,
      });

      await request(app)
        .put('/api/prayers/9')
        .set('Authorization', `Bearer ${tokenFor(7)}`)
        .send({ ...validBody, description: 'Something new that nobody reviewed' });

      expect(prayerRequestModel.updatePrayerRequest).toHaveBeenCalledWith(
        9,
        expect.objectContaining({ status: 'pending' })
      );
    });

    test('an owner only toggling shareOnWall keeps the approval', async () => {
      prayerRequestModel.getPrayerRequestById.mockResolvedValue({
        id: 9,
        user_id: 7,
        status: 'approved',
        ...validBody,
      });

      await request(app)
        .put('/api/prayers/9')
        .set('Authorization', `Bearer ${tokenFor(7)}`)
        .send({ ...validBody, shareOnWall: true });

      const updates = prayerRequestModel.updatePrayerRequest.mock.calls[0][1];
      expect(updates.shareOnWall).toBe(true);
      expect(updates.status).toBeUndefined();
    });

    test('an admin editing text keeps the status', async () => {
      prayerRequestModel.getPrayerRequestById.mockResolvedValue({
        id: 9,
        user_id: 7,
        status: 'approved',
        ...validBody,
      });

      await request(app)
        .put('/api/prayers/9')
        .set('Authorization', `Bearer ${tokenFor(1, 'admin')}`)
        .send({ ...validBody, description: 'Typo fixed by admin' });

      const updates = prayerRequestModel.updatePrayerRequest.mock.calls[0][1];
      expect(updates.status).toBeUndefined();
    });
  });

  describe('GET /api/prayers/wall', () => {
    test('requires sign-in', async () => {
      const response = await request(app).get('/api/prayers/wall');
      expect(response.status).toBe(401);
    });

    test('returns the wall for the viewer with pagination meta', async () => {
      prayerRequestModel.getWallPrayerRequests.mockResolvedValue([{ id: 3, requester_name: 'A church member' }]);
      prayerRequestModel.countWallPrayerRequests.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/prayers/wall?category=health')
        .set('Authorization', `Bearer ${tokenFor(7)}`);

      expect(response.status).toBe(200);
      expect(prayerRequestModel.getWallPrayerRequests).toHaveBeenCalledWith({
        offset: 0,
        limit: 10,
        category: 'health',
        viewerUserId: 7,
      });
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.total).toBe(1);
    });

    test('rejects an unknown category', async () => {
      const response = await request(app)
        .get('/api/prayers/wall?category=gossip')
        .set('Authorization', `Bearer ${tokenFor(7)}`);

      expect(response.status).toBe(400);
      expect(prayerRequestModel.getWallPrayerRequests).not.toHaveBeenCalled();
    });

    test('is not swallowed by the /:id route', async () => {
      await request(app).get('/api/prayers/wall').set('Authorization', `Bearer ${tokenFor(7)}`);
      expect(prayerRequestModel.getPrayerRequestById).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/prayers/:id/pray', () => {
    const pray = (id, userId = 7) =>
      request(app).post(`/api/prayers/${id}/pray`).set('Authorization', `Bearer ${tokenFor(userId)}`);

    test('requires sign-in', async () => {
      const response = await request(app).post('/api/prayers/3/pray');
      expect(response.status).toBe(401);
    });

    test('returns 404 for a malformed id without touching the database', async () => {
      for (const badId of ['abc', '1.5', '0', '-2']) {
        const response = await pray(badId);
        expect(response.status).toBe(404);
      }
      expect(prayerRequestModel.recordIntercession).not.toHaveBeenCalled();
    });

    test('returns 404 when the request is not on the wall', async () => {
      prayerRequestModel.recordIntercession.mockResolvedValue(null);
      const response = await pray(3);
      expect(response.status).toBe(404);
    });

    test('records the prayer and notifies the requester at a milestone', async () => {
      prayerRequestModel.recordIntercession.mockResolvedValue({
        request: { id: 3, userId: 42, title: 'Job interview' },
        prayerCount: 1,
        created: true,
      });

      const response = await pray(3);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ prayer_count: 1, prayed_by_me: true });
      expect(prayerRequestModel.recordIntercession).toHaveBeenCalledWith({ prayerRequestId: 3, userId: 7 });
      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userIds: [42], type: 'prayer', entityType: 'prayer', entityId: 3 })
      );
    });

    test('does not notify between milestones', async () => {
      prayerRequestModel.recordIntercession.mockResolvedValue({
        request: { id: 3, userId: 42, title: 'Job interview' },
        prayerCount: 2,
        created: true,
      });

      await pray(3);
      expect(notificationService.notify).not.toHaveBeenCalled();
    });

    test('a repeat prayer returns the current count and never notifies', async () => {
      prayerRequestModel.recordIntercession.mockResolvedValue({
        request: { id: 3, userId: 42, title: 'Job interview' },
        prayerCount: 5,
        created: false,
      });

      const response = await pray(3);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ prayer_count: 5, prayed_by_me: true });
      expect(notificationService.notify).not.toHaveBeenCalled();
    });

    test('praying for your own request never notifies yourself', async () => {
      prayerRequestModel.recordIntercession.mockResolvedValue({
        request: { id: 3, userId: 7, title: 'Mine' },
        prayerCount: 1,
        created: true,
      });

      await pray(3, 7);
      expect(notificationService.notify).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/prayers/:id/approve', () => {
    test('notifies the requester through the notification service', async () => {
      prayerRequestModel.getPrayerRequestById.mockResolvedValue({ id: 9, user_id: 42, title: 'Healing' });

      const response = await request(app)
        .post('/api/prayers/9/approve')
        .set('Authorization', `Bearer ${tokenFor(1, 'admin')}`);

      expect(response.status).toBe(200);
      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userIds: [42], type: 'prayer', entityType: 'prayer', entityId: 9 })
      );
    });
  });
});
