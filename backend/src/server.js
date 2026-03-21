require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const sermonRoutes = require('./routes/sermonRoutes');
const eventRoutes = require('./routes/eventRoutes');
const prayerRequestRoutes = require('./routes/prayerRequestRoutes');
const donationRoutes = require('./routes/donationRoutes');
const ministryRoutes = require('./routes/ministryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminSermonRoutes = require('./routes/adminSermonRoutes');
const adminEventRoutes = require('./routes/adminEventRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminPrayerRoutes = require('./routes/adminPrayerRoutes');
const adminDonationRoutes = require('./routes/adminDonationRoutes');
const adminSettingsRoutes = require('./routes/adminSettingsRoutes');
const adminNewsRoutes = require('./routes/adminNewsRoutes');
const adminAuditRoutes = require('./routes/adminAuditRoutes');
const searchRoutes = require('./routes/searchRoutes');
const newsRoutes = require('./routes/newsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const contactRoutes = require('./routes/contactRoutes');
const prismaRoutes = require('./routes/prismaRoutes');
const communityFeedRoutes = require('./routes/communityFeedRoutes');

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

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

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
app.use('/api/events', eventRoutes);
app.use('/api/prayers', prayerRequestRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/ministries', ministryRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/sermons', adminSermonRoutes);
app.use('/api/admin/events', adminEventRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/prayers', adminPrayerRoutes);
app.use('/api/admin/donations', adminDonationRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/news', adminNewsRoutes);
app.use('/api/admin/audit-logs', adminAuditRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/prisma', prismaRoutes);
app.use('/api/community', communityFeedRoutes);

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
