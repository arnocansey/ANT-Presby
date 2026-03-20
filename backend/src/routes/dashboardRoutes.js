const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Admin Dashboard Routes - All require admin authentication
 */

// Get dashboard overview
router.get(
  '/overview',
  verifyToken,
  requireRole('admin'),
  dashboardController.getDashboardOverview
);

// Get recent activities
router.get(
  '/activities',
  verifyToken,
  requireRole('admin'),
  dashboardController.getRecentActivities
);

// Get user growth statistics
router.get(
  '/stats/users',
  verifyToken,
  requireRole('admin'),
  dashboardController.getUserGrowthStats
);

// Get revenue statistics
router.get(
  '/stats/revenue',
  verifyToken,
  requireRole('admin'),
  dashboardController.getRevenueStats
);

// Get content statistics
router.get(
  '/stats/content',
  verifyToken,
  requireRole('admin'),
  dashboardController.getContentStats
);

// Get engagement statistics
router.get(
  '/stats/engagement',
  verifyToken,
  requireRole('admin'),
  dashboardController.getEngagementStats
);

// Get system health
router.get(
  '/health',
  verifyToken,
  requireRole('admin'),
  dashboardController.getSystemHealth
);

module.exports = router;
