# Phase 0 + 1: Notification Helper and Prayer Wall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared notification helper, and turn the placeholder Prayer Wall into a real, members-only wall. Members opt in to share their prayer request there, other members tap "I prayed", and the requester is notified at milestones.

**Architecture:**
- `notificationService.notify()` becomes the single entry point for notifications. It wraps `notificationModel` and never throws, so later phases can add push delivery in one place.
- The wall extends the existing `PrayerRequest` model with an opt-in flag and a counter, plus a `PrayerIntercession` table. The table's unique constraint guarantees one prayer per member per request.
- Web and mobile get new query and mutation hooks and rewritten wall screens.
- Two existing bugs are fixed along the way:
  - `GET /api/prayers/:id` leaks other members' private requests.
  - The mobile "+" button submits a canned request without asking the member.

**Tech Stack:**
- Backend: Express 4, Prisma 6 (PostgreSQL), Jest 29 and supertest
- Web: Next.js 16 (React 18), TanStack Query 5
- Mobile: Expo SDK 55 / expo-router, TanStack Query 5

**Spec:** `docs/superpowers/specs/2026-09-28-mockups-real-design.md` (sections 4 and 5.1). The roadmap is in `docs/superpowers/plans/2026-09-28-00-roadmap.md`.

## Global Constraints

- **Visibility:** the prayer wall is for signed-in members only. Every wall endpoint uses `isAuthenticated`, and the web page is wrapped in `RouteGuard`.
- **Opt-in:** `shareOnWall` defaults to `false`, so existing requests stay private.
- **What the wall shows:** only requests with `share_on_wall = true AND status IN ('approved', 'answered')`, newest first.
- **Anonymous requests:** the author is shown as exactly `A church member`, and wall responses never include `user_id` or a name.
- **Milestones:** the requester is notified when the prayer count reaches exactly `[1, 5, 10, 25, 50, 100]`.
- **Response format:** backend responses use `apiResponse(success, data, message, meta)` with snake_case keys (`toSnakeCaseObject` or explicit snake_case mapping).
- **Schema changes:** every change goes both in `backend/prisma/schema.prisma` **and** as idempotent SQL in `backend/migrations/migrateFeatureUpdates.js`.
- **Dependencies:** no new backend dependencies.
- **Notifications:** a notification failure must never fail the request that caused it.
- **Commits:** every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

These cases are the ones most likely to hurt a real user. Each has a test in the task named.

1. **Editing an approved request.** A member edits the text of a request that's already approved and shared. It must go back to `pending`, so unmoderated text never appears on the wall. *(Task 4)*
2. **Malformed IDs.** Values like `/api/prayers/abc/pray` or `/api/prayers/1.5` must return 404, not a 500 from Prisma. *(Tasks 3 and 6)*
3. **Double taps.** Tapping "I prayed" twice, or two taps racing, must add exactly one prayer. A repeat returns the current count and triggers no notification. *(Task 6)*
4. **Anonymous authors never leak.** No field in a wall item can identify the author of an anonymous request. *(Task 5)*
5. **Requests that leave the wall.** Praying for a request that was un-shared, deleted, or is still pending returns 404. A requester praying for their own request never notifies themselves. *(Task 6)*

---

## File Map

| File | Change | Responsibility |
|---|---|---|
| `backend/src/services/notificationService.js` | Create | `notify` / `notifyAll`; never throws |
| `backend/src/models/notificationModel.js` | Modify | Add `createNotificationsForUsers` (bulk insert) |
| `backend/prisma/schema.prisma` | Modify | `PrayerRequest.shareOnWall`, `prayerCount`; `PrayerIntercession` model |
| `backend/migrations/migrateFeatureUpdates.js` | Modify | Idempotent SQL for the above |
| `backend/src/models/prayerRequestModel.js` | Modify | `shareOnWall` on create/update, `getWallPrayerRequests`, `countWallPrayerRequests`, `recordIntercession`, `toWallItem` |
| `backend/src/controllers/prayerRequestController.js` | Modify | Owner check, return to pending on edit, `getPrayerWall`, `prayForRequest`, switch to `notificationService` |
| `backend/src/routes/prayerRequestRoutes.js` | Modify | `GET /wall`, `POST /:id/pray` (placed before `/:id`) |
| `backend/src/middleware/validators.js` | Modify | Optional boolean `isAnonymous`, `shareOnWall` |
| `backend/tests/services/notificationService.test.js` | Create | Helper tests |
| `backend/tests/api/prayerWall.test.js` | Create | Route and controller tests |
| `backend/tests/models/prayerWallMapper.test.js` | Create | Anonymity mapper tests |
| `frontend/src/hooks/useApi.ts` | Modify | `WallPrayer` type, `usePrayerWall`, `usePrayForRequest` |
| `frontend/src/app/prayer/wall/page.tsx` | Create | Wall page |
| `frontend/src/app/prayer/new/page.tsx` | Modify | "Share on the prayer wall" checkbox |
| `frontend/src/app/admin/prayers/page.tsx` | Modify | "Wall" column so admins know what they're approving |
| `frontend/src/components/layout/Header.tsx` | Modify | "Prayer" nav link |
| `mobile/src/hooks/use-api.ts` | Modify | `shareOnWall` in `PrayerPayload`, `usePrayerWall`, `usePrayForRequest` |
| `mobile/src/app/prayer-wall.tsx` | Rewrite | Real wall plus "My requests" tab; "+" opens the form |
| `mobile/src/app/prayers.tsx` | Modify | `shareOnWall` switch |
| `docs/features.md`, `docs/qa-checklist.md` | Modify | Document the feature |

---

### Task 1: Branch and baseline commit

**Files:** none changed; this task only records the existing work.

- [ ] **Step 1: Create the feature branch**

```bash
cd ANT-Presby
git checkout -b feature/placeholder-features
```

- [ ] **Step 2: Confirm the security-fix baseline passes before committing it**

```bash
cd backend && npx jest --runInBand --coverage=false && npx eslint src/ tests/ && cd ..
cd frontend && npm run -s type-check && npm run -s lint && cd ..
```

Expected: 26 tests pass, and there's no lint or type output.

- [ ] **Step 3: Commit the security fixes as their own baseline commit**

```bash
git add backend frontend docker-compose.yml render.yaml
git commit -m "fix: harden OAuth redirects, donations, uploads, webhook and rate limiting

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Commit the spec and plans**

```bash
git add docs/superpowers
git commit -m "docs: spec and plans for placeholder features

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Notification helper (Phase 0)

