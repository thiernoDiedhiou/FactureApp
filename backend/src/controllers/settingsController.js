const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

const settingsSchema = z.object({
  companyName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  website: z.string().optional(),
  ninea: z.string().optional(),
  defaultLanguage: z.enum(['fr', 'en']).default('fr'),
  defaultCurrency: z.enum(['XOF', 'EUR', 'USD']).default('XOF'),
  defaultTvaRate: z.number().min(0).max(100).default(18),
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

// POST /api/settings/logo
const uploadLogo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Fichier image requis' });
  }

  const existing = await prisma.settings.findUnique({ where: { organizationId: req.organizationId } });
  if (existing?.logoPath) {
    const oldPath = path.join(__dirname, '../../uploads', existing.logoPath.replace('/uploads/', ''));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

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
  if (existing?.signaturePath) {
    const oldPath = path.join(__dirname, '../../uploads', existing.signaturePath.replace('/uploads/', ''));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

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
  if (existing?.logoPath) {
    const filePath = path.join(__dirname, '../../', existing.logoPath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await prisma.settings.update({ where: { organizationId: req.organizationId }, data: { logoPath: null } });
  res.json({ success: true, message: 'Logo supprimé' });
};

// DELETE /api/settings/signature
const deleteSignature = async (req, res) => {
  const existing = await prisma.settings.findUnique({ where: { organizationId: req.organizationId } });
  if (existing?.signaturePath) {
    const filePath = path.join(__dirname, '../../', existing.signaturePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await prisma.settings.update({ where: { organizationId: req.organizationId }, data: { signaturePath: null } });
  res.json({ success: true, message: 'Signature supprimée' });
};

module.exports = { getSettings, updateSettings, uploadLogo, uploadSignature, deleteLogo, deleteSignature };
