import { useState } from 'react';
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { FileText, Mail, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

// Page "vérifiez votre boîte de réception"
function CheckInboxPage({ email }) {
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    if (!email) { toast.error('Email introuvable'); return; }
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setSent(true);
      toast.success('Email renvoyé !');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du renvoi');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CFActure</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vérifiez votre email</h2>
          <p className="text-gray-500 mb-2">
            Un lien de vérification a été envoyé à :
          </p>
          {email && (
            <p className="font-semibold text-gray-800 mb-4">{email}</p>
          )}
          <p className="text-sm text-gray-500 mb-6">
            Cliquez sur le lien dans l'email pour activer votre compte.<br />
            Vérifiez aussi votre dossier spam.
          </p>

          {sent ? (
            <p className="text-sm text-green-600 font-medium mb-4">
              ✓ Email renvoyé ! Vérifiez votre boîte de réception.
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="flex items-center gap-2 mx-auto text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
            >
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Renvoyer l'email de vérification
            </button>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Page de confirmation du token (appelée depuis le lien email)
function ConfirmPage({ token }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    const verify = async () => {
      try {
        await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CFActure</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Vérification en cours...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-9 h-9 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email vérifié !</h2>
              <p className="text-gray-500 mb-6">Votre compte est activé. Vous pouvez maintenant vous connecter.</p>
              <button
                onClick={() => navigate('/login?verified=1')}
                className="btn-primary w-full justify-center py-3"
              >
                Se connecter
              </button>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                <CheckCircle className="w-9 h-9 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Compte déjà vérifié</h2>
              <p className="text-gray-500 mb-6">
                Ce lien a déjà été utilisé ou votre compte est déjà activé.<br />
                Vous pouvez vous connecter directement.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full justify-center py-3"
              >
                Se connecter
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const { token } = useParams();

  if (token) {
    return <ConfirmPage token={token} />;
  }

  return <CheckInboxPage email={searchParams.get('email')} />;
}
