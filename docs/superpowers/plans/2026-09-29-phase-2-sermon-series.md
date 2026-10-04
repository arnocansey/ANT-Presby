# Phase 2: Sermon Series Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins group sermons into series. Members can browse series and each series' sermons on web and mobile, and the placeholder mobile "Series Manager" and series pills become real.

**Architecture:**
- **Data:** a new `SermonSeries` table, plus an optional `seriesId` on `Sermon` whose foreign key sets itself to `NULL` when a series is deleted.
- **Backend:** a public read API (`/api/sermon-series`) and an admin CRUD API (`/api/admin/sermon-series`) follow the existing model / controller / routes layout.
- **Sermons:** the existing sermon endpoints learn `seriesId`, including a `series_id` list filter. Sermon mapping moves into one `mapSermon` helper instead of four copies.
- **Screens:** web gets a series strip on `/sermons`, a series page, an admin series page, and a series picker in the sermon forms. Mobile gets a real Series Manager, a series picker on sermon edit, and working series filter pills on the Sermons tab.

**Tech Stack:**
- Backend: Express 4, Prisma 6 (PostgreSQL), express-validator 7, multer, Jest 29 and supertest
- Web: Next.js 16 (React 18), TanStack Query 5
- Mobile: Expo SDK 55, TanStack Query 5

**Spec:** `docs/superpowers/specs/2026-09-28-mockups-real-design.md`, section 5.2. The roadmap is in `docs/superpowers/plans/2026-09-28-00-roadmap.md`.

## Global Constraints

- **Data:** `SermonSeries` has `id`, `title` (unique, 255), `description?`, `coverImageUrl?`, `startDate?`, `endDate?`, and timestamps, and maps to the `sermon_series` table. `Sermon.seriesId` is nullable and indexed, with `onDelete: SetNull`.
- **Deleting a series leaves its sermons in place;** they just stop belonging to a series.
- **Admin writes** (create, update, delete, upload) call `auditLogModel.createAuditLog` with `entityType: 'sermon_series'`.
- **Cover images** must be uploaded through `POST /api/admin/sermon-series/upload-image`, using the existing image rules (JPEG, PNG, WebP or GIF, 5 MB). `coverImageUrl` accepts only `/uploads/series-images/<file>` or empty. External URLs are rejected.
- **Dates:** `startDate` and `endDate` are date-only (`@db.Date`). Web and mobile format them in UTC (`timeZone: 'UTC'`), so western time zones don't show the previous day.
- **Sermon order:** a series lists its sermons oldest first (`sermonDate` ascending). The series list is newest `startDate` first, with series that have no start date last.
- **Dependencies:** no new backend, web, or mobile dependencies.
- **Schema changes:** every change goes both in `backend/prisma/schema.prisma` **and** as idempotent SQL in `backend/migrations/migrateFeatureUpdates.js`.
- **Commits:** every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

These cases are the ones most likely to hurt a real user. Each has a test in the task named.

1. **Duplicate titles.** Creating or renaming a series to a title that already exists returns **409** with a readable message, not a 500 from Prisma `P2002`. *(Task 4)*
2. **Missing series.** Linking a sermon to a series that doesn't exist, or was just deleted, returns **400** "Sermon series not found", not a 500 foreign-key error. *(Task 2)*
3. **Malformed IDs.**
   - `/api/sermon-series/abc` and `/api/admin/sermon-series/1.5` return 404.
   - `/api/sermons?series_id=abc` returns 400.
   - None of these reach Prisma. *(Tasks 2, 3 and 4)*
4. **End before start.** A series whose `endDate` is before its `startDate` is rejected with 400. *(Task 4)*
5. **Outside cover URLs.** A `coverImageUrl` pointing anywhere else (such as `https://evil.example/x.png` or `javascript:alert(1)`) is rejected with 400. Covers can only come from our own upload. *(Task 4)*

---

## File Map

| File | Change | Responsibility |
|---|---|---|
| `backend/src/utils/helpers.js` | Modify | Shared `parseId` |
| `backend/src/controllers/prayerRequestController.js` | Modify | Use the shared `parseId` |
| `backend/prisma/schema.prisma` | Modify | `SermonSeries` model; `Sermon.seriesId` and relation |
| `backend/migrations/migrateFeatureUpdates.js` | Modify | Idempotent SQL |
| `backend/src/models/sermonModel.js` | Modify | `sermonInclude`, `mapSermon`, `seriesId` on create/update/filter |
| `backend/src/models/sermonSeriesModel.js` | Create | Series queries |
| `backend/src/controllers/sermonController.js` | Modify | `seriesId` existence check, `series_id` filter |
| `backend/src/controllers/sermonSeriesController.js` | Create | Public and admin series handlers |
| `backend/src/routes/sermonSeriesRoutes.js` | Create | Public routes |
| `backend/src/routes/adminSermonSeriesRoutes.js` | Create | Admin routes |
| `backend/src/routes/sermonRoutes.js`, `adminSermonRoutes.js` | Modify | `validateSermonSeriesLink` on create/update |
| `backend/src/middleware/validators.js` | Modify | `validateSermonSeriesLink`, `validateSermonSeries` |
| `backend/src/middleware/uploadMiddleware.js` | Modify | `seriesImageUpload` |
| `backend/src/server.js` | Modify | Mount the two routers |
| `backend/tests/utils/parseId.test.js` | Create | `parseId` tests |
| `backend/tests/models/sermonMapper.test.js` | Create | `mapSermon` tests |
| `backend/tests/api/sermonSeries.test.js` | Create | Route tests |
| `frontend/src/lib/utils.ts` | Modify | `formatDateOnly` |
| `frontend/src/hooks/useApi.ts` | Modify | Series types and hooks |
| `frontend/src/app/sermons/page.tsx` | Modify | Series strip |
| `frontend/src/app/sermons/series/[id]/page.tsx` | Create | Series page |
| `frontend/src/app/admin/series/page.tsx` | Create | Admin series management |
| `frontend/src/app/admin/sermons/new/page.tsx`, `[id]/edit/page.tsx` | Modify | Series picker |
| `frontend/src/components/layout/AdminSidebar.tsx` | Modify | "Series" link |
| `mobile/src/hooks/use-api.ts` | Modify | Series types and hooks; `useSermons` series filter; `AdminSermonPayload.seriesId` |
| `mobile/src/app/admin-series.tsx` | Rewrite | Real Series Manager |
| `mobile/src/app/admin-sermons/[id].tsx` | Modify | Series picker |
| `mobile/src/screens/SermonsScreen.tsx` | Modify | Working series pills |
| `docs/features.md`, `docs/qa-checklist.md`, roadmap | Modify | Documentation |

---

### Task 1: Branch and a shared `parseId`

**Files:**
- Modify: `backend/src/utils/helpers.js`
- Modify: `backend/src/controllers/prayerRequestController.js` (remove the local `parseId` and import it)
- Test: `backend/tests/utils/parseId.test.js`

**Interfaces:**
- Produces: `parseId(value: unknown) → number | null` from `src/utils/helpers`. It accepts only canonical positive integer strings or numbers.

- [ ] **Step 1: Create the branch on top of the Phase 0 + 1 branch**

```bash
cd ANT-Presby
git checkout feature/placeholder-features
git checkout -b feature/sermon-series
git add docs/superpowers/plans/2026-09-29-phase-2-sermon-series.md
git commit -m "docs: phase 2 sermon series plan

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

The branch stacks on `feature/placeholder-features`, which has an open PR. Merge that PR first, then open this branch's PR against `main`. Git will then show only the Phase 2 commits.

- [ ] **Step 2: Write the failing test**

Create `backend/tests/utils/parseId.test.js`:

```js
const { parseId } = require('../../src/utils/helpers');

