const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
const as = (userId, role) => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET)}`;

describe('requireAttendanceStaff', () => {
  let userModel;
  let app;

  beforeEach(() => {
    jest.resetModules();
    userModel = { getAttendanceAccess: jest.fn() };
    jest.doMock('../../src/models/userModel', () => userModel);
    const { verifyToken } = require('../../src/middleware/authMiddleware');
    const { requireAttendanceStaff } = require('../../src/middleware/attendanceAccess');
    app = express();
    app.get('/staff', verifyToken, requireAttendanceStaff, (req, res) => res.json({ ok: true }));
  });

  test('admins pass without a database lookup', async () => {
    const response = await request(app).get('/staff').set('Authorization', as(1, 'admin'));
    expect(response.status).toBe(200);
    expect(userModel.getAttendanceAccess).not.toHaveBeenCalled();
  });

  test('an active usher passes', async () => {
    userModel.getAttendanceAccess.mockResolvedValue({ role: 'member', is_active: true, can_take_attendance: true });
    const response = await request(app).get('/staff').set('Authorization', as(5, 'member'));
    expect(response.status).toBe(200);
    expect(userModel.getAttendanceAccess).toHaveBeenCalledWith(5);
  });

  test.each([
    ['without the switch', { role: 'member', is_active: true, can_take_attendance: false }],
    ['inactive', { role: 'member', is_active: false, can_take_attendance: true }],
    ['deleted', undefined],
  ])('a member %s gets 403', async (_label, access) => {
    userModel.getAttendanceAccess.mockResolvedValue(access);
    const response = await request(app).get('/staff').set('Authorization', as(5, 'member'));
    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Attendance access required');
  });

  test('switching the usher setting off takes effect on the next request', async () => {
    userModel.getAttendanceAccess
      .mockResolvedValueOnce({ role: 'member', is_active: true, can_take_attendance: true })
      .mockResolvedValueOnce({ role: 'member', is_active: true, can_take_attendance: false });
    expect((await request(app).get('/staff').set('Authorization', as(5, 'member'))).status).toBe(200);
    expect((await request(app).get('/staff').set('Authorization', as(5, 'member'))).status).toBe(403);
  });

  test('no token gets 401', async () => {
    expect((await request(app).get('/staff')).status).toBe(401);
  });
});
