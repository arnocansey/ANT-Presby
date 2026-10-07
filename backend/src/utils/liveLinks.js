/**
 * Livestream link rules: which YouTube and Facebook links we accept, and the
 * YouTube video ID used for the web embed. Pure functions, no I/O.
 */

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'];
const FACEBOOK_HOSTS = ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com', 'fb.watch'];
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const MAX_LINK_LENGTH = 500;

// An https URL with no credentials and no explicit port, or null.
const parseHttpsUrl = (value) => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text || text.length > MAX_LINK_LENGTH) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    return url;
  } catch {
    return null;
  }
};

const isOnHost = (value, hosts) => {
  const url = parseHttpsUrl(value);
  return Boolean(url && hosts.includes(url.hostname));
};

const isYouTubeUrl = (value) => isOnHost(value, YOUTUBE_HOSTS);

const isFacebookUrl = (value) => isOnHost(value, FACEBOOK_HOSTS);

// Reads the ID from watch?v=<id>, youtu.be/<id>, /live/<id> and /embed/<id>.
const parseYouTubeId = (value) => {
  if (!isYouTubeUrl(value)) return null;
  const url = parseHttpsUrl(value);

  let candidate = null;
  if (url.hostname === 'youtu.be') {
    candidate = url.pathname.split('/')[1] || null;
  } else if (url.pathname === '/watch') {
    candidate = url.searchParams.get('v');
  } else {
    const match = url.pathname.match(/^\/(?:live|embed)\/([^/]+)\/?$/);
    candidate = match ? match[1] : null;
  }

  return candidate && VIDEO_ID.test(candidate) ? candidate : null;
};

const youtubeEmbedUrl = (value) => {
  const id = parseYouTubeId(value);
  return id ? `https://www.youtube.com/embed/${id}` : null;
};

module.exports = {
  MAX_LINK_LENGTH,
  isYouTubeUrl,
  isFacebookUrl,
  parseYouTubeId,
  youtubeEmbedUrl,
};
