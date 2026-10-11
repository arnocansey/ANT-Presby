# Attendance Part A: Check-in Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ushers (members with a switch on) and admins can run check-in on web and mobile. They can count adults and children, check members in by scanning a QR card, check people in to past events and (admins only) export CSV.

**Architecture:**
- **Backend:** a new staff router `/api/attendance`, guarded by a `requireAttendanceStaff` middleware that reads the usher switch from the database on every request. Headcounts live in a new `event_headcounts` table and change with one additive SQL upsert. Card codes are random Crockford-base32 strings on `users.check_in_code`. Admin-only exports and card management stay under `/api/admin/*`.
- **Web:** a new `/check-in` area outside `/admin`.
- **Mobile:** turns the admin attendance screen into a staff `check-in` screen with an `expo-camera` scanner.

**Tech Stack:**
- **Backend:** Express 4, Prisma 6 and PostgreSQL. Migrations are idempotent SQL in `backend/migrations/migrateFeatureUpdates.js`; the schema is mirrored in `backend/prisma/schema.prisma`. Tests use jest and supertest with mocked models.
- **Web:** Next.js 16, React Query, Tailwind tokens, plus the new packages `qrcode` and `@zxing/browser`.
- **Mobile:** Expo SDK 55 and expo-router, plus the new packages `expo-camera`, `react-native-svg` and `react-native-qrcode-svg`.

**Spec:** `docs/superpowers/specs/2026-10-11-attendance-a-checkin-ops-design.md`

## Global Constraints

- **Card codes:** 10 characters from the alphabet `0123456789ABCDEFGHJKMNPQRSTVWXYZ`, generated with `crypto.randomInt`. Up to 5 retries on a unique collision.
- **QR text:** `antpresby:member:<code>`.
- **Ushers:** only staff routes. Exports, the summary, the usher switch, card reset and card printing stay admin-only.
- **Usher switch check:** read from the database on every staff request. Inactive users are refused, and the refusal is 403 `Attendance access required`.
- **Headcount:** deltas of only −1 or +1; counts never go below 0. Total = named (members + guests) + adults + children.
- **CSV:** UTF-8 with a BOM, RFC 4180 quoting, and a `'` prefix on cells starting with `= + - @`, tab or CR.
- **Range export:** at most 366 days; the default is the last 90 days.
- **Check-in body:** exactly one of `userId`, `guestName` or `code`.
- **Error messages:**
  - "Card not recognised" (404)
  - "This member's account is inactive" (403)
  - "This event was cancelled" (409)
  - "Already checked in" (200)
- **Camera permission text:** "Allows ushers to scan member check-in cards."
- **Secrets:** no secrets in any file (standing rule).
- **Line endings:** files may be CRLF. Use the Edit tool for changes and never `String.replace` with `$` in the replacement.

## Review Focus

1. **A scanner that types lowercase, or with surrounding spaces, or a code containing O/I/L instead of 0/1** → it should still check in. Tested in Task 2 (`parseScannedCode`).
2. **An admin demoted to member while still holding an admin JWT** → keeps staff access until the token expires. This matches every other admin route and is accepted. Any member, including a demoted admin, without the switch gets 403. Tested in Task 3.
3. **A late-check-in search for an event in the far future** → excluded beyond 14 days ahead. Tested in Task 4 (`searchCheckInEvents` `to` bound).
4. **CSV names containing commas, quotes, newlines or a leading `=`** → quoted and escaped. Tested in Task 6.
5. **An admin trying to switch the usher setting for themselves or another admin** → 400, nothing changes. Tested in Task 6.

---

## File map

**Backend**
- Modify:
  - `prisma/schema.prisma`
  - `migrations/migrateFeatureUpdates.js`
  - `src/utils/helpers.js` (hide the card code in `sanitizeUser`)
  - `src/models/userModel.js`
  - `src/models/attendanceModel.js`
  - `src/controllers/attendanceController.js`
  - `src/controllers/userController.js`
  - `src/middleware/validators.js`
  - `src/routes/adminAttendanceRoutes.js`
  - `src/routes/adminUserRoutes.js`
  - `src/routes/userRoutes.js`
  - `src/server.js`
- Create:
  - `src/utils/checkInCode.js`
  - `src/utils/csv.js`
  - `src/middleware/attendanceAccess.js`
  - `src/routes/attendanceRoutes.js`
- Tests:
  - `tests/migrations/attendanceOpsMigration.test.js`
  - `tests/utils/checkInCode.test.js`
  - `tests/utils/csv.test.js`
  - `tests/models/checkInCard.test.js`
  - `tests/models/attendanceModel.test.js` (extend)
  - `tests/api/attendanceAccess.test.js`
  - `tests/api/attendance.test.js` (rewrite paths)
  - `tests/api/attendanceExports.test.js`
  - `tests/api/checkInCards.test.js`

**Web**
- Modify:
  - `src/lib/store.ts`
  - `src/hooks/useApi.ts`
  - `src/components/layout/Header.tsx`
  - `src/components/admin/admin-nav.ts`
  - `src/app/admin/attendance/page.tsx`
  - `src/app/admin/attendance/[eventId]/page.tsx` (becomes a redirect)
  - `src/app/admin/users/page.tsx`
  - `src/app/dashboard/page.tsx`
- Create:
  - `src/components/attendance/StaffGuard.tsx`
  - `src/components/attendance/CheckInSheet.tsx`
  - `src/components/attendance/HeadcountCard.tsx`
  - `src/components/attendance/ScanBox.tsx`
  - `src/components/attendance/CameraScanner.tsx`
  - `src/components/attendance/QrCode.tsx`
  - `src/app/check-in/layout.tsx`
  - `src/app/check-in/page.tsx`
  - `src/app/check-in/[eventId]/page.tsx`
  - `src/app/admin/users/cards/page.tsx`

**Mobile**
- Modify:
  - `package.json` and `app.json` (camera plugin)
  - `src/store/auth.ts`
  - `src/hooks/use-api.ts`
  - `src/app/(tabs)/account.tsx`
  - `src/app/admin.tsx` (link)
- Rename: `src/app/admin-attendance.tsx` → `src/app/check-in.tsx`, with headcount and scanner added.
- Create:
  - `src/components/attendance/headcount-card.tsx`
  - `src/components/attendance/card-scanner.tsx`
  - `src/app/check-in-card.tsx`

**Docs**
- Modify `docs/features.md` (Attendance section).

---

### Task 1: Schema, migration and hiding the card code

**Files:**
- Modify:
  - `backend/prisma/schema.prisma`
  - `backend/migrations/migrateFeatureUpdates.js` (before `await client.query('COMMIT');`)
  - `backend/src/utils/helpers.js:70-76`
- Test:
  - `backend/tests/migrations/attendanceOpsMigration.test.js`
  - `backend/tests/utils/sanitizeUser.test.js`

**Interfaces:**
- Produces:
  - columns `users.can_take_attendance` and `users.check_in_code`
  - table `event_headcounts(event_id, adults, children, updated_by, updated_at)`
  - Prisma fields `User.canTakeAttendance`, `User.checkInCode`, model `EventHeadcount` (relation `Event.headcount`)
  - `sanitizeUser` drops `check_in_code`/`checkInCode`

- [ ] **Step 1: Write the failing tests**

`backend/tests/migrations/attendanceOpsMigration.test.js`:
```js
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '../../migrations/migrateFeatureUpdates.js'), 'utf8');

describe('attendance operations migration SQL', () => {
  const commit = source.indexOf("await client.query('COMMIT');");

  test('adds the usher switch and card code to users, before COMMIT', () => {
    const alter = source.indexOf('ADD COLUMN IF NOT EXISTS can_take_attendance BOOLEAN NOT NULL DEFAULT FALSE');
    expect(alter).toBeGreaterThan(-1);
    expect(source).toContain('ADD COLUMN IF NOT EXISTS check_in_code VARCHAR(16)');
    expect(source).toContain('CREATE UNIQUE INDEX IF NOT EXISTS users_check_in_code_key ON users(check_in_code)');
    expect(commit).toBeGreaterThan(alter);
  });

  test('creates event_headcounts with non-negative counts, before COMMIT', () => {
    const table = source.indexOf('CREATE TABLE IF NOT EXISTS event_headcounts (');
    expect(table).toBeGreaterThan(-1);
    expect(source).toContain('event_id INTEGER PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE');
    expect(source).toContain('adults INTEGER NOT NULL DEFAULT 0 CHECK (adults >= 0)');
    expect(source).toContain('children INTEGER NOT NULL DEFAULT 0 CHECK (children >= 0)');
    expect(commit).toBeGreaterThan(table);
  });
});
```

`backend/tests/utils/sanitizeUser.test.js`:
```js
const { sanitizeUser } = require('../../src/utils/helpers');

test('sanitizeUser hides the check-in card code but keeps the usher switch', () => {
  const user = sanitizeUser({ id: 2, password: 'hash', check_in_code: 'ABCDEFGHJK', checkInCode: 'ABCDEFGHJK', can_take_attendance: true });
  expect(user).toEqual({ id: 2, can_take_attendance: true });
});
```

- [ ] **Step 2: Run them to check they fail**

Run: `cd backend && npx jest tests/migrations/attendanceOpsMigration.test.js tests/utils/sanitizeUser.test.js`

Expected: FAIL (the SQL is not found; `check_in_code` is still present).

- [ ] **Step 3: Implement**

In `migrateFeatureUpdates.js`, insert just before `await client.query('COMMIT');`:
```js
    // Attendance operations: usher switch, member check-in cards, headcounts (attendance part A)
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS can_take_attendance BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS check_in_code VARCHAR(16);
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_check_in_code_key ON users(check_in_code);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS event_headcounts (
        event_id INTEGER PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
        adults INTEGER NOT NULL DEFAULT 0 CHECK (adults >= 0),
        children INTEGER NOT NULL DEFAULT 0 CHECK (children >= 0),
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

```

In `schema.prisma`:
- In `model User`, after `isActive`, add:
```prisma
  canTakeAttendance    Boolean             @default(false) @map("can_take_attendance")
  checkInCode          String?             @unique @map("check_in_code") @db.VarChar(16)
```
- In `User`'s relation list, add:
```prisma
  headcountUpdates     EventHeadcount[]
```
- In `model Event`, after `albums`, add:
```prisma
  headcount        EventHeadcount?
```
- After `model AttendanceRecord`, add:
```prisma
model EventHeadcount {
  eventId   Int      @id @map("event_id")
  adults    Int      @default(0)
  children  Int      @default(0)
  updatedBy Int?     @map("updated_by")
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  updater   User?    @relation(fields: [updatedBy], references: [id], onDelete: SetNull)

  @@map("event_headcounts")
}
```

In `helpers.js`, add `'check_in_code'` and `'checkInCode'` to `SENSITIVE_USER_FIELDS`.

- [ ] **Step 4: Run tests and validate the schema**

Run: `cd backend && npx jest tests/migrations tests/utils && npx prisma validate && npx prisma generate`

Expected: PASS, "The schema ... is valid", and the client is generated.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/migrations/migrateFeatureUpdates.js backend/src/utils/helpers.js backend/tests/migrations/attendanceOpsMigration.test.js backend/tests/utils/sanitizeUser.test.js
git commit -m "feat(backend): usher switch, check-in card code and event headcount storage"
```

---

### Task 2: Card codes and user model functions

**Files:**
- Create: `backend/src/utils/checkInCode.js`
- Modify: `backend/src/models/userModel.js` (new functions; add `canTakeAttendance: true` to the `getAllUsers` and `getUserProfile` selects; export the new functions)
- Test:
  - `backend/tests/utils/checkInCode.test.js`
  - `backend/tests/models/checkInCard.test.js`

**Interfaces:**
- Produces in `checkInCode.js`:
  - `generateCheckInCode(): string`
  - `parseScannedCode(value: unknown): string | null`
  - `toQrText(code): string`
  - `CODE_ALPHABET`, `QR_PREFIX`
- Produces in `userModel`:
  - `getAttendanceAccess(userId)` → `{ role, is_active, can_take_attendance } | undefined`
  - `findMemberByCheckInCode(code)` → `{ id, first_name, last_name, is_active } | undefined`
  - `getOrCreateCheckInCode(userId)` → `string | undefined`
  - `resetCheckInCode(userId)` → `string | undefined`
  - `setCanTakeAttendance(userId, enabled)` → `{ id, first_name, last_name, email, role, can_take_attendance } | undefined`
  - `listCheckInCards(ids?: number[])` → `[{ id, first_name, last_name, code, qr_text }]`
  - `searchActiveMembers(search, limit = 20)` → `[{ id, first_name, last_name, email }]`

- [ ] **Step 1: Write the failing tests**

`backend/tests/utils/checkInCode.test.js`:
```js
const { generateCheckInCode, parseScannedCode, toQrText, CODE_ALPHABET } = require('../../src/utils/checkInCode');

