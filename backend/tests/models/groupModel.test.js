const loadModel = () => {
  jest.resetModules();
  jest.doMock('../../src/config/prisma', () => ({}));
  return require('../../src/models/groupModel');
};

const ama = { id: 2, firstName: 'Ama', lastName: 'Mensah' };
const kofi = { id: 3, firstName: 'Kofi', lastName: 'Boateng' };
const created = new Date('2026-10-01T10:00:00Z');

const row = {
  id: 5,
  name: 'Young Adults',
  description: 'Thursday fellowship',
  meetingDay: 'Thursday',
  meetingTime: '18:30',
  location: 'Room 2',
  capacity: 12,
  ministryId: 1,
  isActive: true,
  createdAt: created,
  updatedAt: created,
  ministry: { name: 'Youth' },
  memberships: [
    { userId: 2, role: 'leader', status: 'active', user: ama },
    { userId: 3, role: 'member', status: 'pending', user: kofi },
  ],
  _count: { memberships: 7 },
};

describe('mapGroupSummary', () => {
  const { mapGroupSummary } = loadModel();

  test('flattens ministry, counts active members and lists active leaders', () => {
    const group = mapGroupSummary(row, null);

    expect(group).toEqual(
      expect.objectContaining({
        id: 5,
        name: 'Young Adults',
        meeting_day: 'Thursday',
        meeting_time: '18:30',
        capacity: 12,
        is_active: true,
        ministry_name: 'Youth',
        member_count: 7,
        leaders: [{ user_id: 2, first_name: 'Ama', last_name: 'Mensah' }],
        my_status: null,
        my_role: null,
      })
    );
    expect(group).not.toHaveProperty('memberships');
    expect(group).not.toHaveProperty('_count');
    expect(group).not.toHaveProperty('ministry');
  });

  test("reports the viewer's own status and role", () => {
    expect(mapGroupSummary(row, 3)).toEqual(expect.objectContaining({ my_status: 'pending', my_role: 'member' }));
    expect(mapGroupSummary(row, 2)).toEqual(expect.objectContaining({ my_status: 'active', my_role: 'leader' }));
    expect(mapGroupSummary(row, 99)).toEqual(expect.objectContaining({ my_status: null, my_role: null }));
  });

  test('a pending leader is not listed as a leader', () => {
    const pendingLeader = { ...row, memberships: [{ userId: 2, role: 'leader', status: 'pending', user: ama }] };
    expect(mapGroupSummary(pendingLeader, null).leaders).toEqual([]);
  });
});

describe('toMemberItem', () => {
  const { toMemberItem } = loadModel();

  test('exposes only names and role, never email', () => {
    expect(toMemberItem({ userId: 2, role: 'leader', user: { ...ama, email: 'ama@test.com' } })).toEqual({
      user_id: 2,
      first_name: 'Ama',
      last_name: 'Mensah',
      role: 'leader',
    });
  });
});

describe('approveRequestWithinCapacity', () => {
  const load = (tx) => {
    jest.resetModules();
    jest.doMock('../../src/config/prisma', () => ({ $transaction: (fn) => fn(tx) }));
    return require('../../src/models/groupModel');
  };

  const buildTx = ({ capacity, active, updated = 1 }) => ({
    $queryRaw: jest.fn().mockResolvedValue(capacity === undefined ? [] : [{ capacity }]),
    groupMembership: {
      count: jest.fn().mockResolvedValue(active),
      updateMany: jest.fn().mockResolvedValue({ count: updated }),
    },
  });

  test('locks the group row, then approves while there is room', async () => {
    const tx = buildTx({ capacity: 10, active: 9 });
    const { approveRequestWithinCapacity } = load(tx);

    await expect(approveRequestWithinCapacity(5, 9)).resolves.toBe('approved');
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.groupMembership.updateMany).toHaveBeenCalledWith({
      where: { groupId: 5, userId: 9, status: 'pending' },
      data: { status: 'active' },
    });
  });

  test('refuses when the group is already full, without approving', async () => {
    const tx = buildTx({ capacity: 10, active: 10 });
    const { approveRequestWithinCapacity } = load(tx);

    await expect(approveRequestWithinCapacity(5, 9)).resolves.toBe('full');
    expect(tx.groupMembership.updateMany).not.toHaveBeenCalled();
  });

  test('a group without capacity skips the count', async () => {
    const tx = buildTx({ capacity: null, active: 500 });
    const { approveRequestWithinCapacity } = load(tx);

    await expect(approveRequestWithinCapacity(5, 9)).resolves.toBe('approved');
    expect(tx.groupMembership.count).not.toHaveBeenCalled();
  });

  test('reports none when there is no pending request or no group', async () => {
    await expect(load(buildTx({ capacity: 10, active: 1, updated: 0 })).approveRequestWithinCapacity(5, 9)).resolves.toBe('none');
    await expect(load(buildTx({ capacity: undefined, active: 0 })).approveRequestWithinCapacity(5, 9)).resolves.toBe('none');
  });
});
