const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const tokenFor = (userId, role) => jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET);
const admin = () => `Bearer ${tokenFor(1, 'admin')}`;

const buildModels = () => ({
  attendanceModel: {
    getEventAttendance: jest.fn().mockResolvedValue({ event: { id: 7 }, totals: { total: 0 } }),
    findEventForCheckIn: jest.fn().mockResolvedValue({ id: 7, status: 'active' }),
    checkInMember: jest.fn().mockResolvedValue({ record: { id: 20, user_id: 2 }, created: true }),
    checkInGuest: jest.fn().mockResolvedValue({ id: 21, guest_name: 'Visitor Esi' }),
    deleteRecord: jest.fn().mockResolvedValue({ id: 20, event_id: 7 }),
    getAttendanceSummary: jest.fn().mockResolvedValue([]),
  },
  userModel: { findUserById: jest.fn().mockResolvedValue({ id: 2, first_name: 'Ama' }) },
  auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
});

const buildApp = (models) => {
  jest.resetModules();
  jest.doMock('../../src/models/attendanceModel', () => models.attendanceModel);
  jest.doMock('../../src/models/userModel', () => models.userModel);
  jest.doMock('../../src/models/auditLogModel', () => models.auditLogModel);

  const app = express();
  app.use(express.json());
  app.use('/api/admin/attendance', require('../../src/routes/adminAttendanceRoutes'));
  const { errorHandler } = require('../../src/middleware/errorHandler');
  app.use(errorHandler);
  return app;
};