describe('check-in card codes', () => {
  test('generates 10 characters from the Crockford alphabet', () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generateCheckInCode();
      expect(code).toHaveLength(10);
      expect([...code].every((ch) => CODE_ALPHABET.includes(ch))).toBe(true);
    }
  });

  test('QR text carries the member prefix', () => {
    expect(toQrText('ABCDEFGHJK')).toBe('antpresby:member:ABCDEFGHJK');
  });

  test.each([
    ['ABCDEFGHJK', 'ABCDEFGHJK'],
    ['  abcdefghjk  ', 'ABCDEFGHJK'],
    ['antpresby:member:abcdefghjk', 'ABCDEFGHJK'],
    ['ANTPRESBY:MEMBER:ABCDEFGHJK', 'ABCDEFGHJK'],
    ['O1234567IL', '0123456711'],
  ])('parses %p', (input, expected) => {
    expect(parseScannedCode(input)).toBe(expected);
  });

  test.each([[''], ['SHORT'], ['ABCDEFGHJKX'], ['ABCDEFGHJU'], [null], [42], ['antpresby:service:ABCDEFGHJK']])(
    'rejects %p',
    (input) => {
      expect(parseScannedCode(input)).toBeNull();
    }
  );
});
```

`backend/tests/models/checkInCard.test.js`:
```js
const buildPrismaMock = () => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
});

const loadModel = (prismaMock) => {
  jest.resetModules();
  jest.doMock('../../src/config/prisma', () => prismaMock);
  return require('../../src/models/userModel');
};

const collision = () => Object.assign(new Error('unique'), { code: 'P2002' });
const missing = () => Object.assign(new Error('missing'), { code: 'P2025' });

describe('check-in card model', () => {
  let prisma;
  let model;

  beforeEach(() => {
    prisma = buildPrismaMock();
    model = loadModel(prisma);
  });

  test('getOrCreateCheckInCode returns an existing code', async () => {
    prisma.user.findUnique.mockResolvedValue({ checkInCode: 'ABCDEFGHJK' });
    await expect(model.getOrCreateCheckInCode(2)).resolves.toBe('ABCDEFGHJK');
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  test('getOrCreateCheckInCode creates one only if still empty, retrying a collision', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ checkInCode: null });
    prisma.user.updateMany.mockRejectedValueOnce(collision()).mockResolvedValueOnce({ count: 1 });
    const code = await model.getOrCreateCheckInCode(2);
    expect(code).toMatch(/^[0-9A-Z]{10}$/);
    expect(prisma.user.updateMany).toHaveBeenCalledTimes(2);
    expect(prisma.user.updateMany.mock.calls[1][0]).toEqual({ where: { id: 2, checkInCode: null }, data: { checkInCode: code } });
  });

  test('getOrCreateCheckInCode returns the winner when another request set it first', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ checkInCode: null }).mockResolvedValueOnce({ checkInCode: 'WINNER0000' });
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(model.getOrCreateCheckInCode(2)).resolves.toBe('WINNER0000');
  });

  test('getOrCreateCheckInCode returns undefined for a missing user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(model.getOrCreateCheckInCode(99)).resolves.toBeUndefined();
  });

  test('getOrCreateCheckInCode gives up after 5 collisions', async () => {
    prisma.user.findUnique.mockResolvedValue({ checkInCode: null });
    prisma.user.updateMany.mockRejectedValue(collision());
    await expect(model.getOrCreateCheckInCode(2)).rejects.toThrow('Could not create a unique check-in code');
    expect(prisma.user.updateMany).toHaveBeenCalledTimes(5);
  });

  test('resetCheckInCode always writes a new code', async () => {
    prisma.user.update.mockResolvedValue({});
    const code = await model.resetCheckInCode(2);
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 2 }, data: { checkInCode: code } });
  });

  test('resetCheckInCode returns undefined for a missing user', async () => {
    prisma.user.update.mockRejectedValue(missing());
    await expect(model.resetCheckInCode(99)).resolves.toBeUndefined();
  });

  test('findMemberByCheckInCode maps the member', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, firstName: 'Ama', lastName: 'Mensah', isActive: true });
    await expect(model.findMemberByCheckInCode('ABCDEFGHJK')).resolves.toEqual({ id: 2, first_name: 'Ama', last_name: 'Mensah', is_active: true });
    expect(prisma.user.findUnique.mock.calls[0][0].where).toEqual({ checkInCode: 'ABCDEFGHJK' });
  });

  test('getAttendanceAccess reads role, active and the usher switch', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'member', isActive: true, canTakeAttendance: true });
    await expect(model.getAttendanceAccess(5)).resolves.toEqual({ role: 'member', is_active: true, can_take_attendance: true });
  });

  test('setCanTakeAttendance updates the switch', async () => {
    prisma.user.update.mockResolvedValue({ id: 5, firstName: 'Kofi', lastName: 'B', email: 'k@t.com', role: 'member', canTakeAttendance: true });
    const user = await model.setCanTakeAttendance(5, true);
    expect(prisma.user.update.mock.calls[0][0].data).toEqual({ canTakeAttendance: true });
    expect(user.can_take_attendance).toBe(true);
  });

  test('listCheckInCards fills missing codes and returns QR text', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 2, firstName: 'Ama', lastName: 'Mensah', checkInCode: 'ABCDEFGHJK' },
      { id: 3, firstName: 'Kofi', lastName: 'Boateng', checkInCode: null },
    ]);
    prisma.user.findUnique.mockResolvedValue({ checkInCode: null });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    const cards = await model.listCheckInCards([2, 3]);
    expect(prisma.user.findMany.mock.calls[0][0].where).toEqual({ isActive: true, id: { in: [2, 3] } });
    expect(cards[0]).toEqual({ id: 2, first_name: 'Ama', last_name: 'Mensah', code: 'ABCDEFGHJK', qr_text: 'antpresby:member:ABCDEFGHJK' });
    expect(cards[1].code).toMatch(/^[0-9A-Z]{10}$/);
  });

  test('searchActiveMembers only returns active members, limited', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 2, firstName: 'Ama', lastName: 'Mensah', email: 'a@t.com' }]);
    const rows = await model.searchActiveMembers('ama', 20);
    const args = prisma.user.findMany.mock.calls[0][0];
    expect(args.where.isActive).toBe(true);
    expect(args.take).toBe(20);
    expect(rows).toEqual([{ id: 2, first_name: 'Ama', last_name: 'Mensah', email: 'a@t.com' }]);
  });
});
```

- [ ] **Step 2: Run them to check they fail**

Run: `cd backend && npx jest tests/utils/checkInCode.test.js tests/models/checkInCard.test.js`

Expected: FAIL (the module and functions are not found).

- [ ] **Step 3: Implement**

`backend/src/utils/checkInCode.js`:
```js
const crypto = require('crypto');

// Crockford base32: no I, L, O or U, so codes are easy to read aloud and type.
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LENGTH = 10;
const QR_PREFIX = 'antpresby:member:';
const CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

const generateCheckInCode = () =>
  Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('');

const toQrText = (code) => `${QR_PREFIX}${code}`;

// Accepts a raw code or the full QR text from a scanner; returns the normalised code or null.
const parseScannedCode = (value) => {
  if (typeof value !== 'string') return null;
  let text = value.trim();
  if (text.toLowerCase().startsWith(QR_PREFIX)) text = text.slice(QR_PREFIX.length);
  const code = text.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');
  return CODE_PATTERN.test(code) ? code : null;
};

module.exports = { CODE_ALPHABET, QR_PREFIX, generateCheckInCode, parseScannedCode, toQrText };
```

In `userModel.js`, add `const { generateCheckInCode, toQrText } = require('../utils/checkInCode');` at the top, then add these functions before `module.exports` and export each one:
```js
const MAX_CODE_ATTEMPTS = 5;
const isUniqueViolation = (error) => error?.code === 'P2002';
const isMissingRecord = (error) => error?.code === 'P2025';

// Who may take attendance: read fresh on every staff request so switching it off works at once.
const getAttendanceAccess = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { role: true, isActive: true, canTakeAttendance: true },
  });
  return user ? { role: user.role, is_active: user.isActive, can_take_attendance: user.canTakeAttendance } : undefined;
};

const findMemberByCheckInCode = async (code) => {
  const user = await prisma.user.findUnique({
    where: { checkInCode: code },
    select: { id: true, firstName: true, lastName: true, isActive: true },
  });
  return user ? { id: user.id, first_name: user.firstName, last_name: user.lastName, is_active: user.isActive } : undefined;
};

// Creates the member's card code the first time it is needed. Only fills an empty code, so two
// concurrent requests agree on one code; a collision with another member's code retries.
const getOrCreateCheckInCode = async (userId) => {
  const id = Number(userId);
  const existing = await prisma.user.findUnique({ where: { id }, select: { checkInCode: true } });
  if (!existing) return undefined;
  if (existing.checkInCode) return existing.checkInCode;

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = generateCheckInCode();
    try {
      const { count } = await prisma.user.updateMany({ where: { id, checkInCode: null }, data: { checkInCode: code } });
      if (count === 1) return code;
      const winner = await prisma.user.findUnique({ where: { id }, select: { checkInCode: true } });
      return winner?.checkInCode ?? undefined;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new Error('Could not create a unique check-in code');
};

const resetCheckInCode = async (userId) => {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = generateCheckInCode();
    try {
      await prisma.user.update({ where: { id: Number(userId) }, data: { checkInCode: code } });
      return code;
    } catch (error) {
      if (isMissingRecord(error)) return undefined;
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new Error('Could not create a unique check-in code');
};

const setCanTakeAttendance = async (userId, enabled) => {
  try {
    const user = await prisma.user.update({
      where: { id: Number(userId) },
      data: { canTakeAttendance: Boolean(enabled) },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, canTakeAttendance: true },
    });
    return toSnakeCaseObject(user);
  } catch (error) {
    if (isMissingRecord(error)) return undefined;
    throw error;
  }
};

const listCheckInCards = async (ids) => {
  const where = { isActive: true };
  if (Array.isArray(ids) && ids.length > 0) where.id = { in: ids };

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take: 1000,
    select: { id: true, firstName: true, lastName: true, checkInCode: true },
  });

  const cards = [];
  for (const user of users) {
    const code = user.checkInCode || (await getOrCreateCheckInCode(user.id));
    cards.push({ id: user.id, first_name: user.firstName, last_name: user.lastName, code, qr_text: toQrText(code) });
  }
  return cards;
};

