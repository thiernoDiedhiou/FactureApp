const express = require('express');
const router = express.Router();
const { authenticate, requireOrganization, requireOwner } = require('../middlewares/auth');
const { createUpgradeRequest, getMyUpgradeRequests } = require('../controllers/upgradeController');

router.use(authenticate);
router.use(requireOrganization);

// Facturation réservée au propriétaire (CLAUDE.md : "OWNER — gestion plan/facturation")
router.post('/', requireOwner, createUpgradeRequest);
router.get('/mine', getMyUpgradeRequests);

module.exports = router;
