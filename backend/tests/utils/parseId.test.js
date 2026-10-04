const { parseId } = require('../../src/utils/helpers');

describe('parseId', () => {
  test.each([
    ['7', 7],
    [7, 7],
    ['123', 123],
  ])('accepts %p', (input, expected) => {
    expect(parseId(input)).toBe(expected);
  });

  test.each(['abc', '1.5', '0', '-2', '', '07', '1e3', ' 7', undefined, null, {}])('rejects %p', (input) => {
    expect(parseId(input)).toBeNull();
  });
});

describe('parseId range', () => {
  test('accepts the largest database integer', () => {
    expect(parseId('2147483647')).toBe(2147483647);
  });

  test('rejects ids beyond the database integer range', () => {
    expect(parseId('2147483648')).toBeNull();
    expect(parseId('99999999999')).toBeNull();
  });
});