**Files:**
- Create: `backend/src/services/notificationService.js`
- Modify: `backend/src/models/notificationModel.js` (add a function before `module.exports`, and export it)
- Test: `backend/tests/services/notificationService.test.js`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `notify({ userIds: number[], title: string, message: string, type: string, entityType?: string|null, entityId?: number|null }) → Promise<{ inApp: number, push: number }>`
  - `notifyAll({ title, message, type, entityType?, entityId? }) → Promise<{ inApp: number, push: number }>`
  - Neither function ever rejects.
  - The model gains `createNotificationsForUsers(userIds, title, message, type, entityType, entityId) → Promise<number>`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/services/notificationService.test.js`:

```js
describe('notificationService', () => {
  let notificationModel;
  let notificationService;

  beforeEach(() => {
    jest.resetModules();
    notificationModel = {
      createNotificationsForUsers: jest.fn().mockResolvedValue(2),
      createNotificationForAllUsers: jest.fn().mockResolvedValue(40),
    };
    jest.doMock('../../src/models/notificationModel', () => notificationModel);
    notificationService = require('../../src/services/notificationService');
  });

  test('notify de-duplicates ids, drops invalid ones, and inserts in one call', async () => {
    const result = await notificationService.notify({
      userIds: [7, '7', 9, 0, -1, 'abc', null],
      title: 'Hello',
      message: 'World',
      type: 'prayer',
      entityType: 'prayer',
      entityId: 3,
    });

    expect(notificationModel.createNotificationsForUsers).toHaveBeenCalledWith(
      [7, 9],
      'Hello',
      'World',
      'prayer',
      'prayer',
      3
    );
    expect(result).toEqual({ inApp: 2, push: 0 });
  });

  test('notify with no valid recipients does nothing', async () => {
    const result = await notificationService.notify({ userIds: [], title: 't', message: 'm', type: 'x' });
    expect(notificationModel.createNotificationsForUsers).not.toHaveBeenCalled();
    expect(result).toEqual({ inApp: 0, push: 0 });
  });

  test('notify never throws when the database fails', async () => {
    notificationModel.createNotificationsForUsers.mockRejectedValue(new Error('db down'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(
      notificationService.notify({ userIds: [1], title: 't', message: 'm', type: 'x' })
    ).resolves.toEqual({ inApp: 0, push: 0 });

    warn.mockRestore();
  });

  test('notifyAll broadcasts and never throws', async () => {
    await expect(
      notificationService.notifyAll({ title: 't', message: 'm', type: 'devotional' })
    ).resolves.toEqual({ inApp: 40, push: 0 });

    notificationModel.createNotificationForAllUsers.mockRejectedValue(new Error('db down'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(
      notificationService.notifyAll({ title: 't', message: 'm', type: 'devotional' })
    ).resolves.toEqual({ inApp: 0, push: 0 });
    warn.mockRestore();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && npx jest tests/services/notificationService.test.js --coverage=false`
Expected: FAIL with `Cannot find module '../../src/services/notificationService'`.

- [ ] **Step 3: Add the bulk insert to the model**

In `backend/src/models/notificationModel.js`, add this after `createNotificationForAllUsers`:

```js
// Create the same notification for several users in one insert
const createNotificationsForUsers = async (
  userIds,
  title,
  message,
  type,
  entityType = null,
  entityId = null
) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return 0;
  }

  const result = await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId: Number(userId),
      title,
      message,
      type,
      entityType,
      entityId,
      isRead: false,
    })),
  });

  return result.count;
};
```

Then add `createNotificationsForUsers,` to `module.exports`, directly after `createNotificationForAllUsers,`.

- [ ] **Step 4: Create the service**

Create `backend/src/services/notificationService.js`:

```js
const notificationModel = require('../models/notificationModel');

/**
 * Single entry point for user notifications.
 * Phase 6 adds push delivery here; callers never need to change.
 * These functions never throw: a failed notification must not fail the action that caused it.
 */

const toRecipientIds = (userIds = []) => [
  ...new Set(
    (Array.isArray(userIds) ? userIds : [])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)
  ),
];

const notify = async ({ userIds, title, message, type, entityType = null, entityId = null }) => {
  const recipients = toRecipientIds(userIds);

  if (recipients.length === 0) {
    return { inApp: 0, push: 0 };
  }

  try {
    const inApp = await notificationModel.createNotificationsForUsers(
      recipients,
      title,
      message,
      type,
      entityType,
      entityId
    );
    return { inApp, push: 0 };
  } catch (error) {
    console.warn('Notification skipped:', error.message);
    return { inApp: 0, push: 0 };
  }
};

const notifyAll = async ({ title, message, type, entityType = null, entityId = null }) => {
  try {
    const inApp = await notificationModel.createNotificationForAllUsers(
      title,
      message,
      type,
      entityType,
      entityId
    );
    return { inApp, push: 0 };
  } catch (error) {
    console.warn('Broadcast notification skipped:', error.message);
    return { inApp: 0, push: 0 };
  }
};

module.exports = {
  notify,
  notifyAll,
};
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd backend && npx jest tests/services/notificationService.test.js --coverage=false`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/notificationService.js backend/src/models/notificationModel.js backend/tests/services/notificationService.test.js
git commit -m "feat: add notification service as single entry point for notifications

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Stop members reading other members' private prayer requests

This fixes the existing `GET /api/prayers/:id` bug and adds the ID parsing used later. It also switches approval notifications to the new helper.

**Files:**
- Modify: `backend/src/controllers/prayerRequestController.js`
- Test: `backend/tests/api/prayerWall.test.js` (created here; later tasks add to it)

**Interfaces:**
- Consumes: `notificationService.notify` (Task 2).
- Produces:
  - `parseId(value) → number | null`, a controller-local helper. It accepts only positive integer strings.
  - `getPrayerRequestById` returns 404 unless the caller is the owner or an admin.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/api/prayerWall.test.js`:

```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const tokenFor = (userId, role = 'member') =>
  jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET, { expiresIn: '10m' });

describe('Prayer requests and prayer wall', () => {
  let app;
  let prayerRequestModel;
  let notificationService;

  beforeEach(() => {
    jest.resetModules();

    prayerRequestModel = {
      createPrayerRequest: jest.fn().mockResolvedValue({ id: 1 }),
      getAllPrayerRequests: jest.fn().mockResolvedValue([]),
      countPrayerRequests: jest.fn().mockResolvedValue(0),
      getPrayerRequestById: jest.fn(),
      getUserPrayerRequests: jest.fn().mockResolvedValue([]),
      updatePrayerRequestStatus: jest.fn().mockResolvedValue({ id: 1 }),
      updatePrayerRequest: jest.fn().mockResolvedValue({ id: 1 }),
      deletePrayerRequest: jest.fn().mockResolvedValue({ id: 1 }),
      getPrayerStatistics: jest.fn().mockResolvedValue({}),
      getWallPrayerRequests: jest.fn().mockResolvedValue([]),
      countWallPrayerRequests: jest.fn().mockResolvedValue(0),
      recordIntercession: jest.fn(),
    };
    notificationService = {
      notify: jest.fn().mockResolvedValue({ inApp: 1, push: 0 }),
      notifyAll: jest.fn().mockResolvedValue({ inApp: 0, push: 0 }),
    };

    jest.doMock('../../src/models/prayerRequestModel', () => prayerRequestModel);
    jest.doMock('../../src/services/notificationService', () => notificationService);

    const prayerRoutes = require('../../src/routes/prayerRequestRoutes');
    const { errorHandler } = require('../../src/middleware/errorHandler');

    app = express();
    app.use(express.json());
    app.use('/api/prayers', prayerRoutes);
    app.use(errorHandler);
  });

  describe('GET /api/prayers/:id', () => {
    test("returns 404 for another member's request", async () => {
      prayerRequestModel.getPrayerRequestById.mockResolvedValue({ id: 9, user_id: 99, title: 'Private' });

      const response = await request(app)
        .get('/api/prayers/9')
        .set('Authorization', `Bearer ${tokenFor(7)}`);

      expect(response.status).toBe(404);
    });

    test('returns the request to its owner', async () => {
      prayerRequestModel.getPrayerRequestById.mockResolvedValue({ id: 9, user_id: 7, title: 'Mine' });

      const response = await request(app)
        .get('/api/prayers/9')
        .set('Authorization', `Bearer ${tokenFor(7)}`);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Mine');
    });

    test('returns any request to an admin', async () => {
      prayerRequestModel.getPrayerRequestById.mockResolvedValue({ id: 9, user_id: 99, title: 'Private' });

      const response = await request(app)
        .get('/api/prayers/9')
        .set('Authorization', `Bearer ${tokenFor(1, 'admin')}`);

      expect(response.status).toBe(200);
    });

    test('returns 404 for a malformed id without querying the database', async () => {
      const response = await request(app)
        .get('/api/prayers/abc')
        .set('Authorization', `Bearer ${tokenFor(7)}`);

      expect(response.status).toBe(404);
      expect(prayerRequestModel.getPrayerRequestById).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/prayers/:id/approve', () => {
    test('notifies the requester through the notification service', async () => {
      prayerRequestModel.getPrayerRequestById.mockResolvedValue({ id: 9, user_id: 42, title: 'Healing' });

      const response = await request(app)
        .post('/api/prayers/9/approve')
        .set('Authorization', `Bearer ${tokenFor(1, 'admin')}`);

      expect(response.status).toBe(200);
      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userIds: [42], type: 'prayer', entityType: 'prayer', entityId: 9 })
      );
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && npx jest tests/api/prayerWall.test.js --coverage=false`
Expected: FAIL. "returns 404 for another member's request" receives 200; the malformed id receives 500 or calls the model; approve calls `notificationModel`, not `notify`.

