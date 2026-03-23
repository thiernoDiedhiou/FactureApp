const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initialisation des données de test...');

  // Utilisateur admin
  const hashedPassword = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@factureapp.sn' },
    update: {},
    create: {
      name: 'Lamine Diedhiou',
      email: 'demo@factureapp.sn',
      password: hashedPassword,
      role: 'admin',
      settings: {
        create: {
          companyName: 'DigiTech Solutions SARL',
          address: 'Rue 10, Arafat (ex Mbour 2), Thiès',
          phone: '+221 77 648 45 58',
          email: 'contact@digitech-sn.com',
          website: 'www.digitech-sn.com',
          ninea: '012345678 2A3',
          defaultTvaRate: 18,
          defaultCurrency: 'XOF',
          defaultLanguage: 'fr',
          documentStyle: 'moderne',
          primaryColor: '#0EA5E9'
        }
      }
    }
  });

  console.log(`✅ Utilisateur créé: ${user.email}`);

  // Clients sénégalais réalistes
  const clientsData = [
    {
      name: 'Fatou Sow',
      companyName: 'Boutique Mode & Style',
      address: 'Marché HLM, Dakar',
      phone: '+221 70 234 56 78',
      email: 'fatou.sow@boutique-ms.sn',
      ninea: '023456789 2B1'
    },
    {
      name: 'Abdoulaye Ndiaye',
      companyName: 'Cabinet Conseil Ndiaye & Associés',
      address: 'Plateau, Avenue Léopold Sédar Senghor, Dakar',
      phone: '+221 76 345 67 89',
      email: 'a.ndiaye@conseil-ndiaye.sn',
      ninea: '034567890 3C2'
    },
    {
      name: 'Aissatou Ba',
      companyName: 'AgroBa Export SARL',
      address: 'Zone Industrielle de Pikine, Dakar',
      phone: '+221 78 456 78 90',
      email: 'aissatou.ba@agroba.sn',
      ninea: '045678901 4D3'
    },
    {
      name: 'Moussa Camara',
      companyName: 'Restaurant Le Teranga',
      address: 'Almadies, Route de la Corniche Ouest, Dakar',
      phone: '+221 77 567 89 01',
      email: 'mcamara@teranga.sn'
    },
    {
      name: 'Mariama Diop',
      companyName: 'École Privée Les Acacias',
      address: 'Thiès, Quartier Randoulène',
      phone: '+221 70 678 90 12',
      email: 'direction@acacias-thies.sn',
      ninea: '056789012 5E4'
    },
    {
      name: 'Ibrahima Sarr',
      companyName: 'Transport & Logistique Sarr',
      address: 'Saint-Louis, Rue Blaise Diagne',
      phone: '+221 76 789 01 23',
      email: 'ibrahima.sarr@transport-sarr.sn'
    }
  ];

  const clients = [];
  for (const clientData of clientsData) {
    const client = await prisma.client.create({
      data: { ...clientData, userId: user.id }
    });
    clients.push(client);
    console.log(`✅ Client créé: ${client.name}`);
  }

  // Produits/Services IT
  const productsData = [
    { name: 'Maintenance PC (forfait)', description: 'Nettoyage, mise à jour, optimisation complète', price: 25000, tvaRate: 18, category: 'Maintenance' },
    { name: 'Installation Windows 11', description: 'Installation et configuration Windows 11 Pro', price: 35000, tvaRate: 18, category: 'Installation' },
    { name: 'Création site web vitrine', description: 'Site web 5 pages avec responsive design', price: 350000, tvaRate: 18, category: 'Développement' },
    { name: 'Hébergement web (1 an)', description: 'Hébergement SSD 10GB + domaine .sn', price: 60000, tvaRate: 18, category: 'Hébergement' },
    { name: 'Formation bureautique (3h)', description: 'Formation Word, Excel, PowerPoint', price: 45000, tvaRate: 18, category: 'Formation' },
    { name: 'Récupération données', description: 'Récupération données disque dur / SSD', price: 75000, tvaRate: 18, category: 'Maintenance' },
    { name: 'Configuration réseau local', description: 'Installation switch, câblage, WiFi', price: 120000, tvaRate: 18, category: 'Réseau' },
    { name: 'Antivirus 1 an (licence)', description: 'Licence antivirus Kaspersky 1 poste 1 an', price: 20000, tvaRate: 18, category: 'Sécurité' },
    { name: 'Application mobile (devis)', description: 'Développement application Android/iOS', price: 1500000, tvaRate: 18, category: 'Développement' },
    { name: 'Support technique mensuel', description: 'Contrat de maintenance mensuel (8h/mois)', price: 85000, tvaRate: 18, category: 'Maintenance' }
  ];

  const products = [];
  for (const productData of productsData) {
    const product = await prisma.product.create({
      data: { ...productData, userId: user.id }
    });
    products.push(product);
  }
  console.log(`✅ ${products.length} produits créés`);

  // Documents de test
  const documentsData = [
    {
      clientIndex: 0,
      type: 'facture',
      status: 'paye',
      issuedDate: new Date('2024-11-15'),
      dueDate: new Date('2024-12-15'),
      paidAt: new Date('2024-11-28'),
      notes: 'Paiement reçu par virement Orange Money',
      items: [
        { productIndex: 0, quantity: 3 },
        { productIndex: 1, quantity: 1 },
        { productIndex: 7, quantity: 2 }
      ]
    },
    {
      clientIndex: 1,
      type: 'facture',
      status: 'en_attente',
      issuedDate: new Date('2024-12-01'),
      dueDate: new Date('2024-12-31'),
      notes: 'Projet site web Cabinet Ndiaye',
      items: [
        { productIndex: 2, quantity: 1 },
        { productIndex: 3, quantity: 1 },
        { productIndex: 5, quantity: 0 }
      ]
    },
    {
      clientIndex: 2,
      type: 'devis',
      status: 'en_attente',
      issuedDate: new Date('2024-12-10'),
      dueDate: new Date('2025-01-10'),
      notes: 'Devis pour infrastructure réseau AgroBa',
      items: [
        { productIndex: 6, quantity: 1 },
        { productIndex: 9, quantity: 6 }
      ]
    },
    {
      clientIndex: 3,
      type: 'facture',
      status: 'paye',
      issuedDate: new Date('2024-10-20'),
      dueDate: new Date('2024-11-20'),
      paidAt: new Date('2024-11-05'),
      notes: 'Maintenance périodique restaurant',
      items: [
        { productIndex: 0, quantity: 2 },
        { productIndex: 7, quantity: 1 }
      ]
    },
    {
      clientIndex: 4,
      type: 'proforma',
      status: 'en_attente',
      issuedDate: new Date('2024-12-15'),
      notes: 'Proforma formation personnel école',
      items: [
        { productIndex: 4, quantity: 5 }
      ]
    },
    {
      clientIndex: 5,
      type: 'facture',
      status: 'annule',
      issuedDate: new Date('2024-11-01'),
      dueDate: new Date('2024-12-01'),
      notes: 'Facture annulée sur demande client',
      items: [
        { productIndex: 6, quantity: 1 }
      ]
    }
  ];

  const numberCounters = { facture: 0, devis: 0, proforma: 0 };
  const prefixes = { facture: 'FAC', devis: 'DEV', proforma: 'PRO' };

  for (const docData of documentsData) {
    numberCounters[docData.type]++;
    const num = String(numberCounters[docData.type]).padStart(3, '0');
    const year = docData.issuedDate.getFullYear();
    const number = `${prefixes[docData.type]}-${year}-${num}`;

    const items = docData.items
      .filter(item => item.quantity > 0)
      .map(item => {
        const product = products[item.productIndex];
        const ht = product.price * item.quantity;
        const tva = ht * (product.tvaRate / 100);
        return {
          productId: product.id,
          description: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          tvaRate: product.tvaRate,
          subtotal: Math.round(ht + tva)
        };
      });

    const totalHt = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const totalTva = items.reduce((s, i) => s + i.quantity * i.unitPrice * i.tvaRate / 100, 0);
    const totalTtc = totalHt + totalTva;

    await prisma.document.create({
      data: {
        userId: user.id,
        clientId: clients[docData.clientIndex].id,
        type: docData.type,
        number,
        status: docData.status,
        totalHt: Math.round(totalHt),
        totalTva: Math.round(totalTva),
        totalTtc: Math.round(totalTtc),
        discount: 0,
        issuedDate: docData.issuedDate,
        dueDate: docData.dueDate || null,
        paidAt: docData.paidAt || null,
        notes: docData.notes,
        items: { create: items }
      }
    });

    console.log(`✅ Document créé: ${number}`);
  }

  console.log('\n🎉 Données de test initialisées avec succès !');
  console.log('📧 Email: demo@factureapp.sn');
  console.log('🔑 Mot de passe: password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
