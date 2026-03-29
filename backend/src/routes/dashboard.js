const express = require('express');
const router = express.Router();
const { authenticate, requireOrganization } = require('../middlewares/auth');
const { getStats, getRevenueChart, getOverdueDocuments } = require('../controllers/dashboardController');

router.use(authenticate);
router.use(requireOrganization);

router.get('/stats', getStats);
router.get('/revenue-chart', getRevenueChart);
router.get('/overdue', getOverdueDocuments);

module.exports = router;
