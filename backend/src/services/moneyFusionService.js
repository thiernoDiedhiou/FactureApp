const MONEYFUSION_VERIFY_BASE = 'https://pay.moneyfusion.net/paiementNotif';

// Timeout généreux pour la création (l'utilisateur attend la redirection)
// et plus court pour la vérification (appelée dans le webhook)
const CHECKOUT_TIMEOUT_MS  = 20_000;
const VERIFY_TIMEOUT_MS    = 10_000;

// Avertissement au démarrage si la variable d'environnement est absente
if (!process.env.MONEYFUSION_API_URL) {
  console.warn('[MoneyFusion] ⚠️  MONEYFUSION_API_URL non configuré — les paiements en ligne seront indisponibles');
}

/**
 * Crée un paiement via l'API Money Fusion et retourne l'URL de la page de paiement hébergée.
 * L'URL API (apiUrl) est unique par application et configurée dans MONEYFUSION_API_URL.
 */
async function createPayment({ totalPrice, article, numeroSend, nomclient, returnUrl, webhookUrl, personalInfo = [] }) {
  const apiUrl = process.env.MONEYFUSION_API_URL;
  if (!apiUrl) throw new Error('MONEYFUSION_API_URL non configuré');

  const body = {
    totalPrice,
    article,
    nomclient,
    return_url:    returnUrl,
    webhook_url:   webhookUrl,
    personal_Info: personalInfo
  };
  // Money Fusion rejette les chaînes vides — on n'envoie le champ que s'il est renseigné
  if (numeroSend) body.numeroSend = numeroSend;

  let response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CHECKOUT_TIMEOUT_MS)
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new Error('Money Fusion API injoignable (timeout)');
    }
    throw err;
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Money Fusion API ${response.status}: ${err.message || 'Erreur inconnue'}`);
  }

  const data = await response.json();

  if (!data.statut) {
    throw new Error(`Money Fusion: ${data.message || 'Échec de création du paiement'}`);
  }
  if (!data.url) {
    throw new Error('Money Fusion: URL de paiement absente de la réponse');
  }

  return data; // { statut: true, token: string, message: string, url: string }
}

/**
 * Vérifie le statut d'un paiement Money Fusion via leur API de notification.
 * À utiliser dans le webhook pour confirmer indépendamment avant d'activer un plan.
 * Statuts possibles : 'paid' | 'pending' | 'failure' | 'no paid'
 */
async function verifyPayment(token) {
  let response;
  try {
    response = await fetch(`${MONEYFUSION_VERIFY_BASE}/${token}`, {
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS)
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new Error('Money Fusion vérification timeout');
    }
    throw err;
  }

  if (!response.ok) {
    throw new Error(`Money Fusion vérification ${response.status}`);
  }
  return await response.json();
}

module.exports = { createPayment, verifyPayment };
