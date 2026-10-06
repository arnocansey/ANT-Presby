# Phase 6: Announcements and Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real phone push notifications through Expo, plus real announcements.
- An announcement goes to everyone, to one small group, or to one event's attendees.
- Admins can send to any audience. A group's leaders can send to their own group.
- The existing notification helper (`notify` / `notifyAll`) now also sends a push, so the Prayer Wall, Small Groups, and Devotionals notifications all reach phones.

**Architecture:**
- **Push tokens:** a `PushToken` table stores each device's Expo push token for its user.
- **Sending:** `pushService.js` sends to Expo's push API in batches of 100 using the existing `axios`, and reports the tokens of devices that no longer exist.
- **Fan-out:** `notificationService` creates the in-app notifications, then sends a push to the recipients' tokens, then deletes the dead tokens. It still never throws.
- **Announcements:** an `Announcement` table records each send: the audience, how many people it reached, and how many pushes went out.
- **Mobile:**
  - Adds `expo-notifications`.
  - Asks for permission and registers the device's token after sign-in.
  - Removes the token on sign-out, through a new "before sign-out" hook in the auth store.
  - Opens the right screen when a notification is tapped.

**Tech Stack:**
- Backend: Express 4, Prisma 6 (PostgreSQL), axios, express-validator 7, Jest 29 and supertest
- Web: Next.js 16, TanStack Query 5
- Mobile: Expo SDK 55, `expo-notifications` (new, the only new dependency), TanStack Query 5

**Spec:** `docs/superpowers/specs/2026-09-28-mockups-real-design.md`, section 5.6 (plus §4 notification helper, §3 conventions, §6 errors and §7 testing). The roadmap is in `docs/superpowers/plans/2026-09-28-00-roadmap.md`.

**Parallel execution:** this plan runs at the same time as Phase 5 (`2026-10-06-phase-5-devotionals.md`), each in its own git worktree. Both branch from `feature/small-groups`. Both touch these shared files:
- `schema.prisma`
- `migrateFeatureUpdates.js`
- `server.js`
- `validators.js`
- `useApi.ts` and `use-api.ts`
- `AdminSidebar.tsx`
- `docs/*` and the roadmap

To keep conflicts small:
- Add new code only at the anchors named here.
- Never reformat or reorder existing lines.

The two branches are combined afterwards.

## Global Constraints

- **Push tokens:**
  - `PushToken` has `userId` (cascade), `token` (unique, ≤255), `platform` (`ios | android`), `lastSeenAt`, and timestamps.
  - Registering upserts on the token, so the token moves to whoever is currently signed in on that device.
  - Removing deletes only the caller's own token, and is safe to repeat.
  - Tokens must look like `ExponentPushToken[...]` or `ExpoPushToken[...]`.
- **Announcements:**
  - `Announcement` has `title` (≤255), `message` (≤2000), `audience` (`AnnouncementAudience`: `everyone | group | event`), `groupId?` (`SetNull`), `eventId?` (`SetNull`), `sentBy?` (`SetNull`), `recipientCount`, `pushCount`, and `createdAt`.
  - Who receives it:
    - `everyone`: all active users.
    - `group`: the group's **active** members.
    - `event`: the event's registered users plus any members checked in to it, without duplicates.
  - The sender never receives their own announcement.
- **Who can send:**
  - Admins can send to any audience.
  - An **active leader** of a group can send only to that group.
  - Anyone else gets 403.
  - An unknown group or event gives 404. An audience with nobody in it gives 400 "This audience has no members yet".
- **Sent history:** admins see every announcement. Leaders see those sent to the groups they lead. Everyone else gets an empty list. The limit is the 50 most recent.
- **Push delivery:**
  - Expo push API: `POST https://exp.host/--/api/v2/push/send`, at most 100 messages per request.
  - Tokens whose ticket reports `DeviceNotRegistered` are deleted.
  - An optional `EXPO_ACCESS_TOKEN` setting is sent as a bearer token. It is read **only** from the environment and never written into any file.
- **Notification helper:** `notify` / `notifyAll` keep their signatures, return `{ inApp, push }`, and **never throw**. If push sending fails, the in-app notification is still created.
- **Website:** in-app notifications only. There's no browser push.
- **Audit:** announcement sends call `auditLogModel.createAuditLog` with `entityType: 'announcement'` and `action: 'send'`.
- **Dependencies:** no new backend or web dependencies. Mobile adds only `expo-notifications`, installed with `npx expo install` so its version matches SDK 55.
- **Schema changes:** every change goes both in `backend/prisma/schema.prisma` **and** as idempotent SQL in `backend/migrations/migrateFeatureUpdates.js`.
- **Secrets:** never write real secret keys into any file. That includes `EXPO_ACCESS_TOKEN`, Firebase and FCM credentials, and EAS secrets. Docs describe *where* to set them, not their values.
- **Commits:** every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

These cases are the ones most likely to hurt a real user. Each has a test in the task named.

1. **Push failures.** When Expo is down or a batch fails, the in-app notification still exists, `notify` doesn't throw, and the action that triggered it (approving a prayer, joining a group, sending an announcement) still succeeds. *(Task 2)*
2. **Leaders outside their group.** A group leader sending to another group, or to everyone, gets 403. A *pending* leader gets 403 too. *(Task 4)*
3. **Shared phones.** When one phone is used by two accounts, its token belongs to whoever registered last, so the previous user stops getting that phone's pushes. Sign-out removes the token. *(Tasks 3 and 6)*
4. **Dead devices.** Tokens for uninstalled apps (`DeviceNotRegistered`) are deleted, so they aren't retried forever. *(Task 2)*
5. **Duplicates.** A member who is both registered for an event and checked in to it gets one notification, not two. The sender doesn't notify themselves. *(Task 4)*

---

## File Map

| File | Change | Responsibility |
|---|---|---|
| `backend/prisma/schema.prisma` | Modify | `AnnouncementAudience`, `PushToken`, `Announcement`; back-relations |
| `backend/migrations/migrateFeatureUpdates.js` | Modify | Enum, tables, indexes |
| `backend/src/services/pushService.js` | Create | Sends to Expo in batches; collects dead tokens |
| `backend/src/models/pushTokenModel.js` | Create | Token storage |
| `backend/src/services/notificationService.js` | Modify | Also sends a push; deletes dead tokens |
| `backend/src/controllers/pushTokenController.js`, `backend/src/routes/pushTokenRoutes.js` | Create | `/api/push-tokens` |
| `backend/src/models/announcementModel.js` | Create | Announcements and recipient queries |
| `backend/src/controllers/announcementController.js`, `backend/src/routes/announcementRoutes.js` | Create | `/api/announcements` |
| `backend/src/middleware/validators.js` | Modify | `validatePushToken`, `validateAnnouncement` |
| `backend/src/server.js` | Modify | Mount the routes |
| `backend/.env.example`, `render.yaml` | Modify | `EXPO_ACCESS_TOKEN` placeholder only |
| `backend/tests/services/pushService.test.js`, `backend/tests/services/notificationService.test.js` | Create / Modify | Service tests |
| `backend/tests/api/pushTokens.test.js`, `backend/tests/api/announcements.test.js`, `backend/tests/models/announcementModel.test.js` | Create | API and model tests |
| `frontend/src/hooks/useApi.ts` | Modify | Announcement types and hooks |
| `frontend/src/app/admin/announcements/page.tsx` | Create | Compose and history |
| `frontend/src/app/groups/[id]/page.tsx` | Modify | Leader "Message group" |
| `frontend/src/components/layout/AdminSidebar.tsx` | Modify | Link |
| `mobile/package.json`, `mobile/package-lock.json`, `mobile/app.json` | Modify | `expo-notifications` and its plugin |
| `mobile/src/store/auth.ts` | Modify | "Before sign-out" hooks |
| `mobile/src/lib/push.ts` | Create | Permission, token, register and unregister |
| `mobile/src/components/push-registration.tsx` | Create | Registers on sign-in; routes notification taps |
| `mobile/src/providers/AppProviders.tsx` | Modify | Mount `PushRegistration` |
| `mobile/src/hooks/use-api.ts` | Modify | Announcement hooks |
| `mobile/src/app/admin-announcements.tsx` | Rewrite | Real announcements |
| `docs/deployment.md`, `docs/features.md`, `docs/qa-checklist.md`, roadmap | Modify | Documentation, including FCM and EAS setup |

---

### Task 1: Worktree setup, schema, and migration

**Files:**
- Modify: `backend/prisma/schema.prisma`, `backend/migrations/migrateFeatureUpdates.js`, `backend/.env.example`, `render.yaml`

**Interfaces:**
- Produces: Prisma models `PushToken { id, userId, token, platform, lastSeenAt, createdAt, updatedAt }` and `Announcement { id, title, message, audience, groupId?, eventId?, sentBy?, recipientCount, pushCount, createdAt }`, plus the enum `AnnouncementAudience { everyone group event }`.

- [ ] **Step 1: Set up the worktree and branch**

You are in a fresh git worktree that was created from `feature/small-groups`. Run:

```bash
git checkout -b feature/announcements-push
(cd backend && pnpm install --frozen-lockfile)
(cd frontend && npm ci --no-audit --no-fund)
(cd mobile && npm ci --no-audit --no-fund)
(cd backend && npx prisma generate)
git add docs/superpowers/plans/2026-10-06-phase-6-announcements-push.md 2>/dev/null; git commit -m "docs: phase 6 announcements and push plan

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || true
cd backend && npx jest --runInBand --coverage=false
```

