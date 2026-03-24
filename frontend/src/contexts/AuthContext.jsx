import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [organizations, setOrganizations] = useState([]); // toutes les orgs de l'utilisateur
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
      setOrganization(data.data.organization);
      setOrganizations(data.data.organizations || []);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setOrganization(null);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { user: userData, organization: orgData, organizations: orgsData, accessToken, refreshToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    setOrganization(orgData);
    setOrganizations(orgsData || []);
    return userData;
  };

  const register = async (name, email, password, organizationName) => {
    const { data } = await api.post('/auth/register', { name, email, password, organizationName });
    // Pas de tokens — l'utilisateur doit vérifier son email avant de se connecter
    return data.data; // { email }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try { await api.post('/auth/logout', { refreshToken }); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setOrganization(null);
    setOrganizations([]);
  };

  // Changer d'organisation active (multi-org)
  const switchOrganization = async (organizationId) => {
    const { data } = await api.post('/organizations/switch', { organizationId });
    const { organization: orgData, orgRole, accessToken, refreshToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setOrganization(orgData);
    setUser(prev => ({ ...prev, organizationId, orgRole }));
    return orgData;
  };

  const changePassword = async (currentPassword, newPassword) => {
    await api.put('/auth/change-password', { currentPassword, newPassword });
  };

  return (
    <AuthContext.Provider value={{
      user, organization, organizations, loading,
      login, register, logout, changePassword, loadUser, switchOrganization
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
