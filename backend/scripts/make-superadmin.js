/**
 * Script CLI pour promouvoir un utilisateur en Super Admin
 * Usage: node scripts/make-superadmin.js email@exemple.com
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Usage: node scripts/make-superadmin.js <email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
    process.exit(1);
  }

  if (user.isSuperAdmin) {
    console.log(`ℹ️  ${user.name} (${email}) est déjà Super Admin.`);
    process.exit(0);
  }

  await prisma.user.update({
    where: { email },
    data: { isSuperAdmin: true }
  });

  console.log(`✅ ${user.name} (${email}) est maintenant Super Admin.`);
  console.log('   Reconnectez-vous pour activer les droits.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
