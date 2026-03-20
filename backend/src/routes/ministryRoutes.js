const express = require('express');
const ministryController = require('../controllers/ministryController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Ministry Routes
 */

// Get all ministries (public)
router.get('/', ministryController.getAllMinistries);

// Get ministry by ID (public)
router.get('/:id', ministryController.getMinistryById);

// Get ministry with sermons (public)
router.get('/:id/sermons', ministryController.getMinistryWithSermons);

// Create ministry (admin only)
router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  ministryController.createMinistry
);

// Update ministry (admin only)
router.put(
  '/:id',
  verifyToken,
  requireRole('admin'),
  ministryController.updateMinistry
);

// Delete ministry (admin only)
router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  ministryController.deleteMinistry
);

module.exports = router;
