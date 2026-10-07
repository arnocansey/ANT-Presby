# Phase 7b: Photo Albums Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admins publish photo albums (uploaded straight to Cloudinary, plus an optional outside-folder link), and anyone with the link can view the photos and download them one at a time or all at once, on the web and in the mobile app.

**Architecture:**
- `imageStorage` (from Phase 7a) stays the only module that imports `cloudinary`. It gains the album helpers: an upload signature, asset verification through the Admin API, delivery URLs (display, thumbnail, download) and a zip archive URL.
- Two new tables, `photo_albums` and `album_photos`, with a `photoAlbumModel`. `GET /api/events/:id` gains `album_id`.
- Browsers and phones upload photos **directly to Cloudinary** with a server-issued signature, then post the resulting public IDs to the API. The API re-checks every ID with Cloudinary before recording it.
- Publishing notifies everyone once, through an atomic claim on `notified_at`, the first time an album is both published and has photos.

**Tech Stack:**
- Backend: Express 4, Prisma 6, `cloudinary` 2.x (already installed), Jest 29 and supertest
- Web: Next.js 16, TanStack Query 5 and lucide-react 0.294
- Mobile: Expo SDK 55 with `expo-image-picker` (installed), `expo-image`, and the new `expo-media-library` and `expo-file-system`

**Spec:** `docs/superpowers/specs/2026-10-07-media-live-cedis-design.md`. Albums only: §3 (`PhotoAlbum`, `AlbumPhoto`, `Event.albums`), §4 (the album parts of `imageStorage`), §5 "Albums" plus `album_id` on `GET /api/events/:id`, §6 and §7 (gallery, admin gallery, event-page album link, notification routing, new packages), §9 and §10 (album parts). Livestream (Phase 7c) is out of scope.

## Global Constraints

- **Schema changes:** every change goes in `backend/prisma/schema.prisma` **and** as idempotent SQL in `backend/migrations/migrateFeatureUpdates.js`, directly before `await client.query('COMMIT');`.
  - Never run the migration: there is no database. Never `require()` it; tests read it as text.
  - Validate with `DATABASE_URL="postgresql://x:y@localhost:5432/z" npx prisma validate` and `node --check`.
- **Secrets:** never write real secrets into any file. Cloudinary credentials are env-only. Tests use `demo`, `test-placeholder-key` and `test-placeholder-secret`. **The API secret is never returned by any endpoint.**
- **Cloudinary folders:** album photos live under `antpresby/albums/<albumId>/`. Folder checks always include the trailing slash, so album `7` never matches album `70`.
- **Album photos:** formats `jpg, jpeg, png, webp, heic`; 10 MB at most (`10 * 1024 * 1024` bytes), checked on the client before upload and by the server when recording.
- **Recording photos:** `POST /:id/photos` takes 1–100 `publicIds`. Response `{ added: number, rejected: string[] }`. None valid → 400 with the same shape in `data`.
- **Thumbnails:** `c_fill,w_400,h_400,q_auto,f_auto`. Downloads use the `fl_attachment` flag. Full-size viewing uses `q_auto,f_auto` (so HEIC displays in every browser).
- **Notifications:** only through `notificationService.notifyAll`, type `album`, entity `album`, title `New photos: <title>`; at most once per album, ever.
- **Admin routes:** `verifyToken` + `requireRole('admin')` (the spec's `isAuthenticated` + `isAdmin`), and every write is audited with `auditLogModel.createAuditLog` (`entityType: 'album'`).
- **Ids:** `parseId` for every id; an invalid id is 404 without touching the database.
- **Uploads to Cloudinary from clients** use plain `fetch`, **never** `apiClient`, so our auth token is never sent to Cloudinary. Web uploads 4 at a time; mobile 3 at a time.
- **Dependencies:** no new backend or web dependencies. Mobile adds `expo-media-library` and `expo-file-system`, both with `npx expo install`.
- **pnpm:** if `pnpm` rewrites `backend/pnpm-workspace.yaml`, run `git checkout -- backend/pnpm-workspace.yaml` and never commit it.
- **Merge hygiene (Phase 7c runs in parallel):** add code only at the insertion points named in each step; never reformat or reorder existing lines.
- **Commits:** every commit message ends with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never push.

## Review Focus

1. **A forged or foreign public ID.** An admin client posting IDs from another album (including a prefix twin such as album `70` for album `7`), another folder, a deleted asset, a video or a 25 MB file gets those IDs back in `rejected`, and nothing is recorded for them. *(Task 1 `verifyAlbumAssets`; Task 3 API tests)*
2. **The secret leaking.** The upload signature response contains the cloud name, API key, timestamp, folder and signature, never `CLOUDINARY_API_SECRET`; web and mobile uploads use plain `fetch` with no `Authorization` header. *(Tasks 1, 3, 5 and 7)*
3. **Publishing before the photos arrive.** An admin who ticks "Published" on an empty album and then uploads gets exactly one notification, sent when the first photos are recorded; unpublishing and republishing never notifies again. *(Task 3)*
4. **Deleting album 1 must not touch album 10.** Folder cleanup deletes by the prefix `antpresby/albums/1/` (with the slash), never `antpresby/albums/1`. *(Task 1)*
5. **A big album's "Download all".** Archive URLs list each public ID only up to 100 photos; larger albums switch to the folder prefix so the signed URL stays short enough for Cloudinary and browsers. *(Task 1)*

---

## File Map

| File | Change | Responsibility |
|---|---|---|
| `backend/src/services/imageStorage.js` | Modify | Album signature, asset verification, delivery URLs, archive URL, album cleanup |
| `backend/tests/services/albumStorage.test.js` | Create | Album storage tests (Cloudinary mocked) |
| `backend/prisma/schema.prisma` | Modify | `PhotoAlbum`, `AlbumPhoto`, `Event.albums`, `User.createdAlbums` |
| `backend/migrations/migrateFeatureUpdates.js` | Modify | `photo_albums`, `album_photos` |
| `backend/tests/migrations/photoAlbumMigration.test.js` | Create | Migration text check |
| `backend/src/models/photoAlbumModel.js` | Create | Album and photo queries, covers, notify claim |
| `backend/src/models/eventModel.js` | Modify | `album_id` on `getEventById` |
| `backend/tests/models/photoAlbumModel.test.js`, `backend/tests/models/eventAlbumLink.test.js` | Create | Model tests |
| `backend/src/middleware/validators.js` | Modify | `validateAlbum`, `validateAlbumPhotos`, `validateAlbumCover` |
| `backend/src/controllers/albumController.js` | Create | Public and admin handlers |
| `backend/src/routes/albumRoutes.js`, `backend/src/routes/adminAlbumRoutes.js` | Create | Routes |
| `backend/src/server.js` | Modify | Mount routes |
| `backend/tests/api/albums.test.js` | Create | API tests |
| `frontend/src/hooks/useApi.ts` | Modify | Album types and hooks |
| `frontend/src/lib/albumUpload.ts` | Create | Direct Cloudinary upload and a concurrency helper |
| `frontend/src/components/gallery/PhotoViewer.tsx` | Create | Full-size viewer with arrow keys |
| `frontend/src/app/gallery/page.tsx`, `frontend/src/app/gallery/[id]/page.tsx` | Create | Public gallery |
| `frontend/src/app/admin/gallery/page.tsx`, `frontend/src/app/admin/gallery/[id]/page.tsx` | Create | Admin gallery |
| `frontend/src/app/events/[id]/page.tsx` | Modify | "View photos" link |
| `frontend/src/components/layout/Header.tsx`, `AdminSidebar.tsx`, `NotificationBell.tsx` | Modify | Navigation and notification routing |
| `mobile/package.json`, `mobile/package-lock.json`, `mobile/app.json` | Modify | `expo-media-library`, `expo-file-system`, permission strings |
| `mobile/src/hooks/use-api.ts` | Modify | Album types and hooks |
| `mobile/src/lib/album-upload.ts`, `mobile/src/lib/save-photo.ts` | Create | Direct upload; save to Photos |
| `mobile/src/app/gallery/index.tsx`, `mobile/src/app/gallery/[id].tsx` | Create | Gallery screens |
| `mobile/src/app/admin-gallery.tsx`, `mobile/src/app/admin-gallery/[id].tsx` | Create | Admin gallery screens |
| `mobile/src/lib/push.ts`, `mobile/src/app/admin.tsx`, `mobile/src/app/(tabs)/account.tsx`, `mobile/src/app/events/[id].tsx` | Modify | Routing and entry points |
| `docs/deployment.md`, `docs/features.md`, `docs/qa-checklist.md` | Modify | Docs |

**Test counts:** baseline **336** → Task 1 **347** → Task 2 **357** → Task 3 **388**. Tasks 4–8 add no backend tests.

---

### Task 1: Album helpers in image storage

**Files:**
- Modify: `backend/src/services/imageStorage.js`
- Test: `backend/tests/services/albumStorage.test.js` (new file; the existing `imageStorage.test.js` is left alone)

**Interfaces:**
- Consumes: the existing `isConfigured()`, `client()`, `storageUnavailable()` and `ROOT_FOLDER` inside `imageStorage.js`.
- Produces (all exported from `imageStorage`):
  - `ALBUM_MAX_BYTES` (`10485760`) and `ALBUM_FORMATS` (`['jpg', 'jpeg', 'png', 'webp', 'heic']`)
  - `albumFolder(albumId) → 'antpresby/albums/<id>'`
  - `isAlbumPublicId(publicId, albumId?) → boolean`
  - `createAlbumUploadSignature(albumId) → { cloudName, apiKey, timestamp, signature, folder, allowedFormats, maxFileSize }`. `allowedFormats` is the comma-joined string that was signed.
  - `verifyAlbumAssets(albumId, publicIds) → Promise<{ verified: Array<{ publicId, url, width, height, bytes, format }>, rejected: string[] }>`. It rejects with `statusCode` 502 when the Admin API fails.
  - `displayUrl(publicId)`, `thumbnailUrl(publicId)` and `downloadUrl(publicId)` → `string | null`. They return null when Cloudinary isn't configured or the id is empty.
  - `albumArchiveUrl(albumId, publicIds, title) → string`
  - `deleteAlbumPhoto(publicId) → Promise<boolean>` and `deleteAlbumFolder(albumId) → Promise<boolean>`. Neither ever rejects.

- [ ] **Step 1: Check the branch and the baseline**

You are on branch `feature/photo-albums` at `087ad65` (the tip of `feature/media-storage-cedis`); the baseline is **336**. Run the installs with `run_in_background`, because they are slow:

```bash
git branch --show-current && git log --oneline -1
cd backend && pnpm install --frozen-lockfile && npx prisma generate && npx jest --runInBand --coverage=false
cd frontend && npm ci --no-audit --no-fund
cd mobile && npm ci --no-audit --no-fund
```

Expected: `feature/photo-albums`, `087ad65 fix: show every amount in cedis...`, and **336** passing. If `backend/pnpm-workspace.yaml` shows as modified afterwards, run `git checkout -- backend/pnpm-workspace.yaml`.

The SDK names used below were checked in the installed `cloudinary` 2.11.0:
- `v2.utils.api_sign_request(params, secret)`
- `v2.api.resources_by_ids(ids)`, `v2.api.delete_resources_by_prefix(prefix)` and `v2.api.delete_folder(path)`. These return promises when no callback is passed.
- `v2.utils.download_zip_url(options)`
- `v2.url(publicId, options)`

- [ ] **Step 2: Write the failing tests**

Create `backend/tests/services/albumStorage.test.js`:

```js
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
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/services/albumStorage.test.js --coverage=false`
Expected: FAIL with `storage.createAlbumUploadSignature is not a function` (and the same for the other helpers).

- [ ] **Step 4: Add the album helpers**

In `backend/src/services/imageStorage.js`, insert this block directly **before** `module.exports = {`:

```js
// ---- Photo albums (phase 7b) ----
// Album photos are uploaded by the browser or phone straight to antpresby/albums/<id>/ with a signature
// issued here, then re-checked with the Admin API before they are recorded.

const ALBUM_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
const ALBUM_MAX_BYTES = 10 * 1024 * 1024;
const ALBUM_ARCHIVE_ID_LIMIT = 100;
const ALBUM_PUBLIC_ID = /^antpresby\/albums\/(\d+)\/[A-Za-z0-9_-]+$/;

const albumFolder = (albumId) => `${ROOT_FOLDER}/albums/${Number(albumId)}`;

const isAlbumPublicId = (publicId, albumId) => {
  const match = ALBUM_PUBLIC_ID.exec(String(publicId || ''));
  if (!match) return false;
  return albumId === undefined || Number(match[1]) === Number(albumId);
};

// Everything the client needs to upload one batch; the API secret never leaves the server.
const createAlbumUploadSignature = (albumId) => {
  const folder = albumFolder(albumId);
  const timestamp = Math.round(Date.now() / 1000);
  const allowedFormats = ALBUM_FORMATS.join(',');
  const signature = client().utils.api_sign_request(
    { allowed_formats: allowedFormats, folder, timestamp },
    process.env.CLOUDINARY_API_SECRET
  );
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    allowedFormats,
    maxFileSize: ALBUM_MAX_BYTES,
  };
};

// Keeps only ids that sit in this album's folder and that Cloudinary confirms are small enough images.
const verifyAlbumAssets = async (albumId, publicIds) => {
  const unique = [...new Set((publicIds || []).map(String))];
  const candidates = unique.filter((publicId) => isAlbumPublicId(publicId, albumId));
  const rejected = unique.filter((publicId) => !candidates.includes(publicId));
  if (candidates.length === 0) return { verified: [], rejected };

  let resources;
  try {
    const result = await client().api.resources_by_ids(candidates);
    resources = result?.resources || [];
  } catch (error) {
    console.warn('Cloudinary asset check failed:', error.message);
    throw storageUnavailable();
  }

  const byId = new Map(resources.map((resource) => [resource.public_id, resource]));
  const verified = [];
  candidates.forEach((publicId) => {
    const asset = byId.get(publicId);
    const bytes = Number(asset?.bytes);
    const ok =
      asset &&
      asset.resource_type === 'image' &&
      ALBUM_FORMATS.includes(String(asset.format).toLowerCase()) &&
      bytes > 0 &&
      bytes <= ALBUM_MAX_BYTES;
    if (ok) {
      verified.push({
        publicId,
        url: asset.secure_url,
        width: asset.width ?? null,
        height: asset.height ?? null,
        bytes,
        format: String(asset.format).toLowerCase(),
      });
    } else {
      rejected.push(publicId);
    }
  });
  return { verified, rejected };
};

const deliveryUrl = (publicId, options) =>
  publicId && isConfigured() ? client().url(publicId, { secure: true, ...options }) : null;

// Full size, in a format every browser can show (HEIC included).
const displayUrl = (publicId) => deliveryUrl(publicId, { quality: 'auto', fetch_format: 'auto' });
const thumbnailUrl = (publicId) =>
  deliveryUrl(publicId, { crop: 'fill', width: 400, height: 400, quality: 'auto', fetch_format: 'auto' });
// The original file, served with Content-Disposition: attachment.
const downloadUrl = (publicId) => deliveryUrl(publicId, { flags: 'attachment' });

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

// A signed link that makes Cloudinary build the zip on its side. Generated on request; never stored.
// Up to 100 photos are listed by id; bigger albums use the folder prefix so the URL stays short.
const albumArchiveUrl = (albumId, publicIds, title) => {
  const options = {
    resource_type: 'image',
    flatten_folders: true,
    target_public_id: slugify(title) || `album-${Number(albumId)}`,
  };
  if (publicIds.length <= ALBUM_ARCHIVE_ID_LIMIT) {
    options.public_ids = publicIds;
  } else {
    options.prefixes = `${albumFolder(albumId)}/`;
  }
  return client().utils.download_zip_url(options);
};

// Best-effort removal of one album photo; never throws.
const deleteAlbumPhoto = async (publicId) => {
  if (!isAlbumPublicId(publicId) || !isConfigured()) return false;
  try {
    await client().uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
    return true;
  } catch (error) {
    console.warn('Album photo cleanup failed:', error.message);
    return false;
  }
};

// Best-effort removal of everything in an album's folder. The trailing slash keeps album 1 away from album 10.
const deleteAlbumFolder = async (albumId) => {
  if (!isConfigured()) return false;
  const folder = albumFolder(albumId);
  try {
    await client().api.delete_resources_by_prefix(`${folder}/`);
  } catch (error) {
    console.warn('Album cleanup failed:', error.message);
    return false;
  }
  try {
    await client().api.delete_folder(folder);
  } catch (error) {
    // The folder may already be gone or never have existed; the photos are deleted either way.
    console.warn('Album folder removal skipped:', error.message);
  }
  return true;
};

```

Then add these names to `module.exports`, directly after `  deleteImage,`:

```js
  ALBUM_FORMATS,
  ALBUM_MAX_BYTES,
  albumFolder,
  isAlbumPublicId,
  createAlbumUploadSignature,
  verifyAlbumAssets,
  displayUrl,
  thumbnailUrl,
  downloadUrl,
  albumArchiveUrl,
  deleteAlbumPhoto,
  deleteAlbumFolder,
```

- [ ] **Step 5: Run the tests, the suite, and lint**

Run: `cd backend && npx jest tests/services/albumStorage.test.js tests/services/imageStorage.test.js --coverage=false && npx jest --runInBand --coverage=false && npx eslint src/ tests/`
Expected:
- The 11 album storage tests and the existing imageStorage tests pass.
- The suite reaches **347**.
- Lint is clean.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/imageStorage.js backend/tests/services/albumStorage.test.js
git commit -m "feat: album upload signatures, asset checks and download links in image storage

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Album tables, the album model, and `album_id` on events

**Files:**
- Modify: `backend/prisma/schema.prisma`, `backend/migrations/migrateFeatureUpdates.js`, `backend/src/models/eventModel.js`
- Create: `backend/src/models/photoAlbumModel.js`
- Test: `backend/tests/migrations/photoAlbumMigration.test.js`, `backend/tests/models/photoAlbumModel.test.js`, `backend/tests/models/eventAlbumLink.test.js`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces:
  - Prisma models `PhotoAlbum` (`prisma.photoAlbum`) and `AlbumPhoto` (`prisma.albumPhoto`).
  - `photoAlbumModel` returns albums shaped as `Album = { id, title, description, event_id, event_name, external_url, cover_photo_id, is_published, notified_at, created_at, updated_at, photo_count, cover: { public_id, url } | null }`. The detail functions add `photos: Photo[]`, where `Photo = { id, album_id, public_id, url, width, height, bytes, format, sort_order, created_at }`.
  - Functions:
    - `listPublished({ offset, limit }) → Album[]`, `countPublished() → number`, `getPublishedById(id) → AlbumDetail | undefined`
    - `listAll() → Album[]`, `getById(id) → AlbumDetail | undefined`, `eventExists(eventId) → boolean`
    - `createAlbum(input, createdBy) → AlbumDetail`, `updateAlbum(id, input) → AlbumDetail | undefined`, `deleteAlbum(id) → number`. `input` is `{ title, description, eventId, externalUrl, isPublished }`; any field may be `undefined`, which means unchanged.
    - `addPhotos(albumId, verified) → number` (newly inserted; duplicates skipped), `deletePhoto(albumId, photoId) → Photo | undefined`, `setCover(albumId, photoId) → boolean`, `claimNotification(id) → boolean`
  - `eventModel.getEventById(id)` now includes `album_id: number | null`, the earliest published album for that event.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/migrations/photoAlbumMigration.test.js`:

```js
const fs = require('fs');
const path = require('path');

// Read as text only: the migration connects to the database when required.
const source = fs.readFileSync(path.join(__dirname, '../../migrations/migrateFeatureUpdates.js'), 'utf8');

describe('photo album migration SQL', () => {
  test('creates both album tables before COMMIT, with cascade, unique public ids and indexes', () => {
    const commit = source.indexOf("await client.query('COMMIT');");
    ['photo_albums', 'album_photos'].forEach((table) => {
      const at = source.indexOf(`CREATE TABLE IF NOT EXISTS ${table} (`);
      expect(at).toBeGreaterThan(-1);
      expect(at).toBeLessThan(commit);
    });
    expect(source).toContain('album_id INTEGER NOT NULL REFERENCES photo_albums(id) ON DELETE CASCADE');
    expect(source).toContain('CONSTRAINT album_photos_public_id_key UNIQUE (public_id)');
    expect(source).toContain('ON photo_albums(is_published, created_at DESC)');
    expect(source).toContain('ON album_photos(album_id, sort_order)');
  });
});
```

Create `backend/tests/models/photoAlbumModel.test.js`:

```js
const load = (prismaMock = {}) => {
  jest.resetModules();
  jest.doMock('../../src/config/prisma', () => prismaMock);
  return require('../../src/models/photoAlbumModel');
};

const WHEN = new Date('2026-10-05T10:00:00Z');
const photoRow = (id, albumId = 3) => ({
  id,
  albumId,
  publicId: `antpresby/albums/${albumId}/p${id}`,
  url: `https://res.cloudinary.com/demo/image/upload/v1/antpresby/albums/${albumId}/p${id}.jpg`,
  width: 800,
  height: 600,
  bytes: 1000,
  format: 'jpg',
  sortOrder: id,
  createdAt: WHEN,
});
const albumRow = (overrides = {}) => ({
  id: 3,
  title: 'Harvest',
  description: null,
  eventId: 4,
  event: { name: 'Harvest Sunday' },
  externalUrl: null,
  coverPhotoId: null,
  isPublished: true,
  notifiedAt: null,
  createdBy: 1,
  createdAt: WHEN,
  updatedAt: WHEN,
  photos: [],
  _count: { photos: 0 },
  ...overrides,
});
const PHOTO_ORDER = [{ sortOrder: 'asc' }, { id: 'asc' }];

describe('photoAlbumModel', () => {
  test('listPublished shows only published albums, with the chosen cover or else the first photo', async () => {
    const prisma = {
      photoAlbum: {
        findMany: jest.fn().mockResolvedValue([
          albumRow({ id: 3, coverPhotoId: 12, photos: [photoRow(11, 3)], _count: { photos: 2 } }),
          albumRow({ id: 4, coverPhotoId: 99, photos: [photoRow(21, 4)], _count: { photos: 1 } }),
          albumRow({ id: 5, eventId: null, event: null }),
        ]),
      },
      albumPhoto: { findMany: jest.fn().mockResolvedValue([photoRow(12, 3), photoRow(99, 8)]) },
    };

    const albums = await load(prisma).listPublished({ offset: 0, limit: 12 });

    expect(prisma.photoAlbum.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isPublished: true }, skip: 0, take: 12, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
    );
    expect(prisma.albumPhoto.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: [12, 99] } } }));
    expect(albums.map((album) => album.cover && album.cover.public_id)).toEqual([
      'antpresby/albums/3/p12',
      'antpresby/albums/4/p21',
      null,
    ]);
    expect(albums[0]).toEqual(expect.objectContaining({ id: 3, event_name: 'Harvest Sunday', photo_count: 2, is_published: true }));
    expect(albums[2]).toEqual(expect.objectContaining({ event_id: null, event_name: null, photo_count: 0 }));
  });

  test('getPublishedById returns ordered photos and hides drafts', async () => {
    const prisma = {
      photoAlbum: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(albumRow({ coverPhotoId: 12, photos: [photoRow(11), photoRow(12)] }))
          .mockResolvedValueOnce(null),
      },
    };
    const model = load(prisma);

    const album = await model.getPublishedById(3);

    expect(prisma.photoAlbum.findFirst).toHaveBeenCalledWith({
      where: { id: 3, isPublished: true },
      include: { event: { select: { name: true } }, photos: { orderBy: PHOTO_ORDER } },
    });
    expect(album).toEqual(
      expect.objectContaining({ id: 3, photo_count: 2, cover: { public_id: 'antpresby/albums/3/p12', url: photoRow(12).url } })
    );
    expect(album.photos[0]).toEqual(expect.objectContaining({ id: 11, public_id: 'antpresby/albums/3/p11', sort_order: 11 }));
    expect(await model.getPublishedById(3)).toBeUndefined();
  });

  test('addPhotos continues the sort order and skips duplicates', async () => {
    const prisma = {
      albumPhoto: {
        aggregate: jest.fn().mockResolvedValue({ _max: { sortOrder: 4 } }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const added = await load(prisma).addPhotos(3, [
      { publicId: 'antpresby/albums/3/a', url: 'https://x/a.jpg', width: 10, height: 20, bytes: 30, format: 'jpg' },
      { publicId: 'antpresby/albums/3/b', url: 'https://x/b.jpg' },
    ]);

    expect(added).toBe(1);
    expect(prisma.albumPhoto.aggregate).toHaveBeenCalledWith({ where: { albumId: 3 }, _max: { sortOrder: true } });
    expect(prisma.albumPhoto.createMany).toHaveBeenCalledWith({
      data: [
        { albumId: 3, publicId: 'antpresby/albums/3/a', url: 'https://x/a.jpg', width: 10, height: 20, bytes: 30, format: 'jpg', sortOrder: 5 },
        { albumId: 3, publicId: 'antpresby/albums/3/b', url: 'https://x/b.jpg', width: null, height: null, bytes: null, format: null, sortOrder: 6 },
      ],
      skipDuplicates: true,
    });
  });

  test('deletePhoto only deletes a photo of this album and clears it as the cover', async () => {
    const prisma = {
      albumPhoto: {
        findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(photoRow(12)),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      photoAlbum: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      $transaction: jest.fn((operations) => Promise.all(operations)),
    };
    const model = load(prisma);

    expect(await model.deletePhoto(3, 12)).toBeUndefined();
    expect(prisma.$transaction).not.toHaveBeenCalled();

    const deleted = await model.deletePhoto(3, 12);

    expect(prisma.albumPhoto.findFirst).toHaveBeenLastCalledWith({ where: { id: 12, albumId: 3 } });
    expect(prisma.albumPhoto.deleteMany).toHaveBeenCalledWith({ where: { id: 12 } });
    expect(prisma.photoAlbum.updateMany).toHaveBeenCalledWith({ where: { id: 3, coverPhotoId: 12 }, data: { coverPhotoId: null } });
    expect(deleted).toEqual(expect.objectContaining({ id: 12, public_id: 'antpresby/albums/3/p12' }));
  });

  test('setCover refuses a photo from another album', async () => {
    const prisma = {
      albumPhoto: { findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 12 }) },
      photoAlbum: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const model = load(prisma);

    expect(await model.setCover(3, 99)).toBe(false);
    expect(prisma.photoAlbum.updateMany).not.toHaveBeenCalled();

    expect(await model.setCover(3, 12)).toBe(true);
    expect(prisma.albumPhoto.findFirst).toHaveBeenLastCalledWith({ where: { id: 12, albumId: 3 }, select: { id: true } });
    expect(prisma.photoAlbum.updateMany).toHaveBeenCalledWith({ where: { id: 3 }, data: { coverPhotoId: 12 } });
  });

  test('claimNotification only succeeds once, for a published album with photos', async () => {
    const prisma = { photoAlbum: { updateMany: jest.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 }) } };
    const model = load(prisma);

    expect(await model.claimNotification(3)).toBe(true);
    expect(await model.claimNotification(3)).toBe(false);
    expect(prisma.photoAlbum.updateMany).toHaveBeenCalledWith({
      where: { id: 3, isPublished: true, notifiedAt: null, photos: { some: {} } },
      data: { notifiedAt: expect.any(Date) },
    });
  });

  test('createAlbum trims text and stores blanks as null', async () => {
    const prisma = {
      photoAlbum: {
        create: jest.fn().mockResolvedValue({ id: 3 }),
        findUnique: jest.fn().mockResolvedValue(albumRow({ isPublished: false })),
      },
    };

    const album = await load(prisma).createAlbum(
      { title: '  Harvest ', description: '   ', eventId: null, externalUrl: '', isPublished: false },
      1
    );

    expect(prisma.photoAlbum.create).toHaveBeenCalledWith({
      data: { title: 'Harvest', description: null, eventId: null, externalUrl: null, isPublished: false, createdBy: 1 },
    });
    expect(album).toEqual(expect.objectContaining({ id: 3, is_published: false, photos: [] }));
  });
});
```

Create `backend/tests/models/eventAlbumLink.test.js`:

```js
const load = (prismaMock) => {
  jest.resetModules();
  jest.doMock('../../src/config/prisma', () => prismaMock);
  return require('../../src/models/eventModel');
};

