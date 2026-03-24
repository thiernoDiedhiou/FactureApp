import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Building2, Users, ShieldCheck,
  LogOut, ChevronRight, ArrowLeft, Zap, Menu, X, TrendingUp, Settings
} from 'lucide-react';

const navItems = [
  { to: '/admin',              icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
  { to: '/admin/organizations',icon: Building2,       label: 'Organisations' },
  { to: '/admin/users',        icon: Users,           label: 'Utilisateurs' },
  { to: '/admin/plans',        icon: Zap,             label: 'Plans tarifaires' },
  { to: '/admin/upgrades',     icon: TrendingUp,      label: 'Demandes upgrade' },
  { to: '/admin/settings',     icon: Settings,        label: 'Paramètres' },
];

const PAGE_TITLES = {
  '/admin':               'Tableau de bord',
  '/admin/organizations': 'Organisations',
  '/admin/users':         'Utilisateurs',
  '/admin/plans':         'Plans tarifaires',
  '/admin/upgrades':      'Demandes upgrade',
  '/admin/settings':      'Paramètres',
};

function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 border-r border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-white text-sm">Super Admin</span>
          </div>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-1">
        <NavLink
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'app
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Fermer sidebar sur changement de route (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const pageTitle = PAGE_TITLES[location.pathname] || 'Administration';

  return (
    <div className="min-h-screen flex bg-gray-950">

      {/* Sidebar desktop — fixe */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col">
        <div className="fixed top-0 left-0 h-full w-60">
          <Sidebar onClose={() => {}} />
        </div>
      </aside>

      {/* Sidebar mobile — drawer overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-64 flex-shrink-0 z-10">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar mobile */}
        <header className="lg:hidden h-14 bg-gray-900 border-b border-gray-800 flex items-center gap-3 px-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-white font-semibold text-sm">{pageTitle}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
