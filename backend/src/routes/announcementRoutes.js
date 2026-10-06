const express = require('express');
const announcementController = require('../controllers/announcementController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { handleValidationErrors, validateAnnouncement } = require('../middleware/validators');

const router = express.Router();

router.post('/', isAuthenticated, validateAnnouncement, handleValidationErrors, announcementController.sendAnnouncement);
router.get('/sent', isAuthenticated, announcementController.listSent);

module.exports = router;
