const prisma = require('../config/prisma');
const { toSnakeCaseObject, decimalToString } = require('../utils/prismaHelpers');
const { generateCheckInCode, toQrText } = require('../utils/checkInCode');

/**
 * User Model - Database operations for users
 */

// Create user
const createUser = async (
  email,
  password,
  firstName,
  lastName,
  phone = null,
  verification = {},
  auth = {}
) => {
  const user = await prisma.user.create({
    data: {
      email,
      password,
      firstName,
      lastName,
      phone,
      profileImageUrl: null,
      role: 'member',
      emailVerified: verification.emailVerified ?? false,
      emailVerificationToken: verification.token ?? null,
      emailVerificationExpiresAt: verification.expiresAt ?? null,
      emailVerifiedAt: verification.verifiedAt ?? null,
      authProvider: auth.provider ?? null,
      googleId: auth.googleId ?? null,
    },
    select: {
      id: true,
      email: true,
      authProvider: true,
      googleId: true,
      firstName: true,
      lastName: true,
      phone: true,
      profileImageUrl: true,
      role: true,
      emailVerified: true,
      emailVerificationToken: true,
      emailVerificationExpiresAt: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });

  return toSnakeCaseObject(user);
};

// Find user by email
const findUserByEmail = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  return toSnakeCaseObject(user);
};

// Find user by ID
const findUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  return toSnakeCaseObject(user);
};

const findUserByVerificationToken = async (token) => {
  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: token },
  });

  return toSnakeCaseObject(user);
};

const findUserByGoogleId = async (googleId) => {
  const user = await prisma.user.findFirst({
    where: { googleId },
  });

  return toSnakeCaseObject(user);
};

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

// Get all users with pagination
const getAllUsers = async (offset, limit, search = '') => {
  const users = await prisma.user.findMany({
    where: buildUserSearchWhere(search),
    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      profileImageUrl: true,
      role: true,
      isActive: true,
      canTakeAttendance: true,
      createdAt: true,
    },
  });

  return toSnakeCaseObject(users);
};

// Get all active user IDs (used for broadcast notifications)
const getAllUserIds = async () => {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  return users.map((row) => row.id);
};

// Active admin IDs (fallback recipients when a group has no leader yet)
const getActiveAdminIds = async () => {
  const admins = await prisma.user.findMany({
    where: { isActive: true, role: 'admin' },
    select: { id: true },
  });

  return admins.map((row) => row.id);
};

// Count total users
const countUsers = async (search = '') => {
  return prisma.user.count({ where: buildUserSearchWhere(search) });
};

const buildUserUpdateData = (updates) => {
  const data = {};

  if (updates.email !== undefined) data.email = updates.email;
  if (updates.password !== undefined) data.password = updates.password;
  if (updates.firstName !== undefined) data.firstName = updates.firstName;
  if (updates.lastName !== undefined) data.lastName = updates.lastName;
  if (updates.phone !== undefined) data.phone = updates.phone;
  if (updates.profileImageUrl !== undefined) data.profileImageUrl = updates.profileImageUrl;
  if (updates.role !== undefined) data.role = updates.role;
  if (updates.isActive !== undefined) data.isActive = updates.isActive;
  if (updates.emailVerified !== undefined) data.emailVerified = updates.emailVerified;
  if (updates.emailVerificationToken !== undefined) {
    data.emailVerificationToken = updates.emailVerificationToken;
  }
  if (updates.emailVerificationExpiresAt !== undefined) {
    data.emailVerificationExpiresAt = updates.emailVerificationExpiresAt;
  }
  if (updates.emailVerifiedAt !== undefined) data.emailVerifiedAt = updates.emailVerifiedAt;
  if (updates.authProvider !== undefined) data.authProvider = updates.authProvider;
  if (updates.googleId !== undefined) data.googleId = updates.googleId;

  return data;
};