describe('parseId', () => {
  test.each([
    ['7', 7],
    [7, 7],
    ['123', 123],
  ])('accepts %p', (input, expected) => {
    expect(parseId(input)).toBe(expected);
  });

  test.each(['abc', '1.5', '0', '-2', '', '07', '1e3', ' 7', undefined, null, {}])('rejects %p', (input) => {
    expect(parseId(input)).toBeNull();
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `cd backend && npx jest tests/utils/parseId.test.js --coverage=false`
Expected: FAIL with `parseId is not a function`.

- [ ] **Step 4: Add the helper**

In `backend/src/utils/helpers.js`, add this above `module.exports`:

```js
/**
 * Parse a route id. Only canonical positive integers are accepted ("7", 7);
 * anything else ("abc", "1.5", "07", "0") returns null so callers can 404
 * without sending NaN or fractions to the database.
 */
const parseId = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 && String(id) === String(value) ? id : null;
};
```

Add `parseId,` to `module.exports`.

- [ ] **Step 5: Use it in the prayer controller**

In `backend/src/controllers/prayerRequestController.js`:
- Change the first line to `const { apiResponse, getPagination, buildPaginationMeta, parseId } = require('../utils/helpers');`.
- Delete the local `const parseId = (value) => { ... };` block. Keep `isOwnerOrAdmin`.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd backend && npx jest tests/utils/parseId.test.js tests/api/prayerWall.test.js --coverage=false`
Expected: PASS (14 parseId tests and all prayer wall tests).

- [ ] **Step 7: Commit**

```bash
git add backend/src/utils/helpers.js backend/src/controllers/prayerRequestController.js backend/tests/utils/parseId.test.js
git commit -m "refactor: share parseId across controllers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Schema, migration, and linking sermons to series

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/migrations/migrateFeatureUpdates.js` (insert before `await client.query('COMMIT');`)
- Create: `backend/src/models/sermonSeriesModel.js` (with only `getSeriesById` for now)
- Modify: `backend/src/models/sermonModel.js`
- Modify: `backend/src/controllers/sermonController.js`
- Modify: `backend/src/middleware/validators.js`
- Modify: `backend/src/routes/sermonRoutes.js`, `backend/src/routes/adminSermonRoutes.js`
- Test: `backend/tests/models/sermonMapper.test.js`, `backend/tests/api/sermonSeries.test.js`

**Interfaces:**
- Consumes: `parseId` (Task 1).
- Produces:
  - `sermonModel.sermonInclude`, used as the Prisma `include` everywhere sermons are read.
  - `sermonModel.mapSermon(row) → { ...snake_case sermon fields, ministry_name: string|null, series_title: string|null }`, with no nested `ministry` or `series` objects.
  - `sermonModel.createSermon(title, speaker, description, videoUrl, sermonDate, ministryId, seriesId = null)`
  - `buildSermonUpdateData` accepts `seriesId` (`null` clears it).
  - `getAllSermons` / `countSermons` accept `filters.seriesId`.
  - `sermonSeriesModel.getSeriesById(id) → series | undefined`. It includes `sermon_count`.
  - `sermonSeriesModel.mapSeries(row) → snake_case series with sermon_count`
  - `validators.validateSermonSeriesLink`

- [ ] **Step 1: Write the failing mapper test**

Create `backend/tests/models/sermonMapper.test.js`:

```js
const { mapSermon } = require('../../src/models/sermonModel');

const row = {
  id: 5,
  title: 'Grace',
  speaker: 'Rev. Ofori',
  description: 'On grace',
  videoUrl: 'https://youtube.com/watch?v=x',
  sermonDate: new Date('2026-09-20T00:00:00Z'),
  ministryId: 2,
  seriesId: 3,
  createdAt: new Date('2026-09-20T00:00:00Z'),
  updatedAt: new Date('2026-09-20T00:00:00Z'),
};

describe('mapSermon', () => {
  test('flattens ministry and series names', () => {
    const mapped = mapSermon({ ...row, ministry: { name: 'Youth' }, series: { id: 3, title: 'Romans' } });

    expect(mapped.ministry_name).toBe('Youth');
    expect(mapped.series_title).toBe('Romans');
    expect(mapped.series_id).toBe(3);
    expect(mapped.video_url).toBe('https://youtube.com/watch?v=x');
    expect(mapped).not.toHaveProperty('ministry');
    expect(mapped).not.toHaveProperty('series');
  });

  test('uses null when a sermon has no ministry or series', () => {
    const mapped = mapSermon({ ...row, ministryId: null, seriesId: null, ministry: null, series: null });

    expect(mapped.ministry_name).toBeNull();
    expect(mapped.series_title).toBeNull();
  });
});
```

- [ ] **Step 2: Write the failing route tests**

Create `backend/tests/api/sermonSeries.test.js`:

```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const tokenFor = (userId, role = 'member') =>
  jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET, { expiresIn: '10m' });
const admin = () => `Bearer ${tokenFor(1, 'admin')}`;

const buildModels = () => ({
  sermonModel: {
    createSermon: jest.fn().mockResolvedValue({ id: 5 }),
    getAllSermons: jest.fn().mockResolvedValue([]),
    countSermons: jest.fn().mockResolvedValue(0),
    getSermonById: jest.fn().mockResolvedValue({ id: 5 }),
    updateSermon: jest.fn().mockResolvedValue({ id: 5 }),
    deleteSermon: jest.fn().mockResolvedValue({ id: 5 }),
    getRecentSermons: jest.fn().mockResolvedValue([]),
    searchSermons: jest.fn().mockResolvedValue([]),
  },
  sermonSeriesModel: {
    getSeriesById: jest.fn().mockResolvedValue({ id: 3, title: 'Romans' }),
    listSeries: jest.fn().mockResolvedValue([]),
    getSeriesWithSermons: jest.fn().mockResolvedValue(undefined),
    createSeries: jest.fn().mockResolvedValue({ id: 3, title: 'Romans' }),
    updateSeries: jest.fn().mockResolvedValue({ id: 3, title: 'Romans' }),
    deleteSeries: jest.fn().mockResolvedValue({ id: 3 }),
  },
  auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
  mediaAssetModel: { createMediaAsset: jest.fn().mockResolvedValue({ id: 1, url: '/uploads/series-images/x.png' }) },
});

const buildApp = (models) => {
  jest.resetModules();
  jest.doMock('../../src/models/sermonModel', () => models.sermonModel);
  jest.doMock('../../src/models/sermonSeriesModel', () => models.sermonSeriesModel);
  jest.doMock('../../src/models/auditLogModel', () => models.auditLogModel);
  jest.doMock('../../src/models/mediaAssetModel', () => models.mediaAssetModel);

  const app = express();
  app.use(express.json());
  app.use('/api/sermons', require('../../src/routes/sermonRoutes'));
  app.use('/api/admin/sermons', require('../../src/routes/adminSermonRoutes'));
  const { errorHandler } = require('../../src/middleware/errorHandler');
  app.use(errorHandler);
  return app;
};

const sermonBody = {
  title: 'Grace',
  speaker: 'Rev. Ofori',
  description: 'On grace',
  videoUrl: 'https://youtube.com/watch?v=abc',
  sermonDate: '2026-09-20',
  ministryId: 1,
};

describe('Linking sermons to series', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('creating a sermon with an existing series passes seriesId to the model', async () => {
    const response = await request(app)
      .post('/api/admin/sermons')
      .set('Authorization', admin())
      .send({ ...sermonBody, seriesId: 3 });

    expect(response.status).toBe(201);
    expect(models.sermonSeriesModel.getSeriesById).toHaveBeenCalledWith(3);
    expect(models.sermonModel.createSermon).toHaveBeenCalledWith(
      'Grace',
      'Rev. Ofori',
      'On grace',
      'https://youtube.com/watch?v=abc',
      '2026-09-20',
      1,
      3
    );
  });

  test('creating a sermon with a missing series returns 400 and creates nothing', async () => {
    models.sermonSeriesModel.getSeriesById.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/admin/sermons')
      .set('Authorization', admin())
      .send({ ...sermonBody, seriesId: 99 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Sermon series not found');
    expect(models.sermonModel.createSermon).not.toHaveBeenCalled();
  });

  test('creating a sermon without a series stores null', async () => {
    await request(app).post('/api/admin/sermons').set('Authorization', admin()).send(sermonBody);

    expect(models.sermonSeriesModel.getSeriesById).not.toHaveBeenCalled();
    expect(models.sermonModel.createSermon.mock.calls[0][6]).toBeNull();
  });

  test('updating with seriesId null clears the series without a lookup', async () => {
    const response = await request(app)
      .put('/api/admin/sermons/5')
      .set('Authorization', admin())
      .send({ seriesId: null });

    expect(response.status).toBe(200);
    expect(models.sermonSeriesModel.getSeriesById).not.toHaveBeenCalled();
    expect(models.sermonModel.updateSermon).toHaveBeenCalledWith('5', { seriesId: null });
  });

  test('updating with a missing series returns 400', async () => {
    models.sermonSeriesModel.getSeriesById.mockResolvedValue(undefined);

    const response = await request(app)
      .put('/api/admin/sermons/5')
      .set('Authorization', admin())
      .send({ seriesId: 42 });

    expect(response.status).toBe(400);
    expect(models.sermonModel.updateSermon).not.toHaveBeenCalled();
  });

  test('a non-integer seriesId is rejected by validation', async () => {
    const response = await request(app)
      .put('/api/admin/sermons/5')
      .set('Authorization', admin())
      .send({ seriesId: 'abc' });

    expect(response.status).toBe(400);
    expect(models.sermonModel.updateSermon).not.toHaveBeenCalled();
  });

  test('GET /api/sermons?series_id filters by series', async () => {
    const response = await request(app).get('/api/sermons?series_id=3');

    expect(response.status).toBe(200);
    expect(models.sermonModel.getAllSermons).toHaveBeenCalledWith(0, 10, { seriesId: 3 });
    expect(models.sermonModel.countSermons).toHaveBeenCalledWith({ seriesId: 3 });
  });

  test('GET /api/sermons?series_id=abc returns 400', async () => {
    const response = await request(app).get('/api/sermons?series_id=abc');

    expect(response.status).toBe(400);
    expect(models.sermonModel.getAllSermons).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/models/sermonMapper.test.js tests/api/sermonSeries.test.js --coverage=false`
Expected: FAIL. `mapSermon is not a function`; `sermonSeriesModel` can't be found (the jest mock of a missing module throws `Cannot find module`).

- [ ] **Step 4: Update the Prisma schema**

In `backend/prisma/schema.prisma`:

a. In `model Sermon`, add this after `ministryId ...`:

```prisma
  seriesId    Int?          @map("series_id")
```

After the `ministry` relation line, add:

```prisma
  series      SermonSeries? @relation(fields: [seriesId], references: [id], onDelete: SetNull)
```

Before `@@map("sermons")`, add:

```prisma
  @@index([seriesId], map: "idx_sermons_series")
```

b. Add this new model directly after `model Sermon { ... }`:

```prisma
model SermonSeries {
  id            Int       @id @default(autoincrement())
  title         String    @unique @db.VarChar(255)
  description   String?
  coverImageUrl String?   @map("cover_image_url") @db.VarChar(500)
  startDate     DateTime? @map("start_date") @db.Date
  endDate       DateTime? @map("end_date") @db.Date
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  sermons       Sermon[]

  @@map("sermon_series")
}
```

Run: `cd backend && DATABASE_URL="postgresql://x:y@localhost:5432/z" npx prisma validate && npx prisma generate`
Expected: `The schema at prisma\schema.prisma is valid`, followed by `Generated Prisma Client`. The placeholder URL is only for validation; nothing connects.

- [ ] **Step 5: Add the idempotent migration**

In `backend/migrations/migrateFeatureUpdates.js`, insert this directly before `await client.query('COMMIT');`:

```js
    // Sermon series (phase 2)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sermon_series (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        cover_image_url VARCHAR(500),
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT sermon_series_title_key UNIQUE (title)
      );
    `);

    await client.query(`
      ALTER TABLE sermons
      ADD COLUMN IF NOT EXISTS series_id INTEGER REFERENCES sermon_series(id) ON DELETE SET NULL;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sermons_series
      ON sermons(series_id);
    `);
```

Run: `cd backend && node --check migrations/migrateFeatureUpdates.js`
Expected: no output (the syntax is valid). **Do not** `require` or run the script. There's no local database.

- [ ] **Step 6: Create the series model with `getSeriesById`**

Create `backend/src/models/sermonSeriesModel.js`:

```js
const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

/**
 * Sermon Series Model - Database operations for sermon series
 */

const withSermonCount = { _count: { select: { sermons: true } } };

// Snake-case a series row and replace Prisma's _count with sermon_count.
const mapSeries = (row) => {
  // eslint-disable-next-line no-unused-vars
  const { _count: count, sermons, ...rest } = row;
  const mapped = toSnakeCaseObject(rest);
  mapped.sermon_count = count?.sermons ?? 0;
  return mapped;
};

const getSeriesById = async (seriesId) => {
  const series = await prisma.sermonSeries.findUnique({
    where: { id: Number(seriesId) },
    include: withSermonCount,
  });

  return series ? mapSeries(series) : undefined;
};

module.exports = {
  withSermonCount,
  mapSeries,
  getSeriesById,
};
```

- [ ] **Step 7: Update the sermon model**

In `backend/src/models/sermonModel.js`:

a. Add this directly after the `toSnakeCaseObject` import:

```js
// Every sermon read includes its ministry and series names.
const sermonInclude = {
  ministry: { select: { name: true } },
  series: { select: { id: true, title: true } },
};

const mapSermon = (row) => {
  const { ministry, series, ...rest } = row;
  const mapped = toSnakeCaseObject(rest);
  mapped.ministry_name = ministry ? ministry.name : null;
  mapped.series_title = series ? series.title : null;
  return mapped;
};

const buildSermonWhere = (filters = {}) => {
  const where = {};

  if (filters.ministryId) {
    where.ministryId = Number(filters.ministryId);
  }

  if (filters.seriesId) {
    where.seriesId = Number(filters.seriesId);
  }

  if (filters.speaker) {
    where.speaker = {
      contains: filters.speaker,
      mode: 'insensitive',
    };
  }

  return where;
};
```

b. Replace `createSermon` with:

```js
// Create sermon
const createSermon = async (
  title,
  speaker,
  description,
  videoUrl,
  sermonDate,
  ministryId,
  seriesId = null
) => {
  const sermon = await prisma.sermon.create({
    data: {
      title,
      speaker,
      description,
      videoUrl,
      sermonDate: new Date(sermonDate),
      ministryId: ministryId ? Number(ministryId) : null,
      seriesId: seriesId ? Number(seriesId) : null,
    },
    include: sermonInclude,
  });

  return mapSermon(sermon);
};
```

c. Replace `getAllSermons` and `countSermons` with:

```js
// Get all sermons with pagination
const getAllSermons = async (offset, limit, filters = {}) => {
  const sermons = await prisma.sermon.findMany({
    where: buildSermonWhere(filters),
    skip: Number(offset),
    take: Number(limit),
    orderBy: { sermonDate: 'desc' },
    include: sermonInclude,
  });

  return sermons.map(mapSermon);
};

// Count sermons
const countSermons = async (filters = {}) => prisma.sermon.count({ where: buildSermonWhere(filters) });
```

d. Replace the body of `getSermonById` with:

```js
const getSermonById = async (sermonId) => {
  const sermon = await prisma.sermon.findUnique({
    where: { id: Number(sermonId) },
    include: sermonInclude,
  });

  return sermon ? mapSermon(sermon) : undefined;
};
```

e. In `buildSermonUpdateData`, add this after the `ministryId` block:

```js
  if (updates.seriesId !== undefined) {
    data.seriesId = updates.seriesId === null ? null : Number(updates.seriesId);
  }
```

f. In `updateSermon`, replace the final `findUnique` and `return` with:

```js
  const sermon = await prisma.sermon.findUnique({
    where: { id },
    include: sermonInclude,
  });

  return mapSermon(sermon);
```

g. In `getRecentSermons` and `searchSermons`, replace each `include: { ministry: { select: { name: true } } }` with `include: sermonInclude`, and each trailing `return sermons.map((item) => { ... });` block with `return sermons.map(mapSermon);`.

h. Add `sermonInclude,` and `mapSermon,` to `module.exports`.

- [ ] **Step 8: Add the link validator**

In `backend/src/middleware/validators.js`, add this after `validateSermonCreation`:

```js
// Optional series link on sermon create/update. null clears it.
const validateSermonSeriesLink = [
  body('seriesId')
    .optional({ values: 'null' })
    .isInt({ min: 1 })
    .withMessage('seriesId must be a positive integer or null'),
];
```

Add `validateSermonSeriesLink,` to `module.exports`.

- [ ] **Step 9: Apply the validator to both sermon routers**

In `backend/src/routes/sermonRoutes.js`:
- Import `validateSermonSeriesLink` alongside `validateSermonCreation`.
- In the `POST '/'` route, put `validateSermonSeriesLink,` after `validateSermonCreation,`.
- Replace the `PUT '/:id'` route with:

```js
router.put(
  '/:id',
  verifyToken,
  requireRole('admin'),
  validateSermonSeriesLink,
  handleValidationErrors,
  sermonController.updateSermon
);
```

In `backend/src/routes/adminSermonRoutes.js`:
- Import `validateSermonSeriesLink`.
- Replace the post and put lines with:

```js
router.post(
  '/',
  validateSermonCreation,
  validateSermonSeriesLink,
  handleValidationErrors,
  sermonController.createSermon
);
router.put('/:id', validateSermonSeriesLink, handleValidationErrors, sermonController.updateSermon);
```

- [ ] **Step 10: Update the sermon controller**

In `backend/src/controllers/sermonController.js`:

a. Replace the two import lines with:

```js
const { apiResponse, getPagination, buildPaginationMeta, parseId } = require('../utils/helpers');
const sermonModel = require('../models/sermonModel');
const sermonSeriesModel = require('../models/sermonSeriesModel');

// A sermon may only point at a series that exists. null/undefined means "no series".
const seriesExists = async (seriesId) =>
  seriesId === undefined || seriesId === null || Boolean(await sermonSeriesModel.getSeriesById(seriesId));

const SERIES_NOT_FOUND = 'Sermon series not found';
```

b. Replace `createSermon` with:

```js
// Create sermon (admin only)
const createSermon = async (req, res, next) => {
  try {
    const { title, speaker, description, videoUrl, sermonDate, ministryId, seriesId } = req.body;

    if (!(await seriesExists(seriesId))) {
      return res.status(400).json(apiResponse(false, null, SERIES_NOT_FOUND));
    }

    const sermon = await sermonModel.createSermon(
      title,
      speaker,
      description,
      videoUrl,
      sermonDate,
      ministryId,
      seriesId ? Number(seriesId) : null
    );

    res.status(201).json(apiResponse(true, sermon, 'Sermon created successfully'));
  } catch (error) {
    next(error);
  }
};
```

c. In `getAllSermons`:
- Change the destructure to `const { page = 1, limit = 10, ministry_id, series_id, speaker } = req.query;`.
- Add this after the `ministry_id` filter line:

```js
    if (series_id !== undefined) {
      const seriesId = parseId(series_id);
      if (!seriesId) {
        return res.status(400).json(apiResponse(false, null, 'Invalid series_id'));
      }
      filters.seriesId = seriesId;
    }
```

d. In `updateSermon`, add this after `const updates = req.body;`:

```js
    if (!(await seriesExists(updates.seriesId))) {
      return res.status(400).json(apiResponse(false, null, SERIES_NOT_FOUND));
    }
```

- [ ] **Step 11: Run the tests to verify they pass**

Run: `cd backend && npx jest tests/models/sermonMapper.test.js tests/api/sermonSeries.test.js --coverage=false`
Expected: PASS (2 mapper tests and 8 linking tests).

- [ ] **Step 12: Run the full suite (other tests mock sermon code)**

Run: `cd backend && npx jest --runInBand --coverage=false && npx eslint src/ tests/`
Expected: everything passes, and there's no lint output.

- [ ] **Step 13: Commit**

```bash
git add backend/prisma/schema.prisma backend/migrations/migrateFeatureUpdates.js backend/src/models/sermonSeriesModel.js backend/src/models/sermonModel.js backend/src/controllers/sermonController.js backend/src/middleware/validators.js backend/src/routes/sermonRoutes.js backend/src/routes/adminSermonRoutes.js backend/tests/models/sermonMapper.test.js backend/tests/api/sermonSeries.test.js
git commit -m "feat: add sermon series schema and let sermons belong to a series

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Public series API

**Files:**
- Modify: `backend/src/models/sermonSeriesModel.js` (add `listSeries` and `getSeriesWithSermons`)
- Create: `backend/src/controllers/sermonSeriesController.js`
- Create: `backend/src/routes/sermonSeriesRoutes.js`
- Modify: `backend/src/server.js`
- Test: `backend/tests/api/sermonSeries.test.js` (add `describe` blocks)

**Interfaces:**
- Consumes: `mapSeries` and `withSermonCount` (Task 2), `sermonModel.mapSermon` and `sermonInclude` (Task 2), `parseId` (Task 1).
- Produces:
  - `sermonSeriesModel.listSeries() → Series[]`
  - `sermonSeriesModel.getSeriesWithSermons(id) → (Series & { sermons: Sermon[] }) | undefined`, with sermons oldest first.
  - `sermonSeriesController.listSeries`, `sermonSeriesController.getSeries`
  - `GET /api/sermon-series` → `{ data: Series[] }`
  - `GET /api/sermon-series/:id` → `{ data: Series & { sermons } }`

- [ ] **Step 1: Write the failing tests**

In `backend/tests/api/sermonSeries.test.js`:

a. In `buildApp`, add this line after the `adminSermonRoutes` line:

```js
  app.use('/api/sermon-series', require('../../src/routes/sermonSeriesRoutes'));
```

b. Append these blocks at the end of the file:

```js
describe('Public sermon series API', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('GET /api/sermon-series lists series', async () => {
    models.sermonSeriesModel.listSeries.mockResolvedValue([{ id: 3, title: 'Romans', sermon_count: 4 }]);

    const response = await request(app).get('/api/sermon-series');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ id: 3, title: 'Romans', sermon_count: 4 }]);
  });

  test('GET /api/sermon-series/:id returns the series with its sermons', async () => {
    models.sermonSeriesModel.getSeriesWithSermons.mockResolvedValue({ id: 3, title: 'Romans', sermons: [{ id: 5 }] });

    const response = await request(app).get('/api/sermon-series/3');

    expect(response.status).toBe(200);
    expect(models.sermonSeriesModel.getSeriesWithSermons).toHaveBeenCalledWith(3);
    expect(response.body.data.sermons).toHaveLength(1);
  });

  test('GET /api/sermon-series/:id returns 404 for a missing series', async () => {
    const response = await request(app).get('/api/sermon-series/99');
    expect(response.status).toBe(404);
  });

  test('GET /api/sermon-series/:id returns 404 for a malformed id without querying', async () => {
    const response = await request(app).get('/api/sermon-series/abc');

    expect(response.status).toBe(404);
    expect(models.sermonSeriesModel.getSeriesWithSermons).not.toHaveBeenCalled();
  });
});

describe('Sermon series routes are mounted in the server', () => {
  test('GET /api/sermon-series is served by the real app', async () => {
    const models = buildModels();
    models.sermonSeriesModel.listSeries.mockResolvedValue([]);
    jest.resetModules();
    jest.doMock('../../src/models/sermonSeriesModel', () => models.sermonSeriesModel);
    const server = require('../../src/server');

    const response = await request(server).get('/api/sermon-series');

    expect(response.status).toBe(200);
    expect(models.sermonSeriesModel.listSeries).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/api/sermonSeries.test.js --coverage=false`
Expected: FAIL with `Cannot find module '../../src/routes/sermonSeriesRoutes'`.

- [ ] **Step 3: Add the model functions**

In `backend/src/models/sermonSeriesModel.js`:

a. Add this after the `toSnakeCaseObject` import:

```js
const { mapSermon, sermonInclude } = require('./sermonModel');
```

b. Add this before `module.exports`:

```js
// Newest series first; series without a start date go last.
const listSeries = async () => {
  const rows = await prisma.sermonSeries.findMany({
    orderBy: [{ startDate: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    include: withSermonCount,
  });

  return rows.map(mapSeries);
};

// A series and its sermons, oldest first (the order they were preached).
const getSeriesWithSermons = async (seriesId) => {
  const series = await prisma.sermonSeries.findUnique({
    where: { id: Number(seriesId) },
    include: {
      ...withSermonCount,
      sermons: { orderBy: { sermonDate: 'asc' }, include: sermonInclude },
    },
  });

  if (!series) {
    return undefined;
  }

  return { ...mapSeries(series), sermons: series.sermons.map(mapSermon) };
};
```

c. Add `listSeries,` and `getSeriesWithSermons,` to `module.exports`.

- [ ] **Step 4: Create the controller (public handlers)**

Create `backend/src/controllers/sermonSeriesController.js`:

```js
const { apiResponse, parseId } = require('../utils/helpers');
const sermonSeriesModel = require('../models/sermonSeriesModel');

/**
 * Sermon Series Controller
 */

const notFound = (res) => res.status(404).json(apiResponse(false, null, 'Sermon series not found'));

// List series (public)
const listSeries = async (req, res, next) => {
  try {
    const series = await sermonSeriesModel.listSeries();
    res.json(apiResponse(true, series, 'Sermon series retrieved'));
  } catch (error) {
    next(error);
  }
};

// Get one series with its sermons (public)
const getSeries = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const series = id ? await sermonSeriesModel.getSeriesWithSermons(id) : undefined;

    if (!series) {
      return notFound(res);
    }

    res.json(apiResponse(true, series, 'Sermon series retrieved'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSeries,
  getSeries,
};
```

- [ ] **Step 5: Create the public routes and mount them**

Create `backend/src/routes/sermonSeriesRoutes.js`:

```js
const express = require('express');
const sermonSeriesController = require('../controllers/sermonSeriesController');

const router = express.Router();

// Public sermon series
router.get('/', sermonSeriesController.listSeries);
router.get('/:id', sermonSeriesController.getSeries);

module.exports = router;
```

In `backend/src/server.js`:
- Add `const sermonSeriesRoutes = require('./routes/sermonSeriesRoutes');` after the `sermonRoutes` import.
- Add `app.use('/api/sermon-series', sermonSeriesRoutes);` directly after `app.use('/api/sermons', sermonRoutes);`.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd backend && npx jest tests/api/sermonSeries.test.js --coverage=false`
Expected: PASS (8 linking, 4 public, and 1 mounting test).

- [ ] **Step 7: Commit**

```bash
git add backend/src/models/sermonSeriesModel.js backend/src/controllers/sermonSeriesController.js backend/src/routes/sermonSeriesRoutes.js backend/src/server.js backend/tests/api/sermonSeries.test.js
git commit -m "feat: add public sermon series API

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Admin series API (CRUD, cover upload, audit)

**Files:**
- Modify: `backend/src/models/sermonSeriesModel.js` (add `createSeries`, `updateSeries`, `deleteSeries`)
- Modify: `backend/src/controllers/sermonSeriesController.js` (add the admin handlers)
- Create: `backend/src/routes/adminSermonSeriesRoutes.js`
- Modify: `backend/src/middleware/validators.js` (`validateSermonSeries`)
- Modify: `backend/src/middleware/uploadMiddleware.js` (`seriesImageUpload`)
- Modify: `backend/src/server.js`
- Test: `backend/tests/api/sermonSeries.test.js` (add a `describe` block)

**Interfaces:**
- Consumes: `getSeriesById` and `mapSeries` (Task 2), `parseId` (Task 1), `auditLogModel.createAuditLog`, `mediaAssetModel.createMediaAsset`.
- Produces:
  - `sermonSeriesModel.createSeries(input) → Series`. It rejects with Prisma `P2002` when the title already exists.
  - `sermonSeriesModel.updateSeries(id, input) → Series | undefined`
  - `sermonSeriesModel.deleteSeries(id) → { id } | undefined`
  - Admin endpoints:
    - `GET /api/admin/sermon-series`
    - `POST /api/admin/sermon-series`
    - `PUT /api/admin/sermon-series/:id`
    - `DELETE /api/admin/sermon-series/:id`
    - `POST /api/admin/sermon-series/upload-image` (field `image`) → `{ data: { url } }`
  - `input` is `{ title, description?, coverImageUrl?, startDate?, endDate? }`. Empty strings mean "clear".

- [ ] **Step 1: Write the failing tests**

In `backend/tests/api/sermonSeries.test.js`:

a. At the top of the file, add these after the existing `require` lines:

```js
const fs = require('fs');
const path = require('path');
```

b. In `buildApp`, add this after the public series line:

```js
  app.use('/api/admin/sermon-series', require('../../src/routes/adminSermonSeriesRoutes'));
```

c. Append this block:

```js
describe('Admin sermon series API', () => {
  let models;
  let app;
  const validSeries = { title: 'Romans', description: 'Verse by verse', startDate: '2026-09-01', endDate: '2026-11-30' };

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('members cannot manage series', async () => {
    const response = await request(app)
      .post('/api/admin/sermon-series')
      .set('Authorization', `Bearer ${tokenFor(7)}`)
      .send(validSeries);

    expect(response.status).toBe(403);
    expect(models.sermonSeriesModel.createSeries).not.toHaveBeenCalled();
  });

  test('an admin creates a series and it is audited', async () => {
    const response = await request(app).post('/api/admin/sermon-series').set('Authorization', admin()).send(validSeries);

    expect(response.status).toBe(201);
    expect(models.sermonSeriesModel.createSeries).toHaveBeenCalledWith(expect.objectContaining({ title: 'Romans' }));
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'sermon_series', action: 'create', entityId: 3, actorUserId: 1 })
    );
  });

  test('a missing title is rejected', async () => {
    const response = await request(app)
      .post('/api/admin/sermon-series')
      .set('Authorization', admin())
      .send({ ...validSeries, title: '   ' });

    expect(response.status).toBe(400);
  });

  test('an end date before the start date is rejected', async () => {
    const response = await request(app)
      .post('/api/admin/sermon-series')
      .set('Authorization', admin())
      .send({ ...validSeries, startDate: '2026-11-30', endDate: '2026-09-01' });

    expect(response.status).toBe(400);
    expect(models.sermonSeriesModel.createSeries).not.toHaveBeenCalled();
  });

  test.each(['https://evil.example/x.png', 'javascript:alert(1)', '/uploads/profile-images/user-1.png', '/uploads/series-images/../x'])(
    'a cover image outside our series uploads is rejected: %s',
    async (coverImageUrl) => {
      const response = await request(app)
        .post('/api/admin/sermon-series')
        .set('Authorization', admin())
        .send({ ...validSeries, coverImageUrl });

      expect(response.status).toBe(400);
    }
  );

  test('an uploaded series cover is accepted', async () => {
    const response = await request(app)
      .post('/api/admin/sermon-series')
      .set('Authorization', admin())
      .send({ ...validSeries, coverImageUrl: '/uploads/series-images/series-1-123.png' });

    expect(response.status).toBe(201);
  });

  test('a duplicate title returns 409', async () => {
    models.sermonSeriesModel.createSeries.mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }));

    const response = await request(app).post('/api/admin/sermon-series').set('Authorization', admin()).send(validSeries);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('A series with this title already exists');
  });

  test('renaming to a duplicate title returns 409', async () => {
    models.sermonSeriesModel.updateSeries.mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }));

    const response = await request(app).put('/api/admin/sermon-series/3').set('Authorization', admin()).send(validSeries);

    expect(response.status).toBe(409);
  });

  test('updating a series is audited', async () => {
    const response = await request(app).put('/api/admin/sermon-series/3').set('Authorization', admin()).send(validSeries);

    expect(response.status).toBe(200);
    expect(models.sermonSeriesModel.updateSeries).toHaveBeenCalledWith(3, expect.objectContaining({ title: 'Romans' }));
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));
  });

  test('updating a missing series returns 404', async () => {
    models.sermonSeriesModel.updateSeries.mockResolvedValue(undefined);

    const response = await request(app).put('/api/admin/sermon-series/99').set('Authorization', admin()).send(validSeries);

    expect(response.status).toBe(404);
  });

  test('malformed ids return 404 without querying', async () => {
    const put = await request(app).put('/api/admin/sermon-series/1.5').set('Authorization', admin()).send(validSeries);
    const del = await request(app).delete('/api/admin/sermon-series/abc').set('Authorization', admin());

    expect(put.status).toBe(404);
    expect(del.status).toBe(404);
    expect(models.sermonSeriesModel.updateSeries).not.toHaveBeenCalled();
    expect(models.sermonSeriesModel.deleteSeries).not.toHaveBeenCalled();
  });

  test('deleting a series is audited', async () => {
    const response = await request(app).delete('/api/admin/sermon-series/3').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(models.sermonSeriesModel.deleteSeries).toHaveBeenCalledWith(3);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete' }));
  });

  test('deleting a missing series returns 404', async () => {
    models.sermonSeriesModel.deleteSeries.mockResolvedValue(undefined);

    const response = await request(app).delete('/api/admin/sermon-series/99').set('Authorization', admin());

    expect(response.status).toBe(404);
  });

  test('uploading without a file returns 400', async () => {
    const response = await request(app).post('/api/admin/sermon-series/upload-image').set('Authorization', admin());

    expect(response.status).toBe(400);
  });

  test('uploading a cover stores it under series-images and returns its url', async () => {
    const response = await request(app)
      .post('/api/admin/sermon-series/upload-image')
      .set('Authorization', admin())
      .attach('image', Buffer.from('fake-png-bytes'), { filename: 'cover.html', contentType: 'image/png' });

    expect(response.status).toBe(200);
    expect(response.body.data.url).toMatch(/^\/uploads\/series-images\/series-1-\d+\.png$/);
    fs.rmSync(path.join(__dirname, '..', '..', response.body.data.url), { force: true });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/api/sermonSeries.test.js --coverage=false`
Expected: FAIL with `Cannot find module '../../src/routes/adminSermonSeriesRoutes'`.

- [ ] **Step 3: Add the model write functions**

In `backend/src/models/sermonSeriesModel.js`, add this before `module.exports`:

```js
// Build Prisma data from API input. Empty strings clear optional fields.
const toSeriesData = (input = {}) => {
  const data = {};

  if (input.title !== undefined) data.title = String(input.title).trim();
  if (input.description !== undefined) data.description = input.description || null;
  if (input.coverImageUrl !== undefined) data.coverImageUrl = input.coverImageUrl || null;
  if (input.startDate !== undefined) data.startDate = input.startDate ? new Date(input.startDate) : null;
  if (input.endDate !== undefined) data.endDate = input.endDate ? new Date(input.endDate) : null;

  return data;
};

const createSeries = async (input) => {
  const series = await prisma.sermonSeries.create({
    data: toSeriesData(input),
    include: withSermonCount,
  });

  return mapSeries(series);
};

const updateSeries = async (seriesId, input) => {
  const id = Number(seriesId);
  const updated = await prisma.sermonSeries.updateMany({
    where: { id },
    data: toSeriesData(input),
  });

  if (updated.count === 0) {
    return undefined;
  }

  return getSeriesById(id);
};

// Sermons keep existing: the sermons.series_id foreign key is ON DELETE SET NULL.
const deleteSeries = async (seriesId) => {
  const id = Number(seriesId);
  const deleted = await prisma.sermonSeries.deleteMany({ where: { id } });

  return deleted.count === 0 ? undefined : { id };
};
```

Add `createSeries,`, `updateSeries,` and `deleteSeries,` to `module.exports`.

- [ ] **Step 4: Add the validator**

In `backend/src/middleware/validators.js`, add this after `validateSermonSeriesLink`:

```js
// Covers can only be files we stored ourselves under /uploads/series-images/.
const SERIES_COVER_PATTERN = /^\/uploads\/series-images\/[A-Za-z0-9_-]+\.(jpg|png|webp|gif)$/;

const validateSermonSeries = [
  body('title')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Series title is required')
    .isLength({ max: 255 })
    .withMessage('Series title must be 255 characters or fewer'),
  body('description').optional({ values: 'null' }).isString().withMessage('Description must be text'),
  body('coverImageUrl')
    .optional({ values: 'falsy' })
    .matches(SERIES_COVER_PATTERN)
    .withMessage('Cover image must be uploaded through the series image upload'),
  body('startDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid start date'),
  body('endDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Invalid end date')
    .bail()
    .custom((endDate, { req }) => !req.body.startDate || new Date(endDate) >= new Date(req.body.startDate))
    .withMessage('End date cannot be before the start date'),
];
```

Add `validateSermonSeries,` to `module.exports`.

- [ ] **Step 5: Add the upload middleware**

In `backend/src/middleware/uploadMiddleware.js`, add this after `newsImageUpload`:

```js
const seriesImageUpload = createImageUpload({
  directoryName: 'series-images',
  filePrefix: 'series',
});
```

Add `seriesImageUpload,` to `module.exports`.

- [ ] **Step 6: Add the admin handlers**

In `backend/src/controllers/sermonSeriesController.js`:

a. Replace the imports with:

```js
const { apiResponse, parseId } = require('../utils/helpers');
const sermonSeriesModel = require('../models/sermonSeriesModel');
const auditLogModel = require('../models/auditLogModel');
const mediaAssetModel = require('../models/mediaAssetModel');
```

b. Add this before `module.exports`:

```js
const DUPLICATE_TITLE = 'A series with this title already exists';
const isDuplicateTitle = (error) => error?.code === 'P2002';

const pickSeriesInput = (body) => ({
  title: body.title,
  description: body.description,
  coverImageUrl: body.coverImageUrl,
  startDate: body.startDate,
  endDate: body.endDate,
});

const audit = (req, action, entityId, summary, metadata = {}) =>
  auditLogModel.createAuditLog({
    actorUserId: req.user.userId,
    entityType: 'sermon_series',
    entityId,
    action,
    summary,
    metadata,
  });

// Create series (admin)
const createSeries = async (req, res, next) => {
  try {
    const series = await sermonSeriesModel.createSeries(pickSeriesInput(req.body));
    await audit(req, 'create', series.id, `Created sermon series "${series.title}"`);
    res.status(201).json(apiResponse(true, series, 'Sermon series created'));
  } catch (error) {
    if (isDuplicateTitle(error)) {
      return res.status(409).json(apiResponse(false, null, DUPLICATE_TITLE));
    }
    next(error);
  }
};

// Update series (admin)
const updateSeries = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const series = id ? await sermonSeriesModel.updateSeries(id, pickSeriesInput(req.body)) : undefined;

    if (!series) {
      return notFound(res);
    }

    await audit(req, 'update', id, `Updated sermon series "${series.title}"`);
    res.json(apiResponse(true, series, 'Sermon series updated'));
  } catch (error) {
    if (isDuplicateTitle(error)) {
      return res.status(409).json(apiResponse(false, null, DUPLICATE_TITLE));
    }
    next(error);
  }
};

// Delete series (admin). Its sermons stay, without a series.
const deleteSeries = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const result = id ? await sermonSeriesModel.deleteSeries(id) : undefined;

    if (!result) {
      return notFound(res);
    }

    await audit(req, 'delete', id, `Deleted sermon series #${id}`);
    res.json(apiResponse(true, null, 'Sermon series deleted'));
  } catch (error) {
    next(error);
  }
};

