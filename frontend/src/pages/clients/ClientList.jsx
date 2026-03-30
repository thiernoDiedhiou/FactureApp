import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Plus, Search, Edit, Trash2, Eye, Building2,
  Phone, Mail, Upload, ChevronLeft, ChevronRight, Users
} from 'lucide-react';
import api from '../../utils/api';

export default function ClientList() {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [importing, setImporting] = useState(false);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/clients', {
        params: { search, page, limit: 10 }
      });
      setClients(data.data.clients);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { loadClients(); }, [loadClients]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/clients/${id}`);
      toast.success(t('clients.deleted'));
      loadClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression');
    } finally {
      setDeleteId(null);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/clients/import/csv', formData);
      toast.success(`${data.data.imported} client(s) importé(s)`);
      loadClients();
    } catch (err) {
      toast.error('Erreur lors de l\'import CSV');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('clients.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total || 0} client(s) au total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="btn-secondary cursor-pointer">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{t('clients.importCSV')}</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <Link to="/app/clients/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            {t('clients.new')}
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('clients.search')}
          className="input-field pl-9 max-w-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">{t('clients.noClients')}</p>
            <Link to="/app/clients/new" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" /> {t('clients.new')}
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Contact</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">NINEA</th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Docs</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clients.map(client => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-700 font-bold text-sm">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{client.name}</p>
                            {client.companyName && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3" /> {client.companyName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="space-y-0.5">
                          {client.phone && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {client.phone}
                            </p>
                          )}
                          {client.email && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {client.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-xs text-gray-400">{client.ninea || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                          {client._count?.documents || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/app/clients/${client.id}`}
                            className="p-1.5 rounded hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors" title="Voir">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link to={`/app/clients/${client.id}/edit`}
                            className="p-1.5 rounded hover:bg-primary-50 hover:text-primary-600 text-gray-400 transition-colors" title="Modifier">
                            <Edit className="w-4 h-4" />
                          </Link>
                          {deleteId === client.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleDelete(client.id)}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">
                                Oui
                              </button>
                              <button onClick={() => setDeleteId(null)}
                                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                                Non
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteId(client.id)}
                              className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page {pagination.page} / {pagination.pages} — {pagination.total} résultats
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                  >
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
