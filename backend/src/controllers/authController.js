const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { generateTokens, verifyRefreshToken, revokeRefreshToken } = require('../utils/jwt');
const { sendVerificationEmail } = require('../services/emailService');

const prisma = new PrismaClient();

// Génère un slug unique à partir du nom de l'organisation
const slugify = (name) => name
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const makeUniqueSlug = async (base) => {
  let slug = slugify(base) || 'organisation';
  const exists = await prisma.organization.findUnique({ where: { slug } });
  if (!exists) return slug;
  return `${slug}-${Math.random().toString(36).substring(2, 6)}`;
};

const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit faire au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
  organizationName: z.string().min(2, 'Le nom de l\'entreprise est requis').optional(),
  inviteToken: z.string().optional()
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
  const orgName = data.organizationName || data.name;
  const slug = await makeUniqueSlug(orgName);
  const verifyToken = crypto.randomBytes(32).toString('hex');

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        isEmailVerified: false,
        emailVerifyToken: verifyToken
      }
    });

    const organization = await tx.organization.create({
      data: {
        name: orgName,
        slug,
        plan: 'FREE',
        settings: {
          create: {
            companyName: orgName,
            defaultTvaRate: 18,
            defaultCurrency: 'XOF',
            defaultLanguage: 'fr',
            documentStyle: 'classique',
            primaryColor: '#0EA5E9'
          }
        },
        members: {
          create: { userId: user.id, role: 'OWNER' }
        }
      },
      include: { settings: true }
    });

    return { user, organization };
  });

  // Si inviteToken valide → ajouter à l'organisation invitante
  if (data.inviteToken) {
    try {
      const jwt = require('jsonwebtoken');
      const payload = jwt.verify(data.inviteToken, process.env.JWT_SECRET);
      if (payload.email === data.email && payload.orgId) {
        const alreadyMember = await prisma.organizationMember.findUnique({
          where: { organizationId_userId: { organizationId: payload.orgId, userId: result.user.id } }
        });
        if (!alreadyMember) {
          await prisma.organizationMember.create({
            data: { organizationId: payload.orgId, userId: result.user.id, role: payload.role || 'MEMBER' }
          });
        }
      }
    } catch (e) {
      console.warn('Invite token invalide ou expiré, ignoré:', e.message);
    }
  }

  // Envoyer l'email de vérification (non bloquant)
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/confirm/${verifyToken}`;
  try {
    await sendVerificationEmail({ to: result.user.email, name: result.user.name, verifyUrl });
  } catch (emailErr) {
    console.error('Erreur envoi email vérification:', emailErr.message);
  }

  res.status(201).json({
    success: true,
    message: 'Compte créé ! Vérifiez votre email pour activer votre compte.',
    data: { email: result.user.email }
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: {
      memberships: {
        include: {
          organization: { select: { id: true, name: true, slug: true, plan: true } }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!user) {
    return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
  }

  const isValidPassword = await bcrypt.compare(data.password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
  }

  // Bloquer si email non vérifié (sauf super admin)
  if (!user.isEmailVerified && !user.isSuperAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Veuillez vérifier votre adresse email avant de vous connecter.',
      code: 'EMAIL_NOT_VERIFIED',
      data: { email: user.email }
    });
  }

  // Connexion super admin (sans organisation)
  if (user.isSuperAdmin) {
    const { accessToken, refreshToken } = await generateTokens(user.id, null, 'SUPERADMIN');
    const { password: _, memberships, ...userPublic } = user;
    return res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: { ...userPublic, organizationId: null, orgRole: 'SUPERADMIN' },
        organization: null,
        organizations: [],
        accessToken,
        refreshToken
      }
    });
  }

  if (user.memberships.length === 0) {
    return res.status(403).json({ success: false, message: 'Aucune organisation associée à ce compte' });
  }

  const activeMembership = user.memberships[0];
  const { accessToken, refreshToken } = await generateTokens(
    user.id,
    activeMembership.organizationId,
    activeMembership.role
  );

  const { password: _, memberships, ...userPublic } = user;

  res.json({
    success: true,
    message: 'Connexion réussie',
    data: {
      user: {
        ...userPublic,
        organizationId: activeMembership.organizationId,
        orgRole: activeMembership.role
      },
      organization: activeMembership.organization,
      organizations: user.memberships.map(m => ({
        ...m.organization,
        role: m.role
      })),
      accessToken,
      refreshToken
    }
  });
};

// GET /api/auth/verify-email/:token
const verifyEmail = async (req, res) => {
  const { token } = req.params;

  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Lien de vérification invalide ou déjà utilisé.',
      code: 'ALREADY_VERIFIED'
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, emailVerifyToken: null }
  });

  res.json({ success: true, message: 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.' });
};

// POST /api/auth/resend-verification
const resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email requis' });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Réponse générique (sécurité : ne pas révéler si l'email existe)
  if (!user || user.isEmailVerified) {
    return res.json({ success: true, message: 'Si ce compte existe et n\'est pas encore vérifié, un email vous a été envoyé.' });
  }

  const verifyToken = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({ where: { id: user.id }, data: { emailVerifyToken: verifyToken } });

  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/confirm/${verifyToken}`;
  try {
    await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });
  } catch (emailErr) {
    console.error('Erreur renvoi email vérification:', emailErr.message);
  }

  res.json({ success: true, message: 'Email de vérification renvoyé. Vérifiez votre boîte de réception.' });
};

