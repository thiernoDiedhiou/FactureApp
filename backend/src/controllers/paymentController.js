const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { AppError } = require('../middlewares/errorHandler');
const { createPayment, verifyPayment } = require('../services/moneyFusionService');
const { computeNewExpiry, computeAmount } = require('../utils/subscriptionUtils');

const prisma = new PrismaClient();

const PLAN_ORDER = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

/**
 * POST /api/payments/moneyfusion/checkout
 * Crée un paiement Money Fusion et retourne l'URL de la page de paiement hébergée.
 * Le montant est calculé côté serveur depuis PlanConfig — jamais depuis le client.
 */
const createMoneyFusionCheckout = async (req, res) => {
  const schema = z.object({
    targetPlan:     z.enum(['STARTER', 'PRO', 'ENTERPRISE']),
    durationMonths: z.number().int().min(1).max(12).default(1),
    phone:          z.string().min(8).max(20)
  });

  const { targetPlan, durationMonths, phone } = schema.parse(req.body);

  const org = await prisma.organization.findUnique({ where: { id: req.organizationId } });
  if (!org) throw new AppError('Organisation introuvable', 404);

  const currentPlanIndex = PLAN_ORDER.indexOf(org.plan);
  const targetPlanIndex  = PLAN_ORDER.indexOf(targetPlan);
  const isUpgrade = targetPlanIndex > currentPlanIndex;
  const isRenewal = targetPlan === org.plan && org.plan !== 'FREE';

  if (!isUpgrade && !isRenewal) {
    throw new AppError('Plan cible invalide', 400);
  }

  const pending = await prisma.upgradeRequest.findFirst({
    where: { organizationId: req.organizationId, status: 'pending' }
  });
  if (pending) throw new AppError('Une demande est déjà en attente de validation', 409);

  // Montant calculé depuis la DB — le client ne peut pas manipuler le prix
  const planConfig = await prisma.planConfig.findFirst({ where: { key: targetPlan, isActive: true } });
  if (!planConfig) throw new AppError('Plan introuvable ou inactif', 404);
  const amount = computeAmount(planConfig.price, durationMonths);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const apiBaseUrl  = process.env.API_BASE_URL  || 'http://localhost:5000';

  // Créer l'UpgradeRequest AVANT d'appeler Money Fusion pour garantir la traçabilité
  const upgradeReq = await prisma.upgradeRequest.create({
    data: {
      organizationId: req.organizationId,
      targetPlan,
      amount,
      durationMonths,
      paymentMethod: 'moneyfusion',
      status: 'pending'
    }
  });

  let mfData;
  try {
    mfData = await createPayment({
      totalPrice:  amount,
      article:     [{ [`CFActure Plan ${targetPlan} — ${durationMonths} mois`]: amount }],
      numeroSend:  phone.replace(/[\s\-]/g, ''),
      nomclient:   org.name,
      // Pas de ?status= hardcodé : Money Fusion utilise la même URL quelle que soit l'issue.
      // PaymentReturn.jsx détecte le résultat en interrogeant notre API (polling).
      returnUrl:   `${frontendUrl}/payment/return?ref=${upgradeReq.id}`,
      webhookUrl:  `${apiBaseUrl}/api/payments/moneyfusion/webhook`,
      personalInfo: [{ upgradeRequestId: upgradeReq.id, orgId: req.organizationId }]
    });
  } catch (err) {
    // Si Money Fusion échoue, rejeter l'UpgradeRequest pour débloquer l'organisation
    await prisma.upgradeRequest.update({
      where: { id: upgradeReq.id },
      data:  { status: 'rejected' }
    });
    // On logue le détail en interne mais on n'expose pas le message brut au client
    console.error('[MF checkout] Erreur API:', err.message);
    throw new AppError('Le service de paiement est temporairement indisponible. Réessayez dans quelques instants.', 502);
  }

  // Associer le token Money Fusion à l'UpgradeRequest pour le retrouver dans le webhook
  await prisma.upgradeRequest.update({
    where: { id: upgradeReq.id },
    data:  { transactionRef: mfData.token }
  });

  res.json({
    success: true,
    data: {
      checkoutUrl: mfData.url,
      token:       mfData.token
    }
  });
};

/**
 * POST /api/payments/moneyfusion/webhook
 * Reçoit les événements Money Fusion.
 * La vérification se fait par un GET /paiementNotif/{token} — pas de signature HMAC documentée.
 * On répond toujours 200 pour éviter les retries infinis de Money Fusion.
 */
