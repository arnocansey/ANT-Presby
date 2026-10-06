# Phase 4: Small Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real small groups on web and mobile. This replaces the mobile "Small Groups" placeholder, which listed ministries and said "Search groups coming soon".
- Members browse groups and ask to join.
- A group's leader, or an admin, approves or declines each request.
- Members can leave.
- Admins create, edit, and deactivate groups, and assign leaders.

**Architecture:**
- **Data:** new `SmallGroup` and `GroupMembership` tables (role `leader | member`, status `pending | active`, one row per user per group).
- **Model:** `groupModel.js` holds the queries plus pure mappers (`mapGroupSummary`, `toMemberItem`), so the response shape and the member-list privacy can be unit-tested.
- **Controller:** `groupController.js` serves member routes (`/api/groups`) and admin routes (`/api/admin/groups`). Leader permissions are checked per group. Join requests and approvals go through the Phase 0 `notify()` helper.
- **Screens:**
  - Web: `/groups`, `/groups/[id]` (with leader tools), and `/admin/groups`.
  - Mobile: `small-groups.tsx` is rewritten to go from the list to a group's details on one screen.

**Tech Stack:**
- Backend: Express 4, Prisma 6 (PostgreSQL), express-validator 7, Jest 29 and supertest
- Web: Next.js 16, TanStack Query 5
- Mobile: Expo SDK 55, TanStack Query 5

**Spec:** `docs/superpowers/specs/2026-09-28-mockups-real-design.md`, section 5.4 (plus §3 conventions, §4 notifications, §6 errors, §7 testing). The roadmap is in `docs/superpowers/plans/2026-09-28-00-roadmap.md`.

## Global Constraints

- **Joining:**
  - Asking to join creates a `pending` membership.
  - Joining is refused (409) when:
    - the group is inactive
    - the member is already active or pending in it
    - the group is full: capacity counts **active** members only, and a null capacity means unlimited.
- **Deciding requests:**
  - Only the group's **active leader** or an **admin** can see, approve, or decline requests.
  - Approving is refused (409) when the group is full.
  - Declining deletes the pending row.
- **Leaving:** a member can leave, or cancel a pending request. The last active leader cannot leave (409) until someone else is made leader.
- **Privacy:** only **active members of the group and admins** see the member list. Everyone else, including signed-out visitors and pending requesters, sees the group details, the leaders' names, and the member count, but `members: null`. Request lists, which include email, go only to leaders and admins.
- **Admin rules:**
  - Admins create, edit, and **deactivate** groups. `DELETE /api/admin/groups/:id` sets `isActive = false`; it does not erase rows. `PUT` with `isActive: true` reactivates.
  - Admins set leaders with `PUT /api/admin/groups/:id/leaders { userIds }` (0–10 distinct users). Anyone not listed is demoted to member, and anyone listed becomes an active leader.
- **Hidden groups:** inactive groups are hidden from members (404 on details, missing from lists). Admins still see them.
- **Notifications:** when someone asks to join, the group's active leaders are notified. When a request is approved, the member is notified. Both go through `notificationService.notify`.
- **Audit:** admin writes (create, update, deactivate, set leaders) call `auditLogModel.createAuditLog` with `entityType: 'small_group'`.
- **Errors:**
  - Malformed IDs return 404 (shared `parseId`, which is INT4-bounded).
  - A duplicate group name returns 409.
  - An unknown `ministryId` returns 400.
  - An unknown leader user returns 404.
- **Dependencies:** no new backend, web, or mobile dependencies.
- **Schema changes:** every change goes both in `backend/prisma/schema.prisma` **and** as idempotent SQL in `backend/migrations/migrateFeatureUpdates.js`.
- **Secrets:** never write real secret keys into any file. Test files use the existing dummy `test_jwt_secret` fallback only.
- **Commits:** every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

These cases are the ones most likely to hurt a real user. Each has a test in the task named.

1. **Full groups.** A request to join or an approval that would push active members past `capacity` returns 409 "This group is full". It never silently over-fills the group. *(Task 2)*
2. **The last leader leaving** is refused with 409, so the group isn't left with nobody to approve requests. A leader with a co-leader can leave. *(Task 2)*
3. **Member-list privacy.** Signed-out visitors, non-members, and pending requesters get `members: null`. Active members and admins get the list. *(Task 2)*
4. **Non-leaders.** A member who isn't an active leader, including a *pending* leader, gets 403 on requests, approve, and decline. Malformed IDs get 404 without touching the database. *(Task 2)*
5. **Double joins.** A second request to join, from a double tap or two devices racing, returns 409 "Your request to join is already pending". The database's unique constraint makes the race safe, so it is not a 500. *(Task 2)*

---

## File Map

| File | Change | Responsibility |
|---|---|---|
| `backend/prisma/schema.prisma` | Modify | `GroupRole`, `MembershipStatus`, `SmallGroup`, `GroupMembership`; back-relations |
| `backend/migrations/migrateFeatureUpdates.js` | Modify | Enums, tables, constraints, indexes |
| `backend/src/models/groupModel.js` | Create | Queries plus pure mappers |
| `backend/src/controllers/groupController.js` | Create | Member and admin handlers |
| `backend/src/routes/groupRoutes.js` | Create | `/api/groups` |
| `backend/src/routes/adminGroupRoutes.js` | Create | `/api/admin/groups` |
| `backend/src/middleware/validators.js` | Modify | `validateGroup`, `validateGroupLeaders` |
| `backend/src/server.js` | Modify | Mount the routes |
| `backend/tests/models/groupModel.test.js` | Create | Mapper tests |
| `backend/tests/api/groups.test.js` | Create | Member route tests |
| `backend/tests/api/adminGroups.test.js` | Create | Admin route tests |
| `frontend/src/hooks/useApi.ts` | Modify | Group types and hooks |
| `frontend/src/app/groups/page.tsx` | Create | Group list |
| `frontend/src/app/groups/[id]/page.tsx` | Create | Group details and leader tools |
| `frontend/src/app/admin/groups/page.tsx` | Create | Admin management |
| `frontend/src/components/layout/Footer.tsx` | Modify | "Small Groups" link |
| `frontend/src/components/layout/AdminSidebar.tsx` | Modify | "Small Groups" link |
| `mobile/src/hooks/use-api.ts` | Modify | Group types and hooks |
| `mobile/src/app/small-groups.tsx` | Rewrite | List → group details |
| `docs/features.md`, `docs/qa-checklist.md`, roadmap | Modify | Documentation |

---

### Task 1: Schema, migration, and group model

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/migrations/migrateFeatureUpdates.js` (insert before `await client.query('COMMIT');`)
- Create: `backend/src/models/groupModel.js`
- Test: `backend/tests/models/groupModel.test.js`

**Interfaces:**
- Produces:
  - Prisma models `SmallGroup` and `GroupMembership`, with enums `GroupRole { leader member }` and `MembershipStatus { pending active }`. The compound unique key is `groupId_userId`.
  - `groupModel.mapGroupSummary(row, viewerUserId?) → GroupSummary`
  - `groupModel.toMemberItem(membership) → { user_id, first_name, last_name, role }`
  - `listActiveGroups(viewerUserId|null) → GroupSummary[]`
  - `listAllGroups() → GroupSummary[]` (admin; includes inactive groups)
  - `listMyGroups(userId) → GroupSummary[]` (active groups where the user is pending or active)
  - `getGroupById(id) → GroupSummary | undefined`
  - `getGroupDetail(id, viewerUserId|null) → (GroupSummary & { members: MemberItem[] }) | undefined`
  - `getMembership(groupId, userId) → { userId, role, status } | null` (raw camelCase)
  - `createJoinRequest(groupId, userId)`. It rejects with Prisma `P2002` on a duplicate.
  - `approveRequest(groupId, userId) → number` (rows changed)
  - `declineRequest(groupId, userId) → number`
  - `deleteMembership(groupId, userId) → number`
  - `countActiveLeaders(groupId) → number`
  - `getLeaderIds(groupId) → number[]`
  - `listPendingRequests(groupId) → { user_id, first_name, last_name, email, requested_at }[]`
  - `createGroup(input) → GroupSummary`. It rejects with `P2002` for a duplicate name and `P2003` for an unknown ministry.
  - `updateGroup(id, input) → GroupSummary | undefined`, with the same rejections.
  - `deactivateGroup(id) → number`
  - `setLeaders(groupId, userIds) → GroupSummary`
- `GroupSummary` is the snake_case group row (`id, name, description, meeting_day, meeting_time, location, capacity, ministry_id, is_active, created_at, updated_at`) plus `ministry_name`, `member_count` (active members), `leaders: [{ user_id, first_name, last_name }]`, `my_status: 'pending'|'active'|null`, and `my_role: 'leader'|'member'|null`.
- `input` is `{ name?, description?, meetingDay?, meetingTime?, location?, capacity?, ministryId?, isActive? }`. Empty strings and `null` clear optional fields.

- [ ] **Step 1: Create the branch and commit this plan**

```bash
cd ANT-Presby
git checkout feature/attendance
git checkout -b feature/small-groups
git add docs/superpowers/plans/2026-10-05-phase-4-small-groups.md
git commit -m "docs: phase 4 small groups plan

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

The branch stacks on `feature/attendance`, whose PR is not merged yet. Phases 1–2 are already in `main`.

- [ ] **Step 2: Write the failing mapper tests**

Create `backend/tests/models/groupModel.test.js`:

```js
const loadModel = () => {
  jest.resetModules();
  jest.doMock('../../src/config/prisma', () => ({}));
  return require('../../src/models/groupModel');
};

const ama = { id: 2, firstName: 'Ama', lastName: 'Mensah' };
const kofi = { id: 3, firstName: 'Kofi', lastName: 'Boateng' };
const created = new Date('2026-10-01T10:00:00Z');

const row = {
  id: 5,
  name: 'Young Adults',
  description: 'Thursday fellowship',
  meetingDay: 'Thursday',
  meetingTime: '18:30',
  location: 'Room 2',
  capacity: 12,
  ministryId: 1,
  isActive: true,
  createdAt: created,
  updatedAt: created,
  ministry: { name: 'Youth' },
  memberships: [
    { userId: 2, role: 'leader', status: 'active', user: ama },
    { userId: 3, role: 'member', status: 'pending', user: kofi },
  ],
  _count: { memberships: 7 },
};

describe('mapGroupSummary', () => {
  const { mapGroupSummary } = loadModel();

  test('flattens ministry, counts active members and lists active leaders', () => {
    const group = mapGroupSummary(row, null);

    expect(group).toEqual(
      expect.objectContaining({
        id: 5,
        name: 'Young Adults',
        meeting_day: 'Thursday',
        meeting_time: '18:30',
        capacity: 12,
        is_active: true,
        ministry_name: 'Youth',
        member_count: 7,
        leaders: [{ user_id: 2, first_name: 'Ama', last_name: 'Mensah' }],
        my_status: null,
        my_role: null,
      })
    );
    expect(group).not.toHaveProperty('memberships');
    expect(group).not.toHaveProperty('_count');
    expect(group).not.toHaveProperty('ministry');
  });

  test("reports the viewer's own status and role", () => {
    expect(mapGroupSummary(row, 3)).toEqual(expect.objectContaining({ my_status: 'pending', my_role: 'member' }));
    expect(mapGroupSummary(row, 2)).toEqual(expect.objectContaining({ my_status: 'active', my_role: 'leader' }));
    expect(mapGroupSummary(row, 99)).toEqual(expect.objectContaining({ my_status: null, my_role: null }));
  });

  test('a pending leader is not listed as a leader', () => {
    const pendingLeader = { ...row, memberships: [{ userId: 2, role: 'leader', status: 'pending', user: ama }] };
    expect(mapGroupSummary(pendingLeader, null).leaders).toEqual([]);
  });
});

describe('toMemberItem', () => {
  const { toMemberItem } = loadModel();

  test('exposes only names and role, never email', () => {
    expect(toMemberItem({ userId: 2, role: 'leader', user: { ...ama, email: 'ama@test.com' } })).toEqual({
      user_id: 2,
      first_name: 'Ama',
      last_name: 'Mensah',
      role: 'leader',
    });
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/models/groupModel.test.js --coverage=false`
Expected: FAIL with `Cannot find module '../../src/models/groupModel'`.

