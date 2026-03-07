'use strict';

const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Mortgage = {
  async create({ propertyId, lenderId, borrowerId, loanAmount, interestRate, termMonths, blockchainMortgageId = null, blockchainTxHash = null }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO mortgages
         (id, property_id, lender_id, borrower_id, loan_amount, interest_rate, term_months, status, blockchain_mortgage_id, blockchain_tx_hash, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, NOW(), NOW())
       RETURNING *`,
      [id, propertyId, lenderId, borrowerId, loanAmount, interestRate, termMonths, blockchainMortgageId, blockchainTxHash]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      `SELECT m.*,
              p.property_id AS property_ref, p.address AS property_address,
              l.full_name AS lender_name,
              b.full_name AS borrower_name
       FROM mortgages m
       LEFT JOIN properties p ON m.property_id = p.id
       LEFT JOIN users l ON m.lender_id = l.id
       LEFT JOIN users b ON m.borrower_id = b.id
       WHERE m.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByProperty(propertyId) {
    const result = await query(
      `SELECT m.*, l.full_name AS lender_name, b.full_name AS borrower_name
       FROM mortgages m
       LEFT JOIN users l ON m.lender_id = l.id
       LEFT JOIN users b ON m.borrower_id = b.id
       WHERE m.property_id = $1
       ORDER BY m.created_at DESC`,
      [propertyId]
    );
    return result.rows;
  },

  async findActive(propertyId) {
    const result = await query(
      `SELECT * FROM mortgages WHERE property_id = $1 AND status = 'active' LIMIT 1`,
      [propertyId]
    );
    return result.rows[0] || null;
  },

  async update(id, fields) {
    const allowed = ['status', 'blockchain_tx_hash', 'released_at'];
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const [key, val] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        setClauses.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }
    if (setClauses.length === 0) return null;

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE mortgages SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async release(id, txHash = null) {
    const result = await query(
      `UPDATE mortgages
       SET status = 'released', released_at = NOW(), blockchain_tx_hash = COALESCE($2, blockchain_tx_hash), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, txHash]
    );
    return result.rows[0] || null;
  },
};

module.exports = Mortgage;
