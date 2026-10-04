/**
 * Allowlist for URLs we redirect users to (OAuth results, payment callbacks).
 * Only our own web origins and the mobile app scheme are accepted, so tokens
 * and payment references are never sent to third-party sites.
 */
const getMobileScheme = () => process.env.MOBILE_APP_SCHEME || 'antpressmobile';

const getAllowedWebOrigins = () =>
  [process.env.APP_BASE_URL, process.env.FRONTEND_URL]
    .concat(String(process.env.CORS_ORIGINS || '').split(','))
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .map((value) => {
      try {
        return new URL(value).origin;
      } catch (_error) {
        return null;
      }
    })
    .filter(Boolean);

const isAllowedMobileRedirectUri = (value) =>
  typeof value === 'string' && value.startsWith(`${getMobileScheme()}://`);

// Expo Go deep links (exp://) are only accepted outside production.
const isAllowedDevMobileRedirectUri = (value) =>
  process.env.NODE_ENV !== 'production' &&
  typeof value === 'string' &&
  /^exps?:\/\//i.test(value);

const isAllowedWebRedirectUri = (value) => {
  if (typeof value !== 'string') return false;

  try {
    return getAllowedWebOrigins().includes(new URL(value).origin);
  } catch (_error) {
    return false;
  }
};

const isAllowedAppRedirectUri = (value) =>
  isAllowedMobileRedirectUri(value) ||
  isAllowedDevMobileRedirectUri(value) ||
  isAllowedWebRedirectUri(value);

module.exports = {
  getMobileScheme,
  isAllowedMobileRedirectUri,
  isAllowedWebRedirectUri,
  isAllowedAppRedirectUri,
};