const eventRow = (albums) => ({
  id: 4,
  name: 'Harvest',
  eventDate: new Date('2026-10-05T10:00:00Z'),
  imageUrl: null,
  _count: { registrations: 2 },
  albums,
});

describe('eventModel.getEventById album link', () => {
  test('adds the first published album id', async () => {
    const prisma = { event: { findUnique: jest.fn().mockResolvedValue(eventRow([{ id: 9 }])) } };

    const event = await load(prisma).getEventById(4);

    expect(prisma.event.findUnique).toHaveBeenCalledWith({
      where: { id: 4 },
      include: {
        _count: { select: { registrations: true } },
        albums: { where: { isPublished: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: 1, select: { id: true } },
      },
    });
    expect(event).toEqual(expect.objectContaining({ id: 4, registered_count: 2, album_id: 9 }));
    expect(event).not.toHaveProperty('albums');
    expect(event).not.toHaveProperty('_count');
  });

  test('album_id is null when the event has no published album', async () => {
    const prisma = { event: { findUnique: jest.fn().mockResolvedValue(eventRow([])) } };

    expect(await load(prisma).getEventById(4)).toEqual(expect.objectContaining({ album_id: null }));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/migrations/photoAlbumMigration.test.js tests/models/photoAlbumModel.test.js tests/models/eventAlbumLink.test.js --coverage=false`
Expected: FAIL. The migration has no album tables, `photoAlbumModel` can't be found, and `album_id` is missing.

- [ ] **Step 3: Update the schema**

In `backend/prisma/schema.prisma`:
- In `model User`, add this line directly after `  authoredDevotionals  Devotional[]`:

```prisma
  createdAlbums        PhotoAlbum[]        @relation("AlbumCreator")
```

- In `model Event`, add this line directly after `  announcements    Announcement[]`:

```prisma
  albums           PhotoAlbum[]
```

- Directly after the closing `}` of `model Devotional { ... }`, add a blank line and:

```prisma
model PhotoAlbum {
  id           Int          @id @default(autoincrement())
  title        String       @db.VarChar(255)
  description  String?
  eventId      Int?         @map("event_id")
  externalUrl  String?      @map("external_url") @db.VarChar(500)
  // Plain column with no foreign key (avoids a cycle); checked in code to belong to this album.
  coverPhotoId Int?         @map("cover_photo_id")
  isPublished  Boolean      @default(false) @map("is_published")
  notifiedAt   DateTime?    @map("notified_at")
  createdBy    Int?         @map("created_by")
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")
  event        Event?       @relation(fields: [eventId], references: [id], onDelete: SetNull)
  creator      User?        @relation("AlbumCreator", fields: [createdBy], references: [id], onDelete: SetNull)
  photos       AlbumPhoto[]

  @@index([isPublished, createdAt(sort: Desc)], map: "idx_photo_albums_published_created")
  @@index([eventId], map: "idx_photo_albums_event")
  @@map("photo_albums")
}

model AlbumPhoto {
  id        Int        @id @default(autoincrement())
  albumId   Int        @map("album_id")
  publicId  String     @unique @map("public_id") @db.VarChar(255)
  url       String     @db.VarChar(500)
  width     Int?
  height    Int?
  bytes     Int?
  format    String?    @db.VarChar(10)
  sortOrder Int        @default(0) @map("sort_order")
  createdAt DateTime   @default(now()) @map("created_at")
  album     PhotoAlbum @relation(fields: [albumId], references: [id], onDelete: Cascade)

  @@index([albumId, sortOrder], map: "idx_album_photos_album_sort")
  @@map("album_photos")
}
```

- [ ] **Step 4: Add the migration SQL**

In `backend/migrations/migrateFeatureUpdates.js`, insert this directly before `    await client.query('COMMIT');`:

```js
    // Photo albums (phase 7b)
    await client.query(`
      CREATE TABLE IF NOT EXISTS photo_albums (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
        external_url VARCHAR(500),
        cover_photo_id INTEGER,
        is_published BOOLEAN NOT NULL DEFAULT FALSE,
        notified_at TIMESTAMP,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_photo_albums_published_created
      ON photo_albums(is_published, created_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_photo_albums_event
      ON photo_albums(event_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS album_photos (
        id SERIAL PRIMARY KEY,
        album_id INTEGER NOT NULL REFERENCES photo_albums(id) ON DELETE CASCADE,
        public_id VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        width INTEGER,
        height INTEGER,
        bytes INTEGER,
        format VARCHAR(10),
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT album_photos_public_id_key UNIQUE (public_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_album_photos_album_sort
      ON album_photos(album_id, sort_order);
    `);

```

- [ ] **Step 5: Create the album model**

Create `backend/src/models/photoAlbumModel.js`:

```js
const prisma = require('../config/prisma');

/**
 * Photo Album Model - albums of photos stored on Cloudinary.
 * Members only ever see published albums; drafts are admin-only.
 */

const PHOTO_ORDER = [{ sortOrder: 'asc' }, { id: 'asc' }];
const NEWEST_FIRST = [{ createdAt: 'desc' }, { id: 'desc' }];

const SUMMARY_INCLUDE = {
  event: { select: { name: true } },
  photos: { orderBy: PHOTO_ORDER, take: 1, select: { id: true, publicId: true, url: true } },
  _count: { select: { photos: true } },
};

const DETAIL_INCLUDE = {
  event: { select: { name: true } },
  photos: { orderBy: PHOTO_ORDER },
};

const toPhoto = (row) => ({
  id: row.id,
  album_id: row.albumId,
  public_id: row.publicId,
  url: row.url,
  width: row.width ?? null,
  height: row.height ?? null,
  bytes: row.bytes ?? null,
  format: row.format ?? null,
  sort_order: row.sortOrder,
  created_at: row.createdAt,
});

const toAlbum = (row, cover, photoCount) => ({
  id: row.id,
  title: row.title,
  description: row.description ?? null,
  event_id: row.eventId ?? null,
  event_name: row.event?.name ?? null,
  external_url: row.externalUrl ?? null,
  cover_photo_id: row.coverPhotoId ?? null,
  is_published: row.isPublished,
  notified_at: row.notifiedAt ?? null,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
  photo_count: photoCount,
  cover: cover ? { public_id: cover.publicId, url: cover.url } : null,
});

// The chosen cover when it still belongs to the album, otherwise the first photo.
const withCovers = async (rows) => {
  const coverIds = rows.map((row) => row.coverPhotoId).filter(Boolean);
  const covers = coverIds.length
    ? await prisma.albumPhoto.findMany({
        where: { id: { in: coverIds } },
        select: { id: true, albumId: true, publicId: true, url: true },
      })
    : [];
  const byId = new Map(covers.map((photo) => [photo.id, photo]));
  return rows.map((row) => {
    const chosen = byId.get(row.coverPhotoId);
    const cover = chosen && chosen.albumId === row.id ? chosen : row.photos[0];
    return toAlbum(row, cover, row._count.photos);
  });
};

const toDetail = (row) => {
  const cover = row.photos.find((photo) => photo.id === row.coverPhotoId) || row.photos[0];
  return { ...toAlbum(row, cover, row.photos.length), photos: row.photos.map(toPhoto) };
};

const listPublished = async ({ offset = 0, limit = 12 } = {}) => {
  const rows = await prisma.photoAlbum.findMany({
    where: { isPublished: true },
    orderBy: NEWEST_FIRST,
    skip: Number(offset),
    take: Number(limit),
    include: SUMMARY_INCLUDE,
  });
  return withCovers(rows);
};

const countPublished = () => prisma.photoAlbum.count({ where: { isPublished: true } });

const getPublishedById = async (id) => {
  const row = await prisma.photoAlbum.findFirst({ where: { id: Number(id), isPublished: true }, include: DETAIL_INCLUDE });
  return row ? toDetail(row) : undefined;
};

const listAll = async () => {
  const rows = await prisma.photoAlbum.findMany({ orderBy: NEWEST_FIRST, include: SUMMARY_INCLUDE });
  return withCovers(rows);
};

const getById = async (id) => {
  const row = await prisma.photoAlbum.findUnique({ where: { id: Number(id) }, include: DETAIL_INCLUDE });
  return row ? toDetail(row) : undefined;
};

const eventExists = async (eventId) => (await prisma.event.count({ where: { id: Number(eventId) } })) > 0;

const optionalText = (value) => (value ? String(value).trim() || null : null);

const toData = (input = {}) => {
  const data = {};
  if (input.title !== undefined) data.title = String(input.title).trim();
  if (input.description !== undefined) data.description = optionalText(input.description);
  if (input.eventId !== undefined) data.eventId = input.eventId ? Number(input.eventId) : null;
  if (input.externalUrl !== undefined) data.externalUrl = optionalText(input.externalUrl);
  if (input.isPublished !== undefined) data.isPublished = Boolean(input.isPublished);
  return data;
};

const createAlbum = async (input, createdBy) => {
  const row = await prisma.photoAlbum.create({
    data: { ...toData(input), createdBy: createdBy ? Number(createdBy) : null },
  });
  return getById(row.id);
};

const updateAlbum = async (id, input) => {
  const updated = await prisma.photoAlbum.updateMany({ where: { id: Number(id) }, data: toData(input) });
  return updated.count === 0 ? undefined : getById(id);
};

const deleteAlbum = async (id) => {
  const result = await prisma.photoAlbum.deleteMany({ where: { id: Number(id) } });
  return result.count;
};

// Inserts verified photos after the album's last one; a public id that is already recorded is skipped.
const addPhotos = async (albumId, photos) => {
  const { _max: max } = await prisma.albumPhoto.aggregate({
    where: { albumId: Number(albumId) },
    _max: { sortOrder: true },
  });
  let next = (max?.sortOrder ?? -1) + 1;
  const result = await prisma.albumPhoto.createMany({
    data: photos.map((photo) => ({
      albumId: Number(albumId),
      publicId: photo.publicId,
      url: photo.url,
      width: photo.width ?? null,
      height: photo.height ?? null,
      bytes: photo.bytes ?? null,
      format: photo.format ?? null,
      sortOrder: next++,
    })),
    skipDuplicates: true,
  });
  return result.count;
};

// Deletes one photo of this album; if it was the cover, the album falls back to its first photo.
const deletePhoto = async (albumId, photoId) => {
  const photo = await prisma.albumPhoto.findFirst({ where: { id: Number(photoId), albumId: Number(albumId) } });
  if (!photo) return undefined;
  await prisma.$transaction([
    prisma.albumPhoto.deleteMany({ where: { id: photo.id } }),
    prisma.photoAlbum.updateMany({ where: { id: Number(albumId), coverPhotoId: photo.id }, data: { coverPhotoId: null } }),
  ]);
  return toPhoto(photo);
};

// The cover must be one of the album's own photos.
const setCover = async (albumId, photoId) => {
  const photo = await prisma.albumPhoto.findFirst({
    where: { id: Number(photoId), albumId: Number(albumId) },
    select: { id: true },
  });
  if (!photo) return false;
  const updated = await prisma.photoAlbum.updateMany({ where: { id: Number(albumId) }, data: { coverPhotoId: photo.id } });
  return updated.count === 1;
};

// Atomic claim: only the one caller whose update sets notified_at gets true, so everyone is notified once.
const claimNotification = async (id) => {
  const result = await prisma.photoAlbum.updateMany({
    where: { id: Number(id), isPublished: true, notifiedAt: null, photos: { some: {} } },
    data: { notifiedAt: new Date() },
  });
  return result.count === 1;
};

module.exports = {
  listPublished,
  countPublished,
  getPublishedById,
  listAll,
  getById,
  eventExists,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addPhotos,
  deletePhoto,
  setCover,
  claimNotification,
};
```

- [ ] **Step 6: Add `album_id` to the event detail**

In `backend/src/models/eventModel.js`, `getEventById`:
- Replace its `include` block:

```js
    include: {
      _count: {
        select: { registrations: true },
      },
    },
```

  with:

```js
    include: {
      _count: {
        select: { registrations: true },
      },
      albums: {
        where: { isPublished: true },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: 1,
        select: { id: true },
      },
    },
```

- Replace `  delete mapped._count;` (inside `getEventById` only) with:

```js
  mapped.album_id = event.albums?.[0]?.id ?? null;
  delete mapped._count;
  delete mapped.albums;
```

The `include` text appears only in `getEventById`; check with `grep -n "_count: {" backend/src/models/eventModel.js` and edit the match inside `getEventById`.

- [ ] **Step 7: Validate, then run the tests, the suite, and lint**

Run: `cd backend && DATABASE_URL="postgresql://x:y@localhost:5432/z" npx prisma validate && npx prisma generate && node --check migrations/migrateFeatureUpdates.js && npx jest --runInBand --coverage=false && npx eslint src/ tests/`
Expected:
- `The schema ... is valid`, the client is generated, and the migration passes its syntax check.
- The 10 new tests pass (1 migration, 7 model, 2 event link), and the suite reaches **357**.
- Lint is clean.

- [ ] **Step 8: Commit**

```bash
git add backend/prisma/schema.prisma backend/migrations/migrateFeatureUpdates.js backend/src/models/photoAlbumModel.js backend/src/models/eventModel.js backend/tests/migrations/photoAlbumMigration.test.js backend/tests/models/photoAlbumModel.test.js backend/tests/models/eventAlbumLink.test.js
git commit -m "feat: photo album tables and model, and album_id on events

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Album API (public and admin)

**Files:**
- Modify: `backend/src/middleware/validators.js`, `backend/src/server.js`
- Create: `backend/src/controllers/albumController.js`, `backend/src/routes/albumRoutes.js`, `backend/src/routes/adminAlbumRoutes.js`
- Test: `backend/tests/api/albums.test.js`

**Interfaces:**
- Consumes:
  - From Task 1: `imageStorage.isConfigured`, `createAlbumUploadSignature`, `verifyAlbumAssets`, `displayUrl`, `thumbnailUrl`, `downloadUrl`, `albumArchiveUrl`, `deleteAlbumPhoto` and `deleteAlbumFolder`.
  - From Task 2: every `photoAlbumModel` function.
- Produces (all bodies are `apiResponse` envelopes, `{ success, data, message, meta? }`):
  - `GET /api/albums?page&limit` → `AlbumSummary[]` plus `meta` (`has_more`). `AlbumSummary = { id, title, description, event_id, event_name, cover_url, photo_count, external_url, created_at }`.
  - `GET /api/albums/:id` → `AlbumSummary & { photos: AlbumPhoto[] }`, where `AlbumPhoto = { id, url, thumb_url, download_url, width, height, format }`.
  - `GET /api/albums/:id/download` → `{ url }`
  - Admin (`/api/admin/albums`):
    - `GET /` → `AdminAlbum[]`, where `AdminAlbum = AlbumSummary & { is_published, cover_photo_id, notified_at, updated_at }`
    - `POST /` → 201 `AdminAlbum & { photos }`
    - `GET /:id` → `AdminAlbum & { photos }`
    - `PUT /:id` → `AdminAlbum & { photos }`. The message is `Album published and everyone notified` when it notified, otherwise `Album updated`.
    - `DELETE /:id` → `null`
    - `POST /:id/upload-signature` → the Task 1 signature object
    - `POST /:id/photos` → `{ added, rejected }`
    - `DELETE /:id/photos/:photoId` → `null`
    - `PATCH /:id/cover` → `AdminAlbum & { photos }`
  - Request bodies: album `{ title, description?, eventId?, externalUrl?, isPublished? }`, photos `{ publicIds: string[] }`, cover `{ photoId }`.
  - Notification: `notifyAll({ title: 'New photos: <title>', message, type: 'album', entityType: 'album', entityId })`.

**Decision recorded here:** `GET /api/admin/albums/:id` is not in the spec, but admins need to see a draft album's photos to manage them, and the public detail hides drafts.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/api/albums.test.js`:

```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const as = (userId, role) => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET)}`;
const admin = () => as(1, 'admin');
const PID = (n) => `antpresby/albums/3/photo${n}`;

const photo = (n) => ({
  id: n,
  album_id: 3,
  public_id: PID(n),
  url: `https://res.cloudinary.com/demo/image/upload/v1/${PID(n)}.jpg`,
  width: 800,
  height: 600,
  bytes: 1000,
  format: 'jpg',
  sort_order: n,
  created_at: '2026-10-05T10:00:00.000Z',
});

const album = (overrides = {}) => ({
  id: 3,
  title: 'Harvest Sunday',
  description: null,
  event_id: 4,
  event_name: 'Harvest',
  external_url: null,
  cover_photo_id: null,
  is_published: true,
  notified_at: null,
  created_at: '2026-10-05T10:00:00.000Z',
  updated_at: '2026-10-05T10:00:00.000Z',
  photo_count: 2,
  cover: { public_id: PID(1), url: photo(1).url },
  photos: [photo(1), photo(2)],
  ...overrides,
});

const draft = () => album({ is_published: false, photo_count: 0, cover: null, photos: [] });
const verifiedPhoto = (n) => ({ publicId: PID(n), url: photo(n).url, width: 800, height: 600, bytes: 1000, format: 'jpg' });

const validBody = {
  title: 'Harvest Sunday',
  description: 'Thanksgiving service',
  eventId: 4,
  externalUrl: 'https://drive.google.com/drive/folders/abc123',
  isPublished: true,
};

const buildModels = () => ({
  photoAlbumModel: {
    listPublished: jest.fn().mockResolvedValue([album()]),
    countPublished: jest.fn().mockResolvedValue(1),
    getPublishedById: jest.fn().mockResolvedValue(album()),
    listAll: jest.fn().mockResolvedValue([draft(), album()]),
    getById: jest.fn().mockResolvedValue(album()),
    eventExists: jest.fn().mockResolvedValue(true),
    createAlbum: jest.fn().mockResolvedValue(draft()),
    updateAlbum: jest.fn().mockResolvedValue(album()),
    deleteAlbum: jest.fn().mockResolvedValue(1),
    addPhotos: jest.fn().mockResolvedValue(1),
    deletePhoto: jest.fn().mockResolvedValue(photo(2)),
    setCover: jest.fn().mockResolvedValue(true),
    claimNotification: jest.fn().mockResolvedValue(true),
  },
  imageStorage: {
    isOwnImageUrl: jest.fn().mockReturnValue(false),
    isConfigured: jest.fn().mockReturnValue(true),
    displayUrl: jest.fn((id) => `display:${id}`),
    thumbnailUrl: jest.fn((id) => `thumb:${id}`),
    downloadUrl: jest.fn((id) => `download:${id}`),
    albumArchiveUrl: jest.fn().mockReturnValue('https://api.cloudinary.com/v1_1/demo/image/generate_archive?signed=1'),
    createAlbumUploadSignature: jest.fn().mockReturnValue({
      cloudName: 'demo',
      apiKey: 'test-placeholder-key',
      timestamp: 1700000000,
      signature: 'abc123',
      folder: 'antpresby/albums/3',
      allowedFormats: 'jpg,jpeg,png,webp,heic',
      maxFileSize: 10485760,
    }),
    verifyAlbumAssets: jest.fn().mockResolvedValue({ verified: [verifiedPhoto(5)], rejected: [] }),
    deleteAlbumPhoto: jest.fn().mockResolvedValue(true),
    deleteAlbumFolder: jest.fn().mockResolvedValue(true),
  },
  notificationService: { notify: jest.fn(), notifyAll: jest.fn().mockResolvedValue({ inApp: 40, push: 12 }) },
  auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
});

const buildApp = (models) => {
  jest.resetModules();
  jest.doMock('../../src/models/photoAlbumModel', () => models.photoAlbumModel);
  jest.doMock('../../src/services/imageStorage', () => models.imageStorage);
  jest.doMock('../../src/services/notificationService', () => models.notificationService);
  jest.doMock('../../src/models/auditLogModel', () => models.auditLogModel);

  const app = express();
  app.use(express.json());
  app.use('/api/albums', require('../../src/routes/albumRoutes'));
  app.use('/api/admin/albums', require('../../src/routes/adminAlbumRoutes'));
  app.use(require('../../src/middleware/errorHandler').errorHandler);
  return app;
};

describe('Albums API (public)', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('lists published albums with a cover thumbnail and paging', async () => {
    const response = await request(app).get('/api/albums');

    expect(response.status).toBe(200);
    expect(models.photoAlbumModel.listPublished).toHaveBeenCalledWith({ offset: 0, limit: 12 });
    expect(response.body.data).toEqual([
      {
        id: 3,
        title: 'Harvest Sunday',
        description: null,
        event_id: 4,
        event_name: 'Harvest',
        cover_url: `thumb:${PID(1)}`,
        photo_count: 2,
        external_url: null,
        created_at: '2026-10-05T10:00:00.000Z',
      },
    ]);
    expect(response.body.meta).toEqual(expect.objectContaining({ total: 1, has_more: false }));
  });

  test('an album shows its photos with display, thumbnail and download links', async () => {
    const response = await request(app).get('/api/albums/3');

    expect(response.status).toBe(200);
    expect(response.body.data.photos[0]).toEqual({
      id: 1,
      url: `display:${PID(1)}`,
      thumb_url: `thumb:${PID(1)}`,
      download_url: `download:${PID(1)}`,
      width: 800,
      height: 600,
      format: 'jpg',
    });
    expect(response.body.data).not.toHaveProperty('is_published');
  });

  test('a draft or unknown album is 404', async () => {
    models.photoAlbumModel.getPublishedById.mockResolvedValue(undefined);

    const response = await request(app).get('/api/albums/3');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Album not found');
  });

  test('an invalid id is 404 without touching the database', async () => {
    const response = await request(app).get('/api/albums/abc');

    expect(response.status).toBe(404);
    expect(models.photoAlbumModel.getPublishedById).not.toHaveBeenCalled();
  });

  test('download returns a zip link for every photo, named after the album', async () => {
    const response = await request(app).get('/api/albums/3/download');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ url: 'https://api.cloudinary.com/v1_1/demo/image/generate_archive?signed=1' });
    expect(models.imageStorage.albumArchiveUrl).toHaveBeenCalledWith(3, [PID(1), PID(2)], 'Harvest Sunday');
  });

  test('downloading an empty album is 404 "No photos yet"', async () => {
    models.photoAlbumModel.getPublishedById.mockResolvedValue(album({ photos: [], photo_count: 0, cover: null }));

    const response = await request(app).get('/api/albums/3/download');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('No photos yet');
    expect(models.imageStorage.albumArchiveUrl).not.toHaveBeenCalled();
  });
});

describe('Albums API (admin)', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('members cannot manage albums', async () => {
    const response = await request(app).post('/api/admin/albums').set('Authorization', as(7, 'member')).send(validBody);

    expect(response.status).toBe(403);
    expect(models.photoAlbumModel.createAlbum).not.toHaveBeenCalled();
  });

  test('lists every album including drafts', async () => {
    const response = await request(app).get('/api/admin/albums').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(models.photoAlbumModel.listAll).toHaveBeenCalled();
    expect(response.body.data[0]).toEqual(expect.objectContaining({ is_published: false, cover_url: null }));
  });

  test('creates an album and audits it', async () => {
    const response = await request(app).post('/api/admin/albums').set('Authorization', admin()).send(validBody);

    expect(response.status).toBe(201);
    expect(models.photoAlbumModel.eventExists).toHaveBeenCalledWith(4);
    expect(models.photoAlbumModel.createAlbum).toHaveBeenCalledWith(validBody, 1);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'album', action: 'create', entityId: 3 })
    );
  });

  test('an unknown event is 400', async () => {
    models.photoAlbumModel.eventExists.mockResolvedValue(false);

    const response = await request(app).post('/api/admin/albums').set('Authorization', admin()).send(validBody);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Event not found');
    expect(models.photoAlbumModel.createAlbum).not.toHaveBeenCalled();
  });

  test.each([
    ['a missing title', { title: '   ' }],
    ['a plain http folder link', { externalUrl: 'http://drive.google.com/drive/folders/abc123' }],
    ['a script link', { externalUrl: 'javascript:alert(1)' }],
    ['a non-boolean published flag', { isPublished: 'yes' }],
  ])('rejects %s with 400', async (_label, overrides) => {
    const response = await request(app)
      .post('/api/admin/albums')
      .set('Authorization', admin())
      .send({ ...validBody, ...overrides });

    expect(response.status).toBe(400);
    expect(models.photoAlbumModel.createAlbum).not.toHaveBeenCalled();
  });

  test('updating a missing album is 404', async () => {
    models.photoAlbumModel.updateAlbum.mockResolvedValue(undefined);

    const response = await request(app).put('/api/admin/albums/99').set('Authorization', admin()).send(validBody);

    expect(response.status).toBe(404);
  });

  test('publishing an album with photos notifies everyone', async () => {
    const response = await request(app).put('/api/admin/albums/3').set('Authorization', admin()).send(validBody);

    expect(response.status).toBe(200);
    expect(models.photoAlbumModel.claimNotification).toHaveBeenCalledWith(3);
    expect(models.notificationService.notifyAll).toHaveBeenCalledWith({
      title: 'New photos: Harvest Sunday',
      message: 'Photos from Harvest are in the gallery.',
      type: 'album',
      entityType: 'album',
      entityId: 3,
    });
    expect(response.body.message).toBe('Album published and everyone notified');
  });

  test('republishing an album that already notified does not notify again', async () => {
    models.photoAlbumModel.claimNotification.mockResolvedValue(false);

    const response = await request(app).put('/api/admin/albums/3').set('Authorization', admin()).send(validBody);

    expect(response.status).toBe(200);
    expect(models.notificationService.notifyAll).not.toHaveBeenCalled();
    expect(response.body.message).toBe('Album updated');
  });

  test('publishing an empty album waits for photos before notifying', async () => {
    models.photoAlbumModel.updateAlbum.mockResolvedValue(album({ photos: [], photo_count: 0, cover: null }));

    await request(app).put('/api/admin/albums/3').set('Authorization', admin()).send(validBody);

    expect(models.photoAlbumModel.claimNotification).not.toHaveBeenCalled();
    expect(models.notificationService.notifyAll).not.toHaveBeenCalled();
  });

  test('the first photos added to a published album notify once', async () => {
    models.photoAlbumModel.claimNotification.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await request(app).post('/api/admin/albums/3/photos').set('Authorization', admin()).send({ publicIds: [PID(5)] });
    await request(app).post('/api/admin/albums/3/photos').set('Authorization', admin()).send({ publicIds: [PID(6)] });

    expect(models.notificationService.notifyAll).toHaveBeenCalledTimes(1);
    expect(models.notificationService.notifyAll).toHaveBeenCalledWith(expect.objectContaining({ type: 'album', entityId: 3 }));
  });

  test('issues an upload signature for the album', async () => {
    const response = await request(app).post('/api/admin/albums/3/upload-signature').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(models.imageStorage.createAlbumUploadSignature).toHaveBeenCalledWith(3);
    expect(response.body.data).toEqual(expect.objectContaining({ folder: 'antpresby/albums/3', signature: 'abc123' }));
  });

  test('without Cloudinary the upload signature is 503', async () => {
    models.imageStorage.isConfigured.mockReturnValue(false);

    const response = await request(app).post('/api/admin/albums/3/upload-signature').set('Authorization', admin());

    expect(response.status).toBe(503);
    expect(response.body.message).toBe('Photo uploads need Cloudinary to be configured');
    expect(models.imageStorage.createAlbumUploadSignature).not.toHaveBeenCalled();
  });

  test('records verified photos once each and reports the rejected ones', async () => {
    models.imageStorage.verifyAlbumAssets.mockResolvedValue({ verified: [verifiedPhoto(5)], rejected: ['antpresby/albums/9/x1'] });

    const response = await request(app)
      .post('/api/admin/albums/3/photos')
      .set('Authorization', admin())
      .send({ publicIds: [PID(5), PID(5), 'antpresby/albums/9/x1'] });

    expect(response.status).toBe(200);
    expect(models.imageStorage.verifyAlbumAssets).toHaveBeenCalledWith(3, [PID(5), 'antpresby/albums/9/x1']);
    expect(models.photoAlbumModel.addPhotos).toHaveBeenCalledWith(3, [verifiedPhoto(5)]);
    expect(response.body.data).toEqual({ added: 1, rejected: ['antpresby/albums/9/x1'] });
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'add_photos', entityId: 3 }));
  });

  test('when no photo can be verified it is 400 and nothing is recorded', async () => {
    models.imageStorage.verifyAlbumAssets.mockResolvedValue({ verified: [], rejected: [PID(5)] });

    const response = await request(app).post('/api/admin/albums/3/photos').set('Authorization', admin()).send({ publicIds: [PID(5)] });

    expect(response.status).toBe(400);
    expect(response.body.data).toEqual({ added: 0, rejected: [PID(5)] });
    expect(models.photoAlbumModel.addPhotos).not.toHaveBeenCalled();
  });

  test('more than 100 photos in one request is 400', async () => {
    const publicIds = Array.from({ length: 101 }, (_, i) => PID(i));

    const response = await request(app).post('/api/admin/albums/3/photos').set('Authorization', admin()).send({ publicIds });

    expect(response.status).toBe(400);
    expect(models.imageStorage.verifyAlbumAssets).not.toHaveBeenCalled();
  });

  test('without Cloudinary recording photos is 503', async () => {
    models.imageStorage.isConfigured.mockReturnValue(false);

    const response = await request(app).post('/api/admin/albums/3/photos').set('Authorization', admin()).send({ publicIds: [PID(5)] });

    expect(response.status).toBe(503);
    expect(models.imageStorage.verifyAlbumAssets).not.toHaveBeenCalled();
  });

  test('a Cloudinary outage while checking photos is 502 and records nothing', async () => {
    models.imageStorage.verifyAlbumAssets.mockRejectedValue(
      Object.assign(new Error('Image storage is unavailable, please try again'), { statusCode: 502 })
    );
    const quiet = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(app).post('/api/admin/albums/3/photos').set('Authorization', admin()).send({ publicIds: [PID(5)] });

    expect(response.status).toBe(502);
    expect(models.photoAlbumModel.addPhotos).not.toHaveBeenCalled();
    quiet.mockRestore();
  });

  test('deleting a photo removes the record, then the Cloudinary image', async () => {
    const response = await request(app).delete('/api/admin/albums/3/photos/2').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(models.photoAlbumModel.deletePhoto).toHaveBeenCalledWith(3, 2);
    expect(models.imageStorage.deleteAlbumPhoto).toHaveBeenCalledWith(PID(2));
    expect(models.photoAlbumModel.deletePhoto.mock.invocationCallOrder[0]).toBeLessThan(
      models.imageStorage.deleteAlbumPhoto.mock.invocationCallOrder[0]
    );
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete_photo', entityId: 3 }));
  });

  test('deleting a photo that is not in the album is 404', async () => {
    models.photoAlbumModel.deletePhoto.mockResolvedValue(undefined);

    const response = await request(app).delete('/api/admin/albums/3/photos/77').set('Authorization', admin());

    expect(response.status).toBe(404);
    expect(models.imageStorage.deleteAlbumPhoto).not.toHaveBeenCalled();
  });

  test('the cover must be a photo of this album', async () => {
    models.photoAlbumModel.setCover.mockResolvedValue(false);

    const response = await request(app).patch('/api/admin/albums/3/cover').set('Authorization', admin()).send({ photoId: 77 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('That photo is not in this album');
  });

  test('sets the cover and audits it', async () => {
    const response = await request(app).patch('/api/admin/albums/3/cover').set('Authorization', admin()).send({ photoId: 2 });

    expect(response.status).toBe(200);
    expect(models.photoAlbumModel.setCover).toHaveBeenCalledWith(3, 2);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'set_cover', entityId: 3, metadata: { photoId: 2 } })
    );
  });

  test('deleting an album cleans up its Cloudinary folder, then deletes it and audits', async () => {
    const response = await request(app).delete('/api/admin/albums/3').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(models.imageStorage.deleteAlbumFolder).toHaveBeenCalledWith(3);
    expect(models.photoAlbumModel.deleteAlbum).toHaveBeenCalledWith(3);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete', entityId: 3 }));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/api/albums.test.js --coverage=false`
Expected: FAIL with `Cannot find module '../../src/routes/albumRoutes'`.

- [ ] **Step 3: Add the validators**

In `backend/src/middleware/validators.js`, insert this directly after the `validateGroupLeaders` definition (after its closing `];` and before `// Devotional create/update...`):

```js

// Photo album create/update. The outside folder link must be https (Google Drive or Photos).
const validateAlbum = [
  body('title')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be 255 characters or fewer'),
  body('description')
    .optional({ values: 'null' })
    .isString()
    .isLength({ max: 5000 })
    .withMessage('Description must be 5000 characters or fewer'),
  body('eventId')
    .optional({ values: 'null' })
    .isInt({ min: 1, max: MAX_DB_ID })
    .withMessage('eventId must be a positive integer or null'),
  body('externalUrl')
    .optional({ values: 'falsy' })
    .isString()
    .isLength({ max: 500 })
    .withMessage('External link must be 500 characters or fewer')
    .bail()
    .isURL({ protocols: ['https'], require_protocol: true, require_valid_protocol: true })
    .withMessage('External link must be an https URL'),
  body('isPublished').optional().isBoolean({ strict: true }).withMessage('isPublished must be true or false'),
];

// Recording uploaded album photos: 1-100 Cloudinary public ids per request.
const validateAlbumPhotos = [
  body('publicIds').isArray({ min: 1, max: 100 }).withMessage('publicIds must list 1 to 100 photos'),
  body('publicIds.*').isString().isLength({ min: 1, max: 255 }).withMessage('Each publicId must be text'),
];

const validateAlbumCover = [
  body('photoId').isInt({ min: 1, max: MAX_DB_ID }).withMessage('photoId must be a positive integer'),
];
```

In `module.exports`, directly after `  validateGroupLeaders,`, add:

```js
  validateAlbum,
  validateAlbumPhotos,
  validateAlbumCover,
```

- [ ] **Step 4: Create the controller**

Create `backend/src/controllers/albumController.js`:

```js
const { apiResponse, parseId, getPagination, buildPaginationMeta } = require('../utils/helpers');
const photoAlbumModel = require('../models/photoAlbumModel');
const auditLogModel = require('../models/auditLogModel');
const imageStorage = require('../services/imageStorage');
const { notifyAll } = require('../services/notificationService');

/**
 * Album Controller - the public photo gallery and admin album management.
 */

const NOT_FOUND = 'Album not found';
const NEEDS_CLOUDINARY = 'Photo uploads need Cloudinary to be configured';
const fail = (res, status, message, data = null) => res.status(status).json(apiResponse(false, data, message));

const coverUrl = (cover) => (cover ? imageStorage.thumbnailUrl(cover.public_id) || cover.url : null);

const presentPhoto = (photo) => ({
  id: photo.id,
  url: imageStorage.displayUrl(photo.public_id) || photo.url,
  thumb_url: imageStorage.thumbnailUrl(photo.public_id) || photo.url,
  download_url: imageStorage.downloadUrl(photo.public_id) || photo.url,
  width: photo.width,
  height: photo.height,
  format: photo.format,
});

const presentSummary = (album) => ({
  id: album.id,
  title: album.title,
  description: album.description,
  event_id: album.event_id,
  event_name: album.event_name,
  cover_url: coverUrl(album.cover),
  photo_count: album.photo_count,
  external_url: album.external_url,
  created_at: album.created_at,
});

const presentAdmin = (album) => ({
  ...presentSummary(album),
  is_published: album.is_published,
  cover_photo_id: album.cover_photo_id,
  notified_at: album.notified_at,
  updated_at: album.updated_at,
});

const withPhotos = (album, present) => ({ ...present(album), photos: album.photos.map(presentPhoto) });

const findPublished = (req) => {
  const id = parseId(req.params.id);
  return id ? photoAlbumModel.getPublishedById(id) : undefined;
};

const findAlbum = (req) => {
  const id = parseId(req.params.id);
  return id ? photoAlbumModel.getById(id) : undefined;
};

// ---- Public ----

const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const { offset, limitNum } = getPagination(page, limit);
    const [albums, total] = await Promise.all([
      photoAlbumModel.listPublished({ offset, limit: limitNum }),
      photoAlbumModel.countPublished(),
    ]);
    res.json(apiResponse(true, albums.map(presentSummary), 'Albums retrieved', buildPaginationMeta(total, page, limit)));
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const album = await findPublished(req);
    if (!album) return fail(res, 404, NOT_FOUND);
    res.json(apiResponse(true, withPhotos(album, presentSummary), 'Album retrieved'));
  } catch (error) {
    next(error);
  }
};

// A zip of the whole album, built by Cloudinary; the link is generated per request and never stored.
const download = async (req, res, next) => {
  try {
    const album = await findPublished(req);
    if (!album) return fail(res, 404, NOT_FOUND);
    if (album.photos.length === 0) return fail(res, 404, 'No photos yet');
    if (!imageStorage.isConfigured()) return fail(res, 503, 'Downloads need Cloudinary to be configured');
    const url = imageStorage.albumArchiveUrl(album.id, album.photos.map((photo) => photo.public_id), album.title);
    res.json(apiResponse(true, { url }, 'Download ready'));
  } catch (error) {
    next(error);
  }
};

// ---- Admin ----

const audit = (req, action, entityId, summary, metadata = {}) =>
  auditLogModel.createAuditLog({ actorUserId: req.user.userId, entityType: 'album', entityId, action, summary, metadata });

const pickInput = (body) => ({
  title: body.title,
  description: body.description,
  eventId: body.eventId,
  externalUrl: body.externalUrl,
  isPublished: body.isPublished,
});

const unknownEvent = async (eventId) => Boolean(eventId) && !(await photoAlbumModel.eventExists(eventId));

// Everyone is told once, the first time the album is both published and has photos.
const notifyIfReady = async (album) => {
  if (!album.is_published || album.photo_count === 0) return false;
  if (!(await photoAlbumModel.claimNotification(album.id))) return false;
  await notifyAll({
    title: `New photos: ${album.title}`,
    message: album.event_name ? `Photos from ${album.event_name} are in the gallery.` : 'New photos are in the gallery.',
    type: 'album',
    entityType: 'album',
    entityId: album.id,
  });
  return true;
};

const adminList = async (req, res, next) => {
  try {
    const albums = await photoAlbumModel.listAll();
    res.json(apiResponse(true, albums.map(presentAdmin), 'Albums retrieved'));
  } catch (error) {
    next(error);
  }
};

const adminGet = async (req, res, next) => {
  try {
    const album = await findAlbum(req);
    if (!album) return fail(res, 404, NOT_FOUND);
    res.json(apiResponse(true, withPhotos(album, presentAdmin), 'Album retrieved'));
  } catch (error) {
    next(error);
  }
};

// A new album has no photos yet, so creating one never notifies.
const adminCreate = async (req, res, next) => {
  try {
    if (await unknownEvent(req.body.eventId)) return fail(res, 400, 'Event not found');
    const album = await photoAlbumModel.createAlbum(pickInput(req.body), req.user.userId);
    await audit(req, 'create', album.id, `Created album "${album.title}"`);
    res.status(201).json(apiResponse(true, withPhotos(album, presentAdmin), 'Album created'));
  } catch (error) {
    next(error);
  }
};

const adminUpdate = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 404, NOT_FOUND);
    if (await unknownEvent(req.body.eventId)) return fail(res, 400, 'Event not found');
    const album = await photoAlbumModel.updateAlbum(id, pickInput(req.body));
    if (!album) return fail(res, 404, NOT_FOUND);

    const notified = await notifyIfReady(album);
    await audit(req, 'update', id, `Updated album "${album.title}"${notified ? ' and notified everyone' : ''}`, {
      isPublished: album.is_published,
    });
    res.json(
      apiResponse(true, withPhotos(album, presentAdmin), notified ? 'Album published and everyone notified' : 'Album updated')
    );
  } catch (error) {
    next(error);
  }
};

const adminDelete = async (req, res, next) => {
  try {
    const album = await findAlbum(req);
    if (!album) return fail(res, 404, NOT_FOUND);
    // Best-effort: a Cloudinary failure is logged and never blocks deleting the album.
    await imageStorage.deleteAlbumFolder(album.id);
    await photoAlbumModel.deleteAlbum(album.id);
    await audit(req, 'delete', album.id, `Deleted album "${album.title}"`, { photoCount: album.photo_count });
    res.json(apiResponse(true, null, 'Album deleted'));
  } catch (error) {
    next(error);
  }
};

const adminUploadSignature = async (req, res, next) => {
  try {
    const album = await findAlbum(req);
    if (!album) return fail(res, 404, NOT_FOUND);
    if (!imageStorage.isConfigured()) return fail(res, 503, NEEDS_CLOUDINARY);
    res.json(apiResponse(true, imageStorage.createAlbumUploadSignature(album.id), 'Upload signature issued'));
  } catch (error) {
    next(error);
  }
};

// Records photos the client uploaded to Cloudinary, after Cloudinary confirms each one.
const adminAddPhotos = async (req, res, next) => {
  try {
    const album = await findAlbum(req);
    if (!album) return fail(res, 404, NOT_FOUND);
    if (!imageStorage.isConfigured()) return fail(res, 503, NEEDS_CLOUDINARY);

    const publicIds = [...new Set(req.body.publicIds)];
    const { verified, rejected } = await imageStorage.verifyAlbumAssets(album.id, publicIds);
    if (verified.length === 0) {
      return fail(res, 400, 'None of the photos could be added', { added: 0, rejected });
    }

    const added = await photoAlbumModel.addPhotos(album.id, verified);
    await audit(req, 'add_photos', album.id, `Added ${added} photo(s) to album "${album.title}"`, {
      added,
      rejected: rejected.length,
    });

    const updated = await photoAlbumModel.getById(album.id);
    const notified = updated ? await notifyIfReady(updated) : false;
    const message = `${added} photo(s) added${notified ? ' and everyone notified' : ''}`;
    res.json(apiResponse(true, { added, rejected }, message));
  } catch (error) {
    next(error);
  }
};

// The record goes first, so a Cloudinary hiccup can never leave a broken photo in the album.
const adminDeletePhoto = async (req, res, next) => {
  try {
    const albumId = parseId(req.params.id);
    const photoId = parseId(req.params.photoId);
    const photo = albumId && photoId ? await photoAlbumModel.deletePhoto(albumId, photoId) : undefined;
    if (!photo) return fail(res, 404, 'Photo not found');

    await imageStorage.deleteAlbumPhoto(photo.public_id);
    await audit(req, 'delete_photo', albumId, `Deleted photo #${photoId}`, { publicId: photo.public_id });
    res.json(apiResponse(true, null, 'Photo deleted'));
  } catch (error) {
    next(error);
  }
};

