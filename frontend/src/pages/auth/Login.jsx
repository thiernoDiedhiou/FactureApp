import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Mail, Lock, Loader2, FileText, Send, Users, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const FEATURES = [
  { icon: FileText, text: 'Factures, devis et proformas en quelques clics' },
  { icon: CheckCircle, text: 'TVA Sénégal (18 %) préconfigurée' },
  { icon: Send, text: 'Envoi PDF par email directement au client' },
  { icon: Users, text: 'Collaboration en équipe au sein de votre organisation' },
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
              La facturation XOF<br />simple et professionnelle
            </h2>
            <p className="text-white/75 mt-3 text-lg leading-relaxed">
              Créez, envoyez et gérez vos documents commerciaux en Franc CFA — conçu pour les PME et freelances de la zone UEMOA.
            </p>
          </div>

          {/* Arguments clés */}
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
        </div>

        {/* Pied de page branding */}
        <div className="relative z-10">
          <p className="text-white/50 text-xs">Application de facturation XOF — Zone UEMOA</p>
        </div>
      </div>

      {/* ── Panneau droit — Formulaire ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-primary-50/30 min-h-screen">
        <div className="w-full max-w-md flex flex-col gap-6">

          {/* Badges produit — desktop uniquement */}
          <div className="hidden lg:flex items-center justify-center gap-3 flex-wrap">
            {[
              { emoji: '🔒', label: 'Données sécurisées' },
              { emoji: '⚡', label: 'PDF en 1 clic' },
              { emoji: '🌍', label: 'Zone UEMOA' },
            ].map(({ emoji, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 font-medium shadow-sm">
                {emoji} {label}
              </span>
            ))}
          </div>

          {/* Logo mobile uniquement */}
          <div className="lg:hidden text-center">
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

          {/* Card formulaire */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t('auth.login')}</h2>
              <p className="text-gray-500 text-sm mt-1">Bon retour ! Connectez-vous à votre espace.</p>
            </div>

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
                className="btn-primary w-full justify-center py-3 text-base mt-2"
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

          {/* Témoignage client */}
          <div className="hidden lg:block bg-white/70 border border-primary-100 rounded-2xl p-5">
            <div className="flex gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-amber-400 text-sm">★</span>
              ))}
            </div>
            <p className="text-gray-600 text-sm italic leading-relaxed">
              "CFActure nous a permis de professionnaliser notre facturation en moins d'une semaine.
              Nos clients reçoivent leurs PDF directement par email — c'est un gain de temps énorme."
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">NS</div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Ngagne SARR</p>
                <p className="text-xs text-gray-500">Directeur — Touba Bélél Multimedia, Thiès</p>
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
