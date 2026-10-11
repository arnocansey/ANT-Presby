const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
const as = (userId, role) => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET)}`;
const BOM = String.fromCharCode(0xfeff);
const at = new Date('2026-10-04T09:00:00Z');

describe('attendance CSV exports', () => {
  let attendanceModel;
  let app;

  beforeEach(() => {
    jest.resetModules();
    attendanceModel = {
      getAttendanceSummary: jest.fn().mockResolvedValue([]),
      getEventExport: jest.fn().mockResolvedValue({
        event: { id: 7, name: 'Sunday Service', event_date: at },
        headcount: { adults: 150, children: 24 },
        rows: [
          { type: 'Member', name: 'Ama Mensah', email: 'ama@test.com', checked_in_at: at, checked_in_by: 'Usher One' },
          { type: 'Guest', name: '=HYPERLINK("x")', email: '', checked_in_at: at, checked_in_by: '' },
        ],
      }),
      getRangeExport: jest.fn().mockResolvedValue([
        { event_id: 7, name: 'Sunday Service', event_date: at, registered: 4, members: 1, guests: 1, named: 2, adults: 10, children: 3, total: 15 },
      ]),
    };
    jest.doMock('../../src/models/attendanceModel', () => attendanceModel);
    jest.doMock('../../src/models/userModel', () => ({ getAttendanceAccess: jest.fn() }));
    jest.doMock('../../src/models/auditLogModel', () => ({ createAuditLog: jest.fn() }));
    app = express();
    app.use('/api/admin/attendance', require('../../src/routes/adminAttendanceRoutes'));
  });

  test('event export lists check-ins then headcount rows, escaped', async () => {
    const response = await request(app).get('/api/admin/attendance/events/7/export.csv').set('Authorization', as(1, 'admin'));
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toMatch(/^attachment; filename="attendance-sunday-service-2026-10-04\.csv"$/);
    const lines = response.text.replace(BOM, '').trim().split('\r\n');
    expect(lines[0]).toBe('Type,Name,Email,Checked in at,Checked in by');
    expect(lines[1]).toBe('Member,Ama Mensah,ama@test.com,2026-10-04T09:00:00.000Z,Usher One');
    expect(lines[2]).toBe('Guest,"\'=HYPERLINK(""x"")",,2026-10-04T09:00:00.000Z,');
    expect(lines[3]).toBe('Headcount (adults),150,,,');
    expect(lines[4]).toBe('Headcount (children),24,,,');
  });

  test('a missing event returns 404', async () => {
    attendanceModel.getEventExport.mockResolvedValue(undefined);
    expect((await request(app).get('/api/admin/attendance/events/9/export.csv').set('Authorization', as(1, 'admin'))).status).toBe(404);
  });

  test('range export has one row per event', async () => {
    const response = await request(app)
      .get('/api/admin/attendance/export.csv?from=2026-07-01&to=2026-09-30')
      .set('Authorization', as(1, 'admin'));
    expect(response.status).toBe(200);
    const lines = response.text.replace(BOM, '').trim().split('\r\n');
    expect(lines[0]).toBe('Event,Date,Registered,Members,Guests,Adults counted,Children counted,Total');
    expect(lines[1]).toBe('Sunday Service,2026-10-04T09:00:00.000Z,4,1,1,10,3,15');
    const { from, to } = attendanceModel.getRangeExport.mock.calls[0][0];
    expect(from.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(to.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(response.headers['content-disposition']).toContain('attendance-2026-07-01-to-2026-09-30.csv');
  });

  test('range defaults to the last 90 days', async () => {
    await request(app).get('/api/admin/attendance/export.csv').set('Authorization', as(1, 'admin'));
    const { from, to } = attendanceModel.getRangeExport.mock.calls[0][0];
    expect(Math.round((to - from) / 86400000)).toBe(90);
  });

  test.each([['from=2026-10-01&to=2026-09-01'], ['from=2025-01-01&to=2026-06-01'], ['from=bad&to=2026-09-01'], ['from=2026-02-30&to=2026-03-01']])(
    'rejects %s with 400',
    async (query) => {
      expect((await request(app).get(`/api/admin/attendance/export.csv?${query}`).set('Authorization', as(1, 'admin'))).status).toBe(400);
    }
  );

  test('ushers cannot export', async () => {
    expect((await request(app).get('/api/admin/attendance/export.csv').set('Authorization', as(5, 'member'))).status).toBe(403);
  });
});
