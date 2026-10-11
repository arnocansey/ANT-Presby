const crypto = require('crypto');

// Crockford base32: no I, L, O or U, so codes are easy to read aloud and type.
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LENGTH = 10;
const QR_PREFIX = 'antpresby:member:';
const CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

const generateCheckInCode = () =>
  Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('');

const toQrText = (code) => `${QR_PREFIX}${code}`;

// Accepts a raw code or the full QR text from a scanner; returns the normalised code or null.
const parseScannedCode = (value) => {
  if (typeof value !== 'string') return null;
  let text = value.trim();
  if (text.toLowerCase().startsWith(QR_PREFIX)) text = text.slice(QR_PREFIX.length);
  const code = text.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');
  return CODE_PATTERN.test(code) ? code : null;
};

module.exports = { CODE_ALPHABET, QR_PREFIX, generateCheckInCode, parseScannedCode, toQrText };
