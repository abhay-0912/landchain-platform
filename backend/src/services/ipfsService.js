'use strict';

const crypto = require('crypto');
const { uploadToIPFS, getIPFSUrl } = require('../config/ipfs');

/**
 * Compute SHA-256 hash of a buffer.
 * @param {Buffer} buffer
 * @returns {string} hex hash
 */
function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Upload a document buffer to IPFS and return metadata.
 * @param {Buffer} buffer
 * @param {string} filename
 * @param {Object} [metadata]
 * @returns {Promise<{cid: string, url: string, hash: string, size: number}>}
 */
async function uploadDocument(buffer, filename, metadata = {}) {
  const hash = hashBuffer(buffer);
  const cid = await uploadToIPFS(buffer, filename, metadata);
  const url = getIPFSUrl(cid);
  return { cid, url, hash, size: buffer.length };
}

/**
 * Verify a document buffer against a stored hash.
 * @param {Buffer} buffer
 * @param {string} storedHash
 * @returns {boolean}
 */
function verifyDocumentHash(buffer, storedHash) {
  const computed = hashBuffer(buffer);
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(storedHash, 'hex'));
}

/**
 * Returns the IPFS gateway URL for a given CID.
 * @param {string} cid
 * @returns {string}
 */
function getDocumentUrl(cid) {
  return getIPFSUrl(cid);
}

module.exports = { uploadDocument, verifyDocumentHash, getDocumentUrl, hashBuffer };