// Upload a series cover image (admin)
const uploadSeriesImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(apiResponse(false, null, 'No image uploaded'));
    }

    const url = `/uploads/series-images/${req.file.filename}`;
    const asset = await mediaAssetModel.createMediaAsset({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      url,
      uploadedBy: req.user.userId,
    });

    await audit(req, 'upload', asset.id, `Uploaded sermon series cover "${req.file.originalname}"`, { url });
    res.json(apiResponse(true, { url }, 'Series image uploaded'));
  } catch (error) {
    next(error);
  }
};
```

c. Replace `module.exports` with:

```js
module.exports = {
  listSeries,
  getSeries,
  createSeries,
  updateSeries,
  deleteSeries,
  uploadSeriesImage,
};
```

- [ ] **Step 7: Create the admin routes and mount them**

Create `backend/src/routes/adminSermonSeriesRoutes.js`:

```js
const express = require('express');
const sermonSeriesController = require('../controllers/sermonSeriesController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { handleValidationErrors, validateSermonSeries } = require('../middleware/validators');
const { seriesImageUpload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', sermonSeriesController.listSeries);
router.post('/upload-image', seriesImageUpload.single('image'), sermonSeriesController.uploadSeriesImage);
router.post('/', validateSermonSeries, handleValidationErrors, sermonSeriesController.createSeries);
router.put('/:id', validateSermonSeries, handleValidationErrors, sermonSeriesController.updateSeries);
router.delete('/:id', sermonSeriesController.deleteSeries);

module.exports = router;
```

In `backend/src/server.js`:
- Add `const adminSermonSeriesRoutes = require('./routes/adminSermonSeriesRoutes');` after the `adminSermonRoutes` import.
- Add `app.use('/api/admin/sermon-series', adminSermonSeriesRoutes);` directly after `app.use('/api/admin/sermons', adminSermonRoutes);`.

- [ ] **Step 8: Run the full suite and lint**

Run: `cd backend && npx jest --runInBand --coverage=false && npx eslint src/ tests/`
Expected: all suites pass (Phase 1's 60, plus 14 parseId, 2 mapper, and 31 series tests: 107 in total; the series tests are 8 linking, 4 public, 1 mounting and 18 admin), and there's no lint output.

- [ ] **Step 9: Commit**

```bash
git add backend/src/models/sermonSeriesModel.js backend/src/controllers/sermonSeriesController.js backend/src/routes/adminSermonSeriesRoutes.js backend/src/middleware/validators.js backend/src/middleware/uploadMiddleware.js backend/src/server.js backend/tests/api/sermonSeries.test.js
git commit -m "feat: add admin sermon series management API with cover upload

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Web — browsing series (member side)

**Files:**
- Modify: `frontend/src/lib/utils.ts` (add `formatDateOnly`)
- Modify: `frontend/src/hooks/useApi.ts` (add after `useRecentSermons`)
- Modify: `frontend/src/app/sermons/page.tsx`
- Create: `frontend/src/app/sermons/series/[id]/page.tsx`

**Interfaces:**
- Consumes: `GET /api/sermon-series` and `GET /api/sermon-series/:id` (Task 3).
- Produces:
  - `formatDateOnly(value?: string | null) → string`, formatted in UTC; `''` for empty input.
  - `export type SermonSeriesSummary`, `export type SermonSeriesDetail`
  - `useSermonSeriesList()`, `useSermonSeries(id?: number)`

The frontend has no test runner. Verification is type-check, lint, and build.

- [ ] **Step 1: Add the date helper**

In `frontend/src/lib/utils.ts`, add this after `formatDateTime`:

```ts
// Date-only values (e.g. series start/end) arrive as midnight UTC; format in UTC
// so viewers west of Greenwich don't see the previous day.
export const formatDateOnly = (value?: string | null): string => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
};
```

- [ ] **Step 2: Add the hooks**

In `frontend/src/hooks/useApi.ts`, add this directly after `useRecentSermons`:

```ts
export type SermonSeriesSummary = {
  id: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  sermon_count: number;
};

export type SermonSeriesDetail = SermonSeriesSummary & {
  sermons: Array<{
    id: number;
    title: string;
    speaker: string;
    sermon_date: string;
    description?: string;
  }>;
};

export const useSermonSeriesList = () =>
  useQuery({
    queryKey: ['sermon-series'],
    queryFn: async (): Promise<SermonSeriesSummary[]> => {
      const response = await apiClient.get('/sermon-series');
      return response.data?.data ?? [];
    },
  });

export const useSermonSeries = (id?: number) =>
  useQuery({
    queryKey: ['sermon-series', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<SermonSeriesDetail> => {
      const response = await apiClient.get(`/sermon-series/${id}`);
      return response.data?.data;
    },
  });
```

- [ ] **Step 3: Add the series strip to `/sermons`**

In `frontend/src/app/sermons/page.tsx`:

a. Change the imports to:

```tsx
import { BookOpen, Clock, Layers, Play, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSermons, useSermonSeriesList } from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';
```

b. After `const sermons = (data?.data ?? []) as any[];`, add:

```tsx
  const { data: seriesList } = useSermonSeriesList();
```

c. Directly after the closing `</div>` of the `mb-8` header block, add:

```tsx
      {seriesList && seriesList.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
            <Layers className="h-5 w-5" /> Series
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {seriesList.map((series) => (
              <Link
                key={series.id}
                href={`/sermons/series/${series.id}`}
                className="min-w-[14rem] max-w-[16rem] shrink-0 rounded-[1.2rem] border border-slate-200 bg-white p-4 transition-colors hover:border-sky-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-cyan-500/40"
              >
                <p className="line-clamp-2 font-bold text-slate-950 dark:text-white">{series.title}</p>
                <p className="mt-1 text-xs text-ui-subtle">
                  {series.sermon_count} {series.sermon_count === 1 ? 'sermon' : 'sermons'}
                  {series.start_date ? ` · from ${formatDateOnly(series.start_date)}` : ''}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
```

d. In the sermon card, replace the `<p ...>Sermon</p>` label text `Sermon` with `{sermon.series_title || 'Sermon'}`.

- [ ] **Step 4: Create the series page**

Create `frontend/src/app/sermons/series/[id]/page.tsx`:

```tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Play } from 'lucide-react';
import { useSermonSeries } from '@/hooks/useApi';
import { formatDateOnly, resolveAssetUrl } from '@/lib/utils';

export default function SermonSeriesPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const validId = Number.isInteger(id) && id > 0 ? id : undefined;
  const { data: series, isLoading, error } = useSermonSeries(validId);

  const dateRange = series
    ? [formatDateOnly(series.start_date), formatDateOnly(series.end_date)].filter(Boolean).join(' – ')
    : '';

  return (
    <div className="container-max space-y-8 py-10">
      <Link href="/sermons" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-cyan-300">
        <ArrowLeft className="h-4 w-4" /> All sermons
      </Link>

      {!validId || error ? (
        <p className="text-ui-subtle">This series could not be found.</p>
      ) : isLoading || !series ? (
        <p className="text-ui-subtle">Loading series...</p>
      ) : (
        <>
          <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {series.cover_image_url && (
              <Image
                src={resolveAssetUrl(series.cover_image_url)}
                alt={series.title}
                width={240}
                height={135}
                unoptimized
                className="h-auto w-full max-w-[240px] rounded-[1.2rem] object-cover"
              />
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-cyan-300">
                Sermon series
              </p>
              <h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{series.title}</h1>
              {dateRange && <p className="mt-1 text-sm text-ui-subtle">{dateRange}</p>}
              {series.description && (
                <p className="mt-3 max-w-2xl whitespace-pre-line text-slate-700 dark:text-slate-300">
                  {series.description}
                </p>
              )}
            </div>
          </header>

          {series.sermons.length === 0 ? (
            <p className="text-ui-subtle">No sermons in this series yet.</p>
          ) : (
            <ol className="space-y-3">
              {series.sermons.map((sermon, index) => (
                <li key={sermon.id}>
                  <Link
                    href={`/sermons/${sermon.id}`}
                    className="flex items-center gap-4 rounded-[1.2rem] border border-slate-200 bg-white p-4 transition-colors hover:border-sky-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-cyan-500/40"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-800 dark:bg-cyan-950 dark:text-cyan-200">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-950 dark:text-white">{sermon.title}</p>
                      <p className="text-sm text-ui-subtle">
                        {sermon.speaker} · {formatDateOnly(sermon.sermon_date)}
                      </p>
                    </div>
                    <Play className="h-5 w-5 shrink-0 text-sky-700 dark:text-cyan-300" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Type-check, lint, and build**

Run: `cd frontend && npm run -s type-check && npm run -s lint && npm run -s build`
Expected: no output from type-check or lint, and the build lists `ƒ /sermons/series/[id]`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/utils.ts frontend/src/hooks/useApi.ts frontend/src/app/sermons/page.tsx "frontend/src/app/sermons/series/[id]/page.tsx"
git commit -m "feat(web): browse sermon series

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Web — admin series management and the sermon form picker

**Files:**
- Modify: `frontend/src/hooks/useApi.ts` (add these after `useDeleteSermon`)
- Create: `frontend/src/app/admin/series/page.tsx`
- Modify: `frontend/src/app/admin/sermons/new/page.tsx`
- Modify: `frontend/src/app/admin/sermons/[id]/edit/page.tsx`
- Modify: `frontend/src/components/layout/AdminSidebar.tsx`

**Interfaces:**
- Consumes: the admin endpoints (Task 4), `useSermonSeriesList` and `formatDateOnly` (Task 5), `ConfirmDialog` (`frontend/src/components/ui/confirm-dialog.tsx`).
- Produces:
  - `SeriesInput = { title: string; description: string; coverImageUrl: string; startDate: string; endDate: string }`
  - `useSaveSermonSeries()`, a mutation taking `{ id?: number; input: SeriesInput }`. It POSTs when there's no `id` and PUTs otherwise.
  - `useDeleteSermonSeries()`, a mutation taking `number`.
  - `useUploadSeriesCover()`, a mutation taking a `File` and returning `{ url: string }`.

- [ ] **Step 1: Add the admin hooks**

In `frontend/src/hooks/useApi.ts`, add this directly after `useDeleteSermon`:

```ts
export type SeriesInput = {
  title: string;
  description: string;
  coverImageUrl: string;
  startDate: string;
  endDate: string;
};

const invalidateSeries = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['sermon-series'] });
  qc.invalidateQueries({ queryKey: ['sermons'] });
  qc.invalidateQueries({ queryKey: ['admin', 'sermons'] });
};