describe('Attendance API', () => {
  let models;
  let app;
  const checkIn = (body, eventId = 7) =>
    request(app).post(`/api/admin/attendance/events/${eventId}/check-in`).set('Authorization', admin()).send(body);

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('members cannot use attendance', async () => {
    const response = await request(app)
      .get('/api/admin/attendance/events/7')
      .set('Authorization', `Bearer ${tokenFor(5, 'member')}`);

    expect(response.status).toBe(403);
  });

  describe('GET /events/:eventId', () => {
    test('returns the check-in sheet', async () => {
      const response = await request(app).get('/api/admin/attendance/events/7').set('Authorization', admin());

      expect(response.status).toBe(200);
      expect(models.attendanceModel.getEventAttendance).toHaveBeenCalledWith(7);
      expect(response.body.data.event.id).toBe(7);
    });

    test('a missing event returns 404', async () => {
      models.attendanceModel.getEventAttendance.mockResolvedValue(undefined);
      const response = await request(app).get('/api/admin/attendance/events/99').set('Authorization', admin());
      expect(response.status).toBe(404);
    });

    test('a malformed id returns 404 without querying', async () => {
      const response = await request(app).get('/api/admin/attendance/events/abc').set('Authorization', admin());

      expect(response.status).toBe(404);
      expect(models.attendanceModel.getEventAttendance).not.toHaveBeenCalled();
    });
  });

  describe('POST /events/:eventId/check-in', () => {
    test('checks a member in with 201 and audits it', async () => {
      const response = await checkIn({ userId: 2 });

      expect(response.status).toBe(201);
      expect(models.attendanceModel.checkInMember).toHaveBeenCalledWith({ eventId: 7, userId: 2, checkedInBy: 1 });
      expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'attendance', action: 'check_in', entityId: 20, actorUserId: 1 })
      );
    });

    test('a member already checked in gets 200 with the existing record and no new audit', async () => {
      models.attendanceModel.checkInMember.mockResolvedValue({ record: { id: 20, user_id: 2 }, created: false });

      const response = await checkIn({ userId: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(20);
      expect(models.auditLogModel.createAuditLog).not.toHaveBeenCalled();
    });

    test('checks in a guest with a trimmed name', async () => {
      const response = await checkIn({ guestName: '  Visitor Esi  ' });

      expect(response.status).toBe(201);
      expect(models.attendanceModel.checkInGuest).toHaveBeenCalledWith({ eventId: 7, guestName: 'Visitor Esi', checkedInBy: 1 });
    });

    test('an unknown member returns 404', async () => {
      models.userModel.findUserById.mockResolvedValue(undefined);

      const response = await checkIn({ userId: 99 });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Member not found');
      expect(models.attendanceModel.checkInMember).not.toHaveBeenCalled();
    });

    test('an unknown event returns 404', async () => {
      models.attendanceModel.findEventForCheckIn.mockResolvedValue(null);

      const response = await checkIn({ userId: 2 }, 99);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Event not found');
    });

    test('a malformed event id returns 404 without querying', async () => {
      const response = await checkIn({ userId: 2 }, '1.5');

      expect(response.status).toBe(404);
      expect(models.attendanceModel.findEventForCheckIn).not.toHaveBeenCalled();
    });

    test('a cancelled event returns 409', async () => {
      models.attendanceModel.findEventForCheckIn.mockResolvedValue({ id: 7, status: 'cancelled' });

      const response = await checkIn({ userId: 2 });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('This event was cancelled');
    });

    test.each([
      ['both userId and guestName', { userId: 2, guestName: 'Esi' }],
      ['neither', {}],
      ['a blank guest name', { guestName: '    ' }],
      ['an over-long guest name', { guestName: 'x'.repeat(256) }],
      ['a non-integer userId', { userId: 'abc' }],
    ])('rejects %s with 400', async (_label, body) => {
      const response = await checkIn(body);

      expect(response.status).toBe(400);
      expect(models.attendanceModel.checkInMember).not.toHaveBeenCalled();
      expect(models.attendanceModel.checkInGuest).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /records/:id', () => {
    test('undoes a check-in and audits it', async () => {
      const response = await request(app).delete('/api/admin/attendance/records/20').set('Authorization', admin());

      expect(response.status).toBe(200);
      expect(models.attendanceModel.deleteRecord).toHaveBeenCalledWith(20);
      expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'attendance', action: 'undo_check_in', entityId: 20 })
      );
    });

    test('a missing record returns 404', async () => {
      models.attendanceModel.deleteRecord.mockResolvedValue(undefined);
      const response = await request(app).delete('/api/admin/attendance/records/99').set('Authorization', admin());
      expect(response.status).toBe(404);
    });

    test('a malformed id returns 404 without querying', async () => {
      const response = await request(app).delete('/api/admin/attendance/records/abc').set('Authorization', admin());

      expect(response.status).toBe(404);
      expect(models.attendanceModel.deleteRecord).not.toHaveBeenCalled();
    });
  });

  describe('GET /summary', () => {
    test.each([
      ['', 10],
      ['?limit=5', 5],
      ['?limit=500', 50],
      ['?limit=abc', 10],
      ['?limit=0', 10],
    ])('limit %s becomes %i', async (query, expected) => {
      const response = await request(app).get(`/api/admin/attendance/summary${query}`).set('Authorization', admin());

      expect(response.status).toBe(200);
      expect(models.attendanceModel.getAttendanceSummary).toHaveBeenCalledWith(expected);
    });
  });
});

describe('Attendance routes are mounted in the server', () => {
  test('GET /api/admin/attendance/summary is served by the real app', async () => {
    const models = buildModels();
    jest.resetModules();
    jest.doMock('../../src/models/attendanceModel', () => models.attendanceModel);
    const server = require('../../src/server');

    const response = await request(server).get('/api/admin/attendance/summary').set('Authorization', admin());

    expect(response.status).toBe(200);
  });
});

describe('Out-of-range ids', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('a userId beyond the database integer range is rejected with 400', async () => {
    const response = await request(app)
      .post('/api/admin/attendance/events/7/check-in')
      .set('Authorization', admin())
      .send({ userId: 99999999999 });

    expect(response.status).toBe(400);
    expect(models.userModel.findUserById).not.toHaveBeenCalled();
  });

  test('an event id beyond the database integer range returns 404 without querying', async () => {
    const response = await request(app).get('/api/admin/attendance/events/99999999999').set('Authorization', admin());

    expect(response.status).toBe(404);
    expect(models.attendanceModel.getEventAttendance).not.toHaveBeenCalled();
  });
});
