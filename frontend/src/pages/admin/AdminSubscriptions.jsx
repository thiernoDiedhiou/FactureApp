import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Loader2, CheckCircle, AlertTriangle, XCircle,
  Clock, Building2, RefreshCw, CalendarDays, History, Zap, PenLine
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PLAN_COLORS = {
  STARTER:    'bg-blue-100 text-blue-700',
  PRO:        'bg-purple-100 text-purple-700',
  ENTERPRISE: 'bg-amber-100 text-amber-700'
};

const STATUS_CONFIG = {
  active:        { label: 'Actif',          icon: CheckCircle,  class: 'bg-green-100 text-green-700' },
  expiring_soon: { label: 'Expire bientôt', icon: AlertTriangle, class: 'bg-orange-100 text-orange-700' },
  expired:       { label: 'Expiré',         icon: XCircle,      class: 'bg-red-100 text-red-700' },
  legacy:        { label: 'Hérité',         icon: Clock,        class: 'bg-gray-100 text-gray-600' }
};

const FILTERS = [
  { key: '',              label: 'Tous' },
  { key: 'active',        label: 'Actifs' },
  { key: 'expiring_soon', label: 'Expire bientôt' },
  { key: 'expired',       label: 'Expirés' },
  { key: 'legacy',        label: 'Hérités' }
];

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function DaysRemainingBadge({ days, status }) {
  if (status === 'free' || status === 'legacy') return <span className="text-gray-400 text-xs">—</span>;
  if (days === null) return <span className="text-gray-400 text-xs">—</span>;
  if (days <= 0) return (
    <span className="text-xs font-semibold text-red-600">
      Expiré il y a {Math.abs(days)}j
    </span>
  );
  if (days <= 3) return (
    <span className="text-xs font-semibold text-red-600">{days}j restants</span>
  );
  if (days <= 7) return (
    <span className="text-xs font-semibold text-orange-600">{days}j restants</span>
  );
  return <span className="text-xs text-gray-600">{days}j restants</span>;
}