- [ ] **Step 4: Update the Prisma schema**

In `backend/prisma/schema.prisma`:

a. Add these enums after `enum PrayerCategory { ... }`:

```prisma
enum GroupRole {
  leader
  member

  @@map("group_role")
}

enum MembershipStatus {
  pending
  active

  @@map("membership_status")
}
```

b. In `model User`, add this after the `attendanceCheckIns` line:

```prisma
  groupMemberships     GroupMembership[]
```

c. In `model Ministry`, add this after `sermons     Sermon[]`:

```prisma
  smallGroups SmallGroup[]
```

d. Add these models after `model AttendanceRecord { ... }`:

```prisma
model SmallGroup {
  id          Int               @id @default(autoincrement())
  name        String            @unique @db.VarChar(255)
  description String?
  meetingDay  String?           @map("meeting_day") @db.VarChar(20)
  meetingTime String?           @map("meeting_time") @db.VarChar(20)
  location    String?           @db.VarChar(255)
  capacity    Int?
  ministryId  Int?              @map("ministry_id")
  isActive    Boolean           @default(true) @map("is_active")
  createdAt   DateTime          @default(now()) @map("created_at")
  updatedAt   DateTime          @updatedAt @map("updated_at")
  ministry    Ministry?         @relation(fields: [ministryId], references: [id], onDelete: SetNull)
  memberships GroupMembership[]

  @@index([ministryId], map: "idx_small_groups_ministry")
  @@map("small_groups")
}

model GroupMembership {
  id        Int              @id @default(autoincrement())
  groupId   Int              @map("group_id")
  userId    Int              @map("user_id")
  role      GroupRole        @default(member)
  status    MembershipStatus @default(pending)
  createdAt DateTime         @default(now()) @map("created_at")
  updatedAt DateTime         @updatedAt @map("updated_at")
  group     SmallGroup       @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId], map: "group_memberships_group_user_unique")
  @@index([userId], map: "idx_group_memberships_user")
  @@map("group_memberships")
}
```

Run: `cd backend && DATABASE_URL="postgresql://x:y@localhost:5432/z" npx prisma validate && npx prisma generate`
Expected: `The schema at prisma\schema.prisma is valid`, followed by `Generated Prisma Client`.

- [ ] **Step 5: Add the idempotent migration**

In `backend/migrations/migrateFeatureUpdates.js`, insert this directly before `await client.query('COMMIT');`:

```js
    // Small groups (phase 4)
    await client.query(`
      DO $$
      BEGIN
        CREATE TYPE group_role AS ENUM ('leader', 'member');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await client.query(`
      DO $$
      BEGIN
        CREATE TYPE membership_status AS ENUM ('pending', 'active');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS small_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        meeting_day VARCHAR(20),
        meeting_time VARCHAR(20),
        location VARCHAR(255),
        capacity INTEGER,
        ministry_id INTEGER REFERENCES ministries(id) ON DELETE SET NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT small_groups_name_key UNIQUE (name),
        CONSTRAINT small_groups_capacity_positive CHECK (capacity IS NULL OR capacity > 0)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_small_groups_ministry
      ON small_groups(ministry_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS group_memberships (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES small_groups(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role group_role NOT NULL DEFAULT 'member',
        status membership_status NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT group_memberships_group_user_unique UNIQUE (group_id, user_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_group_memberships_user
      ON group_memberships(user_id);
    `);
```

Run: `cd backend && node --check migrations/migrateFeatureUpdates.js`
Expected: no output. **Do not** `require` or run the script.

- [ ] **Step 6: Create the model**

Create `backend/src/models/groupModel.js`:

```js
const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

/**
 * Small Group Model - groups, memberships, join requests and leaders
 */

const nameSelect = { id: true, firstName: true, lastName: true };

// Active leaders always; plus the viewer's own membership (any status) so my_status/my_role can be reported.
const groupInclude = (viewerUserId) => ({
  ministry: { select: { name: true } },
  memberships: {
    where: {
      OR: [
        { status: 'active', role: 'leader' },
        ...(viewerUserId ? [{ userId: Number(viewerUserId) }] : []),
      ],
    },
    select: { userId: true, role: true, status: true, user: { select: nameSelect } },
  },
  _count: { select: { memberships: { where: { status: 'active' } } } },
});

const mapGroupSummary = (row, viewerUserId = null) => {
  // eslint-disable-next-line no-unused-vars
  const { ministry, memberships = [], _count: count, ...rest } = row;
  const viewerId = viewerUserId ? Number(viewerUserId) : null;
  const mine = viewerId ? memberships.find((membership) => membership.userId === viewerId) : undefined;

  return {
    ...toSnakeCaseObject(rest),
    ministry_name: ministry ? ministry.name : null,
    member_count: count?.memberships ?? 0,
    leaders: memberships
      .filter((membership) => membership.status === 'active' && membership.role === 'leader')
      .map((membership) => ({
        user_id: membership.userId,
        first_name: membership.user.firstName,
        last_name: membership.user.lastName,
      })),
    my_status: mine ? mine.status : null,
    my_role: mine ? mine.role : null,
  };
};

// Member list entries carry names and role only, never contact details.
const toMemberItem = (membership) => ({
  user_id: membership.userId,
  first_name: membership.user.firstName,
  last_name: membership.user.lastName,
  role: membership.role,
});

const listActiveGroups = async (viewerUserId = null) => {
  const rows = await prisma.smallGroup.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: groupInclude(viewerUserId),
  });
  return rows.map((row) => mapGroupSummary(row, viewerUserId));
};

const listAllGroups = async () => {
  const rows = await prisma.smallGroup.findMany({ orderBy: { name: 'asc' }, include: groupInclude(null) });
  return rows.map((row) => mapGroupSummary(row, null));
};

const listMyGroups = async (userId) => {
  const rows = await prisma.smallGroup.findMany({
    where: { isActive: true, memberships: { some: { userId: Number(userId) } } },
    orderBy: { name: 'asc' },
    include: groupInclude(userId),
  });
  return rows.map((row) => mapGroupSummary(row, userId));
};

const getGroupById = async (groupId) => {
  const row = await prisma.smallGroup.findUnique({ where: { id: Number(groupId) }, include: groupInclude(null) });
  return row ? mapGroupSummary(row, null) : undefined;
};

const getGroupDetail = async (groupId, viewerUserId = null) => {
  const id = Number(groupId);
  const row = await prisma.smallGroup.findUnique({ where: { id }, include: groupInclude(viewerUserId) });

  if (!row) {
    return undefined;
  }

  const members = await prisma.groupMembership.findMany({
    where: { groupId: id, status: 'active' },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    select: { userId: true, role: true, user: { select: nameSelect } },
  });

  return { ...mapGroupSummary(row, viewerUserId), members: members.map(toMemberItem) };
};

const getMembership = (groupId, userId) =>
  prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId: Number(groupId), userId: Number(userId) } },
    select: { userId: true, role: true, status: true },
  });

const createJoinRequest = (groupId, userId) =>
  prisma.groupMembership.create({
    data: { groupId: Number(groupId), userId: Number(userId), role: 'member', status: 'pending' },
  });

const approveRequest = async (groupId, userId) => {
  const result = await prisma.groupMembership.updateMany({
    where: { groupId: Number(groupId), userId: Number(userId), status: 'pending' },
    data: { status: 'active' },
  });
  return result.count;
};

const declineRequest = async (groupId, userId) => {
  const result = await prisma.groupMembership.deleteMany({
    where: { groupId: Number(groupId), userId: Number(userId), status: 'pending' },
  });
  return result.count;
};

const deleteMembership = async (groupId, userId) => {
  const result = await prisma.groupMembership.deleteMany({
    where: { groupId: Number(groupId), userId: Number(userId) },
  });
  return result.count;
};

const countActiveLeaders = (groupId) =>
  prisma.groupMembership.count({ where: { groupId: Number(groupId), role: 'leader', status: 'active' } });

const getLeaderIds = async (groupId) => {
  const leaders = await prisma.groupMembership.findMany({
    where: { groupId: Number(groupId), role: 'leader', status: 'active' },
    select: { userId: true },
  });
  return leaders.map((leader) => leader.userId);
};

const listPendingRequests = async (groupId) => {
  const requests = await prisma.groupMembership.findMany({
    where: { groupId: Number(groupId), status: 'pending' },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true, user: { select: { ...nameSelect, email: true } } },
  });

  return requests.map((request) => ({
    user_id: request.user.id,
    first_name: request.user.firstName,
    last_name: request.user.lastName,
    email: request.user.email,
    requested_at: request.createdAt,
  }));
};

// Build Prisma data from API input. Empty strings and null clear optional fields.
const toGroupData = (input = {}) => {
  const data = {};
  const optionalText = (value) => (value === undefined ? undefined : value ? String(value).trim() || null : null);

  if (input.name !== undefined) data.name = String(input.name).trim();
  ['description', 'meetingDay', 'meetingTime', 'location'].forEach((field) => {
    const value = optionalText(input[field]);
    if (value !== undefined) data[field] = value;
  });
  if (input.capacity !== undefined) {
    data.capacity = input.capacity === null || input.capacity === '' ? null : Number(input.capacity);
  }
  if (input.ministryId !== undefined) {
    data.ministryId = input.ministryId === null || input.ministryId === '' ? null : Number(input.ministryId);
  }
  if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);

  return data;
};

const createGroup = async (input) => {
  const group = await prisma.smallGroup.create({ data: toGroupData(input) });
  return getGroupById(group.id);
};

const updateGroup = async (groupId, input) => {
  const id = Number(groupId);
  const updated = await prisma.smallGroup.updateMany({ where: { id }, data: toGroupData(input) });
  return updated.count === 0 ? undefined : getGroupById(id);
};

const deactivateGroup = async (groupId) => {
  const result = await prisma.smallGroup.updateMany({ where: { id: Number(groupId) }, data: { isActive: false } });
  return result.count;
};

// Exactly the listed users become active leaders; previous leaders not listed become members.
const setLeaders = async (groupId, userIds) => {
  const id = Number(groupId);

  await prisma.$transaction(async (tx) => {
    await tx.groupMembership.updateMany({
      where: { groupId: id, role: 'leader', userId: { notIn: userIds } },
      data: { role: 'member' },
    });

    for (const userId of userIds) {
      await tx.groupMembership.upsert({
        where: { groupId_userId: { groupId: id, userId } },
        create: { groupId: id, userId, role: 'leader', status: 'active' },
        update: { role: 'leader', status: 'active' },
      });
    }
  });

  return getGroupById(id);
};

module.exports = {
  mapGroupSummary,
  toMemberItem,
  listActiveGroups,
  listAllGroups,
  listMyGroups,
  getGroupById,
  getGroupDetail,
  getMembership,
  createJoinRequest,
  approveRequest,
  declineRequest,
  deleteMembership,
  countActiveLeaders,
  getLeaderIds,
  listPendingRequests,
  createGroup,
  updateGroup,
  deactivateGroup,
  setLeaders,
};
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `cd backend && npx jest tests/models/groupModel.test.js --coverage=false`
Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add backend/prisma/schema.prisma backend/migrations/migrateFeatureUpdates.js backend/src/models/groupModel.js backend/tests/models/groupModel.test.js
git commit -m "feat: add small groups and memberships

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Member-facing groups API

**Files:**
- Create: `backend/src/controllers/groupController.js` (member handlers; Task 3 adds the admin handlers)
- Create: `backend/src/routes/groupRoutes.js`
- Modify: `backend/src/server.js`
- Test: `backend/tests/api/groups.test.js`

