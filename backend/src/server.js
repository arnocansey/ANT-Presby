require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const path = require('path');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const donationController = require('./controllers/donationController');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const sermonRoutes = require('./routes/sermonRoutes');
const sermonSeriesRoutes = require('./routes/sermonSeriesRoutes');
const eventRoutes = require('./routes/eventRoutes');
const prayerRequestRoutes = require('./routes/prayerRequestRoutes');
const donationRoutes = require('./routes/donationRoutes');
const ministryRoutes = require('./routes/ministryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminSermonRoutes = require('./routes/adminSermonRoutes');
const adminSermonSeriesRoutes = require('./routes/adminSermonSeriesRoutes');
const adminEventRoutes = require('./routes/adminEventRoutes');
const adminAttendanceRoutes = require('./routes/adminAttendanceRoutes');
const adminGroupRoutes = require('./routes/adminGroupRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminPrayerRoutes = require('./routes/adminPrayerRoutes');
const adminDonationRoutes = require('./routes/adminDonationRoutes');
const adminSettingsRoutes = require('./routes/adminSettingsRoutes');
const adminNewsRoutes = require('./routes/adminNewsRoutes');
const adminDevotionalRoutes = require('./routes/adminDevotionalRoutes');
const adminAuditRoutes = require('./routes/adminAuditRoutes');
const searchRoutes = require('./routes/searchRoutes');
const newsRoutes = require('./routes/newsRoutes');
const devotionalRoutes = require('./routes/devotionalRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const pushTokenRoutes = require('./routes/pushTokenRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const liveRoutes = require('./routes/liveRoutes');
const adminLiveRoutes = require('./routes/adminLiveRoutes');
const contactRoutes = require('./routes/contactRoutes');
const prismaRoutes = require('./routes/prismaRoutes');
const communityFeedRoutes = require('./routes/communityFeedRoutes');
const groupRoutes = require('./routes/groupRoutes');
const albumRoutes = require('./routes/albumRoutes');
const adminAlbumRoutes = require('./routes/adminAlbumRoutes');

// Initialize Express app
const app = express();

const configuredFrontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

const splitOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const configuredOrigins = new Set([
  configuredFrontendOrigin,
  ...splitOrigins(process.env.CORS_ORIGINS),
]);

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  if (configuredOrigins.has(origin)) {
    return true;
  }

  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Paystack signs the raw request bytes, so the webhook must be registered before the JSON parser.
app.post(
  '/api/donations/webhook',
  express.raw({ type: 'application/json', limit: '100kb' }),
  donationController.handleDonationWebhook
);

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));
app.use(cookieParser());
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), {
    dotfiles: 'deny',
    setHeaders: (res) => {
      // Uploaded files are user content: never let the browser sniff them into HTML/JS.
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; sandbox");
    },
  })
);

// Rate limiting
// Web traffic reaches us through the Next.js proxy, so every web visitor would share the proxy's IP.
// When the proxy presents the shared secret, trust the client IP it forwards instead.
const PROXY_SHARED_SECRET = process.env.PROXY_SHARED_SECRET || '';

const isTrustedProxyRequest = (req) => {
  const provided = req.get('x-proxy-secret');
  if (!PROXY_SHARED_SECRET || !provided) return false;

  const expected = Buffer.from(PROXY_SHARED_SECRET);
  const actual = Buffer.from(provided);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

const getClientKey = (req) => {
  const forwardedClientIp = req.get('x-client-ip');
  if (forwardedClientIp && isTrustedProxyRequest(req)) {
    return forwardedClientIp.trim();
  }
  return req.ip;
};

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  keyGenerator: getClientKey,
});

// Tighter limit for credential and email-sending endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 20,
  message: 'Too many authentication attempts, please try again later.',
  keyGenerator: getClientKey,
});

app.use(limiter);
app.use(
  ['/api/auth/login', '/api/auth/register', '/api/auth/resend-verification', '/api/auth/google'],
  authLimiter
);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sermons', sermonRoutes);
app.use('/api/sermon-series', sermonSeriesRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/prayers', prayerRequestRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/ministries', ministryRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/sermons', adminSermonRoutes);
app.use('/api/admin/sermon-series', adminSermonSeriesRoutes);
app.use('/api/admin/events', adminEventRoutes);
app.use('/api/admin/attendance', adminAttendanceRoutes);
app.use('/api/admin/groups', adminGroupRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/prayers', adminPrayerRoutes);
app.use('/api/admin/donations', adminDonationRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/news', adminNewsRoutes);
app.use('/api/admin/devotionals', adminDevotionalRoutes);
app.use('/api/admin/albums', adminAlbumRoutes);
app.use('/api/admin/audit-logs', adminAuditRoutes);
app.use('/api/admin/live', adminLiveRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/devotionals', devotionalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/push-tokens', pushTokenRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/prisma', prismaRoutes);
app.use('/api/community', communityFeedRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/albums', albumRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

let server;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server = app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Allowed origins: ${Array.from(configuredOrigins).join(', ')}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
    });
  });
}

module.exports = app;
