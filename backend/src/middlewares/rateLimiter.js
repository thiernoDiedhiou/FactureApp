const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const isDev = process.env.NODE_ENV !== 'production';
const skipInDev = () => isDev;

// Extrait l'userId du JWT sans vérification cryptographique.
// Utilisé uniquement comme clé de rate limiting — la vraie vérification reste dans authenticate().
// Avantage : évite que des utilisateurs différents derrière le même NAT (entreprise, cybercafé)
// partagent leur quota et se bloquent mutuellement.
const extractUserId = (req) => {
  try {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      const decoded = jwt.decode(auth.slice(7));
      if (decoded?.id) return `uid:${decoded.id}`;
    }
  } catch {}
  return req.ip;
};

// Filet de sécurité pour les routes publiques/non-authentifiées (IP-based)
// Configurable via RATE_LIMIT_MAX pour ajuster sans redéploiement
const publicLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  skip: skipInDev,
  message: { success: false, message: 'Trop de requêtes, veuillez réessayer dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

// Routes authentifiées — quota généreux par userId
// 500 req/15min par utilisateur, indépendamment de son IP
const authenticatedLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: 500,
  keyGenerator: extractUserId,
  skip: skipInDev,
  message: { success: false, message: 'Trop de requêtes, veuillez réessayer dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

// Routes auth (login, register, mot de passe) — strict, ne compte que les échecs (pas les succès)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: skipInDev,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Trop de tentatives, veuillez réessayer dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

// Génération PDF — CPU-intensive, par userId pour ne pas pénaliser les autres
const pdfLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: extractUserId,
  skip: skipInDev,
  message: { success: false, message: 'Trop de générations PDF, veuillez patienter' }
});

module.exports = { publicLimiter, authenticatedLimiter, authLimiter, pdfLimiter };
