import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import { formatCurrency } from '../utils/formatCFA';

const SettingsContext = createContext(null);

const defaultSettings = {
  companyName: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  ninea: '',
  logoPath: null,
  signaturePath: null,
  defaultLanguage: 'fr',
  defaultCurrency: 'XOF',
  defaultTvaRate: 0,
  documentStyle: 'classique',
  primaryColor: '#0EA5E9'
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { i18n } = useTranslation();

  const loadSettings = useCallback(async () => {
    if (!user || user.isSuperAdmin) return;
    setLoading(true);
    try {
      const { data } = await api.get('/settings');
      const s = data.data.settings;
      setSettings({ ...defaultSettings, ...s });

      // Apply language setting
      if (s.defaultLanguage && s.defaultLanguage !== i18n.language) {
        i18n.changeLanguage(s.defaultLanguage);
      }

      // Apply primary color as CSS variable
      if (s.primaryColor) {
        document.documentElement.style.setProperty('--color-primary', s.primaryColor);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, [user, i18n]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = async (newSettings) => {
    const { data } = await api.put('/settings', newSettings);
    setSettings(prev => ({ ...prev, ...data.data.settings }));
    if (newSettings.defaultLanguage) {
      i18n.changeLanguage(newSettings.defaultLanguage);
    }
    return data.data.settings;
  };

  const uploadLogo = async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const { data } = await api.post('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setSettings(prev => ({ ...prev, logoPath: data.data.logoPath }));
    return data.data.logoPath;
  };

  const uploadSignature = async (file) => {
    const formData = new FormData();
    formData.append('signature', file);
    const { data } = await api.post('/settings/signature', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setSettings(prev => ({ ...prev, signaturePath: data.data.signaturePath }));
    return data.data.signaturePath;
  };

  const deleteLogo = async () => {
    await api.delete('/settings/logo');
    setSettings(prev => ({ ...prev, logoPath: null }));
  };

  const deleteSignature = async () => {
    await api.delete('/settings/signature');
    setSettings(prev => ({ ...prev, signaturePath: null }));
  };

  return (
    <SettingsContext.Provider value={{
      settings, loading, loadSettings,
      updateSettings, uploadLogo, uploadSignature,
      deleteLogo, deleteSignature
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};

// Hook pratique : retourne une fonction de formatage monétaire selon la devise des paramètres
export const useFormatCurrency = () => {
  const { settings } = useSettings();
  return useCallback(
    (amount) => formatCurrency(amount, settings.defaultCurrency),
    [settings.defaultCurrency]
  );
};

export default SettingsContext;
