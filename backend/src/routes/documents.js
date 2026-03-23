const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { pdfLimiter } = require('../middlewares/rateLimiter');
const {
  getDocuments, getDocument, createDocument, updateDocument,
  updateStatus, convertDocument, duplicateDocument, deleteDocument
} = require('../controllers/documentController');
const { generatePDF } = require('../services/pdfService');
const { sendDocumentEmail } = require('../services/emailService');

router.use(authenticate);

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
    where: { id: req.params.id, userId: req.user.id },
    include: {
      client: true,
      items: { include: { product: true } }
    }
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document non trouvé' });
  }

  const settings = await prisma.settings.findUnique({
    where: { userId: req.user.id }
  });

  const pdfBuffer = await generatePDF(document, settings, req.query.style);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${document.number}.pdf"`
  );
  res.send(pdfBuffer);
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
    where: { id: req.params.id, userId: req.user.id },
    include: { client: true, items: { include: { product: true } } }
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document non trouvé' });
  }

  const settings = await prisma.settings.findUnique({ where: { userId: req.user.id } });

  await sendDocumentEmail({ document, settings, to, subject, body });

  await prisma.emailLog.create({
    data: { documentId: document.id, sentTo: to, subject, body, status: 'sent' }
  });

  res.json({ success: true, message: 'Email envoyé avec succès' });
});

module.exports = router;
