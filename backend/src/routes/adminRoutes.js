'use strict';

const { Router } = require('express');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = Router();

router.use(auth, requireRole('admin'));

router.get('/users', adminController.getUsers);
router.patch('/users/:userId', adminController.updateUser);
router.get('/stats', adminController.getSystemStats);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/properties', adminController.getAllProperties);

module.exports = router;
