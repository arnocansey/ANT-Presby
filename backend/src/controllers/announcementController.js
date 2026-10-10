const { apiResponse } = require('../utils/helpers');
const announcementModel = require('../models/announcementModel');
const groupModel = require('../models/groupModel');
const { canManageGroup } = require('./groupController');
const eventModel = require('../models/eventModel');
const userModel = require('../models/userModel');
const auditLogModel = require('../models/auditLogModel');
const { notify } = require('../services/notificationService');

/**
 * Announcement Controller - admins announce to anyone; group leaders to their own group.
 */

const fail = (res, status, message) => res.status(status).json(apiResponse(false, null, message));

const sendAnnouncement = async (req, res, next) => {
  try {
    const { title, message, audience } = req.body;
    const isAdmin = req.user.role === 'admin';
    const groupId = audience === 'group' ? Number(req.body.groupId) : null;
    const eventId = audience === 'event' ? Number(req.body.eventId) : null;

    if (audience !== 'group' && !isAdmin) {
      return fail(res, 403, 'Only admins can send to this audience');
    }

    let recipients;
    if (audience === 'group') {
      const group = await groupModel.getGroupById(groupId);
      if (!group) return fail(res, 404, 'Group not found');
      if (!isAdmin && !(await canManageGroup(req.user, groupId))) {
        return fail(res, 403, "Only this group's leaders can message it");
      }
      recipients = await announcementModel.getGroupMemberIds(groupId);
    } else if (audience === 'event') {
      const event = await eventModel.getEventById(eventId);
      if (!event) return fail(res, 404, 'Event not found');
      recipients = await announcementModel.getEventAudienceIds(eventId);
    } else {
      recipients = await userModel.getAllUserIds();
    }

    // The sender never notifies themselves.
    recipients = recipients.filter((id) => Number(id) !== Number(req.user.userId));
    if (recipients.length === 0) {
      return fail(res, 400, 'This audience has no members yet');
    }

    const announcement = await announcementModel.createAnnouncement({
      title: String(title).trim(),
      message: String(message).trim(),
      audience,
      groupId,
      eventId,
      sentBy: Number(req.user.userId),
      recipientCount: recipients.length,
    });

    const result = await notify({
      userIds: recipients,
      title: announcement.title,
      message: announcement.message,
      type: 'announcement',
      entityType: audience === 'group' ? 'group' : audience === 'event' ? 'event' : 'announcement',
      entityId: groupId || eventId || announcement.id,
    });
    // The announcement has been delivered; bookkeeping failures must not report an error
    // (that would invite the sender to resend it to everyone).
    try {
      await announcementModel.setPushCount(announcement.id, result.push);
    } catch (error) {
      console.warn('Announcement push count not saved:', error.message);
    }
    try {
      await auditLogModel.createAuditLog({
        actorUserId: req.user.userId,
        entityType: 'announcement',
        entityId: announcement.id,
        action: 'send',
        summary: `Sent announcement "${announcement.title}" to ${audience} (${recipients.length} people)`,
        metadata: { audience, groupId, eventId },
      });
    } catch (error) {
      console.warn('Announcement audit entry not saved:', error.message);
    }

    res.status(201).json(
      apiResponse(
        true,
        {
          id: announcement.id,
          title: announcement.title,
          message: announcement.message,
          audience,
          group_id: groupId,
          event_id: eventId,
          recipient_count: recipients.length,
          push_count: result.push,
          created_at: announcement.createdAt,
        },
        'Announcement sent'
      )
    );
  } catch (error) {
    next(error);
  }
};

const listSent = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return res.json(apiResponse(true, await announcementModel.listSent(null), 'Announcements retrieved'));
    }

    const groupIds = await announcementModel.getLedGroupIds(req.user.userId);
    const announcements = groupIds.length > 0 ? await announcementModel.listSent(groupIds) : [];
    res.json(apiResponse(true, announcements, 'Announcements retrieved'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendAnnouncement,
  listSent,
};
