# Making the Placeholder Features Real — Design Spec

- **Date:** 2026-09-28
- **Status:** Approved in conversation; awaiting spec review
- **Scope:** Six features that currently exist only as placeholder mobile screens, built end to end (database → API → web → mobile).

## 1. Goal

Several mobile screens look complete but have no real feature behind them:

| Screen | What it does today |
|---|---|
| `small-groups` | Shows "coming soon" and lists ministries |
| `daily-devotional` | Reuses news and sermons |
| `admin-attendance` | Lists events; nothing records attendance |
| `admin-series` | Lists sermons; sermons cannot be grouped |
| `admin-announcements` | Creates a news post; nothing reaches phones |
| `prayer-wall` | Shows only the member's own requests |

**Success means:** each of these screens is backed by real data and working API endpoints. Each feature is also usable on the website (members and admins), and each ships as its own phase that passes the project's checks.

## 2. Decisions

| Topic | Decision |
|---|---|
| Platforms | Member and admin features on **both** web and mobile |
| Prayer wall visibility | Signed-in members only |
| Prayer wall opt-in | Requester chooses to share; existing requests stay private |
| Group joining | Request to join, approved by the group's leader or an admin |
| Group chat or feed | Not in this version |
| Attendance check-in | Admins only; QR self check-in is out of scope |
| Devotional publishing | Scheduled by date; a "Publish & notify" button sends the notification (no background scheduler) |
| Push notifications | Mobile only, via Expo push; the website gets in-app notifications only |
| Site-wide roles | Unchanged (`member`, `admin`); group leadership is per group |
| "Today" | Determined by `CHURCH_TIMEZONE`, default `Africa/Accra` |

## 3. Conventions followed

Every feature uses the existing project pattern:

- **Schema:** a Prisma model in `backend/prisma/schema.prisma`, **plus** an idempotent block (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, guarded `CREATE TYPE`) in `backend/migrations/migrateFeatureUpdates.js`. That script runs on every Render deploy and every Docker start.
- **Backend:** `src/models/<x>Model.js` (Prisma + `toSnakeCaseObject`), `src/controllers/<x>Controller.js`, `src/routes/<x>Routes.js` and `src/routes/admin<X>Routes.js`, mounted in `src/server.js`. Responses use `apiResponse(success, data, message, meta)`; pagination uses `getPagination` / `buildPaginationMeta`.
- **Permissions:** `verifyToken` / `isAuthenticated` / `optionalAuth` / `requireRole('admin')`. Ownership and group-leader checks happen in controllers.
- **Audit:** admin writes call `auditLogModel.createAuditLog`.
- **Web:** hooks in `frontend/src/hooks/useApi.ts`, pages under `frontend/src/app`, and admin pages under `frontend/src/app/admin` with a new `AdminSidebar` entry.
- **Mobile:** hooks in `mobile/src/hooks/use-api.ts`; screens replace the placeholder files in `mobile/src/app`.

## 4. Groundwork: the notification helper

**New:** `backend/src/services/notificationService.js`

```js
notify({ userIds, title, message, type, entityType, entityId })  // → { inApp: number, push: number }
notifyAll({ title, message, type, entityType, entityId })
```

- It wraps the existing `notificationModel.createNotification` and `createNotificationForAllUsers`.
- In phases 1–5 it creates in-app notifications only (`push: 0`). Phase 6 adds push delivery **inside this service**, so earlier features need no changes.
- Notification failures are logged and never fail the request that triggered them.
- **New setting:** `CHURCH_TIMEZONE` (default `Africa/Accra`), read by a small `src/utils/dates.js` helper, `getChurchToday()`, which returns a `YYYY-MM-DD` string.

## 5. Features

### 5.1 Prayer Wall (phase 1)

**Data**
- `PrayerRequest` gets two new fields:
  - `shareOnWall Boolean @default(false)` (column `share_on_wall`)
  - `prayerCount Int @default(0)` (column `prayer_count`)
- **New:** `PrayerIntercession`, with `id`, `prayerRequestId` (cascade), `userId` (cascade), and `createdAt`. It has `@@unique([prayerRequestId, userId])` and maps to the `prayer_intercessions` table.

