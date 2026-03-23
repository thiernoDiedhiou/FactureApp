const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TYPE_PREFIXES = {
  facture: 'FAC',
  devis: 'DEV',
  proforma: 'PRO'
};

/**
 * Génère le prochain numéro de document
 * Format: FAC-2024-001
 */
const generateDocumentNumber = async (type, userId) => {
  const prefix = TYPE_PREFIXES[type] || 'DOC';
  const year = new Date().getFullYear();

  // Trouver le dernier document de ce type pour cet utilisateur cette année
  const lastDoc = await prisma.document.findFirst({
    where: {
      userId,
      type,
      number: {
        startsWith: `${prefix}-${year}-`
      }
    },
    orderBy: { number: 'desc' }
  });

  let nextNum = 1;

  if (lastDoc) {
    const parts = lastDoc.number.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  const paddedNum = String(nextNum).padStart(3, '0');
  return `${prefix}-${year}-${paddedNum}`;
};

/**
 * Vérifie si un numéro existe déjà (pour éviter les doublons)
 */
const isNumberTaken = async (number, excludeId = null) => {
  const doc = await prisma.document.findFirst({
    where: {
      number,
      ...(excludeId ? { id: { not: excludeId } } : {})
    }
  });
  return !!doc;
};

module.exports = { generateDocumentNumber, isNumberTaken };
