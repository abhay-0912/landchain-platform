'use strict';

/**
 * Global Express error handler.
 * Catches errors passed via next(err).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.path} — ${status}: ${err.message}`);
    if (status === 500) console.error(err.stack);
  }

  // Postgres constraint violations
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry: a record with that value already exists',
      field: err.detail,
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist',
    });
  }

  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV === 'development' && status === 500 ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;
