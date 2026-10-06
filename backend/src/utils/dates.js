/**
 * Church-calendar dates. "Today" is decided in the church's time zone, not the server's.
 */
const DEFAULT_TIMEZONE = 'Africa/Accra';

const formatYmd = (date, timeZone) =>
  // en-CA formats as YYYY-MM-DD
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

const getChurchToday = (now = new Date()) => {
  const timeZone = process.env.CHURCH_TIMEZONE || DEFAULT_TIMEZONE;
  try {
    return formatYmd(now, timeZone);
  } catch (_error) {
    return formatYmd(now, DEFAULT_TIMEZONE);
  }
};

// 'YYYY-MM-DD' -> Date at UTC midnight (how Prisma represents @db.Date values)
const dateOnly = (ymd) => new Date(`${ymd}T00:00:00.000Z`);

module.exports = {
  DEFAULT_TIMEZONE,
  getChurchToday,
  dateOnly,
};
