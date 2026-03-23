const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Formate un montant en XOF pour le PDF
 */
const fmt = (amount) => {
  const num = Math.round(amount || 0);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
};

/**
 * Formate une date en français
 */
const fmtDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

/**
 * Type labels
 */
const TYPE_LABELS = {
  facture: 'FACTURE',
  devis: 'DEVIS',
  proforma: 'FACTURE PROFORMA'
};

const STATUS_LABELS = {
  en_attente: 'En attente',
  paye: 'Payé',
  annule: 'Annulé'
};

/**
 * Génère un PDF pour un document
 * @param {Object} document - Document avec items et client
 * @param {Object} settings - Paramètres utilisateur
 * @param {string} style - Style: classique | moderne | compact
 * @returns {Promise<Buffer>} Buffer PDF
 */
const generatePDF = (document, settings, style = null) => {
  return new Promise((resolve, reject) => {
    const docStyle = style || settings?.documentStyle || 'classique';
    const primaryColor = settings?.primaryColor || '#0EA5E9';

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `${document.number} - ${document.client?.name}`,
        Author: settings?.companyName || 'FactureApp',
        Subject: TYPE_LABELS[document.type] || 'Document'
      }
    });

    const buffers = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    switch (docStyle) {
      case 'moderne':
        renderModerne(doc, document, settings, primaryColor);
        break;
      case 'compact':
        renderCompact(doc, document, settings, primaryColor);
        break;
      default:
        renderClassique(doc, document, settings, primaryColor);
    }

    doc.end();
  });
};

// ─── Template Classique ──────────────────────────────────────────────────────
function renderClassique(doc, document, settings, primaryColor) {
  const pageWidth = doc.page.width - 100;
  let y = 50;

  // En-tête
  if (settings?.logoPath) {
    const logoFile = path.join(__dirname, '../../', settings.logoPath);
    if (fs.existsSync(logoFile)) {
      doc.image(logoFile, 50, y, { width: 100, height: 60, fit: [100, 60] });
    }
  }

  // Informations entreprise
  const companyX = settings?.logoPath ? 160 : 50;
  doc.fontSize(16).font('Helvetica-Bold')
    .text(settings?.companyName || 'Mon Entreprise', companyX, y);
  y += 20;
  doc.fontSize(9).font('Helvetica').fillColor('#555555');
  if (settings?.address) doc.text(settings.address, companyX, y), y += 12;
  if (settings?.phone) doc.text(`Tél: ${settings.phone}`, companyX, y), y += 12;
  if (settings?.email) doc.text(settings.email, companyX, y), y += 12;
  if (settings?.ninea) doc.text(`NINEA: ${settings.ninea}`, companyX, y), y += 12;

  // Type et numéro document
  doc.fillColor('#000000');
  doc.fontSize(20).font('Helvetica-Bold')
    .text(TYPE_LABELS[document.type] || 'DOCUMENT', 400, 50, { align: 'right', width: 145 });
  doc.fontSize(10).font('Helvetica')
    .text(`N° ${document.number}`, 400, 75, { align: 'right', width: 145 });
  doc.fontSize(9)
    .text(`Date: ${fmtDate(document.issuedDate)}`, 400, 90, { align: 'right', width: 145 });
  if (document.dueDate) {
    doc.text(`Échéance: ${fmtDate(document.dueDate)}`, 400, 105, { align: 'right', width: 145 });
  }

  y = Math.max(y, 130);

  // Ligne séparatrice
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#cccccc').stroke();
  y += 15;

  // Informations client
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
    .text('FACTURÉ À:', 50, y);
  y += 15;
  doc.fontSize(11).font('Helvetica-Bold')
    .text(document.client?.companyName || document.client?.name, 50, y);
  y += 15;
  doc.fontSize(9).font('Helvetica').fillColor('#555555');
  if (document.client?.address) doc.text(document.client.address, 50, y), y += 12;
  if (document.client?.phone) doc.text(`Tél: ${document.client.phone}`, 50, y), y += 12;
  if (document.client?.email) doc.text(document.client.email, 50, y), y += 12;
  if (document.client?.ninea) doc.text(`NINEA: ${document.client.ninea}`, 50, y), y += 12;

  y += 20;

  // Tableau des lignes
  renderItemsTable(doc, document, y, primaryColor, false);
  y = doc.y + 20;

  // Totaux
  renderTotals(doc, document, y);

  // Notes
  if (document.notes) {
    y = doc.y + 30;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000').text('Notes:', 50, y);
    y += 14;
    doc.fontSize(9).font('Helvetica').fillColor('#555555').text(document.notes, 50, y, { width: 400 });
  }

  // Pied de page
  renderFooter(doc, settings);
}

