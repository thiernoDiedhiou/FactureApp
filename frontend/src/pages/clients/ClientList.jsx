import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Plus, Search, Edit, Trash2, Eye, Building2,
  Phone, Mail, Upload, ChevronLeft, ChevronRight,
  Users, Download, FileDown, Loader2, X
} from 'lucide-react';
import api from '../../utils/api';
import { exportXLSX, exportCSV } from '../../utils/exportUtils';
import { SkeletonClientCard } from '../../components/Skeleton';
import { useConfirm } from '../../contexts/ConfirmContext';

const CSV_TEMPLATE_HEADERS = ['nom', 'entreprise', 'email', 'telephone', 'adresse', 'ninea'];
const CSV_TEMPLATE_EXAMPLE = ['Moussa Diop', 'Entreprise Diop SARL', 'moussa@exemple.sn', '+221771234567', '12 rue des Fleurs Dakar', 'SN2024001234'];

function ImportModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith('.csv')) { toast.error('Veuillez sélectionner un fichier .csv'); return; }
    if (f.size > 2 * 1024 * 1024) { toast.error('Fichier trop volumineux (max 2 Mo)'); return; }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/clients/import/csv', formData, {
        headers: { 'Content-Type': undefined } // laisser axios définir le boundary multipart
      });
      toast.success(`${data.data.imported} client(s) importé(s) avec succès`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'import CSV');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    exportCSV([CSV_TEMPLATE_HEADERS, CSV_TEMPLATE_EXAMPLE], 'modele_clients_cfacture');
    toast.success('Modèle CSV téléchargé');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Importer des clients depuis un fichier CSV</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <label
            className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${
              dragOver ? 'border-primary-400 bg-primary-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className={`w-8 h-8 ${file ? 'text-green-500' : 'text-gray-400'}`} />
            {file ? (
              <div className="text-center">
                <p className="text-sm font-medium text-green-700">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} Ko — prêt à importer</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Cliquer pour choisir un fichier CSV</p>
                <p className="text-xs text-gray-400 mt-1">Format : UTF-8, séparateur point-virgule (;), max 2 Mo</p>
              </div>
            )}
            <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>

          {/* Template download */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
            <FileDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-500">Besoin du format exact ?</span>
            <button onClick={downloadTemplate} className="text-sm text-primary-600 font-medium hover:underline">
              Télécharger le modèle CSV
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Annuler</button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="btn-primary flex-1 justify-center disabled:opacity-50"
          >
            {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importation...</> : 'Importer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientList() {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => {
    setSearching(search.length > 0);
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/clients', { params: { search: debouncedSearch, page, limit: 10 } });
      setClients(data.data.clients);
      setPagination(data.data.pagination);
    } catch {
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => { loadClients(); }, [loadClients]);

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Supprimer ce client ?',
      message: 'Cette action est irréversible.',
      danger: true,
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success(t('clients.deleted'));
      loadClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression');
    }
  };

  const exportClients = async () => {
    try {
      const { data } = await api.get('/clients', { params: { search, limit: 1000 } });
      const all = data.data.clients;
      const header = ['Nom', 'Entreprise', 'Email', 'Téléphone', 'Adresse', 'NINEA'];
      const rows = all.map(c => [
        c.name, c.companyName || '', c.email || '',
        c.phone || '', c.address || '', c.ninea || ''
      ]);
      exportXLSX(
        [header, ...rows],
        [25, 25, 30, 18, 35, 18],
        `clients_${new Date().toISOString().slice(0, 10)}`
      );
      toast.success(`${all.length} client(s) exporté(s)`);
    } catch {
      toast.error('Erreur lors de l\'export');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {showImportModal && (
        <ImportModal onClose={() => setShowImportModal(false)} onSuccess={loadClients} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('clients.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total || 0} client{(pagination.total || 0) > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportClients}
            disabled={!pagination.total}
            className="btn-secondary disabled:opacity-40"
            title="Exporter en Excel"
          >
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
          <button onClick={() => setShowImportModal(true)} className="btn-secondary">
            <Upload className="w-4 h-4" />
            <span>Importer</span>
          </button>
          <Link to="/app/clients/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            <span>{t('clients.new')}</span>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('clients.search')}
          className={`input-field pl-9 w-full ${search ? 'pr-9' : ''}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
        {!searching && search && (
          <button
            onClick={() => { setSearch(''); setDebouncedSearch(''); setPage(1); setSearching(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading ? (
        <>
          <div className="sm:hidden space-y-3">
            {[...Array(5)].map((_, i) => <SkeletonClientCard key={i} />)}
          </div>
          <div className="hidden sm:block card overflow-hidden">
            <div className="divide-y divide-gray-100">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-9 h-9 skeleton-shimmer rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="w-36 h-4 skeleton-shimmer rounded" />
                    <div className="w-24 h-3 skeleton-shimmer rounded" />
                  </div>
                  <div className="w-48 h-4 skeleton-shimmer rounded hidden lg:block" />
                  <div className="w-7 h-7 skeleton-shimmer rounded-full" />
                  <div className="w-24 h-4 skeleton-shimmer rounded ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : clients.length === 0 ? (
        <div className="card text-center py-16 px-8">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-primary-50 flex items-center justify-center">
            <Users className="w-10 h-10 text-primary-300" />
          </div>
          {search ? (
            <>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun résultat</h3>
              <p className="text-sm text-gray-400 mb-5">Aucun client ne correspond à votre recherche.</p>
              <button onClick={() => setSearch('')} className="btn-secondary">Effacer la recherche</button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun client pour l'instant</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                Ajoutez vos clients pour créer des factures rapidement.
              </p>
              <Link to="/app/clients/new" className="btn-primary inline-flex">
                <Plus className="w-4 h-4" /> Ajouter un client
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          {/* ── Vue mobile : cards ── */}
          <div className="sm:hidden space-y-3">
            {clients.map((client, idx) => (
              <div key={client.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-fade-up stagger-${Math.min(idx + 1, 6)}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-700 font-bold">{client.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{client.name}</p>
                      {client.companyName && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                          <Building2 className="w-3 h-3 flex-shrink-0" /> {client.companyName}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
                    {client._count?.documents || 0}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  {client.phone && (
                    <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-primary-600">
                      <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {client.phone}
                    </a>
                  )}
                  {client.email && (
                    <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-xs text-gray-500 truncate hover:text-primary-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {client.email}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                  <Link to={`/app/clients/${client.id}`}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary-600">
                    <Eye className="w-3.5 h-3.5" /> Voir
                  </Link>
                  <Link to={`/app/clients/${client.id}/edit`}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <Edit className="w-3.5 h-3.5" /> Modifier
                  </Link>
                  <button onClick={() => handleDelete(client.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-500 ml-auto">
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Vue desktop : table ── */}
          <div className="hidden sm:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">NINEA</th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Docs</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clients.map(client => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-700 font-bold text-sm">{client.name.charAt(0).toUpperCase()}</span>
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
                      <td className="px-6 py-4">
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
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/app/clients/${client.id}`}
                            className="p-1.5 rounded hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors" title="Voir">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link to={`/app/clients/${client.id}/edit`}
                            className="p-1.5 rounded hover:bg-primary-50 hover:text-primary-600 text-gray-400 transition-colors" title="Modifier">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleDelete(client.id)}
                            className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
