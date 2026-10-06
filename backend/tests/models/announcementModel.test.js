describe('announcementModel recipient queries', () => {
  const load = (prismaMock) => {
    jest.resetModules();
    jest.doMock('../../src/config/prisma', () => prismaMock);
    return require('../../src/models/announcementModel');
  };

  test('event audience merges registrations and check-ins without duplicates', async () => {
    const prisma = {
      eventRegistration: { findMany: jest.fn().mockResolvedValue([{ userId: 2 }, { userId: 3 }]) },
      attendanceRecord: { findMany: jest.fn().mockResolvedValue([{ userId: 3 }, { userId: 4 }]) },
    };

    const ids = await load(prisma).getEventAudienceIds(7);

    expect(ids.sort()).toEqual([2, 3, 4]);
    expect(prisma.attendanceRecord.findMany).toHaveBeenCalledWith({
      where: { eventId: 7, userId: { not: null } },
      select: { userId: true },
    });
  });

  test('group audience is active members only', async () => {
    const prisma = { groupMembership: { findMany: jest.fn().mockResolvedValue([{ userId: 2 }]) } };

    await load(prisma).getGroupMemberIds(5);

    expect(prisma.groupMembership.findMany).toHaveBeenCalledWith({
      where: { groupId: 5, status: 'active' },
      select: { userId: true },
    });
  });
});
