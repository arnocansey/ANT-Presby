# Phase 7a: Cloudinary Storage, Event Images and Cedis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store uploaded images on Cloudinary so they survive redeploys, add a cover image to events (backend, web and mobile), and show every money amount in Ghana cedis.

**Architecture:**
- A new `imageStorage` service is the only code that talks to Cloudinary. It uploads, recognises our own image URLs, and deletes images.
  - When the three `CLOUDINARY_*` settings are absent, it saves to the existing `uploads/` folders instead, so local development and the test suite keep working.
- Multer now holds each upload in memory; controllers hand the file to `imageStorage`.
- Events get an `image_url` column with admin upload and remove endpoints.
- Currency goes through one formatter per app (`GH₵ 1,250.00`), and Paystack is sent `currency: 'GHS'`.

**Tech Stack:**
- Backend: Express 4, Prisma 6, multer, `cloudinary` (new; the official SDK), Jest 29 and supertest
- Web: Next.js 16 and TanStack Query 5
- Mobile: Expo SDK 55 with `expo-image-picker` (new) and `expo-image`

**Spec:** `docs/superpowers/specs/2026-10-07-media-live-cedis-design.md`. Sections §4 (storage; this phase only needs `isConfigured`, `uploadImage`, `deleteImage` and `isOwnImageUrl`), §5 "Event image", §6 and §7 (event images), §8 (cedis), §9 and §10.

## Global Constraints

- **Schema changes:** every change goes in `backend/prisma/schema.prisma` **and** as idempotent SQL in `backend/migrations/migrateFeatureUpdates.js`, before `await client.query('COMMIT');`.
  - Never run the migration locally: there is no database.
  - Never `require()` it from tests; read it as text instead.
- **Secrets:** never write real secrets into any file. `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` appear only as empty placeholders (`.env.example`, and `sync: false` in `render.yaml`). Tests use obvious fakes such as `demo` and `test-placeholder-secret`.
- **Cloudinary folders:** new images go under `antpresby/<kind>`, where `kind` is one of `profile`, `news`, `series` or `events`.
- **Disk fallback:** files go to `uploads/<dir>/<prefix>-<actorId>-<timestamp><ext>`. The directories and prefixes are `profile-images`/`user`, `news-images`/`news`, `series-images`/`series` and `event-images`/`event`.
- **Allowed images:** JPEG, PNG, WebP and GIF, 5 MB at most (unchanged).
- **Cloudinary failure:** return 502 `Image storage is unavailable, please try again` and leave the record unchanged.
- **Image cleanup:** `deleteImage` only deletes Cloudinary images in **our** cloud under `antpresby/`. It never throws and never touches `/uploads` files.
- **Existing images:** existing `/uploads/...` URLs remain valid. Nothing is copied.
- **Currency display:** `GH₵ 1,250.00`, with grouping and two decimals; whole numbers are allowed for quick-amount chips (`GH₵ 25`). No `$` amounts remain in `frontend/src` or `mobile/src`.
- **Payments:** Paystack is sent `currency: 'GHS'`.
- **Admin writes:** every admin write is audited with `auditLogModel.createAuditLog`.
- **Dependencies:** one new backend dependency (`cloudinary`) and one new mobile dependency (`expo-image-picker`, installed with `npx expo install`). No new web dependencies.
- **Commits:** every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A Cloudinary outage while replacing an image.** The upload fails with 502 and the old image stays on the record; it isn't deleted. *(Tasks 2 and 3)*
2. **A forged cover URL.** A series cover that points at another Cloudinary cloud, another kind's folder, or `javascript:` is rejected. *(Tasks 1 and 2)*
3. **Replacing an image.** The previous Cloudinary image is deleted, but only after the new one is saved, and only if it is ours. *(Tasks 2 and 3)*
4. **A local PC with no Cloudinary keys.** Uploads still work and land on disk with the same file names as before. *(Task 1)*
5. **Leftover `$` amounts.** A repo scan finds none in web or mobile. *(Task 4)*

---

## File Map

| File | Change | Responsibility |
|---|---|---|
| `backend/src/services/imageStorage.js` | Create | Cloudinary or disk upload, own-URL check, delete |
| `backend/src/middleware/uploadMiddleware.js` | Rewrite | Memory storage, type and size checks |
| `backend/src/controllers/userController.js`, `newsController.js`, `sermonSeriesController.js` | Modify | Upload through `imageStorage` |
| `backend/src/middleware/validators.js` | Modify | Series cover accepts our Cloudinary URLs |
| `backend/prisma/schema.prisma`, `backend/migrations/migrateFeatureUpdates.js` | Modify | `events.image_url` |
| `backend/src/models/eventModel.js`, `backend/src/controllers/eventController.js`, `backend/src/routes/adminEventRoutes.js` | Modify | Event image endpoints |
| `backend/src/services/paymentService.js`, `backend/src/controllers/dashboardController.js` | Modify | GHS |
| `backend/.env.example`, `render.yaml` | Modify | Cloudinary placeholders |
| `backend/tests/services/imageStorage.test.js`, `backend/tests/api/imageUploads.test.js`, `backend/tests/api/eventImages.test.js`, `backend/tests/services/paymentService.test.js` | Create | Tests |
| `backend/tests/api/security.test.js` | Modify | Profile mock gains `findUserById` |
| `frontend/src/lib/utils.ts` | Modify | `formatCurrency` → `GH₵` |
| `frontend/src/app/donate/page.tsx`, `admin/dashboard/page.tsx`, `admin/donations/page.tsx` | Modify | Cedis |
| `frontend/src/hooks/useApi.ts` | Modify | Event image hooks |
| `frontend/src/app/admin/events/[id]/edit/page.tsx`, `admin/events/new/page.tsx`, `events/page.tsx`, `events/[id]/page.tsx` | Modify | Event images |
| `mobile/src/lib/currency.ts`, `mobile/src/lib/media.ts` | Create | `formatCedis`, `resolveImageUrl` |
| `mobile/src/app/donate.tsx`, `donations.tsx`, `admin-donations.tsx`, `admin-analytics.tsx`, `admin.tsx`, `(tabs)/events.tsx` | Modify | Cedis (and the event thumbnail in `(tabs)/events.tsx`) |
| `mobile/src/hooks/use-api.ts`, `mobile/src/app/admin-events/[id].tsx`, `mobile/src/app/events/[id].tsx` | Modify | Event images |
| `mobile/package.json`, `mobile/package-lock.json`, `mobile/app.json` | Modify | `expo-image-picker` |
| `docs/deployment.md`, `docs/features.md`, `docs/qa-checklist.md` | Modify | Docs |

---

### Task 1: Image storage service

**Files:**
- Create: `backend/src/services/imageStorage.js`, `backend/tests/services/imageStorage.test.js`
- Modify: `backend/package.json`, `backend/pnpm-lock.yaml` (via `pnpm add`), `backend/.env.example`, `render.yaml`

**Interfaces:**
- Produces:
  - `isConfigured() → boolean`
  - `uploadImage(file: { buffer, mimetype }, { kind, actorId }) → Promise<{ url: string, publicId: string | null, fileName: string }>`. It rejects with `statusCode` 502 when Cloudinary fails.
  - `isOwnImageUrl(url, kind) → boolean`
  - `deleteImage(url) → Promise<boolean>`. It never rejects.
  - `KINDS`

