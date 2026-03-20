require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

/**
 * Database Migration Script
 * Runs the schema.sql file to set up the database
 *
 * Usage: npm run migrate
 */

async function migrate () {
  try {
    console.log('Starting database migration...');

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    await pool.query(schema);

    console.log('✓ Database migration completed successfully');
    console.log('✓ All tables and indexes have been created');

    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
