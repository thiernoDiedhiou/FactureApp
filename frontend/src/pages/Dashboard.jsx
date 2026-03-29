import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp, CheckCircle, Clock, XCircle, AlertTriangle,
  Users, Plus, ArrowRight, FileText
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import api from '../utils/api';
import { formatDate, isOverdue } from '../utils/dateUtils';
import { useSettings, useFormatCurrency } from '../contexts/SettingsContext';

const STATUS_BADGES = {
  paye: 'badge-paye',
  en_attente: 'badge-en_attente',
  annule: 'badge-annule'
};
const STATUS_LABELS = { paye: 'Payé', en_attente: 'En attente', annule: 'Annulé' };
const TYPE_LABELS = { facture: 'Facture', devis: 'Devis', proforma: 'Proforma' };

function StatsCard({ title, value, sub, icon: Icon, color = 'primary', trend }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  };
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-gray-900 text-sm">{formatter(payload[0].value)}</p>
      {payload[1] && <p className="text-xs text-gray-500">{payload[1].value} facture(s)</p>}
    </div>
  );
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { organization } = useAuth();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const formatAmount = useFormatCurrency();
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) {
      navigate('/app/organization');
      return;
    }
    const load = async () => {
      try {
        const [statsRes, chartRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/revenue-chart')
        ]);
        setStats(statsRes.data.data);
        setChart(chartRes.data.data.chart);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [organization]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { stats: s, recentDocuments = [], recentClients = [] } = stats || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overdue alert */}
      {s?.overdueCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-red-800 text-sm">
              {s.overdueCount} facture(s) en retard de paiement
            </p>
          </div>
          <Link to="/documents?status=en_attente" className="text-xs text-red-600 font-medium hover:underline">
            Voir <ArrowRight className="w-3 h-3 inline" />
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total facturé"
          value={formatAmount(s?.totalFacture || 0)}
          sub="Toutes les factures payées"
          icon={TrendingUp}
          color="primary"
        />
        <StatsCard
          title="Ce mois"
          value={formatAmount(s?.currentMonthRevenue || 0)}
          icon={TrendingUp}
          color="purple"
        />
        <StatsCard
          title="Factures payées"
          value={s?.countPaye || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="En attente"
          value={s?.countEnAttente || 0}
          sub={s?.overdueCount > 0 ? `${s.overdueCount} en retard` : undefined}
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Chart + Recent */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="xl:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">{t('dashboard.revenueChart')}</h2>
            <span className="text-xs text-gray-400">12 derniers mois</span>
          </div>
          {chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chart} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={settings.primaryColor || '#0EA5E9'} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={settings.primaryColor || '#0EA5E9'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip formatter={formatAmount} />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={settings.primaryColor || '#0EA5E9'}
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>{t('dashboard.noData')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent clients */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Clients récents</h2>
            <Link to="/clients" className="text-xs text-primary-600 hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-3">
            {recentClients.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucun client</p>
            ) : recentClients.map(client => (
              <Link key={client.id} to={`/clients/${client.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 text-sm font-bold">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                  {client.companyName && (
                    <p className="text-xs text-gray-400 truncate">{client.companyName}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400">{client._count?.documents || 0} doc</span>
              </Link>
            ))}
          </div>

          <Link to="/clients/new"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-primary-300 hover:text-primary-600 transition-colors">
            <Plus className="w-4 h-4" /> Nouveau client
          </Link>
        </div>
      </div>

      {/* Recent documents */}
      <div className="card">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="section-title">Documents récents</h2>
          <Link to="/documents" className="text-xs text-primary-600 hover:underline">Voir tout</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Numéro</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Date</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                    Aucun document
                  </td>
                </tr>
              ) : recentDocuments.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/documents/${doc.id}`} className="font-medium text-primary-600 text-sm hover:underline">
                      {doc.number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{doc.client?.name}</td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`badge-${doc.type}`}>{TYPE_LABELS[doc.type]}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                    {formatDate(doc.issuedDate)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-sm text-gray-900">
                    {formatAmount(doc.totalTtc)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={STATUS_BADGES[doc.status]}>
                      {STATUS_LABELS[doc.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
