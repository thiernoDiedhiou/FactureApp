import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, Package, FileText, Settings,
  LogOut, FileText as Logo, X, Building2, Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const mainNav = [
  { to: '/app',              icon: LayoutDashboard, key: 'dashboard', exact: true },
  { to: '/app/clients',      icon: Users,            key: 'clients'  },
  { to: '/app/products',     icon: Package,          key: 'products' },
  { to: '/app/documents',    icon: FileText,         key: 'documents'},
  { to: '/app/organization', icon: Building2,        key: 'organization' },
];

const accountNav = [
  { to: '/app/plans',    icon: Zap,      key: 'plans'    },
  { to: '/app/settings', icon: Settings, key: 'settings' },
];

const activeClass    = 'bg-primary-600 text-white shadow-sm';
const inactiveClass  = 'text-gray-400 hover:bg-gray-800 hover:text-white';
const navItemClass   = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors';

function SectionLabel({ label }) {
  return (
    <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 select-none">
      {label}
    </p>
  );
}

export default function Sidebar({ onClose }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">

      {/* ── Logo / Org ── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700/60">
        <NavLink to="/app" end onClick={onClose}
          className="flex items-center gap-3 rounded-lg hover:opacity-80 transition-opacity">
          {settings.logoPath ? (
            <img src={settings.logoPath} alt="Logo"
              className="w-9 h-9 rounded-lg object-contain bg-white p-0.5" />
          ) : (
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <Logo className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-sm leading-tight">
              {settings.companyName || 'CFActure'}
            </h1>
            <p className="text-gray-400 text-xs">{settings.defaultCurrency || 'XOF'}</p>
          </div>
        </NavLink>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Nav principale ── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        <SectionLabel label={t('nav.section_main', 'Navigation')} />
        {mainNav.map(({ to, icon: Icon, key, exact }) => (
          <NavLink key={to} to={to} end={exact} onClick={onClose}
            className={({ isActive }) =>
              `${navItemClass} ${isActive ? activeClass : inactiveClass}`
            }>
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 truncate">{t(`nav.${key}`)}</span>
          </NavLink>
        ))}

        {/* ── Séparateur ── */}
        <div className="border-t border-gray-700/50 my-3" />

        {/* ── Compte ── */}
        <SectionLabel label={t('nav.section_account', 'Compte')} />
        {accountNav.map(({ to, icon: Icon, key }) => (
          <NavLink key={to} to={to} onClick={onClose}
            className={({ isActive }) =>
              `${navItemClass} ${isActive ? activeClass : inactiveClass}`
            }>
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 truncate">{t(`nav.${key}`)}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Utilisateur + Déconnexion ── */}
      <div className="px-3 py-4 border-t border-gray-700/60 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className={`w-full ${navItemClass} text-gray-400 hover:bg-red-900/30 hover:text-red-400`}>
          <LogOut className="w-5 h-5" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>

    </div>
  );
}
