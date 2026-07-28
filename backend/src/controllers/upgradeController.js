const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { AppError } = require('../middlewares/errorHandler');
const { computeAmount } = require('../utils/subscriptionUtils');

const prisma = new PrismaClient();

const PLAN_ORDER = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

// POST /api/upgrades — Soumettre une demande de mise à niveau ou de renouvellement
const createUpgradeRequest = async (req, res) => {
  const schema = z.object({
    targetPlan:     z.enum(['STARTER', 'PRO', 'ENTERPRISE']),
    paymentMethod:  z.enum(['orange_money', 'free_money', 'cash']),
    transactionRef: z.string().min(1).optional(),
    durationMonths: z.number().int().min(1).max(12).default(1)
  });

  const data = schema.parse(req.body);

  const org = await prisma.organization.findUnique({ where: { id: req.organizationId } });
  if (!org) throw new AppError('Organisation introuvable', 404);

  const currentPlanIndex = PLAN_ORDER.indexOf(org.plan);
  const targetPlanIndex  = PLAN_ORDER.indexOf(data.targetPlan);

  const isUpgrade  = targetPlanIndex > currentPlanIndex;
  const isRenewal  = data.targetPlan === org.plan && org.plan !== 'FREE';

  if (!isUpgrade && !isRenewal) {
    throw new AppError(
      'Le plan cible doit être supérieur au plan actuel, ou identique pour un renouvellement',
      400
    );
  }

  const existing = await prisma.upgradeRequest.findFirst({
    where: { organizationId: req.organizationId, status: 'pending' }
  });
  if (existing) {
    throw new AppError('Une demande est déjà en attente de validation', 409);
  }

  // Montant calculé depuis la DB — le client ne fournit pas le prix
  const planConfig = await prisma.planConfig.findFirst({ where: { key: data.targetPlan, isActive: true } });
  if (!planConfig) throw new AppError('Plan introuvable ou inactif', 404);
  const amount = computeAmount(planConfig.price, data.durationMonths);

  const request = await prisma.upgradeRequest.create({
    data: {
      organizationId: req.organizationId,
      targetPlan:     data.targetPlan,
      amount,
      durationMonths: data.durationMonths,
      paymentMethod:  data.paymentMethod,
      transactionRef: data.transactionRef || null
    }
  });

  const action = isRenewal ? 'renouvellement' : 'mise à niveau';
  res.status(201).json({
    success: true,
    message: `Demande de ${action} envoyée. Notre équipe validera votre paiement sous 24h.`,
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