const adminSetCover = async (req, res, next) => {
  try {
    const album = await findAlbum(req);
    if (!album) return fail(res, 404, NOT_FOUND);
    const photoId = Number(req.body.photoId);
    if (!(await photoAlbumModel.setCover(album.id, photoId))) {
      return fail(res, 400, 'That photo is not in this album');
    }
    await audit(req, 'set_cover', album.id, `Set the cover of album "${album.title}"`, { photoId });
    const updated = await photoAlbumModel.getById(album.id);
    res.json(apiResponse(true, updated ? withPhotos(updated, presentAdmin) : null, 'Cover updated'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  getOne,
  download,
  adminList,
  adminGet,
  adminCreate,
  adminUpdate,
  adminDelete,
  adminUploadSignature,
  adminAddPhotos,
  adminDeletePhoto,
  adminSetCover,
};
```

- [ ] **Step 5: Create the routes and mount them**

Create `backend/src/routes/albumRoutes.js`:

```js
const express = require('express');
const albumController = require('../controllers/albumController');

// Public: anyone with the link can view and download published albums; no sign-in.
const router = express.Router();

router.get('/', albumController.list);
router.get('/:id', albumController.getOne);
router.get('/:id/download', albumController.download);

module.exports = router;
```

Create `backend/src/routes/adminAlbumRoutes.js`:

```js
const express = require('express');
const albumController = require('../controllers/albumController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  handleValidationErrors,
  validateAlbum,
  validateAlbumPhotos,
  validateAlbumCover,
} = require('../middleware/validators');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', albumController.adminList);
router.post('/', validateAlbum, handleValidationErrors, albumController.adminCreate);
router.get('/:id', albumController.adminGet);
router.put('/:id', validateAlbum, handleValidationErrors, albumController.adminUpdate);
router.delete('/:id', albumController.adminDelete);
router.post('/:id/upload-signature', albumController.adminUploadSignature);
router.post('/:id/photos', validateAlbumPhotos, handleValidationErrors, albumController.adminAddPhotos);
router.delete('/:id/photos/:photoId', albumController.adminDeletePhoto);
router.patch('/:id/cover', validateAlbumCover, handleValidationErrors, albumController.adminSetCover);

module.exports = router;
```

In `backend/src/server.js`:
- Directly after `const groupRoutes = require('./routes/groupRoutes');`, add:

```js
const albumRoutes = require('./routes/albumRoutes');
const adminAlbumRoutes = require('./routes/adminAlbumRoutes');
```

- Directly after `app.use('/api/groups', groupRoutes);`, add:

```js
app.use('/api/albums', albumRoutes);
```

- Directly after `app.use('/api/admin/devotionals', adminDevotionalRoutes);`, add:

```js
app.use('/api/admin/albums', adminAlbumRoutes);
```

- [ ] **Step 6: Run the tests, the suite, and lint**

Run: `cd backend && node --check src/server.js && npx jest tests/api/albums.test.js --coverage=false && npx jest --runInBand --coverage=false && npx eslint src/ tests/`
Expected:
- The 31 album API tests pass (6 public, 25 admin).
- The suite reaches **388**.
- Lint is clean.

- [ ] **Step 7: Commit**

```bash
git add backend/src/middleware/validators.js backend/src/controllers/albumController.js backend/src/routes/albumRoutes.js backend/src/routes/adminAlbumRoutes.js backend/src/server.js backend/tests/api/albums.test.js
git commit -m "feat: public photo albums and admin album management API

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Web gallery, album hooks, navigation and notification routing

**Files:**
- Modify: `frontend/src/hooks/useApi.ts`. Add the album types and hooks directly **after the `useRemoveEventImage` hook**.
- Create: `frontend/src/components/gallery/PhotoViewer.tsx`, `frontend/src/app/gallery/page.tsx`, `frontend/src/app/gallery/[id]/page.tsx`
- Modify: `frontend/src/components/layout/Header.tsx`, `frontend/src/components/layout/NotificationBell.tsx`, `frontend/src/app/events/[id]/page.tsx`

**Interfaces:**
- Consumes: the Task 3 endpoints and response shapes, and `album_id` on `GET /api/events/:id` (Task 2).
- Produces (exported from `@/hooks/useApi`, and used by Task 5):
  - Types: `AlbumSummary`, `AlbumPhoto`, `AlbumDetail`, `AdminAlbum`, `AdminAlbumDetail`, `AlbumInput`, `AlbumUploadSignature`, `RecordPhotosResult`
  - Public hooks: `useAlbums(page)` → `{ data: AlbumSummary[]; hasMore }`, `useAlbum(id?)` and `useAlbumDownload()`. The download hook's `mutate(id)` resolves to the zip URL.
  - Admin hooks:
    - `useAdminAlbums()` and `useAdminAlbum(id?)`
    - `useSaveAlbum()` → `{ album, message }`, and `useDeleteAlbum()`
    - `useAlbumUploadSignature(albumId?)` and `useRecordAlbumPhotos(albumId?)`. A 400 that carries `{ added: 0, rejected }` resolves; it does not throw.
    - `useDeleteAlbumPhoto(albumId?)` and `useSetAlbumCover(albumId?)`

- [ ] **Step 1: Add the album types and hooks**

In `frontend/src/hooks/useApi.ts`, insert this directly after the closing `};` of `export const useRemoveEventImage = ...` (and its trailing blank line), before `export const useAdminEvents`:

```ts
export type AlbumSummary = {
  id: number;
  title: string;
  description: string | null;
  event_id: number | null;
  event_name: string | null;
  cover_url: string | null;
  photo_count: number;
  external_url: string | null;
  created_at: string;
};

export type AlbumPhoto = {
  id: number;
  url: string;
  thumb_url: string;
  download_url: string;
  width: number | null;
  height: number | null;
  format: string | null;
};

export type AlbumDetail = AlbumSummary & { photos: AlbumPhoto[] };

export type AdminAlbum = AlbumSummary & {
  is_published: boolean;
  cover_photo_id: number | null;
  notified_at: string | null;
  updated_at: string;
};

export type AdminAlbumDetail = AdminAlbum & { photos: AlbumPhoto[] };

export type AlbumInput = {
  title: string;
  description: string | null;
  eventId: number | null;
  externalUrl: string | null;
  isPublished: boolean;
};

export type AlbumUploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
  maxFileSize: number;
};

export type RecordPhotosResult = { added: number; rejected: string[] };

const invalidateAlbums = (qc: ReturnType<typeof useQueryClient>) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: ['albums'] }),
    qc.invalidateQueries({ queryKey: ['admin', 'albums'] }),
    qc.invalidateQueries({ queryKey: ['event'] }),
  ]);

export const useAlbums = (page = 1) =>
  useQuery({
    queryKey: ['albums', 'list', page],
    queryFn: async (): Promise<{ data: AlbumSummary[]; hasMore: boolean }> => {
      const response = await apiClient.get('/albums', { params: { page, limit: 12 } });
      return { data: response.data?.data ?? [], hasMore: Boolean(response.data?.meta?.has_more) };
    },
  });

export const useAlbum = (id?: number) =>
  useQuery({
    queryKey: ['albums', 'detail', id],
    enabled: Boolean(id),
    retry: false,
    queryFn: async (): Promise<AlbumDetail> => {
      const response = await apiClient.get(`/albums/${id}`);
      return response.data?.data;
    },
  });

export const useAlbumDownload = () =>
  useMutation({
    mutationFn: async (id: number): Promise<string> => {
      const response = await apiClient.get(`/albums/${id}/download`);
      return response.data?.data?.url;
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not prepare the download')),
  });

export const useAdminAlbums = () =>
  useQuery({
    queryKey: ['admin', 'albums'],
    queryFn: async (): Promise<AdminAlbum[]> => {
      const response = await apiClient.get('/admin/albums');
      return response.data?.data ?? [];
    },
  });

export const useAdminAlbum = (id?: number) =>
  useQuery({
    queryKey: ['admin', 'albums', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<AdminAlbumDetail> => {
      const response = await apiClient.get(`/admin/albums/${id}`);
      return response.data?.data;
    },
  });

export const useSaveAlbum = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: AlbumInput }) => {
      const response = id ? await apiClient.put(`/admin/albums/${id}`, input) : await apiClient.post('/admin/albums', input);
      return { album: response.data?.data as AdminAlbumDetail, message: String(response.data?.message || '') };
    },
    onSuccess: ({ message }) => toast.success(message || 'Album saved'),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not save the album')),
    onSettled: () => invalidateAlbums(qc),
  });
};

export const useDeleteAlbum = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/albums/${id}`);
    },
    onSuccess: () => toast.success('Album deleted'),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not delete the album')),
    onSettled: () => invalidateAlbums(qc),
  });
};