// POST /api/auth/refresh
const refresh = async (req, res) => {
  const { refreshToken, organizationId } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Token de rafraîchissement requis' });
  }

  const stored = await verifyRefreshToken(refreshToken);
  await revokeRefreshToken(refreshToken);

  const memberships = stored.user.memberships;
  let activeMembership = memberships[0];
  if (organizationId) {
    const found = memberships.find(m => m.organizationId === organizationId);
    if (found) activeMembership = found;
  }

  if (!activeMembership) {
    return res.status(403).json({ success: false, message: 'Aucune organisation disponible' });
  }

  const tokens = await generateTokens(stored.userId, activeMembership.organizationId, activeMembership.role);
  const { password: _, memberships: __, ...userPublic } = stored.user;

  res.json({
    success: true,
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        ...userPublic,
        organizationId: activeMembership.organizationId,
        orgRole: activeMembership.role
      },
      organization: activeMembership.organization
    }
  });
};

// POST /api/auth/logout
const logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await revokeRefreshToken(refreshToken);
  res.json({ success: true, message: 'Déconnexion réussie' });
};

// GET /api/auth/me
const me = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, name: true, email: true, isSuperAdmin: true, isEmailVerified: true, createdAt: true,
      memberships: {
        include: { organization: { select: { id: true, name: true, slug: true, plan: true } } },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  const activeMembership = user.memberships.find(m => m.organizationId === req.organizationId);
  const { memberships, ...userPublic } = user;

  res.json({
    success: true,
    data: {
      user: {
        ...userPublic,
        organizationId: req.organizationId,
        orgRole: req.user.orgRole
      },
      organization: activeMembership?.organization,
      organizations: memberships.map(m => ({ ...m.organization, role: m.role }))
    }
  });
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

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email requis' });

  const user = await prisma.user.findUnique({ where: { email } });

  // Réponse générique pour ne pas révéler si l'email existe
  if (user && user.isEmailVerified) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry }
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
    try {
      const { sendPasswordResetEmail } = require('../services/emailService');
      await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
    } catch (err) {
      console.error('Erreur envoi email reset:', err.message);
    }
  }

  res.json({
    success: true,
    message: 'Si un compte existe avec cet email, un lien de réinitialisation vous a été envoyé. Vérifiez aussi vos spams.'
  });
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const schema = z.object({
    token:    z.string().min(1, 'Token requis'),
    password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères')
  });

  const { token, password } = schema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken:  token,
      passwordResetExpiry: { gt: new Date() }
    }
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Lien de réinitialisation invalide ou expiré. Faites une nouvelle demande.' });
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, passwordResetToken: null, passwordResetExpiry: null }
  });

  // Révoquer tous les refresh tokens pour forcer reconnexion
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  res.json({ success: true, message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' });
};

module.exports = { register, login, verifyEmail, resendVerification, refresh, logout, me, changePassword, forgotPassword, resetPassword };
