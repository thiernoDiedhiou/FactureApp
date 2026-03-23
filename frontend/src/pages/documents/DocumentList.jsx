import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Plus, Search, Filter, Eye, Edit, Trash2, Download,
  FileText, ChevronLeft, ChevronRight, Copy, ArrowRightLeft
} from 'lucide-react';
import api from '../../utils/api';
import { formatDate, isOverdue } from '../../utils/dateUtils';
import { useFormatCurrency } from '../../contexts/SettingsContext';

const STATUS_BADGES = { paye: 'badge-paye', en_attente: 'badge-en_attente', annule: 'badge-annule' };
const STATUS_LABELS = { paye: 'Payé', en_attente: 'En attente', annule: 'Annulé' };
const TYPE_LABELS = { facture: 'Facture', devis: 'Devis', proforma: 'Proforma' };

export default function DocumentList() {
  const { t } = useTranslation();
  const formatAmount = useFormatCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
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
    } catch (err) {
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
      const response = await api.get(`/documents/${doc.id}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.number}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Erreur génération PDF');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const { data } = await api.post(`/documents/${id}/duplicate`);
      toast.success(t('documents.duplicated'));
      loadDocs();
    } catch (err) {
      toast.error('Erreur duplication');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('documents.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{pagination.total || 0} document(s)</p>
        </div>
        <Link to="/documents/new" className="btn-primary">
          <Plus className="w-4 h-4" /> {t('documents.new')}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('documents.search')}
            className="input-field pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input-field w-auto" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">Tous types</option>
          <option value="facture">Factures</option>
          <option value="devis">Devis</option>
          <option value="proforma">Proforma</option>
        </select>
        <select className="input-field w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Tous statuts</option>
          <option value="en_attente">En attente</option>
          <option value="paye">Payé</option>
          <option value="annule">Annulé</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">{t('documents.noDocuments')}</p>
            <Link to="/documents/new" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" /> {t('documents.new')}
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Numéro</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Type</th>
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
                      <tr key={doc.id} className={`hover:bg-gray-50 transition-colors group ${overdue ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <Link to={`/documents/${doc.id}`} className="font-medium text-primary-600 text-sm hover:underline">
                            {doc.number}
                          </Link>
                          {overdue && (
                            <span className="ml-1 text-xs text-red-500">⚠ Retard</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {doc.client?.companyName || doc.client?.name}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`badge-${doc.type}`}>{TYPE_LABELS[doc.type]}</span>
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
                          <span className={STATUS_BADGES[doc.status]}>
                            {STATUS_LABELS[doc.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={`/documents/${doc.id}`}
                              className="p-1.5 rounded hover:bg-blue-50 hover:text-blue-600 text-gray-400" title="Voir">
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link to={`/documents/${doc.id}/edit`}
                              className="p-1.5 rounded hover:bg-primary-50 hover:text-primary-600 text-gray-400" title="Modifier">
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button onClick={() => handleDownloadPDF(doc)}
                              className="p-1.5 rounded hover:bg-green-50 hover:text-green-600 text-gray-400" title="Télécharger PDF">
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
                  <button onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