export const useAlbumUploadSignature = (albumId?: number) =>
  useMutation({
    mutationFn: async (): Promise<AlbumUploadSignature> => {
      const response = await apiClient.post(`/admin/albums/${albumId}/upload-signature`);
      return response.data?.data;
    },
  });

export const useRecordAlbumPhotos = (albumId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (publicIds: string[]): Promise<RecordPhotosResult> => {
      try {
        const response = await apiClient.post(`/admin/albums/${albumId}/photos`, { publicIds });
        return response.data?.data;
      } catch (error: any) {
        // "None of the photos could be added" still tells us which ones were rejected.
        const data = error?.response?.data?.data;
        if (error?.response?.status === 400 && Array.isArray(data?.rejected)) return data as RecordPhotosResult;
        throw error;
      }
    },
    onSettled: () => invalidateAlbums(qc),
  });
};

export const useDeleteAlbumPhoto = (albumId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photoId: number) => {
      await apiClient.delete(`/admin/albums/${albumId}/photos/${photoId}`);
    },
    onSuccess: () => toast.success('Photo deleted'),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not delete the photo')),
    onSettled: () => invalidateAlbums(qc),
  });
};

export const useSetAlbumCover = (albumId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photoId: number) => {
      await apiClient.patch(`/admin/albums/${albumId}/cover`, { photoId });
    },
    onSuccess: () => toast.success('Cover updated'),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not set the cover')),
    onSettled: () => invalidateAlbums(qc),
  });
};

