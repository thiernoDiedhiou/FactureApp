const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Middleware d'authentification + injection tenant
 * Extrait userId, organizationId et orgRole du JWT
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token d\'authentification manquant'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { userId, organizationId, orgRole }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, isSuperAdmin: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Vérifier que l'utilisateur est bien membre de l'organisation du token
    if (decoded.organizationId) {
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: decoded.organizationId,
            userId: user.id
          }
        },
        include: { organization: { select: { suspended: true } } }
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé à cette organisation'
        });
      }

      // Bloquer les organisations suspendues (sauf super admin)
      if (membership.organization?.suspended && !user.isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Cette organisation a été suspendue. Contactez le support.',
          code: 'ORG_SUSPENDED'
        });
      }
    }

    req.user = {
      ...user,
      organizationId: decoded.organizationId,
      orgRole: decoded.orgRole
    };
    req.organizationId = decoded.organizationId;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({ success: false, message: 'Token invalide' });
  }
};

/**
 * Vérifie que l'utilisateur est OWNER ou ADMIN dans son organisation
 */
const requireAdmin = (req, res, next) => {
  if (!['OWNER', 'ADMIN'].includes(req.user?.orgRole)) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé - droits administrateur requis'
    });
  }
  next();
};

/**
 * Vérifie que l'utilisateur est OWNER
 */
const requireOwner = (req, res, next) => {
  if (req.user?.orgRole !== 'OWNER') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé - réservé au propriétaire de l\'organisation'
    });
  }
  next();
};

/**
 * Vérifie que l'utilisateur est Super Admin de la plateforme
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé - réservé aux super administrateurs'
    });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireOwner, requireSuperAdmin };
