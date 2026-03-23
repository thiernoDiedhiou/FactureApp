const { PrismaClient } = require('@prisma/client');
const { startOfMonth, endOfMonth, subMonths, startOfYear } = require('date-fns');

const prisma = new PrismaClient();

// GET /api/dashboard/stats
const getStats = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);

  const [
    totalFacture,
    countPaye,
    countEnAttente,
    countAnnule,
    countDevis,
    overdueCount,
    recentDocuments,
    recentClients
  ] = await Promise.all([
    prisma.document.aggregate({
      where: { userId, type: 'facture', status: 'paye' },
      _sum: { totalTtc: true }
    }),
    prisma.document.count({ where: { userId, type: 'facture', status: 'paye' } }),
    prisma.document.count({ where: { userId, type: 'facture', status: 'en_attente' } }),
    prisma.document.count({ where: { userId, type: 'facture', status: 'annule' } }),
    prisma.document.count({ where: { userId, type: 'devis' } }),
    prisma.document.count({
      where: {
        userId,
        type: 'facture',
        status: 'en_attente',
        dueDate: { lt: now }
      }
    }),
    prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { client: { select: { name: true } } }
    }),
    prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { _count: { select: { documents: true } } }
    })
  ]);

  // Chiffre d'affaires du mois courant
  const currentMonthRevenue = await prisma.document.aggregate({
    where: {
      userId,
      type: 'facture',
      status: 'paye',
      paidAt: { gte: startOfCurrentMonth }
    },
    _sum: { totalTtc: true }
  });

  res.json({
    success: true,
    data: {
      stats: {
        totalFacture: totalFacture._sum.totalTtc || 0,
        currentMonthRevenue: currentMonthRevenue._sum.totalTtc || 0,
        countPaye,
        countEnAttente,
        countAnnule,
        countDevis,
        overdueCount
      },
      recentDocuments,
      recentClients
    }
  });
};

// GET /api/dashboard/revenue-chart
const getRevenueChart = async (req, res) => {
  const userId = req.user.id;
  const months = 12;
  const now = new Date();
  const data = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const [revenue, invoiceCount] = await Promise.all([
      prisma.document.aggregate({
        where: {
          userId,
          type: 'facture',
          issuedDate: { gte: start, lte: end }
        },
        _sum: { totalTtc: true }
      }),
      prisma.document.count({
        where: {
          userId,
          type: 'facture',
          issuedDate: { gte: start, lte: end }
        }
      })
    ]);

    data.push({
      month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      revenue: revenue._sum.totalTtc || 0,
      invoices: invoiceCount
    });
  }

  res.json({ success: true, data: { chart: data } });
};

// GET /api/dashboard/overdue
const getOverdueDocuments = async (req, res) => {
  const documents = await prisma.document.findMany({
    where: {
      userId: req.user.id,
      type: 'facture',
      status: 'en_attente',
      dueDate: { lt: new Date() }
    },
    include: { client: { select: { name: true, email: true, phone: true } } },
    orderBy: { dueDate: 'asc' }
  });

  res.json({ success: true, data: { documents } });
};

module.exports = { getStats, getRevenueChart, getOverdueDocuments };
