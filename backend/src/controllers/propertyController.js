'use strict';

const { validationResult } = require('express-validator');
const Property = require('../models/Property');
const AuditLog = require('../models/AuditLog');
const { registerPropertyOnChain } = require('../services/blockchainService');

async function registerProperty(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { propertyId, surveyNumber, address, city, state, area, propertyType, marketValue, coordinates, ipfsDocHash } = req.body;

    // On-chain registration — requires ipfsDocHash (contract enforces it)
    let blockchainTxHash = null;
    let blockchainPropertyId = null;
    try {
      if (ipfsDocHash) {
        const txResult = await registerPropertyOnChain({
          surveyNumber,
          area: area.toString(),
          coordinates: coordinates || `${city},${state}`,
          city,
          state,
          ipfsDocHash,
        });
        if (txResult) {
          blockchainTxHash = txResult.transactionHash;
          blockchainPropertyId = txResult.blockchainPropertyId;
        }
      } else {
        console.info('[Property] ipfsDocHash not provided — skipping on-chain registration');
      }
    } catch (bcErr) {
      console.warn('[Property] Blockchain registration failed:', bcErr.message);
    }

    const property = await Property.create({
      ownerId: req.user.id,
      propertyId,
      surveyNumber,
      address,
      city,
      state,
      area,
      propertyType,
      marketValue,
      blockchainTxHash,
      blockchainPropertyId,
    });

    // Record initial ownership history
    await Property.addOwnershipHistory({
      propertyId: property.id,
      ownerId: req.user.id,
      txHash: blockchainTxHash,
    });

    await AuditLog.create({
      userId: req.user.id,
      action: 'PROPERTY_REGISTERED',
      entityType: 'property',
      entityId: property.id,
      details: { propertyId, city, state },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, property });
  } catch (err) {
    next(err);
  }
}

async function getProperty(req, res, next) {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    const history = await Property.getOwnershipHistory(property.id);
    res.json({ success: true, property, ownershipHistory: history });
  } catch (err) {
    next(err);
  }
}

async function getMyProperties(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const properties = await Property.findByOwner(req.user.id, { limit, offset });
    res.json({ success: true, properties });
  } catch (err) {
    next(err);
  }
}

async function searchProperties(req, res, next) {
  try {
    const { propertyId, surveyNumber, city, state, ownerId, status, limit, offset } = req.query;
    const properties = await Property.search({
      propertyId,
      surveyNumber,
      city,
      state,
      ownerId,
      status,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    });
    res.json({ success: true, properties });
  } catch (err) {
    next(err);
  }
}

async function updateProperty(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const allowedFields = ['address', 'city', 'state', 'area', 'property_type', 'market_value', 'status'];
    const updates = {};
    for (const field of allowedFields) {
      const camelKey = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (req.body[camelKey] !== undefined) updates[field] = req.body[camelKey];
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const updated = await Property.update(property.id, updates);

    await AuditLog.create({
      userId: req.user.id,
      action: 'PROPERTY_UPDATED',
      entityType: 'property',
      entityId: property.id,
      details: updates,
      ipAddress: req.ip,
    });

    res.json({ success: true, property: updated });
  } catch (err) {
    next(err);
  }
}

async function getOwnershipHistory(req, res, next) {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    const history = await Property.getOwnershipHistory(property.id);
    res.json({ success: true, ownershipHistory: history });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerProperty,
  getProperty,
  getMyProperties,
  searchProperties,
  updateProperty,
  getOwnershipHistory,
};
