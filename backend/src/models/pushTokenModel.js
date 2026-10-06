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
