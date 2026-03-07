'use strict';

const { validationResult } = require('express-validator');
const Property = require('../models/Property');
const Mortgage = require('../models/Mortgage');
const AuditLog = require('../models/AuditLog');
const { lockPropertyOnChain, releasePropertyOnChain } = require('../services/blockchainService');

async function registerMortgage(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { propertyId, borrowerId, loanAmount, interestRate, termMonths, ipfsDocHash } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    if (property.status !== 'active') {
      return res.status(400).json({ success: false, message: `Property is not available for mortgage (status: ${property.status})` });
    }

    const existing = await Mortgage.findActive(propertyId);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Property already has an active mortgage' });
    }

    let blockchainTxHash = null;
    let blockchainMortgageId = null;
    try {
      // endDate = now + termMonths converted to a Unix timestamp
      const endDateTimestamp = Math.floor(Date.now() / 1000) + termMonths * 30 * 24 * 3600;
      if (property.blockchain_property_id && ipfsDocHash) {
        const result = await lockPropertyOnChain({
          blockchainPropertyId: property.blockchain_property_id,
          loanAmount: loanAmount.toString(),
          endDateTimestamp,
          ipfsDocHash,
        });
        if (result) {
          blockchainTxHash = result.transactionHash;
          blockchainMortgageId = result.mortgageId;
        }
      } else {
        console.info('[Mortgage] Skipping on-chain lock: missing blockchain_property_id or ipfsDocHash');
      }
    } catch (bcErr) {
      console.warn('[Mortgage] lockProperty failed:', bcErr.message);
    }

    await Property.update(propertyId, { status: 'mortgaged' });

    const mortgage = await Mortgage.create({
      propertyId,
      lenderId: req.user.id,
      borrowerId,
      loanAmount,
      interestRate,
      termMonths,
      blockchainMortgageId,
      blockchainTxHash,
    });

    await AuditLog.create({
      userId: req.user.id, action: 'MORTGAGE_REGISTERED',
      entityType: 'mortgage', entityId: mortgage.id,
      details: { propertyId, borrowerId, loanAmount }, ipAddress: req.ip,
    });

    res.status(201).json({ success: true, mortgage });
  } catch (err) {
    next(err);
  }
}

async function releaseMortgage(req, res, next) {
  try {
    const mortgage = await Mortgage.findById(req.params.id);
    if (!mortgage) return res.status(404).json({ success: false, message: 'Mortgage not found' });
    if (mortgage.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Mortgage is not active' });
    }

    let txHash = null;
    try {
      const result = await releasePropertyOnChain(mortgage.blockchain_mortgage_id);
      if (result) txHash = result.transactionHash;
    } catch (bcErr) {
      console.warn('[Mortgage] releaseProperty failed:', bcErr.message);
    }

    const released = await Mortgage.release(mortgage.id, txHash);
    await Property.update(mortgage.property_id, { status: 'active' });

    await AuditLog.create({
      userId: req.user.id, action: 'MORTGAGE_RELEASED',
      entityType: 'mortgage', entityId: mortgage.id, ipAddress: req.ip,
    });

    res.json({ success: true, mortgage: released });
  } catch (err) {
    next(err);
  }
}

async function getMortgage(req, res, next) {
  try {
    const mortgage = await Mortgage.findById(req.params.id);
    if (!mortgage) return res.status(404).json({ success: false, message: 'Mortgage not found' });
    res.json({ success: true, mortgage });
  } catch (err) {
    next(err);
  }
}

async function getPropertyMortgages(req, res, next) {
  try {
    const property = await Property.findById(req.params.propertyId);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    const mortgages = await Mortgage.findByProperty(req.params.propertyId);
    res.json({ success: true, mortgages });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerMortgage, releaseMortgage, getMortgage, getPropertyMortgages };
