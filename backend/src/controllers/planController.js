const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/plans — Liste publique des plans actifs
const PLAN_ORDER = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

const getPlans = async (req, res) => {
  const plans = await prisma.planConfig.findMany({
    where: { isActive: true }
  });
  // Ordre logique fixe indépendant du prix
  plans.sort((a, b) => PLAN_ORDER.indexOf(a.key) - PLAN_ORDER.indexOf(b.key));
  res.json({ success: true, data: { plans } });
};

module.exports = { getPlans };