```

- [ ] **Step 2: Create the photo viewer**

Create `frontend/src/components/gallery/PhotoViewer.tsx`:

```tsx
'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import type { AlbumPhoto } from '@/hooks/useApi';

type PhotoViewerProps = {
  photos: AlbumPhoto[];
  index: number;
  title: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

// Full-size viewer: arrow keys move between photos, Escape closes.
export default function PhotoViewer({ photos, index, title, onIndexChange, onClose }: PhotoViewerProps) {
  const count = photos.length;
  const photo = photos[index];

  const go = React.useCallback((step: number) => onIndexChange((index + step + count) % count), [index, count, onIndexChange]);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
      else if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [go, onClose]);

  if (!photo) return null;

  const stop = (event: React.MouseEvent) => event.stopPropagation();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title}, photo ${index + 1} of ${count}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 p-4" onClick={stop}>
        <p className="text-sm text-white/80">
          {index + 1} / {count}
        </p>
        <div className="flex items-center gap-2">
          <a
            href={photo.download_url}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg bg-white/10 p-2 hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
        {count > 1 && (
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(event) => {
              stop(event);
              go(-1);
            }}
            className="absolute left-2 rounded-full bg-white/10 p-3 hover:bg-white/20 sm:left-4"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={`${title}, photo ${index + 1}`} className="max-h-full max-w-full object-contain" onClick={stop} />
        {count > 1 && (
          <button
            type="button"
            aria-label="Next photo"
            onClick={(event) => {
              stop(event);
              go(1);
            }}
            className="absolute right-2 rounded-full bg-white/10 p-3 hover:bg-white/20 sm:right-4"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create the gallery pages**

Create `frontend/src/app/gallery/page.tsx`:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAlbums } from '@/hooks/useApi';

export default function GalleryPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError } = useAlbums(page);
  const albums = data?.data ?? [];

  return (
    <div className="container-max space-y-8 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Photo Gallery</h1>
        <p className="mt-2 text-sm text-ui-subtle">Photos from our services and events. View them here or download them to keep.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-ui-subtle">Loading albums...</p>
      ) : isError ? (
        <p className="text-sm text-ui-subtle">Could not load the gallery. Please try again.</p>
      ) : albums.length === 0 ? (
        <p className="text-sm text-ui-subtle">No albums yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/gallery/${album.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
            >
              {album.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={album.cover_url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              ) : (
                <div className="aspect-square w-full bg-gradient-to-br from-sky-600 via-cyan-500 to-amber-400" />
              )}
              <div className="space-y-1 p-4">
                <p className="truncate font-semibold group-hover:text-sky-700 dark:group-hover:text-cyan-300">{album.title}</p>
                <p className="text-xs text-ui-subtle">
                  {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
                  {album.event_name ? ` · ${album.event_name}` : ''} · {new Date(album.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {(page > 1 || data?.hasMore) && (
        <div className="flex gap-3">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Newer
          </Button>
          <Button variant="outline" disabled={!data?.hasMore} onClick={() => setPage((p) => p + 1)}>
            Older
          </Button>
        </div>
      )}
    </div>
  );
}
```

Create `frontend/src/app/gallery/[id]/page.tsx`:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, ExternalLink, Share2 } from 'lucide-react';
import PhotoViewer from '@/components/gallery/PhotoViewer';
import { Button } from '@/components/ui/button';
import { useAlbum, useAlbumDownload } from '@/hooks/useApi';

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id) || undefined;
  const { data: album, isLoading } = useAlbum(id);
  const download = useAlbumDownload();
  const [viewing, setViewing] = React.useState<number | null>(null);
  const closeViewer = React.useCallback(() => setViewing(null), []);

  const downloadAll = () => {
    if (!id) return;
    download.mutate(id, {
      onSuccess: (url) => {
        if (url) window.location.href = url;
      },
    });
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <div className="container-max space-y-8 py-10">
      <Link
        href="/gallery"
        className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-800 dark:text-cyan-300 dark:hover:text-cyan-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to the gallery
      </Link>

      {isLoading ? (
        <p className="text-sm text-ui-subtle">Loading album...</p>
      ) : !album ? (
        <p className="text-sm text-ui-subtle">Album not found.</p>
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{album.title}</h1>
              {album.description && <p className="max-w-2xl text-sm text-ui-muted">{album.description}</p>}
              <p className="text-xs text-ui-subtle">
                {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
                {album.event_id && album.event_name ? (
                  <>
                    {' · '}
                    <Link href={`/events/${album.event_id}`} className="text-sky-700 hover:underline dark:text-cyan-300">
                      {album.event_name}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadAll} disabled={download.isPending || album.photos.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                {download.isPending ? 'Preparing...' : 'Download all'}
              </Button>
              {album.external_url && (
                <Button asChild variant="outline">
                  <a href={album.external_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open folder
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={share}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          {album.photos.length === 0 ? (
            <p className="text-sm text-ui-subtle">No photos yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {album.photos.map((photo, index) => (
                <div key={photo.id} className="group relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                  <button type="button" onClick={() => setViewing(index)} className="block w-full" aria-label={`Open photo ${index + 1}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.thumb_url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                  </button>
                  <a
                    href={photo.download_url}
                    aria-label={`Download photo ${index + 1}`}
                    className="absolute bottom-2 right-2 rounded-full bg-black/60 p-2 text-white opacity-90 hover:bg-black/80 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {viewing !== null && (
            <PhotoViewer photos={album.photos} index={viewing} title={album.title} onIndexChange={setViewing} onClose={closeViewer} />
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Navigation, notification routing and the event page link**

In `frontend/src/components/layout/Header.tsx`:
- In the `lucide-react` import list, add `  Camera,` on its own line directly after `  Calendar,`.
- In `navLinks`, add this line directly after `  { href: '/events', label: 'Events', icon: Calendar },`:

```tsx
  { href: '/gallery', label: 'Gallery', icon: Camera },
```

In `frontend/src/components/layout/NotificationBell.tsx`, in `openEntity`, add this directly after the `news` branch (after its closing `}`):

```tsx
    if (notification.entity_type === 'album' && notification.entity_id) {
      router.push(`/gallery/${notification.entity_id}`);
      return;
    }
```

In `frontend/src/app/events/[id]/page.tsx`, the registration-count paragraph ends with:

```tsx
                    : `${registeredCount} registered`}
                </p>
              </div>
```

Change it to:

```tsx
                    : `${registeredCount} registered`}
                </p>
                {data.album_id ? (
                  <Link
                    href={`/gallery/${data.album_id}`}
                    className="font-semibold text-sky-700 hover:text-sky-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                  >
                    View photos from this event
                  </Link>
                ) : null}
              </div>
```

(`Link` is already imported there.)

- [ ] **Step 5: Type-check, lint and build**

Run: `cd frontend && npm run -s type-check && npm run -s lint && npm run -s build`
Expected:
- No type or lint errors, and the build lists `/gallery` and `/gallery/[id]`.
- If lint reports the `eslint-disable` comments as unused, remove them and record a ruling.
- If `next build` rewrites `frontend/next-env.d.ts`, restore it with `git checkout -- frontend/next-env.d.ts`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/hooks/useApi.ts frontend/src/components/gallery/PhotoViewer.tsx frontend/src/app/gallery frontend/src/components/layout/Header.tsx frontend/src/components/layout/NotificationBell.tsx "frontend/src/app/events/[id]/page.tsx"
git commit -m "feat(web): photo gallery with viewer and downloads, and album links

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Web admin gallery

**Files:**
- Create: `frontend/src/lib/albumUpload.ts`, `frontend/src/app/admin/gallery/page.tsx`, `frontend/src/app/admin/gallery/[id]/page.tsx`
- Modify: `frontend/src/components/layout/AdminSidebar.tsx`

**Interfaces:**
- Consumes: the Task 4 admin hooks and types, `useAdminEvents()` (existing), and `ConfirmDialog` (existing).
- Produces:
  - `MAX_ALBUM_PHOTO_BYTES`
  - `uploadToCloudinary(file: File, signature: AlbumUploadSignature) → Promise<string>`, which resolves to the public id
  - `mapWithConcurrency(items, limit, worker) → Promise<PromiseSettledResult<R>[]>`
  - `chunk(items, size)`

**Decision recorded here:** lucide-react 0.294 (installed) has no `Images` icon, so the sidebar uses `ImageIcon` (lucide's alias for `Image`, which avoids clashing with `next/image`).

- [ ] **Step 1: Create the direct-upload helper**

Create `frontend/src/lib/albumUpload.ts`:

```ts
import type { AlbumUploadSignature } from '@/hooks/useApi';

export const MAX_ALBUM_PHOTO_BYTES = 10 * 1024 * 1024;

// Uploads one photo straight to Cloudinary with the server-issued signature and returns its public id.
// Plain fetch on purpose: apiClient would attach our auth token, which must never go to Cloudinary.
export const uploadToCloudinary = async (file: File, signature: AlbumUploadSignature): Promise<string> => {
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('signature', signature.signature);
  form.append('folder', signature.folder);
  form.append('allowed_formats', signature.allowedFormats);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body?.public_id !== 'string') {
    throw new Error(body?.error?.message || 'Upload failed');
  }
  return body.public_id;
};

// Runs worker over items with at most `limit` in flight; never rejects.
export const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<PromiseSettledResult<R>[]> => {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const run = async () => {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = { status: 'fulfilled', value: await worker(items[index], index) };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
};

export const chunk = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};
```

- [ ] **Step 2: Create the album list page**

Create `frontend/src/app/admin/gallery/page.tsx`:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdminAlbums, useAdminEvents, useSaveAlbum } from '@/hooks/useApi';

type FormState = { title: string; description: string; eventId: string; externalUrl: string };
const EMPTY: FormState = { title: '', description: '', eventId: '', externalUrl: '' };

export default function AdminGalleryPage() {
  const router = useRouter();
  const { data: albums, isLoading } = useAdminAlbums();
  const { data: events } = useAdminEvents();
  const save = useSaveAlbum();
  const [form, setForm] = React.useState<FormState>(EMPTY);

  const set = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const onCreate = (event: React.FormEvent) => {
    event.preventDefault();
    save.mutate(
      {
        input: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          eventId: form.eventId ? Number(form.eventId) : null,
          externalUrl: form.externalUrl.trim() || null,
          isPublished: false,
        },
      },
      {
        onSuccess: ({ album }) => {
          setForm(EMPTY);
          if (album?.id) router.push(`/admin/gallery/${album.id}`);
        },
      }
    );
  };

  return (
    <div className="container-max space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Photo Gallery</h1>
        <p className="mt-2 text-sm text-ui-subtle">
          Create an album as a draft, add photos, then publish it. Everyone is notified once, when a published album first has photos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New album</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onCreate}>
            <div className="space-y-2">
              <Label htmlFor="album-title">Title</Label>
              <Input id="album-title" value={form.title} onChange={set('title')} required maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="album-event">Event (optional)</Label>
              <select
                id="album-event"
                value={form.eventId}
                onChange={set('eventId')}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">No event</option>
                {(events || []).map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="album-description">Description (optional)</Label>
              <Textarea id="album-description" rows={3} value={form.description} onChange={set('description')} maxLength={5000} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="album-link">Outside folder link (optional, https)</Label>
              <Input
                id="album-link"
                type="url"
                value={form.externalUrl}
                onChange={set('externalUrl')}
                maxLength={500}
                placeholder="https://drive.google.com/..."
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={save.isPending}>
                Create draft album
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-ui-subtle">Loading albums...</p>
      ) : !albums || albums.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-ui-subtle">No albums yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {albums.map((album) => (
            <Card key={album.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {album.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={album.cover_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-slate-200 dark:bg-slate-800" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{album.title}</p>
                  <p className="text-xs text-ui-subtle">
                    {album.is_published ? 'Published' : 'Draft'} · {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
                    {album.event_name ? ` · ${album.event_name}` : ''}
                    {album.notified_at ? ' · everyone notified' : ''}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/gallery/${album.id}`}>Manage</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create the album management page**

Create `frontend/src/app/admin/gallery/[id]/page.tsx`:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Star, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useAdminAlbum,
  useAdminEvents,
  useAlbumUploadSignature,
  useDeleteAlbum,
  useDeleteAlbumPhoto,
  useRecordAlbumPhotos,
  useSaveAlbum,
  useSetAlbumCover,
  type AlbumPhoto,
} from '@/hooks/useApi';
import { MAX_ALBUM_PHOTO_BYTES, chunk, mapWithConcurrency, uploadToCloudinary } from '@/lib/albumUpload';

type FormState = { title: string; description: string; eventId: string; externalUrl: string; isPublished: boolean };

export default function AdminAlbumPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params?.id) || undefined;
  const { data: album, isLoading } = useAdminAlbum(id);
  const { data: events } = useAdminEvents();
  const save = useSaveAlbum();
  const removeAlbum = useDeleteAlbum();
  const getSignature = useAlbumUploadSignature(id);
  const recordPhotos = useRecordAlbumPhotos(id);
  const removePhoto = useDeleteAlbumPhoto(id);
  const setCover = useSetAlbumCover(id);

  const [form, setForm] = React.useState<FormState | null>(null);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [retryFiles, setRetryFiles] = React.useState<File[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [pendingPhoto, setPendingPhoto] = React.useState<AlbumPhoto | null>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!album) return;
    setForm({
      title: album.title,
      description: album.description || '',
      eventId: album.event_id ? String(album.event_id) : '',
      externalUrl: album.external_url || '',
      isPublished: album.is_published,
    });
    // Only when a different album loads, so typing is not overwritten by refetches.
  }, [album?.id]);

  const set = (field: 'title' | 'description' | 'eventId' | 'externalUrl') =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((current) => (current ? { ...current, [field]: event.target.value } : current));

  const onSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form || !id) return;
    save.mutate({
      id,
      input: {
        title: form.title.trim(),
        description: form.description.trim() || null,
        eventId: form.eventId ? Number(form.eventId) : null,
        externalUrl: form.externalUrl.trim() || null,
        isPublished: form.isPublished,
      },
    });
  };

  // Uploads straight to Cloudinary, 4 at a time, then records the uploaded ids (100 per request).
  const uploadFiles = async (files: File[]) => {
    if (files.length === 0 || progress) return;
    const tooBig = files.filter((file) => file.size > MAX_ALBUM_PHOTO_BYTES);
    const ready = files.filter((file) => file.size <= MAX_ALBUM_PHOTO_BYTES);
    if (tooBig.length > 0) toast.error(`${tooBig.length} photo(s) are over 10 MB and were skipped`);
    if (ready.length === 0) return;

    setRetryFiles([]);
    setProgress({ done: 0, total: ready.length });
    try {
      const signature = await getSignature.mutateAsync();
      const results = await mapWithConcurrency(ready, 4, async (file) => {
        try {
          return await uploadToCloudinary(file, signature);
        } finally {
          setProgress((current) => (current ? { ...current, done: current.done + 1 } : current));
        }
      });

      const fileById = new Map<string, File>();
      const failed: File[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') fileById.set(result.value, ready[index]);
        else failed.push(ready[index]);
      });

      let added = 0;
      for (const ids of chunk([...fileById.keys()], 100)) {
        try {
          const result = await recordPhotos.mutateAsync(ids);
          added += result.added;
          result.rejected.forEach((publicId) => {
            const file = fileById.get(publicId);
            if (file) failed.push(file);
          });
        } catch {
          ids.forEach((publicId) => failed.push(fileById.get(publicId) as File));
        }
      }

      setRetryFiles(failed);
      const message = `${added} of ${ready.length} uploaded`;
      if (failed.length > 0) toast.error(`${message}. You can retry the failed photos.`);
      else toast.success(message);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not start the upload');
    } finally {
      setProgress(null);
    }
  };

  if (isLoading || (album && !form)) {
    return <div className="container-max py-12 text-sm text-ui-subtle">Loading album...</div>;
  }
  if (!album || !form || !id) {
    return <div className="container-max py-12 text-sm text-ui-subtle">Album not found.</div>;
  }

  return (
    <div className="container-max space-y-6 py-12">
      <Link href="/admin/gallery" className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-cyan-300">
        <ArrowLeft className="h-4 w-4" />
        All albums
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Album details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSave}>
            <div className="space-y-2">
              <Label htmlFor="album-title">Title</Label>
              <Input id="album-title" value={form.title} onChange={set('title')} required maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="album-event">Event (optional)</Label>
              <select
                id="album-event"
                value={form.eventId}
                onChange={set('eventId')}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">No event</option>
                {(events || []).map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="album-description">Description (optional)</Label>
              <Textarea id="album-description" rows={3} value={form.description} onChange={set('description')} maxLength={5000} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="album-link">Outside folder link (optional, https)</Label>
              <Input id="album-link" type="url" value={form.externalUrl} onChange={set('externalUrl')} maxLength={500} />
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => setForm((current) => (current ? { ...current, isPublished: event.target.checked } : current))}
              />
              Published (anyone with the link can see it)
            </label>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button type="submit" disabled={save.isPending}>
                Save
              </Button>
              {album.is_published && (
                <Button asChild variant="outline">
                  <Link href={`/gallery/${album.id}`}>View public page</Link>
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setConfirmDelete(true)}>
                Delete album
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Photos ({album.photo_count})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              uploadFiles(Array.from(event.dataTransfer.files));
            }}
            className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center text-sm ${
              dragging ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30' : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            <Upload className="h-6 w-6 text-ui-subtle" />
            <p>{progress ? `Uploading ${progress.done} of ${progress.total}...` : 'Drop photos here, or choose them (JPEG, PNG, WebP or HEIC, up to 10 MB each).'}</p>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic,.heic"
              className="hidden"
              onChange={(event) => {
                uploadFiles(Array.from(event.target.files || []));
                event.target.value = '';
              }}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={Boolean(progress)} onClick={() => fileInput.current?.click()}>
                Choose photos
              </Button>
              {retryFiles.length > 0 && !progress && (
                <Button type="button" onClick={() => uploadFiles(retryFiles)}>
                  Retry {retryFiles.length} failed
                </Button>
              )}
            </div>
          </div>

          {album.photos.length === 0 ? (
            <p className="text-sm text-ui-subtle">No photos yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {album.photos.map((photo) => {
                const isCover = album.cover_photo_id ? album.cover_photo_id === photo.id : album.photos[0]?.id === photo.id;
                return (
                  <div key={photo.id} className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.thumb_url} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={isCover ? 'default' : 'outline'}
                        disabled={isCover || setCover.isPending}
                        onClick={() => setCover.mutate(photo.id)}
                        aria-label="Set as cover"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setPendingPhoto(photo)} aria-label="Delete photo">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${album.title}"?`}
          description="All of its photos are deleted too. This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            removeAlbum.mutate(album.id, { onSuccess: () => router.push('/admin/gallery') });
          }}
        />
      )}

      {pendingPhoto && (
        <ConfirmDialog
          title="Delete this photo?"
          description="This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setPendingPhoto(null)}
          onConfirm={() => {
            removePhoto.mutate(pendingPhoto.id);
            setPendingPhoto(null);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add the sidebar link**

In `frontend/src/components/layout/AdminSidebar.tsx`:
- Add this import on a new line directly after the existing `lucide-react` import line (leave that line unchanged):

```tsx
import { ImageIcon } from 'lucide-react';
```

- In `navItems`, add this directly after `  { href: '/admin/events', label: 'Events', icon: Calendar },`:

```tsx
  { href: '/admin/gallery', label: 'Gallery', icon: ImageIcon },
```

- [ ] **Step 5: Type-check, lint and build**

Run: `cd frontend && npm run -s type-check && npm run -s lint && npm run -s build`
Expected:
- No errors, and the build lists `/admin/gallery` and `/admin/gallery/[id]`.
- The web lint config has no `react-hooks` plugin, so the effect has no disable comment. If lint reports an `@next/next/no-img-element` disable comment as unused, remove it and record a ruling.
- Restore `frontend/next-env.d.ts` if the build rewrote it.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/albumUpload.ts frontend/src/app/admin/gallery frontend/src/components/layout/AdminSidebar.tsx
git commit -m "feat(web): admin gallery with direct Cloudinary uploads, covers and publishing

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Mobile gallery, Save to Photos, album hooks and push routing

**Files:**
- Modify: `mobile/package.json`, `mobile/package-lock.json` and `mobile/app.json` (through `npx expo install`)
- Modify: `mobile/src/hooks/use-api.ts`. Add the album types and hooks directly **before `export const useDeleteAdminEvent`**.
- Create: `mobile/src/lib/save-photo.ts`, `mobile/src/app/gallery/index.tsx`, `mobile/src/app/gallery/[id].tsx`
- Modify: `mobile/src/lib/push.ts`, `mobile/src/app/(tabs)/account.tsx`, `mobile/src/app/events/[id].tsx`

**Interfaces:**
- Consumes: the Task 3 endpoints, and `album_id` on `GET /api/events/:id`.
- Produces (exported from `@/hooks/use-api`, and used by Task 7):
  - Types: `AlbumSummary`, `AlbumPhoto`, `AlbumDetail`, `AdminAlbum`, `AdminAlbumDetail`, `AlbumInput`, `AlbumUploadSignature`, `RecordPhotosResult`
  - Public hooks: `useAlbums()`, `useAlbum(id?)` and `useAlbumDownloadUrl()`. The download hook's `mutateAsync(id)` resolves to the zip URL.
  - Admin hooks:
    - `useAdminAlbums(enabled?)` and `useAdminAlbum(id?, enabled?)`
    - `useSaveAlbum()` → `{ album, message }`, and `useDeleteAlbum()`
    - `useAlbumUploadSignature(albumId?)` and `useRecordAlbumPhotos(albumId?)`. A 400 that carries `rejected` resolves; it does not throw.
    - `useDeleteAlbumPhoto(albumId?)` and `useSetAlbumCover(albumId?)`
  - `savePhotoToLibrary(albumId, photo) → Promise<'saved' | 'denied'>`
  - Routes `/gallery` and `/gallery/[id]`; push `album` → `/gallery/<id>`.

- [ ] **Step 1: Install the packages and add the permission strings**

Run: `cd mobile && npx expo install expo-media-library expo-file-system`
Expected: both are added to `dependencies` at SDK 55 versions (`expo-media-library ~55.0.x`, `expo-file-system ~55.0.x`), and `package-lock.json` updates.

`npx expo install` may add bare `"expo-media-library"` or `"expo-file-system"` strings to `plugins` in `mobile/app.json`. If it does, remove them. Then add this entry directly after the `expo-image-picker` entry (after its closing `],`), and leave the `expo-image-picker` entry exactly as it is, with camera and microphone still `false`:

```json
      [
        "expo-media-library",
        {
          "photosPermission": "Allow ANT PRESS to choose photos for events and albums.",
          "savePhotosPermission": "Allow ANT PRESS to save church photos to your photo library.",
          "isAccessMediaLocationEnabled": false,
          "granularPermissions": ["photo"]
        }
      ],
```

`photosPermission` repeats the image picker's text on purpose: both plugins write the iOS `NSPhotoLibraryUsageDescription`, so the two must match.

Check the installed plugin's option names: `grep -rn "savePhotosPermission\|granularPermissions" mobile/node_modules/expo-media-library/plugin/build/*.js`. If `granularPermissions` isn't supported, drop that line and record a ruling.

- [ ] **Step 2: Add the album types and hooks**

In `mobile/src/hooks/use-api.ts`, insert this directly before `export const useDeleteAdminEvent = () =>`:

```ts
export type AlbumSummary = {
  id: number;
  title: string;
  description: string | null;
  event_id: number | null;
  event_name: string | null;
  cover_url: string | null;
  photo_count: number;
  external_url: string | null;
  created_at: string;
};

export type AlbumPhoto = {
  id: number;
  url: string;
  thumb_url: string;
  download_url: string;
  width: number | null;
  height: number | null;
  format: string | null;
};

export type AlbumDetail = AlbumSummary & { photos: AlbumPhoto[] };

export type AdminAlbum = AlbumSummary & {
  is_published: boolean;
  cover_photo_id: number | null;
  notified_at: string | null;
  updated_at: string;
};

export type AdminAlbumDetail = AdminAlbum & { photos: AlbumPhoto[] };

export type AlbumInput = {
  title: string;
  description: string | null;
  eventId: number | null;
  externalUrl: string | null;
  isPublished: boolean;
};

export type AlbumUploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
  maxFileSize: number;
};

export type RecordPhotosResult = { added: number; rejected: string[] };

const invalidateAlbums = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ['albums'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'albums'] }),
  ]);

export const useAlbums = () =>
  useQuery({
    queryKey: ['albums', 'list'],
    queryFn: async (): Promise<AlbumSummary[]> => {
      const response = await apiClient.get('/albums', { params: { limit: 50 } });
      return response.data?.data || [];
    },
  });

export const useAlbum = (id?: number) =>
  useQuery({
    queryKey: ['albums', 'detail', id],
    enabled: Boolean(id),
    retry: false,
    queryFn: async (): Promise<AlbumDetail> => {
      const response = await apiClient.get(`/albums/${id}`);
      return response.data?.data;
    },
  });

export const useAlbumDownloadUrl = () =>
  useMutation({
    mutationFn: async (id: number): Promise<string> => {
      const response = await apiClient.get(`/albums/${id}/download`);
      return response.data?.data?.url;
    },
  });

export const useAdminAlbums = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'albums'],
    enabled,
    queryFn: async (): Promise<AdminAlbum[]> => {
      const response = await apiClient.get('/admin/albums');
      return response.data?.data || [];
    },
  });

export const useAdminAlbum = (id?: number, enabled = true) =>
  useQuery({
    queryKey: ['admin', 'albums', id],
    enabled: enabled && Boolean(id),
    queryFn: async (): Promise<AdminAlbumDetail> => {
      const response = await apiClient.get(`/admin/albums/${id}`);
      return response.data?.data;
    },
  });

export const useSaveAlbum = () =>
  useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: AlbumInput }) => {
      const response = id ? await apiClient.put(`/admin/albums/${id}`, input) : await apiClient.post('/admin/albums', input);
      return { album: response.data?.data as AdminAlbumDetail, message: String(response.data?.message || '') };
    },
    onSettled: invalidateAlbums,
  });

export const useDeleteAlbum = () =>
  useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/albums/${id}`);
    },
    onSettled: invalidateAlbums,
  });

export const useAlbumUploadSignature = (albumId?: number) =>
  useMutation({
    mutationFn: async (): Promise<AlbumUploadSignature> => {
      const response = await apiClient.post(`/admin/albums/${albumId}/upload-signature`);
      return response.data?.data;
    },
  });

export const useRecordAlbumPhotos = (albumId?: number) =>
  useMutation({
    mutationFn: async (publicIds: string[]): Promise<RecordPhotosResult> => {
      try {
        const response = await apiClient.post(`/admin/albums/${albumId}/photos`, { publicIds });
        return response.data?.data;
      } catch (error: any) {
        // "None of the photos could be added" still tells us which ones were rejected.
        const data = error?.response?.data?.data;
        if (error?.response?.status === 400 && Array.isArray(data?.rejected)) return data as RecordPhotosResult;
        throw error;
      }
    },
    onSettled: invalidateAlbums,
  });

export const useDeleteAlbumPhoto = (albumId?: number) =>
  useMutation({
    mutationFn: async (photoId: number) => {
      await apiClient.delete(`/admin/albums/${albumId}/photos/${photoId}`);
    },
    onSettled: invalidateAlbums,
  });

export const useSetAlbumCover = (albumId?: number) =>
  useMutation({
    mutationFn: async (photoId: number) => {
      await apiClient.patch(`/admin/albums/${albumId}/cover`, { photoId });
    },
    onSettled: invalidateAlbums,
  });

```

- [ ] **Step 3: Save to Photos**

Create `mobile/src/lib/save-photo.ts`:

```ts
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

import type { AlbumPhoto } from '@/hooks/use-api';

// Downloads the original photo to the cache, then saves it to the phone's photo library.
export const savePhotoToLibrary = async (albumId: number, photo: AlbumPhoto): Promise<'saved' | 'denied'> => {
  const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
  if (!permission.granted) return 'denied';

  const extension = (photo.format || 'jpg').toLowerCase();
  const target = new File(Paths.cache, `album-${albumId}-photo-${photo.id}.${extension}`);
  const downloaded = await File.downloadFileAsync(photo.download_url, target, { idempotent: true });
  try {
    await MediaLibrary.saveToLibraryAsync(downloaded.uri);
  } finally {
    try {
      downloaded.delete();
    } catch {
      // The cache is cleared by the system anyway.
    }
  }
  return 'saved';
};
```

The API was checked against `expo-file-system` 55.0.11: `new File(Paths.cache, name)` and `File.downloadFileAsync(url, destination, { idempotent })`. If the installed `expo-media-library` types give `requestPermissionsAsync` a different signature, use what they require (write-only access to photos) and record a ruling.

- [ ] **Step 4: Create the gallery screens**

Create `mobile/src/app/gallery/index.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { BrandButton, BrandCard, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAlbums } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';

export default function GalleryScreen() {
  const theme = useTheme();
  const albumsQuery = useAlbums();
  const albums = albumsQuery.data ?? [];

  return (
    <BrandScreen>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: theme.tint, textTransform: 'uppercase', letterSpacing: 1 }}>
            Photo Gallery
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Photos from our services and events
          </ThemedText>
        </View>
      </View>

      {albumsQuery.isLoading ? (
        <ActivityIndicator color={theme.tint} />
      ) : albumsQuery.isError ? (
        <BrandCard>
          <ThemedText type="small">Could not load the gallery.</ThemedText>
          <BrandButton label="Try again" onPress={() => albumsQuery.refetch()} />
        </BrandCard>
      ) : albums.length === 0 ? (
        <BrandCard>
          <ThemedText type="small" themeColor="textSecondary">
            No albums yet.
          </ThemedText>
        </BrandCard>
      ) : (
        albums.map((album) => (
          <Pressable key={album.id} onPress={() => router.push(`/gallery/${album.id}` as never)}>
            <BrandCard>
              {album.cover_url ? (
                <Image source={{ uri: album.cover_url }} style={styles.cover} contentFit="cover" />
              ) : (
                <View style={[styles.cover, { backgroundColor: theme.backgroundSelected }]} />
              )}
              <ThemedText type="defaultSemiBold" numberOfLines={1}>
                {album.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
                {album.event_name ? ` · ${album.event_name}` : ''} · {new Date(album.created_at).toLocaleDateString()}
              </ThemedText>
            </BrandCard>
          </Pressable>
        ))
      )}
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cover: { width: '100%', height: 180, borderRadius: Radius.medium },
});
```

Create `mobile/src/app/gallery/[id].tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandButton, BrandCard, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getApiErrorMessage, useAlbum, useAlbumDownloadUrl } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { savePhotoToLibrary } from '@/lib/save-photo';

export default function AlbumScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id) || undefined;
  const albumQuery = useAlbum(id);
  const downloadUrl = useAlbumDownloadUrl();
  const [viewing, setViewing] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);
  const album = albumQuery.data;
  const photos = album?.photos ?? [];
  const current = viewing !== null ? photos[viewing] : undefined;

  const openInBrowser = async (url?: string | null) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open the link', 'Please try again.');
    }
  };

  const downloadAll = async () => {
    if (!id || downloadUrl.isPending) return;
    try {
      await openInBrowser(await downloadUrl.mutateAsync(id));
    } catch (error) {
      Alert.alert('Could not prepare the download', getApiErrorMessage(error, 'Please try again.'));
    }
  };

  const saveCurrent = async () => {
    if (!current || !album || saving) return;
    setSaving(true);
    try {
      const result = await savePhotoToLibrary(album.id, current);
      if (result === 'denied') {
        Alert.alert('Photo access needed', 'Allow ANT PRESS to add photos in your phone settings, then try again.');
      } else {
        Alert.alert('Saved', 'The photo is in your photo library.');
      }
    } catch {
      Alert.alert('Could not save the photo', 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const step = (by: number) => setViewing((index) => (index === null ? index : (index + by + photos.length) % photos.length));

  return (
    <BrandScreen>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: theme.tint, textTransform: 'uppercase', letterSpacing: 1 }}>
            Photo Gallery
          </ThemedText>
        </View>
      </View>

      {albumQuery.isLoading ? (
        <ActivityIndicator color={theme.tint} />
      ) : !album ? (
        <BrandCard>
          <ThemedText type="small">Album not found.</ThemedText>
        </BrandCard>
      ) : (
        <>
          <ThemedText type="subtitle">{album.title}</ThemedText>
          {album.description ? <ThemedText themeColor="textSecondary">{album.description}</ThemedText> : null}
          <ThemedText type="small" themeColor="textSecondary">
            {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
            {album.event_name ? ` · ${album.event_name}` : ''}
          </ThemedText>
          <View style={styles.actions}>
            {photos.length > 0 ? (
              <BrandButton label={downloadUrl.isPending ? 'Preparing...' : 'Download All'} onPress={downloadAll} />
            ) : null}
            {album.external_url ? <BrandButton label="Open Folder" variant="outline" onPress={() => openInBrowser(album.external_url)} /> : null}
          </View>

          {photos.length === 0 ? (
            <BrandCard>
              <ThemedText type="small" themeColor="textSecondary">
                No photos yet.
              </ThemedText>
            </BrandCard>
          ) : (
            <View style={styles.grid}>
              {photos.map((photo, index) => (
                <Pressable key={photo.id} onPress={() => setViewing(index)} style={styles.cell}>
                  <Image source={{ uri: photo.thumb_url }} style={styles.thumb} contentFit="cover" />
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}

      <Modal visible={Boolean(current)} animationType="fade" onRequestClose={() => setViewing(null)}>
        <SafeAreaView style={styles.viewer}>
          <View style={styles.viewerBar}>
            <ThemedText style={styles.viewerText}>
              {viewing !== null ? `${viewing + 1} / ${photos.length}` : ''}
            </ThemedText>
            <Pressable onPress={() => setViewing(null)} hitSlop={12}>
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </Pressable>
          </View>
          {current ? <Image source={{ uri: current.url }} style={styles.viewerImage} contentFit="contain" /> : null}
          <View style={styles.viewerBar}>
            <Pressable onPress={() => step(-1)} hitSlop={12} disabled={photos.length < 2}>
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </Pressable>
            <BrandButton label={saving ? 'Saving...' : 'Save to Photos'} onPress={saveCurrent} />
            <Pressable onPress={() => step(1)} hitSlop={12} disabled={photos.length < 2}>
              <Ionicons name="chevron-forward" size={28} color="#FFFFFF" />
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: '32.5%', aspectRatio: 1 },
  thumb: { width: '100%', height: '100%', borderRadius: Radius.small },
  viewer: { flex: 1, backgroundColor: '#000000' },
  viewerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.three },
  viewerText: { color: '#FFFFFF' },
  viewerImage: { flex: 1 },
});
```

- [ ] **Step 5: Push routing and the entry points**

In `mobile/src/lib/push.ts`, in `routeForNotification`, add this directly after the `devotional` case (after `return '/daily-devotional';`):

```ts
    case 'album':
      return data.entityId ? `/gallery/${data.entityId}` : '/gallery';
```

In `mobile/src/app/(tabs)/account.tsx`, add this directly after the `Daily Devotional` `UtilityButton` line:

```tsx
        <UtilityButton label="Photo Gallery" onPress={() => router.push('/gallery' as never)} />
```

In `mobile/src/app/events/[id].tsx`, directly after the `</BrandCard>` that closes the "Event details" card (the one containing `Status: ${data.status || 'active'}`) and before `<View style={styles.actionRow}>`, add:

```tsx

          {data.album_id ? (
            <BrandButton label="View Event Photos" variant="outline" onPress={() => router.push(`/gallery/${data.album_id}` as never)} />
          ) : null}
```

- [ ] **Step 6: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`.

- [ ] **Step 7: Commit**

```bash
git add mobile/package.json mobile/package-lock.json mobile/app.json mobile/src/hooks/use-api.ts mobile/src/lib/save-photo.ts mobile/src/app/gallery mobile/src/lib/push.ts "mobile/src/app/(tabs)/account.tsx" "mobile/src/app/events/[id].tsx"
git commit -m "feat(mobile): photo gallery with full-screen viewer and Save to Photos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Mobile admin gallery

**Files:**
- Create: `mobile/src/lib/album-upload.ts`, `mobile/src/app/admin-gallery.tsx`, `mobile/src/app/admin-gallery/[id].tsx`
- Modify: `mobile/src/app/admin.tsx`

**Interfaces:**
- Consumes: the Task 6 admin hooks and types, `useAdminEvents(enabled)` (existing), and `expo-image-picker` (installed in Phase 7a).
- Produces:
  - `MAX_ALBUM_PHOTO_BYTES`
  - `uploadPhotoToCloudinary(photo: PickedPhoto, signature) → Promise<string>`, which resolves to the public id
  - `mapWithConcurrency(items, limit, worker)` and `chunk(items, size)`
  - Routes `/admin-gallery` and `/admin-gallery/[id]`

- [ ] **Step 1: Create the direct-upload helper**

Create `mobile/src/lib/album-upload.ts`:

```ts
import type { AlbumUploadSignature } from '@/hooks/use-api';

export const MAX_ALBUM_PHOTO_BYTES = 10 * 1024 * 1024;

export type PickedPhoto = { uri: string; mimeType?: string | null; fileName?: string | null; fileSize?: number | null };

// Multipart POST straight to Cloudinary with the server-issued signature; resolves to the public id.
// Plain fetch on purpose: apiClient would attach our auth token, which must never go to Cloudinary.
export const uploadPhotoToCloudinary = async (photo: PickedPhoto, signature: AlbumUploadSignature): Promise<string> => {
  const form = new FormData();
  form.append('file', {
    uri: photo.uri,
    name: photo.fileName || 'photo.jpg',
    type: photo.mimeType || 'image/jpeg',
  } as any);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('signature', signature.signature);
  form.append('folder', signature.folder);
  form.append('allowed_formats', signature.allowedFormats);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body?.public_id !== 'string') {
    throw new Error(body?.error?.message || 'Upload failed');
  }
  return body.public_id;
};

// Runs worker over items with at most `limit` in flight; never rejects.
export const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<PromiseSettledResult<R>[]> => {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const run = async () => {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = { status: 'fulfilled', value: await worker(items[index], index) };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
};

export const chunk = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};
```

- [ ] **Step 2: Create the album list screen**

Create `mobile/src/app/admin-gallery.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandButton, BrandCard, BrandPill } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getApiErrorMessage, useAdminAlbums, useSaveAlbum } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

export default function AdminGalleryScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const albumsQuery = useAdminAlbums(isAdmin);
  const save = useSaveAlbum();
  const [title, setTitle] = React.useState('');

  if (!user || !isAdmin) return null;

  // New albums start as drafts; the details, photos and publishing are on the album screen.
  const onCreate = () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Give the album a title first.');
      return;
    }
    if (save.isPending) return;
    save.mutate(
      { input: { title: title.trim(), description: null, eventId: null, externalUrl: null, isPublished: false } },
      {
        onSuccess: ({ album }) => {
          setTitle('');
          if (album?.id) router.push(`/admin-gallery/${album.id}` as never);
        },
        onError: (error) => Alert.alert('Could not create the album', getApiErrorMessage(error, 'Please try again.')),
      }
    );
  };

  const albums = albumsQuery.data ?? [];

  return (
    <AdminShell activeTab="/admin">
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Photo Gallery</ThemedText>
        </View>
      </View>

      <BrandCard>
        <ThemedText type="defaultSemiBold">New album</ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Album title"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
        />
        <BrandButton label={save.isPending ? 'Creating...' : 'Create Draft Album'} variant="secondary" onPress={onCreate} />
      </BrandCard>

      {albums.map((album) => (
        <Pressable key={album.id} onPress={() => router.push(`/admin-gallery/${album.id}` as never)}>
          <BrandCard>
            <View style={styles.row}>
              {album.cover_url ? (
                <Image source={{ uri: album.cover_url }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, { backgroundColor: theme.backgroundSelected }]} />
              )}
              <View style={styles.rowCopy}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>
                  {album.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
                  {album.notified_at ? ' · everyone notified' : ''}
                </ThemedText>
              </View>
              <BrandPill>{album.is_published ? 'published' : 'draft'}</BrandPill>
            </View>
          </BrandCard>
        </Pressable>
      ))}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rowCopy: { flex: 1, gap: 2 },
  thumb: { width: 56, height: 56, borderRadius: Radius.medium },
});
```

- [ ] **Step 3: Create the album management screen**

Create `mobile/src/app/admin-gallery/[id].tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandButton, BrandCard } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  getApiErrorMessage,
  useAdminAlbum,
  useAdminEvents,
  useAlbumUploadSignature,
  useDeleteAlbum,
  useDeleteAlbumPhoto,
  useRecordAlbumPhotos,
  useSaveAlbum,
  useSetAlbumCover,
  type AlbumPhoto,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { MAX_ALBUM_PHOTO_BYTES, chunk, mapWithConcurrency, uploadPhotoToCloudinary, type PickedPhoto } from '@/lib/album-upload';
