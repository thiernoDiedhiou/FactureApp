import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Building2, Hash, FileText, Plus } from 'lucide-react';
import api from '../../utils/api';
import { formatDate } from '../../utils/dateUtils';
import { useFormatCurrency } from '../../contexts/SettingsContext';

const STATUS_BADGES = { paye: 'badge-paye', en_attente: 'badge-en_attente', annule: 'badge-annule' };
const STATUS_LABELS = { paye: 'Payé', en_attente: 'En attente', annule: 'Annulé' };
const TYPE_LABELS = { facture: 'Facture', devis: 'Devis', proforma: 'Proforma' };

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const formatAmount = useFormatCurrency();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    api.get(`/clients/${id}`)
      .then(({ data }) => setClient(data.data.client))
      .catch(() => toast.error('Client non trouvé'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Client supprimé');
      navigate('/app/clients');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!client) {
    return <div className="text-center py-20 text-gray-500">Client non trouvé</div>;
  }

  const totalRevenue = client.documents?.reduce((s, d) => s + (d.totalTtc || 0), 0) || 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to="/app/clients" className="btn-secondary px-3 py-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="page-title">{client.name}</h1>
            {client.companyName && (
              <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                <Building2 className="w-3 h-3" /> {client.companyName}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/app/clients/${id}/edit`} className="btn-secondary">
            <Edit className="w-4 h-4" /> Modifier
          </Link>
          {confirmDelete ? (
            <div className="flex gap-2">
              <button onClick={handleDelete} disabled={deleting}
                className="btn-danger text-xs px-3">
                {deleting ? 'Suppression...' : 'Confirmer'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary text-xs px-3">
                Annuler
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="btn-secondary text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Informations</h2>
          <div className="space-y-3">
            {client.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700 break-all">{client.email}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{client.address}</span>
              </div>
            )}
            {client.ninea && (
              <div className="flex items-center gap-3 text-sm">
                <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <span className="text-xs text-gray-400 block">NINEA</span>
                  <span className="text-gray-700 font-mono">{client.ninea}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total documents</span>
              <span className="font-medium">{client._count?.documents || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total facturé</span>
              <span className="font-medium text-primary-600">{formatAmount(totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Documents history */}
        <div className="md:col-span-2 card">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="section-title">Historique des documents</h2>
            <Link
              to={`/app/documents/new?clientId=${client.id}`}
              className="btn-primary text-xs px-3 py-1.5"
            >
              <Plus className="w-3 h-3" /> Nouveau document
            </Link>
          </div>

          {!client.documents?.length ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">Aucun document pour ce client</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Numéro</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {client.documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <Link to={`/app/documents/${doc.id}`} className="text-primary-600 text-sm font-medium hover:underline">
                          {doc.number}
                        </Link>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`badge-${doc.type}`}>{TYPE_LABELS[doc.type]}</span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">{formatDate(doc.issuedDate)}</td>
                      <td className="px-6 py-3 text-right text-sm font-medium">{formatAmount(doc.totalTtc)}</td>
                      <td className="px-6 py-3">
                        <span className={STATUS_BADGES[doc.status]}>{STATUS_LABELS[doc.status]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
