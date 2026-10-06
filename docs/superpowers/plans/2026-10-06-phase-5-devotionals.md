# Phase 5: Daily Devotionals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the church a real daily devotional: scripture, a reflection and a closing prayer, one per day.
- Admins write and schedule devotionals on the website and in the app.
- Members read today's devotional on web, on mobile and on both home screens, plus an archive of earlier ones.
- This replaces the mobile "Daily Devotional" placeholder, which reused news and sermons.

**Architecture:**
- **Data:** a new `Devotional` table with one row per publish date (unique, date-only) and a `draft | published` status.
- **"Today":** `src/utils/dates.js` works out what "today" is in the church's time zone (`CHURCH_TIMEZONE`, default `Africa/Accra`). Members never see drafts or future-dated devotionals.
- **Notifying:** admins press "Publish & notify". It notifies everyone through the Phase 0 `notifyAll()` once, and only on the devotional's own day. An atomic "claim the notification" update guarantees it never sends twice.
- **API:** public routes under `/api/devotionals`, admin routes under `/api/admin/devotionals`, following the existing model / controller / routes pattern.

**Tech Stack:**
- Backend: Express 4, Prisma 6 (PostgreSQL), express-validator 7, Jest 29 and supertest
- Web: Next.js 16, TanStack Query 5
- Mobile: Expo SDK 55, TanStack Query 5

**Spec:** `docs/superpowers/specs/2026-09-28-mockups-real-design.md`, section 5.5 (plus §3 conventions, §4 for `CHURCH_TIMEZONE` and `getChurchToday`, §6 errors and §7 testing). The roadmap is in `docs/superpowers/plans/2026-09-28-00-roadmap.md`.

**Parallel execution:** this plan runs at the same time as Phase 6 (`2026-10-06-phase-6-announcements-push.md`), each in its own git worktree. Both branch from `feature/small-groups`. Both touch these shared files:
- `schema.prisma`
- `migrateFeatureUpdates.js`
- `server.js`
- `validators.js`
- `useApi.ts` and `use-api.ts`
- `AdminSidebar.tsx` and `NotificationBell.tsx`
- `docs/*` and the roadmap

To keep conflicts small:
- Add new code only at the anchors named here.
- Never reformat or reorder existing lines.

The two branches are combined afterwards.

## Global Constraints

- **Data:** `Devotional` has these fields:
  - `title` (255)
  - `scriptureReference` (255), e.g. "Psalm 23:1-3"
  - `scriptureText` (up to 5000 characters)
  - `body`, the reflection (up to 20000 characters)
  - `prayer?` (up to 5000 characters)
  - `publishDate` (`@db.Date`, **unique**: one per day)
  - `status` (`DevotionalStatus`: `draft | published`, default `draft`)
  - `authorId?` (`SetNull`)
  - `notifiedAt?`
  - timestamps
- **What "today" means:** `getChurchToday()` returns `YYYY-MM-DD` in `process.env.CHURCH_TIMEZONE`, falling back to `Africa/Accra` when the variable is unset or invalid.
- **Today's devotional:** the `published` devotional whose `publishDate` equals today. If there isn't one, it's the most recent published one dated on or before today, marked `is_today: false`. If there are none at all, the data is `null` (status 200).
- **What members can see:** never drafts or future-dated devotionals. On the detail endpoint those return 404.
- **"Publish & notify":**
  - It sets `status = published`.
  - It sends a notification to everyone **only if** the `publishDate` is today and `notifiedAt` is empty. It then sets `notifiedAt`.
  - The claim happens before sending, so pressing it twice, or two admins pressing it together, sends exactly once.
  - A future-dated devotional is published silently. The admin presses again on the day to send the notification.
  - There's no background scheduler.
- **Errors:**
  - A second devotional for the same date returns 409 "A devotional is already scheduled for that date".
  - Malformed IDs return 404, using the shared `parseId`.
  - Dates must be real dates in `YYYY-MM-DD` form, checked the same way as sermon series dates.
- **Audit:** admin writes (create, update, delete, publish) call `auditLogModel.createAuditLog` with `entityType: 'devotional'`.
- **Notifications:** `entityType: 'devotional'` and `type: 'devotional'`.
- **Dependencies:** no new backend, web, or mobile dependencies.
- **Schema changes:** every change goes both in `backend/prisma/schema.prisma` **and** as idempotent SQL in `backend/migrations/migrateFeatureUpdates.js`.
- **Secrets:** never write real secret keys into any file. Test files use only the existing dummy `test_jwt_secret` fallback.
- **Commits:** every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

These cases are the ones most likely to hurt a real user. Each has a test in the task named.

1. **Double "Publish & notify".** A double click, or two admins pressing it together, must notify everyone exactly once. The claim on `notifiedAt` is atomic. *(Task 3)*
2. **Drafts and future devotionals.** They must never reach members: not via `/today`, the archive, or `/:id`. *(Tasks 1 and 2)*
3. **Time zones.** At 23:30 UTC, "today" follows the church's time zone, not the server's. An invalid `CHURCH_TIMEZONE` falls back to Africa/Accra instead of crashing. *(Task 1)*
4. **A day with no devotional.** It shows the most recent past one, labelled as not today, or nothing at all. It never shows a 500 or a blank screen. *(Task 2)*
5. **Same-date conflicts.** Scheduling a second devotional on a taken date gives a 409 with a clear message, not a 500. *(Task 3)*

---

## File Map

| File | Change | Responsibility |
|---|---|---|
| `backend/src/utils/dates.js` | Create | `getChurchToday`, `dateOnly` |
| `backend/prisma/schema.prisma` | Modify | `DevotionalStatus`, `Devotional`; `User.authoredDevotionals` |
| `backend/migrations/migrateFeatureUpdates.js` | Modify | Enum, table, index |
| `backend/src/models/devotionalModel.js` | Create | Queries, the `toDevotional` mapper, and the notify claim |
| `backend/src/controllers/devotionalController.js` | Create | Public and admin handlers |
| `backend/src/routes/devotionalRoutes.js` | Create | `/api/devotionals` |
| `backend/src/routes/adminDevotionalRoutes.js` | Create | `/api/admin/devotionals` |
| `backend/src/middleware/validators.js` | Modify | `validateDevotional` |
| `backend/src/server.js` | Modify | Mount the routes |
| `backend/.env.example`, `render.yaml` | Modify | `CHURCH_TIMEZONE` (no secrets) |
| `backend/tests/utils/dates.test.js` | Create | Time-zone tests |
| `backend/tests/models/devotionalModel.test.js` | Create | Mapper and query tests |
| `backend/tests/api/devotionals.test.js` | Create | Route tests |
| `frontend/src/hooks/useApi.ts` | Modify | Devotional types and hooks |
| `frontend/src/components/devotionals/TodayDevotionalCard.tsx` | Create | Home-page card |
| `frontend/src/app/page.tsx` | Modify | Show the card |
| `frontend/src/app/devotionals/page.tsx` | Create | Today plus the archive |
| `frontend/src/app/devotionals/[id]/page.tsx` | Create | A single devotional |
| `frontend/src/app/admin/devotionals/page.tsx` | Create | Admin authoring |
| `frontend/src/components/layout/AdminSidebar.tsx`, `NotificationBell.tsx` | Modify | Link; notification routing |
| `mobile/src/hooks/use-api.ts` | Modify | Devotional types and hooks |
| `mobile/src/app/daily-devotional.tsx` | Rewrite | Today plus the archive |
| `mobile/src/app/admin-devotionals.tsx` | Create | Admin authoring |
| `mobile/src/app/(tabs)/index.tsx`, `mobile/src/app/admin.tsx` | Modify | Home card; admin shortcut |
| `docs/features.md`, `docs/qa-checklist.md`, roadmap | Modify | Documentation |

---

### Task 1: Worktree setup, dates helper, schema, and model

**Files:**
- Create: `backend/src/utils/dates.js`, `backend/src/models/devotionalModel.js`
- Modify: `backend/prisma/schema.prisma`, `backend/migrations/migrateFeatureUpdates.js`, `backend/.env.example`, `render.yaml`
- Test: `backend/tests/utils/dates.test.js`, `backend/tests/models/devotionalModel.test.js`

**Interfaces:**
- Produces:
  - `dates.getChurchToday(now?: Date) → 'YYYY-MM-DD'`
  - `dates.dateOnly('YYYY-MM-DD') → Date` (UTC midnight)
  - `devotionalModel.toDevotional(row) → snake_case devotional`, where `publish_date` is a `'YYYY-MM-DD'` string
  - `getTodayDevotional(today) → Devotional & { is_today } | null`
  - `listPublished({ offset, limit, today }) → Devotional[]`
  - `countPublished(today) → number`
  - `getPublishedById(id, today) → Devotional | undefined`
  - `listAll() → Devotional[]` (admin)
  - `getById(id) → Devotional | undefined`
  - `createDevotional(input, authorId) → Devotional`. It rejects with `P2002` for a taken date.
  - `updateDevotional(id, input) → Devotional | undefined`
  - `deleteDevotional(id) → number`
  - `publish(id) → Devotional | undefined`
  - `claimNotification(id) → boolean`. It's true only for the single caller that set `notifiedAt`.
