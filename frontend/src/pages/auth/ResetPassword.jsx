import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FileText, Lock, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.password || form.password.length < 8)
      errs.password = 'Le mot de passe doit faire au moins 8 caractères';
    if (form.password !== form.confirm)
      errs.confirm = 'Les mots de passe ne correspondent pas';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      setDone(true);
      setTimeout(() => navigate('/login?reset=1'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lien invalide ou expiré');
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
          {done ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Mot de passe réinitialisé !</h2>
              <p className="text-sm text-gray-500">
                Vous allez être redirigé vers la page de connexion dans quelques secondes...
              </p>
              <Link to="/login" className="btn-primary inline-flex justify-center px-6 py-2.5 text-sm">
                Se connecter
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Choisissez un mot de passe sécurisé d'au moins 8 caractères.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nouveau mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      className={`input-field pl-9 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors({}); }}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="label">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      className={`input-field pl-9 ${errors.confirm ? 'border-red-500' : ''}`}
                      placeholder="••••••••"
                      value={form.confirm}
                      onChange={e => { setForm(f => ({ ...f, confirm: e.target.value })); setErrors({}); }}
                      disabled={loading}
                    />
                  </div>
                  {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3 text-base"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Réinitialisation...</>
                    : 'Réinitialiser mon mot de passe'
                  }
                </button>
              </form>
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
