'use strict';

const User = require('../models/User');
const Property = require('../models/Property');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

async function getUsers(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const users = await User.getAll({ limit, offset });
    const total = await User.count();
    res.json({ success: true, users, total });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { userId } = req.params;
    const { role, status } = req.body;

    if (!role && !status) {
      return res.status(400).json({ success: false, message: 'role or status required' });
    }

    const validRoles = ['citizen', 'officer', 'bank', 'admin'];
    const validStatuses = ['active', 'suspended'];

    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    let updated = null;
    if (role) updated = await User.updateRole(userId, role);
    if (status) updated = await User.updateStatus(userId, status);

    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });

    await AuditLog.create({
      userId: req.user.id, action: 'ADMIN_USER_UPDATED',
      entityType: 'user', entityId: userId,
      details: { role, status, updatedBy: req.user.id }, ipAddress: req.ip,
    });

    res.json({ success: true, user: updated });
  } catch (err) {
    next(err);
  }
}

async function getSystemStats(req, res, next) {
  try {
    const [totalUsers, totalProperties, totalTransactions] = await Promise.all([
      User.count(),
      Property.count(),
      Transaction.count(),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProperties,
        totalTransactions,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const { action, entityType } = req.query;

    const logs = await AuditLog.findAll({ limit, offset, action, entityType });
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
}

async function getAllProperties(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const properties = await Property.search({ limit, offset });
    const total = await Property.count();
    res.json({ success: true, properties, total });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsers, updateUser, getSystemStats, getAuditLogs, getAllProperties };
