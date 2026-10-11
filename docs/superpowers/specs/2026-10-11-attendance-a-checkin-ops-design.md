# Attendance Part A: Check-in Operations (Design)

Date: 2026-10-11
Status: Approved in conversation; awaiting written-spec review
Series: Attendance improvements, Part A of F (A check-in operations, B recurring services, C insights, D QR self check-in, E offline check-in, F small-group attendance)

## Goal

Make Sunday check-in fast enough for a full church. Several ushers work at once, members are checked in by scanning a card, and everyone else is counted. Admins can check people in late and export the results.

## Understanding

**From the user:**
- Do all twelve attendance improvements, split into Parts A to F and built in that order.
- Ushers are appointed with an on/off switch on a member's account, not a new role.
- Ushers may only take attendance: open sheets, check in, undo, use the headcount counters and scan cards. Editing, reports and exports stay admin-only.
- Headcount uses separate Adults and Children counters, added on top of named check-ins.
- Member QR cards appear in the app and can be printed by admins. Each card holds a random code that an admin can reset.

**Assumptions:**
- Both web and mobile get every feature in this part.
- The existing attendance tables and records are kept and extended, not replaced.

**Success criteria:**
- An usher who is not an admin can run a whole check-in session on the web and on the app.
- Scanning a member card checks them in within about a second, and the usher sees who it was.
- Concurrent headcount taps from several devices are never lost, and counts never go below 0.
- An admin can check people in to any past event.
- An admin can download CSV for one event or for a date range.

## Scope

**In scope:**
- usher switch
- staff-only check-in area
- headcount counters
- check-in by card code (camera and keyboard-wedge scanners)
- member check-in card (show, print, reset)
- late check-in (search past events)
- CSV exports

**Out of scope (later parts):**
- recurring services (B)
- follow-up list, member history and trend charts (C)
- members scanning a service QR to check themselves in (D)
- offline check-in (E)
- small-group attendance (F)

## Data model (one Prisma migration)

### `User`
- `canTakeAttendance Boolean @default(false) @map("can_take_attendance")`: the usher switch.
- `checkInCode String? @unique @map("check_in_code") @db.VarChar(16)`: the card code. It is
  - 10 characters from the Crockford base32 alphabet, generated with `crypto.randomInt`
  - created on first request
  - replaced on reset
  - retried on a unique-constraint collision, up to 5 times

### `EventHeadcount` (new table `event_headcounts`)
| Column | Type |
|---|---|
| `event_id` | Int, primary key, FK → events (ON DELETE CASCADE) |
| `adults` | Int, default 0 |
| `children` | Int, default 0 |
| `updated_by` | Int?, FK → users (ON DELETE SET NULL) |
| `updated_at` | timestamptz |

Changes are made with a single SQL upsert, `INSERT ... ON CONFLICT (event_id) DO UPDATE SET adults = GREATEST(event_headcounts.adults + $delta, 0), ...`. Concurrent taps add up, and a count never goes below 0.

## Authorisation

`requireAttendanceStaff` middleware runs after `verifyToken`:
- `role === 'admin'` → allowed.
- Otherwise it loads the user's `isActive` and `canTakeAttendance` from the database on every request, so that a revoked switch takes effect immediately. Both must be true.
- Failure → 403 `{ success: false, message: 'Attendance access required' }`.

**User profile responses** include `can_take_attendance`:
- `GET /api/users/profile`, `GET /api/auth/me`, and the login, Google login and refresh responses.
- The web and mobile clients read it to show the "Take attendance" entry.
- The JWT payload is unchanged.

## API

### Staff routes: `/api/attendance` (new `attendanceRoutes.js`, `verifyToken` + `requireAttendanceStaff`)

| Method and path | Body or query | Result |
|---|---|---|
| `GET /events` | `?q=` optional, at least 2 chars | Without `q`: non-cancelled events from 14 days back to 14 days ahead (as now). With `q`: events whose name contains `q` (case-insensitive), any date up to 14 days ahead, newest first, max 50 |
| `GET /events/:eventId` | | Check-in sheet as today, plus `headcount: { adults, children }`. `totals` gains `adults`, `children`, `named` (= members + guests), and `total = named + adults + children` |
| `POST /events/:eventId/check-in` | Exactly one of `{ userId }`, `{ guestName }` (1–255 chars, trimmed) or `{ code }` | As today; `code` resolves a member by `checkInCode` |
| `POST /events/:eventId/headcount` | `{ adults?: -1\|1, children?: -1\|1 }`, at least one | `{ adults, children }` after the change |
| `DELETE /records/:id` | | Undo, as today |
| `GET /members` | `?q=` at least 2 chars | Max 20 active members: `{ id, first_name, last_name, email }` |

**Code check-in rules:**
- The client sends either the raw code or the full QR text. The server strips an `antpresby:member:` prefix and upper-cases the code.
- Unknown code → 404 "Card not recognised".
- The member is inactive → 403 "This member's account is inactive".
- Already checked in → 200 "Already checked in" with the existing record, as with userId.
- The success response includes `member: { first_name, last_name }` so the scanner can show the name.

**Event rules:**
- A cancelled event → 409 for check-in and for headcount changes.
- A missing event → 404.

### Member route
- `GET /api/users/me/check-in-card` → `{ code, qr_text: 'antpresby:member:<code>' }`. It creates the code if missing.

