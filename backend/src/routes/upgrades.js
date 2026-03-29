const express = require('express');
const router = express.Router();
const { authenticate, requireOrganization } = require('../middlewares/auth');
const { createUpgradeRequest, getMyUpgradeRequests } = require('../controllers/upgradeController');

router.use(authenticate);
router.use(requireOrganization);

router.post('/', createUpgradeRequest);
router.get('/mine', getMyUpgradeRequests);

module.exports = router;
