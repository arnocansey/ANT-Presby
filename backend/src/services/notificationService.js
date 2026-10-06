const notificationModel = require('../models/notificationModel');
const pushTokenModel = require('../models/pushTokenModel');
const pushService = require('./pushService');

/**
 * Single entry point for user notifications: creates in-app notifications, then pushes to devices.
 * These functions never throw: a failed notification must not fail the action that caused it.
 */

// Longest a caller waits for push; slower deliveries finish in the background and report 0.
// Kept well under the apps' 15 s request timeout so a slow Expo never makes an action look failed.
const PUSH_DEADLINE_MS = 5000;

// Best-effort push to the given devices; removes tokens Expo reports as no longer registered.
const deliverPush = async (loadTokens, { title, message, type, entityType, entityId }) => {
  try {
    const tokens = await loadTokens();
    const { sent, invalidTokens } = await pushService.sendPush(tokens, {
      title,
      body: message,
      data: { type, entityType, entityId },
    });
    if (invalidTokens.length > 0) {
      await pushTokenModel.deleteTokens(invalidTokens);
    }
    return sent;
  } catch (error) {
    console.warn('Push skipped:', error.message);
    return 0;
  }
};

const pushTo = (loadTokens, content) => {
  let timer;
  const deadline = new Promise((resolve) => {
    timer = setTimeout(() => resolve(0), PUSH_DEADLINE_MS);
  });
  return Promise.race([deliverPush(loadTokens, content), deadline]).finally(() => clearTimeout(timer));
};

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

  let inApp = 0;
  try {
    inApp = await notificationModel.createNotificationsForUsers(
      recipients,
      title,
      message,
      type,
      entityType,
      entityId
    );
  } catch (error) {
    console.warn('Notification skipped:', error.message);
  }

  const push = await pushTo(() => pushTokenModel.getTokensForUsers(recipients), {
    title,
    message,
    type,
    entityType,
    entityId,
  });
  return { inApp, push };
};

const notifyAll = async ({ title, message, type, entityType = null, entityId = null }) => {
  let inApp = 0;
  try {
    inApp = await notificationModel.createNotificationForAllUsers(title, message, type, entityType, entityId);
  } catch (error) {
    console.warn('Broadcast notification skipped:', error.message);
  }

  const push = await pushTo(() => pushTokenModel.getAllActiveTokens(), { title, message, type, entityType, entityId });
  return { inApp, push };
};

module.exports = {
  PUSH_DEADLINE_MS,
  notify,
  notifyAll,
};
