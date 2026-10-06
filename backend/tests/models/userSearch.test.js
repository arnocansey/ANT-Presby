const { buildUserSearchWhere } = require('../../src/models/userModel');

const wordFilter = (word) => ({
  OR: [
    { firstName: { contains: word, mode: 'insensitive' } },
    { lastName: { contains: word, mode: 'insensitive' } },
    { email: { contains: word, mode: 'insensitive' } },
  ],
});

describe('buildUserSearchWhere', () => {
  test('an empty or blank term matches everyone', () => {
    expect(buildUserSearchWhere('')).toEqual({});
    expect(buildUserSearchWhere('   ')).toEqual({});
    expect(buildUserSearchWhere(undefined)).toEqual({});
  });

  test('each word must match a name or the email', () => {
    expect(buildUserSearchWhere('  Ama   Mensah ')).toEqual({ AND: [wordFilter('Ama'), wordFilter('Mensah')] });
  });

  test('at most five words are used', () => {
    expect(buildUserSearchWhere('a b c d e f g').AND).toHaveLength(5);
  });
});
