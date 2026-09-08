import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Check, Zap, Loader2, X, Clock, AlertCircle, CalendarDays,
  RefreshCw, Phone, ShieldCheck, FileText, Users, UserCheck,
  TrendingUp, ArrowRight, ChevronDown, ChevronUp, Receipt,
  CheckCircle2, XCircle, HelpCircle, Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const DURATION_OPTIONS = [
  { months: 1,  label: '1 mois',  discount: 0 },
  { months: 3,  label: '3 mois',  discount: 5 },
  { months: 6,  label: '6 mois',  discount: 10 },
  { months: 12, label: '1 an',    discount: 20 },
];

function computeTotal(price, months, discount) {
  return Math.round(price * months * (1 - discount / 100));
}

const PLAN_ORDER = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

const PLAN_STYLES = {
  FREE:       { badge: 'bg-gray-100 text-gray-700',     border: 'border-gray-200',    gradient: 'from-gray-400 to-gray-500',    popular: false },
  STARTER:    { badge: 'bg-blue-100 text-blue-700',     border: 'border-blue-300',    gradient: 'from-blue-500 to-blue-600',    popular: false },
  PRO:        { badge: 'bg-purple-100 text-purple-700', border: 'border-primary-400', gradient: 'from-[#00C8D7] to-[#007a87]',  popular: true  },
  ENTERPRISE: { badge: 'bg-amber-100 text-amber-700',   border: 'border-amber-300',   gradient: 'from-amber-500 to-amber-600',  popular: false },
};

