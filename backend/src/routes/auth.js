const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const {
  register, login, verifyEmail, resendVerification, refresh, logout, me, changePassword,
  forgotPassword, resetPassword
} = require('../controllers/authController');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', authLimiter, resendVerification);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.put('/change-password', authenticate, changePassword);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;