// Name or email lookup for ushers: active members only, contact details kept to name and email.
const searchActiveMembers = async (search, limit = 20) => {
  const users = await prisma.user.findMany({
    where: { ...buildUserSearchWhere(search), isActive: true },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    take: Number(limit),
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  return users.map((user) => ({ id: user.id, first_name: user.firstName, last_name: user.lastName, email: user.email }));
};
```

Add `canTakeAttendance: true,` to the `select` in `getAllUsers` (after `isActive: true,`) and in `getUserProfile` (after `role: true,`).

- [ ] **Step 4: Run the tests**

Run: `cd backend && npx jest tests/utils/checkInCode.test.js tests/models/checkInCard.test.js tests/models/userSearch.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/utils/checkInCode.js backend/src/models/userModel.js backend/tests/utils/checkInCode.test.js backend/tests/models/checkInCard.test.js
git commit -m "feat(backend): member check-in card codes and usher lookups"
```

---

### Task 3: The `requireAttendanceStaff` middleware

**Files:**
- Create: `backend/src/middleware/attendanceAccess.js`
- Test: `backend/tests/api/attendanceAccess.test.js`

**Interfaces:**
- Consumes: `userModel.getAttendanceAccess(userId)`
- Produces: `requireAttendanceStaff(req, res, next)`, used after `verifyToken`. Admin → next. An active member with the switch → next. Otherwise 403 `apiResponse(false, null, 'Attendance access required')`.

- [ ] **Step 1: Write the failing test**

```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
const as = (userId, role) => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET)}`;

describe('requireAttendanceStaff', () => {
  let userModel;
  let app;

  beforeEach(() => {
    jest.resetModules();
    userModel = { getAttendanceAccess: jest.fn() };
    jest.doMock('../../src/models/userModel', () => userModel);
    const { verifyToken } = require('../../src/middleware/authMiddleware');
    const { requireAttendanceStaff } = require('../../src/middleware/attendanceAccess');
    app = express();
    app.get('/staff', verifyToken, requireAttendanceStaff, (req, res) => res.json({ ok: true }));
  });

  test('admins pass without a database lookup', async () => {
    const response = await request(app).get('/staff').set('Authorization', as(1, 'admin'));
    expect(response.status).toBe(200);
    expect(userModel.getAttendanceAccess).not.toHaveBeenCalled();
  });

  test('an active usher passes', async () => {
    userModel.getAttendanceAccess.mockResolvedValue({ role: 'member', is_active: true, can_take_attendance: true });
    const response = await request(app).get('/staff').set('Authorization', as(5, 'member'));
    expect(response.status).toBe(200);
    expect(userModel.getAttendanceAccess).toHaveBeenCalledWith(5);
  });

  test.each([
    ['without the switch', { role: 'member', is_active: true, can_take_attendance: false }],
    ['inactive', { role: 'member', is_active: false, can_take_attendance: true }],
    ['deleted', undefined],
  ])('a member %s gets 403', async (_label, access) => {
    userModel.getAttendanceAccess.mockResolvedValue(access);
    const response = await request(app).get('/staff').set('Authorization', as(5, 'member'));
    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Attendance access required');
  });

  test('switching the usher setting off takes effect on the next request', async () => {
    userModel.getAttendanceAccess
      .mockResolvedValueOnce({ role: 'member', is_active: true, can_take_attendance: true })
      .mockResolvedValueOnce({ role: 'member', is_active: true, can_take_attendance: false });
    expect((await request(app).get('/staff').set('Authorization', as(5, 'member'))).status).toBe(200);
    expect((await request(app).get('/staff').set('Authorization', as(5, 'member'))).status).toBe(403);
  });

  test('no token gets 401', async () => {
    expect((await request(app).get('/staff')).status).toBe(401);
  });
});
```

- [ ] **Step 2: Run it to check it fails**

Run: `cd backend && npx jest tests/api/attendanceAccess.test.js`

Expected: FAIL (cannot find module `attendanceAccess`).

- [ ] **Step 3: Implement** `backend/src/middleware/attendanceAccess.js`:
```js
const userModel = require('../models/userModel');
const { apiResponse } = require('../utils/helpers');

// Admins, and members whose "Can take attendance" switch is on. The switch is read from the
// database on every request (not the token), so turning it off takes effect immediately.
const requireAttendanceStaff = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (req.user.role === 'admin') {
      return next();
    }

    const access = await userModel.getAttendanceAccess(req.user.userId);
    if (access && access.is_active && access.can_take_attendance) {
      return next();
    }

    return res.status(403).json(apiResponse(false, null, 'Attendance access required'));
  } catch (error) {
    return next(error);
  }
};

module.exports = { requireAttendanceStaff };
```

- [ ] **Step 4: Run it** (same command). Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/middleware/attendanceAccess.js backend/tests/api/attendanceAccess.test.js
git commit -m "feat(backend): attendance staff access for admins and ushers"
```

---

### Task 4: Attendance model (headcount, totals, late-check-in search, export queries)

**Files:**
- Modify: `backend/src/models/attendanceModel.js`
- Test: `backend/tests/models/attendanceModel.test.js` (extend)

**Interfaces:**
- Produces:
  - `buildAttendanceSummary(event)`. It now returns `headcount: { adults, children }` and `totals: { registered, checked_in_members, guests, named, adults, children, total }`. `event.headcount` may be null.
  - `adjustHeadcount({ eventId, adults, children, updatedBy })` → `{ adults, children }`. The deltas are −1, 0 or 1.
  - `searchCheckInEvents({ q, to })` → `[{ id, name, event_date, location, status }]`
  - `toSummaryRow(event)` → adds `named`, `adults`, `children`; `total` includes the counts.
  - `getEventExport(eventId)` → `{ event: { id, name, event_date }, rows: [{ type, name, email, checked_in_at, checked_in_by }], headcount: { adults, children } } | undefined`
  - `getRangeExport({ from, to })` → summary rows (the `toSummaryRow` shape), oldest first. `from` is inclusive and `to` exclusive.

- [ ] **Step 1: Write the failing tests** (append to `tests/models/attendanceModel.test.js`; add `$queryRaw: jest.fn()` and `event: { findMany: jest.fn(), findUnique: jest.fn() }` to `buildPrismaMock`):

```js
describe('headcounts in the sheet', () => {
  const { buildAttendanceSummary } = loadModel(buildPrismaMock());

  test('totals add named check-ins and counted people', () => {
    const summary = buildAttendanceSummary({ ...event, headcount: { adults: 150, children: 24 } });
    expect(summary.headcount).toEqual({ adults: 150, children: 24 });
    expect(summary.totals).toEqual({ registered: 2, checked_in_members: 2, guests: 1, named: 3, adults: 150, children: 24, total: 177 });
  });

  test('no headcount row counts as zero', () => {
    const summary = buildAttendanceSummary({ ...event, headcount: null });
    expect(summary.headcount).toEqual({ adults: 0, children: 0 });
    expect(summary.totals.total).toBe(3);
  });
});

describe('adjustHeadcount', () => {
  test('uses one additive upsert that never goes below zero', async () => {
    const prisma = buildPrismaMock();
    prisma.$queryRaw.mockResolvedValue([{ adults: 5, children: 0 }]);
    const { adjustHeadcount } = loadModel(prisma);

    await expect(adjustHeadcount({ eventId: 7, adults: 1, updatedBy: 3 })).resolves.toEqual({ adults: 5, children: 0 });

    const [strings, ...values] = prisma.$queryRaw.mock.calls[0];
    const sql = strings.join('$');
    expect(sql).toContain('INSERT INTO event_headcounts');
    expect(sql).toContain('ON CONFLICT (event_id) DO UPDATE');
    expect(sql).toContain('GREATEST(event_headcounts.adults +');
    expect(sql).toContain('GREATEST(event_headcounts.children +');
    expect(values).toEqual([7, 1, 0, 3, 1, 0]);
  });
});

describe('searchCheckInEvents', () => {
  test('matches names case-insensitively up to the future bound, newest first', async () => {
    const prisma = buildPrismaMock();
    prisma.event.findMany.mockResolvedValue([]);
    const { searchCheckInEvents } = loadModel(prisma);
    const to = new Date('2026-10-25T00:00:00Z');

    await searchCheckInEvents({ q: 'harvest', to });

    const args = prisma.event.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ name: { contains: 'harvest', mode: 'insensitive' }, eventDate: { lte: to } });
    expect(args.orderBy).toEqual({ eventDate: 'desc' });
    expect(args.take).toBe(50);
  });
});

describe('toSummaryRow', () => {
  const { toSummaryRow } = loadModel(buildPrismaMock());

  test('includes counted people in the total', () => {
    const row = toSummaryRow({
      id: 7, name: 'Sunday Service', eventDate: at, _count: { registrations: 4 },
      attendance: [{ userId: 2 }, { userId: null }], headcount: { adults: 10, children: 3 },
    });
    expect(row).toEqual({ event_id: 7, name: 'Sunday Service', event_date: at, registered: 4, members: 1, guests: 1, named: 2, adults: 10, children: 3, total: 15 });
  });
});

describe('getEventExport', () => {
  test('lists members and guests with who checked them in', async () => {
    const prisma = buildPrismaMock();
    prisma.event.findUnique.mockResolvedValue({
      id: 7, name: 'Sunday Service', eventDate: at, headcount: { adults: 2, children: 1 },
      attendance: [
        { userId: 2, guestName: null, checkedInAt: at, user: ama, checker: { firstName: 'Usher', lastName: 'One' } },
        { userId: null, guestName: 'Visitor Esi', checkedInAt: at, user: null, checker: null },
      ],
    });
    const { getEventExport } = loadModel(prisma);

    await expect(getEventExport(7)).resolves.toEqual({
      event: { id: 7, name: 'Sunday Service', event_date: at },
      headcount: { adults: 2, children: 1 },
      rows: [
        { type: 'Member', name: 'Ama Mensah', email: 'ama@test.com', checked_in_at: at, checked_in_by: 'Usher One' },
        { type: 'Guest', name: 'Visitor Esi', email: '', checked_in_at: at, checked_in_by: '' },
      ],
    });
  });

  test('a missing event returns undefined', async () => {
    const prisma = buildPrismaMock();
    prisma.event.findUnique.mockResolvedValue(null);
    await expect(loadModel(prisma).getEventExport(9)).resolves.toBeUndefined();
  });
});

describe('getRangeExport', () => {
  test('queries the range oldest first', async () => {
    const prisma = buildPrismaMock();
    prisma.event.findMany.mockResolvedValue([]);
    const from = new Date('2026-07-01T00:00:00Z');
    const to = new Date('2026-10-01T00:00:00Z');
    await loadModel(prisma).getRangeExport({ from, to });
    const args = prisma.event.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ eventDate: { gte: from, lt: to } });
    expect(args.orderBy).toEqual({ eventDate: 'asc' });
  });
});
```

- [ ] **Step 2: Run them to check they fail**

Run: `cd backend && npx jest tests/models/attendanceModel.test.js`

Expected: FAIL.

- [ ] **Step 3: Implement** in `attendanceModel.js`:
- Add a `toHeadcount` helper and use it in `buildAttendanceSummary`:
```js
const toHeadcount = (row) => ({ adults: row?.adults ?? 0, children: row?.children ?? 0 });
```
- In `buildAttendanceSummary`, replace the return's `totals` block and add `headcount`:
```js
  const headcount = toHeadcount(event.headcount);
  const named = memberRecords.size + guests.length;
  // ...existing event, registered, walk_in_members, guests...
    headcount,
    totals: {
      registered: registered.length,
      checked_in_members: memberRecords.size,
      guests: guests.length,
      named,
      adults: headcount.adults,
      children: headcount.children,
      total: named + headcount.adults + headcount.children,
    },
```
- In `getEventAttendance`'s select, add `headcount: { select: { adults: true, children: true } },`.
- Replace `toSummaryRow`:
```js
const toSummaryRow = (event) => {
  const members = event.attendance.filter((record) => record.userId !== null).length;
  const named = event.attendance.length;
  const { adults, children } = toHeadcount(event.headcount);
  return {
    event_id: event.id,
    name: event.name,
    event_date: event.eventDate,
    registered: event._count.registrations,
    members,
    guests: named - members,
    named,
    adults,
    children,
    total: named + adults + children,
  };
};

const summarySelect = {
  id: true,
  name: true,
  eventDate: true,
  _count: { select: { registrations: true } },
  attendance: { select: { userId: true } },
  headcount: { select: { adults: true, children: true } },
};
```
- Use `select: summarySelect` in `getAttendanceSummary`.
- Add:
```js
// One statement, so taps from several ushers at once all count; GREATEST keeps counts at 0 or more.
const adjustHeadcount = async ({ eventId, adults = 0, children = 0, updatedBy = null }) => {
  const [row] = await prisma.$queryRaw`
    INSERT INTO event_headcounts (event_id, adults, children, updated_by, updated_at)
    VALUES (${eventId}, GREATEST(${adults}::int, 0), GREATEST(${children}::int, 0), ${updatedBy}, NOW())
    ON CONFLICT (event_id) DO UPDATE SET
      adults = GREATEST(event_headcounts.adults + ${adults}::int, 0),
      children = GREATEST(event_headcounts.children + ${children}::int, 0),
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW()
    RETURNING adults, children`;
  return { adults: Number(row.adults), children: Number(row.children) };
};

// Late check-in: any past event by name, up to the normal future window.
const searchCheckInEvents = async ({ q, to }) => {
  const events = await prisma.event.findMany({
    where: { name: { contains: q, mode: 'insensitive' }, eventDate: { lte: to } },
    orderBy: { eventDate: 'desc' },
    take: 50,
    select: { id: true, name: true, eventDate: true, location: true, status: true },
  });
  return toSnakeCaseObject(events);
};

const nameOf = (person) => (person ? `${person.firstName || ''} ${person.lastName || ''}`.trim() : '');