- `input` is `{ title, scriptureReference, scriptureText, body, prayer?, publishDate, status? }`.

- [ ] **Step 1: Set up the worktree and branch**

You are in a fresh git worktree that was created from `feature/small-groups`. Run:

```bash
git checkout -b feature/devotionals
(cd backend && pnpm install --frozen-lockfile)
(cd frontend && npm ci --no-audit --no-fund)
(cd mobile && npm ci --no-audit --no-fund)
(cd backend && npx prisma generate)
git add docs/superpowers/plans/2026-10-06-phase-5-devotionals.md 2>/dev/null; git commit -m "docs: phase 5 devotionals plan

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || true
```

Expected: installs finish. If the plan file is already committed, `git commit` reports nothing to commit, which is fine. Then run `cd backend && npx jest --runInBand --coverage=false`. Expected: **229** tests pass, which is the baseline.

- [ ] **Step 2: Write the failing tests**

Create `backend/tests/utils/dates.test.js`:

```js
describe('getChurchToday', () => {
  const original = process.env.CHURCH_TIMEZONE;
  afterEach(() => {
    if (original === undefined) delete process.env.CHURCH_TIMEZONE;
    else process.env.CHURCH_TIMEZONE = original;
    jest.resetModules();
  });

  const load = () => require('../../src/utils/dates');

  test('defaults to Africa/Accra (UTC+0)', () => {
    delete process.env.CHURCH_TIMEZONE;
    expect(load().getChurchToday(new Date('2026-10-06T23:30:00Z'))).toBe('2026-10-06');
  });

  test('follows the configured time zone across midnight', () => {
    process.env.CHURCH_TIMEZONE = 'Pacific/Auckland';
    expect(load().getChurchToday(new Date('2026-10-06T23:30:00Z'))).toBe('2026-10-07');
    process.env.CHURCH_TIMEZONE = 'America/Los_Angeles';
    expect(load().getChurchToday(new Date('2026-10-07T03:00:00Z'))).toBe('2026-10-06');
  });

  test('an invalid time zone falls back instead of crashing', () => {
    process.env.CHURCH_TIMEZONE = 'Not/AZone';
    expect(load().getChurchToday(new Date('2026-10-06T12:00:00Z'))).toBe('2026-10-06');
  });

  test('dateOnly makes a UTC-midnight date', () => {
    expect(load().dateOnly('2026-10-06').toISOString()).toBe('2026-10-06T00:00:00.000Z');
  });
});
```

Create `backend/tests/models/devotionalModel.test.js`:

```js
const load = (prismaMock = {}) => {
  jest.resetModules();
  jest.doMock('../../src/config/prisma', () => prismaMock);
  return require('../../src/models/devotionalModel');
};

const row = {
  id: 4,
  title: 'The Lord is my shepherd',
  scriptureReference: 'Psalm 23:1-3',
  scriptureText: 'The Lord is my shepherd...',
  body: 'Reflection',
  prayer: 'Amen',
  publishDate: new Date('2026-10-06T00:00:00Z'),
  status: 'published',
  authorId: 1,
  notifiedAt: null,
  createdAt: new Date('2026-10-01T00:00:00Z'),
  updatedAt: new Date('2026-10-01T00:00:00Z'),
};

describe('toDevotional', () => {
  test('returns snake_case with a YYYY-MM-DD publish date', () => {
    const item = load().toDevotional(row);
    expect(item).toEqual(
      expect.objectContaining({ id: 4, scripture_reference: 'Psalm 23:1-3', publish_date: '2026-10-06', status: 'published' })
    );
  });
});

describe('member-facing queries never include drafts or future dates', () => {
  test('getTodayDevotional prefers today, else the latest past one', async () => {
    const prisma = {
      devotional: {
        findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ ...row, publishDate: new Date('2026-10-04T00:00:00Z') }),
      },
    };
    const model = load(prisma);

    const result = await model.getTodayDevotional('2026-10-06');

    expect(prisma.devotional.findFirst).toHaveBeenNthCalledWith(1, {
      where: { status: 'published', publishDate: new Date('2026-10-06T00:00:00Z') },
    });
    expect(prisma.devotional.findFirst).toHaveBeenNthCalledWith(2, {
      where: { status: 'published', publishDate: { lte: new Date('2026-10-06T00:00:00Z') } },
      orderBy: { publishDate: 'desc' },
    });
    expect(result).toEqual(expect.objectContaining({ publish_date: '2026-10-04', is_today: false }));
  });

  test('getTodayDevotional marks today as is_today', async () => {
    const prisma = { devotional: { findFirst: jest.fn().mockResolvedValue(row) } };
    expect(await load(prisma).getTodayDevotional('2026-10-06')).toEqual(expect.objectContaining({ is_today: true }));
  });

  test('getTodayDevotional returns null when nothing is published', async () => {
    const prisma = { devotional: { findFirst: jest.fn().mockResolvedValue(null) } };
    expect(await load(prisma).getTodayDevotional('2026-10-06')).toBeNull();
  });

  test('getPublishedById filters by status and date', async () => {
    const prisma = { devotional: { findFirst: jest.fn().mockResolvedValue(null) } };
    await load(prisma).getPublishedById(4, '2026-10-06');
    expect(prisma.devotional.findFirst).toHaveBeenCalledWith({
      where: { id: 4, status: 'published', publishDate: { lte: new Date('2026-10-06T00:00:00Z') } },
    });
  });
});

describe('claimNotification', () => {
  test('only the caller that sets notifiedAt wins', async () => {
    const prisma = { devotional: { updateMany: jest.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 }) } };
    const model = load(prisma);

    expect(await model.claimNotification(4)).toBe(true);
    expect(await model.claimNotification(4)).toBe(false);
    expect(prisma.devotional.updateMany).toHaveBeenCalledWith({
      where: { id: 4, notifiedAt: null, status: 'published' },
      data: { notifiedAt: expect.any(Date) },
    });
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/utils/dates.test.js tests/models/devotionalModel.test.js --coverage=false`
Expected: FAIL with `Cannot find module '../../src/utils/dates'` and `Cannot find module '../../src/models/devotionalModel'`.

- [ ] **Step 4: Create the dates helper**

Create `backend/src/utils/dates.js`:

```js
/**
 * Church-calendar dates. "Today" is decided in the church's time zone, not the server's.
 */
const DEFAULT_TIMEZONE = 'Africa/Accra';

const formatYmd = (date, timeZone) =>
  // en-CA formats as YYYY-MM-DD
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

const getChurchToday = (now = new Date()) => {
  const timeZone = process.env.CHURCH_TIMEZONE || DEFAULT_TIMEZONE;
  try {
    return formatYmd(now, timeZone);
  } catch (_error) {
    return formatYmd(now, DEFAULT_TIMEZONE);
  }
};

// 'YYYY-MM-DD' -> Date at UTC midnight (how Prisma represents @db.Date values)
const dateOnly = (ymd) => new Date(`${ymd}T00:00:00.000Z`);

module.exports = {
  DEFAULT_TIMEZONE,
  getChurchToday,
  dateOnly,
};
```

- [ ] **Step 5: Update the schema and migration**

In `backend/prisma/schema.prisma`:

a. Add this after `enum MembershipStatus { ... }`:

```prisma
enum DevotionalStatus {
  draft
  published

  @@map("devotional_status")
}
```

b. In `model User`, add this after the `groupMemberships` line:

```prisma
  authoredDevotionals  Devotional[]
```

c. Add this at the end of the file:

```prisma
model Devotional {
  id                 Int              @id @default(autoincrement())
  title              String           @db.VarChar(255)
  scriptureReference String           @map("scripture_reference") @db.VarChar(255)
  scriptureText      String           @map("scripture_text")
  body               String
  prayer             String?
  publishDate        DateTime         @unique @map("publish_date") @db.Date
  status             DevotionalStatus @default(draft)
  authorId           Int?             @map("author_id")
  notifiedAt         DateTime?        @map("notified_at")
  createdAt          DateTime         @default(now()) @map("created_at")
  updatedAt          DateTime         @updatedAt @map("updated_at")
  author             User?            @relation(fields: [authorId], references: [id], onDelete: SetNull)

  @@index([status, publishDate(sort: Desc)], map: "idx_devotionals_status_date")
  @@map("devotionals")
}
```

In `backend/migrations/migrateFeatureUpdates.js`, insert this directly before `await client.query('COMMIT');`:

```js
    // Daily devotionals (phase 5)
    await client.query(`
      DO $$
      BEGIN
        CREATE TYPE devotional_status AS ENUM ('draft', 'published');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS devotionals (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        scripture_reference VARCHAR(255) NOT NULL,
        scripture_text TEXT NOT NULL,
        body TEXT NOT NULL,
        prayer TEXT,
        publish_date DATE NOT NULL,
        status devotional_status NOT NULL DEFAULT 'draft',
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        notified_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT devotionals_publish_date_key UNIQUE (publish_date)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_devotionals_status_date
      ON devotionals(status, publish_date DESC);
    `);
```

In `backend/.env.example`, add this at the end:

```
# Church time zone used to decide "today" for daily devotionals (IANA name)
CHURCH_TIMEZONE=Africa/Accra
```

In `render.yaml`, add this after the `AUTH_RATE_LIMIT_MAX_REQUESTS` entry:

```yaml
      - key: CHURCH_TIMEZONE
        value: Africa/Accra
```

Run: `cd backend && DATABASE_URL="postgresql://x:y@localhost:5432/z" npx prisma validate && npx prisma generate && node --check migrations/migrateFeatureUpdates.js`
Expected: `valid`, then `Generated Prisma Client`, and no syntax output. **Do not** run the migration.

- [ ] **Step 6: Create the model**

Create `backend/src/models/devotionalModel.js`:

```js
const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');
const { dateOnly } = require('../utils/dates');

/**
 * Devotional Model - one devotional per day; members only ever see published, non-future ones.
 */

const toDevotional = (row) => {
  // eslint-disable-next-line no-unused-vars
  const { author, ...rest } = row;
  const mapped = toSnakeCaseObject(rest);
  mapped.publish_date = row.publishDate.toISOString().slice(0, 10);
  return mapped;
};

const visibleWhere = (today) => ({ status: 'published', publishDate: { lte: dateOnly(today) } });

const getTodayDevotional = async (today) => {
  const exact = await prisma.devotional.findFirst({ where: { status: 'published', publishDate: dateOnly(today) } });
  if (exact) {
    return { ...toDevotional(exact), is_today: true };
  }

  const latest = await prisma.devotional.findFirst({ where: visibleWhere(today), orderBy: { publishDate: 'desc' } });
  return latest ? { ...toDevotional(latest), is_today: false } : null;
};

const listPublished = async ({ offset = 0, limit = 10, today }) => {
  const rows = await prisma.devotional.findMany({
    where: visibleWhere(today),
    orderBy: { publishDate: 'desc' },
    skip: Number(offset),
    take: Number(limit),
  });
  return rows.map(toDevotional);
};

const countPublished = (today) => prisma.devotional.count({ where: visibleWhere(today) });

const getPublishedById = async (id, today) => {
  const row = await prisma.devotional.findFirst({ where: { id: Number(id), ...visibleWhere(today) } });
  return row ? toDevotional(row) : undefined;
};

const listAll = async () => {
  const rows = await prisma.devotional.findMany({ orderBy: { publishDate: 'desc' } });
  return rows.map(toDevotional);
};

const getById = async (id) => {
  const row = await prisma.devotional.findUnique({ where: { id: Number(id) } });
  return row ? toDevotional(row) : undefined;
};

const toData = (input = {}) => {
  const data = {};
  ['title', 'scriptureReference', 'scriptureText', 'body'].forEach((field) => {
    if (input[field] !== undefined) data[field] = String(input[field]).trim();
  });
  if (input.prayer !== undefined) data.prayer = input.prayer ? String(input.prayer).trim() || null : null;
  if (input.publishDate !== undefined) data.publishDate = dateOnly(input.publishDate);
  if (input.status !== undefined) data.status = input.status;
  return data;
};

const createDevotional = async (input, authorId) => {
  const row = await prisma.devotional.create({ data: { ...toData(input), authorId: authorId ? Number(authorId) : null } });
  return toDevotional(row);
};

const updateDevotional = async (id, input) => {
  const updated = await prisma.devotional.updateMany({ where: { id: Number(id) }, data: toData(input) });
  return updated.count === 0 ? undefined : getById(id);
};

const deleteDevotional = async (id) => {
  const result = await prisma.devotional.deleteMany({ where: { id: Number(id) } });
  return result.count;
};

const publish = async (id) => {
  const updated = await prisma.devotional.updateMany({ where: { id: Number(id) }, data: { status: 'published' } });
  return updated.count === 0 ? undefined : getById(id);
};

// Atomic claim: only the one caller whose update sets notified_at gets true, so a notification is sent once.
const claimNotification = async (id) => {
  const result = await prisma.devotional.updateMany({
    where: { id: Number(id), notifiedAt: null, status: 'published' },
    data: { notifiedAt: new Date() },
  });
  return result.count === 1;
};

module.exports = {
  toDevotional,
  getTodayDevotional,
  listPublished,
  countPublished,
  getPublishedById,
  listAll,
  getById,
  createDevotional,
  updateDevotional,
  deleteDevotional,
  publish,
  claimNotification,
};
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `cd backend && npx jest tests/utils/dates.test.js tests/models/devotionalModel.test.js --coverage=false`
Expected: PASS (4 date tests and 6 model tests).

- [ ] **Step 8: Commit**

```bash
git add backend/src/utils/dates.js backend/src/models/devotionalModel.js backend/prisma/schema.prisma backend/migrations/migrateFeatureUpdates.js backend/.env.example render.yaml backend/tests/utils/dates.test.js backend/tests/models/devotionalModel.test.js
git commit -m "feat: add devotionals table, church-time-zone dates and devotional model

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Public devotionals API

**Files:**
- Create: `backend/src/controllers/devotionalController.js` (public handlers)
- Create: `backend/src/routes/devotionalRoutes.js`
- Modify: `backend/src/server.js`
- Test: `backend/tests/api/devotionals.test.js`

**Interfaces:**
- Consumes: the `devotionalModel` functions (Task 1), `dates.getChurchToday`, `parseId`, `getPagination` and `buildPaginationMeta`.
- Produces:
  - `GET /api/devotionals/today` → `{ data: Devotional & { is_today } | null }`
  - `GET /api/devotionals?page&limit` → `{ data: Devotional[], meta }`
  - `GET /api/devotionals/:id` → `{ data: Devotional }` or 404

- [ ] **Step 1: Write the failing tests**

The public and admin test files share their setup, so it lives in a helper that Jest doesn't run as a test. A file under `tests/helpers/` without `.test.js` isn't matched as a test.

Create `backend/tests/helpers/devotionalTestApp.js`:

```js
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const as = (userId, role) => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET)}`;
const admin = () => as(1, 'admin');

const devotional = (overrides = {}) => ({ id: 4, title: 'Psalm 23', publish_date: '2026-10-06', status: 'published', ...overrides });

const buildModels = () => ({
  devotionalModel: {
    getTodayDevotional: jest.fn().mockResolvedValue({ ...devotional(), is_today: true }),
    listPublished: jest.fn().mockResolvedValue([devotional()]),
    countPublished: jest.fn().mockResolvedValue(1),
    getPublishedById: jest.fn().mockResolvedValue(devotional()),
    listAll: jest.fn().mockResolvedValue([]),
    getById: jest.fn().mockResolvedValue(devotional()),
    createDevotional: jest.fn().mockResolvedValue(devotional({ status: 'draft' })),
    updateDevotional: jest.fn().mockResolvedValue(devotional()),
    deleteDevotional: jest.fn().mockResolvedValue(1),
    publish: jest.fn().mockResolvedValue(devotional()),
    claimNotification: jest.fn().mockResolvedValue(true),
  },
  notificationService: { notify: jest.fn(), notifyAll: jest.fn().mockResolvedValue({ inApp: 40, push: 0 }) },
  auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
  dates: { getChurchToday: jest.fn().mockReturnValue('2026-10-06'), dateOnly: (d) => new Date(`${d}T00:00:00.000Z`) },
});

const buildApp = (models) => {
  jest.resetModules();
  jest.doMock('../../src/models/devotionalModel', () => models.devotionalModel);
  jest.doMock('../../src/services/notificationService', () => models.notificationService);
  jest.doMock('../../src/models/auditLogModel', () => models.auditLogModel);
  jest.doMock('../../src/utils/dates', () => models.dates);

  const app = express();
  app.use(express.json());
  app.use('/api/devotionals', require('../../src/routes/devotionalRoutes'));
  const adminRoutesPath = '../../src/routes/adminDevotionalRoutes';
  try {
    app.use('/api/admin/devotionals', require(adminRoutesPath));
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
  }
  const { errorHandler } = require('../../src/middleware/errorHandler');
  app.use(errorHandler);
  return app;
};

module.exports = { buildModels, buildApp, as, admin, devotional };
```

Create `backend/tests/api/devotionals.test.js`:

```js
const request = require('supertest');
const { buildModels, buildApp } = require('../helpers/devotionalTestApp');

describe('Public devotionals API', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test("GET /today returns today's devotional using the church date", async () => {
    const response = await request(app).get('/api/devotionals/today');

    expect(response.status).toBe(200);
    expect(models.devotionalModel.getTodayDevotional).toHaveBeenCalledWith('2026-10-06');
    expect(response.body.data.is_today).toBe(true);
  });

  test('GET /today returns null data (not an error) when nothing is published', async () => {
    models.devotionalModel.getTodayDevotional.mockResolvedValue(null);

    const response = await request(app).get('/api/devotionals/today');

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
  });

  test('GET / lists the archive up to today with pagination', async () => {
    const response = await request(app).get('/api/devotionals?page=1&limit=5');

    expect(response.status).toBe(200);
    expect(models.devotionalModel.listPublished).toHaveBeenCalledWith({ offset: 0, limit: 5, today: '2026-10-06' });
    expect(models.devotionalModel.countPublished).toHaveBeenCalledWith('2026-10-06');
    expect(response.body.meta.total).toBe(1);
  });

  test('GET /:id returns a published devotional', async () => {
    const response = await request(app).get('/api/devotionals/4');

    expect(response.status).toBe(200);
    expect(models.devotionalModel.getPublishedById).toHaveBeenCalledWith(4, '2026-10-06');
  });

  test('GET /:id returns 404 for a draft or future devotional (model finds nothing)', async () => {
    models.devotionalModel.getPublishedById.mockResolvedValue(undefined);
    const response = await request(app).get('/api/devotionals/5');
    expect(response.status).toBe(404);
  });

  test('GET /:id returns 404 for a malformed id without querying', async () => {
    const response = await request(app).get('/api/devotionals/abc');

    expect(response.status).toBe(404);
    expect(models.devotionalModel.getPublishedById).not.toHaveBeenCalled();
  });

  test('/today is not swallowed by /:id', async () => {
    await request(app).get('/api/devotionals/today');
    expect(models.devotionalModel.getPublishedById).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/api/devotionals.test.js --coverage=false`
Expected: FAIL with `Cannot find module '../../src/routes/devotionalRoutes'`.

- [ ] **Step 3: Create the controller (public handlers)**

Create `backend/src/controllers/devotionalController.js`:

```js
const { apiResponse, parseId, getPagination, buildPaginationMeta } = require('../utils/helpers');
const devotionalModel = require('../models/devotionalModel');
const { getChurchToday } = require('../utils/dates');

/**
 * Devotional Controller
 */

const NOT_FOUND = 'Devotional not found';
const fail = (res, status, message) => res.status(status).json(apiResponse(false, null, message));

// Today's devotional (or the latest past one); data is null when nothing is published yet.
const getToday = async (req, res, next) => {
  try {
    const devotional = await devotionalModel.getTodayDevotional(getChurchToday());
    res.json(apiResponse(true, devotional, devotional ? 'Devotional retrieved' : 'No devotional published yet'));
  } catch (error) {
    next(error);
  }
};

const listArchive = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { offset, limitNum } = getPagination(page, limit);
    const today = getChurchToday();
    const [devotionals, total] = await Promise.all([
      devotionalModel.listPublished({ offset, limit: limitNum, today }),
      devotionalModel.countPublished(today),
    ]);
    res.json(apiResponse(true, devotionals, 'Devotionals retrieved', buildPaginationMeta(total, page, limit)));
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const devotional = id ? await devotionalModel.getPublishedById(id, getChurchToday()) : undefined;
    if (!devotional) return fail(res, 404, NOT_FOUND);
    res.json(apiResponse(true, devotional, 'Devotional retrieved'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getToday,
  listArchive,
  getOne,
};
```

- [ ] **Step 4: Create the routes and mount them**

Create `backend/src/routes/devotionalRoutes.js`:

```js
const express = require('express');
const devotionalController = require('../controllers/devotionalController');

const router = express.Router();

router.get('/', devotionalController.listArchive);
// Registered before '/:id' so 'today' is not treated as an id.
router.get('/today', devotionalController.getToday);
router.get('/:id', devotionalController.getOne);

module.exports = router;
```

In `backend/src/server.js`:
- Add `const devotionalRoutes = require('./routes/devotionalRoutes');` directly after `const newsRoutes = require('./routes/newsRoutes');`.
- Add `app.use('/api/devotionals', devotionalRoutes);` directly after `app.use('/api/news', newsRoutes);`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd backend && npx jest tests/api/devotionals.test.js --coverage=false`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/devotionalController.js backend/src/routes/devotionalRoutes.js backend/src/server.js backend/tests/helpers/devotionalTestApp.js backend/tests/api/devotionals.test.js
git commit -m "feat: add public daily devotional API

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Admin devotionals API (authoring, publish & notify)

**Files:**
- Modify: `backend/src/controllers/devotionalController.js`
- Create: `backend/src/routes/adminDevotionalRoutes.js`
- Modify: `backend/src/middleware/validators.js` (add `validateDevotional` directly after `validateGroupLeaders`, and add `validateDevotional,` to exports directly after `validateGroupLeaders,`)
- Modify: `backend/src/server.js`
- Test: `backend/tests/api/adminDevotionals.test.js`

**Interfaces:**
- Consumes: the Task 1 model, `notificationService.notifyAll`, and `auditLogModel.createAuditLog`.
- Produces (all admin-only):
  - `GET /api/admin/devotionals`
  - `POST /api/admin/devotionals` → 201
  - `PUT /api/admin/devotionals/:id`
  - `DELETE /api/admin/devotionals/:id`
  - `POST /api/admin/devotionals/:id/publish` → `{ data: { devotional, notified: boolean } }`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/api/adminDevotionals.test.js`:

```js
const request = require('supertest');
const { buildModels, buildApp, as, admin, devotional } = require('../helpers/devotionalTestApp');

const validBody = {
  title: 'The Lord is my shepherd',
  scriptureReference: 'Psalm 23:1-3',
  scriptureText: 'The Lord is my shepherd; I shall not want.',
  body: 'A reflection on trust.',
  prayer: 'Lord, lead me.',
  publishDate: '2026-10-06',
};

describe('Admin devotionals API', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('members cannot author devotionals', async () => {
    const response = await request(app).post('/api/admin/devotionals').set('Authorization', as(7, 'member')).send(validBody);
    expect(response.status).toBe(403);
  });

  test('lists every devotional including drafts and future ones', async () => {
    const response = await request(app).get('/api/admin/devotionals').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(models.devotionalModel.listAll).toHaveBeenCalled();
  });

  test('creates a draft and audits it', async () => {
    const response = await request(app).post('/api/admin/devotionals').set('Authorization', admin()).send(validBody);

    expect(response.status).toBe(201);
    expect(models.devotionalModel.createDevotional).toHaveBeenCalledWith(expect.objectContaining({ publishDate: '2026-10-06' }), 1);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'devotional', action: 'create', entityId: 4 })
    );
  });

  test('a second devotional on the same date returns 409', async () => {
    models.devotionalModel.createDevotional.mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }));

    const response = await request(app).post('/api/admin/devotionals').set('Authorization', admin()).send(validBody);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('A devotional is already scheduled for that date');
  });

  test.each([
    ['a missing title', { title: '  ' }],
    ['a missing scripture reference', { scriptureReference: '' }],
    ['an impossible date', { publishDate: '2026-02-30' }],
    ['a non-ISO date', { publishDate: '06/10/2026' }],
    ['an unknown status', { status: 'archived' }],
  ])('rejects %s with 400', async (_label, overrides) => {
    const response = await request(app)
      .post('/api/admin/devotionals')
      .set('Authorization', admin())
      .send({ ...validBody, ...overrides });

    expect(response.status).toBe(400);
    expect(models.devotionalModel.createDevotional).not.toHaveBeenCalled();
  });

  test('updates and audits; missing returns 404; date clash returns 409', async () => {
    const ok = await request(app).put('/api/admin/devotionals/4').set('Authorization', admin()).send(validBody);
    expect(ok.status).toBe(200);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));

    models.devotionalModel.updateDevotional.mockResolvedValueOnce(undefined);
    const missing = await request(app).put('/api/admin/devotionals/99').set('Authorization', admin()).send(validBody);
    expect(missing.status).toBe(404);

    models.devotionalModel.updateDevotional.mockRejectedValueOnce(Object.assign(new Error('Unique'), { code: 'P2002' }));
    const clash = await request(app).put('/api/admin/devotionals/4').set('Authorization', admin()).send(validBody);
    expect(clash.status).toBe(409);
  });

  test('deletes and audits; missing returns 404', async () => {
    const ok = await request(app).delete('/api/admin/devotionals/4').set('Authorization', admin());
    expect(ok.status).toBe(200);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete' }));

    models.devotionalModel.deleteDevotional.mockResolvedValueOnce(0);
    const missing = await request(app).delete('/api/admin/devotionals/99').set('Authorization', admin());
    expect(missing.status).toBe(404);
  });

  test('malformed ids return 404 without querying', async () => {
    const put = await request(app).put('/api/admin/devotionals/abc').set('Authorization', admin()).send(validBody);
    const publish = await request(app).post('/api/admin/devotionals/1.5/publish').set('Authorization', admin());

    expect(put.status).toBe(404);
    expect(publish.status).toBe(404);
    expect(models.devotionalModel.updateDevotional).not.toHaveBeenCalled();
    expect(models.devotionalModel.publish).not.toHaveBeenCalled();
  });

  describe('POST /:id/publish', () => {
    const publish = () => request(app).post('/api/admin/devotionals/4/publish').set('Authorization', admin());

    test("publishing today's devotional notifies everyone once", async () => {
      const response = await publish();

      expect(response.status).toBe(200);
      expect(response.body.data.notified).toBe(true);
      expect(models.devotionalModel.claimNotification).toHaveBeenCalledWith(4);
      expect(models.notificationService.notifyAll).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'devotional', entityType: 'devotional', entityId: 4 })
      );
      expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'publish' }));
    });

    test('a second press (claim already taken) does not notify again', async () => {
      models.devotionalModel.claimNotification.mockResolvedValue(false);

      const response = await publish();

      expect(response.status).toBe(200);
      expect(response.body.data.notified).toBe(false);
      expect(models.notificationService.notifyAll).not.toHaveBeenCalled();
    });

    test('a future-dated devotional is published without notifying', async () => {
      models.devotionalModel.publish.mockResolvedValue(devotional({ publish_date: '2026-10-09' }));

      const response = await publish();

      expect(response.status).toBe(200);
      expect(response.body.data.notified).toBe(false);
      expect(models.devotionalModel.claimNotification).not.toHaveBeenCalled();
      expect(models.notificationService.notifyAll).not.toHaveBeenCalled();
    });

    test('publishing a missing devotional returns 404', async () => {
      models.devotionalModel.publish.mockResolvedValue(undefined);
      const response = await publish();
      expect(response.status).toBe(404);
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/api/adminDevotionals.test.js --coverage=false`
Expected: FAIL, because the admin routes don't exist yet. `buildApp` skips the missing module, so the requests return 404s and the assertions fail.

- [ ] **Step 3: Add the validator**

In `backend/src/middleware/validators.js`, add this directly after `validateGroupLeaders`:

```js
// Devotional create/update. publishDate is a real calendar date in YYYY-MM-DD.
const validateDevotional = [
  body('title').isString().trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('scriptureReference')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Scripture reference is required')
    .isLength({ max: 255 }),
  body('scriptureText').isString().trim().notEmpty().withMessage('Scripture text is required').isLength({ max: 5000 }),
  body('body').isString().trim().notEmpty().withMessage('Reflection is required').isLength({ max: 20000 }),
  body('prayer').optional({ values: 'null' }).isString().isLength({ max: 5000 }),
  body('publishDate')
    .isDate({ format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] })
    .withMessage('Publish date must be a real date in YYYY-MM-DD format'),
  body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
];
```

Add `validateDevotional,` to `module.exports`, directly after `validateGroupLeaders,`.

- [ ] **Step 4: Add the admin handlers**

In `backend/src/controllers/devotionalController.js`:

a. Add these after the existing imports:

```js
const auditLogModel = require('../models/auditLogModel');
const { notifyAll } = require('../services/notificationService');
```

b. Add this before `module.exports`:

```js
// ---- Admin ----

const audit = (req, action, entityId, summary) =>
  auditLogModel.createAuditLog({ actorUserId: req.user.userId, entityType: 'devotional', entityId, action, summary, metadata: {} });

const DATE_TAKEN = 'A devotional is already scheduled for that date';

const pickInput = (body) => ({
  title: body.title,
  scriptureReference: body.scriptureReference,
  scriptureText: body.scriptureText,
  body: body.body,
  prayer: body.prayer,
  publishDate: body.publishDate,
  status: body.status,
});

const adminList = async (req, res, next) => {
  try {
    res.json(apiResponse(true, await devotionalModel.listAll(), 'Devotionals retrieved'));
  } catch (error) {
    next(error);
  }
};

const adminCreate = async (req, res, next) => {
  try {
    const devotional = await devotionalModel.createDevotional(pickInput(req.body), req.user.userId);
    await audit(req, 'create', devotional.id, `Created devotional for ${devotional.publish_date}`);
    res.status(201).json(apiResponse(true, devotional, 'Devotional created'));
  } catch (error) {
    if (error?.code === 'P2002') return fail(res, 409, DATE_TAKEN);
    next(error);
  }
};

const adminUpdate = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const devotional = id ? await devotionalModel.updateDevotional(id, pickInput(req.body)) : undefined;
    if (!devotional) return fail(res, 404, NOT_FOUND);
    await audit(req, 'update', id, `Updated devotional for ${devotional.publish_date}`);
    res.json(apiResponse(true, devotional, 'Devotional updated'));
  } catch (error) {
    if (error?.code === 'P2002') return fail(res, 409, DATE_TAKEN);
    next(error);
  }
};

