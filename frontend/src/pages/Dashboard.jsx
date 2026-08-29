import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp, CheckCircle, Clock, AlertTriangle,
  Users, Plus, ArrowRight, FileText, Zap, CalendarDays, ShieldCheck
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../utils/api';
import { formatDate, isOverdue } from '../utils/dateUtils';
import { useSettings, useFormatCurrency } from '../contexts/SettingsContext';
import OnboardingChecklist from '../components/OnboardingChecklist';

const STATUS_BADGES  = { paye: 'badge-paye', en_attente: 'badge-en_attente', annule: 'badge-annule' };
const STATUS_LABELS  = { paye: 'Payé', en_attente: 'En attente', annule: 'Annulé' };
const TYPE_LABELS    = { facture: 'Facture', devis: 'Devis', proforma: 'Proforma' };

const PLAN_META = {
  FREE:       { label: 'Gratuit',    color: 'bg-gray-100 text-gray-700',       maxDocs: 10,  maxClients: 5  },
  STARTER:    { label: 'Starter',    color: 'bg-blue-100 text-blue-700',        maxDocs: 100, maxClients: 50 },
  PRO:        { label: 'Pro',        color: 'bg-purple-100 text-purple-700',    maxDocs: null, maxClients: null },
  ENTERPRISE: { label: 'Enterprise', color: 'bg-amber-100 text-amber-700',      maxDocs: null, maxClients: null },
};

// ── Widget plan ───────────────────────────────────────────────────────────────
function PlanWidget({ organization }) {
  if (!organization) return null;
  const plan = PLAN_META[organization.plan] || PLAN_META.FREE;
  const isFree = organization.plan === 'FREE';
  const isUnlimited = !plan.maxDocs;

  const expiresAt = organization.planExpiresAt ? new Date(organization.planExpiresAt) : null;
  const daysLeft  = expiresAt ? Math.ceil((expiresAt - Date.now()) / 86_400_000) : null;
  const expiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  const expired      = daysLeft !== null && daysLeft <= 0;

  return (
    <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
      isFree ? 'bg-amber-50 border-amber-200' :
      expiringSoon || expired ? 'bg-red-50 border-red-200' :
      'bg-primary-50 border-primary-100'
    }`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isFree ? 'bg-amber-100' : 'bg-primary-100'
        }`}>
          <ShieldCheck className={`w-5 h-5 ${isFree ? 'text-amber-600' : 'text-primary-600'}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${plan.color}`}>
              {plan.label}
            </span>
            {!isFree && expiresAt && (
              <span className={`text-xs font-medium flex items-center gap-1 ${
                expired ? 'text-red-600' : expiringSoon ? 'text-red-500' : 'text-gray-500'
              }`}>
                <CalendarDays className="w-3 h-3" />
                {expired
                  ? 'Expiré'
                  : expiringSoon
                    ? `Expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`
                    : `Valide jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}`
                }
              </span>
            )}
            {isUnlimited && !isFree && (
              <span className="text-xs text-gray-400">Documents &amp; clients illimités</span>
            )}
          </div>
          {isFree && (
            <p className="text-xs text-amber-700 mt-0.5">
              Limité à 10 documents et 5 clients — passez au plan Starter pour en faire plus.
            </p>
          )}
          {expired && (
            <p className="text-xs text-red-600 mt-0.5">
              Votre abonnement a expiré. Renouvelez pour continuer à utiliser toutes les fonctionnalités.
            </p>
          )}
        </div>
      </div>
      {(isFree || expired || expiringSoon) && (
        <Link
          to="/app/plans"
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
        >
          <Zap className="w-4 h-4" />
          {expired ? 'Renouveler' : isFree ? 'Passer au Starter' : 'Renouveler'}
        </Link>
      )}
    </div>
  );
}

// ── Carte stat ────────────────────────────────────────────────────────────────
function StatsCard({ title, value, sub, icon: Icon, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    green:   'bg-green-50 text-green-600',
    yellow:  'bg-yellow-50 text-yellow-600',
    red:     'bg-red-50 text-red-600',
    purple:  'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 leading-tight break-words">
            {value}
          </p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
}

// ── Tooltip graphique ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-gray-900 text-sm">{formatter(payload[0].value)}</p>
    </div>
  );
};