const getEventExport = async (eventId) => {
  const event = await prisma.event.findUnique({
    where: { id: Number(eventId) },
    select: {
      id: true,
      name: true,
      eventDate: true,
      headcount: { select: { adults: true, children: true } },
      attendance: {
        orderBy: { checkedInAt: 'asc' },
        select: {
          userId: true,
          guestName: true,
          checkedInAt: true,
          user: { select: personSelect },
          checker: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });
  if (!event) return undefined;

  return {
    event: { id: event.id, name: event.name, event_date: event.eventDate },
    headcount: toHeadcount(event.headcount),
    rows: event.attendance.map((record) => ({
      type: record.userId ? 'Member' : 'Guest',
      name: record.userId ? nameOf(record.user) : record.guestName,
      email: record.user?.email || '',
      checked_in_at: record.checkedInAt,
      checked_in_by: nameOf(record.checker),
    })),
  };
};

const getRangeExport = async ({ from, to }) => {
  const events = await prisma.event.findMany({
    where: { eventDate: { gte: from, lt: to } },
    orderBy: { eventDate: 'asc' },
    take: 2000,
    select: summarySelect,
  });
  return events.map(toSummaryRow);
};
```
- Export `adjustHeadcount`, `searchCheckInEvents`, `getEventExport` and `getRangeExport`.

- [ ] **Step 4: Run the tests** (same command). Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/attendanceModel.js backend/tests/models/attendanceModel.test.js
git commit -m "feat(backend): headcounts, late-check-in search and export queries"
```

---

### Task 5: Staff attendance routes (`/api/attendance`)

**Files:**
- Create: `backend/src/routes/attendanceRoutes.js`
- Modify:
  - `backend/src/controllers/attendanceController.js`
  - `backend/src/middleware/validators.js` (`validateCheckIn`, a new `validateHeadcount`)
  - `backend/src/routes/adminAttendanceRoutes.js` (remove the check-in routes)
  - `backend/src/server.js`
- Test: `backend/tests/api/attendance.test.js` (rewrite onto the new paths)

**Interfaces:**
- Consumes:
  - `requireAttendanceStaff`
  - `parseScannedCode`
  - `userModel.findMemberByCheckInCode` and `searchActiveMembers`
  - `attendanceModel.adjustHeadcount` and `searchCheckInEvents`
- Produces these routes (JSON uses `apiResponse`):
  - `GET /api/attendance/events[?q]`
  - `GET /api/attendance/events/:eventId`
  - `POST /api/attendance/events/:eventId/check-in` with `{userId}|{guestName}|{code}` → data includes `member: { first_name, last_name }` for members
  - `POST /api/attendance/events/:eventId/headcount` with `{adults?, children?}` → `{ adults, children }`
  - `DELETE /api/attendance/records/:id`
  - `GET /api/attendance/members?q=` → max 20 `{id, first_name, last_name, email}`

- [ ] **Step 1: Rewrite the API test**

Replace `backend/tests/api/attendance.test.js` with:
```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const tokenFor = (userId, role) => jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET);
const admin = () => `Bearer ${tokenFor(1, 'admin')}`;
const usher = () => `Bearer ${tokenFor(5, 'member')}`;

const buildModels = () => ({
  attendanceModel: {
    getEventAttendance: jest.fn().mockResolvedValue({ event: { id: 7 }, totals: { total: 0 } }),
    findEventForCheckIn: jest.fn().mockResolvedValue({ id: 7, status: 'active' }),
    checkInMember: jest.fn().mockResolvedValue({ record: { id: 20, user_id: 2 }, created: true }),
    checkInGuest: jest.fn().mockResolvedValue({ id: 21, guest_name: 'Visitor Esi' }),
    deleteRecord: jest.fn().mockResolvedValue({ id: 20, event_id: 7 }),
    getAttendanceSummary: jest.fn().mockResolvedValue([]),
    listCheckInEvents: jest.fn().mockResolvedValue([]),
    searchCheckInEvents: jest.fn().mockResolvedValue([]),
    adjustHeadcount: jest.fn().mockResolvedValue({ adults: 1, children: 0 }),
  },
  userModel: {
    findUserById: jest.fn().mockResolvedValue({ id: 2, first_name: 'Ama', last_name: 'Mensah', is_active: true }),
    getAttendanceAccess: jest.fn().mockResolvedValue({ role: 'member', is_active: true, can_take_attendance: true }),
    findMemberByCheckInCode: jest.fn().mockResolvedValue({ id: 2, first_name: 'Ama', last_name: 'Mensah', is_active: true }),
    searchActiveMembers: jest.fn().mockResolvedValue([{ id: 2, first_name: 'Ama', last_name: 'Mensah', email: 'a@t.com' }]),
  },
  auditLogModel: { createAuditLog: jest.fn().mockResolvedValue({}) },
});

const buildApp = (models) => {
  jest.resetModules();
  jest.doMock('../../src/models/attendanceModel', () => models.attendanceModel);
  jest.doMock('../../src/models/userModel', () => models.userModel);
  jest.doMock('../../src/models/auditLogModel', () => models.auditLogModel);

  const app = express();
  app.use(express.json());
  app.use('/api/attendance', require('../../src/routes/attendanceRoutes'));
  app.use('/api/admin/attendance', require('../../src/routes/adminAttendanceRoutes'));
  const { errorHandler } = require('../../src/middleware/errorHandler');
  app.use(errorHandler);
  return app;
};

describe('Staff attendance API', () => {
  let models;
  let app;
  const checkIn = (body, eventId = 7, auth = admin()) =>
    request(app).post(`/api/attendance/events/${eventId}/check-in`).set('Authorization', auth).send(body);
  const headcount = (body, eventId = 7, auth = usher()) =>
    request(app).post(`/api/attendance/events/${eventId}/headcount`).set('Authorization', auth).send(body);

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('members without the usher switch cannot use attendance', async () => {
    models.userModel.getAttendanceAccess.mockResolvedValue({ role: 'member', is_active: true, can_take_attendance: false });
    const response = await request(app).get('/api/attendance/events/7').set('Authorization', usher());
    expect(response.status).toBe(403);
  });

  test('an usher can open a sheet', async () => {
    const response = await request(app).get('/api/attendance/events/7').set('Authorization', usher());
    expect(response.status).toBe(200);
    expect(models.attendanceModel.getEventAttendance).toHaveBeenCalledWith(7);
  });

  test('an usher cannot use the admin summary', async () => {
    const response = await request(app).get('/api/admin/attendance/summary').set('Authorization', usher());
    expect(response.status).toBe(403);
  });

  test('the old admin check-in route is gone', async () => {
    const response = await request(app).post('/api/admin/attendance/events/7/check-in').set('Authorization', admin()).send({ guestName: 'X' });
    expect(response.status).toBe(404);
  });

  describe('GET /events', () => {
    test('without q lists the two-week window', async () => {
      await request(app).get('/api/attendance/events').set('Authorization', usher());
      expect(models.attendanceModel.listCheckInEvents).toHaveBeenCalled();
      expect(models.attendanceModel.searchCheckInEvents).not.toHaveBeenCalled();
    });

    test('with q searches all past events', async () => {
      await request(app).get('/api/attendance/events?q=%20harvest%20').set('Authorization', usher());
      const args = models.attendanceModel.searchCheckInEvents.mock.calls[0][0];
      expect(args.q).toBe('harvest');
      expect(args.to.getTime()).toBeGreaterThan(Date.now());
    });

    test('a one-letter q falls back to the window', async () => {
      await request(app).get('/api/attendance/events?q=h').set('Authorization', usher());
      expect(models.attendanceModel.searchCheckInEvents).not.toHaveBeenCalled();
    });
  });

  describe('GET /events/:eventId', () => {
    test('a missing event returns 404', async () => {
      models.attendanceModel.getEventAttendance.mockResolvedValue(undefined);
      expect((await request(app).get('/api/attendance/events/99').set('Authorization', admin())).status).toBe(404);
    });

    test('a malformed id returns 404 without querying', async () => {
      expect((await request(app).get('/api/attendance/events/abc').set('Authorization', admin())).status).toBe(404);
      expect(models.attendanceModel.getEventAttendance).not.toHaveBeenCalled();
    });
  });

  describe('POST /events/:eventId/check-in', () => {
    test('checks a member in by id with 201, names them and audits it', async () => {
      const response = await checkIn({ userId: 2 });
      expect(response.status).toBe(201);
      expect(response.body.data.member).toEqual({ first_name: 'Ama', last_name: 'Mensah' });
      expect(models.attendanceModel.checkInMember).toHaveBeenCalledWith({ eventId: 7, userId: 2, checkedInBy: 1 });
      expect(models.auditLogModel.createAuditLog).toHaveBeenCalled();
    });

    test('records which usher checked someone in', async () => {
      await checkIn({ userId: 2 }, 7, usher());
      expect(models.attendanceModel.checkInMember).toHaveBeenCalledWith({ eventId: 7, userId: 2, checkedInBy: 5 });
    });

    test('a repeat check-in returns 200 without a new audit entry', async () => {
      models.attendanceModel.checkInMember.mockResolvedValue({ record: { id: 20 }, created: false });
      const response = await checkIn({ userId: 2 });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Already checked in');
      expect(models.auditLogModel.createAuditLog).not.toHaveBeenCalled();
    });

    test('checks a member in by scanned card', async () => {
      const response = await checkIn({ code: 'antpresby:member:abcdefghjk' }, 7, usher());
      expect(response.status).toBe(201);
      expect(models.userModel.findMemberByCheckInCode).toHaveBeenCalledWith('ABCDEFGHJK');
      expect(response.body.data.member).toEqual({ first_name: 'Ama', last_name: 'Mensah' });
      expect(models.auditLogModel.createAuditLog.mock.calls[0][0].metadata).toEqual({ eventId: 7, method: 'code' });
    });

    test('an unknown or reset card returns 404 Card not recognised', async () => {
      models.userModel.findMemberByCheckInCode.mockResolvedValue(undefined);
      const response = await checkIn({ code: 'ABCDEFGHJK' });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Card not recognised');
    });

    test('a malformed card returns 404 without a lookup', async () => {
      const response = await checkIn({ code: 'not-a-card' });
      expect(response.status).toBe(404);
      expect(models.userModel.findMemberByCheckInCode).not.toHaveBeenCalled();
    });

    test("an inactive member's card returns 403", async () => {
      models.userModel.findMemberByCheckInCode.mockResolvedValue({ id: 2, first_name: 'Ama', last_name: 'Mensah', is_active: false });
      const response = await checkIn({ code: 'ABCDEFGHJK' });
      expect(response.status).toBe(403);
      expect(response.body.message).toBe("This member's account is inactive");
    });

    test('a scanned card already checked in returns 200', async () => {
      models.attendanceModel.checkInMember.mockResolvedValue({ record: { id: 20 }, created: false });
      expect((await checkIn({ code: 'ABCDEFGHJK' })).status).toBe(200);
    });

    test('checks a guest in with a trimmed name', async () => {
      const response = await checkIn({ guestName: '  Visitor Esi  ' });
      expect(response.status).toBe(201);
      expect(models.attendanceModel.checkInGuest).toHaveBeenCalledWith({ eventId: 7, guestName: 'Visitor Esi', checkedInBy: 1 });
    });

    test.each([[{}], [{ userId: 2, guestName: 'X' }], [{ userId: 2, code: 'ABCDEFGHJK' }], [{ guestName: 'X', code: 'ABCDEFGHJK' }], [{ guestName: '   ' }]])(
      'rejects body %p with 400',
      async (body) => {
        expect((await checkIn(body)).status).toBe(400);
      }
    );

    test('a cancelled event returns 409', async () => {
      models.attendanceModel.findEventForCheckIn.mockResolvedValue({ id: 7, status: 'cancelled' });
      expect((await checkIn({ userId: 2 })).status).toBe(409);
    });

    test('a missing member returns 404', async () => {
      models.userModel.findUserById.mockResolvedValue(undefined);
      expect((await checkIn({ userId: 2 })).status).toBe(404);
    });
  });

  describe('POST /events/:eventId/headcount', () => {
    test('adds one adult and audits it', async () => {
      const response = await headcount({ adults: 1 });
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ adults: 1, children: 0 });
      expect(models.attendanceModel.adjustHeadcount).toHaveBeenCalledWith({ eventId: 7, adults: 1, children: 0, updatedBy: 5 });
      expect(models.auditLogModel.createAuditLog.mock.calls[0][0].action).toBe('headcount_change');
    });

    test('removes one child', async () => {
      await headcount({ children: -1 });
      expect(models.attendanceModel.adjustHeadcount).toHaveBeenCalledWith({ eventId: 7, adults: 0, children: -1, updatedBy: 5 });
    });

    test.each([[{}], [{ adults: 2 }], [{ adults: 0 }], [{ children: 'one' }], [{ adults: 0, children: 0 }]])('rejects %p with 400', async (body) => {
      expect((await headcount(body)).status).toBe(400);
    });

    test('a cancelled event returns 409', async () => {
      models.attendanceModel.findEventForCheckIn.mockResolvedValue({ id: 7, status: 'cancelled' });
      expect((await headcount({ adults: 1 })).status).toBe(409);
    });

    test('a missing event returns 404', async () => {
      models.attendanceModel.findEventForCheckIn.mockResolvedValue(null);
      expect((await headcount({ adults: 1 })).status).toBe(404);
    });
  });

  describe('DELETE /records/:id', () => {
    test('undoes a check-in and audits it', async () => {
      const response = await request(app).delete('/api/attendance/records/20').set('Authorization', usher());
      expect(response.status).toBe(200);
      expect(models.attendanceModel.deleteRecord).toHaveBeenCalledWith(20);
    });

    test('a missing record returns 404', async () => {
      models.attendanceModel.deleteRecord.mockResolvedValue(undefined);
      expect((await request(app).delete('/api/attendance/records/99').set('Authorization', admin())).status).toBe(404);
    });
  });

  describe('GET /members', () => {
    test('searches active members with a trimmed term, max 20', async () => {
      const response = await request(app).get('/api/attendance/members?q=%20ama%20').set('Authorization', usher());
      expect(response.status).toBe(200);
      expect(models.userModel.searchActiveMembers).toHaveBeenCalledWith('ama', 20);
    });

    test('a term under 2 letters returns an empty list', async () => {
      const response = await request(app).get('/api/attendance/members?q=a').set('Authorization', usher());
      expect(response.body.data).toEqual([]);
      expect(models.userModel.searchActiveMembers).not.toHaveBeenCalled();
    });
  });

  test('GET /api/admin/attendance/summary still works for admins', async () => {
    expect((await request(app).get('/api/admin/attendance/summary').set('Authorization', admin())).status).toBe(200);
  });
});
```

- [ ] **Step 2: Run it to check it fails**

Run: `cd backend && npx jest tests/api/attendance.test.js`

Expected: FAIL (cannot find module `attendanceRoutes`).

- [ ] **Step 3: Implement**

`validators.js`: replace `validateCheckIn`, and add and export `validateHeadcount`:
```js
const validateCheckIn = [
  body('userId').optional({ values: 'null' }).isInt({ min: 1, max: MAX_DB_ID }).withMessage('userId must be a positive integer'),
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
  body('code').optional({ values: 'null' }).isString().withMessage('Card code must be text').bail().isLength({ max: 64 }),
  body().custom((value) => {
    const sent = ['userId', 'guestName', 'code'].filter((key) => value?.[key] !== undefined && value?.[key] !== null);
    if (sent.length !== 1) {
      throw new Error('Send exactly one of userId, guestName or code');
    }
    return true;
  }),
];

const HEADCOUNT_STEP = [-1, 1];
const validateHeadcount = [
  body('adults').optional().custom((v) => HEADCOUNT_STEP.includes(v)).withMessage('adults must be -1 or 1'),
  body('children').optional().custom((v) => HEADCOUNT_STEP.includes(v)).withMessage('children must be -1 or 1'),
  body().custom((value) => {
    if (value?.adults === undefined && value?.children === undefined) {
      throw new Error('Send adults or children');
    }
    return true;
  }),
];
```

`attendanceController.js`:
- Change the top comment to `Attendance Controller (staff: admins and ushers; exports admin only)`.
- Add `const { parseScannedCode } = require('../utils/checkInCode');`.
- Replace `listCheckInEvents`:
```js
const listCheckInEvents = async (req, res, next) => {
  try {
    const now = Date.now();
    const to = new Date(now + CHECK_IN_WINDOW_DAYS * DAY_MS);
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const events =
      q.length >= 2
        ? await attendanceModel.searchCheckInEvents({ q, to })
        : await attendanceModel.listCheckInEvents({ from: new Date(now - CHECK_IN_WINDOW_DAYS * DAY_MS), to });

    res.json(apiResponse(true, events, 'Check-in events retrieved'));
  } catch (error) {
    next(error);
  }
};
```
- Add a shared event check, and replace `checkIn`:
```js
// The event must exist and not be cancelled before anyone is checked in or counted.
const loadOpenEvent = async (req, res) => {
  const eventId = parseId(req.params.eventId);
  const event = eventId ? await attendanceModel.findEventForCheckIn(eventId) : null;
  if (!event) {
    notFound(res, 'Event not found');
    return null;
  }
  if (event.status === 'cancelled') {
    res.status(409).json(apiResponse(false, null, 'This event was cancelled'));
    return null;
  }
  return eventId;
};

const respondMemberCheckIn = async (req, res, { eventId, member, method }) => {
  const { record, created } = await attendanceModel.checkInMember({ eventId, userId: member.id, checkedInBy: req.user.userId });
  if (created) {
    const how = method === 'code' ? ' by card' : '';
    await audit(req, 'check_in', record.id, `Checked in member #${member.id} to event #${eventId}${how}`, method === 'code' ? { eventId, method } : { eventId });
  }
  const data = { ...record, member: { first_name: member.first_name, last_name: member.last_name } };
  return res.status(created ? 201 : 200).json(apiResponse(true, data, created ? 'Checked in' : 'Already checked in'));
};

// Check in a member ({ userId }), a scanned card ({ code }) or a walk-in guest ({ guestName })
const checkIn = async (req, res, next) => {
  try {
    const eventId = await loadOpenEvent(req, res);
    if (!eventId) return undefined;

    const { userId, guestName, code } = req.body;

    if (code !== undefined && code !== null) {
      const parsed = parseScannedCode(code);
      const member = parsed ? await userModel.findMemberByCheckInCode(parsed) : undefined;
      if (!member) return notFound(res, 'Card not recognised');
      if (!member.is_active) {
        return res.status(403).json(apiResponse(false, null, "This member's account is inactive"));
      }
      return respondMemberCheckIn(req, res, { eventId, member, method: 'code' });
    }

    if (userId !== undefined && userId !== null) {
      const member = await userModel.findUserById(userId);
      if (!member) return notFound(res, 'Member not found');
      return respondMemberCheckIn(req, res, { eventId, member: { ...member, id: Number(userId) }, method: 'id' });
    }

    const record = await attendanceModel.checkInGuest({ eventId, guestName, checkedInBy: req.user.userId });
    await audit(req, 'check_in', record.id, `Checked in guest "${guestName}" to event #${eventId}`, { eventId });
    return res.status(201).json(apiResponse(true, record, 'Guest checked in'));
  } catch (error) {
    return next(error);
  }
};

const adjustHeadcount = async (req, res, next) => {
  try {
    const eventId = await loadOpenEvent(req, res);
    if (!eventId) return undefined;

    const adults = req.body.adults ?? 0;
    const children = req.body.children ?? 0;
    const counts = await attendanceModel.adjustHeadcount({ eventId, adults, children, updatedBy: req.user.userId });
    await audit(req, 'headcount_change', eventId, `Headcount for event #${eventId}: adults ${counts.adults}, children ${counts.children}`, {
      eventId,
      adults,
      children,
    });
    return res.json(apiResponse(true, counts, 'Headcount updated'));
  } catch (error) {
    return next(error);
  }
};

const MEMBER_SEARCH_LIMIT = 20;
const searchMembers = async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const members = q.length >= 2 ? await userModel.searchActiveMembers(q, MEMBER_SEARCH_LIMIT) : [];
    res.json(apiResponse(true, members, 'Members retrieved'));
  } catch (error) {
    next(error);
  }
};
```
- Export `adjustHeadcount` and `searchMembers` alongside the existing functions.

`backend/src/routes/attendanceRoutes.js`:
```js
const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireAttendanceStaff } = require('../middleware/attendanceAccess');
const { handleValidationErrors, validateCheckIn, validateHeadcount } = require('../middleware/validators');