Expected: **229** tests pass, which is the baseline.

- [ ] **Step 2: Update the schema**

In `backend/prisma/schema.prisma`:

a. Add this after `enum MembershipStatus { ... }`:

```prisma
enum AnnouncementAudience {
  everyone
  group
  event

  @@map("announcement_audience")
}
```

b. In `model User`, add these after the `groupMemberships` line:

```prisma
  pushTokens           PushToken[]
  announcementsSent    Announcement[]      @relation("AnnouncementSender")
```

c. In `model Event`, add this after the `attendance` line:

```prisma
  announcements    Announcement[]
```

d. In `model SmallGroup`, add this after the `memberships GroupMembership[]` line:

```prisma
  announcements Announcement[]
```

e. Add these models after `model GroupMembership { ... }`:

```prisma
model PushToken {
  id         Int      @id @default(autoincrement())
  userId     Int      @map("user_id")
  token      String   @unique @db.VarChar(255)
  platform   String   @db.VarChar(10)
  lastSeenAt DateTime @default(now()) @map("last_seen_at")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId], map: "idx_push_tokens_user")
  @@map("push_tokens")
}

model Announcement {
  id             Int                  @id @default(autoincrement())
  title          String               @db.VarChar(255)
  message        String
  audience       AnnouncementAudience
  groupId        Int?                 @map("group_id")
  eventId        Int?                 @map("event_id")
  sentBy         Int?                 @map("sent_by")
  recipientCount Int                  @default(0) @map("recipient_count")
  pushCount      Int                  @default(0) @map("push_count")
  createdAt      DateTime             @default(now()) @map("created_at")
  group          SmallGroup?          @relation(fields: [groupId], references: [id], onDelete: SetNull)
  event          Event?               @relation(fields: [eventId], references: [id], onDelete: SetNull)
  sender         User?                @relation("AnnouncementSender", fields: [sentBy], references: [id], onDelete: SetNull)

  @@index([createdAt(sort: Desc)], map: "idx_announcements_created_at")
  @@index([groupId], map: "idx_announcements_group")
  @@map("announcements")
}
```

- [ ] **Step 3: Add the idempotent migration**

In `backend/migrations/migrateFeatureUpdates.js`, insert this directly before `await client.query('COMMIT');`:

