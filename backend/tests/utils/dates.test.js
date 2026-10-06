describe('getChurchToday', () => {
  const original = process.env.CHURCH_TIMEZONE;
  afterEach(() => {
    if (original === undefined) delete process.env.CHURCH_TIMEZONE;
    else process.env.CHURCH_TIMEZONE = original;
    jest.resetModules();
  });

  const load = () => require('../../src/utils/dates');

  test('defaults to Africa/Accra (UTC+0)', () => {
    delete process.env.CHURCH_TIMEZONE;
    expect(load().getChurchToday(new Date('2026-10-06T23:30:00Z'))).toBe('2026-10-06');
  });

  test('follows the configured time zone across midnight', () => {
    process.env.CHURCH_TIMEZONE = 'Pacific/Auckland';
    expect(load().getChurchToday(new Date('2026-10-06T23:30:00Z'))).toBe('2026-10-07');
    process.env.CHURCH_TIMEZONE = 'America/Los_Angeles';
    expect(load().getChurchToday(new Date('2026-10-07T03:00:00Z'))).toBe('2026-10-06');
  });

  test('an invalid time zone falls back instead of crashing', () => {
    process.env.CHURCH_TIMEZONE = 'Not/AZone';
    expect(load().getChurchToday(new Date('2026-10-06T12:00:00Z'))).toBe('2026-10-06');
  });

  test('dateOnly makes a UTC-midnight date', () => {
    expect(load().dateOnly('2026-10-06').toISOString()).toBe('2026-10-06T00:00:00.000Z');
  });
});
