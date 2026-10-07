const load = (prismaMock = {}) => {
  jest.resetModules();
  jest.doMock('../../src/config/prisma', () => prismaMock);
  return require('../../src/models/photoAlbumModel');
};

const WHEN = new Date('2026-10-05T10:00:00Z');
const photoRow = (id, albumId = 3) => ({
  id,
  albumId,
  publicId: `antpresby/albums/${albumId}/p${id}`,
  url: `https://res.cloudinary.com/demo/image/upload/v1/antpresby/albums/${albumId}/p${id}.jpg`,
  width: 800,
  height: 600,
  bytes: 1000,
  format: 'jpg',
  sortOrder: id,
  createdAt: WHEN,
});
const albumRow = (overrides = {}) => ({
  id: 3,
  title: 'Harvest',
  description: null,
  eventId: 4,
  event: { name: 'Harvest Sunday' },
  externalUrl: null,
  coverPhotoId: null,
  isPublished: true,
  notifiedAt: null,
  createdBy: 1,
  createdAt: WHEN,
  updatedAt: WHEN,
  photos: [],
  _count: { photos: 0 },
  ...overrides,
});
const PHOTO_ORDER = [{ sortOrder: 'asc' }, { id: 'asc' }];

describe('photoAlbumModel', () => {
  test('listPublished shows only published albums, with the chosen cover or else the first photo', async () => {
    const prisma = {
      photoAlbum: {
        findMany: jest.fn().mockResolvedValue([
          albumRow({ id: 3, coverPhotoId: 12, photos: [photoRow(11, 3)], _count: { photos: 2 } }),
          albumRow({ id: 4, coverPhotoId: 99, photos: [photoRow(21, 4)], _count: { photos: 1 } }),
          albumRow({ id: 5, eventId: null, event: null }),
        ]),
      },
      albumPhoto: { findMany: jest.fn().mockResolvedValue([photoRow(12, 3), photoRow(99, 8)]) },
    };

    const albums = await load(prisma).listPublished({ offset: 0, limit: 12 });

    expect(prisma.photoAlbum.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isPublished: true }, skip: 0, take: 12, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
    );
    expect(prisma.albumPhoto.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: [12, 99] } } }));
    expect(albums.map((album) => album.cover && album.cover.public_id)).toEqual([
      'antpresby/albums/3/p12',
      'antpresby/albums/4/p21',
      null,
    ]);
    expect(albums[0]).toEqual(expect.objectContaining({ id: 3, event_name: 'Harvest Sunday', photo_count: 2, is_published: true }));
    expect(albums[2]).toEqual(expect.objectContaining({ event_id: null, event_name: null, photo_count: 0 }));
  });

  test('getPublishedById returns ordered photos and hides drafts', async () => {
    const prisma = {
      photoAlbum: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(albumRow({ coverPhotoId: 12, photos: [photoRow(11), photoRow(12)] }))
          .mockResolvedValueOnce(null),
      },
    };
    const model = load(prisma);

    const album = await model.getPublishedById(3);

    expect(prisma.photoAlbum.findFirst).toHaveBeenCalledWith({
      where: { id: 3, isPublished: true },
      include: { event: { select: { name: true } }, photos: { orderBy: PHOTO_ORDER } },
    });
    expect(album).toEqual(
      expect.objectContaining({ id: 3, photo_count: 2, cover: { public_id: 'antpresby/albums/3/p12', url: photoRow(12).url } })
    );
    expect(album.photos[0]).toEqual(expect.objectContaining({ id: 11, public_id: 'antpresby/albums/3/p11', sort_order: 11 }));
    expect(await model.getPublishedById(3)).toBeUndefined();
  });

  test('addPhotos continues the sort order and skips duplicates', async () => {
    const prisma = {
      albumPhoto: {
        aggregate: jest.fn().mockResolvedValue({ _max: { sortOrder: 4 } }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const added = await load(prisma).addPhotos(3, [
      { publicId: 'antpresby/albums/3/a', url: 'https://x/a.jpg', width: 10, height: 20, bytes: 30, format: 'jpg' },
      { publicId: 'antpresby/albums/3/b', url: 'https://x/b.jpg' },
    ]);

    expect(added).toBe(1);
    expect(prisma.albumPhoto.aggregate).toHaveBeenCalledWith({ where: { albumId: 3 }, _max: { sortOrder: true } });
    expect(prisma.albumPhoto.createMany).toHaveBeenCalledWith({
      data: [
        { albumId: 3, publicId: 'antpresby/albums/3/a', url: 'https://x/a.jpg', width: 10, height: 20, bytes: 30, format: 'jpg', sortOrder: 5 },
        { albumId: 3, publicId: 'antpresby/albums/3/b', url: 'https://x/b.jpg', width: null, height: null, bytes: null, format: null, sortOrder: 6 },
      ],
      skipDuplicates: true,
    });
  });

  test('deletePhoto only deletes a photo of this album and clears it as the cover', async () => {
    const prisma = {
      albumPhoto: {
        findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(photoRow(12)),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      photoAlbum: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      $transaction: jest.fn((operations) => Promise.all(operations)),
    };
    const model = load(prisma);

    expect(await model.deletePhoto(3, 12)).toBeUndefined();
    expect(prisma.$transaction).not.toHaveBeenCalled();

    const deleted = await model.deletePhoto(3, 12);

    expect(prisma.albumPhoto.findFirst).toHaveBeenLastCalledWith({ where: { id: 12, albumId: 3 } });
    expect(prisma.albumPhoto.deleteMany).toHaveBeenCalledWith({ where: { id: 12 } });
    expect(prisma.photoAlbum.updateMany).toHaveBeenCalledWith({ where: { id: 3, coverPhotoId: 12 }, data: { coverPhotoId: null } });
    expect(deleted).toEqual(expect.objectContaining({ id: 12, public_id: 'antpresby/albums/3/p12' }));
  });

  test('setCover refuses a photo from another album', async () => {
    const prisma = {
      albumPhoto: { findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 12 }) },
      photoAlbum: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const model = load(prisma);

    expect(await model.setCover(3, 99)).toBe(false);
    expect(prisma.photoAlbum.updateMany).not.toHaveBeenCalled();

    expect(await model.setCover(3, 12)).toBe(true);
    expect(prisma.albumPhoto.findFirst).toHaveBeenLastCalledWith({ where: { id: 12, albumId: 3 }, select: { id: true } });
    expect(prisma.photoAlbum.updateMany).toHaveBeenCalledWith({ where: { id: 3 }, data: { coverPhotoId: 12 } });
  });

  test('claimNotification only succeeds once, for a published album with photos', async () => {
    const prisma = { photoAlbum: { updateMany: jest.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 }) } };
    const model = load(prisma);

    expect(await model.claimNotification(3)).toBe(true);
    expect(await model.claimNotification(3)).toBe(false);
    expect(prisma.photoAlbum.updateMany).toHaveBeenCalledWith({
      where: { id: 3, isPublished: true, notifiedAt: null, photos: { some: {} } },
      data: { notifiedAt: expect.any(Date) },
    });
  });

  test('createAlbum trims text and stores blanks as null', async () => {
    const prisma = {
      photoAlbum: {
        create: jest.fn().mockResolvedValue({ id: 3 }),
        findUnique: jest.fn().mockResolvedValue(albumRow({ isPublished: false })),
      },
    };

    const album = await load(prisma).createAlbum(
      { title: '  Harvest ', description: '   ', eventId: null, externalUrl: '', isPublished: false },
      1
    );

    expect(prisma.photoAlbum.create).toHaveBeenCalledWith({
      data: { title: 'Harvest', description: null, eventId: null, externalUrl: null, isPublished: false, createdBy: 1 },
    });
    expect(album).toEqual(expect.objectContaining({ id: 3, is_published: false, photos: [] }));
  });
});
