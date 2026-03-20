const express = require('express');
const eventController = require('../controllers/eventController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { handleValidationErrors, validateEventCreation } = require('../middleware/validators');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.post('/', validateEventCreation, handleValidationErrors, eventController.createEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
