const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const tokenFor = (userId, role = 'member') =>
  jwt.sign({ userId, email: `u${userId}@test.com`, role, firstName: 'Ama', lastName: 'Mensah' }, process.env.JWT_SECRET);
const as = (userId, role) => `Bearer ${tokenFor(userId, role)}`;

const group = (overrides = {}) => ({ id: 5, name: 'Young Adults', is_active: true, capacity: 10, member_count: 3, ...overrides });

const buildModels = () => ({
  groupModel: {
    listActiveGroups: jest.fn().mockResolvedValue([group()]),
    listMyGroups: jest.fn().mockResolvedValue([group({ my_status: 'active' })]),
    getGroupById: jest.fn().mockResolvedValue(group()),
    getGroupDetail: jest.fn().mockResolvedValue({ ...group(), my_status: null, members: [{ user_id: 2 }] }),
    getMembership: jest.fn().mockResolvedValue(null),
    createJoinRequest: jest.fn().mockResolvedValue({ id: 1 }),
    approveRequest: jest.fn().mockResolvedValue(1),
    declineRequest: jest.fn().mockResolvedValue(1),
    deleteMembership: jest.fn().mockResolvedValue(1),
    countActiveLeaders: jest.fn().mockResolvedValue(2),
    getLeaderIds: jest.fn().mockResolvedValue([2, 4]),
    listPendingRequests: jest.fn().mockResolvedValue([{ user_id: 9, email: 'x@test.com' }]),
  },
  notificationService: { notify: jest.fn().mockResolvedValue({ inApp: 1, push: 0 }) },
});

const buildApp = (models) => {
  jest.resetModules();
  jest.doMock('../../src/models/groupModel', () => models.groupModel);
  jest.doMock('../../src/services/notificationService', () => models.notificationService);
  jest.doMock('../../src/models/auditLogModel', () => ({ createAuditLog: jest.fn() }));

  const app = express();
  app.use(express.json());
  app.use('/api/groups', require('../../src/routes/groupRoutes'));
  const { errorHandler } = require('../../src/middleware/errorHandler');
  app.use(errorHandler);
  return app;
};

