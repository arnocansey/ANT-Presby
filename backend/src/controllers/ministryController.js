const { apiResponse, getPagination, buildPaginationMeta } = require('../utils/helpers');
const ministryModel = require('../models/ministryModel');

/**
 * Ministry Controller - Handles ministry operations
 */

// Create ministry (admin only)
const createMinistry = async (req, res, next) => {
  try {
    const { name, description, leaderName } = req.body;

    const ministry = await ministryModel.createMinistry(name, description, leaderName);

    res.status(201).json(apiResponse(true, ministry, 'Ministry created successfully'));
  } catch (error) {
    next(error);
  }
};

// Get all ministries
const getAllMinistries = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { offset, limitNum } = getPagination(page, limit);

    const ministries = await ministryModel.getAllMinistries(offset, limitNum);
    const total = await ministryModel.countMinistries();
    const meta = buildPaginationMeta(total, page, limit);

    res.json(apiResponse(true, ministries, 'Ministries retrieved', meta));
  } catch (error) {
    next(error);
  }
};

// Get ministry by ID
const getMinistryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ministry = await ministryModel.getMinistryById(id);

    if (!ministry) {
      return res.status(404).json(apiResponse(false, null, 'Ministry not found'));
    }

    res.json(apiResponse(true, ministry, 'Ministry retrieved'));
  } catch (error) {
    next(error);
  }
};

// Get ministry with sermons
const getMinistryWithSermons = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { offset, limitNum } = getPagination(page, limit);

    const ministry = await ministryModel.getMinistryWithSermons(id, offset, limitNum);

    if (!ministry) {
      return res.status(404).json(apiResponse(false, null, 'Ministry not found'));
    }

    res.json(apiResponse(true, ministry, 'Ministry with sermons retrieved'));
  } catch (error) {
    next(error);
  }
};

// Update ministry (admin only)
const updateMinistry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedMinistry = await ministryModel.updateMinistry(id, updates);

    if (!updatedMinistry) {
      return res.status(404).json(apiResponse(false, null, 'Ministry not found'));
    }

    res.json(apiResponse(true, updatedMinistry, 'Ministry updated successfully'));
  } catch (error) {
    next(error);
  }
};

// Delete ministry (admin only)
const deleteMinistry = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await ministryModel.deleteMinistry(id);

    if (!result) {
      return res.status(404).json(apiResponse(false, null, 'Ministry not found'));
    }

    res.json(apiResponse(true, null, 'Ministry deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMinistry,
  getAllMinistries,
  getMinistryById,
  getMinistryWithSermons,
  updateMinistry,
  deleteMinistry,
};
