/**
 * Initialise la configuration globale de la plateforme (numéro de paiement, email support)
 * Usage: node scripts/seed-platform-config.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.platformConfig.findFirst();

  if (existing) {
    console.log('✅ Configuration plateforme déjà existante :');
    console.log(`   📞 Numéro paiement : ${existing.paymentPhone}`);
    console.log(`   👤 Bénéficiaire    : ${existing.paymentName}`);
    console.log(`   📧 Email support   : ${existing.supportEmail}`);
    console.log('\n💡 Pour modifier, utilisez l\'interface Super Admin → Paramètres.');
    return;
  }

  const config = await prisma.platformConfig.create({
    data: {
      paymentPhone: '+221 77 328 73 76',
      paymentName:  'CFActure',
      supportEmail: 'contact@cfacture.sn'
    }
  });

  console.log('✅ Configuration plateforme créée :');
  console.log(`   📞 Numéro paiement : ${config.paymentPhone}`);
  console.log(`   👤 Bénéficiaire    : ${config.paymentName}`);
  console.log(`   📧 Email support   : ${config.supportEmail}`);
  console.log('\n💡 Modifiable depuis l\'interface Super Admin → Paramètres.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