function SetSubscriptionModal({ org, onClose, onSaved }) {
  const planMonthlyPrice = 0; // sera affiché sans contrainte de prix

  // Date de début par défaut : aujourd'hui
  const todayStr = new Date().toISOString().split('T')[0];
  // Date de fin par défaut : dans 1 mois
  const nextMonthStr = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  })();

  const [form, setForm] = useState({
    startDate:      todayStr,
    endDate:        nextMonthStr,
    durationMonths: 1,
    amount:         0
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Recalcule durationMonths si les deux dates sont renseignées
      if ((field === 'startDate' || field === 'endDate') && next.startDate && next.endDate) {
        const start = new Date(next.startDate);
        const end   = new Date(next.endDate);
        const months = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30.44)));
        next.durationMonths = months;
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) return toast.error('Renseignez les deux dates');
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      return toast.error('La date de fin doit être après la date de début');
    }
    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/organizations/${org.id}/subscription`, {
        startDate:      new Date(form.startDate).toISOString(),
        endDate:        new Date(form.endDate).toISOString(),
        durationMonths: form.durationMonths,
        amount:         Number(form.amount)
      });
      toast.success(data.message);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <PenLine className="w-5 h-5 text-amber-500" />
              Définir l'abonnement
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {org.name} · Plan <strong>{org.plan}</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            Cet abonnement a été créé avant le suivi automatique des dates.
            Renseignez la période réelle pour activer le suivi.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Date de début
              </label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={e => handleChange('startDate', e.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Date de fin
              </label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={e => handleChange('endDate', e.target.value)}
                className="input-field text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Durée (mois, calculée auto)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={form.durationMonths}
                onChange={e => handleChange('durationMonths', parseInt(e.target.value) || 1)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Montant payé (FCFA)
              </label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={e => handleChange('amount', e.target.value)}
                className="input-field text-sm"
                placeholder="0"
              />
            </div>
          </div>

          {form.startDate && form.endDate && new Date(form.endDate) > new Date(form.startDate) && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
              Du <strong>{new Date(form.startDate).toLocaleDateString('fr-FR')}</strong> au{' '}
              <strong>{new Date(form.endDate).toLocaleDateString('fr-FR')}</strong>
              {' '}· {form.durationMonths} mois
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubscriptionHistoryModal({ org, onClose }) {
  const history = org.subscriptions || [];
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              Historique — {org.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{history.length} période{history.length > 1 ? 's' : ''} d'abonnement</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Aucun historique disponible</p>
          ) : (
            <div className="space-y-3">
              {history.map((sub, i) => (
                <div key={sub.id} className={`rounded-xl border p-4 ${i === 0 ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${PLAN_COLORS[sub.plan] || 'bg-gray-100 text-gray-600'}`}>
                      {sub.plan}
                    </span>
                    <span className="text-xs text-gray-500">
                      {sub.durationMonths} mois · {sub.amount.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                    <span>{formatDate(sub.startDate)}</span>
                    <span className="text-gray-300">→</span>
                    <span className="font-medium">{formatDate(sub.endDate)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Validé le {formatDate(sub.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSubscriptions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [historyOrg, setHistoryOrg] = useState(null);
  const [setDatesOrg, setSetDatesOrg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get(`/admin/subscriptions${params}`);
      setData(res.data.data);
    } catch {
      toast.error('Erreur chargement abonnements');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const { organizations = [], counts = {} } = data || {};
  const { activeCount = 0, expiringSoonCount = 0, expiredCount = 0, legacyCount = 0 } = counts;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-500" />
            Abonnements
          </h1>
          <p className="text-gray-500 text-sm mt-1">Suivi des abonnements payants et de leur cycle de vie.</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Rafraîchir
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actifs</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">plan payant en cours</p>
        </div>

        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expire bientôt</span>
          </div>
          <p className={`text-2xl font-bold ${expiringSoonCount > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
            {expiringSoonCount}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">dans les 7 prochains jours</p>
        </div>

        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expirés</span>
          </div>
          <p className={`text-2xl font-bold ${expiredCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {expiredCount}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">en attente de renouvellement</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hérités</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{legacyCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">sans date (anciens clients)</p>
        </div>
      </div>

      {/* Bannière à risque */}
      {(expiringSoonCount + expiredCount) > 0 && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-orange-800">
            <strong>{expiringSoonCount + expiredCount} abonnement{(expiringSoonCount + expiredCount) > 1 ? 's' : ''} à risque</strong> —
            {' '}{expiredCount > 0 && `${expiredCount} expiré${expiredCount > 1 ? 's' : ''}`}
            {expiredCount > 0 && expiringSoonCount > 0 && ', '}
            {expiringSoonCount > 0 && `${expiringSoonCount} expire${expiringSoonCount > 1 ? 'nt' : ''} dans 7 jours`}.{' '}
            Contactez ces clients pour les fidéliser.
          </div>
          <Link
            to="/admin/upgrades"
            className="flex-shrink-0 text-xs font-semibold text-orange-700 hover:underline flex items-center gap-1"
          >
            <Zap className="w-3.5 h-3.5" /> Valider un paiement
          </Link>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
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
            {f.key === 'expiring_soon' && expiringSoonCount > 0 && (
              <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{expiringSoonCount}</span>
            )}
            {f.key === 'expired' && expiredCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{expiredCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
        ) : organizations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Aucun abonnement trouvé</p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Organisation</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Propriétaire</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Plan</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Statut</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Expire le</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Échéance</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Renouvellements</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {organizations.map(org => {
                const st = STATUS_CONFIG[org.subscriptionStatus] || STATUS_CONFIG.legacy;
                const StatusIcon = st.icon;
                const owner = org.members?.[0]?.user;
                const renewalCount = org.subscriptions?.length || 0;

                return (
                  <tr
                    key={org.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      org.subscriptionStatus === 'expired' ? 'bg-red-50/30' :
                      org.subscriptionStatus === 'expiring_soon' ? 'bg-orange-50/30' : ''
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{org.name}</p>
                          <p className="text-xs text-gray-400">{org.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      {owner ? (
                        <div>
                          <p className="text-xs font-medium text-gray-700">{owner.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[160px]">{owner.email}</p>
                        </div>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PLAN_COLORS[org.plan] || 'bg-gray-100 text-gray-600'}`}>
                        {org.plan}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${st.class}`}>
                        <StatusIcon className="w-3 h-3" /> {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center hidden lg:table-cell">
                      <span className={`text-xs font-medium ${
                        org.subscriptionStatus === 'expired' ? 'text-red-600' :
                        org.subscriptionStatus === 'expiring_soon' ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        {formatDate(org.planExpiresAt)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <DaysRemainingBadge days={org.daysRemaining} status={org.subscriptionStatus} />
                    </td>
                    <td className="px-4 py-4 text-center hidden lg:table-cell">
                      <span className="text-xs text-gray-500">{renewalCount}×</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {org.subscriptionStatus === 'legacy' && (
                          <button
                            onClick={() => setSetDatesOrg(org)}
                            title="Définir les dates d'abonnement"
                            className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <PenLine className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setHistoryOrg(org)}
                          title="Voir l'historique"
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {historyOrg && (
        <SubscriptionHistoryModal org={historyOrg} onClose={() => setHistoryOrg(null)} />
      )}

      {setDatesOrg && (
        <SetSubscriptionModal
          org={setDatesOrg}
          onClose={() => setSetDatesOrg(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
