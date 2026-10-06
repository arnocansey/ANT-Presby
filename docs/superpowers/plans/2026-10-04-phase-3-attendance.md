# Phase 3: Attendance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins check people in to an event and see headcounts over time:
- registered members
- any other member, found by search
- walk-in guests, by name

This works on web and mobile, and replaces the mobile "Attendance" placeholder that only listed events.

**Architecture:**
- **Data:** a new `AttendanceRecord` table holds one row per person per event. A row is a member (`userId`) or a guest (`guestName`), never both. A partial unique index in SQL makes checking a member in twice impossible, even when two admins tap at the same moment.
- **Model:** `attendanceModel.js` assembles each event's check-in sheet with a pure function, `buildAttendanceSummary`, so it can be unit-tested.
- **API:** admin-only routes under `/api/admin/attendance`. The existing admin user list gains `?search=` for member lookup.
- **Screens:** web gets `/admin/attendance` (event list plus a headcount trend) and `/admin/attendance/[eventId]` (the check-in sheet). The mobile Attendance screen becomes event list → check-in sheet.

**Tech Stack:**
- Backend: Express 4, Prisma 6 (PostgreSQL), express-validator 7, Jest 29 and supertest
- Web: Next.js 16, TanStack Query 5
- Mobile: Expo SDK 55, TanStack Query 5

**Spec:** `docs/superpowers/specs/2026-09-28-mockups-real-design.md`, section 5.3 (plus §3 conventions, §6 errors, §7 testing). The roadmap is in `docs/superpowers/plans/2026-09-28-00-roadmap.md`.

## Global Constraints

- **Admins only:** only admins can check people in, undo check-ins, or see attendance. Every attendance route sits behind `verifyToken` and `requireRole('admin')`.
- **Records:** an `AttendanceRecord` is exactly one of a member (`userId`) or a walk-in guest (`guestName`, 1–255 characters after trimming). A database check constraint enforces this too.
- **Member check-in is idempotent:** checking in an already-checked-in member returns the existing record with **200**. A new check-in returns **201**. Guests always create a new record.
- **Audit:** admin writes (check-in that creates a record, and undo) call `auditLogModel.createAuditLog` with `entityType: 'attendance'`.
- **Out of scope:** self check-in and QR codes.
- **Schema changes:** every change goes both in `backend/prisma/schema.prisma` **and** as idempotent SQL in `backend/migrations/migrateFeatureUpdates.js`. The partial unique index exists **only** in SQL, because Prisma can't express it. **Never run `npm run prisma:push` against production;** it would drop that index. Task 6 adds this warning to `docs/deployment.md`.
- **Dependencies:** no new backend, web, or mobile dependencies.
- **Commits:** every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

These cases are the ones most likely to hurt a real user. Each has a test in the task named.

1. **Double check-ins.** Two admins, or a double tap, check the same member in at the same moment. Exactly one record is kept. The loser of the race gets the existing record with 200, not a 500 from the unique index (Prisma `P2002`). *(Task 2 model test, Task 3 route test)*
2. **Missing people or events.** Checking in a member who doesn't exist (for example, a deleted account), or checking in to an event that doesn't exist, returns 404 "Member not found" or "Event not found", not a foreign-key 500. *(Task 3)*
3. **Bad guest input.** A guest name that's blank, only spaces, or over 255 characters, or a request carrying both `userId` and `guestName`, or neither, returns 400. *(Task 3)*
4. **Cancelled events.** Checking in to a cancelled event returns 409 "This event was cancelled". *(Task 3)*
5. **Counting.** A registered member who is checked in counts once in the totals, not once as "registered" and again as "walk-in". Members who walk in without registering are listed separately. *(Task 2 unit test)*

---

## File Map

| File | Change | Responsibility |
|---|---|---|
| `backend/src/models/userModel.js` | Modify | `buildUserSearchWhere`; `getAllUsers` and `countUsers` take `search` |
| `backend/src/controllers/userController.js` | Modify | `?search=` on the user list |
| `backend/prisma/schema.prisma` | Modify | `AttendanceRecord`; back-relations on `Event` and `User` |
| `backend/migrations/migrateFeatureUpdates.js` | Modify | Table, check constraint, indexes |
| `backend/src/models/attendanceModel.js` | Create | Queries plus the pure `buildAttendanceSummary` and `toSummaryRow` |
| `backend/src/controllers/attendanceController.js` | Create | Handlers |
| `backend/src/routes/adminAttendanceRoutes.js` | Create | Routes |
| `backend/src/middleware/validators.js` | Modify | `validateCheckIn` |
| `backend/src/server.js` | Modify | Mount the routes |
| `backend/tests/models/userSearch.test.js` | Create | Search-filter tests |
| `backend/tests/api/adminUserSearch.test.js` | Create | `?search=` route tests |
| `backend/tests/models/attendanceModel.test.js` | Create | Summary and idempotent check-in tests |
| `backend/tests/api/attendance.test.js` | Create | Route tests |
| `frontend/src/hooks/useApi.ts` | Modify | Attendance types and hooks; user search hook |
| `frontend/src/app/admin/attendance/page.tsx` | Create | Event list and trend |
| `frontend/src/app/admin/attendance/[eventId]/page.tsx` | Create | Check-in sheet |
| `frontend/src/components/layout/AdminSidebar.tsx` | Modify | "Attendance" link |
| `mobile/src/hooks/use-api.ts` | Modify | Attendance types and hooks; user search hook |
| `mobile/src/app/admin-attendance.tsx` | Rewrite | Event list → check-in sheet |
| `docs/features.md`, `docs/qa-checklist.md`, `docs/deployment.md`, roadmap | Modify | Documentation |

---

### Task 1: Branch, and member search on the admin user list

**Files:**
- Modify: `backend/src/models/userModel.js`
- Modify: `backend/src/controllers/userController.js`
- Test: `backend/tests/models/userSearch.test.js`, `backend/tests/api/adminUserSearch.test.js`

**Interfaces:**
- Produces:
  - `userModel.buildUserSearchWhere(search: string) → Prisma where`. It's `{}` when the term is empty. Otherwise every whitespace-separated word (up to 5) must match the first name, last name, or email, case-insensitively.
  - `userModel.getAllUsers(offset, limit, search = '')`
  - `userModel.countUsers(search = '')`
  - `GET /api/admin/users?search=<term>&limit=` (and `/api/users`). The term is trimmed and capped at 100 characters.

- [ ] **Step 1: Create the branch and commit this plan**

```bash
cd ANT-Presby
git checkout feature/sermon-series
git checkout -b feature/attendance
git add docs/superpowers/plans/2026-10-04-phase-3-attendance.md
git commit -m "docs: phase 3 attendance plan

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

The branch stacks on `feature/sermon-series`, whose PR is not merged yet. Open this branch's PR after the earlier two are merged, or target it at `feature/sermon-series`.

- [ ] **Step 2: Write the failing tests**

Create `backend/tests/models/userSearch.test.js`:

```js
const { buildUserSearchWhere } = require('../../src/models/userModel');

const wordFilter = (word) => ({
  OR: [
    { firstName: { contains: word, mode: 'insensitive' } },
    { lastName: { contains: word, mode: 'insensitive' } },
    { email: { contains: word, mode: 'insensitive' } },
  ],
});

describe('buildUserSearchWhere', () => {
  test('an empty or blank term matches everyone', () => {
    expect(buildUserSearchWhere('')).toEqual({});
    expect(buildUserSearchWhere('   ')).toEqual({});
    expect(buildUserSearchWhere(undefined)).toEqual({});
  });

  test('each word must match a name or the email', () => {
    expect(buildUserSearchWhere('  Ama   Mensah ')).toEqual({ AND: [wordFilter('Ama'), wordFilter('Mensah')] });
  });

  test('at most five words are used', () => {
    expect(buildUserSearchWhere('a b c d e f g').AND).toHaveLength(5);
  });
});
```

Create `backend/tests/api/adminUserSearch.test.js`:

```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const admin = () => `Bearer ${jwt.sign({ userId: 1, email: 'a@test.com', role: 'admin' }, process.env.JWT_SECRET)}`;

