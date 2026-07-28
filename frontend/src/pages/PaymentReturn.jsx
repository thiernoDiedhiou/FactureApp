import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Zap, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const POLL_INTERVAL_MS = 2500;
const MAX_ATTEMPTS     = 20; // 50 secondes max avant timeout

export default function PaymentReturn() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const { loadUser } = useAuth();

  const ref = params.get('ref'); // ID de l'UpgradeRequest

  // 'checking' | 'success' | 'error' | 'timeout'
  const [state, setState]     = useState('checking');
  const [targetPlan, setTargetPlan] = useState(null);
  const attemptsRef = useRef(0);
  const timerRef    = useRef(null);

  useEffect(() => {
    // Pas de ref → paiement invalide ou accès direct à la page
    if (!ref) {
      setState('error');
      return;
    }

    const poll = async () => {
      try {
        const { data } = await api.get(`/payments/moneyfusion/status/${ref}`);
        const status = data.data.status;

        if (status === 'validated') {
          // Recharger le contexte utilisateur pour refléter le nouveau plan
          await loadUser();
          setTargetPlan(data.data.targetPlan);
          setState('success');
          return;
        }

        if (status === 'rejected') {
          setState('error');
          return;
        }

        // Encore 'pending' : réessayer si sous la limite
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_ATTEMPTS) {
          setState('timeout');
          return;
        }
        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);

      } catch {
        // Erreur réseau ou auth : on réessaie silencieusement
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_ATTEMPTS) {
          setState('timeout');
          return;
        }
        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    // Premier appel après un court délai pour laisser le webhook arriver
    timerRef.current = setTimeout(poll, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ref, loadUser]);

  const handleContinue = () => navigate('/app', { replace: true });
  const handleRetry    = () => navigate('/app/plans', { replace: true });

  const handleAbandon = async () => {
    try {
      await api.delete(`/payments/moneyfusion/cancel/${ref}`);
    } catch {
      // Si déjà résolu ou erreur réseau, on redirige quand même
    }
    navigate('/app/plans', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">

        {/* Vérification en cours */}
        {state === 'checking' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Vérification du paiement…
            </h1>
            <p className="text-gray-500 text-sm">
              Nous attendons la confirmation de Money Fusion. Cela prend généralement quelques secondes.
            </p>
          </>
        )}

        {/* Succès */}
        {state === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-9 h-9 text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Abonnement activé !
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Votre paiement a été confirmé.{targetPlan && <> Votre plan <strong>{targetPlan}</strong> est maintenant actif.</>}{' '}
              Profitez de toutes les fonctionnalités immédiatement.
            </p>
            <button
              onClick={handleContinue}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Accéder à l'application
            </button>
          </>
        )}

        {/* Paiement annulé ou échoué */}
        {state === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-9 h-9 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Paiement non effectué
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Le paiement a été annulé ou a échoué. Votre abonnement n'a pas été modifié.
              Vous pouvez réessayer à tout moment.
            </p>
            <div className="flex gap-3">
              <button onClick={handleContinue} className="btn-secondary flex-1">
                Retour à l'app
              </button>
              <button
                onClick={handleRetry}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Réessayer
              </button>
            </div>
          </>
        )}

        {/* Timeout — paiement toujours en attente après 50s */}
        {state === 'timeout' && (
          <>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Clock className="w-9 h-9 text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Confirmation en attente
            </h1>
            <p className="text-gray-500 text-sm mb-2">
              Votre paiement est en cours de traitement. La confirmation peut prendre quelques minutes.
            </p>
            <p className="text-gray-400 text-xs mb-6">
              Si votre plan n'est pas mis à jour dans les 10 minutes, contactez notre support en indiquant votre référence de transaction.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="mailto:contact@factureapp.sn?subject=Paiement en attente"
                className="btn-primary w-full flex items-center justify-center gap-2 no-underline"
              >
                Contacter le support
              </a>
              <button onClick={handleContinue} className="btn-secondary w-full">
                Aller à l'app
              </button>
              <button
                onClick={handleAbandon}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-1 py-1"
              >
                J'ai abandonné le paiement — Annuler et réessayer
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
