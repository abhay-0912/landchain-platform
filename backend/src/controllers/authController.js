'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sendRegistrationEmail } = require('../services/emailService');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, fullName, walletAddress } = req.body;

    const existing = await User.findByEmail(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      walletAddress: walletAddress || null,
    });

    await AuditLog.create({
      userId: user.id,
      action: 'USER_REGISTER',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.ip,
    });

    // Non-blocking — email failure should not break registration
    sendRegistrationEmail(user).catch((err) => console.warn('[Email] Registration email failed:', err.message));

    const token = signToken(user.id);
    res.status(201).json({ success: true, token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'suspended') {
      return res.status(401).json({ success: false, message: 'Account suspended' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await AuditLog.create({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.ip,
    });

    const token = signToken(user.id);
    res.json({ success: true, token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res) {
  res.json({ success: true, user: sanitizeUser(req.user) });
}

async function updateKyc(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nationalId, dateOfBirth, address, phone } = req.body;
    const updated = await User.updateKyc(req.user.id, { nationalId, dateOfBirth, address, phone });

    await AuditLog.create({
      userId: req.user.id,
      action: 'USER_KYC_SUBMITTED',
      entityType: 'user',
      entityId: req.user.id,
      ipAddress: req.ip,
    });

    res.json({ success: true, user: sanitizeUser(updated) });
  } catch (err) {
    next(err);
  }
}

async function verifyKyc(req, res, next) {
  try {
    const { userId } = req.params;
    const { status } = req.body; // 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const updated = await User.verifyKyc(userId, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await AuditLog.create({
      userId: req.user.id,
      action: 'USER_KYC_VERIFIED',
      entityType: 'user',
      entityId: userId,
      details: { status, verifiedBy: req.user.id },
      ipAddress: req.ip,
    });

    res.json({ success: true, user: sanitizeUser(updated) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, updateKyc, verifyKyc };
