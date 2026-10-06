const { apiResponse, parseId, getPagination, buildPaginationMeta } = require('../utils/helpers');
const devotionalModel = require('../models/devotionalModel');
const { getChurchToday } = require('../utils/dates');
const auditLogModel = require('../models/auditLogModel');
const { notifyAll } = require('../services/notificationService');

/**
 * Devotional Controller
 */

const NOT_FOUND = 'Devotional not found';
const fail = (res, status, message) => res.status(status).json(apiResponse(false, null, message));

// Today's devotional (or the latest past one); data is null when nothing is published yet.
const getToday = async (req, res, next) => {
  try {
    const devotional = await devotionalModel.getTodayDevotional(getChurchToday());
    res.json(apiResponse(true, devotional, devotional ? 'Devotional retrieved' : 'No devotional published yet'));
  } catch (error) {
    next(error);
  }
};

const listArchive = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { offset, limitNum } = getPagination(page, limit);
    const today = getChurchToday();
    const [devotionals, total] = await Promise.all([
      devotionalModel.listPublished({ offset, limit: limitNum, today }),
      devotionalModel.countPublished(today),
    ]);
    res.json(apiResponse(true, devotionals, 'Devotionals retrieved', buildPaginationMeta(total, page, limit)));
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const devotional = id ? await devotionalModel.getPublishedById(id, getChurchToday()) : undefined;
    if (!devotional) return fail(res, 404, NOT_FOUND);
    res.json(apiResponse(true, devotional, 'Devotional retrieved'));
  } catch (error) {
    next(error);
  }
};

// ---- Admin ----

const audit = (req, action, entityId, summary) =>
  auditLogModel.createAuditLog({ actorUserId: req.user.userId, entityType: 'devotional', entityId, action, summary, metadata: {} });

const DATE_TAKEN = 'A devotional is already scheduled for that date';

const pickInput = (body) => ({
  title: body.title,
  scriptureReference: body.scriptureReference,
  scriptureText: body.scriptureText,
  body: body.body,
  prayer: body.prayer,
  publishDate: body.publishDate,
  status: body.status,
});

const adminList = async (req, res, next) => {
  try {
    res.json(apiResponse(true, await devotionalModel.listAll(), 'Devotionals retrieved'));
  } catch (error) {
    next(error);
  }
};

const adminCreate = async (req, res, next) => {
  try {
    const devotional = await devotionalModel.createDevotional(pickInput(req.body), req.user.userId);
    await audit(req, 'create', devotional.id, `Created devotional for ${devotional.publish_date}`);
    res.status(201).json(apiResponse(true, devotional, 'Devotional created'));
  } catch (error) {
    if (error?.code === 'P2002') return fail(res, 409, DATE_TAKEN);
    next(error);
  }
};

const adminUpdate = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const devotional = id ? await devotionalModel.updateDevotional(id, pickInput(req.body)) : undefined;
    if (!devotional) return fail(res, 404, NOT_FOUND);
    await audit(req, 'update', id, `Updated devotional for ${devotional.publish_date}`);
    res.json(apiResponse(true, devotional, 'Devotional updated'));
  } catch (error) {
    if (error?.code === 'P2002') return fail(res, 409, DATE_TAKEN);
    next(error);
  }
};

const adminDelete = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const removed = id ? await devotionalModel.deleteDevotional(id) : 0;
    if (!removed) return fail(res, 404, NOT_FOUND);
    await audit(req, 'delete', id, `Deleted devotional #${id}`);
    res.json(apiResponse(true, null, 'Devotional deleted'));
  } catch (error) {
    next(error);
  }
};

// Publish, and notify everyone once, on the devotional's own day.
const adminPublish = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const devotional = id ? await devotionalModel.publish(id) : undefined;
    if (!devotional) return fail(res, 404, NOT_FOUND);

    let notified = false;
    if (devotional.publish_date === getChurchToday() && (await devotionalModel.claimNotification(id))) {
      await notifyAll({
        title: "Today's devotional",
        message: `${devotional.title} (${devotional.scripture_reference || 'read today'})`,
        type: 'devotional',
        entityType: 'devotional',
        entityId: id,
      });
      notified = true;
    }

    await audit(req, 'publish', id, `Published devotional for ${devotional.publish_date}${notified ? ' and notified everyone' : ''}`);
    res.json(apiResponse(true, { devotional, notified }, notified ? 'Published and notified everyone' : 'Published'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getToday,
  listArchive,
  getOne,
  adminList,
  adminCreate,
  adminUpdate,
  adminDelete,
  adminPublish,
};