// ── Modal paiement ────────────────────────────────────────────────────────────
function PaymentModal({ plan, isRenewal, onClose }) {
  const [duration, setDuration] = useState(DURATION_OPTIONS[0]);
  const [phone, setPhone]       = useState('');
  const [loading, setLoading]   = useState(false);
  const phoneRef = useRef(null);
  const total = computeTotal(plan.price, duration.months, duration.discount);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handlePay = async () => {
    const cleaned = phone.replace(/[\s\-()]/g, '');
    if (cleaned.length < 8) {
      toast.error('Entrez votre numéro Wave, Orange Money ou Free Money');
      phoneRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/payments/moneyfusion/checkout', {
        targetPlan: plan.key, durationMonths: duration.months, phone: cleaned,
      });
      window.location.href = data.data.checkoutUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de paiement. Réessayez.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              {isRenewal ? 'Renouveler le plan' : 'Passer au plan'}{' '}
              <span className={`px-2.5 py-0.5 rounded-full text-sm font-semibold ${PLAN_STYLES[plan.key]?.badge}`}>
                {plan.key.charAt(0) + plan.key.slice(1).toLowerCase()}
              </span>
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">{plan.price.toLocaleString('fr-FR')} FCFA / mois</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {/* Durée */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Durée</p>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map(opt => {
                const t = computeTotal(plan.price, opt.months, opt.discount);
                const isSel = duration.months === opt.months;
                return (
                  <button key={opt.months} onClick={() => setDuration(opt)}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                      isSel ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    {opt.discount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        -{opt.discount}%
                      </span>
                    )}
                    <p className={`text-sm font-bold ${isSel ? 'text-primary-700' : 'text-gray-800'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.toLocaleString('fr-FR')} FCFA</p>
                    {opt.discount > 0 && (
                      <p className="text-[10px] text-gray-400 line-through">{(plan.price * opt.months).toLocaleString('fr-FR')} FCFA</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Zone paiement */}
          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#00C8D7] to-[#006b77]">
            <div className="px-5 pt-4 pb-3">
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide mb-1">Total à payer</p>
              <p className="text-3xl font-bold text-white">
                {total.toLocaleString('fr-FR')} <span className="text-lg font-semibold text-white/80">FCFA</span>
              </p>
              {duration.discount > 0 && (
                <p className="text-white/60 text-xs mt-0.5">Économie de {(plan.price * duration.months - total).toLocaleString('fr-FR')} FCFA</p>
              )}
            </div>
            <div className="bg-black/10 px-5 py-4 space-y-3">
              <div>
                <label className="text-white/80 text-xs font-medium block mb-1.5">Numéro Wave / Orange Money / Free Money</label>
                <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input ref={phoneRef} type="tel" inputMode="tel" autoComplete="tel"
                    className="flex-1 text-gray-900 text-base font-medium placeholder-gray-300 bg-transparent focus:outline-none"
                    placeholder="7X XXX XX XX" value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePay()} />
                </div>
              </div>
              <button onClick={handlePay}
                disabled={loading || phone.replace(/[\s\-()]/g, '').length < 8}
                className="w-full bg-white text-primary-700 font-bold py-3.5 rounded-xl text-base disabled:opacity-50 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" /> Payer {total.toLocaleString('fr-FR')} FCFA</>}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Paiement sécurisé</span>
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-primary-500" /> Activation immédiate</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Barre d'utilisation ───────────────────────────────────────────────────────
function UsageBar({ label, used, max, icon: Icon }) {
  const unlimited = max === -1;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / max) * 100));
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-primary-500';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Icon className="w-3.5 h-3.5 text-gray-400" /> {label}
        </div>
        <span className="text-sm font-semibold text-gray-800">
          {used}{unlimited ? '' : `/${max}`}
          {unlimited && <span className="text-xs font-normal text-gray-400 ml-1">/ illimité</span>}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

// ── Carte plan (grille) ───────────────────────────────────────────────────────
function PlanCard({ plan, currentPlan, subscriptionStatus, planExpiresAt, pendingRequest, onUpgrade, paymentConfig, mobile }) {
  const style      = PLAN_STYLES[plan.key] || PLAN_STYLES.FREE;
  const isCurrent  = plan.key === currentPlan;
  const isUpgrade  = PLAN_ORDER.indexOf(plan.key) > PLAN_ORDER.indexOf(currentPlan);
  const isEnterprise = plan.key === 'ENTERPRISE';
  const canRenew   = isCurrent && currentPlan !== 'FREE' && plan.price > 0;
  const features   = Array.isArray(plan.features) ? plan.features : [];

  return (
    <div className={`relative card p-5 flex flex-col border-2 transition-all ${style.border} ${
      isCurrent ? 'shadow-md' : ''} ${style.popular ? 'shadow-xl' : ''} ${
      mobile ? 'snap-center flex-none w-[82vw]' : ''
    }`}>
      {style.popular && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">Populaire</span>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-gray-700 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">✓ Plan actuel</span>
        </div>
      )}
      <div className="mb-4 mt-1">
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold mb-3 ${style.badge}`}>{plan.key}</span>
        <div className="mb-1">
          {plan.price === 0 ? (
            <span className="text-2xl font-bold text-gray-900">{isEnterprise ? 'Sur devis' : 'Gratuit'}</span>
          ) : (
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-2xl font-bold text-gray-900">{plan.price.toLocaleString('fr-FR')}</span>
              <span className="text-sm text-gray-500">FCFA/mois</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 leading-snug">{plan.description}</p>
        <p className="text-xs text-gray-400 mt-1">
          {plan.maxMembers === -1 ? 'Utilisateurs illimités' : `${plan.maxMembers} utilisateur${plan.maxMembers > 1 ? 's' : ''} max`}
        </p>
      </div>
      <ul className="space-y-2 flex-1 mb-5">
        {features.map((feat, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {feat}
          </li>
        ))}
      </ul>
      {isCurrent ? (
        <div className="space-y-2">
          <div className="w-full text-center py-2.5 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl">Plan actuel</div>
          {planExpiresAt && (
            <div className={`flex items-center justify-center gap-1.5 text-xs rounded-lg py-1.5 px-2 ${
              subscriptionStatus === 'expired' ? 'bg-red-50 text-red-600' :
              subscriptionStatus === 'expiring_soon' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-500'
            }`}>
              <CalendarDays className="w-3.5 h-3.5" />
              {subscriptionStatus === 'expired'
                ? `Expiré le ${new Date(planExpiresAt).toLocaleDateString('fr-FR')}`
                : `Expire le ${new Date(planExpiresAt).toLocaleDateString('fr-FR')}`}
            </div>
          )}
          {canRenew && (
            <button disabled={!!pendingRequest} onClick={() => onUpgrade(plan, true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
              <RefreshCw className="w-3.5 h-3.5" /> {pendingRequest ? 'Paiement en cours…' : 'Renouveler'}
            </button>
          )}
        </div>
      ) : isEnterprise ? (
        <a href={`mailto:${paymentConfig?.supportEmail || 'contact@factureapp.sn'}?subject=Demande%20plan%20Enterprise`}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors">
          Nous contacter
        </a>
      ) : isUpgrade ? (
        <button disabled={!!pendingRequest} onClick={() => onUpgrade(plan, false)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
            plan.key === 'PRO' ? 'btn-primary' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}>
          <ArrowRight className="w-4 h-4" />
          {pendingRequest ? 'Paiement en cours…' : `Passer en ${plan.key.charAt(0) + plan.key.slice(1).toLowerCase()}`}
        </button>
      ) : (
        <div className="w-full text-center py-2.5 bg-gray-50 text-gray-400 text-sm rounded-xl">Plan inférieur</div>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function Plans() {
  const { organization } = useAuth();
  const location = useLocation();
  const planSelectorRef = useRef(null);
  const autoOpenedRef = useRef(false);

  const [plans, setPlans]                   = useState([]);
  const [paymentConfig, setPaymentConfig]   = useState(null);
  const [loading, setLoading]               = useState(true);
  const [selectedPlan, setSelectedPlan]     = useState(null);
  const [isRenewal, setIsRenewal]           = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [allRequests, setAllRequests]       = useState([]);
  const [usage, setUsage]                   = useState({ documents: 0, clients: 0, members: 1 });
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [downloadingId, setDownloadingId]       = useState(null);

  const downloadReceipt = async (req) => {
    setDownloadingId(req.id);
    try {
      const res = await api.get(`/upgrades/${req.id}/receipt`, { responseType: 'blob' });
      const year = new Date(req.createdAt).getFullYear();
      const shortId = req.id.slice(0, 8).toUpperCase();
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `REC-${year}-${shortId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Impossible de télécharger le reçu');
    } finally {
      setDownloadingId(null);
    }
  };

  const currentPlan   = organization?.plan || 'FREE';
  const planExpiresAt = organization?.planExpiresAt || null;
  const currentStyle  = PLAN_STYLES[currentPlan] || PLAN_STYLES.FREE;

  const daysRemaining = planExpiresAt
    ? Math.ceil((new Date(planExpiresAt) - Date.now()) / 86_400_000)
    : null;

  const subscriptionStatus =
    !planExpiresAt || currentPlan === 'FREE' ? 'free'
    : daysRemaining <= 0                      ? 'expired'
    : daysRemaining <= 7                      ? 'expiring_soon'
    : 'active';

  useEffect(() => {
    Promise.all([
      api.get('/plans').then(r => r.data.data.plans).catch(() => []),
      api.get('/plans/payment-config').then(r => r.data.data.config).catch(() => null),
      api.get('/upgrades/mine').then(r => r.data.data.requests).catch(() => []),
      api.get('/documents', { params: { limit: 1 } }).then(r => r.data.data.pagination.total).catch(() => 0),
      api.get('/clients', { params: { limit: 1 } }).then(r => r.data.data.pagination.total).catch(() => 0),
    ]).then(([p, c, r, docCount, clientCount]) => {
      setPlans(p);
      setPaymentConfig(c);
      setAllRequests(r);
      setPendingRequest(r.find(req => req.status === 'pending') || null);
      setUsage({ documents: docCount, clients: clientCount, members: organization?.memberCount || 1 });
    }).finally(() => setLoading(false));
  }, [organization]);

  const currentPlanData = plans.find(p => p.key === currentPlan);

  // Auto-ouvrir le modal renouvellement si on vient du bandeau d'abonnement expiré
  useEffect(() => {
    if (location.state?.openRenewal && currentPlanData && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      openUpgrade(currentPlanData, true);
    }
  }, [currentPlanData, location.state]);

  // Historique : toutes les demandes sauf pending sans montant
  const invoiceHistory = allRequests
    .filter(r => r.status === 'approved' || r.status === 'rejected' || r.status === 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleModify = () => {
    setShowPlanSelector(v => !v);
    if (!showPlanSelector) {
      setTimeout(() => planSelectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  };

  const openUpgrade = (plan, renewal = false) => {
    setSelectedPlan(plan);
    setIsRenewal(renewal);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6 pb-8">

      {/* ── Alertes ── */}
      {(subscriptionStatus === 'expiring_soon' || subscriptionStatus === 'expired') && !pendingRequest && (
        <div className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
          subscriptionStatus === 'expired'
            ? 'bg-red-50 border border-red-300 text-red-800'
            : 'bg-orange-50 border border-orange-300 text-orange-800'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="flex-1">
            {subscriptionStatus === 'expired'
              ? <><strong>Abonnement expiré</strong> — Renouvelez pour continuer à utiliser toutes les fonctionnalités.</>
              : <><strong>Expire dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}</strong> — Renouvelez maintenant pour ne pas perdre l'accès.</>
            }
          </span>
          <button
            onClick={() => subscriptionStatus === 'expired' ? openUpgrade(currentPlanData, true) : handleModify()}
            className="text-xs font-semibold underline whitespace-nowrap">
            Renouveler →
          </button>
        </div>
      )}

      {pendingRequest && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-800">
          <Clock className="w-5 h-5 flex-shrink-0 text-amber-500" />
          <span className="flex-1">
            <strong>Paiement en cours</strong> — Plan <strong>{pendingRequest.targetPlan}</strong> en attente de confirmation.
          </span>
          <Link to={`/payment/return?ref=${pendingRequest.id}`}
            className="underline text-amber-900 hover:text-amber-700 whitespace-nowrap text-xs font-semibold">
            Vérifier →
          </Link>
        </div>
      )}

      {/* ── Carte abonnement actuel ── */}
      <div className="card p-0 overflow-hidden">
        <div className={`h-1.5 w-full bg-gradient-to-r ${currentStyle.gradient}`} />
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${currentStyle.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">
                  Plan {currentPlan.charAt(0) + currentPlan.slice(1).toLowerCase()}
                </h2>
                {subscriptionStatus === 'active' && <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Actif</span>}
                {subscriptionStatus === 'expiring_soon' && <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Expire bientôt</span>}
                {subscriptionStatus === 'expired' && <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Expiré</span>}
                {subscriptionStatus === 'free' && <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Gratuit</span>}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {planExpiresAt
                  ? subscriptionStatus === 'expired'
                    ? `Expiré le ${new Date(planExpiresAt).toLocaleDateString('fr-FR')}`
                    : `Se renouvelle le ${new Date(planExpiresAt).toLocaleDateString('fr-FR')}`
                  : 'Accès gratuit sans expiration'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
            {currentPlanData && currentPlan !== 'FREE' && planExpiresAt && subscriptionStatus !== 'expired' ? (
              <p className="text-sm text-gray-400 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                {currentPlanData.price > 0 ? `${currentPlanData.price.toLocaleString('fr-FR')} FCFA / mois` : 'Plan personnalisé'}
              </p>
            ) : <div />}

            <div className="flex items-center gap-2">
              {currentPlanData && currentPlan !== 'FREE' && currentPlanData.price > 0 && (
                <button disabled={!!pendingRequest} onClick={() => openUpgrade(currentPlanData, true)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 disabled:opacity-40 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Renouveler
                </button>
              )}
              <button onClick={handleModify}
                className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-300 hover:bg-primary-50 px-4 py-2 rounded-xl transition-colors">
                {showPlanSelector ? <><ChevronUp className="w-4 h-4" /> Fermer</> : <><ChevronDown className="w-4 h-4" /> Modifier l'abonnement</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Utilisation ── */}
      {currentPlanData && (
        <div className="card p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" /> Utilisation
          </h3>
          <div className="space-y-4">
            <UsageBar label="Documents" used={usage.documents} max={currentPlanData.maxDocuments ?? 10} icon={FileText} />
            <UsageBar label="Clients"   used={usage.clients}   max={currentPlanData.maxClients   ?? 5}  icon={Users} />
            <UsageBar label="Membres"   used={usage.members}   max={currentPlanData.maxMembers   ?? 1}  icon={UserCheck} />
          </div>
        </div>
      )}

      {/* ── Sélecteur de plan (affiché seulement si showPlanSelector) ── */}
      {showPlanSelector && (
        <div ref={planSelectorRef} className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Changer de plan</h3>
            <p className="text-sm text-gray-500">Passez à un plan supérieur à tout moment</p>
          </div>

          {/* Mobile : carousel | Desktop : grille */}
          <div className="sm:hidden flex overflow-x-auto snap-x snap-mandatory gap-4 px-1 pb-3
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {plans.map(plan => (
              <PlanCard key={plan.key} plan={plan} currentPlan={currentPlan}
                subscriptionStatus={subscriptionStatus} planExpiresAt={planExpiresAt}
                pendingRequest={pendingRequest} onUpgrade={openUpgrade}
                paymentConfig={paymentConfig} mobile />
            ))}
          </div>

          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map(plan => (
              <PlanCard key={plan.key} plan={plan} currentPlan={currentPlan}
                subscriptionStatus={subscriptionStatus} planExpiresAt={planExpiresAt}
                pendingRequest={pendingRequest} onUpgrade={openUpgrade}
                paymentConfig={paymentConfig} />
            ))}
          </div>

          <p className="text-center text-xs text-gray-400">
            Sans frais cachés · Wave, Orange Money, Free Money ou Expresso ·{' '}
            <a href={`mailto:${paymentConfig?.supportEmail || 'contact@factureapp.sn'}`} className="text-primary-600 hover:underline">Support</a>
          </p>
        </div>
      )}

      {/* ── Historique des paiements ── */}
      <div className="card p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-gray-400" /> Historique des paiements
        </h3>

        {invoiceHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun paiement pour le moment</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                    <th className="text-left pb-3">Date</th>
                    <th className="text-left pb-3">Plan</th>
                    <th className="text-left pb-3">Durée</th>
                    <th className="text-right pb-3">Montant</th>
                    <th className="text-center pb-3">Statut</th>
                    <th className="text-right pb-3">Reçu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoiceHistory.map(req => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 text-gray-600">
                        {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${PLAN_STYLES[req.targetPlan]?.badge || 'bg-gray-100 text-gray-700'}`}>
                          {req.targetPlan}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">
                        {req.durationMonths ? `${req.durationMonths} mois` : '—'}
                      </td>
                      <td className="py-3 text-right font-semibold text-gray-800">
                        {req.amount
                          ? `${Number(req.amount).toLocaleString('fr-FR')} FCFA`
                          : '—'}
                      </td>
                      <td className="py-3 text-center">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-3 text-right">
                        {req.status === 'approved' && (
                          <button onClick={() => downloadReceipt(req)} disabled={downloadingId === req.id}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline disabled:opacity-50">
                            {downloadingId === req.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Download className="w-3.5 h-3.5" />}
                            PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {invoiceHistory.map(req => (
                <div key={req.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${PLAN_STYLES[req.targetPlan]?.badge || 'bg-gray-100 text-gray-700'}`}>
                        {req.targetPlan}
                      </span>
                      {req.durationMonths && <span className="text-xs text-gray-400">{req.durationMonths} mois</span>}
                    </div>
                    <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-sm font-semibold text-gray-800">
                      {req.amount ? `${Number(req.amount).toLocaleString('fr-FR')} FCFA` : '—'}
                    </p>
                    <StatusBadge status={req.status} />
                    {req.status === 'approved' && (
                      <button onClick={() => downloadReceipt(req)} disabled={downloadingId === req.id}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline mt-0.5 disabled:opacity-50">
                        {downloadingId === req.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Download className="w-3 h-3" />}
                        Reçu PDF
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Modal paiement ── */}
      {selectedPlan && (
        <PaymentModal plan={selectedPlan} isRenewal={isRenewal}
          onClose={() => setSelectedPlan(null)} />
      )}

    </div>
  );
}

// ── Badge statut paiement ─────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === 'approved') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Validé
    </span>
  );
  if (status === 'rejected') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> Rejeté
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
      <HelpCircle className="w-3 h-3" /> En attente
    </span>
  );
}
