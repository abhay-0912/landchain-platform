'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const transferController = require('../controllers/transferController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = Router();

router.use(auth);

router.post(
  '/',
  [
    body('propertyId').notEmpty(),
    body('buyerId').notEmpty(),
    body('salePrice').isNumeric().withMessage('Sale price must be a number'),
  ],
  transferController.initiateTransfer
);

router.get('/mine', transferController.getMyTransfers);
router.get('/:id', transferController.getTransfer);

router.post('/:id/confirm', transferController.confirmTransfer);
router.post('/:id/approve', requireRole('officer', 'admin'), transferController.approveTransfer);
router.post('/:id/complete', transferController.completeTransfer);
router.post('/:id/cancel', transferController.cancelTransfer);

module.exports = router;
