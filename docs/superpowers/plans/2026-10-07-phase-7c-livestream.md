# Phase 7c: Livestream Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An admin pastes a YouTube and/or Facebook link and taps "Go live". A live banner then appears on the website and a live card in the app, the website embeds the YouTube stream, and members get exactly one notification. "End" takes it all down.

**Architecture:**
- A single `live_stream` row (`id = 1`) holds the state.
- `liveStreamModel.startLive` decides "was it live before?" inside one `$transaction`:
  1. It upserts the row with `INSERT ... ON CONFLICT DO NOTHING`.
  2. It locks the row with `SELECT ... FOR UPDATE`.
  3. It updates the row.
- The controller sends `notifyAll` only when that call reports `becameLive`, so two simultaneous "Go live" taps notify once.
- A pure helper, `liveLinks`, checks the hosts and derives the YouTube embed URL. The validator and the model both use it.
- Clients read the public `GET /api/live`:
  - the web banner polls every 60 s
  - the mobile home card refetches on focus

**Tech Stack:**
- Backend: Express 4, Prisma 6 (PostgreSQL), express-validator 7, Jest 29 and supertest
- Web: Next.js 16, TanStack Query 5 and lucide-react
- Mobile: Expo SDK 55, expo-router (`useFocusEffect`) and React Native `Linking`

There are **no new dependencies**.

**Spec:** `docs/superpowers/specs/2026-10-07-media-live-cedis-design.md`. This plan covers the livestream parts of §3 (`LiveStream`), §5 "Livestream", §6, §7, §9 and §10.

## Global Constraints

- **Schema changes:** every change goes in `backend/prisma/schema.prisma` **and** as idempotent SQL in `backend/migrations/migrateFeatureUpdates.js`, directly before `await client.query('COMMIT');`.
  - Never run the migration: there is no database.
  - Never `require()` it; tests read it as text.
  - Validate with `DATABASE_URL="postgresql://x:y@localhost:5432/z" npx prisma validate` and `node --check`.
- **Public state:** `GET /api/live` returns `{ is_live, title, youtube_url, facebook_url, youtube_embed_url, started_at }`, all snake_case and wrapped in `apiResponse`. With no row it returns `is_live: false`.
- **YouTube links:**
  - `https` only, on `youtube.com`, `www.youtube.com`, `m.youtube.com` or `youtu.be`.
  - The video ID is read from `watch?v=`, `youtu.be/<id>`, `/live/<id>` and `/embed/<id>`, and must match `^[A-Za-z0-9_-]{11}$`.
  - `youtube_embed_url` is `https://www.youtube.com/embed/<id>`, or `null` when no ID can be parsed.
- **Facebook links:** `https` only, on `facebook.com`, `www.facebook.com`, `m.facebook.com`, `web.facebook.com` or `fb.watch`. They are shown as a link only; Facebook is never embedded.
- **All links:** at most 500 characters, no credentials and no explicit port. At least one link is required. Anything else returns 400.
- **Notification:** `notifyAll({ title: "We're live: <title>", message: 'Tap to watch the livestream.', type: 'live', entityType: 'live', entityId: null })`. It is sent only on the change from not-live to live, and never on a link update or on "End".
- **Admin routes:** `/api/admin/live/start` and `/end` use `verifyToken, requireRole('admin')`, the same as every other `/api/admin/*` router. Every call writes `auditLogModel.createAuditLog` with `entityType: 'live'` and `entityId: 1`.
- **Web banner:** it polls `GET /api/live` every **60 s** (`refetchInterval: 60_000`) and shows a red "We're live: \<title\>" bar linking to `/live`.
- **Mobile links:** they open with React Native's `Linking.openURL`, which hands them to the YouTube or Facebook app when installed.
- **Dependencies:** none are added to the backend, web or mobile.
- **Secrets:** none. This phase adds no settings.
- **Where code goes:** new code is added only at the insertion points named in each step. Existing lines are never reformatted or reordered. Phase 7b (albums) is being built in parallel and touches the same files.
- **pnpm:** if pnpm rewrites `backend/pnpm-workspace.yaml`, run `git checkout -- backend/pnpm-workspace.yaml` and never commit it.
- **Commits:** every commit message ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Rulings (decisions the spec left open or that the owner changed)

1. **Admin web page.** The spec asked for "a Livestream card on the admin dashboard". The owner changed this to a dedicated **`/admin/live` page** with a sidebar link (icon `Radio`, placed after Announcements), so it doesn't collide with other dashboard work. `admin/dashboard/page.tsx` is not touched.
2. **The notify decision is made inside the transaction, and the send happens after it.**
   - The check ("was it live?") and the update share one transaction, holding a row lock.
   - `notifyAll` runs after the commit, so a slow push (up to 5 s) never holds the lock, and a rolled-back start never notifies.
   - `notifyAll` never throws.
3. **Hidden when not live.** `GET /api/live` returns `title`, `youtube_url`, `facebook_url`, `youtube_embed_url` and `started_at` as `null` whenever `is_live` is false, so no client can show a stale stream. The admin forms fill themselves from this state, which means they fill only while live, to edit the links.
4. **Facebook must be `https` as well.** The spec required `https` only for YouTube. Every link is shown to members as clickable, so plain `http`, credentials and explicit ports are refused for both.
5. **"Update links" while live.** A start call while already live updates the title and links, keeps `started_at`, and does not notify. It is audited as `update`. "End" is audited every time, even when it was not live (`wasLive` is in the metadata).
6. **The row is created twice over.** The migration seeds `id = 1`, and `startLive` also inserts it with `ON CONFLICT (id) DO NOTHING`, so a database built with `prisma db push` works too. SQL adds `CHECK (id = 1)`.
7. **Validation errors** keep the codebase's `{ error: 'Validation failed', details: [...] }` shape. The live hooks show `details[0].message` first, because the shared `getApiErrorMessage` would show "Validation failed".
8. **The mobile home screen** already has a hard-coded "Live now / Sunday Worship Service" card that always shows. It is **removed**, together with its eight now-unused styles, and replaced by the real `LiveCard`, which renders only while live. The card sits at the top of the screen content, directly under the header row.
9. **Push and bell routing.** A push tap with `entityType: 'live'` opens the mobile home screen (`/`), where the live card is. The web bell's `live` item opens `/live`.
10. **Banner placement.** The banner is hidden on `/live` itself. TanStack Query pauses the interval while the tab is in the background (`refetchIntervalInBackground` defaults to false), which keeps us well inside the 100-requests-per-15-minutes rate limit.
11. **Migration test file.** The migration assertion goes in a **new** file, `backend/tests/migrations/liveStreamMigration.test.js`, so Phase 7b's edits to `migrateFeatureUpdates.test.js` cannot conflict with it.

## Review Focus

1. **Two admins tap "Go live" at the same moment (or one admin double-taps):** members get exactly one notification.
   - *Task 2:* the model concurrency test.
   - *Task 3:* two parallel `POST /start` calls produce one `notifyAll`.
2. **A lookalike or unsafe link** (`https://youtube.com.evil.example/...`, `http://`, `javascript:`, `user:pass@`, `:8443`) is refused with 400, so no bad link ever reaches a member's screen.
   - *Task 1:* host tests.
   - *Task 3:* validation rows.
