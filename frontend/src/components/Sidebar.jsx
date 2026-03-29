import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, Package, FileText, Settings,
  LogOut, FileText as Logo, X, ChevronRight, Building2, Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const navItems = [
  { to: '/app', icon: LayoutDashboard, key: 'dashboard', exact: true },
  { to: '/app/clients', icon: Users, key: 'clients' },
  { to: '/app/products', icon: Package, key: 'products' },
  { to: '/app/documents', icon: FileText, key: 'documents' },
  { to: '/app/organization', icon: Building2, key: 'organization' },
];

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
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
        <NavLink
          to="/app"
          end
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg hover:opacity-80 transition-opacity"
        >
          {settings.logoPath ? (
            <img
              src={settings.logoPath}
              alt="Logo"
              className="w-9 h-9 rounded-lg object-contain bg-white p-0.5"
            />
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
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, key, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{t(`nav.${key}`)}</span>
                {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-700 space-y-1">
        <NavLink
          to="/app/plans"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-amber-500 text-white'
                : 'text-amber-400 hover:bg-amber-900/30 hover:text-amber-300'
            }`
          }
        >
          <Zap className="w-5 h-5" />
          <span>{t('nav.plans')}</span>
        </NavLink>

        <NavLink
          to="/app/settings"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`
          }
        >
          <Settings className="w-5 h-5" />
          <span>{t('nav.settings')}</span>
        </NavLink>

        {/* User info */}
        <div className="px-3 py-2 mt-2">
          <p className="text-xs font-medium text-white truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );
}
