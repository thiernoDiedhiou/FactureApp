/**
 * Seed des configurations de plans tarifaires
 * Usage: node scripts/seed-plans.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const plans = [
  {
    key: 'FREE',
    price: 0,
    maxMembers: 1,
    maxDocuments: 10,
    maxClients: 5,
    description: 'Pour démarrer seul',
    features: [
      '1 utilisateur', '10 documents', '5 clients',
      'Factures, devis, proformas', '3 templates PDF',
      'Envoi par email', 'Tableau de bord'
    ],
    isActive: true
  },
  {
    key: 'STARTER',
    price: 9900,
    maxMembers: 3,
    maxDocuments: 100,
    maxClients: 50,
    description: 'Pour les petites équipes',
    features: [
      "Jusqu'à 3 utilisateurs", '100 documents', '50 clients',
      'Tout du plan Gratuit', 'Gestion des rôles (Admin/Membre)',
      'Support par email'
    ],
    isActive: true
  },
  {
    key: 'PRO',
    price: 24900,
    maxMembers: 10,
    maxDocuments: -1,
    maxClients: -1,
    description: 'Pour les équipes en croissance',
    features: [
      "Jusqu'à 10 utilisateurs", 'Documents illimités', 'Clients illimités',
      'Tout du plan Starter', 'Support prioritaire', 'Personnalisation avancée PDF'
    ],
    isActive: true
  },
  {
    key: 'ENTERPRISE',
    price: 0,
    maxMembers: -1,
    maxDocuments: -1,
    maxClients: -1,
    description: 'Pour les grandes structures',
    features: [
      'Utilisateurs illimités', 'Documents illimités', 'Clients illimités',
      'Tout du plan Pro', 'Intégrations sur mesure', 'SLA garanti',
      'Account manager dédié', 'Facturation personnalisée'
    ],
    isActive: true
  }
];

async function main() {
  for (const plan of plans) {
    await prisma.planConfig.upsert({
      where: { key: plan.key },
      update: plan,
      create: plan
    });
    console.log(`✅ Plan ${plan.key} configuré`);
  }
  console.log('\n🎉 Plans initialisés avec succès.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
