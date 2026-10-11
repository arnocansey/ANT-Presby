const { generateCheckInCode, parseScannedCode, toQrText, CODE_ALPHABET } = require('../../src/utils/checkInCode');

describe('check-in card codes', () => {
  test('generates 10 characters from the Crockford alphabet', () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generateCheckInCode();
      expect(code).toHaveLength(10);
      expect([...code].every((ch) => CODE_ALPHABET.includes(ch))).toBe(true);
    }
  });

  test('QR text carries the member prefix', () => {
    expect(toQrText('ABCDEFGHJK')).toBe('antpresby:member:ABCDEFGHJK');
  });

  test.each([
    ['ABCDEFGHJK', 'ABCDEFGHJK'],
    ['  abcdefghjk  ', 'ABCDEFGHJK'],
    ['antpresby:member:abcdefghjk', 'ABCDEFGHJK'],
    ['ANTPRESBY:MEMBER:ABCDEFGHJK', 'ABCDEFGHJK'],
    ['O1234567IL', '0123456711'],
  ])('parses %p', (input, expected) => {
    expect(parseScannedCode(input)).toBe(expected);
  });

  test.each([[''], ['SHORT'], ['ABCDEFGHJKX'], ['ABCDEFGHJU'], [null], [42], ['antpresby:service:ABCDEFGHJK']])(
    'rejects %p',
    (input) => {
      expect(parseScannedCode(input)).toBeNull();
    }
  );
});
