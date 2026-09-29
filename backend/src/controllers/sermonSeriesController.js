const { apiResponse, parseId } = require('../utils/helpers');
const sermonSeriesModel = require('../models/sermonSeriesModel');

/**
 * Sermon Series Controller
 */

const notFound = (res) => res.status(404).json(apiResponse(false, null, 'Sermon series not found'));

// List series (public)
const listSeries = async (req, res, next) => {
  try {
    const series = await sermonSeriesModel.listSeries();
    res.json(apiResponse(true, series, 'Sermon series retrieved'));
  } catch (error) {
    next(error);
  }
};

// Get one series with its sermons (public)
const getSeries = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const series = id ? await sermonSeriesModel.getSeriesWithSermons(id) : undefined;

    if (!series) {
      return notFound(res);
    }

    res.json(apiResponse(true, series, 'Sermon series retrieved'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSeries,
  getSeries,
};
