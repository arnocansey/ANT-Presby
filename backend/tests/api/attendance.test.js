const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const tokenFor = (userId, role) => jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET);
const admin = () => `Bearer ${tokenFor(1, 'admin')}`;
const usher = () => `Bearer ${tokenFor(5, 'member')}`;

const buildModels = () => ({
  attendanceModel: {
    getEventAttendance: jest.fn().mockResolvedValue({ event: { id: 7 }, totals: { total: 0 } }),
    findEventForCheckIn: jest.fn().mockResolvedValue({ id: 7, status: 'active' }),
    checkInMember: jest.fn().mockResolvedValue({ record: { id: 20, user_id: 2 }, created: true }),
    checkInGuest: jest.fn().mockResolvedValue({ id: 21, guest_name: 'Visitor Esi' }),
    deleteRecord: jest.fn().mockResolvedValue({ id: 20, event_id: 7 }),
    getAttendanceSummary: jest.fn().mockResolvedValue([]),
    listCheckInEvents: jest.fn().mockResolvedValue([]),
    searchCheckInEvents: jest.fn().mockResolvedValue([]),
    adjustHeadcount: jest.fn().mockResolvedValue({ adults: 1, children: 0 }),
  },
  userModel: {
    findUserById: jest.fn().mockResolvedValue({ id: 2, first_name: 'Ama', last_name: 'Mensah', is_active: true }),
    getAttendanceAccess: jest.fn().mockResolvedValue({ role: 'member', is_active: true, can_take_attendance: true }),
    findMemberByCheckInCode: jest.fn().mockResolvedValue({ id: 2, first_name: 'Ama', last_name: 'Mensah', is_active: true }),
    searchActiveMembers: jest.fn().mockResolvedValue([{ id: 2, first_name: 'Ama', last_name: 'Mensah', email: 'a@t.com' }]),
  },
  auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
});

const buildApp = (models) => {
  jest.resetModules();
  jest.doMock('../../src/models/attendanceModel', () => models.attendanceModel);
  jest.doMock('../../src/models/userModel', () => models.userModel);
  jest.doMock('../../src/models/auditLogModel', () => models.auditLogModel);

  const app = express();
  app.use(express.json());
  app.use('/api/attendance', require('../../src/routes/attendanceRoutes'));
  app.use('/api/admin/attendance', require('../../src/routes/adminAttendanceRoutes'));
  const { errorHandler } = require('../../src/middleware/errorHandler');
  app.use(errorHandler);
  return app;
};