**Interfaces:**
- Consumes: the `groupModel` functions (Task 1), `parseId` (`utils/helpers`), and `notify` (`services/notificationService`).
- Produces:
  - `GET /api/groups` (optionalAuth) → `GroupSummary[]`
  - `GET /api/groups/mine` (signed in) → `GroupSummary[]`
  - `GET /api/groups/:id` (optionalAuth) → `GroupSummary & { members: MemberItem[] | null }`
  - `POST /api/groups/:id/join` → `201 { data: { status: 'pending' } }`
  - `DELETE /api/groups/:id/membership` → 200
  - `GET /api/groups/:id/requests` (leader or admin) → `PendingRequest[]`
  - `POST /api/groups/:id/requests/:userId/approve` and `/decline` (leader or admin) → 200
  - The controller exports `canManageGroup(user, groupId) → Promise<boolean>` for reuse.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/api/groups.test.js`:

```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const tokenFor = (userId, role = 'member') =>
  jwt.sign({ userId, email: `u${userId}@test.com`, role, firstName: 'Ama', lastName: 'Mensah' }, process.env.JWT_SECRET);
const as = (userId, role) => `Bearer ${tokenFor(userId, role)}`;

const group = (overrides = {}) => ({ id: 5, name: 'Young Adults', is_active: true, capacity: 10, member_count: 3, ...overrides });

const buildModels = () => ({
  groupModel: {
    listActiveGroups: jest.fn().mockResolvedValue([group()]),
    listMyGroups: jest.fn().mockResolvedValue([group({ my_status: 'active' })]),
    getGroupById: jest.fn().mockResolvedValue(group()),
    getGroupDetail: jest.fn().mockResolvedValue({ ...group(), my_status: null, members: [{ user_id: 2 }] }),
    getMembership: jest.fn().mockResolvedValue(null),
    createJoinRequest: jest.fn().mockResolvedValue({ id: 1 }),
    approveRequest: jest.fn().mockResolvedValue(1),
    declineRequest: jest.fn().mockResolvedValue(1),
    deleteMembership: jest.fn().mockResolvedValue(1),
    countActiveLeaders: jest.fn().mockResolvedValue(2),
    getLeaderIds: jest.fn().mockResolvedValue([2, 4]),
    listPendingRequests: jest.fn().mockResolvedValue([{ user_id: 9, email: 'x@test.com' }]),
  },
  notificationService: { notify: jest.fn().mockResolvedValue({ inApp: 1, push: 0 }) },
});

const buildApp = (models) => {
  jest.resetModules();
  jest.doMock('../../src/models/groupModel', () => models.groupModel);
  jest.doMock('../../src/services/notificationService', () => models.notificationService);
  jest.doMock('../../src/models/auditLogModel', () => ({ createAuditLog: jest.fn() }));

  const app = express();
  app.use(express.json());
  app.use('/api/groups', require('../../src/routes/groupRoutes'));
  const { errorHandler } = require('../../src/middleware/errorHandler');
  app.use(errorHandler);
  return app;
};

describe('Groups API (members)', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  describe('listing', () => {
    test('signed-out visitors can list active groups', async () => {
      const response = await request(app).get('/api/groups');

      expect(response.status).toBe(200);
      expect(models.groupModel.listActiveGroups).toHaveBeenCalledWith(null);
    });

    test('signed-in members get their own status', async () => {
      await request(app).get('/api/groups').set('Authorization', as(7));
      expect(models.groupModel.listActiveGroups).toHaveBeenCalledWith(7);
    });

    test('/mine requires sign-in', async () => {
      const response = await request(app).get('/api/groups/mine');
      expect(response.status).toBe(401);
    });

    test('/mine lists my groups and is not treated as an id', async () => {
      const response = await request(app).get('/api/groups/mine').set('Authorization', as(7));

      expect(response.status).toBe(200);
      expect(models.groupModel.listMyGroups).toHaveBeenCalledWith(7);
      expect(models.groupModel.getGroupDetail).not.toHaveBeenCalled();
    });
  });

  describe('group details and member-list privacy', () => {
    test('signed-out visitors do not see the member list', async () => {
      const response = await request(app).get('/api/groups/5');

      expect(response.status).toBe(200);
      expect(response.body.data.members).toBeNull();
    });

    test('a pending requester does not see the member list', async () => {
      models.groupModel.getGroupDetail.mockResolvedValue({ ...group(), my_status: 'pending', members: [{ user_id: 2 }] });

      const response = await request(app).get('/api/groups/5').set('Authorization', as(7));

      expect(response.body.data.members).toBeNull();
    });

    test('an active member sees the member list', async () => {
      models.groupModel.getGroupDetail.mockResolvedValue({ ...group(), my_status: 'active', members: [{ user_id: 2 }] });

      const response = await request(app).get('/api/groups/5').set('Authorization', as(7));

      expect(response.body.data.members).toEqual([{ user_id: 2 }]);
    });

    test('an admin sees the member list', async () => {
      const response = await request(app).get('/api/groups/5').set('Authorization', as(1, 'admin'));
      expect(response.body.data.members).toEqual([{ user_id: 2 }]);
    });

    test('an inactive group is hidden from members but visible to admins', async () => {
      models.groupModel.getGroupDetail.mockResolvedValue({ ...group({ is_active: false }), members: [] });

      const member = await request(app).get('/api/groups/5').set('Authorization', as(7));
      const admin = await request(app).get('/api/groups/5').set('Authorization', as(1, 'admin'));

      expect(member.status).toBe(404);
      expect(admin.status).toBe(200);
    });

    test('a malformed id returns 404 without querying', async () => {
      const response = await request(app).get('/api/groups/abc');

      expect(response.status).toBe(404);
      expect(models.groupModel.getGroupDetail).not.toHaveBeenCalled();
    });
  });

  describe('POST /:id/join', () => {
    const join = (userId = 7) => request(app).post('/api/groups/5/join').set('Authorization', as(userId));

    test('requires sign-in', async () => {
      const response = await request(app).post('/api/groups/5/join');
      expect(response.status).toBe(401);
    });

    test('creates a pending request and notifies the leaders', async () => {
      const response = await join();

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual({ status: 'pending' });
      expect(models.groupModel.createJoinRequest).toHaveBeenCalledWith(5, 7);
      expect(models.notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userIds: [2, 4], type: 'group', entityType: 'group', entityId: 5 })
      );
    });

    test('an existing pending request returns 409', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 7, role: 'member', status: 'pending' });

      const response = await join();

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Your request to join is already pending');
      expect(models.groupModel.createJoinRequest).not.toHaveBeenCalled();
    });

    test('an existing member returns 409', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 7, role: 'member', status: 'active' });

      const response = await join();

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('You are already a member of this group');
    });

    test('a concurrent duplicate (unique violation) returns 409, not 500', async () => {
      models.groupModel.createJoinRequest.mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }));

      const response = await join();

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Your request to join is already pending');
    });

    test('a full group returns 409', async () => {
      models.groupModel.getGroupById.mockResolvedValue(group({ capacity: 3, member_count: 3 }));

      const response = await join();

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('This group is full');
    });

    test('a group with no capacity limit is never full', async () => {
      models.groupModel.getGroupById.mockResolvedValue(group({ capacity: null, member_count: 500 }));
      const response = await join();
      expect(response.status).toBe(201);
    });

    test('an inactive group returns 409', async () => {
      models.groupModel.getGroupById.mockResolvedValue(group({ is_active: false }));

      const response = await join();

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('This group is not accepting members');
    });

    test('a missing group returns 404', async () => {
      models.groupModel.getGroupById.mockResolvedValue(undefined);
      const response = await join();
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /:id/membership (leave)', () => {
    const leave = () => request(app).delete('/api/groups/5/membership').set('Authorization', as(7));

    test('a member can leave', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 7, role: 'member', status: 'active' });

      const response = await leave();

      expect(response.status).toBe(200);
      expect(models.groupModel.deleteMembership).toHaveBeenCalledWith(5, 7);
    });

    test('the last active leader cannot leave', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 7, role: 'leader', status: 'active' });
      models.groupModel.countActiveLeaders.mockResolvedValue(1);

      const response = await leave();

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Make someone else leader before leaving');
      expect(models.groupModel.deleteMembership).not.toHaveBeenCalled();
    });

    test('a leader with a co-leader can leave', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 7, role: 'leader', status: 'active' });
      models.groupModel.countActiveLeaders.mockResolvedValue(2);

      const response = await leave();

      expect(response.status).toBe(200);
    });

    test('someone not in the group gets 404', async () => {
      const response = await leave();
      expect(response.status).toBe(404);
    });
  });

  describe('join requests (leaders and admins)', () => {
    test('a non-leader cannot see requests', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 7, role: 'member', status: 'active' });

      const response = await request(app).get('/api/groups/5/requests').set('Authorization', as(7));

      expect(response.status).toBe(403);
      expect(models.groupModel.listPendingRequests).not.toHaveBeenCalled();
    });

    test('a pending leader cannot see requests', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 7, role: 'leader', status: 'pending' });

      const response = await request(app).get('/api/groups/5/requests').set('Authorization', as(7));

      expect(response.status).toBe(403);
    });

    test('an active leader sees requests', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 2, role: 'leader', status: 'active' });

      const response = await request(app).get('/api/groups/5/requests').set('Authorization', as(2));

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([{ user_id: 9, email: 'x@test.com' }]);
    });

    test('an admin sees requests', async () => {
      const response = await request(app).get('/api/groups/5/requests').set('Authorization', as(1, 'admin'));
      expect(response.status).toBe(200);
    });

    test('a leader approves a request and the member is notified', async () => {
      models.groupModel.getMembership.mockResolvedValue({ userId: 2, role: 'leader', status: 'active' });

      const response = await request(app).post('/api/groups/5/requests/9/approve').set('Authorization', as(2));

      expect(response.status).toBe(200);
      expect(models.groupModel.approveRequest).toHaveBeenCalledWith(5, 9);
      expect(models.notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userIds: [9], type: 'group', entityId: 5 })
      );
    });

    test('approving into a full group returns 409', async () => {
      models.groupModel.getGroupById.mockResolvedValue(group({ capacity: 3, member_count: 3 }));

      const response = await request(app).post('/api/groups/5/requests/9/approve').set('Authorization', as(1, 'admin'));

      expect(response.status).toBe(409);
      expect(models.groupModel.approveRequest).not.toHaveBeenCalled();
    });

    test('approving when there is no pending request returns 404', async () => {
      models.groupModel.approveRequest.mockResolvedValue(0);

      const response = await request(app).post('/api/groups/5/requests/9/approve').set('Authorization', as(1, 'admin'));

      expect(response.status).toBe(404);
      expect(models.notificationService.notify).not.toHaveBeenCalled();
    });

    test('a non-leader cannot approve', async () => {
      const response = await request(app).post('/api/groups/5/requests/9/approve').set('Authorization', as(7));

      expect(response.status).toBe(403);
      expect(models.groupModel.approveRequest).not.toHaveBeenCalled();
    });

    test('a malformed user id returns 404 without querying', async () => {
      const response = await request(app).post('/api/groups/5/requests/abc/approve').set('Authorization', as(1, 'admin'));

      expect(response.status).toBe(404);
      expect(models.groupModel.approveRequest).not.toHaveBeenCalled();
    });

    test('a leader declines a request', async () => {
      const response = await request(app).post('/api/groups/5/requests/9/decline').set('Authorization', as(1, 'admin'));

      expect(response.status).toBe(200);
      expect(models.groupModel.declineRequest).toHaveBeenCalledWith(5, 9);
    });

    test('declining when there is no pending request returns 404', async () => {
      models.groupModel.declineRequest.mockResolvedValue(0);

      const response = await request(app).post('/api/groups/5/requests/9/decline').set('Authorization', as(1, 'admin'));

      expect(response.status).toBe(404);
    });
  });
});