describe('GET /api/admin/users?search=', () => {
  let userModel;
  let app;

  beforeEach(() => {
    jest.resetModules();
    userModel = {
      getAllUsers: jest.fn().mockResolvedValue([{ id: 2, first_name: 'Ama', password: 'hash' }]),
      countUsers: jest.fn().mockResolvedValue(1),
    };
    jest.doMock('../../src/models/userModel', () => userModel);
    jest.doMock('../../src/models/auditLogModel', () => ({ createAuditLog: jest.fn() }));

    app = express();
    app.use(express.json());
    app.use('/api/admin/users', require('../../src/routes/adminUserRoutes'));
  });

  test('passes a trimmed search term to the model', async () => {
    const response = await request(app).get('/api/admin/users?search=%20Ama%20&limit=5').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(userModel.getAllUsers).toHaveBeenCalledWith(0, 5, 'Ama');
    expect(userModel.countUsers).toHaveBeenCalledWith('Ama');
    expect(response.body.data[0]).not.toHaveProperty('password');
  });

  test('without a search term everyone is listed', async () => {
    await request(app).get('/api/admin/users').set('Authorization', admin());

    expect(userModel.getAllUsers).toHaveBeenCalledWith(0, 10, '');
    expect(userModel.countUsers).toHaveBeenCalledWith('');
  });

  test('an over-long term is capped at 100 characters', async () => {
    await request(app).get(`/api/admin/users?search=${'x'.repeat(300)}`).set('Authorization', admin());

    expect(userModel.getAllUsers.mock.calls[0][2]).toHaveLength(100);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/models/userSearch.test.js tests/api/adminUserSearch.test.js --coverage=false`
Expected: FAIL. `buildUserSearchWhere is not a function`, and `getAllUsers` is called with 2 arguments instead of 3.

- [ ] **Step 4: Add search to the user model**

In `backend/src/models/userModel.js`:

a. Add this above `getAllUsers`:

```js
// Admin member lookup: every word must match a first name, last name or email (case-insensitive).
const buildUserSearchWhere = (search) => {
  const words = String(search || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);

  if (words.length === 0) {
    return {};
  }

  return {
    AND: words.map((word) => ({
      OR: [
        { firstName: { contains: word, mode: 'insensitive' } },
        { lastName: { contains: word, mode: 'insensitive' } },
        { email: { contains: word, mode: 'insensitive' } },
      ],
    })),
  };
};
```

b. Change `const getAllUsers = async (offset, limit) => {` to `const getAllUsers = async (offset, limit, search = '') => {`, and add `where: buildUserSearchWhere(search),` as the first property of its `findMany` argument.

c. Replace `countUsers` with:

```js
const countUsers = async (search = '') => {
  return prisma.user.count({ where: buildUserSearchWhere(search) });
};
```

d. Add `buildUserSearchWhere,` to `module.exports`.

- [ ] **Step 5: Accept `search` in the controller**

In `backend/src/controllers/userController.js`, replace the first lines of `getAllUsers`, up to and including the `countUsers` call, with:

```js
    const { page = 1, limit = 10, search } = req.query;
    const { offset, limitNum } = getPagination(page, limit);
    const searchTerm = typeof search === 'string' ? search.trim().slice(0, 100) : '';

    const users = await userModel.getAllUsers(offset, limitNum, searchTerm);
    const total = await userModel.countUsers(searchTerm);
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd backend && npx jest tests/models/userSearch.test.js tests/api/adminUserSearch.test.js --coverage=false`
Expected: PASS (3 model tests and 3 route tests).

- [ ] **Step 7: Commit**

```bash
git add backend/src/models/userModel.js backend/src/controllers/userController.js backend/tests/models/userSearch.test.js backend/tests/api/adminUserSearch.test.js
git commit -m "feat: search members by name or email on the admin user list

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Attendance schema, migration, and model

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/migrations/migrateFeatureUpdates.js` (insert before `await client.query('COMMIT');`)
- Create: `backend/src/models/attendanceModel.js`
- Test: `backend/tests/models/attendanceModel.test.js`

**Interfaces:**
- Produces:
  - Prisma `AttendanceRecord { id, eventId, userId?, guestName?, checkedInBy?, checkedInAt }` with relations `event`, `user` (`"AttendanceMember"`) and `checker` (`"AttendanceCheckedInBy"`). `Event.attendance` and `User.attendanceRecords` / `User.attendanceCheckIns`.
  - `attendanceModel.buildAttendanceSummary(event) → EventAttendance` (shape below)
  - `attendanceModel.toSummaryRow(event) → { event_id, name, event_date, registered, members, guests, total }`
  - `attendanceModel.getEventAttendance(eventId) → EventAttendance | undefined`
  - `attendanceModel.findEventForCheckIn(eventId) → { id, status } | null`
  - `attendanceModel.checkInMember({ eventId, userId, checkedInBy }) → { record, created: boolean }`
  - `attendanceModel.checkInGuest({ eventId, guestName, checkedInBy }) → record`
  - `attendanceModel.deleteRecord(recordId) → { id, event_id } | undefined`
  - `attendanceModel.getAttendanceSummary(limit) → SummaryRow[]`, covering the newest events that have already started.
  - Records come back as snake_case (`id`, `event_id`, `user_id`, `guest_name`, `checked_in_by`, `checked_in_at`).

`EventAttendance` has this shape:

```js
{
  event: { id, name, event_date, location, status },
  registered: [{ user_id, first_name, last_name, email, checked_in, record_id, checked_in_at }],
  walk_in_members: [{ user_id, first_name, last_name, email, record_id, checked_in_at }],
  guests: [{ record_id, guest_name, checked_in_at }],
  totals: { registered, checked_in_members, guests, total },
}
```

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/models/attendanceModel.test.js`:

```js
const buildPrismaMock = () => ({
  attendanceRecord: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
});

const loadModel = (prismaMock) => {
  jest.resetModules();
  jest.doMock('../../src/config/prisma', () => prismaMock);
  return require('../../src/models/attendanceModel');
};

const ama = { id: 2, firstName: 'Ama', lastName: 'Mensah', email: 'ama@test.com' };
const kofi = { id: 3, firstName: 'Kofi', lastName: 'Boateng', email: 'kofi@test.com' };
const yaw = { id: 4, firstName: 'Yaw', lastName: 'Asante', email: 'yaw@test.com' };
const at = new Date('2026-10-04T09:00:00Z');

const event = {
  id: 7,
  name: 'Sunday Service',
  eventDate: at,
  location: 'Main hall',
  status: 'active',
  registrations: [
    { userId: 2, user: ama },
    { userId: 3, user: kofi },
  ],
  attendance: [
    { id: 10, userId: 2, user: ama, guestName: null, checkedInAt: at },
    { id: 11, userId: 4, user: yaw, guestName: null, checkedInAt: at },
    { id: 12, userId: null, user: null, guestName: 'Visitor Esi', checkedInAt: at },
  ],
};

describe('buildAttendanceSummary', () => {
  const { buildAttendanceSummary } = loadModel(buildPrismaMock());

  test('marks which registered members are checked in', () => {
    const summary = buildAttendanceSummary(event);

    expect(summary.registered).toEqual([
      { user_id: 2, first_name: 'Ama', last_name: 'Mensah', email: 'ama@test.com', checked_in: true, record_id: 10, checked_in_at: at },
      { user_id: 3, first_name: 'Kofi', last_name: 'Boateng', email: 'kofi@test.com', checked_in: false, record_id: null, checked_in_at: null },
    ]);
  });

  test('lists unregistered members and guests separately', () => {
    const summary = buildAttendanceSummary(event);

    expect(summary.walk_in_members).toEqual([
      { user_id: 4, first_name: 'Yaw', last_name: 'Asante', email: 'yaw@test.com', record_id: 11, checked_in_at: at },
    ]);
    expect(summary.guests).toEqual([{ record_id: 12, guest_name: 'Visitor Esi', checked_in_at: at }]);
  });

  test('counts each person once in the totals', () => {
    expect(buildAttendanceSummary(event).totals).toEqual({
      registered: 2,
      checked_in_members: 2,
      guests: 1,
      total: 3,
    });
  });

  test('includes the event details', () => {
    expect(buildAttendanceSummary(event).event).toEqual({
      id: 7,
      name: 'Sunday Service',
      event_date: at,
      location: 'Main hall',
      status: 'active',
    });
  });
});

describe('toSummaryRow', () => {
  const { toSummaryRow } = loadModel(buildPrismaMock());

  test('splits members and guests', () => {
    const row = toSummaryRow({
      id: 7,
      name: 'Sunday Service',
      eventDate: at,
      _count: { registrations: 5 },
      attendance: [{ userId: 2 }, { userId: null }, { userId: 4 }],
    });

    expect(row).toEqual({ event_id: 7, name: 'Sunday Service', event_date: at, registered: 5, members: 2, guests: 1, total: 3 });
  });
});

describe('checkInMember', () => {
  test('creates a record the first time', async () => {
    const prisma = buildPrismaMock();
    prisma.attendanceRecord.findFirst.mockResolvedValue(null);
    prisma.attendanceRecord.create.mockResolvedValue({ id: 20, eventId: 7, userId: 2, checkedInBy: 1, checkedInAt: at });
    const { checkInMember } = loadModel(prisma);

    const result = await checkInMember({ eventId: 7, userId: 2, checkedInBy: 1 });

    expect(result.created).toBe(true);
    expect(result.record).toEqual(expect.objectContaining({ id: 20, event_id: 7, user_id: 2 }));
    expect(prisma.attendanceRecord.create).toHaveBeenCalledWith({ data: { eventId: 7, userId: 2, checkedInBy: 1 } });
  });

  test('returns the existing record without creating another', async () => {
    const prisma = buildPrismaMock();
    prisma.attendanceRecord.findFirst.mockResolvedValue({ id: 20, eventId: 7, userId: 2 });
    const { checkInMember } = loadModel(prisma);

    const result = await checkInMember({ eventId: 7, userId: 2, checkedInBy: 1 });

    expect(result.created).toBe(false);
    expect(result.record.id).toBe(20);
    expect(prisma.attendanceRecord.create).not.toHaveBeenCalled();
  });

  test('a concurrent duplicate (unique violation) returns the winner instead of failing', async () => {
    const prisma = buildPrismaMock();
    prisma.attendanceRecord.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 21, eventId: 7, userId: 2 });
    prisma.attendanceRecord.create.mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }));
    const { checkInMember } = loadModel(prisma);

    const result = await checkInMember({ eventId: 7, userId: 2, checkedInBy: 1 });

    expect(result).toEqual({ record: expect.objectContaining({ id: 21 }), created: false });
  });

  test('other database errors still propagate', async () => {
    const prisma = buildPrismaMock();
    prisma.attendanceRecord.findFirst.mockResolvedValue(null);
    prisma.attendanceRecord.create.mockRejectedValue(new Error('connection lost'));
    const { checkInMember } = loadModel(prisma);

    await expect(checkInMember({ eventId: 7, userId: 2, checkedInBy: 1 })).rejects.toThrow('connection lost');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/models/attendanceModel.test.js --coverage=false`
Expected: FAIL with `Cannot find module '../../src/models/attendanceModel'`.

- [ ] **Step 3: Update the Prisma schema**

In `backend/prisma/schema.prisma`:

a. In `model User`, add these after `prayerIntercessions  PrayerIntercession[]`:

```prisma
  attendanceRecords    AttendanceRecord[]  @relation("AttendanceMember")
  attendanceCheckIns   AttendanceRecord[]  @relation("AttendanceCheckedInBy")
```

b. In `model Event`, add this after `registrations    EventRegistration[]`:

```prisma
  attendance       AttendanceRecord[]
```

c. Add this new model directly after `model EventRegistration { ... }`:

```prisma
// One row per person per event: a member (userId) or a walk-in guest (guestName), never both.
// The SQL migration also adds a partial unique index (event_id, user_id) WHERE user_id IS NOT NULL
// and a check constraint; Prisma cannot express either, so never `prisma db push` to production.
model AttendanceRecord {
  id          Int      @id @default(autoincrement())
  eventId     Int      @map("event_id")
  userId      Int?     @map("user_id")
  guestName   String?  @map("guest_name") @db.VarChar(255)
  checkedInBy Int?     @map("checked_in_by")
  checkedInAt DateTime @default(now()) @map("checked_in_at")
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user        User?    @relation("AttendanceMember", fields: [userId], references: [id], onDelete: Cascade)
  checker     User?    @relation("AttendanceCheckedInBy", fields: [checkedInBy], references: [id], onDelete: SetNull)

  @@index([eventId], map: "idx_attendance_event")
  @@map("attendance_records")
}
```

Run: `cd backend && DATABASE_URL="postgresql://x:y@localhost:5432/z" npx prisma validate && npx prisma generate`
Expected: `The schema at prisma\schema.prisma is valid`, followed by `Generated Prisma Client`.

- [ ] **Step 4: Add the idempotent migration**

In `backend/migrations/migrateFeatureUpdates.js`, insert this directly before `await client.query('COMMIT');`:

```js
    // Attendance (phase 3)
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        guest_name VARCHAR(255),
        checked_in_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        checked_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT attendance_member_or_guest CHECK ((user_id IS NULL) <> (guest_name IS NULL))
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_attendance_event
      ON attendance_records(event_id);
    `);

    // A member can be checked in to an event only once; guests are unlimited.
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS attendance_event_user_unique
      ON attendance_records(event_id, user_id)
      WHERE user_id IS NOT NULL;
    `);
```

Run: `cd backend && node --check migrations/migrateFeatureUpdates.js`
Expected: no output. **Do not** `require` or run the script. There's no local database.

- [ ] **Step 5: Create the model**

Create `backend/src/models/attendanceModel.js`:

```js
const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

/**
 * Attendance Model - check-ins for events (members and walk-in guests)
 */

const personSelect = { id: true, firstName: true, lastName: true, email: true };

const toPerson = (user) => ({
  user_id: user.id,
  first_name: user.firstName,
  last_name: user.lastName,
  email: user.email,
});

// Pure: turns an event with its registrations and attendance into the check-in sheet.
const buildAttendanceSummary = (event) => {
  const memberRecords = new Map();
  const guests = [];

  event.attendance.forEach((record) => {
    if (record.userId && record.user) {
      memberRecords.set(record.userId, record);
    } else if (record.guestName) {
      guests.push({ record_id: record.id, guest_name: record.guestName, checked_in_at: record.checkedInAt });
    }
  });

  const registeredIds = new Set();
  const registered = event.registrations.map((registration) => {
    registeredIds.add(registration.userId);
    const record = memberRecords.get(registration.userId);
    return {
      ...toPerson(registration.user),
      checked_in: Boolean(record),
      record_id: record ? record.id : null,
      checked_in_at: record ? record.checkedInAt : null,
    };
  });

  const walkInMembers = [...memberRecords.values()]
    .filter((record) => !registeredIds.has(record.userId))
    .map((record) => ({ ...toPerson(record.user), record_id: record.id, checked_in_at: record.checkedInAt }));

  return {
    event: {
      id: event.id,
      name: event.name,
      event_date: event.eventDate,
      location: event.location,
      status: event.status,
    },
    registered,
    walk_in_members: walkInMembers,
    guests,
    totals: {
      registered: registered.length,
      checked_in_members: memberRecords.size,
      guests: guests.length,
      total: memberRecords.size + guests.length,
    },
  };
};

const getEventAttendance = async (eventId) => {
  const event = await prisma.event.findUnique({
    where: { id: Number(eventId) },
    select: {
      id: true,
      name: true,
      eventDate: true,
      location: true,
      status: true,
      registrations: {
        orderBy: { registeredAt: 'asc' },
        select: { userId: true, user: { select: personSelect } },
      },
      attendance: {
        orderBy: { checkedInAt: 'asc' },
        select: { id: true, userId: true, guestName: true, checkedInAt: true, user: { select: personSelect } },
      },
    },
  });

  return event ? buildAttendanceSummary(event) : undefined;
};

const findEventForCheckIn = (eventId) =>
  prisma.event.findUnique({
    where: { id: Number(eventId) },
    select: { id: true, status: true },
  });

const findMemberRecord = (eventId, userId) =>
  prisma.attendanceRecord.findFirst({ where: { eventId, userId } });

// Idempotent: a member already checked in gets their existing record back. The partial unique
// index makes a concurrent duplicate fail with P2002, in which case the winner's record is returned.
const checkInMember = async ({ eventId, userId, checkedInBy }) => {
  const existing = await findMemberRecord(eventId, userId);
  if (existing) {
    return { record: toSnakeCaseObject(existing), created: false };
  }

  try {
    const record = await prisma.attendanceRecord.create({ data: { eventId, userId, checkedInBy } });
    return { record: toSnakeCaseObject(record), created: true };
  } catch (error) {
    if (error?.code === 'P2002') {
      const winner = await findMemberRecord(eventId, userId);
      if (winner) {
        return { record: toSnakeCaseObject(winner), created: false };
      }
    }
    throw error;
  }
};

const checkInGuest = async ({ eventId, guestName, checkedInBy }) => {
  const record = await prisma.attendanceRecord.create({ data: { eventId, guestName, checkedInBy } });
  return toSnakeCaseObject(record);
};

const deleteRecord = async (recordId) => {
  const id = Number(recordId);
  const record = await prisma.attendanceRecord.findUnique({ where: { id }, select: { id: true, eventId: true } });

  if (!record) {
    return undefined;
  }

  await prisma.attendanceRecord.deleteMany({ where: { id } });
  return { id: record.id, event_id: record.eventId };
};

const toSummaryRow = (event) => {
  const members = event.attendance.filter((record) => record.userId !== null).length;
  return {
    event_id: event.id,
    name: event.name,
    event_date: event.eventDate,
    registered: event._count.registrations,
    members,
    guests: event.attendance.length - members,
    total: event.attendance.length,
  };
};

// Headcounts for the most recent events that have already started (newest first).
const getAttendanceSummary = async (limit = 10) => {
  const events = await prisma.event.findMany({
    where: { eventDate: { lte: new Date() } },
    orderBy: { eventDate: 'desc' },
    take: Number(limit),
    select: {
      id: true,
      name: true,
      eventDate: true,
      _count: { select: { registrations: true } },
      attendance: { select: { userId: true } },
    },
  });

  return events.map(toSummaryRow);
};

module.exports = {
  buildAttendanceSummary,
  toSummaryRow,
  getEventAttendance,
  findEventForCheckIn,
  checkInMember,
  checkInGuest,
  deleteRecord,
  getAttendanceSummary,
};
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd backend && npx jest tests/models/attendanceModel.test.js --coverage=false`
Expected: PASS (4 summary, 1 row, and 4 check-in tests: 9 in total).

- [ ] **Step 7: Commit**

```bash
git add backend/prisma/schema.prisma backend/migrations/migrateFeatureUpdates.js backend/src/models/attendanceModel.js backend/tests/models/attendanceModel.test.js
git commit -m "feat: add attendance records with one check-in per member per event

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Attendance API

**Files:**
- Create: `backend/src/controllers/attendanceController.js`
- Create: `backend/src/routes/adminAttendanceRoutes.js`
- Modify: `backend/src/middleware/validators.js` (`validateCheckIn`)
- Modify: `backend/src/server.js`
- Test: `backend/tests/api/attendance.test.js`

**Interfaces:**
- Consumes: the `attendanceModel` functions (Task 2), `userModel.findUserById(id) → user | undefined`, `parseId` (from `utils/helpers`, Phase 2), `auditLogModel.createAuditLog`.
- Produces (all admin-only):
  - `GET /api/admin/attendance/events/:eventId` → `{ data: EventAttendance }`
  - `POST /api/admin/attendance/events/:eventId/check-in`, with body `{ userId }` or `{ guestName }`. Returns `201 { data: record }` for a new check-in, or `200` with the existing record.
  - `DELETE /api/admin/attendance/records/:id` → `200`
  - `GET /api/admin/attendance/summary?limit=` → `{ data: SummaryRow[] }`. `limit` defaults to 10, and anything over 50 is capped at 50.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/api/attendance.test.js`:

```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const tokenFor = (userId, role) => jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET);
const admin = () => `Bearer ${tokenFor(1, 'admin')}`;

const buildModels = () => ({
  attendanceModel: {
    getEventAttendance: jest.fn().mockResolvedValue({ event: { id: 7 }, totals: { total: 0 } }),
    findEventForCheckIn: jest.fn().mockResolvedValue({ id: 7, status: 'active' }),
    checkInMember: jest.fn().mockResolvedValue({ record: { id: 20, user_id: 2 }, created: true }),
    checkInGuest: jest.fn().mockResolvedValue({ id: 21, guest_name: 'Visitor Esi' }),
    deleteRecord: jest.fn().mockResolvedValue({ id: 20, event_id: 7 }),
    getAttendanceSummary: jest.fn().mockResolvedValue([]),
  },
  userModel: { findUserById: jest.fn().mockResolvedValue({ id: 2, first_name: 'Ama' }) },
  auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
});

const buildApp = (models) => {
  jest.resetModules();
  jest.doMock('../../src/models/attendanceModel', () => models.attendanceModel);
  jest.doMock('../../src/models/userModel', () => models.userModel);
  jest.doMock('../../src/models/auditLogModel', () => models.auditLogModel);

  const app = express();
  app.use(express.json());
  app.use('/api/admin/attendance', require('../../src/routes/adminAttendanceRoutes'));
  const { errorHandler } = require('../../src/middleware/errorHandler');
  app.use(errorHandler);
  return app;
};

describe('Attendance API', () => {
  let models;
  let app;
  const checkIn = (body, eventId = 7) =>
    request(app).post(`/api/admin/attendance/events/${eventId}/check-in`).set('Authorization', admin()).send(body);

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('members cannot use attendance', async () => {
    const response = await request(app)
      .get('/api/admin/attendance/events/7')
      .set('Authorization', `Bearer ${tokenFor(5, 'member')}`);

    expect(response.status).toBe(403);
  });

  describe('GET /events/:eventId', () => {
    test('returns the check-in sheet', async () => {
      const response = await request(app).get('/api/admin/attendance/events/7').set('Authorization', admin());

      expect(response.status).toBe(200);
      expect(models.attendanceModel.getEventAttendance).toHaveBeenCalledWith(7);
      expect(response.body.data.event.id).toBe(7);
    });

    test('a missing event returns 404', async () => {
      models.attendanceModel.getEventAttendance.mockResolvedValue(undefined);
      const response = await request(app).get('/api/admin/attendance/events/99').set('Authorization', admin());
      expect(response.status).toBe(404);
    });

    test('a malformed id returns 404 without querying', async () => {
      const response = await request(app).get('/api/admin/attendance/events/abc').set('Authorization', admin());

      expect(response.status).toBe(404);
      expect(models.attendanceModel.getEventAttendance).not.toHaveBeenCalled();
    });
  });

  describe('POST /events/:eventId/check-in', () => {
    test('checks a member in with 201 and audits it', async () => {
      const response = await checkIn({ userId: 2 });

      expect(response.status).toBe(201);
      expect(models.attendanceModel.checkInMember).toHaveBeenCalledWith({ eventId: 7, userId: 2, checkedInBy: 1 });
      expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'attendance', action: 'check_in', entityId: 20, actorUserId: 1 })
      );
    });

    test('a member already checked in gets 200 with the existing record and no new audit', async () => {
      models.attendanceModel.checkInMember.mockResolvedValue({ record: { id: 20, user_id: 2 }, created: false });

      const response = await checkIn({ userId: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(20);
      expect(models.auditLogModel.createAuditLog).not.toHaveBeenCalled();
    });

    test('checks in a guest with a trimmed name', async () => {
      const response = await checkIn({ guestName: '  Visitor Esi  ' });

      expect(response.status).toBe(201);
      expect(models.attendanceModel.checkInGuest).toHaveBeenCalledWith({ eventId: 7, guestName: 'Visitor Esi', checkedInBy: 1 });
    });

    test('an unknown member returns 404', async () => {
      models.userModel.findUserById.mockResolvedValue(undefined);

      const response = await checkIn({ userId: 99 });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Member not found');
      expect(models.attendanceModel.checkInMember).not.toHaveBeenCalled();
    });

    test('an unknown event returns 404', async () => {
      models.attendanceModel.findEventForCheckIn.mockResolvedValue(null);

      const response = await checkIn({ userId: 2 }, 99);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Event not found');
    });

    test('a malformed event id returns 404 without querying', async () => {
      const response = await checkIn({ userId: 2 }, '1.5');

      expect(response.status).toBe(404);
      expect(models.attendanceModel.findEventForCheckIn).not.toHaveBeenCalled();
    });

    test('a cancelled event returns 409', async () => {
      models.attendanceModel.findEventForCheckIn.mockResolvedValue({ id: 7, status: 'cancelled' });

      const response = await checkIn({ userId: 2 });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('This event was cancelled');
    });

    test.each([
      ['both userId and guestName', { userId: 2, guestName: 'Esi' }],
      ['neither', {}],
      ['a blank guest name', { guestName: '    ' }],
      ['an over-long guest name', { guestName: 'x'.repeat(256) }],
      ['a non-integer userId', { userId: 'abc' }],
    ])('rejects %s with 400', async (_label, body) => {
      const response = await checkIn(body);

      expect(response.status).toBe(400);
      expect(models.attendanceModel.checkInMember).not.toHaveBeenCalled();
      expect(models.attendanceModel.checkInGuest).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /records/:id', () => {
    test('undoes a check-in and audits it', async () => {
      const response = await request(app).delete('/api/admin/attendance/records/20').set('Authorization', admin());

      expect(response.status).toBe(200);
      expect(models.attendanceModel.deleteRecord).toHaveBeenCalledWith(20);
      expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'attendance', action: 'undo_check_in', entityId: 20 })
      );
    });

    test('a missing record returns 404', async () => {
      models.attendanceModel.deleteRecord.mockResolvedValue(undefined);
      const response = await request(app).delete('/api/admin/attendance/records/99').set('Authorization', admin());
      expect(response.status).toBe(404);
    });

    test('a malformed id returns 404 without querying', async () => {
      const response = await request(app).delete('/api/admin/attendance/records/abc').set('Authorization', admin());

      expect(response.status).toBe(404);
      expect(models.attendanceModel.deleteRecord).not.toHaveBeenCalled();
    });
  });

  describe('GET /summary', () => {
    test.each([
      ['', 10],
      ['?limit=5', 5],
      ['?limit=500', 50],
      ['?limit=abc', 10],
      ['?limit=0', 10],
    ])('limit %s becomes %i', async (query, expected) => {
      const response = await request(app).get(`/api/admin/attendance/summary${query}`).set('Authorization', admin());

      expect(response.status).toBe(200);
      expect(models.attendanceModel.getAttendanceSummary).toHaveBeenCalledWith(expected);
    });
  });
});

describe('Attendance routes are mounted in the server', () => {
  test('GET /api/admin/attendance/summary is served by the real app', async () => {
    const models = buildModels();
    jest.resetModules();
    jest.doMock('../../src/models/attendanceModel', () => models.attendanceModel);
    const server = require('../../src/server');

    const response = await request(server).get('/api/admin/attendance/summary').set('Authorization', admin());

    expect(response.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/api/attendance.test.js --coverage=false`
Expected: FAIL with `Cannot find module '../../src/routes/adminAttendanceRoutes'`.

- [ ] **Step 3: Add the check-in validator**

In `backend/src/middleware/validators.js`, add this after `validateSermonSeries`:

```js
// Check-in body: exactly one of a member (userId) or a walk-in guest (guestName).
const validateCheckIn = [
  body('userId').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('userId must be a positive integer'),
  body('guestName')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Guest name must be text')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Guest name cannot be blank')
    .isLength({ max: 255 })
    .withMessage('Guest name must be 255 characters or fewer'),
  body().custom((value) => {
    const hasMember = value?.userId !== undefined && value?.userId !== null;
    const hasGuest = value?.guestName !== undefined && value?.guestName !== null;
    if (hasMember === hasGuest) {
      throw new Error('Send either userId or guestName');
    }
    return true;
  }),
];
```

Add `validateCheckIn,` to `module.exports`.

- [ ] **Step 4: Create the controller**

Create `backend/src/controllers/attendanceController.js`:

```js
const { apiResponse, parseId } = require('../utils/helpers');
const attendanceModel = require('../models/attendanceModel');
const userModel = require('../models/userModel');
const auditLogModel = require('../models/auditLogModel');

/**
 * Attendance Controller (admin only)
 */

const SUMMARY_DEFAULT_LIMIT = 10;
const SUMMARY_MAX_LIMIT = 50;

const notFound = (res, message) => res.status(404).json(apiResponse(false, null, message));

const audit = (req, action, entityId, summary, metadata = {}) =>
  auditLogModel.createAuditLog({
    actorUserId: req.user.userId,
    entityType: 'attendance',
    entityId,
    action,
    summary,
    metadata,
  });

// The check-in sheet for one event
const getEventAttendance = async (req, res, next) => {
  try {
    const eventId = parseId(req.params.eventId);
    const attendance = eventId ? await attendanceModel.getEventAttendance(eventId) : undefined;

    if (!attendance) {
      return notFound(res, 'Event not found');
    }

    res.json(apiResponse(true, attendance, 'Attendance retrieved'));
  } catch (error) {
    next(error);
  }
};

// Check in a member ({ userId }) or a walk-in guest ({ guestName })
const checkIn = async (req, res, next) => {
  try {
    const eventId = parseId(req.params.eventId);
    const event = eventId ? await attendanceModel.findEventForCheckIn(eventId) : null;

    if (!event) {
      return notFound(res, 'Event not found');
    }

    if (event.status === 'cancelled') {
      return res.status(409).json(apiResponse(false, null, 'This event was cancelled'));
    }

    const { userId, guestName } = req.body;
    const checkedInBy = req.user.userId;

    if (userId !== undefined && userId !== null) {
      const member = await userModel.findUserById(userId);
      if (!member) {
        return notFound(res, 'Member not found');
      }

      const { record, created } = await attendanceModel.checkInMember({
        eventId,
        userId: Number(userId),
        checkedInBy,
      });

      if (created) {
        await audit(req, 'check_in', record.id, `Checked in member #${userId} to event #${eventId}`, { eventId });
      }

      return res
        .status(created ? 201 : 200)
        .json(apiResponse(true, record, created ? 'Checked in' : 'Already checked in'));
    }

    const record = await attendanceModel.checkInGuest({ eventId, guestName, checkedInBy });
    await audit(req, 'check_in', record.id, `Checked in guest "${guestName}" to event #${eventId}`, { eventId });
    res.status(201).json(apiResponse(true, record, 'Guest checked in'));
  } catch (error) {
    next(error);
  }
};

// Undo a check-in
const removeCheckIn = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const removed = id ? await attendanceModel.deleteRecord(id) : undefined;

    if (!removed) {
      return notFound(res, 'Check-in not found');
    }

    await audit(req, 'undo_check_in', removed.id, `Undid check-in #${removed.id} for event #${removed.event_id}`, {
      eventId: removed.event_id,
    });
    res.json(apiResponse(true, null, 'Check-in removed'));
  } catch (error) {
    next(error);
  }
};