// Check-in for admins and ushers. Reports and exports stay under /api/admin/attendance.
const router = express.Router();

router.use(verifyToken, requireAttendanceStaff);

router.get('/events', attendanceController.listCheckInEvents);
router.get('/events/:eventId', attendanceController.getEventAttendance);
router.post('/events/:eventId/check-in', validateCheckIn, handleValidationErrors, attendanceController.checkIn);
router.post('/events/:eventId/headcount', validateHeadcount, handleValidationErrors, attendanceController.adjustHeadcount);
router.delete('/records/:id', attendanceController.removeCheckIn);
router.get('/members', attendanceController.searchMembers);

module.exports = router;
```

`adminAttendanceRoutes.js`: remove the `events`, `events/:eventId`, `check-in` and `records` routes and the `validateCheckIn` import, keeping `router.get('/summary', ...)`. (Exports are added in Task 6.)

`server.js`:
- Add `const attendanceRoutes = require('./routes/attendanceRoutes');` next to the other route requires.
- Add `app.use('/api/attendance', attendanceRoutes);` after the `/api/admin/attendance` line.

- [ ] **Step 4: Run it, then the whole suite**

Run: `cd backend && npx jest tests/api/attendance.test.js && npm test -- --silent`

Expected: all PASS. If the guest-name trim test fails, check that `checkInGuest` receives the express-validator-trimmed `req.body.guestName`.

- [ ] **Step 5: Commit**

```bash
git add backend/src backend/tests/api/attendance.test.js
git commit -m "feat(backend): staff check-in API for ushers with card scans and headcounts"
```

---

### Task 6: CSV exports, card management, and the usher switch

**Files:**
- Create: `backend/src/utils/csv.js`
- Modify:
  - `backend/src/controllers/attendanceController.js` (`exportEvent`, `exportRange`)
  - `backend/src/routes/adminAttendanceRoutes.js`
  - `backend/src/controllers/userController.js` (`setUsher`, `resetCheckInCard`, `listCheckInCards`, `getMyCheckInCard`)
  - `backend/src/routes/adminUserRoutes.js`
  - `backend/src/routes/userRoutes.js`
- Test:
  - `backend/tests/utils/csv.test.js`
  - `backend/tests/api/attendanceExports.test.js`
  - `backend/tests/api/checkInCards.test.js`

**Interfaces:**
- Produces:
  - `toCsv(header: string[], rows: unknown[][]): string`
  - `escapeCell(value): string`
  - `GET /api/admin/attendance/events/:eventId/export.csv`
  - `GET /api/admin/attendance/export.csv?from&to`
  - `PUT /api/admin/users/:id/usher {enabled}`
  - `POST /api/admin/users/:id/check-in-card/reset` → `{code, qr_text}`
  - `GET /api/admin/users/check-in-cards?ids=` → cards
  - `GET /api/users/me/check-in-card` → `{code, qr_text}`

- [ ] **Step 1: Write the failing tests**

`backend/tests/utils/csv.test.js`:
```js
const { escapeCell, toCsv } = require('../../src/utils/csv');

