const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const generateTokens = async (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt
    }
  });

  return { accessToken, refreshToken };
};

const verifyRefreshToken = async (token) => {
  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, name: true, email: true, role: true } } }
  });

  if (!stored) throw new Error('Token de rafraîchissement invalide');
  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { token } });
    throw new Error('Token de rafraîchissement expiré');
  }

  return stored;
};

const revokeRefreshToken = async (token) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

const revokeAllUserTokens = async (userId) => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

module.exports = {
  generateTokens,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens
};
