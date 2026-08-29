const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const PDFDocument = require('pdfkit');
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

// GET /api/upgrades/:id/receipt — Télécharger le reçu PDF d'un paiement approuvé
const getUpgradeReceipt = async (req, res) => {
  const request = await prisma.upgradeRequest.findFirst({
    where: { id: req.params.id, organizationId: req.organizationId },
    include: { organization: true }
  });

  if (!request) throw new AppError('Demande introuvable', 404);
  if (request.status !== 'approved') throw new AppError('Le reçu n\'est disponible que pour les paiements validés', 400);

  const fmt = (n) => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
  const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const TEAL = '#00C8D7';
  const DARK = '#1a2332';
  const GRAY = '#6b7280';

  const PLAN_LABELS = { FREE: 'Gratuit', STARTER: 'Starter', PRO: 'Pro', ENTERPRISE: 'Enterprise' };

  const doc = new PDFDocument({ size: 'A4', margin: 0, info: {
    Title: `Reçu - ${request.organization.name}`,
    Author: 'CFActure',
    Subject: 'Reçu de paiement'
  }});

  const receiptNum = `REC-${new Date(request.createdAt).getFullYear()}-${request.id.slice(0, 8).toUpperCase()}`;
  const bufs = [];
  doc.on('data', (chunk) => bufs.push(chunk));
  doc.on('end', () => {
    const pdf = Buffer.concat(bufs);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${receiptNum}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.send(pdf);
  });

  const W = 595.28;
  const H = 841.89;
  const MARGIN = 48;

  // ── En-tête gradient ──────────────────────────────────────────────────────
  doc.rect(0, 0, W, 110).fill(TEAL);
  doc.fontSize(22).fillColor('#ffffff').font('Helvetica-Bold')
    .text('CFActure', MARGIN, 36);
  doc.fontSize(10).fillColor('rgba(255,255,255,0.75)').font('Helvetica')
    .text('Plateforme de facturation XOF', MARGIN, 64);

  doc.fontSize(14).fillColor('#ffffff').font('Helvetica-Bold')
    .text('REÇU DE PAIEMENT', 0, 36, { align: 'right', width: W - MARGIN });
  doc.fontSize(9).fillColor('rgba(255,255,255,0.75)').font('Helvetica')
    .text('Validé le ' + fmtDate(request.processedAt || request.createdAt), 0, 58, { align: 'right', width: W - MARGIN });

  // ── Corps ─────────────────────────────────────────────────────────────────
  let y = 140;

  // Numéro de reçu (déjà calculé plus haut)
  doc.fontSize(9).fillColor(GRAY).font('Helvetica')
    .text('Numéro de reçu', MARGIN, y);
  doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold')
    .text(receiptNum, MARGIN, y + 14);

  doc.fontSize(9).fillColor(GRAY).font('Helvetica')
    .text('Date de paiement', W / 2, y);
  doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold')
    .text(fmtDate(request.processedAt || request.createdAt), W / 2, y + 14);

  y += 56;
  doc.moveTo(MARGIN, y).lineTo(W - MARGIN, y).lineWidth(0.5).strokeColor('#e5e7eb').stroke();
  y += 20;

  // Facturé à
  doc.fontSize(9).fillColor(GRAY).font('Helvetica').text('FACTURÉ À', MARGIN, y);
  y += 14;
  doc.fontSize(12).fillColor(DARK).font('Helvetica-Bold').text(request.organization.name, MARGIN, y);
  y += 16;
  if (request.organization.email) {
    doc.fontSize(10).fillColor(GRAY).font('Helvetica').text(request.organization.email, MARGIN, y);
    y += 14;
  }

  y += 24;
  doc.moveTo(MARGIN, y).lineTo(W - MARGIN, y).lineWidth(0.5).strokeColor('#e5e7eb').stroke();
  y += 20;

  // Détails abonnement — en-têtes
  const COL = [MARGIN, MARGIN + 200, MARGIN + 330, W - MARGIN - 80];
  doc.fontSize(8).fillColor(GRAY).font('Helvetica');
  ['DESCRIPTION', 'DURÉE', 'P.U. / MOIS', 'TOTAL'].forEach((h, i) => {
    doc.text(h, COL[i], y, { align: i === 3 ? 'right' : 'left', width: i === 3 ? 80 : 190 });
  });

  y += 14;
  doc.moveTo(MARGIN, y).lineTo(W - MARGIN, y).lineWidth(0.5).strokeColor('#e5e7eb').stroke();
  y += 12;

  // Ligne produit
  const unitPrice = Math.round(request.amount / request.durationMonths);
  doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold')
    .text(`Plan ${PLAN_LABELS[request.targetPlan] || request.targetPlan}`, COL[0], y);
  doc.fontSize(10).fillColor(DARK).font('Helvetica')
    .text(`${request.durationMonths} mois`, COL[1], y)
    .text(fmt(unitPrice), COL[2], y)
    .text(fmt(request.amount), COL[3], y, { align: 'right', width: 80 });

  y += 36;
  doc.moveTo(MARGIN, y).lineTo(W - MARGIN, y).lineWidth(1).strokeColor('#e5e7eb').stroke();
  y += 16;

  // Total
  doc.fontSize(9).fillColor(GRAY).font('Helvetica').text('Total payé', W - MARGIN - 160, y, { align: 'right', width: 80 });
  doc.fontSize(18).fillColor(TEAL).font('Helvetica-Bold').text(fmt(request.amount), W - MARGIN - 160, y + 14, { align: 'right', width: 80 });

  y += 64;
  // Badge payé
  doc.roundedRect(MARGIN, y, 96, 28, 14).fill('#dcfce7');
  doc.fontSize(10).fillColor('#16a34a').font('Helvetica-Bold').text('✓  Payé', MARGIN + 8, y + 8, { width: 80 });

  // ── Pied de page ──────────────────────────────────────────────────────────
  doc.rect(0, H - 64, W, 64).fill('#f9fafb');
  doc.fontSize(8).fillColor(GRAY).font('Helvetica')
    .text('CFActure — Plateforme de facturation XOF pour les PME et freelances UEMOA', 0, H - 44, { align: 'center', width: W })
    .text('contact@factureapp.sn', 0, H - 30, { align: 'center', width: W });

  doc.end();
};

module.exports = { createUpgradeRequest, getMyUpgradeRequests, getUpgradeReceipt };
