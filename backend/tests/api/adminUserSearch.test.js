const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const admin = () => `Bearer ${jwt.sign({ userId: 1, email: 'a@test.com', role: 'admin' }, process.env.JWT_SECRET)}`;

describe('GET /api/admin/users?search=', () => {
  let userModel;
  let app;

  beforeEach(() => {
    jest.resetModules();
    userModel = {
      getAllUsers: jest.fn().mockResolvedValue([{ id: 2, first_name: 'Ama', password: 'hash' }]),
      countUsers: jest.fn().mockResolvedValue(1),
    };
    jest.doMock('../../src/models/userModel', () => userModel);
    jest.doMock('../../src/models/auditLogModel', () => ({ createAuditLog: jest.fn() }));

    app = express();
    app.use(express.json());
    app.use('/api/admin/users', require('../../src/routes/adminUserRoutes'));
  });

  test('passes a trimmed search term to the model', async () => {
    const response = await request(app).get('/api/admin/users?search=%20Ama%20&limit=5').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(userModel.getAllUsers).toHaveBeenCalledWith(0, 5, 'Ama');
    expect(userModel.countUsers).toHaveBeenCalledWith('Ama');
    expect(response.body.data[0]).not.toHaveProperty('password');
  });

  test('without a search term everyone is listed', async () => {
    await request(app).get('/api/admin/users').set('Authorization', admin());

    expect(userModel.getAllUsers).toHaveBeenCalledWith(0, 10, '');
    expect(userModel.countUsers).toHaveBeenCalledWith('');
  });

  test('an over-long term is capped at 100 characters', async () => {
    await request(app).get(`/api/admin/users?search=${'x'.repeat(300)}`).set('Authorization', admin());

    expect(userModel.getAllUsers.mock.calls[0][2]).toHaveLength(100);
  });
});
