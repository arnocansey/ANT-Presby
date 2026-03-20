const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  handleValidationErrors,
  validateUserUpdate,
} = require('../middleware/validators');
const { profilePhotoUpload } = require('../middleware/uploadMiddleware');

const router = express.Router();

/**
 * User Routes
 */

// Get current user profile
router.get('/profile', verifyToken, userController.getProfile);

// Update current user profile
router.put(
  '/profile',
  verifyToken,
  validateUserUpdate,
  handleValidationErrors,
  userController.updateProfile
);

// Upload profile photo
router.put(
  '/profile/photo',
  verifyToken,
  profilePhotoUpload.single('photo'),
  userController.uploadProfilePhoto
);

// Admin routes
// Get all users
router.get('/', verifyToken, requireRole('admin'), userController.getAllUsers);

// Get user by ID
router.get('/:id', verifyToken, requireRole('admin'), userController.getUserById);

// Update user role
router.put(
  '/:id/role',
  verifyToken,
  requireRole('admin'),
  userController.updateUserRole
);

// Delete user
router.delete('/:id', verifyToken, requireRole('admin'), userController.deleteUser);

module.exports = router;
