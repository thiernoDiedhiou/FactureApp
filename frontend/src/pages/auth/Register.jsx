import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Loader2, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const inviteToken = searchParams.get('invite');

  // Décoder le token d'invitation pour pré-remplir l'email
  const decodeInvite = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch { return null; }
  };
  const invitePayload = inviteToken ? decodeInvite(inviteToken) : null;

  const [form, setForm] = useState({
    name: '',
    organizationName: '',
    email: invitePayload?.email || '',
    password: '',
    confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.length < 2) errs.name = 'Nom trop court (min. 2 caractères)';
    if (!invitePayload && (!form.organizationName || form.organizationName.length < 2)) errs.organizationName = 'Nom de l\'entreprise requis (min. 2 caractères)';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = t('errors.invalidEmail');
    if (!form.password || form.password.length < 8) errs.password = 'Min. 8 caractères';
    if (form.password !== form.confirm) errs.confirm = 'Les mots de passe ne correspondent pas';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        organizationName: form.organizationName || form.name,
        ...(inviteToken && { inviteToken })
      });
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Créer un compte</h2>

          {invitePayload && (
            <div className="mb-5 p-3 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-800">
              Vous avez été invité par <strong>{invitePayload.inviterName}</strong> à rejoindre{' '}
              <strong>"{invitePayload.orgName}"</strong>.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('auth.name')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className={`input-field pl-9 ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Mamadou Diallo"
                  value={form.name}
                  onChange={(e) => field('name', e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="label">
                Nom de l'entreprise
                {invitePayload && <span className="text-gray-400 font-normal text-xs ml-1">(optionnel)</span>}
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className={`input-field pl-9 ${errors.organizationName ? 'border-red-500' : ''}`}
                  placeholder={invitePayload ? 'Votre nom si pas d\'entreprise' : 'Innosoft Création SARL'}
                  value={form.organizationName}
                  onChange={(e) => field('organizationName', e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.organizationName && <p className="text-red-500 text-xs mt-1">{errors.organizationName}</p>}
            </div>

            <div>
              <label className="label">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  className={`input-field pl-9 ${errors.email ? 'border-red-500' : ''} ${invitePayload ? 'bg-gray-50' : ''}`}
                  placeholder="email@exemple.sn"
                  value={form.email}
                  onChange={(e) => field('email', e.target.value)}
                  disabled={loading || !!invitePayload}
                  readOnly={!!invitePayload}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="label">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  className={`input-field pl-9 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Min. 8 caractères"
                  value={form.password}
                  onChange={(e) => field('password', e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="label">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  className={`input-field pl-9 ${errors.confirm ? 'border-red-500' : ''}`}
                  placeholder="Confirmer le mot de passe"
                  value={form.confirm}
                  onChange={(e) => field('confirm', e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center py-3 text-base"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Création...</>
              ) : t('auth.registerBtn')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              {t('auth.loginBtn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
