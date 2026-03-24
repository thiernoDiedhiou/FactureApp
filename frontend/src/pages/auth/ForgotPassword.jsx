import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Veuillez entrer votre adresse email'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CFActure</h1>
          <p className="text-gray-500 mt-1">Gérez vos factures en Franc CFA facilement</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Email envoyé !</h2>
              <p className="text-sm text-gray-500">
                Si un compte existe avec <strong>{email}</strong>, vous recevrez un lien de réinitialisation.
                Vérifiez aussi vos spams.
              </p>
              <p className="text-xs text-gray-400">Le lien est valable <strong>1 heure</strong>.</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-primary-600 hover:underline text-sm font-medium mt-4"
              >
                <ArrowLeft className="w-4 h-4" /> Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Mot de passe oublié ?</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Entrez votre email, nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Adresse email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      className={`input-field pl-9 ${error ? 'border-red-500' : ''}`}
                      placeholder="email@exemple.sn"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3 text-base"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
                    : 'Envoyer le lien de réinitialisation'
                  }
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-4 h-4" /> Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Application de facturation XOF — Zone UEMOA
        </p>
      </div>
    </div>
  );
}
