const express = require('express');
const router = express.Router();
const { authenticate, requireSuperAdmin } = require('../middlewares/auth');
const {
  getStats, getOrganizations, updateOrgPlan, toggleSuspend,
  deleteOrganization, getUsers, toggleSuperAdmin,
  getAdminPlans, updatePlanConfig,
  getUpgradeRequests, processUpgradeRequest,
  getPlatformConfig, updatePlatformConfig,
  impersonateOrg
} = require('../controllers/adminController');

// Toutes les routes admin nécessitent d'être authentifié ET super admin
router.use(authenticate, requireSuperAdmin);

router.get('/stats', getStats);
router.get('/organizations', getOrganizations);
router.patch('/organizations/:id/plan', updateOrgPlan);
router.patch('/organizations/:id/suspend', toggleSuspend);
router.delete('/organizations/:id', deleteOrganization);
router.get('/users', getUsers);
router.patch('/users/:id/superadmin', toggleSuperAdmin);

router.get('/plans', getAdminPlans);
router.patch('/plans/:key', updatePlanConfig);

router.get('/upgrades', getUpgradeRequests);
router.patch('/upgrades/:id', processUpgradeRequest);

router.get('/config', getPlatformConfig);
router.patch('/config', updatePlatformConfig);

// Super admin : entrer dans une organisation sans en être membre
router.post('/impersonate-org', impersonateOrg);

module.exports = router;
