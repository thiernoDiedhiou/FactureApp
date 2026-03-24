const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { AppError } = require('../middlewares/errorHandler');

const prisma = new PrismaClient();

const PLAN_ORDER = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

// POST /api/upgrades — Soumettre une demande de mise à niveau
const createUpgradeRequest = async (req, res) => {
  const schema = z.object({
    targetPlan:    z.enum(['STARTER', 'PRO', 'ENTERPRISE']),
    paymentMethod: z.enum(['wave', 'orange_money', 'free_money', 'cash']),
    transactionRef: z.string().min(1).optional(),
    amount:        z.number().int().min(0)
  });

  const data = schema.parse(req.body);

  const org = await prisma.organization.findUnique({ where: { id: req.organizationId } });
  if (!org) throw new AppError('Organisation introuvable', 404);

  if (PLAN_ORDER.indexOf(data.targetPlan) <= PLAN_ORDER.indexOf(org.plan)) {
    throw new AppError('Le plan cible doit être supérieur au plan actuel', 400);
  }

  const existing = await prisma.upgradeRequest.findFirst({
    where: { organizationId: req.organizationId, status: 'pending' }
  });
  if (existing) {
    throw new AppError('Une demande est déjà en attente de validation', 409);
  }

  const request = await prisma.upgradeRequest.create({
    data: {
      organizationId: req.organizationId,
      targetPlan:     data.targetPlan,
      amount:         data.amount,
      paymentMethod:  data.paymentMethod,
      transactionRef: data.transactionRef || null
    }
  });

  res.status(201).json({
    success: true,
    message: 'Demande envoyée. Notre équipe validera votre paiement sous 24h.',
    data: { request }
  });
};

// GET /api/upgrades/mine — Mes demandes (côté org)
const getMyUpgradeRequests = async (req, res) => {
  const requests = await prisma.upgradeRequest.findMany({
    where: { organizationId: req.organizationId },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ success: true, data: { requests } });
};

module.exports = { createUpgradeRequest, getMyUpgradeRequests };