// ── Document card (mobile) ────────────────────────────────────────────────────
function DocCard({ doc, formatAmount }) {
  const overdue = doc.status === 'en_attente' && isOverdue(doc.dueDate);
  return (
    <Link
      to={`/app/documents/${doc.id}`}
      className="flex items-center gap-3 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-primary-600">{doc.number}</span>
          <span className={STATUS_BADGES[doc.status]}>{STATUS_LABELS[doc.status]}</span>
          {overdue && <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">Retard</span>}
        </div>
        <p className="text-sm text-gray-700 truncate">{doc.client?.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{TYPE_LABELS[doc.type]} · {formatDate(doc.issuedDate)}</p>
      </div>
      <p className="text-sm font-bold text-gray-900 flex-shrink-0">{formatAmount(doc.totalTtc)}</p>
    </Link>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { t } = useTranslation();
  const { organization } = useAuth();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const formatAmount = useFormatCurrency();
  const [stats, setStats]   = useState(null);
  const [chart, setChart]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) { navigate('/app/organization'); return; }
    const load = async () => {
      try {
        const [statsRes, chartRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/revenue-chart'),
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
    <div className="space-y-4 sm:space-y-6 animate-fade-in">

      {/* Widget plan */}
      <PlanWidget organization={organization} />

      {/* Onboarding — visible uniquement pour les nouveaux utilisateurs */}
      <OnboardingChecklist
        hasClients={recentClients.length > 0}
        hasDocuments={recentDocuments.length > 0}
        hasSettings={!!(settings?.companyName && settings.companyName !== organization?.name) || !!(settings?.logoUrl)}
      />

      {/* Alerte retard */}
      {s?.overdueCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="font-medium text-red-800 text-sm flex-1">
            {s.overdueCount} facture{s.overdueCount > 1 ? 's' : ''} en retard de paiement
          </p>
          <Link to="/app/documents?status=en_attente" className="text-xs text-red-600 font-medium hover:underline flex-shrink-0">
            Voir <ArrowRight className="w-3 h-3 inline" />
          </Link>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Total facturé"
          value={formatAmount(s?.totalFacture || 0)}
          sub="Factures payées"
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
          title="Payées"
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

      {/* Graphique + Clients récents */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="section-title">{t('dashboard.revenueChart')}</h2>
            <span className="text-xs text-gray-400">12 derniers mois</span>
          </div>
          {chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chart} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={settings.primaryColor || '#00C8D7'} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={settings.primaryColor || '#00C8D7'} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={36} />
                <Tooltip content={<CustomTooltip formatter={formatAmount} />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={settings.primaryColor || '#00C8D7'}
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>{t('dashboard.noData')}</p>
                <Link to="/app/documents/new" className="mt-3 inline-flex items-center gap-1.5 text-primary-600 text-sm font-medium hover:underline">
                  <Plus className="w-4 h-4" /> Créer un document
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Clients récents */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" /> Clients récents
            </h2>
            <Link to="/app/clients" className="text-xs text-primary-600 hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-1">
            {recentClients.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400">Aucun client encore</p>
              </div>
            ) : recentClients.map(client => (
              <Link key={client.id} to={`/app/clients/${client.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors group">
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
                <span className="text-xs text-gray-300 group-hover:text-gray-400">{client._count?.documents || 0} doc</span>
              </Link>
            ))}
          </div>
          <Link to="/app/clients/new"
            className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-primary-300 hover:text-primary-600 transition-colors">
            <Plus className="w-4 h-4" /> Nouveau client
          </Link>
        </div>
      </div>

      {/* Documents récents */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <h2 className="section-title">Documents récents</h2>
          <Link to="/app/documents" className="text-xs text-primary-600 hover:underline">Voir tout</Link>
        </div>

        {recentDocuments.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Aucun document</p>
            <Link to="/app/documents/new" className="mt-3 inline-flex items-center gap-1.5 text-primary-600 text-sm font-medium hover:underline">
              <Plus className="w-4 h-4" /> Créer votre premier document
            </Link>
          </div>
        ) : (
          <>
            {/* Vue carte — mobile uniquement */}
            <div className="sm:hidden divide-y divide-gray-100">
              {recentDocuments.map(doc => (
                <DocCard key={doc.id} doc={doc} formatAmount={formatAmount} />
              ))}
            </div>

            {/* Vue tableau — desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Numéro</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Date</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentDocuments.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/app/documents/${doc.id}`} className="font-medium text-primary-600 text-sm hover:underline">
                          {doc.number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{doc.client?.name}</td>
                      <td className="px-6 py-4">
                        <span className={`badge-${doc.type}`}>{TYPE_LABELS[doc.type]}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                        {formatDate(doc.issuedDate)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-sm text-gray-900">
                        {formatAmount(doc.totalTtc)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={STATUS_BADGES[doc.status]}>{STATUS_LABELS[doc.status]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
