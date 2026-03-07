'use strict';

const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const User = {
  async findById(id) {
    const result = await query(
      'SELECT id, email, full_name, role, status, kyc_status, kyc_data, wallet_address, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  async create({ email, passwordHash, fullName, role = 'citizen', walletAddress = null }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO users (id, email, password_hash, full_name, role, status, kyc_status, wallet_address, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'active', 'pending', $6, NOW(), NOW())
       RETURNING id, email, full_name, role, status, kyc_status, wallet_address, created_at`,
      [id, email, passwordHash, fullName, role, walletAddress]
    );
    return result.rows[0];
  },

  async updateKyc(id, kycData) {
    const result = await query(
      `UPDATE users SET kyc_data = $2, kyc_status = 'submitted', updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, full_name, role, status, kyc_status, kyc_data, updated_at`,
      [id, JSON.stringify(kycData)]
    );
    return result.rows[0] || null;
  },

  async verifyKyc(id, kycStatus) {
    const result = await query(
      `UPDATE users SET kyc_status = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, full_name, role, status, kyc_status, updated_at`,
      [id, kycStatus]
    );
    return result.rows[0] || null;
  },

  async updateStatus(id, status) {
    const result = await query(
      `UPDATE users SET status = $2, updated_at = NOW() WHERE id = $1
       RETURNING id, email, full_name, role, status, updated_at`,
      [id, status]
    );
    return result.rows[0] || null;
  },

  async updateRole(id, role) {
    const result = await query(
      `UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1
       RETURNING id, email, full_name, role, status, updated_at`,
      [id, role]
    );
    return result.rows[0] || null;
  },

  async getAll({ limit = 50, offset = 0 } = {}) {
    const result = await query(
      `SELECT id, email, full_name, role, status, kyc_status, wallet_address, created_at
       FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async count() {
    const result = await query('SELECT COUNT(*) FROM users');
    return parseInt(result.rows[0].count, 10);
  },
};

module.exports = User;