- [ ] **Step 3: Update the controller**

In `backend/src/controllers/prayerRequestController.js`:

1. Replace the import `const notificationModel = require('../models/notificationModel');` with:

```js
const { notify } = require('../services/notificationService');

const parseId = (value) => {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 && String(id) === String(value) ? id : null;
};

const isOwnerOrAdmin = (prayerRequest, user) =>
  user.role === 'admin' || Number(prayerRequest.user_id) === Number(user.userId);
```

2. Replace the body of `getPrayerRequestById` with:

```js
const getPrayerRequestById = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const prayerRequest = id ? await prayerRequestModel.getPrayerRequestById(id) : undefined;

    // 404 (not 403) so members can't discover which private requests exist.
    if (!prayerRequest || !isOwnerOrAdmin(prayerRequest, req.user)) {
      return res.status(404).json(apiResponse(false, null, 'Prayer request not found'));
    }

    res.json(apiResponse(true, prayerRequest, 'Prayer request retrieved'));
  } catch (error) {
    next(error);
  }
};
```

3. In `approvePrayerRequest`, replace the `try { await notificationModel.createNotification(...) } catch ...` block with:

```js
    await notify({
      userIds: [prayerRequest.user_id],
      title: 'Prayer update',
      message: `Your prayer request "${prayerRequest.title}" has been approved.`,
      type: 'prayer',
      entityType: 'prayer',
      entityId: Number(id),
    });
```

4. In `markAsAnswered`, replace its `try { await notificationModel.createNotification(...) } catch ...` block with:

