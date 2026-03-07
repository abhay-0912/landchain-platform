'use strict';

require('dotenv').config();

const app = require('./app');
const { pool } = require('./config/database');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Verify database connectivity
    await pool.query('SELECT 1');
    console.log('[DB] PostgreSQL connection established');
  } catch (err) {
    console.warn('[DB] Warning: Could not connect to PostgreSQL:', err.message);
    console.warn('[DB] Server will start, but database features will be unavailable');
  }

  const server = app.listen(PORT, () => {
    console.log(`[Server] LandChain API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`[Server] ${signal} received — shutting down gracefully`);
    server.close(async () => {
      await pool.end();
      console.log('[Server] HTTP server closed, DB pool drained');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