**Rules**
- The wall lists requests where `shareOnWall = true` and `status IN (approved, answered)`, newest first. Answered requests show an "Answered" badge.
- If `isAnonymous` is set, the author shows as "A church member" and the response never includes the user's id or name.
- "I prayed" inserts an intercession and increments `prayerCount` in one transaction. A repeat call by the same user returns the current count without adding anything (idempotent).
- A member cannot pray for a request that isn't on the wall; this returns 404.
- The requester is notified when `prayerCount` reaches 1, 5, 10, 25, 50, or 100.

**API**

| Method and path | Who | Purpose |
|---|---|---|
| `GET /api/prayers/wall?page&limit&category` | signed in | Paginated wall; each item includes `prayed_by_me` |
| `POST /api/prayers/:id/pray` | signed in | Record "I prayed"; returns `{ prayer_count, prayed_by_me }` |
| `POST /api/prayers`, `PUT /api/prayers/:id` | owner | Existing endpoints now accept `shareOnWall` |

**Screens**
- **Web:** a new `/prayer/wall` page. The `/prayer/new` form gets a "Share on the prayer wall" checkbox.
- **Mobile:** `prayer-wall.tsx` shows the real wall. The member's own requests move to a "My requests" tab on the same screen.

### 5.2 Sermon Series (phase 2)

**Data**
- **New:** `SermonSeries`, with `id`, `title` (unique, 255), `description?`, `coverImageUrl?`, `startDate?`, `endDate?`, and timestamps. It maps to the `sermon_series` table.
- `Sermon` gets `seriesId Int?` (column `series_id`, `onDelete: SetNull`), indexed.

**API**

| Method and path | Who | Purpose |
|---|---|---|
| `GET /api/sermon-series` | public | Series list, each with a sermon count |
| `GET /api/sermon-series/:id` | public | A series plus its sermons in date order |
| `POST/PUT/DELETE /api/admin/sermon-series[/:id]` | admin | Manage series (audited) |
| `POST /api/admin/sermon-series/upload-image` | admin | Upload a cover image (same image rules as news) |
| Admin sermon create/update | admin | Accepts `seriesId` |

Deleting a series leaves its sermons in place; they just stop belonging to a series.

**Screens**
- **Web:**
  - `/sermons` gets a "Series" section
  - new `/sermons/series/[id]` page
  - new `/admin/series` page
  - the sermon form gets a series picker
- **Mobile:** `admin-series.tsx` handles create, edit, and delete. The member `sermons` tab gets a series view.

### 5.3 Attendance (phase 3)

**Data**
- **New:** `AttendanceRecord`, with these fields:
  - `id`
  - `eventId` (cascade)
  - `userId Int?` (cascade)
  - `guestName String? @db.VarChar(255)`
  - `checkedInBy Int?` (set null)
  - `checkedInAt @default(now())`
- A partial unique index on `(event_id, user_id) WHERE user_id IS NOT NULL` prevents checking a member in twice. It's created in SQL because Prisma cannot express partial indexes.
- A check constraint requires exactly one of `user_id` or `guest_name`.

**Rules**
- Only admins can check people in or undo a check-in.
- Checking in a member who is already checked in returns the existing record (idempotent).
- Walk-in guests are always new records.

**API** (all admin-only)

| Method and path | Purpose |
|---|---|
| `GET /api/admin/attendance/events/:eventId` | Event summary: registered members (each with a `checked_in` flag), other checked-in members, guests, and totals |
| `POST /api/admin/attendance/events/:eventId/check-in` | Body `{ userId }` or `{ guestName }` |
| `DELETE /api/admin/attendance/records/:id` | Undo a check-in |
| `GET /api/admin/attendance/summary?limit=10` | Recent events with member, guest, and total headcounts, for the trend view |
| `GET /api/admin/users?search=` | Existing endpoint, **extended** with an optional `search` (case-insensitive match on first name, last name, or email) for member lookup; the admin users page benefits too |

**Screens**
- **Web:** new `/admin/attendance` (event list with headcounts) and `/admin/attendance/[eventId]` (check-in view) pages.
- **Mobile:** `admin-attendance.tsx` shows a list of events, then the check-in view for the chosen event.

### 5.4 Small Groups (phase 4)

