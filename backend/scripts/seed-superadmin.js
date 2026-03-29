/**
 * Seed pour créer un Super Admin avec son organisation
 * Usage: node scripts/seed-superadmin.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SUPERADMIN = {
  name: 'Super Admin',
  email: 'innosoftcreation@gmail.com',
  password: 'Admin@1234',
  organizationName: 'Innosoft Creation',
};

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: SUPERADMIN.email },
    include: { memberships: { include: { organization: true } } }
  });

  if (existing) {
    // Promouvoir en super admin si ce n'est pas déjà le cas
    if (!existing.isSuperAdmin) {
      await prisma.user.update({
        where: { email: SUPERADMIN.email },
        data: { isSuperAdmin: true }
      });
      console.log(`✅ ${existing.email} promu Super Admin.`);
    } else {
      console.log(`ℹ️  ${existing.email} est déjà Super Admin.`);
    }

    // Créer l'organisation si elle n'existe pas encore
    if (existing.memberships.length === 0) {
      const slug = 'innosoft-creation';
      const existingSlug = await prisma.organization.findUnique({ where: { slug } });
      const finalSlug = existingSlug ? `${slug}-${Math.random().toString(36).substring(2, 6)}` : slug;

      const org = await prisma.organization.create({
        data: {
          name: SUPERADMIN.organizationName,
          slug: finalSlug,
          plan: 'ENTERPRISE',
          settings: {
            create: {
              companyName: SUPERADMIN.organizationName,
              defaultTvaRate: 18,
              defaultCurrency: 'XOF',
              defaultLanguage: 'fr',
              documentStyle: 'classique',
              primaryColor: '#00C8D7'
            }
          },
          members: {
            create: { userId: existing.id, role: 'OWNER' }
          }
        }
      });
      console.log(`✅ Organisation "${org.name}" créée et liée au Super Admin.`);
    } else {
      console.log(`ℹ️  Organisation déjà existante : "${existing.memberships[0].organization.name}"`);
    }
    return;
  }

  // Création complète : user + org
  const hashedPassword = await bcrypt.hash(SUPERADMIN.password, 10);
  const slug = 'innosoft-creation';
  const existingSlug = await prisma.organization.findUnique({ where: { slug } });
  const finalSlug = existingSlug ? `${slug}-${Math.random().toString(36).substring(2, 6)}` : slug;

  const user = await prisma.user.create({
    data: {
      name: SUPERADMIN.name,
      email: SUPERADMIN.email,
      password: hashedPassword,
      isSuperAdmin: true,
      isEmailVerified: true,
    }
  });

  await prisma.organization.create({
    data: {
      name: SUPERADMIN.organizationName,
      slug: finalSlug,
      plan: 'ENTERPRISE',
      settings: {
        create: {
          companyName: SUPERADMIN.organizationName,
          defaultTvaRate: 18,
          defaultCurrency: 'XOF',
          defaultLanguage: 'fr',
          documentStyle: 'classique',
          primaryColor: '#00C8D7'
        }
      },
      members: {
        create: { userId: user.id, role: 'OWNER' }
      }
    }
  });

  console.log('✅ Super Admin créé avec succès :');
  console.log(`   📧 Email        : ${user.email}`);
  console.log(`   🔑 Password     : ${SUPERADMIN.password}`);
  console.log(`   🏢 Organisation : ${SUPERADMIN.organizationName} (plan ENTERPRISE)`);
  console.log('\n⚠️  Changez le mot de passe après la première connexion.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
