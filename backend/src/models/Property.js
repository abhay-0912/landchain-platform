'use strict';

const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Property = {
  async findById(id) {
    const result = await query(
      `SELECT p.*, u.full_name AS owner_name, u.email AS owner_email
       FROM properties p
       LEFT JOIN users u ON p.owner_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByOwner(ownerId, { limit = 50, offset = 0 } = {}) {
    const result = await query(
      `SELECT * FROM properties WHERE owner_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [ownerId, limit, offset]
    );
    return result.rows;
  },

  async create({ ownerId, propertyId, surveyNumber, address, city, state, area, propertyType, marketValue, ipfsDocHash = null, blockchainTxHash = null, blockchainPropertyId = null }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO properties
         (id, owner_id, property_id, survey_number, address, city, state, area, property_type, market_value, ipfs_doc_hash, blockchain_tx_hash, blockchain_property_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active', NOW(), NOW())
       RETURNING *`,
      [id, ownerId, propertyId, surveyNumber, address, city, state, area, propertyType, marketValue, ipfsDocHash, blockchainTxHash, blockchainPropertyId]
    );
    return result.rows[0];
  },

  async update(id, fields) {
    const allowed = ['address', 'city', 'state', 'area', 'property_type', 'market_value', 'status', 'ipfs_doc_hash'];
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
      `UPDATE properties SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async updateOwner(id, newOwnerId) {
    const result = await query(
      `UPDATE properties SET owner_id = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, newOwnerId]
    );
    return result.rows[0] || null;
  },

  async search({ propertyId, surveyNumber, city, state, ownerId, status, limit = 50, offset = 0 }) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (propertyId) { conditions.push(`property_id ILIKE $${idx++}`); values.push(`%${propertyId}%`); }
    if (surveyNumber) { conditions.push(`survey_number ILIKE $${idx++}`); values.push(`%${surveyNumber}%`); }
    if (city) { conditions.push(`city ILIKE $${idx++}`); values.push(`%${city}%`); }
    if (state) { conditions.push(`state ILIKE $${idx++}`); values.push(`%${state}%`); }
    if (ownerId) { conditions.push(`owner_id = $${idx++}`); values.push(ownerId); }
    if (status) { conditions.push(`status = $${idx++}`); values.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const result = await query(
      `SELECT p.*, u.full_name AS owner_name FROM properties p
       LEFT JOIN users u ON p.owner_id = u.id
       ${where} ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      values
    );
    return result.rows;
  },

  async getOwnershipHistory(propertyId) {
    const result = await query(
      `SELECT oh.*, u.full_name AS owner_name, u.email AS owner_email
       FROM ownership_history oh
       LEFT JOIN users u ON oh.owner_id = u.id
       WHERE oh.property_id = $1
       ORDER BY oh.transferred_at DESC`,
      [propertyId]
    );
    return result.rows;
  },

  async addOwnershipHistory({ propertyId, ownerId, transferredAt, txHash }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO ownership_history (id, property_id, owner_id, transferred_at, tx_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, propertyId, ownerId, transferredAt || new Date(), txHash]
    );
    return result.rows[0];
  },

  async count() {
    const result = await query('SELECT COUNT(*) FROM properties');
    return parseInt(result.rows[0].count, 10);
  },
};

module.exports = Property;
