const { apiResponse, getPagination } = require('../utils/helpers');
const sermonModel = require('../models/sermonModel');
const eventModel = require('../models/eventModel');

const searchAll = async (req, res, next) => {
  try {
    const searchQuery = (req.query.q || req.query.query || '').trim();
    const { page = 1, limit = 8 } = req.query;

    if (searchQuery.length < 2) {
      return res.status(400).json(apiResponse(false, null, 'Search query must be at least 2 characters'));
    }

    const { offset, limitNum } = getPagination(page, limit);
    const [sermons, events] = await Promise.all([
      sermonModel.searchSermons(searchQuery, offset, limitNum),
      eventModel.searchEvents(searchQuery, offset, limitNum),
    ]);

    res.json(
      apiResponse(
        true,
        {
          query: searchQuery,
          sermons,
          events,
          total: sermons.length + events.length,
        },
        'Search results retrieved'
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchAll,
};
