const express = require('express');
const contactController = require('../controllers/contactController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { validateContactMessage, handleValidationErrors } = require('../middleware/validators');

const router = express.Router();

router.post('/', validateContactMessage, handleValidationErrors, contactController.submitContactMessage);
router.get('/', verifyToken, requireRole('admin'), contactController.getContactMessages);
router.post('/:id/read', verifyToken, requireRole('admin'), contactController.markContactMessageRead);

module.exports = router;