- [ ] **Step 1: Check the branch and baseline, and install the SDK**

You are on branch `feature/media-storage-cedis` (it holds the spec commit `ef16528`). Leave the user's uncommitted edits (`backend/pnpm-workspace.yaml`, `frontend/next-env.d.ts`, `frontend/package-lock.json`) untouched and never commit them. If `pnpm` rewrites `backend/pnpm-workspace.yaml`, restore it with `git checkout -- backend/pnpm-workspace.yaml` **only if** it had no user edits before. Otherwise leave it.

```bash
git add docs/superpowers/plans/2026-10-07-phase-7a-storage-events-cedis.md && git commit -m "docs: phase 7a storage, event images and cedis plan

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
cd backend && pnpm add cloudinary && npx jest --runInBand --coverage=false
```

Expected: `cloudinary` is added to `dependencies`, and **300** tests pass (the baseline).

- [ ] **Step 2: Write the failing tests**

Create `backend/tests/services/imageStorage.test.js`:

```js
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
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/services/imageStorage.test.js --coverage=false`
Expected: FAIL with `Cannot find module '../../src/services/imageStorage'`.

- [ ] **Step 4: Create the service**

Create `backend/src/services/imageStorage.js`:

```js
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

/**
 * Image storage - the only module that talks to Cloudinary.
 * Without the CLOUDINARY_* settings (local development, tests) images are written to uploads/ as before.
 */

const ROOT_FOLDER = 'antpresby';
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

// Each kind: its Cloudinary folder (antpresby/<kind>) and its disk-fallback directory and file prefix.
const KINDS = {
  profile: { dir: 'profile-images', prefix: 'user' },
  news: { dir: 'news-images', prefix: 'news' },
  series: { dir: 'series-images', prefix: 'series' },
  events: { dir: 'event-images', prefix: 'event' },
};

const EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const CLOUDINARY_IMAGE_URL =
  /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(?:v\d+\/)?(antpresby\/([a-z]+)\/[A-Za-z0-9_-]+)\.(jpg|jpeg|png|webp|gif)$/;

const isConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const client = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
};

const storageUnavailable = () => {
  const error = new Error('Image storage is unavailable, please try again');
  error.statusCode = 502;
  return error;
};

const kindConfig = (kind) => {
  const config = KINDS[kind];
  if (!config) throw new Error(`Unknown image kind: ${kind}`);
  return config;
};

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = client().uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) =>
      error ? reject(error) : resolve(result)
    );
    stream.end(buffer);
  });

const uploadImage = async (file, { kind, actorId }) => {
  const config = kindConfig(kind);

  if (isConfigured()) {
    try {
      const result = await uploadToCloudinary(file.buffer, `${ROOT_FOLDER}/${kind}`);
      return { url: result.secure_url, publicId: result.public_id, fileName: result.public_id };
    } catch (error) {
      console.warn('Cloudinary upload failed:', error.message);
      throw storageUnavailable();
    }
  }

  // The extension comes from the checked mimetype, never from the client's filename.
  const fileName = `${config.prefix}-${Number(actorId) || 'system'}-${Date.now()}${EXTENSIONS[file.mimetype]}`;
  const dir = path.join(UPLOADS_ROOT, config.dir);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(path.join(dir, fileName), file.buffer);
  return { url: `/uploads/${config.dir}/${fileName}`, publicId: null, fileName };
};

// Our Cloudinary image (this cloud, under antpresby/): its public id and kind; otherwise null.
const parseOwnCloudinaryUrl = (url) => {
  const match = CLOUDINARY_IMAGE_URL.exec(String(url || ''));
  if (!match || !process.env.CLOUDINARY_CLOUD_NAME || match[1] !== process.env.CLOUDINARY_CLOUD_NAME) {
    return null;
  }
  return { publicId: match[2], kind: match[3] };
};

// True for an image we stored ourselves for this kind: a local upload or our Cloudinary folder.
const isOwnImageUrl = (url, kind) => {
  const config = KINDS[kind];
  if (!config || !url) return false;
  const local = new RegExp(`^/uploads/${config.dir}/[A-Za-z0-9_-]+\\.(jpg|png|webp|gif)$`);
  if (local.test(String(url))) return true;
  const own = parseOwnCloudinaryUrl(url);
  return Boolean(own && own.kind === kind);
};

// Best-effort removal of a replaced image; only our Cloudinary images, never local files.
const deleteImage = async (url) => {
  const own = parseOwnCloudinaryUrl(url);
  if (!own || !isConfigured()) return false;
  try {
    await client().uploader.destroy(own.publicId, { resource_type: 'image' });
    return true;
  } catch (error) {
    console.warn('Image cleanup failed:', error.message);
    return false;
  }
};

module.exports = {
  KINDS,
  isConfigured,
  uploadImage,
  isOwnImageUrl,
  deleteImage,
};
```

- [ ] **Step 5: Add the configuration placeholders (no values)**

Append to `backend/.env.example`:

```
# Cloudinary image storage. Set the real values in the Render dashboard; never commit them.
# Leave empty locally to store uploads on disk under uploads/.
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

In `render.yaml`, add these directly after the `PAYSTACK_SECRET_KEY` entry (match that entry's indentation and keep its own `sync: false` line):

```yaml
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
```

- [ ] **Step 6: Run the tests, the suite, and lint**

Run: `cd backend && npx jest tests/services/imageStorage.test.js --coverage=false && npx jest --runInBand --coverage=false && npx eslint src/ tests/`
Expected: 15 imageStorage tests pass, the suite reaches **315**, and lint is clean.

- [ ] **Step 7: Commit**

```bash
git add backend/package.json backend/pnpm-lock.yaml backend/src/services/imageStorage.js backend/tests/services/imageStorage.test.js backend/.env.example render.yaml
git commit -m "feat: add Cloudinary image storage with a local disk fallback

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Existing uploads go through image storage

**Files:**
- Rewrite: `backend/src/middleware/uploadMiddleware.js`
- Modify: `backend/src/controllers/userController.js`, `backend/src/controllers/newsController.js`, `backend/src/controllers/sermonSeriesController.js`, `backend/src/middleware/validators.js`
- Modify: `backend/tests/api/security.test.js`
- Test: `backend/tests/api/imageUploads.test.js`

**Interfaces:**
- Consumes: `imageStorage.uploadImage`, `deleteImage` and `isOwnImageUrl` (Task 1).
- Produces:
  - `uploadMiddleware` exports `imageUpload`, plus the existing names `profilePhotoUpload`, `newsImageUpload` and `seriesImageUpload`, and the new `eventImageUpload`. All are memory-storage multer instances.
  - `req.file.buffer` is set.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/api/imageUploads.test.js`:

```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const tokenFor = (userId, role = 'member') =>
  `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET, { expiresIn: '10m' })}`;
const CLOUD = 'https://res.cloudinary.com/demo/image/upload/v1';

const storageFailure = () => Object.assign(new Error('Image storage is unavailable, please try again'), { statusCode: 502 });

