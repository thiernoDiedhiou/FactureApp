const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { AppError } = require('../middlewares/errorHandler');
const { generateTokens } = require('../utils/jwt');
const {
  getSubscriptionStatus,
  getDaysRemaining,
  computeNewExpiry
} = require('../utils/subscriptionUtils');
const { sendSubscriptionInvoice } = require('../services/emailService');

const prisma = new PrismaClient();

// Helper : grouper des enregistrements par mois sur N derniers mois
const buildMonthlyChart = (records, dateField, months = 12) => {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const label = d.toLocaleString('fr-FR', { month: 'short' }) + ' ' + String(d.getFullYear()).slice(2);
    const count = records.filter(r => {
      const rd = new Date(r[dateField]);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    }).length;
    return { month: label, count };
  });
};

// GET /api/admin/stats — Stats globales de la plateforme
const getStats = async (req, res) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const [
    totalOrgs,
    totalUsers,
    totalDocuments,
    totalClients,
    suspendedCount,
    planCounts,
    planConfigs,
    recentOrgs,
    orgsForGrowthChart,
    activeOrgIds,
    docsForChart,
    totalRevenueAgg,
    verifiedUsers,
    newUsersThisMonth,
    expiringOrgs,
    expiredOrgs
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.document.count(),
    prisma.client.count(),
    prisma.organization.count({ where: { suspended: true } }),
    prisma.organization.groupBy({ by: ['plan'], _count: { id: true } }),
    prisma.planConfig.findMany({ select: { key: true, price: true } }),
    prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, name: true, plan: true, suspended: true, createdAt: true,
        planExpiresAt: true,
        _count: { select: { members: true, documents: true } }
      }
    }),
    prisma.organization.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true }
    }),
    prisma.document.groupBy({
      by: ['organizationId'],
      where: { createdAt: { gte: thirtyDaysAgo } }
    }),
    prisma.document.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true, type: true }
    }),
    prisma.document.aggregate({
      where: { status: 'paye', type: 'facture' },
      _sum: { totalTtc: true }
    }),
    prisma.user.count({ where: { isEmailVerified: true } }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }
    }),
    // Plans payants expirant dans les 7 prochains jours
    prisma.organization.count({
      where: {
        plan: { not: 'FREE' },
        planExpiresAt: { gt: now, lte: sevenDaysFromNow }
      }
    }),
    // Plans payants déjà expirés
    prisma.organization.count({
      where: {
        plan: { not: 'FREE' },
        planExpiresAt: { lte: now },
        planExpiresAt: { not: null }
      }
    })
  ]);

  const planPrices = {};
  planConfigs.forEach(p => { planPrices[p.key] = p.price; });

  const plans = { FREE: 0, STARTER: 0, PRO: 0, ENTERPRISE: 0 };
  let mrr = 0;
  planCounts.forEach(p => {
    plans[p.plan] = p._count.id;
    mrr += p._count.id * (planPrices[p.plan] || 0);
  });

  const planRevenue = Object.entries(plans).map(([plan, count]) => ({
    plan,
    count,
    revenue: count * (planPrices[plan] || 0),
    price: planPrices[plan] || 0
  }));

  const activeOrgsCount = activeOrgIds.length;
  const dormantOrgsIds = await prisma.document.groupBy({
    by: ['organizationId'],
    where: { createdAt: { gte: ninetyDaysAgo } }
  });
  const orgsWithRecentActivity = new Set(dormantOrgsIds.map(d => d.organizationId));
  const dormantOrgsCount = (await prisma.organization.count()) - orgsWithRecentActivity.size;

  const paidOrgs = (plans.STARTER || 0) + (plans.PRO || 0) + (plans.ENTERPRISE || 0);
  const conversionRate = totalOrgs > 0 ? Math.round((paidOrgs / totalOrgs) * 100) : 0;

  const growthChart = buildMonthlyChart(orgsForGrowthChart, 'createdAt');
  const docsChart   = buildMonthlyChart(docsForChart, 'createdAt');

  // Enrichir les orgs récentes avec le statut abonnement
  const recentOrgsEnriched = recentOrgs.map(org => ({
    ...org,
    subscriptionStatus: getSubscriptionStatus(org),
    daysRemaining: getDaysRemaining(org.planExpiresAt)
  }));

  res.json({
    success: true,
    data: {
      stats: {
        totalOrgs, totalUsers, totalDocuments, totalClients,
        suspendedCount, activeOrgsCount, dormantOrgsCount,
        mrr, conversionRate, paidOrgs,
        totalRevenuePlatform: Math.round(totalRevenueAgg._sum.totalTtc || 0),
        verifiedUsers, newUsersThisMonth,
        expiringCount: expiringOrgs,
        expiredCount: expiredOrgs,
        atRiskCount: expiringOrgs + expiredOrgs
      },
      plans,
      planRevenue,
      recentOrgs: recentOrgsEnriched,
      growthChart,
      docsChart
    }
  });
};

