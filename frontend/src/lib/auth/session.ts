export type AuthSession = {
  role?: string;
  sub?: string | number;
  exp?: number;
  [key: string]: unknown;
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');

  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(padded);
  }

  return Buffer.from(padded, 'base64').toString('utf-8');
};

export const decodeJwtPayload = (token?: string | null): AuthSession | null => {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
};

export const isTokenExpired = (payload?: AuthSession | null) => {
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
};

export const getSessionFromToken = (token?: string | null) => {
  const payload = decodeJwtPayload(token);
  if (!payload || isTokenExpired(payload)) return null;
  return payload;
};
