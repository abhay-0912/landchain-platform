const express = require('express');
const { getAllProperties, addProperty } = require('../controllers/propertyController');

const router = express.Router();

router.get('/', getAllProperties);
router.post('/', addProperty);

module.exports = router;