const adminDelete = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const removed = id ? await devotionalModel.deleteDevotional(id) : 0;
    if (!removed) return fail(res, 404, NOT_FOUND);
    await audit(req, 'delete', id, `Deleted devotional #${id}`);
    res.json(apiResponse(true, null, 'Devotional deleted'));
  } catch (error) {
    next(error);
  }
};

// Publish, and notify everyone once, on the devotional's own day.
const adminPublish = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const devotional = id ? await devotionalModel.publish(id) : undefined;
    if (!devotional) return fail(res, 404, NOT_FOUND);

    let notified = false;
    if (devotional.publish_date === getChurchToday() && (await devotionalModel.claimNotification(id))) {
      await notifyAll({
        title: "Today's devotional",
        message: `${devotional.title} (${devotional.scripture_reference || 'read today'})`,
        type: 'devotional',
        entityType: 'devotional',
        entityId: id,
      });
      notified = true;
    }

    await audit(req, 'publish', id, `Published devotional for ${devotional.publish_date}${notified ? ' and notified everyone' : ''}`);
    res.json(apiResponse(true, { devotional, notified }, notified ? 'Published and notified everyone' : 'Published'));
  } catch (error) {
    next(error);
  }
};
```

c. Add these to `module.exports`: `adminList, adminCreate, adminUpdate, adminDelete, adminPublish,`.

- [ ] **Step 5: Create the admin routes and mount them**

Create `backend/src/routes/adminDevotionalRoutes.js`:

```js
const express = require('express');
const devotionalController = require('../controllers/devotionalController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { handleValidationErrors, validateDevotional } = require('../middleware/validators');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', devotionalController.adminList);
router.post('/', validateDevotional, handleValidationErrors, devotionalController.adminCreate);
router.put('/:id', validateDevotional, handleValidationErrors, devotionalController.adminUpdate);
router.delete('/:id', devotionalController.adminDelete);
router.post('/:id/publish', devotionalController.adminPublish);

