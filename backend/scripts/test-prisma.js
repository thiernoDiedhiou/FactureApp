const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.user.findFirst({ where: { isSuperAdmin: true } })
  .then(u => {
    console.log('✅ isSuperAdmin field works! User:', u?.email || 'none found');
    return p.$disconnect();
  })
  .catch(e => {
    console.error('❌ FAIL:', e.message);
    return p.$disconnect();
  });
