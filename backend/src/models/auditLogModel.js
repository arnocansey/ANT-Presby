const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

const createAuditLog = async ({
  actorUserId = null,
  entityType,
  entityId = null,
  action,
  summary,
  metadata = null,
}) => {
  const auditLog = await prisma.auditLog.create({
    data: {
      actorUserId: actorUserId ? Number(actorUserId) : null,
      entityType,
      entityId: entityId === null || entityId === undefined ? null : Number(entityId),
      action,
      summary,
      metadata,
    },
  });

  return toSnakeCaseObject(auditLog);
};

const getAuditLogs = async (offset = 0, limit = 20, filters = {}) => {
  const where = {};

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.actorUserId) {
    where.actorUserId = Number(filters.actorUserId);
  }

  const logs = await prisma.auditLog.findMany({
    where,
    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
    include: {
      actor: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return logs.map((item) => {
    const mapped = toSnakeCaseObject(item);
    mapped.actor_name = item.actor
      ? `${item.actor.firstName || ''} ${item.actor.lastName || ''}`.trim()
      : null;
    mapped.actor_email = item.actor ? item.actor.email : null;
    delete mapped.actor;
    return mapped;
  });
};

const countAuditLogs = async (filters = {}) => {
  const where = {};

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.actorUserId) {
    where.actorUserId = Number(filters.actorUserId);
  }

  return prisma.auditLog.count({ where });
};

module.exports = {
  createAuditLog,
  getAuditLogs,
  countAuditLogs,
};