3. **A YouTube link with no video ID** (a channel's `/@name/live` page) is accepted, but `youtube_embed_url` is `null`. `/live` then shows only the buttons, never a broken iframe.
   - *Task 1:* parse tests.
   - *Task 3:* the API test.
4. **After "End", nothing stale shows.** The public state hides the title and the links, so the banner, the card and the live page show "not live".
   - *Task 2:* `toLiveState`.
   - *Task 3:* GET after end.
5. **Fixing a wrong link while live** does not notify again and keeps `started_at`.
   - *Task 2:* the model test.
   - *Task 3:* the already-live test.

---

## File Map

| File | Change | Responsibility |
|---|---|---|
| `backend/src/utils/liveLinks.js` | Create | Host checks, YouTube ID parsing, embed URL |
| `backend/prisma/schema.prisma` | Modify | `LiveStream` model (after `Announcement`); `User.liveStreamUpdates` (after `announcementsSent`) |
| `backend/migrations/migrateFeatureUpdates.js` | Modify | `live_stream` table plus seed row (before `COMMIT`) |
| `backend/src/models/liveStreamModel.js` | Create | `getLiveStream`, `startLive` (transaction + lock), `endLive`, `toLiveState` |
| `backend/src/controllers/liveController.js` | Create | `getLive`, `startLive` (notify once + audit), `endLive` (audit) |
| `backend/src/routes/liveRoutes.js`, `backend/src/routes/adminLiveRoutes.js` | Create | Public GET; admin start/end |
| `backend/src/middleware/validators.js` | Modify | `validateLiveStart` (after `validateAnnouncement`; exported last) |
| `backend/src/server.js` | Modify | Requires and two `app.use` lines |
| `backend/tests/utils/liveLinks.test.js`, `backend/tests/helpers/fakeLivePrisma.js`, `backend/tests/models/liveStreamModel.test.js`, `backend/tests/migrations/liveStreamMigration.test.js`, `backend/tests/api/live.test.js` | Create | Tests |
| `frontend/src/hooks/useApi.ts` | Modify | `LiveState`, `useLiveStream`, `useStartLive`, `useEndLive` (after `useSendAnnouncement`) |
| `frontend/src/components/layout/LiveBanner.tsx` | Create | Polling red banner |
| `frontend/src/app/layout.tsx` | Modify | `<LiveBanner />` before `<Header />` |
| `frontend/src/app/live/page.tsx` | Create | Embed, plus YouTube and Facebook buttons |
| `frontend/src/components/layout/NotificationBell.tsx` | Modify | `live` → `/live` (after the `prayer` branch) |
| `frontend/src/app/admin/live/page.tsx` | Create | Admin "Go live" / "Update links" / "End" |
| `frontend/src/components/layout/AdminSidebar.tsx` | Modify | `/admin/live` entry (after Announcements); separate `Radio` import line |
| `mobile/src/hooks/use-api.ts` | Modify | Live types and hooks (before `useMemberSearch`) |
| `mobile/src/components/live-card.tsx` | Create | Home live card |
| `mobile/src/app/(tabs)/index.tsx` | Modify | `<LiveCard />` at the top; remove the fake live card |
| `mobile/src/app/admin-live.tsx` | Create | Admin Livestream screen |
| `mobile/src/app/admin.tsx` | Modify | Livestream QuickAction (after Announcement) |
| `mobile/src/lib/push.ts` | Modify | `case 'live'` (after `prayer`) |
| `docs/features.md`, `docs/qa-checklist.md`, `docs/deployment.md` | Modify | Append livestream sections |

**Backend test counts:**

| Point | Passing tests |
|---|---|
| Baseline | 336 |
| After Task 1 | 359 (+23) |
| After Task 2 | 367 (+8) |
| After Task 3 | 387 (+20) |

Tasks 4–7 add no backend tests.

---

### Task 1: Link rules (`liveLinks`)

**Files:**
- Create: `backend/src/utils/liveLinks.js`, `backend/tests/utils/liveLinks.test.js`

**Interfaces:**
- Produces:
  - `isYouTubeUrl(value: unknown) → boolean`
  - `isFacebookUrl(value: unknown) → boolean`
  - `parseYouTubeId(value: unknown) → string | null`
  - `youtubeEmbedUrl(value: unknown) → string | null`
  - `MAX_LINK_LENGTH = 500`

- [ ] **Step 1: Check the branch, install, and confirm the baseline**

You are on branch `feature/livestream` at `087ad65` (the tip of `feature/media-storage-cedis`, Phase 7a), and the plan commit sits on top of it. The baseline is **336** passing backend tests. The installs are slow, so run them in the background (`run_in_background`) and wait for them to finish:

```bash
git branch --show-current   # feature/livestream
cd backend && pnpm install --frozen-lockfile && npx prisma generate && cd ..
cd frontend && npm ci --no-audit --no-fund && cd ..
cd mobile && npm ci --no-audit --no-fund && cd ..
git status --short          # if backend/pnpm-workspace.yaml changed: git checkout -- backend/pnpm-workspace.yaml
cd backend && npx jest --runInBand --coverage=false
```

Expected: `Tests: 336 passed`.

- [ ] **Step 2: Write the failing tests**

Create `backend/tests/utils/liveLinks.test.js`:

```js
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
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/utils/liveLinks.test.js --coverage=false`
Expected: FAIL with `Cannot find module '../../src/utils/liveLinks'`.

- [ ] **Step 4: Create the helper**

Create `backend/src/utils/liveLinks.js`:

```js
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
```

- [ ] **Step 5: Run the tests, the suite and lint**

```bash
cd backend && npx jest tests/utils/liveLinks.test.js --coverage=false
npx jest --runInBand --coverage=false
npx eslint src/utils/liveLinks.js tests/utils/liveLinks.test.js
```

Expected: 23 new tests pass, the suite reports **359** passed, and lint is clean.

- [ ] **Step 6: Commit**

```bash
git add backend/src/utils/liveLinks.js backend/tests/utils/liveLinks.test.js
git commit -m "feat(live): YouTube and Facebook link rules with embed URL

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The `live_stream` row and its model

**Files:**
- Modify:
  - `backend/prisma/schema.prisma` (after `model Announcement { ... }`, and in `model User` after `announcementsSent`)
  - `backend/migrations/migrateFeatureUpdates.js` (directly before `await client.query('COMMIT');`)
- Create:
  - `backend/src/models/liveStreamModel.js`
  - `backend/tests/helpers/fakeLivePrisma.js`
  - `backend/tests/models/liveStreamModel.test.js`
  - `backend/tests/migrations/liveStreamMigration.test.js`

**Interfaces:**
- Consumes: `youtubeEmbedUrl(value) → string | null` (Task 1).
- Produces (all from `liveStreamModel`):
  - `getLiveStream() → Promise<Row | null>`
  - `startLive({ title: string, youtubeUrl: string | null, facebookUrl: string | null, userId: number }) → Promise<{ stream: Row, becameLive: boolean }>`
  - `endLive({ userId: number }) → Promise<{ stream: Row | null, wasLive: boolean }>`
  - `toLiveState(row: Row | null) → { is_live, title, youtube_url, facebook_url, youtube_embed_url, started_at }`. Everything except `is_live` is `null` unless the stream is live.
  - `Row` is the Prisma `LiveStream` record (`isLive`, `title`, `youtubeUrl`, `facebookUrl`, `startedAt`, `endedAt`, `updatedBy`, `updatedAt`).
- Test helper: `createFakeLivePrisma(initialRow?) → { prisma, tx, state }`, with `state.row` and `state.sql` (the raw SQL text, in order).

- [ ] **Step 1: Write the test helper**

This is an in-memory stand-in for the one row. It runs transactions one at a time, as `SELECT ... FOR UPDATE` makes them in Postgres, and every operation yields, so a read taken outside the transaction would interleave and be caught.

Create `backend/tests/helpers/fakeLivePrisma.js`:

```js
// In-memory stand-in for the single live_stream row, for model and API tests.
// $transaction callbacks run one at a time (as the row lock makes them in Postgres);
// every operation yields first, so any read done outside the transaction can interleave.
const tick = () => new Promise((resolve) => setImmediate(resolve));

const emptyRow = () => ({
  id: 1,
  isLive: false,
  title: null,
  youtubeUrl: null,
  facebookUrl: null,
  startedAt: null,
  endedAt: null,
  updatedBy: null,
  updatedAt: new Date(),
});

const createFakeLivePrisma = (initialRow = null) => {
  const state = { row: initialRow ? { ...emptyRow(), ...initialRow } : null, sql: [] };
  const sqlText = (strings) => strings.join('?');
  let queue = Promise.resolve();

  const tx = {
    $executeRaw: jest.fn(async (strings) => {
      await tick();
      state.sql.push(sqlText(strings));
      if (!state.row) state.row = emptyRow();
      return 1;
    }),
    $queryRaw: jest.fn(async (strings) => {
      await tick();
      state.sql.push(sqlText(strings));
      return state.row ? [{ is_live: state.row.isLive }] : [];
    }),
    liveStream: {
      update: jest.fn(async ({ data }) => {
        await tick();
        state.row = { ...state.row, ...data, updatedAt: new Date() };
        return { ...state.row };
      }),
    },
  };

  const prisma = {
    $transaction: jest.fn((callback) => {
      const run = queue.then(() => callback(tx));
      queue = run.catch(() => {});
      return run;
    }),
    liveStream: {
      findUnique: jest.fn(async () => {
        await tick();
        return state.row ? { ...state.row } : null;
      }),
      updateMany: jest.fn(async ({ where, data }) => {
        await tick();
        if (!state.row || (where.isLive !== undefined && state.row.isLive !== where.isLive)) {
          return { count: 0 };
        }
        state.row = { ...state.row, ...data, updatedAt: new Date() };
        return { count: 1 };
      }),
    },
  };

  return { prisma, tx, state };
};

module.exports = { createFakeLivePrisma };
```

- [ ] **Step 2: Write the failing model and migration tests**

Create `backend/tests/models/liveStreamModel.test.js`:

```js
const { createFakeLivePrisma } = require('../helpers/fakeLivePrisma');

const ID = 'dQw4w9WgXcQ';
const input = { title: 'Sunday Service', youtubeUrl: `https://youtu.be/${ID}`, facebookUrl: null, userId: 1 };
const NOT_LIVE = {
  is_live: false,
  title: null,
  youtube_url: null,
  facebook_url: null,
  youtube_embed_url: null,
  started_at: null,
};

const load = (fake) => {
  jest.resetModules();
  jest.doMock('../../src/config/prisma', () => fake.prisma);
  return require('../../src/models/liveStreamModel');
};

describe('liveStreamModel', () => {
  test('there is no row until the first start, and that reads as not live', async () => {
    const model = load(createFakeLivePrisma());

    const row = await model.getLiveStream();

    expect(row).toBeNull();
    expect(model.toLiveState(row)).toEqual(NOT_LIVE);
  });

  test('going live creates the row if needed, locks it, and reports the change', async () => {
    const fake = createFakeLivePrisma();
    const model = load(fake);

    const { stream, becameLive } = await model.startLive(input);

    expect(becameLive).toBe(true);
    expect(stream).toMatchObject({
      isLive: true,
      title: 'Sunday Service',
      youtubeUrl: input.youtubeUrl,
      facebookUrl: null,
      updatedBy: 1,
      endedAt: null,
    });
    expect(stream.startedAt).toBeInstanceOf(Date);
    expect(fake.state.sql[0]).toContain('ON CONFLICT (id) DO NOTHING');
    expect(fake.state.sql[1]).toContain('FOR UPDATE');
  });

  test('updating the links while live keeps the start time and reports no change', async () => {
    const startedAt = new Date('2026-10-04T09:00:00Z');
    const model = load(createFakeLivePrisma({ isLive: true, title: 'Old title', youtubeUrl: 'https://youtu.be/aaaaaaaaaaa', startedAt }));

    const { stream, becameLive } = await model.startLive(input);

    expect(becameLive).toBe(false);
    expect(stream.startedAt).toEqual(startedAt);
    expect(stream.title).toBe('Sunday Service');
    expect(stream.youtubeUrl).toBe(input.youtubeUrl);
  });

  test('two simultaneous starts: exactly one reports going live', async () => {
    const fake = createFakeLivePrisma();
    const model = load(fake);

    const results = await Promise.all([model.startLive(input), model.startLive({ ...input, userId: 2 })]);

    expect(results.filter((result) => result.becameLive)).toHaveLength(1);
    expect(fake.prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(fake.state.row.isLive).toBe(true);
  });

  test('ending records the end time once; ending again changes nothing', async () => {
    const model = load(createFakeLivePrisma({ isLive: true, title: 'Sunday Service', startedAt: new Date() }));

    const first = await model.endLive({ userId: 1 });
    const second = await model.endLive({ userId: 1 });

    expect(first.wasLive).toBe(true);
    expect(first.stream.isLive).toBe(false);
    expect(first.stream.endedAt).toBeInstanceOf(Date);
    expect(second.wasLive).toBe(false);
    expect(second.stream.endedAt).toEqual(first.stream.endedAt);
  });

  test('ending when nothing was ever started reports not live', async () => {
    const model = load(createFakeLivePrisma());

    const { stream, wasLive } = await model.endLive({ userId: 1 });

    expect(wasLive).toBe(false);
    expect(model.toLiveState(stream)).toEqual(NOT_LIVE);
  });

  test('the public state shows the links and the embed only while live', () => {
    const model = load(createFakeLivePrisma());
    const row = {
      isLive: true,
      title: 'Sunday Service',
      youtubeUrl: `https://www.youtube.com/live/${ID}`,
      facebookUrl: 'https://fb.watch/abcDEF123/',
      startedAt: new Date('2026-10-04T09:00:00Z'),
    };

    expect(model.toLiveState(row)).toEqual({
      is_live: true,
      title: 'Sunday Service',
      youtube_url: row.youtubeUrl,
      facebook_url: row.facebookUrl,
      youtube_embed_url: `https://www.youtube.com/embed/${ID}`,
      started_at: row.startedAt,
    });
    expect(model.toLiveState({ ...row, isLive: false })).toEqual(NOT_LIVE);
  });
});
```

Create `backend/tests/migrations/liveStreamMigration.test.js`:

```js
const fs = require('fs');
const path = require('path');

// Read as text only: the migration connects to the database when required.
const source = fs.readFileSync(path.join(__dirname, '../../migrations/migrateFeatureUpdates.js'), 'utf8');

describe('livestream migration SQL', () => {
  test('creates the single-row live_stream table and seeds it idempotently, before COMMIT', () => {
    const table = source.indexOf('CREATE TABLE IF NOT EXISTS live_stream (');
    const seed = source.indexOf('INSERT INTO live_stream (id, is_live) VALUES (1, FALSE)');
    const commit = source.indexOf("await client.query('COMMIT');");

    expect(table).toBeGreaterThan(-1);
    expect(source).toContain('id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1)');
    expect(source).toContain('updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL');
    expect(seed).toBeGreaterThan(table);
    expect(source.slice(seed, seed + 120)).toContain('ON CONFLICT (id) DO NOTHING');
    expect(commit).toBeGreaterThan(seed);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/models/liveStreamModel.test.js tests/migrations/liveStreamMigration.test.js --coverage=false`
Expected: FAIL. The model test fails with `Cannot find module '../../src/models/liveStreamModel'`, and the migration test fails with `expect(received).toBeGreaterThan(expected)` (`-1`).

- [ ] **Step 4: Update the schema**

In `backend/prisma/schema.prisma`, directly after the closing `}` of `model Announcement` (the line after `  @@map("announcements")`), add a blank line and:

```prisma
model LiveStream {
  id          Int       @id @default(1)
  isLive      Boolean   @default(false) @map("is_live")
  title       String?   @db.VarChar(255)
  youtubeUrl  String?   @map("youtube_url") @db.VarChar(500)
  facebookUrl String?   @map("facebook_url") @db.VarChar(500)
  startedAt   DateTime? @map("started_at")
  endedAt     DateTime? @map("ended_at")
  updatedBy   Int?      @map("updated_by")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  updater     User?     @relation("LiveStreamUpdater", fields: [updatedBy], references: [id], onDelete: SetNull)

  @@map("live_stream")
}
```

In `model User`, directly after the line `  announcementsSent    Announcement[]      @relation("AnnouncementSender")`, add:

```prisma
  liveStreamUpdates    LiveStream[]        @relation("LiveStreamUpdater")
```

- [ ] **Step 5: Add the migration SQL**

In `backend/migrations/migrateFeatureUpdates.js`, directly before `    await client.query('COMMIT');` (after the phase 7a `events.image_url` block), insert:

```js
    // Livestream status: a single row, id 1 (phase 7c)
    await client.query(`
      CREATE TABLE IF NOT EXISTS live_stream (
        id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        is_live BOOLEAN NOT NULL DEFAULT FALSE,
        title VARCHAR(255),
        youtube_url VARCHAR(500),
        facebook_url VARCHAR(500),
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      INSERT INTO live_stream (id, is_live) VALUES (1, FALSE)
      ON CONFLICT (id) DO NOTHING;
    `);

```

- [ ] **Step 6: Create the model**

Create `backend/src/models/liveStreamModel.js`:

```js
const prisma = require('../config/prisma');
const { youtubeEmbedUrl } = require('../utils/liveLinks');

/**
 * Livestream Model - the single live_stream row (id 1) and its public shape.
 */

const LIVE_ID = 1;

const getLiveStream = () => prisma.liveStream.findUnique({ where: { id: LIVE_ID } });

// Go live, or update the links while live. The row is created if missing, then locked
// (SELECT ... FOR UPDATE), so concurrent calls run one at a time and exactly one of them
// sees the change from not-live to live. The caller notifies only when becameLive is true.
const startLive = ({ title, youtubeUrl, facebookUrl, userId }) =>
  prisma.$transaction(async (tx) => {
    await tx.$executeRaw`INSERT INTO live_stream (id, is_live, updated_at) VALUES (1, false, ${new Date()}) ON CONFLICT (id) DO NOTHING`;
    const [current] = await tx.$queryRaw`SELECT is_live FROM live_stream WHERE id = 1 FOR UPDATE`;
    const becameLive = !(current && current.is_live);

    const stream = await tx.liveStream.update({
      where: { id: LIVE_ID },
      data: {
        isLive: true,
        title,
        youtubeUrl,
        facebookUrl,
        updatedBy: userId,
        ...(becameLive ? { startedAt: new Date(), endedAt: null } : {}),
      },
    });

    return { stream, becameLive };
  });

// Safe to repeat: only a live row changes, so a second End keeps the first end time.
const endLive = async ({ userId }) => {
  const result = await prisma.liveStream.updateMany({
    where: { id: LIVE_ID, isLive: true },
    data: { isLive: false, endedAt: new Date(), updatedBy: userId },
  });
  const stream = await getLiveStream();
  return { stream, wasLive: result.count > 0 };
};

// Public shape. Only is_live is shown when not live, so no client can show a stale stream.
const toLiveState = (row) => {
  const live = Boolean(row && row.isLive);
  return {
    is_live: live,
    title: live ? row.title ?? null : null,
    youtube_url: live ? row.youtubeUrl ?? null : null,
    facebook_url: live ? row.facebookUrl ?? null : null,
    youtube_embed_url: live ? youtubeEmbedUrl(row.youtubeUrl) : null,
    started_at: live ? row.startedAt ?? null : null,
  };
};

module.exports = {
  getLiveStream,
  startLive,
  endLive,
  toLiveState,
};
```

- [ ] **Step 7: Validate, then run the tests, the suite and lint**

```bash
cd backend
DATABASE_URL="postgresql://x:y@localhost:5432/z" npx prisma validate
DATABASE_URL="postgresql://x:y@localhost:5432/z" npx prisma generate
node --check migrations/migrateFeatureUpdates.js
npx jest tests/models/liveStreamModel.test.js tests/migrations/liveStreamMigration.test.js --coverage=false
npx jest --runInBand --coverage=false
npx eslint src/models/liveStreamModel.js tests/helpers/fakeLivePrisma.js tests/models/liveStreamModel.test.js tests/migrations/liveStreamMigration.test.js
```

Expected:
- `The schema at prisma/schema.prisma is valid`.
- 8 new tests pass, and the suite reports **367** passed.
- Lint is clean.
- Never run the migration itself.

- [ ] **Step 8: Commit**

```bash
git add backend/prisma/schema.prisma backend/migrations/migrateFeatureUpdates.js backend/src/models/liveStreamModel.js backend/tests/helpers/fakeLivePrisma.js backend/tests/models/liveStreamModel.test.js backend/tests/migrations/liveStreamMigration.test.js
git commit -m "feat(live): live_stream row with a locked go-live transaction

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Livestream API (public status, go live, end)

**Files:**
- Create:
  - `backend/src/controllers/liveController.js`
  - `backend/src/routes/liveRoutes.js`
  - `backend/src/routes/adminLiveRoutes.js`
  - `backend/tests/api/live.test.js`
- Modify:
  - `backend/src/middleware/validators.js` (after `validateAnnouncement`; the export goes last)
  - `backend/src/server.js` (three insertion points)

The working tree uses CRLF (`core.autocrlf=true`; the repository stores LF). Edit with the Edit tool, which keeps each file's line endings, and don't use `sed -i` on these files.

**Interfaces:**
- Consumes:
  - from Task 1: `isYouTubeUrl`, `isFacebookUrl`
  - from Task 2: `liveStreamModel.getLiveStream`, `startLive`, `endLive` and `toLiveState`
  - `notificationService.notifyAll({ title, message, type, entityType, entityId })`
- Produces (HTTP):
  - `GET /api/live`, public:
    - returns `200 { success, data: LiveState, message }`
    - `LiveState = { is_live: boolean, title: string|null, youtube_url: string|null, facebook_url: string|null, youtube_embed_url: string|null, started_at: string|null }`
  - `POST /api/admin/live/start`, admin only:
    - body `{ title: string, youtubeUrl?: string, facebookUrl?: string }`
    - returns `200 { data: LiveState & { notified: boolean }, message }`
    - returns 400 `{ error: 'Validation failed', details: [{ field, message }] }` when the input is invalid
  - `POST /api/admin/live/end`, admin only: returns `200 { data: LiveState, message }`.

- [ ] **Step 1: Write the failing API tests**

Create `backend/tests/api/live.test.js`:

```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createFakeLivePrisma } = require('../helpers/fakeLivePrisma');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const as = (userId, role = 'member') => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET)}`;
const admin = () => as(1, 'admin');

const ID = 'dQw4w9WgXcQ';
const YOUTUBE = `https://www.youtube.com/live/${ID}`;
const FACEBOOK = 'https://www.facebook.com/antpresby/videos/123';
const NOT_LIVE = {
  is_live: false,
  title: null,
  youtube_url: null,
  facebook_url: null,
  youtube_embed_url: null,
  started_at: null,
};

const buildApp = (fake, mocks) => {
  jest.resetModules();
  jest.doMock('../../src/config/prisma', () => fake.prisma);
  jest.doMock('../../src/services/notificationService', () => mocks.notificationService);
  jest.doMock('../../src/models/auditLogModel', () => mocks.auditLogModel);

  const app = express();
  app.use(express.json());
  app.use('/api/live', require('../../src/routes/liveRoutes'));
  app.use('/api/admin/live', require('../../src/routes/adminLiveRoutes'));
  const { errorHandler } = require('../../src/middleware/errorHandler');
  app.use(errorHandler);
  return app;
};

describe('Livestream API', () => {
  let fake;
  let mocks;
  let app;

  const setup = (initialRow = null) => {
    fake = createFakeLivePrisma(initialRow);
    mocks = {
      notificationService: { notifyAll: jest.fn().mockResolvedValue({ inApp: 3, push: 2 }) },
      auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
    };
    app = buildApp(fake, mocks);
  };

  const start = (body, auth = admin()) => request(app).post('/api/admin/live/start').set('Authorization', auth).send(body);
  const end = (auth = admin()) => request(app).post('/api/admin/live/end').set('Authorization', auth).send({});

  beforeEach(() => setup());

  test('GET /api/live with no row yet says not live', async () => {
    const response = await request(app).get('/api/live');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(NOT_LIVE);
  });

  test('only admins can start or end', async () => {
    const anonymous = await request(app).post('/api/admin/live/start').send({ title: 'Sunday Service', youtubeUrl: YOUTUBE });
    const memberStart = await start({ title: 'Sunday Service', youtubeUrl: YOUTUBE }, as(7));
    const memberEnd = await end(as(7));

    expect(anonymous.status).toBe(401);
    expect(memberStart.status).toBe(403);
    expect(memberEnd.status).toBe(403);
    expect(mocks.notificationService.notifyAll).not.toHaveBeenCalled();
  });

  test('going live notifies everyone once, is audited, and returns the embed URL', async () => {
    const response = await start({ title: '  Sunday Service ', youtubeUrl: YOUTUBE, facebookUrl: FACEBOOK });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      is_live: true,
      title: 'Sunday Service',
      youtube_url: YOUTUBE,
      facebook_url: FACEBOOK,
      youtube_embed_url: `https://www.youtube.com/embed/${ID}`,
      notified: true,
    });
    expect(response.body.data.started_at).toEqual(expect.any(String));
    expect(mocks.notificationService.notifyAll).toHaveBeenCalledTimes(1);
    expect(mocks.notificationService.notifyAll).toHaveBeenCalledWith({
      title: "We're live: Sunday Service",
      message: 'Tap to watch the livestream.',
      type: 'live',
      entityType: 'live',
      entityId: null,
    });
    expect(mocks.auditLogModel.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: 1, entityType: 'live', entityId: 1, action: 'start' })
    );

    const state = await request(app).get('/api/live');
    expect(state.body.data).toMatchObject({ is_live: true, title: 'Sunday Service', youtube_url: YOUTUBE });
  });

  test('starting while already live updates the links without notifying again', async () => {
    const startedAt = new Date('2026-10-04T09:00:00Z');
    setup({ isLive: true, title: 'Sunday Service', youtubeUrl: 'https://youtu.be/aaaaaaaaaaa', startedAt });

    const response = await start({ title: 'Sunday Service', youtubeUrl: YOUTUBE });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ youtube_url: YOUTUBE, notified: false, started_at: startedAt.toISOString() });
    expect(mocks.notificationService.notifyAll).not.toHaveBeenCalled();
    expect(mocks.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));
  });

  test('two simultaneous starts send one notification', async () => {
    const body = { title: 'Sunday Service', youtubeUrl: YOUTUBE };

    const [first, second] = await Promise.all([start(body), start(body)]);

    expect([first.status, second.status]).toEqual([200, 200]);
    expect([first.body.data.notified, second.body.data.notified].filter(Boolean)).toHaveLength(1);
    expect(mocks.notificationService.notifyAll).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['a missing title', { youtubeUrl: YOUTUBE }],
    ['a title over 255 characters', { title: 'x'.repeat(256), youtubeUrl: YOUTUBE }],
    ['no link at all', { title: 'Sunday Service' }],
    ['both links blank', { title: 'Sunday Service', youtubeUrl: '  ', facebookUrl: '' }],
    ['a plain-http YouTube link', { title: 'Sunday Service', youtubeUrl: `http://www.youtube.com/watch?v=${ID}` }],
    ['a lookalike YouTube host', { title: 'Sunday Service', youtubeUrl: `https://youtube.com.evil.example/watch?v=${ID}` }],
    ['another site in the YouTube field', { title: 'Sunday Service', youtubeUrl: `https://vimeo.com/${ID}` }],
    ['a YouTube link in the Facebook field', { title: 'Sunday Service', facebookUrl: YOUTUBE }],
    ['a javascript: link', { title: 'Sunday Service', facebookUrl: 'javascript:alert(1)' }],
    ['a link over 500 characters', { title: 'Sunday Service', youtubeUrl: `${YOUTUBE}?x=${'a'.repeat(500)}` }],
  ])('refuses %s with 400 and does not go live', async (_label, body) => {
    const response = await start(body);

    expect(response.status).toBe(400);
    expect(mocks.notificationService.notifyAll).not.toHaveBeenCalled();
    expect(fake.state.row).toBeNull();
  });

  test('a Facebook-only stream goes live with no embed', async () => {
    const response = await start({ title: 'Prayer Night', facebookUrl: 'https://fb.watch/abcDEF123/' });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      is_live: true,
      youtube_url: null,
      facebook_url: 'https://fb.watch/abcDEF123/',
      youtube_embed_url: null,
    });
  });

  test("a channel's live page is accepted but has no embed", async () => {
    const response = await start({ title: 'Sunday Service', youtubeUrl: 'https://www.youtube.com/@antpresby/live' });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      youtube_url: 'https://www.youtube.com/@antpresby/live',
      youtube_embed_url: null,
    });
  });

  test('ending is audited and safe to repeat', async () => {
    setup({ isLive: true, title: 'Sunday Service', youtubeUrl: YOUTUBE, startedAt: new Date() });

    const first = await end();
    const second = await end();

    expect(first.status).toBe(200);
    expect(first.body.data.is_live).toBe(false);
    expect(first.body.message).toBe('Livestream ended');
    expect(second.status).toBe(200);
    expect(second.body.data.is_live).toBe(false);
    expect(mocks.auditLogModel.createAuditLog).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ entityType: 'live', action: 'end', metadata: { wasLive: true } })
    );
    expect(mocks.auditLogModel.createAuditLog).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ entityType: 'live', action: 'end', metadata: { wasLive: false } })
    );
    expect(mocks.notificationService.notifyAll).not.toHaveBeenCalled();
  });

  test('ending before anything was ever started returns not live', async () => {
    const response = await end();

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(NOT_LIVE);
  });

  test('after End the public state hides the old title and links', async () => {
    setup({ isLive: true, title: 'Sunday Service', youtubeUrl: YOUTUBE, facebookUrl: FACEBOOK, startedAt: new Date() });

    await end();
    const response = await request(app).get('/api/live');

    expect(response.body.data).toEqual(NOT_LIVE);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/api/live.test.js --coverage=false`
Expected: FAIL with `Cannot find module '../../src/routes/liveRoutes'`.

- [ ] **Step 3: Add the validator**

In `backend/src/middleware/validators.js`, directly after the closing `];` of `const validateAnnouncement = [ ... ];` and before `module.exports = {`, insert the block below. The `require` stays inside this block, so the top of the file is untouched.

```js

const { isYouTubeUrl, isFacebookUrl } = require('../utils/liveLinks');

const hasText = (value) => typeof value === 'string' && value.trim() !== '';

const validateLiveStart = [
  body('title')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be 255 characters or fewer'),
  body('youtubeUrl')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .custom((value) => isYouTubeUrl(value))
    .withMessage('The YouTube link must be an https link on youtube.com or youtu.be'),
  body('facebookUrl')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .custom((value) => isFacebookUrl(value))
    .withMessage('The Facebook link must be an https link on facebook.com or fb.watch'),
  body().custom((value) => {
    if (!hasText(value?.youtubeUrl) && !hasText(value?.facebookUrl)) {
      throw new Error('Add a YouTube or Facebook link');
    }
    return true;
  }),
];
```

Then, at the very end of `module.exports`, change:

```js
  validateAnnouncement,
};
```

to:

```js
  validateAnnouncement,
  validateLiveStart,
};
```

- [ ] **Step 4: Create the controller**

Create `backend/src/controllers/liveController.js`:

```js
const { apiResponse } = require('../utils/helpers');
const liveStreamModel = require('../models/liveStreamModel');
const auditLogModel = require('../models/auditLogModel');
const { notifyAll } = require('../services/notificationService');

