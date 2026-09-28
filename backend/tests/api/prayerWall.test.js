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
