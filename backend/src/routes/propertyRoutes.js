'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const propertyController = require('../controllers/propertyController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = Router();

router.use(auth);

router.post(
  '/',
  requireRole('citizen', 'officer', 'admin'),
  [
    body('propertyId').trim().notEmpty(),
    body('surveyNumber').trim().notEmpty(),
    body('address').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('state').trim().notEmpty(),
    body('area').isNumeric().withMessage('Area must be a number'),
    body('propertyType').isIn(['residential', 'commercial', 'agricultural', 'industrial']),
    body('marketValue').isNumeric(),
  ],
  propertyController.registerProperty
);

router.get('/search', propertyController.searchProperties);
router.get('/mine', propertyController.getMyProperties);
router.get('/:id', propertyController.getProperty);
router.get('/:id/history', propertyController.getOwnershipHistory);

router.patch(
  '/:id',
  requireRole('officer', 'admin'),
  [
    body('marketValue').optional().isNumeric(),
    body('status').optional().isIn(['active', 'under_transfer', 'mortgaged', 'frozen']),
  ],
  propertyController.updateProperty
);

module.exports = router;
