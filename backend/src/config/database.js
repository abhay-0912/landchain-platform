'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

/**
 * Execute a parameterized query.
 * @param {string} text  - SQL query string
 * @param {Array}  params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'test') {
    console.debug(`[DB] query: ${text.substring(0, 80)} | ${duration}ms | rows: ${result.rowCount}`);
  }
  return result;
}

/**
 * Acquire a client for manual transaction control.
 * Caller must call client.release() when done.
 * @returns {Promise<import('pg').PoolClient>}
 */
async function getClient() {
  const client = await pool.connect();
  const origRelease = client.release.bind(client);
  // Wrap release with a timeout guard
  let released = false;
  client.release = () => {
    if (!released) {
      released = true;
      origRelease();
    }
  };
  return client;
}

module.exports = { pool, query, getClient };
