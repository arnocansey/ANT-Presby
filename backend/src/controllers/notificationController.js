const { apiResponse, getPagination } = require('../utils/helpers');
const notificationModel = require('../models/notificationModel');

const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, unread_only } = req.query;
    const unreadOnly = unread_only === 'true';
    const { offset, limitNum } = getPagination(page, limit);

    const notifications = await notificationModel.getUserNotifications(
      userId,
      offset,
      limitNum,
      unreadOnly
    );
    const unreadCount = await notificationModel.countUnreadNotifications(userId);

    res.json(
      apiResponse(
        true,
        { notifications, unread_count: unreadCount },
        'Notifications retrieved'
      )
    );
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const notification = await notificationModel.markNotificationRead(userId, id);
    if (!notification) {
      return res.status(404).json(apiResponse(false, null, 'Notification not found'));
    }

    res.json(apiResponse(true, notification, 'Notification marked as read'));
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const updatedCount = await notificationModel.markAllNotificationsRead(userId);

    res.json(
      apiResponse(
        true,
        { updated_count: updatedCount },
        'All notifications marked as read'
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
