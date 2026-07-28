const express = require('express');
const router = express.Router();
const { authenticate, requireOrganization, requireOwner } = require('../middlewares/auth');
const { createMoneyFusionCheckout, moneyFusionWebhook, getPaymentStatus, cancelPendingCheckout } = require('../controllers/paymentController');

// Création paiement — OWNER uniquement (facturation réservée au propriétaire selon CLAUDE.md)
router.post('/moneyfusion/checkout', authenticate, requireOrganization, requireOwner, createMoneyFusionCheckout);

// Statut d'un paiement (polling depuis PaymentReturn.jsx) — tout membre de l'org peut consulter
router.get('/moneyfusion/status/:ref', authenticate, requireOrganization, getPaymentStatus);

// Annulation d'un paiement abandonné (timeout sur PaymentReturn) — OWNER uniquement
router.delete('/moneyfusion/cancel/:ref', authenticate, requireOrganization, requireOwner, cancelPendingCheckout);

// Webhook Money Fusion — appelé directement par Money Fusion, sans JWT
// La vérification de paiement se fait via GET /paiementNotif/{token} dans le contrôleur
router.post('/moneyfusion/webhook', moneyFusionWebhook);

module.exports = router;
