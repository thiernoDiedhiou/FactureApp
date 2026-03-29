const express = require('express');
const router = express.Router();
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
router.get('/view/:token', pdfLimiter, async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  let payload;
  try {
    payload = jwt.verify(req.params.token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Lien expiré ou invalide' });
  }

  const document = await prisma.document.findFirst({
    where: { id: payload.documentId, organizationId: payload.organizationId },
    include: {
      client: true,
      items: { include: { product: true } }
    }
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document non trouvé' });
  }

  const settings = await prisma.settings.findUnique({
    where: { organizationId: payload.organizationId }
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

  const token = jwt.sign(
    { documentId: document.id, organizationId: req.organizationId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const link = `${baseUrl}/api/documents/view/${token}`;

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