/**
 * Livestream Controller - public status; admins go live (notifying everyone once) and end.
 */

const LIVE_ID = 1;

// Blank or missing links are stored as null.
const cleanLink = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null);

const getLive = async (req, res, next) => {
  try {
    const stream = await liveStreamModel.getLiveStream();
    res.json(apiResponse(true, liveStreamModel.toLiveState(stream), 'Livestream status'));
  } catch (error) {
    next(error);
  }
};

const startLive = async (req, res, next) => {
  try {
    const title = String(req.body.title).trim();
    const youtubeUrl = cleanLink(req.body.youtubeUrl);
    const facebookUrl = cleanLink(req.body.facebookUrl);

    const { stream, becameLive } = await liveStreamModel.startLive({
      title,
      youtubeUrl,
      facebookUrl,
      userId: Number(req.user.userId),
    });

    // becameLive was decided under the row lock; the push goes out after the commit.
    // notifyAll never throws.
    if (becameLive) {
      await notifyAll({
        title: `We're live: ${title}`,
        message: 'Tap to watch the livestream.',
        type: 'live',
        entityType: 'live',
        entityId: null,
      });
    }

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'live',
      entityId: LIVE_ID,
      action: becameLive ? 'start' : 'update',
      summary: becameLive ? `Went live: "${title}" and notified everyone` : `Updated the livestream links for "${title}"`,
      metadata: { youtubeUrl, facebookUrl },
    });

    res.json(
      apiResponse(
        true,
        { ...liveStreamModel.toLiveState(stream), notified: becameLive },
        becameLive ? "You're live. Everyone has been notified." : 'Livestream links updated'
      )
    );
  } catch (error) {
    next(error);
  }
};

