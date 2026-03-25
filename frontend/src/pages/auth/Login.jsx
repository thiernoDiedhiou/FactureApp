import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('verified') === '1') {
      toast.success('Email vérifié ! Vous pouvez maintenant vous connecter.');
    }
    if (searchParams.get('reset') === '1') {
      toast.success('Mot de passe réinitialisé ! Connectez-vous avec votre nouveau mot de passe.');
    }
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = t('errors.required');
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = t('errors.invalidEmail');
    if (!form.password) errs.password = t('errors.required');
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Connexion réussie !');
      navigate('/');
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        navigate(`/verify-email?email=${encodeURIComponent(err.response.data.data?.email || form.email)}`);
      } else {
        toast.error(err.response?.data?.message || 'Identifiants incorrects');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 drop-shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-16 h-16">
              <rect width="100" height="100" rx="20" fill="#00C8D7"/>
              <polyline points="12,33 22,44 38,24" stroke="white" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="46" y1="29" x2="85" y2="29" stroke="white" strokeWidth="6" strokeLinecap="round"/>
              <line x1="46" y1="40" x2="72" y2="40" stroke="white" strokeWidth="6" strokeLinecap="round"/>
              <line x1="12" y1="56" x2="85" y2="56" stroke="white" strokeWidth="6" strokeLinecap="round"/>
              <line x1="12" y1="68" x2="68" y2="68" stroke="white" strokeWidth="6" strokeLinecap="round"/>
              <text x="28" y="92" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" fill="white" textAnchor="middle">f</text>
              <line x1="18" y1="82" x2="36" y2="82" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CFActure</h1>
          <p className="text-gray-500 mt-1">{t('auth.subtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('auth.login')}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  className={`input-field pl-9 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="email@exemple.sn"
                  value={form.email}
                  onChange={(e) => { setForm(f => ({ ...f, email: e.target.value })); setErrors({}); }}
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">{t('auth.password')}</label>
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  className={`input-field pl-9 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => { setForm(f => ({ ...f, password: e.target.value })); setErrors({}); }}
                  disabled={loading}
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center py-3 text-base"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Connexion...</>
              ) : t('auth.loginBtn')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">
              {t('auth.registerBtn')}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Application de facturation XOF — Zone UEMOA
        </p>
      </div>
    </div>
  );
}
