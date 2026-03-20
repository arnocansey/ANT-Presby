const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === '[object Object]';

const toSnakeCaseKey = (key) =>
  key.replace(/([A-Z])/g, '_$1').toLowerCase();

const normalizePrismaValue = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizePrismaValue(item));
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object') {
    // Prisma Decimal serializes safely as string.
    if (value.constructor && value.constructor.name === 'Decimal') {
      return value.toString();
    }

    if (isPlainObject(value)) {
      const mapped = {};
      Object.entries(value).forEach(([key, nestedValue]) => {
        mapped[toSnakeCaseKey(key)] = normalizePrismaValue(nestedValue);
      });
      return mapped;
    }
  }

  return value;
};

const toSnakeCaseObject = (value) => normalizePrismaValue(value);

const decimalToString = (value, fallback = '0') => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
    return value.toString();
  }

  return String(value);
};

module.exports = {
  toSnakeCaseObject,
  decimalToString,
};