const endLive = async (req, res, next) => {
  try {
    const { stream, wasLive } = await liveStreamModel.endLive({ userId: Number(req.user.userId) });

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'live',
      entityId: LIVE_ID,
      action: 'end',
      summary: wasLive ? 'Ended the livestream' : 'Pressed End while not live',
      metadata: { wasLive },
    });

    res.json(apiResponse(true, liveStreamModel.toLiveState(stream), wasLive ? 'Livestream ended' : 'The livestream was not live'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLive,
  startLive,
  endLive,
};
```

- [ ] **Step 5: Create the routes**

Create `backend/src/routes/liveRoutes.js`:

```js
const express = require('express');
const liveController = require('../controllers/liveController');

const router = express.Router();

router.get('/', liveController.getLive);

module.exports = router;
```

Create `backend/src/routes/adminLiveRoutes.js`:

```js
const express = require('express');
const liveController = require('../controllers/liveController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { handleValidationErrors, validateLiveStart } = require('../middleware/validators');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.post('/start', validateLiveStart, handleValidationErrors, liveController.startLive);
router.post('/end', liveController.endLive);

module.exports = router;
```

- [ ] **Step 6: Mount the routes in `server.js`**

Make three insertions in `backend/src/server.js`:

1. Directly after `const announcementRoutes = require('./routes/announcementRoutes');`:

   ```js
   const liveRoutes = require('./routes/liveRoutes');
   const adminLiveRoutes = require('./routes/adminLiveRoutes');
   ```

2. Directly after `app.use('/api/admin/audit-logs', adminAuditRoutes);`:

   ```js
   app.use('/api/admin/live', adminLiveRoutes);
   ```

3. Directly after `app.use('/api/announcements', announcementRoutes);`:

   ```js
   app.use('/api/live', liveRoutes);
   ```

- [ ] **Step 7: Run the tests, the suite and lint**

```bash
cd backend
node --check src/server.js
npx jest tests/api/live.test.js --coverage=false
npx jest --runInBand --coverage=false
npx eslint src/ tests/api/live.test.js
```

Expected: 20 new tests pass, the suite reports **387** passed, and lint has no errors.

- [ ] **Step 8: Commit**

```bash
git add backend/src/middleware/validators.js backend/src/controllers/liveController.js backend/src/routes/liveRoutes.js backend/src/routes/adminLiveRoutes.js backend/src/server.js backend/tests/api/live.test.js
git commit -m "feat(live): public live status and admin go-live/end with one notification

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Web live banner, `/live` page and bell routing

**Files:**
- Modify:
  - `frontend/src/hooks/useApi.ts` (directly after the `useSendAnnouncement` hook)
  - `frontend/src/app/layout.tsx` (an import after the `Header` import, and `<LiveBanner />` directly before `<Header />`)
  - `frontend/src/components/layout/NotificationBell.tsx` (directly after the `prayer` branch)
- Create:
  - `frontend/src/components/layout/LiveBanner.tsx`
  - `frontend/src/app/live/page.tsx`
- **Do not edit `Header.tsx`.**

**Interfaces:**
- Consumes: `GET /api/live`, `POST /api/admin/live/start` and `POST /api/admin/live/end` (Task 3).
- Produces (from `@/hooks/useApi`):
  - `type LiveState`
  - `type LiveStartInput = { title: string; youtubeUrl?: string; facebookUrl?: string }`
  - `useLiveStream(refetchInterval?: number)`, a query under key `['live']` that returns `LiveState | null`
  - `useStartLive()`, a mutation that takes `LiveStartInput` and returns `{ data: LiveState & { notified: boolean }, message }`
  - `useEndLive()`, a mutation that takes no input and returns `{ data: LiveState, message }`
  - Both mutations invalidate `['live']` and show toasts.

- [ ] **Step 1: Add the hooks**

In `frontend/src/hooks/useApi.ts`, directly after the closing `};` of `export const useSendAnnouncement = () => { ... };` (and before `export const useMinistry`), insert:

```ts

export type LiveState = {
  is_live: boolean;
  title: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  youtube_embed_url: string | null;
  started_at: string | null;
};

export type LiveStartInput = { title: string; youtubeUrl?: string; facebookUrl?: string };

type LiveResult<T> = { data: T; message: string };

// Validation errors carry the useful text in details[0].message, not in "error".
const getLiveErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.details?.[0]?.message || getApiErrorMessage(error, fallback);

export const useLiveStream = (refetchInterval?: number) =>
  useQuery({
    queryKey: ['live'],
    queryFn: async (): Promise<LiveState | null> => {
      const response = await apiClient.get('/live');
      return response.data?.data ?? null;
    },
    refetchInterval,
  });

export const useStartLive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LiveStartInput) => {
      const response = await apiClient.post('/admin/live/start', input);
      return response.data as LiveResult<LiveState & { notified: boolean }>;
    },
    onSuccess: (result) => toast.success(result?.message || 'Livestream updated'),
    onError: (error: any) => toast.error(getLiveErrorMessage(error, 'Could not start the livestream')),
    onSettled: () => qc.invalidateQueries({ queryKey: ['live'] }),
  });
};

export const useEndLive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/admin/live/end');
      return response.data as LiveResult<LiveState>;
    },
    onSuccess: (result) => toast.success(result?.message || 'Livestream ended'),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not end the livestream')),
    onSettled: () => qc.invalidateQueries({ queryKey: ['live'] }),
  });
};
```

- [ ] **Step 2: Create the banner**

It polls every 60 s. TanStack Query pauses the interval while the tab is hidden. The banner hides itself on `/live` and while not live.

Create `frontend/src/components/layout/LiveBanner.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radio } from 'lucide-react';
import { useLiveStream } from '@/hooks/useApi';

const POLL_INTERVAL_MS = 60_000;

export default function LiveBanner() {
  const pathname = usePathname();
  const { data } = useLiveStream(POLL_INTERVAL_MS);

  if (!data?.is_live || pathname === '/live') return null;

  return (
    <Link
      href="/live"
      className="flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
    >
      <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
      </span>
      <Radio className="h-4 w-4" aria-hidden="true" />
      <span className="truncate">We&apos;re live: {data.title || 'Join us now'}</span>
    </Link>
  );
}
```

- [ ] **Step 3: Put the banner in the layout**

In `frontend/src/app/layout.tsx`, directly after `import Header from '@/components/layout/Header';`, add:

```tsx
import LiveBanner from '@/components/layout/LiveBanner';
```

Then, directly before the line `          <Header />`, add:

```tsx
          <LiveBanner />
```

- [ ] **Step 4: Create the `/live` page**

YouTube is embedded only when `youtube_embed_url` is set. Facebook is always a link.

Create `frontend/src/app/live/page.tsx`:

```tsx
'use client';

import React from 'react';
import { Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLiveStream } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

export default function LivePage() {
  const { data: live, isLoading } = useLiveStream(60_000);

  return (
    <div className="container-max space-y-6 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Livestream</h1>
        <p className="mt-2 text-sm text-ui-subtle">Join our services live on YouTube or Facebook.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-ui-subtle">Loading...</p>
      ) : !live?.is_live ? (
        <div className="rounded-xl border border-slate-200 p-8 text-center dark:border-slate-800">
          <p className="text-lg font-semibold">We&apos;re not live right now</p>
          <p className="mt-2 text-sm text-ui-subtle">When a service is streaming, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              <Radio className="h-3.5 w-3.5" aria-hidden="true" />
              Live
            </span>
            <h2 className="text-xl font-bold">{live.title || 'Livestream'}</h2>
          </div>
          {live.started_at && <p className="text-sm text-ui-subtle">Started {formatDateTime(live.started_at)}</p>}

          {live.youtube_embed_url && (
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              <iframe
                src={live.youtube_embed_url}
                title={live.title || 'Livestream'}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {live.youtube_url && (
              <Button asChild>
                <a href={live.youtube_url} target="_blank" rel="noopener noreferrer">
                  Watch on YouTube
                </a>
              </Button>
            )}
            {live.facebook_url && (
              <Button asChild variant="outline">
                <a href={live.facebook_url} target="_blank" rel="noopener noreferrer">
                  Watch on Facebook
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Route `live` notifications in the bell**

In `frontend/src/components/layout/NotificationBell.tsx`, inside `openEntity`, directly after the `prayer` branch:

```tsx
    if (notification.entity_type === 'prayer') {
      router.push('/dashboard');
      return;
    }
```

add:

```tsx
    if (notification.entity_type === 'live') {
      router.push('/live');
      return;
    }
```

- [ ] **Step 6: Type-check, lint and build**

Run: `cd frontend && npm run -s type-check && npm run -s lint && npm run -s build`
Expected: no type or lint errors, and the build succeeds and lists the `/live` route.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/hooks/useApi.ts frontend/src/components/layout/LiveBanner.tsx frontend/src/app/layout.tsx frontend/src/app/live/page.tsx frontend/src/components/layout/NotificationBell.tsx
git commit -m "feat(web): live banner, /live page with YouTube embed, bell routing

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Web admin Livestream page

**Files:**
- Create: `frontend/src/app/admin/live/page.tsx`
- Modify: `frontend/src/components/layout/AdminSidebar.tsx` (a new import line, and an entry after `/admin/announcements`)
- `admin/dashboard/page.tsx` is **not** touched (Ruling 1).

**Interfaces:**
- Consumes: `useLiveStream`, `useStartLive` and `useEndLive` (Task 4).

- [ ] **Step 1: Add the sidebar link**

In `frontend/src/components/layout/AdminSidebar.tsx`, directly after the existing `import { Banknote, BookOpen, ... } from 'lucide-react';` line, add a **separate** import line. Phase 7b may edit the existing import line, and a separate line keeps the two changes apart:

```tsx
import { Radio } from 'lucide-react';
```

Then, in `navItems`, directly after the line:

```tsx
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
```

add:

```tsx
  { href: '/admin/live', label: 'Livestream', icon: Radio },
```

- [ ] **Step 2: Create the admin page**

Create `frontend/src/app/admin/live/page.tsx`:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEndLive, useLiveStream, useStartLive } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

export default function AdminLivePage() {
  const { data: live, isLoading } = useLiveStream();
  const start = useStartLive();
  const end = useEndLive();

  const [title, setTitle] = React.useState('');
  const [youtubeUrl, setYoutubeUrl] = React.useState('');
  const [facebookUrl, setFacebookUrl] = React.useState('');
  const filledFromLive = React.useRef(false);

  // While live, start from the current title and links so they can be corrected.
  React.useEffect(() => {
    if (filledFromLive.current || !live?.is_live) return;
    filledFromLive.current = true;
    setTitle(live.title ?? '');
    setYoutubeUrl(live.youtube_url ?? '');
    setFacebookUrl(live.facebook_url ?? '');
  }, [live]);

  const isLive = Boolean(live?.is_live);
  const hasLink = Boolean(youtubeUrl.trim() || facebookUrl.trim());

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    start.mutate({
      title: title.trim(),
      youtubeUrl: youtubeUrl.trim() || undefined,
      facebookUrl: facebookUrl.trim() || undefined,
    });
  };

  const onEnd = () => {
    if (!window.confirm('End the livestream? The live banner will disappear for everyone.')) return;
    end.mutate();
  };

  return (
    <div className="container-max space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Livestream</h1>
        <p className="mt-2 text-sm text-ui-subtle">
          Paste the YouTube and/or Facebook link and go live. Everyone is notified once when you go live; updating the links
          while live does not notify again.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-ui-subtle">Loading...</p>
          ) : isLive ? (
            <div className="space-y-1">
              <p className="flex items-center gap-2 font-semibold text-red-600">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" aria-hidden="true" />
                Live now: {live?.title}
              </p>
              {live?.started_at && <p className="text-sm text-ui-subtle">Since {formatDateTime(live.started_at)}</p>}
              <Link href="/live" className="text-sm font-medium text-sky-700 hover:underline dark:text-cyan-300">
                Open the live page
              </Link>
            </div>
          ) : (
            <p className="text-sm text-ui-subtle">Not live.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{isLive ? 'Update the livestream' : 'Go live'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="live-title">Title</Label>
              <Input
                id="live-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Sunday Worship Service"
                required
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="live-youtube">YouTube link</Label>
              <Input
                id="live-youtube"
                type="url"
                value={youtubeUrl}
                onChange={(event) => setYoutubeUrl(event.target.value)}
                placeholder="https://www.youtube.com/live/..."
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="live-facebook">Facebook link</Label>
              <Input
                id="live-facebook"
                type="url"
                value={facebookUrl}
                onChange={(event) => setFacebookUrl(event.target.value)}
                placeholder="https://www.facebook.com/.../videos/..."
                maxLength={500}
              />
            </div>
            <p className="text-xs text-ui-subtle">Add at least one link. YouTube streams are shown on the website; Facebook opens as a link.</p>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={start.isPending || !title.trim() || !hasLink}>
                {isLive ? 'Update links' : 'Go live'}
              </Button>
              {isLive && (
                <Button type="button" variant="destructive" onClick={onEnd} disabled={end.isPending}>
                  End livestream
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Type-check, lint and build**

Run: `cd frontend && npm run -s type-check && npm run -s lint && npm run -s build`
Expected: no type or lint errors, and the build lists `/admin/live`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/admin/live/page.tsx frontend/src/components/layout/AdminSidebar.tsx
git commit -m "feat(web): admin Livestream page with go live, update links and end

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Mobile live card, admin Livestream screen and push routing

**Files:**
- Modify:
  - `mobile/src/hooks/use-api.ts` (directly before `export const useMemberSearch`)
  - `mobile/src/app/(tabs)/index.tsx` (the card at the top of the screen content, replacing the fake card; Ruling 8)
  - `mobile/src/lib/push.ts` (`case 'live'` directly after the `prayer` case)
  - `mobile/src/app/admin.tsx` (a QuickAction directly after the Announcement QuickAction)
- Create:
  - `mobile/src/components/live-card.tsx`
  - `mobile/src/app/admin-live.tsx`

**Interfaces:**
- Consumes: `GET /api/live`, `POST /api/admin/live/start` and `POST /api/admin/live/end` (Task 3). The response shapes are the same as on the web (Task 4).
- Produces (from `@/hooks/use-api`):
  - `type LiveState`
  - `type LiveStartInput`
  - `getLiveErrorMessage(error, fallback) → string`
  - `useLiveStream()`, under key `['live']`, returning `LiveState | null`
  - `useStartLive()` and `useEndLive()`, which both invalidate `['live']`
- Also produces: `LiveCard` (from `@/components/live-card`) and the `/admin-live` route.

- [ ] **Step 1: Add the hooks**

In `mobile/src/hooks/use-api.ts`, directly before the line `export const useMemberSearch = (term: string, enabled = true) => {`, insert:

```ts
export type LiveState = {
  is_live: boolean;
  title: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  youtube_embed_url: string | null;
  started_at: string | null;
};

export type LiveStartInput = { title: string; youtubeUrl?: string; facebookUrl?: string };

type LiveResult<T> = { data: T; message: string };

// Validation errors carry the useful text in details[0].message, not in "error".
export const getLiveErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.details?.[0]?.message || getApiErrorMessage(error, fallback);

export const useLiveStream = () =>
  useQuery({
    queryKey: ['live'],
    queryFn: async (): Promise<LiveState | null> => {
      const response = await apiClient.get('/live');
      return response.data?.data ?? null;
    },
  });

export const useStartLive = () =>
  useMutation({
    mutationFn: async (input: LiveStartInput) => {
      const response = await apiClient.post('/admin/live/start', input);
      return response.data as LiveResult<LiveState & { notified: boolean }>;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['live'] }),
  });

export const useEndLive = () =>
  useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/admin/live/end');
      return response.data as LiveResult<LiveState>;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['live'] }),
  });