describe('Uploads go through image storage', () => {
  const savedCloud = process.env.CLOUDINARY_CLOUD_NAME;
  let storage;
  let models;

  const buildApp = () => {
    jest.resetModules();
    const actual = jest.requireActual('../../src/services/imageStorage');
    storage = {
      ...actual,
      uploadImage: jest.fn().mockResolvedValue({
        url: `${CLOUD}/antpresby/series/new123.png`,
        publicId: 'antpresby/series/new123',
        fileName: 'antpresby/series/new123',
      }),
      deleteImage: jest.fn().mockResolvedValue(true),
    };
    models = {
      userModel: {
        findUserById: jest.fn().mockResolvedValue({ id: 7, profile_image_url: `${CLOUD}/antpresby/profile/old123.png` }),
        updateUserProfileImage: jest.fn((id, url) => Promise.resolve({ id, profile_image_url: url })),
      },
      sermonSeriesModel: {
        getSeriesById: jest.fn().mockResolvedValue({ id: 3, title: 'Romans' }),
        listSeries: jest.fn().mockResolvedValue([]),
        getSeriesWithSermons: jest.fn().mockResolvedValue(undefined),
        createSeries: jest.fn().mockResolvedValue({ id: 3, title: 'Romans' }),
        updateSeries: jest.fn().mockResolvedValue({ id: 3, title: 'Romans' }),
        deleteSeries: jest.fn().mockResolvedValue({ id: 3 }),
      },
      mediaAssetModel: { createMediaAsset: jest.fn().mockResolvedValue({ id: 1 }) },
      auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
    };
    jest.doMock('../../src/services/imageStorage', () => storage);
    jest.doMock('../../src/models/userModel', () => models.userModel);
    jest.doMock('../../src/models/sermonSeriesModel', () => models.sermonSeriesModel);
    jest.doMock('../../src/models/mediaAssetModel', () => models.mediaAssetModel);
    jest.doMock('../../src/models/auditLogModel', () => models.auditLogModel);

    const app = express();
    app.use(express.json());
    app.use('/api/users', require('../../src/routes/userRoutes'));
    app.use('/api/admin/sermon-series', require('../../src/routes/adminSermonSeriesRoutes'));
    app.use(require('../../src/middleware/errorHandler').errorHandler);
    return app;
  };

  beforeEach(() => {
    process.env.CLOUDINARY_CLOUD_NAME = 'demo';
  });

  afterEach(() => {
    if (savedCloud === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
    else process.env.CLOUDINARY_CLOUD_NAME = savedCloud;
  });

  test('a series cover is uploaded from memory as kind "series" and recorded as a media asset', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/api/admin/sermon-series/upload-image')
      .set('Authorization', tokenFor(1, 'admin'))
      .attach('image', Buffer.from('fake-png'), { filename: 'cover.png', contentType: 'image/png' });

    expect(response.status).toBe(200);
    expect(response.body.data.url).toBe(`${CLOUD}/antpresby/series/new123.png`);
    const [file, options] = storage.uploadImage.mock.calls[0];
    expect(Buffer.isBuffer(file.buffer)).toBe(true);
    expect(options).toEqual({ kind: 'series', actorId: 1 });
    expect(models.mediaAssetModel.createMediaAsset).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: 'antpresby/series/new123', url: `${CLOUD}/antpresby/series/new123.png` })
    );
  });

  test('when storage is down the series upload returns 502 and records nothing', async () => {
    const app = buildApp();
    storage.uploadImage.mockRejectedValue(storageFailure());

    const response = await request(app)
      .post('/api/admin/sermon-series/upload-image')
      .set('Authorization', tokenFor(1, 'admin'))
      .attach('image', Buffer.from('fake-png'), { filename: 'cover.png', contentType: 'image/png' });

    expect(response.status).toBe(502);
    expect(models.mediaAssetModel.createMediaAsset).not.toHaveBeenCalled();
  });

  test('a new profile photo replaces the old one, which is deleted after saving', async () => {
    const app = buildApp();
    storage.uploadImage.mockResolvedValue({ url: `${CLOUD}/antpresby/profile/new123.png`, publicId: 'antpresby/profile/new123', fileName: 'x' });

    const response = await request(app)
      .put('/api/users/profile/photo')
      .set('Authorization', tokenFor(7))
      .attach('photo', Buffer.from('fake-png'), { filename: 'me.png', contentType: 'image/png' });

    expect(response.status).toBe(200);
    expect(storage.uploadImage.mock.calls[0][1]).toEqual({ kind: 'profile', actorId: 7 });
    expect(models.userModel.updateUserProfileImage).toHaveBeenCalledWith(7, `${CLOUD}/antpresby/profile/new123.png`);
    expect(storage.deleteImage).toHaveBeenCalledWith(`${CLOUD}/antpresby/profile/old123.png`);
  });

  test('when storage is down the profile photo is left unchanged', async () => {
    const app = buildApp();
    storage.uploadImage.mockRejectedValue(storageFailure());

    const response = await request(app)
      .put('/api/users/profile/photo')
      .set('Authorization', tokenFor(7))
      .attach('photo', Buffer.from('fake-png'), { filename: 'me.png', contentType: 'image/png' });

    expect(response.status).toBe(502);
    expect(models.userModel.updateUserProfileImage).not.toHaveBeenCalled();
    expect(storage.deleteImage).not.toHaveBeenCalled();
  });

  test('a series may use a cover from our Cloudinary series folder', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/api/admin/sermon-series')
      .set('Authorization', tokenFor(1, 'admin'))
      .send({ title: 'Romans', coverImageUrl: `${CLOUD}/antpresby/series/new123.png` });

    expect(response.status).toBe(201);
  });

  test('a cover from someone else\'s Cloudinary cloud is rejected', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/api/admin/sermon-series')
      .set('Authorization', tokenFor(1, 'admin'))
      .send({ title: 'Romans', coverImageUrl: 'https://res.cloudinary.com/evil/image/upload/v1/antpresby/series/x.png' });

    expect(response.status).toBe(400);
    expect(models.sermonSeriesModel.createSeries).not.toHaveBeenCalled();
  });
});
```

In `backend/tests/api/security.test.js`, inside the `Profile photo uploads` block's `beforeEach`, add `findUserById` to the mocked `userModel` so it reads:

```js
    jest.doMock('../../src/models/userModel', () => ({
      findUserById: jest.fn().mockResolvedValue({ id: 7, profile_image_url: null }),
      updateUserProfileImage: jest.fn((id, url) => Promise.resolve({ id, profile_image_url: url })),
    }));
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/api/imageUploads.test.js --coverage=false`
Expected: FAIL. The uploads don't call `imageStorage.uploadImage` yet, and the Cloudinary cover is rejected with 400. If `POST /api/admin/sermon-series` returns a status other than 201 or 400 because of a missing model mock, add the missing function to `models.sermonSeriesModel`, matching what `sermonSeriesController.createSeries` calls, and record a ruling.

- [ ] **Step 3: Switch the middleware to memory storage**

Replace the whole of `backend/src/middleware/uploadMiddleware.js` with:

```js
const multer = require('multer');

