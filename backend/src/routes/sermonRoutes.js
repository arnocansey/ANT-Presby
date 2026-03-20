const express = require('express');
const sermonController = require('../controllers/sermonController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  handleValidationErrors,
  validateSermonCreation,
} = require('../middleware/validators');

const router = express.Router();

/**
 * Sermon Routes
 */

// Get all sermons (public)
router.get('/', sermonController.getAllSermons);

// Get recent sermons (public)
router.get('/recent', sermonController.getRecentSermons);

// Search sermons (public)
router.get('/search', sermonController.searchSermons);

// Get sermon by ID (public)
router.get('/:id', sermonController.getSermonById);

// Create sermon (admin only)
router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  validateSermonCreation,
  handleValidationErrors,
  sermonController.createSermon
);

// Update sermon (admin only)
router.put(
  '/:id',
  verifyToken,
  requireRole('admin'),
  sermonController.updateSermon
);

// Delete sermon (admin only)
router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  sermonController.deleteSermon
);

module.exports = router;