```js
    await notify({
      userIds: [prayerRequest.user_id],
      title: 'Prayer answered update',
      message: `Your prayer request "${prayerRequest.title}" has been marked as answered.`,
      type: 'prayer',
      entityType: 'prayer',
      entityId: Number(id),
    });
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd backend && npx jest tests/api/prayerWall.test.js --coverage=false`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/prayerRequestController.js backend/tests/api/prayerWall.test.js
git commit -m "fix: only owners and admins can read a prayer request

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Schema, migration, and the share-on-wall option

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/migrations/migrateFeatureUpdates.js` (insert before `await client.query('COMMIT');`)
- Modify: `backend/src/middleware/validators.js` (`validatePrayerRequest`)
- Modify: `backend/src/models/prayerRequestModel.js` (`createPrayerRequest`, `getAllPrayerRequests` select, `buildPrayerRequestUpdateData`)
- Modify: `backend/src/controllers/prayerRequestController.js` (`createPrayerRequest`, `updatePrayerRequest`)
- Test: `backend/tests/api/prayerWall.test.js` (add a `describe` block)

**Interfaces:**
- Consumes: `parseId` and `isOwnerOrAdmin` (Task 3).
- Produces:
  - Prisma fields `PrayerRequest.shareOnWall: boolean` and `PrayerRequest.prayerCount: number`.
  - Model `PrayerIntercession { id, prayerRequestId, userId, createdAt }`, with the compound unique key `prayerRequestId_userId`.
  - `prayerRequestModel.createPrayerRequest(userId, title, description, category, isAnonymous = false, shareOnWall = false)`.
  - `buildPrayerRequestUpdateData` accepts `shareOnWall`.

- [ ] **Step 1: Write the failing tests**

Add this `describe` block inside the top-level `describe` in `backend/tests/api/prayerWall.test.js`:

```js
  describe('sharing on the wall', () => {
    const validBody = {
      title: 'Healing',
      description: 'Please pray for my mother',
      category: 'health',
    };

    test('create passes shareOnWall to the model', async () => {
      const response = await request(app)
        .post('/api/prayers')
        .set('Authorization', `Bearer ${tokenFor(7)}`)
        .send({ ...validBody, shareOnWall: true });

      expect(response.status).toBe(201);
      expect(prayerRequestModel.createPrayerRequest).toHaveBeenCalledWith(
        7,
        'Healing',
        'Please pray for my mother',
        'health',
        false,
        true
      );
    });

    test('create rejects a non-boolean shareOnWall', async () => {
      const response = await request(app)
        .post('/api/prayers')
        .set('Authorization', `Bearer ${tokenFor(7)}`)
        .send({ ...validBody, shareOnWall: 'yes please' });

      expect(response.status).toBe(400);
    });

    test('an owner editing the text of an approved request sends it back to pending', async () => {
      prayerRequestModel.getPrayerRequestById.mockResolvedValue({
        id: 9,
        user_id: 7,
        status: 'approved',
        ...validBody,
      });

      await request(app)
        .put('/api/prayers/9')
        .set('Authorization', `Bearer ${tokenFor(7)}`)
        .send({ ...validBody, description: 'Something new that nobody reviewed' });

      expect(prayerRequestModel.updatePrayerRequest).toHaveBeenCalledWith(
        9,
        expect.objectContaining({ status: 'pending' })
      );
    });

    test('an owner only toggling shareOnWall keeps the approval', async () => {
      prayerRequestModel.getPrayerRequestById.mockResolvedValue({
        id: 9,
        user_id: 7,
        status: 'approved',
        ...validBody,
      });

      await request(app)
        .put('/api/prayers/9')
        .set('Authorization', `Bearer ${tokenFor(7)}`)
        .send({ ...validBody, shareOnWall: true });

      const updates = prayerRequestModel.updatePrayerRequest.mock.calls[0][1];
      expect(updates.shareOnWall).toBe(true);
      expect(updates.status).toBeUndefined();
    });

    test('an admin editing text keeps the status', async () => {
      prayerRequestModel.getPrayerRequestById.mockResolvedValue({
        id: 9,
        user_id: 7,
        status: 'approved',
        ...validBody,
      });

      await request(app)
        .put('/api/prayers/9')
        .set('Authorization', `Bearer ${tokenFor(1, 'admin')}`)
        .send({ ...validBody, description: 'Typo fixed by admin' });

      const updates = prayerRequestModel.updatePrayerRequest.mock.calls[0][1];
      expect(updates.status).toBeUndefined();
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/api/prayerWall.test.js --coverage=false`
Expected: FAIL on all five new tests. The model isn't called with the 6th argument, non-boolean values are accepted, the status isn't reset, and `shareOnWall` isn't passed through.

- [ ] **Step 3: Update the Prisma schema**

In `backend/prisma/schema.prisma`:

a. In `model PrayerRequest`, add these lines after `approvedBy ...` and before `createdAt`:

```prisma
  shareOnWall Boolean        @default(false) @map("share_on_wall")
  prayerCount Int            @default(0) @map("prayer_count")
```

b. In the same model, add this after the `approver` relation line:

```prisma
  intercessions PrayerIntercession[]
```

c. In the same model, add this before `@@map("prayer_requests")`:

```prisma
  @@index([shareOnWall, status, createdAt(sort: Desc)], map: "idx_prayer_requests_wall")
```

d. In `model User`, add this next to its other relation fields:

```prisma
  prayerIntercessions PrayerIntercession[]
```

e. Add this new model directly after `model PrayerRequest { ... }`:

```prisma
model PrayerIntercession {
  id              Int           @id @default(autoincrement())
  prayerRequestId Int           @map("prayer_request_id")
  userId          Int           @map("user_id")
  createdAt       DateTime      @default(now()) @map("created_at")
  prayerRequest   PrayerRequest @relation(fields: [prayerRequestId], references: [id], onDelete: Cascade)
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([prayerRequestId, userId], map: "prayer_intercessions_request_user_unique")
  @@index([userId], map: "idx_prayer_intercessions_user")
  @@map("prayer_intercessions")
}
```

- [ ] **Step 4: Validate the schema and regenerate the client**

Run: `cd backend && npx prisma validate && npx prisma generate`
Expected: `The schema at prisma/schema.prisma is valid`, followed by `Generated Prisma Client`.

- [ ] **Step 5: Add the idempotent migration**

In `backend/migrations/migrateFeatureUpdates.js`, insert this directly before `await client.query('COMMIT');`:

```js
    // Prayer wall (phase 1)
    await client.query(`
      ALTER TABLE prayer_requests
      ADD COLUMN IF NOT EXISTS share_on_wall BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS prayer_count INTEGER NOT NULL DEFAULT 0;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_prayer_requests_wall
      ON prayer_requests(share_on_wall, status, created_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS prayer_intercessions (
        id SERIAL PRIMARY KEY,
        prayer_request_id INTEGER NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT prayer_intercessions_request_user_unique UNIQUE (prayer_request_id, user_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_prayer_intercessions_user
      ON prayer_intercessions(user_id);
    `);
```

If a local database is configured (`DATABASE_URL` in `backend/.env`), run `cd backend && npm run migrate:features` **twice**. Both runs should print `Feature update migration completed successfully.`, which proves the migration is safe to repeat. If no local database exists, skip this step and note in the task report that the migration was not run locally.

- [ ] **Step 6: Update the validator**

In `backend/src/middleware/validators.js`, replace `validatePrayerRequest` with:

```js
const validatePrayerRequest = [
  body('title').trim().notEmpty().withMessage('Prayer request title is required'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Prayer description is required'),
  body('category')
    .isIn(['personal', 'family', 'health', 'work', 'financial', 'other'])
    .withMessage('Invalid prayer category'),
  body('isAnonymous').optional().isBoolean({ strict: true }).withMessage('isAnonymous must be true or false'),
  body('shareOnWall').optional().isBoolean({ strict: true }).withMessage('shareOnWall must be true or false'),
];
```

- [ ] **Step 7: Update the model**

In `backend/src/models/prayerRequestModel.js`:

a. Replace `createPrayerRequest` with:

```js
// Create prayer request
const createPrayerRequest = async (
  userId,
  title,
  description,
  category,
  isAnonymous = false,
  shareOnWall = false
) => {
  const prayerRequest = await prisma.prayerRequest.create({
    data: {
      userId: Number(userId),
      title,
      description,
      category,
      isAnonymous,
      shareOnWall,
      status: 'pending',
    },
  });

  return toSnakeCaseObject(prayerRequest);
};
```

b. In `getAllPrayerRequests`, add `shareOnWall: true,` and `prayerCount: true,` to the `select`, after `isAnonymous: true,`.

c. In `buildPrayerRequestUpdateData`, add this after the `isAnonymous` line:

```js
  if (updates.shareOnWall !== undefined) data.shareOnWall = updates.shareOnWall;
```

- [ ] **Step 8: Update the controller**

In `backend/src/controllers/prayerRequestController.js`:

a. Replace `createPrayerRequest` with:

```js
// Create prayer request
const createPrayerRequest = async (req, res, next) => {
  try {
    const { title, description, category, isAnonymous, shareOnWall } = req.body;
    const userId = req.user.userId;

    const prayerRequest = await prayerRequestModel.createPrayerRequest(
      userId,
      title,
      description,
      category,
      isAnonymous === true,
      shareOnWall === true
    );

    res.status(201).json(apiResponse(true, prayerRequest, 'Prayer request submitted'));
  } catch (error) {
    next(error);
  }
};
```

b. Replace `updatePrayerRequest` with:

```js
// Update prayer request
const updatePrayerRequest = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const { title, description, category, isAnonymous, shareOnWall } = req.body;

    const prayerRequest = id ? await prayerRequestModel.getPrayerRequestById(id) : undefined;
    if (!prayerRequest) {
      return res.status(404).json(apiResponse(false, null, 'Prayer request not found'));
    }

    if (!isOwnerOrAdmin(prayerRequest, req.user)) {
      return res.status(403).json(apiResponse(false, null, 'Unauthorized'));
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (isAnonymous !== undefined) updates.isAnonymous = isAnonymous;
    if (shareOnWall !== undefined) updates.shareOnWall = shareOnWall;

    // Approved text is shown on the prayer wall, so a member's edit needs review again.
    const textChanged =
      (title !== undefined && title !== prayerRequest.title) ||
      (description !== undefined && description !== prayerRequest.description);
    if (req.user.role !== 'admin' && textChanged && prayerRequest.status !== 'pending') {
      updates.status = 'pending';
    }

    const updatedRequest = await prayerRequestModel.updatePrayerRequest(id, updates);

    res.json(apiResponse(true, updatedRequest, 'Prayer request updated'));
  } catch (error) {
    next(error);
  }
};
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `cd backend && npx jest tests/api/prayerWall.test.js --coverage=false`
Expected: PASS (10 tests).

- [ ] **Step 10: Commit**

```bash
git add backend/prisma/schema.prisma backend/migrations/migrateFeatureUpdates.js backend/src/middleware/validators.js backend/src/models/prayerRequestModel.js backend/src/controllers/prayerRequestController.js backend/tests/api/prayerWall.test.js
git commit -m "feat: let members opt prayer requests into the prayer wall

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Wall listing (model and API)

**Files:**
- Modify: `backend/src/models/prayerRequestModel.js` (add functions and exports)
- Modify: `backend/src/controllers/prayerRequestController.js` (add `getPrayerWall` and export it)
- Modify: `backend/src/routes/prayerRequestRoutes.js`
- Test: `backend/tests/models/prayerWallMapper.test.js` (create)
- Test: `backend/tests/api/prayerWall.test.js` (add a `describe` block)

**Interfaces:**
- Consumes: the Prisma fields from Task 4.
- Produces:
  - `prayerRequestModel.toWallItem(row) → { id, title, description, category, status, requester_name, prayer_count, prayed_by_me, created_at }`. The result never contains `user_id` or `user`.
  - `prayerRequestModel.getWallPrayerRequests({ offset, limit, category, viewerUserId }) → WallItem[]`
  - `prayerRequestModel.countWallPrayerRequests({ category }) → number`
  - `prayerRequestModel.WALL_STATUSES = ['approved', 'answered']`
  - `GET /api/prayers/wall?page&limit&category` → `{ success, data: WallItem[], message, meta }`

- [ ] **Step 1: Write the failing mapper test**

Create `backend/tests/models/prayerWallMapper.test.js`:

```js
const { toWallItem } = require('../../src/models/prayerRequestModel');

const baseRow = {
  id: 3,
  userId: 42,
  title: 'Job interview',
  description: 'Pray for peace',
  category: 'work',
  status: 'approved',
  prayerCount: 4,
  createdAt: new Date('2026-09-20T10:00:00Z'),
  user: { firstName: 'Ama', lastName: 'Mensah' },
  intercessions: [],
};

describe('toWallItem', () => {
  test('anonymous requests never identify the author', () => {
    const item = toWallItem({ ...baseRow, isAnonymous: true });

    expect(item.requester_name).toBe('A church member');
    expect(JSON.stringify(item)).not.toMatch(/Ama|Mensah|"user_id"|"user"|42/);
  });

  test('named requests show the member name', () => {
    const item = toWallItem({ ...baseRow, isAnonymous: false });
    expect(item.requester_name).toBe('Ama Mensah');
    expect(item).not.toHaveProperty('user_id');
  });

  test('prayed_by_me reflects the viewer intercession', () => {
    expect(toWallItem({ ...baseRow, isAnonymous: false }).prayed_by_me).toBe(false);
    expect(toWallItem({ ...baseRow, isAnonymous: false, intercessions: [{ id: 1 }] }).prayed_by_me).toBe(true);
  });

  test('exposes exactly the public wall fields', () => {
    const item = toWallItem({ ...baseRow, isAnonymous: false });
    expect(Object.keys(item).sort()).toEqual(
      [
        'category',
        'created_at',
        'description',
        'id',
        'prayed_by_me',
        'prayer_count',
        'requester_name',
        'status',
        'title',
      ].sort()
    );
  });
});
```

Note: requiring the real model loads `src/config/prisma.js`, which builds a Prisma client without connecting. That's safe offline; `tests/api/security.test.js` already does the same through `src/server.js`.

- [ ] **Step 2: Write the failing route tests**

Add inside the top-level `describe` in `backend/tests/api/prayerWall.test.js`:

```js
  describe('GET /api/prayers/wall', () => {
    test('requires sign-in', async () => {
      const response = await request(app).get('/api/prayers/wall');
      expect(response.status).toBe(401);
    });

    test('returns the wall for the viewer with pagination meta', async () => {
      prayerRequestModel.getWallPrayerRequests.mockResolvedValue([{ id: 3, requester_name: 'A church member' }]);
      prayerRequestModel.countWallPrayerRequests.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/prayers/wall?category=health')
        .set('Authorization', `Bearer ${tokenFor(7)}`);

      expect(response.status).toBe(200);
      expect(prayerRequestModel.getWallPrayerRequests).toHaveBeenCalledWith({
        offset: 0,
        limit: 10,
        category: 'health',
        viewerUserId: 7,
      });
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.total).toBe(1);
    });

    test('rejects an unknown category', async () => {
      const response = await request(app)
        .get('/api/prayers/wall?category=gossip')
        .set('Authorization', `Bearer ${tokenFor(7)}`);

      expect(response.status).toBe(400);
      expect(prayerRequestModel.getWallPrayerRequests).not.toHaveBeenCalled();
    });

    test('is not swallowed by the /:id route', async () => {
      await request(app).get('/api/prayers/wall').set('Authorization', `Bearer ${tokenFor(7)}`);
      expect(prayerRequestModel.getPrayerRequestById).not.toHaveBeenCalled();
    });
  });
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/models/prayerWallMapper.test.js tests/api/prayerWall.test.js --coverage=false`
Expected: FAIL. `toWallItem is not a function`, and the wall routes return 404 (the `/:id` route catches `wall` and `parseId` rejects it).

- [ ] **Step 4: Add the model functions**

In `backend/src/models/prayerRequestModel.js`, add this before `module.exports`:

```js
// ---- Prayer wall ----

const WALL_STATUSES = ['approved', 'answered'];
const ANONYMOUS_NAME = 'A church member';

const buildWallWhere = (category) => ({
  shareOnWall: true,
  status: { in: WALL_STATUSES },
  ...(category ? { category } : {}),
});

// Builds the public wall shape field by field so nothing identifying can leak.
const toWallItem = (row) => {
  const fullName = `${row.user?.firstName || ''} ${row.user?.lastName || ''}`.trim();

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    requester_name: row.isAnonymous || !fullName ? ANONYMOUS_NAME : fullName,
    prayer_count: row.prayerCount,
    prayed_by_me: Array.isArray(row.intercessions) && row.intercessions.length > 0,
    created_at: row.createdAt,
  };
};

const getWallPrayerRequests = async ({ offset = 0, limit = 10, category, viewerUserId }) => {
  const rows = await prisma.prayerRequest.findMany({
    where: buildWallWhere(category),
    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      status: true,
      isAnonymous: true,
      prayerCount: true,
      createdAt: true,
      user: { select: { firstName: true, lastName: true } },
      intercessions: {
        where: { userId: Number(viewerUserId) },
        select: { id: true },
      },
    },
  });

  return rows.map(toWallItem);
};

const countWallPrayerRequests = async ({ category } = {}) =>
  prisma.prayerRequest.count({ where: buildWallWhere(category) });
```

Then add these to `module.exports`:

```js
  WALL_STATUSES,
  toWallItem,
  getWallPrayerRequests,
  countWallPrayerRequests,
```

- [ ] **Step 5: Add the controller handler**

In `backend/src/controllers/prayerRequestController.js`, add this after `getUserPrayerRequests`:

```js
const PRAYER_CATEGORIES = ['personal', 'family', 'health', 'work', 'financial', 'other'];

// Prayer wall: approved or answered requests their owners chose to share (signed-in members only)
const getPrayerWall = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category } = req.query;

    if (category && !PRAYER_CATEGORIES.includes(category)) {
      return res.status(400).json(apiResponse(false, null, 'Invalid prayer category'));
    }

    const { offset, limitNum } = getPagination(page, limit);
    const [prayers, total] = await Promise.all([
      prayerRequestModel.getWallPrayerRequests({
        offset,
        limit: limitNum,
        category: category || undefined,
        viewerUserId: req.user.userId,
      }),
      prayerRequestModel.countWallPrayerRequests({ category: category || undefined }),
    ]);

    res.json(apiResponse(true, prayers, 'Prayer wall retrieved', buildPaginationMeta(total, page, limit)));
  } catch (error) {
    next(error);
  }
};
```

Add `getPrayerWall,` to `module.exports`.

- [ ] **Step 6: Register the route before `/:id`**

In `backend/src/routes/prayerRequestRoutes.js`, add this directly after the `/user/requests` route and **before** `router.get('/:id', ...)`:

```js
// Prayer wall (signed-in members). Must be registered before '/:id'.
router.get('/wall', isAuthenticated, prayerRequestController.getPrayerWall);
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `cd backend && npx jest tests/models/prayerWallMapper.test.js tests/api/prayerWall.test.js --coverage=false`
Expected: PASS (4 mapper tests and 14 route tests). The "is not swallowed by the /:id route" test already passes before this task. It stays as a guard so a future route reorder can't break the wall.