// GET /api/admin/organizations — Toutes les organisations
const getOrganizations = async (req, res) => {
  const { search, plan, suspended, subscriptionStatus } = req.query;

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (plan) where.plan = plan;
  if (suspended !== undefined) where.suspended = suspended === 'true';

  // Filtre par statut d'abonnement (calculé côté DB pour les cas simples)
  const now = new Date();
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  if (subscriptionStatus === 'expired') {
    where.plan = { not: 'FREE' };
    where.planExpiresAt = { lte: now, not: null };
  } else if (subscriptionStatus === 'expiring_soon') {
    where.plan = { not: 'FREE' };
    where.planExpiresAt = { gt: now, lte: sevenDaysFromNow };
  } else if (subscriptionStatus === 'active') {
    where.plan = { not: 'FREE' };
    where.planExpiresAt = { gt: sevenDaysFromNow };
  } else if (subscriptionStatus === 'at_risk') {
    where.plan = { not: 'FREE' };
    where.planExpiresAt = { lte: sevenDaysFromNow, not: null };
  }

  const organizations = await prisma.organization.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { members: true, clients: true, documents: true } },
      members: {
        where: { role: 'OWNER' },
        include: { user: { select: { name: true, email: true } } },
        take: 1
      }
    }
  });

  const orgsEnriched = organizations.map(org => ({
    ...org,
    subscriptionStatus: getSubscriptionStatus(org),
    daysRemaining: getDaysRemaining(org.planExpiresAt)
  }));

  res.json({ success: true, data: { organizations: orgsEnriched } });
};

// PATCH /api/admin/organizations/:id/plan — Changer le plan d'une org (manuel, sans dates)
const updateOrgPlan = async (req, res) => {
  const schema = z.object({ plan: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']) });
  const { plan } = schema.parse(req.body);
  const { id } = req.params;

  // Changement manuel : si FREE, on efface les dates ; sinon on ne les touche pas
  const data = plan === 'FREE'
    ? { plan, planStartedAt: null, planExpiresAt: null }
    : { plan };

  const org = await prisma.organization.update({
    where: { id },
    data,
    select: { id: true, name: true, plan: true }
  });

  res.json({ success: true, message: `Plan de "${org.name}" changé en ${plan}`, data: { organization: org } });
};

// PATCH /api/admin/organizations/:id/suspend
const toggleSuspend = async (req, res) => {
  const { id } = req.params;

  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw new AppError('Organisation non trouvée', 404);

  const updated = await prisma.organization.update({
    where: { id },
    data: { suspended: !org.suspended },
    select: { id: true, name: true, suspended: true }
  });

  const action = updated.suspended ? 'suspendue' : 'réactivée';
  res.json({ success: true, message: `Organisation "${updated.name}" ${action}`, data: { organization: updated } });
};

// DELETE /api/admin/organizations/:id
const deleteOrganization = async (req, res) => {
  const { id } = req.params;

  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw new AppError('Organisation non trouvée', 404);

  await prisma.organization.delete({ where: { id } });
  res.json({ success: true, message: `Organisation "${org.name}" supprimée définitivement` });
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  const { search } = req.query;

  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ]
  } : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, isSuperAdmin: true, createdAt: true,
      memberships: {
        include: { organization: { select: { id: true, name: true, plan: true } } }
      }
    }
  });

  res.json({ success: true, data: { users } });
};

