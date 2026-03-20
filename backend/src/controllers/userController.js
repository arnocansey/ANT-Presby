const { sanitizeUser, apiResponse, getPagination, buildPaginationMeta } = require('../utils/helpers');
const userModel = require('../models/userModel');
const auditLogModel = require('../models/auditLogModel');

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

    const photoUrl = `/uploads/profile-images/${req.file.filename}`;
    const updatedUser = await userModel.updateUserProfileImage(userId, photoUrl);

    res.json(apiResponse(true, sanitizeUser(updatedUser), 'Profile photo uploaded'));
  } catch (error) {
    next(error);
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { offset, limitNum } = getPagination(page, limit);

    const users = await userModel.getAllUsers(offset, limitNum);
    const total = await userModel.countUsers();
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

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
};