- [ ] **Step 8: Commit**

```bash
git add backend/src/models/prayerRequestModel.js backend/src/controllers/prayerRequestController.js backend/src/routes/prayerRequestRoutes.js backend/tests/models/prayerWallMapper.test.js backend/tests/api/prayerWall.test.js
git commit -m "feat: add members-only prayer wall listing

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: "I prayed" (recording and milestone notifications)

**Files:**
- Modify: `backend/src/models/prayerRequestModel.js` (add `recordIntercession` and export it)
- Modify: `backend/src/controllers/prayerRequestController.js` (add `prayForRequest` and export it)
- Modify: `backend/src/routes/prayerRequestRoutes.js`
- Test: `backend/tests/api/prayerWall.test.js` (add a `describe` block)

**Interfaces:**
- Consumes: `WALL_STATUSES` (Task 5), `notify` (Task 2), `parseId` (Task 3).
- Produces:
  - `prayerRequestModel.recordIntercession({ prayerRequestId, userId })` resolves to `null` when the request isn't on the wall. Otherwise it resolves to `{ request: { id, userId, title }, prayerCount: number, created: boolean }`.
  - `POST /api/prayers/:id/pray` → `{ data: { prayer_count, prayed_by_me: true } }`

- [ ] **Step 1: Write the failing tests**

Add inside the top-level `describe` in `backend/tests/api/prayerWall.test.js`:

```js
  describe('POST /api/prayers/:id/pray', () => {
    const pray = (id, userId = 7) =>
      request(app).post(`/api/prayers/${id}/pray`).set('Authorization', `Bearer ${tokenFor(userId)}`);

    test('requires sign-in', async () => {
      const response = await request(app).post('/api/prayers/3/pray');
      expect(response.status).toBe(401);
    });

    test('returns 404 for a malformed id without touching the database', async () => {
      for (const badId of ['abc', '1.5', '0', '-2']) {
        const response = await pray(badId);
        expect(response.status).toBe(404);
      }
      expect(prayerRequestModel.recordIntercession).not.toHaveBeenCalled();
    });

    test('returns 404 when the request is not on the wall', async () => {
      prayerRequestModel.recordIntercession.mockResolvedValue(null);
      const response = await pray(3);
      expect(response.status).toBe(404);
    });

    test('records the prayer and notifies the requester at a milestone', async () => {
      prayerRequestModel.recordIntercession.mockResolvedValue({
        request: { id: 3, userId: 42, title: 'Job interview' },
        prayerCount: 1,
        created: true,
      });

      const response = await pray(3);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ prayer_count: 1, prayed_by_me: true });
      expect(prayerRequestModel.recordIntercession).toHaveBeenCalledWith({ prayerRequestId: 3, userId: 7 });
      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userIds: [42], type: 'prayer', entityType: 'prayer', entityId: 3 })
      );
    });

    test('does not notify between milestones', async () => {
      prayerRequestModel.recordIntercession.mockResolvedValue({
        request: { id: 3, userId: 42, title: 'Job interview' },
        prayerCount: 2,
        created: true,
      });

      await pray(3);
      expect(notificationService.notify).not.toHaveBeenCalled();
    });

    test('a repeat prayer returns the current count and never notifies', async () => {
      prayerRequestModel.recordIntercession.mockResolvedValue({
        request: { id: 3, userId: 42, title: 'Job interview' },
        prayerCount: 5,
        created: false,
      });

      const response = await pray(3);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ prayer_count: 5, prayed_by_me: true });
      expect(notificationService.notify).not.toHaveBeenCalled();
    });

    test('praying for your own request never notifies yourself', async () => {
      prayerRequestModel.recordIntercession.mockResolvedValue({
        request: { id: 3, userId: 7, title: 'Mine' },
        prayerCount: 1,
        created: true,
      });

      await pray(3, 7);
      expect(notificationService.notify).not.toHaveBeenCalled();
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/api/prayerWall.test.js --coverage=false`
Expected: the new tests FAIL with 404s from the unmatched route (`POST /:id/pray` doesn't exist yet).

- [ ] **Step 3: Add the model function**

In `backend/src/models/prayerRequestModel.js`, add this after `countWallPrayerRequests`:

```js
// Records one prayer per member per wall request. Safe under double taps and races:
// the unique (prayer_request_id, user_id) constraint makes the insert a no-op for repeats,
// and the counter only moves when a row was actually inserted.
const recordIntercession = async ({ prayerRequestId, userId }) => {
  const id = Number(prayerRequestId);
  const memberId = Number(userId);

  return prisma.$transaction(async (tx) => {
    const request = await tx.prayerRequest.findFirst({
      where: { id, shareOnWall: true, status: { in: WALL_STATUSES } },
      select: { id: true, userId: true, title: true },
    });

    if (!request) {
      return null;
    }

    const inserted = await tx.prayerIntercession.createMany({
      data: [{ prayerRequestId: id, userId: memberId }],
      skipDuplicates: true,
    });

    if (inserted.count === 0) {
      const current = await tx.prayerRequest.findUnique({
        where: { id },
        select: { prayerCount: true },
      });
      return { request, prayerCount: current.prayerCount, created: false };
    }

    const updated = await tx.prayerRequest.update({
      where: { id },
      data: { prayerCount: { increment: 1 } },
      select: { prayerCount: true },
    });

    return { request, prayerCount: updated.prayerCount, created: true };
  });
};
```

Add `recordIntercession,` to `module.exports`.

- [ ] **Step 4: Add the controller handler**

In `backend/src/controllers/prayerRequestController.js`, add this after `getPrayerWall`:

```js
const PRAYER_MILESTONES = [1, 5, 10, 25, 50, 100];

// "I prayed" on a wall request. Repeats are harmless and return the current count.
const prayForRequest = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const result = id
      ? await prayerRequestModel.recordIntercession({ prayerRequestId: id, userId: req.user.userId })
      : null;

    if (!result) {
      return res.status(404).json(apiResponse(false, null, 'Prayer request not found'));
    }

    const { request, prayerCount, created } = result;
    const prayedForSomeoneElse = Number(request.userId) !== Number(req.user.userId);

    if (created && prayedForSomeoneElse && PRAYER_MILESTONES.includes(prayerCount)) {
      await notify({
        userIds: [request.userId],
        title: 'People are praying for you',
        message:
          prayerCount === 1
            ? `Someone prayed for your request "${request.title}".`
            : `${prayerCount} people have prayed for your request "${request.title}".`,
        type: 'prayer',
        entityType: 'prayer',
        entityId: request.id,
      });
    }

    res.json(
      apiResponse(
        true,
        { prayer_count: prayerCount, prayed_by_me: true },
        created ? 'Thank you for praying' : 'You have already prayed for this request'
      )
    );
  } catch (error) {
    next(error);
  }
};
```

Add `prayForRequest,` to `module.exports`.

- [ ] **Step 5: Register the route**

In `backend/src/routes/prayerRequestRoutes.js`, add this after the `/wall` route:

```js
// Record "I prayed" for a wall request
router.post('/:id/pray', isAuthenticated, prayerRequestController.prayForRequest);
```

- [ ] **Step 6: Run the full backend suite and lint**

Run: `cd backend && npx jest --runInBand --coverage=false && npx eslint src/ tests/`
Expected: all suites PASS (26 existing and 29 new, 55 in total: 4 service tests, 4 mapper tests, and 21 route tests), and no lint output.

- [ ] **Step 7: Commit**

```bash
git add backend/src/models/prayerRequestModel.js backend/src/controllers/prayerRequestController.js backend/src/routes/prayerRequestRoutes.js backend/tests/api/prayerWall.test.js
git commit -m "feat: let members record that they prayed, with milestone notifications

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Web — prayer wall page, form option, admin column, nav link

