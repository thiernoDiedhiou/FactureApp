const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/clients', require('./clients'));
router.use('/products', require('./products'));
router.use('/documents', require('./documents'));
router.use('/settings', require('./settings'));
router.use('/dashboard', require('./dashboard'));

module.exports = router;
