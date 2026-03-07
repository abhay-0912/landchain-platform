'use strict';

const Property = require('../models/Property');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const { uploadDocument, verifyDocumentHash } = require('../services/ipfsService');

async function uploadDocumentHandler(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { propertyId, docType } = req.body;
    if (!propertyId || !docType) {
      return res.status(400).json({ success: false, message: 'propertyId and docType are required' });
    }

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    const { cid, url, hash, size } = await uploadDocument(
      req.file.buffer,
      req.file.originalname,
      { propertyId, docType, uploadedBy: req.user.id }
    );

    const document = await Document.create({
      propertyId,
      uploadedBy: req.user.id,
      docType,
      filename: req.file.originalname,
      ipfsCid: cid,
      ipfsUrl: url,
      fileHash: hash,
      fileSize: size,
    });

    // Update the property's IPFS doc hash for the latest document
    await Property.update(propertyId, { ipfs_doc_hash: cid });

    await AuditLog.create({
      userId: req.user.id, action: 'DOCUMENT_UPLOADED',
      entityType: 'document', entityId: document.id,
      details: { propertyId, docType, cid }, ipAddress: req.ip,
    });

    res.status(201).json({ success: true, document });
  } catch (err) {
    next(err);
  }
}

async function getDocument(req, res, next) {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, document });
  } catch (err) {
    next(err);
  }
}

async function getPropertyDocuments(req, res, next) {
  try {
    const property = await Property.findById(req.params.propertyId);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    const documents = await Document.findByProperty(req.params.propertyId);
    res.json({ success: true, documents });
  } catch (err) {
    next(err);
  }
}

async function verifyDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided for verification' });
    }

    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ success: false, message: 'Document record not found' });

    let isValid = false;
    try {
      isValid = verifyDocumentHash(req.file.buffer, document.file_hash);
    } catch (_) {
      // hash length mismatch means it definitely doesn't match
      isValid = false;
    }

    res.json({ success: true, isValid, documentId: document.id, filename: document.filename });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadDocument: uploadDocumentHandler, getDocument, getPropertyDocuments, verifyDocument };
