describe('notificationService', () => {
  let notificationModel;
  let notificationService;

  let pushTokenModel;
  let pushService;

  beforeEach(() => {
    jest.resetModules();
    notificationModel = {
      createNotificationsForUsers: jest.fn().mockResolvedValue(2),
      createNotificationForAllUsers: jest.fn().mockResolvedValue(40),
    };
    pushTokenModel = {
      getTokensForUsers: jest.fn().mockResolvedValue([]),
      getAllActiveTokens: jest.fn().mockResolvedValue([]),
      deleteTokens: jest.fn().mockResolvedValue(0),
    };
    pushService = { sendPush: jest.fn().mockResolvedValue({ sent: 0, invalidTokens: [] }) };
    jest.doMock('../../src/models/notificationModel', () => notificationModel);
    jest.doMock('../../src/models/pushTokenModel', () => pushTokenModel);
    jest.doMock('../../src/services/pushService', () => pushService);
    notificationService = require('../../src/services/notificationService');
  });

  test('notify de-duplicates ids, drops invalid ones, and inserts in one call', async () => {
    const result = await notificationService.notify({
      userIds: [7, '7', 9, 0, -1, 'abc', null],
      title: 'Hello',
      message: 'World',
      type: 'prayer',
      entityType: 'prayer',
      entityId: 3,
    });

    expect(notificationModel.createNotificationsForUsers).toHaveBeenCalledWith(
      [7, 9],
      'Hello',
      'World',
      'prayer',
      'prayer',
      3
    );
    expect(result).toEqual({ inApp: 2, push: 0 });
  });

  test('notify with no valid recipients does nothing', async () => {
    const result = await notificationService.notify({ userIds: [], title: 't', message: 'm', type: 'x' });
    expect(notificationModel.createNotificationsForUsers).not.toHaveBeenCalled();
    expect(result).toEqual({ inApp: 0, push: 0 });
  });

  test('notify never throws when the database fails', async () => {
    notificationModel.createNotificationsForUsers.mockRejectedValue(new Error('db down'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(
      notificationService.notify({ userIds: [1], title: 't', message: 'm', type: 'x' })
    ).resolves.toEqual({ inApp: 0, push: 0 });

    warn.mockRestore();
  });

  test('notifyAll broadcasts and never throws', async () => {
    await expect(
      notificationService.notifyAll({ title: 't', message: 'm', type: 'devotional' })
    ).resolves.toEqual({ inApp: 40, push: 0 });

    notificationModel.createNotificationForAllUsers.mockRejectedValue(new Error('db down'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(
      notificationService.notifyAll({ title: 't', message: 'm', type: 'devotional' })
    ).resolves.toEqual({ inApp: 0, push: 0 });
    warn.mockRestore();
  });

  test('notify also pushes to the recipients\' devices', async () => {
    pushTokenModel.getTokensForUsers.mockResolvedValue(['ExponentPushToken[a]', 'ExponentPushToken[b]']);
    pushService.sendPush.mockResolvedValue({ sent: 2, invalidTokens: [] });

    const result = await notificationService.notify({
      userIds: [7, 9],
      title: 'Hello',
      message: 'World',
      type: 'group',
      entityType: 'group',
      entityId: 5,
    });

    expect(pushTokenModel.getTokensForUsers).toHaveBeenCalledWith([7, 9]);
    expect(pushService.sendPush).toHaveBeenCalledWith(['ExponentPushToken[a]', 'ExponentPushToken[b]'], {
      title: 'Hello',
      body: 'World',
      data: { type: 'group', entityType: 'group', entityId: 5 },
    });
    expect(result).toEqual({ inApp: 2, push: 2 });
  });

  test('dead device tokens are removed', async () => {
    pushTokenModel.getTokensForUsers.mockResolvedValue(['ExponentPushToken[gone]']);
    pushService.sendPush.mockResolvedValue({ sent: 0, invalidTokens: ['ExponentPushToken[gone]'] });

    await notificationService.notify({ userIds: [7], title: 't', message: 'm', type: 'x' });

    expect(pushTokenModel.deleteTokens).toHaveBeenCalledWith(['ExponentPushToken[gone]']);
  });

  test('a push failure keeps the in-app notification and never throws', async () => {
    pushTokenModel.getTokensForUsers.mockRejectedValue(new Error('db down'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(notificationService.notify({ userIds: [7], title: 't', message: 'm', type: 'x' })).resolves.toEqual({
      inApp: 2,
      push: 0,
    });

    warn.mockRestore();
  });

  test('notifyAll pushes to every active device', async () => {
    pushTokenModel.getAllActiveTokens.mockResolvedValue(['ExponentPushToken[a]']);
    pushService.sendPush.mockResolvedValue({ sent: 1, invalidTokens: [] });

    const result = await notificationService.notifyAll({ title: 't', message: 'm', type: 'devotional', entityType: 'devotional', entityId: 3 });

    expect(result).toEqual({ inApp: 40, push: 1 });
  });
});
