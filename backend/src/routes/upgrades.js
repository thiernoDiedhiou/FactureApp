const express = require('express');
const router = express.Router();
const { authenticate, requireOrganization, requireOwner } = require('../middlewares/auth');
const { createUpgradeRequest, getMyUpgradeRequests, getUpgradeReceipt } = require('../controllers/upgradeController');

router.use(authenticate);
router.use(requireOrganization);

// Facturation réservée au propriétaire (CLAUDE.md : "OWNER — gestion plan/facturation")
router.post('/', requireOwner, createUpgradeRequest);
router.get('/mine', getMyUpgradeRequests);
router.get('/:id/receipt', requireOwner, getUpgradeReceipt);

module.exports = router;
