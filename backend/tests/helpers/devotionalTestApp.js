const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const as = (userId, role) => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET)}`;
const admin = () => as(1, 'admin');

const devotional = (overrides = {}) => ({ id: 4, title: 'Psalm 23', publish_date: '2026-10-06', status: 'published', ...overrides });

const buildModels = () => ({
  devotionalModel: {
    getTodayDevotional: jest.fn().mockResolvedValue({ ...devotional(), is_today: true }),
    listPublished: jest.fn().mockResolvedValue([devotional()]),
    countPublished: jest.fn().mockResolvedValue(1),
    getPublishedById: jest.fn().mockResolvedValue(devotional()),
    listAll: jest.fn().mockResolvedValue([]),
    getById: jest.fn().mockResolvedValue(devotional()),
    createDevotional: jest.fn().mockResolvedValue(devotional({ status: 'draft' })),
    updateDevotional: jest.fn().mockResolvedValue(devotional()),
    deleteDevotional: jest.fn().mockResolvedValue(1),
    publish: jest.fn().mockResolvedValue(devotional()),
    claimNotification: jest.fn().mockResolvedValue(true),
  },
  notificationService: { notify: jest.fn(), notifyAll: jest.fn().mockResolvedValue({ inApp: 40, push: 0 }) },
  auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
  dates: { getChurchToday: jest.fn().mockReturnValue('2026-10-06'), dateOnly: (d) => new Date(`${d}T00:00:00.000Z`) },
});

const buildApp = (models) => {
  jest.resetModules();
  jest.doMock('../../src/models/devotionalModel', () => models.devotionalModel);
  jest.doMock('../../src/services/notificationService', () => models.notificationService);
  jest.doMock('../../src/models/auditLogModel', () => models.auditLogModel);
  jest.doMock('../../src/utils/dates', () => models.dates);

  const app = express();
  app.use(express.json());
  app.use('/api/devotionals', require('../../src/routes/devotionalRoutes'));
  const adminRoutesPath = '../../src/routes/adminDevotionalRoutes';
  try {
    app.use('/api/admin/devotionals', require(adminRoutesPath));
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
  }
  const { errorHandler } = require('../../src/middleware/errorHandler');
  app.use(errorHandler);
  return app;
};

module.exports = { buildModels, buildApp, as, admin, devotional };