describe('Groups API (members)', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  describe('listing', () => {
    test('signed-out visitors can list active groups', async () => {
      const response = await request(app).get('/api/groups');

      expect(response.status).toBe(200);
      expect(models.groupModel.listActiveGroups).toHaveBeenCalledWith(null);
    });

    test('signed-in members get their own status', async () => {
      await request(app).get('/api/groups').set('Authorization', as(7));
      expect(models.groupModel.listActiveGroups).toHaveBeenCalledWith(7);
    });

    test('/mine requires sign-in', async () => {
      const response = await request(app).get('/api/groups/mine');
      expect(response.status).toBe(401);
    });

    test('/mine lists my groups and is not treated as an id', async () => {
      const response = await request(app).get('/api/groups/mine').set('Authorization', as(7));

      expect(response.status).toBe(200);
      expect(models.groupModel.listMyGroups).toHaveBeenCalledWith(7);
      expect(models.groupModel.getGroupDetail).not.toHaveBeenCalled();
    });
  });

  describe('group details and member-list privacy', () => {
    test('signed-out visitors do not see the member list', async () => {
      const response = await request(app).get('/api/groups/5');

      expect(response.status).toBe(200);
      expect(response.body.data.members).toBeNull();
    });

    test('a pending requester does not see the member list', async () => {
      models.groupModel.getGroupDetail.mockResolvedValue({ ...group(), my_status: 'pending', members: [{ user_id: 2 }] });

      const response = await request(app).get('/api/groups/5').set('Authorization', as(7));

      expect(response.body.data.members).toBeNull();
    });

    test('an active member sees the member list', async () => {
      models.groupModel.getGroupDetail.mockResolvedValue({ ...group(), my_status: 'active', members: [{ user_id: 2 }] });

      const response = await request(app).get('/api/groups/5').set('Authorization', as(7));

      expect(response.body.data.members).toEqual([{ user_id: 2 }]);
    });

    test('an admin sees the member list', async () => {
      const response = await request(app).get('/api/groups/5').set('Authorization', as(1, 'admin'));
      expect(response.body.data.members).toEqual([{ user_id: 2 }]);
    });

    test('an inactive group is hidden from members but visible to admins', async () => {
      models.groupModel.getGroupDetail.mockResolvedValue({ ...group({ is_active: false }), members: [] });

      const member = await request(app).get('/api/groups/5').set('Authorization', as(7));
      const admin = await request(app).get('/api/groups/5').set('Authorization', as(1, 'admin'));

      expect(member.status).toBe(404);
      expect(admin.status).toBe(200);
    });

    test('a malformed id returns 404 without querying', async () => {
      const response = await request(app).get('/api/groups/abc');

      expect(response.status).toBe(404);
      expect(models.groupModel.getGroupDetail).not.toHaveBeenCalled();
    });
  });

  describe('POST /:id/join', () => {
    const join = (userId = 7) => request(app).post('/api/groups/5/join').set('Authorization', as(userId));

    test('requires sign-in', async () => {
      const response = await request(app).post('/api/groups/5/join');
      expect(response.status).toBe(401);
    });

    test('creates a pending request and notifies the leaders', async () => {
      const response = await join();

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual({ status: 'pending' });
      expect(models.groupModel.createJoinRequest).toHaveBeenCalledWith(5, 7);
      expect(models.notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userIds: [2, 4], type: 'group', entityType: 'group', entityId: 5 })
      );
    });

    test('an existing pending request returns 409', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 7, role: 'member', status: 'pending' });

      const response = await join();

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Your request to join is already pending');
      expect(models.groupModel.createJoinRequest).not.toHaveBeenCalled();
    });

    test('an existing member returns 409', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 7, role: 'member', status: 'active' });

      const response = await join();

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('You are already a member of this group');
    });

    test('a concurrent duplicate (unique violation) returns 409, not 500', async () => {
      models.groupModel.createJoinRequest.mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }));

      const response = await join();

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Your request to join is already pending');
    });

    test('a full group returns 409', async () => {
      models.groupModel.getGroupById.mockResolvedValue(group({ capacity: 3, member_count: 3 }));

      const response = await join();

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('This group is full');
    });

    test('a group with no capacity limit is never full', async () => {
      models.groupModel.getGroupById.mockResolvedValue(group({ capacity: null, member_count: 500 }));
      const response = await join();
      expect(response.status).toBe(201);
    });

    test('an inactive group returns 409', async () => {
      models.groupModel.getGroupById.mockResolvedValue(group({ is_active: false }));

      const response = await join();

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('This group is not accepting members');
    });

    test('a missing group returns 404', async () => {
      models.groupModel.getGroupById.mockResolvedValue(undefined);
      const response = await join();
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /:id/membership (leave)', () => {
    const leave = () => request(app).delete('/api/groups/5/membership').set('Authorization', as(7));

    test('a member can leave', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 7, role: 'member', status: 'active' });

      const response = await leave();

      expect(response.status).toBe(200);
      expect(models.groupModel.deleteMembership).toHaveBeenCalledWith(5, 7);
    });

    test('the last active leader cannot leave', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 7, role: 'leader', status: 'active' });
      models.groupModel.countActiveLeaders.mockResolvedValue(1);

      const response = await leave();

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Make someone else leader before leaving');
      expect(models.groupModel.deleteMembership).not.toHaveBeenCalled();
    });

    test('a leader with a co-leader can leave', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 7, role: 'leader', status: 'active' });
      models.groupModel.countActiveLeaders.mockResolvedValue(2);

      const response = await leave();

      expect(response.status).toBe(200);
    });

    test('someone not in the group gets 404', async () => {
      const response = await leave();
      expect(response.status).toBe(404);
    });
  });

  describe('join requests (leaders and admins)', () => {
    test('a non-leader cannot see requests', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 7, role: 'member', status: 'active' });

      const response = await request(app).get('/api/groups/5/requests').set('Authorization', as(7));

      expect(response.status).toBe(403);
      expect(models.groupModel.listPendingRequests).not.toHaveBeenCalled();
    });

    test('a pending leader cannot see requests', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 7, role: 'leader', status: 'pending' });

      const response = await request(app).get('/api/groups/5/requests').set('Authorization', as(7));

      expect(response.status).toBe(403);
    });

    test('an active leader sees requests', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 2, role: 'leader', status: 'active' });

      const response = await request(app).get('/api/groups/5/requests').set('Authorization', as(2));

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([{ user_id: 9, email: 'x@test.com' }]);
    });

    test('an admin sees requests', async () => {
      const response = await request(app).get('/api/groups/5/requests').set('Authorization', as(1, 'admin'));
      expect(response.status).toBe(200);
    });

    test('a leader approves a request and the member is notified', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 2, role: 'leader', status: 'active' });

      const response = await request(app).post('/api/groups/5/requests/9/approve').set('Authorization', as(2));

      expect(response.status).toBe(200);
      expect(models.groupModel.approveRequest).toHaveBeenCalledWith(5, 9);
      expect(models.notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userIds: [9], type: 'group', entityId: 5 })
      );
    });

    test('approving into a full group returns 409', async () => {
      models.groupModel.getGroupById.mockResolvedValue(group({ capacity: 3, member_count: 3 }));

      const response = await request(app).post('/api/groups/5/requests/9/approve').set('Authorization', as(1, 'admin'));

      expect(response.status).toBe(409);
      expect(models.groupModel.approveRequest).not.toHaveBeenCalled();
    });

    test('approving when there is no pending request returns 404', async () => {
      models.groupModel.approveRequest.mockResolvedValue(0);

      const response = await request(app).post('/api/groups/5/requests/9/approve').set('Authorization', as(1, 'admin'));

      expect(response.status).toBe(404);
      expect(models.notificationService.notify).not.toHaveBeenCalled();
    });

    test('a non-leader cannot approve', async () => {
      const response = await request(app).post('/api/groups/5/requests/9/approve').set('Authorization', as(7));

      expect(response.status).toBe(403);
      expect(models.groupModel.approveRequest).not.toHaveBeenCalled();
    });

    test('a malformed user id returns 404 without querying', async () => {
      const response = await request(app).post('/api/groups/5/requests/abc/approve').set('Authorization', as(1, 'admin'));

      expect(response.status).toBe(404);
      expect(models.groupModel.approveRequest).not.toHaveBeenCalled();
    });

    test('a leader declines a request', async () => {
      const response = await request(app).post('/api/groups/5/requests/9/decline').set('Authorization', as(1, 'admin'));

      expect(response.status).toBe(200);
      expect(models.groupModel.declineRequest).toHaveBeenCalledWith(5, 9);
    });

    test('declining when there is no pending request returns 404', async () => {
      models.groupModel.declineRequest.mockResolvedValue(0);

      const response = await request(app).post('/api/groups/5/requests/9/decline').set('Authorization', as(1, 'admin'));

      expect(response.status).toBe(404);
    });
  });
});

describe('Group routes are mounted in the server', () => {
  test('GET /api/groups is served by the real app', async () => {
    const models = buildModels();
    jest.resetModules();
    jest.doMock('../../src/models/groupModel', () => models.groupModel);
    const server = require('../../src/server');

    const response = await request(server).get('/api/groups');

    expect(response.status).toBe(200);
  });
});
