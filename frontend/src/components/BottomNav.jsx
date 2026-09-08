import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, Menu, Plus,
  FileCheck, FileEdit, FilePlus, UserPlus
} from 'lucide-react';

const CREATE_OPTIONS = [
  { label: 'Nouvelle facture',  href: '/app/documents/new',            icon: FileCheck, color: 'text-blue-600'   },
  { label: 'Nouveau devis',     href: '/app/documents/new?type=devis', icon: FileEdit,  color: 'text-purple-600' },
  { label: 'Proforma',          href: '/app/documents/new?type=proforma', icon: FilePlus, color: 'text-teal-600' },
  { label: 'Nouveau client',    href: '/app/clients/new',              icon: UserPlus,  color: 'text-green-600'  },
];

const TAB_CLASS      = 'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 relative';
const ACTIVE_CLASS   = 'text-primary-600';
const INACTIVE_CLASS = 'text-gray-400';

export default function BottomNav({ onMenuClick }) {
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  // Fermer le menu si clic en dehors
  useEffect(() => {
    if (!showCreate) return;
    const close = () => setShowCreate(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showCreate]);

  const handleCreate = (href) => {
    navigate(href);
    setShowCreate(false);
  };

  return (
    <>
      {/* Overlay sombre derrière le menu Créer */}
      {showCreate && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
          onClick={() => setShowCreate(false)}
        />
      )}

      {/* Menu de création rapide */}
      {showCreate && (
        <div
          className="fixed z-50 lg:hidden bg-white rounded-2xl shadow-2xl overflow-hidden w-56"
          style={{ bottom: '80px', left: '50%', transform: 'translateX(-50%)' }}
          onClick={e => e.stopPropagation()}
        >
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-1">
            Créer
          </p>
          {CREATE_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.href}
                onClick={() => handleCreate(opt.href)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-t border-gray-100 first:border-0"
              >
                <div className={`w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${opt.color}`} />
                </div>
                <span className="text-sm font-medium text-gray-800">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Barre de navigation en bas */}
      <nav
        className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center h-16">

          {/* Accueil */}
          <NavLink to="/app" end className={({ isActive }) => `${TAB_CLASS} ${isActive ? ACTIVE_CLASS : INACTIVE_CLASS}`}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary-500" />}
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-primary-50' : ''}`}>
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>Accueil</span>
              </>
            )}
          </NavLink>

          {/* Documents */}
          <NavLink to="/app/documents" className={({ isActive }) => `${TAB_CLASS} ${isActive ? ACTIVE_CLASS : INACTIVE_CLASS}`}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary-500" />}
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-primary-50' : ''}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>Documents</span>
              </>
            )}
          </NavLink>

          {/* Bouton + central (FAB) */}
          <div className="flex flex-col items-center justify-center flex-1">
            <button
              onClick={e => { e.stopPropagation(); setShowCreate(v => !v); }}
              className={`w-14 h-14 -mt-6 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 ${
                showCreate
                  ? 'bg-gray-800 rotate-45 scale-95'
                  : 'bg-primary-600 active:scale-95'
              }`}
              aria-label="Créer"
            >
              <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
            </button>
          </div>

          {/* Clients */}
          <NavLink to="/app/clients" className={({ isActive }) => `${TAB_CLASS} ${isActive ? ACTIVE_CLASS : INACTIVE_CLASS}`}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary-500" />}
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-primary-50' : ''}`}>
                  <Users className="w-5 h-5" />
                </div>
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>Clients</span>
              </>
            )}
          </NavLink>

          {/* Menu (ouvre la sidebar) */}
          <button onClick={onMenuClick} className={`${TAB_CLASS} ${INACTIVE_CLASS} hover:text-gray-600`}>
            <div className="p-1.5 rounded-xl">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">Menu</span>
          </button>

        </div>
      </nav>
    </>
  );
}
