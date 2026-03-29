/**
 * Seed pour créer un Super Admin
 * Usage: node scripts/seed-superadmin.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SUPERADMIN = {
  name: 'Super Admin',
  email: 'admin@cfacture.sn',
  password: 'Admin@1234',
};

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: SUPERADMIN.email } });

  if (existing) {
    if (existing.isSuperAdmin) {
      console.log(`ℹ️  ${existing.email} est déjà Super Admin.`);
      return;
    }
    await prisma.user.update({
      where: { email: SUPERADMIN.email },
      data: { isSuperAdmin: true }
    });
    console.log(`✅ ${existing.email} promu Super Admin.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(SUPERADMIN.password, 10);

  const user = await prisma.user.create({
    data: {
      name: SUPERADMIN.name,
      email: SUPERADMIN.email,
      password: hashedPassword,
      isSuperAdmin: true,
      isEmailVerified: true,
    }
  });

  console.log('✅ Super Admin créé avec succès :');
  console.log(`   📧 Email    : ${user.email}`);
  console.log(`   🔑 Password : ${SUPERADMIN.password}`);
  console.log('\n⚠️  Changez le mot de passe après la première connexion.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
