import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Zap, Clock, MessageCircle, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const POLL_INTERVAL_MS = 5000;
const MAX_ATTEMPTS     = 24; // 2 minutes

const PLAN_LABELS = { STARTER: 'Starter', PRO: 'Pro', ENTERPRISE: 'Enterprise' };

const DEFAULT_PHONE = '221773287376';
const DEFAULT_EMAIL = 'contact@factureapp.sn';

function formatWaPhone(raw) {
  // Garder uniquement les chiffres, retirer le + initial
  return raw ? raw.replace(/\D/g, '') : DEFAULT_PHONE;
}

const CHECKING_MESSAGES = [
  'Nous attendons la confirmation de Money Fusion…',
  'Votre paiement est en cours de traitement.',
  'Cela prend généralement moins de 30 secondes.',
  'Ne fermez pas cette page.',
  'Presque terminé…',
];

// Étapes visuelles affichées pendant la vérification et au succès
function Steps({ state }) {
  const steps = [
    { label: 'Paiement envoyé',      done: true,                  active: false },
    { label: 'Confirmation en cours', done: state === 'success',   active: state === 'checking' },
    { label: 'Plan activé',           done: state === 'success',   active: false },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-8 w-full max-w-xs mx-auto">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
              step.done
                ? 'bg-green-500 border-green-500'
                : step.active
                  ? 'bg-white border-primary-500'
                  : 'bg-white border-gray-200'
            }`}>
              {step.done ? (
                <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
              ) : step.active ? (
                <Loader2 className="w-3.5 h-3.5 text-primary-500 animate-spin" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-300" />
              )}
            </div>
            <p className={`text-center mt-1.5 leading-tight w-16 text-[10px] font-medium ${
              step.done ? 'text-green-600' : step.active ? 'text-primary-600' : 'text-gray-400'
            }`}>
              {step.label}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mx-1 mb-5 transition-colors duration-500 ${
              steps[i + 1].done || steps[i].done ? 'bg-green-400' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function PaymentReturn() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const { loadUser } = useAuth();

  const ref = params.get('ref');

  const [state, setState]           = useState('checking');
  const [targetPlan, setTargetPlan] = useState(null);
  const [msgIdx, setMsgIdx]         = useState(0);
  const [elapsed, setElapsed]       = useState(0); // secondes

  const [supportPhone, setSupportPhone] = useState(DEFAULT_PHONE);
  const [supportEmail, setSupportEmail] = useState(DEFAULT_EMAIL);

  const attemptsRef = useRef(0);
  const timerRef    = useRef(null);
  const msgTimerRef = useRef(null);
  const elapsedRef  = useRef(null);

  // Charger le numéro de support depuis la config plateforme
  useEffect(() => {
    api.get('/plans/payment-config')
      .then(r => {
        const c = r.data?.data?.config;
        if (c?.paymentPhone) setSupportPhone(formatWaPhone(c.paymentPhone));
        if (c?.supportEmail) setSupportEmail(c.supportEmail);
      })
      .catch(() => {}); // silencieux : les fallbacks par défaut restent actifs
  }, []);

  // Rotation des messages rassurants
  useEffect(() => {
    if (state !== 'checking') return;
    msgTimerRef.current = setInterval(() => {
      setMsgIdx(i => (i + 1) % CHECKING_MESSAGES.length);
    }, 4000);
    return () => clearInterval(msgTimerRef.current);
  }, [state]);

  // Compteur de temps écoulé
  useEffect(() => {
    if (state !== 'checking') return;
    elapsedRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(elapsedRef.current);
  }, [state]);

  // Polling statut
  useEffect(() => {
    if (!ref) { setState('error'); return; }

    const poll = async () => {
      try {
        const { data } = await api.get(`/payments/moneyfusion/status/${ref}`);
        const status = data.data.status;

        if (status === 'validated') {
          await loadUser();
          setTargetPlan(data.data.targetPlan);
          setState('success');
          return;
        }
        if (status === 'rejected') { setState('error'); return; }

        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_ATTEMPTS) { setState('timeout'); return; }
        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_ATTEMPTS) { setState('timeout'); return; }
        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    timerRef.current = setTimeout(poll, 2000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [ref, loadUser]);

  const handleContinue = () => navigate('/app', { replace: true });
  const handleRetry    = () => navigate('/app/plans', { replace: true });
  const handleAbandon  = async () => {
    try { await api.delete(`/payments/moneyfusion/cancel/${ref}`); } catch {}
    navigate('/app/plans', { replace: true });
  };

  const elapsedLabel = elapsed < 60
    ? `${elapsed}s`
    : `${Math.floor(elapsed / 60)}min ${elapsed % 60}s`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden">

        {/* Header coloré selon l'état */}
        <div className={`h-2 w-full ${
          state === 'success' ? 'bg-green-500' :
          state === 'error'   ? 'bg-red-500'   :
          state === 'timeout' ? 'bg-amber-500'  :
          'bg-primary-500'
        }`} />

        <div className="p-6 text-center">

          {/* ── VÉRIFICATION ── */}
          {state === 'checking' && (
            <>
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>

              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Vérification en cours
              </h1>
              <p className="text-gray-500 text-sm mb-6 min-h-[40px] transition-all duration-300">
                {CHECKING_MESSAGES[msgIdx]}
              </p>

              <Steps state="checking" />

              <p className="text-xs text-gray-400 mt-2">
                Temps écoulé : <span className="font-medium">{elapsedLabel}</span>
              </p>
            </>
          )}

          {/* ── SUCCÈS ── */}
          {state === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-once">
                <CheckCircle className="w-11 h-11 text-green-500" />
              </div>

              <Steps state="success" />

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Abonnement activé !
              </h1>
              <p className="text-gray-500 text-sm mb-1">
                Votre paiement a été confirmé.
              </p>
              {targetPlan && (
                <p className="text-primary-600 font-semibold text-base mb-6">
                  Plan {PLAN_LABELS[targetPlan] || targetPlan} maintenant actif
                </p>
              )}
              <button
                onClick={handleContinue}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
              >
                <Zap className="w-5 h-5" />
                Accéder à l'application
              </button>
            </>
          )}

          {/* ── ERREUR / ANNULÉ ── */}
          {state === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-9 h-9 text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Paiement non effectué
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Le paiement a été annulé ou a échoué. Votre plan n'a pas changé. Vous pouvez réessayer à tout moment.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleRetry}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  <Zap className="w-4 h-4" />
                  Réessayer
                </button>
                <button onClick={handleContinue} className="btn-secondary w-full flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Retour à l'application
                </button>
              </div>
            </>
          )}

          {/* ── TIMEOUT ── */}
          {state === 'timeout' && (
            <>
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-9 h-9 text-amber-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Traitement en cours
              </h1>
              <p className="text-gray-500 text-sm mb-1">
                Votre paiement est en attente de confirmation de Money Fusion.
              </p>
              <p className="text-gray-400 text-xs mb-6">
                Si vous avez payé, votre plan sera activé automatiquement. Revenez dans quelques minutes ou contactez le support.
              </p>

              <div className="flex flex-col gap-2.5">
                {/* WhatsApp — prioritaire sur mobile UEMOA */}
                <a
                  href={`https://wa.me/${supportPhone}?text=Bonjour%2C%20mon%20paiement%20CFActure%20est%20en%20attente%20de%20confirmation.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contacter via WhatsApp
                </a>
                <a
                  href={`mailto:${supportEmail}?subject=Paiement%20en%20attente%20de%20confirmation`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  <Mail className="w-4 h-4" />
                  Envoyer un email
                </a>
                <button
                  onClick={handleContinue}
                  className="btn-secondary w-full"
                >
                  Aller à l'application
                </button>
                <button
                  onClick={handleAbandon}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors py-1 mt-1"
                >
                  J'ai abandonné le paiement — Annuler et réessayer
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Logo en bas */}
      <p className="text-xs text-gray-300 mt-6">CFActure · Paiement sécurisé</p>
    </div>
  );
}
