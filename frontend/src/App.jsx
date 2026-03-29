import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// ── Public pages (chargées immédiatement — SEO critique) ──
import LandingPage  from './pages/public/LandingPage';
import Features     from './pages/public/Features';
import Pricing      from './pages/public/Pricing';
import Contact      from './pages/public/Contact';
import CGU          from './pages/public/CGU';
import Privacy      from './pages/public/Privacy';

// ── Auth pages ──
import Login          from './pages/auth/Login';
import Register       from './pages/auth/Register';
import VerifyEmail    from './pages/auth/VerifyEmail';
import AcceptInvite   from './pages/auth/AcceptInvite';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';

// ── App pages (lazy-loaded — chargées seulement après auth) ──
const Layout          = lazy(() => import('./components/Layout'));
const Dashboard       = lazy(() => import('./pages/Dashboard'));
const ClientList      = lazy(() => import('./pages/clients/ClientList'));
const ClientForm      = lazy(() => import('./pages/clients/ClientForm'));
const ClientDetail    = lazy(() => import('./pages/clients/ClientDetail'));
const ProductList     = lazy(() => import('./pages/products/ProductList'));
const ProductForm     = lazy(() => import('./pages/products/ProductForm'));
const DocumentList    = lazy(() => import('./pages/documents/DocumentList'));
const DocumentForm    = lazy(() => import('./pages/documents/DocumentForm'));
const DocumentDetail  = lazy(() => import('./pages/documents/DocumentDetail'));
const Settings        = lazy(() => import('./pages/Settings'));
const Organization    = lazy(() => import('./pages/Organization'));
const Plans           = lazy(() => import('./pages/Plans'));
const AdminLayout     = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrganizations = lazy(() => import('./pages/admin/AdminOrganizations'));
const AdminUsers      = lazy(() => import('./pages/admin/AdminUsers'));
const AdminPlans      = lazy(() => import('./pages/admin/AdminPlans'));
const AdminUpgrades   = lazy(() => import('./pages/admin/AdminUpgrades'));
const AdminSettings   = lazy(() => import('./pages/admin/AdminSettings'));

// ── Spinner de chargement (Suspense fallback) ──
const AppLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Chargement...</p>
    </div>
  </div>
);

// ── Guards ──
const PrivateRoute = ({ children, requireSuperAdmin: needSuperAdmin }) => {
  const { user, loading } = useAuth();
  if (loading) return <AppLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (needSuperAdmin && !user.isSuperAdmin) return <Navigate to="/app" replace />;
  return children;
};

/** Redirige les utilisateurs connectés vers /app (évite d'afficher login/register) */
const PublicRoute = ({ children }) => {
  const { user, organization, loading } = useAuth();
  if (loading) return null;
  if (!user) return children;
  if (user.isSuperAdmin && !organization) return <Navigate to="/admin" replace />;
  return <Navigate to="/app" replace />;
};

/** Route d'accueil intelligente : landing pour les anonymes, dashboard pour les connectés */
const HomeRoute = () => {
  const { user, organization, loading } = useAuth();
  if (loading) return <AppLoader />;
  if (user) {
    // Super admin sans org active → admin panel
    // Super admin avec org active (après switchOrganization) → app
    if (user.isSuperAdmin && !organization) return <Navigate to="/admin" replace />;
    return <Navigate to="/app" replace />;
  }
  return <LandingPage />;
};

export default function App() {
  return (
    <Routes>
      {/* ── Page d'accueil publique ─────────────────────────────── */}
      <Route path="/" element={<HomeRoute />} />

      {/* ── Pages marketing publiques ───────────────────────────── */}
      <Route path="/fonctionnalites" element={<Features />} />
      <Route path="/tarifs"          element={<Pricing />} />
      <Route path="/contact"         element={<Contact />} />
      <Route path="/legal/cgu"       element={<CGU />} />
      <Route path="/legal/privacy"   element={<Privacy />} />

      {/* ── Authentification ────────────────────────────────────── */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/verify-email"              element={<VerifyEmail />} />
      <Route path="/verify-email/confirm/:token" element={<VerifyEmail />} />
      <Route path="/accept-invite"             element={<AcceptInvite />} />
      <Route path="/forgot-password"           element={<ForgotPassword />} />
      <Route path="/reset-password/:token"     element={<ResetPassword />} />

      {/* ── Application protégée (/app/*) — noindex dans SEOHead ── */}
      <Route
        path="/app"
        element={
          <PrivateRoute>
            <Suspense fallback={<AppLoader />}>
              <Layout />
            </Suspense>
          </PrivateRoute>
        }
      >
        <Route index element={<Suspense fallback={<AppLoader />}><Dashboard /></Suspense>} />

        {/* Clients */}
        <Route path="clients"           element={<Suspense fallback={<AppLoader />}><ClientList /></Suspense>} />
        <Route path="clients/new"       element={<Suspense fallback={<AppLoader />}><ClientForm /></Suspense>} />
        <Route path="clients/:id"       element={<Suspense fallback={<AppLoader />}><ClientDetail /></Suspense>} />
        <Route path="clients/:id/edit"  element={<Suspense fallback={<AppLoader />}><ClientForm /></Suspense>} />

        {/* Produits */}
        <Route path="products"          element={<Suspense fallback={<AppLoader />}><ProductList /></Suspense>} />
        <Route path="products/new"      element={<Suspense fallback={<AppLoader />}><ProductForm /></Suspense>} />
        <Route path="products/:id/edit" element={<Suspense fallback={<AppLoader />}><ProductForm /></Suspense>} />

        {/* Documents */}
        <Route path="documents"           element={<Suspense fallback={<AppLoader />}><DocumentList /></Suspense>} />
        <Route path="documents/new"       element={<Suspense fallback={<AppLoader />}><DocumentForm /></Suspense>} />
        <Route path="documents/:id"       element={<Suspense fallback={<AppLoader />}><DocumentDetail /></Suspense>} />
        <Route path="documents/:id/edit"  element={<Suspense fallback={<AppLoader />}><DocumentForm /></Suspense>} />

        {/* Paramètres & Organisation */}
        <Route path="settings"     element={<Suspense fallback={<AppLoader />}><Settings /></Suspense>} />
        <Route path="organization" element={<Suspense fallback={<AppLoader />}><Organization /></Suspense>} />
        <Route path="plans"        element={<Suspense fallback={<AppLoader />}><Plans /></Suspense>} />
      </Route>

      {/* ── Administration (/admin/*) — noindex ──────────────────── */}
      <Route
        path="/admin"
        element={
          <PrivateRoute requireSuperAdmin>
            <Suspense fallback={<AppLoader />}>
              <AdminLayout />
            </Suspense>
          </PrivateRoute>
        }
      >
        <Route index                element={<Suspense fallback={<AppLoader />}><AdminDashboard /></Suspense>} />
        <Route path="organizations" element={<Suspense fallback={<AppLoader />}><AdminOrganizations /></Suspense>} />
        <Route path="users"         element={<Suspense fallback={<AppLoader />}><AdminUsers /></Suspense>} />
        <Route path="plans"         element={<Suspense fallback={<AppLoader />}><AdminPlans /></Suspense>} />
        <Route path="upgrades"      element={<Suspense fallback={<AppLoader />}><AdminUpgrades /></Suspense>} />
        <Route path="settings"      element={<Suspense fallback={<AppLoader />}><AdminSettings /></Suspense>} />
      </Route>

      {/* ── Catch-all ───────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
