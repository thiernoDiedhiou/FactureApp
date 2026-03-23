const app = require('./app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Base de données connectée');

    app.listen(PORT, () => {
      console.log(`🚀 FactureApp API démarrée sur http://localhost:${PORT}`);
      console.log(`📊 Mode: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Erreur de démarrage:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('\n👋 Serveur arrêté proprement');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();
