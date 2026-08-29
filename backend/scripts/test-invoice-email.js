/**
 * Script de test — Facture d'abonnement par email
 * Usage : node scripts/test-invoice-email.js votre@email.com
 */
require('dotenv').config();
const { sendSubscriptionInvoice } = require('../src/services/emailService');

const to = process.argv[2];
if (!to) {
  console.error('Usage: node scripts/test-invoice-email.js votre@email.com');
  process.exit(1);
}

const now    = new Date();
const end    = new Date(now);
end.setMonth(end.getMonth() + 3);

sendSubscriptionInvoice({
  userEmail:      to,
  userName:       'Thierno Diédhiou',
  orgName:        'ThierBusiness',
  plan:           'STARTER',
  amount:         45000,
  durationMonths: 3,
  transactionRef: 'tok_test_abc123def456xyz',
  paymentMethod:  'moneyfusion',
  startDate:      now,
  endDate:        end,
  invoiceRef:     `ABN-${now.getFullYear()}-TEST0001`,
  platformName:   'CFActure',
  supportEmail:   'contact@factureapp.sn'
})
  .then(() => {
    console.log(`✅ Facture de test envoyée à ${to}`);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  });
