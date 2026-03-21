require('dotenv').config();
const { pool } = require('../src/config/database');

async function migrateFeatureUpdates() {
  const client = await pool.connect();

  try {
    console.log('Applying feature update migration...');
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(500);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
      ON contact_messages(created_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read
      ON contact_messages(is_read);
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'news_status') THEN
          CREATE TYPE news_status AS ENUM ('draft', 'review', 'scheduled', 'published', 'archived');
        END IF;
      END
      $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS news_posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        slug VARCHAR(255),
        image_url VARCHAR(500),
        status news_status NOT NULL DEFAULT 'draft',
        is_published BOOLEAN DEFAULT TRUE,
        published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        scheduled_for TIMESTAMP,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      ALTER TABLE news_posts
      ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
      ADD COLUMN IF NOT EXISTS status news_status NOT NULL DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP,
      ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    await client.query(`
      ALTER TABLE news_posts
      ALTER COLUMN status DROP DEFAULT;
    `);

    await client.query(`
      UPDATE news_posts
      SET status = COALESCE(NULLIF(status::text, ''), 'draft')::news_status
      WHERE status IS NULL;
    `);

    await client.query(`
      ALTER TABLE news_posts
      ALTER COLUMN status TYPE news_status
      USING (
        CASE
          WHEN status::text IN ('draft', 'review', 'scheduled', 'published', 'archived') THEN status::text::news_status
          WHEN COALESCE(is_published, FALSE) = TRUE THEN 'published'::news_status
          ELSE 'draft'::news_status
        END
      );
    `);

    await client.query(`
      ALTER TABLE news_posts
      ALTER COLUMN status SET DEFAULT 'draft';
    `);

    await client.query(`
      UPDATE news_posts
      SET
        slug = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || id,
        status = CASE
          WHEN COALESCE(is_published, FALSE) = TRUE THEN 'published'::news_status
          ELSE 'draft'::news_status
        END,
        published_at = CASE
          WHEN COALESCE(is_published, FALSE) = TRUE AND published_at IS NULL THEN created_at
          ELSE published_at
        END
      WHERE slug IS NULL OR status IS NULL OR (is_published = TRUE AND published_at IS NULL);
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_news_posts_slug_unique
      ON news_posts(slug);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_news_posts_status
      ON news_posts(status);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_news_posts_published_at
      ON news_posts(published_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_news_posts_published
      ON news_posts(is_published);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
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
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user
      ON notifications(user_id, created_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_unread
      ON notifications(user_id, is_read);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        site_title VARCHAR(255) NOT NULL DEFAULT 'ANT PRESS',
        contact_email VARCHAR(255) NOT NULL DEFAULT '',
        payment_public_key VARCHAR(255),
        donation_success_message TEXT DEFAULT 'Thank you for your donation.',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    await client.query(`
      INSERT INTO app_settings (id)
      VALUES (1)
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size INTEGER NOT NULL,
        url VARCHAR(500) NOT NULL,
        alt_text TEXT,
        uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_media_assets_uploaded_by
      ON media_assets(uploaded_by);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_media_assets_created_at
      ON media_assets(created_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id INTEGER,
        action VARCHAR(100) NOT NULL,
        summary VARCHAR(500) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
      ON audit_logs(actor_user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
      ON audit_logs(entity_type, entity_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
      ON audit_logs(created_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS community_posts (
        id SERIAL PRIMARY KEY,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        image_url VARCHAR(500),
        is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_community_posts_author
      ON community_posts(author_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_community_posts_created_at
      ON community_posts(created_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_community_posts_pinned
      ON community_posts(is_pinned);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS community_comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_community_comments_post
      ON community_comments(post_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_community_comments_author
      ON community_comments(author_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_community_comments_created_at
      ON community_comments(created_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS community_likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT community_likes_post_user_unique UNIQUE (post_id, user_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_community_likes_user
      ON community_likes(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_community_likes_post
      ON community_likes(post_id);
    `);

    await client.query('COMMIT');
    console.log('Feature update migration completed successfully.');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Feature update migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrateFeatureUpdates();