describe('Group routes are mounted in the server', () => {
  test('GET /api/groups is served by the real app', async () => {
    const models = buildModels();
    jest.resetModules();
    jest.doMock('../../src/models/groupModel', () => models.groupModel);
    const server = require('../../src/server');

    const response = await request(server).get('/api/groups');

    expect(response.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/api/groups.test.js --coverage=false`
Expected: FAIL with `Cannot find module '../../src/routes/groupRoutes'`.

- [ ] **Step 3: Create the controller (member handlers)**

Create `backend/src/controllers/groupController.js`:

```js
const { apiResponse, parseId } = require('../utils/helpers');
const groupModel = require('../models/groupModel');
const { notify } = require('../services/notificationService');

/**
 * Small Group Controller
 */

const GROUP_NOT_FOUND = 'Group not found';

const fail = (res, status, message) => res.status(status).json(apiResponse(false, null, message));

const isFull = (group) => group.capacity !== null && group.capacity !== undefined && group.member_count >= group.capacity;

// Admins, and active leaders of this group, may manage its join requests.
const canManageGroup = async (user, groupId) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const membership = await groupModel.getMembership(groupId, user.userId);
  return Boolean(membership && membership.role === 'leader' && membership.status === 'active');
};

const displayName = (user) => `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'A member';

// List active groups (public; signed-in viewers also get their own status)
const listGroups = async (req, res, next) => {
  try {
    const groups = await groupModel.listActiveGroups(req.user ? req.user.userId : null);
    res.json(apiResponse(true, groups, 'Groups retrieved'));
  } catch (error) {
    next(error);
  }
};

// Groups I belong to or asked to join
const listMyGroups = async (req, res, next) => {
  try {
    const groups = await groupModel.listMyGroups(req.user.userId);
    res.json(apiResponse(true, groups, 'Your groups retrieved'));
  } catch (error) {
    next(error);
  }
};

// Group details; the member list only for active members and admins
const getGroup = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const detail = id ? await groupModel.getGroupDetail(id, req.user ? req.user.userId : null) : undefined;
    const isAdmin = req.user?.role === 'admin';

    if (!detail || (!detail.is_active && !isAdmin)) {
      return fail(res, 404, GROUP_NOT_FOUND);
    }

    const canSeeMembers = isAdmin || detail.my_status === 'active';
    res.json(apiResponse(true, { ...detail, members: canSeeMembers ? detail.members : null }, 'Group retrieved'));
  } catch (error) {
    next(error);
  }
};

// Ask to join a group
const joinGroup = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const group = id ? await groupModel.getGroupById(id) : undefined;

    if (!group) {
      return fail(res, 404, GROUP_NOT_FOUND);
    }
    if (!group.is_active) {
      return fail(res, 409, 'This group is not accepting members');
    }

    const existing = await groupModel.getMembership(id, req.user.userId);
    if (existing) {
      return fail(
        res,
        409,
        existing.status === 'active' ? 'You are already a member of this group' : 'Your request to join is already pending'
      );
    }

    if (isFull(group)) {
      return fail(res, 409, 'This group is full');
    }

    try {
      await groupModel.createJoinRequest(id, req.user.userId);
    } catch (error) {
      if (error?.code === 'P2002') {
        return fail(res, 409, 'Your request to join is already pending');
      }
      throw error;
    }

    const leaderIds = await groupModel.getLeaderIds(id);
    await notify({
      userIds: leaderIds,
      title: 'New request to join',
      message: `${displayName(req.user)} asked to join ${group.name}.`,
      type: 'group',
      entityType: 'group',
      entityId: id,
    });

    res.status(201).json(apiResponse(true, { status: 'pending' }, 'Request sent'));
  } catch (error) {
    next(error);
  }
};

// Leave a group, or cancel a pending request
const leaveGroup = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const membership = id ? await groupModel.getMembership(id, req.user.userId) : null;

    if (!membership) {
      return fail(res, 404, 'You are not in this group');
    }

    if (membership.role === 'leader' && membership.status === 'active') {
      const leaders = await groupModel.countActiveLeaders(id);
      if (leaders <= 1) {
        return fail(res, 409, 'Make someone else leader before leaving');
      }
    }

    await groupModel.deleteMembership(id, req.user.userId);
    res.json(apiResponse(true, null, membership.status === 'active' ? 'You left the group' : 'Request cancelled'));
  } catch (error) {
    next(error);
  }
};

// Shared guard for request management: valid ids, group exists, caller is leader or admin.
const loadManagedGroup = async (req, res) => {
  const id = parseId(req.params.id);
  const group = id ? await groupModel.getGroupById(id) : undefined;

  if (!group) {
    fail(res, 404, GROUP_NOT_FOUND);
    return null;
  }
  if (!(await canManageGroup(req.user, id))) {
    fail(res, 403, 'Only this group\'s leaders can manage requests');
    return null;
  }
  return group;
};

const listRequests = async (req, res, next) => {
  try {
    const group = await loadManagedGroup(req, res);
    if (!group) return undefined;

    const requests = await groupModel.listPendingRequests(group.id);
    res.json(apiResponse(true, requests, 'Join requests retrieved'));
  } catch (error) {
    next(error);
  }
};

const approveJoinRequest = async (req, res, next) => {
  try {
    const userId = parseId(req.params.userId);
    if (!userId) return fail(res, 404, 'No pending request from this member');

    const group = await loadManagedGroup(req, res);
    if (!group) return undefined;

    if (isFull(group)) {
      return fail(res, 409, 'This group is full');
    }

    const approved = await groupModel.approveRequest(group.id, userId);
    if (!approved) {
      return fail(res, 404, 'No pending request from this member');
    }

    await notify({
      userIds: [userId],
      title: 'Welcome to the group',
      message: `Your request to join ${group.name} was approved.`,
      type: 'group',
      entityType: 'group',
      entityId: group.id,
    });

    res.json(apiResponse(true, null, 'Request approved'));
  } catch (error) {
    next(error);
  }
};

const declineJoinRequest = async (req, res, next) => {
  try {
    const userId = parseId(req.params.userId);
    if (!userId) return fail(res, 404, 'No pending request from this member');

    const group = await loadManagedGroup(req, res);
    if (!group) return undefined;

    const declined = await groupModel.declineRequest(group.id, userId);
    if (!declined) {
      return fail(res, 404, 'No pending request from this member');
    }

    res.json(apiResponse(true, null, 'Request declined'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  canManageGroup,
  listGroups,
  listMyGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  listRequests,
  approveJoinRequest,
  declineJoinRequest,
};
```

- [ ] **Step 4: Create the routes and mount them**

Create `backend/src/routes/groupRoutes.js`:

```js
const express = require('express');
const groupController = require('../controllers/groupController');
const { optionalAuth, isAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', optionalAuth, groupController.listGroups);
// Registered before '/:id' so 'mine' is not treated as an id.
router.get('/mine', isAuthenticated, groupController.listMyGroups);
router.get('/:id', optionalAuth, groupController.getGroup);
router.post('/:id/join', isAuthenticated, groupController.joinGroup);
router.delete('/:id/membership', isAuthenticated, groupController.leaveGroup);
router.get('/:id/requests', isAuthenticated, groupController.listRequests);
router.post('/:id/requests/:userId/approve', isAuthenticated, groupController.approveJoinRequest);
router.post('/:id/requests/:userId/decline', isAuthenticated, groupController.declineJoinRequest);

module.exports = router;
```

In `backend/src/server.js`:
- Add `const groupRoutes = require('./routes/groupRoutes');` after the `communityFeedRoutes` import.
- Add `app.use('/api/groups', groupRoutes);` after `app.use('/api/community', communityFeedRoutes);`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd backend && npx jest tests/api/groups.test.js --coverage=false`
Expected: PASS: 35 tests (4 listing, 6 details, 9 join, 4 leave, 11 requests, and 1 mounting).

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/groupController.js backend/src/routes/groupRoutes.js backend/src/server.js backend/tests/api/groups.test.js
git commit -m "feat: let members browse, join and leave small groups; leaders decide requests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Admin groups API

**Files:**
- Modify: `backend/src/controllers/groupController.js` (add the admin handlers)
- Create: `backend/src/routes/adminGroupRoutes.js`
- Modify: `backend/src/middleware/validators.js` (`validateGroup`, `validateGroupLeaders`)
- Modify: `backend/src/server.js`
- Test: `backend/tests/api/adminGroups.test.js`

**Interfaces:**
- Consumes: `groupModel.listAllGroups`, `createGroup`, `updateGroup`, `deactivateGroup`, `setLeaders` and `getGroupById` (Task 1); `userModel.findUserById`; `auditLogModel.createAuditLog`; and `MAX_DB_ID` from `utils/helpers`.
- Produces (all admin-only):
  - `GET /api/admin/groups` → `GroupSummary[]` (includes inactive groups)
  - `POST /api/admin/groups` → 201
  - `PUT /api/admin/groups/:id` → 200
  - `DELETE /api/admin/groups/:id` → 200 (deactivates)
  - `PUT /api/admin/groups/:id/leaders` with `{ userIds: number[] }` → `200 { data: GroupSummary }`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/api/adminGroups.test.js`:

```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const as = (userId, role) => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET)}`;
const admin = () => as(1, 'admin');

const validGroup = {
  name: 'Young Adults',
  description: 'Thursday fellowship',
  meetingDay: 'Thursday',
  meetingTime: '18:30',
  location: 'Room 2',
  capacity: 12,
  ministryId: 1,
};

const buildModels = () => ({
  groupModel: {
    listAllGroups: jest.fn().mockResolvedValue([]),
    createGroup: jest.fn().mockResolvedValue({ id: 5, name: 'Young Adults' }),
    updateGroup: jest.fn().mockResolvedValue({ id: 5, name: 'Young Adults' }),
    deactivateGroup: jest.fn().mockResolvedValue(1),
    getGroupById: jest.fn().mockResolvedValue({ id: 5, name: 'Young Adults' }),
    setLeaders: jest.fn().mockResolvedValue({ id: 5, leaders: [{ user_id: 2 }] }),
  },
  userModel: { findUserById: jest.fn().mockResolvedValue({ id: 2 }) },
  auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
});

const buildApp = (models) => {
  jest.resetModules();
  jest.doMock('../../src/models/groupModel', () => models.groupModel);
  jest.doMock('../../src/models/userModel', () => models.userModel);
  jest.doMock('../../src/models/auditLogModel', () => models.auditLogModel);
  jest.doMock('../../src/services/notificationService', () => ({ notify: jest.fn() }));

  const app = express();
  app.use(express.json());
  app.use('/api/admin/groups', require('../../src/routes/adminGroupRoutes'));
  const { errorHandler } = require('../../src/middleware/errorHandler');
  app.use(errorHandler);
  return app;
};

describe('Admin groups API', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('members cannot manage groups', async () => {
    const response = await request(app).post('/api/admin/groups').set('Authorization', as(7, 'member')).send(validGroup);

    expect(response.status).toBe(403);
    expect(models.groupModel.createGroup).not.toHaveBeenCalled();
  });

  test('lists every group including inactive ones', async () => {
    const response = await request(app).get('/api/admin/groups').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(models.groupModel.listAllGroups).toHaveBeenCalled();
  });

  test('creates a group and audits it', async () => {
    const response = await request(app).post('/api/admin/groups').set('Authorization', admin()).send(validGroup);

    expect(response.status).toBe(201);
    expect(models.groupModel.createGroup).toHaveBeenCalledWith(expect.objectContaining({ name: 'Young Adults', capacity: 12 }));
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'small_group', action: 'create', entityId: 5, actorUserId: 1 })
    );
  });

  test('a duplicate name returns 409', async () => {
    models.groupModel.createGroup.mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }));

    const response = await request(app).post('/api/admin/groups').set('Authorization', admin()).send(validGroup);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('A group with this name already exists');
  });

  test('an unknown ministry returns 400', async () => {
    models.groupModel.createGroup.mockRejectedValue(Object.assign(new Error('FK'), { code: 'P2003' }));

    const response = await request(app).post('/api/admin/groups').set('Authorization', admin()).send(validGroup);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Ministry not found');
  });

  test.each([
    ['a blank name', { name: '   ' }],
    ['an unknown meeting day', { meetingDay: 'Funday' }],
    ['a meeting time that is not HH:MM', { meetingTime: '6pm' }],
    ['a zero capacity', { capacity: 0 }],
    ['a capacity over 1000', { capacity: 1001 }],
    ['a ministry id beyond the database range', { ministryId: 99999999999 }],
  ])('rejects %s with 400', async (_label, overrides) => {
    const response = await request(app)
      .post('/api/admin/groups')
      .set('Authorization', admin())
      .send({ ...validGroup, ...overrides });

    expect(response.status).toBe(400);
    expect(models.groupModel.createGroup).not.toHaveBeenCalled();
  });

  test('optional fields can be cleared with null', async () => {
    const response = await request(app)
      .post('/api/admin/groups')
      .set('Authorization', admin())
      .send({ name: 'Open Group', capacity: null, ministryId: null, meetingDay: null, meetingTime: null });

    expect(response.status).toBe(201);
  });

  test('updates a group and audits it', async () => {
    const response = await request(app)
      .put('/api/admin/groups/5')
      .set('Authorization', admin())
      .send({ ...validGroup, isActive: true });

    expect(response.status).toBe(200);
    expect(models.groupModel.updateGroup).toHaveBeenCalledWith(5, expect.objectContaining({ isActive: true }));
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));
  });

  test('updating a missing group returns 404', async () => {
    models.groupModel.updateGroup.mockResolvedValue(undefined);
    const response = await request(app).put('/api/admin/groups/99').set('Authorization', admin()).send(validGroup);
    expect(response.status).toBe(404);
  });

  test('renaming to a duplicate name returns 409', async () => {
    models.groupModel.updateGroup.mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }));
    const response = await request(app).put('/api/admin/groups/5').set('Authorization', admin()).send(validGroup);
    expect(response.status).toBe(409);
  });

  test('deactivating a group is audited', async () => {
    const response = await request(app).delete('/api/admin/groups/5').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(models.groupModel.deactivateGroup).toHaveBeenCalledWith(5);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'deactivate' }));
  });

  test('deactivating a missing group returns 404', async () => {
    models.groupModel.deactivateGroup.mockResolvedValue(0);
    const response = await request(app).delete('/api/admin/groups/99').set('Authorization', admin());
    expect(response.status).toBe(404);
  });

  test('malformed ids return 404 without querying', async () => {
    const put = await request(app).put('/api/admin/groups/abc').set('Authorization', admin()).send(validGroup);
    const del = await request(app).delete('/api/admin/groups/1.5').set('Authorization', admin());

    expect(put.status).toBe(404);
    expect(del.status).toBe(404);
    expect(models.groupModel.updateGroup).not.toHaveBeenCalled();
    expect(models.groupModel.deactivateGroup).not.toHaveBeenCalled();
  });

  describe('PUT /:id/leaders', () => {
    const setLeaders = (body, id = 5) =>
      request(app).put(`/api/admin/groups/${id}/leaders`).set('Authorization', admin()).send(body);

    test('sets the leaders and audits it', async () => {
      const response = await setLeaders({ userIds: [2, 4] });

      expect(response.status).toBe(200);
      expect(models.groupModel.setLeaders).toHaveBeenCalledWith(5, [2, 4]);
      expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'set_leaders' }));
    });

    test('an empty list removes all leaders', async () => {
      const response = await setLeaders({ userIds: [] });

      expect(response.status).toBe(200);
      expect(models.groupModel.setLeaders).toHaveBeenCalledWith(5, []);
    });

    test('an unknown member returns 404 and changes nothing', async () => {
      models.userModel.findUserById.mockImplementation(async (id) => (id === 4 ? undefined : { id }));

      const response = await setLeaders({ userIds: [2, 4] });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Member not found');
      expect(models.groupModel.setLeaders).not.toHaveBeenCalled();
    });

    test('a missing group returns 404', async () => {
      models.groupModel.getGroupById.mockResolvedValue(undefined);
      const response = await setLeaders({ userIds: [2] });
      expect(response.status).toBe(404);
    });

    test.each([
      ['not an array', { userIds: 2 }],
      ['duplicates', { userIds: [2, 2] }],
      ['more than ten', { userIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }],
      ['a non-integer id', { userIds: ['abc'] }],
    ])('rejects %s with 400', async (_label, body) => {
      const response = await setLeaders(body);

      expect(response.status).toBe(400);
      expect(models.groupModel.setLeaders).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest tests/api/adminGroups.test.js --coverage=false`
Expected: FAIL with `Cannot find module '../../src/routes/adminGroupRoutes'`.

- [ ] **Step 3: Add the validators**

In `backend/src/middleware/validators.js`, add this after `validateCheckIn`:

```js
const MEETING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Small group create/update. Optional fields accept null (clears them).
const validateGroup = [
  body('name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ max: 255 })
    .withMessage('Group name must be 255 characters or fewer'),
  body('description')
    .optional({ values: 'null' })
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Description must be 2000 characters or fewer'),
  body('meetingDay')
    .optional({ values: 'falsy' })
    .isIn(MEETING_DAYS)
    .withMessage(`Meeting day must be one of ${MEETING_DAYS.join(', ')}`),
  body('meetingTime')
    .optional({ values: 'falsy' })
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('Meeting time must be HH:MM (24-hour)'),
  body('location')
    .optional({ values: 'null' })
    .isString()
    .isLength({ max: 255 })
    .withMessage('Location must be 255 characters or fewer'),
  body('capacity')
    .optional({ values: 'null' })
    .isInt({ min: 1, max: 1000 })
    .withMessage('Capacity must be between 1 and 1000'),
  body('ministryId')
    .optional({ values: 'null' })
    .isInt({ min: 1, max: MAX_DB_ID })
    .withMessage('ministryId must be a positive integer or null'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be true or false'),
];

// Admin "set leaders": 0-10 distinct member ids.
const validateGroupLeaders = [
  body('userIds')
    .isArray({ max: 10 })
    .withMessage('userIds must be a list of at most 10 members')
    .bail()
    .custom((ids) => new Set(ids).size === ids.length)
    .withMessage('userIds must not contain duplicates'),
  body('userIds.*').isInt({ min: 1, max: MAX_DB_ID }).withMessage('Each userId must be a positive integer'),
];
```

Add `validateGroup,` and `validateGroupLeaders,` to `module.exports`.

- [ ] **Step 4: Add the admin handlers**

In `backend/src/controllers/groupController.js`:

a. Add these imports after the `notificationService` import:

```js
const userModel = require('../models/userModel');
const auditLogModel = require('../models/auditLogModel');
```

b. Add this before `module.exports`:

```js
// ---- Admin ----

const audit = (req, action, entityId, summary, metadata = {}) =>
  auditLogModel.createAuditLog({
    actorUserId: req.user.userId,
    entityType: 'small_group',
    entityId,
    action,
    summary,
    metadata,
  });

const pickGroupInput = (body) => ({
  name: body.name,
  description: body.description,
  meetingDay: body.meetingDay,
  meetingTime: body.meetingTime,
  location: body.location,
  capacity: body.capacity,
  ministryId: body.ministryId,
  isActive: body.isActive,
});

// Prisma errors from create/update: duplicate name, unknown ministry.
const groupWriteError = (res, error) => {
  if (error?.code === 'P2002') return fail(res, 409, 'A group with this name already exists');
  if (error?.code === 'P2003') return fail(res, 400, 'Ministry not found');
  return null;
};

const adminListGroups = async (req, res, next) => {
  try {
    const groups = await groupModel.listAllGroups();
    res.json(apiResponse(true, groups, 'Groups retrieved'));
  } catch (error) {
    next(error);
  }
};

const adminCreateGroup = async (req, res, next) => {
  try {
    const group = await groupModel.createGroup(pickGroupInput(req.body));
    await audit(req, 'create', group.id, `Created small group "${group.name}"`);
    res.status(201).json(apiResponse(true, group, 'Group created'));
  } catch (error) {
    if (!groupWriteError(res, error)) next(error);
  }
};

const adminUpdateGroup = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const group = id ? await groupModel.updateGroup(id, pickGroupInput(req.body)) : undefined;

    if (!group) {
      return fail(res, 404, GROUP_NOT_FOUND);
    }

    await audit(req, 'update', id, `Updated small group "${group.name}"`);
    res.json(apiResponse(true, group, 'Group updated'));
  } catch (error) {
    if (!groupWriteError(res, error)) next(error);
  }
};

const adminDeactivateGroup = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const changed = id ? await groupModel.deactivateGroup(id) : 0;

    if (!changed) {
      return fail(res, 404, GROUP_NOT_FOUND);
    }

    await audit(req, 'deactivate', id, `Deactivated small group #${id}`);
    res.json(apiResponse(true, null, 'Group deactivated'));
  } catch (error) {
    next(error);
  }
};

