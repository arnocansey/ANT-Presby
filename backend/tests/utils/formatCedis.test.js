const { formatCedis } = require('../../src/utils/helpers');

describe('formatCedis', () => {
  test.each([
    [1250, 'GH₵ 1,250.00'],
    ['25.5', 'GH₵ 25.50'],
    ['1250.00', 'GH₵ 1,250.00'],
    [null, 'GH₵ 0.00'],
    ['not-a-number', 'GH₵ 0.00'],
  ])('formats %p as %s', (amount, expected) => {
    expect(formatCedis(amount)).toBe(expected);
  });
});