export const useSaveSermonSeries = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: SeriesInput }) => {
      const response = id
        ? await apiClient.put(`/admin/sermon-series/${id}`, input)
        : await apiClient.post('/admin/sermon-series', input);
      return response.data?.data;
    },
    onSuccess: (_data, { id }) => {
      invalidateSeries(qc);
      toast.success(id ? 'Series updated' : 'Series created');
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not save the series')),
  });
};

export const useDeleteSermonSeries = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/sermon-series/${id}`);
    },
    onSuccess: () => {
      invalidateSeries(qc);
      toast.success('Series deleted');
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not delete the series')),
  });
};

export const useUploadSeriesCover = () =>
  useMutation({
    mutationFn: async (file: File): Promise<{ url: string }> => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await apiClient.post('/admin/sermon-series/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not upload the image')),
  });
```

- [ ] **Step 2: Create the admin series page**

Create `frontend/src/app/admin/series/page.tsx`:

```tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useDeleteSermonSeries,
  useSaveSermonSeries,
  useSermonSeriesList,
  useUploadSeriesCover,
  type SeriesInput,
  type SermonSeriesSummary,
} from '@/hooks/useApi';
import { formatDateOnly, resolveAssetUrl } from '@/lib/utils';

const EMPTY: SeriesInput = { title: '', description: '', coverImageUrl: '', startDate: '', endDate: '' };

// Date inputs need YYYY-MM-DD; the API sends ISO timestamps at midnight UTC.
const toDateInput = (value: string | null) => (value ? value.slice(0, 10) : '');

export default function AdminSeriesPage() {
  const { data: seriesList, isLoading } = useSermonSeriesList();
  const save = useSaveSermonSeries();
  const remove = useDeleteSermonSeries();
  const upload = useUploadSeriesCover();

  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [form, setForm] = React.useState<SeriesInput>(EMPTY);
  const [pendingDelete, setPendingDelete] = React.useState<SermonSeriesSummary | null>(null);

  const set = (field: keyof SeriesInput) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const startEdit = (series: SermonSeriesSummary) => {
    setEditingId(series.id);
    setForm({
      title: series.title,
      description: series.description || '',
      coverImageUrl: series.cover_image_url || '',
      startDate: toDateInput(series.start_date),
      endDate: toDateInput(series.end_date),
    });
  };

  const resetForm = () => {
    setEditingId(undefined);
    setForm(EMPTY);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    save.mutate({ id: editingId, input: form }, { onSuccess: resetForm });
  };

  const onCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    upload.mutate(file, {
      onSuccess: ({ url }) => setForm((current) => ({ ...current, coverImageUrl: url })),
    });
    event.target.value = '';
  };

  return (
    <div className="container-max space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Sermon Series</h1>
        <p className="mt-2 text-sm text-ui-subtle">
          Group sermons into series. Deleting a series keeps its sermons; they just lose the series label.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{editingId ? 'Edit series' : 'New series'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="series-title">Title</Label>
              <Input id="series-title" value={form.title} onChange={set('title')} required maxLength={255} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="series-description">Description</Label>
              <Textarea id="series-description" rows={3} value={form.description} onChange={set('description')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="series-start">Start date</Label>
              <Input id="series-start" type="date" value={form.startDate} onChange={set('startDate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="series-end">End date</Label>
              <Input id="series-end" type="date" value={form.endDate} min={form.startDate || undefined} onChange={set('endDate')} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="series-cover">Cover image</Label>
              <div className="flex flex-wrap items-center gap-3">
                {form.coverImageUrl && (
                  <Image
                    src={resolveAssetUrl(form.coverImageUrl)}
                    alt="Series cover"
                    width={120}
                    height={68}
                    unoptimized
                    className="h-auto w-[120px] rounded-lg object-cover"
                  />
                )}
                <Input
                  id="series-cover"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={onCoverChange}
                  disabled={upload.isPending}
                  className="max-w-xs"
                />
                {form.coverImageUrl && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm((c) => ({ ...c, coverImageUrl: '' }))}>
                    Remove cover
                  </Button>
                )}
              </div>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" disabled={save.isPending || upload.isPending}>
                {editingId ? 'Save changes' : 'Create series'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-ui-subtle">Loading series...</p>
      ) : !seriesList || seriesList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-ui-subtle">No series yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {seriesList.map((series) => (
            <Card key={series.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{series.title}</p>
                  <p className="text-xs text-ui-subtle">
                    {series.sermon_count} {series.sermon_count === 1 ? 'sermon' : 'sermons'}
                    {series.start_date ? ` · ${formatDateOnly(series.start_date)}` : ''}
                    {series.end_date ? ` – ${formatDateOnly(series.end_date)}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(series)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPendingDelete(series)} disabled={remove.isPending}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete "${pendingDelete.title}"?`}
          description={`Its ${pendingDelete.sermon_count} sermon(s) will stay in the library without a series.`}
          confirmLabel="Delete series"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            remove.mutate(pendingDelete.id);
            if (editingId === pendingDelete.id) resetForm();
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add the series picker to the new-sermon form**

In `frontend/src/app/admin/sermons/new/page.tsx`:

a. Add `import { useSermonSeriesList } from '@/hooks/useApi';` after the `apiClient` import.

b. Add `seriesId: string;` to `type SermonForm`.

c. Add `seriesId: '',` to `defaultValues`.

d. Add `const { data: seriesList } = useSermonSeriesList();` after `const router = useRouter();`.

e. Replace `await apiClient.post('/admin/sermons', data);` with:

```tsx
      await apiClient.post('/admin/sermons', {
        ...data,
        seriesId: data.seriesId ? Number(data.seriesId) : null,
      });
