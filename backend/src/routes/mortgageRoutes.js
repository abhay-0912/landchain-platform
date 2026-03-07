'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const mortgageController = require('../controllers/mortgageController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = Router();

router.use(auth);

router.post(
  '/',
  requireRole('bank', 'admin'),
  [
    body('propertyId').notEmpty(),
    body('borrowerId').notEmpty(),
    body('loanAmount').isNumeric(),
    body('interestRate').isNumeric(),
    body('termMonths').isInt({ min: 1 }),
  ],
  mortgageController.registerMortgage
);

router.get('/:id', mortgageController.getMortgage);
router.get('/property/:propertyId', mortgageController.getPropertyMortgages);
router.post('/:id/release', requireRole('bank', 'admin'), mortgageController.releaseMortgage);

module.exports = router;
