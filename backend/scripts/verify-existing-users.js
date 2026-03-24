// Script pour marquer les utilisateurs existants comme vérifiés
// Utile après l'ajout de la vérification email pour ne pas bloquer les anciens comptes
// Usage: node scripts/verify-existing-users.js

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { isEmailVerified: false },
    data: { isEmailVerified: true, emailVerifyToken: null }
  });
  console.log(`✅ ${result.count} utilisateur(s) marqué(s) comme vérifiés`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
