const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middlewares/errorHandler');

const prisma = new PrismaClient();

// Jours de grâce après expiration avant d'appliquer les limites FREE
const GRACE_PERIOD_DAYS = 3;

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
 * Retourne le plan effectif en tenant compte de la période de grâce.
 * Si l'abonnement a expiré depuis plus de GRACE_PERIOD_DAYS jours → FREE.
 */
function getEffectivePlan(org) {
  if (org.plan === 'FREE' || !org.planExpiresAt) return org.plan;

  const graceCutoff = new Date(org.planExpiresAt);
  graceCutoff.setDate(graceCutoff.getDate() + GRACE_PERIOD_DAYS);

  return new Date() > graceCutoff ? 'FREE' : org.plan;
}

/**
 * Vérifie si l'organisation peut créer une nouvelle ressource selon son plan.
 * Après la période de grâce (3j post-expiration), les limites FREE s'appliquent.
 * Lève une AppError 403 si la limite est atteinte.
 *
 * Note TOCTOU : le count et la création ne sont pas atomiques. Le risque de race
 * condition est faible à cette échelle (PME, équipes < 10 personnes). Pour une
 * protection complète, encapsuler checkPlanLimit + create dans prisma.$transaction
 * avec isolation SERIALIZABLE au niveau du contrôleur.
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
      select: { plan: true, planExpiresAt: true, name: true }
    }),
    config.countFn(organizationId)
  ]);

  if (!org) throw new AppError('Organisation introuvable', 404);

  const effectivePlan = getEffectivePlan(org);
  const isDowngraded = effectivePlan !== org.plan;

  const planConfig = await prisma.planConfig.findUnique({
    where: { key: effectivePlan },
    select: { [config.limitField]: true }
  });

  const limit = planConfig?.[config.limitField] ?? -1;

  // -1 = illimité
  if (limit === -1) return;

  if (currentCount >= limit) {
    const planLabel = org.plan.charAt(0) + org.plan.slice(1).toLowerCase();
    const message = isDowngraded
      ? `Votre abonnement ${planLabel} a expiré. Renouvelez pour continuer à créer des ${config.label}.`
      : `Limite du plan ${planLabel} atteinte (${limit} ${config.label} max). Passez au plan supérieur pour continuer.`;
    throw new AppError(message, 403, 'PLAN_LIMIT_REACHED');
  }
};

module.exports = { checkPlanLimit, getEffectivePlan, GRACE_PERIOD_DAYS };
