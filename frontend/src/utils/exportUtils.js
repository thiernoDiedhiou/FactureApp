import * as XLSX from 'xlsx';

/**
 * Export vers Excel (.xlsx) avec largeurs de colonnes auto
 * @param {string[][]} rows  - tableau de lignes (en-tête inclus en première position)
 * @param {number[]}   widths - largeurs en caractères pour chaque colonne
 * @param {string}     filename - nom du fichier (sans extension)
 */
export function exportXLSX(rows, widths, filename) {
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Largeurs de colonnes
  ws['!cols'] = widths.map(w => ({ wch: w }));

  // En-têtes en gras
  const headerKeys = Object.keys(ws).filter(k => !k.startsWith('!') && ws[k].r === 0);
  headerKeys.forEach(k => {
    if (!ws[k].s) ws[k].s = {};
    ws[k].s.font = { bold: true };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Export');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export CSV UTF-8 (compatible Excel FR avec BOM + séparateur ;)
 */
export function exportCSV(rows, filename) {
  const BOM = '﻿';
  const content = rows.map(r =>
    r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')
  ).join('\n');
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
