const express = require('express');
const prayerRequestController = require('../controllers/prayerRequestController');
const { verifyToken, requireRole, isAuthenticated } = require('../middleware/authMiddleware');
const {
  handleValidationErrors,
  validatePrayerRequest,
} = require('../middleware/validators');

const router = express.Router();

/**
 * Prayer Request Routes
 */

// Create prayer request (authenticated users)
router.post(
  '/',
  isAuthenticated,
  validatePrayerRequest,
  handleValidationErrors,
  prayerRequestController.createPrayerRequest
);

// Get all prayer requests (admin only)
router.get(
  '/',
  verifyToken,
  requireRole('admin'),
  prayerRequestController.getAllPrayerRequests
);

// Get user's prayer requests
router.get(
  '/user/requests',
  isAuthenticated,
  prayerRequestController.getUserPrayerRequests
);

// Get prayer request by ID
router.get('/:id', isAuthenticated, prayerRequestController.getPrayerRequestById);

// Update prayer request
router.put(
  '/:id',
  isAuthenticated,
  validatePrayerRequest,
  handleValidationErrors,
  prayerRequestController.updatePrayerRequest
);

// Approve prayer request (admin only)
router.post(
  '/:id/approve',
  verifyToken,
  requireRole('admin'),
  prayerRequestController.approvePrayerRequest
);

// Mark prayer as answered (admin only)
router.post(
  '/:id/answered',
  verifyToken,
  requireRole('admin'),
  prayerRequestController.markAsAnswered
);

// Delete prayer request
router.delete(
  '/:id',
  isAuthenticated,
  prayerRequestController.deletePrayerRequest
);

// Get prayer statistics (admin only)
router.get(
  '/stats/overview',
  verifyToken,
  requireRole('admin'),
  prayerRequestController.getPrayerStatistics
);

module.exports = router;
