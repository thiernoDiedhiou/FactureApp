import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Loader2, Building2, ShieldCheck, Zap, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const FEATURES = [
  { icon: Zap,         text: 'Opérationnel en moins de 2 minutes' },
  { icon: ShieldCheck, text: 'Vos données sécurisées et confidentielles' },
  { icon: Globe,       text: 'Accessible partout, sur tout appareil' },
];

const BrandLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-lg">
    <rect width="100" height="100" rx="20" fill="white" fillOpacity="0.2"/>
    <polyline points="12,33 22,44 38,24" stroke="white" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="46" y1="29" x2="85" y2="29" stroke="white" strokeWidth="6" strokeLinecap="round"/>
    <line x1="46" y1="40" x2="72" y2="40" stroke="white" strokeWidth="6" strokeLinecap="round"/>
    <line x1="12" y1="56" x2="85" y2="56" stroke="white" strokeWidth="6" strokeLinecap="round"/>
    <line x1="12" y1="68" x2="68" y2="68" stroke="white" strokeWidth="6" strokeLinecap="round"/>
    <text x="28" y="92" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" fill="white" textAnchor="middle">f</text>
    <line x1="18" y1="82" x2="36" y2="82" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
  </svg>
);

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const inviteToken = searchParams.get('invite');

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
    <div className="min-h-screen flex">

      {/* ── Panneau gauche — Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#00C8D7] to-[#007a87] flex-col justify-between p-12 relative overflow-hidden">

        {/* Cercles décoratifs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/10 rounded-full" />
        <div className="absolute top-1/2 right-8 w-32 h-32 bg-white/5 rounded-full" />

        {/* Logo + nom */}
        <div className="relative z-10 flex items-center gap-3">
          <BrandLogo />
          <span className="text-white text-2xl font-bold tracking-tight">CFActure</span>
        </div>

        {/* Proposition de valeur */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-white text-4xl font-bold leading-tight">
              Rejoignez des centaines<br />d'entreprises UEMOA
            </h2>
            <p className="text-white/75 mt-3 text-lg leading-relaxed">
              Créez votre compte gratuitement et commencez à facturer vos clients en Franc CFA dès aujourd'hui.
            </p>
          </div>

          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/90 text-sm">{text}</span>
              </li>
            ))}
          </ul>

          {/* Badge plan gratuit */}
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-xl px-4 py-3">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-white font-semibold text-sm">Plan Gratuit inclus</p>
              <p className="text-white/70 text-xs">10 factures et 5 clients sans carte bancaire</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/50 text-xs">Application de facturation XOF — Zone UEMOA</p>
        </div>
      </div>

      {/* ── Panneau droit — Formulaire ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-primary-50/30 overflow-y-auto min-h-screen">
        <div className="w-full max-w-md py-8 flex flex-col gap-6">

          {/* Badges produit — desktop uniquement */}
          <div className="hidden lg:flex items-center justify-center gap-3 flex-wrap">
            {[
              { emoji: '🎁', label: 'Gratuit pour démarrer' },
              { emoji: '🔒', label: 'Données sécurisées' },
              { emoji: '🌍', label: 'Zone UEMOA' },
            ].map(({ emoji, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 font-medium shadow-sm">
                {emoji} {label}
              </span>
            ))}
          </div>

          {/* Logo mobile uniquement */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-14 h-14">
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
            <h1 className="text-2xl font-bold text-gray-900">CFActure</h1>
            <p className="text-gray-500 text-sm mt-1">{t('auth.subtitle')}</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Créer un compte</h2>
              <p className="text-gray-500 text-sm mt-1">Gratuit et sans carte bancaire.</p>
            </div>

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
                className="btn-primary w-full justify-center py-3 text-base mt-2"
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

          {/* Témoignage */}
          <div className="hidden lg:block bg-white/70 border border-primary-100 rounded-2xl p-5">
            <div className="flex gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-amber-400 text-sm">★</span>
              ))}
            </div>
            <p className="text-gray-600 text-sm italic leading-relaxed">
              "En tant que freelance, j'avais besoin d'un outil simple pour facturer mes clients en FCFA.
              CFActure est exactement ce qu'il me fallait — rapide à prendre en main et très professionnel."
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">AF</div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Abdoulaye Fall</p>
                <p className="text-xs text-gray-500">Informaticien freelance — Thiès</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400">
            Application de facturation XOF — Zone UEMOA
          </p>

        </div>
      </div>

    </div>
  );
}
