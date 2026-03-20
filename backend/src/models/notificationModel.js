const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

// Create notification for a single user
const createNotification = async (userId, title, message, type, entityType = null, entityId = null) => {
  const notification = await prisma.notification.create({
    data: {
      userId: Number(userId),
      title,
      message,
      type,
      entityType,
      entityId,
      isRead: false,
    },
  });

  return toSnakeCaseObject(notification);
};

// Broadcast notification to all active users
const createNotificationForAllUsers = async (title, message, type, entityType = null, entityId = null) => {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  if (users.length === 0) {
    return 0;
  }

  const result = await prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      title,
      message,
      type,
      entityType,
      entityId,
      isRead: false,
    })),
  });

  return result.count;
};

// Get notifications for a user
const getUserNotifications = async (userId, offset = 0, limit = 20, unreadOnly = false) => {
  const where = {
    userId: Number(userId),
  };

  if (unreadOnly) {
    where.isRead = false;
  }

  const notifications = await prisma.notification.findMany({
    where,
    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      entityType: true,
      entityId: true,
      isRead: true,
      createdAt: true,
    },
  });

  return toSnakeCaseObject(notifications);
};

// Count unread notifications
const countUnreadNotifications = async (userId) =>
  prisma.notification.count({
    where: {
      userId: Number(userId),
      isRead: false,
    },
  });

// Mark one notification as read
const markNotificationRead = async (userId, notificationId) => {
  const parsedUserId = Number(userId);
  const parsedNotificationId = Number(notificationId);
  const updated = await prisma.notification.updateMany({
    where: {
      id: parsedNotificationId,
      userId: parsedUserId,
    },
    data: {
      isRead: true,
    },
  });

  if (updated.count === 0) {
    return undefined;
  }

  const notification = await prisma.notification.findFirst({
    where: {
      id: parsedNotificationId,
      userId: parsedUserId,
    },
  });

  return toSnakeCaseObject(notification);
};

// Mark all notifications as read
const markAllNotificationsRead = async (userId) => {
  const result = await prisma.notification.updateMany({
    where: {
      userId: Number(userId),
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return result.count;
};

module.exports = {
  createNotification,
  createNotificationForAllUsers,
  getUserNotifications,
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
