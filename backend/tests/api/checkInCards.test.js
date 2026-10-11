const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
const as = (userId, role) => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET)}`;

describe('check-in cards and the usher switch', () => {
  let userModel;
  let auditLogModel;
  let app;

  beforeEach(() => {
    jest.resetModules();
    userModel = {
      findUserById: jest.fn().mockResolvedValue({ id: 5, role: 'member' }),
      setCanTakeAttendance: jest.fn().mockResolvedValue({ id: 5, role: 'member', can_take_attendance: true }),
      resetCheckInCode: jest.fn().mockResolvedValue('NEWCODE000'),
      getOrCreateCheckInCode: jest.fn().mockResolvedValue('ABCDEFGHJK'),
      listCheckInCards: jest.fn().mockResolvedValue([{ id: 5, code: 'ABCDEFGHJK' }]),
    };
    auditLogModel = { createAuditLog: jest.fn().mockResolvedValue({}) };
    jest.doMock('../../src/models/userModel', () => userModel);
    jest.doMock('../../src/models/auditLogModel', () => auditLogModel);
    jest.doMock('../../src/services/imageStorage', () => ({}));
    app = express();
    app.use(express.json());
    app.use('/api/admin/users', require('../../src/routes/adminUserRoutes'));
    app.use('/api/users', require('../../src/routes/userRoutes'));
  });

  test('a member gets their own card', async () => {
    const response = await request(app).get('/api/users/me/check-in-card').set('Authorization', as(5, 'member'));
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ code: 'ABCDEFGHJK', qr_text: 'antpresby:member:ABCDEFGHJK' });
    expect(userModel.getOrCreateCheckInCode).toHaveBeenCalledWith(5);
  });

  test('admin turns the usher switch on and it is audited', async () => {
    const response = await request(app).put('/api/admin/users/5/usher').set('Authorization', as(1, 'admin')).send({ enabled: true });
    expect(response.status).toBe(200);
    expect(userModel.setCanTakeAttendance).toHaveBeenCalledWith(5, true);
    expect(auditLogModel.createAuditLog.mock.calls[0][0]).toMatchObject({ entityType: 'user', entityId: 5, action: 'usher_enabled' });
  });

  test('turning it off audits usher_disabled', async () => {
    userModel.setCanTakeAttendance.mockResolvedValue({ id: 5, can_take_attendance: false });
    await request(app).put('/api/admin/users/5/usher').set('Authorization', as(1, 'admin')).send({ enabled: false });
    expect(auditLogModel.createAuditLog.mock.calls[0][0].action).toBe('usher_disabled');
  });

  test.each([[{}], [{ enabled: 'yes' }]])('rejects body %p with 400', async (body) => {
    expect((await request(app).put('/api/admin/users/5/usher').set('Authorization', as(1, 'admin')).send(body)).status).toBe(400);
  });

  test('admins cannot be given the usher switch (including yourself)', async () => {
    userModel.findUserById.mockResolvedValue({ id: 1, role: 'admin' });
    const response = await request(app).put('/api/admin/users/1/usher').set('Authorization', as(1, 'admin')).send({ enabled: true });
    expect(response.status).toBe(400);
    expect(userModel.setCanTakeAttendance).not.toHaveBeenCalled();
  });

  test('a missing user returns 404', async () => {
    userModel.findUserById.mockResolvedValue(undefined);
    expect((await request(app).put('/api/admin/users/9/usher').set('Authorization', as(1, 'admin')).send({ enabled: true })).status).toBe(404);
  });

  test('admin resets a card and it is audited', async () => {
    const response = await request(app).post('/api/admin/users/5/check-in-card/reset').set('Authorization', as(1, 'admin'));
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ code: 'NEWCODE000', qr_text: 'antpresby:member:NEWCODE000' });
    expect(auditLogModel.createAuditLog.mock.calls[0][0].action).toBe('check_in_card_reset');
  });

  test('admin lists cards for selected ids', async () => {
    const response = await request(app).get('/api/admin/users/check-in-cards?ids=5,6,x').set('Authorization', as(1, 'admin'));
    expect(response.status).toBe(200);
    expect(userModel.listCheckInCards).toHaveBeenCalledWith([5, 6]);
  });

  test('admin lists all cards without ids', async () => {
    await request(app).get('/api/admin/users/check-in-cards').set('Authorization', as(1, 'admin'));
    expect(userModel.listCheckInCards).toHaveBeenCalledWith(undefined);
  });

  test('members cannot manage cards', async () => {
    expect((await request(app).post('/api/admin/users/5/check-in-card/reset').set('Authorization', as(5, 'member'))).status).toBe(403);
  });
});