```

- [ ] **Step 2: Create the live card**

The card shows only while live. It refetches whenever the home screen gains focus, and its links open with `Linking.openURL`, which hands them to the YouTube or Facebook app when installed.

Create `mobile/src/components/live-card.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useLiveStream } from '@/hooks/use-api';

const LIVE_RED = '#DC2626';

const openLink = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open the link', 'Please try again in a moment.');
  }
};

// Home screen card, shown only while the church is live; refreshed whenever the screen gains focus.
export function LiveCard() {
  const { data: live, refetch } = useLiveStream();

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (!live?.is_live) return null;

  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <View style={styles.dot} />
        <ThemedText type="smallBold" style={styles.badgeText}>
          Live now
        </ThemedText>
      </View>
      <ThemedText type="subtitle" style={styles.title}>
        {live.title || "We're live"}
      </ThemedText>
      <View style={styles.buttons}>
        {live.youtube_url ? <WatchButton icon="logo-youtube" label="Watch on YouTube" url={live.youtube_url} /> : null}
        {live.facebook_url ? <WatchButton icon="logo-facebook" label="Watch on Facebook" url={live.facebook_url} /> : null}
      </View>
    </View>
  );
}

function WatchButton({
  icon,
  label,
  url,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  url: string;
}) {
  return (
    <Pressable onPress={() => openLink(url)} style={styles.watchButton} accessibilityRole="link">
      <Ionicons name={icon} size={16} color={LIVE_RED} />
      <ThemedText type="defaultSemiBold" style={styles.watchText}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LIVE_RED,
    borderRadius: Radius.large,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  watchText: {
    color: LIVE_RED,
    fontWeight: '800',
  },
});
```

- [ ] **Step 3: Put the card on the home screen and remove the fake one**

In `mobile/src/app/(tabs)/index.tsx`:

1. Directly after `import { BrandScreen } from '@/components/brand-ui';`, add:

   ```tsx
   import { LiveCard } from '@/components/live-card';
   ```

2. At the top of the screen content, directly after the header row's closing `</View>` (the one after the notifications `</Pressable>`) and before `{devotionalQuery.data ? (`, add:

   ```tsx
         <LiveCard />

   ```

3. Delete the hard-coded card. This is the whole block from `<View style={[styles.liveCard, { backgroundColor: theme.tint }]}>` to its closing `</View>`, plus the blank line after it. It sits just before `<Pressable onPress={() => router.push('/events')}`:

   ```tsx
         <View style={[styles.liveCard, { backgroundColor: theme.tint }]}>
           <View style={styles.liveBadge}>
             <View style={styles.livePulse} />
             <ThemedText type="smallBold" style={styles.liveBadgeText}>
               Live now
             </ThemedText>
           </View>

           <ThemedText type="subtitle" style={styles.liveTitle}>
             Sunday Worship Service
           </ThemedText>
           <ThemedText type="default" style={styles.liveDescription}>
             Join us as we worship together
           </ThemedText>

           <Pressable onPress={() => router.push('/sermons' as never)} style={styles.watchButton}>
             <Ionicons name="play" size={16} color={theme.tint} />
             <ThemedText type="defaultSemiBold" style={[styles.watchButtonText, { color: theme.tint }]}>
               Watch Live
             </ThemedText>
           </Pressable>
         </View>
   ```

4. In `StyleSheet.create`, delete the eight styles that are now unused: `liveCard`, `liveBadge`, `livePulse`, `liveBadgeText`, `liveTitle`, `liveDescription`, `watchButton` and `watchButtonText`. They form one contiguous run, from `liveCard: {` to the `},` that closes `watchButtonText`. Delete nothing else.

Then confirm that nothing in the file still mentions them:

```bash
grep -nE "liveCard|liveBadge|livePulse|liveTitle|liveDescription|watchButton" "mobile/src/app/(tabs)/index.tsx"
```

Expected: no output.

- [ ] **Step 4: Route `live` push taps to the home screen**

In `mobile/src/lib/push.ts`, inside `routeForNotification`, directly after:

```ts
    case 'prayer':
      return '/prayer-wall';
```

add:

```ts
    case 'live':
      return '/';
```

- [ ] **Step 5: Create the admin Livestream screen**

Create `mobile/src/app/admin-live.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandButton, BrandCard } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getApiErrorMessage, getLiveErrorMessage, useEndLive, useLiveStream, useStartLive } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

