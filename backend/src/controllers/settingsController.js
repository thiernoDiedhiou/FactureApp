const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

const settingsSchema = z.object({
  companyName: z.string().max(100).optional(),
  activity:    z.string().max(150).optional(),
  address:     z.string().max(300).optional(),
  phone:       z.string().max(30).optional(),
  email:       z.string().email('Email invalide').max(100).optional().or(z.literal('')),
  website:     z.string().max(100).optional(),
  ninea:       z.string().max(30).optional(),
  rccm:        z.string().max(50).optional(),
  bankName:    z.string().max(100).optional(),
  bankAccount: z.string().max(60).optional(),
  defaultLanguage: z.enum(['fr', 'en']).default('fr'),
  defaultCurrency: z.enum(['XOF', 'EUR', 'USD']).default('XOF'),
  defaultTvaRate: z.coerce.number().min(0).max(100).default(18),
  documentStyle: z.enum(['classique', 'moderne', 'compact']).default('classique'),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide').default('#0EA5E9')
});

// GET /api/settings
const getSettings = async (req, res) => {
  let settings = await prisma.settings.findUnique({
    where: { organizationId: req.organizationId }
  });

  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        organizationId: req.organizationId,
        defaultTvaRate: 18,
        defaultCurrency: 'XOF',
        defaultLanguage: 'fr',
        documentStyle: 'classique',
        primaryColor: '#0EA5E9'
      }
    });
  }

  res.json({ success: true, data: { settings } });
};

// PUT /api/settings
const updateSettings = async (req, res) => {
  const data = settingsSchema.parse(req.body);

  const settings = await prisma.settings.upsert({
    where: { organizationId: req.organizationId },
    update: data,
    create: { ...data, organizationId: req.organizationId }
  });

  res.json({ success: true, message: 'Paramètres mis à jour', data: { settings } });
};

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

function safeUnlink(storedPath) {
  if (!storedPath) return;
  const resolved = path.resolve(__dirname, '../../', storedPath);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep)) return;
  if (fs.existsSync(resolved)) fs.unlinkSync(resolved);
}

// POST /api/settings/logo
const uploadLogo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Fichier image requis' });
  }

  const existing = await prisma.settings.findUnique({ where: { organizationId: req.organizationId } });
  safeUnlink(existing?.logoPath);

  const logoPath = `/uploads/${req.file.filename}`;
  const settings = await prisma.settings.upsert({
    where: { organizationId: req.organizationId },
    update: { logoPath },
    create: { organizationId: req.organizationId, logoPath }
  });

  res.json({ success: true, message: 'Logo uploadé', data: { logoPath, settings } });
};

// POST /api/settings/signature
const uploadSignature = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Fichier image requis' });
  }

  const existing = await prisma.settings.findUnique({ where: { organizationId: req.organizationId } });
  safeUnlink(existing?.signaturePath);

  const signaturePath = `/uploads/${req.file.filename}`;
  const settings = await prisma.settings.upsert({
    where: { organizationId: req.organizationId },
    update: { signaturePath },
    create: { organizationId: req.organizationId, signaturePath }
  });

  res.json({ success: true, message: 'Signature uploadée', data: { signaturePath, settings } });
};

// DELETE /api/settings/logo
const deleteLogo = async (req, res) => {
  const existing = await prisma.settings.findUnique({ where: { organizationId: req.organizationId } });
  safeUnlink(existing?.logoPath);
  await prisma.settings.update({ where: { organizationId: req.organizationId }, data: { logoPath: null } });
  res.json({ success: true, message: 'Logo supprimé' });
};

// DELETE /api/settings/signature
const deleteSignature = async (req, res) => {
  const existing = await prisma.settings.findUnique({ where: { organizationId: req.organizationId } });
  safeUnlink(existing?.signaturePath);
  await prisma.settings.update({ where: { organizationId: req.organizationId }, data: { signaturePath: null } });
  res.json({ success: true, message: 'Signature supprimée' });
};

module.exports = { getSettings, updateSettings, uploadLogo, uploadSignature, deleteLogo, deleteSignature };
