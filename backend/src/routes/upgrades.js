const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { createUpgradeRequest, getMyUpgradeRequests } = require('../controllers/upgradeController');

router.use(authenticate);

router.post('/', createUpgradeRequest);
router.get('/mine', getMyUpgradeRequests);

module.exports = router;