describe('csv', () => {
  test.each([
    ['plain', 'plain'],
    ['a,b', '"a,b"'],
    ['say "hi"', '"say ""hi"""'],
    ['line\nbreak', '"line\nbreak"'],
    ['=SUM(A1)', "'=SUM(A1)"],
    ['+233', "'+233"],
    ['-1', "'-1"],
    ['@cmd', "'@cmd"],
    ['=a,b', '"\'=a,b"'],
    [null, ''],
    [undefined, ''],
    [12, '12'],
  ])('escapes %p', (input, expected) => {
    expect(escapeCell(input)).toBe(expected);
  });

  test('dates become ISO text', () => {
    expect(escapeCell(new Date('2026-10-11T09:00:00Z'))).toBe('2026-10-11T09:00:00.000Z');
  });

  test('starts with a BOM and uses CRLF rows', () => {
    expect(toCsv(['A', 'B'], [[1, 'x']])).toBe('﻿A,B\r\n1,x\r\n');
  });
});
```

`backend/tests/api/attendanceExports.test.js`:
```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
const as = (userId, role) => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET)}`;
const at = new Date('2026-10-04T09:00:00Z');

describe('attendance CSV exports', () => {
  let attendanceModel;
  let app;

  beforeEach(() => {
    jest.resetModules();
    attendanceModel = {
      getAttendanceSummary: jest.fn().mockResolvedValue([]),
      getEventExport: jest.fn().mockResolvedValue({
        event: { id: 7, name: 'Sunday Service', event_date: at },
        headcount: { adults: 150, children: 24 },
        rows: [
          { type: 'Member', name: 'Ama Mensah', email: 'ama@test.com', checked_in_at: at, checked_in_by: 'Usher One' },
          { type: 'Guest', name: '=HYPERLINK("x")', email: '', checked_in_at: at, checked_in_by: '' },
        ],
      }),
      getRangeExport: jest.fn().mockResolvedValue([
        { event_id: 7, name: 'Sunday Service', event_date: at, registered: 4, members: 1, guests: 1, named: 2, adults: 10, children: 3, total: 15 },
      ]),
    };
    jest.doMock('../../src/models/attendanceModel', () => attendanceModel);
    jest.doMock('../../src/models/userModel', () => ({ getAttendanceAccess: jest.fn() }));
    jest.doMock('../../src/models/auditLogModel', () => ({ createAuditLog: jest.fn() }));
    app = express();
    app.use('/api/admin/attendance', require('../../src/routes/adminAttendanceRoutes'));
  });

  test('event export lists check-ins then headcount rows, escaped', async () => {
    const response = await request(app).get('/api/admin/attendance/events/7/export.csv').set('Authorization', as(1, 'admin'));
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toMatch(/^attachment; filename="attendance-sunday-service-2026-10-04\.csv"$/);
    const lines = response.text.replace('﻿', '').trim().split('\r\n');
    expect(lines[0]).toBe('Type,Name,Email,Checked in at,Checked in by');
    expect(lines[1]).toBe('Member,Ama Mensah,ama@test.com,2026-10-04T09:00:00.000Z,Usher One');
    expect(lines[2]).toBe('Guest,"\'=HYPERLINK(""x"")",,2026-10-04T09:00:00.000Z,');
    expect(lines[3]).toBe('Headcount (adults),150,,,');
    expect(lines[4]).toBe('Headcount (children),24,,,');
  });

  test('a missing event returns 404', async () => {
    attendanceModel.getEventExport.mockResolvedValue(undefined);
    expect((await request(app).get('/api/admin/attendance/events/9/export.csv').set('Authorization', as(1, 'admin'))).status).toBe(404);
  });

  test('range export has one row per event', async () => {
    const response = await request(app)
      .get('/api/admin/attendance/export.csv?from=2026-07-01&to=2026-09-30')
      .set('Authorization', as(1, 'admin'));
    expect(response.status).toBe(200);
    const lines = response.text.replace('﻿', '').trim().split('\r\n');
    expect(lines[0]).toBe('Event,Date,Registered,Members,Guests,Adults counted,Children counted,Total');
    expect(lines[1]).toBe('Sunday Service,2026-10-04T09:00:00.000Z,4,1,1,10,3,15');
    const { from, to } = attendanceModel.getRangeExport.mock.calls[0][0];
    expect(from.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(to.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(response.headers['content-disposition']).toContain('attendance-2026-07-01-to-2026-09-30.csv');
  });

  test('range defaults to the last 90 days', async () => {
    await request(app).get('/api/admin/attendance/export.csv').set('Authorization', as(1, 'admin'));
    const { from, to } = attendanceModel.getRangeExport.mock.calls[0][0];
    expect(Math.round((to - from) / 86400000)).toBe(90);
  });

  test.each([['from=2026-10-01&to=2026-09-01'], ['from=2025-01-01&to=2026-06-01'], ['from=bad&to=2026-09-01'], ['from=2026-02-30&to=2026-03-01']])(
    'rejects %s with 400',
    async (query) => {
      expect((await request(app).get(`/api/admin/attendance/export.csv?${query}`).set('Authorization', as(1, 'admin'))).status).toBe(400);
    }
  );

  test('ushers cannot export', async () => {
    expect((await request(app).get('/api/admin/attendance/export.csv').set('Authorization', as(5, 'member'))).status).toBe(403);
  });
});
```

`backend/tests/api/checkInCards.test.js`:
```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
const as = (userId, role) => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET)}`;

describe('check-in cards and the usher switch', () => {
  let userModel;
  let auditLogModel;
  let app;

  beforeEach(() => {
    jest.resetModules();
    userModel = {
      findUserById: jest.fn().mockResolvedValue({ id: 5, role: 'member' }),
      setCanTakeAttendance: jest.fn().mockResolvedValue({ id: 5, role: 'member', can_take_attendance: true }),
      resetCheckInCode: jest.fn().mockResolvedValue('NEWCODE000'),
      getOrCreateCheckInCode: jest.fn().mockResolvedValue('ABCDEFGHJK'),
      listCheckInCards: jest.fn().mockResolvedValue([{ id: 5, code: 'ABCDEFGHJK' }]),
    };
    auditLogModel = { createAuditLog: jest.fn().mockResolvedValue({}) };
    jest.doMock('../../src/models/userModel', () => userModel);
    jest.doMock('../../src/models/auditLogModel', () => auditLogModel);
    jest.doMock('../../src/services/imageStorage', () => ({}));
    app = express();
    app.use(express.json());
    app.use('/api/admin/users', require('../../src/routes/adminUserRoutes'));
    app.use('/api/users', require('../../src/routes/userRoutes'));
  });

  test('a member gets their own card', async () => {
    const response = await request(app).get('/api/users/me/check-in-card').set('Authorization', as(5, 'member'));
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ code: 'ABCDEFGHJK', qr_text: 'antpresby:member:ABCDEFGHJK' });
    expect(userModel.getOrCreateCheckInCode).toHaveBeenCalledWith(5);
  });

  test('admin turns the usher switch on and it is audited', async () => {
    const response = await request(app).put('/api/admin/users/5/usher').set('Authorization', as(1, 'admin')).send({ enabled: true });
    expect(response.status).toBe(200);
    expect(userModel.setCanTakeAttendance).toHaveBeenCalledWith(5, true);
    expect(auditLogModel.createAuditLog.mock.calls[0][0]).toMatchObject({ entityType: 'user', entityId: 5, action: 'usher_enabled' });
  });

  test('turning it off audits usher_disabled', async () => {
    userModel.setCanTakeAttendance.mockResolvedValue({ id: 5, can_take_attendance: false });
    await request(app).put('/api/admin/users/5/usher').set('Authorization', as(1, 'admin')).send({ enabled: false });
    expect(auditLogModel.createAuditLog.mock.calls[0][0].action).toBe('usher_disabled');
  });

  test.each([[{}], [{ enabled: 'yes' }]])('rejects body %p with 400', async (body) => {
    expect((await request(app).put('/api/admin/users/5/usher').set('Authorization', as(1, 'admin')).send(body)).status).toBe(400);
  });

  test('admins cannot be given the usher switch (including yourself)', async () => {
    userModel.findUserById.mockResolvedValue({ id: 1, role: 'admin' });
    const response = await request(app).put('/api/admin/users/1/usher').set('Authorization', as(1, 'admin')).send({ enabled: true });
    expect(response.status).toBe(400);
    expect(userModel.setCanTakeAttendance).not.toHaveBeenCalled();
  });

  test('a missing user returns 404', async () => {
    userModel.findUserById.mockResolvedValue(undefined);
    expect((await request(app).put('/api/admin/users/9/usher').set('Authorization', as(1, 'admin')).send({ enabled: true })).status).toBe(404);
  });

  test('admin resets a card and it is audited', async () => {
    const response = await request(app).post('/api/admin/users/5/check-in-card/reset').set('Authorization', as(1, 'admin'));
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ code: 'NEWCODE000', qr_text: 'antpresby:member:NEWCODE000' });
    expect(auditLogModel.createAuditLog.mock.calls[0][0].action).toBe('check_in_card_reset');
  });

  test('admin lists cards for selected ids', async () => {
    const response = await request(app).get('/api/admin/users/check-in-cards?ids=5,6,x').set('Authorization', as(1, 'admin'));
    expect(response.status).toBe(200);
    expect(userModel.listCheckInCards).toHaveBeenCalledWith([5, 6]);
  });

  test('admin lists all cards without ids', async () => {
    await request(app).get('/api/admin/users/check-in-cards').set('Authorization', as(1, 'admin'));
    expect(userModel.listCheckInCards).toHaveBeenCalledWith(undefined);
  });

  test('members cannot manage cards', async () => {
    expect((await request(app).post('/api/admin/users/5/check-in-card/reset').set('Authorization', as(5, 'member'))).status).toBe(403);
  });
});
```

- [ ] **Step 2: Run them to check they fail**

Run: `cd backend && npx jest tests/utils/csv.test.js tests/api/attendanceExports.test.js tests/api/checkInCards.test.js`

Expected: FAIL.

- [ ] **Step 3: Implement**

`backend/src/utils/csv.js`:
```js
// Spreadsheet-safe CSV: a leading = + - @ tab or CR would run as a formula in Excel, so it gets a ' first.
const FORMULA_START = /^[=+\-@\t\r]/;

const escapeCell = (value) => {
  if (value === null || value === undefined) return '';
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// UTF-8 BOM so Excel reads names with accents correctly; CRLF rows per RFC 4180.
const toCsv = (header, rows) => `﻿${[header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n')}\r\n`;

const slugify = (text) =>
  String(text || 'event')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'event';

module.exports = { escapeCell, toCsv, slugify };
```

In `attendanceController.js`, add `const { toCsv, slugify } = require('../utils/csv');` and:
```js
const sendCsv = (res, filename, csv) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csv);
};

const isoDay = (date) => new Date(date).toISOString().slice(0, 10);
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const RANGE_DEFAULT_DAYS = 90;
const RANGE_MAX_DAYS = 366;

// A YYYY-MM-DD that is a real calendar day, as midnight UTC.
const parseDay = (value) => {
  if (typeof value !== 'string' || !DATE_ONLY.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || isoDay(date) !== value ? null : date;
};

const exportEvent = async (req, res, next) => {
  try {
    const eventId = parseId(req.params.eventId);
    const data = eventId ? await attendanceModel.getEventExport(eventId) : undefined;
    if (!data) return notFound(res, 'Event not found');

    const rows = data.rows.map((row) => [row.type, row.name, row.email, row.checked_in_at, row.checked_in_by]);
    rows.push(['Headcount (adults)', data.headcount.adults, '', '', '']);
    rows.push(['Headcount (children)', data.headcount.children, '', '', '']);
    const csv = toCsv(['Type', 'Name', 'Email', 'Checked in at', 'Checked in by'], rows);
    return sendCsv(res, `attendance-${slugify(data.event.name)}-${isoDay(data.event.event_date)}.csv`, csv);
  } catch (error) {
    return next(error);
  }
};

const exportRange = async (req, res, next) => {
  try {
    const today = parseDay(isoDay(new Date()));
    const toDay = req.query.to === undefined ? today : parseDay(req.query.to);
    const fromDay =
      req.query.from === undefined ? new Date(toDay?.getTime() - (RANGE_DEFAULT_DAYS - 1) * DAY_MS) : parseDay(req.query.from);

    if (!fromDay || !toDay || fromDay > toDay) {
      return res.status(400).json(apiResponse(false, null, 'Choose a valid date range'));
    }
    const spanDays = Math.round((toDay - fromDay) / DAY_MS) + 1;
    if (spanDays > RANGE_MAX_DAYS) {
      return res.status(400).json(apiResponse(false, null, 'Choose a range of one year or less'));
    }

    const rows = await attendanceModel.getRangeExport({ from: fromDay, to: new Date(toDay.getTime() + DAY_MS) });
    const csv = toCsv(
      ['Event', 'Date', 'Registered', 'Members', 'Guests', 'Adults counted', 'Children counted', 'Total'],
      rows.map((row) => [row.name, row.event_date, row.registered, row.members, row.guests, row.adults, row.children, row.total])
    );
    return sendCsv(res, `attendance-${isoDay(fromDay)}-to-${isoDay(toDay)}.csv`, csv);
  } catch (error) {
    return next(error);
  }
};
```
Export both.

Note: with the default range, `to - from` = 89 days + 1 day (the exclusive end) = 90 days, which the test checks.

`adminAttendanceRoutes.js` (after `/summary`):
```js
router.get('/events/:eventId/export.csv', attendanceController.exportEvent);
router.get('/export.csv', attendanceController.exportRange);
```

`userController.js`:
- Add `const { toQrText } = require('../utils/checkInCode');` and `const { parseId } = require('../utils/helpers');` (merge with the existing helpers import).
- Add:
```js
const cardResponse = (code) => ({ code, qr_text: toQrText(code) });

const getMyCheckInCard = async (req, res, next) => {
  try {
    const code = await userModel.getOrCreateCheckInCode(req.user.userId);
    if (!code) return res.status(404).json(apiResponse(false, null, 'User not found'));
    res.json(apiResponse(true, cardResponse(code), 'Check-in card retrieved'));
  } catch (error) {
    next(error);
  }
};

const auditUser = (req, userId, action, summary) =>
  auditLogModel.createAuditLog({ actorUserId: req.user.userId, entityType: 'user', entityId: userId, action, summary, metadata: {} });

// Admin: turn "Can take attendance" on or off for a member. Admins already have full access.
const setUsher = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (typeof req.body?.enabled !== 'boolean') {
      return res.status(400).json(apiResponse(false, null, 'enabled must be true or false'));
    }
    const target = id ? await userModel.findUserById(id) : undefined;
    if (!target) return res.status(404).json(apiResponse(false, null, 'User not found'));
    if (target.role === 'admin') {
      return res.status(400).json(apiResponse(false, null, 'Admins already have attendance access'));
    }

    const updated = await userModel.setCanTakeAttendance(id, req.body.enabled);
    if (!updated) return res.status(404).json(apiResponse(false, null, 'User not found'));
    await auditUser(req, id, req.body.enabled ? 'usher_enabled' : 'usher_disabled', `${req.body.enabled ? 'Gave' : 'Removed'} attendance access for user #${id}`);
    res.json(apiResponse(true, updated, 'Attendance access updated'));
  } catch (error) {
    next(error);
  }
};