```js
    // Announcements and push tokens (phase 6)
    await client.query(`
      DO $$
      BEGIN
        CREATE TYPE announcement_audience AS ENUM ('everyone', 'group', 'event');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS push_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        platform VARCHAR(10) NOT NULL,
        last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT push_tokens_token_key UNIQUE (token)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_push_tokens_user
      ON push_tokens(user_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        audience announcement_audience NOT NULL,
        group_id INTEGER REFERENCES small_groups(id) ON DELETE SET NULL,
        event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
        sent_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        recipient_count INTEGER NOT NULL DEFAULT 0,
        push_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_announcements_created_at
      ON announcements(created_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_announcements_group
      ON announcements(group_id);
    `);
```

- [ ] **Step 4: Add the configuration placeholders (no secret values)**

In `backend/.env.example`, add this at the end:

```
# Optional: Expo access token for push notifications (only if "Enhanced Push Security" is enabled in Expo).
# Set the real value in the Render dashboard; never commit it.
EXPO_ACCESS_TOKEN=
```

In `render.yaml`, add this after the `AUTH_RATE_LIMIT_MAX_REQUESTS` entry:

```yaml
      - key: EXPO_ACCESS_TOKEN
        sync: false
```

- [ ] **Step 5: Validate, generate, and syntax-check**

Run: `cd backend && DATABASE_URL="postgresql://x:y@localhost:5432/z" npx prisma validate && npx prisma generate && node --check migrations/migrateFeatureUpdates.js && npx jest --runInBand --coverage=false`
Expected: `valid`, then `Generated Prisma Client`, no syntax output, and 229 tests still passing. **Do not** run the migration.

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/schema.prisma backend/migrations/migrateFeatureUpdates.js backend/.env.example render.yaml
git commit -m "feat: add push token and announcement tables

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Push service, token model, and push in the notification helper

**Files:**
- Create: `backend/src/services/pushService.js`, `backend/src/models/pushTokenModel.js`
- Modify: `backend/src/services/notificationService.js`
- Test: `backend/tests/services/pushService.test.js` (create), `backend/tests/services/notificationService.test.js` (modify)

**Interfaces:**
- Produces:
  - `pushService.sendPush(tokens: string[], { title, body, data }) → Promise<{ sent: number, invalidTokens: string[] }>`. It never rejects.
  - `pushService.isExpoPushToken(token) → boolean`
  - `pushTokenModel.upsertToken({ userId, token, platform })`
  - `pushTokenModel.deleteToken({ userId, token }) → number`
  - `pushTokenModel.getTokensForUsers(userIds) → string[]`
  - `pushTokenModel.getAllActiveTokens() → string[]`
  - `pushTokenModel.deleteTokens(tokens) → number`
  - `notify` / `notifyAll` keep their signatures and now return `{ inApp, push }`, where `push` is the number of accepted pushes.

- [ ] **Step 1: Write the failing push service tests**

Create `backend/tests/services/pushService.test.js`:

```js
describe('pushService.sendPush', () => {
  let axios;
  let pushService;
  const original = process.env.EXPO_ACCESS_TOKEN;

  const token = (n) => `ExponentPushToken[device-${n}]`;
  const okTickets = (count) => ({ data: { data: Array.from({ length: count }, () => ({ status: 'ok' })) } });

  beforeEach(() => {
    jest.resetModules();
    delete process.env.EXPO_ACCESS_TOKEN;
    axios = { post: jest.fn((url, messages) => Promise.resolve(okTickets(messages.length))) };
    jest.doMock('axios', () => axios);
    pushService = require('../../src/services/pushService');
  });

  afterEach(() => {
    if (original === undefined) delete process.env.EXPO_ACCESS_TOKEN;
    else process.env.EXPO_ACCESS_TOKEN = original;
  });

  test('sends in batches of at most 100', async () => {
    const tokens = Array.from({ length: 250 }, (_, n) => token(n));

    const result = await pushService.sendPush(tokens, { title: 'Hi', body: 'There', data: { type: 'x' } });

    expect(axios.post).toHaveBeenCalledTimes(3);
    expect(axios.post.mock.calls.map(([, messages]) => messages.length)).toEqual([100, 100, 50]);
    expect(axios.post.mock.calls[0][0]).toBe('https://exp.host/--/api/v2/push/send');
    expect(axios.post.mock.calls[0][1][0]).toEqual({ to: token(0), title: 'Hi', body: 'There', data: { type: 'x' }, sound: 'default' });
    expect(result).toEqual({ sent: 250, invalidTokens: [] });
  });

  test('drops duplicates and tokens that are not Expo push tokens', async () => {
    await pushService.sendPush([token(1), token(1), 'not-a-token', '', null], { title: 't', body: 'b' });
    expect(axios.post.mock.calls[0][1].map((m) => m.to)).toEqual([token(1)]);
  });

  test('does nothing when there are no tokens', async () => {
    expect(await pushService.sendPush([], { title: 't', body: 'b' })).toEqual({ sent: 0, invalidTokens: [] });
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('reports DeviceNotRegistered tokens as invalid', async () => {
    axios.post.mockResolvedValue({
      data: { data: [{ status: 'ok' }, { status: 'error', details: { error: 'DeviceNotRegistered' } }, { status: 'error', details: { error: 'MessageRateExceeded' } }] },
    });

    const result = await pushService.sendPush([token(1), token(2), token(3)], { title: 't', body: 'b' });

    expect(result).toEqual({ sent: 1, invalidTokens: [token(2)] });
  });

  test('a failed batch is logged, never thrown', async () => {
    axios.post.mockRejectedValue(new Error('network down'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(pushService.sendPush([token(1)], { title: 't', body: 'b' })).resolves.toEqual({ sent: 0, invalidTokens: [] });

    warn.mockRestore();
  });

  test('sends the Expo access token only when configured', async () => {
    await pushService.sendPush([token(1)], { title: 't', body: 'b' });
    expect(axios.post.mock.calls[0][2].headers).not.toHaveProperty('Authorization');

    jest.resetModules();
    process.env.EXPO_ACCESS_TOKEN = 'test-placeholder-not-a-real-token';
    jest.doMock('axios', () => axios);
    const configured = require('../../src/services/pushService');
    await configured.sendPush([token(1)], { title: 't', body: 'b' });
    expect(axios.post.mock.calls[1][2].headers.Authorization).toBe('Bearer test-placeholder-not-a-real-token');
  });

  test('recognises Expo push token formats', () => {
    expect(pushService.isExpoPushToken('ExponentPushToken[abc]')).toBe(true);
    expect(pushService.isExpoPushToken('ExpoPushToken[abc]')).toBe(true);
    expect(pushService.isExpoPushToken('abc')).toBe(false);
  });
});
```

- [ ] **Step 2: Update the notification service tests**

Replace the whole `beforeEach` in `backend/tests/services/notificationService.test.js` with:

```js
  let pushTokenModel;
  let pushService;

  beforeEach(() => {
    jest.resetModules();
    notificationModel = {
      createNotificationsForUsers: jest.fn().mockResolvedValue(2),
      createNotificationForAllUsers: jest.fn().mockResolvedValue(40),
    };
    pushTokenModel = {
      getTokensForUsers: jest.fn().mockResolvedValue([]),
      getAllActiveTokens: jest.fn().mockResolvedValue([]),
      deleteTokens: jest.fn().mockResolvedValue(0),
    };
    pushService = { sendPush: jest.fn().mockResolvedValue({ sent: 0, invalidTokens: [] }) };
    jest.doMock('../../src/models/notificationModel', () => notificationModel);
    jest.doMock('../../src/models/pushTokenModel', () => pushTokenModel);
    jest.doMock('../../src/services/pushService', () => pushService);
    notificationService = require('../../src/services/notificationService');
  });
```

Then append these tests inside the same `describe` block, before its closing `});`:

```js
  test('notify also pushes to the recipients\' devices', async () => {
    pushTokenModel.getTokensForUsers.mockResolvedValue(['ExponentPushToken[a]', 'ExponentPushToken[b]']);
    pushService.sendPush.mockResolvedValue({ sent: 2, invalidTokens: [] });

    const result = await notificationService.notify({
      userIds: [7, 9],
      title: 'Hello',
      message: 'World',
      type: 'group',
      entityType: 'group',
      entityId: 5,
    });

    expect(pushTokenModel.getTokensForUsers).toHaveBeenCalledWith([7, 9]);
    expect(pushService.sendPush).toHaveBeenCalledWith(['ExponentPushToken[a]', 'ExponentPushToken[b]'], {
      title: 'Hello',
      body: 'World',
      data: { type: 'group', entityType: 'group', entityId: 5 },
    });
    expect(result).toEqual({ inApp: 2, push: 2 });
  });

  test('dead device tokens are removed', async () => {
    pushTokenModel.getTokensForUsers.mockResolvedValue(['ExponentPushToken[gone]']);
    pushService.sendPush.mockResolvedValue({ sent: 0, invalidTokens: ['ExponentPushToken[gone]'] });

    await notificationService.notify({ userIds: [7], title: 't', message: 'm', type: 'x' });

    expect(pushTokenModel.deleteTokens).toHaveBeenCalledWith(['ExponentPushToken[gone]']);
  });

  test('a push failure keeps the in-app notification and never throws', async () => {
    pushTokenModel.getTokensForUsers.mockRejectedValue(new Error('db down'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(notificationService.notify({ userIds: [7], title: 't', message: 'm', type: 'x' })).resolves.toEqual({
      inApp: 2,
      push: 0,
    });

    warn.mockRestore();
  });

  test('notifyAll pushes to every active device', async () => {
    pushTokenModel.getAllActiveTokens.mockResolvedValue(['ExponentPushToken[a]']);
    pushService.sendPush.mockResolvedValue({ sent: 1, invalidTokens: [] });

    const result = await notificationService.notifyAll({ title: 't', message: 'm', type: 'devotional', entityType: 'devotional', entityId: 3 });

    expect(result).toEqual({ inApp: 40, push: 1 });
  });
```

The existing tests stay as they are. With no tokens, `push` is 0, which is what they already expect.

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/services --coverage=false`
Expected: FAIL. `pushService` can't be found, and the new notification tests fail because `notify` doesn't push yet. The 4 original tests may also fail to load because `pushTokenModel` doesn't exist yet; that's expected.

- [ ] **Step 4: Create the push service**

Create `backend/src/services/pushService.js`:

```js
const axios = require('axios');

/**
 * Expo push delivery. Never throws: push is best-effort on top of in-app notifications.
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

const isExpoPushToken = (token) => typeof token === 'string' && /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);

const chunk = (items, size) => {
  const batches = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
};

const sendPush = async (tokens, { title, body, data = {} }) => {
  const unique = [...new Set(Array.isArray(tokens) ? tokens : [])].filter(isExpoPushToken);
  if (unique.length === 0) {
    return { sent: 0, invalidTokens: [] };
  }

  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }

  let sent = 0;
  const invalidTokens = [];

  for (const batch of chunk(unique, BATCH_SIZE)) {
    try {
      const response = await axios.post(
        EXPO_PUSH_URL,
        batch.map((to) => ({ to, title, body, data, sound: 'default' })),
        { headers, timeout: 15000 }
      );
      const tickets = Array.isArray(response.data?.data) ? response.data.data : [];
      tickets.forEach((ticket, index) => {
        if (ticket?.status === 'ok') {
          sent += 1;
        } else if (ticket?.details?.error === 'DeviceNotRegistered') {
          invalidTokens.push(batch[index]);
        }
      });
    } catch (error) {
      console.warn('Push batch failed:', error.message);
    }
  }

  return { sent, invalidTokens };
};

module.exports = {
  EXPO_PUSH_URL,
  isExpoPushToken,
  sendPush,
};
```

- [ ] **Step 5: Create the token model**

Create `backend/src/models/pushTokenModel.js`:

```js
const prisma = require('../config/prisma');

/**
 * Push Token Model - one Expo push token per device, owned by whoever registered it last.
 */

const upsertToken = ({ userId, token, platform }) =>
  prisma.pushToken.upsert({
    where: { token },
    create: { userId: Number(userId), token, platform, lastSeenAt: new Date() },
    update: { userId: Number(userId), platform, lastSeenAt: new Date() },
  });

const deleteToken = async ({ userId, token }) => {
  const result = await prisma.pushToken.deleteMany({ where: { token, userId: Number(userId) } });
  return result.count;
};

const getTokensForUsers = async (userIds) => {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];
  const rows = await prisma.pushToken.findMany({
    where: { userId: { in: userIds.map(Number) } },
    select: { token: true },
  });
  return rows.map((row) => row.token);
};

const getAllActiveTokens = async () => {
  const rows = await prisma.pushToken.findMany({ where: { user: { isActive: true } }, select: { token: true } });
  return rows.map((row) => row.token);
};

const deleteTokens = async (tokens) => {
  if (!Array.isArray(tokens) || tokens.length === 0) return 0;
  const result = await prisma.pushToken.deleteMany({ where: { token: { in: tokens } } });
  return result.count;
};

module.exports = {
  upsertToken,
  deleteToken,
  getTokensForUsers,
  getAllActiveTokens,
  deleteTokens,
};
```

- [ ] **Step 6: Add push to the notification service**

In `backend/src/services/notificationService.js`:

a. Replace the header comment and the first import with:

```js
const notificationModel = require('../models/notificationModel');
const pushTokenModel = require('../models/pushTokenModel');
const pushService = require('./pushService');

/**
 * Single entry point for user notifications: creates in-app notifications, then pushes to devices.
 * These functions never throw: a failed notification must not fail the action that caused it.
 */

// Best-effort push to the given devices; removes tokens Expo reports as no longer registered.
const pushTo = async (loadTokens, { title, message, type, entityType, entityId }) => {
  try {
    const tokens = await loadTokens();
    const { sent, invalidTokens } = await pushService.sendPush(tokens, {
      title,
      body: message,
      data: { type, entityType, entityId },
    });
    if (invalidTokens.length > 0) {
      await pushTokenModel.deleteTokens(invalidTokens);
    }
    return sent;
  } catch (error) {
    console.warn('Push skipped:', error.message);
    return 0;
  }
};
```

b. In `notify`, replace the `try { ... } catch { ... }` block with:

```js
  let inApp = 0;
  try {
    inApp = await notificationModel.createNotificationsForUsers(
      recipients,
      title,
      message,
      type,
      entityType,
      entityId
    );
  } catch (error) {
    console.warn('Notification skipped:', error.message);
  }

  const push = await pushTo(() => pushTokenModel.getTokensForUsers(recipients), {
    title,
    message,
    type,
    entityType,
    entityId,
  });
  return { inApp, push };
```

c. Replace the body of `notifyAll` with:

```js
  let inApp = 0;
  try {
    inApp = await notificationModel.createNotificationForAllUsers(title, message, type, entityType, entityId);
  } catch (error) {
    console.warn('Broadcast notification skipped:', error.message);
  }

  const push = await pushTo(() => pushTokenModel.getAllActiveTokens(), { title, message, type, entityType, entityId });
  return { inApp, push };
```

The first original test, "notify de-duplicates ids...", expects `{ inApp: 2, push: 0 }`. It still passes, because the mocked `getTokensForUsers` returns `[]`.

- [ ] **Step 7: Run the service tests, the full suite, and lint**

Run: `cd backend && npx jest tests/services --coverage=false && npx jest --runInBand --coverage=false && npx eslint src/ tests/`
Expected:
- Services: 7 push tests and 8 notification tests (4 existing and 4 new) pass.
- Full suite: **240** (229 + 7 + 4).
- No lint output.

Other test files mock `notificationService` as a whole, so they're unaffected.

- [ ] **Step 8: Commit**

```bash
git add backend/src/services/pushService.js backend/src/models/pushTokenModel.js backend/src/services/notificationService.js backend/tests/services/pushService.test.js backend/tests/services/notificationService.test.js
git commit -m "feat: send push notifications through Expo from the notification helper

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Push token API

**Files:**
- Create: `backend/src/controllers/pushTokenController.js`, `backend/src/routes/pushTokenRoutes.js`
- Modify: `backend/src/middleware/validators.js`. Add `validatePushToken` and `validateAnnouncement` (used in Task 4) **at the end, directly before `module.exports`**, and add both names at the **end** of the exports object.
- Modify: `backend/src/server.js`
- Test: `backend/tests/api/pushTokens.test.js`

**Interfaces:**
- Consumes: `pushTokenModel.upsertToken` and `pushTokenModel.deleteToken` (Task 2).
- Produces:
  - `POST /api/push-tokens` with `{ token, platform }` → 200
  - `DELETE /api/push-tokens` with `{ token }` → 200 (safe to repeat)

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/api/pushTokens.test.js`:

```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const as = (userId) => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role: 'member' }, process.env.JWT_SECRET)}`;
const TOKEN = 'ExponentPushToken[abc123]';

describe('Push token API', () => {
  let pushTokenModel;
  let app;

  beforeEach(() => {
    jest.resetModules();
    pushTokenModel = { upsertToken: jest.fn().mockResolvedValue({ id: 1 }), deleteToken: jest.fn().mockResolvedValue(1) };
    jest.doMock('../../src/models/pushTokenModel', () => pushTokenModel);
    app = express();
    app.use(express.json());
    app.use('/api/push-tokens', require('../../src/routes/pushTokenRoutes'));
  });

  test('requires sign-in', async () => {
    const response = await request(app).post('/api/push-tokens').send({ token: TOKEN, platform: 'android' });
    expect(response.status).toBe(401);
  });

  test('registers the device for the signed-in user (moving a shared device to them)', async () => {
    const response = await request(app).post('/api/push-tokens').set('Authorization', as(7)).send({ token: TOKEN, platform: 'android' });

    expect(response.status).toBe(200);
    expect(pushTokenModel.upsertToken).toHaveBeenCalledWith({ userId: 7, token: TOKEN, platform: 'android' });
  });

  test.each([
    ['a non-Expo token', { token: 'abc', platform: 'android' }],
    ['an unknown platform', { token: TOKEN, platform: 'windows' }],
    ['a missing token', { platform: 'ios' }],
  ])('rejects %s with 400', async (_label, body) => {
    const response = await request(app).post('/api/push-tokens').set('Authorization', as(7)).send(body);

    expect(response.status).toBe(400);
    expect(pushTokenModel.upsertToken).not.toHaveBeenCalled();
  });

  test('removes only the caller\'s own token and is safe to repeat', async () => {
    pushTokenModel.deleteToken.mockResolvedValue(0);

    const response = await request(app).delete('/api/push-tokens').set('Authorization', as(7)).send({ token: TOKEN });

    expect(response.status).toBe(200);
    expect(pushTokenModel.deleteToken).toHaveBeenCalledWith({ userId: 7, token: TOKEN });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/api/pushTokens.test.js --coverage=false`
