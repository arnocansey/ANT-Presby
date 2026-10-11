// Spreadsheet-safe CSV: a leading = + - @ tab or CR would run as a formula in Excel, so it gets a ' first.
const FORMULA_START = /^[=+\-@\t\r]/;

// Byte order mark, so Excel reads names with accents as UTF-8.
const BOM = String.fromCharCode(0xfeff);

const escapeCell = (value) => {
  if (value === null || value === undefined) return '';
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// CRLF rows per RFC 4180.
const toCsv = (header, rows) => `${BOM}${[header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n')}\r\n`;

const slugify = (text) =>
  String(text || 'event')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'event';

module.exports = { escapeCell, toCsv, slugify };
