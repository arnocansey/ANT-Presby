const { validationResult, body } = require('express-validator');
const { MAX_DB_ID } = require('../utils/helpers');
const { isOwnImageUrl } = require('../services/imageStorage');

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
    .isInt({ min: 1, max: MAX_DB_ID })
    .withMessage('Valid ministry ID is required'),
];

// Optional series link on sermon create/update. null clears it.
const validateSermonSeriesLink = [
  body('seriesId')
    .optional({ values: 'null' })
    .isInt({ min: 1, max: MAX_DB_ID })
    .withMessage('seriesId must be a positive integer or null'),
];

const validateSermonSeries = [
  body('title')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Series title is required')
    .isLength({ max: 255 })
    .withMessage('Series title must be 255 characters or fewer'),
  body('description').optional({ values: 'null' }).isString().withMessage('Description must be text'),
  // Covers can only be images we stored ourselves: a series upload on disk or in our Cloudinary folder.
  body('coverImageUrl')
    .optional({ values: 'falsy' })
    .custom((value) => isOwnImageUrl(value, 'series'))
    .withMessage('Cover image must be uploaded through the series image upload'),
  // Date-only values: a real calendar date in YYYY-MM-DD (rejects "20260901", "2026-02-30", timestamps).
  body('startDate')
    .optional({ values: 'falsy' })
    .isDate({ format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] })
    .withMessage('Start date must be a real date in YYYY-MM-DD format'),
  body('endDate')
    .optional({ values: 'falsy' })
    .isDate({ format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] })
    .withMessage('End date must be a real date in YYYY-MM-DD format')
    .bail()
    .custom((endDate, { req }) => !req.body.startDate || new Date(endDate) >= new Date(req.body.startDate))
    .withMessage('End date cannot be before the start date'),
];

// Check-in body: exactly one of a member (userId) or a walk-in guest (guestName).
const validateCheckIn = [
  body('userId')
    .optional({ values: 'null' })
    .isInt({ min: 1, max: MAX_DB_ID })
    .withMessage('userId must be a positive integer'),
  body('guestName')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Guest name must be text')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Guest name cannot be blank')
    .isLength({ max: 255 })
    .withMessage('Guest name must be 255 characters or fewer'),
  body().custom((value) => {
    const hasMember = value?.userId !== undefined && value?.userId !== null;
    const hasGuest = value?.guestName !== undefined && value?.guestName !== null;
    if (hasMember === hasGuest) {
      throw new Error('Send either userId or guestName');
    }
    return true;
  }),
];

const MEETING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Small group create/update. Optional fields accept null (clears them).
const validateGroup = [
  body('name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ max: 255 })
    .withMessage('Group name must be 255 characters or fewer'),
  body('description')
    .optional({ values: 'null' })
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Description must be 2000 characters or fewer'),
  body('meetingDay')
    .optional({ values: 'falsy' })
    .isIn(MEETING_DAYS)
    .withMessage(`Meeting day must be one of ${MEETING_DAYS.join(', ')}`),
  body('meetingTime')
    .optional({ values: 'falsy' })
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('Meeting time must be HH:MM (24-hour)'),
  body('location')
    .optional({ values: 'null' })
    .isString()
    .isLength({ max: 255 })
    .withMessage('Location must be 255 characters or fewer'),
  body('capacity')
    .optional({ values: 'null' })
    .isInt({ min: 1, max: 1000 })
    .withMessage('Capacity must be between 1 and 1000'),
  body('ministryId')
    .optional({ values: 'null' })
    .isInt({ min: 1, max: MAX_DB_ID })
    .withMessage('ministryId must be a positive integer or null'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be true or false'),
];

// Admin "set leaders": 0-10 distinct member ids.
const validateGroupLeaders = [
  body('userIds')
    .isArray({ max: 10 })
    .withMessage('userIds must be a list of at most 10 members')
    .bail()
    .custom((ids) => new Set(ids).size === ids.length)
    .withMessage('userIds must not contain duplicates'),
  body('userIds.*').isInt({ min: 1, max: MAX_DB_ID }).withMessage('Each userId must be a positive integer'),
];

// Devotional create/update. publishDate is a real calendar date in YYYY-MM-DD.
const validateDevotional = [
  body('title').isString().trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('scriptureReference')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Scripture reference is required')
    .isLength({ max: 255 }),
  body('scriptureText').isString().trim().notEmpty().withMessage('Scripture text is required').isLength({ max: 5000 }),
  body('body').isString().trim().notEmpty().withMessage('Reflection is required').isLength({ max: 20000 }),
  body('prayer').optional({ values: 'null' }).isString().isLength({ max: 5000 }),
  body('publishDate')
    .isDate({ format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] })
    .withMessage('Publish date must be a real date in YYYY-MM-DD format'),
  body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
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
    .isInt({ min: 1, max: MAX_DB_ID })
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
  body('isAnonymous').optional().isBoolean({ strict: true }).withMessage('isAnonymous must be true or false'),
  body('shareOnWall').optional().isBoolean({ strict: true }).withMessage('shareOnWall must be true or false'),
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

const EXPO_PUSH_TOKEN = /^Expo(nent)?PushToken\[[^\]]+\]$/;

// Device registration for push notifications.
const validatePushToken = [
  body('token')
    .isString()
    .isLength({ max: 255 })
    .matches(EXPO_PUSH_TOKEN)
    .withMessage('token must be an Expo push token'),
  body('platform').isIn(['ios', 'android']).withMessage('platform must be ios or android'),
];

// Announcement: audience-specific target ids are required only for that audience.
const validateAnnouncement = [
  body('title').isString().trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('message')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 2000 })
    .withMessage('Message must be 2000 characters or fewer'),
  body('audience').isIn(['everyone', 'group', 'event']).withMessage('audience must be everyone, group or event'),
  body('groupId')
    .if(body('audience').equals('group'))
    .isInt({ min: 1, max: MAX_DB_ID })
    .withMessage('groupId is required for a group announcement'),
  body('eventId')
    .if(body('audience').equals('event'))
    .isInt({ min: 1, max: MAX_DB_ID })
    .withMessage('eventId is required for an event announcement'),
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateSermonCreation,
  validateSermonSeriesLink,
  validateSermonSeries,
  validateCheckIn,
  validateGroup,
  validateGroupLeaders,
  validateDevotional,
  validateEventCreation,
  validatePrayerRequest,
  validateDonation,
  validateContactMessage,
  validateNewsPost,
  validatePushToken,
  validateAnnouncement,
};