export default function AdminLiveScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const liveQuery = useLiveStream();
  const startMutation = useStartLive();
  const endMutation = useEndLive();
  const [title, setTitle] = React.useState('');
  const [youtubeUrl, setYoutubeUrl] = React.useState('');
  const [facebookUrl, setFacebookUrl] = React.useState('');
  const filledFromLive = React.useRef(false);
  const live = liveQuery.data;

  // While live, start from the current title and links so they can be corrected.
  React.useEffect(() => {
    if (filledFromLive.current || !live?.is_live) return;
    filledFromLive.current = true;
    setTitle(live.title ?? '');
    setYoutubeUrl(live.youtube_url ?? '');
    setFacebookUrl(live.facebook_url ?? '');
  }, [live]);

  if (!user || !isAdmin) return null;

  const isLive = Boolean(live?.is_live);

  const onStart = () => {
    if (startMutation.isPending) return;
    if (!title.trim()) {
      Alert.alert('Missing title', 'Add a title for the livestream.');
      return;
    }
    if (!youtubeUrl.trim() && !facebookUrl.trim()) {
      Alert.alert('Missing link', 'Add a YouTube or Facebook link.');
      return;
    }
    startMutation.mutate(
      { title: title.trim(), youtubeUrl: youtubeUrl.trim() || undefined, facebookUrl: facebookUrl.trim() || undefined },
      {
        onSuccess: (result) => Alert.alert(result?.data?.notified ? "You're live" : 'Updated', result?.message || 'Livestream updated'),
        onError: (error) => Alert.alert('Could not go live', getLiveErrorMessage(error, 'Please try again.')),
      }
    );
  };

  const onEnd = () => {
    if (endMutation.isPending) return;
    Alert.alert('End the livestream?', 'The live card will disappear for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: () =>
          endMutation.mutate(undefined, {
            onSuccess: (result) => Alert.alert('Ended', result?.message || 'Livestream ended'),
            onError: (error) => Alert.alert('Could not end', getApiErrorMessage(error, 'Please try again.')),
          }),
      },
    ]);
  };

  const inputStyle = [styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }];

  return (
    <AdminShell activeTab="/admin">
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#818CF8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Livestream</ThemedText>
        </View>
      </View>

      <BrandCard>
        <ThemedText type="smallBold">Status</ThemedText>
        {isLive ? (
          <>
            <ThemedText type="defaultSemiBold" style={styles.liveText}>
              {`Live now: ${live?.title ?? ''}`}
            </ThemedText>
            {live?.started_at ? (
              <ThemedText type="small" themeColor="textSecondary">
                {`Since ${new Date(live.started_at).toLocaleString()}`}
              </ThemedText>
            ) : null}
          </>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            {liveQuery.isLoading ? 'Loading...' : 'Not live.'}
          </ThemedText>
        )}
      </BrandCard>

      <BrandCard>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title (e.g. Sunday Worship Service)"
          placeholderTextColor={theme.textSecondary}
          maxLength={255}
          style={inputStyle}
        />
        <TextInput
          value={youtubeUrl}
          onChangeText={setYoutubeUrl}
          placeholder="YouTube link"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          maxLength={500}
          style={inputStyle}
        />
        <TextInput
          value={facebookUrl}
          onChangeText={setFacebookUrl}
          placeholder="Facebook link"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          maxLength={500}
          style={inputStyle}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Everyone is notified once when you go live. Updating the links while live does not notify again.
        </ThemedText>
        <BrandButton label={isLive ? 'Update links' : 'Go live'} variant="secondary" onPress={onStart} />
        {isLive ? <BrandButton label="End livestream" variant="outline" onPress={onEnd} /> : null}
      </BrandCard>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  liveText: { color: '#EF4444' },
});
```

- [ ] **Step 6: Add the QuickAction**

In `mobile/src/app/admin.tsx`, directly after the line:

```tsx
        <QuickAction icon="megaphone-outline" label="Announcement" color={theme.tint} onPress={() => router.push('/admin-announcements' as never)} />