const moneyFusionWebhook = async (req, res) => {
  const event = req.body;

  // Paiement annulé ou échoué : libérer l'UpgradeRequest pour que l'utilisateur puisse réessayer
  if (event.event === 'payin.session.cancelled') {
    const payToken = event.tokenPay;
    if (payToken) {
      await prisma.upgradeRequest.updateMany({
        where: { transactionRef: payToken, status: 'pending' },
        data:  { status: 'rejected' }
      });
      console.log(`[MF webhook] Paiement annulé — UpgradeRequest libéré pour token=${payToken}`);
    }
    return res.json({ success: true, received: true });
  }

  // La doc Money Fusion utilise le champ "event" (pas "type")
  if (event.event !== 'payin.session.completed') {
    return res.json({ success: true, received: true });
  }

  // Le token de paiement est dans "tokenPay" selon la doc Money Fusion
  const payToken = event.tokenPay;
  if (!payToken) {
    console.error('[MF webhook] token absent dans l\'événement:', JSON.stringify(event));
    return res.json({ success: true, received: true });
  }

  // Vérification indépendante avec 2 tentatives (timeout possible côté MF)
  let verification;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      verification = await verifyPayment(payToken);
      break;
    } catch (err) {
      if (attempt === 2) {
        console.error('[MF webhook] Vérification impossible après 2 tentatives:', err.message);
        // On retourne 200 pour ne pas bloquer MF, mais le plan reste pending.
        // Le polling PaymentReturn affichera "confirmation en attente" → support.
        return res.json({ success: true, received: false, error: 'Vérification impossible' });
      }
      console.warn(`[MF webhook] Tentative ${attempt} échouée, nouvelle tentative…`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  // La réponse de /paiementNotif/{token} encapsule les données dans "data"
  // et le statut est dans data.statut (pas verification.status)
  if (verification.data?.statut !== 'paid') {
    console.log(`[MF webhook] Paiement non confirmé (statut=${verification.data?.statut}) token=${payToken}`);
    return res.json({ success: true, received: true });
  }

  // Recherche principale : par token (chemin normal)
  let upgradeReq = await prisma.upgradeRequest.findFirst({
    where: { transactionRef: payToken, status: 'pending' }
  });

  // Fallback : si le serveur a crashé entre la création de l'UpgradeRequest et le stockage
  // du token, on retrouve la demande via l'upgradeRequestId dans personal_Info.
  // IMPORTANT : on lit personal_Info depuis verification.data (source Money Fusion, non forgeable)
  // et NON depuis event.personal_Info (corps webhook, forgeable par un attaquant).
  if (!upgradeReq) {
    const verifiedInfo = Array.isArray(verification.data?.personal_Info)
      ? verification.data.personal_Info[0]
      : null;
    const upgradeRequestId = verifiedInfo?.upgradeRequestId;

    if (upgradeRequestId) {
      const candidate = await prisma.upgradeRequest.findUnique({
        where: { id: upgradeRequestId }
      });
      // N'utiliser que si toujours pending ET sans token stocké
      if (candidate?.status === 'pending' && !candidate.transactionRef) {
        upgradeReq = candidate;
        // Stocker le token maintenant pour les éventuels futurs webhooks
        await prisma.upgradeRequest.update({
          where: { id: upgradeReq.id },
          data:  { transactionRef: payToken }
        });
        console.warn(`[MF webhook] Fallback verification.data utilisé pour id=${upgradeRequestId}`);
      }
    }
  }

  if (!upgradeReq) {
    console.warn(`[MF webhook] UpgradeRequest introuvable ou déjà traité pour token=${payToken}`);
    return res.json({ success: true, received: true });
  }

  const { organizationId, targetPlan, durationMonths, amount } = upgradeReq;

  try {
    await prisma.$transaction(async (tx) => {
      // Re-vérifier le statut dans la transaction pour éviter les race conditions
      const freshReq = await tx.upgradeRequest.findUnique({ where: { id: upgradeReq.id } });
      if (freshReq.status !== 'pending') return;

      const org = await tx.organization.findUnique({ where: { id: organizationId } });
      if (!org) throw new Error(`Organisation ${organizationId} introuvable`);

      const newStartedAt = new Date();
      const newExpiresAt = computeNewExpiry(org, targetPlan, durationMonths);

      await tx.organization.update({
        where: { id: organizationId },
        data:  { plan: targetPlan, planStartedAt: newStartedAt, planExpiresAt: newExpiresAt }
      });

      await tx.upgradeRequest.update({
        where: { id: upgradeReq.id },
        data:  { status: 'validated', processedAt: new Date(), processedBy: 'moneyfusion_webhook' }
      });

      await tx.subscription.create({
        data: {
          organizationId,
          plan:             targetPlan,
          startDate:        newStartedAt,
          endDate:          newExpiresAt,
          durationMonths,
          amount,
          upgradeRequestId: upgradeReq.id
        }
      });
    });

    console.log(`[MF webhook] Abonnement activé : org=${organizationId} plan=${targetPlan}`);
  } catch (err) {
    console.error('[MF webhook] Erreur activation:', err.message);
    return res.json({ success: false, error: err.message });
  }

  res.json({ success: true, received: true });
};

/**
 * GET /api/payments/moneyfusion/status/:ref
 * Retourne le statut d'un UpgradeRequest pour que PaymentReturn.jsx
 * puisse savoir si le paiement a été confirmé, annulé ou est encore en cours.
 */
const getPaymentStatus = async (req, res) => {
  const upgradeReq = await prisma.upgradeRequest.findUnique({
    where: { id: req.params.ref }
  });

  if (!upgradeReq || upgradeReq.organizationId !== req.organizationId) {
    throw new AppError('Demande introuvable', 404);
  }

  res.json({
    success: true,
    data: {
      status:     upgradeReq.status,      // 'pending' | 'validated' | 'rejected'
      targetPlan: upgradeReq.targetPlan
    }
  });
};

/**
 * DELETE /api/payments/moneyfusion/cancel/:ref
 * Permet à l'utilisateur d'annuler un paiement abandonné (webhook non reçu).
 * À utiliser uniquement depuis l'écran timeout de PaymentReturn.
 */
const cancelPendingCheckout = async (req, res) => {
  const upgradeReq = await prisma.upgradeRequest.findUnique({
    where: { id: req.params.ref }
  });

  if (!upgradeReq || upgradeReq.organizationId !== req.organizationId) {
    throw new AppError('Demande introuvable', 404);
  }

  if (upgradeReq.status !== 'pending') {
    return res.json({ success: true, alreadyResolved: true, status: upgradeReq.status });
  }

  // Re-vérifier auprès de Money Fusion avant d'annuler — évite d'annuler un paiement réel
  // dont le webhook aurait simplement échoué à arriver (timeout réseau, etc.)
  if (upgradeReq.transactionRef) {
    try {
      const verification = await verifyPayment(upgradeReq.transactionRef);
      if (verification.data?.statut === 'paid') {
        // Le paiement a bien eu lieu — activer le plan plutôt qu'annuler
        console.warn(`[MF cancel] Paiement confirmé payé lors de l'annulation manuelle — activation forcée pour req=${upgradeReq.id}`);
        const org = await prisma.organization.findUnique({ where: { id: upgradeReq.organizationId } });
        const newStartedAt = new Date();
        const newExpiresAt = computeNewExpiry(org, upgradeReq.targetPlan, upgradeReq.durationMonths);

        await prisma.$transaction([
          prisma.organization.update({
            where: { id: upgradeReq.organizationId },
            data:  { plan: upgradeReq.targetPlan, planStartedAt: newStartedAt, planExpiresAt: newExpiresAt }
          }),
          prisma.upgradeRequest.update({
            where: { id: upgradeReq.id },
            data:  { status: 'validated', processedAt: new Date(), processedBy: 'cancel_recovery' }
          }),
          prisma.subscription.create({
            data: {
              organizationId:   upgradeReq.organizationId,
              plan:             upgradeReq.targetPlan,
              startDate:        newStartedAt,
              endDate:          newExpiresAt,
              durationMonths:   upgradeReq.durationMonths,
              amount:           upgradeReq.amount,
              upgradeRequestId: upgradeReq.id
            }
          })
        ]);

        return res.json({ success: true, activated: true, message: 'Paiement retrouvé — plan activé' });
      }
    } catch (err) {
      // Si la vérification échoue, on ne bloque pas : l'utilisateur a déclaré avoir abandonné
      console.warn(`[MF cancel] Vérification impossible (${err.message}) — annulation acceptée`);
    }
  }

  await prisma.upgradeRequest.update({
    where: { id: upgradeReq.id },
    data:  { status: 'rejected' }
  });

  res.json({ success: true, message: 'Paiement annulé' });
};

module.exports = { createMoneyFusionCheckout, moneyFusionWebhook, getPaymentStatus, cancelPendingCheckout };
