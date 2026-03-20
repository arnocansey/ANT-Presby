const express = require('express');
const prayerRequestController = require('../controllers/prayerRequestController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', prayerRequestController.getAllPrayerRequests);
router.post('/:id/approve', prayerRequestController.approvePrayerRequest);
router.post('/:id/answered', prayerRequestController.markAsAnswered);

module.exports = router;
