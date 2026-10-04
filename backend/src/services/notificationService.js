const notificationModel = require('../models/notificationModel');

/**
 * Single entry point for user notifications.
 * Phase 6 adds push delivery here; callers never need to change.
 * These functions never throw: a failed notification must not fail the action that caused it.
 */

const toRecipientIds = (userIds = []) => [
  ...new Set(
    (Array.isArray(userIds) ? userIds : [])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)
  ),
];

const notify = async ({ userIds, title, message, type, entityType = null, entityId = null }) => {
  const recipients = toRecipientIds(userIds);

  if (recipients.length === 0) {
    return { inApp: 0, push: 0 };
  }

  try {
    const inApp = await notificationModel.createNotificationsForUsers(
      recipients,
      title,
      message,
      type,
      entityType,
      entityId
    );
    return { inApp, push: 0 };
  } catch (error) {
    console.warn('Notification skipped:', error.message);
    return { inApp: 0, push: 0 };
  }
};

const notifyAll = async ({ title, message, type, entityType = null, entityId = null }) => {
  try {
    const inApp = await notificationModel.createNotificationForAllUsers(
      title,
      message,
      type,
      entityType,
      entityId
    );
    return { inApp, push: 0 };
  } catch (error) {
    console.warn('Broadcast notification skipped:', error.message);
    return { inApp: 0, push: 0 };
  }
};

module.exports = {
  notify,
  notifyAll,
};
