import { useState, useEffect } from 'react';
import {
  Building2, Users, FileText, UserCheck, Loader2, TrendingUp,
  DollarSign, Activity, AlertTriangle, CheckCircle, ArrowUpRight, Moon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PLAN_COLORS = {
  FREE: { badge: 'bg-gray-100 text-gray-600', bar: '#9ca3af' },
  STARTER: { badge: 'bg-blue-100 text-blue-700', bar: '#3b82f6' },
  PRO: { badge: 'bg-purple-100 text-purple-700', bar: '#8b5cf6' },
  ENTERPRISE: { badge: 'bg-amber-100 text-amber-700', bar: '#f59e0b' }
};

const formatCFA = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';

const CustomTooltipGrowth = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-semibold mb-1">{label}</p>
      <p>{payload[0].value} nouvelle{payload[0].value > 1 ? 's' : ''} org.</p>
    </div>
  );
};

const CustomTooltipDocs = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-semibold mb-1">{label}</p>
      <p>{payload[0].value} document{payload[0].value > 1 ? 's' : ''}</p>
    </div>
  );
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Erreur chargement stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
    </div>
  );

  const { stats, plans, planRevenue, recentOrgs, growthChart, docsChart } = data || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-amber-500" />
          Vue d'ensemble plateforme
        </h1>
        <p className="text-gray-500 text-sm mt-1">KPIs globaux — CFActure UEMOA</p>
      </div>

      {/* KPIs financiers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg sm:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-6 h-6 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">MRR</span>
          </div>
          <p className="text-3xl font-bold">{formatCFA(stats?.mrr || 0)}</p>
          <p className="text-xs opacity-80 mt-1">Revenu mensuel récurrent</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <ArrowUpRight className="w-5 h-5 text-green-500" />
            <span className="text-xs text-gray-400">Taux conversion</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.conversionRate || 0}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats?.paidOrgs || 0} org{(stats?.paidOrgs || 0) > 1 ? 's' : ''} payante{(stats?.paidOrgs || 0) > 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-gray-400">Total facturé</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-tight">
            {formatCFA(stats?.totalRevenuePlatform || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Factures payées, tous tenants</p>
        </div>
      </div>

      {/* Stats compteurs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Organisations', value: stats?.totalOrgs, icon: Building2, color: 'text-blue-600 bg-blue-50' },
          { label: 'Utilisateurs', value: stats?.totalUsers, icon: Users, color: 'text-purple-600 bg-purple-50' },
          { label: 'Documents', value: stats?.totalDocuments, icon: FileText, color: 'text-green-600 bg-green-50' },
          { label: 'Clients', value: stats?.totalClients, icon: UserCheck, color: 'text-amber-600 bg-amber-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className={`inline-flex p-2.5 rounded-xl mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Engagement & Santé */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actives 30j</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.activeOrgsCount ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">ont créé un document ce mois</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dormantes 90j</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.dormantOrgsCount ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">aucune activité récente</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Suspendues</span>
          </div>
          <p className={`text-2xl font-bold ${stats?.suspendedCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {stats?.suspendedCount ?? '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">accès bloqué</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-primary-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nouveaux / mois</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.newUsersThisMonth ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">inscriptions ce mois</p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Croissance des organisations */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Croissance des organisations</h2>
          <p className="text-xs text-gray-400 mb-4">Nouvelles orgs par mois — 12 derniers mois</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={growthChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltipGrowth />} />
              <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} fill="url(#growthGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Volume documents */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Volume de documents</h2>
          <p className="text-xs text-gray-400 mb-4">Documents créés par mois — 12 derniers mois</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={docsChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltipDocs />} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenus par plan */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Répartition par plan — contribution MRR</h2>
        <div className="space-y-3">
          {(planRevenue || []).map(({ plan, count, revenue, price }) => {
            const pct = stats?.mrr > 0 ? Math.round((revenue / stats.mrr) * 100) : 0;
            return (
              <div key={plan} className="flex items-center gap-4">
                <span className={`w-24 text-xs font-semibold px-2 py-0.5 rounded-full text-center ${PLAN_COLORS[plan]?.badge}`}>
                  {plan}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: PLAN_COLORS[plan]?.bar }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 w-10 text-right">{count}</span>
                <span className="text-xs text-gray-400 w-32 text-right">
                  {revenue > 0 ? formatCFA(revenue) : 'Gratuit'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dernières organisations */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Dernières organisations</h2>
          <Link to="/admin/organizations" className="text-sm text-amber-600 hover:underline">
            Voir tout →
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentOrgs?.map((org) => (
            <div key={org.id} className="flex items-center gap-4 py-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
                <p className="text-xs text-gray-400">
                  {org._count.members} membre{org._count.members > 1 ? 's' : ''} · {org._count.documents} docs
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_COLORS[org.plan]?.badge}`}>
                {org.plan}
              </span>
              {org.suspended && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-semibold">
                  Suspendue
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
