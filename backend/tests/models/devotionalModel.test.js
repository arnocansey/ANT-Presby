const load = (prismaMock = {}) => {
  jest.resetModules();
  jest.doMock('../../src/config/prisma', () => prismaMock);
  return require('../../src/models/devotionalModel');
};

const row = {
  id: 4,
  title: 'The Lord is my shepherd',
  scriptureReference: 'Psalm 23:1-3',
  scriptureText: 'The Lord is my shepherd...',
  body: 'Reflection',
  prayer: 'Amen',
  publishDate: new Date('2026-10-06T00:00:00Z'),
  status: 'published',
  authorId: 1,
  notifiedAt: null,
  createdAt: new Date('2026-10-01T00:00:00Z'),
  updatedAt: new Date('2026-10-01T00:00:00Z'),
};

describe('toDevotional', () => {
  test('returns snake_case with a YYYY-MM-DD publish date', () => {
    const item = load().toDevotional(row);
    expect(item).toEqual(
      expect.objectContaining({ id: 4, scripture_reference: 'Psalm 23:1-3', publish_date: '2026-10-06', status: 'published' })
    );
  });
});

describe('member-facing queries never include drafts or future dates', () => {
  test('getTodayDevotional prefers today, else the latest past one', async () => {
    const prisma = {
      devotional: {
        findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ ...row, publishDate: new Date('2026-10-04T00:00:00Z') }),
      },
    };
    const model = load(prisma);

    const result = await model.getTodayDevotional('2026-10-06');

    expect(prisma.devotional.findFirst).toHaveBeenNthCalledWith(1, {
      where: { status: 'published', publishDate: new Date('2026-10-06T00:00:00Z') },
    });
    expect(prisma.devotional.findFirst).toHaveBeenNthCalledWith(2, {
      where: { status: 'published', publishDate: { lte: new Date('2026-10-06T00:00:00Z') } },
      orderBy: { publishDate: 'desc' },
    });
    expect(result).toEqual(expect.objectContaining({ publish_date: '2026-10-04', is_today: false }));
  });

  test('getTodayDevotional marks today as is_today', async () => {
    const prisma = { devotional: { findFirst: jest.fn().mockResolvedValue(row) } };
    expect(await load(prisma).getTodayDevotional('2026-10-06')).toEqual(expect.objectContaining({ is_today: true }));
  });

  test('getTodayDevotional returns null when nothing is published', async () => {
    const prisma = { devotional: { findFirst: jest.fn().mockResolvedValue(null) } };
    expect(await load(prisma).getTodayDevotional('2026-10-06')).toBeNull();
  });

  test('getPublishedById filters by status and date', async () => {
    const prisma = { devotional: { findFirst: jest.fn().mockResolvedValue(null) } };
    await load(prisma).getPublishedById(4, '2026-10-06');
    expect(prisma.devotional.findFirst).toHaveBeenCalledWith({
      where: { id: 4, status: 'published', publishDate: { lte: new Date('2026-10-06T00:00:00Z') } },
    });
  });
});

describe('claimNotification', () => {
  test('only the caller that sets notifiedAt wins', async () => {
    const prisma = { devotional: { updateMany: jest.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 }) } };
    const model = load(prisma);

    expect(await model.claimNotification(4)).toBe(true);
    expect(await model.claimNotification(4)).toBe(false);
    expect(prisma.devotional.updateMany).toHaveBeenCalledWith({
      where: { id: 4, notifiedAt: null, status: 'published' },
      data: { notifiedAt: expect.any(Date) },
    });
  });
});

describe('updateDevotional and the notification flag', () => {
  test('moving a devotional to a new date clears notified, so it can notify on its new day', async () => {
    const prisma = {
      devotional: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue({ ...row, publishDate: new Date('2026-10-09T00:00:00Z') }),
      },
    };

    await load(prisma).updateDevotional(4, { publishDate: '2026-10-09' });

    expect(prisma.devotional.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: 4, NOT: { publishDate: new Date('2026-10-09T00:00:00.000Z') } },
      data: { notifiedAt: null },
    });
  });

  test('editing without changing the date leaves notified alone', async () => {
    const prisma = {
      devotional: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue(row),
      },
    };

    await load(prisma).updateDevotional(4, { title: 'New title' });

    expect(prisma.devotional.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.devotional.updateMany.mock.calls[0][0].data).not.toHaveProperty('notifiedAt');
  });
});
