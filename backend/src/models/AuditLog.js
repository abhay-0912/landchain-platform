'use strict';

const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const AuditLog = {
  async create({ userId, action, entityType, entityId, details = null, ipAddress = null }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [id, userId, action, entityType, entityId, details ? JSON.stringify(details) : null, ipAddress]
    );
    return result.rows[0];
  },

  async findByUser(userId, { limit = 50, offset = 0 } = {}) {
    const result = await query(
      `SELECT al.*, u.full_name AS user_name, u.email AS user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.user_id = $1
       ORDER BY al.created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  async findAll({ limit = 100, offset = 0, action = null, entityType = null } = {}) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (action) { conditions.push(`al.action = $${idx++}`); values.push(action); }
    if (entityType) { conditions.push(`al.entity_type = $${idx++}`); values.push(entityType); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const result = await query(
      `SELECT al.*, u.full_name AS user_name, u.email AS user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${where}
       ORDER BY al.created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      values
    );
    return result.rows;
  },
};

module.exports = AuditLog;
