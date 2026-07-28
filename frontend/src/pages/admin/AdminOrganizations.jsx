import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Search, Loader2, Zap, Ban, CheckCircle,
  Trash2, ChevronDown, AlertTriangle, CalendarDays, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PLANS = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

const PLAN_COLORS = {
  FREE:       'bg-gray-100 text-gray-600',
  STARTER:    'bg-blue-100 text-blue-700',
  PRO:        'bg-purple-100 text-purple-700',
  ENTERPRISE: 'bg-amber-100 text-amber-700'
};

const SUB_STATUS_CONFIG = {
  free:          { label: '—',             class: 'text-gray-400',   dot: '' },
  active:        { label: 'Actif',         class: 'text-green-700',  dot: 'bg-green-500' },
  expiring_soon: { label: 'Expire bientôt',class: 'text-orange-700', dot: 'bg-orange-500' },
  expired:       { label: 'Expiré',        class: 'text-red-700',    dot: 'bg-red-500' },
  legacy:        { label: 'Hérité',        class: 'text-gray-500',   dot: 'bg-gray-400' }
};

const SUB_FILTERS = [
  { key: '',              label: 'Tous statuts' },
  { key: 'active',        label: 'Actifs' },
  { key: 'expiring_soon', label: 'Expire bientôt' },
  { key: 'expired',       label: 'Expirés' }
];

function formatShortDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (planFilter) params.set('plan', planFilter);
      if (subFilter) params.set('subscriptionStatus', subFilter);
      const { data } = await api.get(`/admin/organizations?${params}`);
      setOrgs(data.data.organizations);
    } catch {
      toast.error('Erreur chargement organisations');
    } finally {
      setLoading(false);
    }
  }, [search, planFilter, subFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handlePlanChange = async (orgId, plan) => {
    setActionLoading(`plan-${orgId}`);
    try {
      const { data } = await api.patch(`/admin/organizations/${orgId}/plan`, { plan });
      toast.success(data.message);
      setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, plan } : o));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur changement de plan');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSuspend = async (org) => {
    const action = org.suspended ? 'réactiver' : 'suspendre';
    if (!window.confirm(`Voulez-vous ${action} l'organisation "${org.name}" ?`)) return;
    setActionLoading(`suspend-${org.id}`);
    try {
      const { data } = await api.patch(`/admin/organizations/${org.id}/suspend`);
      toast.success(data.message);
      setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, suspended: !o.suspended } : o));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (org) => {
    if (!window.confirm(`⚠️ SUPPRIMER DÉFINITIVEMENT "${org.name}" et toutes ses données ?\n\nCette action est irréversible.`)) return;
    setActionLoading(`delete-${org.id}`);
    try {
      const { data } = await api.delete(`/admin/organizations/${org.id}`);
      toast.success(data.message);
      setOrgs(prev => prev.filter(o => o.id !== org.id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-amber-500" />
          Organisations ({orgs.length})
        </h1>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            placeholder="Rechercher une organisation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
        >
          <option value="">Tous les plans</option>
          {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          value={subFilter}
          onChange={(e) => setSubFilter(e.target.value)}
        >
          {SUB_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Aucune organisation trouvée</div>
        ) : (
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Organisation</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Propriétaire</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Membres</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Docs</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Plan</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Abonnement</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orgs.map((org) => {
                const owner = org.members?.[0]?.user;
                const subSt = SUB_STATUS_CONFIG[org.subscriptionStatus] || SUB_STATUS_CONFIG.free;
                const expiryDate = formatShortDate(org.planExpiresAt);
                const isAtRisk = org.subscriptionStatus === 'expired' || org.subscriptionStatus === 'expiring_soon';

                return (
                  <tr key={org.id} className={`hover:bg-gray-50 transition-colors ${org.suspended ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-4">
                      <Link to={`/admin/organizations/${org.id}/detail`} className="group">
                        <p className="font-medium text-gray-900 group-hover:text-amber-600 transition-colors">{org.name}</p>
                        <p className="text-xs text-gray-400">{org.slug}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      {owner ? (
                        <div>
                          <p className="text-gray-700 text-xs font-medium">{owner.name}</p>
                          <a
                            href={`mailto:${owner.email}`}
                            className="text-gray-400 text-xs truncate max-w-[160px] block hover:text-blue-500 transition-colors"
                          >
                            {owner.email}
                          </a>
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-4 text-center hidden sm:table-cell text-gray-600">
                      {org._count.members}
                    </td>
                    <td className="px-4 py-4 text-center hidden lg:table-cell text-gray-600">
                      {org._count.documents}
                    </td>

                    {/* Plan selector */}
                    <td className="px-4 py-4 text-center">
                      <div className="relative inline-block">
                        <select
                          value={org.plan}
                          onChange={(e) => handlePlanChange(org.id, e.target.value)}
                          disabled={actionLoading === `plan-${org.id}`}
                          className={`appearance-none pr-6 pl-2.5 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 ${PLAN_COLORS[org.plan]}`}
                        >
                          {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        {actionLoading === `plan-${org.id}`
                          ? <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin" />
                          : <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                        }
                      </div>
                    </td>

                    {/* Abonnement */}
                    <td className="px-4 py-4 text-center">
                      {org.plan === 'FREE' ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className={`flex items-center gap-1 text-xs font-medium ${subSt.class}`}>
                            {subSt.dot && (
                              <span className={`w-1.5 h-1.5 rounded-full ${subSt.dot} flex-shrink-0`} />
                            )}
                            {subSt.label}
                          </div>
                          {expiryDate && (
                            <div className={`flex items-center gap-1 text-xs ${isAtRisk ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                              <CalendarDays className="w-3 h-3" />
                              {expiryDate}
                            </div>
                          )}
                          {org.daysRemaining !== null && org.subscriptionStatus !== 'free' && org.subscriptionStatus !== 'legacy' && (
                            <span className={`text-xs ${
                              org.daysRemaining <= 0 ? 'text-red-500' :
                              org.daysRemaining <= 7 ? 'text-orange-500' : 'text-gray-400'
                            }`}>
                              {org.daysRemaining <= 0
                                ? `+${Math.abs(org.daysRemaining)}j dépassé`
                                : `${org.daysRemaining}j restants`
                              }
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Statut suspension */}
                    <td className="px-4 py-4 text-center">
                      {org.suspended ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-semibold">
                          <Ban className="w-3 h-3" /> Suspendue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <Link
                          to={`/admin/organizations/${org.id}/detail`}
                          title="Voir le détail"
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleToggleSuspend(org)}
                          disabled={!!actionLoading}
                          title={org.suspended ? 'Réactiver' : 'Suspendre'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            org.suspended
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-amber-600 hover:bg-amber-50'
                          }`}
                        >
                          {actionLoading === `suspend-${org.id}`
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : org.suspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />
                          }
                        </button>
                        <button
                          onClick={() => handleDelete(org)}
                          disabled={!!actionLoading}
                          title="Supprimer définitivement"
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          {actionLoading === `delete-${org.id}`
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
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

      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        La suppression d'une organisation est <strong className="ml-1">irréversible</strong> et supprime tous ses clients, produits et documents.
      </div>
    </div>
  );
}