module.exports = router;
```

In `backend/src/server.js`:
- Add `const adminDevotionalRoutes = require('./routes/adminDevotionalRoutes');` directly after `const adminNewsRoutes = require('./routes/adminNewsRoutes');`.
- Add `app.use('/api/admin/devotionals', adminDevotionalRoutes);` directly after `app.use('/api/admin/news', adminNewsRoutes);`.

- [ ] **Step 6: Run the full suite and lint**

Run: `cd backend && npx jest --runInBand --coverage=false && npx eslint src/ tests/`
Expected: all suites pass, with no lint output. The total is 229, plus 4 date tests, 6 model tests, 7 public, and 16 admin tests: **262**.

- [ ] **Step 7: Commit**

```bash
git add backend/src/controllers/devotionalController.js backend/src/routes/adminDevotionalRoutes.js backend/src/middleware/validators.js backend/src/server.js backend/tests/api/adminDevotionals.test.js
git commit -m "feat: add admin devotional authoring with publish and notify-once

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Web — reading devotionals, home card, admin authoring

**Files:**
- Modify: `frontend/src/hooks/useApi.ts` (add these directly after `useRecentSermons`)
- Create: `frontend/src/components/devotionals/TodayDevotionalCard.tsx`
- Modify: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/devotionals/page.tsx`, `frontend/src/app/devotionals/[id]/page.tsx`, `frontend/src/app/admin/devotionals/page.tsx`
- Modify: `frontend/src/components/layout/AdminSidebar.tsx`, `frontend/src/components/layout/NotificationBell.tsx`

**Interfaces:**
- Consumes: the public and admin endpoints (Tasks 2 and 3), and `formatDateOnly` from `@/lib/utils` (Phase 2).
- Produces:
  - Types: `Devotional`, `DevotionalInput`
  - `useTodayDevotional()`
  - `useDevotionalArchive(page)`
  - `useDevotional(id?)`
  - `useAdminDevotionals()`
  - `useSaveDevotional()`
  - `useDeleteDevotional()`
  - `usePublishDevotional()`

The frontend has no test runner. Verification is type-check, lint, and build.

- [ ] **Step 1: Add the hooks**

In `frontend/src/hooks/useApi.ts`, add this directly after `useRecentSermons`:

```ts
export type Devotional = {
  id: number;
  title: string;
  scripture_reference: string;
  scripture_text: string;
  body: string;
  prayer: string | null;
  publish_date: string;
  status: 'draft' | 'published';
  notified_at: string | null;
  is_today?: boolean;
};

export type DevotionalInput = {
  title: string;
  scriptureReference: string;
  scriptureText: string;
  body: string;
  prayer: string | null;
  publishDate: string;
};

const invalidateDevotionals = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['devotionals'] });
  qc.invalidateQueries({ queryKey: ['admin', 'devotionals'] });
};

export const useTodayDevotional = () =>
  useQuery({
    queryKey: ['devotionals', 'today'],
    queryFn: async (): Promise<Devotional | null> => {
      const response = await apiClient.get('/devotionals/today');
      return response.data?.data ?? null;
    },
  });

export const useDevotionalArchive = (page = 1) =>
  useQuery({
    queryKey: ['devotionals', 'archive', page],
    queryFn: async (): Promise<{ data: Devotional[]; hasMore: boolean }> => {
      const response = await apiClient.get('/devotionals', { params: { page, limit: 10 } });
      return { data: response.data?.data ?? [], hasMore: Boolean(response.data?.meta?.has_more) };
    },
  });

