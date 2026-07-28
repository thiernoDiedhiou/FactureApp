import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2, ArrowLeft, Loader2, Users, FileText, UserCheck,
  CalendarDays, CheckCircle, Ban, AlertTriangle, XCircle, Clock,
  CreditCard, TrendingUp, Mail, Globe, Phone, MapPin, Copy, CheckCheck
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PLAN_COLORS = {
  FREE:       'bg-gray-100 text-gray-600',
  STARTER:    'bg-blue-100 text-blue-700',
  PRO:        'bg-purple-100 text-purple-700',
  ENTERPRISE: 'bg-amber-100 text-amber-700'
};

const SUB_STATUS = {
  free:          { label: 'Gratuit',        class: 'bg-gray-100 text-gray-500',     icon: Clock },
  active:        { label: 'Actif',          class: 'bg-green-100 text-green-700',   icon: CheckCircle },
  expiring_soon: { label: 'Expire bientôt', class: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  expired:       { label: 'Expiré',         class: 'bg-red-100 text-red-700',       icon: XCircle },
  legacy:        { label: 'Hérité',         class: 'bg-gray-100 text-gray-500',     icon: Clock }
};

const DOC_STATUS_STYLES = {
  paye:       'bg-green-100 text-green-700',
  en_attente: 'bg-amber-100 text-amber-700',
  annule:     'bg-red-100 text-red-600'
};
const DOC_STATUS_LABELS = { paye: 'Payé', en_attente: 'En attente', annule: 'Annulé' };
const DOC_TYPE_LABELS   = { facture: 'Facture', devis: 'Devis', proforma: 'Proforma' };
const ROLE_STYLES = {
  OWNER:  'bg-amber-100 text-amber-700',
  ADMIN:  'bg-blue-100 text-blue-700',
  MEMBER: 'bg-gray-100 text-gray-600'
};

const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatCFA  = n => n > 0 ? Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA' : '0 FCFA';

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} className="p-1 text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0" title="Copier">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function ContactRow({ icon: Icon, label, value, href, color = 'text-gray-400' }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className={`p-2 rounded-lg bg-gray-50 flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        {href
          ? <a href={href} className="text-sm text-gray-900 hover:text-primary-600 transition-colors truncate block font-medium">{value}</a>
          : <p className="text-sm text-gray-900 truncate">{value}</p>
        }
      </div>
      <CopyButton value={value} />
    </div>
  );
}

export default function AdminOrganizationDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [org, setOrg]               = useState(null);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('apercu');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    api.get(`/admin/organizations/${id}/detail`)
      .then(r => setOrg(r.data.data.organization))
      .catch(() => { toast.error('Organisation introuvable'); navigate('/admin/organizations'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleToggleSuspend = async () => {
    if (!window.confirm(`${org.suspended ? 'Réactiver' : 'Suspendre'} "${org.name}" ?`)) return;
    setActionLoading('suspend');
    try {
      const { data } = await api.patch(`/admin/organizations/${id}/suspend`);
      toast.success(data.message);
      setOrg(prev => ({ ...prev, suspended: !prev.suspended }));
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setActionLoading(null); }
  };

  const handlePlanChange = async (plan) => {
    setActionLoading('plan');
    try {
      const { data } = await api.patch(`/admin/organizations/${id}/plan`, { plan });
      toast.success(data.message);
      setOrg(prev => ({ ...prev, plan }));
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setActionLoading(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
    </div>
  );
  if (!org) return null;

  const subSt   = SUB_STATUS[org.subscriptionStatus] || SUB_STATUS.free;
  const SubIcon = subSt.icon;
  const owner   = org.members?.find(m => m.role === 'OWNER');

  const TABS = [
    { key: 'apercu',      label: 'Aperçu' },
    { key: 'membres',     label: `Membres (${org.members?.length || 0})` },
    { key: 'documents',   label: `Docs (${org._count?.documents || 0})` },
    { key: 'abonnements', label: `Abonnements (${org.subscriptions?.length || 0})` },
    { key: 'demandes',    label: `Upgrades (${org.upgradeRequests?.length || 0})` }
  ];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/admin/organizations')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors mt-0.5 flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>

        <div className="flex-1 min-w-0">
          {/* Nom + badges */}
          <div className="flex items-start gap-2 flex-wrap">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Building2 className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{org.name}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{org.slug}</p>
            </div>
          </div>
          {/* Badges sur ligne séparée sur mobile */}
          <div className="flex flex-wrap gap-1.5 mt-2 ml-11">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PLAN_COLORS[org.plan]}`}>{org.plan}</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${subSt.class}`}>
              <SubIcon className="w-3 h-3" />{subSt.label}
            </span>
            {org.suspended && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-600 rounded-full text-xs font-semibold">
                <Ban className="w-3 h-3" /> Suspendue
              </span>
            )}
          </div>
        </div>

        {/* Actions — icônes seules sur mobile, texte sur sm+ */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleToggleSuspend}
            disabled={!!actionLoading}
            title={org.suspended ? 'Réactiver' : 'Suspendre'}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              org.suspended ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {actionLoading === 'suspend'
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : org.suspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />
            }
            <span className="hidden sm:inline">{org.suspended ? 'Réactiver' : 'Suspendre'}</span>
          </button>
          <Link
            to="/admin/subscriptions"
            title="Abonnements"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Abonnement</span>
          </Link>
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: UserCheck,  label: 'Clients',    value: org._count?.clients   || 0, color: 'text-blue-600 bg-blue-50' },
          { icon: FileText,   label: 'Documents',  value: org._count?.documents || 0, color: 'text-green-600 bg-green-50' },
          { icon: Users,      label: 'Membres',    value: org.members?.length   || 0, color: 'text-purple-600 bg-purple-50' },
          { icon: TrendingUp, label: 'CA total',   value: formatCFA(org.totalRevenue),color: 'text-amber-600 bg-amber-50' }
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`inline-flex p-2 rounded-xl mb-2 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div className="flex gap-0 border-b border-gray-200 overflow-x-auto scrollbar-none -mx-1 px-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px flex-shrink-0 ${
              tab === t.key
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Aperçu ─────────────────────────────────────────── */}
      {tab === 'apercu' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Infos + Contacts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Informations</h2>
            <dl className="space-y-2.5 text-sm">
              {[
                { label: 'Slug',    value: org.slug },
                { label: 'Plan',    value: <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${PLAN_COLORS[org.plan]}`}>{org.plan}</span> },
                { label: 'Créée',   value: formatDate(org.createdAt) },
                { label: 'NINEA',   value: org.settings?.ninea || '—' }
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <dt className="w-20 flex-shrink-0 text-gray-400 font-medium">{label}</dt>
                  <dd className="text-gray-700 flex-1 break-all">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="pt-3 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contacts</h3>
              <ContactRow icon={Users}  label="Propriétaire"      value={owner?.user?.name} />
              <ContactRow icon={Mail}   label="Email propriétaire" value={owner?.user?.email}  href={owner?.user?.email ? `mailto:${owner.user.email}` : null} color="text-blue-500" />
              <ContactRow icon={Mail}   label="Email organisation" value={org.settings?.email}  href={org.settings?.email ? `mailto:${org.settings.email}` : null} color="text-blue-500" />
              <ContactRow icon={Phone}  label="Téléphone"          value={org.settings?.phone}  href={org.settings?.phone ? `tel:${org.settings.phone}` : null} color="text-green-500" />
              <ContactRow icon={Globe}  label="Site web"           value={org.settings?.website} href={org.settings?.website} color="text-purple-500" />
              <ContactRow icon={MapPin} label="Adresse"            value={org.settings?.address} color="text-gray-400" />
            </div>
          </div>

          {/* Abonnement */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-500" /> Abonnement
            </h2>
            <dl className="space-y-2.5 text-sm">
              {[
                { label: 'Statut',     value: <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${subSt.class}`}><SubIcon className="w-3 h-3" />{subSt.label}</span> },
                { label: 'Plan',       value: org.plan },
                { label: 'Début',      value: formatDate(org.planStartedAt) },
                { label: 'Expire le',  value: formatDate(org.planExpiresAt) },
                { label: 'Restants',   value: org.daysRemaining !== null ? `${org.daysRemaining}j` : '—' },
                { label: 'Renouv.',    value: `${org.subscriptions?.length || 0}×` }
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <dt className="w-20 flex-shrink-0 text-gray-400 font-medium">{label}</dt>
                  <dd className="text-gray-700">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-2">Changer le plan</p>
              <div className="flex gap-2 flex-wrap">
                {['FREE', 'STARTER', 'PRO', 'ENTERPRISE'].map(p => (
                  <button
                    key={p}
                    onClick={() => handlePlanChange(p)}
                    disabled={org.plan === p || !!actionLoading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      org.plan === p
                        ? PLAN_COLORS[p] + ' opacity-60 cursor-default'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Membres ────────────────────────────────────────── */}
      {tab === 'membres' && (
        <div className="space-y-3">
          {/* Cards (mobile) */}
          <div className="sm:hidden space-y-3">
            {org.members?.map(m => (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 text-sm font-bold">{m.user.name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{m.user.name}</p>
                    <a href={`mailto:${m.user.email}`} className="text-xs text-gray-400 hover:text-blue-500 truncate block">{m.user.email}</a>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${ROLE_STYLES[m.role]}`}>{m.role}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className={`flex items-center gap-1 ${m.user.isEmailVerified ? 'text-green-600' : 'text-gray-400'}`}>
                    {m.user.isEmailVerified ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {m.user.isEmailVerified ? 'Vérifié' : 'Non vérifié'}
                  </span>
                  <span>Rejoint {formatDate(m.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Table (sm+) */}
          <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Membre</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Rôle</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Email vérifié</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Rejoint le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {org.members?.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 text-xs font-bold">{m.user.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{m.user.name}</p>
                          <a href={`mailto:${m.user.email}`} className="text-xs text-gray-400 hover:text-blue-500">{m.user.email}</a>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_STYLES[m.role]}`}>{m.role}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {m.user.isEmailVerified
                        ? <span className="inline-flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="w-3.5 h-3.5" /> Vérifié</span>
                        : <span className="inline-flex items-center gap-1 text-gray-400 text-xs"><XCircle className="w-3.5 h-3.5" /> Non vérifié</span>
                      }
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-400">{formatDate(m.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Documents ──────────────────────────────────────── */}
      {tab === 'documents' && (
        <>
          {org.recentDocuments?.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">Aucun document</div>
          ) : (
            <>
              {/* Cards (mobile) */}
              <div className="sm:hidden space-y-3">
                {org.recentDocuments?.map(doc => (
                  <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-mono text-xs font-semibold text-gray-700">{doc.number}</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">{doc.client?.name || '—'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${DOC_STATUS_STYLES[doc.status]}`}>
                        {DOC_STATUS_LABELS[doc.status] || doc.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{DOC_TYPE_LABELS[doc.type] || doc.type} · {formatDate(doc.issuedDate)}</span>
                      <span className="font-bold text-gray-900">{formatCFA(doc.totalTtc)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Table (sm+) */}
              <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-gray-600">Numéro</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Client</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Type</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Statut</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Montant TTC</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {org.recentDocuments?.map(doc => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-gray-700">{doc.number}</td>
                        <td className="px-4 py-3 text-gray-700">{doc.client?.name || '—'}</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">{DOC_TYPE_LABELS[doc.type] || doc.type}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DOC_STATUS_STYLES[doc.status]}`}>
                            {DOC_STATUS_LABELS[doc.status] || doc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-gray-900">{formatCFA(doc.totalTtc)}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{formatDate(doc.issuedDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {org._count?.documents > 10 && (
            <p className="text-center text-xs text-gray-400">Affichage des 10 derniers sur {org._count.documents}</p>
          )}
        </>
      )}

      {/* ── Abonnements ────────────────────────────────────── */}
      {tab === 'abonnements' && (
        <div className="space-y-3">
          {org.subscriptions?.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">Aucun abonnement enregistré</div>
          ) : org.subscriptions?.map((sub, i) => (
            <div key={sub.id} className={`bg-white rounded-2xl border p-4 sm:p-5 ${i === 0 ? 'border-amber-200' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PLAN_COLORS[sub.plan]}`}>{sub.plan}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCFA(sub.amount)}</span>
                  <span className="text-xs text-gray-400">{sub.durationMonths} mois</span>
                  {i === 0 && <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">Actuel</span>}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>{formatDate(sub.startDate)} → {formatDate(sub.endDate)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">Validé le {formatDate(sub.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Upgrades ───────────────────────────────────────── */}
      {tab === 'demandes' && (
        <div className="space-y-3">
          {org.upgradeRequests?.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">Aucune demande</div>
          ) : org.upgradeRequests?.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PLAN_COLORS[req.targetPlan]}`}>{req.targetPlan}</span>
                  <span className="text-sm font-semibold text-gray-900">{req.amount.toLocaleString('fr-FR')} FCFA</span>
                  <span className="text-xs text-gray-500">{req.durationMonths} mois · {req.paymentMethod}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                  req.status === 'validated' ? 'bg-green-100 text-green-700' :
                  req.status === 'rejected'  ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                }`}>
                  {req.status === 'validated' ? 'Validée' : req.status === 'rejected' ? 'Rejetée' : 'En attente'}
                </span>
              </div>
              {req.transactionRef && (
                <p className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded inline-block mb-1">{req.transactionRef}</p>
              )}
              <p className="text-xs text-gray-400">{formatDate(req.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