// Only these image types are accepted. Files are held in memory and stored by services/imageStorage,
// which chooses the stored extension from the mimetype, never from the client's filename.
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const imageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      const error = new Error('Only JPEG, PNG, WebP, or GIF images are allowed');
      error.statusCode = 400;
      return cb(error);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  imageUpload,
  profilePhotoUpload: imageUpload,
  newsImageUpload: imageUpload,
  seriesImageUpload: imageUpload,
  eventImageUpload: imageUpload,
};
```

- [ ] **Step 4: Upload through image storage in the three controllers**

In `backend/src/controllers/userController.js`:
- Add `const imageStorage = require('../services/imageStorage');` after the `auditLogModel` import.
- Replace the body of `uploadProfilePhoto` with:

```js
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json(apiResponse(false, null, 'No photo uploaded'));
    }

    const current = await userModel.findUserById(userId);
    const { url } = await imageStorage.uploadImage(req.file, { kind: 'profile', actorId: userId });
    const updatedUser = await userModel.updateUserProfileImage(userId, url);

    // Only remove the old photo once the new one is saved.
    if (current?.profile_image_url && current.profile_image_url !== url) {
      await imageStorage.deleteImage(current.profile_image_url);
    }

    res.json(apiResponse(true, sanitizeUser(updatedUser), 'Profile photo uploaded'));
  } catch (error) {
    next(error);
  }
```

In `backend/src/controllers/newsController.js`:
- Add `const imageStorage = require('../services/imageStorage');` after the `auditLogModel` import.
- In `uploadNewsImage`, replace the `createMediaAsset({...})` call with:

```js
    const stored = await imageStorage.uploadImage(req.file, { kind: 'news', actorId: req.user.userId });
    const asset = await mediaAssetModel.createMediaAsset({
      fileName: stored.fileName,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      url: stored.url,
      uploadedBy: req.user.userId,
    });
```

In `backend/src/controllers/sermonSeriesController.js`:
- Add `const imageStorage = require('../services/imageStorage');` after the `mediaAssetModel` import.
- In `uploadSeriesImage`, replace the two statements from `const url = \`/uploads/series-images/...\`` through the end of the `createMediaAsset({...})` call with:

```js
    const stored = await imageStorage.uploadImage(req.file, { kind: 'series', actorId: req.user.userId });
    const { url } = stored;
    const asset = await mediaAssetModel.createMediaAsset({
      fileName: stored.fileName,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      url,
      uploadedBy: req.user.userId,
    });
```

- [ ] **Step 5: Accept our Cloudinary covers in the series validator**

In `backend/src/middleware/validators.js`:
- Add `const { isOwnImageUrl } = require('../services/imageStorage');` directly after the existing `MAX_DB_ID` import.
- Delete the `SERIES_COVER_PATTERN` line and the comment above it.
- Replace the `coverImageUrl` rule with:

```js
  // Covers can only be images we stored ourselves: a series upload on disk or in our Cloudinary folder.
  body('coverImageUrl')
    .optional({ values: 'falsy' })
    .custom((value) => isOwnImageUrl(value, 'series'))
    .withMessage('Cover image must be uploaded through the series image upload'),
```

- [ ] **Step 6: Run the tests, the suite, and lint**

Run: `cd backend && npx jest tests/api/imageUploads.test.js tests/api/security.test.js tests/api/sermonSeries.test.js --coverage=false && npx jest --runInBand --coverage=false && npx eslint src/ tests/`
Expected:
- All pass. The existing series and profile upload tests still pass through the disk fallback, because no Cloudinary settings are set in those tests.
- The suite reaches **321**.
- Lint is clean.

- [ ] **Step 7: Commit**

```bash
git add backend/src/middleware/uploadMiddleware.js backend/src/controllers/userController.js backend/src/controllers/newsController.js backend/src/controllers/sermonSeriesController.js backend/src/middleware/validators.js backend/tests/api/imageUploads.test.js backend/tests/api/security.test.js
git commit -m "feat: store profile, news and series images through image storage

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Event images (backend)

**Files:**
- Modify: `backend/prisma/schema.prisma`, `backend/migrations/migrateFeatureUpdates.js`, `backend/src/models/eventModel.js`, `backend/src/controllers/eventController.js`, `backend/src/routes/adminEventRoutes.js`, `backend/tests/migrations/migrateFeatureUpdates.test.js`
- Test: `backend/tests/api/eventImages.test.js`

**Interfaces:**
- Consumes: `eventImageUpload` (Task 2), and `imageStorage.uploadImage` and `deleteImage` (Task 1).
- Produces:
  - Event objects include `image_url` (list, upcoming, search and detail).
  - `eventModel.setEventImage(id, url | null) → number`
  - `POST /api/admin/events/:id/image` (multipart `image`) → `{ image_url }`
  - `DELETE /api/admin/events/:id/image` → `{ image_url: null }`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/api/eventImages.test.js`:

```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const tokenFor = (userId, role) =>
  `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET, { expiresIn: '10m' })}`;
const admin = () => tokenFor(1, 'admin');
const CLOUD = 'https://res.cloudinary.com/demo/image/upload/v1/antpresby/events';

describe('Event images (admin)', () => {
  let eventModel;
  let storage;
  let auditLogModel;
  let app;

  beforeEach(() => {
    jest.resetModules();
    eventModel = {
      getEventById: jest.fn().mockResolvedValue({ id: 4, name: 'Harvest', image_url: `${CLOUD}/old123.png` }),
      setEventImage: jest.fn().mockResolvedValue(1),
    };
    storage = {
      uploadImage: jest.fn().mockResolvedValue({ url: `${CLOUD}/new123.png`, publicId: 'antpresby/events/new123', fileName: 'x' }),
      deleteImage: jest.fn().mockResolvedValue(true),
      isOwnImageUrl: jest.fn().mockReturnValue(true),
    };
    auditLogModel = { createAuditLog: jest.fn().mockResolvedValue({}) };
    jest.doMock('../../src/models/eventModel', () => eventModel);
    jest.doMock('../../src/services/imageStorage', () => storage);
    jest.doMock('../../src/models/auditLogModel', () => auditLogModel);
    jest.doMock('../../src/models/notificationModel', () => ({}));

    app = express();
    app.use(express.json());
    app.use('/api/admin/events', require('../../src/routes/adminEventRoutes'));
    app.use(require('../../src/middleware/errorHandler').errorHandler);
  });

  const upload = (auth, id = 4) =>
    request(app)
      .post(`/api/admin/events/${id}/image`)
      .set('Authorization', auth)
      .attach('image', Buffer.from('fake-png'), { filename: 'cover.png', contentType: 'image/png' });

  test('members cannot change event images', async () => {
    const response = await upload(tokenFor(7, 'member'));

    expect(response.status).toBe(403);
    expect(storage.uploadImage).not.toHaveBeenCalled();
  });

  test('uploading saves the new image, then deletes the old one, and is audited', async () => {
    const response = await upload(admin());

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ image_url: `${CLOUD}/new123.png` });
    expect(storage.uploadImage.mock.calls[0][1]).toEqual({ kind: 'events', actorId: 1 });
    expect(eventModel.setEventImage).toHaveBeenCalledWith(4, `${CLOUD}/new123.png`);
    expect(storage.deleteImage).toHaveBeenCalledWith(`${CLOUD}/old123.png`);
    expect(auditLogModel.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'event', entityId: 4, action: 'update_image' })
    );
  });

  test.each([
    ['an unknown event', 99],
    ['a malformed id', 'abc'],
  ])('%s returns 404 without storing anything', async (_label, id) => {
    eventModel.getEventById.mockResolvedValue(undefined);

    const response = await upload(admin(), id);

    expect(response.status).toBe(404);
    expect(storage.uploadImage).not.toHaveBeenCalled();
  });

  test('uploading without a file returns 400', async () => {
    const response = await request(app).post('/api/admin/events/4/image').set('Authorization', admin());

    expect(response.status).toBe(400);
  });

  test('when storage is down the event keeps its image', async () => {
    storage.uploadImage.mockRejectedValue(Object.assign(new Error('Image storage is unavailable, please try again'), { statusCode: 502 }));

    const response = await upload(admin());

    expect(response.status).toBe(502);
    expect(eventModel.setEventImage).not.toHaveBeenCalled();
    expect(storage.deleteImage).not.toHaveBeenCalled();
  });

  test('removing clears the image and deletes it from storage', async () => {
    const response = await request(app).delete('/api/admin/events/4/image').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(eventModel.setEventImage).toHaveBeenCalledWith(4, null);
    expect(storage.deleteImage).toHaveBeenCalledWith(`${CLOUD}/old123.png`);
    expect(auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'remove_image' }));
  });

  test('removing the image of an unknown event returns 404', async () => {
    eventModel.getEventById.mockResolvedValue(undefined);

    const response = await request(app).delete('/api/admin/events/99/image').set('Authorization', admin());

    expect(response.status).toBe(404);
    expect(eventModel.setEventImage).not.toHaveBeenCalled();
  });
});
```

