const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
} = require('../middleware/validators');

const router = express.Router();

router.post(
  '/register',
  validateUserRegistration,
  handleValidationErrors,
  authController.register
);

router.post(
  '/login',
  validateUserLogin,
  handleValidationErrors,
  authController.login
);

router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, authController.getCurrentUser);
router.post('/refresh', authController.refreshToken);

module.exports = router;