**Files:**
- Modify: `frontend/src/hooks/useApi.ts` (add these after `useSubmitPrayer`)
- Create: `frontend/src/app/prayer/wall/page.tsx`
- Modify: `frontend/src/app/prayer/new/page.tsx`
- Modify: `frontend/src/app/admin/prayers/page.tsx`
- Modify: `frontend/src/components/layout/Header.tsx`

**Interfaces:**
- Consumes: `GET /api/prayers/wall` and `POST /api/prayers/:id/pray` (Tasks 5–6).
- Produces:
  - `export type WallPrayer`
  - `usePrayerWall({ page, category }) → UseQueryResult<{ data: WallPrayer[]; meta?: PaginationMeta }>`
  - `usePrayForRequest() → UseMutationResult<{ prayer_count: number; prayed_by_me: boolean }, any, number>`

The frontend has no test runner. Verification is type-check, lint, build, and the manual checks in Step 7.

- [ ] **Step 1: Add the hooks**

In `frontend/src/hooks/useApi.ts`, add this directly after `useSubmitPrayer`:

```ts
export type WallPrayer = {
  id: number;
  title: string;
  description: string;
  category: string;
  status: 'approved' | 'answered';
  requester_name: string;
  prayer_count: number;
  prayed_by_me: boolean;
  created_at: string;
};

type PaginationMeta = {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_more: boolean;
};

export const usePrayerWall = ({ page = 1, category }: { page?: number; category?: string } = {}) =>
  useQuery({
    queryKey: ['prayers', 'wall', category ?? 'all', page],
    queryFn: async (): Promise<{ data: WallPrayer[]; meta?: PaginationMeta }> => {
      const response = await apiClient.get('/prayers/wall', {
        params: { page, limit: 20, ...(category ? { category } : {}) },
      });
      return { data: response.data?.data ?? [], meta: response.data?.meta };
    },
  });

export const usePrayForRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/prayers/${id}/pray`);
      return response.data?.data as { prayer_count: number; prayed_by_me: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayers', 'wall'] });
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Could not record your prayer'));
    },
  });
};
```

- [ ] **Step 2: Create the wall page**

Create `frontend/src/app/prayer/wall/page.tsx`:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import RouteGuard from '@/components/auth/RouteGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePrayerWall, usePrayForRequest, type WallPrayer } from '@/hooks/useApi';
import { cn, formatDateTime } from '@/lib/utils';

const CATEGORIES = ['all', 'personal', 'family', 'health', 'work', 'financial', 'other'] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

function PrayerCard({ prayer }: { prayer: WallPrayer }) {
  const pray = usePrayForRequest();
  const prayed = prayer.prayed_by_me;

  return (
    <Card className="rounded-[1.5rem] border-slate-200 shadow-sm dark:border-slate-800">
      <CardContent className="space-y-3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-50">{prayer.requester_name}</p>
            <p className="text-xs text-ui-subtle">{formatDateTime(prayer.created_at)}</p>
          </div>
          <div className="flex gap-2">
            {prayer.status === 'answered' && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                Answered
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {prayer.category}
            </span>
          </div>
        </div>

        <h2 className="text-lg font-bold tracking-tight">{prayer.title}</h2>
        <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{prayer.description}</p>

        <Button
          type="button"
          variant={prayed ? 'outline' : 'default'}
          disabled={prayed || pray.isPending}
          onClick={() => pray.mutate(prayer.id)}
          aria-pressed={prayed}
        >
          <Heart className={cn('mr-2 h-4 w-4', prayed && 'fill-current')} />
          {prayed ? 'You prayed' : 'I prayed'} · {prayer.prayer_count}
        </Button>
      </CardContent>
    </Card>
  );
}

function PrayerWallContent() {
  const [category, setCategory] = React.useState<CategoryFilter>('all');
  const [page, setPage] = React.useState(1);
  const { data, isLoading, error } = usePrayerWall({
    page,
    category: category === 'all' ? undefined : category,
  });

  const prayers = data?.data ?? [];
  const hasMore = Boolean(data?.meta?.has_more);

  return (
    <div className="container-max space-y-6 py-12 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Prayer Wall</h1>
          <p className="mt-2 text-sm italic text-ui-subtle">
            &quot;Pray for each other so that you may be healed.&quot; — James 5:16
          </p>
        </div>
        <div className="flex gap-3">
          <label htmlFor="wall-category" className="sr-only">
            Category
          </label>
          <select
            id="wall-category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as CategoryFilter);
              setPage(1);
            }}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm capitalize dark:border-slate-700 dark:bg-slate-950"
          >
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value === 'all' ? 'All categories' : value}
              </option>
            ))}
          </select>
          <Button asChild>
            <Link href="/prayer/new">Share a request</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-ui-subtle">Loading the prayer wall...</p>
      ) : error ? (
        <p className="text-sm text-red-700 dark:text-red-300">Could not load the prayer wall.</p>
      ) : prayers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-ui-subtle">
            No prayer requests here yet. Requests appear once their owner chooses to share them and they are
            approved.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {prayers.map((prayer) => (
            <PrayerCard key={prayer.id} prayer={prayer} />
          ))}
        </div>
      )}

      {(page > 1 || hasMore) && (
        <div className="flex justify-center gap-3">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PrayerWallPage() {
  return (
    <RouteGuard>
      <PrayerWallContent />
    </RouteGuard>
  );
}
```

