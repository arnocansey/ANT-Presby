const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const as = (userId, role) => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET)}`;
const admin = () => as(1, 'admin');

const validGroup = {
  name: 'Young Adults',
  description: 'Thursday fellowship',
  meetingDay: 'Thursday',
  meetingTime: '18:30',
  location: 'Room 2',
  capacity: 12,
  ministryId: 1,
};

const buildModels = () => ({
  groupModel: {
    listAllGroups: jest.fn().mockResolvedValue([]),
    createGroup: jest.fn().mockResolvedValue({ id: 5, name: 'Young Adults' }),
    updateGroup: jest.fn().mockResolvedValue({ id: 5, name: 'Young Adults' }),
    deactivateGroup: jest.fn().mockResolvedValue(1),
    getGroupById: jest.fn().mockResolvedValue({ id: 5, name: 'Young Adults' }),
    setLeaders: jest.fn().mockResolvedValue({ id: 5, leaders: [{ user_id: 2 }] }),
  },
  userModel: { findUserById: jest.fn().mockResolvedValue({ id: 2 }) },
  auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
});

const buildApp = (models) => {
  jest.resetModules();
  jest.doMock('../../src/models/groupModel', () => models.groupModel);
  jest.doMock('../../src/models/userModel', () => models.userModel);
  jest.doMock('../../src/models/auditLogModel', () => models.auditLogModel);
  jest.doMock('../../src/services/notificationService', () => ({ notify: jest.fn() }));

  const app = express();
  app.use(express.json());
  app.use('/api/admin/groups', require('../../src/routes/adminGroupRoutes'));
  const { errorHandler } = require('../../src/middleware/errorHandler');
  app.use(errorHandler);
  return app;
};

describe('Admin groups API', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('members cannot manage groups', async () => {
    const response = await request(app).post('/api/admin/groups').set('Authorization', as(7, 'member')).send(validGroup);

    expect(response.status).toBe(403);
    expect(models.groupModel.createGroup).not.toHaveBeenCalled();
  });

  test('lists every group including inactive ones', async () => {
    const response = await request(app).get('/api/admin/groups').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(models.groupModel.listAllGroups).toHaveBeenCalled();
  });

  test('creates a group and audits it', async () => {
    const response = await request(app).post('/api/admin/groups').set('Authorization', admin()).send(validGroup);

    expect(response.status).toBe(201);
    expect(models.groupModel.createGroup).toHaveBeenCalledWith(expect.objectContaining({ name: 'Young Adults', capacity: 12 }));
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'small_group', action: 'create', entityId: 5, actorUserId: 1 })
    );
  });

  test('a duplicate name returns 409', async () => {
    models.groupModel.createGroup.mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }));

    const response = await request(app).post('/api/admin/groups').set('Authorization', admin()).send(validGroup);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('A group with this name already exists');
  });

  test('an unknown ministry returns 400', async () => {
    models.groupModel.createGroup.mockRejectedValue(Object.assign(new Error('FK'), { code: 'P2003' }));

    const response = await request(app).post('/api/admin/groups').set('Authorization', admin()).send(validGroup);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Ministry not found');
  });

  test.each([
    ['a blank name', { name: '   ' }],
    ['an unknown meeting day', { meetingDay: 'Funday' }],
    ['a meeting time that is not HH:MM', { meetingTime: '6pm' }],
    ['a zero capacity', { capacity: 0 }],
    ['a capacity over 1000', { capacity: 1001 }],
    ['a ministry id beyond the database range', { ministryId: 99999999999 }],
  ])('rejects %s with 400', async (_label, overrides) => {
    const response = await request(app)
      .post('/api/admin/groups')
      .set('Authorization', admin())
      .send({ ...validGroup, ...overrides });

    expect(response.status).toBe(400);
    expect(models.groupModel.createGroup).not.toHaveBeenCalled();
  });

  test('optional fields can be cleared with null', async () => {
    const response = await request(app)
      .post('/api/admin/groups')
      .set('Authorization', admin())
      .send({ name: 'Open Group', capacity: null, ministryId: null, meetingDay: null, meetingTime: null });

    expect(response.status).toBe(201);
  });

  test('updates a group and audits it', async () => {
    const response = await request(app)
      .put('/api/admin/groups/5')
      .set('Authorization', admin())
      .send({ ...validGroup, isActive: true });

    expect(response.status).toBe(200);
    expect(models.groupModel.updateGroup).toHaveBeenCalledWith(5, expect.objectContaining({ isActive: true }));
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));
  });

  test('updating a missing group returns 404', async () => {
    models.groupModel.updateGroup.mockResolvedValue(undefined);
    const response = await request(app).put('/api/admin/groups/99').set('Authorization', admin()).send(validGroup);
    expect(response.status).toBe(404);
  });

  test('renaming to a duplicate name returns 409', async () => {
    models.groupModel.updateGroup.mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }));
    const response = await request(app).put('/api/admin/groups/5').set('Authorization', admin()).send(validGroup);
    expect(response.status).toBe(409);
  });

  test('deactivating a group is audited', async () => {
    const response = await request(app).delete('/api/admin/groups/5').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(models.groupModel.deactivateGroup).toHaveBeenCalledWith(5);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'deactivate' }));
  });

  test('deactivating a missing group returns 404', async () => {
    models.groupModel.deactivateGroup.mockResolvedValue(0);
    const response = await request(app).delete('/api/admin/groups/99').set('Authorization', admin());
    expect(response.status).toBe(404);
  });

  test('malformed ids return 404 without querying', async () => {
    const put = await request(app).put('/api/admin/groups/abc').set('Authorization', admin()).send(validGroup);
    const del = await request(app).delete('/api/admin/groups/1.5').set('Authorization', admin());

    expect(put.status).toBe(404);
    expect(del.status).toBe(404);
    expect(models.groupModel.updateGroup).not.toHaveBeenCalled();
    expect(models.groupModel.deactivateGroup).not.toHaveBeenCalled();
  });

  describe('PUT /:id/leaders', () => {
    const setLeaders = (body, id = 5) =>
      request(app).put(`/api/admin/groups/${id}/leaders`).set('Authorization', admin()).send(body);

    test('sets the leaders and audits it', async () => {
      const response = await setLeaders({ userIds: [2, 4] });

      expect(response.status).toBe(200);
      expect(models.groupModel.setLeaders).toHaveBeenCalledWith(5, [2, 4]);
      expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'set_leaders' }));
    });

    test('an empty list removes all leaders', async () => {
      const response = await setLeaders({ userIds: [] });

      expect(response.status).toBe(200);
      expect(models.groupModel.setLeaders).toHaveBeenCalledWith(5, []);
    });

    test('an unknown member returns 404 and changes nothing', async () => {
      models.userModel.findUserById.mockImplementation(async (id) => (id === 4 ? undefined : { id }));

      const response = await setLeaders({ userIds: [2, 4] });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Member not found');
      expect(models.groupModel.setLeaders).not.toHaveBeenCalled();
    });

    test('a missing group returns 404', async () => {
      models.groupModel.getGroupById.mockResolvedValue(undefined);
      const response = await setLeaders({ userIds: [2] });
      expect(response.status).toBe(404);
    });

    test.each([
      ['not an array', { userIds: 2 }],
      ['duplicates', { userIds: [2, 2] }],
      ['more than ten', { userIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }],
      ['a non-integer id', { userIds: ['abc'] }],
    ])('rejects %s with 400', async (_label, body) => {
      const response = await setLeaders(body);

      expect(response.status).toBe(400);
      expect(models.groupModel.setLeaders).not.toHaveBeenCalled();
    });
  });
});
