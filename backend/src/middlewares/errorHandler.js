const { ZodError } = require('zod');
const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'champ';
      return res.status(409).json({
        success: false,
        message: `Cette valeur existe déjà pour le champ: ${field}`
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Ressource non trouvée'
      });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Référence invalide - la ressource liée n\'existe pas'
      });
    }
  }

  // Custom app errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.code ? { code: err.code } : {})
    });
  }

  // Default 500
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur'
      : err.message
  });
};

class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

module.exports = { errorHandler, AppError };
