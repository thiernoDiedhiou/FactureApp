import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Edit, Download, Mail, Copy, ArrowRightLeft,
  CheckCircle, XCircle, Clock, Printer, Trash2, Send
} from 'lucide-react';
import api from '../../utils/api';
import { formatDate, formatDateLong } from '../../utils/dateUtils';
import { useSettings, useFormatCurrency } from '../../contexts/SettingsContext';

const STATUS_BADGES = { paye: 'badge-paye', en_attente: 'badge-en_attente', annule: 'badge-annule' };
const STATUS_LABELS = { paye: 'Payé', en_attente: 'En attente', annule: 'Annulé' };
const TYPE_LABELS = { facture: 'FACTURE', devis: 'DEVIS', proforma: 'FACTURE PROFORMA' };

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const formatAmount = useFormatCurrency();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailModal, setEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [convertType, setConvertType] = useState('');

  const loadDoc = async () => {
    try {
      const { data } = await api.get(`/documents/${id}`);
      setDoc(data.data.document);
      const d = data.data.document;
      setEmailForm(prev => ({
        to: d.client?.email || '',
        subject: `${TYPE_LABELS[d.type]} N° ${d.number}`,
        body: ''
      }));
    } catch {
      toast.error('Document non trouvé');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDoc(); }, [id]);

  const handleStatusChange = async (status) => {
    try {
      await api.patch(`/documents/${id}/status`, { status });
      toast.success(t('documents.statusUpdated'));
      loadDoc();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const response = await api.get(`/documents/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.number}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF téléchargé');
    } catch {
      toast.error('Erreur génération PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleWhatsApp = async () => {
    const typeLabel = TYPE_LABELS[doc.type] || doc.type;
    const clientName = doc.client?.name || '';
    const total = formatAmount(doc.totalTtc);
    // Numéro en format international sans +, ex: 221771234567
    const rawPhone = doc.client?.phone?.replace(/[\s\-().]/g, '') || '';
    const phone = rawPhone.startsWith('+') ? rawPhone.slice(1) : rawPhone;
    const message = `Bonjour${clientName ? ` ${clientName}` : ''},\n\nVeuillez trouver en pièce jointe votre ${typeLabel} N° ${doc.number} d'un montant de ${total}.\n\nCordialement,`;

    // Essai partage natif avec le fichier PDF (fonctionne sur mobile)
    if (navigator.canShare) {
      try {
        setDownloadingPDF(true);
        const response = await api.get(`/documents/${id}/pdf`, { responseType: 'blob' });
        const file = new File([response.data], `${doc.number}.pdf`, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: message });
          return;
        }
      } catch {
        // Ignoré — on tombe sur le fallback
      } finally {
        setDownloadingPDF(false);
      }
    }

    // Fallback : lien wa.me avec message texte (desktop / navigateurs sans Web Share)
    const encoded = encodeURIComponent(message);
    const url = phone
      ? `https://wa.me/${phone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.to) return;
    setSendingEmail(true);
    try {
      await api.post(`/documents/${id}/email`, emailForm);
      toast.success(t('documents.emailSent'));
      setEmailModal(false);
      loadDoc();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur envoi email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleConvert = async () => {
    if (!convertType) return;
    try {
      const { data } = await api.post(`/documents/${id}/convert`, { type: convertType });
      toast.success(`Converti en ${convertType}`);
      navigate(`/documents/${data.data.document.id}`);
    } catch (err) {
      toast.error('Erreur conversion');
    }
  };

  const handleDuplicate = async () => {
    try {
      const { data } = await api.post(`/documents/${id}/duplicate`);
      toast.success(t('documents.duplicated'));
      navigate(`/documents/${data.data.document.id}`);
    } catch {
      toast.error('Erreur duplication');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!doc) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/documents" className="btn-secondary px-3 py-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{doc.number}</h1>
              <span className={STATUS_BADGES[doc.status]}>{STATUS_LABELS[doc.status]}</span>
              <span className={`badge-${doc.type}`}>{TYPE_LABELS[doc.type]}</span>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Émis le {formatDateLong(doc.issuedDate)}
              {doc.dueDate && ` • Échéance ${formatDateLong(doc.dueDate)}`}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button onClick={handleDownloadPDF} disabled={downloadingPDF}
            className="btn-secondary">
            <Download className="w-4 h-4" />
            {downloadingPDF ? 'Génération...' : 'PDF'}
          </button>
          <button onClick={() => setEmailModal(true)} className="btn-secondary">
            <Mail className="w-4 h-4" /> Email
          </button>
          <button onClick={handleWhatsApp} className="btn-secondary !text-green-600 !border-green-200 hover:!bg-green-50">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>
          <button onClick={handleDuplicate} className="btn-secondary">
            <Copy className="w-4 h-4" /> Dupliquer
          </button>
          <Link to={`/documents/${id}/edit`} className="btn-secondary">
            <Edit className="w-4 h-4" /> Modifier
          </Link>
        </div>
      </div>

      {/* Status actions */}
      {doc.type === 'facture' && (
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Changer le statut :</span>
          {doc.status !== 'paye' && (
            <button onClick={() => handleStatusChange('paye')}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
              <CheckCircle className="w-4 h-4" /> Marquer payé
            </button>
          )}
          {doc.status !== 'en_attente' && (
            <button onClick={() => handleStatusChange('en_attente')}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors">
              <Clock className="w-4 h-4" /> En attente
            </button>
          )}
          {doc.status !== 'annule' && (
            <button onClick={() => handleStatusChange('annule')}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
              <XCircle className="w-4 h-4" /> Annuler
            </button>
          )}
        </div>
      )}

      {/* Convert */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4" /> Convertir en :
        </span>
        <select className="input-field w-auto text-sm" value={convertType}
          onChange={(e) => setConvertType(e.target.value)}>
          <option value="">Choisir...</option>
          {doc.type !== 'facture' && <option value="facture">Facture</option>}
          {doc.type !== 'devis' && <option value="devis">Devis</option>}
          {doc.type !== 'proforma' && <option value="proforma">Proforma</option>}
        </select>
        <button onClick={handleConvert} disabled={!convertType} className="btn-primary text-sm px-3 py-1.5 disabled:opacity-40">
          Convertir
        </button>
      </div>

      {/* Document body */}
      <div className="card overflow-hidden">
        {/* Preview header */}
        <div className="p-8 border-b border-gray-100" style={{ borderTop: `4px solid ${settings.primaryColor || '#0EA5E9'}` }}>
          <div className="flex justify-between items-start">
            {/* Company info */}
            <div>
              {settings.logoPath && (
                <img src={settings.logoPath} alt="Logo" className="h-16 mb-3 object-contain" />
              )}
              <h2 className="font-bold text-xl text-gray-900">{settings.companyName || 'Mon Entreprise'}</h2>
              <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                {settings.address && <p>{settings.address}</p>}
                {settings.phone && <p>Tél: {settings.phone}</p>}
                {settings.email && <p>{settings.email}</p>}
                {settings.ninea && <p>NINEA: {settings.ninea}</p>}
              </div>
            </div>

            {/* Document type & number */}
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: settings.primaryColor || '#0EA5E9' }}>
                {TYPE_LABELS[doc.type]}
              </p>
              <p className="text-gray-700 font-medium mt-1">N° {doc.number}</p>
              <p className="text-gray-500 text-sm mt-1">Date: {formatDate(doc.issuedDate)}</p>
              {doc.dueDate && <p className="text-gray-500 text-sm">Échéance: {formatDate(doc.dueDate)}</p>}
              {doc.paidAt && <p className="text-green-600 text-sm font-medium">Payé le: {formatDate(doc.paidAt)}</p>}
            </div>
          </div>

          {/* Client */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl inline-block min-w-56">
            <p className="text-xs font-medium text-gray-400 uppercase mb-2">Facturé à</p>
            <p className="font-bold text-gray-900">{doc.client?.companyName || doc.client?.name}</p>
            {doc.client?.companyName && doc.client?.name !== doc.client?.companyName && (
              <p className="text-sm text-gray-600">{doc.client?.name}</p>
            )}
            {doc.client?.address && <p className="text-sm text-gray-500 mt-1">{doc.client?.address}</p>}
            {doc.client?.phone && <p className="text-sm text-gray-500">Tél: {doc.client?.phone}</p>}
            {doc.client?.email && <p className="text-sm text-gray-500">{doc.client?.email}</p>}
            {doc.client?.ninea && <p className="text-sm text-gray-500">NINEA: {doc.client?.ninea}</p>}
          </div>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: settings.primaryColor || '#0EA5E9' }}>
                <th className="text-left px-6 py-3 text-xs font-medium text-white">Description</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-white">Qté</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-white">Prix HT</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-white">TVA</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-white">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doc.items?.map((item, i) => (
                <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{item.description}</p>
                    {item.product?.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.product.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-600">{item.quantity}</td>
                  <td className="px-4 py-4 text-right text-sm text-gray-600">{formatAmount(item.unitPrice)}</td>
                  <td className="px-4 py-4 text-center text-sm text-gray-600">{item.tvaRate}%</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">{formatAmount(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end p-6 border-t border-gray-100">
          <div className="w-72 space-y-2">
            {doc.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Remise ({doc.discount}%)</span>
                <span className="text-red-600 font-medium">
                  -{formatAmount(doc.totalHt * doc.discount / (100 - doc.discount))}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total HT</span>
              <span className="font-medium">{formatAmount(doc.totalHt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">TVA</span>
              <span className="font-medium">{formatAmount(doc.totalTva)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3">
              <span>Total TTC</span>
              <span style={{ color: settings.primaryColor || '#0EA5E9' }}>{formatAmount(doc.totalTtc)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {doc.notes && (
          <div className="px-6 pb-6">
            <p className="text-xs font-medium text-gray-400 uppercase mb-2">Notes</p>
            <p className="text-sm text-gray-600 whitespace-pre-line">{doc.notes}</p>
          </div>
        )}

        {/* Signature */}
        {settings.signaturePath && (
          <div className="flex justify-end px-6 pb-6">
            <img src={settings.signaturePath} alt="Signature" className="h-20 object-contain" />
          </div>
        )}
      </div>

      {/* Email history */}
      {doc.emailLogs?.length > 0 && (
        <div className="card p-6">
          <h2 className="section-title mb-4">Historique des envois</h2>
          <div className="space-y-2">
            {doc.emailLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                <Send className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-700">{log.sentTo}</span>
                <span className="text-gray-400">—</span>
                <span className="text-gray-500 flex-1 truncate">{log.subject}</span>
                <span className="text-gray-400 text-xs whitespace-nowrap">{formatDate(log.sentAt)}</span>
                <span className={`text-xs font-medium ${log.status === 'sent' ? 'text-green-600' : 'text-red-600'}`}>
                  {log.status === 'sent' ? '✓ Envoyé' : '✗ Échec'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email modal */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Envoyer par email</h3>
              <button onClick={() => setEmailModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <div>
                <label className="label">Destinataire *</label>
                <input type="email" className="input-field" required
                  value={emailForm.to}
                  onChange={(e) => setEmailForm(f => ({ ...f, to: e.target.value }))}
                  placeholder="client@exemple.sn" />
              </div>
              <div>
                <label className="label">Objet *</label>
                <input type="text" className="input-field" required
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div>
                <label className="label">Message (optionnel)</label>
                <textarea className="input-field resize-none" rows={4}
                  value={emailForm.body}
                  onChange={(e) => setEmailForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Le message par défaut sera utilisé si vide..." />
              </div>
              <p className="text-xs text-gray-400">Le PDF sera joint automatiquement.</p>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setEmailModal(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary" disabled={sendingEmail}>
                  {sendingEmail ? 'Envoi...' : <><Send className="w-4 h-4" /> Envoyer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
