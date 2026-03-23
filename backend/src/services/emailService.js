const nodemailer = require('nodemailer');
const { generatePDF } = require('./pdfService');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Envoie un document par email avec le PDF en pièce jointe
 */
const sendDocumentEmail = async ({ document, settings, to, subject, body }) => {
  const transporter = createTransporter();

  // Verify connection
  await transporter.verify();

  // Generate PDF
  const pdfBuffer = await generatePDF(document, settings);

  const typeLabels = {
    facture: 'Facture',
    devis: 'Devis',
    proforma: 'Facture Proforma'
  };

  const defaultBody = `
Bonjour ${document.client?.name || ''},

Veuillez trouver en pièce jointe votre ${typeLabels[document.type] || 'document'} ${document.number}.

Montant total: ${Math.round(document.totalTtc).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA

${document.dueDate ? `Date d'échéance: ${new Date(document.dueDate).toLocaleDateString('fr-FR')}` : ''}

Pour toute question, n'hésitez pas à nous contacter.

Cordialement,
${settings?.companyName || 'Notre équipe'}
${settings?.phone ? `Tél: ${settings.phone}` : ''}
${settings?.email ? `Email: ${settings.email}` : ''}
  `.trim();

  const mailOptions = {
    from: process.env.EMAIL_FROM || settings?.email || process.env.SMTP_USER,
    to,
    subject: subject || `${typeLabels[document.type] || 'Document'} N° ${document.number}`,
    text: body || defaultBody,
    html: `<pre style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">${(body || defaultBody).replace(/\n/g, '<br>')}</pre>`,
    attachments: [
      {
        filename: `${document.number}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = { sendDocumentEmail };
