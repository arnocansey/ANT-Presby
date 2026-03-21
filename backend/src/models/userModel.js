const prisma = require('../config/prisma');
const { toSnakeCaseObject, decimalToString } = require('../utils/prismaHelpers');

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
  verification = {}
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
    },
    select: {
      id: true,
      email: true,
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

// Get all users with pagination
const getAllUsers = async (offset, limit) => {
  const users = await prisma.user.findMany({
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

// Count total users
const countUsers = async () => {
  return prisma.user.count();
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
      firstName: true,
      lastName: true,
      phone: true,
      profileImageUrl: true,
      role: true,
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

const markEmailVerified = async (userId) =>
  updateUser(userId, {
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpiresAt: null,
    emailVerifiedAt: new Date(),
  });

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByVerificationToken,
  getAllUsers,
  getAllUserIds,
  countUsers,
  updateUser,
  updateUserProfileImage,
  deleteUser,
  updateUserRole,
  getUserProfile,
  markEmailVerified,
};
