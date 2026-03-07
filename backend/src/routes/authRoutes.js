'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('walletAddress').optional().isEthereumAddress().withMessage('Invalid wallet address'),
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  authController.login
);

router.get('/me', auth, authController.getMe);

router.put(
  '/kyc',
  auth,
  [
    body('nationalId').trim().notEmpty(),
    body('dateOfBirth').isISO8601(),
    body('phone').trim().notEmpty(),
  ],
  authController.updateKyc
);

router.patch(
  '/kyc/:userId/verify',
  auth,
  requireRole('officer', 'admin'),
  [body('status').isIn(['approved', 'rejected'])],
  authController.verifyKyc
);

module.exports = router;
