const express = require('express');
const router = express.Router();
const { getPlans } = require('../controllers/planController');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Route publique — pas d'authentification requise
router.get('/', getPlans);

// Route publique — config de paiement (numéro Wave/OM)
router.get('/payment-config', async (req, res) => {
  let config = await prisma.platformConfig.findFirst();
  if (!config) config = await prisma.platformConfig.create({ data: {} });
  res.json({ success: true, data: { config } });
});

module.exports = router;