export const useDevotional = (id?: number) =>
  useQuery({
    queryKey: ['devotionals', 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Devotional> => {
      const response = await apiClient.get(`/devotionals/${id}`);
      return response.data?.data;
    },
  });

export const useAdminDevotionals = () =>
  useQuery({
    queryKey: ['admin', 'devotionals'],
    queryFn: async (): Promise<Devotional[]> => {
      const response = await apiClient.get('/admin/devotionals');
      return response.data?.data ?? [];
    },
  });

export const useSaveDevotional = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: DevotionalInput }) => {
      const response = id ? await apiClient.put(`/admin/devotionals/${id}`, input) : await apiClient.post('/admin/devotionals', input);
      return response.data?.data as Devotional;
    },
    onSuccess: (_data, { id }) => toast.success(id ? 'Devotional updated' : 'Devotional saved as draft'),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not save the devotional')),
    onSettled: () => invalidateDevotionals(qc),
  });
};

export const useDeleteDevotional = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/devotionals/${id}`);
    },
    onSuccess: () => toast.success('Devotional deleted'),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not delete the devotional')),
    onSettled: () => invalidateDevotionals(qc),
  });
};

export const usePublishDevotional = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/admin/devotionals/${id}/publish`);
      return response.data?.data as { devotional: Devotional; notified: boolean };
    },
    onSuccess: (data) => toast.success(data?.notified ? 'Published and everyone was notified' : 'Published'),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not publish')),
    onSettled: () => invalidateDevotionals(qc),
  });
};
```

- [ ] **Step 2: Create the home card and add it to the home page**

Create `frontend/src/components/devotionals/TodayDevotionalCard.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { useTodayDevotional } from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

export default function TodayDevotionalCard() {
  const { data: devotional, isLoading } = useTodayDevotional();

  if (isLoading || !devotional) {
    return null;
  }

  return (
    <Link
      href={`/devotionals/${devotional.id}`}
      className="block rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6 transition-colors hover:border-amber-300 dark:border-amber-900/50 dark:bg-amber-950/30"
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
        <BookOpen className="h-4 w-4" />
        {devotional.is_today ? "Today's devotional" : `Devotional · ${formatDateOnly(devotional.publish_date)}`}
      </p>
      <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">{devotional.title}</h2>
      <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">{devotional.scripture_reference}</p>
      <p className="mt-2 line-clamp-2 text-sm italic text-slate-600 dark:text-slate-400">{devotional.scripture_text}</p>
    </Link>
  );
}
```

In `frontend/src/app/page.tsx`:
- Add `import TodayDevotionalCard from '@/components/devotionals/TodayDevotionalCard';` directly after the `formatDate` import line.
- Insert this directly before the line `      <section className="container-max mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">`:

```tsx
      <section className="container-max mb-12">
        <TodayDevotionalCard />
      </section>

```

- [ ] **Step 3: Create the reading pages**

Next.js App Router pages may export only their default component, so the shared `DevotionalBody` lives in `frontend/src/components/devotionals/DevotionalBody.tsx`. That file's code comes right after this page.

Create `frontend/src/app/devotionals/page.tsx`:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import DevotionalBody from '@/components/devotionals/DevotionalBody';
import { Button } from '@/components/ui/button';
import { useDevotionalArchive, useTodayDevotional } from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

export default function DevotionalsPage() {
  const [page, setPage] = React.useState(1);
  const { data: today, isLoading: todayLoading } = useTodayDevotional();
  const { data: archive, isLoading: archiveLoading } = useDevotionalArchive(page);

  return (
    <div className="container-max space-y-10 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Daily Devotional</h1>
        <p className="mt-2 text-sm text-ui-subtle">Scripture, a short reflection and a prayer for each day.</p>
      </div>

      {todayLoading ? (
        <p className="text-sm text-ui-subtle">Loading today&apos;s devotional...</p>
      ) : today ? (
        <DevotionalBody devotional={today} />
      ) : (
        <p className="text-sm text-ui-subtle">No devotional has been published yet.</p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Earlier devotionals</h2>
        {archiveLoading ? (
          <p className="text-sm text-ui-subtle">Loading...</p>
        ) : (archive?.data ?? []).length === 0 ? (
          <p className="text-sm text-ui-subtle">Nothing here yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {(archive?.data ?? []).map((item) => (
              <li key={item.id}>
                <Link href={`/devotionals/${item.id}`} className="flex justify-between gap-3 py-3 hover:text-sky-700 dark:hover:text-cyan-300">
                  <span className="truncate font-medium">{item.title}</span>
                  <span className="shrink-0 text-sm text-ui-subtle">{formatDateOnly(item.publish_date)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {(page > 1 || archive?.hasMore) && (
          <div className="flex gap-3">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Newer
            </Button>
            <Button variant="outline" disabled={!archive?.hasMore} onClick={() => setPage((p) => p + 1)}>
              Older
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
```

Create `frontend/src/components/devotionals/DevotionalBody.tsx`:

```tsx
import type { Devotional } from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

export default function DevotionalBody({ devotional }: { devotional: Devotional }) {
  return (
    <article className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
          {devotional.is_today === false ? `Devotional · ${formatDateOnly(devotional.publish_date)}` : formatDateOnly(devotional.publish_date)}
        </p>
        <h2 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{devotional.title}</h2>
      </header>
      <blockquote className="rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-5 dark:bg-amber-950/30">
        <p className="whitespace-pre-line italic">{devotional.scripture_text}</p>
        <footer className="mt-2 text-sm font-semibold">{devotional.scripture_reference}</footer>
      </blockquote>
      <div className="max-w-3xl whitespace-pre-line leading-relaxed">{devotional.body}</div>
      {devotional.prayer && (
        <div className="rounded-2xl bg-slate-100 p-5 dark:bg-slate-900">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-ui-subtle">Prayer</p>
          <p className="whitespace-pre-line">{devotional.prayer}</p>
        </div>
      )}
    </article>
  );
}
```

Create `frontend/src/app/devotionals/[id]/page.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import DevotionalBody from '@/components/devotionals/DevotionalBody';
import { useDevotional } from '@/hooks/useApi';

export default function DevotionalDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const devotionalId = Number.isInteger(id) && id > 0 ? id : undefined;
  const { data, isLoading, error } = useDevotional(devotionalId);

  return (
    <div className="container-max space-y-6 py-12 sm:py-16">
      <Link href="/devotionals" className="text-sm font-semibold text-sky-700 dark:text-cyan-300">
        ← All devotionals
      </Link>
      {!devotionalId || error ? (
        <p className="text-ui-subtle">This devotional could not be found.</p>
      ) : isLoading || !data ? (
        <p className="text-ui-subtle">Loading...</p>
      ) : (
        <DevotionalBody devotional={data} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create the admin authoring page**

Create `frontend/src/app/admin/devotionals/page.tsx`:

```tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useAdminDevotionals,
  useDeleteDevotional,
  usePublishDevotional,
  useSaveDevotional,
  type Devotional,
  type DevotionalInput,
} from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

type FormState = { title: string; scriptureReference: string; scriptureText: string; body: string; prayer: string; publishDate: string };
const EMPTY: FormState = { title: '', scriptureReference: '', scriptureText: '', body: '', prayer: '', publishDate: '' };

const toInput = (form: FormState): DevotionalInput => ({
  title: form.title.trim(),
  scriptureReference: form.scriptureReference.trim(),
  scriptureText: form.scriptureText.trim(),
  body: form.body.trim(),
  prayer: form.prayer.trim() || null,
  publishDate: form.publishDate,
});