Expected: FAIL with `Cannot find module '../../src/routes/pushTokenRoutes'`.

- [ ] **Step 3: Add the validators (both, at the end of the file)**

In `backend/src/middleware/validators.js`, add this directly before `module.exports = {`:

```js
const EXPO_PUSH_TOKEN = /^Expo(nent)?PushToken\[[^\]]+\]$/;

// Device registration for push notifications.
const validatePushToken = [
  body('token')
    .isString()
    .isLength({ max: 255 })
    .matches(EXPO_PUSH_TOKEN)
    .withMessage('token must be an Expo push token'),
  body('platform').isIn(['ios', 'android']).withMessage('platform must be ios or android'),
];

// Announcement: audience-specific target ids are required only for that audience.
const validateAnnouncement = [
  body('title').isString().trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('message')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 2000 })
    .withMessage('Message must be 2000 characters or fewer'),
  body('audience').isIn(['everyone', 'group', 'event']).withMessage('audience must be everyone, group or event'),
  body('groupId')
    .if(body('audience').equals('group'))
    .isInt({ min: 1, max: MAX_DB_ID })
    .withMessage('groupId is required for a group announcement'),
  body('eventId')
    .if(body('audience').equals('event'))
    .isInt({ min: 1, max: MAX_DB_ID })
    .withMessage('eventId is required for an event announcement'),
];

```

In `module.exports`, add `validatePushToken,` and `validateAnnouncement,` as the **last** two entries.

- [ ] **Step 4: Create the controller and routes, and mount them**

Create `backend/src/controllers/pushTokenController.js`:

```js
const { apiResponse } = require('../utils/helpers');
const pushTokenModel = require('../models/pushTokenModel');

/**
 * Push Token Controller - devices register after sign-in and unregister on sign-out.
 */

const registerToken = async (req, res, next) => {
  try {
    await pushTokenModel.upsertToken({ userId: req.user.userId, token: req.body.token, platform: req.body.platform });
    res.json(apiResponse(true, null, 'Device registered for notifications'));
  } catch (error) {
    next(error);
  }
};

const removeToken = async (req, res, next) => {
  try {
    if (typeof req.body?.token === 'string') {
      await pushTokenModel.deleteToken({ userId: req.user.userId, token: req.body.token });
    }
    res.json(apiResponse(true, null, 'Device removed'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerToken,
  removeToken,
};
```

Create `backend/src/routes/pushTokenRoutes.js`:

```js
const express = require('express');
const pushTokenController = require('../controllers/pushTokenController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { handleValidationErrors, validatePushToken } = require('../middleware/validators');

const router = express.Router();

router.post('/', isAuthenticated, validatePushToken, handleValidationErrors, pushTokenController.registerToken);
router.delete('/', isAuthenticated, pushTokenController.removeToken);

module.exports = router;
```

In `backend/src/server.js`:
- Add `const pushTokenRoutes = require('./routes/pushTokenRoutes');` directly after `const notificationRoutes = require('./routes/notificationRoutes');`.
- Add `app.use('/api/push-tokens', pushTokenRoutes);` directly after `app.use('/api/notifications', notificationRoutes);`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd backend && npx jest tests/api/pushTokens.test.js --coverage=false`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/pushTokenController.js backend/src/routes/pushTokenRoutes.js backend/src/middleware/validators.js backend/src/server.js backend/tests/api/pushTokens.test.js
git commit -m "feat: let devices register and remove Expo push tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Announcements API

**Files:**
- Create: `backend/src/models/announcementModel.js`, `backend/src/controllers/announcementController.js`, `backend/src/routes/announcementRoutes.js`
- Modify: `backend/src/server.js`
- Test: `backend/tests/models/announcementModel.test.js`, `backend/tests/api/announcements.test.js`

**Interfaces:**
- Consumes:
  - `validateAnnouncement` (Task 3)
  - `notify` (Task 2)
  - `groupModel.getGroupById` and `groupController.canManageGroup(user, groupId)` (Phase 4)
  - `eventModel.getEventById` and `userModel.getAllUserIds()` (existing)
  - `parseId` and `auditLogModel`
- Produces:
  - `announcementModel.getGroupMemberIds(groupId) → number[]`
  - `announcementModel.getEventAudienceIds(eventId) → number[]` (without duplicates)
  - `announcementModel.getLedGroupIds(userId) → number[]`
  - `announcementModel.createAnnouncement(data) → row`
  - `announcementModel.setPushCount(id, count)`
  - `announcementModel.listSent(groupIds | null) → Announcement[]`
  - `POST /api/announcements` → `201 { data: Announcement }`
  - `GET /api/announcements/sent` → `{ data: Announcement[] }`
  - `Announcement` (response) is `{ id, title, message, audience, group_id, group_name, event_id, event_name, sender_name, recipient_count, push_count, created_at }`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/models/announcementModel.test.js`:

```js
describe('announcementModel recipient queries', () => {
  const load = (prismaMock) => {
    jest.resetModules();
    jest.doMock('../../src/config/prisma', () => prismaMock);
    return require('../../src/models/announcementModel');
  };

  test('event audience merges registrations and check-ins without duplicates', async () => {
    const prisma = {
      eventRegistration: { findMany: jest.fn().mockResolvedValue([{ userId: 2 }, { userId: 3 }]) },
      attendanceRecord: { findMany: jest.fn().mockResolvedValue([{ userId: 3 }, { userId: 4 }]) },
    };

    const ids = await load(prisma).getEventAudienceIds(7);

    expect(ids.sort()).toEqual([2, 3, 4]);
    expect(prisma.attendanceRecord.findMany).toHaveBeenCalledWith({
      where: { eventId: 7, userId: { not: null } },
      select: { userId: true },
    });
  });

  test('group audience is active members only', async () => {
    const prisma = { groupMembership: { findMany: jest.fn().mockResolvedValue([{ userId: 2 }]) } };

    await load(prisma).getGroupMemberIds(5);

    expect(prisma.groupMembership.findMany).toHaveBeenCalledWith({
      where: { groupId: 5, status: 'active' },
      select: { userId: true },
    });
  });
});
```

Create `backend/tests/api/announcements.test.js`:

```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const as = (userId, role = 'member') => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET)}`;
const admin = () => as(1, 'admin');

