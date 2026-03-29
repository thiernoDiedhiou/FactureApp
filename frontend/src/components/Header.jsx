import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, Plus, ChevronDown, Settings, LogOut, Building2, Check, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';

const breadcrumbMap = {
  '/app':              'dashboard',
  '/app/clients':      'clients',
  '/app/products':     'products',
  '/app/documents':    'documents',
  '/app/settings':     'settings',
  '/app/organization': 'organization',
  '/app/plans':        'plans',
};

const quickActions = {
  '/app/clients':   { to: '/app/clients/new',   label: 'Nouveau client' },
  '/app/products':  { to: '/app/products/new',  label: 'Nouveau produit' },
  '/app/documents': { to: '/app/documents/new', label: 'Nouveau document' },
};

export default function Header({ onMenuClick }) {
  const { t } = useTranslation();
  const { user, organization, organizations, logout, switchOrganization } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(null);
  const dropdownRef = useRef(null);

  // Normalise le pathname pour matcher la map (/app, /app/clients, /app/clients/123 → /app/clients)
  const segments = location.pathname.split('/').filter(Boolean); // ['app', 'clients', '123']
  const path = segments.length >= 2 ? `/${segments[0]}/${segments[1]}` : `/${segments[0] || 'app'}`;
  const titleKey = breadcrumbMap[path] || 'dashboard';
  const quickAction = quickActions[path];

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const handleSwitch = async (orgId) => {
    if (orgId === organization?.id || switching) return;
    setSwitching(orgId);
    try {
      await switchOrganization(orgId);
      setDropdownOpen(false);
      navigate('/app');
    } catch {
      // error already handled in switchOrganization
    } finally {
      setSwitching(null);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="font-semibold text-gray-900 text-base md:text-lg">
            {t(`nav.${titleKey}`)}
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {quickAction && (
          <Link to={quickAction.to} className="btn-primary hidden sm:inline-flex">
            <Plus className="w-4 h-4" />
            {quickAction.label}
          </Link>
        )}

        {/* User avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700 hidden md:block">
              {user?.name}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-500 hidden md:block transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                {organization && (
                  <p className="text-xs text-primary-600 font-medium truncate mt-0.5">{organization.name}</p>
                )}
              </div>

              {/* Org switcher — affiché seulement si plusieurs orgs */}
              {organizations?.length > 1 && (
                <div className="border-b border-gray-100">
                  <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Organisations
                  </p>
                  {organizations.map((org) => {
                    const isActive = org.id === organization?.id;
                    return (
                      <button
                        key={org.id}
                        onClick={() => handleSwitch(org.id)}
                        disabled={isActive || !!switching}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          isActive
                            ? 'text-primary-700 bg-primary-50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Building2 className="w-4 h-4 flex-shrink-0 text-gray-400" />
                        <span className="flex-1 text-left truncate">{org.name}</span>
                        {switching === org.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
                          : isActive && <Check className="w-3.5 h-3.5 text-primary-600" />
                        }
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Actions */}
              <div className="py-1">
                {user?.isSuperAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 transition-colors font-medium"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    Administration
                  </Link>
                )}
                <Link
                  to="/app/organization"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-gray-400" />
                  Organisation
                </Link>
                <Link
                  to="/app/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Paramètres
                </Link>
              </div>

              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
