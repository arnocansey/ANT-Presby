const { mapSermon } = require('../../src/models/sermonModel');

const row = {
  id: 5,
  title: 'Grace',
  speaker: 'Rev. Ofori',
  description: 'On grace',
  videoUrl: 'https://youtube.com/watch?v=x',
  sermonDate: new Date('2026-09-20T00:00:00Z'),
  ministryId: 2,
  seriesId: 3,
  createdAt: new Date('2026-09-20T00:00:00Z'),
  updatedAt: new Date('2026-09-20T00:00:00Z'),
};

describe('mapSermon', () => {
  test('flattens ministry and series names', () => {
    const mapped = mapSermon({ ...row, ministry: { name: 'Youth' }, series: { id: 3, title: 'Romans' } });

    expect(mapped.ministry_name).toBe('Youth');
    expect(mapped.series_title).toBe('Romans');
    expect(mapped.series_id).toBe(3);
    expect(mapped.video_url).toBe('https://youtube.com/watch?v=x');
    expect(mapped).not.toHaveProperty('ministry');
    expect(mapped).not.toHaveProperty('series');
  });

  test('uses null when a sermon has no ministry or series', () => {
    const mapped = mapSermon({ ...row, ministryId: null, seriesId: null, ministry: null, series: null });

    expect(mapped.ministry_name).toBeNull();
    expect(mapped.series_title).toBeNull();
  });
});
