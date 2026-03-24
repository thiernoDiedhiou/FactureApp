const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TYPE_PREFIXES = {
  facture: 'FAC',
  devis: 'DEV',
  proforma: 'PRO'
};

/**
 * Génère le prochain numéro de document pour une organisation
 * Format: FAC-2024-001 (unique par organisation)
 */
const generateDocumentNumber = async (type, organizationId) => {
  const prefix = TYPE_PREFIXES[type] || 'DOC';
  const year = new Date().getFullYear();

  const lastDoc = await prisma.document.findFirst({
    where: {
      organizationId,
      type,
      number: { startsWith: `${prefix}-${year}-` }
    },
    orderBy: { number: 'desc' }
  });

  let nextNum = 1;
  if (lastDoc) {
    const parts = lastDoc.number.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  const paddedNum = String(nextNum).padStart(3, '0');
  return `${prefix}-${year}-${paddedNum}`;
};

module.exports = { generateDocumentNumber };
