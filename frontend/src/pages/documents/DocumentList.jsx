import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Plus, Search, Eye, Edit, Trash2, Download,
  FileText, ChevronLeft, ChevronRight, Copy, FileDown, X,
  AlertTriangle, Calendar
} from 'lucide-react';
import api from '../../utils/api';
import { formatDate, isOverdue } from '../../utils/dateUtils';
import { useFormatCurrency } from '../../contexts/SettingsContext';
import { exportXLSX } from '../../utils/exportUtils';

const STATUS_BADGES  = { paye: 'badge-paye', en_attente: 'badge-en_attente', annule: 'badge-annule' };
const STATUS_LABELS  = { paye: 'Payé', en_attente: 'En attente', annule: 'Annulé' };
const TYPE_LABELS    = { facture: 'Facture', devis: 'Devis', proforma: 'Proforma' };
const TYPE_COLORS    = {
  facture:  'bg-blue-100 text-blue-700',
  devis:    'bg-purple-100 text-purple-700',
  proforma: 'bg-amber-100 text-amber-700'
};

export default function DocumentList() {
  const { t } = useTranslation();
  const formatAmount = useFormatCurrency();
  const [searchParams] = useSearchParams();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/documents', {
        params: { search, type, status, page, limit: 10 }
      });
      setDocs(data.data.documents);
      setPagination(data.data.pagination);
    } catch {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [search, type, status, page]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/documents/${id}`);
      toast.success(t('documents.deleted'));
      loadDocs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression');
    } finally {
      setDeleteId(null);
    }
  };

  const handleDownloadPDF = async (doc) => {
    try {
      const response = await api.get(`/documents/${doc.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.number}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Erreur génération PDF');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/documents/${id}/duplicate`);
      toast.success(t('documents.duplicated'));
      loadDocs();
    } catch {
      toast.error('Erreur duplication');
    }
  };

  const exportCSV = async () => {
    try {
      const { data } = await api.get('/documents', {
        params: { search, type, status, limit: 1000 }
      });
      const all = data.data.documents;
      const header = ['Numéro', 'Type', 'Client', 'Date émission', 'Date échéance', 'Montant HT (FCFA)', 'TVA (FCFA)', 'Montant TTC (FCFA)', 'Statut'];
      const rows = all.map(d => [
        d.number,
        TYPE_LABELS[d.type] || d.type,
        d.client?.companyName || d.client?.name || '',
        d.issuedDate ? new Date(d.issuedDate).toLocaleDateString('fr-FR') : '',
        d.dueDate    ? new Date(d.dueDate).toLocaleDateString('fr-FR') : '',
        Math.round(d.totalHt  || 0),
        Math.round(d.totalTax || 0),
        Math.round(d.totalTtc || 0),
        STATUS_LABELS[d.status] || d.status
      ]);
      exportXLSX([header, ...rows], [16, 12, 28, 15, 15, 18, 14, 18, 12],
        `export_comptable_${new Date().toISOString().slice(0, 10)}`);
      toast.success(`${all.length} document(s) exporté(s)`);
    } catch {
      toast.error('Erreur lors de l\'export');
    }
  };

  const clearSearch = () => { setSearch(''); setPage(1); };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{t('documents.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total || 0} document{(pagination.total || 0) > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={!pagination.total}
            className="btn-secondary disabled:opacity-40"
            title="Export comptable Excel"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          <Link to="/app/documents/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            <span>{t('documents.new')}</span>
          </Link>
        </div>
      </div>

      {/* Filtres — une seule ligne */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher…"
            className={`input-field pl-9 w-full ${search ? 'pr-9' : ''}`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select className="input-field w-auto flex-shrink-0 text-sm" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">Type</option>
          <option value="facture">Factures</option>
          <option value="devis">Devis</option>
          <option value="proforma">Proforma</option>
        </select>
        <select className="input-field w-auto flex-shrink-0 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Statut</option>
          <option value="en_attente">En attente</option>
          <option value="paye">Payé</option>
          <option value="annule">Annulé</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-16 h-16 mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">{t('documents.noDocuments')}</p>
          <Link to="/app/documents/new" className="btn-primary mt-4 inline-flex">
            <Plus className="w-4 h-4" /> {t('documents.new')}
          </Link>
        </div>
      ) : (
        <>
          {/* ── Vue mobile : cards ── */}
          <div className="sm:hidden space-y-3">
            {docs.map(doc => {
              const overdue = doc.type === 'facture' && doc.status === 'en_attente' && isOverdue(doc.dueDate);
              return (
                <div
                  key={doc.id}
                  className={`bg-white rounded-2xl border shadow-sm p-4 space-y-3 ${overdue ? 'border-red-200 bg-red-50/20' : 'border-gray-100'}`}
                >
                  {/* Ligne 1 : numéro + type + statut */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/app/documents/${doc.id}`}
                        className="font-bold text-primary-600 text-sm hover:underline"
                      >
                        {doc.number}
                      </Link>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[doc.type]}`}>
                        {TYPE_LABELS[doc.type]}
                      </span>
                      {overdue && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertTriangle className="w-3 h-3" /> Retard
                        </span>
                      )}
                    </div>
                    <span className={STATUS_BADGES[doc.status]}>
                      {STATUS_LABELS[doc.status]}
                    </span>
                  </div>

                  {/* Ligne 2 : client + montant */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700 font-medium">
                      {doc.client?.companyName || doc.client?.name || '—'}
                    </p>
                    <p className="text-base font-bold text-gray-900 whitespace-nowrap">
                      {formatAmount(doc.totalTtc)}
                    </p>
                  </div>

                  {/* Ligne 3 : dates */}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {doc.issuedDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(doc.issuedDate)}
                      </span>
                    )}
                    {doc.dueDate && (
                      <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
                        Éch. {formatDate(doc.dueDate)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-x-3 gap-y-2 flex-wrap">
                      <Link to={`/app/documents/${doc.id}`}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary-600">
                        <Eye className="w-3.5 h-3.5" /> Voir
                      </Link>
                      <Link to={`/app/documents/${doc.id}/edit`}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <Edit className="w-3.5 h-3.5" /> Modifier
                      </Link>
                      <button onClick={() => handleDownloadPDF(doc)}
                        className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                      <button onClick={() => handleDuplicate(doc.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-purple-600">
                        <Copy className="w-3.5 h-3.5" /> Dupliquer
                      </button>
                      {deleteId === doc.id ? (
                        <div className="flex gap-1 ml-auto">
                          <button onClick={() => handleDelete(doc.id)}
                            className="px-2.5 py-1 text-xs bg-red-600 text-white rounded-lg">Oui</button>
                          <button onClick={() => setDeleteId(null)}
                            className="px-2.5 py-1 text-xs bg-gray-200 rounded-lg">Non</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(doc.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-red-500 ml-auto">
                          <Trash2 className="w-3.5 h-3.5" /> Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Vue desktop : table ── */}
          <div className="hidden sm:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Numéro</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Échéance</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Montant TTC</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {docs.map(doc => {
                    const overdue = doc.type === 'facture' && doc.status === 'en_attente' && isOverdue(doc.dueDate);
                    return (
                      <tr key={doc.id} className={`hover:bg-gray-50 transition-colors ${overdue ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <Link to={`/app/documents/${doc.id}`} className="font-medium text-primary-600 text-sm hover:underline">
                            {doc.number}
                          </Link>
                          {overdue && <span className="ml-1 text-xs text-red-500">⚠ Retard</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {doc.client?.companyName || doc.client?.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[doc.type]}`}>
                            {TYPE_LABELS[doc.type]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                          {formatDate(doc.issuedDate)}
                        </td>
                        <td className={`px-4 py-3 text-sm hidden lg:table-cell ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {doc.dueDate ? formatDate(doc.dueDate) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-sm text-gray-900 whitespace-nowrap">
                          {formatAmount(doc.totalTtc)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={STATUS_BADGES[doc.status]}>{STATUS_LABELS[doc.status]}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/app/documents/${doc.id}`}
                              className="p-1.5 rounded hover:bg-blue-50 hover:text-blue-600 text-gray-400" title="Voir">
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link to={`/app/documents/${doc.id}/edit`}
                              className="p-1.5 rounded hover:bg-primary-50 hover:text-primary-600 text-gray-400" title="Modifier">
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button onClick={() => handleDownloadPDF(doc)}
                              className="p-1.5 rounded hover:bg-green-50 hover:text-green-600 text-gray-400" title="PDF">
                              <Download className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDuplicate(doc.id)}
                              className="p-1.5 rounded hover:bg-purple-50 hover:text-purple-600 text-gray-400" title="Dupliquer">
                              <Copy className="w-4 h-4" />
                            </button>
                            {deleteId === doc.id ? (
                              <div className="flex gap-1">
                                <button onClick={() => handleDelete(doc.id)}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded">Oui</button>
                                <button onClick={() => setDeleteId(null)}
                                  className="px-2 py-1 text-xs bg-gray-200 rounded">Non</button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteId(doc.id)}
                                className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 text-gray-400" title="Supprimer">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page {pagination.page} / {pagination.pages} — {pagination.total} résultats
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pagination mobile */}
          {pagination.pages > 1 && (
            <div className="sm:hidden flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {pagination.page} / {pagination.pages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
