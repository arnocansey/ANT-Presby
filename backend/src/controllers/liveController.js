const { apiResponse } = require('../utils/helpers');
const liveStreamModel = require('../models/liveStreamModel');
const auditLogModel = require('../models/auditLogModel');
const { notifyAll } = require('../services/notificationService');

/**
 * Livestream Controller - public status; admins go live (notifying everyone once) and end.
 */

const LIVE_ID = 1;

// Blank or missing links are stored as null.
const cleanLink = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null);

const getLive = async (req, res, next) => {
  try {
    const stream = await liveStreamModel.getLiveStream();
    res.json(apiResponse(true, liveStreamModel.toLiveState(stream), 'Livestream status'));
  } catch (error) {
    next(error);
  }
};

const startLive = async (req, res, next) => {
  try {
    const title = String(req.body.title).trim();
    const youtubeUrl = cleanLink(req.body.youtubeUrl);
    const facebookUrl = cleanLink(req.body.facebookUrl);

    const { stream, becameLive } = await liveStreamModel.startLive({
      title,
      youtubeUrl,
      facebookUrl,
      userId: Number(req.user.userId),
    });

    // becameLive was decided under the row lock; the push goes out after the commit.
    // notifyAll never throws.
    if (becameLive) {
      await notifyAll({
        title: `We're live: ${title}`,
        message: 'Tap to watch the livestream.',
        type: 'live',
        entityType: 'live',
        entityId: null,
      });
    }

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'live',
      entityId: LIVE_ID,
      action: becameLive ? 'start' : 'update',
      summary: becameLive ? `Went live: "${title}" and notified everyone` : `Updated the livestream links for "${title}"`,
      metadata: { youtubeUrl, facebookUrl },
    });

    res.json(
      apiResponse(
        true,
        { ...liveStreamModel.toLiveState(stream), notified: becameLive },
        becameLive ? "You're live. Everyone has been notified." : 'Livestream links updated'
      )
    );
  } catch (error) {
    next(error);
  }
};

const endLive = async (req, res, next) => {
  try {
    const { stream, wasLive } = await liveStreamModel.endLive({ userId: Number(req.user.userId) });

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'live',
      entityId: LIVE_ID,
      action: 'end',
      summary: wasLive ? 'Ended the livestream' : 'Pressed End while not live',
      metadata: { wasLive },
    });

    res.json(apiResponse(true, liveStreamModel.toLiveState(stream), wasLive ? 'Livestream ended' : 'The livestream was not live'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLive,
  startLive,
  endLive,
};
