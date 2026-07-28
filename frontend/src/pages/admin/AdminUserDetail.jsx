import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users, ArrowLeft, Loader2, FileText, Building2,
  CheckCircle, XCircle, ShieldCheck, Shield, Mail,
  CalendarDays, Clock, AlertTriangle, Copy, CheckCheck
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const PLAN_COLORS = {
  FREE:       'bg-gray-100 text-gray-600',
  STARTER:    'bg-blue-100 text-blue-700',
  PRO:        'bg-purple-100 text-purple-700',
  ENTERPRISE: 'bg-amber-100 text-amber-700'
};

const ROLE_STYLES = {
  OWNER:  'bg-amber-100 text-amber-700',
  ADMIN:  'bg-blue-100 text-blue-700',
  MEMBER: 'bg-gray-100 text-gray-600'
};

const SUB_STATUS = {
  free:          { label: 'Gratuit',        class: 'text-gray-400' },
  active:        { label: 'Actif',          class: 'text-green-600' },
  expiring_soon: { label: 'Expire bientôt', class: 'text-orange-600' },
  expired:       { label: 'Expiré',         class: 'text-red-600' },
  legacy:        { label: 'Hérité',         class: 'text-gray-400' }
};

const DOC_TYPE_LABELS = { facture: 'Facture', devis: 'Devis', proforma: 'Proforma' };
const DOC_STATUS_STYLES = {
  paye:       'bg-green-100 text-green-700',
  en_attente: 'bg-amber-100 text-amber-700',
  annule:     'bg-red-100 text-red-600'
};