const adminSetLeaders = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const group = id ? await groupModel.getGroupById(id) : undefined;

    if (!group) {
      return fail(res, 404, GROUP_NOT_FOUND);
    }

    const userIds = req.body.userIds.map(Number);
    const users = await Promise.all(userIds.map((userId) => userModel.findUserById(userId)));
    if (users.some((user) => !user)) {
      return fail(res, 404, 'Member not found');
    }

    const updated = await groupModel.setLeaders(id, userIds);
    await audit(req, 'set_leaders', id, `Set leaders of small group "${group.name}"`, { userIds });
    res.json(apiResponse(true, updated, 'Leaders updated'));
  } catch (error) {
    next(error);
  }
};
```

c. Add these to `module.exports`:

```js
  adminListGroups,
  adminCreateGroup,
  adminUpdateGroup,
  adminDeactivateGroup,
  adminSetLeaders,
```

- [ ] **Step 5: Create the admin routes and mount them**

Create `backend/src/routes/adminGroupRoutes.js`:

```js
const express = require('express');
const groupController = require('../controllers/groupController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { handleValidationErrors, validateGroup, validateGroupLeaders } = require('../middleware/validators');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', groupController.adminListGroups);
router.post('/', validateGroup, handleValidationErrors, groupController.adminCreateGroup);
router.put('/:id', validateGroup, handleValidationErrors, groupController.adminUpdateGroup);
router.delete('/:id', groupController.adminDeactivateGroup);
router.put('/:id/leaders', validateGroupLeaders, handleValidationErrors, groupController.adminSetLeaders);

module.exports = router;
```

In `backend/src/server.js`:
- Add `const adminGroupRoutes = require('./routes/adminGroupRoutes');` after the `adminAttendanceRoutes` import.
- Add `app.use('/api/admin/groups', adminGroupRoutes);` after `app.use('/api/admin/attendance', adminAttendanceRoutes);`.

- [ ] **Step 6: Run the full suite and lint**

Run: `cd backend && npx jest --runInBand --coverage=false && npx eslint src/ tests/`
Expected: all suites pass, with no lint output. The total is 158 existing, plus 4 (Task 1), 35 (Task 2), and 26 admin tests (Task 3: 18 group, 8 leaders): **223**.

- [ ] **Step 7: Commit**

```bash
git add backend/src/controllers/groupController.js backend/src/routes/adminGroupRoutes.js backend/src/middleware/validators.js backend/src/server.js backend/tests/api/adminGroups.test.js
git commit -m "feat: add admin small group management and leader assignment

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Web — group list and group details (members and leaders)

**Files:**
- Modify: `frontend/src/hooks/useApi.ts` (add these after `useMinistries`)
- Create: `frontend/src/app/groups/page.tsx`
- Create: `frontend/src/app/groups/[id]/page.tsx`
- Modify: `frontend/src/components/layout/Footer.tsx`

