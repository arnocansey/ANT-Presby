const express = require('express');
const eventController = require('../controllers/eventController');
const { verifyToken, requireRole, isAuthenticated } = require('../middleware/authMiddleware');
const {
  handleValidationErrors,
  validateEventCreation,
} = require('../middleware/validators');

const router = express.Router();

/**
 * Event Routes
 */

// Get all events (public)
router.get('/', eventController.getAllEvents);

// Get upcoming events (public)
router.get('/upcoming', eventController.getUpcomingEvents);

// Get user event registrations
router.get('/registrations/user', isAuthenticated, eventController.getUserRegistrations);

// Get event by ID (public)
router.get('/:id', eventController.getEventById);

// Create event (admin only)
router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  validateEventCreation,
  handleValidationErrors,
  eventController.createEvent
);

// Update event (admin only)
router.put(
  '/:id',
  verifyToken,
  requireRole('admin'),
  eventController.updateEvent
);

// Delete event (admin only)
router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  eventController.deleteEvent
);

// Register for event (authenticated users)
router.post('/:id/register', isAuthenticated, eventController.registerForEvent);

// Cancel event registration
router.delete('/:id/register', isAuthenticated, eventController.cancelEventRegistration);

// Get event attendees (admin only)
router.get('/:id/attendees', verifyToken, requireRole('admin'), eventController.getEventAttendees);

module.exports = router;


