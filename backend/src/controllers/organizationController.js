const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { AppError } = require('../middlewares/errorHandler');
const { sendInvitationEmail } = require('../services/emailService');
const { checkPlanLimit } = require('../utils/planLimits');

const prisma = new PrismaClient();

// GET /api/organizations/me — Infos de l'org courante
const getMyOrganization = async (req, res) => {
  if (!req.organizationId) {
    throw new AppError('Aucune organisation associée à ce compte', 400);
  }
  const org = await prisma.organization.findUnique({
    where: { id: req.organizationId },
    include: {
      settings: true,
      members: {
        include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
        orderBy: { createdAt: 'asc' }
      },
      _count: { select: { clients: true, products: true, documents: true } }
    }
  });

  if (!org) throw new AppError('Organisation non trouvée', 404);
  res.json({ success: true, data: { organization: org } });
};

// PATCH /api/organizations/me — Modifier le nom de l'organisation
const updateOrganization = async (req, res) => {
  const schema = z.object({
    name: z.string().min(2, 'Le nom doit faire au moins 2 caractères')
  });
  const { name } = schema.parse(req.body);

  const org = await prisma.organization.update({
    where: { id: req.organizationId },
    data: { name },
    select: { id: true, name: true, slug: true, plan: true }
  });

  res.json({ success: true, message: 'Organisation mise à jour', data: { organization: org } });
};

// GET /api/organizations/members — Liste des membres
const getMembers = async (req, res) => {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: req.organizationId },
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
    orderBy: { createdAt: 'asc' }
  });

  res.json({ success: true, data: { members } });
};

// PATCH /api/organizations/members/:userId/role — Changer le rôle d'un membre
const updateMemberRole = async (req, res) => {
  const schema = z.object({
    role: z.enum(['ADMIN', 'MEMBER'])
  });

  const { role } = schema.parse(req.body);
  const { userId } = req.params;

  // Empêcher de changer son propre rôle
  if (userId === req.user.id) {
    throw new AppError('Vous ne pouvez pas modifier votre propre rôle', 400);
  }

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: req.organizationId, userId } }
  });
  if (!member) throw new AppError('Membre non trouvé', 404);

  // Ne pas toucher au rôle OWNER
  if (member.role === 'OWNER') {
    throw new AppError('Impossible de modifier le rôle du propriétaire', 400);
  }

  const updated = await prisma.organizationMember.update({
    where: { organizationId_userId: { organizationId: req.organizationId, userId } },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true } } }
  });

  res.json({ success: true, message: 'Rôle mis à jour', data: { member: updated } });
};

// DELETE /api/organizations/members/:userId — Retirer un membre
const removeMember = async (req, res) => {
  const { userId } = req.params;

  if (userId === req.user.id) {
    throw new AppError('Vous ne pouvez pas vous retirer vous-même', 400);
  }

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: req.organizationId, userId } }
  });
  if (!member) throw new AppError('Membre non trouvé', 404);

  if (member.role === 'OWNER') {
    throw new AppError('Impossible de retirer le propriétaire', 400);
  }

  await prisma.organizationMember.delete({
    where: { organizationId_userId: { organizationId: req.organizationId, userId } }
  });

  res.json({ success: true, message: 'Membre retiré de l\'organisation' });
};

// POST /api/organizations/invite — Inviter un utilisateur existant par email
const inviteMember = async (req, res) => {
  const schema = z.object({
    email: z.string().email('Email invalide'),
    role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER')
  });

  const { email, role } = schema.parse(req.body);

  await checkPlanLimit(req.organizationId, 'member');

  const org = await prisma.organization.findUnique({ where: { id: req.organizationId } });

  // Trouver l'utilisateur par email
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Utilisateur inexistant → envoyer un lien d'invitation pour créer un compte
    const jwt = require('jsonwebtoken');
    const inviteToken = jwt.sign(
      { email, orgId: req.organizationId, orgName: org.name, role, inviterName: req.user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${inviteToken}`;

    try {
      await sendInvitationEmail({
        to: email,
        inviteeName: null,
        organizationName: org.name,
        role,
        inviterName: req.user.name,
        inviteUrl
      });
    } catch (emailErr) {
      console.warn('Email invitation non envoyé:', emailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Invitation envoyée à ${email}. La personne recevra un lien pour créer son compte et rejoindre votre organisation.`
    });
  }

  // Vérifier si déjà membre
  const existing = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: req.organizationId, userId: user.id } }
  });
  if (existing) {
    throw new AppError('Cet utilisateur est déjà membre de l\'organisation', 409);
  }

  const member = await prisma.organizationMember.create({
    data: { organizationId: req.organizationId, userId: user.id, role },
    include: { user: { select: { id: true, name: true, email: true } } }
  });

  // Envoi email de notification (non-bloquant)
  try {
    await sendInvitationEmail({
      to: user.email,
      inviteeName: user.name,
      organizationName: org.name,
      role,
      inviterName: req.user.name
    });
  } catch (emailErr) {
    console.warn('Email invitation non envoyé:', emailErr.message);
  }

  res.status(201).json({
    success: true,
    message: `${user.name} a été ajouté à l'organisation`,
    data: { member }
  });
};

// POST /api/organizations/accept-invite — Rejoindre une org via token (utilisateur déjà connecté)
const acceptInvite = async (req, res) => {
  const { token } = req.body;
  if (!token) throw new AppError('Token requis', 400);

  const jwt = require('jsonwebtoken');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Lien d\'invitation invalide ou expiré', 400);
  }

  if (payload.email !== req.user.email) {
    throw new AppError('Ce lien d\'invitation n\'est pas destiné à votre adresse email', 403);
  }

  const org = await prisma.organization.findUnique({ where: { id: payload.orgId } });
  if (!org) throw new AppError('Organisation introuvable', 404);

  const existing = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: payload.orgId, userId: req.user.id } }
  });
  if (existing) {
    return res.json({ success: true, message: 'Vous êtes déjà membre de cette organisation', data: { organization: org } });
  }

  await prisma.organizationMember.create({
    data: { organizationId: payload.orgId, userId: req.user.id, role: payload.role || 'MEMBER' }
  });

  res.json({ success: true, message: `Vous avez rejoint "${org.name}" !`, data: { organization: org } });
};

// POST /api/auth/switch-org — Changer d'organisation active (retourne un nouveau JWT)
const switchOrganization = async (req, res) => {
  const schema = z.object({ organizationId: z.string().min(1) });
  const { organizationId } = schema.parse(req.body);

  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: req.user.id } },
    include: { organization: { select: { id: true, name: true, slug: true, plan: true } } }
  });

  if (!membership) {
    throw new AppError('Vous n\'êtes pas membre de cette organisation', 403);
  }

  const { generateTokens } = require('../utils/jwt');
  const { accessToken, refreshToken } = await generateTokens(req.user.id, organizationId, membership.role);

  res.json({
    success: true,
    message: `Organisation changée : ${membership.organization.name}`,
    data: {
      organization: membership.organization,
      orgRole: membership.role,
      accessToken,
      refreshToken
    }
  });
};

module.exports = { getMyOrganization, updateOrganization, getMembers, updateMemberRole, removeMember, inviteMember, acceptInvite, switchOrganization };