(`frontend/src/components/ui/button.tsx` already supports `asChild` through Radix `Slot`, and has the `default` and `outline` variants used above.)

- [ ] **Step 3: Add the share option to the request form**

In `frontend/src/app/prayer/new/page.tsx`:

a. Add `shareOnWall: boolean;` to `type PrayerForm`.

b. Replace `defaultValues` with `{ category: 'personal', isAnonymous: false, shareOnWall: false }`.

c. Replace the `reset(...)` call with `reset({ title: '', description: '', category: 'personal', isAnonymous: false, shareOnWall: false });`.

d. Add this directly after the anonymous checkbox `<div>`:

```tsx
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <input
                  id="prayer-share-on-wall"
                  type="checkbox"
                  {...register('shareOnWall')}
                  className="h-4 w-4 rounded border-slate-400 text-sky-700 focus-visible:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900"
                />
                <Label htmlFor="prayer-share-on-wall" className="text-sm">
                  Share on the prayer wall
                </Label>
              </div>
              <p className="pl-6 text-xs text-ui-subtle">
                After approval, other signed-in members can see this request and pray for you.
              </p>
            </div>
```

- [ ] **Step 4: Show admins which requests will go on the wall**

In `frontend/src/app/admin/prayers/page.tsx`:

a. Add `share_on_wall?: boolean;` and `is_anonymous?: boolean;` to `type AdminPrayer`.

b. Add this column object after the `category` column:

```tsx
            {
              key: 'share_on_wall',
              header: 'Wall',
              render: (prayer: AdminPrayer) =>
                prayer.share_on_wall ? (
                  <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
                    {prayer.is_anonymous ? 'Shared (anonymous)' : 'Shared'}
                  </span>
                ) : (
                  <span className="text-xs text-ui-subtle">Private</span>
                ),
            },
```

- [ ] **Step 5: Add the nav link**

In `frontend/src/components/layout/Header.tsx`:

a. Add `Heart,` to the `lucide-react` import list (keep the list alphabetical: after `Gift,`).

b. In `navLinks`, add this after the Community entry:

```ts
  { href: '/prayer/wall', label: 'Prayer', icon: Heart },
```

- [ ] **Step 6: Type-check, lint, and build**

Run: `cd frontend && npm run -s type-check && npm run -s lint && npm run -s build`
Expected: no type or lint output, and the build lists `○ /prayer/wall`.

- [ ] **Step 7: Manual check** (run the backend and frontend locally; report anything you can't check)

1. Signed out, `/prayer/wall` redirects to `/login?next=%2Fprayer%2Fwall`.
2. Submit a request with "Share on the prayer wall" ticked. It doesn't appear on the wall yet.
3. As an admin, `/admin/prayers` shows "Shared" in the Wall column. Approve the request.
4. As a second member, the request appears. Pressing "I prayed" changes it to "You prayed · 1" and disables the button. The first member gets a bell notification.
5. At desktop width (1280px), the header nav still fits on one line with the new "Prayer" link. If it wraps, report it rather than restyling the header.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/hooks/useApi.ts frontend/src/app/prayer frontend/src/app/admin/prayers/page.tsx frontend/src/components/layout/Header.tsx
git commit -m "feat(web): prayer wall page, share option, and admin wall column

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Mobile — real prayer wall, share switch, fixed "+" button

**Files:**
- Modify: `mobile/src/hooks/use-api.ts`
- Rewrite: `mobile/src/app/prayer-wall.tsx`
- Modify: `mobile/src/app/prayers.tsx`

**Interfaces:**
- Consumes: `GET /api/prayers/wall` and `POST /api/prayers/:id/pray` (Tasks 5–6).
- Produces:
  - `usePrayerWall(enabled) → UseQueryResult<WallPrayer[]>`
  - `usePrayForRequest() → UseMutationResult<{ prayer_count; prayed_by_me }, Error, number>`
  - `PrayerPayload.shareOnWall?: boolean`

- [ ] **Step 1: Install mobile dependencies and record the baseline**

Run: `cd mobile && npm ci && npm run lint; npx tsc --noEmit`
Record any errors that already exist before this task, so you only fix errors this task introduces.

- [ ] **Step 2: Add the hooks and payload field**

In `mobile/src/hooks/use-api.ts`:

a. Add `shareOnWall?: boolean;` to `type PrayerPayload`, after `isAnonymous?: boolean;`.

b. Add this after `useMyPrayerRequests`:

```ts
export type WallPrayer = {
  id: number;
  title: string;
  description: string;
  category: string;
  status: 'approved' | 'answered';
  requester_name: string;
  prayer_count: number;
  prayed_by_me: boolean;
  created_at: string;
};

export const usePrayerWall = (enabled = true) =>
  useQuery({
    queryKey: ['prayers', 'wall'],
    enabled,
    queryFn: async (): Promise<WallPrayer[]> => {
      const response = await apiClient.get('/prayers/wall', { params: { limit: 50 } });
      return response.data?.data || [];
    },
  });
```

c. Add this after `useCreatePrayerRequest`:

```ts
export const usePrayForRequest = () =>
  useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/prayers/${id}/pray`);
      return response.data?.data as { prayer_count: number; prayed_by_me: boolean };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['prayers', 'wall'] });
    },
  });