**Interfaces:**
- Consumes: the member endpoints (Task 2).
- Produces:
  - Types: `GroupSummary`, `GroupDetail`, `GroupJoinRequest`
  - `useGroups()`
  - `useGroup(id?)`
  - `useJoinGroup()`, a mutation taking a group id (number)
  - `useLeaveGroup()`, a mutation taking a group id (number)
  - `useGroupRequests(groupId?, enabled)`
  - `useDecideGroupRequest(groupId)`, a mutation taking `{ userId, decision: 'approve' | 'decline' }`

The frontend has no test runner. Verification is type-check, lint, and build.

- [ ] **Step 1: Add the hooks**

In `frontend/src/hooks/useApi.ts`, add this directly after `useMinistries`:

```ts
export type GroupSummary = {
  id: number;
  name: string;
  description: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  location: string | null;
  capacity: number | null;
  ministry_id: number | null;
  ministry_name: string | null;
  is_active: boolean;
  member_count: number;
  leaders: Array<{ user_id: number; first_name: string; last_name: string }>;
  my_status: 'pending' | 'active' | null;
  my_role: 'leader' | 'member' | null;
};

export type GroupDetail = GroupSummary & {
  members: Array<{ user_id: number; first_name: string; last_name: string; role: 'leader' | 'member' }> | null;
};

export type GroupJoinRequest = { user_id: number; first_name: string; last_name: string; email: string; requested_at: string };

const invalidateGroups = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['groups'] });
  qc.invalidateQueries({ queryKey: ['admin', 'groups'] });
};

export const useGroups = () =>
  useQuery({
    queryKey: ['groups', 'list'],
    queryFn: async (): Promise<GroupSummary[]> => {
      const response = await apiClient.get('/groups');
      return response.data?.data ?? [];
    },
  });

export const useGroup = (id?: number) =>
  useQuery({
    queryKey: ['groups', 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<GroupDetail> => {
      const response = await apiClient.get(`/groups/${id}`);
      return response.data?.data;
    },
  });

export const useJoinGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: number) => {
      await apiClient.post(`/groups/${groupId}/join`);
    },
    onSuccess: () => toast.success('Request sent to the group leaders'),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not send your request')),
    onSettled: () => invalidateGroups(qc),
  });
};

export const useLeaveGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: number) => {
      const response = await apiClient.delete(`/groups/${groupId}/membership`);
      return response.data?.message as string | undefined;
    },
    onSuccess: (message) => toast.success(message || 'Done'),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not leave the group')),
    onSettled: () => invalidateGroups(qc),
  });
};

export const useGroupRequests = (groupId?: number, enabled = true) =>
  useQuery({
    queryKey: ['groups', 'requests', groupId],
    enabled: Boolean(groupId) && enabled,
    queryFn: async (): Promise<GroupJoinRequest[]> => {
      const response = await apiClient.get(`/groups/${groupId}/requests`);
      return response.data?.data ?? [];
    },
  });

export const useDecideGroupRequest = (groupId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, decision }: { userId: number; decision: 'approve' | 'decline' }) => {
      await apiClient.post(`/groups/${groupId}/requests/${userId}/${decision}`);
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not update the request')),
    onSettled: () => invalidateGroups(qc),
  });
};
```

- [ ] **Step 2: Create the shared group helpers and the group list page**

A Next.js App Router `page.tsx` may export only its page component and route config, so helpers shared by both group pages live in a lib file. Create `frontend/src/lib/groups.ts`:

```ts
import type { GroupSummary } from '@/hooks/useApi';

export const meetingLine = (group: Pick<GroupSummary, 'meeting_day' | 'meeting_time' | 'location'>) =>
  [group.meeting_day, group.meeting_time, group.location].filter(Boolean).join(' · ');

export const isGroupFull = (group: GroupSummary) => group.capacity !== null && group.member_count >= group.capacity;
```

Create `frontend/src/app/groups/page.tsx`:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGroups, useJoinGroup, type GroupSummary } from '@/hooks/useApi';
import { isGroupFull, meetingLine } from '@/lib/groups';
import { useAuthStore } from '@/lib/store';

function GroupCard({ group, signedIn }: { group: GroupSummary; signedIn: boolean }) {
  const join = useJoinGroup();
  const leaders = group.leaders.map((leader) => `${leader.first_name} ${leader.last_name}`.trim()).join(', ');

  const action = () => {
    if (!signedIn) {
      return (
        <Button asChild variant="outline" size="sm">
          <Link href={`/login?next=${encodeURIComponent('/groups')}`}>Sign in to join</Link>
        </Button>
      );
    }
    if (group.my_status === 'active') {
      return (
        <Button asChild size="sm" variant="outline">
          <Link href={`/groups/${group.id}`}>Open group</Link>
        </Button>
      );
    }
    if (group.my_status === 'pending') {
      return <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Request pending</span>;
    }
    if (isGroupFull(group)) {
      return <span className="text-sm text-ui-subtle">Group is full</span>;
    }
    return (
      <Button size="sm" disabled={join.isPending} onClick={() => join.mutate(group.id)}>
        Ask to join
      </Button>
    );
  };

  return (
    <Card className="rounded-[1.5rem] border-slate-200 shadow-sm dark:border-slate-800">
      <CardContent className="space-y-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/groups/${group.id}`} className="min-w-0">
            <h2 className="truncate text-lg font-bold tracking-tight hover:text-sky-700 dark:hover:text-cyan-300">{group.name}</h2>
            {group.ministry_name && <p className="text-xs text-ui-subtle">{group.ministry_name}</p>}
          </Link>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold dark:bg-slate-800">
            <Users className="h-3.5 w-3.5" />
            {group.member_count}
            {group.capacity !== null ? ` / ${group.capacity}` : ''}
          </span>
        </div>
        {group.description && <p className="line-clamp-3 text-sm text-slate-700 dark:text-slate-300">{group.description}</p>}
        {meetingLine(group) && <p className="text-sm text-ui-subtle">{meetingLine(group)}</p>}
        {leaders && <p className="text-xs text-ui-subtle">Led by {leaders}</p>}
        <div className="pt-1">{action()}</div>
      </CardContent>
    </Card>
  );
}

export default function GroupsPage() {
  const { data, isLoading, error } = useGroups();
  const { isAuthenticated } = useAuthStore();
  const groups = data ?? [];

  return (
    <div className="container-max space-y-6 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Small Groups</h1>
        <p className="mt-2 text-sm text-ui-subtle">Find a group to grow, pray and do life with during the week.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-ui-subtle">Loading groups...</p>
      ) : error ? (
        <p className="text-sm text-red-700 dark:text-red-300">Could not load groups.</p>
      ) : groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-ui-subtle">No groups are open yet.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} signedIn={Boolean(isAuthenticated)} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create the group details page**

Create `frontend/src/app/groups/[id]/page.tsx`:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useDecideGroupRequest, useGroup, useGroupRequests, useJoinGroup, useLeaveGroup } from '@/hooks/useApi';
import { isGroupFull, meetingLine } from '@/lib/groups';
import { useAuthStore } from '@/lib/store';
import { formatDateTime } from '@/lib/utils';