// PATCH /api/admin/users/:id/superadmin
const toggleSuperAdmin = async (req, res) => {
  const { id } = req.params;

  if (id === req.user.id) {
    throw new AppError('Vous ne pouvez pas modifier vos propres droits super admin', 400);
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('Utilisateur non trouvé', 404);

  const updated = await prisma.user.update({
    where: { id },
    data: { isSuperAdmin: !user.isSuperAdmin },
    select: { id: true, name: true, email: true, isSuperAdmin: true }
  });

  const action = updated.isSuperAdmin ? 'promu Super Admin' : 'Super Admin révoqué';
  res.json({ success: true, message: `${updated.name} : ${action}`, data: { user: updated } });
};

// GET /api/admin/plans
const PLAN_ORDER = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

const getAdminPlans = async (req, res) => {
  const plans = await prisma.planConfig.findMany();
  plans.sort((a, b) => PLAN_ORDER.indexOf(a.key) - PLAN_ORDER.indexOf(b.key));
  res.json({ success: true, data: { plans } });
};

// PATCH /api/admin/plans/:key
const updatePlanConfig = async (req, res) => {
  const schema = z.object({
    price:        z.number().int().min(0).optional(),
    maxMembers:   z.number().int().min(-1).optional(),
    maxDocuments: z.number().int().min(-1).optional(),
    maxClients:   z.number().int().min(-1).optional(),
    description:  z.string().min(1).optional(),
    features:     z.array(z.string()).optional(),
    isActive:     z.boolean().optional()
  });

  const data = schema.parse(req.body);
  const { key } = req.params;

  const plan = await prisma.planConfig.update({ where: { key }, data });
  res.json({ success: true, message: `Plan ${key} mis à jour`, data: { plan } });
};

// GET /api/admin/upgrades
const getUpgradeRequests = async (req, res) => {
  const { status } = req.query;
  const requests = await prisma.upgradeRequest.findMany({
    where: status ? { status } : {},
    include: { organization: { select: { id: true, name: true, plan: true, planExpiresAt: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ success: true, data: { requests } });
};

// PATCH /api/admin/upgrades/:id — Valider ou rejeter une demande
const processUpgradeRequest = async (req, res) => {
  const schema = z.object({
    action: z.enum(['validate', 'reject']),
    notes:  z.string().optional()
  });

  const { action, notes } = schema.parse(req.body);
  const { id } = req.params;

  const upgradeReq = await prisma.upgradeRequest.findUnique({
    where: { id },
    include: { organization: true }
  });
  if (!upgradeReq) throw new AppError('Demande non trouvée', 404);
  if (upgradeReq.status !== 'pending') throw new AppError('Demande déjà traitée', 400);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.upgradeRequest.update({
      where: { id },
      data: {
        status:      action === 'validate' ? 'validated' : 'rejected',
        notes:       notes || null,
        processedAt: new Date(),
        processedBy: req.user.id
      },
      include: { organization: { select: { id: true, name: true, plan: true, planExpiresAt: true } } }
    });

    if (action === 'validate') {
      const org = upgradeReq.organization;
      const newExpiresAt  = computeNewExpiry(org, upgradeReq.targetPlan, upgradeReq.durationMonths);
      const newStartedAt  = new Date(); // début de cette période de facturation

      // Mise à jour de l'organisation avec les dates de la nouvelle période
      await tx.organization.update({
        where: { id: upgradeReq.organizationId },
        data: {
          plan:         upgradeReq.targetPlan,
          planStartedAt: newStartedAt,
          planExpiresAt: newExpiresAt
        }
      });

      // Enregistrement dans l'historique des abonnements (audit trail)
      await tx.subscription.create({
        data: {
          organizationId:   upgradeReq.organizationId,
          plan:             upgradeReq.targetPlan,
          startDate:        newStartedAt,
          endDate:          newExpiresAt,
          durationMonths:   upgradeReq.durationMonths,
          amount:           upgradeReq.amount,
          upgradeRequestId: upgradeReq.id
        }
      });
    }

    return result;
  });

  const isRenewal = upgradeReq.targetPlan === upgradeReq.organization.plan;
  const message = action === 'validate'
    ? isRenewal
      ? `Abonnement ${upgradeReq.targetPlan} renouvelé pour ${updated.organization.name}`
      : `Plan mis à jour vers ${upgradeReq.targetPlan} pour ${updated.organization.name}`
    : 'Demande rejetée';

  // Facture par email lors de la validation manuelle admin — fire-and-forget
  if (action === 'validate') {
    const org = upgradeReq.organization;
    const newStartedAt = new Date();
    const newExpiresAt = computeNewExpiry(org, upgradeReq.targetPlan, upgradeReq.durationMonths);

    (async () => {
      try {
        const [owner, platformConfig] = await Promise.all([
          prisma.organizationMember.findFirst({
            where:   { organizationId: org.id, role: 'OWNER' },
            include: { user: true }
          }),
          prisma.platformConfig.findFirst()
        ]);

        if (!owner?.user?.email) return;

        const invoiceRef = `ABN-${new Date().getFullYear()}-${upgradeReq.id.slice(0, 8).toUpperCase()}`;

        await sendSubscriptionInvoice({
          userEmail:      owner.user.email,
          userName:       owner.user.name,
          orgName:        org.name,
          plan:           upgradeReq.targetPlan,
          amount:         upgradeReq.amount,
          durationMonths: upgradeReq.durationMonths,
          transactionRef: upgradeReq.transactionRef,
          paymentMethod:  upgradeReq.paymentMethod || 'manual',
          startDate:      newStartedAt,
          endDate:        newExpiresAt,
          invoiceRef,
          platformName:   platformConfig?.paymentName  || 'CFActure',
          supportEmail:   platformConfig?.supportEmail || 'contact@factureapp.sn'
        });

        console.log(`[Invoice] Facture admin envoyée à ${owner.user.email} — ${invoiceRef}`);
      } catch (err) {
        console.error('[Invoice] Erreur envoi facture admin:', err.message);
      }
    })();
  }

  res.json({ success: true, message, data: { request: updated } });
};

// GET /api/admin/organizations/:id/detail — Vue complète d'une organisation
const getOrganizationDetail = async (req, res) => {
  const { id } = req.params;

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      settings: true,
      members: {
        include: { user: { select: { id: true, name: true, email: true, isEmailVerified: true, createdAt: true } } },
        orderBy: { createdAt: 'asc' }
      },
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      upgradeRequests: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: { select: { clients: true, products: true, documents: true } }
    }
  });

  if (!org) throw new AppError('Organisation non trouvée', 404);

  // Derniers documents
  const recentDocs = await prisma.document.findMany({
    where: { organizationId: id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true, number: true, type: true, status: true,
      totalTtc: true, issuedDate: true, createdAt: true,
      client: { select: { name: true } }
    }
  });

  // Chiffre d'affaires (factures payées)
  const revenueAgg = await prisma.document.aggregate({
    where: { organizationId: id, type: 'facture', status: 'paye' },
    _sum: { totalTtc: true }
  });

  const orgEnriched = {
    ...org,
    subscriptionStatus: getSubscriptionStatus(org),
    daysRemaining:      getDaysRemaining(org.planExpiresAt),
    totalRevenue:       Math.round(revenueAgg._sum.totalTtc || 0),
    recentDocuments:    recentDocs
  };

  res.json({ success: true, data: { organization: orgEnriched } });
};

