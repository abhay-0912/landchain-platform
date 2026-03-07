'use strict';

const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Document = {
  async create({ propertyId, uploadedBy, docType, filename, ipfsCid, ipfsUrl, fileHash, fileSize }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO documents
         (id, property_id, uploaded_by, doc_type, filename, ipfs_cid, ipfs_url, file_hash, file_size, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [id, propertyId, uploadedBy, docType, filename, ipfsCid, ipfsUrl, fileHash, fileSize]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      `SELECT d.*, u.full_name AS uploader_name, u.email AS uploader_email
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByProperty(propertyId) {
    const result = await query(
      `SELECT d.*, u.full_name AS uploader_name
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.property_id = $1
       ORDER BY d.created_at DESC`,
      [propertyId]
    );
    return result.rows;
  },

  async findByHash(fileHash) {
    const result = await query(
      'SELECT * FROM documents WHERE file_hash = $1',
      [fileHash]
    );
    return result.rows[0] || null;
  },
};

module.exports = Document;
