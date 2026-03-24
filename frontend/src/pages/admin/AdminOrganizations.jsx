import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Search, Loader2, Zap, Ban, CheckCircle,
  Trash2, ChevronDown, AlertTriangle
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PLANS = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
const PLAN_COLORS = {
  FREE: 'bg-gray-100 text-gray-600',
  STARTER: 'bg-blue-100 text-blue-700',
  PRO: 'bg-purple-100 text-purple-700',
  ENTERPRISE: 'bg-amber-100 text-amber-700'
};

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (planFilter) params.set('plan', planFilter);
      const { data } = await api.get(`/admin/organizations?${params}`);
      setOrgs(data.data.organizations);
    } catch {
      toast.error('Erreur chargement organisations');
    } finally {
      setLoading(false);
    }
  }, [search, planFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handlePlanChange = async (orgId, plan, orgName) => {
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
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
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Organisation</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Propriétaire</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Membres</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Docs</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Plan</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orgs.map((org) => {
                const owner = org.members?.[0]?.user;
                return (
                  <tr key={org.id} className={`hover:bg-gray-50 transition-colors ${org.suspended ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{org.name}</p>
                      <p className="text-xs text-gray-400">{org.slug}</p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      {owner ? (
                        <div>
                          <p className="text-gray-700 text-xs font-medium">{owner.name}</p>
                          <p className="text-gray-400 text-xs truncate max-w-[160px]">{owner.email}</p>
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
                          onChange={(e) => handlePlanChange(org.id, e.target.value, org.name)}
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
                    {/* Status */}
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
