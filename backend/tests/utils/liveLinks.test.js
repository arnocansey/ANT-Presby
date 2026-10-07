const { isYouTubeUrl, isFacebookUrl, parseYouTubeId, youtubeEmbedUrl } = require('../../src/utils/liveLinks');

const ID = 'dQw4w9WgXcQ';

describe('liveLinks', () => {
  test.each([
    ['watch?v=', `https://www.youtube.com/watch?v=${ID}`],
    ['watch?v= with extra parameters', `https://m.youtube.com/watch?feature=share&v=${ID}&t=30`],
    ['youtu.be/', `https://youtu.be/${ID}?si=abc123`],
    ['/live/', `https://www.youtube.com/live/${ID}?feature=shared`],
    ['/embed/', `https://youtube.com/embed/${ID}`],
  ])('reads the video ID from a %s link', (_label, url) => {
    expect(parseYouTubeId(url)).toBe(ID);
  });

  test.each([
    ["a channel's live page", 'https://www.youtube.com/@antpresby/live'],
    ['a malformed ID', 'https://www.youtube.com/watch?v=short'],
    ['a non-YouTube link', `https://vimeo.com/${ID}`],
    ['text that is not a link', 'not a link'],
  ])('finds no video ID in %s', (_label, url) => {
    expect(parseYouTubeId(url)).toBeNull();
  });

  test('accepts https links on every YouTube host', () => {
    expect(isYouTubeUrl(`https://youtube.com/watch?v=${ID}`)).toBe(true);
    expect(isYouTubeUrl(`https://www.youtube.com/live/${ID}`)).toBe(true);
    expect(isYouTubeUrl(`https://m.youtube.com/watch?v=${ID}`)).toBe(true);
    expect(isYouTubeUrl(`https://youtu.be/${ID}`)).toBe(true);
    expect(isYouTubeUrl('https://www.youtube.com/@antpresby/live')).toBe(true);
  });

  test.each([
    ['plain http', `http://www.youtube.com/watch?v=${ID}`],
    ['a lookalike host', `https://youtube.com.evil.example/watch?v=${ID}`],
    ['a subdomain we do not list', `https://music.youtube.com/watch?v=${ID}`],
    ['a javascript: link', 'javascript:alert(1)'],
    ['an explicit port', `https://www.youtube.com:8443/watch?v=${ID}`],
    ['embedded credentials', `https://user:pass@www.youtube.com/watch?v=${ID}`],
    ['more than 500 characters', `https://www.youtube.com/watch?v=${ID}&x=${'a'.repeat(500)}`],
    ['a value that is not text', 42],
  ])('refuses a YouTube link with %s', (_label, url) => {
    expect(isYouTubeUrl(url)).toBe(false);
  });

  test('accepts https links on every Facebook host', () => {
    expect(isFacebookUrl('https://facebook.com/antpresby/live')).toBe(true);
    expect(isFacebookUrl('https://www.facebook.com/antpresby/videos/123')).toBe(true);
    expect(isFacebookUrl('https://m.facebook.com/antpresby')).toBe(true);
    expect(isFacebookUrl('https://web.facebook.com/antpresby')).toBe(true);
    expect(isFacebookUrl('https://fb.watch/abcDEF123/')).toBe(true);
  });

  test.each([
    ['plain http', 'http://www.facebook.com/antpresby/videos/123'],
    ['a lookalike host', 'https://facebook.com.evil.example/antpresby'],
    ['another site', `https://www.youtube.com/watch?v=${ID}`],
  ])('refuses a Facebook link with %s', (_label, url) => {
    expect(isFacebookUrl(url)).toBe(false);
  });

  test('derives the embed URL from the video ID, or null without one', () => {
    expect(youtubeEmbedUrl(`https://youtu.be/${ID}`)).toBe(`https://www.youtube.com/embed/${ID}`);
    expect(youtubeEmbedUrl(`https://www.youtube.com/live/${ID}`)).toBe(`https://www.youtube.com/embed/${ID}`);
    expect(youtubeEmbedUrl('https://www.youtube.com/@antpresby/live')).toBeNull();
    expect(youtubeEmbedUrl(null)).toBeNull();
  });
});