// ─── Template Moderne ────────────────────────────────────────────────────────
function renderModerne(doc, document, settings, primaryColor) {
  // En-tête colorée
  doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

  // Logo
  let logoWidth = 0;
  if (settings?.logoPath) {
    const logoFile = path.join(__dirname, '../../', settings.logoPath);
    if (fs.existsSync(logoFile)) {
      doc.image(logoFile, 50, 20, { width: 80, height: 60, fit: [80, 60] });
      logoWidth = 100;
    }
  }

  // Nom entreprise dans le header
  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
    .text(settings?.companyName || 'Mon Entreprise', 50 + logoWidth, 30);
  doc.fontSize(9).font('Helvetica')
    .text(settings?.address || '', 50 + logoWidth, 52);

  // Type document
  doc.fontSize(24).font('Helvetica-Bold')
    .text(TYPE_LABELS[document.type] || 'DOCUMENT', 300, 25, { align: 'right', width: 245 });
  doc.fontSize(11).font('Helvetica')
    .text(`N° ${document.number}`, 300, 58, { align: 'right', width: 245 });

  let y = 120;

  // Infos document et client
  doc.fillColor('#000000');

  // Bloc client
  doc.rect(50, y, 240, 90).fill('#f8f9fa').stroke('#e0e0e0');
  y += 8;
  doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryColor)
    .text('FACTURÉ À', 60, y);
  y += 14;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
    .text(document.client?.companyName || document.client?.name, 60, y);
  y += 14;
  doc.fontSize(8).font('Helvetica').fillColor('#555555');
  if (document.client?.address) doc.text(document.client.address, 60, y), y += 11;
  if (document.client?.phone) doc.text(`Tél: ${document.client.phone}`, 60, y), y += 11;
  if (document.client?.email) doc.text(document.client.email, 60, y), y += 11;

  // Bloc dates
  let dy = 120;
  doc.rect(305, dy, 240, 90).fill('#f8f9fa').stroke('#e0e0e0');
  dy += 8;
  doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryColor).text('DÉTAILS', 315, dy);
  dy += 14;
  doc.fontSize(9).font('Helvetica').fillColor('#555555');
  doc.text(`Date d'émission: ${fmtDate(document.issuedDate)}`, 315, dy); dy += 14;
  if (document.dueDate) {
    doc.text(`Date d'échéance: ${fmtDate(document.dueDate)}`, 315, dy); dy += 14;
  }
  doc.text(`Statut: ${STATUS_LABELS[document.status] || document.status}`, 315, dy); dy += 14;

  y = Math.max(y, dy) + 20;

  // Tableau
  renderItemsTable(doc, document, y, primaryColor, true);
  y = doc.y + 20;

  // Totaux
  renderTotals(doc, document, y);

  // Notes
  if (document.notes) {
    y = doc.y + 25;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor).text('Notes:', 50, y);
    y += 14;
    doc.fontSize(9).font('Helvetica').fillColor('#555555').text(document.notes, 50, y, { width: 400 });
  }

  renderFooter(doc, settings);
}

// ─── Template Compact ────────────────────────────────────────────────────────
function renderCompact(doc, document, settings, primaryColor) {
  let y = 30;

  // En-tête compact sur 2 colonnes
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000')
    .text(settings?.companyName || 'Mon Entreprise', 50, y);
  doc.fontSize(16).font('Helvetica-Bold')
    .text(TYPE_LABELS[document.type] || 'DOCUMENT', 300, y, { align: 'right', width: 245 });

  y += 18;
  doc.fontSize(8).font('Helvetica').fillColor('#555555');
  if (settings?.phone) doc.text(`Tél: ${settings.phone}`, 50, y);
  doc.text(`N° ${document.number}`, 300, y, { align: 'right', width: 245 });
  y += 11;
  if (settings?.email) doc.text(settings.email, 50, y);
  doc.text(`Date: ${fmtDate(document.issuedDate)}`, 300, y, { align: 'right', width: 245 });
  y += 11;
  if (settings?.ninea) doc.text(`NINEA: ${settings.ninea}`, 50, y);
  if (document.dueDate) {
    doc.text(`Échéance: ${fmtDate(document.dueDate)}`, 300, y, { align: 'right', width: 245 });
  }

  y += 18;
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#999').stroke();
  y += 10;

  // Client compact
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000')
    .text('CLIENT: ', 50, y, { continued: true });
  doc.font('Helvetica')
    .text(`${document.client?.companyName || document.client?.name} | ${document.client?.address || ''} | ${document.client?.phone || ''}`);
  y = doc.y + 10;

  doc.moveTo(50, y).lineTo(545, y).strokeColor('#ccc').stroke();
  y += 10;

  renderItemsTable(doc, document, y, primaryColor, false, true);
  y = doc.y + 15;
  renderTotals(doc, document, y);

  if (document.notes) {
    y = doc.y + 15;
    doc.fontSize(8).font('Helvetica-Bold').text('Notes: ', 50, y, { continued: true });
    doc.font('Helvetica').fillColor('#555').text(document.notes);
  }

  renderFooter(doc, settings);
}

