const express = require('express');
const donationController = require('../controllers/donationController');
const { verifyToken, requireRole, isAuthenticated } = require('../middleware/authMiddleware');
const {
  handleValidationErrors,
  validateDonation,
} = require('../middleware/validators');

const router = express.Router();

// The Paystack webhook (POST /api/donations/webhook) is mounted in server.js ahead of the JSON body parser.

router.post(
  '/',
  isAuthenticated,
  validateDonation,
  handleValidationErrors,
  donationController.createDonation
);

router.post(
  '/initialize-payment',
  isAuthenticated,
  validateDonation,
  handleValidationErrors,
  donationController.initializeDonationPayment
);

router.get('/verify/:reference', isAuthenticated, donationController.verifyDonationPayment);

router.get(
  '/',
  verifyToken,
  requireRole('admin'),
  donationController.getAllDonations
);

router.get(
  '/user/donations',
  isAuthenticated,
  donationController.getUserDonations
);

router.get(
  '/:id',
  isAuthenticated,
  donationController.getDonationById
);

router.patch(
  '/:id/status',
  verifyToken,
  requireRole('admin'),
  donationController.updateDonationStatus
);

router.put(
  '/:id',
  isAuthenticated,
  donationController.updateDonation
);

router.delete(
  '/:id',
  isAuthenticated,
  donationController.deleteDonation
);

router.get(
  '/stats/overview',
  verifyToken,
  requireRole('admin'),
  donationController.getDonationStatistics
);

module.exports = router;
