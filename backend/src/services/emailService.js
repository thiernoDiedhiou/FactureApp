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

/**
 * Envoie la facture d'abonnement par email après activation d'un plan.
 */
const sendSubscriptionInvoice = async ({
  userEmail, userName, orgName,
  plan, amount, durationMonths,
  transactionRef, paymentMethod,
  startDate, endDate,
  invoiceRef, platformName, supportEmail: supportMail
}) => {
  const transporter = createTransporter();
  await transporter.verify();

  const PLAN_LABELS   = { STARTER: 'Starter', PRO: 'Pro', ENTERPRISE: 'Enterprise' };
  const METHOD_LABELS = {
    moneyfusion:  'Money Fusion',
    wave:         'Wave',
    orange_money: 'Orange Money',
    cash:         'Espèces / Virement',
    mixx:         'Mixx by Joni Joni'
  };

  const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const planLabel    = PLAN_LABELS[plan]    || plan;
  const methodLabel  = METHOD_LABELS[paymentMethod] || paymentMethod;
  const paidAmount   = fmt(amount);
  const brandColor   = '#00C8D7';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Facture ${invoiceRef}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1a1a1a;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;">
<tr><td>
<table width="600" align="center" cellpadding="0" cellspacing="0"
       style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.09);">

  <!-- ── En-tête ───────────────────────────────────── -->
  <tr>
    <td style="background-color:${brandColor};padding:24px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#ffffff;vertical-align:top;">
            <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;">${platformName || 'CFActure'}</div>
            <div style="font-size:11px;opacity:0.85;margin-top:3px;">Facturation XOF — UEMOA</div>
          </td>
          <td style="text-align:right;color:#ffffff;vertical-align:top;">
            <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Facture</div>
            <div style="font-size:13px;font-weight:600;margin-top:3px;">${invoiceRef}</div>
            <div style="font-size:11px;opacity:0.85;margin-top:3px;">${fmtDate(startDate)}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── Méta : client + détails ───────────────────── -->
  <tr>
    <td style="padding:22px 28px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <!-- Facturé à -->
          <td width="48%" style="vertical-align:top;">
            <div style="border:1px solid #e2e8f0;border-radius:7px;padding:13px 15px;">
              <div style="font-size:9px;text-transform:uppercase;color:#64748b;letter-spacing:0.6px;margin-bottom:7px;font-weight:700;">Facturé à</div>
              <div style="font-weight:700;font-size:14px;color:#111;">${orgName}</div>
              <div style="color:#475569;margin-top:3px;font-size:12px;">${userName}</div>
              <div style="color:#94a3b8;font-size:11px;margin-top:2px;">${userEmail}</div>
            </div>
          </td>
          <td width="4%"></td>
          <!-- Détails -->
          <td width="48%" style="vertical-align:top;">
            <div style="border:1px solid #e2e8f0;border-radius:7px;padding:13px 15px;">
              <div style="font-size:9px;text-transform:uppercase;color:#64748b;letter-spacing:0.6px;margin-bottom:7px;font-weight:700;">Détails</div>
              <div style="font-size:12px;color:#374151;line-height:1.8;">
                <div><strong>Période :</strong> ${durationMonths} mois</div>
                <div><strong>Début :</strong> ${fmtDate(startDate)}</div>
                <div><strong>Expire le :</strong> ${fmtDate(endDate)}</div>
                ${transactionRef ? `<div style="font-size:10px;color:#94a3b8;margin-top:4px;"><strong>Réf. :</strong> ${transactionRef.slice(0, 20)}…</div>` : ''}
              </div>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── Tableau des lignes ─────────────────────────── -->
  <tr>
    <td style="padding:20px 28px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <thead>
          <tr style="background-color:#f8fafc;">
            <th style="padding:9px 12px;text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0;letter-spacing:0.4px;">Description</th>
            <th style="padding:9px 12px;text-align:center;font-size:10px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0;letter-spacing:0.4px;">Durée</th>
            <th style="padding:9px 12px;text-align:right;font-size:10px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0;letter-spacing:0.4px;">Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:14px 12px;border-bottom:1px solid #f1f5f9;">
              <div style="font-weight:700;font-size:14px;color:#111;">Abonnement Plan ${planLabel}</div>
              <div style="font-size:11px;color:#64748b;margin-top:3px;">CFActure · Facturation XOF</div>
            </td>
            <td style="padding:14px 12px;text-align:center;color:#475569;border-bottom:1px solid #f1f5f9;">${durationMonths} mois</td>
            <td style="padding:14px 12px;text-align:right;font-weight:700;font-size:14px;border-bottom:1px solid #f1f5f9;">${paidAmount}&nbsp;FCFA</td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>

  <!-- ── Totaux ─────────────────────────────────────── -->
  <tr>
    <td style="padding:14px 28px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="55%"></td>
          <td width="45%">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td colspan="2" style="border-top:1px solid #e2e8f0;padding:0 0 4px;"></td>
              </tr>
              <tr>
                <td style="padding:8px 10px;font-size:15px;font-weight:800;color:${brandColor};">TOTAL TTC</td>
                <td style="padding:8px 10px;text-align:right;font-size:15px;font-weight:800;color:${brandColor};">${paidAmount}&nbsp;FCFA</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── Confirmation paiement ─────────────────────── -->
  <tr>
    <td style="padding:18px 28px 0;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;">
        <div style="font-size:13px;color:#15803d;font-weight:600;">
          ✅&nbsp; Paiement confirmé via <strong>${methodLabel}</strong>
        </div>
        <div style="font-size:11px;color:#166534;margin-top:3px;">
          Votre abonnement ${planLabel} est actif jusqu'au ${fmtDate(endDate)}.
        </div>
      </div>
    </td>
  </tr>

  <!-- ── Pied de page ───────────────────────────────── -->
  <tr>
    <td style="padding:28px 28px 24px;">
      <div style="border-top:1px solid #e2e8f0;padding-top:16px;text-align:center;color:#94a3b8;font-size:11px;line-height:1.8;">
        <div style="font-weight:600;color:#64748b;">${platformName || 'CFActure'}</div>
        <div>${supportMail || ''}</div>
        <div style="margin-top:6px;font-size:10px;">
          Cette facture est générée automatiquement et constitue une preuve de paiement.
        </div>
      </div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `Facture ${invoiceRef}

Bonjour ${userName},

Merci pour votre abonnement au Plan ${planLabel} sur ${platformName || 'CFActure'}.

Organisation : ${orgName}
Plan         : ${planLabel}
Durée        : ${durationMonths} mois
Période      : ${fmtDate(startDate)} → ${fmtDate(endDate)}
Montant payé : ${paidAmount} FCFA
Mode de paiement : ${methodLabel}
${transactionRef ? `Référence   : ${transactionRef}` : ''}

Votre abonnement est maintenant actif.

${platformName || 'CFActure'} — ${supportMail || ''}`;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || process.env.SMTP_USER,
    to:      userEmail,
    subject: `Facture ${invoiceRef} — Abonnement Plan ${planLabel} activé`,
    text,
    html
  });
};

module.exports = { sendDocumentEmail, sendInvitationEmail, sendVerificationEmail, sendPasswordResetEmail, sendSubscriptionInvoice };