const buildModels = () => ({
  announcementModel: {
    getGroupMemberIds: jest.fn().mockResolvedValue([2, 3, 7]),
    getEventAudienceIds: jest.fn().mockResolvedValue([4, 5]),
    getLedGroupIds: jest.fn().mockResolvedValue([5]),
    createAnnouncement: jest.fn().mockImplementation(async (data) => ({ id: 11, ...data })),
    setPushCount: jest.fn().mockResolvedValue({}),
    listSent: jest.fn().mockResolvedValue([{ id: 11 }]),
  },
  groupModel: { getGroupById: jest.fn().mockResolvedValue({ id: 5, name: 'Young Adults', is_active: true }) },
  groupController: { canManageGroup: jest.fn().mockResolvedValue(false) },
  eventModel: { getEventById: jest.fn().mockResolvedValue({ id: 7, name: 'Retreat' }) },
  userModel: { getAllUserIds: jest.fn().mockResolvedValue([1, 2, 3]) },
  notificationService: { notify: jest.fn().mockResolvedValue({ inApp: 2, push: 1 }) },
  auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
});

const buildApp = (models) => {
  jest.resetModules();
  jest.doMock('../../src/models/announcementModel', () => models.announcementModel);
  jest.doMock('../../src/models/groupModel', () => models.groupModel);
  jest.doMock('../../src/controllers/groupController', () => models.groupController);
  jest.doMock('../../src/models/eventModel', () => models.eventModel);
  jest.doMock('../../src/models/userModel', () => models.userModel);
  jest.doMock('../../src/services/notificationService', () => models.notificationService);
  jest.doMock('../../src/models/auditLogModel', () => models.auditLogModel);

  const app = express();
  app.use(express.json());
  app.use('/api/announcements', require('../../src/routes/announcementRoutes'));
  const { errorHandler } = require('../../src/middleware/errorHandler');
  app.use(errorHandler);
  return app;
};

