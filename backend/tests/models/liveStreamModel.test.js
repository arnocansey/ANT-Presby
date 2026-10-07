const { createFakeLivePrisma } = require('../helpers/fakeLivePrisma');

const ID = 'dQw4w9WgXcQ';
const input = { title: 'Sunday Service', youtubeUrl: `https://youtu.be/${ID}`, facebookUrl: null, userId: 1 };
const NOT_LIVE = {
  is_live: false,
  title: null,
  youtube_url: null,
  facebook_url: null,
  youtube_embed_url: null,
  started_at: null,
};

const load = (fake) => {
  jest.resetModules();
  jest.doMock('../../src/config/prisma', () => fake.prisma);
  return require('../../src/models/liveStreamModel');
};

describe('liveStreamModel', () => {
  test('there is no row until the first start, and that reads as not live', async () => {
    const model = load(createFakeLivePrisma());

    const row = await model.getLiveStream();

    expect(row).toBeNull();
    expect(model.toLiveState(row)).toEqual(NOT_LIVE);
  });

  test('going live creates the row if needed, locks it, and reports the change', async () => {
    const fake = createFakeLivePrisma();
    const model = load(fake);

    const { stream, becameLive } = await model.startLive(input);

    expect(becameLive).toBe(true);
    expect(stream).toMatchObject({
      isLive: true,
      title: 'Sunday Service',
      youtubeUrl: input.youtubeUrl,
      facebookUrl: null,
      updatedBy: 1,
      endedAt: null,
    });
    expect(stream.startedAt).toBeInstanceOf(Date);
    expect(fake.state.sql[0]).toContain('ON CONFLICT (id) DO NOTHING');
    expect(fake.state.sql[1]).toContain('FOR UPDATE');
  });

  test('updating the links while live keeps the start time and reports no change', async () => {
    const startedAt = new Date('2026-10-04T09:00:00Z');
    const model = load(createFakeLivePrisma({ isLive: true, title: 'Old title', youtubeUrl: 'https://youtu.be/aaaaaaaaaaa', startedAt }));

    const { stream, becameLive } = await model.startLive(input);

    expect(becameLive).toBe(false);
    expect(stream.startedAt).toEqual(startedAt);
    expect(stream.title).toBe('Sunday Service');
    expect(stream.youtubeUrl).toBe(input.youtubeUrl);
  });

  test('two simultaneous starts: exactly one reports going live', async () => {
    const fake = createFakeLivePrisma();
    const model = load(fake);

    const results = await Promise.all([model.startLive(input), model.startLive({ ...input, userId: 2 })]);

    expect(results.filter((result) => result.becameLive)).toHaveLength(1);
    expect(fake.prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(fake.state.row.isLive).toBe(true);
  });

  test('ending records the end time once; ending again changes nothing', async () => {
    const model = load(createFakeLivePrisma({ isLive: true, title: 'Sunday Service', startedAt: new Date() }));

    const first = await model.endLive({ userId: 1 });
    const second = await model.endLive({ userId: 1 });

    expect(first.wasLive).toBe(true);
    expect(first.stream.isLive).toBe(false);
    expect(first.stream.endedAt).toBeInstanceOf(Date);
    expect(second.wasLive).toBe(false);
    expect(second.stream.endedAt).toEqual(first.stream.endedAt);
  });

  test('ending when nothing was ever started reports not live', async () => {
    const model = load(createFakeLivePrisma());

    const { stream, wasLive } = await model.endLive({ userId: 1 });

    expect(wasLive).toBe(false);
    expect(model.toLiveState(stream)).toEqual(NOT_LIVE);
  });

  test('the public state shows the links and the embed only while live', () => {
    const model = load(createFakeLivePrisma());
    const row = {
      isLive: true,
      title: 'Sunday Service',
      youtubeUrl: `https://www.youtube.com/live/${ID}`,
      facebookUrl: 'https://fb.watch/abcDEF123/',
      startedAt: new Date('2026-10-04T09:00:00Z'),
    };

    expect(model.toLiveState(row)).toEqual({
      is_live: true,
      title: 'Sunday Service',
      youtube_url: row.youtubeUrl,
      facebook_url: row.facebookUrl,
      youtube_embed_url: `https://www.youtube.com/embed/${ID}`,
      started_at: row.startedAt,
    });
    expect(model.toLiveState({ ...row, isLive: false })).toEqual(NOT_LIVE);
  });
});
