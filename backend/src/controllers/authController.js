const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { generateTokens, verifyRefreshToken, revokeRefreshToken } = require('../utils/jwt');

const prisma = new PrismaClient();

const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit faire au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères')
});

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis')
});

// POST /api/auth/register
const register = async (req, res) => {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      settings: {
        create: {
          companyName: data.name,
          defaultTvaRate: 18,
          defaultCurrency: 'XOF',
          defaultLanguage: 'fr',
          documentStyle: 'classique',
          primaryColor: '#0EA5E9'
        }
      }
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });

  const { accessToken, refreshToken } = await generateTokens(user.id);

  res.status(201).json({
    success: true,
    message: 'Compte créé avec succès',
    data: { user, accessToken, refreshToken }
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
  }

  const isValidPassword = await bcrypt.compare(data.password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
  }

  const { accessToken, refreshToken } = await generateTokens(user.id);

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'Connexion réussie',
    data: { user: userWithoutPassword, accessToken, refreshToken }
  });
};

// POST /api/auth/refresh
const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Token de rafraîchissement requis' });
  }

  const stored = await verifyRefreshToken(refreshToken);
  await revokeRefreshToken(refreshToken);
  const tokens = await generateTokens(stored.userId);

  res.json({
    success: true,
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: stored.user
    }
  });
};

// POST /api/auth/logout
const logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  res.json({ success: true, message: 'Déconnexion réussie' });
};

// GET /api/auth/me
const me = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });
  res.json({ success: true, data: { user } });
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, 'Le nouveau mot de passe doit faire au moins 8 caractères')
  });

  const { currentPassword, newPassword } = schema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect' });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

  res.json({ success: true, message: 'Mot de passe modifié avec succès' });
};

module.exports = { register, login, refresh, logout, me, changePassword };
