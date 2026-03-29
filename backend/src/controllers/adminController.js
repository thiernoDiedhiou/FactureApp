const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { AppError } = require('../middlewares/errorHandler');
const { generateTokens } = require('../utils/jwt');

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
    newUsersThisMonth
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
        _count: { select: { members: true, documents: true } }
      }
    }),
    // Orgs créées dans les 12 derniers mois (pour le graphique croissance)
    prisma.organization.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true }
    }),
    // IDs des orgs ayant eu une activité (document) dans les 30 derniers jours
    prisma.document.groupBy({
      by: ['organizationId'],
      where: { createdAt: { gte: thirtyDaysAgo } }
    }),
    // Documents créés dans les 12 derniers mois (graphique volume)
    prisma.document.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true, type: true }
    }),
    // Somme totale facturée (factures payées)
    prisma.document.aggregate({
      where: { status: 'paye', type: 'facture' },
      _sum: { totalTtc: true }
    }),
    // Utilisateurs avec email vérifié
    prisma.user.count({ where: { isEmailVerified: true } }),
    // Nouveaux utilisateurs ce mois
    prisma.user.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }
    })
  ]);

  // MRR : Σ(orgs par plan × prix plan)
  const planPrices = {};
  planConfigs.forEach(p => { planPrices[p.key] = p.price; });

  const plans = { FREE: 0, STARTER: 0, PRO: 0, ENTERPRISE: 0 };
  let mrr = 0;
  planCounts.forEach(p => {
    plans[p.plan] = p._count.id;
    mrr += p._count.id * (planPrices[p.plan] || 0);
  });

  // Répartition revenus par plan
  const planRevenue = Object.entries(plans).map(([plan, count]) => ({
    plan,
    count,
    revenue: count * (planPrices[plan] || 0),
    price: planPrices[plan] || 0
  }));

  // Orgs actives (30j) vs dormantes (>90j sans activité)
  const activeOrgsCount = activeOrgIds.length;
  const dormantOrgsIds = await prisma.document.groupBy({
    by: ['organizationId'],
    where: { createdAt: { gte: ninetyDaysAgo } }
  });
  const orgsWithRecentActivity = new Set(dormantOrgsIds.map(d => d.organizationId));
  const dormantOrgsCount = (await prisma.organization.count()) - orgsWithRecentActivity.size;

  // Taux de conversion FREE → payant
  const paidOrgs = (plans.STARTER || 0) + (plans.PRO || 0) + (plans.ENTERPRISE || 0);
  const conversionRate = totalOrgs > 0 ? Math.round((paidOrgs / totalOrgs) * 100) : 0;

  // Graphiques
  const growthChart = buildMonthlyChart(orgsForGrowthChart, 'createdAt');
  const docsChart = buildMonthlyChart(docsForChart, 'createdAt');

  res.json({
    success: true,
    data: {
      stats: {
        totalOrgs, totalUsers, totalDocuments, totalClients,
        suspendedCount, activeOrgsCount, dormantOrgsCount,
        mrr, conversionRate, paidOrgs,
        totalRevenuePlatform: Math.round(totalRevenueAgg._sum.totalTtc || 0),
        verifiedUsers, newUsersThisMonth
      },
      plans,
      planRevenue,
      recentOrgs,
      growthChart,
      docsChart
    }
  });
};

// GET /api/admin/organizations — Toutes les organisations
const getOrganizations = async (req, res) => {
  const { search, plan, suspended } = req.query;

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (plan) where.plan = plan;
  if (suspended !== undefined) where.suspended = suspended === 'true';

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

  res.json({ success: true, data: { organizations } });
};

// PATCH /api/admin/organizations/:id/plan — Changer le plan d'une org
const updateOrgPlan = async (req, res) => {
  const schema = z.object({ plan: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']) });
  const { plan } = schema.parse(req.body);
  const { id } = req.params;

  const org = await prisma.organization.update({
    where: { id },
    data: { plan },
    select: { id: true, name: true, plan: true }
  });

  res.json({ success: true, message: `Plan de "${org.name}" changé en ${plan}`, data: { organization: org } });
};

// PATCH /api/admin/organizations/:id/suspend — Suspendre / réactiver une org
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

// DELETE /api/admin/organizations/:id — Supprimer une org et toutes ses données
const deleteOrganization = async (req, res) => {
  const { id } = req.params;

  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw new AppError('Organisation non trouvée', 404);

  await prisma.organization.delete({ where: { id } });

  res.json({ success: true, message: `Organisation "${org.name}" supprimée définitivement` });
};

// GET /api/admin/users — Tous les utilisateurs
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

// PATCH /api/admin/users/:id/superadmin — Promouvoir / révoquer super admin
const toggleSuperAdmin = async (req, res) => {
  const { id } = req.params;

  // Empêcher de se révoquer soi-même
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

// GET /api/admin/plans — Tous les plans avec leur config
const PLAN_ORDER = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

const getAdminPlans = async (req, res) => {
  const plans = await prisma.planConfig.findMany();
  plans.sort((a, b) => PLAN_ORDER.indexOf(a.key) - PLAN_ORDER.indexOf(b.key));
  res.json({ success: true, data: { plans } });
};

// PATCH /api/admin/plans/:key — Modifier la config d'un plan
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

  const plan = await prisma.planConfig.update({
    where: { key },
    data
  });

  res.json({ success: true, message: `Plan ${key} mis à jour`, data: { plan } });
};

// GET /api/admin/upgrades — Demandes de mise à niveau
const getUpgradeRequests = async (req, res) => {
  const { status } = req.query;
  const requests = await prisma.upgradeRequest.findMany({
    where: status ? { status } : {},
    include: { organization: { select: { id: true, name: true, plan: true } } },
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
    where: { id }
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
      include: { organization: { select: { id: true, name: true, plan: true } } }
    });

    if (action === 'validate') {
      await tx.organization.update({
        where: { id: upgradeReq.organizationId },
        data:  { plan: upgradeReq.targetPlan }
      });
    }

    return result;
  });

  const message = action === 'validate'
    ? `Plan mis à jour vers ${upgradeReq.targetPlan} pour ${updated.organization.name}`
    : 'Demande rejetée';

  res.json({ success: true, message, data: { request: updated } });
};

// GET /api/admin/config — Config de la plateforme
const getPlatformConfig = async (req, res) => {
  let config = await prisma.platformConfig.findFirst();
  if (!config) config = await prisma.platformConfig.create({ data: {} });
  res.json({ success: true, data: { config } });
};

// PATCH /api/admin/config — Mettre à jour la config
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

// POST /api/admin/impersonate-org — Super admin entre dans une org sans en être membre
const impersonateOrg = async (req, res) => {
  const { organizationId } = req.body;
  if (!organizationId) throw new AppError('organizationId requis', 400);

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, slug: true, plan: true, suspended: true }
  });
  if (!org) throw new AppError('Organisation introuvable', 404);

  // Génère un token avec le super admin dans cette org en tant qu'OWNER virtuel
  const { accessToken, refreshToken } = await generateTokens(req.user.id, org.id, 'OWNER');

  const { password: _, ...userPublic } = await prisma.user.findUnique({
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
  getUsers, toggleSuperAdmin, getAdminPlans, updatePlanConfig,
  getUpgradeRequests, processUpgradeRequest, getPlatformConfig, updatePlatformConfig,
  impersonateOrg
};