**Data**
- **New:** `SmallGroup`, with these fields:
  - `id`
  - `name` (unique)
  - `description?`
  - `meetingDay?` (text such as "Wednesday")
  - `meetingTime?` (text such as "18:30")
  - `location?`
  - `capacity Int?`
  - `ministryId Int?` (set null)
  - `isActive @default(true)`
  - timestamps
- **New:** `GroupMembership`, with `id`, `groupId` (cascade), `userId` (cascade), `role` (`GroupRole`: `leader` | `member`), `status` (`MembershipStatus`: `pending` | `active`), and timestamps. It has `@@unique([groupId, userId])`.

**Rules**
- **Joining:** asking to join creates a `pending` membership. Joining is refused if the group is inactive, the member is already in it, or the group is full (capacity counts active members only).
- **Approving:** only the group's leader or an admin can approve or decline a request. Declining deletes the pending row.
- **Leaving:** members can leave. The last remaining leader cannot leave until someone else is made leader.
- **Member lists:** only active members of the group and admins can see the member list. Everyone else sees the group's details, the leader's name, and the member count.
- **Admins** create, edit, and deactivate groups, and add or remove leaders.

**API**

| Method and path | Who | Purpose |
|---|---|---|
| `GET /api/groups` | public (`optionalAuth`) | Active groups; includes `my_status` when signed in |
| `GET /api/groups/:id` | public (`optionalAuth`) | Group details; member list only for members and admins |
| `POST /api/groups/:id/join` | signed in | Ask to join |
| `DELETE /api/groups/:id/membership` | signed in | Leave, or cancel a pending request |
| `GET /api/groups/:id/requests` | leader or admin | Pending requests |
| `POST /api/groups/:id/requests/:userId/approve` / `decline` | leader or admin | Decide a request |
| `GET /api/groups/mine` | signed in | Groups I belong to or lead (registered before `/:id` so `mine` isn't treated as an id) |
| `POST/PUT/DELETE /api/admin/groups[/:id]` | admin | Manage groups (audited) |
| `PUT /api/admin/groups/:id/leaders` | admin | Body `{ userIds }`; sets the leaders |

**Notifications**
- The leaders are notified when someone asks to join.
- The member is notified when their request is approved.

**Screens**
- **Web:** new `/groups`, `/groups/[id]` (including leader tools), and `/admin/groups` pages.
- **Mobile:** `small-groups.tsx` gets a group list, group details, and a join button. Leaders get a pending-requests section on the group details screen.

### 5.5 Daily Devotionals (phase 5)

**Data**
- **New:** `Devotional`, with these fields:
  - `id`
  - `title`
  - `scriptureReference` (e.g. "Psalm 23:1-3")
  - `scriptureText`
  - `body`
  - `prayer?`
  - `publishDate @db.Date @unique`
  - `status` (`DevotionalStatus`: `draft` | `published`)
  - `authorId Int?` (set null)
  - `notifiedAt DateTime?`
  - timestamps

**Rules**
- **Today's devotional** is the `published` one whose `publishDate` equals `getChurchToday()`. If there is none, the API returns the most recent published devotional dated on or before today, with `is_today: false`.
- **Visibility:** members never see drafts or devotionals dated in the future.
- **"Publish & notify"** sets the status to `published` and, if the devotional is dated today and `notifiedAt` is empty, sends a notification to everyone and records `notifiedAt`. Pressing it twice never sends twice.

**API**

| Method and path | Who | Purpose |
|---|---|---|
| `GET /api/devotionals/today` | public | Today's devotional, with fallback |
| `GET /api/devotionals?page&limit` | public | Archive of published devotionals dated up to today |
| `GET /api/devotionals/:id` | public | One devotional; 404 if it's a draft or dated in the future |
| `GET /api/admin/devotionals` | admin | All devotionals, including drafts and future dates |
| `POST/PUT/DELETE /api/admin/devotionals[/:id]` | admin | Manage devotionals (audited) |
| `POST /api/admin/devotionals/:id/publish` | admin | Publish, and notify if dated today |

**Screens**
- **Web:** new `/devotionals` (today plus archive), `/devotionals/[id]`, and `/admin/devotionals` pages, plus a "Today's devotional" card on the home page.
- **Mobile:** `daily-devotional.tsx` shows real data, and the Home tab gets a "Today's devotional" card.

### 5.6 Announcements and push notifications (phase 6)

**Data**
- **New:** `PushToken`, with `id`, `userId` (cascade), `token` (unique, 255), `platform` (`ios` | `android`), and `lastSeenAt`, plus timestamps.
- **New:** `Announcement`, with these fields:
  - `id`
  - `title`
  - `message`
  - `audience` (`AnnouncementAudience`: `everyone` | `group` | `event`)
  - `groupId?`
  - `eventId?`
  - `sentBy`
  - `recipientCount`
  - `pushCount`
  - `createdAt`

**Push delivery**
- **New:** `src/services/pushService.js`. It sends `POST https://exp.host/--/api/v2/push/send` in batches of 100 using the existing `axios` (no new backend dependency).
- Tokens whose ticket says `DeviceNotRegistered` are deleted.
- An optional `EXPO_ACCESS_TOKEN` setting is sent as a bearer token when present.
- `notificationService.notify` / `notifyAll` now also look up the recipients' push tokens and send a push. If sending fails, the error is logged and the in-app notification is still created.

**Recipients**
- `everyone`: all active users
- `group`: the group's active members
- `event`: the event's registered users, plus members checked in to it

**Who can send**
- Admins can send to any audience.
- A group's leader can send only to that group.

**API**

| Method and path | Who | Purpose |
|---|---|---|
| `POST /api/push-tokens` | signed in | Register or refresh a token `{ token, platform }` (upsert on token; reassigned to the current user) |
| `DELETE /api/push-tokens` | signed in | Remove a token `{ token }`; called on logout |
| `POST /api/announcements` | admin, or leader for their group | Send an announcement |
| `GET /api/announcements/sent` | admin (all) or leader (their groups) | History of sent announcements |

**Mobile**
- Adds `expo-notifications`.
- After login, the app asks for permission and registers the Expo push token. It removes the token on logout.
- Tapping a notification opens the related screen, based on `entityType` / `entityId`.
- `admin-announcements.tsx` sends real announcements, with an audience picker.

**Web:** a new `/admin/announcements` page (compose and history). Group leaders get a "Message group" action on `/groups/[id]`.

**Deployment requirements** (these go in `docs/deployment.md`)
- Android push needs Firebase (FCM v1) credentials uploaded to EAS.
- Push works only in development and store builds, not in Expo Go on Android.
- `app.json` gets the `expo-notifications` plugin, so a new native build is required; an OTA update is not enough.

## 6. Errors and edge cases

- Invalid IDs return 404. Validation errors return 400 through `handleValidationErrors`. Permission failures return 403, and missing authentication returns 401. These match the existing controllers.
- Operations that must not double-count run in a single Prisma transaction or are safe to repeat: "I prayed", check-in, "Publish & notify", and push-token registration.
- A full or inactive group, or a duplicate join request, returns 409 with a readable message.

## 7. Testing and checks (every phase)

- **Backend tests:** Jest and supertest with mocked models, in the style of `tests/api/*.test.js`. Each phase covers:
  - who can and cannot perform each action (owner, leader, admin, and outsider)
  - operations that are safe to repeat
  - anonymous prayer requests never exposing the author
  - drafts and future devotionals being hidden
  - group capacity and last-leader rules
  - push batching and deletion of dead tokens
- **Backend:** `npm run lint`, `npm test`.
- **Frontend:** `npm run type-check`, `npm run lint`, `npm run build`.
- **Mobile:** `npm install` (first time), then `npm run lint` and `npx tsc --noEmit`. On-device checks are done by the project owner.
- `docs/features.md` and `docs/qa-checklist.md` are updated in each phase.

## 8. Out of scope

- QR or self check-in
- Group chat or feed
- Browser (web) push
- Automatic scheduled devotional notifications
- Recurring giving
- Upgrading dependencies (a separate effort)

## 9. Build order

| Phase | Contents | Depends on |
|---|---|---|
| 0 | Notification helper, `dates.js` | — |
| 1 | Prayer Wall | 0 |
| 2 | Sermon Series | — |
| 3 | Attendance | — |
| 4 | Small Groups | 0 |
| 5 | Daily Devotionals | 0 |
| 6 | Announcements and push | 0, 3, 4 |

Each phase can ship on its own and must leave every check listed above passing.
