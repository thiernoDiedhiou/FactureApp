const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middlewares/errorHandler');

const prisma = new PrismaClient();

// Mapping resource → champ PlanConfig + modèle Prisma
const RESOURCE_CONFIG = {
  document: {
    limitField: 'maxDocuments',
    countFn: (orgId) => prisma.document.count({ where: { organizationId: orgId } }),
    label: 'documents'
  },
  client: {
    limitField: 'maxClients',
    countFn: (orgId) => prisma.client.count({ where: { organizationId: orgId } }),
    label: 'clients'
  },
  member: {
    limitField: 'maxMembers',
    countFn: (orgId) => prisma.organizationMember.count({ where: { organizationId: orgId } }),
    label: 'membres'
  }
};

/**
 * Vérifie si l'organisation peut créer une nouvelle ressource selon son plan.
 * Lève une AppError 403 si la limite est atteinte.
 *
 * @param {string} organizationId
 * @param {'document'|'client'|'member'} resource
 */
const checkPlanLimit = async (organizationId, resource) => {
  const config = RESOURCE_CONFIG[resource];
  if (!config) throw new Error(`Ressource inconnue : ${resource}`);

  const [org, currentCount] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true, name: true }
    }),
    config.countFn(organizationId)
  ]);

  if (!org) throw new AppError('Organisation introuvable', 404);

  const planConfig = await prisma.planConfig.findUnique({
    where: { key: org.plan },
    select: { [config.limitField]: true, price: true }
  });

  const limit = planConfig?.[config.limitField] ?? -1;

  // -1 = illimité
  if (limit === -1) return;

  if (currentCount >= limit) {
    const planLabel = org.plan.charAt(0) + org.plan.slice(1).toLowerCase();
    throw new AppError(
      `Limite du plan ${planLabel} atteinte (${limit} ${config.label} max). Passez au plan supérieur pour continuer.`,
      403,
      'PLAN_LIMIT_REACHED'
    );
  }
};

module.exports = { checkPlanLimit };
