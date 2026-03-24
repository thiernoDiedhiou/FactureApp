const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin, requireOwner } = require('../middlewares/auth');
const {
  getMyOrganization, updateOrganization, getMembers, updateMemberRole,
  removeMember, inviteMember, acceptInvite, switchOrganization
} = require('../controllers/organizationController');

router.use(authenticate);

router.get('/me', getMyOrganization);
router.patch('/me', requireOwner, updateOrganization);
router.get('/members', getMembers);
router.post('/invite', requireAdmin, inviteMember);
router.patch('/members/:userId/role', requireOwner, updateMemberRole);
router.delete('/members/:userId', requireOwner, removeMember);
router.post('/accept-invite', acceptInvite);
router.post('/switch', switchOrganization);

module.exports = router;
