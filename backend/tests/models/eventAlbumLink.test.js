const load = (prismaMock) => {
  jest.resetModules();
  jest.doMock('../../src/config/prisma', () => prismaMock);
  return require('../../src/models/eventModel');
};

const eventRow = (albums) => ({
  id: 4,
  name: 'Harvest',
  eventDate: new Date('2026-10-05T10:00:00Z'),
  imageUrl: null,
  _count: { registrations: 2 },
  albums,
});

describe('eventModel.getEventById album link', () => {
  test('adds the first published album id', async () => {
    const prisma = { event: { findUnique: jest.fn().mockResolvedValue(eventRow([{ id: 9 }])) } };

    const event = await load(prisma).getEventById(4);

    expect(prisma.event.findUnique).toHaveBeenCalledWith({
      where: { id: 4 },
      include: {
        _count: { select: { registrations: true } },
        albums: { where: { isPublished: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: 1, select: { id: true } },
      },
    });
    expect(event).toEqual(expect.objectContaining({ id: 4, registered_count: 2, album_id: 9 }));
    expect(event).not.toHaveProperty('albums');
    expect(event).not.toHaveProperty('_count');
  });

  test('album_id is null when the event has no published album', async () => {
    const prisma = { event: { findUnique: jest.fn().mockResolvedValue(eventRow([])) } };

    expect(await load(prisma).getEventById(4)).toEqual(expect.objectContaining({ album_id: null }));
  });
});
