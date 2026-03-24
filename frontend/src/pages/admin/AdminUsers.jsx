import { useState, useEffect, useCallback } from 'react';
import { Users, Search, Loader2, ShieldCheck, Shield, Building2 } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const PLAN_COLORS = {
  FREE: 'bg-gray-100 text-gray-500',
  STARTER: 'bg-blue-100 text-blue-600',
  PRO: 'bg-purple-100 text-purple-600',
  ENTERPRISE: 'bg-amber-100 text-amber-600'
};

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const { data } = await api.get(`/admin/users${params}`);
      setUsers(data.data.users);
    } catch {
      toast.error('Erreur chargement utilisateurs');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleToggleSuperAdmin = async (u) => {
    const action = u.isSuperAdmin ? 'révoquer les droits Super Admin de' : 'promouvoir';
    if (!window.confirm(`Voulez-vous ${action} ${u.name} en Super Admin ?`)) return;
    setActionLoading(u.id);
    try {
      const { data } = await api.patch(`/admin/users/${u.id}/superadmin`);
      toast.success(data.message);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isSuperAdmin: !x.isSuperAdmin } : x));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-amber-500" />
          Utilisateurs ({users.length})
        </h1>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Aucun utilisateur trouvé</div>
        ) : (
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Utilisateur</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Organisations</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Rôle</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Inscrit le</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => {
                const isMe = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 text-xs font-bold">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {u.name}
                            {isMe && <span className="ml-1.5 text-xs text-gray-400">(vous)</span>}
                          </p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {u.memberships?.slice(0, 3).map((m) => (
                          <span
                            key={m.organizationId}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[m.organization?.plan] || 'bg-gray-100 text-gray-500'}`}
                          >
                            <Building2 className="w-2.5 h-2.5" />
                            {m.organization?.name}
                          </span>
                        ))}
                        {u.memberships?.length > 3 && (
                          <span className="text-xs text-gray-400">+{u.memberships.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {u.isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          <Shield className="w-3.5 h-3.5" /> Utilisateur
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell text-xs text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {!isMe && (
                        <button
                          onClick={() => handleToggleSuperAdmin(u)}
                          disabled={!!actionLoading}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            u.isSuperAdmin
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-amber-600 hover:bg-amber-50'
                          }`}
                        >
                          {actionLoading === u.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <ShieldCheck className="w-3.5 h-3.5" />
                          }
                          {u.isSuperAdmin ? 'Révoquer' : 'Promouvoir'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