// ─── Tableau des lignes ──────────────────────────────────────────────────────
function renderItemsTable(doc, document, startY, primaryColor, colored = false, compact = false) {
  const fontSize = compact ? 8 : 9;
  const rowHeight = compact ? 16 : 20;
  const headerHeight = compact ? 18 : 22;

  const cols = {
    desc: { x: 50, w: 220 },
    qty: { x: 275, w: 50 },
    price: { x: 330, w: 90 },
    tva: { x: 425, w: 40 },
    total: { x: 470, w: 75 }
  };

  let y = startY;

  // En-tête tableau
  const headerBg = colored ? primaryColor : '#333333';
  doc.rect(50, y, 495, headerHeight).fill(headerBg);

  doc.fontSize(fontSize).font('Helvetica-Bold').fillColor('#ffffff');
  doc.text('Description', cols.desc.x + 4, y + (headerHeight - fontSize) / 2, { width: cols.desc.w - 4 });
  doc.text('Qté', cols.qty.x, y + (headerHeight - fontSize) / 2, { width: cols.qty.w, align: 'center' });
  doc.text('Prix U. (FCFA)', cols.price.x, y + (headerHeight - fontSize) / 2, { width: cols.price.w, align: 'right' });
  doc.text('TVA', cols.tva.x, y + (headerHeight - fontSize) / 2, { width: cols.tva.w, align: 'center' });
  doc.text('Total (FCFA)', cols.total.x, y + (headerHeight - fontSize) / 2, { width: cols.total.w, align: 'right' });

  y += headerHeight;

  // Lignes
  document.items.forEach((item, i) => {
    const bg = i % 2 === 0 ? '#ffffff' : '#f9f9f9';
    doc.rect(50, y, 495, rowHeight).fill(bg).stroke('#e5e5e5');

    const ht = item.quantity * item.unitPrice;

    doc.fontSize(fontSize).font('Helvetica').fillColor('#333333');
    doc.text(item.description, cols.desc.x + 4, y + (rowHeight - fontSize) / 2,
      { width: cols.desc.w - 8, ellipsis: true });
    doc.text(String(item.quantity), cols.qty.x, y + (rowHeight - fontSize) / 2,
      { width: cols.qty.w, align: 'center' });
    doc.text(fmtNum(item.unitPrice), cols.price.x, y + (rowHeight - fontSize) / 2,
      { width: cols.price.w, align: 'right' });
    doc.text(`${item.tvaRate}%`, cols.tva.x, y + (rowHeight - fontSize) / 2,
      { width: cols.tva.w, align: 'center' });
    doc.text(fmtNum(item.subtotal), cols.total.x, y + (rowHeight - fontSize) / 2,
      { width: cols.total.w, align: 'right' });

    y += rowHeight;
  });

  doc.y = y;
}

// ─── Totaux ──────────────────────────────────────────────────────────────────
function renderTotals(doc, document, startY) {
  let y = startY;
  const x = 350;
  const w = 195;

  const line = (label, value, bold = false) => {
    if (bold) {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
        .text(label, x, y, { width: 100 })
        .text(value, x + 100, y, { width: 95, align: 'right' });
    } else {
      doc.fontSize(9).font('Helvetica').fillColor('#555555')
        .text(label, x, y, { width: 100 })
        .text(value, x + 100, y, { width: 95, align: 'right' });
    }
    y += 16;
  };

  if (document.discount > 0) {
    line('Total HT (brut):', fmtNum(document.totalHt / (1 - document.discount / 100)));
    line(`Remise (${document.discount}%):`, `-${fmtNum(document.totalHt * document.discount / (100 - document.discount))}`);
  }
  line('Total HT:', fmt(document.totalHt));
  line(`TVA:`, fmt(document.totalTva));

  doc.moveTo(x, y).lineTo(x + w, y).strokeColor('#333333').lineWidth(1).stroke();
  y += 5;
  doc.lineWidth(0.5);
  line('TOTAL TTC:', fmt(document.totalTtc), true);

  doc.y = y;
}

// ─── Pied de page ────────────────────────────────────────────────────────────
function renderFooter(doc, settings) {
  const pageHeight = doc.page.height;
  // Footer commence à pageHeight - 100 pour que les 3 lignes (y+8, y+20, y+32)
  // restent dans la marge basse A4 (841.89 - 50 = 791.89pt)
  const y = pageHeight - 100;

  // Signature
  if (settings?.signaturePath) {
    const sigFile = path.join(__dirname, '../../', settings.signaturePath);
    if (fs.existsSync(sigFile)) {
      doc.image(sigFile, 380, y - 40, { width: 120, height: 40, fit: [120, 40] });
    }
  }

  doc.moveTo(50, y).lineTo(545, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
  doc.fontSize(7).font('Helvetica').fillColor('#999999')
    .text(
      `${settings?.companyName || 'FactureApp'} | ${settings?.address || ''} | ${settings?.phone || ''} | ${settings?.email || ''}`,
      50, y + 8, { align: 'center', width: 495 }
    );
  if (settings?.ninea) {
    doc.text(`NINEA: ${settings.ninea} | ${settings?.website || ''}`,
      50, y + 20, { align: 'center', width: 495 });
  }
  doc.text('Document généré par FactureApp', 50, y + 32, { align: 'center', width: 495 });
}

const fmtNum = (n) => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

module.exports = { generatePDF };