```

- [ ] **Step 3: Rewrite the prayer wall screen**

Replace the whole of `mobile/src/app/prayer-wall.tsx` with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { BrandButton, BrandCard, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useMyPrayerRequests, usePrayerWall, usePrayForRequest, type WallPrayer } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

type Tab = 'wall' | 'mine';

export default function PrayerWallScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = React.useState<Tab>('wall');
  const wallQuery = usePrayerWall(Boolean(user));
  const myPrayersQuery = useMyPrayerRequests(Boolean(user) && tab === 'mine');
  const prayMutation = usePrayForRequest();

  if (!user) {
    return (
      <BrandScreen>
        <BrandCard>
          <ThemedText type="subtitle">Prayer Wall</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Sign in to see the prayer wall and pray with the church family.
          </ThemedText>
          <BrandButton label="Go To Sign In" onPress={() => router.replace('/login')} />
        </BrandCard>
      </BrandScreen>
    );
  }

  const wall = Array.isArray(wallQuery.data) ? wallQuery.data : [];
  const mine = Array.isArray(myPrayersQuery.data) ? myPrayersQuery.data : [];
  const isLoading = tab === 'wall' ? wallQuery.isLoading : myPrayersQuery.isLoading;

  const renderTab = (value: Tab, label: string) => {
    const active = tab === value;
    return (
      <Pressable key={value} onPress={() => setTab(value)} style={styles.tabPressable}>
        <View
          style={[
            styles.tab,
            {
              backgroundColor: active ? theme.tint : 'transparent',
              borderColor: active ? theme.tint : theme.border,
            },
          ]}>
          <ThemedText type="smallBold" style={{ color: active ? theme.white : theme.text }}>
            {label}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  const renderWallItem = (prayer: WallPrayer) => (
    <BrandCard key={String(prayer.id)}>
      <View style={styles.prayerHead}>
        <View style={styles.prayerMeta}>
          <ThemedText type="defaultSemiBold">{prayer.requester_name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {new Date(prayer.created_at).toLocaleDateString()}
          </ThemedText>
        </View>
        <View style={styles.pills}>
          {prayer.status === 'answered' ? <BrandPill>Answered</BrandPill> : null}
          <BrandPill>{prayer.category}</BrandPill>
        </View>
      </View>
      <ThemedText type="defaultSemiBold">{prayer.title}</ThemedText>
      <ThemedText type="small">{prayer.description}</ThemedText>
      <BrandButton
        label={`${prayer.prayed_by_me ? 'You prayed' : 'I prayed'} · ${prayer.prayer_count}`}
        variant={prayer.prayed_by_me ? 'outline' : 'primary'}
        onPress={() => {
          if (!prayer.prayed_by_me && !prayMutation.isPending) {
            prayMutation.mutate(prayer.id);
          }
        }}
      />
    </BrandCard>
  );

  return (
    <BrandScreen>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="subtitle">Prayer Wall</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Pray for one another
          </ThemedText>
        </View>
        <Pressable
          accessibilityLabel="Share a prayer request"
          onPress={() => router.push('/prayers')}
          style={[styles.iconButton, { backgroundColor: '#E11D48', borderColor: '#E11D48' }]}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.scriptureCard}>
        <ThemedText type="small" style={styles.scriptureText}>
          &quot;Pray for each other so that you may be healed.&quot; - James 5:16
        </ThemedText>
      </View>

      <View style={styles.tabs}>
        {renderTab('wall', 'Wall')}
        {renderTab('mine', 'My requests')}
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.tint} />
      ) : tab === 'wall' ? (
        wall.length > 0 ? (
          wall.map(renderWallItem)
        ) : (
          <BrandCard>
            <ThemedText type="defaultSemiBold">Nothing on the wall yet</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Requests appear here once their owner shares them and they are approved.
            </ThemedText>
            <BrandButton label="Share a request" onPress={() => router.push('/prayers')} />
          </BrandCard>
        )
      ) : mine.length > 0 ? (
        mine.map((prayer: any) => (
          <BrandCard key={String(prayer?.id)}>
            <View style={styles.prayerHead}>
              <ThemedText type="defaultSemiBold" style={styles.prayerMeta}>
                {prayer?.title || 'Prayer request'}
              </ThemedText>
              <BrandPill>{prayer?.status || 'pending'}</BrandPill>
            </View>
            <ThemedText type="small">{prayer?.description}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {prayer?.share_on_wall
                ? `Shared on the wall · ${prayer?.prayer_count ?? 0} prayed`
                : 'Private'}
            </ThemedText>
          </BrandCard>
        ))
      ) : (
        <BrandCard>
          <ThemedText type="defaultSemiBold">No requests yet</ThemedText>
          <BrandButton label="Share a request" onPress={() => router.push('/prayers')} />
        </BrandCard>
      )}
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scriptureCard: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    backgroundColor: 'rgba(225,29,72,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(225,29,72,0.16)',
  },
  scriptureText: {
    color: '#FDA4AF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tabPressable: {
    flex: 1,
  },
  tab: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  prayerHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  prayerMeta: {
    flex: 1,
    gap: 2,
  },
  pills: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
});
```

- [ ] **Step 4: Add the share switch to the request form**

In `mobile/src/app/prayers.tsx`:

a. In `prayerSchema`, add `shareOnWall: z.boolean().default(false),` after `isAnonymous`.

b. In both `defaultValues` and the `reset({...})` call, add `shareOnWall: false,` after `isAnonymous: false,`.

c. Directly after the closing `</View>` of the anonymous `styles.switchRow`, add:

```tsx
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <ThemedText type="smallBold">Share on the prayer wall</ThemedText>
            <ThemedText type="small">
              After approval, other signed-in members can see this request and pray for you.
            </ThemedText>
          </View>
          <Controller
            control={control}
            name="shareOnWall"
            render={({ field: { onChange, value } }) => (
              <Switch
                trackColor={{ false: theme.backgroundSelected, true: theme.tint }}
                thumbColor={theme.white}
                onValueChange={onChange}
                value={value}
              />
            )}
          />
        </View>
```

d. Replace the metric `<BrandMetric label="Mode" value="Private" />` with:

```tsx
        <BrandMetric
          label="On the wall"
          value={requests.filter((item: any) => item?.share_on_wall).length}
        />
```

- [ ] **Step 5: Lint and type-check**

Run: `cd mobile && npm run lint && npx tsc --noEmit`
Expected: no new errors compared with the Step 1 baseline.

- [ ] **Step 6: On-device check** (the project owner does this; note it in the report)

1. The "+" button opens the prayer request form and no longer submits anything by itself.
2. A shared, approved request appears under Wall. "I prayed" updates the count and switches to "You prayed".
3. "My requests" shows each request's status and whether it's private or on the wall.

- [ ] **Step 7: Commit**

```bash
git add mobile/src/hooks/use-api.ts mobile/src/app/prayer-wall.tsx mobile/src/app/prayers.tsx
git commit -m "feat(mobile): real prayer wall, share-on-wall switch, and fix add button

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Documentation and final checks

**Files:**
- Modify: `docs/features.md`
- Modify: `docs/qa-checklist.md`
- Modify: `docs/superpowers/plans/2026-09-28-00-roadmap.md` (mark phase 0 + 1 done)

- [ ] **Step 1: Document the feature**

In `docs/features.md`:
- Under "## Member Features", add these bullets after "Prayer request submission":

```markdown
- Prayer wall (members only): share approved requests, pray for others, milestone notifications
```

- Add this section at the end of the file:

```markdown
## Prayer Wall

- Members choose "Share on the prayer wall" when submitting a request; requests are private by default.
- Only approved or answered requests that were shared appear, newest first, to signed-in members.
- Anonymous requests show "A church member" and never expose the author.
- "I prayed" counts once per member per request; the requester is notified at 1, 5, 10, 25, 50 and 100 prayers.
- Editing the text of an approved request sends it back for approval.
- Available on web (`/prayer/wall`) and mobile (Prayer Wall screen).
```

- [ ] **Step 2: Add QA steps**

Append to `docs/qa-checklist.md`:

```markdown
## Prayer Wall

- [ ] Signed out, `/prayer/wall` redirects to login; the mobile screen asks to sign in
- [ ] A new request is private unless "Share on the prayer wall" is ticked
- [ ] A shared request appears on the wall only after admin approval
- [ ] An anonymous shared request shows "A church member"
- [ ] "I prayed" counts once per member, even when tapped repeatedly
- [ ] The requester is notified on the 1st prayer, not the 2nd
- [ ] Editing an approved request's text removes it from the wall until re-approved
- [ ] A member cannot open another member's private request by id
- [ ] The mobile "+" button opens the request form and does not auto-submit
```

- [ ] **Step 3: Mark the roadmap**

In `docs/superpowers/plans/2026-09-28-00-roadmap.md`, change the phase 0 + 1 status from `Written` to `Done`.

- [ ] **Step 4: Run all project checks**

```bash
cd backend && npx jest --runInBand --coverage=false && npx eslint src/ tests/ && cd ..
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build && cd ..
cd mobile && npm run lint && npx tsc --noEmit && cd ..
```

Expected: all backend tests pass, there are no lint or type errors, the frontend build succeeds, and mobile has no errors beyond its baseline.

- [ ] **Step 5: Commit**

```bash
git add docs/features.md docs/qa-checklist.md docs/superpowers/plans/2026-09-28-00-roadmap.md
git commit -m "docs: document prayer wall and QA steps

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