In `backend/tests/migrations/migrateFeatureUpdates.test.js`, add this test inside the `describe` block, before its closing `});`:

```js
  test('adds the event image column', () => {
    expect(source).toContain('ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)');
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/api/eventImages.test.js tests/migrations --coverage=false`
Expected: FAIL. The image routes return 404 because they don't exist, and the migration test can't find the column.

- [ ] **Step 3: Update the schema and the migration**

In `backend/prisma/schema.prisma`, `model Event`, add this after the `status` line:

```prisma
  imageUrl         String?             @map("image_url") @db.VarChar(500)
```

In `backend/migrations/migrateFeatureUpdates.js`, insert this directly before `await client.query('COMMIT');`:

```js
    // Event cover images (phase 7a)
    await client.query(`
      ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
    `);

```

- [ ] **Step 4: Update the model**

In `backend/src/models/eventModel.js`:
- In each of the three `select` blocks that contain `      maxRegistrations: true,` (in `getAllEvents`, `getUpcomingEvents` and `searchEvents`), add `      imageUrl: true,` on the line after it. `getEventById` uses `include`, so it already returns every column.
- Add this function after `updateEvent`:

```js
// Set or clear an event's cover image; returns how many events changed (0 when the event is gone).
const setEventImage = async (eventId, imageUrl) => {
  const updated = await prisma.event.updateMany({
    where: { id: Number(eventId) },
    data: { imageUrl },
  });
  return updated.count;
};
```

- Add `setEventImage,` to `module.exports`.

- [ ] **Step 5: Add the controller handlers and routes**

In `backend/src/controllers/eventController.js`:
- Change the first line to `const { apiResponse, getPagination, buildPaginationMeta, parseId } = require('../utils/helpers');`.
- After the `notificationModel` import, add:

```js
const auditLogModel = require('../models/auditLogModel');
const imageStorage = require('../services/imageStorage');
```

- Add these handlers after `deleteEvent`:

```js
const findEventForImage = async (req, res) => {
  const id = parseId(req.params.id);
  const event = id ? await eventModel.getEventById(id) : undefined;
  if (!event) {
    res.status(404).json(apiResponse(false, null, 'Event not found'));
    return null;
  }
  return { id, event };
};

// Upload or replace an event's cover image (admin only)
const uploadEventImage = async (req, res, next) => {
  try {
    const found = await findEventForImage(req, res);
    if (!found) return undefined;

    if (!req.file) {
      return res.status(400).json(apiResponse(false, null, 'No image uploaded'));
    }

    const { url } = await imageStorage.uploadImage(req.file, { kind: 'events', actorId: req.user.userId });
    await eventModel.setEventImage(found.id, url);

    // Only remove the old image once the new one is saved.
    if (found.event.image_url && found.event.image_url !== url) {
      await imageStorage.deleteImage(found.event.image_url);
    }

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'event',
      entityId: found.id,
      action: 'update_image',
      summary: `Updated the image for event "${found.event.name}"`,
      metadata: { url },
    });

    res.json(apiResponse(true, { image_url: url }, 'Event image updated'));
  } catch (error) {
    next(error);
  }
};

// Remove an event's cover image (admin only)
const removeEventImage = async (req, res, next) => {
  try {
    const found = await findEventForImage(req, res);
    if (!found) return undefined;

    await eventModel.setEventImage(found.id, null);
    if (found.event.image_url) {
      await imageStorage.deleteImage(found.event.image_url);
    }

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'event',
      entityId: found.id,
      action: 'remove_image',
      summary: `Removed the image from event "${found.event.name}"`,
    });

    res.json(apiResponse(true, { image_url: null }, 'Event image removed'));
  } catch (error) {
    next(error);
  }
};
```

- Add `uploadEventImage,` and `removeEventImage,` to `module.exports`.

In `backend/src/routes/adminEventRoutes.js`:
- Add `const { eventImageUpload } = require('../middleware/uploadMiddleware');` after the validators import.
- Add these routes after `router.delete('/:id', eventController.deleteEvent);`:

```js
router.post('/:id/image', eventImageUpload.single('image'), eventController.uploadEventImage);
router.delete('/:id/image', eventController.removeEventImage);
```

`backend/tests/api/event.routes.test.js` mocks the whole event controller and only mounts the public routes, so it is unaffected.

- [ ] **Step 6: Validate, then run the tests, the suite, and lint**

Run: `cd backend && DATABASE_URL="postgresql://x:y@localhost:5432/z" npx prisma validate && npx prisma generate && node --check migrations/migrateFeatureUpdates.js && npx jest --runInBand --coverage=false && npx eslint src/ tests/`
Expected:
- `valid` and generated; the migration passes its syntax check.
- The 8 event image tests and the migration test pass, and the suite reaches **330** (321 + 8 + 1).
- Lint is clean.

- [ ] **Step 7: Commit**

