const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool
const poolConfig = {};

if (process.env.DATABASE_URL) {
  // Use connection string for managed services like Neon
  poolConfig.connectionString = process.env.DATABASE_URL;
  // Ensure SSL for Neon / cloud Postgres
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
} else {
  poolConfig.host = process.env.DB_HOST || 'localhost';
  poolConfig.port = process.env.DB_PORT || 5432;
  poolConfig.database = process.env.DB_NAME || 'antpress';
  poolConfig.user = process.env.DB_USER || 'postgres';
  poolConfig.password = process.env.DB_PASSWORD;
}

poolConfig.max = 20;
poolConfig.idleTimeoutMillis = 30000;
poolConfig.connectionTimeoutMillis = Number(process.env.DB_CONNECTION_TIMEOUT_MS) || 30000;

const pool = new Pool(poolConfig);

// Test the connection
pool.on('connect', () => {
  console.log('✓ Database connection pool established');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Query execution wrapper
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.LOG_LEVEL === 'debug') {
      console.log('Executed query', { text, duration, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Get a client from the pool
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

module.exports = {
  query,
  getClient,
  pool,
};
