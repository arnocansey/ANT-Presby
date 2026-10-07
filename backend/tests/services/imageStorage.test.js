const fs = require('fs');
const path = require('path');

const KEYS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const OWN = 'https://res.cloudinary.com/demo/image/upload/v1700000000/antpresby/series/abc123.png';

describe('imageStorage', () => {
  const saved = {};
  let cloudinary;

  const load = () => {
    jest.resetModules();
    cloudinary = {
      v2: {
        config: jest.fn(),
        uploader: {
          upload_stream: jest.fn((options, callback) => ({
            end: () =>
              callback(null, {
                secure_url: `https://res.cloudinary.com/demo/image/upload/v1/${options.folder}/abc123.png`,
                public_id: `${options.folder}/abc123`,
              }),
          })),
          destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
        },
      },
    };
    jest.doMock('cloudinary', () => cloudinary);
    return require('../../src/services/imageStorage');
  };

  const configure = () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'demo';
    process.env.CLOUDINARY_API_KEY = 'test-placeholder-key';
    process.env.CLOUDINARY_API_SECRET = 'test-placeholder-secret';
  };

  const png = { buffer: Buffer.from('fake-png'), mimetype: 'image/png' };

  beforeEach(() => {
    KEYS.forEach((key) => {
      saved[key] = process.env[key];
      delete process.env[key];
    });
  });

  afterEach(() => {
    KEYS.forEach((key) => {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    });
  });

  test('is configured only when all three Cloudinary settings are present', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'demo';
    process.env.CLOUDINARY_API_KEY = 'test-placeholder-key';
    expect(load().isConfigured()).toBe(false);

    process.env.CLOUDINARY_API_SECRET = 'test-placeholder-secret';
    expect(load().isConfigured()).toBe(true);
  });

  test('uploads to the antpresby/<kind> folder on Cloudinary and returns the secure url', async () => {
    configure();
    const storage = load();

    const result = await storage.uploadImage(png, { kind: 'news', actorId: 7 });

    expect(cloudinary.v2.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({ folder: 'antpresby/news', resource_type: 'image' }),
      expect.any(Function)
    );
    expect(cloudinary.v2.config).toHaveBeenCalledWith(expect.objectContaining({ cloud_name: 'demo', secure: true }));
    expect(result).toEqual({
      url: 'https://res.cloudinary.com/demo/image/upload/v1/antpresby/news/abc123.png',
      publicId: 'antpresby/news/abc123',
      fileName: 'antpresby/news/abc123',
    });
  });

  test('a Cloudinary failure becomes a 502 storage error', async () => {
    configure();
    const storage = load();
    cloudinary.v2.uploader.upload_stream.mockImplementation((options, callback) => ({
      end: () => callback(new Error('cloudinary down')),
    }));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(storage.uploadImage(png, { kind: 'news', actorId: 7 })).rejects.toMatchObject({
      statusCode: 502,
      message: 'Image storage is unavailable, please try again',
    });

    warn.mockRestore();
  });

  test('without Cloudinary it saves to the uploads folder with the same file names as before', async () => {
    const storage = load();

    const result = await storage.uploadImage(png, { kind: 'events', actorId: 7 });

    expect(cloudinary.v2.uploader.upload_stream).not.toHaveBeenCalled();
    expect(result.url).toMatch(/^\/uploads\/event-images\/event-7-\d+\.png$/);
    expect(result.publicId).toBeNull();
    const filePath = path.join(__dirname, '..', '..', result.url);
    expect(fs.readFileSync(filePath).toString()).toBe('fake-png');
    fs.rmSync(filePath, { force: true });
  });

  test('rejects an unknown image kind', async () => {
    await expect(load().uploadImage(png, { kind: 'avatars', actorId: 1 })).rejects.toThrow('Unknown image kind');
  });

  test.each([
    ['our uploaded series file', '/uploads/series-images/series-1-123.png'],
    ['our Cloudinary series image', OWN],
  ])('recognises %s as a series image', (_label, url) => {
    configure();
    expect(load().isOwnImageUrl(url, 'series')).toBe(true);
  });

  test.each([
    ['another Cloudinary cloud', OWN.replace('/demo/', '/someone-else/')],
    ['another kind\'s folder', OWN.replace('/series/', '/profile/')],
    ['a profile upload', '/uploads/profile-images/user-1.png'],
    ['a path traversal', '/uploads/series-images/../x.png'],
    ['a script url', 'javascript:alert(1)'],
  ])('does not accept %s as a series image', (_label, url) => {
    configure();
    expect(load().isOwnImageUrl(url, 'series')).toBe(false);
  });

  test('deleteImage removes our Cloudinary image by its public id', async () => {
    configure();
    const storage = load();

    await expect(storage.deleteImage(OWN)).resolves.toBe(true);

    expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith('antpresby/series/abc123', { resource_type: 'image' });
  });

  test('deleteImage ignores local files and other clouds', async () => {
    configure();
    const storage = load();

    expect(await storage.deleteImage('/uploads/series-images/series-1-123.png')).toBe(false);
    expect(await storage.deleteImage(OWN.replace('/demo/', '/someone-else/'))).toBe(false);
    expect(cloudinary.v2.uploader.destroy).not.toHaveBeenCalled();
  });

  test('deleteImage never throws', async () => {
    configure();
    const storage = load();
    cloudinary.v2.uploader.destroy.mockRejectedValue(new Error('cloudinary down'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(storage.deleteImage(OWN)).resolves.toBe(false);

    warn.mockRestore();
  });
});
