import { useState, useEffect } from 'react';
import { Check, Zap, Loader2, X, Copy, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const PLAN_STYLES = {
  FREE:       { badge: 'bg-gray-100 text-gray-700',     btn: 'btn-secondary justify-center',                                              border: 'border-gray-200',  popular: false },
  STARTER:    { badge: 'bg-blue-100 text-blue-700',     btn: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors justify-center',   border: 'border-blue-400',  popular: false },
  PRO:        { badge: 'bg-purple-100 text-purple-700', btn: 'btn-primary justify-center',                                               border: 'border-primary-500 ring-2 ring-primary-400 ring-offset-2', popular: true },
  ENTERPRISE: { badge: 'bg-amber-100 text-amber-700',   btn: 'bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors justify-center', border: 'border-amber-400',  popular: false }
};

const PAYMENT_METHODS = [
  {
    id: 'wave',
    label: 'Wave',
    sublabel: 'Mobile Money',
    bg: 'bg-[#00C2E0]',
    textColor: 'text-white',
    logo: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
        <circle cx="20" cy="20" r="20" fill="#00C2E0"/>
        {/* Pingouin simplifié */}
        <ellipse cx="20" cy="26" rx="8" ry="9" fill="white"/>
        <ellipse cx="20" cy="24" rx="5" ry="6" fill="#1a1a1a"/>
        <ellipse cx="20" cy="27" rx="4" ry="4" fill="white"/>
        <circle cx="17.5" cy="21.5" r="1.5" fill="white"/>
        <circle cx="22.5" cy="21.5" r="1.5" fill="white"/>
        <circle cx="17.5" cy="21.5" r="0.7" fill="#1a1a1a"/>
        <circle cx="22.5" cy="21.5" r="0.7" fill="#1a1a1a"/>
        <ellipse cx="20" cy="25" rx="1.5" ry="1" fill="#FF8C00"/>
        <ellipse cx="15" cy="28" rx="3" ry="1.5" fill="#FF8C00"/>
        <ellipse cx="25" cy="28" rx="3" ry="1.5" fill="#FF8C00"/>
        {/* Bras */}
        <ellipse cx="12" cy="25" rx="2" ry="4" fill="#1a1a1a" transform="rotate(-15 12 25)"/>
        <ellipse cx="28" cy="25" rx="2" ry="4" fill="#1a1a1a" transform="rotate(15 28 25)"/>
      </svg>
    )
  },
  {
    id: 'orange_money',
    label: 'Orange Money',
    sublabel: 'Mobile Money',
    bg: 'bg-white border-2 border-orange-400',
    textColor: 'text-gray-800',
    logo: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
        <circle cx="20" cy="20" r="20" fill="white"/>
        {/* Flèche haut-droite noire */}
        <path d="M10 10 L28 10 L28 28" stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M10 10 L28 28" stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round" fill="none"/>
        {/* Flèche bas-gauche orange */}
        <path d="M30 30 L12 30 L12 12" stroke="#FF6600" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M30 30 L12 12" stroke="#FF6600" strokeWidth="5" strokeLinecap="round" fill="none"/>
      </svg>
    )
  },
  {
    id: 'free_money',
    label: 'Mixx by Yas',
    sublabel: 'Yas Senegal',
    bg: 'bg-[#003087]',
    textColor: 'text-white',
    logo: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
        <circle cx="20" cy="20" r="20" fill="#003087"/>
        <text x="20" y="18" textAnchor="middle" fill="#FFD700" fontSize="9" fontWeight="bold" fontFamily="Arial">mixx</text>
        <rect x="12" y="21" width="16" height="8" rx="4" fill="#FFD700"/>
        <text x="20" y="27.5" textAnchor="middle" fill="#003087" fontSize="6" fontWeight="bold" fontFamily="Arial">SN</text>
      </svg>
    )
  },
  {
    id: 'cash',
    label: 'Espèces',
    sublabel: 'Paiement en main',
    bg: 'bg-gray-100 border-2 border-gray-200',
    textColor: 'text-gray-700',
    logo: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
        <circle cx="20" cy="20" r="20" fill="#f3f4f6"/>
        <rect x="8" y="14" width="24" height="16" rx="3" fill="#6b7280" stroke="#9ca3af" strokeWidth="1"/>
        <rect x="10" y="16" width="20" height="12" rx="2" fill="#4b5563"/>
        <circle cx="20" cy="22" r="4" fill="#fbbf24"/>
        <circle cx="20" cy="22" r="2.5" fill="#f59e0b"/>
        <text x="20" y="23.5" textAnchor="middle" fill="#92400e" fontSize="4" fontWeight="bold">F</text>
      </svg>
    )
  }
];