```

f. Add this after the Ministry ID field `<div>`:

```tsx
            <div className="space-y-2">
              <Label htmlFor="sermon-series">Series</Label>
              <select
                id="sermon-series"
                {...register('seriesId')}
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">No series</option>
                {(seriesList ?? []).map((series) => (
                  <option key={series.id} value={String(series.id)}>
                    {series.title}
                  </option>
                ))}
              </select>
            </div>
```

- [ ] **Step 4: Add the series picker to the edit-sermon form**

In `frontend/src/app/admin/sermons/[id]/edit/page.tsx`:

a. Add `import { useSermonSeriesList } from '@/hooks/useApi';` after the `apiClient` import.

b. Add `seriesId?: string;` to `type SermonForm`.

c. Add `const { data: seriesList } = useSermonSeriesList();` after `const router = useRouter();`.

d. In the `reset({...})` call, add `seriesId: res.data.data?.series_id ? String(res.data.data.series_id) : '',` after the `ministryId` line.

e. Replace `await apiClient.put(`/admin/sermons/${id}`, vals);` with:

```tsx
      await apiClient.put(`/admin/sermons/${id}`, {
        ...vals,
        seriesId: vals.seriesId ? Number(vals.seriesId) : null,
      });
```

f. Add the same picker block as Step 3f after the Ministry ID field, with `id="edit-sermon-series"` and `htmlFor="edit-sermon-series"`:

```tsx
            <div className="space-y-2">
              <Label htmlFor="edit-sermon-series">Series</Label>
              <select
                id="edit-sermon-series"
                {...register('seriesId')}
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">No series</option>
                {(seriesList ?? []).map((series) => (
                  <option key={series.id} value={String(series.id)}>
                    {series.title}
                  </option>
                ))}
              </select>
            </div>
