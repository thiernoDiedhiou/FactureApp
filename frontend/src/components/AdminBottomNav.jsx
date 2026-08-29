import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, CreditCard, Menu } from 'lucide-react';

const TAB = 'flex flex-col items-center justify-center gap-0.5 flex-1 py-2';

export default function AdminBottomNav({ onMenuClick }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 bg-gray-900 border-t border-gray-800 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center h-16">

        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `${TAB} ${isActive ? 'text-amber-400' : 'text-gray-500'}`
          }
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-medium">Accueil</span>
        </NavLink>

        <NavLink
          to="/admin/upgrades"
          className={({ isActive }) =>
            `${TAB} ${isActive ? 'text-amber-400' : 'text-gray-500'}`
          }
        >
          <TrendingUp className="w-6 h-6" />
          <span className="text-[10px] font-medium">Demandes</span>
        </NavLink>

        <NavLink
          to="/admin/subscriptions"
          className={({ isActive }) =>
            `${TAB} ${isActive ? 'text-amber-400' : 'text-gray-500'}`
          }
        >
          <CreditCard className="w-6 h-6" />
          <span className="text-[10px] font-medium">Abonnements</span>
        </NavLink>

        <button
          onClick={onMenuClick}
          className={`${TAB} text-gray-500 hover:text-gray-300 active:text-gray-300`}
        >
          <Menu className="w-6 h-6" />
          <span className="text-[10px] font-medium">Menu</span>
        </button>

      </div>
    </nav>
  );
}