import { useAuthStore } from '@/store/auth';

type FormState = { title: string; description: string; externalUrl: string; eventId: number | null; isPublished: boolean };

export default function AdminAlbumScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id) || undefined;
  const albumQuery = useAdminAlbum(id, isAdmin);
  const eventsQuery = useAdminEvents(isAdmin);
  const save = useSaveAlbum();
  const removeAlbum = useDeleteAlbum();
  const getSignature = useAlbumUploadSignature(id);
  const recordPhotos = useRecordAlbumPhotos(id);
  const removePhoto = useDeleteAlbumPhoto(id);
  const setCover = useSetAlbumCover(id);
  const [form, setForm] = React.useState<FormState | null>(null);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [retryPhotos, setRetryPhotos] = React.useState<PickedPhoto[]>([]);
  const album = albumQuery.data;

  React.useEffect(() => {
    if (!album) return;
    setForm({
      title: album.title,
      description: album.description || '',
      externalUrl: album.external_url || '',
      eventId: album.event_id,
      isPublished: album.is_published,
    });
    // Only when a different album loads, so typing is not overwritten by refetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album?.id]);

  if (!user || !isAdmin) return null;

  const showError = (title: string) => (error: unknown) => Alert.alert(title, getApiErrorMessage(error, 'Please try again.'));

  const onSave = () => {
    if (!form || !id || save.isPending) return;
    if (!form.title.trim()) {
      Alert.alert('Missing title', 'The album needs a title.');
      return;
    }
    save.mutate(
      {
        id,
        input: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          eventId: form.eventId,
          externalUrl: form.externalUrl.trim() || null,
          isPublished: form.isPublished,
        },
      },
      { onSuccess: ({ message }) => Alert.alert(message || 'Album saved'), onError: showError('Could not save') }
    );
  };

  // Uploads straight to Cloudinary, 3 at a time, then records the uploaded ids (100 per request).
  const uploadPhotos = async (picked: PickedPhoto[]) => {
    if (picked.length === 0 || progress) return;
    const tooBig = picked.filter((photo) => (photo.fileSize ?? 0) > MAX_ALBUM_PHOTO_BYTES);
    const ready = picked.filter((photo) => (photo.fileSize ?? 0) <= MAX_ALBUM_PHOTO_BYTES);
    if (tooBig.length > 0) Alert.alert('Some photos skipped', `${tooBig.length} photo(s) are over 10 MB.`);
    if (ready.length === 0) return;

    setRetryPhotos([]);
    setProgress({ done: 0, total: ready.length });
    try {
      const signature = await getSignature.mutateAsync();
      const results = await mapWithConcurrency(ready, 3, async (photo) => {
        try {
          return await uploadPhotoToCloudinary(photo, signature);
        } finally {
          setProgress((current) => (current ? { ...current, done: current.done + 1 } : current));
        }
      });

      const photoById = new Map<string, PickedPhoto>();
      const failed: PickedPhoto[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') photoById.set(result.value, ready[index]);
        else failed.push(ready[index]);
      });

      let added = 0;
      for (const ids of chunk([...photoById.keys()], 100)) {
        try {
          const result = await recordPhotos.mutateAsync(ids);
          added += result.added;
          result.rejected.forEach((publicId) => {
            const photo = photoById.get(publicId);
            if (photo) failed.push(photo);
          });
        } catch {
          ids.forEach((publicId) => failed.push(photoById.get(publicId) as PickedPhoto));
        }
      }

      setRetryPhotos(failed);
      Alert.alert(`${added} of ${ready.length} uploaded`, failed.length > 0 ? 'Tap "Retry failed" to try the rest again.' : '');
    } catch (error) {
      showError('Could not start the upload')(error);
    } finally {
      setProgress(null);
    }
  };

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 100,
      quality: 0.9,
    });
    if (result.canceled) return;
    uploadPhotos(result.assets ?? []);
  };

  const confirmDeletePhoto = (photo: AlbumPhoto) =>
    Alert.alert('Delete this photo?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removePhoto.mutate(photo.id, { onError: showError('Could not delete') }) },
    ]);

  const confirmDeleteAlbum = () =>
    Alert.alert(`Delete "${album?.title}"?`, 'All of its photos are deleted too. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          id && removeAlbum.mutate(id, { onSuccess: () => router.replace('/admin-gallery' as never), onError: showError('Could not delete') }),
      },
    ]);

  const events: Array<{ id: number; name: string }> = Array.isArray(eventsQuery.data) ? eventsQuery.data : [];
  const input = (field: 'title' | 'description' | 'externalUrl', placeholder: string, multiline = false) => (
    <TextInput
      value={form ? form[field] : ''}
      onChangeText={(value) => setForm((current) => (current ? { ...current, [field]: value } : current))}
      placeholder={placeholder}
      placeholderTextColor={theme.textSecondary}
      multiline={multiline}
      autoCapitalize={field === 'externalUrl' ? 'none' : 'sentences'}
      style={[styles.input, multiline && styles.multiline, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
    />
  );

  return (
    <AdminShell activeTab="/admin">
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1 }}>
            Album
          </ThemedText>
          <ThemedText type="subtitle" numberOfLines={1}>
            {album?.title || 'Loading...'}
          </ThemedText>
        </View>
      </View>

      {!album || !form ? (
        <BrandCard>
          <ThemedText type="small">{albumQuery.isLoading ? 'Loading album...' : 'Album not found.'}</ThemedText>
        </BrandCard>
      ) : (
        <>
          <BrandCard>
            <ThemedText type="defaultSemiBold">Details</ThemedText>
            {input('title', 'Title')}
            {input('description', 'Description (optional)', true)}
            {input('externalUrl', 'Outside folder link, https (optional)')}
            <ThemedText type="small" themeColor="textSecondary">
              Event
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {[{ id: 0, name: 'No event' }, ...events].map((item) => {
                const selected = (form.eventId ?? 0) === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setForm((current) => (current ? { ...current, eventId: item.id || null } : current))}
                    style={[styles.chip, { borderColor: selected ? theme.tint : theme.border, backgroundColor: selected ? theme.accentSoft : 'transparent' }]}
                  >
                    <ThemedText type="small">{item.name}</ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.switchRow}>
              <ThemedText>Published</ThemedText>
              <Switch
                value={form.isPublished}
                onValueChange={(value) => setForm((current) => (current ? { ...current, isPublished: value } : current))}
              />
            </View>
            <BrandButton label={save.isPending ? 'Saving...' : 'Save'} variant="secondary" onPress={onSave} />
          </BrandCard>

          <BrandCard>
            <ThemedText type="defaultSemiBold">Photos ({album.photo_count})</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {progress ? `Uploading ${progress.done} of ${progress.total}...` : 'Up to 10 MB each. Choose several at once.'}
            </ThemedText>
            <BrandButton label={progress ? 'Uploading...' : 'Add Photos'} onPress={() => !progress && pickPhotos()} />
            {retryPhotos.length > 0 && !progress ? (
              <BrandButton label={`Retry ${retryPhotos.length} failed`} variant="outline" onPress={() => uploadPhotos(retryPhotos)} />
            ) : null}
            <View style={styles.grid}>
              {album.photos.map((photo) => {
                const isCover = album.cover_photo_id ? album.cover_photo_id === photo.id : album.photos[0]?.id === photo.id;
                return (
                  <View key={photo.id} style={styles.cell}>
                    <Image source={{ uri: photo.thumb_url }} style={styles.thumb} contentFit="cover" />
                    <View style={styles.cellActions}>
                      <Pressable
                        hitSlop={8}
                        onPress={() => !isCover && setCover.mutate(photo.id, { onError: showError('Could not set the cover') })}
                      >
                        <Ionicons name={isCover ? 'star' : 'star-outline'} size={18} color={theme.tint} />
                      </Pressable>
                      <Pressable hitSlop={8} onPress={() => confirmDeletePhoto(photo)}>
                        <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </BrandCard>

          <BrandButton label="Delete Album" variant="outline" onPress={confirmDeleteAlbum} />
        </>
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  chips: { gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  cell: { width: '31%', gap: 4 },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: Radius.small },
  cellActions: { flexDirection: 'row', justifyContent: 'space-around' },
});
```

If lint reports the `react-hooks/exhaustive-deps` disable comment as an unknown rule, remove that comment line.

- [ ] **Step 4: Add the admin entry point**

In `mobile/src/app/admin.tsx`, add this directly after the `Devotionals` `QuickAction` line:

```tsx
        <QuickAction icon="images-outline" label="Gallery" color="#38BDF8" onPress={() => router.push('/admin-gallery' as never)} />
```

- [ ] **Step 5: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`. If the installed `expo-image-picker` types reject `mediaTypes: ['images']`, use what they require (Phase 7a used `['images']`) and record a ruling.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/lib/album-upload.ts mobile/src/app/admin-gallery.tsx "mobile/src/app/admin-gallery/[id].tsx" mobile/src/app/admin.tsx
git commit -m "feat(mobile): admin gallery with direct Cloudinary uploads from the phone

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Documentation and final checks

**Files:**
- Modify: `docs/deployment.md`, `docs/features.md` and `docs/qa-checklist.md` (append at the end of each)

- [ ] **Step 1: Document the deployment steps (no values)**

Append to `docs/deployment.md`:

```markdown

## Photo albums

Photo albums use the same Cloudinary account as the other images (the three `CLOUDINARY_*` settings above); without them, album uploads return 503 "Photo uploads need Cloudinary to be configured".

- Album photos are uploaded by the browser or phone straight to Cloudinary under `antpresby/albums/<id>/`, using a signature the API issues. The API secret never leaves Render.
- The API checks each uploaded photo with Cloudinary's Admin API before recording it. On the free plan the Admin API is rate limited (about 500 calls an hour), and each batch of up to 100 photos uses one call.
- Run `migrate:features` to create the `photo_albums` and `album_photos` tables (the Render build already does this).
- The mobile app adds `expo-media-library` and `expo-file-system` (native modules), so ship a new EAS build.
```

- [ ] **Step 2: Document the feature and the QA steps**

Append to `docs/features.md`:

```markdown

## Photo Albums

- Anyone with the link can browse published albums at `/gallery` (web) or Account → Photo Gallery (mobile), open photos full size, and download them one at a time or all at once as a zip.
- Albums can link to an event (the event page shows "View photos") and to an outside folder such as Google Drive.
- Admins manage albums at `/admin/gallery` or in the mobile admin console. They upload many photos at once (straight to Cloudinary, up to 10 MB each), choose a cover, and publish.
- Everyone is notified once, the first time a published album has photos.
```

Append to `docs/qa-checklist.md`:

```markdown

## Photo Albums

- [ ] Create a draft album on web, drop in 15 photos (one over 10 MB); the over-size one is skipped and the rest show "14 of 14 uploaded"
- [ ] A draft album's public link shows "Album not found"
- [ ] Publish the album; one notification arrives, and tapping it opens the album (web bell and phone push)
- [ ] Unpublish and republish; no second notification
- [ ] Set a different cover; the gallery card updates
- [ ] Arrow keys move between photos in the web viewer; Escape closes it
- [ ] Download one photo, then "Download all"; the zip contains every photo
- [ ] "Open folder" opens the outside link; "Share" copies the album link
- [ ] Link an album to an event; the event page shows "View photos"
- [ ] (Dev/store build) Save a photo to the phone's photo library; denying the permission shows a clear message
- [ ] (Dev/store build) Upload several photos from the phone as an admin
- [ ] Delete a photo and then the album; both disappear from the Cloudinary `antpresby/albums/` folder
```

- [ ] **Step 3: Run all checks**

```bash
cd backend && DATABASE_URL="postgresql://x:y@localhost:5432/z" npx prisma validate && node --check migrations/migrateFeatureUpdates.js && npx jest --runInBand --coverage=false && npx eslint src/ tests/ && cd ..
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build && cd ..
cd mobile && npm run -s lint && npx tsc --noEmit && cd ..
git status --short
```

Expected:
- **388** backend tests pass, there are no lint or type errors, and the build succeeds.
- `git status` shows only the three docs files. If it shows `backend/pnpm-workspace.yaml` or `frontend/next-env.d.ts`, restore them with `git checkout --`.
- Scan for secrets: `git diff 087ad65 -- . | grep -iE "api_secret\s*[:=]\s*['\"][^'\"]+" ` should only match test placeholders.

- [ ] **Step 4: Commit**

```bash
git add docs/deployment.md docs/features.md docs/qa-checklist.md
git commit -m "docs: photo albums setup, feature notes and QA steps

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