describe('Staff attendance API', () => {
  let models;
  let app;
  const checkIn = (body, eventId = 7, auth = admin()) =>
    request(app).post(`/api/attendance/events/${eventId}/check-in`).set('Authorization', auth).send(body);
  const headcount = (body, eventId = 7, auth = usher()) =>
    request(app).post(`/api/attendance/events/${eventId}/headcount`).set('Authorization', auth).send(body);

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('members without the usher switch cannot use attendance', async () => {
    models.userModel.getAttendanceAccess.mockResolvedValue({ role: 'member', is_active: true, can_take_attendance: false });
    const response = await request(app).get('/api/attendance/events/7').set('Authorization', usher());
    expect(response.status).toBe(403);
  });

  test('an usher can open a sheet', async () => {
    const response = await request(app).get('/api/attendance/events/7').set('Authorization', usher());
    expect(response.status).toBe(200);
    expect(models.attendanceModel.getEventAttendance).toHaveBeenCalledWith(7);
  });

  test('an usher cannot use the admin summary', async () => {
    const response = await request(app).get('/api/admin/attendance/summary').set('Authorization', usher());
    expect(response.status).toBe(403);
  });

  test('the old admin check-in route is gone', async () => {
    const response = await request(app).post('/api/admin/attendance/events/7/check-in').set('Authorization', admin()).send({ guestName: 'X' });
    expect(response.status).toBe(404);
  });

  describe('GET /events', () => {
    test('without q lists the two-week window', async () => {
      await request(app).get('/api/attendance/events').set('Authorization', usher());
      expect(models.attendanceModel.listCheckInEvents).toHaveBeenCalled();
      expect(models.attendanceModel.searchCheckInEvents).not.toHaveBeenCalled();
    });

    test('with q searches all past events', async () => {
      await request(app).get('/api/attendance/events?q=%20harvest%20').set('Authorization', usher());
      const args = models.attendanceModel.searchCheckInEvents.mock.calls[0][0];
      expect(args.q).toBe('harvest');
      expect(args.to.getTime()).toBeGreaterThan(Date.now());
    });

    test('a one-letter q falls back to the window', async () => {
      await request(app).get('/api/attendance/events?q=h').set('Authorization', usher());
      expect(models.attendanceModel.searchCheckInEvents).not.toHaveBeenCalled();
    });
  });

  describe('GET /events/:eventId', () => {
    test('a missing event returns 404', async () => {
      models.attendanceModel.getEventAttendance.mockResolvedValue(undefined);
      expect((await request(app).get('/api/attendance/events/99').set('Authorization', admin())).status).toBe(404);
    });

    test('a malformed id returns 404 without querying', async () => {
      expect((await request(app).get('/api/attendance/events/abc').set('Authorization', admin())).status).toBe(404);
      expect(models.attendanceModel.getEventAttendance).not.toHaveBeenCalled();
    });
  });

  describe('POST /events/:eventId/check-in', () => {
    test('checks a member in by id with 201, names them and audits it', async () => {
      const response = await checkIn({ userId: 2 });
      expect(response.status).toBe(201);
      expect(response.body.data.member).toEqual({ first_name: 'Ama', last_name: 'Mensah' });
      expect(models.attendanceModel.checkInMember).toHaveBeenCalledWith({ eventId: 7, userId: 2, checkedInBy: 1 });
      expect(models.auditLogModel.createAuditLog).toHaveBeenCalled();
    });

    test('records which usher checked someone in', async () => {
      await checkIn({ userId: 2 }, 7, usher());
      expect(models.attendanceModel.checkInMember).toHaveBeenCalledWith({ eventId: 7, userId: 2, checkedInBy: 5 });
    });

    test('a repeat check-in returns 200 without a new audit entry', async () => {
      models.attendanceModel.checkInMember.mockResolvedValue({ record: { id: 20 }, created: false });
      const response = await checkIn({ userId: 2 });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Already checked in');
      expect(models.auditLogModel.createAuditLog).not.toHaveBeenCalled();
    });

    test('checks a member in by scanned card', async () => {
      const response = await checkIn({ code: 'antpresby:member:abcdefghjk' }, 7, usher());
      expect(response.status).toBe(201);
      expect(models.userModel.findMemberByCheckInCode).toHaveBeenCalledWith('ABCDEFGHJK');
      expect(response.body.data.member).toEqual({ first_name: 'Ama', last_name: 'Mensah' });
      expect(models.auditLogModel.createAuditLog.mock.calls[0][0].metadata).toEqual({ eventId: 7, method: 'code' });
    });

    test('an unknown or reset card returns 404 Card not recognised', async () => {
      models.userModel.findMemberByCheckInCode.mockResolvedValue(undefined);
      const response = await checkIn({ code: 'ABCDEFGHJK' });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Card not recognised');
    });

    test('a malformed card returns 404 without a lookup', async () => {
      const response = await checkIn({ code: 'not-a-card' });
      expect(response.status).toBe(404);
      expect(models.userModel.findMemberByCheckInCode).not.toHaveBeenCalled();
    });

    test("an inactive member's card returns 403", async () => {
      models.userModel.findMemberByCheckInCode.mockResolvedValue({ id: 2, first_name: 'Ama', last_name: 'Mensah', is_active: false });
      const response = await checkIn({ code: 'ABCDEFGHJK' });
      expect(response.status).toBe(403);
      expect(response.body.message).toBe("This member's account is inactive");
    });

    test('a scanned card already checked in returns 200', async () => {
      models.attendanceModel.checkInMember.mockResolvedValue({ record: { id: 20 }, created: false });
      expect((await checkIn({ code: 'ABCDEFGHJK' })).status).toBe(200);
    });

    test('checks a guest in with a trimmed name', async () => {
      const response = await checkIn({ guestName: '  Visitor Esi  ' });
      expect(response.status).toBe(201);
      expect(models.attendanceModel.checkInGuest).toHaveBeenCalledWith({ eventId: 7, guestName: 'Visitor Esi', checkedInBy: 1 });
    });

    test.each([[{}], [{ userId: 2, guestName: 'X' }], [{ userId: 2, code: 'ABCDEFGHJK' }], [{ guestName: 'X', code: 'ABCDEFGHJK' }], [{ guestName: '   ' }]])(
      'rejects body %p with 400',
      async (body) => {
        expect((await checkIn(body)).status).toBe(400);
      }
    );

    test('a cancelled event returns 409', async () => {
      models.attendanceModel.findEventForCheckIn.mockResolvedValue({ id: 7, status: 'cancelled' });
      expect((await checkIn({ userId: 2 })).status).toBe(409);
    });

    test('a missing member returns 404', async () => {
      models.userModel.findUserById.mockResolvedValue(undefined);
      expect((await checkIn({ userId: 2 })).status).toBe(404);
    });
  });

  describe('POST /events/:eventId/headcount', () => {
    test('adds one adult and audits it', async () => {
      const response = await headcount({ adults: 1 });
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ adults: 1, children: 0 });
      expect(models.attendanceModel.adjustHeadcount).toHaveBeenCalledWith({ eventId: 7, adults: 1, children: 0, updatedBy: 5 });
      expect(models.auditLogModel.createAuditLog.mock.calls[0][0].action).toBe('headcount_change');
    });

    test('removes one child', async () => {
      await headcount({ children: -1 });
      expect(models.attendanceModel.adjustHeadcount).toHaveBeenCalledWith({ eventId: 7, adults: 0, children: -1, updatedBy: 5 });
    });

    test.each([[{}], [{ adults: 2 }], [{ adults: 0 }], [{ children: 'one' }], [{ adults: 0, children: 0 }]])('rejects %p with 400', async (body) => {
      expect((await headcount(body)).status).toBe(400);
    });

    test('a cancelled event returns 409', async () => {
      models.attendanceModel.findEventForCheckIn.mockResolvedValue({ id: 7, status: 'cancelled' });
      expect((await headcount({ adults: 1 })).status).toBe(409);
    });

    test('a missing event returns 404', async () => {
      models.attendanceModel.findEventForCheckIn.mockResolvedValue(null);
      expect((await headcount({ adults: 1 })).status).toBe(404);
    });
  });

  describe('DELETE /records/:id', () => {
    test('undoes a check-in and audits it', async () => {
      const response = await request(app).delete('/api/attendance/records/20').set('Authorization', usher());
      expect(response.status).toBe(200);
      expect(models.attendanceModel.deleteRecord).toHaveBeenCalledWith(20);
    });

    test('a missing record returns 404', async () => {
      models.attendanceModel.deleteRecord.mockResolvedValue(undefined);
      expect((await request(app).delete('/api/attendance/records/99').set('Authorization', admin())).status).toBe(404);
    });
  });

  describe('GET /members', () => {
    test('searches active members with a trimmed term, max 20', async () => {
      const response = await request(app).get('/api/attendance/members?q=%20ama%20').set('Authorization', usher());
      expect(response.status).toBe(200);
      expect(models.userModel.searchActiveMembers).toHaveBeenCalledWith('ama', 20);
    });

    test('a term under 2 letters returns an empty list', async () => {
      const response = await request(app).get('/api/attendance/members?q=a').set('Authorization', usher());
      expect(response.body.data).toEqual([]);
      expect(models.userModel.searchActiveMembers).not.toHaveBeenCalled();
    });
  });

  test('GET /api/admin/attendance/summary still works for admins', async () => {
    expect((await request(app).get('/api/admin/attendance/summary').set('Authorization', admin())).status).toBe(200);
  });
});
