const { apiResponse, parseId, getPagination, buildPaginationMeta } = require('../utils/helpers');
const devotionalModel = require('../models/devotionalModel');
const { getChurchToday } = require('../utils/dates');

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

module.exports = {
  getToday,
  listArchive,
  getOne,
};
