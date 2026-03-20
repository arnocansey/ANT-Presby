const express = require('express');
const donationController = require('../controllers/donationController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', donationController.getAllDonations);
router.get('/:id', donationController.getDonationById);
router.put('/:id/status', donationController.updateDonationStatus);
router.patch('/:id/status', donationController.updateDonationStatus);

module.exports = router;
