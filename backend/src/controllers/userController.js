const { sanitizeUser, apiResponse, getPagination, buildPaginationMeta, parseId } = require('../utils/helpers');
const { toQrText } = require('../utils/checkInCode');
const userModel = require('../models/userModel');
const auditLogModel = require('../models/auditLogModel');
const imageStorage = require('../services/imageStorage');

// Get user profile
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userProfile = await userModel.getUserProfile(userId);

    if (!userProfile) {
      return res.status(404).json(apiResponse(false, null, 'User not found'));
    }

    res.json(apiResponse(true, userProfile, 'Profile retrieved'));
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, phone } = req.body;

    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phone) updates.phone = phone;

    const updatedUser = await userModel.updateUser(userId, updates);

    res.json(
      apiResponse(true, sanitizeUser(updatedUser), 'Profile updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

// Upload profile photo
const uploadProfilePhoto = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json(apiResponse(false, null, 'No photo uploaded'));
    }

    const current = await userModel.findUserById(userId);
    const { url } = await imageStorage.uploadImage(req.file, { kind: 'profile', actorId: userId });
    const updatedUser = await userModel.updateUserProfileImage(userId, url);

    // Only remove the old photo once the new one is saved.
    if (current?.profile_image_url && current.profile_image_url !== url) {
      await imageStorage.deleteImage(current.profile_image_url);
    }

    res.json(apiResponse(true, sanitizeUser(updatedUser), 'Profile photo uploaded'));
  } catch (error) {
    next(error);
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const { offset, limitNum } = getPagination(page, limit);
    const searchTerm = typeof search === 'string' ? search.trim().slice(0, 100) : '';

    const users = await userModel.getAllUsers(offset, limitNum, searchTerm);
    const total = await userModel.countUsers(searchTerm);
    const meta = buildPaginationMeta(total, page, limit);

    res.json(
      apiResponse(
        true,
        users.map(sanitizeUser),
        'Users retrieved',
        meta
      )
    );
  } catch (error) {
    next(error);
  }
};

// Get user by ID (admin only)
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userModel.findUserById(id);

    if (!user) {
      return res.status(404).json(apiResponse(false, null, 'User not found'));
    }

    res.json(apiResponse(true, sanitizeUser(user), 'User retrieved'));
  } catch (error) {
    next(error);
  }
};

// Update user role (admin only)
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['member', 'admin'].includes(role)) {
      return res.status(400).json(apiResponse(false, null, 'Invalid role'));
    }

    const updatedUser = await userModel.updateUserRole(id, role);

    if (!updatedUser) {
      return res.status(404).json(apiResponse(false, null, 'User not found'));
    }

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'user',
      entityId: Number(id),
      action: 'role_update',
      summary: `Updated user role to ${role}`,
      metadata: { role },
    });

    res.json(apiResponse(true, sanitizeUser(updatedUser), 'User role updated'));
  } catch (error) {
    next(error);
  }
};

// Delete user (admin only)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (String(req.user.userId) === String(id)) {
      return res.status(400).json(apiResponse(false, null, 'Cannot delete your own account'));
    }

    const result = await userModel.deleteUser(id);

    if (!result) {
      return res.status(404).json(apiResponse(false, null, 'User not found'));
    }

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'user',
      entityId: Number(id),
      action: 'delete',
      summary: `Deleted user #${id}`,
    });

    res.json(apiResponse(true, null, 'User deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const cardResponse = (code) => ({ code, qr_text: toQrText(code) });

// The signed-in member's check-in card (created the first time it is asked for)
const getMyCheckInCard = async (req, res, next) => {
  try {
    const code = await userModel.getOrCreateCheckInCode(req.user.userId);
    if (!code) return res.status(404).json(apiResponse(false, null, 'User not found'));
    res.json(apiResponse(true, cardResponse(code), 'Check-in card retrieved'));
  } catch (error) {
    next(error);
  }
};

const auditUser = (req, userId, action, summary) =>
  auditLogModel.createAuditLog({ actorUserId: req.user.userId, entityType: 'user', entityId: userId, action, summary, metadata: {} });

// Admin: turn "Can take attendance" on or off for a member. Admins already have full access.
const setUsher = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (typeof req.body?.enabled !== 'boolean') {
      return res.status(400).json(apiResponse(false, null, 'enabled must be true or false'));
    }
    const target = id ? await userModel.findUserById(id) : undefined;
    if (!target) return res.status(404).json(apiResponse(false, null, 'User not found'));
    if (target.role === 'admin') {
      return res.status(400).json(apiResponse(false, null, 'Admins already have attendance access'));
    }

    const updated = await userModel.setCanTakeAttendance(id, req.body.enabled);
    if (!updated) return res.status(404).json(apiResponse(false, null, 'User not found'));
    await auditUser(
      req,
      id,
      req.body.enabled ? 'usher_enabled' : 'usher_disabled',
      `${req.body.enabled ? 'Gave' : 'Removed'} attendance access for user #${id}`
    );
    res.json(apiResponse(true, updated, 'Attendance access updated'));
  } catch (error) {
    next(error);
  }
};

// Admin: issue a new card code; the old card stops working
const resetCheckInCard = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const code = id ? await userModel.resetCheckInCode(id) : undefined;
    if (!code) return res.status(404).json(apiResponse(false, null, 'User not found'));
    await auditUser(req, id, 'check_in_card_reset', `Reset the check-in card for user #${id}`);
    res.json(apiResponse(true, cardResponse(code), 'Check-in card reset'));
  } catch (error) {
    next(error);
  }
};

// Admin: cards to print, for chosen members (?ids=1,2) or every active member
const listCheckInCards = async (req, res, next) => {
  try {
    const ids =
      typeof req.query.ids === 'string' && req.query.ids.trim()
        ? req.query.ids.split(',').map(parseId).filter(Boolean).slice(0, 1000)
        : undefined;
    const cards = await userModel.listCheckInCards(ids && ids.length ? ids : undefined);
    res.json(apiResponse(true, cards, 'Check-in cards retrieved'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyCheckInCard,
  setUsher,
  resetCheckInCard,
  listCheckInCards,
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
};