```

- [ ] **Step 5: Add the sidebar link**

In `frontend/src/components/layout/AdminSidebar.tsx`:
- Add `Layers,` to the lucide import, in alphabetical order after `Home,`.
- Add this after the Sermons entry in `navItems`:

```ts
  { href: '/admin/series', label: 'Sermon Series', icon: Layers },
```

- [ ] **Step 6: Type-check, lint, and build**

Run: `cd frontend && npm run -s type-check && npm run -s lint && npm run -s build`
Expected: no type or lint output, and the build lists `○ /admin/series`.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/hooks/useApi.ts frontend/src/app/admin/series frontend/src/app/admin/sermons frontend/src/components/layout/AdminSidebar.tsx
git commit -m "feat(web): admin sermon series management and series picker on sermon forms

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Mobile — Series Manager, sermon series picker, working series pills

**Files:**
- Modify: `mobile/src/hooks/use-api.ts`
- Rewrite: `mobile/src/app/admin-series.tsx`
- Modify: `mobile/src/app/admin-sermons/[id].tsx`
- Modify: `mobile/src/screens/SermonsScreen.tsx`

**Interfaces:**
- Consumes: the public and admin series endpoints (Tasks 3–4), and `GET /api/sermons?series_id=` (Task 2).
- Produces:
  - `export type SermonSeriesSummary`
  - `useSermonSeriesList(enabled?)`
  - `useSermons(page, limit, enabled, seriesId?)`
  - `useSaveSermonSeries()`, a mutation taking `{ id?: number; input: SeriesInput }`
  - `useDeleteSermonSeries()`, a mutation taking `number`
  - `AdminSermonPayload.seriesId?: number | null`

Mobile adds no cover upload. Covers are managed on the web admin page, and a mobile edit leaves an existing cover unchanged.

- [ ] **Step 1: Record the baseline**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo baseline-ok`
Expected: `baseline-ok`. If there are errors, record them so you only fix errors this task introduces.

