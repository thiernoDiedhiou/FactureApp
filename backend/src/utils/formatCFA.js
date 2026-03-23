/**
 * Utilitaires de formatage pour le Franc CFA (XOF)
 * Zone UEMOA - Sénégal
 */

/**
 * Formate un montant en Franc CFA
 * Ex: 1250000 -> "1 250 000 FCFA"
 */
const formatXOF = (amount, showSymbol = true) => {
  const num = Math.round(amount || 0);
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return showSymbol ? `${formatted} FCFA` : formatted;
};

/**
 * Formate un montant avec la devise choisie
 */
const formatCurrency = (amount, currency = 'XOF') => {
  const num = Math.round(amount || 0);

  switch (currency) {
    case 'XOF':
    case 'FCFA':
      return formatXOF(num);
    case 'EUR':
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2
      }).format(num);
    case 'USD':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(num);
    default:
      return formatXOF(num);
  }
};

/**
 * Calcule les totaux d'un document
 */
const calculateDocumentTotals = (items, discountPercent = 0) => {
  let totalHtBeforeDiscount = 0;

  const processedItems = items.map(item => {
    const ht = item.quantity * item.unitPrice;
    const tva = ht * (item.tvaRate / 100);
    const subtotal = ht + tva;

    totalHtBeforeDiscount += ht;

    return {
      ...item,
      subtotal: Math.round(subtotal)
    };
  });

  const discountAmount = totalHtBeforeDiscount * (discountPercent / 100);
  const totalHt = Math.round(totalHtBeforeDiscount - discountAmount);
  const totalTva = Math.round(processedItems.reduce((sum, item) => {
    const ht = item.quantity * item.unitPrice;
    const htAfterDiscount = ht * (1 - discountPercent / 100);
    return sum + (htAfterDiscount * item.tvaRate / 100);
  }, 0));
  const totalTtc = totalHt + totalTva;

  return {
    items: processedItems,
    totalHt,
    totalTva,
    totalTtc,
    discountAmount: Math.round(discountAmount)
  };
};

module.exports = { formatXOF, formatCurrency, calculateDocumentTotals };
