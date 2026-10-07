const KEYS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const MB = 1024 * 1024;

describe('imageStorage album helpers', () => {
  const saved = {};
  let cloudinary;

  const load = () => {
    jest.resetModules();
    const actual = jest.requireActual('cloudinary');
    cloudinary = {
      v2: {
        config: jest.fn(),
        url: jest.fn((publicId) => `https://res.cloudinary.com/demo/image/upload/${publicId}`),
        utils: {
          // The real signer, so the test proves what is signed.
          api_sign_request: jest.fn((params, secret) => actual.v2.utils.api_sign_request(params, secret)),
          download_zip_url: jest.fn().mockReturnValue('https://api.cloudinary.com/v1_1/demo/image/generate_archive?signed=1'),
        },
        api: {
          resources_by_ids: jest.fn().mockResolvedValue({ resources: [] }),
          delete_resources_by_prefix: jest.fn().mockResolvedValue({ deleted: {} }),
          delete_folder: jest.fn().mockResolvedValue({ deleted: [] }),
        },
        uploader: { destroy: jest.fn().mockResolvedValue({ result: 'ok' }) },
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

  const asset = (publicId, overrides = {}) => ({
    public_id: publicId,
    resource_type: 'image',
    format: 'jpg',
    bytes: 2 * MB,
    width: 1600,
    height: 1200,
    secure_url: `https://res.cloudinary.com/demo/image/upload/v1/${publicId}.jpg`,
    ...overrides,
  });

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
    jest.restoreAllMocks();
  });

  test('the upload signature covers the album folder and formats, and never includes the secret', () => {
    configure();
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const storage = load();

    const result = storage.createAlbumUploadSignature(7);

    const signed = { allowed_formats: 'jpg,jpeg,png,webp,heic', folder: 'antpresby/albums/7', timestamp: 1700000000 };
    expect(result).toEqual({
      cloudName: 'demo',
      apiKey: 'test-placeholder-key',
      timestamp: 1700000000,
      signature: jest.requireActual('cloudinary').v2.utils.api_sign_request(signed, 'test-placeholder-secret'),
      folder: 'antpresby/albums/7',
      allowedFormats: 'jpg,jpeg,png,webp,heic',
      maxFileSize: 10 * MB,
    });
    expect(JSON.stringify(result)).not.toContain('test-placeholder-secret');
  });

  test('verifyAlbumAssets keeps only images of this album that exist and are small enough', async () => {
    configure();
    const storage = load();
    const good = 'antpresby/albums/7/good1';
    cloudinary.v2.api.resources_by_ids.mockResolvedValue({
      resources: [
        asset(good),
        asset('antpresby/albums/7/raw1', { resource_type: 'raw' }),
        asset('antpresby/albums/7/huge1', { bytes: 25 * MB }),
        asset('antpresby/albums/7/anim1', { format: 'gif' }),
      ],
    });

    const result = await storage.verifyAlbumAssets(7, [
      good,
      good,
      'antpresby/albums/8/other1',
      'antpresby/albums/70/twin1',
      'antpresby/news/abc123',
      'antpresby/albums/7/missing1',
      'antpresby/albums/7/raw1',
      'antpresby/albums/7/huge1',
      'antpresby/albums/7/anim1',
    ]);

    expect(cloudinary.v2.api.resources_by_ids).toHaveBeenCalledWith([
      good,
      'antpresby/albums/7/missing1',
      'antpresby/albums/7/raw1',
      'antpresby/albums/7/huge1',
      'antpresby/albums/7/anim1',
    ]);
    expect(result.verified).toEqual([
      { publicId: good, url: `https://res.cloudinary.com/demo/image/upload/v1/${good}.jpg`, width: 1600, height: 1200, bytes: 2 * MB, format: 'jpg' },
    ]);
    expect([...result.rejected].sort()).toEqual(
      [
        'antpresby/albums/8/other1',
        'antpresby/albums/70/twin1',
        'antpresby/news/abc123',
        'antpresby/albums/7/missing1',
        'antpresby/albums/7/raw1',
        'antpresby/albums/7/huge1',
        'antpresby/albums/7/anim1',
      ].sort()
    );
  });

  test('verifyAlbumAssets does not call Cloudinary when no id is in the album folder', async () => {
    configure();
    const storage = load();

    const result = await storage.verifyAlbumAssets(7, ['antpresby/albums/8/x1', '../../etc/passwd']);

    expect(cloudinary.v2.api.resources_by_ids).not.toHaveBeenCalled();
    expect(result).toEqual({ verified: [], rejected: ['antpresby/albums/8/x1', '../../etc/passwd'] });
  });

  test('verifyAlbumAssets turns an Admin API failure into a 502', async () => {
    configure();
    const storage = load();
    cloudinary.v2.api.resources_by_ids.mockRejectedValue(new Error('rate limited'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(storage.verifyAlbumAssets(7, ['antpresby/albums/7/a1'])).rejects.toMatchObject({
      statusCode: 502,
      message: 'Image storage is unavailable, please try again',
    });
  });

  test('delivery urls use the display, thumbnail and attachment transformations', () => {
    configure();
    const storage = load();
    const id = 'antpresby/albums/7/a1';

    storage.displayUrl(id);
    storage.thumbnailUrl(id);
    storage.downloadUrl(id);

    expect(cloudinary.v2.url).toHaveBeenNthCalledWith(1, id, { secure: true, quality: 'auto', fetch_format: 'auto' });
    expect(cloudinary.v2.url).toHaveBeenNthCalledWith(2, id, {
      secure: true,
      crop: 'fill',
      width: 400,
      height: 400,
      quality: 'auto',
      fetch_format: 'auto',
    });
    expect(cloudinary.v2.url).toHaveBeenNthCalledWith(3, id, { secure: true, flags: 'attachment' });
  });

  test('delivery urls are null without Cloudinary or without an id', () => {
    const storage = load();
    expect(storage.thumbnailUrl('antpresby/albums/7/a1')).toBeNull();

    configure();
    const configured = load();
    expect(configured.downloadUrl('')).toBeNull();
    expect(cloudinary.v2.url).not.toHaveBeenCalled();
  });

  test('the archive url lists the photos and is named after the album', () => {
    configure();
    const storage = load();

    const url = storage.albumArchiveUrl(7, ['antpresby/albums/7/a1', 'antpresby/albums/7/a2'], 'Harvest Sunday: 2026!');

    expect(url).toBe('https://api.cloudinary.com/v1_1/demo/image/generate_archive?signed=1');
    expect(cloudinary.v2.utils.download_zip_url).toHaveBeenCalledWith({
      resource_type: 'image',
      flatten_folders: true,
      target_public_id: 'harvest-sunday-2026',
      public_ids: ['antpresby/albums/7/a1', 'antpresby/albums/7/a2'],
    });
  });

  test('a large album is archived by its folder prefix so the url stays short', () => {
    configure();
    const storage = load();
    const ids = Array.from({ length: 101 }, (_, i) => `antpresby/albums/7/p${i}`);

    storage.albumArchiveUrl(7, ids, '');

    expect(cloudinary.v2.utils.download_zip_url).toHaveBeenCalledWith({
      resource_type: 'image',
      flatten_folders: true,
      target_public_id: 'album-7',
      prefixes: 'antpresby/albums/7/',
    });
  });

  test('deleteAlbumPhoto removes album photos only', async () => {
    configure();
    const storage = load();

    expect(await storage.deleteAlbumPhoto('antpresby/albums/7/a1')).toBe(true);
    expect(await storage.deleteAlbumPhoto('antpresby/series/abc123')).toBe(false);

    expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledTimes(1);
    expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith('antpresby/albums/7/a1', { resource_type: 'image', invalidate: true });
  });

  test('deleteAlbumPhoto never throws', async () => {
    configure();
    const storage = load();
    cloudinary.v2.uploader.destroy.mockRejectedValue(new Error('cloudinary down'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(storage.deleteAlbumPhoto('antpresby/albums/7/a1')).resolves.toBe(false);
  });

  test('deleteAlbumFolder deletes by the folder prefix with a trailing slash and never throws', async () => {
    configure();
    const storage = load();

    await expect(storage.deleteAlbumFolder(1)).resolves.toBe(true);
    expect(cloudinary.v2.api.delete_resources_by_prefix).toHaveBeenCalledWith('antpresby/albums/1/');
    expect(cloudinary.v2.api.delete_folder).toHaveBeenCalledWith('antpresby/albums/1');

    cloudinary.v2.api.delete_resources_by_prefix.mockRejectedValue(new Error('cloudinary down'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(storage.deleteAlbumFolder(1)).resolves.toBe(false);
  });
});