- [ ] **Step 2: Update the hooks**

In `mobile/src/hooks/use-api.ts`:

a. In `type AdminSermonPayload`, add `seriesId?: number | null;` after `ministryId: number;`.

b. Replace `useSermons` with:

```ts
export const useSermons = (page = 1, limit = 12, enabled = true, seriesId?: number) =>
  useQuery({
    queryKey: ['sermons', page, limit, seriesId ?? 'all'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/sermons', {
        params: { page, limit, ...(seriesId ? { series_id: seriesId } : {}) },
      });
      return response.data?.data || [];
    },
  });
```

This is the existing `useSermons` with only the `seriesId` parts added. The existing callers (`useSermons()`, `useSermons(1, 1)`) keep working unchanged.

c. Add this after `useDeleteAdminSermon`:

```ts
export type SermonSeriesSummary = {
  id: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  sermon_count: number;
};

export type SeriesInput = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
};

export const useSermonSeriesList = (enabled = true) =>
  useQuery({
    queryKey: ['sermon-series'],
    enabled,
    queryFn: async (): Promise<SermonSeriesSummary[]> => {
      const response = await apiClient.get('/sermon-series');
      return response.data?.data || [];
    },
  });

const invalidateSeries = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ['sermon-series'] }),
    queryClient.invalidateQueries({ queryKey: ['sermons'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'sermons'] }),
  ]);

export const useSaveSermonSeries = () =>
  useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: SeriesInput }) => {
      const response = id
        ? await apiClient.put(`/admin/sermon-series/${id}`, input)
        : await apiClient.post('/admin/sermon-series', input);
      return response.data?.data;
    },
    onSuccess: invalidateSeries,
  });

export const useDeleteSermonSeries = () =>
  useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/sermon-series/${id}`);
    },
    onSuccess: invalidateSeries,
  });
