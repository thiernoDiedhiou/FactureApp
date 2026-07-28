const EXPIRY_WARNING_DAYS = 7;

/**
 * Statuts possibles d'un abonnement :
 *   free          — plan FREE (pas d'abonnement payant)
 *   active        — plan payant, date d'expiration dans le futur (> 7j)
 *   expiring_soon — plan payant, expire dans moins de 7 jours
 *   expired       — plan payant, date dépassée (en attente de renouvellement)
 *   legacy        — plan payant sans date (clients avant l'activation de cette feature)
 */
function getSubscriptionStatus(org) {
  if (org.plan === 'FREE') return 'free';
  if (!org.planExpiresAt) return 'legacy';

  const now = new Date();
  const expiresAt = new Date(org.planExpiresAt);

  if (expiresAt <= now) return 'expired';

  const warningLimit = new Date(now.getTime() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);
  if (expiresAt <= warningLimit) return 'expiring_soon';

  return 'active';
}

function getDaysRemaining(planExpiresAt) {
  if (!planExpiresAt) return null;
  const diff = new Date(planExpiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calcule la nouvelle date d'expiration.
 *
 * Renouvellement (même plan, période encore valide) : on prolonge depuis planExpiresAt.
 * Upgrade / expiration dépassée : on part de maintenant.
 */
function computeNewExpiry(org, targetPlan, durationMonths) {
  const isRenewal = targetPlan === org.plan
    && org.planExpiresAt
    && new Date(org.planExpiresAt) > new Date();

  const base = isRenewal ? new Date(org.planExpiresAt) : new Date();
  return new Date(base.getFullYear(), base.getMonth() + durationMonths, base.getDate(),
    base.getHours(), base.getMinutes(), base.getSeconds());
}

/**
 * Calcule le prix total à afficher selon la durée.
 * Appliquer une remise palier si nécessaire (ex. -10% à partir de 3 mois).
 */
function computeAmount(monthlyPrice, durationMonths) {
  if (durationMonths >= 12) return Math.round(monthlyPrice * durationMonths * 0.80);
  if (durationMonths >= 6)  return Math.round(monthlyPrice * durationMonths * 0.90);
  if (durationMonths >= 3)  return Math.round(monthlyPrice * durationMonths * 0.95);
  return monthlyPrice * durationMonths;
}

module.exports = {
  getSubscriptionStatus,
  getDaysRemaining,
  computeNewExpiry,
  computeAmount,
  EXPIRY_WARNING_DAYS
};