```bash
git add backend/prisma/schema.prisma backend/migrations/migrateFeatureUpdates.js backend/src/models/eventModel.js backend/src/controllers/eventController.js backend/src/routes/adminEventRoutes.js backend/tests/api/eventImages.test.js backend/tests/migrations/migrateFeatureUpdates.test.js
git commit -m "feat: let admins add, replace and remove event images

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Cedis everywhere, and Paystack in GHS

**Files:**
- Modify: `backend/src/services/paymentService.js`, `backend/src/controllers/dashboardController.js`
- Test: `backend/tests/services/paymentService.test.js`
- Modify: `frontend/src/lib/utils.ts`, `frontend/src/app/donate/page.tsx`, `frontend/src/app/admin/dashboard/page.tsx`, `frontend/src/app/admin/donations/page.tsx`
- Create: `mobile/src/lib/currency.ts`
- Modify: `mobile/src/app/donate.tsx`, `mobile/src/app/donations.tsx`, `mobile/src/app/admin-donations.tsx`, `mobile/src/app/admin-analytics.tsx`, `mobile/src/app/admin.tsx`, `mobile/src/app/(tabs)/events.tsx`

**Interfaces:**
- Produces:
  - Web: `formatCurrency(amount: number | string | null | undefined, decimals = 2) → string`, for example `GH₵ 1,250.00`.
  - Mobile: `formatCedis(amount: number | string | null | undefined, decimals = 2) → string`.

- [ ] **Step 1: Write the failing payment test**

Create `backend/tests/services/paymentService.test.js`:

```js
describe('paymentService.initializePayment', () => {
  const savedKey = process.env.PAYSTACK_SECRET_KEY;
  let axios;
  let paymentService;

  beforeEach(() => {
    jest.resetModules();
    process.env.PAYSTACK_SECRET_KEY = 'test-placeholder-not-a-real-key';
    axios = { post: jest.fn().mockResolvedValue({ data: { data: { authorization_url: 'https://checkout.example' } } }) };
    jest.doMock('axios', () => axios);
    paymentService = require('../../src/services/paymentService');
  });

  afterEach(() => {
    if (savedKey === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = savedKey;
  });

  test('charges in Ghana cedis, in pesewas', async () => {
    await paymentService.initializePayment({ email: 'a@test.com', amount: 50, reference: 'DON-1', callbackUrl: 'https://x/cb' });

    expect(axios.post.mock.calls[0][1]).toEqual(expect.objectContaining({ currency: 'GHS', amount: 5000 }));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd backend && npx jest tests/services/paymentService.test.js --coverage=false`
Expected: FAIL. The payload has no `currency`.

- [ ] **Step 3: Send GHS and standardise the backend text**

In `backend/src/services/paymentService.js`, add `currency: 'GHS',` to the `payload` object, after `amount: toMinorUnits(amount),`.

In `backend/src/controllers/dashboardController.js`, change `` `Donation: GHS ${decimalToString(donation.amount)}` `` to `` `Donation: GH₵ ${decimalToString(donation.amount)}` ``.

Run: `cd backend && npx jest --runInBand --coverage=false && npx eslint src/ tests/`
Expected: **331** pass, and lint is clean.

- [ ] **Step 4: Web formatter and every web amount**

In `frontend/src/lib/utils.ts`, replace the whole `formatCurrency` function (including its comment) with:

```ts
/**
 * Format an amount in Ghana cedis, e.g. "GH₵ 1,250.00" (decimals = 0 for quick-amount chips).
 */
export const formatCurrency = (amount: number | string | null | undefined, decimals = 2): string => {
  const value = Number(amount ?? 0);
  const safe = Number.isFinite(value) ? value : 0;
  return `GH₵ ${safe.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};
```

Then make each of these pages import it: add `import { formatCurrency } from '@/lib/utils';`, or add `formatCurrency` to an existing `@/lib/utils` import.

`frontend/src/app/donate/page.tsx`:
- In the quick-amount button, the text `${quickAmount}` → `{formatCurrency(quickAmount, 0)}`.
- The prefix `<span ...>$</span>` → `<span ...>GH₵</span>`. In the `<Input>` below it, change `pl-8` to `pl-14` so the number clears the wider symbol.
- `` `Give ${amount ? `$${Number(amount || 0).toFixed(2)}` : 'Now'}` `` → `` `Give ${amount ? formatCurrency(amount) : 'Now'}` ``.

`frontend/src/app/admin/dashboard/page.tsx`:
- `` `GHS ${revenueThisYear.toLocaleString()}` `` → `formatCurrency(revenueThisYear)`.
- `GHS {total.toLocaleString()}` → `{formatCurrency(total)}`.
- `GHS {toNumber(item.total_amount).toLocaleString()}` → `{formatCurrency(toNumber(item.total_amount))}`.

`frontend/src/app/admin/donations/page.tsx`:
- `` `GHS ${Number(donation.amount || 0).toLocaleString()}` `` → `formatCurrency(donation.amount)`.

- [ ] **Step 5: Mobile formatter and every mobile amount**

Create `mobile/src/lib/currency.ts`:

```ts
// Format an amount in Ghana cedis, e.g. "GH₵ 1,250.00" (decimals = 0 for quick-amount chips).
export const formatCedis = (amount: number | string | null | undefined, decimals = 2): string => {
  const value = Number(amount ?? 0);
  const safe = Number.isFinite(value) ? value : 0;
  return `GH₵ ${safe.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};
```

Add `import { formatCedis } from '@/lib/currency';` to each of these files, then:

- `mobile/src/app/donate.tsx`: `<ThemedText type="defaultSemiBold">${amount}</ThemedText>` → `<ThemedText type="defaultSemiBold">{formatCedis(amount, 0)}</ThemedText>`.
- `mobile/src/app/donations.tsx`: `` {`$${Number(item.amount || 0).toFixed(2)}`} `` → `{formatCedis(item.amount)}`.
- `mobile/src/app/admin-donations.tsx`: `${totalAmount.toLocaleString()}` → `{formatCedis(totalAmount)}`.
- `mobile/src/app/admin-analytics.tsx`: `` value: `$${totalGiving.toLocaleString()}` `` → `value: formatCedis(totalGiving)`.
- `mobile/src/app/admin.tsx`: replace the body of its local `formatCurrency` helper with `return formatCedis(toFiniteNumber(value));`. `formatCedis` already turns non-finite values into `GH₵ 0.00`.
- `mobile/src/app/(tabs)/events.tsx`: replace the quick-amount block with:

```tsx
          {[25, 50, 100].map((amount) => (
            <Pressable
              key={amount}
              onPress={() => router.push(`/donate?amount=${amount}` as never)}
              style={[styles.amountButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
              <ThemedText type="defaultSemiBold">{formatCedis(amount, 0)}</ThemedText>
            </Pressable>
          ))}
```

- [ ] **Step 6: Scan for leftover dollar amounts, then type-check, lint and build**

Run:

```bash
grep -rnE '\$\$\{|>\$|'"'"'\$[0-9]|"\$"|^\s*\$\{[^}]*\}\s*$' frontend/src mobile/src --include=*.tsx --include=*.ts ; echo "scan-exit=$?"
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build && cd ../mobile && npm run -s lint && npx tsc --noEmit && echo all-ok
```

Expected:
- The scan prints **nothing**, then `scan-exit=1`.
- Then `all-ok`.

If the scan prints a template-literal line that isn't money (such as a URL or a CSS width), confirm it isn't money and record a ruling.

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/paymentService.js backend/src/controllers/dashboardController.js backend/tests/services/paymentService.test.js frontend/src/lib/utils.ts frontend/src/app/donate/page.tsx frontend/src/app/admin/dashboard/page.tsx frontend/src/app/admin/donations/page.tsx mobile/src/lib/currency.ts mobile/src/app/donate.tsx mobile/src/app/donations.tsx mobile/src/app/admin-donations.tsx mobile/src/app/admin-analytics.tsx mobile/src/app/admin.tsx "mobile/src/app/(tabs)/events.tsx"
git commit -m "feat: show all amounts in Ghana cedis and charge Paystack in GHS

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Web event images

**Files:**
- Modify: `frontend/src/hooks/useApi.ts`, `frontend/src/app/admin/events/[id]/edit/page.tsx`, `frontend/src/app/admin/events/new/page.tsx`, `frontend/src/app/events/page.tsx`, `frontend/src/app/events/[id]/page.tsx`

**Interfaces:**
- Consumes: `POST` and `DELETE /api/admin/events/:id/image`, and `image_url` on events (Task 3).
- Produces: `useUploadEventImage(eventId)` and `useRemoveEventImage(eventId)`.

- [ ] **Step 1: Add the hooks**

In `frontend/src/hooks/useApi.ts`, add this directly after the `useUploadSeriesCover` hook:

```ts
const invalidateEventImages = (qc: ReturnType<typeof useQueryClient>) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: ['event'] }),
    qc.invalidateQueries({ queryKey: ['events'] }),
    qc.invalidateQueries({ queryKey: ['admin', 'events'] }),
  ]);

export const useUploadEventImage = (eventId?: number | string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<{ image_url: string }> => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await apiClient.post(`/admin/events/${eventId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    },
    onSuccess: () => toast.success('Event image updated'),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not upload the image')),
    onSettled: () => invalidateEventImages(qc),
  });
};

export const useRemoveEventImage = (eventId?: number | string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/admin/events/${eventId}/image`);
    },
    onSuccess: () => toast.success('Event image removed'),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not remove the image')),
    onSettled: () => invalidateEventImages(qc),
  });
};
```

- [ ] **Step 2: Image picker on the admin edit page; new events open it**

In `frontend/src/app/admin/events/[id]/edit/page.tsx`:
- Add these imports:

```tsx
import { useRemoveEventImage, useUploadEventImage } from '@/hooks/useApi';
import { resolveAssetUrl } from '@/lib/utils';
```

- After `const router = useRouter();`, add:

```tsx
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const uploadImage = useUploadEventImage(id);
  const removeImage = useRemoveEventImage(id);
```

- Inside the `.then((res) => ...)` callback of the load effect, turn the arrow body into a block that also stores the image:

```tsx
    apiClient.get(`/admin/events/${id}`).then((res) => {
      reset({
        ...res.data.data,
        eventDate: res.data.data?.event_date
          ? new Date(res.data.data.event_date).toISOString().slice(0, 16)
          : '',
      });
      setImageUrl(res.data.data?.image_url ?? null);
    });
```

- Directly before the `<form ...>` element, add:

```tsx
          <div className="mb-6 space-y-2">
            <Label htmlFor="edit-event-image">Image</Label>
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveAssetUrl(imageUrl)} alt="" className="h-48 w-full rounded-xl object-cover" />
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Input
                id="edit-event-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="max-w-xs"
                disabled={uploadImage.isPending}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('Choose an image under 5 MB');
                    return;
                  }
                  uploadImage.mutate(file, { onSuccess: (data) => setImageUrl(data.image_url) });
                }}
              />
              {imageUrl && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={removeImage.isPending}
                  onClick={() => removeImage.mutate(undefined, { onSuccess: () => setImageUrl(null) })}
                >
                  Remove image
                </Button>
              )}
            </div>
            <p className="text-xs text-ui-subtle">JPEG, PNG, WebP or GIF, up to 5 MB.</p>
          </div>