```

Note that mobile's `SeriesInput` has no `coverImageUrl`. The API only changes fields that are present, so a mobile edit keeps an existing cover.

- [ ] **Step 3: Rewrite the Series Manager**

Replace the whole of `mobile/src/app/admin-series.tsx` with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandButton, BrandCard, BrandPill } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  getApiErrorMessage,
  useDeleteSermonSeries,
  useSaveSermonSeries,
  useSermonSeriesList,
  type SeriesInput,
  type SermonSeriesSummary,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

const EMPTY: SeriesInput = { title: '', description: '', startDate: '', endDate: '' };
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Date-only values arrive as midnight UTC; show them in UTC so they don't shift a day.
const formatDateOnly = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { timeZone: 'UTC' }) : '';

export default function AdminSeriesScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const seriesQuery = useSermonSeriesList(isAdmin);
  const saveMutation = useSaveSermonSeries();
  const deleteMutation = useDeleteSermonSeries();
  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [form, setForm] = React.useState<SeriesInput>(EMPTY);

  if (!user || !isAdmin) return null;

  const seriesList = Array.isArray(seriesQuery.data) ? seriesQuery.data : [];

  const setField = (field: keyof SeriesInput) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const resetForm = () => {
    setEditingId(undefined);
    setForm(EMPTY);
  };

  const startEdit = (series: SermonSeriesSummary) => {
    setEditingId(series.id);
    setForm({
      title: series.title,
      description: series.description || '',
      startDate: series.start_date ? series.start_date.slice(0, 10) : '',
      endDate: series.end_date ? series.end_date.slice(0, 10) : '',
    });
  };

  const onSave = () => {
    if (!form.title.trim()) {
      Alert.alert('Title required', 'Give the series a title.');
      return;
    }
    const badDate = [form.startDate, form.endDate].find((value) => value && !DATE_PATTERN.test(value));
    if (badDate) {
      Alert.alert('Check the dates', 'Use the format YYYY-MM-DD, for example 2026-09-01.');
      return;
    }
    saveMutation.mutate(
      { id: editingId, input: form },
      {
        onSuccess: resetForm,
        onError: (error) => Alert.alert('Could not save', getApiErrorMessage(error, 'Please try again.')),
      }
    );
  };

  const confirmDelete = (series: SermonSeriesSummary) =>
    Alert.alert(
      `Delete "${series.title}"?`,
      `Its ${series.sermon_count} sermon(s) will stay in the library without a series.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteMutation.mutate(series.id, {
              onSuccess: () => {
                if (editingId === series.id) resetForm();
              },
              onError: (error) => Alert.alert('Could not delete', getApiErrorMessage(error, 'Please try again.')),
            }),
        },
      ]
    );

  const input = (field: keyof SeriesInput, placeholder: string, multiline = false) => (
    <TextInput
      value={form[field]}
      onChangeText={setField(field)}
      placeholder={placeholder}
      placeholderTextColor={theme.textSecondary}
      multiline={multiline}
      style={[
        styles.input,
        multiline && styles.multiline,
        { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
      ]}
    />
  );

  return (
    <AdminShell activeTab="/admin-sermons">
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#C084FC', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Series Manager</ThemedText>
        </View>
      </View>

      <BrandCard>
        <ThemedText type="defaultSemiBold">{editingId ? 'Edit series' : 'New series'}</ThemedText>
        {input('title', 'Series title')}
        {input('description', 'Description (optional)', true)}
        {input('startDate', 'Start date YYYY-MM-DD (optional)')}
        {input('endDate', 'End date YYYY-MM-DD (optional)')}
        <BrandButton label={editingId ? 'Save changes' : 'Create series'} onPress={onSave} variant="secondary" />
        {editingId ? <BrandButton label="Cancel" onPress={resetForm} variant="outline" /> : null}
      </BrandCard>

      {seriesQuery.isError ? (
        <BrandCard>
          <ThemedText type="small">Could not load series.</ThemedText>
          <BrandButton label="Try again" onPress={() => seriesQuery.refetch()} />
        </BrandCard>
      ) : seriesList.length === 0 && !seriesQuery.isLoading ? (
        <BrandCard>
          <ThemedText type="small" themeColor="textSecondary">
            No series yet. Create one above, then choose it on a sermon.
          </ThemedText>
        </BrandCard>
      ) : (
        seriesList.map((series) => (
          <BrandCard key={series.id}>
            <View style={styles.seriesRow}>
              <ThemedText type="defaultSemiBold" style={styles.seriesTitle}>
                {series.title}
              </ThemedText>
              <BrandPill>{`${series.sermon_count} sermons`}</BrandPill>
            </View>
            {series.start_date ? (
              <ThemedText type="small" themeColor="textSecondary">
                {formatDateOnly(series.start_date)}
                {series.end_date ? ` – ${formatDateOnly(series.end_date)}` : ''}
              </ThemedText>
            ) : null}
            <View style={styles.actions}>
              <BrandButton label="Edit" onPress={() => startEdit(series)} variant="outline" />
              <BrandButton label="Delete" onPress={() => confirmDelete(series)} variant="outline" />
            </View>
          </BrandCard>
        ))
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  seriesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  seriesTitle: { flex: 1 },
  actions: { flexDirection: 'row', gap: Spacing.two },
});
```

(`getApiErrorMessage(error, fallback)` is already exported from `mobile/src/hooks/use-api.ts`.)

- [ ] **Step 4: Add the series picker to mobile sermon edit**

In `mobile/src/app/admin-sermons/[id].tsx`:

a. Add `useSermonSeriesList` to the `@/hooks/use-api` import. Add `Pressable` to the `react-native` import.

b. Add `seriesId: string;` to `type SermonFormValues`, and `seriesId: ''` to the `defaultValues` object.

c. Add this after the `ministriesQuery` line:

```tsx
  const seriesQuery = useSermonSeriesList(isAdmin);
  const theme = useTheme();
```

d. In the `reset({...})` call, add:

```tsx
        seriesId: sermon.series_id ? String(sermon.series_id) : '',
```

e. Change the `useForm` destructure to also take `watch` and `setValue`: `const { control, handleSubmit, reset, watch, setValue } = useForm<SermonFormValues>({`. Then, after the `useForm` call, add `const selectedSeriesId = watch('seriesId');`.

f. In `onSubmit`'s `payload`, add `seriesId: values.seriesId ? Number(values.seriesId) : null,` after `ministryId`.

g. Add this directly after the "Available ministries" block (`{ministriesQuery.data?.length ? (...) : null}`):

```tsx
            <View style={styles.field}>
              <ThemedText type="smallBold">Series</ThemedText>
              <View style={styles.chips}>
                {[{ id: '', title: 'No series' }, ...(seriesQuery.data || []).map((s) => ({ id: String(s.id), title: s.title }))].map(
                  (option) => {
                    const active = selectedSeriesId === option.id;
                    return (
                      <Pressable key={option.id || 'none'} onPress={() => setValue('seriesId', option.id)}>
                        <View
                          style={[
                            styles.chip,
                            { backgroundColor: active ? theme.tint : theme.background, borderColor: active ? theme.tint : theme.border },
                          ]}>
                          <ThemedText type="smallBold" style={{ color: active ? theme.white : theme.text }}>
                            {option.title}
                          </ThemedText>
                        </View>
                      </Pressable>
                    );
                  }
                )}
              </View>
            </View>
```

h. Add these to the `styles` object:

```tsx
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
```

- [ ] **Step 5: Make the Sermons tab series pills work**

In `mobile/src/screens/SermonsScreen.tsx`:

a. Change the hooks import to `import { useSermons, useSermonSeriesList } from '@/hooks/use-api';`.

b. Replace these three lines:

```tsx
  const sermonsQuery = useSermons();
  const sermons = Array.isArray(sermonsQuery.data) ? sermonsQuery.data : [];
  const series = ['All', ...Array.from(new Set(sermons.map((item: any) => item?.series).filter(Boolean))).slice(0, 4)];
```

with:

```tsx
  const [selectedSeriesId, setSelectedSeriesId] = React.useState<number | undefined>();
  const sermonsQuery = useSermons(1, 12, true, selectedSeriesId);
  const seriesQuery = useSermonSeriesList();
  const sermons = Array.isArray(sermonsQuery.data) ? sermonsQuery.data : [];
  const seriesOptions = [
    { id: undefined as number | undefined, title: 'All' },
    ...(seriesQuery.data || []).map((item) => ({ id: item.id as number | undefined, title: item.title })),
  ];
```

c. Replace the pills `ScrollView` contents (`{series.map((item, index) => ( <View ...> ... </View> ))}`) with:

```tsx
        {seriesOptions.map((option) => {
          const active = option.id === selectedSeriesId;
          return (
            <Pressable key={option.id ?? 'all'} onPress={() => setSelectedSeriesId(option.id)}>
              <View
                style={[
                  styles.seriesPill,
                  active
                    ? { backgroundColor: theme.tint, borderColor: theme.tint }
                    : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)' },
                ]}>
                <ThemedText type="smallBold" style={{ color: active ? '#FFFFFF' : theme.textSecondary }}>
                  {option.title}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
```

d. Replace `{featured.series || 'Featured Sermon'}` with `{featured.series_title || 'Featured Sermon'}`, and `{sermon?.series || 'Sermon'}` with `{sermon?.series_title || 'Sermon'}`.

- [ ] **Step 6: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`, with no new errors against the Step 1 baseline.

- [ ] **Step 7: On-device check** (the project owner does this; note it in the report)

1. The Series Manager creates, edits, and deletes a series. A bad date shows the format hint.
2. On sermon edit, a series chip saves, and "No series" clears it.
3. On the Sermons tab, tapping a series pill shows only that series' sermons, and "All" resets it.

- [ ] **Step 8: Commit**

```bash
git add mobile/src/hooks/use-api.ts mobile/src/app/admin-series.tsx "mobile/src/app/admin-sermons/[id].tsx" mobile/src/screens/SermonsScreen.tsx
git commit -m "feat(mobile): real series manager, sermon series picker, and working series pills

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Documentation and final checks

**Files:**
- Modify: `docs/features.md`, `docs/qa-checklist.md`, `docs/superpowers/plans/2026-09-28-00-roadmap.md`

- [ ] **Step 1: Document the feature**

In `docs/features.md`:
- Under "## Public Features", after "- Sermons listing and detail pages", add `- Sermon series (browse series and their sermons in order)`.
- Under "### Web" in "## Admin Features", after "- Sermons CRUD", add `- Sermon series CRUD with cover images`.
- Append this at the end:

```markdown
## Sermon Series

- Admins create series (title, description, dates, cover image) on web `/admin/series` or mobile Series Manager, and assign sermons on the sermon form.
- Members see a Series strip on `/sermons`, each series at `/sermons/series/[id]` (sermons oldest first), and series filter pills on the mobile Sermons tab.
- Deleting a series keeps its sermons; they simply lose the series label.
- Series titles are unique; covers must be uploaded through the admin upload.
```

- [ ] **Step 2: Add QA steps**

Append this to `docs/qa-checklist.md`:

```markdown
## Sermon Series

- [ ] Admin creates a series with a cover on `/admin/series`; a duplicate title shows "A series with this title already exists"
- [ ] An end date before the start date is refused
- [ ] Assigning a sermon to a series (web form and mobile edit) shows it on `/sermons/series/[id]`, oldest first
- [ ] Deleting a series keeps its sermons in the library
- [ ] Series dates show the same day in any time zone
- [ ] Mobile Sermons tab: tapping a series pill filters; "All" resets
```

- [ ] **Step 3: Update the roadmap**

In `docs/superpowers/plans/2026-09-28-00-roadmap.md`, change the phase 2 row to:

```markdown
| 2 | `2026-09-29-phase-2-sermon-series.md` | Done |
```

- [ ] **Step 4: Run all project checks**

```bash
cd backend && npx jest --runInBand --coverage=false && npx eslint src/ tests/ && cd ..
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build && cd ..
cd mobile && npm run -s lint && npx tsc --noEmit && cd ..
```

Expected: all backend tests pass (107), there are no lint or type errors, the frontend build succeeds, and mobile is clean.

- [ ] **Step 5: Commit**

```bash
git add docs/features.md docs/qa-checklist.md docs/superpowers/plans/2026-09-28-00-roadmap.md
git commit -m "docs: document sermon series and QA steps

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
