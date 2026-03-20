/**
 * ANT PRESS database schema
 * PostgreSQL setup for church management system
 * 
 * This file contains the complete database schema with all tables,
 * relationships, indexes, and constraints.
 */

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('member', 'admin');
CREATE TYPE prayer_status AS ENUM ('pending', 'approved', 'answered');
CREATE TYPE donation_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE event_status AS ENUM ('active', 'cancelled', 'completed');
CREATE TYPE prayer_category AS ENUM ('personal', 'family', 'health', 'work', 'financial', 'other');
CREATE TYPE donation_type AS ENUM ('tithe', 'offering', 'ministry', 'emergency', 'general');
CREATE TYPE payment_method AS ENUM ('bank_transfer', 'momo', 'card', 'cash');

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  profile_image_url VARCHAR(500),
  role user_role DEFAULT 'member',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================
-- Ministries Table
-- ============================================
CREATE TABLE ministries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  leader_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ministries_name ON ministries(name);

-- ============================================
-- Sermons Table
-- ============================================
CREATE TABLE sermons (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  speaker VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  video_url VARCHAR(500) NOT NULL,
  sermon_date DATE NOT NULL,
  ministry_id INTEGER REFERENCES ministries(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sermons_ministry ON sermons(ministry_id);
CREATE INDEX idx_sermons_date ON sermons(sermon_date DESC);
CREATE INDEX idx_sermons_title ON sermons(title);

-- ============================================
-- Events Table
-- ============================================
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMP NOT NULL,
  location VARCHAR(500) NOT NULL,
  max_registrations INTEGER,
  status event_status DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_date ON events(event_date DESC);
CREATE INDEX idx_events_status ON events(status);

-- ============================================
-- Event Registrations Table (Many-to-Many)
-- ============================================
CREATE TABLE event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);

-- ============================================
-- Prayer Requests Table
-- ============================================
CREATE TABLE prayer_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category prayer_category NOT NULL,
  status prayer_status DEFAULT 'pending',
  is_anonymous BOOLEAN DEFAULT FALSE,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prayer_requests_user ON prayer_requests(user_id);
CREATE INDEX idx_prayer_requests_status ON prayer_requests(status);
CREATE INDEX idx_prayer_requests_category ON prayer_requests(category);
CREATE INDEX idx_prayer_requests_created_at ON prayer_requests(created_at DESC);

-- ============================================
-- Donations Table
-- ============================================
CREATE TABLE donations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  donation_type donation_type NOT NULL,
  payment_method payment_method NOT NULL,
  status donation_status DEFAULT 'pending',
  reference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_donations_user ON donations(user_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_type ON donations(donation_type);
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);

-- ============================================
-- Contact Messages Table
-- ============================================
CREATE TABLE contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX idx_contact_messages_is_read ON contact_messages(is_read);

-- ============================================
-- News Posts Table
-- ============================================
CREATE TABLE news_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR(500),
  is_published BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_news_posts_published_at ON news_posts(published_at DESC);
CREATE INDEX idx_news_posts_published ON news_posts(is_published);

-- ============================================
-- Notifications Table
-- ============================================
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- ============================================
-- Views for common queries
-- ============================================

-- User statistics view
CREATE VIEW user_stats AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  COUNT(DISTINCT er.id) AS total_events_registered,
  COUNT(DISTINCT pr.id) AS total_prayer_requests,
  COUNT(DISTINCT d.id) AS total_donations,
  COALESCE(SUM(d.amount), 0) AS total_donated
FROM users u
LEFT JOIN event_registrations er ON u.id = er.user_id
LEFT JOIN prayer_requests pr ON u.id = pr.user_id
LEFT JOIN donations d ON u.id = d.user_id AND d.status = 'completed'
GROUP BY u.id;

-- Event statistics view
CREATE VIEW event_stats AS
SELECT 
  e.id,
  e.name,
  e.event_date,
  COUNT(er.id) AS registration_count,
  COALESCE(e.max_registrations, 0) AS max_registrations
FROM events e
LEFT JOIN event_registrations er ON e.id = er.event_id
GROUP BY e.id;

-- Donation statistics view
CREATE VIEW donation_stats AS
SELECT 
  DATE_TRUNC('month', d.created_at)::date AS month,
  d.donation_type,
  COUNT(*) AS transaction_count,
  SUM(d.amount) AS total_amount,
  AVG(d.amount) AS avg_amount
FROM donations d
WHERE d.status = 'completed'
GROUP BY DATE_TRUNC('month', d.created_at), d.donation_type;