```

In `frontend/src/app/admin/events/new/page.tsx`, replace:

```tsx
      await apiClient.post('/admin/events', data);
      toast.success('Event created');
      router.push('/admin/events');
```

with:

```tsx
      const response = await apiClient.post('/admin/events', data);
      const createdId = response.data?.data?.id;
      toast.success(createdId ? 'Event created. You can add an image now.' : 'Event created');
      router.push(createdId ? `/admin/events/${createdId}/edit` : '/admin/events');
```

- [ ] **Step 3: Show the image on the events list and the event page**

In `frontend/src/app/events/page.tsx`:
- Add `import { resolveAssetUrl } from '@/lib/utils';`.
- Directly after the closing `</div>` of the date badge (the `flex h-16 w-16 shrink-0 ...` block), add:

```tsx
                {event.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveAssetUrl(event.image_url)}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded-2xl object-cover"
                  />
                )}
```

In `frontend/src/app/events/[id]/page.tsx`:
- Add `import { resolveAssetUrl } from '@/lib/utils';`.
- Replace `<div className="h-56 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 sm:h-72" />` with:

```tsx
          {data.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveAssetUrl(data.image_url)} alt={data.name} className="h-56 w-full object-cover sm:h-72" />
          ) : (
            <div className="h-56 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 sm:h-72" />
          )}
```

- [ ] **Step 4: Type-check, lint and build**

Run: `cd frontend && npm run -s type-check && npm run -s lint && npm run -s build`
Expected: no errors, and the build succeeds. If lint reports the `eslint-disable` comments as unused (the `no-img-element` rule not enabled), remove those comments and record a ruling.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useApi.ts "frontend/src/app/admin/events/[id]/edit/page.tsx" frontend/src/app/admin/events/new/page.tsx frontend/src/app/events/page.tsx "frontend/src/app/events/[id]/page.tsx"
git commit -m "feat(web): event images in admin and on event pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Mobile event images

**Files:**
- Modify: `mobile/package.json`, `mobile/package-lock.json`, `mobile/app.json`
- Create: `mobile/src/lib/media.ts`
- Modify: `mobile/src/hooks/use-api.ts`. Add the hooks directly **before `export const useDeleteAdminEvent`**.
- Modify: `mobile/src/app/admin-events/[id].tsx`, `mobile/src/app/events/[id].tsx`, `mobile/src/app/(tabs)/events.tsx`

**Interfaces:**
- Consumes: `POST` and `DELETE /api/admin/events/:id/image`, and `image_url` (Task 3).
- Produces:
  - `resolveImageUrl(url?: string | null) → string | null`
  - `useUploadEventImage(eventId)`, whose `mutate` takes an `{ uri, mimeType?, fileName? }` object.
  - `useRemoveEventImage(eventId)`

- [ ] **Step 1: Install the image picker and add its plugin**

Run: `cd mobile && npx expo install expo-image-picker`
Expected: `expo-image-picker` (`~55.x`) is added to `package.json`, and the lock file updates.

In `mobile/app.json`, add this to `plugins`, directly after `"expo-notifications"`:

```json
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow ANT PRESS to choose photos for events and albums."
        }
      ],
```

- [ ] **Step 2: Add the image URL helper and the hooks**

Create `mobile/src/lib/media.ts`:

```ts
import { API_URL } from '@/lib/config';

const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

// Older images are stored as /uploads/... on the API server; newer ones are full Cloudinary URLs.
export const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  return url.startsWith('/uploads/') ? `${API_ORIGIN}${url}` : url;
};
```

In `mobile/src/hooks/use-api.ts`, add this directly before `export const useDeleteAdminEvent`:

```ts
type PickedImage = { uri: string; mimeType?: string | null; fileName?: string | null };

