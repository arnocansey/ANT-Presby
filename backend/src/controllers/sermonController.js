const { apiResponse, getPagination, buildPaginationMeta } = require('../utils/helpers');
const sermonModel = require('../models/sermonModel');

/**
 * Sermon Controller - Handles sermon operations
 */

// Create sermon (admin only)
const createSermon = async (req, res, next) => {
  try {
    const { title, speaker, description, videoUrl, sermonDate, ministryId } = req.body;

    const sermon = await sermonModel.createSermon(
      title,
      speaker,
      description,
      videoUrl,
      sermonDate,
      ministryId
    );

    res.status(201).json(apiResponse(true, sermon, 'Sermon created successfully'));
  } catch (error) {
    next(error);
  }
};

// Get all sermons with pagination
const getAllSermons = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, ministry_id, speaker } = req.query;
    const { offset, limitNum } = getPagination(page, limit);

    const filters = {};
    if (ministry_id) filters.ministryId = parseInt(ministry_id, 10);
    if (speaker) filters.speaker = speaker;

    const sermons = await sermonModel.getAllSermons(offset, limitNum, filters);
    const total = await sermonModel.countSermons(filters);
    const meta = buildPaginationMeta(total, page, limit);

    res.json(
      apiResponse(true, sermons, 'Sermons retrieved', meta)
    );
  } catch (error) {
    next(error);
  }
};

// Get sermon by ID
const getSermonById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sermon = await sermonModel.getSermonById(id);

    if (!sermon) {
      return res.status(404).json(apiResponse(false, null, 'Sermon not found'));
    }

    res.json(apiResponse(true, sermon, 'Sermon retrieved'));
  } catch (error) {
    next(error);
  }
};

// Get recent sermons
const getRecentSermons = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const sermons = await sermonModel.getRecentSermons(parseInt(limit, 10));

    res.json(apiResponse(true, sermons, 'Recent sermons retrieved'));
  } catch (error) {
    next(error);
  }
};

// Search sermons
const searchSermons = async (req, res, next) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json(apiResponse(false, null, 'Search term must be at least 2 characters'));
    }

    const { offset, limitNum } = getPagination(page, limit);
    const sermons = await sermonModel.searchSermons(query, offset, limitNum);

    res.json(apiResponse(true, sermons, 'Search results retrieved'));
  } catch (error) {
    next(error);
  }
};

// Update sermon (admin only)
const updateSermon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedSermon = await sermonModel.updateSermon(id, updates);

    if (!updatedSermon) {
      return res.status(404).json(apiResponse(false, null, 'Sermon not found'));
    }

    res.json(apiResponse(true, updatedSermon, 'Sermon updated successfully'));
  } catch (error) {
    next(error);
  }
};

// Delete sermon (admin only)
const deleteSermon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await sermonModel.deleteSermon(id);

    if (!result) {
      return res.status(404).json(apiResponse(false, null, 'Sermon not found'));
    }

    res.json(apiResponse(true, null, 'Sermon deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSermon,
  getAllSermons,
  getSermonById,
  getRecentSermons,
  searchSermons,
  updateSermon,
  deleteSermon,
};