// GET /api/admin/users/:id/detail — Vue complète d'un utilisateur
const getUserDetail = async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true,
      isSuperAdmin: true, isEmailVerified: true,
      createdAt: true, updatedAt: true,
      memberships: {
        include: {
          organization: {
            select: {
              id: true, name: true, slug: true, plan: true,
              planExpiresAt: true, suspended: true, createdAt: true,
              _count: { select: { clients: true, documents: true } }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!user) throw new AppError('Utilisateur non trouvé', 404);

  // Documents créés par cet utilisateur
  const docsCreated = await prisma.document.findMany({
    where: { createdBy: id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true, number: true, type: true, status: true,
      totalTtc: true, issuedDate: true, createdAt: true,
      organization: { select: { name: true } },
      client: { select: { name: true } }
    }
  });

  const docsCount = await prisma.document.count({ where: { createdBy: id } });

  const userEnriched = {
    ...user,
    memberships: user.memberships.map(m => ({
      ...m,
      subscriptionStatus: getSubscriptionStatus(m.organization)
    })),
    recentDocuments: docsCreated,
    totalDocuments:  docsCount
  };

  res.json({ success: true, data: { user: userEnriched } });
};

// PATCH /api/admin/organizations/:id/subscription — Définir/corriger les dates d'un abonnement hérité
const setSubscriptionDates = async (req, res) => {
  const schema = z.object({
    startDate:     z.string().datetime(),
    endDate:       z.string().datetime(),
    durationMonths: z.number().int().min(1).max(24),
    amount:        z.number().int().min(0)
  });

  const { startDate, endDate, durationMonths, amount } = schema.parse(req.body);
  const { id } = req.params;

  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw new AppError('Organisation non trouvée', 404);
  if (org.plan === 'FREE') throw new AppError('Impossible de définir des dates sur un plan FREE', 400);

  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (end <= start) throw new AppError('La date de fin doit être après la date de début', 400);

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id },
      data: { planStartedAt: start, planExpiresAt: end }
    });

    await tx.subscription.create({
      data: {
        organizationId: id,
        plan:           org.plan,
        startDate:      start,
        endDate:        end,
        durationMonths,
        amount,
        upgradeRequestId: null
      }
    });
  });

  const updated = await prisma.organization.findUnique({
    where: { id },
    select: { id: true, name: true, plan: true, planStartedAt: true, planExpiresAt: true }
  });

  res.json({
    success: true,
    message: `Abonnement de "${org.name}" défini jusqu'au ${end.toLocaleDateString('fr-FR')}`,
    data: { organization: updated }
  });
};

