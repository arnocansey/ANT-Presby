describe('pushTokenModel.getTokensForUsers', () => {
  const load = (prismaMock) => {
    jest.resetModules();
    jest.doMock('../../src/config/prisma', () => prismaMock);
    return require('../../src/models/pushTokenModel');
  };

  test('only returns devices of active members (deactivated members get no pushes)', async () => {
    const prisma = { pushToken: { findMany: jest.fn().mockResolvedValue([{ token: 'ExponentPushToken[a]' }]) } };

    const tokens = await load(prisma).getTokensForUsers([7, 9]);

    expect(tokens).toEqual(['ExponentPushToken[a]']);
    expect(prisma.pushToken.findMany).toHaveBeenCalledWith({
      where: { userId: { in: [7, 9] }, user: { isActive: true } },
      select: { token: true },
    });
  });

  test('no recipients means no query', async () => {
    const prisma = { pushToken: { findMany: jest.fn() } };

    expect(await load(prisma).getTokensForUsers([])).toEqual([]);
    expect(prisma.pushToken.findMany).not.toHaveBeenCalled();
  });
});
