import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Clock, Building2, RefreshCw } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending:   { label: 'En attente', class: 'bg-amber-100 text-amber-700',  icon: Clock },
  validated: { label: 'Validée',    class: 'bg-green-100 text-green-700',  icon: CheckCircle },
  rejected:  { label: 'Rejetée',    class: 'bg-red-100 text-red-700',      icon: XCircle }
};

const METHOD_LABELS = {
  wave:         'Wave',
  orange_money: 'Orange Money',
  free_money:   'Mixx by Joni Joni',
  cash:         'Espèces'
};

function RejectModal({ request, onClose, onConfirm }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(request.id, 'reject', notes);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
        <h3 className="font-bold text-gray-900">Rejeter la demande</h3>
        <p className="text-sm text-gray-500">
          Organisation : <strong>{request.organization?.name}</strong> — Plan {request.targetPlan}
        </p>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Raison du rejet (optionnel)</label>
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="Référence introuvable, montant incorrect..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Rejeter
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUpgrades() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processing, setProcessing] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);

  const fetchRequests = () => {
    setLoading(true);
    api.get(`/admin/upgrades${filter ? `?status=${filter}` : ''}`)
      .then(res => setRequests(res.data.data.requests))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, [filter]);

  const handleProcess = async (id, action, notes = '') => {
    setProcessing(id);
    try {
      const res = await api.patch(`/admin/upgrades/${id}`, { action, notes });
      toast.success(res.data.message);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setProcessing(null);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-amber-500" />
            Demandes de mise à niveau
            {pendingCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Validez ou rejetez les demandes de paiement des organisations.</p>
        </div>
        <button onClick={fetchRequests} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Rafraîchir
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {[
          { key: 'pending',   label: 'En attente' },
          { key: 'validated', label: 'Validées' },
          { key: 'rejected',  label: 'Rejetées' },
          { key: '',          label: 'Toutes' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-amber-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucune demande {filter === 'pending' ? 'en attente' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const st = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
            const StatusIcon = st.icon;
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">{req.organization?.name}</span>
                      <span className="text-xs text-gray-400">
                        {req.organization?.plan} → <strong className="text-gray-700">{req.targetPlan}</strong>
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.class}`}>
                        <StatusIcon className="w-3 h-3" /> {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                      <span>{METHOD_LABELS[req.paymentMethod] || req.paymentMethod}</span>
                      <span className="font-semibold text-gray-900">{req.amount.toLocaleString('fr-FR')} FCFA</span>
                      {req.transactionRef && (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                          Réf: {req.transactionRef}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(req.createdAt).toLocaleString('fr-FR')}
                      {req.notes && <span className="ml-2 italic text-gray-500">— {req.notes}</span>}
                    </p>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setRejectModal(req)}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl text-sm flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Rejeter
                      </button>
                      <button
                        onClick={() => handleProcess(req.id, 'validate')}
                        disabled={processing === req.id}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl text-sm flex items-center gap-1.5 transition-colors"
                      >
                        {processing === req.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <CheckCircle className="w-4 h-4" />}
                        Valider
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectModal && (
        <RejectModal
          request={rejectModal}
          onClose={() => setRejectModal(null)}
          onConfirm={handleProcess}
        />
      )}
    </div>
  );
}