// GET /api/admin/subscriptions — Vue dédiée à la gestion des abonnements
const getSubscriptions = async (req, res) => {
  const { status } = req.query;
  const now = new Date();
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // On ne retourne que les orgs sur plan payant
  const baseWhere = { plan: { not: 'FREE' } };

  let where = { ...baseWhere };
  if (status === 'expired') {
    where.planExpiresAt = { lte: now, not: null };
  } else if (status === 'expiring_soon') {
    where.planExpiresAt = { gt: now, lte: sevenDaysFromNow };
  } else if (status === 'active') {
    where.planExpiresAt = { gt: sevenDaysFromNow };
  } else if (status === 'at_risk') {
    where.planExpiresAt = { lte: sevenDaysFromNow, not: null };
  } else if (status === 'legacy') {
    where.planExpiresAt = null;
  }

  const [organizations, totals] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: { planExpiresAt: 'asc' },
      include: {
        members: {
          where: { role: 'OWNER' },
          include: { user: { select: { name: true, email: true } } },
          take: 1
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true, plan: true, startDate: true, endDate: true,
            durationMonths: true, amount: true, createdAt: true
          }
        }
      }
    }),
    // Compteurs pour les KPIs
    Promise.all([
      prisma.organization.count({ where: { plan: { not: 'FREE' }, planExpiresAt: { gt: sevenDaysFromNow } } }),
      prisma.organization.count({ where: { plan: { not: 'FREE' }, planExpiresAt: { gt: now, lte: sevenDaysFromNow } } }),
      prisma.organization.count({ where: { plan: { not: 'FREE' }, planExpiresAt: { lte: now, not: null } } }),
      prisma.organization.count({ where: { plan: { not: 'FREE' }, planExpiresAt: null } })
    ])
  ]);

  const [activeCount, expiringSoonCount, expiredCount, legacyCount] = totals;

  const orgsEnriched = organizations.map(org => ({
    ...org,
    subscriptionStatus: getSubscriptionStatus(org),
    daysRemaining: getDaysRemaining(org.planExpiresAt)
  }));

  res.json({
    success: true,
    data: {
      organizations: orgsEnriched,
      counts: { activeCount, expiringSoonCount, expiredCount, legacyCount }
    }
  });
};

// GET /api/admin/config
const getPlatformConfig = async (req, res) => {
  let config = await prisma.platformConfig.findFirst();
  if (!config) config = await prisma.platformConfig.create({ data: {} });
  res.json({ success: true, data: { config } });
};

// PATCH /api/admin/config
const updatePlatformConfig = async (req, res) => {
  const schema = z.object({
    paymentPhone: z.string().min(1).optional(),
    paymentName:  z.string().min(1).optional(),
    supportEmail: z.string().email().optional()
  });

  const data = schema.parse(req.body);
  let config = await prisma.platformConfig.findFirst();
  if (!config) config = await prisma.platformConfig.create({ data: {} });

  const updated = await prisma.platformConfig.update({ where: { id: config.id }, data });
  res.json({ success: true, message: 'Configuration mise à jour', data: { config: updated } });
};

// POST /api/admin/impersonate-org
const impersonateOrg = async (req, res) => {
  const { organizationId } = req.body;
  if (!organizationId) throw new AppError('organizationId requis', 400);

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, slug: true, plan: true, suspended: true }
  });
  if (!org) throw new AppError('Organisation introuvable', 404);

  const { accessToken, refreshToken } = await generateTokens(req.user.id, org.id, 'OWNER');

  const userPublic = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, isSuperAdmin: true, isEmailVerified: true, createdAt: true }
  });

  res.json({
    success: true,
    message: `Connecté à l'organisation "${org.name}"`,
    data: {
      accessToken,
      refreshToken,
      organization: org,
      user: { ...userPublic, organizationId: org.id, orgRole: 'OWNER' }
    }
  });
};

module.exports = {
  getStats, getOrganizations, updateOrgPlan, toggleSuspend, deleteOrganization,
  getOrganizationDetail,
  getUsers, toggleSuperAdmin, getUserDetail,
  getAdminPlans, updatePlanConfig,
  getUpgradeRequests, processUpgradeRequest,
  getSubscriptions, setSubscriptionDates,
  getPlatformConfig, updatePlatformConfig,
  impersonateOrg
};