const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatCFA  = n => n > 0 ? Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA' : '0 FCFA';

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1 text-gray-300 hover:text-gray-500 transition-colors ml-1" title="Copier">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function AdminUserDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user: me } = useAuth();

  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tab, setTab]             = useState('apercu');

  useEffect(() => {
    api.get(`/admin/users/${id}/detail`)
      .then(r => setUser(r.data.data.user))
      .catch(() => { toast.error('Utilisateur introuvable'); navigate('/admin/users'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleToggleSuperAdmin = async () => {
    const action = user.isSuperAdmin ? 'révoquer les droits Super Admin de' : 'promouvoir';
    if (!window.confirm(`${action} ${user.name} ?`)) return;
    setActionLoading(true);
    try {
      const { data } = await api.patch(`/admin/users/${id}/superadmin`);
      toast.success(data.message);
      setUser(prev => ({ ...prev, isSuperAdmin: !prev.isSuperAdmin }));
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setActionLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
    </div>
  );

  if (!user) return null;

  const isMe = user.id === me?.id;

  const TABS = [
    { key: 'apercu',      label: 'Aperçu' },
    { key: 'organisations', label: `Organisations (${user.memberships?.length || 0})` },
    { key: 'documents',   label: `Documents (${user.totalDocuments || 0})` }
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/admin/users')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors mt-0.5 flex-shrink-0">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary-700 font-bold">{user.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                {user.name}
                {isMe && <span className="ml-1.5 text-sm font-normal text-gray-400">(vous)</span>}
              </h1>
              <a href={`mailto:${user.email}`} className="text-xs text-gray-400 hover:text-blue-500 truncate block">{user.email}</a>
            </div>
          </div>
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2 ml-11">
            {user.isSuperAdmin ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                <Shield className="w-3.5 h-3.5" /> Utilisateur
              </span>
            )}
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
              user.isEmailVerified ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
            }`}>
              {user.isEmailVerified ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {user.isEmailVerified ? 'Vérifié' : 'Non vérifié'}
            </span>
          </div>
        </div>
        {!isMe && (
          <button
            onClick={handleToggleSuperAdmin}
            disabled={actionLoading}
            title={user.isSuperAdmin ? 'Révoquer Super Admin' : 'Promouvoir Super Admin'}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0 ${
              user.isSuperAdmin ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span className="hidden sm:inline">{user.isSuperAdmin ? 'Révoquer' : 'Promouvoir'}</span>
          </button>
        )}
      </div>

      {/* ── KPIs ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Building2,    label: `Org${(user.memberships?.length || 0) > 1 ? 's' : ''}`, value: user.memberships?.length || 0, color: 'text-blue-600 bg-blue-50' },
          { icon: FileText,     label: 'Documents',  value: user.totalDocuments || 0,               color: 'text-green-600 bg-green-50' },
          { icon: CalendarDays, label: 'Inscrit le', value: formatDate(user.createdAt),              color: 'text-purple-600 bg-purple-50' }
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`inline-flex p-2 rounded-xl mb-2 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{value}</p>
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

      {/* Aperçu */}
      {tab === 'apercu' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Informations du compte</h2>

            {/* Contact principal */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 font-bold text-xl">{user.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">
                    {user.isSuperAdmin ? 'Super Administrateur' : 'Utilisateur'} · Inscrit le {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>

              {/* Email cliquable */}
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2.5 border border-gray-100">
                <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">Email</p>
                  <a
                    href={`mailto:${user.email}`}
                    className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors truncate block"
                  >
                    {user.email}
                  </a>
                </div>
                <CopyButton value={user.email} />
                <a
                  href={`mailto:${user.email}`}
                  className="flex-shrink-0 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  Écrire
                </a>
              </div>

              {/* Statuts */}
              <div className="flex gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  user.isEmailVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {user.isEmailVerified ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {user.isEmailVerified ? 'Email vérifié' : 'Email non vérifié'}
                </span>
                {user.isSuperAdmin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    <ShieldCheck className="w-3 h-3" /> Super Admin
                  </span>
                )}
              </div>
            </div>

            <dl className="space-y-2.5 text-sm">
              {[
                { label: 'Inscrit le',    value: formatDate(user.createdAt) },
                { label: 'Mis à jour le', value: formatDate(user.updatedAt) }
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <dt className="w-32 flex-shrink-0 text-gray-400 font-medium">{label}</dt>
                  <dd className="text-gray-700">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Organisations en aperçu */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">Organisations</h2>
            {user.memberships?.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune organisation</p>
            ) : user.memberships?.map(m => {
              const subSt = SUB_STATUS[m.subscriptionStatus] || SUB_STATUS.free;
              return (
                <Link
                  key={m.organizationId}
                  to={`/admin/organizations/${m.organizationId}/detail`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-amber-600 transition-colors truncate">
                      {m.organization.name}
                    </p>
                    <p className={`text-xs ${subSt.class}`}>{subSt.label}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${PLAN_COLORS[m.organization.plan]}`}>
                    {m.organization.plan}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${ROLE_STYLES[m.role]}`}>
                    {m.role}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Organisations détaillées */}
      {tab === 'organisations' && (
        <div className="space-y-4">
          {user.memberships?.map(m => {
            const subSt = SUB_STATUS[m.subscriptionStatus] || SUB_STATUS.free;
            return (
              <div key={m.organizationId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{m.organization.name}</p>
                      <p className="text-xs text-gray-400">{m.organization.slug}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PLAN_COLORS[m.organization.plan]}`}>
                      {m.organization.plan}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_STYLES[m.role]}`}>
                      {m.role}
                    </span>
                  </div>
                  <Link
                    to={`/admin/organizations/${m.organizationId}/detail`}
                    className="text-xs text-amber-600 hover:underline font-medium"
                  >
                    Voir l'organisation →
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="font-bold text-gray-900">{m.organization._count?.clients || 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Clients</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="font-bold text-gray-900">{m.organization._count?.documents || 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Documents</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className={`font-bold text-sm ${subSt.class}`}>{subSt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Abonnement</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Documents créés ────────────────────────────────── */}
      {tab === 'documents' && (
        <>
          {user.recentDocuments?.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">Aucun document créé</div>
          ) : (
            <>
              {/* Cards (mobile) */}
              <div className="sm:hidden space-y-3">
                {user.recentDocuments?.map(doc => (
                  <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <p className="font-mono text-xs font-semibold text-gray-700">{doc.number}</p>
                        <p className="text-sm font-medium text-gray-900">{doc.client?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{doc.organization?.name}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${DOC_STATUS_STYLES[doc.status]}`}>
                        {doc.status === 'paye' ? 'Payé' : doc.status === 'en_attente' ? 'En attente' : 'Annulé'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
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
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Organisation</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Client</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Statut</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Montant</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {user.recentDocuments?.map(doc => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-gray-700">{doc.number}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{doc.organization?.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{doc.client?.name || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DOC_STATUS_STYLES[doc.status]}`}>
                            {doc.status === 'paye' ? 'Payé' : doc.status === 'en_attente' ? 'En attente' : 'Annulé'}
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
          {user.totalDocuments > 10 && (
            <p className="text-center text-xs text-gray-400">Affichage des 10 derniers sur {user.totalDocuments}</p>
          )}
        </>
      )}
    </div>
  );
}
