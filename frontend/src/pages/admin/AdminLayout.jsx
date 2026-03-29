import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  LayoutDashboard, Building2, Users, ShieldCheck,
  LogOut, ChevronRight, ArrowLeft, Zap, Menu, X, TrendingUp, Settings, Loader2, Search
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

// Modal de sélection d'organisation pour le super admin
function OrgPickerModal({ onClose, onSelect }) {
  const [orgs, setOrgs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    api.get('/admin/organizations?limit=100')
      .then(({ data }) => setOrgs(data.data.organizations || []))
      .catch(() => toast.error('Erreur chargement organisations'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Choisir une organisation</h2>
            <p className="text-xs text-gray-500 mt-0.5">Vous accéderez à l'app en tant qu'OWNER</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Rechercher une organisation…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">Aucune organisation trouvée</p>
          ) : (
            filtered.map(org => (
              <button
                key={org.id}
                onClick={() => onSelect(org)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
                  <p className="text-xs text-gray-500">{org.plan} · {org._count?.members ?? ''} membres</p>
                </div>
                {org.suspended && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex-shrink-0">Suspendu</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ onClose }) {
  const { user, organization, loadUser, logout } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSelectOrg = async (org) => {
    setShowPicker(false);
    setSwitching(true);
    try {
      const { data } = await api.post('/admin/impersonate-org', { organizationId: org.id });
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      await loadUser(); // recharge user + organization dans le contexte
      onClose();
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de basculement');
    } finally {
      setSwitching(false);
    }
  };

  const handleBackToApp = () => {
    // Si une org est déjà active dans le token, aller directement
    if (organization) {
      onClose();
      navigate('/app');
      return;
    }
    // Sinon ouvrir le picker
    setShowPicker(true);
  };

  return (
    <>
    {showPicker && (
      <OrgPickerModal
        onClose={() => setShowPicker(false)}
        onSelect={handleSelectOrg}
      />
    )}
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
        <button
          onClick={handleBackToApp}
          disabled={switching}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50"
        >
          {switching
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <ArrowLeft className="w-4 h-4" />
          }
          {switching ? 'Chargement…' : 'Retour à l\'app'}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </div>
    </>
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