describe('Announcements API', () => {
  let models;
  let app;
  const send = (auth, body) => request(app).post('/api/announcements').set('Authorization', auth).send(body);

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('requires sign-in', async () => {
    const response = await request(app).post('/api/announcements').send({ title: 't', message: 'm', audience: 'everyone' });
    expect(response.status).toBe(401);
  });

  test('an admin announces to everyone; the sender is not notified; counts are stored; it is audited', async () => {
    const response = await send(admin(), { title: 'Service time', message: 'We start at 9.', audience: 'everyone' });

    expect(response.status).toBe(201);
    expect(models.notificationService.notify).toHaveBeenCalledWith(
      expect.objectContaining({ userIds: [2, 3], title: 'Service time', type: 'announcement', entityType: 'announcement', entityId: 11 })
    );
    expect(models.announcementModel.createAnnouncement).toHaveBeenCalledWith(
      expect.objectContaining({ audience: 'everyone', recipientCount: 2, sentBy: 1, groupId: null, eventId: null })
    );
    expect(models.announcementModel.setPushCount).toHaveBeenCalledWith(11, 1);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ entityType: 'announcement', action: 'send' }));
  });

  test('a member cannot announce to everyone or to an event', async () => {
    const everyone = await send(as(7), { title: 't', message: 'm', audience: 'everyone' });
    const event = await send(as(7), { title: 't', message: 'm', audience: 'event', eventId: 7 });

    expect(everyone.status).toBe(403);
    expect(event.status).toBe(403);
    expect(models.notificationService.notify).not.toHaveBeenCalled();
  });

  test("a group's active leader can message their own group", async () => {
    models.groupController.canManageGroup.mockResolvedValue(true);

    const response = await send(as(7), { title: 'Tonight', message: 'Bring a Bible', audience: 'group', groupId: 5 });

    expect(response.status).toBe(201);
    expect(models.groupController.canManageGroup).toHaveBeenCalledWith(expect.objectContaining({ userId: 7 }), 5);
    expect(models.notificationService.notify).toHaveBeenCalledWith(
      expect.objectContaining({ userIds: [2, 3], entityType: 'group', entityId: 5 })
    );
  });

  test('someone who is not an active leader of that group gets 403', async () => {
    const response = await send(as(7), { title: 't', message: 'm', audience: 'group', groupId: 5 });

    expect(response.status).toBe(403);
    expect(models.notificationService.notify).not.toHaveBeenCalled();
  });

  test('an unknown group or event returns 404', async () => {
    models.groupModel.getGroupById.mockResolvedValue(undefined);
    models.eventModel.getEventById.mockResolvedValue(undefined);

    const group = await send(admin(), { title: 't', message: 'm', audience: 'group', groupId: 99 });
    const event = await send(admin(), { title: 't', message: 'm', audience: 'event', eventId: 99 });

    expect(group.status).toBe(404);
    expect(event.status).toBe(404);
  });

  test("an event announcement reaches the event's audience", async () => {
    const response = await send(admin(), { title: 'Bus at 7', message: 'Meet at the gate', audience: 'event', eventId: 7 });

    expect(response.status).toBe(201);
    expect(models.announcementModel.getEventAudienceIds).toHaveBeenCalledWith(7);
    expect(models.notificationService.notify).toHaveBeenCalledWith(expect.objectContaining({ userIds: [4, 5], entityType: 'event', entityId: 7 }));
  });

  test('an audience with nobody in it returns 400', async () => {
    models.announcementModel.getEventAudienceIds.mockResolvedValue([1]);

    const response = await send(admin(), { title: 't', message: 'm', audience: 'event', eventId: 7 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('This audience has no members yet');
    expect(models.announcementModel.createAnnouncement).not.toHaveBeenCalled();
  });

  test.each([
    ['a missing title', { title: ' ', message: 'm', audience: 'everyone' }],
    ['an over-long message', { title: 't', message: 'x'.repeat(2001), audience: 'everyone' }],
    ['an unknown audience', { title: 't', message: 'm', audience: 'world' }],
    ['a group audience without groupId', { title: 't', message: 'm', audience: 'group' }],
    ['an event audience without eventId', { title: 't', message: 'm', audience: 'event' }],
  ])('rejects %s with 400', async (_label, body) => {
    const response = await send(admin(), body);

    expect(response.status).toBe(400);
    expect(models.notificationService.notify).not.toHaveBeenCalled();
  });

  describe('GET /sent', () => {
    test('admins see every announcement', async () => {
      const response = await request(app).get('/api/announcements/sent').set('Authorization', admin());

      expect(response.status).toBe(200);
      expect(models.announcementModel.listSent).toHaveBeenCalledWith(null);
    });

    test('leaders see announcements to the groups they lead', async () => {
      await request(app).get('/api/announcements/sent').set('Authorization', as(7));

      expect(models.announcementModel.getLedGroupIds).toHaveBeenCalledWith(7);
      expect(models.announcementModel.listSent).toHaveBeenCalledWith([5]);
    });

    test('members who lead nothing get an empty list', async () => {
      models.announcementModel.getLedGroupIds.mockResolvedValue([]);

      const response = await request(app).get('/api/announcements/sent').set('Authorization', as(8));

      expect(response.body.data).toEqual([]);
      expect(models.announcementModel.listSent).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/models/announcementModel.test.js tests/api/announcements.test.js --coverage=false`
Expected: FAIL with `Cannot find module` for `announcementModel` and `announcementRoutes`.

- [ ] **Step 3: Create the model**

Create `backend/src/models/announcementModel.js`:

```js
const prisma = require('../config/prisma');

/**
 * Announcement Model - who receives an announcement, and the record of what was sent.
 */

const getGroupMemberIds = async (groupId) => {
  const rows = await prisma.groupMembership.findMany({
    where: { groupId: Number(groupId), status: 'active' },
    select: { userId: true },
  });
  return rows.map((row) => row.userId);
};

// Registered for the event, or checked in as a member; each person once.
const getEventAudienceIds = async (eventId) => {
  const id = Number(eventId);
  const [registrations, checkIns] = await Promise.all([
    prisma.eventRegistration.findMany({ where: { eventId: id }, select: { userId: true } }),
    prisma.attendanceRecord.findMany({ where: { eventId: id, userId: { not: null } }, select: { userId: true } }),
  ]);
  return [...new Set([...registrations, ...checkIns].map((row) => row.userId))];
};

const getLedGroupIds = async (userId) => {
  const rows = await prisma.groupMembership.findMany({
    where: { userId: Number(userId), role: 'leader', status: 'active' },
    select: { groupId: true },
  });
  return rows.map((row) => row.groupId);
};

const createAnnouncement = (data) => prisma.announcement.create({ data });

const setPushCount = (id, pushCount) => prisma.announcement.update({ where: { id: Number(id) }, data: { pushCount } });

const toAnnouncement = (row) => ({
  id: row.id,
  title: row.title,
  message: row.message,
  audience: row.audience,
  group_id: row.groupId,
  group_name: row.group ? row.group.name : null,
  event_id: row.eventId,
  event_name: row.event ? row.event.name : null,
  sender_name: row.sender ? `${row.sender.firstName || ''} ${row.sender.lastName || ''}`.trim() : null,
  recipient_count: row.recipientCount,
  push_count: row.pushCount,
  created_at: row.createdAt,
});

// Most recent 50; null = all (admin), otherwise only announcements to these groups.
const listSent = async (groupIds) => {
  const rows = await prisma.announcement.findMany({
    where: groupIds ? { audience: 'group', groupId: { in: groupIds } } : {},
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      group: { select: { name: true } },
      event: { select: { name: true } },
      sender: { select: { firstName: true, lastName: true } },
    },
  });
  return rows.map(toAnnouncement);
};

module.exports = {
  getGroupMemberIds,
  getEventAudienceIds,
  getLedGroupIds,
  createAnnouncement,
  setPushCount,
  toAnnouncement,
  listSent,
};
```

- [ ] **Step 4: Create the controller and routes, and mount them**

Create `backend/src/controllers/announcementController.js`:

```js
const { apiResponse } = require('../utils/helpers');
const announcementModel = require('../models/announcementModel');
const groupModel = require('../models/groupModel');
const { canManageGroup } = require('./groupController');
const eventModel = require('../models/eventModel');
const userModel = require('../models/userModel');
const auditLogModel = require('../models/auditLogModel');
const { notify } = require('../services/notificationService');

/**
 * Announcement Controller - admins announce to anyone; group leaders to their own group.
 */

const fail = (res, status, message) => res.status(status).json(apiResponse(false, null, message));

const sendAnnouncement = async (req, res, next) => {
  try {
    const { title, message, audience } = req.body;
    const isAdmin = req.user.role === 'admin';
    const groupId = audience === 'group' ? Number(req.body.groupId) : null;
    const eventId = audience === 'event' ? Number(req.body.eventId) : null;

    if (audience !== 'group' && !isAdmin) {
      return fail(res, 403, 'Only admins can send to this audience');
    }

    let recipients;
    if (audience === 'group') {
      const group = await groupModel.getGroupById(groupId);
      if (!group) return fail(res, 404, 'Group not found');
      if (!isAdmin && !(await canManageGroup(req.user, groupId))) {
        return fail(res, 403, "Only this group's leaders can message it");
      }
      recipients = await announcementModel.getGroupMemberIds(groupId);
    } else if (audience === 'event') {
      const event = await eventModel.getEventById(eventId);
      if (!event) return fail(res, 404, 'Event not found');
      recipients = await announcementModel.getEventAudienceIds(eventId);
    } else {
      recipients = await userModel.getAllUserIds();
    }

    // The sender never notifies themselves.
    recipients = recipients.filter((id) => Number(id) !== Number(req.user.userId));
    if (recipients.length === 0) {
      return fail(res, 400, 'This audience has no members yet');
    }

    const announcement = await announcementModel.createAnnouncement({
      title: String(title).trim(),
      message: String(message).trim(),
      audience,
      groupId,
      eventId,
      sentBy: Number(req.user.userId),
      recipientCount: recipients.length,
    });

    const result = await notify({
      userIds: recipients,
      title: announcement.title,
      message: announcement.message,
      type: 'announcement',
      entityType: audience === 'group' ? 'group' : audience === 'event' ? 'event' : 'announcement',
      entityId: groupId || eventId || announcement.id,
    });
    await announcementModel.setPushCount(announcement.id, result.push);

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'announcement',
      entityId: announcement.id,
      action: 'send',
      summary: `Sent announcement "${announcement.title}" to ${audience} (${recipients.length} people)`,
      metadata: { audience, groupId, eventId },
    });

    res.status(201).json(
      apiResponse(
        true,
        {
          id: announcement.id,
          title: announcement.title,
          message: announcement.message,
          audience,
          group_id: groupId,
          event_id: eventId,
          recipient_count: recipients.length,
          push_count: result.push,
          created_at: announcement.createdAt,
        },
        'Announcement sent'
      )
    );
  } catch (error) {
    next(error);
  }
};

const listSent = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return res.json(apiResponse(true, await announcementModel.listSent(null), 'Announcements retrieved'));
    }

    const groupIds = await announcementModel.getLedGroupIds(req.user.userId);
    const announcements = groupIds.length > 0 ? await announcementModel.listSent(groupIds) : [];
    res.json(apiResponse(true, announcements, 'Announcements retrieved'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendAnnouncement,
  listSent,
};
```

Create `backend/src/routes/announcementRoutes.js`:

```js
const express = require('express');
const announcementController = require('../controllers/announcementController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { handleValidationErrors, validateAnnouncement } = require('../middleware/validators');

const router = express.Router();

router.post('/', isAuthenticated, validateAnnouncement, handleValidationErrors, announcementController.sendAnnouncement);
router.get('/sent', isAuthenticated, announcementController.listSent);

module.exports = router;
```

In `backend/src/server.js`:
- Add `const announcementRoutes = require('./routes/announcementRoutes');` directly after the `pushTokenRoutes` import.
- Add `app.use('/api/announcements', announcementRoutes);` directly after `app.use('/api/push-tokens', pushTokenRoutes);`.

- [ ] **Step 5: Run the full suite and lint**

Run: `cd backend && npx jest --runInBand --coverage=false && npx eslint src/ tests/`
Expected: all suites pass, with no lint output. The total is 240, plus 6 (Task 3), 2 model tests, and 16 announcement route tests: **264**.

- [ ] **Step 6: Commit**

```bash
git add backend/src/models/announcementModel.js backend/src/controllers/announcementController.js backend/src/routes/announcementRoutes.js backend/src/server.js backend/tests/models/announcementModel.test.js backend/tests/api/announcements.test.js
git commit -m "feat: add announcements to everyone, a group or an event, with push

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Web — admin announcements and leader "Message group"

**Files:**
- Modify: `frontend/src/hooks/useApi.ts`. Add the hooks directly **after `useSetGroupLeaders`**; Phase 5 adds its hooks after `useRecentSermons`, so they don't collide.
- Create: `frontend/src/app/admin/announcements/page.tsx`
- Modify: `frontend/src/app/groups/[id]/page.tsx`, `frontend/src/components/layout/AdminSidebar.tsx`

**Interfaces:**
- Consumes:
  - `POST /api/announcements` and `GET /api/announcements/sent` (Task 4)
  - `useAdminGroups()` (Phase 4)
  - `useCheckInEvents()` (Phase 3)
- Produces:
  - Types: `Announcement`, `AnnouncementInput`
  - `useSendAnnouncement()`
  - `useSentAnnouncements(enabled)`

- [ ] **Step 1: Add the hooks**

In `frontend/src/hooks/useApi.ts`, add this directly after the `useSetGroupLeaders` hook:

```ts
export type AnnouncementInput =
  | { title: string; message: string; audience: 'everyone' }
  | { title: string; message: string; audience: 'group'; groupId: number }
  | { title: string; message: string; audience: 'event'; eventId: number };

export type Announcement = {
  id: number;
  title: string;
  message: string;
  audience: 'everyone' | 'group' | 'event';
  group_name?: string | null;
  event_name?: string | null;
  sender_name?: string | null;
  recipient_count: number;
  push_count: number;
  created_at: string;
};

export const useSentAnnouncements = (enabled = true) =>
  useQuery({
    queryKey: ['announcements', 'sent'],
    enabled,
    queryFn: async (): Promise<Announcement[]> => {
      const response = await apiClient.get('/announcements/sent');
      return response.data?.data ?? [];
    },
  });

export const useSendAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AnnouncementInput) => {
      const response = await apiClient.post('/announcements', input);
      return response.data?.data as Announcement;
    },
    onSuccess: (data) => toast.success(`Sent to ${data?.recipient_count ?? 0} people`),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not send the announcement')),
    onSettled: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
};
```

- [ ] **Step 2: Create the admin announcements page**

Create `frontend/src/app/admin/announcements/page.tsx`:

```tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useAdminGroups,
  useCheckInEvents,
  useSendAnnouncement,
  useSentAnnouncements,
  type AnnouncementInput,
} from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

type Audience = 'everyone' | 'group' | 'event';

export default function AdminAnnouncementsPage() {
  const { data: groups } = useAdminGroups();
  const { data: events } = useCheckInEvents();
  const { data: sent, isLoading } = useSentAnnouncements();
  const send = useSendAnnouncement();

  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [audience, setAudience] = React.useState<Audience>('everyone');
  const [targetId, setTargetId] = React.useState('');

  const selectClass = 'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950';
  const needsTarget = audience !== 'everyone';

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const base = { title: title.trim(), message: message.trim() };
    const input: AnnouncementInput =
      audience === 'group'
        ? { ...base, audience, groupId: Number(targetId) }
        : audience === 'event'
          ? { ...base, audience, eventId: Number(targetId) }
          : { ...base, audience: 'everyone' };
    send.mutate(input, {
      onSuccess: () => {
        setTitle('');
        setMessage('');
      },
    });
  };

  return (
    <div className="container-max space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Announcements</h1>
        <p className="mt-2 text-sm text-ui-subtle">
          Sends an in-app notification, and a push notification to phones with the app installed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ann-audience">Send to</Label>
              <select
                id="ann-audience"
                value={audience}
                onChange={(event) => {
                  setAudience(event.target.value as Audience);
                  setTargetId('');
                }}
                className={selectClass}
              >
                <option value="everyone">Everyone</option>
                <option value="group">A small group</option>
                <option value="event">An event&apos;s attendees</option>
              </select>
            </div>
            {needsTarget && (
              <div className="space-y-2">
                <Label htmlFor="ann-target">{audience === 'group' ? 'Group' : 'Event'}</Label>
                <select id="ann-target" value={targetId} onChange={(event) => setTargetId(event.target.value)} className={selectClass} required>
                  <option value="">Choose...</option>
                  {audience === 'group'
                    ? (groups ?? []).filter((g) => g.is_active).map((g) => (
                        <option key={g.id} value={String(g.id)}>
                          {g.name}
                        </option>
                      ))
                    : (events ?? []).map((e) => (
                        <option key={e.id} value={String(e.id)}>
                          {e.name} · {formatDateTime(e.event_date)}
                        </option>
                      ))}
                </select>
              </div>
            )}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ann-title">Title</Label>
              <Input id="ann-title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={255} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ann-message">Message</Label>
              <Textarea id="ann-message" rows={4} value={message} onChange={(event) => setMessage(event.target.value)} required maxLength={2000} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={send.isPending || !title.trim() || !message.trim() || (needsTarget && !targetId)}>
                Send announcement
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sent</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-ui-subtle">Loading...</p>
          ) : !sent || sent.length === 0 ? (
            <p className="text-sm text-ui-subtle">Nothing sent yet.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {sent.map((item) => (
                <li key={item.id} className="space-y-1 py-3">
                  <p className="font-semibold">{item.title}</p>
                  <p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-300">{item.message}</p>
                  <p className="text-xs text-ui-subtle">
                    {formatDateTime(item.created_at)} ·{' '}
                    {item.audience === 'everyone' ? 'Everyone' : item.audience === 'group' ? item.group_name || 'Group' : item.event_name || 'Event'} ·{' '}
                    {item.recipient_count} people · {item.push_count} phones
                    {item.sender_name ? ` · by ${item.sender_name}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Add the leader "Message group" form**

In `frontend/src/app/groups/[id]/page.tsx`:

a. Add `useSendAnnouncement` to the `@/hooks/useApi` import, plus these imports:

```tsx
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
```

b. Directly after the line `const decide = useDecideGroupRequest(groupId);`, add:

```tsx
  const sendMessage = useSendAnnouncement();
  const [messageTitle, setMessageTitle] = React.useState('');
  const [messageBody, setMessageBody] = React.useState('');
```

c. Directly before the line `      {group.members && (`, add:

```tsx
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Message the group</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage.mutate(
                  { audience: 'group', groupId: group.id, title: messageTitle.trim(), message: messageBody.trim() },
                  {
                    onSuccess: () => {
                      setMessageTitle('');
                      setMessageBody('');
                    },
                  }
                );
              }}
            >
              <Input value={messageTitle} onChange={(event) => setMessageTitle(event.target.value)} placeholder="Title" maxLength={255} required />
              <Textarea value={messageBody} onChange={(event) => setMessageBody(event.target.value)} placeholder="Message" rows={3} maxLength={2000} required />
              <Button type="submit" disabled={sendMessage.isPending || !messageTitle.trim() || !messageBody.trim()}>
                Send to members
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

```

- [ ] **Step 4: Add the sidebar link**

In `frontend/src/components/layout/AdminSidebar.tsx`, add this directly after the `'/admin/news'` entry. `Megaphone` is already imported.

```ts
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
```

- [ ] **Step 5: Type-check, lint, and build**

Run: `cd frontend && npm run -s type-check && npm run -s lint && npm run -s build`
Expected: no type or lint output, and the build lists `○ /admin/announcements`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/hooks/useApi.ts frontend/src/app/admin/announcements "frontend/src/app/groups/[id]/page.tsx" frontend/src/components/layout/AdminSidebar.tsx
git commit -m "feat(web): admin announcements and leader group messages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Mobile — push registration, tap routing, real announcements

**Files:**
- Modify: `mobile/package.json`, `mobile/package-lock.json` (via `npx expo install`), `mobile/app.json`
- Modify: `mobile/src/store/auth.ts`
- Create: `mobile/src/lib/push.ts`, `mobile/src/components/push-registration.tsx`
- Modify: `mobile/src/providers/AppProviders.tsx`
- Modify: `mobile/src/hooks/use-api.ts`. Add the hooks directly **after `useUndoCheckIn`** (before `useMemberSearch`). Phase 5 inserts before `useMinistrySermons`, which comes straight after `useDecideGroupRequest`, so that spot is taken.
- Rewrite: `mobile/src/app/admin-announcements.tsx`

**Interfaces:**
- Consumes:
  - `POST` and `DELETE /api/push-tokens` (Task 3), and `POST /api/announcements` and `GET /api/announcements/sent` (Task 4)
  - `useGroups()` (Phase 4)
  - `useCheckInEvents(enabled)` (Phase 3)
- Produces:
  - `onBeforeClearSession(fn) → unsubscribe`
  - `registerForPushNotifications() → Promise<string | null>`
  - `unregisterPushNotifications() → Promise<void>`
  - `routeForNotification(data) → string`
  - `useSendAnnouncement()`
  - `useSentAnnouncements(enabled)`

- [ ] **Step 1: Install `expo-notifications` and add its plugin**

Run: `cd mobile && npx expo install expo-notifications`
Expected: `package.json` gains an `expo-notifications` dependency on a `~55.x` version, and the lock file updates.

In `mobile/app.json`, add `"expo-notifications"` to the `plugins` array, directly after `"expo-secure-store"`.

Then run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo baseline-ok`
Expected: `baseline-ok`.

- [ ] **Step 2: Add "before sign-out" hooks to the auth store**

In `mobile/src/store/auth.ts`:

a. Add this directly after the `AuthState` type:

```ts
// Work that must run while the user is still signed in (e.g. removing this device's push token).
const beforeClearSessionHandlers = new Set<() => Promise<void>>();

export const onBeforeClearSession = (handler: () => Promise<void>) => {
  beforeClearSessionHandlers.add(handler);
  return () => {
    beforeClearSessionHandlers.delete(handler);
  };
};
```

b. Make this the first statement inside `clearSession: async () => {`:

```ts
    for (const handler of beforeClearSessionHandlers) {
      try {
        await handler();
      } catch {
        // Never block sign-out.
      }
    }
```

- [ ] **Step 3: Create the push helper**

Create `mobile/src/lib/push.ts`:

```ts
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import apiClient from '@/lib/api';

// Show notifications while the app is open, too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let registeredToken: string | null = null;

const getProjectId = () =>
  (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ?? Constants.easConfig?.projectId;

// Returns this device's Expo push token, or null when push isn't possible (web, simulator, permission denied).
const getExpoPushToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;

  const projectId = getProjectId();
  if (!projectId) return null;

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
};

export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    const token = await getExpoPushToken();
    if (!token) return null;
    await apiClient.post('/push-tokens', { token, platform: Platform.OS === 'ios' ? 'ios' : 'android' });
    registeredToken = token;
    return token;
  } catch {
    return null;
  }
};

export const unregisterPushNotifications = async (): Promise<void> => {
  if (!registeredToken) return;
  try {
    await apiClient.delete('/push-tokens', { data: { token: registeredToken } });
  } finally {
    registeredToken = null;
  }
};

type NotificationData = { type?: string; entityType?: string | null; entityId?: number | null };

// Where tapping a notification should take the member.
export const routeForNotification = (data: NotificationData | undefined): string => {
  switch (data?.entityType) {
    case 'prayer':
      return '/prayer-wall';
    case 'group':
      return '/small-groups';
    case 'event':
      return data.entityId ? `/events/${data.entityId}` : '/notifications';
    case 'devotional':
      return '/daily-devotional';
    case 'news':
      return data.entityId ? `/news/${data.entityId}` : '/notifications';
    default:
      return '/notifications';
  }
};
```

- [ ] **Step 4: Create the registration component and mount it**

Create `mobile/src/components/push-registration.tsx`:

```tsx
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { registerForPushNotifications, routeForNotification, unregisterPushNotifications } from '@/lib/push';
import { onBeforeClearSession, useAuthStore } from '@/store/auth';

// Registers this device for push after sign-in, removes it on sign-out, and routes notification taps.
export default function PushRegistration() {
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (userId) {
      registerForPushNotifications();
    }
  }, [userId]);

  useEffect(() => onBeforeClearSession(unregisterPushNotifications), []);

  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const data = response.notification.request.content.data as Parameters<typeof routeForNotification>[0];
      router.push(routeForNotification(data) as never);
    };

    Notifications.getLastNotificationResponseAsync().then(open).catch(() => undefined);
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, []);

  return null;
}
```

Replace `mobile/src/providers/AppProviders.tsx` with:

```tsx
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import PushRegistration from '@/components/push-registration';
import { queryClient } from '@/lib/query-client';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PushRegistration />
      {children}
    </QueryClientProvider>
  );
}
```

Before relying on `apiClient`, check that `mobile/src/lib/api.ts` exports it as default (`import apiClient from '@/lib/api'` is already used by `use-api.ts`).

- [ ] **Step 5: Add the hooks and rewrite the announcements screen**

In `mobile/src/hooks/use-api.ts`, add this directly after the `useUndoCheckIn` hook (before `export const useMemberSearch`):

```ts
export type AnnouncementInput =
  | { title: string; message: string; audience: 'everyone' }
  | { title: string; message: string; audience: 'group'; groupId: number }
  | { title: string; message: string; audience: 'event'; eventId: number };

