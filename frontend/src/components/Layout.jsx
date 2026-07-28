import { useState, useMemo } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, XCircle, Zap, X } from 'lucide-react';

function SubscriptionBanner({ organization }) {
  const [dismissed, setDismissed] = useState(false);

  const status = useMemo(() => {
    if (!organization || organization.plan === 'FREE' || !organization.planExpiresAt) return null;
    const days = Math.ceil((new Date(organization.planExpiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    if (days > 7) return null;
    return { days, expired: days <= 0 };
  }, [organization]);

  if (!status || dismissed) return null;

  const { days, expired } = status;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 text-sm flex-shrink-0 ${
      expired
        ? 'bg-red-600 text-white'
        : 'bg-orange-500 text-white'
    }`}>
      {expired
        ? <XCircle className="w-4 h-4 flex-shrink-0" />
        : <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      }
      <span className="flex-1">
        {expired
          ? <>Votre abonnement <strong>{organization.plan}</strong> a expiré. Renouvelez pour maintenir l'accès à toutes vos fonctionnalités.</>
          : <>Votre abonnement <strong>{organization.plan}</strong> expire dans <strong>{days} jour{days > 1 ? 's' : ''}</strong>. Pensez à renouveler.</>
        }
      </span>
      <Link
        to="/app/plans"
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold flex-shrink-0 transition-colors ${
          expired
            ? 'bg-white text-red-600 hover:bg-red-50'
            : 'bg-white text-orange-600 hover:bg-orange-50'
        }`}
      >
        <Zap className="w-3.5 h-3.5" />
        Renouveler
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
        title="Masquer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { organization } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <SubscriptionBanner organization={organization} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
