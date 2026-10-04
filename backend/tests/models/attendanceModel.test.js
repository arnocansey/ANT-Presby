const buildPrismaMock = () => ({
  attendanceRecord: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
});

const loadModel = (prismaMock) => {
  jest.resetModules();
  jest.doMock('../../src/config/prisma', () => prismaMock);
  return require('../../src/models/attendanceModel');
};

const ama = { id: 2, firstName: 'Ama', lastName: 'Mensah', email: 'ama@test.com' };
const kofi = { id: 3, firstName: 'Kofi', lastName: 'Boateng', email: 'kofi@test.com' };
const yaw = { id: 4, firstName: 'Yaw', lastName: 'Asante', email: 'yaw@test.com' };
const at = new Date('2026-10-04T09:00:00Z');

const event = {
  id: 7,
  name: 'Sunday Service',
  eventDate: at,
  location: 'Main hall',
  status: 'active',
  registrations: [
    { userId: 2, user: ama },
    { userId: 3, user: kofi },
  ],
  attendance: [
    { id: 10, userId: 2, user: ama, guestName: null, checkedInAt: at },
    { id: 11, userId: 4, user: yaw, guestName: null, checkedInAt: at },
    { id: 12, userId: null, user: null, guestName: 'Visitor Esi', checkedInAt: at },
  ],
};

describe('buildAttendanceSummary', () => {
  const { buildAttendanceSummary } = loadModel(buildPrismaMock());

  test('marks which registered members are checked in', () => {
    const summary = buildAttendanceSummary(event);

    expect(summary.registered).toEqual([
      { user_id: 2, first_name: 'Ama', last_name: 'Mensah', email: 'ama@test.com', checked_in: true, record_id: 10, checked_in_at: at },
      { user_id: 3, first_name: 'Kofi', last_name: 'Boateng', email: 'kofi@test.com', checked_in: false, record_id: null, checked_in_at: null },
    ]);
  });

  test('lists unregistered members and guests separately', () => {
    const summary = buildAttendanceSummary(event);

    expect(summary.walk_in_members).toEqual([
      { user_id: 4, first_name: 'Yaw', last_name: 'Asante', email: 'yaw@test.com', record_id: 11, checked_in_at: at },
    ]);
    expect(summary.guests).toEqual([{ record_id: 12, guest_name: 'Visitor Esi', checked_in_at: at }]);
  });

  test('counts each person once in the totals', () => {
    expect(buildAttendanceSummary(event).totals).toEqual({
      registered: 2,
      checked_in_members: 2,
      guests: 1,
      total: 3,
    });
  });

  test('includes the event details', () => {
    expect(buildAttendanceSummary(event).event).toEqual({
      id: 7,
      name: 'Sunday Service',
      event_date: at,
      location: 'Main hall',
      status: 'active',
    });
  });
});

describe('toSummaryRow', () => {
  const { toSummaryRow } = loadModel(buildPrismaMock());

  test('splits members and guests', () => {
    const row = toSummaryRow({
      id: 7,
      name: 'Sunday Service',
      eventDate: at,
      _count: { registrations: 5 },
      attendance: [{ userId: 2 }, { userId: null }, { userId: 4 }],
    });

    expect(row).toEqual({ event_id: 7, name: 'Sunday Service', event_date: at, registered: 5, members: 2, guests: 1, total: 3 });
  });
});

describe('checkInMember', () => {
  test('creates a record the first time', async () => {
    const prisma = buildPrismaMock();
    prisma.attendanceRecord.findFirst.mockResolvedValue(null);
    prisma.attendanceRecord.create.mockResolvedValue({ id: 20, eventId: 7, userId: 2, checkedInBy: 1, checkedInAt: at });
    const { checkInMember } = loadModel(prisma);

    const result = await checkInMember({ eventId: 7, userId: 2, checkedInBy: 1 });

    expect(result.created).toBe(true);
    expect(result.record).toEqual(expect.objectContaining({ id: 20, event_id: 7, user_id: 2 }));
    expect(prisma.attendanceRecord.create).toHaveBeenCalledWith({ data: { eventId: 7, userId: 2, checkedInBy: 1 } });
  });

  test('returns the existing record without creating another', async () => {
    const prisma = buildPrismaMock();
    prisma.attendanceRecord.findFirst.mockResolvedValue({ id: 20, eventId: 7, userId: 2 });
    const { checkInMember } = loadModel(prisma);

    const result = await checkInMember({ eventId: 7, userId: 2, checkedInBy: 1 });

    expect(result.created).toBe(false);
    expect(result.record.id).toBe(20);
    expect(prisma.attendanceRecord.create).not.toHaveBeenCalled();
  });

  test('a concurrent duplicate (unique violation) returns the winner instead of failing', async () => {
    const prisma = buildPrismaMock();
    prisma.attendanceRecord.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 21, eventId: 7, userId: 2 });
    prisma.attendanceRecord.create.mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }));
    const { checkInMember } = loadModel(prisma);

    const result = await checkInMember({ eventId: 7, userId: 2, checkedInBy: 1 });

    expect(result).toEqual({ record: expect.objectContaining({ id: 21 }), created: false });
  });

  test('other database errors still propagate', async () => {
    const prisma = buildPrismaMock();
    prisma.attendanceRecord.findFirst.mockResolvedValue(null);
    prisma.attendanceRecord.create.mockRejectedValue(new Error('connection lost'));
    const { checkInMember } = loadModel(prisma);

    await expect(checkInMember({ eventId: 7, userId: 2, checkedInBy: 1 })).rejects.toThrow('connection lost');
  });
});

describe('listCheckInEvents', () => {
  test('lists non-cancelled events in the window, soonest first', async () => {
    const prisma = buildPrismaMock();
    prisma.event = {
      findMany: jest.fn().mockResolvedValue([{ id: 7, name: 'Sunday Service', eventDate: at, location: 'Hall', status: 'active' }]),
    };
    const { listCheckInEvents } = loadModel(prisma);
    const from = new Date('2026-09-20T00:00:00Z');
    const to = new Date('2026-10-18T00:00:00Z');

    const events = await listCheckInEvents({ from, to });

    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: { eventDate: { gte: from, lte: to }, status: { not: 'cancelled' } },
      orderBy: { eventDate: 'asc' },
      take: 100,
      select: { id: true, name: true, eventDate: true, location: true, status: true },
    });
    expect(events).toEqual([{ id: 7, name: 'Sunday Service', event_date: at, location: 'Hall', status: 'active' }]);
  });
});
