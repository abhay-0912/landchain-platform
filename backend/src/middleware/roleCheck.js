'use strict';

/**
 * Middleware factory — allows only users whose role is in the provided list.
 * Must be used after the auth middleware (req.user must exist).
 *
 * Valid roles: citizen, officer, bank, admin
 *
 * @param {...string} roles
 * @returns {Function} Express middleware
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = { requireRole };
