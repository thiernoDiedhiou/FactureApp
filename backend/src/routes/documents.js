const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { authenticate, requireOrganization } = require('../middlewares/auth');
const { pdfLimiter } = require('../middlewares/rateLimiter');
const {
  getDocuments, getDocument, createDocument, updateDocument,
  updateStatus, convertDocument, duplicateDocument, deleteDocument
} = require('../controllers/documentController');
const { generatePDF } = require('../services/pdfService');
const { sendDocumentEmail } = require('../services/emailService');

// ─── Public PDF view via signed token (no auth required) ──────────────────────
router.get('/view/:tokenOrDocId', pdfLimiter, async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  let documentWhere;

  if (req.query.sig) {
    // Format HMAC court : /view/:docId?exp=<ms>&sig=<20chars>
    const { exp, sig } = req.query;
    const docId = req.params.tokenOrDocId;

    if (!exp || !sig || Date.now() > parseInt(exp, 10)) {
      return res.status(401).json({ success: false, message: 'Lien expiré ou invalide' });
    }

    const expectedSig = crypto.createHmac('sha256', process.env.JWT_SECRET)
      .update(`${docId}.${exp}`)
      .digest('base64url')
      .slice(0, 20);

    if (sig !== expectedSig) {
      return res.status(401).json({ success: false, message: 'Lien expiré ou invalide' });
    }

    documentWhere = { id: docId };
  } else {
    // Format JWT legacy (rétrocompatibilité — liens générés avant la migration)
    let payload;
    try {
      payload = jwt.verify(req.params.tokenOrDocId, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Lien expiré ou invalide' });
    }
    documentWhere = { id: payload.documentId, organizationId: payload.organizationId };
  }

  const document = await prisma.document.findFirst({
    where: documentWhere,
    include: {
      client: true,
      items: { include: { product: true } }
    }
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document non trouvé' });
  }

  const settings = await prisma.settings.findUnique({
    where: { organizationId: document.organizationId }
  });

  const pdfBuffer = await generatePDF(document, settings);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${document.number}.pdf"`);
  res.send(pdfBuffer);
});

router.use(authenticate);
router.use(requireOrganization);

router.get('/', getDocuments);
router.get('/:id', getDocument);
router.post('/', createDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

router.patch('/:id/status', updateStatus);
router.post('/:id/convert', convertDocument);
router.post('/:id/duplicate', duplicateDocument);

// PDF generation
router.get('/:id/pdf', pdfLimiter, async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const document = await prisma.document.findFirst({
    where: { id: req.params.id, organizationId: req.organizationId },
    include: {
      client: true,
      items: { include: { product: true } }
    }
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document non trouvé' });
  }

  const settings = await prisma.settings.findUnique({
    where: { organizationId: req.organizationId }
  });

  const pdfBuffer = await generatePDF(document, settings, req.query.style);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${document.number}.pdf"`
  );
  res.send(pdfBuffer);
});

// Generate a temporary public share link (7 days)
router.post('/:id/share-link', async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const document = await prisma.document.findFirst({
    where: { id: req.params.id, organizationId: req.organizationId },
    select: { id: true, number: true }
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document non trouvé' });
  }

  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const sig = crypto.createHmac('sha256', process.env.JWT_SECRET)
    .update(`${document.id}.${expiry}`)
    .digest('base64url')
    .slice(0, 20);

  const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const link = `${baseUrl}/api/documents/view/${document.id}?exp=${expiry}&sig=${sig}`;

  res.json({ success: true, data: { link, expiresIn: '7 jours' } });
});

// Send by email
router.post('/:id/email', async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const { z } = require('zod');
  const prisma = new PrismaClient();

  const schema = z.object({
    to: z.string().email('Email invalide'),
    subject: z.string().min(1, 'Objet requis'),
    body: z.string().optional()
  });

  const { to, subject, body } = schema.parse(req.body);

  const document = await prisma.document.findFirst({
    where: { id: req.params.id, organizationId: req.organizationId },
    include: { client: true, items: { include: { product: true } } }
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document non trouvé' });
  }

  const settings = await prisma.settings.findUnique({ where: { organizationId: req.organizationId } });

  await sendDocumentEmail({ document, settings, to, subject, body });

  await prisma.emailLog.create({
    data: { documentId: document.id, sentTo: to, subject, body, status: 'sent' }
  });

  res.json({ success: true, message: 'Email envoyé avec succès' });
});

module.exports = router;