export default function AdminDevotionalsPage() {
  const { data: devotionals, isLoading } = useAdminDevotionals();
  const save = useSaveDevotional();
  const remove = useDeleteDevotional();
  const publish = usePublishDevotional();
  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [pendingDelete, setPendingDelete] = React.useState<Devotional | null>(null);

  const set = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const startEdit = (item: Devotional) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      scriptureReference: item.scripture_reference,
      scriptureText: item.scripture_text,
      body: item.body,
      prayer: item.prayer || '',
      publishDate: item.publish_date,
    });
  };
  const resetForm = () => {
    setEditingId(undefined);
    setForm(EMPTY);
  };

  return (
    <div className="container-max space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Daily Devotionals</h1>
        <p className="mt-2 text-sm text-ui-subtle">
          Write one devotional per day. Save it as a draft, then use &quot;Publish&quot;; on its own day, publishing also
          notifies everyone (once).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{editingId ? 'Edit devotional' : 'New devotional'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate({ id: editingId, input: toInput(form) }, { onSuccess: resetForm });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="dev-title">Title</Label>
              <Input id="dev-title" value={form.title} onChange={set('title')} required maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-date">Date</Label>
              <Input id="dev-date" type="date" value={form.publishDate} onChange={set('publishDate')} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dev-ref">Scripture reference</Label>
              <Input id="dev-ref" value={form.scriptureReference} onChange={set('scriptureReference')} required maxLength={255} placeholder="Psalm 23:1-3" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dev-scripture">Scripture text</Label>
              <Textarea id="dev-scripture" rows={3} value={form.scriptureText} onChange={set('scriptureText')} required maxLength={5000} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dev-body">Reflection</Label>
              <Textarea id="dev-body" rows={8} value={form.body} onChange={set('body')} required maxLength={20000} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dev-prayer">Closing prayer (optional)</Label>
              <Textarea id="dev-prayer" rows={3} value={form.prayer} onChange={set('prayer')} maxLength={5000} />
            </div>
            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" disabled={save.isPending}>
                {editingId ? 'Save changes' : 'Save draft'}
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
        <p className="text-sm text-ui-subtle">Loading devotionals...</p>
      ) : !devotionals || devotionals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-ui-subtle">No devotionals yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {devotionals.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.title}</p>
                  <p className="text-xs text-ui-subtle">
                    {formatDateOnly(item.publish_date)} · {item.status}
                    {item.notified_at ? ' · everyone notified' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                    Edit
                  </Button>
                  {(item.status === 'draft' || !item.notified_at) && (
                    <Button size="sm" disabled={publish.isPending} onClick={() => publish.mutate(item.id)}>
                      {item.status === 'draft' ? 'Publish' : 'Publish & notify'}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setPendingDelete(item)}>
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
          description="This cannot be undone."
          confirmLabel="Delete"
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

- [ ] **Step 5: Add the sidebar link and notification routing**

In `frontend/src/components/layout/AdminSidebar.tsx`:
- Add `BookOpen,` to the lucide import list. Keep the list's existing order, and insert it alphabetically.
- Add this directly after the `'/admin/series'` entry:

```ts
  { href: '/admin/devotionals', label: 'Devotionals', icon: BookOpen },
```

In `frontend/src/components/layout/NotificationBell.tsx`, add this directly before the `group` case:

```tsx
    if (notification.entity_type === 'devotional' && notification.entity_id) {
      router.push(`/devotionals/${notification.entity_id}`);
      return;
    }
```

- [ ] **Step 6: Type-check, lint, and build**

Run: `cd frontend && npm run -s type-check && npm run -s lint && npm run -s build`
Expected: no type or lint output. The build lists these routes:
- `/devotionals`
- `/devotionals/[id]`
- `/admin/devotionals`

- [ ] **Step 7: Commit**

```bash
git add frontend/src/hooks/useApi.ts frontend/src/components/devotionals frontend/src/app/page.tsx frontend/src/app/devotionals frontend/src/app/admin/devotionals frontend/src/components/layout/AdminSidebar.tsx frontend/src/components/layout/NotificationBell.tsx
git commit -m "feat(web): daily devotional pages, home card and admin authoring

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Mobile — devotional screen, home card, admin authoring

**Files:**
- Modify: `mobile/src/hooks/use-api.ts`. Insert the hooks directly **before** the line `export const useMinistrySermons`. Phase 6 inserts elsewhere, so the two don't collide.
- Rewrite: `mobile/src/app/daily-devotional.tsx`
- Create: `mobile/src/app/admin-devotionals.tsx`
- Modify: `mobile/src/app/(tabs)/index.tsx`, `mobile/src/app/admin.tsx`

**Interfaces:**
- Consumes: the public and admin endpoints (Tasks 2 and 3).
- Produces:
  - Types: `Devotional`, `DevotionalInput`
  - `useTodayDevotional()`
  - `useDevotionalArchive()`
  - `useAdminDevotionals(enabled)`
  - `useSaveDevotional()`
  - `useDeleteDevotional()`
  - `usePublishDevotional()`

- [ ] **Step 1: Record the baseline**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo baseline-ok`
Expected: `baseline-ok`.

- [ ] **Step 2: Add the hooks**

In `mobile/src/hooks/use-api.ts`, insert this directly before `export const useMinistrySermons`:

```ts
export type Devotional = {
  id: number;
  title: string;
  scripture_reference: string;
  scripture_text: string;
  body: string;
  prayer: string | null;
  publish_date: string;
  status: 'draft' | 'published';
  notified_at: string | null;
  is_today?: boolean;
};

export type DevotionalInput = {
  title: string;
  scriptureReference: string;
  scriptureText: string;
  body: string;
  prayer: string | null;
  publishDate: string;
};

const invalidateDevotionals = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ['devotionals'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'devotionals'] }),
  ]);

export const useTodayDevotional = () =>
  useQuery({
    queryKey: ['devotionals', 'today'],
    queryFn: async (): Promise<Devotional | null> => {
      const response = await apiClient.get('/devotionals/today');
      return response.data?.data ?? null;
    },
  });

export const useDevotionalArchive = () =>
  useQuery({
    queryKey: ['devotionals', 'archive'],
    queryFn: async (): Promise<Devotional[]> => {
      const response = await apiClient.get('/devotionals', { params: { limit: 20 } });
      return response.data?.data || [];
    },
  });

export const useAdminDevotionals = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'devotionals'],
    enabled,
    queryFn: async (): Promise<Devotional[]> => {
      const response = await apiClient.get('/admin/devotionals');
      return response.data?.data || [];
    },
  });

export const useSaveDevotional = () =>
  useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: DevotionalInput }) => {
      const response = id ? await apiClient.put(`/admin/devotionals/${id}`, input) : await apiClient.post('/admin/devotionals', input);
      return response.data?.data as Devotional;
    },
    onSettled: invalidateDevotionals,
  });

export const useDeleteDevotional = () =>
  useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/devotionals/${id}`);
    },
    onSettled: invalidateDevotionals,
  });

export const usePublishDevotional = () =>
  useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/admin/devotionals/${id}/publish`);
      return response.data?.data as { devotional: Devotional; notified: boolean };
    },
    onSettled: invalidateDevotionals,
  });

```

- [ ] **Step 3: Rewrite the devotional screen**

Replace the whole of `mobile/src/app/daily-devotional.tsx` with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { BrandButton, BrandCard, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useDevotionalArchive, useTodayDevotional, type Devotional } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';

// publish_date is YYYY-MM-DD; format in UTC so it never shifts a day.
const formatDay = (ymd: string) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

