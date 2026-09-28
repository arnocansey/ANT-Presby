const { apiResponse, getPagination, buildPaginationMeta } = require('../utils/helpers');
const prayerRequestModel = require('../models/prayerRequestModel');
const { notify } = require('../services/notificationService');

const parseId = (value) => {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 && String(id) === String(value) ? id : null;
};

const isOwnerOrAdmin = (prayerRequest, user) =>
  user.role === 'admin' || Number(prayerRequest.user_id) === Number(user.userId);

/**
 * Prayer Request Controller - Handles prayer request operations
 */

// Create prayer request
const createPrayerRequest = async (req, res, next) => {
  try {
    const { title, description, category, isAnonymous } = req.body;
    const userId = req.user.userId;

    const prayerRequest = await prayerRequestModel.createPrayerRequest(
      userId,
      title,
      description,
      category,
      isAnonymous || false
    );

    res.status(201).json(apiResponse(true, prayerRequest, 'Prayer request submitted'));
  } catch (error) {
    next(error);
  }
};

// Get all prayer requests (admin only)
const getAllPrayerRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;
    const { offset, limitNum } = getPagination(page, limit);

    const filters = {};
    if (status) filters.status = status;
    if (category) filters.category = category;

    const prayerRequests = await prayerRequestModel.getAllPrayerRequests(offset, limitNum, filters);
    const total = await prayerRequestModel.countPrayerRequests(filters);
    const meta = buildPaginationMeta(total, page, limit);

    res.json(apiResponse(true, prayerRequests, 'Prayer requests retrieved', meta));
  } catch (error) {
    next(error);
  }
};

// Get prayer request by ID
const getPrayerRequestById = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const prayerRequest = id ? await prayerRequestModel.getPrayerRequestById(id) : undefined;

    // 404 (not 403) so members can't discover which private requests exist.
    if (!prayerRequest || !isOwnerOrAdmin(prayerRequest, req.user)) {
      return res.status(404).json(apiResponse(false, null, 'Prayer request not found'));
    }

    res.json(apiResponse(true, prayerRequest, 'Prayer request retrieved'));
  } catch (error) {
    next(error);
  }
};

// Get user's prayer requests
const getUserPrayerRequests = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const { offset, limitNum } = getPagination(page, limit);

    const prayerRequests = await prayerRequestModel.getUserPrayerRequests(userId, offset, limitNum);

    res.json(apiResponse(true, prayerRequests, 'User prayer requests retrieved'));
  } catch (error) {
    next(error);
  }
};

// Update prayer request
const updatePrayerRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { title, description, category, isAnonymous } = req.body;

    // Check if user is the owner or admin
    const prayerRequest = await prayerRequestModel.getPrayerRequestById(id);
    if (!prayerRequest) {
      return res.status(404).json(apiResponse(false, null, 'Prayer request not found'));
    }

    if (prayerRequest.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(apiResponse(false, null, 'Unauthorized'));
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (isAnonymous !== undefined) updates.isAnonymous = isAnonymous;

    const updatedRequest = await prayerRequestModel.updatePrayerRequest(id, updates);

    res.json(apiResponse(true, updatedRequest, 'Prayer request updated'));
  } catch (error) {
    next(error);
  }
};

// Approve prayer request (admin only)
const approvePrayerRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;
    const prayerRequest = await prayerRequestModel.getPrayerRequestById(id);

    if (!prayerRequest) {
      return res.status(404).json(apiResponse(false, null, 'Prayer request not found'));
    }

    const updatedRequest = await prayerRequestModel.updatePrayerRequestStatus(
      id,
      'approved',
      adminId
    );

    await notify({
      userIds: [prayerRequest.user_id],
      title: 'Prayer update',
      message: `Your prayer request "${prayerRequest.title}" has been approved.`,
      type: 'prayer',
      entityType: 'prayer',
      entityId: Number(id),
    });

    res.json(apiResponse(true, updatedRequest, 'Prayer request approved'));
  } catch (error) {
    next(error);
  }
};

// Mark prayer as answered (admin only)
const markAsAnswered = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prayerRequest = await prayerRequestModel.getPrayerRequestById(id);

    if (!prayerRequest) {
      return res.status(404).json(apiResponse(false, null, 'Prayer request not found'));
    }

    const updatedRequest = await prayerRequestModel.updatePrayerRequestStatus(id, 'answered');

    await notify({
      userIds: [prayerRequest.user_id],
      title: 'Prayer answered update',
      message: `Your prayer request "${prayerRequest.title}" has been marked as answered.`,
      type: 'prayer',
      entityType: 'prayer',
      entityId: Number(id),
    });

    res.json(apiResponse(true, updatedRequest, 'Prayer marked as answered'));
  } catch (error) {
    next(error);
  }
};

// Delete prayer request
const deletePrayerRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user is the owner or admin
    const prayerRequest = await prayerRequestModel.getPrayerRequestById(id);
    if (!prayerRequest) {
      return res.status(404).json(apiResponse(false, null, 'Prayer request not found'));
    }

    if (prayerRequest.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(apiResponse(false, null, 'Unauthorized'));
    }

    const result = await prayerRequestModel.deletePrayerRequest(id);

    if (!result) {
      return res.status(404).json(apiResponse(false, null, 'Prayer request not found'));
    }

    res.json(apiResponse(true, null, 'Prayer request deleted'));
  } catch (error) {
    next(error);
  }
};

// Get prayer statistics (admin only)
const getPrayerStatistics = async (req, res, next) => {
  try {
    const stats = await prayerRequestModel.getPrayerStatistics();
    res.json(apiResponse(true, stats, 'Prayer statistics retrieved'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrayerRequest,
  getAllPrayerRequests,
  getPrayerRequestById,
  getUserPrayerRequests,
  updatePrayerRequest,
  approvePrayerRequest,
  markAsAnswered,
  deletePrayerRequest,
  getPrayerStatistics,
};