### Admin routes
- `PUT /api/admin/users/:id/usher` `{ enabled: boolean }` (PUT, matching the existing `PUT /:id/role`) → the updated user summary. An admin cannot change their own setting; they don't need it.
- `POST /api/admin/users/:id/check-in-card/reset` → `{ code, qr_text }`.
- `GET /api/admin/users/check-in-cards?ids=1,2,3` (optional ids) → `[{ id, first_name, last_name, code, qr_text }]` for active members. Missing codes are created.
- `GET /api/admin/attendance/events/:eventId/export.csv`
  - Columns: `Type,Name,Email,Checked in at,Checked in by`.
  - One row per named check-in (Type `Member` or `Guest`).
  - Then a `Headcount (adults)` row and a `Headcount (children)` row, with the count in the Name column.
- `GET /api/admin/attendance/export.csv?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - Columns: `Event,Date,Registered,Members,Guests,Adults counted,Children counted,Total`.
  - One row per event in the range, oldest first.
  - The range must be valid, at most 366 days; the default is the last 90 days.
- `GET /api/admin/attendance/summary`: unchanged.
- The old `/api/admin/attendance/events*` and `/records/:id` check-in routes are removed. Clients move to `/api/attendance` in the same change.

**CSV rules (both exports):**
- UTF-8 with a BOM, so Excel opens it correctly.
- RFC 4180 quoting.
- Any cell starting with `=`, `+`, `-`, `@`, tab or CR is prefixed with `'`.
- `Content-Disposition: attachment; filename="attendance-<slug>-<date>.csv"`.

**Audit log entries** (entity type `attendance` unless stated):
- `check_in` (now including the `code` method)
- `undo_check_in`
- `headcount_change` with metadata `{ eventId, adults, children }`
- `usher_enabled` and `usher_disabled` (entity type `user`)
- `check_in_card_reset` (entity type `user`)

## Web (Next.js)

- **New staff area `/check-in`:**
  - `/check-in` is the event list with a search box (late check-in).
  - `/check-in/[eventId]` is the sheet.
  - A client guard allows admins, and members with `can_take_attendance`. Anyone else is redirected to `/dashboard` with a notice.
  - Admins reach it from the admin sidebar entry "Check-in". Ushers reach it from "Take attendance" in the account menu and on the member dashboard.
- **Changes to `/admin/attendance`:**
  - Its event list links into `/check-in/[eventId]`.
  - The old `/admin/attendance/[eventId]` page redirects there.
  - It keeps the headcount trend and adds "Export date range": two date inputs and a Download button.
- **Sheet additions:**
  - Headcount card: Adults and Children rows, each with − and + buttons at least 44px, the current value, and the totals line "N present: X named, A adults, C children counted".
  - Scan box: a text input focused on load, labelled "Scan a card". Enter submits the code. The input clears and focus returns after each scan.
  - "Use camera" button: opens a camera scanner (`@zxing/browser`), loaded only when it is used.
  - Result of each scan or tap: shown in a polite live region, e.g. "Ama Mensah checked in", "Already checked in" or "Card not recognised".
  - "Download CSV": shown to admins only.
- **Admin users page:**
  - "Usher" switch per member (hidden for admins).
  - "Reset card" action with a confirmation.
  - "Print cards" link.
- **`/admin/users/cards`:**
  - A print-friendly A4 grid of cards (crest, name, QR code drawn with the `qrcode` package as inline SVG, the code text).
  - A selection of members, or all of them.
  - A Print button.
- **Member dashboard:** a "My check-in card" card showing the QR code and the code text.

## Mobile (Expo)

- **Account tab:**
  - Ushers and admins see "Take attendance", which opens the attendance screens.
  - Every member sees "My check-in card".
- **Attendance:**
  - The existing `admin-attendance` screen becomes a staff screen (route `check-in`), allowed for admins and ushers, with the same event list, search and sheet.
  - The sheet adds the headcount counters, plus a Scan button that opens a full-screen `expo-camera` scanner (QR only) that keeps scanning one person after another.
  - Each scan gives haptic feedback and a toast with the name or error. The same code is ignored for 3 seconds after it is read.
- **My check-in card screen:** a large QR code (`react-native-qrcode-svg`) with the code text. It tries to set the screen to full brightness while open, if a brightness API is available without another native module; otherwise it shows a hint to raise brightness.
- **Native dependency:** `expo-camera` and `react-native-svg` require a new EAS build (APK). OTA cannot ship this part. Camera permission text: "Allows ushers to scan member check-in cards."

## Errors and edge cases

- Camera permission denied → an explanation, and the manual scan box or name search still works.
- A network error during scan → the error toast and the code can be scanned again (offline queuing is Part E).
- A headcount tap at 0 with −1 → stays 0 with no error.
- A reset card is scanned → "Card not recognised".
- An usher whose switch is turned off mid-session → next request 403. The client shows "You no longer have attendance access" and leaves the check-in area.

## Testing

**Backend (jest, existing patterns):**
- An usher can use `/api/attendance/*`; a member without the switch gets 403; an inactive usher gets 403; an usher gets 403 on `/api/admin/attendance/*` exports.
- Revoking the switch takes effect on the next request.
- Headcount: increments, decrements, stays at 0 at the floor, and concurrent `Promise.all` of 20 increments → 20.
- Code check-in: valid; with the prefix; lowercase; unknown → 404; reset code → 404; inactive member → 403; duplicate → 200.
- The check-in body must contain exactly one of `userId`, `guestName` and `code`.
- CSV: headers, quoting, formula escaping, BOM, range validation.
- Totals maths in `buildAttendanceSummary`.
- Card code: alphabet and length; retried on collision.

**Web:** `npm run type-check`, `lint`, `build`, `check:tokens`, `check:contrast`.

**Mobile:** `lint` and `tsc`.

## Delivery

One branch, `feature/attendance-checkin-ops`, and one PR. After merge it needs a backend deploy (with the migration), a web deploy and a new Android build.
