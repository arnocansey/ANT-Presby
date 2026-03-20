require('dotenv').config();
const { pool } = require('../src/config/database');
const { hashPassword } = require('../src/utils/helpers');

/**
 * Bootstrap Script
 * Resets project data and optionally creates a first admin account from env.
 *
 * Optional env vars:
 * - SEED_ADMIN_EMAIL
 * - SEED_ADMIN_PASSWORD
 * - SEED_ADMIN_FIRST_NAME
 * - SEED_ADMIN_LAST_NAME
 * - SEED_ADMIN_PHONE
 */

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Resetting project data...');

    await client.query(
      'TRUNCATE users, ministries, sermons, events, event_registrations, prayer_requests, donations, contact_messages, news_posts, notifications, media_assets, audit_logs RESTART IDENTITY CASCADE'
    );

    const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();

    if (adminEmail && adminPassword) {
      const passwordHash = await hashPassword(adminPassword);

      await client.query(
        `INSERT INTO users (email, password, first_name, last_name, phone, role)
         VALUES ($1, $2, $3, $4, $5, 'admin')`,
        [
          adminEmail,
          passwordHash,
          process.env.SEED_ADMIN_FIRST_NAME?.trim() || 'Admin',
          process.env.SEED_ADMIN_LAST_NAME?.trim() || 'User',
          process.env.SEED_ADMIN_PHONE?.trim() || null,
        ]
      );

      console.log(`Bootstrap admin created for ${adminEmail}`);
    } else {
      console.log('No bootstrap admin created. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create one.');
    }

    console.log('Database reset complete. No demo content was inserted.');
    process.exit(0);
  } catch (error) {
    console.error('Bootstrap failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