// Headcounts for recent events (trend)
const getSummary = async (req, res, next) => {
  try {
    const parsed = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, SUMMARY_MAX_LIMIT) : SUMMARY_DEFAULT_LIMIT;
    const rows = await attendanceModel.getAttendanceSummary(limit);

    res.json(apiResponse(true, rows, 'Attendance summary retrieved'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEventAttendance,
  checkIn,
  removeCheckIn,
  getSummary,
};
```

- [ ] **Step 5: Create the routes and mount them**

Create `backend/src/routes/adminAttendanceRoutes.js`:

```js
const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { handleValidationErrors, validateCheckIn } = require('../middleware/validators');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/summary', attendanceController.getSummary);
router.get('/events/:eventId', attendanceController.getEventAttendance);
router.post('/events/:eventId/check-in', validateCheckIn, handleValidationErrors, attendanceController.checkIn);
router.delete('/records/:id', attendanceController.removeCheckIn);

module.exports = router;
```

In `backend/src/server.js`:
- Add `const adminAttendanceRoutes = require('./routes/adminAttendanceRoutes');` after the `adminEventRoutes` import.
- Add `app.use('/api/admin/attendance', adminAttendanceRoutes);` directly after `app.use('/api/admin/events', adminEventRoutes);`.

- [ ] **Step 6: Run the full suite and lint**

Run: `cd backend && npx jest --runInBand --coverage=false && npx eslint src/ tests/`
Expected: all suites pass, with no lint output. The total is 111 existing, plus 6 (Task 1), 9 (Task 2), and 25 attendance route tests: **151**.

- [ ] **Step 7: Commit**

```bash
git add backend/src/controllers/attendanceController.js backend/src/routes/adminAttendanceRoutes.js backend/src/middleware/validators.js backend/src/server.js backend/tests/api/attendance.test.js
git commit -m "feat: add admin attendance API for check-in, undo and headcount trend

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Web — attendance list and check-in sheet

**Files:**
- Modify: `frontend/src/hooks/useApi.ts` (add these after `useAdminEvents`)
- Create: `frontend/src/app/admin/attendance/page.tsx`
- Create: `frontend/src/app/admin/attendance/[eventId]/page.tsx`
- Modify: `frontend/src/components/layout/AdminSidebar.tsx`

**Interfaces:**
- Consumes: the attendance endpoints (Task 3) and `GET /admin/users?search=` (Task 1).
- Produces:
  - Types: `EventAttendance`, `AttendanceSummaryRow`, `MemberSearchResult`
  - `useEventAttendance(eventId?)`
  - `useAttendanceSummary()`
  - `useCheckIn(eventId)`, a mutation taking `{ userId: number } | { guestName: string }`
  - `useUndoCheckIn()`, a mutation taking a `number` (record id)
  - `useMemberSearch(term)`

The frontend has no test runner. Verification is type-check, lint, and build.

- [ ] **Step 1: Add the hooks**

In `frontend/src/hooks/useApi.ts`, add this directly after `useAdminEvents`:

```ts
export type AttendancePerson = { user_id: number; first_name: string; last_name: string; email: string };

export type EventAttendance = {
  event: { id: number; name: string; event_date: string; location: string; status: string };
  registered: Array<AttendancePerson & { checked_in: boolean; record_id: number | null; checked_in_at: string | null }>;
  walk_in_members: Array<AttendancePerson & { record_id: number; checked_in_at: string }>;
  guests: Array<{ record_id: number; guest_name: string; checked_in_at: string }>;
  totals: { registered: number; checked_in_members: number; guests: number; total: number };
};

export type AttendanceSummaryRow = {
  event_id: number;
  name: string;
  event_date: string;
  registered: number;
  members: number;
  guests: number;
  total: number;
};

export type MemberSearchResult = { id: number; first_name: string; last_name: string; email: string };

export const useEventAttendance = (eventId?: number) =>
  useQuery({
    queryKey: ['admin', 'attendance', 'event', eventId],
    enabled: Boolean(eventId),
    queryFn: async (): Promise<EventAttendance> => {
      const response = await apiClient.get(`/admin/attendance/events/${eventId}`);
      return response.data?.data;
    },
  });

export const useAttendanceSummary = () =>
  useQuery({
    queryKey: ['admin', 'attendance', 'summary'],
    queryFn: async (): Promise<AttendanceSummaryRow[]> => {
      const response = await apiClient.get('/admin/attendance/summary', { params: { limit: 12 } });
      return response.data?.data ?? [];
    },
  });

export const useCheckIn = (eventId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: number } | { guestName: string }) => {
      const response = await apiClient.post(`/admin/attendance/events/${eventId}/check-in`, input);
      return response.data?.data;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'attendance'] }),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not check in')),
  });
};

export const useUndoCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recordId: number) => {
      await apiClient.delete(`/admin/attendance/records/${recordId}`);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'attendance'] }),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not undo the check-in')),
  });
};

export const useMemberSearch = (term: string) => {
  const search = term.trim();
  return useQuery({
    queryKey: ['admin', 'users', 'search', search],
    enabled: search.length >= 2,
    queryFn: async (): Promise<MemberSearchResult[]> => {
      const response = await apiClient.get('/admin/users', { params: { search, limit: 10 } });
      return response.data?.data ?? [];
    },
  });
};
```

- [ ] **Step 2: Create the attendance list page**

Create `frontend/src/app/admin/attendance/page.tsx`:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminEvents, useAttendanceSummary } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

type AdminEvent = { id: number; name: string; event_date: string; location?: string; status?: string };

export default function AdminAttendancePage() {
  const { data: eventsData, isLoading: eventsLoading } = useAdminEvents();
  const { data: summary, isLoading: summaryLoading } = useAttendanceSummary();
  const events = ((eventsData ?? []) as AdminEvent[]).filter((event) => event.status !== 'cancelled');
  const maxTotal = Math.max(1, ...(summary ?? []).map((row) => row.total));

  return (
    <div className="container-max space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Attendance</h1>
        <p className="mt-2 text-sm text-ui-subtle">Check people in to an event and follow headcounts over time.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Check in</CardTitle>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <p className="text-sm text-ui-subtle">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-ui-subtle">No events yet.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {events.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/admin/attendance/${event.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:text-sky-700 dark:hover:text-cyan-300"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{event.name}</span>
                      <span className="text-xs text-ui-subtle">
                        {formatDateTime(event.event_date)}
                        {event.location ? ` · ${event.location}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">Open sheet →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent headcounts</CardTitle>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <p className="text-sm text-ui-subtle">Loading headcounts...</p>
          ) : !summary || summary.length === 0 ? (
            <p className="text-sm text-ui-subtle">No past events with attendance yet.</p>
          ) : (
            <ul className="space-y-3">
              {summary.map((row) => (
                <li key={row.event_id} className="space-y-1">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="truncate font-medium">
                      {row.name} <span className="text-ui-subtle">· {formatDateTime(row.event_date)}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {row.total} ({row.members} members, {row.guests} guests)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden>
                    <div className="h-2 rounded-full bg-sky-600" style={{ width: `${(row.total / maxTotal) * 100}%` }} />
                  </div>
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

- [ ] **Step 3: Create the check-in sheet**

Create `frontend/src/app/admin/attendance/[eventId]/page.tsx`:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCheckIn, useEventAttendance, useMemberSearch, useUndoCheckIn } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

const fullName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Member';

export default function EventCheckInPage() {
  const params = useParams<{ eventId: string }>();
  const id = Number(params?.eventId);
  const eventId = Number.isInteger(id) && id > 0 ? id : undefined;

  const { data: sheet, isLoading, error } = useEventAttendance(eventId);
  const checkIn = useCheckIn(eventId);
  const undo = useUndoCheckIn();

  const [searchInput, setSearchInput] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [guestName, setGuestName] = React.useState('');
  const { data: searchResults, isFetching: searching } = useMemberSearch(searchTerm);

  // Wait for a pause in typing before searching.
  React.useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const checkedInIds = new Set([
    ...(sheet?.registered ?? []).filter((p) => p.checked_in).map((p) => p.user_id),
    ...(sheet?.walk_in_members ?? []).map((p) => p.user_id),
  ]);
  const busy = checkIn.isPending || undo.isPending;
  const cancelled = sheet?.event.status === 'cancelled';

  const addGuest = (event: React.FormEvent) => {
    event.preventDefault();
    const name = guestName.trim();
    if (!name) return;
    checkIn.mutate({ guestName: name }, { onSuccess: () => setGuestName('') });
  };

  if (!eventId || error) {
    return (
      <div className="container-max py-12">
        <p className="text-ui-subtle">This event could not be found.</p>
        <Link href="/admin/attendance" className="text-sm font-semibold text-sky-700">
          ← Back to attendance
        </Link>
      </div>
    );
  }

  if (isLoading || !sheet) {
    return <div className="container-max py-12 text-sm text-ui-subtle">Loading check-in sheet...</div>;
  }

  return (
    <div className="container-max space-y-6 py-12">
      <div className="space-y-2">
        <Link href="/admin/attendance" className="text-sm font-semibold text-sky-700 dark:text-cyan-300">
          ← Back to attendance
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{sheet.event.name}</h1>
        <p className="text-sm text-ui-subtle">
          {formatDateTime(sheet.event.event_date)}
          {sheet.event.location ? ` · ${sheet.event.location}` : ''}
        </p>
        {cancelled && <p className="text-sm font-semibold text-red-700">This event was cancelled; check-in is closed.</p>}
        <div className="flex flex-wrap gap-3 pt-2 text-sm">
          <span className="rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-900 dark:bg-sky-900/40 dark:text-sky-100">
            {sheet.totals.total} present
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
            {sheet.totals.checked_in_members} members
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{sheet.totals.guests} guests</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
            {sheet.totals.registered} registered
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registered ({sheet.registered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {sheet.registered.length === 0 ? (
              <p className="text-sm text-ui-subtle">Nobody registered for this event.</p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {sheet.registered.map((person) => (
                  <li key={person.user_id} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{fullName(person)}</span>
                      <span className="block truncate text-xs text-ui-subtle">{person.email}</span>
                    </span>
                    {person.checked_in && person.record_id ? (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => undo.mutate(person.record_id as number)}>
                        Undo
                      </Button>
                    ) : (
                      <Button size="sm" disabled={busy || cancelled} onClick={() => checkIn.mutate({ userId: person.user_id })}>
                        Check in
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add someone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="member-search">Find a member</Label>
                <Input
                  id="member-search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Name or email (at least 2 letters)"
                  disabled={cancelled}
                />
                {searchTerm.trim().length >= 2 && (
                  <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                    {searching && <li className="py-2 text-xs text-ui-subtle">Searching...</li>}
                    {!searching && (searchResults ?? []).length === 0 && (
                      <li className="py-2 text-xs text-ui-subtle">No members match.</li>
                    )}
                    {(searchResults ?? []).map((member) => {
                      const already = checkedInIds.has(member.id);
                      return (
                        <li key={member.id} className="flex items-center justify-between gap-3 py-2">
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{fullName(member)}</span>
                            <span className="block truncate text-xs text-ui-subtle">{member.email}</span>
                          </span>
                          <Button
                            size="sm"
                            variant={already ? 'outline' : 'default'}
                            disabled={already || busy || cancelled}
                            onClick={() => checkIn.mutate({ userId: member.id })}
                          >
                            {already ? 'Checked in' : 'Check in'}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <form onSubmit={addGuest} className="space-y-2">
                <Label htmlFor="guest-name">Walk-in guest</Label>
                <div className="flex gap-2">
                  <Input
                    id="guest-name"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="Guest's name"
                    maxLength={255}
                    disabled={cancelled}
                  />
                  <Button type="submit" disabled={!guestName.trim() || busy || cancelled}>
                    Add
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Walk-ins ({sheet.walk_in_members.length + sheet.guests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sheet.walk_in_members.length + sheet.guests.length === 0 ? (
                <p className="text-sm text-ui-subtle">No walk-ins yet.</p>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {sheet.walk_in_members.map((person) => (
                    <li key={`m-${person.record_id}`} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0 truncate">
                        {fullName(person)} <span className="text-xs text-ui-subtle">member</span>
                      </span>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => undo.mutate(person.record_id)}>
                        Undo
                      </Button>
                    </li>
                  ))}
                  {sheet.guests.map((guest) => (
                    <li key={`g-${guest.record_id}`} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0 truncate">
                        {guest.guest_name} <span className="text-xs text-ui-subtle">guest</span>
                      </span>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => undo.mutate(guest.record_id)}>
                        Undo
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add the sidebar link**

In `frontend/src/components/layout/AdminSidebar.tsx`:
- Add `ClipboardCheck,` to the lucide import, after `Calendar,`.
- Add this after the Events entry in `navItems`:

```ts
  { href: '/admin/attendance', label: 'Attendance', icon: ClipboardCheck },
```

- [ ] **Step 5: Type-check, lint, and build**

Run: `cd frontend && npm run -s type-check && npm run -s lint && npm run -s build`
Expected: no type or lint output. The build lists `○ /admin/attendance` and `ƒ /admin/attendance/[eventId]`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/hooks/useApi.ts frontend/src/app/admin/attendance frontend/src/components/layout/AdminSidebar.tsx
git commit -m "feat(web): admin attendance check-in sheet and headcount trend

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Mobile — real Attendance screen

**Files:**
- Modify: `mobile/src/hooks/use-api.ts` (add these after `useAdminEvents`)
- Rewrite: `mobile/src/app/admin-attendance.tsx`

**Interfaces:**
- Consumes: the attendance endpoints (Task 3), `GET /admin/users?search=` (Task 1), and the existing `useAdminEvents(enabled)`.
- Produces:
  - Types: `EventAttendance`, `AttendanceSummaryRow`, `MemberSearchResult`
  - `useEventAttendance(eventId?)`
  - `useAttendanceSummary(enabled)`
  - `useCheckIn(eventId?)`
  - `useUndoCheckIn()`
  - `useMemberSearch(term, enabled)`

- [ ] **Step 1: Record the baseline**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo baseline-ok`
Expected: `baseline-ok`.

- [ ] **Step 2: Add the hooks**

In `mobile/src/hooks/use-api.ts`, add this directly after `useAdminEvents`:

```ts
export type AttendancePerson = { user_id: number; first_name: string; last_name: string; email: string };

export type EventAttendance = {
  event: { id: number; name: string; event_date: string; location: string; status: string };
  registered: (AttendancePerson & { checked_in: boolean; record_id: number | null; checked_in_at: string | null })[];
  walk_in_members: (AttendancePerson & { record_id: number; checked_in_at: string })[];
  guests: { record_id: number; guest_name: string; checked_in_at: string }[];
  totals: { registered: number; checked_in_members: number; guests: number; total: number };
};

export type AttendanceSummaryRow = {
  event_id: number;
  name: string;
  event_date: string;
  registered: number;
  members: number;
  guests: number;
  total: number;
};

export type MemberSearchResult = { id: number; first_name: string; last_name: string; email: string };

export const useEventAttendance = (eventId?: number) =>
  useQuery({
    queryKey: ['admin', 'attendance', 'event', eventId],
    enabled: Boolean(eventId),
    queryFn: async (): Promise<EventAttendance> => {
      const response = await apiClient.get(`/admin/attendance/events/${eventId}`);
      return response.data?.data;
    },
  });

export const useAttendanceSummary = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'attendance', 'summary'],
    enabled,
    queryFn: async (): Promise<AttendanceSummaryRow[]> => {
      const response = await apiClient.get('/admin/attendance/summary', { params: { limit: 8 } });
      return response.data?.data || [];
    },
  });

const invalidateAttendance = () => queryClient.invalidateQueries({ queryKey: ['admin', 'attendance'] });

export const useCheckIn = (eventId?: number) =>
  useMutation({
    mutationFn: async (input: { userId: number } | { guestName: string }) => {
      const response = await apiClient.post(`/admin/attendance/events/${eventId}/check-in`, input);
      return response.data?.data;
    },
    onSettled: invalidateAttendance,
  });

export const useUndoCheckIn = () =>
  useMutation({
    mutationFn: async (recordId: number) => {
      await apiClient.delete(`/admin/attendance/records/${recordId}`);
    },
    onSettled: invalidateAttendance,
  });

export const useMemberSearch = (term: string, enabled = true) => {
  const search = term.trim();
  return useQuery({
    queryKey: ['admin', 'users', 'search', search],
    enabled: enabled && search.length >= 2,
    queryFn: async (): Promise<MemberSearchResult[]> => {
      const response = await apiClient.get('/admin/users', { params: { search, limit: 10 } });
      return response.data?.data || [];
    },
  });
};
```

- [ ] **Step 3: Rewrite the Attendance screen**

Replace the whole of `mobile/src/app/admin-attendance.tsx` with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandButton, BrandCard, BrandPill } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  getApiErrorMessage,
  useAdminEvents,
  useAttendanceSummary,
  useCheckIn,
  useEventAttendance,
  useMemberSearch,
  useUndoCheckIn,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

const fullName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Member';

export default function AdminAttendanceScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const [selectedEventId, setSelectedEventId] = React.useState<number | undefined>();
  const [searchInput, setSearchInput] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [guestName, setGuestName] = React.useState('');

  const eventsQuery = useAdminEvents(isAdmin);
  const summaryQuery = useAttendanceSummary(isAdmin && !selectedEventId);
  const sheetQuery = useEventAttendance(isAdmin ? selectedEventId : undefined);
  const searchQuery = useMemberSearch(searchTerm, isAdmin && Boolean(selectedEventId));
  const checkInMutation = useCheckIn(selectedEventId);
  const undoMutation = useUndoCheckIn();

  React.useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  if (!user || !isAdmin) return null;

  const busy = checkInMutation.isPending || undoMutation.isPending;
  const showError = (title: string) => (error: unknown) => Alert.alert(title, getApiErrorMessage(error, 'Please try again.'));
  const checkInMember = (userId: number) => checkInMutation.mutate({ userId }, { onError: showError('Could not check in') });
  const undo = (recordId: number) => undoMutation.mutate(recordId, { onError: showError('Could not undo') });
  const addGuest = () => {
    const name = guestName.trim();
    if (!name) return;
    checkInMutation.mutate({ guestName: name }, { onSuccess: () => setGuestName(''), onError: showError('Could not add guest') });
  };

  const openEvent = (eventId: number) => {
    setSelectedEventId(eventId);
    setSearchInput('');
    setGuestName('');
  };

  const header = (title: string, onBack: () => void) => (
    <View style={styles.headerRow}>
      <Pressable
        onPress={onBack}
        style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
        <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
      </Pressable>
      <View style={styles.headerCopy}>
        <ThemedText type="smallBold" style={{ color: '#34D399', textTransform: 'uppercase', letterSpacing: 1 }}>
          Admin
        </ThemedText>
        <ThemedText type="subtitle" numberOfLines={1}>
          {title}
        </ThemedText>
      </View>
    </View>
  );

  const inputStyle = [styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }];

  if (!selectedEventId) {
    const events = (Array.isArray(eventsQuery.data) ? eventsQuery.data : []).filter(
      (event: any) => event?.status !== 'cancelled'
    );
    const summary = Array.isArray(summaryQuery.data) ? summaryQuery.data : [];

    return (
      <AdminShell activeTab="/admin-events">
        {header('Attendance', () => router.back())}

        <ThemedText type="defaultSemiBold">Choose an event to check people in</ThemedText>
        {eventsQuery.isLoading ? <ActivityIndicator color={theme.tint} /> : null}
        {events.slice(0, 20).map((event: any) => (
          <Pressable key={String(event.id)} onPress={() => openEvent(Number(event.id))}>
            <BrandCard>
              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <ThemedText type="defaultSemiBold">{event?.name || 'Event'}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {event?.event_date ? new Date(event.event_date).toLocaleString() : 'Date TBD'}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </View>
            </BrandCard>
          </Pressable>
        ))}

        {summary.length > 0 ? (
          <BrandCard>
            <ThemedText type="defaultSemiBold">Recent headcounts</ThemedText>
            {summary.map((row) => (
              <View key={row.event_id} style={styles.row}>
                <ThemedText type="small" style={styles.rowCopy} numberOfLines={1}>
                  {row.name}
                </ThemedText>
                <BrandPill>{`${row.total} (${row.guests} guests)`}</BrandPill>
              </View>
            ))}
          </BrandCard>
        ) : null}
      </AdminShell>
    );
  }

  const sheet = sheetQuery.data;
  const checkedInIds = new Set([
    ...(sheet?.registered ?? []).filter((p) => p.checked_in).map((p) => p.user_id),
    ...(sheet?.walk_in_members ?? []).map((p) => p.user_id),
  ]);
  const cancelled = sheet?.event.status === 'cancelled';
  const searchResults = Array.isArray(searchQuery.data) ? searchQuery.data : [];

  return (
    <AdminShell activeTab="/admin-events">
      {header(sheet?.event.name || 'Check-in', () => setSelectedEventId(undefined))}

      {sheetQuery.isLoading ? (
        <ActivityIndicator color={theme.tint} />
      ) : sheetQuery.isError || !sheet ? (
        <BrandCard>
          <ThemedText type="small">Could not load this event.</ThemedText>
          <BrandButton label="Try again" onPress={() => sheetQuery.refetch()} />
        </BrandCard>
      ) : (
        <>
          <View style={styles.pills}>
            <BrandPill>{`${sheet.totals.total} present`}</BrandPill>
            <BrandPill>{`${sheet.totals.checked_in_members} members`}</BrandPill>
            <BrandPill>{`${sheet.totals.guests} guests`}</BrandPill>
            <BrandPill>{`${sheet.totals.registered} registered`}</BrandPill>
          </View>
          {cancelled ? (
            <ThemedText type="smallBold" style={styles.errorText}>
              This event was cancelled; check-in is closed.
            </ThemedText>
          ) : null}

          <BrandCard>
            <ThemedText type="defaultSemiBold">Registered ({sheet.registered.length})</ThemedText>
            {sheet.registered.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Nobody registered for this event.
              </ThemedText>
            ) : (
              sheet.registered.map((person) => (
                <View key={person.user_id} style={styles.row}>
                  <ThemedText type="small" style={styles.rowCopy} numberOfLines={1}>
                    {fullName(person)}
                  </ThemedText>
                  {person.checked_in && person.record_id ? (
                    <BrandButton label="Undo" variant="outline" onPress={() => !busy && undo(person.record_id as number)} />
                  ) : (
                    <BrandButton
                      label="Check in"
                      onPress={() => !busy && !cancelled && checkInMember(person.user_id)}
                    />
                  )}
                </View>
              ))
            )}
          </BrandCard>

          {!cancelled ? (
            <BrandCard>
              <ThemedText type="defaultSemiBold">Add someone</ThemedText>
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="Find a member (name or email)"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                style={inputStyle}
              />
              {searchTerm.trim().length >= 2 ? (
                searchQuery.isFetching ? (
                  <ActivityIndicator color={theme.tint} />
                ) : searchResults.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    No members match.
                  </ThemedText>
                ) : (
                  searchResults.map((member) => {
                    const already = checkedInIds.has(member.id);
                    return (
                      <View key={member.id} style={styles.row}>
                        <ThemedText type="small" style={styles.rowCopy} numberOfLines={1}>
                          {fullName(member)}
                        </ThemedText>
                        <BrandButton
                          label={already ? 'Checked in' : 'Check in'}
                          variant={already ? 'outline' : 'primary'}
                          onPress={() => !already && !busy && checkInMember(member.id)}
                        />
                      </View>
                    );
                  })
                )
              ) : null}

              <TextInput
                value={guestName}
                onChangeText={setGuestName}
                placeholder="Walk-in guest's name"
                placeholderTextColor={theme.textSecondary}
                maxLength={255}
                style={inputStyle}
              />
              <BrandButton label="Add guest" variant="secondary" onPress={() => !busy && addGuest()} />
            </BrandCard>
          ) : null}

          <BrandCard>
            <ThemedText type="defaultSemiBold">
              Walk-ins ({sheet.walk_in_members.length + sheet.guests.length})
            </ThemedText>
            {sheet.walk_in_members.map((person) => (
              <View key={`m-${person.record_id}`} style={styles.row}>
                <ThemedText type="small" style={styles.rowCopy} numberOfLines={1}>
                  {`${fullName(person)} · member`}
                </ThemedText>
                <BrandButton label="Undo" variant="outline" onPress={() => !busy && undo(person.record_id)} />
              </View>
            ))}
            {sheet.guests.map((guest) => (
              <View key={`g-${guest.record_id}`} style={styles.row}>
                <ThemedText type="small" style={styles.rowCopy} numberOfLines={1}>
                  {`${guest.guest_name} · guest`}
                </ThemedText>
                <BrandButton label="Undo" variant="outline" onPress={() => !busy && undo(guest.record_id)} />
              </View>
            ))}
          </BrandCard>
        </>
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  rowCopy: { flex: 1, gap: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  errorText: { color: '#B91C1C' },
});
```

- [ ] **Step 4: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`.

- [ ] **Step 5: On-device check** (the project owner does this; note it in the report)

1. Pick an event. Check in a registered member, then undo it.
2. Search for an unregistered member and check them in. They appear under Walk-ins as "member".
3. Add a walk-in guest. The totals update.
4. A cancelled event shows "check-in is closed".

- [ ] **Step 6: Commit**

```bash
git add mobile/src/hooks/use-api.ts mobile/src/app/admin-attendance.tsx
git commit -m "feat(mobile): real attendance check-in screen

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Documentation and final checks

**Files:**
- Modify: `docs/features.md`, `docs/qa-checklist.md`, `docs/deployment.md`, `docs/superpowers/plans/2026-09-28-00-roadmap.md`

- [ ] **Step 1: Document the feature**

In `docs/features.md`, under "### Web" in "## Admin Features", after "- Events CRUD", add `- Attendance check-in and headcount trend`. Then append this at the end:

```markdown
## Attendance

- Admins open an event at web `/admin/attendance` or the mobile Attendance screen and check in registered members, any member found by name or email, or walk-in guests by name.
- A member can be checked in once per event (enforced in the database); checking in again returns the existing record. Check-ins can be undone.
- Cancelled events are closed for check-in.
- The headcount trend shows members, guests and total for recent past events.
- Every check-in and undo is recorded in the audit log.
```

- [ ] **Step 2: Add QA steps**

Append this to `docs/qa-checklist.md`:

```markdown
## Attendance

- [ ] Admin opens an event on `/admin/attendance`; registered members are listed with Check in buttons
- [ ] Checking in a registered member updates "present" and switches the button to Undo
- [ ] Searching a member by name or email and checking them in lists them under Walk-ins as "member"
- [ ] Adding a walk-in guest works; a blank name cannot be added
- [ ] Checking the same member in twice (two tabs or a double tap) keeps one record
- [ ] A cancelled event shows "check-in is closed"
- [ ] Recent headcounts show members and guests for past events
- [ ] Members (non-admins) cannot reach any attendance page or endpoint
```

- [ ] **Step 3: Add the database warning to the deployment guide**

Append this to `docs/deployment.md`:

```markdown
## Database schema changes

Schema changes are applied by `npm run migrate:features` (idempotent SQL in `backend/migrations/migrateFeatureUpdates.js`), which the Render build runs automatically.

Do **not** run `npm run prisma:push` against production. Some constraints exist only in SQL because Prisma cannot express them, for example the partial unique index `attendance_event_user_unique` that allows one check-in per member per event. `prisma db push` would drop them.
```

- [ ] **Step 4: Update the roadmap**

In `docs/superpowers/plans/2026-09-28-00-roadmap.md`, change the phase 3 row to:

```markdown
| 3 | `2026-10-04-phase-3-attendance.md` (includes admin user `?search=`) | Done |
```

- [ ] **Step 5: Run all project checks**

```bash
cd backend && npx jest --runInBand --coverage=false && npx eslint src/ tests/ && cd ..
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build && cd ..
cd mobile && npm run -s lint && npx tsc --noEmit && cd ..
```

Expected: all 151 backend tests pass, there are no lint or type errors, the frontend build succeeds, and mobile is clean.

- [ ] **Step 6: Commit**

```bash
git add docs/features.md docs/qa-checklist.md docs/deployment.md docs/superpowers/plans/2026-09-28-00-roadmap.md
git commit -m "docs: document attendance, QA steps and schema change warning

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
