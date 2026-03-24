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

/**
 * Envoie un email de notification d'invitation à rejoindre une organisation
 */
const sendInvitationEmail = async ({ to, inviteeName, organizationName, role, inviterName, inviteUrl }) => {
  const transporter = createTransporter();
  await transporter.verify();

  const roleLabel = role === 'ADMIN' ? 'Administrateur' : 'Membre';
  const isNewUser = !inviteeName; // Pas encore de compte

  const greeting = isNewUser ? `Bonjour,` : `Bonjour ${inviteeName},`;
  const actionText = isNewUser
    ? `Cliquez sur le bouton ci-dessous pour créer votre compte et rejoindre l'organisation.`
    : `Connectez-vous à votre compte CFActure pour accéder à cette organisation.`;

  const text = `${greeting}

${inviterName} vous invite à rejoindre l'organisation "${organizationName}" sur CFActure en tant que ${roleLabel}.

${actionText}
${inviteUrl ? `\nLien d'invitation : ${inviteUrl}` : ''}

Cordialement,
L'équipe CFActure`.trim();

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
  <div style="background: #0EA5E9; padding: 28px 32px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 22px;">CFActure</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Invitation à rejoindre une organisation</p>
  </div>
  <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px; margin: 0 0 16px;">${greeting}</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 8px;">
      <strong>${inviterName}</strong> vous invite à rejoindre l'organisation
      <strong>"${organizationName}"</strong> en tant que <strong>${roleLabel}</strong>.
    </p>
    <p style="font-size: 14px; color: #6b7280; margin: 0 0 28px;">${actionText}</p>
    ${inviteUrl ? `
    <div style="text-align: center; margin: 0 0 24px;">
      <a href="${inviteUrl}"
         style="display: inline-block; background: #0EA5E9; color: white; padding: 14px 32px;
                border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
        Rejoindre l'organisation
      </a>
    </div>
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">Ce lien est valable 7 jours.</p>
    ` : ''}
  </div>
</div>`.trim();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: `Invitation à rejoindre "${organizationName}" sur CFActure`,
    text,
    html
  });
};

/**
 * Envoie un email de vérification d'adresse email
 */
const sendVerificationEmail = async ({ to, name, verifyUrl }) => {
  const transporter = createTransporter();
  await transporter.verify();

  const text = `Bonjour ${name},

Pour activer votre compte CFActure, veuillez cliquer sur le lien ci-dessous :

${verifyUrl}

Ce lien est valable 24 heures.

Si vous n'avez pas créé de compte, ignorez cet email.

Cordialement,
L'équipe CFActure`.trim();

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
  <div style="background: #0EA5E9; padding: 28px 32px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 22px;">CFActure</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Vérification de votre adresse email</p>
  </div>
  <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px; margin: 0 0 12px;">Bonjour <strong>${name}</strong>,</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 28px;">
      Merci de vous être inscrit sur <strong>CFActure</strong>.<br>
      Cliquez sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte.
    </p>
    <div style="text-align: center; margin: 0 0 28px;">
      <a href="${verifyUrl}"
         style="display: inline-block; background: #0EA5E9; color: white; padding: 14px 32px;
                border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
        ✅ Vérifier mon email
      </a>
    </div>
    <p style="font-size: 13px; color: #6b7280; margin: 0;">
      Ce lien expire dans <strong>24 heures</strong>. Si vous n'avez pas créé de compte, ignorez cet email.
    </p>
  </div>
</div>`.trim();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'Vérifiez votre adresse email — CFActure',
    text,
    html
  });
};

/**
 * Envoie un email de réinitialisation de mot de passe
 */
const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const transporter = createTransporter();
  await transporter.verify();

  const text = `Bonjour ${name},

Vous avez demandé la réinitialisation de votre mot de passe CFActure.

Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :

${resetUrl}

Ce lien est valable 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.

Cordialement,
L'équipe CFActure`.trim();

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
  <div style="background: #0EA5E9; padding: 28px 32px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 22px;">CFActure</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Réinitialisation de mot de passe</p>
  </div>
  <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px; margin: 0 0 12px;">Bonjour <strong>${name}</strong>,</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 28px;">
      Vous avez demandé la réinitialisation de votre mot de passe.<br>
      Cliquez sur le bouton ci-dessous pour en définir un nouveau.
    </p>
    <div style="text-align: center; margin: 0 0 24px;">
      <a href="${resetUrl}"
         style="display: inline-block; background: #0EA5E9; color: white; padding: 14px 32px;
                border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
        Réinitialiser mon mot de passe
      </a>
    </div>
    <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px; text-align: center;">
      Ce lien est valable <strong>1 heure</strong>.
    </p>
    <p style="font-size: 13px; color: #9ca3af; text-align: center; margin: 0;">
      Si vous n'avez pas fait cette demande, ignorez cet email — votre mot de passe restera inchangé.
    </p>
  </div>
</div>`.trim();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'Réinitialisation de votre mot de passe — CFActure',
    text,
    html
  });
};

module.exports = { sendDocumentEmail, sendInvitationEmail, sendVerificationEmail, sendPasswordResetEmail };