function PaymentModal({ plan, paymentConfig, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: méthode, 2: confirmation, 3: référence
  const [method, setMethod] = useState(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const phone = paymentConfig?.paymentPhone || '+221 77 328 73 76';
  const payeeName = paymentConfig?.paymentName || 'CFActure';

  const copyPhone = () => {
    navigator.clipboard.writeText(phone.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/upgrades', {
        targetPlan:    plan.key,
        paymentMethod: method,
        transactionRef: transactionRef.trim() || undefined,
        amount:        plan.price
      });
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              Passer au plan <span className={`px-2 py-0.5 rounded-full text-sm ${PLAN_STYLES[plan.key]?.badge}`}>{plan.key}</span>
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {plan.price.toLocaleString('fr-FR')} FCFA/mois
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {step === 1 && (
            <>
              <p className="text-sm text-gray-600 font-medium">Choisissez votre mode de paiement :</p>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setMethod(m.id); setStep(2); }}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all text-left hover:scale-105 hover:shadow-md ${m.bg}`}
                  >
                    {m.logo}
                    <div>
                      <p className={`font-bold text-sm leading-tight ${m.textColor}`}>{m.label}</p>
                      <p className={`text-xs opacity-70 ${m.textColor}`}>{m.sublabel}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && method !== 'cash' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 mb-3">
                  Envoyez {plan.price.toLocaleString('fr-FR')} FCFA via{' '}
                  <strong>{PAYMENT_METHODS.find(m => m.id === method)?.label}</strong> à :
                </p>
                <div className="flex items-center gap-3 bg-white border border-blue-200 rounded-lg px-4 py-3">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg tracking-wide">{phone}</p>
                    <p className="text-xs text-gray-500">{payeeName}</p>
                  </div>
                  <button onClick={copyPhone} className="p-2 hover:bg-blue-50 rounded-lg transition-colors">
                    {copied ? <CheckCheck className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-blue-500" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Après le transfert, entrez la référence de transaction ci-dessous.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Référence de transaction (ID Wave/OM)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: W2409187654..."
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Retour</button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Soumettre
                </button>
              </div>
            </>
          )}

          {step === 2 && method === 'cash' && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-amber-800">Paiement en espèces</p>
                <p className="text-sm text-amber-700">
                  Contactez-nous par email ou WhatsApp pour convenir d'un rendez-vous de paiement en espèces.
                </p>
                <p className="text-sm font-medium text-amber-900">{paymentConfig?.supportEmail || 'contact@factureapp.sn'}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Note (optionnel)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Votre disponibilité, ville..."
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Retour</button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Envoyer la demande
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Plans() {
  const { organization } = useAuth();
  const [plans, setPlans] = useState([]);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [success, setSuccess] = useState(false);
  const currentPlan = organization?.plan || 'FREE';

  useEffect(() => {
    const fetchPlans = api.get('/plans').then(r => r.data.data.plans).catch(() => []);
    const fetchConfig = api.get('/plans/payment-config').then(r => r.data.data.config).catch(() => null);
    const fetchMine = api.get('/upgrades/mine').then(r => r.data.data.requests).catch(() => []);

    Promise.all([fetchPlans, fetchConfig, fetchMine]).then(([p, c, r]) => {
      setPlans(p);
      setPaymentConfig(c);
      setPendingRequest(r.find(req => req.status === 'pending') || null);
    }).finally(() => setLoading(false));
  }, []);

  const handleSuccess = () => {
    setSelectedPlan(null);
    setSuccess(true);
    api.get('/upgrades/mine').then(r => {
      setPendingRequest(r.data.data.requests.find(req => req.status === 'pending') || null);
    });
  };

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

      {/* Bannière demande en attente */}
      {pendingRequest && (
        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-800">
          <Clock className="w-5 h-5 flex-shrink-0 text-amber-500" />
          <span>
            <strong>Demande en cours</strong> — Votre demande de passage au plan{' '}
            <strong>{pendingRequest.targetPlan}</strong> est en attente de validation par notre équipe.
            Nous traitons les demandes sous 24h.
          </span>
        </div>
      )}

      {/* Bannière succès */}
      {success && (
        <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-300 rounded-xl px-4 py-3 text-sm text-green-800">
          <CheckCheck className="w-5 h-5 flex-shrink-0 text-green-500" />
          <span>
            <strong>Demande envoyée !</strong> Notre équipe validera votre paiement sous 24h et votre plan sera mis à jour automatiquement.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan) => {
          const style = PLAN_STYLES[plan.key] || PLAN_STYLES.FREE;
          const isCurrent = plan.key === currentPlan;
          const features = Array.isArray(plan.features) ? plan.features : [];
          const isEnterprise = plan.key === 'ENTERPRISE';
          const PLAN_ORDER = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
          const isUpgrade = PLAN_ORDER.indexOf(plan.key) > PLAN_ORDER.indexOf(currentPlan);

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
                <div className="w-full text-center py-2.5 bg-gray-100 text-gray-500 text-sm font-medium rounded-xl">
                  Plan actuel
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
                  onClick={() => setSelectedPlan(plan)}
                  title={pendingRequest ? 'Une demande est déjà en attente' : ''}
                >
                  <Zap className="w-4 h-4" />
                  {pendingRequest ? 'Demande en cours...' : `Passer au ${plan.key.charAt(0) + plan.key.slice(1).toLowerCase()}`}
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
        Paiement mensuel, sans engagement. Pour toute question :{' '}
        <a href={`mailto:${paymentConfig?.supportEmail || 'contact@factureapp.sn'}`} className="text-primary-600 hover:underline">
          {paymentConfig?.supportEmail || 'contact@factureapp.sn'}
        </a>
      </p>

      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          paymentConfig={paymentConfig}
          onClose={() => setSelectedPlan(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
