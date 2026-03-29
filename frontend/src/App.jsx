import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import AcceptInvite from './pages/auth/AcceptInvite';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Protected pages
import Dashboard from './pages/Dashboard';
import ClientList from './pages/clients/ClientList';
import ClientForm from './pages/clients/ClientForm';
import ClientDetail from './pages/clients/ClientDetail';
import ProductList from './pages/products/ProductList';
import ProductForm from './pages/products/ProductForm';
import DocumentList from './pages/documents/DocumentList';
import DocumentForm from './pages/documents/DocumentForm';
import DocumentDetail from './pages/documents/DocumentDetail';
import Settings from './pages/Settings';
import Organization from './pages/Organization';
import Plans from './pages/Plans';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrganizations from './pages/admin/AdminOrganizations';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPlans from './pages/admin/AdminPlans';
import AdminUpgrades from './pages/admin/AdminUpgrades';
import AdminSettings from './pages/admin/AdminSettings';

const IndexRoute = () => {
  return <Dashboard />;
};

const PrivateRoute = ({ children, requireSuperAdmin: needSuperAdmin }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (needSuperAdmin && !user.isSuperAdmin) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
};

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/verify-email/confirm/:token" element={<VerifyEmail />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Protected routes */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<IndexRoute />} />

        {/* Clients */}
        <Route path="clients" element={<ClientList />} />
        <Route path="clients/new" element={<ClientForm />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="clients/:id/edit" element={<ClientForm />} />

        {/* Produits */}
        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />

        {/* Documents */}
        <Route path="documents" element={<DocumentList />} />
        <Route path="documents/new" element={<DocumentForm />} />
        <Route path="documents/:id" element={<DocumentDetail />} />
        <Route path="documents/:id/edit" element={<DocumentForm />} />

        {/* Paramètres */}
        <Route path="settings" element={<Settings />} />

        {/* Organisation */}
        <Route path="organization" element={<Organization />} />

        {/* Plans */}
        <Route path="plans" element={<Plans />} />
      </Route>

      {/* Admin — layout séparé, protégé super admin */}
      <Route path="/admin" element={
        <PrivateRoute requireSuperAdmin>
          <AdminLayout />
        </PrivateRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="organizations" element={<AdminOrganizations />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="upgrades" element={<AdminUpgrades />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
