'use strict';

const { Router } = require('express');

const authRoutes = require('./authRoutes');
const propertyRoutes = require('./propertyRoutes');
const transferRoutes = require('./transferRoutes');
const mortgageRoutes = require('./mortgageRoutes');
const taxRoutes = require('./taxRoutes');
const documentRoutes = require('./documentRoutes');
const adminRoutes = require('./adminRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/transfers', transferRoutes);
router.use('/mortgages', mortgageRoutes);
router.use('/taxes', taxRoutes);
router.use('/documents', documentRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
