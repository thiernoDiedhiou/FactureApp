/**
 * Utilitaires de formatage monétaire pour le Franc CFA (XOF)
 * Zone UEMOA - Sénégal
 */

/**
 * Formate un montant en XOF
 * Ex: 1250000 -> "1 250 000 FCFA"
 */
export const formatXOF = (amount, showSymbol = true) => {
  const num = Math.round(amount || 0);
  const formatted = num.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true
  }).replace(/\s/g, '\u00A0'); // Non-breaking space
  return showSymbol ? `${formatted} FCFA` : formatted;
};

/**
 * Formate selon la devise
 */
export const formatCurrency = (amount, currency = 'XOF') => {
  switch (currency) {
    case 'XOF':
    case 'FCFA':
      return formatXOF(amount);
    case 'EUR':
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0
      }).format(amount);
    case 'USD':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      }).format(amount);
    default:
      return formatXOF(amount);
  }
};

/**
 * Calcule les totaux d'un document côté frontend
 */
export const calculateTotals = (items = [], discountPercent = 0) => {
  let totalHtBrut = 0;
  let totalTva = 0;

  const processedItems = items.map(item => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const tva = parseFloat(item.tvaRate) || 0;

    const ht = qty * price;
    const htAfterDiscount = ht * (1 - discountPercent / 100);
    const tvaAmount = htAfterDiscount * (tva / 100);
    const subtotal = htAfterDiscount + tvaAmount;

    totalHtBrut += ht;
    totalTva += tvaAmount;

    return { ...item, subtotal: Math.round(subtotal) };
  });

  const discountAmount = totalHtBrut * (discountPercent / 100);
  const totalHt = Math.round(totalHtBrut - discountAmount);
  const totalTtc = totalHt + Math.round(totalTva);

  return {
    items: processedItems,
    totalHt,
    totalTva: Math.round(totalTva),
    totalTtc,
    discountAmount: Math.round(discountAmount)
  };
};

/**
 * Parse un montant formaté en XOF
 */
export const parseXOF = (str) => {
  if (!str) return 0;
  return parseInt(str.toString().replace(/[^\d]/g, ''), 10) || 0;
};
