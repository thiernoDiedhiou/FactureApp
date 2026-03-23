const rateLimit = require('express-rate-limit');

// En développement, les limiteurs sont désactivés pour ne pas bloquer pendant les tests
const isDev = process.env.NODE_ENV !== 'production';
const skipInDev = () => isDev;

const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  skip: skipInDev,
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer dans 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: skipInDev,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const pdfLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  skip: skipInDev,
  message: {
    success: false,
    message: 'Trop de générations PDF, veuillez patienter'
  }
});

module.exports = { generalLimiter, authLimiter, pdfLimiter };