export default function DailyDevotionalScreen() {
  const theme = useTheme();
  const todayQuery = useTodayDevotional();
  const archiveQuery = useDevotionalArchive();
  const [selected, setSelected] = React.useState<Devotional | null>(null);
  const devotional = selected ?? todayQuery.data ?? null;
  const archive = (archiveQuery.data ?? []).filter((item) => item.id !== devotional?.id);

  return (
    <BrandScreen>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => (selected ? setSelected(null) : router.back())}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: theme.tint, textTransform: 'uppercase', letterSpacing: 1 }}>
            Daily Devotional
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {devotional ? formatDay(devotional.publish_date) : ''}
            {devotional && devotional.is_today === false && !selected ? ' · latest' : ''}
          </ThemedText>
        </View>
      </View>

      {todayQuery.isLoading ? (
        <ActivityIndicator color={theme.tint} />
      ) : todayQuery.isError ? (
        <BrandCard>
          <ThemedText type="small">Could not load the devotional.</ThemedText>
          <BrandButton label="Try again" onPress={() => todayQuery.refetch()} />
        </BrandCard>
      ) : !devotional ? (
        <BrandCard>
          <ThemedText type="small" themeColor="textSecondary">
            No devotional has been published yet.
          </ThemedText>
        </BrandCard>
      ) : (
        <>
          <ThemedText type="title" style={styles.title}>
            {devotional.title}
          </ThemedText>
          <View style={[styles.scripture, { borderColor: theme.tint }]}>
            <ThemedText style={styles.scriptureText}>{devotional.scripture_text}</ThemedText>
            <ThemedText type="smallBold">{devotional.scripture_reference}</ThemedText>
          </View>
          <BrandCard>
            <ThemedText>{devotional.body}</ThemedText>
          </BrandCard>
          {devotional.prayer ? (
            <BrandCard>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Prayer
              </ThemedText>
              <ThemedText>{devotional.prayer}</ThemedText>
            </BrandCard>
          ) : null}
        </>
      )}

      {archive.length > 0 ? (
        <BrandCard>
          <ThemedText type="defaultSemiBold">Earlier devotionals</ThemedText>
          {archive.map((item) => (
            <Pressable key={item.id} onPress={() => setSelected(item)} style={styles.archiveRow}>
              <ThemedText type="small" style={styles.archiveTitle} numberOfLines={1}>
                {item.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatDay(item.publish_date)}
              </ThemedText>
            </Pressable>
          ))}
        </BrandCard>
      ) : null}
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, lineHeight: 32 },
  scripture: { borderLeftWidth: 4, paddingLeft: Spacing.three, gap: Spacing.one },
  scriptureText: { fontStyle: 'italic' },
  archiveRow: { gap: 2, paddingVertical: Spacing.one },
  archiveTitle: { fontWeight: '600' },
});
```

- [ ] **Step 4: Add the home card**

In `mobile/src/app/(tabs)/index.tsx`:
- Add `useTodayDevotional` to the `@/hooks/use-api` import.
- In `HomeScreen`, add `const devotionalQuery = useTodayDevotional();` next to the other query hooks, before the `return`.
- Insert this directly after the closing `</View>` of the header row. That's the `<View style={styles.headerRow}>` element at the top of `HomeScreen`'s returned JSX. Read the file to find its matching close.

```tsx
      {devotionalQuery.data ? (
        <Pressable
          onPress={() => router.push('/daily-devotional' as never)}
          style={[styles.devotionalCard, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold" style={{ color: theme.tint, textTransform: 'uppercase', letterSpacing: 1 }}>
            {devotionalQuery.data.is_today ? "Today's devotional" : 'Latest devotional'}
          </ThemedText>
          <ThemedText type="defaultSemiBold">{devotionalQuery.data.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {devotionalQuery.data.scripture_reference}
          </ThemedText>
        </Pressable>
      ) : null}
```

- Add this to the file's `styles`: `devotionalCard: { borderWidth: 1, borderRadius: Radius.large, padding: Spacing.three, gap: 4 },`.

If `theme.backgroundElement` doesn't exist on this theme, use `theme.background` and record a ruling. `SermonsScreen` uses `theme.backgroundElement`, so it should exist.

- [ ] **Step 5: Create the admin authoring screen and its shortcut**

Create `mobile/src/app/admin-devotionals.tsx`:

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
  useAdminDevotionals,
  useDeleteDevotional,
  usePublishDevotional,
  useSaveDevotional,
  type Devotional,
  type DevotionalInput,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

type FormState = { title: string; scriptureReference: string; scriptureText: string; body: string; prayer: string; publishDate: string };
const EMPTY: FormState = { title: '', scriptureReference: '', scriptureText: '', body: '', prayer: '', publishDate: '' };
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function AdminDevotionalsScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const listQuery = useAdminDevotionals(isAdmin);
  const save = useSaveDevotional();
  const remove = useDeleteDevotional();
  const publish = usePublishDevotional();
  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [form, setForm] = React.useState<FormState>(EMPTY);

  if (!user || !isAdmin) return null;

  const busy = save.isPending || remove.isPending || publish.isPending;
  const showError = (title: string) => (error: unknown) => Alert.alert(title, getApiErrorMessage(error, 'Please try again.'));
  const setField = (field: keyof FormState) => (value: string) => setForm((current) => ({ ...current, [field]: value }));
  const resetForm = () => {
    setEditingId(undefined);
    setForm(EMPTY);
  };

  const onSave = () => {
    if (!form.title.trim() || !form.scriptureReference.trim() || !form.scriptureText.trim() || !form.body.trim()) {
      Alert.alert('Missing details', 'Title, scripture reference, scripture text and reflection are required.');
      return;
    }
    if (!DATE_PATTERN.test(form.publishDate)) {
      Alert.alert('Check the date', 'Use the format YYYY-MM-DD, for example 2026-10-06.');
      return;
    }
    const input: DevotionalInput = {
      title: form.title.trim(),
      scriptureReference: form.scriptureReference.trim(),
      scriptureText: form.scriptureText.trim(),
      body: form.body.trim(),
      prayer: form.prayer.trim() || null,
      publishDate: form.publishDate,
    };
    save.mutate({ id: editingId, input }, { onSuccess: resetForm, onError: showError('Could not save') });
  };

  const startEdit = (item: Devotional) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      scriptureReference: item.scripture_reference,
      scriptureText: item.scripture_text,
      body: item.body,
      prayer: item.prayer || '',
      publishDate: item.publish_date,
    });
  };

  const onPublish = (item: Devotional) =>
    publish.mutate(item.id, {
      onSuccess: (data) => Alert.alert(data?.notified ? 'Published and everyone was notified' : 'Published'),
      onError: showError('Could not publish'),
    });

  const onDelete = (item: Devotional) =>
    Alert.alert(`Delete "${item.title}"?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove.mutate(item.id, { onSuccess: () => editingId === item.id && resetForm(), onError: showError('Could not delete') }),
      },
    ]);

  const input = (field: keyof FormState, placeholder: string, multiline = false) => (
    <TextInput
      value={form[field]}
      onChangeText={setField(field)}
      placeholder={placeholder}
      placeholderTextColor={theme.textSecondary}
      multiline={multiline}
      style={[styles.input, multiline && styles.multiline, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
    />
  );

  const items = Array.isArray(listQuery.data) ? listQuery.data : [];

  return (
    <AdminShell activeTab="/admin-news">
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Devotionals</ThemedText>
        </View>
      </View>

      <BrandCard>
        <ThemedText type="defaultSemiBold">{editingId ? 'Edit devotional' : 'New devotional'}</ThemedText>
        {input('publishDate', 'Date YYYY-MM-DD')}
        {input('title', 'Title')}
        {input('scriptureReference', 'Scripture reference, e.g. Psalm 23:1-3')}
        {input('scriptureText', 'Scripture text', true)}
        {input('body', 'Reflection', true)}
        {input('prayer', 'Closing prayer (optional)', true)}
        <BrandButton label={editingId ? 'Save changes' : 'Save draft'} variant="secondary" onPress={() => !busy && onSave()} />
        {editingId ? <BrandButton label="Cancel" variant="outline" onPress={resetForm} /> : null}
      </BrandCard>

      {items.map((item) => (
        <BrandCard key={item.id}>
          <View style={styles.row}>
            <ThemedText type="defaultSemiBold" style={styles.rowTitle} numberOfLines={1}>
              {item.title}
            </ThemedText>
            <BrandPill>{item.status}</BrandPill>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {item.publish_date}
            {item.notified_at ? ' · everyone notified' : ''}
          </ThemedText>
          <View style={styles.actions}>
            <BrandButton label="Edit" variant="outline" onPress={() => startEdit(item)} />
            {item.status === 'draft' || !item.notified_at ? (
              <BrandButton label={item.status === 'draft' ? 'Publish' : 'Publish & notify'} onPress={() => !busy && onPublish(item)} />
            ) : null}
            <BrandButton label="Delete" variant="outline" onPress={() => !busy && onDelete(item)} />
          </View>
        </BrandCard>
      ))}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  rowTitle: { flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
```

In `mobile/src/app/admin.tsx`, add this directly after the `Series` `QuickAction` line:

```tsx
        <QuickAction icon="book-outline" label="Devotionals" color="#F59E0B" onPress={() => router.push('/admin-devotionals' as never)} />
```

- [ ] **Step 6: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`.

- [ ] **Step 7: Commit**

```bash
git add mobile/src/hooks/use-api.ts mobile/src/app/daily-devotional.tsx mobile/src/app/admin-devotionals.tsx "mobile/src/app/(tabs)/index.tsx" mobile/src/app/admin.tsx
git commit -m "feat(mobile): real daily devotional, home card and admin authoring

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Documentation and final checks

**Files:**
- Modify: `docs/features.md`, `docs/qa-checklist.md`, `docs/superpowers/plans/2026-09-28-00-roadmap.md`

- [ ] **Step 1: Update the docs**

In `docs/features.md`:
- Under "## Public Features", after the "Sermon series" bullet, add `- Daily devotional (today's scripture, reflection and prayer, plus an archive)`.
- Under "### Web" in "## Admin Features", after the "Sermon series CRUD" bullet, add `- Daily devotional authoring with publish & notify`.
- Append this at the end of the file:

```markdown
## Daily Devotionals

- One devotional per day (scripture reference and text, reflection, optional prayer), written by admins on web `/admin/devotionals` or the mobile Devotionals screen.
- "Today" follows the church time zone (`CHURCH_TIMEZONE`, default Africa/Accra). Members see today's devotional on `/devotionals`, the home page card and the mobile Daily Devotional screen; if none is published for today they see the latest past one.
- Drafts and future-dated devotionals are never shown to members.
- "Publish" on the devotional's own day notifies everyone, exactly once; a future-dated devotional is published silently and can be notified on its day.
```

Append this to `docs/qa-checklist.md`:

```markdown
## Daily Devotionals

- [ ] Admin saves a draft for today on `/admin/devotionals`; it does not appear on `/devotionals` yet
- [ ] "Publish" for today's devotional shows it to members and sends one notification; pressing again sends nothing
- [ ] A devotional dated tomorrow is published without a notification and is not visible until tomorrow
- [ ] A second devotional on a taken date is refused with a clear message
- [ ] With no devotional today, members see the latest past one labelled with its date
- [ ] Home page card and mobile home card open the devotional
```

In `docs/superpowers/plans/2026-09-28-00-roadmap.md`, change the phase 5 row to:

```markdown
| 5 | `2026-10-06-phase-5-devotionals.md` (includes `src/utils/dates.js` / `getChurchToday`) | Done |
```

- [ ] **Step 2: Run all project checks**

```bash
cd backend && npx jest --runInBand --coverage=false && npx eslint src/ tests/ && cd ..
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build && cd ..
cd mobile && npm run -s lint && npx tsc --noEmit && cd ..
```

Expected: all 262 backend tests pass, there are no lint or type errors, the frontend build succeeds, and mobile is clean.

- [ ] **Step 3: Commit**

```bash
git add docs/features.md docs/qa-checklist.md docs/superpowers/plans/2026-09-28-00-roadmap.md
git commit -m "docs: document daily devotionals and QA steps

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
