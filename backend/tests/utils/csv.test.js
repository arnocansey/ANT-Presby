const { escapeCell, toCsv } = require('../../src/utils/csv');

const BOM = String.fromCharCode(0xfeff);

describe('csv', () => {
  test.each([
    ['plain', 'plain'],
    ['a,b', '"a,b"'],
    ['say "hi"', '"say ""hi"""'],
    ['line\nbreak', '"line\nbreak"'],
    ['=SUM(A1)', "'=SUM(A1)"],
    ['+233', "'+233"],
    ['-1', "'-1"],
    ['@cmd', "'@cmd"],
    ['=a,b', '"\'=a,b"'],
    [null, ''],
    [undefined, ''],
    [12, '12'],
  ])('escapes %p', (input, expected) => {
    expect(escapeCell(input)).toBe(expected);
  });

  test('dates become ISO text', () => {
    expect(escapeCell(new Date('2026-10-11T09:00:00Z'))).toBe('2026-10-11T09:00:00.000Z');
  });

  test('starts with a BOM and uses CRLF rows', () => {
    expect(toCsv(['A', 'B'], [[1, 'x']])).toBe(`${BOM}A,B\r\n1,x\r\n`);
  });
});
