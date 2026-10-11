const buildPrismaMock = () => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
});

const loadModel = (prismaMock) => {
  jest.resetModules();
  jest.doMock('../../src/config/prisma', () => prismaMock);
  return require('../../src/models/userModel');
};

const collision = () => Object.assign(new Error('unique'), { code: 'P2002' });
const missing = () => Object.assign(new Error('missing'), { code: 'P2025' });

describe('check-in card model', () => {
  let prisma;
  let model;

  beforeEach(() => {
    prisma = buildPrismaMock();
    model = loadModel(prisma);
  });

  test('getOrCreateCheckInCode returns an existing code', async () => {
    prisma.user.findUnique.mockResolvedValue({ checkInCode: 'ABCDEFGHJK' });
    await expect(model.getOrCreateCheckInCode(2)).resolves.toBe('ABCDEFGHJK');
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  test('getOrCreateCheckInCode creates one only if still empty, retrying a collision', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ checkInCode: null });
    prisma.user.updateMany.mockRejectedValueOnce(collision()).mockResolvedValueOnce({ count: 1 });
    const code = await model.getOrCreateCheckInCode(2);
    expect(code).toMatch(/^[0-9A-Z]{10}$/);
    expect(prisma.user.updateMany).toHaveBeenCalledTimes(2);
    expect(prisma.user.updateMany.mock.calls[1][0]).toEqual({ where: { id: 2, checkInCode: null }, data: { checkInCode: code } });
  });

  test('getOrCreateCheckInCode returns the winner when another request set it first', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ checkInCode: null }).mockResolvedValueOnce({ checkInCode: 'WINNER0000' });
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(model.getOrCreateCheckInCode(2)).resolves.toBe('WINNER0000');
  });

  test('getOrCreateCheckInCode returns undefined for a missing user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(model.getOrCreateCheckInCode(99)).resolves.toBeUndefined();
  });

  test('getOrCreateCheckInCode gives up after 5 collisions', async () => {
    prisma.user.findUnique.mockResolvedValue({ checkInCode: null });
    prisma.user.updateMany.mockRejectedValue(collision());
    await expect(model.getOrCreateCheckInCode(2)).rejects.toThrow('Could not create a unique check-in code');
    expect(prisma.user.updateMany).toHaveBeenCalledTimes(5);
  });

  test('resetCheckInCode always writes a new code', async () => {
    prisma.user.update.mockResolvedValue({});
    const code = await model.resetCheckInCode(2);
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 2 }, data: { checkInCode: code } });
  });

  test('resetCheckInCode returns undefined for a missing user', async () => {
    prisma.user.update.mockRejectedValue(missing());
    await expect(model.resetCheckInCode(99)).resolves.toBeUndefined();
  });

  test('findMemberByCheckInCode maps the member', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, firstName: 'Ama', lastName: 'Mensah', isActive: true });
    await expect(model.findMemberByCheckInCode('ABCDEFGHJK')).resolves.toEqual({ id: 2, first_name: 'Ama', last_name: 'Mensah', is_active: true });
    expect(prisma.user.findUnique.mock.calls[0][0].where).toEqual({ checkInCode: 'ABCDEFGHJK' });
  });

  test('getAttendanceAccess reads role, active and the usher switch', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'member', isActive: true, canTakeAttendance: true });
    await expect(model.getAttendanceAccess(5)).resolves.toEqual({ role: 'member', is_active: true, can_take_attendance: true });
  });

  test('setCanTakeAttendance updates the switch', async () => {
    prisma.user.update.mockResolvedValue({ id: 5, firstName: 'Kofi', lastName: 'B', email: 'k@t.com', role: 'member', canTakeAttendance: true });
    const user = await model.setCanTakeAttendance(5, true);
    expect(prisma.user.update.mock.calls[0][0].data).toEqual({ canTakeAttendance: true });
    expect(user.can_take_attendance).toBe(true);
  });

  test('listCheckInCards fills missing codes and returns QR text', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 2, firstName: 'Ama', lastName: 'Mensah', checkInCode: 'ABCDEFGHJK' },
      { id: 3, firstName: 'Kofi', lastName: 'Boateng', checkInCode: null },
    ]);
    prisma.user.findUnique.mockResolvedValue({ checkInCode: null });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    const cards = await model.listCheckInCards([2, 3]);
    expect(prisma.user.findMany.mock.calls[0][0].where).toEqual({ isActive: true, id: { in: [2, 3] } });
    expect(cards[0]).toEqual({ id: 2, first_name: 'Ama', last_name: 'Mensah', code: 'ABCDEFGHJK', qr_text: 'antpresby:member:ABCDEFGHJK' });
    expect(cards[1].code).toMatch(/^[0-9A-Z]{10}$/);
  });

  test('searchActiveMembers only returns active members, limited', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 2, firstName: 'Ama', lastName: 'Mensah', email: 'a@t.com' }]);
    const rows = await model.searchActiveMembers('ama', 20);
    const args = prisma.user.findMany.mock.calls[0][0];
    expect(args.where.isActive).toBe(true);
    expect(args.take).toBe(20);
    expect(rows).toEqual([{ id: 2, first_name: 'Ama', last_name: 'Mensah', email: 'a@t.com' }]);
  });
});