const resetCheckInCard = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const code = id ? await userModel.resetCheckInCode(id) : undefined;
    if (!code) return res.status(404).json(apiResponse(false, null, 'User not found'));
    await auditUser(req, id, 'check_in_card_reset', `Reset the check-in card for user #${id}`);
    res.json(apiResponse(true, cardResponse(code), 'Check-in card reset'));
  } catch (error) {
    next(error);
  }
};

const listCheckInCards = async (req, res, next) => {
  try {
    const ids =
      typeof req.query.ids === 'string' && req.query.ids.trim()
        ? req.query.ids.split(',').map(parseId).filter(Boolean).slice(0, 1000)
        : undefined;
    const cards = await userModel.listCheckInCards(ids && ids.length ? ids : undefined);
    res.json(apiResponse(true, cards, 'Check-in cards retrieved'));
  } catch (error) {
    next(error);
  }
};
```
Export the four functions.

`adminUserRoutes.js`: before `router.get('/:id', ...)`, add `router.get('/check-in-cards', userController.listCheckInCards);`. After the `/:id/role` route, add:
```js
router.put('/:id/usher', userController.setUsher);
router.post('/:id/check-in-card/reset', userController.resetCheckInCard);
```

`userRoutes.js`: after the `/profile` GET, add `router.get('/me/check-in-card', verifyToken, userController.getMyCheckInCard);`.

- [ ] **Step 4: Run the tests, then the whole suite and lint**

Run: `cd backend && npx jest tests/utils/csv.test.js tests/api/attendanceExports.test.js tests/api/checkInCards.test.js && npm test -- --silent && npm run lint`

Expected: PASS and lint clean.

- [ ] **Step 5: Commit**

```bash
git add backend/src backend/tests
git commit -m "feat(backend): attendance CSV exports, check-in cards and the usher switch"
```


---

### Task 7: Web — data layer, staff guard and the `/check-in` area

The web and mobile apps have no unit-test runner. The gate for Tasks 7–9 is type-check, lint and build (web), and lint and tsc (mobile). This is recorded as a ruling.

**Files:**
- Install: `cd frontend && npm i qrcode @zxing/browser && npm i -D @types/qrcode`
- Modify:
  - `frontend/src/hooks/useApi.ts` (the attendance block, lines ~1240–1335)
  - `frontend/src/lib/store.ts` (`User` gains `can_take_attendance?: boolean`)
  - `frontend/src/components/layout/Header.tsx`
  - `frontend/src/app/admin/attendance/[eventId]/page.tsx` (becomes a redirect)
- Create in `frontend/src/components/attendance/`:
  - `StaffGuard.tsx`
  - `HeadcountCard.tsx`
  - `ScanBox.tsx`
  - `CameraScanner.tsx`
  - `CheckInSheet.tsx`
- Create in `frontend/src/app/check-in/`:
  - `layout.tsx`
  - `page.tsx`
  - `[eventId]/page.tsx`

**Interfaces (produced):**
- **Hooks:**
  - `useCheckInEvents(q = '')` → `['attendance','events',q]`, GET `/attendance/events`
  - `useEventAttendance(id)` → `['attendance','event',id]`
  - `useCheckIn(id)` → `CheckInResult = { id; member?: {first_name,last_name}; already: boolean }` (no toast; callers handle errors)
  - `useUndoCheckIn()` → DELETE `/attendance/records/:id`
  - `useAdjustHeadcount(id)` → POST headcount; on success it writes the counts into the cached sheet
  - `useMemberSearch(term)` → GET `/attendance/members?q`
  - `useMyCheckInCard()`
  - `useCheckInCards(ids?)`
  - `useSetUsher()` → invalidates `['admin','users']`
  - `useResetCheckInCard()`
  - `downloadCsv(path, params, filename)`: a blob through `apiClient`, then a temporary `<a download>`
- **Types:**
  - `Headcount`
  - `CheckInInput = {userId}|{guestName}|{code}`
  - `EventAttendance` gains `headcount` and `totals.named/adults/children`
  - `AttendanceSummaryRow` gains `named/adults/children`
- **Invalidation:** every staff mutation invalidates both `['attendance']` and `['admin','attendance']`.

- [ ] **Step 1: Hooks.** Replace the staff attendance hooks in `useApi.ts` with the list above. These are the key bodies:
```ts
export const useCheckIn = (eventId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CheckInInput): Promise<CheckInResult> => {
      const response = await apiClient.post(`/attendance/events/${eventId}/check-in`, input);
      return { ...response.data?.data, already: response.data?.message === 'Already checked in' };
    },
    onSettled: () => invalidateAttendance(qc),
  });
};

export const useAdjustHeadcount = (eventId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (delta: { adults?: 1 | -1; children?: 1 | -1 }): Promise<Headcount> =>
      (await apiClient.post(`/attendance/events/${eventId}/headcount`, delta)).data?.data,
    onSuccess: (counts) => {
      qc.setQueryData<EventAttendance>(['attendance', 'event', eventId], (sheet) =>
        sheet && { ...sheet, headcount: counts, totals: { ...sheet.totals, ...counts, total: sheet.totals.named + counts.adults + counts.children } }
      );
      qc.invalidateQueries({ queryKey: ['admin', 'attendance'] });
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Could not update the count')),
  });
};