```

add:

```tsx
        <QuickAction icon="radio-outline" label="Livestream" color="#EF4444" onPress={() => router.push('/admin-live' as never)} />
```

- [ ] **Step 7: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: no errors (warnings that already existed may remain), and the output ends with `mobile-ok`.

- [ ] **Step 8: Commit**

```bash
git add mobile/src/hooks/use-api.ts mobile/src/components/live-card.tsx "mobile/src/app/(tabs)/index.tsx" mobile/src/lib/push.ts mobile/src/app/admin-live.tsx mobile/src/app/admin.tsx
git commit -m "feat(mobile): live card on home, admin Livestream screen, live push routing

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Documentation and final checks

**Files:**
- Modify (append at the end of each file only): `docs/features.md`, `docs/qa-checklist.md`, `docs/deployment.md`

- [ ] **Step 1: Document the feature**

Append to `docs/features.md`:

```markdown

## Livestream

- Admins go live from web `/admin/live` or the mobile Livestream screen. They enter a title and a YouTube and/or Facebook link (https only; YouTube on youtube.com or youtu.be, Facebook on facebook.com or fb.watch).
- Going live shows a red "We're live" banner on every web page (refreshed every minute) and a live card at the top of the mobile home screen (refreshed when the screen opens).
- `/live` embeds the YouTube stream when the link contains a video ID (`watch?v=`, `youtu.be/`, `/live/`, `/embed/`), and offers "Watch on YouTube" and "Watch on Facebook" buttons. Facebook is never embedded. On mobile, the buttons open the YouTube or Facebook app.
- Everyone is notified exactly once per stream, even if two admins press "Go live" together. Updating the links while live does not notify again.
- "End" takes the banner and card down for everyone and is safe to press twice. Every start, update and end is in the audit log.
```

