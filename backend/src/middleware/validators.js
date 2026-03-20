const { validationResult, body } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
    }));
    return res.status(400).json({
      error: 'Validation failed',
      details: errorMessages,
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain uppercase, lowercase, and numbers'
    ),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('phone')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone number'),
  body('acceptedTerms')
    .custom((value) => value === true)
    .withMessage('You must accept the terms and agreement'),
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty'),
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone number'),
];

// Sermon validation rules
const validateSermonCreation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('speaker').trim().notEmpty().withMessage('Speaker is required'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('videoUrl').isURL().withMessage('Invalid video URL'),
  body('sermonDate')
    .isISO8601()
    .withMessage('Invalid sermon date format'),
  body('ministryId')
    .isInt({ min: 1 })
    .withMessage('Valid ministry ID is required'),
];

// Event validation rules
const validateEventCreation = [
  body('name').trim().notEmpty().withMessage('Event name is required'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('eventDate')
    .isISO8601()
    .withMessage('Invalid event date format'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('maxRegistrations')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max registrations must be a positive integer'),
];

// Prayer request validation rules
const validatePrayerRequest = [
  body('title').trim().notEmpty().withMessage('Prayer request title is required'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Prayer description is required'),
  body('category')
    .isIn(['personal', 'family', 'health', 'work', 'financial', 'other'])
    .withMessage('Invalid prayer category'),
];

// Donation validation rules
const validateDonation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Donation amount must be greater than 0'),
  body('donationType')
    .isIn(['tithe', 'offering', 'ministry', 'emergency', 'general'])
    .withMessage('Invalid donation type'),
  body('paymentMethod')
    .isIn(['bank_transfer', 'momo', 'card', 'cash'])
    .withMessage('Invalid payment method'),
];

// Contact message validation rules
const validateContactMessage = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Message must be at least 10 characters'),
];

// News post validation rules
const validateNewsPost = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('summary').trim().notEmpty().withMessage('Summary is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('status')
    .optional()
    .isIn(['draft', 'review', 'scheduled', 'published', 'archived'])
    .withMessage('Invalid news status'),
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('featured must be a boolean'),
  body('scheduledFor')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('scheduledFor must be a valid datetime'),
  body('slug')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 2 })
    .withMessage('slug must be at least 2 characters'),
  body('imageUrl')
    .optional()
    .custom((value) => {
      if (!value) return true;
      if (String(value).startsWith('/uploads/')) return true;
      return /^https?:\/\//i.test(String(value));
    })
    .withMessage('imageUrl must be a valid URL or uploaded asset path'),
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateSermonCreation,
  validateEventCreation,
  validatePrayerRequest,
  validateDonation,
  validateContactMessage,
  validateNewsPost,
};

