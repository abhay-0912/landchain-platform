'use strict';

const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Transaction = {
  async create({ propertyId, sellerId, buyerId, salePrice, status = 'pending', blockchainTxHash = null, transferId = null }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO transactions
         (id, property_id, seller_id, buyer_id, sale_price, status, blockchain_tx_hash, transfer_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [id, propertyId, sellerId, buyerId, salePrice, status, blockchainTxHash, transferId]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      `SELECT t.*,
              s.full_name AS seller_name, s.email AS seller_email,
              b.full_name AS buyer_name,  b.email AS buyer_email,
              p.property_id AS property_ref, p.address AS property_address
       FROM transactions t
       LEFT JOIN users s ON t.seller_id = s.id
       LEFT JOIN users b ON t.buyer_id  = b.id
       LEFT JOIN properties p ON t.property_id = p.id
       WHERE t.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByProperty(propertyId, { limit = 50, offset = 0 } = {}) {
    const result = await query(
      `SELECT t.*, s.full_name AS seller_name, b.full_name AS buyer_name
       FROM transactions t
       LEFT JOIN users s ON t.seller_id = s.id
       LEFT JOIN users b ON t.buyer_id  = b.id
       WHERE t.property_id = $1
       ORDER BY t.created_at DESC LIMIT $2 OFFSET $3`,
      [propertyId, limit, offset]
    );
    return result.rows;
  },

  async findByUser(userId, { limit = 50, offset = 0 } = {}) {
    const result = await query(
      `SELECT t.*, p.property_id AS property_ref, p.address AS property_address,
              s.full_name AS seller_name, b.full_name AS buyer_name
       FROM transactions t
       LEFT JOIN properties p ON t.property_id = p.id
       LEFT JOIN users s ON t.seller_id = s.id
       LEFT JOIN users b ON t.buyer_id  = b.id
       WHERE t.seller_id = $1 OR t.buyer_id = $1
       ORDER BY t.created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  async updateStatus(id, status, blockchainTxHash = null) {
    const result = await query(
      `UPDATE transactions
       SET status = $2, blockchain_tx_hash = COALESCE($3, blockchain_tx_hash), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, status, blockchainTxHash]
    );
    return result.rows[0] || null;
  },

  async count() {
    const result = await query('SELECT COUNT(*) FROM transactions');
    return parseInt(result.rows[0].count, 10);
  },
};

module.exports = Transaction;