// Update user
const updateUser = async (userId, updates) => {
  const id = Number(userId);
  const data = buildUserUpdateData(updates);

  if (Object.keys(data).length === 0) {
    return findUserById(userId);
  }

  const updated = await prisma.user.updateMany({
    where: { id },
    data,
  });

  if (updated.count === 0) {
    return undefined;
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      authProvider: true,
      googleId: true,
      firstName: true,
      lastName: true,
      phone: true,
      profileImageUrl: true,
      role: true,
      emailVerified: true,
      emailVerificationToken: true,
      emailVerificationExpiresAt: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });

  return toSnakeCaseObject(user);
};

// Update user profile image
const updateUserProfileImage = async (userId, profileImageUrl) => {
  const id = Number(userId);
  const updated = await prisma.user.updateMany({
    where: { id },
    data: { profileImageUrl },
  });

  if (updated.count === 0) {
    return undefined;
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      authProvider: true,
      googleId: true,
      firstName: true,
      lastName: true,
      phone: true,
      profileImageUrl: true,
      role: true,
      emailVerified: true,
      emailVerificationToken: true,
      emailVerificationExpiresAt: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });

  return toSnakeCaseObject(user);
};

// Delete user
const deleteUser = async (userId) => {
  const id = Number(userId);
  const deleted = await prisma.user.deleteMany({
    where: { id },
  });

  if (deleted.count === 0) {
    return undefined;
  }

  return { id };
};

// Update user role
const updateUserRole = async (userId, role) => {
  const id = Number(userId);
  const updated = await prisma.user.updateMany({
    where: { id },
    data: { role },
  });

  if (updated.count === 0) {
    return undefined;
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      authProvider: true,
      googleId: true,
      firstName: true,
      lastName: true,
      phone: true,
      profileImageUrl: true,
      role: true,
      emailVerified: true,
      emailVerificationToken: true,
      emailVerificationExpiresAt: true,
      emailVerifiedAt: true,
    },
  });

  return toSnakeCaseObject(user);
};

// Get user profile with stats
const getUserProfile = async (userId) => {
  const id = Number(userId);
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      authProvider: true,
      googleId: true,
      firstName: true,
      lastName: true,
      phone: true,
      profileImageUrl: true,
      role: true,
      canTakeAttendance: true,
    },
  });

  if (!user) {
    return undefined;
  }

  const [eventsRegistered, prayersSubmitted, donationStats] = await Promise.all([
    prisma.eventRegistration.count({ where: { userId: id } }),
    prisma.prayerRequest.count({ where: { userId: id } }),
    prisma.donation.aggregate({
      where: {
        userId: id,
        status: 'completed',
      },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);

  return {
    ...toSnakeCaseObject(user),
    events_registered: eventsRegistered,
    prayer_requests_submitted: prayersSubmitted,
    donations_made: donationStats._count._all,
    total_donated: decimalToString(donationStats._sum.amount),
  };
};

const MAX_CODE_ATTEMPTS = 5;
const CODE_BACKFILL_BATCH = 10;
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

  // The first "print all" may need hundreds of new codes: create them in parallel batches.
  const cards = [];
  for (let start = 0; start < users.length; start += CODE_BACKFILL_BATCH) {
    const batch = users.slice(start, start + CODE_BACKFILL_BATCH);
    const codes = await Promise.all(batch.map((user) => user.checkInCode || getOrCreateCheckInCode(user.id)));
    batch.forEach((user, index) => {
      const code = codes[index];
      cards.push({ id: user.id, first_name: user.firstName, last_name: user.lastName, code, qr_text: toQrText(code) });
    });
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

const markEmailVerified = async (userId) =>
  updateUser(userId, {
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpiresAt: null,
    emailVerifiedAt: new Date(),
  });

module.exports = {
  buildUserSearchWhere,
  createUser,
  findUserByEmail,
  findUserById,
  findUserByVerificationToken,
  findUserByGoogleId,
  getAllUsers,
  getAllUserIds,
  getActiveAdminIds,
  countUsers,
  updateUser,
  updateUserProfileImage,
  deleteUser,
  updateUserRole,
  getUserProfile,
  markEmailVerified,
  getAttendanceAccess,
  findMemberByCheckInCode,
  getOrCreateCheckInCode,
  resetCheckInCode,
  setCanTakeAttendance,
  listCheckInCards,
  searchActiveMembers,
};
