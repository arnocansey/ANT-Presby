const prisma = require('../config/prisma');
const { toSnakeCaseObject, decimalToString } = require('../utils/prismaHelpers');

const createDonation = async (
  userId,
  amount,
  donationType,
  paymentMethod,
  reference = null,
  notes = null
) => {
  const donation = await prisma.donation.create({
    data: {
      userId: userId ? Number(userId) : null,
      amount,
      donationType,
      paymentMethod,
      reference,
      notes,
      status: 'pending',
    },
  });

  return toSnakeCaseObject(donation);
};

const getAllDonations = async (offset, limit, filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.donationType) {
    where.donationType = filters.donationType;
  }

  const donations = await prisma.donation.findMany({
    where,
    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return donations.map((item) => {
    const mapped = toSnakeCaseObject(item);
    mapped.first_name = item.user ? item.user.firstName : null;
    mapped.last_name = item.user ? item.user.lastName : null;
    mapped.email = item.user ? item.user.email : null;
    delete mapped.user;
    return mapped;
  });
};

const countDonations = async (filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.donationType) {
    where.donationType = filters.donationType;
  }

  return prisma.donation.count({ where });
};

const getDonationById = async (donationId) => {
  const donation = await prisma.donation.findUnique({
    where: { id: Number(donationId) },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!donation) {
    return undefined;
  }

  const mapped = toSnakeCaseObject(donation);
  mapped.first_name = donation.user ? donation.user.firstName : null;
  mapped.last_name = donation.user ? donation.user.lastName : null;
  mapped.email = donation.user ? donation.user.email : null;
  delete mapped.user;
  return mapped;
};

const getDonationByReference = async (reference) => {
  const donation = await prisma.donation.findFirst({
    where: { reference },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!donation) {
    return undefined;
  }

  const mapped = toSnakeCaseObject(donation);
  mapped.first_name = donation.user ? donation.user.firstName : null;
  mapped.last_name = donation.user ? donation.user.lastName : null;
  mapped.email = donation.user ? donation.user.email : null;
  delete mapped.user;
  return mapped;
};

const getUserDonations = async (userId, offset = 0, limit = 10) => {
  const donations = await prisma.donation.findMany({
    where: { userId: Number(userId) },
    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
  });

  return toSnakeCaseObject(donations);
};

const updateDonationStatus = async (donationId, status) => {
  const id = Number(donationId);
  const updated = await prisma.donation.updateMany({
    where: { id },
    data: { status },
  });

  if (updated.count === 0) {
    return undefined;
  }

  const donation = await prisma.donation.findUnique({
    where: { id },
  });

  return toSnakeCaseObject(donation);
};

const updateDonationStatusByReference = async (reference, status) => {
  const updated = await prisma.donation.updateMany({
    where: { reference },
    data: { status },
  });

  if (updated.count === 0) {
    return undefined;
  }

  const donation = await prisma.donation.findFirst({
    where: { reference },
  });

  return toSnakeCaseObject(donation);
};

const buildDonationUpdateData = (updates) => {
  const data = {};

  if (updates.amount !== undefined) data.amount = updates.amount;
  if (updates.donationType !== undefined) data.donationType = updates.donationType;
  if (updates.donation_type !== undefined) data.donationType = updates.donation_type;
  if (updates.paymentMethod !== undefined) data.paymentMethod = updates.paymentMethod;
  if (updates.payment_method !== undefined) data.paymentMethod = updates.payment_method;
  if (updates.status !== undefined) data.status = updates.status;
  if (updates.reference !== undefined) data.reference = updates.reference;
  if (updates.notes !== undefined) data.notes = updates.notes;

  return data;
};

const updateDonation = async (donationId, updates) => {
  const id = Number(donationId);
  const data = buildDonationUpdateData(updates);

  if (Object.keys(data).length === 0) {
    return getDonationById(donationId);
  }

  const updated = await prisma.donation.updateMany({
    where: { id },
    data,
  });

  if (updated.count === 0) {
    return undefined;
  }

  const donation = await prisma.donation.findUnique({
    where: { id },
  });

  return toSnakeCaseObject(donation);
};

const deleteDonation = async (donationId) => {
  const id = Number(donationId);
  const deleted = await prisma.donation.deleteMany({
    where: { id },
  });

  if (deleted.count === 0) {
    return undefined;
  }

  return { id };
};

const getDonationStatistics = async () => {
  const [summary, byType, uniqueDonors] = await Promise.all([
    prisma.donation.aggregate({
      where: { status: 'completed' },
      _count: { _all: true },
      _sum: { amount: true },
      _avg: { amount: true },
    }),
    prisma.donation.groupBy({
      by: ['donationType'],
      where: { status: 'completed' },
      _sum: { amount: true },
    }),
    prisma.donation.findMany({
      where: {
        status: 'completed',
        userId: { not: null },
      },
      distinct: ['userId'],
      select: { userId: true },
    }),
  ]);

  const totalsByType = byType.reduce(
    (acc, row) => ({
      ...acc,
      [row.donationType]: decimalToString(row._sum.amount),
    }),
    {}
  );

  return {
    total_donations: summary._count._all,
    total_amount: decimalToString(summary._sum.amount),
    average_donation: decimalToString(summary._avg.amount),
    tithe_total: totalsByType.tithe || '0',
    offering_total: totalsByType.offering || '0',
    ministry_total: totalsByType.ministry || '0',
    unique_donors: uniqueDonors.length,
  };
};

const getDonationsByType = async () => {
  const donations = await prisma.donation.groupBy({
    by: ['donationType'],
    where: { status: 'completed' },
    _count: { _all: true },
    _sum: { amount: true },
  });

  return donations.map((row) => ({
    donation_type: row.donationType,
    count: row._count._all,
    total: decimalToString(row._sum.amount),
  }));
};

module.exports = {
  createDonation,
  getAllDonations,
  countDonations,
  getDonationById,
  getDonationByReference,
  getUserDonations,
  updateDonationStatus,
  updateDonationStatusByReference,
  updateDonation,
  deleteDonation,
  getDonationStatistics,
  getDonationsByType,
};