- [ ] **Step 2: Add the QA steps**

Append to `docs/qa-checklist.md`:

```markdown

## Livestream

- [ ] On web `/admin/live`, enter a title and a YouTube `/live/<id>` link and press "Go live"; the toast says everyone was notified
- [ ] The red banner appears on public pages within a minute; clicking it opens `/live` with the YouTube player
- [ ] Members receive one in-app notification (and one push on phones); the web bell opens `/live` and a push tap opens the mobile home screen
- [ ] Press "Go live" twice quickly (or from web and phone together): still only one notification
- [ ] Change the YouTube link while live and press "Update links": the player changes and no new notification is sent
- [ ] A Facebook-only stream shows the "Watch on Facebook" button and no player; on the phone it opens the Facebook app
- [ ] A `http://` link, a non-YouTube/Facebook link, or no link at all is refused with a clear message
- [ ] The mobile home live card appears when the app is reopened and its buttons open YouTube/Facebook
- [ ] "End" removes the banner, the `/live` player ("We're not live right now") and the mobile card; pressing End again is harmless
- [ ] The audit log shows the start, update and end entries
```

- [ ] **Step 3: Add the deployment note**

Append to `docs/deployment.md`:

```markdown

## Livestream

No new settings or packages. The `migrate:features` step in the Render build creates the single-row `live_stream` table. The mobile live card and admin screen use only built-in modules, so an over-the-air update is enough; no new EAS build is needed for this feature.
```

- [ ] **Step 4: Run all checks**

```bash
cd backend && DATABASE_URL="postgresql://x:y@localhost:5432/z" npx prisma validate && node --check migrations/migrateFeatureUpdates.js && npx jest --runInBand --coverage=false && npx eslint src/ tests/ && cd ..
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build && cd ..
cd mobile && npm run -s lint && npx tsc --noEmit && cd ..
git status --short
```

Expected:
- **387** backend tests pass.
- There are no lint or type errors, and the web build succeeds.
- `git status` shows nothing uncommitted except the docs. If `backend/pnpm-workspace.yaml` appears, revert it with `git checkout -- backend/pnpm-workspace.yaml`.

- [ ] **Step 5: Commit**

```bash
git add docs/features.md docs/qa-checklist.md docs/deployment.md
git commit -m "docs: livestream feature, QA steps and deployment note

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Do not push or merge. The owner merges `feature/livestream` together with Phase 7b. Expect a conflict only in `backend/migrations/migrateFeatureUpdates.js` (both phases insert before `COMMIT`), and keep both blocks.