export const downloadCsv = async (path: string, params: Record<string, string>, filename: string) => {
  const response = await apiClient.get(path, { params, responseType: 'blob' });
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
```

- [ ] **Step 2: Guard.**
  - `StaffGuard` reads `useProfile()`. It allows `role === 'admin' || can_take_attendance`. Otherwise it shows the toast "You do not have attendance access" and runs `router.replace('/dashboard')`. While loading it shows a spinner with `role="status"`.
  - It also exports `useLeaveOnLostAccess(error)`: on a 403 it shows the toast "You no longer have attendance access" and redirects to `/dashboard`.
  - `app/check-in/layout.tsx` wraps its children in `<RouteGuard><StaffGuard><div className="container-max py-8 sm:py-10">…`, with metadata title `Check-in - ${APP_NAME}`.

- [ ] **Step 3: Event list `app/check-in/page.tsx`.**
  - Copy the "Check in" `FormSection` list markup from `app/admin/attendance/page.tsx`, with links going to `/check-in/${event.id}`.
  - Above it, add a labelled `Input` ("Find an older event", placeholder "Event name (at least 2 letters)") with a 300 ms debounce that feeds `useCheckInEvents(term)`.
  - The section title is "This fortnight", or "Search results" while searching.
  - Empty text: "No events match." while searching, otherwise the existing text.
  - Call `useLeaveOnLostAccess(eventsQuery.error)`.

- [ ] **Step 4: Components.**
  - **`HeadcountCard({ sheet, disabled })`:** a `FormSection` titled "Headcount" with one row each for Adults and Children.
    - Each row has `Button size="icon"`: − (secondary; `aria-label` "One fewer adults"; disabled at 0) and + (`aria-label` "One more adults").
    - The value sits between them in `text-2xl font-bold tabular-nums`, with `aria-live="polite"`.
    - Footer: "**{total} present**: {named} named, {adults} adults, {children} children counted".
  - **`ScanBox({ onScan, disabled })`:** a form with the labelled input "Scan a card" (placeholder "Scan or type a card code, then Enter", `autoComplete="off"`, focused on mount). On submit it trims, clears, calls `onScan` and refocuses.
  - **`CameraScanner({ onScan, onClose })`:**
    - It dynamically imports `@zxing/browser` and calls `new BrowserQRCodeReader().decodeFromVideoDevice(undefined, video, cb)`.
    - It ignores the same text for 3 s, and stops the controls on unmount or when cancelled.
    - On failure it shows `role="alert"` "The camera could not start. Allow camera access, or use the scan box or name search."
    - It renders a `<video muted playsInline aria-label="Camera view for scanning cards">` and a "Close camera" button.

- [ ] **Step 5: CheckInSheet and pages.**
  - Move the body of `app/admin/attendance/[eventId]/page.tsx` into `CheckInSheet({ eventId })`:
    - crumbs become `[{ label: 'Check-in', href: '/check-in' }]`
    - not-found "Back" goes to `/check-in`
    - add `useLeaveOnLostAccess(error)`
  - Add the status line and a single check-in path:
```tsx
  const [status, setStatus] = React.useState('');
  const [cameraOpen, setCameraOpen] = React.useState(false);
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const nameOf = (m?: { first_name: string; last_name: string }) => (m ? `${m.first_name} ${m.last_name}`.trim() : 'Member');
  const checkInWith = (input: CheckInInput) =>
    checkIn.mutate(input, {
      onSuccess: (result) => {
        if ('guestName' in input) {
          setGuestName('');
          setStatus(`${input.guestName} added`);
        } else {
          setStatus(result.already ? `${nameOf(result.member)} was already checked in` : `${nameOf(result.member)} checked in`);
        }
      },
      onError: (err: any) => {
        const message = err?.response?.data?.message || 'Could not check in';
        setStatus(message);
        toast.error(message);
      },
    });
```
  - Route every existing `checkIn.mutate(...)` through `checkInWith`.
  - Above the existing grid, add a `lg:grid-cols-2` row:
    - left: `<HeadcountCard sheet={sheet} disabled={cancelled} />`
    - right: a `FormSection` "Scan member cards" containing `<ScanBox onScan={(t) => checkInWith({ code: t })} disabled={cancelled || checkIn.isPending} />`, then either the "Use camera" button or `<CameraScanner …>`, then `<p role="status" aria-live="polite" className="min-h-5 text-sm font-medium">{status}</p>`
  - Totals badges: `{total} present` (gold), `{named} named`, `{adults} adults`, `{children} children`, `{registered} registered`.
  - Admins only: a "Download CSV" secondary button under the header that calls `downloadCsv('/admin/attendance/events/${id}/export.csv', {}, 'attendance-${id}.csv')`, with a toast on failure.
  - `app/check-in/[eventId]/page.tsx` parses `useParams().eventId` (a positive integer, otherwise undefined) and renders `<CheckInSheet eventId={…} />`.
  - Replace `app/admin/attendance/[eventId]/page.tsx` with a server `redirect(`/check-in/${encodeURIComponent(eventId)}`)` that awaits `params: Promise<{ eventId: string }>`.

- [ ] **Step 6: Header.**
  - Add `const canCheckIn = isAdmin || Boolean(user?.can_take_attendance);`.
  - After both "My dashboard" links (the desktop dropdown and the mobile menu), add a matching "Take attendance" link to `/check-in`, shown only when `canCheckIn`. The dropdown uses the `ClipboardCheck` icon.

- [ ] **Step 7: Verify.**

Run: `cd frontend && npm run -s type-check && npm run -s lint && npm run -s build`

Expected: pass, and the route list includes `/check-in` and `/check-in/[eventId]`.

- [ ] **Step 8: Commit.**

`git add frontend && git commit -m "feat(web): staff check-in area with headcounts, card scanning and late check-in"`

---

### Task 8: Web — admin pages, printable cards and "My check-in card"

**Files:**
- Create:
  - `frontend/src/components/attendance/QrCode.tsx`
  - `frontend/src/app/admin/users/cards/page.tsx`
- Modify:
  - `frontend/src/app/admin/users/page.tsx`
  - `frontend/src/app/admin/attendance/page.tsx`
  - `frontend/src/app/dashboard/page.tsx`
  - `frontend/src/components/admin/admin-nav.ts`

- [ ] **Step 1: `QrCode({ text, size = 160, label })`.**
  - It uses `QRCode.toString(text, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })` in an effect, and renders the SVG string through `dangerouslySetInnerHTML`. The input is our own code text, and `qrcode` outputs only path markup.
  - The SVG is wrapped in `<div role="img" aria-label={label} style={{ width: size, height: size }} className="bg-white p-2 [&_svg]:h-full [&_svg]:w-full">`.

- [ ] **Step 2: Admin users page.**
  - The `AdminUser` type gains `can_take_attendance?: boolean`.
  - Add the column "Usher" (not shown for admins; they show "—"): a `Button size="sm"` with `aria-pressed={user.can_take_attendance}`, labelled "Usher: on" (primary) or "Usher: off" (secondary). It calls `setUsher.mutate({ id, enabled: !on })`.
  - In Actions, add "Reset card". It opens the existing `ConfirmDialog` with the text "Reset {name}'s check-in card? Their old card will stop working." and calls `resetCard.mutate(id)` on confirm.
  - Add the header link "Print cards" (`Button asChild variant="secondary"` → `/admin/users/cards`).
  - The stat cards gain "Ushers".
  - The description becomes "Search people, manage admin and usher access, and print check-in cards."

- [ ] **Step 3: `/admin/users/cards`.**
  - `useCheckInCards()`, rendered as a grid `grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3`.
  - Each card is `break-inside-avoid rounded-lg border p-4 text-center` and holds:
    - `<Image src="/brand/crest.png" width={32} height={32} alt="" />`
    - the name
    - `<QrCode text={qr_text} label={`Check-in card for ${name}`} />`
    - the code in a monospace font
  - The header has a "Print" button (`window.print()`). The header and admin chrome are hidden in print via `print:hidden` on the header block.
  - Loading and error states use `CardListSkeleton` and `LoadError`.

- [ ] **Step 4: Admin attendance page.**
  - Replace the "Check in" list section with a short `FormSection` "Check-in" ("Check people in and count heads.") holding a link button "Open check-in" → `/check-in`.
  - Add a `FormSection` "Export":
    - two `Input type="date"` fields (From, To; the default is the last 90 days, from `new Date().toISOString().slice(0,10)`)
    - a "Download CSV" button that calls `downloadCsv('/admin/attendance/export.csv', { from, to }, 'attendance-${from}-to-${to}.csv')`
    - on error, a toast with the API message ("Choose a valid date range" or "Choose a range of one year or less")
  - Trend rows display `total` and `${row.named} named · ${row.adults + row.children} counted`.
  - `admin-nav.ts`: the Attendance item gains `also: ['/check-in']`.

- [ ] **Step 5: Dashboard.**
  - Add a "My check-in card" `Card` (`useMyCheckInCard`): `QrCode` size 200, the code text, and "Show this at the entrance to be checked in."
  - If `canTakeAttendance(profile)` (from `StaffGuard`), add a quick action `{ href: '/check-in', label: 'Take attendance', icon: ClipboardCheck }`.

- [ ] **Step 6: Verify.**

Run: `cd frontend && npm run -s type-check && npm run -s lint && npm run -s build && npm run -s check:tokens && npm run -s check:contrast`

Expected: pass.

- [ ] **Step 7: Commit.**

`git commit -am` is not used. Run `git add frontend && git commit -m "feat(web): usher switch, card printing and reset, attendance export, my check-in card"`.

---

### Task 9: Mobile — staff check-in, scanner and "My check-in card"

**Files:**
- Install: `cd mobile && npx expo install expo-camera react-native-svg react-native-qrcode-svg`
- Modify:
  - `mobile/app.json`: add the plugin `["expo-camera", { "cameraPermission": "Allows ushers to scan member check-in cards.", "microphonePermission": false, "recordAudioAndroid": false }]`
  - `mobile/src/store/auth.ts` (`MobileUser.can_take_attendance?: boolean`)
  - `mobile/src/hooks/use-api.ts` (the attendance block, lines ~723–796)
  - `mobile/src/app/(tabs)/account.tsx`
  - `mobile/src/app/admin.tsx` (Attendance `href` → `/check-in`)
- Rename (`git mv`): `mobile/src/app/admin-attendance.tsx` → `mobile/src/app/check-in.tsx`
- Create:
  - `mobile/src/components/attendance/headcount-card.tsx`
  - `mobile/src/components/attendance/card-scanner.tsx`
  - `mobile/src/app/check-in-card.tsx`

**Interfaces:** the same API as the web. The hooks mirror Task 7 by name: `useCheckInEvents(q, enabled)`, `useEventAttendance`, `useCheckIn` (returns `already`), `useUndoCheckIn`, `useAdjustHeadcount`, `useMemberSearch(term, enabled)` and `useMyCheckInCard`. The paths move to `/attendance/*` and the query keys to `['attendance', …]`. `useAttendanceSummary` stays on `/admin/attendance/summary`.

- [ ] **Step 1: Hooks and types**
  - Update the `EventAttendance` and `AttendanceSummaryRow` types.
  - Add `Headcount`, `CheckInInput`, `CheckInResult` and `CheckInCard`.
  - `useAdjustHeadcount` writes the returned counts into the cached `['attendance','event',id]` sheet, as on the web.
  - `invalidateAttendance` invalidates both `['attendance']` and `['admin','attendance']`.

- [ ] **Step 2: `headcount-card.tsx`**
  - An `AppCard` titled "Headcount", with Adults and Children rows.
  - Each row has an `AppButton` "−" (secondary, `size="sm"`, `accessibilityLabel` "One fewer adults", disabled at 0) and "+" (`accessibilityLabel` "One more adults"). The value sits between them as `AppText variant="title"`.
  - Footer: `AppText` small muted "{total} present: {named} named, {adults} adults, {children} children counted".
  - Taps call `useAdjustHeadcount(eventId).mutate`.
  - Errors show `Alert.alert('Could not update the count', getApiErrorMessage(err, 'Please try again.'))`.

- [ ] **Step 3: `card-scanner.tsx`**

`CardScanner({ visible, onClose, onScan })` takes `onScan: (text: string) => Promise<string>`. The promise resolves to the message to show, or rejects with an error message.
```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
// ...
const REPEAT_IGNORE_MS = 3000;

export function CardScanner({ visible, onClose, onScan }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [message, setMessage] = React.useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const busy = React.useRef(false);
  const last = React.useRef({ text: '', at: 0 });

  const handle = async ({ data }: { data: string }) => {
    const now = Date.now();
    if (busy.current || (data === last.current.text && now - last.current.at < REPEAT_IGNORE_MS)) return;
    busy.current = true;
    last.current = { text: data, at: now };
    try {
      setMessage({ tone: 'success', text: await onScan(data) });
      Vibration.vibrate(40);
    } catch (error) {
      setMessage({ tone: 'danger', text: error instanceof Error ? error.message : 'Could not check in' });
      Vibration.vibrate([0, 60, 80, 60]);
    } finally {
      busy.current = false;
    }
  };
  // Modal (presentationStyle "fullScreen", onRequestClose={onClose}):
  // - permission unknown → spinner
  // - !permission.granted → text "Camera access is needed to scan cards. You can still find people by name."
  //   + AppButton "Allow camera" (requestPermission) + "Close"
  // - granted → <CameraView style={StyleSheet.absoluteFill} facing="back"
  //     barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={handle} />
  //   + bottom overlay: message banner (FormMessage tone) with accessibilityLiveRegion="polite", and AppButton "Done"
}
```

- [ ] **Step 4: `check-in.tsx` (renamed from `admin-attendance.tsx`)**
  - Rename the component to `CheckInScreen`.
  - Access: `const { data: profile, isLoading } = useMyProfile(Boolean(user)); const allowed = user?.role === 'admin' || Boolean(profile?.can_take_attendance);`
    - While loading → `LoadingList`.
    - If not allowed → a `Screen` with `ErrorState title="You do not have attendance access"`, and no data queries (pass `allowed` as `enabled`).
  - Swap `AdminShell` for `Screen` (from kit), because ushers are not admins.
  - The event list gains a `TextField` "Find an older event" (300 ms debounce → `useCheckInEvents(term, allowed)`). "Recent headcounts" shows only for admins.
  - On the sheet:
    - Below the badges, add `<HeadcountCard sheet={sheet} disabled={cancelled} />`.
    - Add `AppButton label="Scan cards" icon={<Ionicons name="qr-code-outline" …/>}`, which opens `CardScanner`. Its `onScan` is:
```tsx
const scanCard = (text: string) =>
  checkInMutation.mutateAsync({ code: text }).then(
    (r) => `${fullName(r.member ?? { first_name: 'Member', last_name: '' })}${r.already ? ' was already checked in' : ' checked in'}`,
    (err) => { throw new Error(getApiErrorMessage(err, 'Could not check in')); }
  );
```
  - Badges: `{total} present`, `{named} named`, `{adults} adults`, `{children} children`.
  - A 403 from the sheet or events query → `Alert.alert('You no longer have attendance access')` and `router.replace('/(tabs)/account')`.

- [ ] **Step 5: `check-in-card.tsx`**
  - A `Screen` with `ScreenHeader back title="My check-in card"`.
  - `useMyCheckInCard()` → a centred white `AppCard` holding `<QRCode value={card.qr_text} size={240} />` (from `react-native-qrcode-svg`) and the code in a large monospace font.
  - Hint text: "Show this at the entrance. Turn your screen brightness up if it doesn't scan."
  - Loading and error states use `LoadingList` and `ErrorState` with retry.

- [ ] **Step 6: Account tab**
  - Use the existing profile query (or add `useMyProfile(Boolean(user))`).
  - In the member section, add `ListRow icon="qr-code-outline" label="My check-in card"` → `/check-in-card`.
  - If `user.role === 'admin' || profile?.can_take_attendance`, add `ListRow icon="checkmark-done-outline" label="Take attendance"` → `/check-in`.
  - In `admin.tsx`, change the Attendance link to `/check-in`.

- [ ] **Step 7: Verify**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit`

Expected: pass, and `app.json` validates (`npx expo config --type public > /dev/null`).

- [ ] **Step 8: Commit**

```bash
git add mobile
git commit -m "feat(mobile): staff check-in with camera card scanning, headcounts and my check-in card"
```

---

### Task 10: Docs, full verification and handoff

**Files:**
- Modify: `docs/features.md` (Attendance section) and `docs/qa-checklist.md` (attendance items)

- [ ] **Step 1: Docs.** Rewrite the Attendance section to cover:
  - ushers ("Can take attendance" on Admin → Members)
  - `/check-in` and the app's Take attendance
  - headcount counters
  - scanning cards (camera or USB/Bluetooth scanner)
  - My check-in card, printing and resetting cards
  - searching past events
  - the CSV exports

  Add QA checklist items:
  - an usher can check in and gets 403 on exports
  - a card scan works with a scanner and with the camera
  - a reset card is refused
  - two devices tapping headcount at once both count
  - the printed cards scan
  - the APK asks for camera permission with the agreed text

- [ ] **Step 2: Full verification.**

Run: `cd backend && npm test -- --silent && npm run lint; cd ../frontend && npm run -s type-check && npm run -s lint && npm run -s build; cd ../mobile && npm run -s lint && npx tsc --noEmit`

Expected: all green.

- [ ] **Step 3: Commit.**

`git add docs && git commit -m "docs: attendance check-in operations"`

- [ ] **Step 4: Release notes for the PR** (written into the PR description, not into a file):
  1. Deploy the backend, then run `npm run migrate:features` on Render. It is idempotent.
  2. Deploy the web app.
  3. Build a new Android APK (`npx eas-cli build -p android --profile apk`). The new camera module **cannot ship by OTA**.
  4. Turn on "Usher" for the ushers in Admin → Members.
