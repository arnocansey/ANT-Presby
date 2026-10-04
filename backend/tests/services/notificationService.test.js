describe('notificationService', () => {
  let notificationModel;
  let notificationService;

  beforeEach(() => {
    jest.resetModules();
    notificationModel = {
      createNotificationsForUsers: jest.fn().mockResolvedValue(2),
      createNotificationForAllUsers: jest.fn().mockResolvedValue(40),
    };
    jest.doMock('../../src/models/notificationModel', () => notificationModel);
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
});