export type Announcement = {
  id: number;
  title: string;
  message: string;
  audience: 'everyone' | 'group' | 'event';
  group_name?: string | null;
  event_name?: string | null;
  recipient_count: number;
  push_count: number;
  created_at: string;
};

export const useSentAnnouncements = (enabled = true) =>
  useQuery({
    queryKey: ['announcements', 'sent'],
    enabled,
    queryFn: async (): Promise<Announcement[]> => {
      const response = await apiClient.get('/announcements/sent');
      return response.data?.data || [];
    },
  });

export const useSendAnnouncement = () =>
  useMutation({
    mutationFn: async (input: AnnouncementInput) => {
      const response = await apiClient.post('/announcements', input);
      return response.data?.data as Announcement;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });
```

Replace the whole of `mobile/src/app/admin-announcements.tsx` with:

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
  useCheckInEvents,
  useGroups,
  useSendAnnouncement,
  useSentAnnouncements,
  type AnnouncementInput,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

type Audience = 'everyone' | 'group' | 'event';

export default function AdminAnnouncementsScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const groupsQuery = useGroups();
  const eventsQuery = useCheckInEvents(isAdmin);
  const sentQuery = useSentAnnouncements(isAdmin);
  const sendMutation = useSendAnnouncement();
  const [audience, setAudience] = React.useState<Audience>('everyone');
  const [targetId, setTargetId] = React.useState<number | undefined>();
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');

  if (!user || !isAdmin) return null;

  const targets =
    audience === 'group'
      ? (groupsQuery.data ?? []).map((g) => ({ id: g.id, label: g.name }))
      : audience === 'event'
        ? (eventsQuery.data ?? []).map((e) => ({ id: e.id, label: e.name }))
        : [];

  const onSend = () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Missing details', 'Add a title and a message.');
      return;
    }
    if (audience !== 'everyone' && !targetId) {
      Alert.alert('Choose who to send to', audience === 'group' ? 'Pick a group.' : 'Pick an event.');
      return;
    }
    const base = { title: title.trim(), message: message.trim() };
    const input: AnnouncementInput =
      audience === 'group'
        ? { ...base, audience, groupId: targetId as number }
        : audience === 'event'
          ? { ...base, audience, eventId: targetId as number }
          : { ...base, audience: 'everyone' };
    sendMutation.mutate(input, {
      onSuccess: (data) => {
        Alert.alert('Sent', `Sent to ${data?.recipient_count ?? 0} people.`);
        setTitle('');
        setMessage('');
      },
      onError: (error) => Alert.alert('Could not send', getApiErrorMessage(error, 'Please try again.')),
    });
  };

  const chip = (label: string, active: boolean, onPress: () => void, key: string) => (
    <Pressable key={key} onPress={onPress}>
      <View style={[styles.chip, { backgroundColor: active ? theme.tint : theme.background, borderColor: active ? theme.tint : theme.border }]}>
        <ThemedText type="smallBold" style={{ color: active ? theme.white : theme.text }}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );

  const inputStyle = [styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }];
  const sent = Array.isArray(sentQuery.data) ? sentQuery.data : [];

  return (
    <AdminShell activeTab="/admin-news">
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#818CF8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Send Announcement</ThemedText>
        </View>
      </View>

      <BrandCard>
        <ThemedText type="smallBold">Send to</ThemedText>
        <View style={styles.chips}>
          {(['everyone', 'group', 'event'] as Audience[]).map((value) =>
            chip(value === 'everyone' ? 'Everyone' : value === 'group' ? 'A group' : 'An event', audience === value, () => {
              setAudience(value);
              setTargetId(undefined);
            }, value)
          )}
        </View>
        {targets.length > 0 ? (
          <View style={styles.chips}>{targets.map((t) => chip(t.label, targetId === t.id, () => setTargetId(t.id), String(t.id)))}</View>
        ) : audience !== 'everyone' ? (
          <ThemedText type="small" themeColor="textSecondary">
            {audience === 'group' ? 'No groups yet.' : 'No events in the last or next two weeks.'}
          </ThemedText>
        ) : null}
        <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={theme.textSecondary} maxLength={255} style={inputStyle} />
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Message"
          placeholderTextColor={theme.textSecondary}
          maxLength={2000}
          multiline
          style={[...inputStyle, styles.multiline]}
        />
        <BrandButton label="Send announcement" variant="secondary" onPress={() => !sendMutation.isPending && onSend()} />
      </BrandCard>

      {sent.map((item) => (
        <BrandCard key={item.id}>
          <View style={styles.row}>
            <ThemedText type="defaultSemiBold" style={styles.rowTitle} numberOfLines={1}>
              {item.title}
            </ThemedText>
            <BrandPill>{`${item.recipient_count} people`}</BrandPill>
          </View>
          <ThemedText type="small" numberOfLines={2}>
            {item.message}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {new Date(item.created_at).toLocaleString()} · {item.push_count} phones
          </ThemedText>
        </BrandCard>
      ))}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  rowTitle: { flex: 1 },
});
```

- [ ] **Step 6: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`. If `tsc` reports that `NotificationBehavior` needs different fields in this `expo-notifications` version, adjust `setNotificationHandler` to the fields the installed type definitions require. For example, older versions use `shouldShowAlert`. Record a ruling.

- [ ] **Step 7: On-device check** (the project owner does this; note it in the report)

This needs a development or store build, not Expo Go:
1. After sign-in, Android asks for permission, and a token appears in `push_tokens`.
2. An admin announcement to "Everyone" arrives as a push.
3. Tapping it opens the Notifications screen.
4. After sign-out, the token is gone.

- [ ] **Step 8: Commit**

```bash
git add mobile/package.json mobile/package-lock.json mobile/app.json mobile/src/store/auth.ts mobile/src/lib/push.ts mobile/src/components/push-registration.tsx mobile/src/providers/AppProviders.tsx mobile/src/hooks/use-api.ts mobile/src/app/admin-announcements.tsx
git commit -m "feat(mobile): push registration, notification tap routing and real announcements

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Documentation (including push setup) and final checks

**Files:**
- Modify: `docs/deployment.md`, `docs/features.md`, `docs/qa-checklist.md`, `docs/superpowers/plans/2026-09-28-00-roadmap.md`

- [ ] **Step 1: Document push setup**

Append this to `docs/deployment.md`. It describes *where* each credential goes and contains no secret values.

```markdown
## Push notifications (mobile)

Push uses Expo's push service. To make it work in production:

1. **Android credentials (FCM v1):** in the Firebase console create (or reuse) a project for package `com.antpress.mobile`, generate a service-account key for FCM v1, and upload it with `eas credentials` (Android → Push Notifications: FCM V1). Never commit the key file.
2. **New native build:** `expo-notifications` is a native module, so ship a new development/store build with EAS Build. An over-the-air update is not enough, and Expo Go cannot receive push on Android.
3. **Optional `EXPO_ACCESS_TOKEN`:** only if "Enhanced Push Security" is enabled for the Expo project. Set it in the Render dashboard (it is declared in `render.yaml` with `sync: false`); never commit it.

Devices register their push token after sign-in and remove it on sign-out. Tokens for uninstalled apps are deleted automatically when Expo reports them as `DeviceNotRegistered`.
```

- [ ] **Step 2: Document the feature and the QA steps**

In `docs/features.md`:
- Under "## Admin Features" → "### Web", after "- News CRUD", add `- Announcements to everyone, a small group or an event's attendees (with push)`.
- Append this at the end:

```markdown
## Announcements and Push Notifications

- Admins send announcements to everyone, a small group, or an event's attendees (registered plus checked in) from web `/admin/announcements` or the mobile Send Announcement screen; group leaders can message their own group from `/groups/[id]`.
- Every notification the platform sends (prayer milestones, group requests and approvals, devotionals, announcements) is created in-app and also pushed to members' phones.
- Phones register for push after sign-in and unregister on sign-out; tapping a push opens the related screen.
- The website uses in-app notifications only.
```

Append this to `docs/qa-checklist.md`:

```markdown
## Announcements and Push

- [ ] (Dev/store build) After sign-in the app asks for notification permission; a row appears in `push_tokens`
- [ ] Admin sends to Everyone on `/admin/announcements`; members get an in-app notification and a phone push
- [ ] A group leader sends from `/groups/[id]`; only that group's members receive it
- [ ] A leader cannot send to another group or to everyone
- [ ] An event announcement reaches registered and checked-in members once each
- [ ] Tapping a push opens the right screen (prayer, group, event, devotional, notifications)
- [ ] After sign-out the device's token is removed and it no longer receives pushes
- [ ] With push failing (airplane mode on the server side / Expo down), actions still succeed and in-app notifications still appear
```

In `docs/superpowers/plans/2026-09-28-00-roadmap.md`, change the phase 6 row to:

```markdown
| 6 | `2026-10-06-phase-6-announcements-push.md` | Done |
```

- [ ] **Step 3: Run all project checks**

```bash
cd backend && npx jest --runInBand --coverage=false && npx eslint src/ tests/ && cd ..
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build && cd ..
cd mobile && npm run -s lint && npx tsc --noEmit && cd ..
```

Expected: all 264 backend tests pass, there are no lint or type errors, the frontend build succeeds, and mobile is clean.

- [ ] **Step 4: Commit**

```bash
git add docs/deployment.md docs/features.md docs/qa-checklist.md docs/superpowers/plans/2026-09-28-00-roadmap.md
git commit -m "docs: document announcements, push setup and QA steps

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
