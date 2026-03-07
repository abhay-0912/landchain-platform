'use strict';

const { validationResult } = require('express-validator');
const Property = require('../models/Property');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const {
  initiateTransferOnChain,
  confirmByBuyerOnChain,
  approveByOfficerOnChain,
  completeTransferOnChain,
  cancelTransferOnChain,
} = require('../services/blockchainService');
const { sendTransferNotificationEmail, sendApprovalEmail } = require('../services/emailService');

async function initiateTransfer(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { propertyId, buyerId, salePrice } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    if (property.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not the property owner' });
    }
    if (property.status !== 'active') {
      return res.status(400).json({ success: false, message: `Property is not available for transfer (status: ${property.status})` });
    }

    const buyer = await User.findById(buyerId);
    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found' });

    const { agreementHash } = req.body; // optional IPFS CID of signed agreement

    let blockchainTxHash = null;
    let blockchainTransferId = null;
    try {
      // Only attempt on-chain initiation if buyer has a wallet address and agreementHash is provided
      if (buyer.wallet_address && agreementHash && property.blockchain_property_id) {
        const result = await initiateTransferOnChain({
          blockchainPropertyId: property.blockchain_property_id,
          buyerAddress: buyer.wallet_address,
          salePrice: salePrice.toString(),
          agreementHash,
        });
        if (result) {
          blockchainTxHash = result.transactionHash;
          blockchainTransferId = result.transferId;
        }
      } else {
        console.info('[Transfer] Skipping on-chain initiation: missing wallet address, agreementHash, or blockchain propertyId');
      }
    } catch (bcErr) {
      console.warn('[Transfer] Blockchain initiateTransfer failed:', bcErr.message);
    }

    // Lock property during transfer
    await Property.update(property.id, { status: 'under_transfer' });

    const transaction = await Transaction.create({
      propertyId: property.id,
      sellerId: req.user.id,
      buyerId,
      salePrice,
      status: 'initiated',
      blockchainTxHash,
      transferId: blockchainTransferId,
    });

    await AuditLog.create({
      userId: req.user.id,
      action: 'TRANSFER_INITIATED',
      entityType: 'transaction',
      entityId: transaction.id,
      details: { propertyId: property.id, buyerId, salePrice },
      ipAddress: req.ip,
    });

    sendTransferNotificationEmail({
      to: buyer.email, name: buyer.full_name,
      propertyAddress: property.address, role: 'buyer', transferId: transaction.id,
    }).catch(console.warn);

    res.status(201).json({ success: true, transaction });
  } catch (err) {
    next(err);
  }
}

async function confirmTransfer(req, res, next) {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transfer not found' });
    if (transaction.buyer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the buyer can confirm this transfer' });
    }
    if (transaction.status !== 'initiated') {
      return res.status(400).json({ success: false, message: `Cannot confirm transfer in status: ${transaction.status}` });
    }

    let txHash = null;
    try {
      const result = await confirmByBuyerOnChain(transaction.transfer_id);
      if (result) txHash = result.transactionHash;
    } catch (bcErr) {
      console.warn('[Transfer] confirmByBuyer failed:', bcErr.message);
    }

    const updated = await Transaction.updateStatus(transaction.id, 'buyer_confirmed', txHash);

    await AuditLog.create({
      userId: req.user.id, action: 'TRANSFER_BUYER_CONFIRMED',
      entityType: 'transaction', entityId: transaction.id, ipAddress: req.ip,
    });

    res.json({ success: true, transaction: updated });
  } catch (err) {
    next(err);
  }
}

async function approveTransfer(req, res, next) {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transfer not found' });
    if (transaction.status !== 'buyer_confirmed') {
      return res.status(400).json({ success: false, message: `Cannot approve transfer in status: ${transaction.status}` });
    }

    let txHash = null;
    try {
      const result = await approveByOfficerOnChain(transaction.transfer_id);
      if (result) txHash = result.transactionHash;
    } catch (bcErr) {
      console.warn('[Transfer] approveByOfficer failed:', bcErr.message);
    }

    const updated = await Transaction.updateStatus(transaction.id, 'officer_approved', txHash);

    await AuditLog.create({
      userId: req.user.id, action: 'TRANSFER_OFFICER_APPROVED',
      entityType: 'transaction', entityId: transaction.id, ipAddress: req.ip,
    });

    res.json({ success: true, transaction: updated });
  } catch (err) {
    next(err);
  }
}

async function completeTransfer(req, res, next) {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transfer not found' });
    if (transaction.status !== 'officer_approved') {
      return res.status(400).json({ success: false, message: `Cannot complete transfer in status: ${transaction.status}` });
    }

    let txHash = null;
    try {
      const result = await completeTransferOnChain(transaction.transfer_id);
      if (result) txHash = result.transactionHash;
    } catch (bcErr) {
      console.warn('[Transfer] completeTransfer failed:', bcErr.message);
    }

    await Transaction.updateStatus(transaction.id, 'completed', txHash);

    // Transfer ownership in DB
    await Property.updateOwner(transaction.property_id, transaction.buyer_id);
    await Property.update(transaction.property_id, { status: 'active' });
    await Property.addOwnershipHistory({
      propertyId: transaction.property_id,
      ownerId: transaction.buyer_id,
      txHash,
    });

    const completed = await Transaction.findById(transaction.id);

    await AuditLog.create({
      userId: req.user.id, action: 'TRANSFER_COMPLETED',
      entityType: 'transaction', entityId: transaction.id,
      details: { newOwner: transaction.buyer_id }, ipAddress: req.ip,
    });

    const buyer = await User.findById(transaction.buyer_id);
    const property = await Property.findById(transaction.property_id);
    if (buyer && property) {
      sendApprovalEmail({
        to: buyer.email, name: buyer.full_name,
        subject: 'Property Transfer Completed',
        message: `Ownership of ${property.address} has been transferred to you.`,
      }).catch(console.warn);
    }

    res.json({ success: true, transaction: completed });
  } catch (err) {
    next(err);
  }
}

async function cancelTransfer(req, res, next) {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transfer not found' });

    const allowedRoles = ['admin', 'officer'];
    const isSeller = transaction.seller_id === req.user.id;
    const hasRole = allowedRoles.includes(req.user.role);

    if (!isSeller && !hasRole) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this transfer' });
    }

    if (['completed', 'cancelled'].includes(transaction.status)) {
      return res.status(400).json({ success: false, message: `Transfer is already ${transaction.status}` });
    }

    let txHash = null;
    try {
      const result = await cancelTransferOnChain(transaction.transfer_id);
      if (result) txHash = result.transactionHash;
    } catch (bcErr) {
      console.warn('[Transfer] cancelTransfer failed:', bcErr.message);
    }

    await Transaction.updateStatus(transaction.id, 'cancelled', txHash);
    await Property.update(transaction.property_id, { status: 'active' });

    await AuditLog.create({
      userId: req.user.id, action: 'TRANSFER_CANCELLED',
      entityType: 'transaction', entityId: transaction.id, ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Transfer cancelled' });
  } catch (err) {
    next(err);
  }
}

async function getTransfer(req, res, next) {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transfer not found' });
    res.json({ success: true, transaction });
  } catch (err) {
    next(err);
  }
}

async function getMyTransfers(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const transactions = await Transaction.findByUser(req.user.id, { limit, offset });
    res.json({ success: true, transactions });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  initiateTransfer,
  confirmTransfer,
  approveTransfer,
  completeTransfer,
  cancelTransfer,
  getTransfer,
  getMyTransfers,
};