const invalidateEventImageQueries = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin', 'events'] }),
    queryClient.invalidateQueries({ queryKey: ['events'] }),
  ]);

export const useUploadEventImage = (eventId?: number) =>
  useMutation({
    mutationFn: async (image: PickedImage) => {
      const formData = new FormData();
      formData.append('image', {
        uri: image.uri,
        name: image.fileName || 'event.jpg',
        type: image.mimeType || 'image/jpeg',
      } as any);
      const response = await apiClient.post(`/admin/events/${eventId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data?.data as { image_url: string };
    },
    onSettled: invalidateEventImageQueries,
  });

export const useRemoveEventImage = (eventId?: number) =>
  useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/admin/events/${eventId}/image`);
    },
    onSettled: invalidateEventImageQueries,
  });

```

- [ ] **Step 3: Image picker on the admin edit screen**

In `mobile/src/app/admin-events/[id].tsx`:
- Change the `react-native` import to `import { Alert, StyleSheet, TextInput, View } from 'react-native';`.
- Add these imports:

```tsx
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { resolveImageUrl } from '@/lib/media';
```

- Add `useRemoveEventImage` and `useUploadEventImage` to the `@/hooks/use-api` import.
- After the `const event = React.useMemo(...)` declaration, add:

```tsx
  const uploadImage = useUploadEventImage(event?.id);
  const removeImage = useRemoveEventImage(event?.id);
  const imageUri = resolveImageUrl(event?.image_url);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [16, 9] });
    const asset = result.canceled ? undefined : result.assets?.[0];
    if (!asset) return;
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('Image too large', 'Choose an image under 5 MB.');
      return;
    }
    uploadImage.mutate(asset, {
      onError: (error) => Alert.alert('Could not upload', getApiErrorMessage(error, 'Please try again.')),
    });
  };
```

- Inside the `<>` fragment, directly before `<Field control={control} name="name" ...`, add:

```tsx
            <View style={styles.imageBlock}>
              {imageUri ? <Image source={{ uri: imageUri }} style={styles.eventImage} contentFit="cover" /> : null}
              <BrandButton
                label={uploadImage.isPending ? 'Uploading...' : imageUri ? 'Change Image' : 'Add Image'}
                onPress={() => !uploadImage.isPending && pickImage()}
                variant="outline"
              />
              {imageUri ? (
                <BrandButton
                  label="Remove Image"
                  onPress={() =>
                    !removeImage.isPending &&
                    removeImage.mutate(undefined, {
                      onError: (error) => Alert.alert('Could not remove', getApiErrorMessage(error, 'Please try again.')),
                    })
                  }
                  variant="outline"
                />
              ) : null}
            </View>
```

- Add these entries to the `StyleSheet.create({...})` object:

```tsx
  imageBlock: { gap: Spacing.two },
  eventImage: { width: '100%', height: 180, borderRadius: Radius.medium },
```

- [ ] **Step 4: Show the image on the event screen and in the events list**

In `mobile/src/app/events/[id].tsx`:
- Add `import { Image } from 'expo-image';` and `import { resolveImageUrl } from '@/lib/media';`.
- Make this the **first child** inside `<View style={styles.heroCard}>`:

```tsx
            {resolveImageUrl(data.image_url) ? (
              <Image source={{ uri: resolveImageUrl(data.image_url) as string }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : null}
```

  (`StyleSheet` is already imported there. If not, add it to the `react-native` import.)

In `mobile/src/app/(tabs)/events.tsx`:
- Add `import { Image } from 'expo-image';` and `import { resolveImageUrl } from '@/lib/media';`.
- Directly before `<View style={styles.eventBody}>`, add:

```tsx
              {resolveImageUrl(item.image_url) ? (
                <Image source={{ uri: resolveImageUrl(item.image_url) as string }} style={styles.eventThumb} contentFit="cover" />
              ) : null}
```

- Add `eventThumb: { width: 56, height: 56, borderRadius: Radius.medium },` to its `StyleSheet.create({...})`.

- [ ] **Step 5: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`. If `launchImageLibraryAsync`'s `mediaTypes` type in the installed version only accepts `ImagePicker.MediaTypeOptions.Images`, use what the installed types require and record a ruling.

- [ ] **Step 6: Commit**

```bash
git add mobile/package.json mobile/package-lock.json mobile/app.json mobile/src/lib/media.ts mobile/src/hooks/use-api.ts "mobile/src/app/admin-events/[id].tsx" "mobile/src/app/events/[id].tsx" "mobile/src/app/(tabs)/events.tsx"
git commit -m "feat(mobile): pick, show and remove event images

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Documentation and final checks

**Files:**
- Modify: `docs/deployment.md`, `docs/features.md`, `docs/qa-checklist.md`

- [ ] **Step 1: Document Cloudinary setup (no values)**

Append to `docs/deployment.md`:

```markdown
## Image storage (Cloudinary)

Uploaded images (profile photos, news, sermon series, events; later photo albums) are stored on Cloudinary so they survive redeploys.

1. Create a Cloudinary account (the free plan is enough to start) and open **Settings → API Keys**.
2. In the Render dashboard, set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` (declared in `render.yaml` with `sync: false`). Never commit these values.
3. Redeploy. New uploads go to the `antpresby/` folder in Cloudinary.

Without these settings (e.g. on a local machine) uploads are saved under `backend/uploads/` instead. Images uploaded before this change keep their `/uploads/...` links; re-upload any that no longer load.

The mobile app's event image picker (`expo-image-picker`) is a native module: ship a new EAS build.
```

- [ ] **Step 2: Document the feature and the QA steps**

In `docs/features.md`, append:

```markdown
## Images and Currency

- Uploaded images are stored on Cloudinary (local disk when Cloudinary isn't configured); replaced images are cleaned up.
- Events can have a cover image, added on web `/admin/events/[id]/edit` or in the mobile admin event screen, and shown on event lists and pages.
- All amounts are shown in Ghana cedis (`GH₵ 1,250.00`), and Paystack charges in GHS.
```

Append to `docs/qa-checklist.md`:

```markdown
## Images and Cedis

- [ ] With Cloudinary configured, upload a profile photo, a news image and a series cover; the image URLs start with `https://res.cloudinary.com/`
- [ ] Replace a profile photo; the old image disappears from the Cloudinary `antpresby/profile` folder
- [ ] Add, replace and remove an event image on web; the event list and event page update
- [ ] (Dev/store build) Add an event image from the phone's photo library
- [ ] Every amount on the donate pages, donation history and admin screens shows `GH₵`; no `$` anywhere
- [ ] A test donation opens Paystack checkout in GHS
```

- [ ] **Step 3: Run all checks**

```bash
cd backend && npx jest --runInBand --coverage=false && npx eslint src/ tests/ && cd ..
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build && cd ..
cd mobile && npm run -s lint && npx tsc --noEmit && cd ..
```

Expected: **331** backend tests pass, there are no lint or type errors, and the build succeeds.

- [ ] **Step 4: Commit**

```bash
git add docs/deployment.md docs/features.md docs/qa-checklist.md
git commit -m "docs: Cloudinary setup, event images and cedis

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
