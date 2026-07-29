import { useState, useEffect, useRef } from 'react';
import { Check, Zap, Loader2, X, Clock, AlertCircle, CalendarDays, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const DURATION_OPTIONS = [
  { months: 1,  label: '1 mois', discount: 0 },
  { months: 3,  label: '3 mois', discount: 5 },
  { months: 6,  label: '6 mois', discount: 10 },
  { months: 12, label: '1 an',   discount: 20 }
];

function computeTotal(monthlyPrice, months, discount) {
  return Math.round(monthlyPrice * months * (1 - discount / 100));
}

const PLAN_STYLES = {
  FREE:       { badge: 'bg-gray-100 text-gray-700',     btn: 'btn-secondary justify-center',                                                                                                               border: 'border-gray-200',  popular: false },
  STARTER:    { badge: 'bg-blue-100 text-blue-700',     btn: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors justify-center',   border: 'border-blue-400',  popular: false },
  PRO:        { badge: 'bg-purple-100 text-purple-700', btn: 'btn-primary justify-center',                                                                                                                border: 'border-primary-500 ring-2 ring-primary-400 ring-offset-2', popular: true },
  ENTERPRISE: { badge: 'bg-amber-100 text-amber-700',   btn: 'bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors justify-center', border: 'border-amber-400',  popular: false }
};

function PaymentModal({ plan, isRenewal, onClose }) {
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[0]);
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const phoneRef = useRef(null);

  const totalAmount = computeTotal(plan.price, selectedDuration.months, selectedDuration.discount);

  const handlePay = async () => {
    const cleaned = phone.replace(/[\s\-]/g, '');
    if (cleaned.length < 8) {
      toast.error('Entrez votre numéro Wave, Orange Money ou Free Money');
      phoneRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/payments/moneyfusion/checkout', {
        targetPlan:     plan.key,
        durationMonths: selectedDuration.months,
        phone:          cleaned
      });
      window.location.href = data.data.checkoutUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de paiement. Réessayez.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              {isRenewal ? 'Renouveler' : 'Passer au plan'}{' '}
              <span className={`px-2 py-0.5 rounded-full text-sm ${PLAN_STYLES[plan.key]?.badge}`}>{plan.key}</span>
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {plan.price.toLocaleString('fr-FR')} FCFA / mois
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Durée */}
          <div>
            <p className="text-sm text-gray-600 font-medium mb-3">Durée d'abonnement :</p>
            <div className="space-y-2">
              {DURATION_OPTIONS.map(opt => {
                const total = computeTotal(plan.price, opt.months, opt.discount);
                const isSelected = selectedDuration.months === opt.months;
                return (
                  <button
                    key={opt.months}
                    onClick={() => setSelectedDuration(opt)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${
                      isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary-500' : 'border-gray-300'}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
                        {opt.discount > 0 && <p className="text-xs text-green-600 font-medium">-{opt.discount}% de remise</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">{total.toLocaleString('fr-FR')} FCFA</p>
                      {opt.discount > 0 && (
                        <p className="text-xs text-gray-400 line-through">{(plan.price * opt.months).toLocaleString('fr-FR')} FCFA</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paiement Money Fusion */}
          <div className="rounded-xl bg-gradient-to-r from-[#00C8D7] to-[#007a87] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-white text-xl">{totalAmount.toLocaleString('fr-FR')} FCFA</p>
              <p className="text-white/70 text-xs text-right leading-relaxed">
                Wave · Orange Money<br />Free Money · Expresso
              </p>
            </div>
            <div className="flex gap-2">
              <input
                ref={phoneRef}
                type="tel"
                className="flex-1 bg-white/20 text-white placeholder-white/60 rounded-lg px-3 py-2.5 text-sm border border-white/30 focus:outline-none focus:border-white"
                placeholder="7X XXX XX XX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePay()}
              />
              <button
                onClick={handlePay}
                disabled={loading || phone.replace(/[\s\-]/g, '').length < 8}
                className="bg-white text-primary-700 font-bold px-5 py-2.5 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors flex items-center gap-2 flex-shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> Payer</>}
              </button>
            </div>
            <p className="text-white/60 text-xs text-center">
              Activation immédiate — paiement sécurisé via Money Fusion
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

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
    ? Math.ceil((new Date(planExpiresAt) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const subscriptionStatus = !planExpiresAt || currentPlan === 'FREE'
    ? 'free'
    : daysRemaining <= 0
      ? 'expired'
      : daysRemaining <= 7
        ? 'expiring_soon'
        : 'active';

  useEffect(() => {
    const fetchPlans  = api.get('/plans').then(r => r.data.data.plans).catch(() => []);
    const fetchConfig = api.get('/plans/payment-config').then(r => r.data.data.config).catch(() => null);
    const fetchMine   = api.get('/upgrades/mine').then(r => r.data.data.requests).catch(() => []);

    Promise.all([fetchPlans, fetchConfig, fetchMine]).then(([p, c, r]) => {
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
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="page-title">Choisissez votre plan</h1>
        <p className="text-gray-500 mt-2">
          Passez au plan supérieur pour débloquer plus d'utilisateurs et de fonctionnalités.
        </p>
      </div>

      {/* Bannière expiration imminente ou dépassée */}
      {(subscriptionStatus === 'expiring_soon' || subscriptionStatus === 'expired') && !pendingRequest && (
        <div className={`mb-6 flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
          subscriptionStatus === 'expired'
            ? 'bg-red-50 border border-red-300 text-red-800'
            : 'bg-orange-50 border border-orange-300 text-orange-800'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">
            {subscriptionStatus === 'expired'
              ? <><strong>Abonnement expiré</strong> — Votre plan {currentPlan} a expiré le{' '}
                  {new Date(planExpiresAt).toLocaleDateString('fr-FR')}. Renouvelez pour continuer à bénéficier de toutes les fonctionnalités.</>
              : <><strong>Expire bientôt</strong> — Votre plan {currentPlan} expire dans{' '}
                  <strong>{daysRemaining} jour{daysRemaining > 1 ? 's' : ''}</strong> ({new Date(planExpiresAt).toLocaleDateString('fr-FR')}).</>
            }
          </span>
        </div>
      )}

      {/* Bannière paiement en cours */}
      {pendingRequest && (
        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-800">
          <Clock className="w-5 h-5 flex-shrink-0 text-amber-500" />
          <span className="flex-1">
            <strong>Paiement en cours</strong> — Votre paiement pour le plan{' '}
            <strong>{pendingRequest.targetPlan}</strong> est en attente de confirmation.{' '}
            <a href={`/payment/return?ref=${pendingRequest.id}`} className="underline text-amber-900 hover:text-amber-700">
              Vérifier le statut →
            </a>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan) => {
          const style = PLAN_STYLES[plan.key] || PLAN_STYLES.FREE;
          const isCurrent   = plan.key === currentPlan;
          const features    = Array.isArray(plan.features) ? plan.features : [];
          const isEnterprise = plan.key === 'ENTERPRISE';
          const PLAN_ORDER   = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
          const isUpgrade    = PLAN_ORDER.indexOf(plan.key) > PLAN_ORDER.indexOf(currentPlan);
          const canRenew     = isCurrent && currentPlan !== 'FREE' && plan.price > 0;

          return (
            <div
              key={plan.key}
              className={`relative card p-6 flex flex-col border-2 transition-all ${style.border} ${style.popular ? 'shadow-xl' : ''}`}
            >
              {style.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Populaire
                  </span>
                </div>
              )}

              <div className="mb-5">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold mb-3 ${style.badge}`}>
                  {plan.key}
                </span>
                <div className="mb-1">
                  {isEnterprise && plan.price === 0 ? (
                    <span className="text-2xl font-bold text-gray-900">Sur devis</span>
                  ) : plan.price === 0 ? (
                    <span className="text-2xl font-bold text-gray-900">Gratuit</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900">
                        {plan.price.toLocaleString('fr-FR')}
                      </span>
                      <span className="text-sm text-gray-500">FCFA/mois</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">{plan.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {plan.maxMembers === -1
                    ? 'Utilisateurs illimités'
                    : `${plan.maxMembers} utilisateur${plan.maxMembers > 1 ? 's' : ''} max`}
                </p>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="space-y-2">
                  <div className="w-full text-center py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-xl">
                    Plan actuel
                  </div>
                  {planExpiresAt && (
                    <div className={`flex items-center justify-center gap-1.5 text-xs rounded-lg py-1.5 px-2 ${
                      subscriptionStatus === 'expired'      ? 'bg-red-50 text-red-600'    :
                      subscriptionStatus === 'expiring_soon'? 'bg-orange-50 text-orange-600' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      <CalendarDays className="w-3.5 h-3.5" />
                      {subscriptionStatus === 'expired'
                        ? `Expiré le ${new Date(planExpiresAt).toLocaleDateString('fr-FR')}`
                        : `Expire le ${new Date(planExpiresAt).toLocaleDateString('fr-FR')}`
                      }
                    </div>
                  )}
                  {canRenew && (
                    <button
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!!pendingRequest}
                      onClick={() => { setSelectedPlan(plan); setIsRenewal(true); }}
                      title={pendingRequest ? 'Un paiement est déjà en cours' : ''}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {pendingRequest ? 'Paiement en cours…' : 'Renouveler'}
                    </button>
                  )}
                </div>
              ) : isEnterprise ? (
                <a
                  href={`mailto:${paymentConfig?.supportEmail || 'contact@factureapp.sn'}?subject=Demande%20plan%20Enterprise`}
                  className={style.btn}
                >
                  Nous contacter
                </a>
              ) : isUpgrade ? (
                <button
                  className={style.btn}
                  disabled={!!pendingRequest}
                  onClick={() => { setSelectedPlan(plan); setIsRenewal(false); }}
                  title={pendingRequest ? 'Un paiement est déjà en cours' : ''}
                >
                  <Zap className="w-4 h-4" />
                  {pendingRequest ? 'Paiement en cours…' : `Passer au ${plan.key.charAt(0) + plan.key.slice(1).toLowerCase()}`}
                </button>
              ) : (
                <div className="w-full text-center py-2.5 bg-gray-50 text-gray-400 text-sm rounded-xl flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Plan inférieur
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">
        Abonnement sans engagement — 1 à 12 mois, sans frais cachés. Pour toute question :{' '}
        <a href={`mailto:${paymentConfig?.supportEmail || 'contact@factureapp.sn'}`} className="text-primary-600 hover:underline">
          {paymentConfig?.supportEmail || 'contact@factureapp.sn'}
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
