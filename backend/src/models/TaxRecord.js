'use strict';

const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const TaxRecord = {
  async create({ propertyId, taxYear, taxAmount, dueDate, paidDate = null, paidAmount = null, receiptNumber = null, status = 'due' }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO tax_records
         (id, property_id, tax_year, tax_amount, due_date, paid_date, paid_amount, receipt_number, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [id, propertyId, taxYear, taxAmount, dueDate, paidDate, paidAmount, receiptNumber, status]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query('SELECT * FROM tax_records WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByProperty(propertyId) {
    const result = await query(
      `SELECT * FROM tax_records WHERE property_id = $1 ORDER BY tax_year DESC, created_at DESC`,
      [propertyId]
    );
    return result.rows;
  },

  async getHistory(propertyId) {
    const result = await query(
      `SELECT * FROM tax_records WHERE property_id = $1 ORDER BY tax_year DESC`,
      [propertyId]
    );
    return result.rows;
  },

  async getDues(propertyId) {
    const result = await query(
      `SELECT * FROM tax_records WHERE property_id = $1 AND status IN ('due', 'overdue') ORDER BY due_date ASC`,
      [propertyId]
    );
    return result.rows;
  },

  async markPaid(id, { paidAmount, paidDate, receiptNumber }) {
    const result = await query(
      `UPDATE tax_records
       SET status = 'paid', paid_amount = $2, paid_date = $3, receipt_number = $4, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, paidAmount, paidDate || new Date(), receiptNumber]
    );
    return result.rows[0] || null;
  },
};

module.exports = TaxRecord;
