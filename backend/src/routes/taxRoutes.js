'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const taxController = require('../controllers/taxController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = Router();

router.use(auth);

router.get('/property/:propertyId/history', taxController.getTaxHistory);
router.get('/property/:propertyId/dues', taxController.getTaxDues);

router.post(
  '/property/:propertyId/pay',
  requireRole('officer', 'admin', 'citizen'),
  [
    body('taxYear').isInt({ min: 2000 }),
    body('taxAmount').isNumeric(),
    body('dueDate').optional().isISO8601(),
    body('receiptNumber').optional().trim(),
  ],
  taxController.recordTaxPayment
);

module.exports = router;