const personName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Member';

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const groupId = Number.isInteger(id) && id > 0 ? id : undefined;
  const { user, isAuthenticated } = useAuthStore();

  const { data: group, isLoading, error } = useGroup(groupId);
  const join = useJoinGroup();
  const leave = useLeaveGroup();
  const [confirmLeave, setConfirmLeave] = React.useState(false);

  const isAdmin = user?.role === 'admin';
  const isLeader = group?.my_role === 'leader' && group?.my_status === 'active';
  const canManage = Boolean(isAdmin || isLeader);
  const { data: requests } = useGroupRequests(groupId, canManage);
  const decide = useDecideGroupRequest(groupId);

  if (!groupId || (error as any)?.response?.status === 404) {
    return (
      <div className="container-max py-12">
        <p className="text-ui-subtle">This group could not be found.</p>
        <Link href="/groups" className="text-sm font-semibold text-sky-700">
          ← All groups
        </Link>
      </div>
    );
  }

  if (isLoading || !group) {
    return (
      <div className="container-max py-12 text-sm text-ui-subtle">
        {error ? 'Could not load this group.' : 'Loading group...'}
      </div>
    );
  }

  return (
    <div className="container-max space-y-6 py-12 sm:py-16">
      <div className="space-y-2">
        <Link href="/groups" className="text-sm font-semibold text-sky-700 dark:text-cyan-300">
          ← All groups
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{group.name}</h1>
        {group.ministry_name && <p className="text-sm text-ui-subtle">{group.ministry_name}</p>}
        {!group.is_active && <p className="text-sm font-semibold text-red-700">This group is inactive.</p>}
        {meetingLine(group) && <p className="text-sm">{meetingLine(group)}</p>}
        <p className="text-sm text-ui-subtle">
          {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
          {group.capacity !== null ? ` of ${group.capacity}` : ''}
          {group.leaders.length > 0 ? ` · Led by ${group.leaders.map(personName).join(', ')}` : ''}
        </p>
        {group.description && <p className="max-w-2xl whitespace-pre-line pt-2">{group.description}</p>}

        <div className="pt-2">
          {!isAuthenticated ? (
            <Button asChild variant="outline">
              <Link href={`/login?next=${encodeURIComponent(`/groups/${group.id}`)}`}>Sign in to join</Link>
            </Button>
          ) : group.my_status === 'active' ? (
            <Button variant="outline" disabled={leave.isPending} onClick={() => setConfirmLeave(true)}>
              Leave group
            </Button>
          ) : group.my_status === 'pending' ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Request pending</span>
              <Button size="sm" variant="outline" disabled={leave.isPending} onClick={() => leave.mutate(group.id)}>
                Cancel request
              </Button>
            </div>
          ) : isGroupFull(group) ? (
            <span className="text-sm text-ui-subtle">This group is full.</span>
          ) : group.is_active ? (
            <Button disabled={join.isPending} onClick={() => join.mutate(group.id)}>
              Ask to join
            </Button>
          ) : null}
        </div>
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Join requests ({requests?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!requests || requests.length === 0 ? (
              <p className="text-sm text-ui-subtle">No pending requests.</p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {requests.map((request) => (
                  <li key={request.user_id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{personName(request)}</span>
                      <span className="block truncate text-xs text-ui-subtle">
                        {request.email} · asked {formatDateTime(request.requested_at)}
                      </span>
                    </span>
                    <span className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ userId: request.user_id, decision: 'approve' })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ userId: request.user_id, decision: 'decline' })}
                      >
                        Decline
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {group.members && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Members ({group.members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {group.members.map((member) => (
                <li key={member.user_id} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate">{personName(member)}</span>
                  {member.role === 'leader' && (
                    <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
                      Leader
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {confirmLeave && (
        <ConfirmDialog
          title={`Leave ${group.name}?`}
          description="You can ask to join again later."
          confirmLabel="Leave group"
          onCancel={() => setConfirmLeave(false)}
          onConfirm={() => {
            setConfirmLeave(false);
            leave.mutate(group.id);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add the footer link**

In `frontend/src/components/layout/Footer.tsx`, in the "Get Involved" list, add `['Small Groups', '/groups'],` after `['Ministries', '/ministries'],`.

- [ ] **Step 5: Type-check, lint, and build**

Run: `cd frontend && npm run -s type-check && npm run -s lint && npm run -s build`
Expected: no type or lint output. The build lists `○ /groups` and `ƒ /groups/[id]`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/hooks/useApi.ts frontend/src/lib/groups.ts frontend/src/app/groups frontend/src/components/layout/Footer.tsx
git commit -m "feat(web): browse, join and leave small groups; leaders approve requests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Web — admin group management

**Files:**
- Modify: `frontend/src/hooks/useApi.ts` (add these after `useDecideGroupRequest`)
- Create: `frontend/src/app/admin/groups/page.tsx`
- Modify: `frontend/src/components/layout/AdminSidebar.tsx`

**Interfaces:**
- Consumes: the admin endpoints (Task 3), `useMinistries()`, `useMemberSearch(term)` (Phase 3), and `GroupSummary` (Task 4).
- Produces:
  - `GroupInput` type
  - `useAdminGroups()`
  - `useSaveGroup()`, a mutation taking `{ id?: number; input: GroupInput }`
  - `useDeactivateGroup()`, a mutation taking a `number`
  - `useSetGroupLeaders(groupId)`, a mutation taking `number[]`

- [ ] **Step 1: Add the admin hooks**

In `frontend/src/hooks/useApi.ts`, add this directly after `useDecideGroupRequest`:

```ts
export type GroupInput = {
  name: string;
  description: string | null;
  meetingDay: string | null;
  meetingTime: string | null;
  location: string | null;
  capacity: number | null;
  ministryId: number | null;
  isActive?: boolean;
};

export const useAdminGroups = () =>
  useQuery({
    queryKey: ['admin', 'groups'],
    queryFn: async (): Promise<GroupSummary[]> => {
      const response = await apiClient.get('/admin/groups');
      return response.data?.data ?? [];
    },
  });

export const useSaveGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: GroupInput }) => {
      const response = id ? await apiClient.put(`/admin/groups/${id}`, input) : await apiClient.post('/admin/groups', input);
      return response.data?.data as GroupSummary;
    },
    onSuccess: (_data, { id }) => toast.success(id ? 'Group updated' : 'Group created'),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not save the group')),
    onSettled: () => invalidateGroups(qc),
  });
};

export const useDeactivateGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: number) => {
      await apiClient.delete(`/admin/groups/${groupId}`);
    },
    onSuccess: () => toast.success('Group deactivated'),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not deactivate the group')),
    onSettled: () => invalidateGroups(qc),
  });
};

export const useSetGroupLeaders = (groupId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userIds: number[]) => {
      const response = await apiClient.put(`/admin/groups/${groupId}/leaders`, { userIds });
      return response.data?.data as GroupSummary;
    },
    onSuccess: () => toast.success('Leaders updated'),
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not update leaders')),
    onSettled: () => invalidateGroups(qc),
  });
};
```

- [ ] **Step 2: Create the admin page**

Create `frontend/src/app/admin/groups/page.tsx`:

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
  useAdminGroups,
  useDeactivateGroup,
  useMemberSearch,
  useMinistries,
  useSaveGroup,
  useSetGroupLeaders,
  type GroupInput,
  type GroupSummary,
} from '@/hooks/useApi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type FormState = {
  name: string;
  description: string;
  meetingDay: string;
  meetingTime: string;
  location: string;
  capacity: string;
  ministryId: string;
};

const EMPTY: FormState = { name: '', description: '', meetingDay: '', meetingTime: '', location: '', capacity: '', ministryId: '' };

const toInput = (form: FormState): GroupInput => ({
  name: form.name.trim(),
  description: form.description.trim() || null,
  meetingDay: form.meetingDay || null,
  meetingTime: form.meetingTime || null,
  location: form.location.trim() || null,
  capacity: form.capacity ? Number(form.capacity) : null,
  ministryId: form.ministryId ? Number(form.ministryId) : null,
});

type Leader = { user_id: number; name: string };

function LeadersEditor({ group, onDone }: { group: GroupSummary; onDone: () => void }) {
  const [leaders, setLeaders] = React.useState<Leader[]>(
    group.leaders.map((leader) => ({ user_id: leader.user_id, name: `${leader.first_name} ${leader.last_name}`.trim() }))
  );
  const [searchInput, setSearchInput] = React.useState('');
  const [term, setTerm] = React.useState('');
  const { data: results } = useMemberSearch(term);
  const save = useSetGroupLeaders(group.id);

  React.useEffect(() => {
    const timer = setTimeout(() => setTerm(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const add = (leader: Leader) =>
    setLeaders((current) => (current.some((l) => l.user_id === leader.user_id) || current.length >= 10 ? current : [...current, leader]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Leaders of {group.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {leaders.length === 0 && <span className="text-sm text-ui-subtle">No leaders yet.</span>}
          {leaders.map((leader) => (
            <span key={leader.user_id} className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-sm dark:bg-sky-900/40">
              {leader.name || `Member #${leader.user_id}`}
              <button
                type="button"
                aria-label={`Remove ${leader.name}`}
                className="font-bold"
                onClick={() => setLeaders((current) => current.filter((l) => l.user_id !== leader.user_id))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="leader-search">Add a leader</Label>
          <Input
            id="leader-search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search members by name or email"
          />
          {term.trim().length >= 2 && (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {(results ?? []).map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate text-sm">
                    {`${member.first_name} ${member.last_name}`.trim()} <span className="text-ui-subtle">{member.email}</span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => add({ user_id: member.id, name: `${member.first_name} ${member.last_name}`.trim() })}
                  >
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-3">
          <Button disabled={save.isPending} onClick={() => save.mutate(leaders.map((l) => l.user_id), { onSuccess: onDone })}>
            Save leaders
          </Button>
          <Button variant="outline" onClick={onDone}>
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminGroupsPage() {
  const { data: groups, isLoading } = useAdminGroups();
  const { data: ministries } = useMinistries();
  const save = useSaveGroup();
  const deactivate = useDeactivateGroup();

  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [leadersFor, setLeadersFor] = React.useState<GroupSummary | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = React.useState<GroupSummary | null>(null);

  const set = (field: keyof FormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const startEdit = (group: GroupSummary) => {
    setEditingId(group.id);
    setForm({
      name: group.name,
      description: group.description || '',
      meetingDay: group.meeting_day || '',
      meetingTime: group.meeting_time || '',
      location: group.location || '',
      capacity: group.capacity !== null ? String(group.capacity) : '',
      ministryId: group.ministry_id !== null ? String(group.ministry_id) : '',
    });
  };

  const resetForm = () => {
    setEditingId(undefined);
    setForm(EMPTY);
  };

  const selectClass =
    'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950';

  return (
    <div className="container-max space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Small Groups</h1>
        <p className="mt-2 text-sm text-ui-subtle">
          Create groups and assign leaders. Leaders approve join requests on the group&apos;s page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{editingId ? 'Edit group' : 'New group'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate({ id: editingId, input: toInput(form) }, { onSuccess: resetForm });
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="group-name">Name</Label>
              <Input id="group-name" value={form.name} onChange={set('name')} required maxLength={255} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="group-description">Description</Label>
              <Textarea id="group-description" rows={3} maxLength={2000} value={form.description} onChange={set('description')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-day">Meeting day</Label>
              <select id="group-day" value={form.meetingDay} onChange={set('meetingDay')} className={selectClass}>
                <option value="">Not set</option>
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-time">Meeting time</Label>
              <Input id="group-time" type="time" value={form.meetingTime} onChange={set('meetingTime')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-location">Location</Label>
              <Input id="group-location" value={form.location} onChange={set('location')} maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-capacity">Capacity (blank = no limit)</Label>
              <Input id="group-capacity" type="number" min={1} max={1000} value={form.capacity} onChange={set('capacity')} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="group-ministry">Ministry</Label>
              <select id="group-ministry" value={form.ministryId} onChange={set('ministryId')} className={selectClass}>
                <option value="">None</option>
                {((ministries ?? []) as Array<{ id: number; name: string }>).map((ministry) => (
                  <option key={ministry.id} value={String(ministry.id)}>
                    {ministry.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" disabled={save.isPending}>
                {editingId ? 'Save changes' : 'Create group'}
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

      {leadersFor && <LeadersEditor key={leadersFor.id} group={leadersFor} onDone={() => setLeadersFor(null)} />}

      {isLoading ? (
        <p className="text-sm text-ui-subtle">Loading groups...</p>
      ) : !groups || groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-ui-subtle">No groups yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {group.name} {!group.is_active && <span className="text-xs font-normal text-red-700">(inactive)</span>}
                  </p>
                  <p className="text-xs text-ui-subtle">
                    {group.member_count} members{group.capacity !== null ? ` of ${group.capacity}` : ''} ·{' '}
                    {group.leaders.length > 0
                      ? `Led by ${group.leaders.map((l) => `${l.first_name} ${l.last_name}`.trim()).join(', ')}`
                      : 'No leader'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(group)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setLeadersFor(group)}>
                    Leaders
                  </Button>
                  {group.is_active ? (
                    <Button size="sm" variant="outline" onClick={() => setPendingDeactivate(group)}>
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={save.isPending}
                      onClick={() =>
                        save.mutate({
                          id: group.id,
                          input: {
                            ...toInput({
                              name: group.name,
                              description: group.description || '',
                              meetingDay: group.meeting_day || '',
                              meetingTime: group.meeting_time || '',
                              location: group.location || '',
                              capacity: group.capacity !== null ? String(group.capacity) : '',
                              ministryId: group.ministry_id !== null ? String(group.ministry_id) : '',
                            }),
                            isActive: true,
                          },
                        })
                      }
                    >
                      Reactivate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pendingDeactivate && (
        <ConfirmDialog
          title={`Deactivate "${pendingDeactivate.name}"?`}
          description="Members keep their membership, but the group is hidden and stops accepting requests. You can reactivate it later."
          confirmLabel="Deactivate"
          onCancel={() => setPendingDeactivate(null)}
          onConfirm={() => {
            deactivate.mutate(pendingDeactivate.id);
            setPendingDeactivate(null);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add the sidebar link**

In `frontend/src/components/layout/AdminSidebar.tsx`, add this after the Ministries entry in `navItems` (the `Users` icon is already imported):

```ts
  { href: '/admin/groups', label: 'Small Groups', icon: Users },
```

- [ ] **Step 4: Type-check, lint, and build**

Run: `cd frontend && npm run -s type-check && npm run -s lint && npm run -s build`
Expected: no type or lint output, and the build lists `○ /admin/groups`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useApi.ts frontend/src/app/admin/groups frontend/src/components/layout/AdminSidebar.tsx
git commit -m "feat(web): admin small group management and leader assignment

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Mobile — real Small Groups screen

**Files:**
- Modify: `mobile/src/hooks/use-api.ts` (add these after `useMinistries`)
- Rewrite: `mobile/src/app/small-groups.tsx`

**Interfaces:**
- Consumes: the member endpoints (Task 2).
- Produces:
  - Types: `GroupSummary`, `GroupDetail`, `GroupJoinRequest`
  - `useGroups()`
  - `useGroup(id?)`
  - `useJoinGroup()`
  - `useLeaveGroup()`
  - `useGroupRequests(groupId?, enabled)`
  - `useDecideGroupRequest(groupId?)`

- [ ] **Step 1: Record the baseline**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo baseline-ok`
Expected: `baseline-ok`.

- [ ] **Step 2: Add the hooks**

In `mobile/src/hooks/use-api.ts`, add this directly after `useMinistries`:

```ts
export type GroupSummary = {
  id: number;
  name: string;
  description: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  location: string | null;
  capacity: number | null;
  ministry_name: string | null;
  is_active: boolean;
  member_count: number;
  leaders: { user_id: number; first_name: string; last_name: string }[];
  my_status: 'pending' | 'active' | null;
  my_role: 'leader' | 'member' | null;
};

export type GroupDetail = GroupSummary & {
  members: { user_id: number; first_name: string; last_name: string; role: 'leader' | 'member' }[] | null;
};

export type GroupJoinRequest = { user_id: number; first_name: string; last_name: string; email: string; requested_at: string };

const invalidateGroups = () => queryClient.invalidateQueries({ queryKey: ['groups'] });

export const useGroups = () =>
  useQuery({
    queryKey: ['groups', 'list'],
    queryFn: async (): Promise<GroupSummary[]> => {
      const response = await apiClient.get('/groups');
      return response.data?.data || [];
    },
  });

export const useGroup = (id?: number) =>
  useQuery({
    queryKey: ['groups', 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<GroupDetail> => {
      const response = await apiClient.get(`/groups/${id}`);
      return response.data?.data;
    },
  });

export const useJoinGroup = () =>
  useMutation({
    mutationFn: async (groupId: number) => {
      await apiClient.post(`/groups/${groupId}/join`);
    },
    onSettled: invalidateGroups,
  });

export const useLeaveGroup = () =>
  useMutation({
    mutationFn: async (groupId: number) => {
      await apiClient.delete(`/groups/${groupId}/membership`);
    },
    onSettled: invalidateGroups,
  });

export const useGroupRequests = (groupId?: number, enabled = true) =>
  useQuery({
    queryKey: ['groups', 'requests', groupId],
    enabled: Boolean(groupId) && enabled,
    queryFn: async (): Promise<GroupJoinRequest[]> => {
      const response = await apiClient.get(`/groups/${groupId}/requests`);
      return response.data?.data || [];
    },
  });

export const useDecideGroupRequest = (groupId?: number) =>
  useMutation({
    mutationFn: async ({ userId, decision }: { userId: number; decision: 'approve' | 'decline' }) => {
      await apiClient.post(`/groups/${groupId}/requests/${userId}/${decision}`);
    },
    onSettled: invalidateGroups,
  });
```

- [ ] **Step 3: Rewrite the Small Groups screen**

Replace the whole of `mobile/src/app/small-groups.tsx` with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  getApiErrorMessage,
  useDecideGroupRequest,
  useGroup,
  useGroupRequests,
  useGroups,
  useJoinGroup,
  useLeaveGroup,
  type GroupSummary,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

const groupColors = ['#2563EB', '#DB2777', '#7C3AED', '#16A34A', '#D97706'];

const personName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Member';
const meetingLine = (group: GroupSummary) =>
  [group.meeting_day, group.meeting_time, group.location].filter(Boolean).join(' · ');
const isFull = (group: GroupSummary) => group.capacity !== null && group.member_count >= group.capacity;

export default function SmallGroupsScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const [selectedId, setSelectedId] = React.useState<number | undefined>();

  const groupsQuery = useGroups();
  const groupQuery = useGroup(selectedId);
  const group = groupQuery.data;
  const isAdmin = user?.role === 'admin';
  const canManage = Boolean(isAdmin || (group?.my_role === 'leader' && group?.my_status === 'active'));
  const requestsQuery = useGroupRequests(selectedId, canManage);
  const joinMutation = useJoinGroup();
  const leaveMutation = useLeaveGroup();
  const decideMutation = useDecideGroupRequest(selectedId);

  const busy = joinMutation.isPending || leaveMutation.isPending || decideMutation.isPending;
  const showError = (title: string) => (error: unknown) => Alert.alert(title, getApiErrorMessage(error, 'Please try again.'));

  const join = (groupId: number) => {
    if (!user) {
      router.push('/login');
      return;
    }
    joinMutation.mutate(groupId, {
      onSuccess: () => Alert.alert('Request sent', 'The group leaders will review your request.'),
      onError: showError('Could not send your request'),
    });
  };

  const leave = (target: GroupSummary) =>
    Alert.alert(
      target.my_status === 'active' ? `Leave ${target.name}?` : 'Cancel your request?',
      target.my_status === 'active' ? 'You can ask to join again later.' : undefined,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: target.my_status === 'active' ? 'Leave' : 'Cancel request',
          style: 'destructive',
          onPress: () => leaveMutation.mutate(target.id, { onError: showError('Could not leave the group') }),
        },
      ]
    );

  const decide = (userId: number, decision: 'approve' | 'decline') =>
    decideMutation.mutate({ userId, decision }, { onError: showError('Could not update the request') });

  const statusAction = (target: GroupSummary) => {
    if (target.my_status === 'active') {
      return <BrandButton label="Leave group" variant="outline" onPress={() => !busy && leave(target)} />;
    }
    if (target.my_status === 'pending') {
      return <BrandButton label="Request pending · Cancel" variant="outline" onPress={() => !busy && leave(target)} />;
    }
    if (isFull(target)) {
      return (
        <ThemedText type="small" themeColor="textSecondary">
          This group is full.
        </ThemedText>
      );
    }
    return <BrandButton label={user ? 'Ask to join' : 'Sign in to join'} onPress={() => !busy && join(target.id)} />;
  };

  if (selectedId) {
    return (
      <BrandScreen>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => setSelectedId(undefined)}
            style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
            <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.headerTitle} numberOfLines={1}>
            {group?.name || 'Group'}
          </ThemedText>
        </View>

        {groupQuery.isLoading ? (
          <ActivityIndicator color={theme.tint} />
        ) : groupQuery.isError || !group ? (
          <BrandCard>
            <ThemedText type="small">This group could not be loaded.</ThemedText>
            <BrandButton label="Back to groups" onPress={() => setSelectedId(undefined)} />
          </BrandCard>
        ) : (
          <>
            <BrandCard>
              {group.ministry_name ? <BrandPill>{group.ministry_name}</BrandPill> : null}
              {group.description ? <ThemedText type="small">{group.description}</ThemedText> : null}
              {meetingLine(group) ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {meetingLine(group)}
                </ThemedText>
              ) : null}
              <ThemedText type="small" themeColor="textSecondary">
                {`${group.member_count} members${group.capacity !== null ? ` of ${group.capacity}` : ''}`}
                {group.leaders.length > 0 ? ` · Led by ${group.leaders.map(personName).join(', ')}` : ''}
              </ThemedText>
              {statusAction(group)}
            </BrandCard>

            {canManage ? (
              <BrandCard>
                <ThemedText type="defaultSemiBold">Join requests ({requestsQuery.data?.length ?? 0})</ThemedText>
                {(requestsQuery.data ?? []).length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    No pending requests.
                  </ThemedText>
                ) : (
                  (requestsQuery.data ?? []).map((request) => (
                    <View key={request.user_id} style={styles.requestRow}>
                      <ThemedText type="small" numberOfLines={1}>
                        {personName(request)}
                      </ThemedText>
                      <View style={styles.requestActions}>
                        <BrandButton label="Approve" onPress={() => !busy && decide(request.user_id, 'approve')} />
                        <BrandButton label="Decline" variant="outline" onPress={() => !busy && decide(request.user_id, 'decline')} />
                      </View>
                    </View>
                  ))
                )}
              </BrandCard>
            ) : null}

            {group.members ? (
              <BrandCard>
                <ThemedText type="defaultSemiBold">Members ({group.members.length})</ThemedText>
                {group.members.map((member) => (
                  <View key={member.user_id} style={styles.memberRow}>
                    <ThemedText type="small" style={styles.memberName} numberOfLines={1}>
                      {personName(member)}
                    </ThemedText>
                    {member.role === 'leader' ? <BrandPill>Leader</BrandPill> : null}
                  </View>
                ))}
              </BrandCard>
            ) : null}
          </>
        )}
      </BrandScreen>
    );
  }

  const groups = Array.isArray(groupsQuery.data) ? groupsQuery.data : [];

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Small Groups"
        title="Find your community"
        description="Join a small group to grow, pray and do life together during the week."
      />

      {groupsQuery.isLoading ? (
        <ActivityIndicator color={theme.tint} />
      ) : groupsQuery.isError ? (
        <BrandCard>
          <ThemedText type="small">Could not load groups.</ThemedText>
          <BrandButton label="Try again" onPress={() => groupsQuery.refetch()} />
        </BrandCard>
      ) : groups.length === 0 ? (
        <BrandCard>
          <ThemedText type="small" themeColor="textSecondary">
            No groups are open yet.
          </ThemedText>
        </BrandCard>
      ) : (
        groups.map((item, index) => {
          const color = groupColors[index % groupColors.length];
          return (
            <Pressable key={item.id} onPress={() => setSelectedId(item.id)}>
              <BrandCard>
                <View style={styles.groupHeader}>
                  <View style={[styles.groupIcon, { backgroundColor: `${color}22` }]}>
                    <Ionicons name="people-outline" size={20} color={color} />
                  </View>
                  <View style={styles.groupCopy}>
                    <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                    {meetingLine(item) ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        {meetingLine(item)}
                      </ThemedText>
                    ) : null}
                  </View>
                  <BrandPill>
                    {item.my_status === 'active'
                      ? 'Member'
                      : item.my_status === 'pending'
                        ? 'Pending'
                        : `${item.member_count}${item.capacity !== null ? `/${item.capacity}` : ''}`}
                  </BrandPill>
                </View>
              </BrandCard>
            </Pressable>
          );
        })
      )}
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerTitle: { flex: 1 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  groupIcon: { width: 42, height: 42, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  groupCopy: { flex: 1, gap: 2 },
  requestRow: { gap: Spacing.one },
  requestActions: { flexDirection: 'row', gap: Spacing.two },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  memberName: { flex: 1 },
});
```

- [ ] **Step 4: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`.

- [ ] **Step 5: On-device check** (the project owner does this; note it in the report)

1. The list shows real groups. Ask to join, and the badge shows "Pending". Cancel the request.
2. As a group's leader, open the group, approve a request, and see the member appear.
3. An active member sees the member list. A non-member doesn't.
4. A full group shows "This group is full".

- [ ] **Step 6: Commit**

```bash
git add mobile/src/hooks/use-api.ts mobile/src/app/small-groups.tsx
git commit -m "feat(mobile): real small groups with join, leave and leader approvals

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Documentation and final checks

**Files:**
- Modify: `docs/features.md`, `docs/qa-checklist.md`, `docs/superpowers/plans/2026-09-28-00-roadmap.md`

- [ ] **Step 1: Document the feature**

In `docs/features.md`:
- Under "## Member Features", after the "Prayer wall" bullet, add `- Small groups: browse, ask to join, leave; group leaders approve requests`.
- Under "### Web" in "## Admin Features", after "- Ministries CRUD", add `- Small groups management (create, edit, deactivate, assign leaders)`.
- Append this at the end:

```markdown
## Small Groups

- Members browse active groups at web `/groups` or the mobile Small Groups screen and ask to join; requests are pending until a group leader or an admin approves.
- Groups can have a capacity (active members only); full groups refuse new requests and approvals.
- Only active members and admins see a group's member list; others see details, leaders and member count.
- Members can leave or cancel a request; the last leader must hand over leadership first.
- Leaders are notified of join requests; members are notified when approved.
- Admins create, edit, deactivate/reactivate groups and assign leaders at `/admin/groups` (audited).
```

- [ ] **Step 2: Add QA steps**

Append this to `docs/qa-checklist.md`:

```markdown
## Small Groups

- [ ] Admin creates a group at `/admin/groups` with day, time, location, capacity and ministry; a duplicate name is refused
- [ ] Admin assigns a leader by searching members; the leader is shown on the group card
- [ ] A member asks to join on `/groups`; the button changes to "Request pending"; the leader gets a notification
- [ ] The leader approves on `/groups/[id]`; the member gets a notification and now sees the member list
- [ ] A non-member and a signed-out visitor do not see the member list
- [ ] A full group shows "This group is full" and refuses approvals
- [ ] The only leader cannot leave until another leader is assigned
- [ ] A deactivated group disappears for members and can be reactivated by an admin
- [ ] Mobile Small Groups screen: list, join, cancel, leader approve/decline
```

- [ ] **Step 3: Update the roadmap**

In `docs/superpowers/plans/2026-09-28-00-roadmap.md`, change the phase 4 row to:

```markdown
| 4 | `2026-10-05-phase-4-small-groups.md` | Done |
```

- [ ] **Step 4: Run all project checks**

```bash
cd backend && npx jest --runInBand --coverage=false && npx eslint src/ tests/ && cd ..
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build && cd ..
cd mobile && npm run -s lint && npx tsc --noEmit && cd ..
```

Expected: all 223 backend tests pass, there are no lint or type errors, the frontend build succeeds, and mobile is clean.

- [ ] **Step 5: Commit**

```bash
git add docs/features.md docs/qa-checklist.md docs/superpowers/plans/2026-09-28-00-roadmap.md
git commit -m "docs: document small groups and QA steps

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
