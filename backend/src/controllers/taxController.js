'use strict';

const { validationResult } = require('express-validator');
const Property = require('../models/Property');
const TaxRecord = require('../models/TaxRecord');
const AuditLog = require('../models/AuditLog');

async function getTaxHistory(req, res, next) {
  try {
    const property = await Property.findById(req.params.propertyId);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    const records = await TaxRecord.getHistory(req.params.propertyId);
    res.json({ success: true, records });
  } catch (err) {
    next(err);
  }
}

async function recordTaxPayment(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { propertyId } = req.params;
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    const { taxYear, taxAmount, dueDate, paidDate, paidAmount, receiptNumber } = req.body;

    // Check if payment is for an existing due record or creating a new paid record
    const existing = (await TaxRecord.findByProperty(propertyId)).find(
      (r) => r.tax_year === taxYear && r.status !== 'paid'
    );

    let record;
    if (existing) {
      record = await TaxRecord.markPaid(existing.id, {
        paidAmount: paidAmount || taxAmount,
        paidDate: paidDate || new Date(),
        receiptNumber,
      });
    } else {
      record = await TaxRecord.create({
        propertyId,
        taxYear,
        taxAmount,
        dueDate,
        paidDate: paidDate || new Date(),
        paidAmount: paidAmount || taxAmount,
        receiptNumber,
        status: 'paid',
      });
    }

    await AuditLog.create({
      userId: req.user.id, action: 'TAX_PAYMENT_RECORDED',
      entityType: 'tax_record', entityId: record.id,
      details: { propertyId, taxYear, paidAmount }, ipAddress: req.ip,
    });

    res.status(201).json({ success: true, record });
  } catch (err) {
    next(err);
  }
}

async function getTaxDues(req, res, next) {
  try {
    const property = await Property.findById(req.params.propertyId);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    const dues = await TaxRecord.getDues(req.params.propertyId);
    const totalDue = dues.reduce((sum, r) => sum + parseFloat(r.tax_amount), 0);

    res.json({ success: true, dues, totalDue });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTaxHistory, recordTaxPayment, getTaxDues };
