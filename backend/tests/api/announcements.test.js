const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const as = (userId, role = 'member') => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET)}`;
const admin = () => as(1, 'admin');

const buildModels = () => ({
  announcementModel: {
    getGroupMemberIds: jest.fn().mockResolvedValue([2, 3, 7]),
    getEventAudienceIds: jest.fn().mockResolvedValue([4, 5]),
    getLedGroupIds: jest.fn().mockResolvedValue([5]),
    createAnnouncement: jest.fn().mockImplementation(async (data) => ({ id: 11, ...data })),
    setPushCount: jest.fn().mockResolvedValue({}),
    listSent: jest.fn().mockResolvedValue([{ id: 11 }]),
  },
  groupModel: { getGroupById: jest.fn().mockResolvedValue({ id: 5, name: 'Young Adults', is_active: true }) },
  groupController: { canManageGroup: jest.fn().mockResolvedValue(false) },
  eventModel: { getEventById: jest.fn().mockResolvedValue({ id: 7, name: 'Retreat' }) },
  userModel: { getAllUserIds: jest.fn().mockResolvedValue([1, 2, 3]) },
  notificationService: { notify: jest.fn().mockResolvedValue({ inApp: 2, push: 1 }) },
  auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
});

const buildApp = (models) => {
  jest.resetModules();
  jest.doMock('../../src/models/announcementModel', () => models.announcementModel);
  jest.doMock('../../src/models/groupModel', () => models.groupModel);
  jest.doMock('../../src/controllers/groupController', () => models.groupController);
  jest.doMock('../../src/models/eventModel', () => models.eventModel);
  jest.doMock('../../src/models/userModel', () => models.userModel);
  jest.doMock('../../src/services/notificationService', () => models.notificationService);
  jest.doMock('../../src/models/auditLogModel', () => models.auditLogModel);

  const app = express();
  app.use(express.json());
  app.use('/api/announcements', require('../../src/routes/announcementRoutes'));
  const { errorHandler } = require('../../src/middleware/errorHandler');
  app.use(errorHandler);
  return app;
};

describe('Announcements API', () => {
  let models;
  let app;
  const send = (auth, body) => request(app).post('/api/announcements').set('Authorization', auth).send(body);

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('requires sign-in', async () => {
    const response = await request(app).post('/api/announcements').send({ title: 't', message: 'm', audience: 'everyone' });
    expect(response.status).toBe(401);
  });

  test('an admin announces to everyone; the sender is not notified; counts are stored; it is audited', async () => {
    const response = await send(admin(), { title: 'Service time', message: 'We start at 9.', audience: 'everyone' });

    expect(response.status).toBe(201);
    expect(models.notificationService.notify).toHaveBeenCalledWith(
      expect.objectContaining({ userIds: [2, 3], title: 'Service time', type: 'announcement', entityType: 'announcement', entityId: 11 })
    );
    expect(models.announcementModel.createAnnouncement).toHaveBeenCalledWith(
      expect.objectContaining({ audience: 'everyone', recipientCount: 2, sentBy: 1, groupId: null, eventId: null })
    );
    expect(models.announcementModel.setPushCount).toHaveBeenCalledWith(11, 1);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ entityType: 'announcement', action: 'send' }));
  });

  test('once delivered, a failure to save the push count or audit still answers 201 (no resend prompt)', async () => {
    models.announcementModel.setPushCount.mockRejectedValue(new Error('db blip'));
    models.auditLogModel.createAuditLog.mockRejectedValue(new Error('db blip'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const response = await send(admin(), { title: 'Service time', message: 'We start at 9.', audience: 'everyone' });

    expect(response.status).toBe(201);
    expect(models.notificationService.notify).toHaveBeenCalledTimes(1);
    expect(response.body.data.recipient_count).toBe(2);
    warn.mockRestore();
  });

  test('a member cannot announce to everyone or to an event', async () => {
    const everyone = await send(as(7), { title: 't', message: 'm', audience: 'everyone' });
    const event = await send(as(7), { title: 't', message: 'm', audience: 'event', eventId: 7 });

    expect(everyone.status).toBe(403);
    expect(event.status).toBe(403);
    expect(models.notificationService.notify).not.toHaveBeenCalled();
  });

  test("a group's active leader can message their own group", async () => {
    models.groupController.canManageGroup.mockResolvedValue(true);

    const response = await send(as(7), { title: 'Tonight', message: 'Bring a Bible', audience: 'group', groupId: 5 });

    expect(response.status).toBe(201);
    expect(models.groupController.canManageGroup).toHaveBeenCalledWith(expect.objectContaining({ userId: 7 }), 5);
    expect(models.notificationService.notify).toHaveBeenCalledWith(
      expect.objectContaining({ userIds: [2, 3], entityType: 'group', entityId: 5 })
    );
  });

  test('someone who is not an active leader of that group gets 403', async () => {
    const response = await send(as(7), { title: 't', message: 'm', audience: 'group', groupId: 5 });

    expect(response.status).toBe(403);
    expect(models.notificationService.notify).not.toHaveBeenCalled();
  });

  test('an unknown group or event returns 404', async () => {
    models.groupModel.getGroupById.mockResolvedValue(undefined);
    models.eventModel.getEventById.mockResolvedValue(undefined);

    const group = await send(admin(), { title: 't', message: 'm', audience: 'group', groupId: 99 });
    const event = await send(admin(), { title: 't', message: 'm', audience: 'event', eventId: 99 });

    expect(group.status).toBe(404);
    expect(event.status).toBe(404);
  });

  test("an event announcement reaches the event's audience", async () => {
    const response = await send(admin(), { title: 'Bus at 7', message: 'Meet at the gate', audience: 'event', eventId: 7 });

    expect(response.status).toBe(201);
    expect(models.announcementModel.getEventAudienceIds).toHaveBeenCalledWith(7);
    expect(models.notificationService.notify).toHaveBeenCalledWith(expect.objectContaining({ userIds: [4, 5], entityType: 'event', entityId: 7 }));
  });

  test('an audience with nobody in it returns 400', async () => {
    models.announcementModel.getEventAudienceIds.mockResolvedValue([1]);

    const response = await send(admin(), { title: 't', message: 'm', audience: 'event', eventId: 7 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('This audience has no members yet');
    expect(models.announcementModel.createAnnouncement).not.toHaveBeenCalled();
  });

  test.each([
    ['a missing title', { title: ' ', message: 'm', audience: 'everyone' }],
    ['an over-long message', { title: 't', message: 'x'.repeat(2001), audience: 'everyone' }],
    ['an unknown audience', { title: 't', message: 'm', audience: 'world' }],
    ['a group audience without groupId', { title: 't', message: 'm', audience: 'group' }],
    ['an event audience without eventId', { title: 't', message: 'm', audience: 'event' }],
  ])('rejects %s with 400', async (_label, body) => {
    const response = await send(admin(), body);

    expect(response.status).toBe(400);
    expect(models.notificationService.notify).not.toHaveBeenCalled();
  });

  describe('GET /sent', () => {
    test('admins see every announcement', async () => {
      const response = await request(app).get('/api/announcements/sent').set('Authorization', admin());

      expect(response.status).toBe(200);
      expect(models.announcementModel.listSent).toHaveBeenCalledWith(null);
    });

    test('leaders see announcements to the groups they lead', async () => {
      await request(app).get('/api/announcements/sent').set('Authorization', as(7));

      expect(models.announcementModel.getLedGroupIds).toHaveBeenCalledWith(7);
      expect(models.announcementModel.listSent).toHaveBeenCalledWith([5]);
    });

    test('members who lead nothing get an empty list', async () => {
      models.announcementModel.getLedGroupIds.mockResolvedValue([]);

      const response = await request(app).get('/api/announcements/sent').set('Authorization', as(8));

      expect(response.body.data).toEqual([]);
      expect(models.announcementModel.listSent).not.toHaveBeenCalled();
    });
  });
});
