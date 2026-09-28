const { toWallItem } = require('../../src/models/prayerRequestModel');

const baseRow = {
  id: 3,
  userId: 42,
  title: 'Job interview',
  description: 'Pray for peace',
  category: 'work',
  status: 'approved',
  prayerCount: 4,
  createdAt: new Date('2026-09-20T10:00:00Z'),
  user: { firstName: 'Ama', lastName: 'Mensah' },
  intercessions: [],
};

describe('toWallItem', () => {
  test('anonymous requests never identify the author', () => {
    const item = toWallItem({ ...baseRow, isAnonymous: true });

    expect(item.requester_name).toBe('A church member');
    expect(JSON.stringify(item)).not.toMatch(/Ama|Mensah|"user_id"|"user"|42/);
  });

  test('named requests show the member name', () => {
    const item = toWallItem({ ...baseRow, isAnonymous: false });
    expect(item.requester_name).toBe('Ama Mensah');
    expect(item).not.toHaveProperty('user_id');
  });

  test('prayed_by_me reflects the viewer intercession', () => {
    expect(toWallItem({ ...baseRow, isAnonymous: false }).prayed_by_me).toBe(false);
    expect(toWallItem({ ...baseRow, isAnonymous: false, intercessions: [{ id: 1 }] }).prayed_by_me).toBe(true);
  });

  test('exposes exactly the public wall fields', () => {
    const item = toWallItem({ ...baseRow, isAnonymous: false });
    expect(Object.keys(item).sort()).toEqual(
      [
        'category',
        'created_at',
        'description',
        'id',
        'prayed_by_me',
        'prayer_count',
        'requester_name',
        'status',
        'title',
      ].sort()
    );
  });
});
