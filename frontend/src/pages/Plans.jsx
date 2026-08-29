import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, Zap, Loader2, X, Clock, AlertCircle, CalendarDays, RefreshCw, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const DURATION_OPTIONS = [
  { months: 1,  label: '1 mois', discount: 0 },
  { months: 3,  label: '3 mois', discount: 5 },
  { months: 6,  label: '6 mois', discount: 10 },
  { months: 12, label: '1 an',   discount: 20 },
];

function computeTotal(price, months, discount) {
  return Math.round(price * months * (1 - discount / 100));
}

const PLAN_ORDER = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

const PLAN_STYLES = {
  FREE:       { badge: 'bg-gray-100 text-gray-700',     border: 'border-gray-200',  popular: false },
  STARTER:    { badge: 'bg-blue-100 text-blue-700',     border: 'border-blue-300',  popular: false },
  PRO:        { badge: 'bg-purple-100 text-purple-700', border: 'border-primary-500 ring-2 ring-primary-400 ring-offset-2', popular: true },
  ENTERPRISE: { badge: 'bg-amber-100 text-amber-700',   border: 'border-amber-300', popular: false },
};

// ── Modal paiement (bottom sheet mobile, modal centré desktop) ────────────────
function PaymentModal({ plan, isRenewal, onClose }) {
  const [duration, setDuration] = useState(DURATION_OPTIONS[0]);
  const [phone, setPhone]       = useState('');
  const [loading, setLoading]   = useState(false);
  const phoneRef = useRef(null);

  const total = computeTotal(plan.price, duration.months, duration.discount);

  // Bloquer le scroll du body quand le modal est ouvert
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
        targetPlan:     plan.key,
        durationMonths: duration.months,
        phone:          cleaned,
      });
      window.location.href = data.data.checkoutUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de paiement. Réessayez.');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      {/* Bottom sheet mobile / modal centré desktop */}
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Poignée mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              {isRenewal ? 'Renouveler le plan' : 'Passer au plan'}{' '}
              <span className={`px-2.5 py-0.5 rounded-full text-sm font-semibold ${PLAN_STYLES[plan.key]?.badge}`}>
                {plan.key.charAt(0) + plan.key.slice(1).toLowerCase()}
              </span>
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {plan.price.toLocaleString('fr-FR')} FCFA / mois
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Sélecteur durée — pills compactes */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Durée</p>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map(opt => {
                const t = computeTotal(plan.price, opt.months, opt.discount);
                const isSel = duration.months === opt.months;
                return (
                  <button
                    key={opt.months}
                    onClick={() => setDuration(opt)}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                      isSel
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {opt.discount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        -{opt.discount}%
                      </span>
                    )}
                    <p className={`text-sm font-bold ${isSel ? 'text-primary-700' : 'text-gray-800'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.toLocaleString('fr-FR')} FCFA
                    </p>
                    {opt.discount > 0 && (
                      <p className="text-[10px] text-gray-400 line-through">
                        {(plan.price * opt.months).toLocaleString('fr-FR')} FCFA
                      </p>
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
                <p className="text-white/60 text-xs mt-0.5">
                  Économie de {(plan.price * duration.months - total).toLocaleString('fr-FR')} FCFA
                </p>
              )}
            </div>

            <div className="bg-black/10 px-5 py-4 space-y-3">
              {/* Champ téléphone */}
              <div>
                <label className="text-white/80 text-xs font-medium block mb-1.5">
                  Numéro Wave / Orange Money / Free Money
                </label>
                <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    ref={phoneRef}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className="flex-1 text-gray-900 text-base font-medium placeholder-gray-300 bg-transparent focus:outline-none"
                    placeholder="7X XXX XX XX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePay()}
                  />
                </div>
              </div>

              {/* Bouton payer */}
              <button
                onClick={handlePay}
                disabled={loading || phone.replace(/[\s\-()]/g, '').length < 8}
                className="w-full bg-white text-primary-700 font-bold py-3.5 rounded-xl text-base disabled:opacity-50 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><Zap className="w-5 h-5" /> Payer {total.toLocaleString('fr-FR')} FCFA</>
                }
              </button>
            </div>
          </div>

          {/* Badges de confiance */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Paiement sécurisé
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-primary-500" /> Activation immédiate
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Page Plans ────────────────────────────────────────────────────────────────
export default function Plans() {
  const { organization } = useAuth();
  const [plans, setPlans]               = useState([]);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isRenewal, setIsRenewal]       = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);

  const currentPlan   = organization?.plan || 'FREE';
  const planExpiresAt = organization?.planExpiresAt || null;

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
    ]).then(([p, c, r]) => {
      setPlans(p);
      setPaymentConfig(c);
      setPendingRequest(r.find(req => req.status === 'pending') || null);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">

      {/* En-tête */}
      <div className="text-center">
        <h1 className="page-title">Plans &amp; Tarifs</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Sans engagement · Activation immédiate · Paiement mobile
        </p>
      </div>

      {/* Bannière expiration */}
      {(subscriptionStatus === 'expiring_soon' || subscriptionStatus === 'expired') && !pendingRequest && (
        <div className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
          subscriptionStatus === 'expired'
            ? 'bg-red-50 border border-red-300 text-red-800'
            : 'bg-orange-50 border border-orange-300 text-orange-800'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="flex-1">
            {subscriptionStatus === 'expired'
              ? <><strong>Abonnement expiré</strong> — Votre plan {currentPlan} a expiré. Renouvelez pour continuer.</>
              : <><strong>Expire dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}</strong> — Renouvelez maintenant pour ne pas perdre l'accès.</>
            }
          </span>
        </div>
      )}

      {/* Bannière paiement en cours */}
      {pendingRequest && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-800">
          <Clock className="w-5 h-5 flex-shrink-0 text-amber-500" />
          <span className="flex-1">
            <strong>Paiement en cours</strong> — Plan <strong>{pendingRequest.targetPlan}</strong> en attente de confirmation.{' '}
          </span>
          <Link
            to={`/payment/return?ref=${pendingRequest.id}`}
            className="underline text-amber-900 hover:text-amber-700 whitespace-nowrap text-xs font-semibold"
          >
            Vérifier →
          </Link>
        </div>
      )}

      {/* Grille de plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map(plan => {
          const style      = PLAN_STYLES[plan.key] || PLAN_STYLES.FREE;
          const isCurrent  = plan.key === currentPlan;
          const isUpgrade  = PLAN_ORDER.indexOf(plan.key) > PLAN_ORDER.indexOf(currentPlan);
          const isEnterprise = plan.key === 'ENTERPRISE';
          const canRenew   = isCurrent && currentPlan !== 'FREE' && plan.price > 0;
          const features   = Array.isArray(plan.features) ? plan.features : [];

          return (
            <div
              key={plan.key}
              className={`relative card p-5 flex flex-col border-2 transition-all ${style.border} ${
                style.popular ? 'shadow-xl' : ''
              }`}
            >
              {style.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Populaire
                  </span>
                </div>
              )}

              {/* Infos plan */}
              <div className="mb-4">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold mb-3 ${style.badge}`}>
                  {plan.key}
                </span>
                <div className="mb-1">
                  {plan.price === 0 ? (
                    <span className="text-2xl font-bold text-gray-900">
                      {isEnterprise ? 'Sur devis' : 'Gratuit'}
                    </span>
                  ) : (
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className="text-2xl font-bold text-gray-900">
                        {plan.price.toLocaleString('fr-FR')}
                      </span>
                      <span className="text-sm text-gray-500">FCFA/mois</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-snug">{plan.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {plan.maxMembers === -1
                    ? 'Utilisateurs illimités'
                    : `${plan.maxMembers} utilisateur${plan.maxMembers > 1 ? 's' : ''} max`}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1 mb-5">
                {features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <div className="space-y-2">
                  <div className="w-full text-center py-2.5 bg-gray-100 text-gray-500 text-sm font-medium rounded-xl">
                    Plan actuel
                  </div>
                  {planExpiresAt && (
                    <div className={`flex items-center justify-center gap-1.5 text-xs rounded-lg py-1.5 px-2 ${
                      subscriptionStatus === 'expired'       ? 'bg-red-50 text-red-600' :
                      subscriptionStatus === 'expiring_soon' ? 'bg-orange-50 text-orange-600' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      <CalendarDays className="w-3.5 h-3.5" />
                      {subscriptionStatus === 'expired'
                        ? `Expiré le ${new Date(planExpiresAt).toLocaleDateString('fr-FR')}`
                        : `Expire le ${new Date(planExpiresAt).toLocaleDateString('fr-FR')}`}
                    </div>
                  )}
                  {canRenew && (
                    <button
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!!pendingRequest}
                      onClick={() => { setSelectedPlan(plan); setIsRenewal(true); }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {pendingRequest ? 'Paiement en cours…' : 'Renouveler'}
                    </button>
                  )}
                </div>
              ) : isEnterprise ? (
                <a
                  href={`mailto:${paymentConfig?.supportEmail || 'contact@factureapp.sn'}?subject=Demande%20plan%20Enterprise`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                >
                  Nous contacter
                </a>
              ) : isUpgrade ? (
                <button
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.key === 'STARTER'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'btn-primary'
                  }`}
                  disabled={!!pendingRequest}
                  onClick={() => { setSelectedPlan(plan); setIsRenewal(false); }}
                >
                  <Zap className="w-4 h-4" />
                  {pendingRequest
                    ? 'Paiement en cours…'
                    : `Choisir ${plan.key.charAt(0) + plan.key.slice(1).toLowerCase()}`}
                </button>
              ) : (
                <div className="w-full text-center py-2.5 bg-gray-50 text-gray-400 text-sm rounded-xl">
                  Plan inférieur
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 pb-4">
        Sans frais cachés · Paiement via Wave, Orange Money, Free Money ou Expresso ·{' '}
        <a href={`mailto:${paymentConfig?.supportEmail || 'contact@factureapp.sn'}`} className="text-primary-600 hover:underline">
          Support
        </a>
      </p>

      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          isRenewal={isRenewal}
          onClose={() => { setSelectedPlan(null); setIsRenewal(false); }}
        />
      )}
    </div>
  );
}
