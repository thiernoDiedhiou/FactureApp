import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Save, Upload, Trash2, Loader2, Building2, Palette,
  Globe, Image, FileText, Lock
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

const DOCUMENT_STYLES = [
  { value: 'classique', label: 'Classique', desc: 'Mise en page sobre, noir et blanc' },
  { value: 'moderne', label: 'Moderne', desc: 'Couleurs vives, design épuré' },
  { value: 'compact', label: 'Compact', desc: 'Format condensé' }
];

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' }
];

const CURRENCIES = [
  { value: 'XOF', label: 'Franc CFA (XOF/FCFA)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'USD', label: 'Dollar US (USD)' }
];

const PRESET_COLORS = [
  '#0EA5E9', '#6366F1', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6B7280'
];

export default function Settings() {
  const { t } = useTranslation();
  const { settings, updateSettings, uploadLogo, uploadSignature, deleteLogo, deleteSignature } = useSettings();
  const { changePassword } = useAuth();

  const [form, setForm] = useState({
    companyName: settings.companyName || '',
    address: settings.address || '',
    phone: settings.phone || '',
    email: settings.email || '',
    website: settings.website || '',
    ninea: settings.ninea || '',
    defaultLanguage: settings.defaultLanguage || 'fr',
    defaultCurrency: settings.defaultCurrency || 'XOF',
    defaultTvaRate: settings.defaultTvaRate ?? 18,
    documentStyle: settings.documentStyle || 'classique',
    primaryColor: settings.primaryColor || '#0EA5E9'
  });
  // Syncer le formulaire quand les settings sont chargés depuis l'API (settings.id disponible)
  useEffect(() => {
    if (!settings.id) return;
    setForm({
      companyName: settings.companyName || '',
      address: settings.address || '',
      phone: settings.phone || '',
      email: settings.email || '',
      website: settings.website || '',
      ninea: settings.ninea || '',
      defaultLanguage: settings.defaultLanguage || 'fr',
      defaultCurrency: settings.defaultCurrency || 'XOF',
      defaultTvaRate: settings.defaultTvaRate ?? 18,
      documentStyle: settings.documentStyle || 'classique',
      primaryColor: settings.primaryColor || '#0EA5E9'
    });
  }, [settings.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, sig: false });

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        ...form,
        defaultTvaRate: parseFloat(form.defaultTvaRate)
      });
      toast.success(t('settings.saved'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(u => ({ ...u, logo: true }));
    try {
      await uploadLogo(file);
      toast.success('Logo uploadé');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur upload logo (max 2MB, JPG/PNG/SVG)');
    } finally {
      setUploading(u => ({ ...u, logo: false }));
      e.target.value = '';
    }
  };

  const handleSigUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(u => ({ ...u, sig: true }));
    try {
      await uploadSignature(file);
      toast.success('Signature uploadée');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur upload signature');
    } finally {
      setUploading(u => ({ ...u, sig: false }));
      e.target.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    try { await deleteLogo(); toast.success(t('settings.deleteLogo')); }
    catch { toast.error('Erreur suppression logo'); }
  };

  const handleDeleteSig = async () => {
    try { await deleteSignature(); toast.success(t('settings.deleteSignature')); }
    catch { toast.error('Erreur suppression signature'); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.current) errs.current = 'Requis';
    if (!pwForm.newPw || pwForm.newPw.length < 8) errs.newPw = 'Min. 8 caractères';
    if (pwForm.newPw !== pwForm.confirm) errs.confirm = 'Les mots de passe ne correspondent pas';
    if (Object.keys(errs).length > 0) { setPwErrors(errs); return; }

    setPwLoading(true);
    try {
      await changePassword(pwForm.current, pwForm.newPw);
      toast.success('Mot de passe modifié');
      setPwForm({ current: '', newPw: '', confirm: '' });
      setPwErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur changement mot de passe');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <h1 className="page-title">{t('settings.title')}</h1>

      {/* Company info */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="card p-6">
          <h2 className="section-title flex items-center gap-2 mb-5">
            <Building2 className="w-5 h-5 text-primary-600" />
            {t('settings.company')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">{t('settings.companyName')}</label>
              <input type="text" className="input-field" value={form.companyName}
                onChange={(e) => f('companyName', e.target.value)}
                placeholder="DigiTech Solutions SARL" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t('settings.address')}</label>
              <textarea className="input-field resize-none" rows={2}
                value={form.address}
                onChange={(e) => f('address', e.target.value)}
                placeholder="Rue 10, Cité Keur Gorgui, Dakar" />
            </div>
            <div>
              <label className="label">{t('settings.phone')}</label>
              <input type="tel" className="input-field" value={form.phone}
                onChange={(e) => f('phone', e.target.value)}
                placeholder="+221 77 123 45 67" />
            </div>
            <div>
              <label className="label">{t('settings.email')}</label>
              <input type="email" className="input-field" value={form.email}
                onChange={(e) => f('email', e.target.value)}
                placeholder="contact@entreprise.sn" />
            </div>
            <div>
              <label className="label">{t('settings.website')}</label>
              <input type="text" className="input-field" value={form.website}
                onChange={(e) => f('website', e.target.value)}
                placeholder="www.entreprise.sn" />
            </div>
            <div>
              <label className="label">
                {t('settings.ninea')}
                <span className="text-gray-400 text-xs ml-1">(Numéro fiscal sénégalais)</span>
              </label>
              <input type="text" className="input-field font-mono" value={form.ninea}
                onChange={(e) => f('ninea', e.target.value)}
                placeholder="012345678 2A3" />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="card p-6">
          <h2 className="section-title flex items-center gap-2 mb-5">
            <Image className="w-5 h-5 text-primary-600" />
            {t('settings.branding')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <p className="label">{t('settings.logo')}</p>
              {settings.logoPath ? (
                <div className="mt-2">
                  <img src={settings.logoPath} alt="Logo" className="h-20 object-contain border border-gray-200 rounded-lg p-2 bg-gray-50" />
                  <div className="flex gap-2 mt-2">
                    <label className="btn-secondary text-xs cursor-pointer">
                      <Upload className="w-3 h-3" /> Changer
                      <input type="file" accept="image/jpeg,image/png,image/svg+xml,image/webp"
                        className="hidden" onChange={handleLogoUpload} />
                    </label>
                    <button type="button" onClick={handleDeleteLogo} className="btn-secondary text-xs text-red-600">
                      <Trash2 className="w-3 h-3" /> Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <label className="mt-2 flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                  {uploading.logo ? (
                    <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-400">{t('settings.uploadLogo')}</span>
                      <span className="text-xs text-gray-300 mt-0.5">PNG, JPG, SVG — max 2MB</span>
                    </>
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/svg+xml,image/webp"
                    className="hidden" onChange={handleLogoUpload} disabled={uploading.logo} />
                </label>
              )}
            </div>

            {/* Signature */}
            <div>
              <p className="label">{t('settings.signature')}</p>
              {settings.signaturePath ? (
                <div className="mt-2">
                  <img src={settings.signaturePath} alt="Signature" className="h-20 object-contain border border-gray-200 rounded-lg p-2 bg-gray-50" />
                  <div className="flex gap-2 mt-2">
                    <label className="btn-secondary text-xs cursor-pointer">
                      <Upload className="w-3 h-3" /> Changer
                      <input type="file" accept="image/jpeg,image/png,image/svg+xml,image/webp"
                        className="hidden" onChange={handleSigUpload} />
                    </label>
                    <button type="button" onClick={handleDeleteSig} className="btn-secondary text-xs text-red-600">
                      <Trash2 className="w-3 h-3" /> Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <label className="mt-2 flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                  {uploading.sig ? (
                    <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-400">{t('settings.uploadSignature')}</span>
                      <span className="text-xs text-gray-300 mt-0.5">PNG, JPG, SVG — max 2MB</span>
                    </>
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/svg+xml,image/webp"
                    className="hidden" onChange={handleSigUpload} disabled={uploading.sig} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card p-6">
          <h2 className="section-title flex items-center gap-2 mb-5">
            <Globe className="w-5 h-5 text-primary-600" />
            {t('settings.preferences')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">{t('settings.language')}</label>
              <select className="input-field" value={form.defaultLanguage}
                onChange={(e) => f('defaultLanguage', e.target.value)}>
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('settings.currency')}</label>
              <select className="input-field" value={form.defaultCurrency}
                onChange={(e) => f('defaultCurrency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('settings.tvaRate')}</label>
              <div className="relative">
                <input type="number" min="0" max="100" step="0.5" className="input-field pr-8"
                  value={form.defaultTvaRate}
                  onChange={(e) => f('defaultTvaRate', e.target.value)} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">TVA Sénégal: 18% par défaut</p>
            </div>
          </div>
        </div>

        {/* Document style */}
        <div className="card p-6">
          <h2 className="section-title flex items-center gap-2 mb-5">
            <FileText className="w-5 h-5 text-primary-600" />
            {t('settings.documentStyle')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {DOCUMENT_STYLES.map(style => (
              <label key={style.value}
                className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  form.documentStyle === style.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                <input type="radio" name="documentStyle" value={style.value}
                  checked={form.documentStyle === style.value}
                  onChange={(e) => f('documentStyle', e.target.value)}
                  className="sr-only" />
                <div className="flex items-center gap-2 mb-1">
                  {form.documentStyle === style.value && (
                    <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                  <p className="font-semibold text-gray-900">{style.label}</p>
                </div>
                <p className="text-xs text-gray-500">{style.desc}</p>
              </label>
            ))}
          </div>

          {/* Color picker */}
          <div>
            <label className="label flex items-center gap-2">
              <Palette className="w-4 h-4" />
              {t('settings.primaryColor')}
            </label>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {PRESET_COLORS.map(color => (
                <button key={color} type="button"
                  onClick={() => f('primaryColor', color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    form.primaryColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input type="color" value={form.primaryColor}
                onChange={(e) => f('primaryColor', e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border border-gray-300"
                title="Couleur personnalisée" />
              <span className="text-sm text-gray-500 font-mono">{form.primaryColor}</span>
            </div>
            {/* Color preview */}
            <div className="mt-3 h-2 rounded-full" style={{ backgroundColor: form.primaryColor }} />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary px-8 py-3" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('settings.save')}
          </button>
        </div>
      </form>

      {/* Change password */}
      <div className="card p-6">
        <h2 className="section-title flex items-center gap-2 mb-5">
          <Lock className="w-5 h-5 text-primary-600" />
          Changer le mot de passe
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="label">Mot de passe actuel</label>
            <input type="password" className={`input-field ${pwErrors.current ? 'border-red-500' : ''}`}
              value={pwForm.current}
              onChange={(e) => { setPwForm(f => ({ ...f, current: e.target.value })); setPwErrors({}); }} />
            {pwErrors.current && <p className="text-red-500 text-xs mt-1">{pwErrors.current}</p>}
          </div>
          <div>
            <label className="label">Nouveau mot de passe</label>
            <input type="password" className={`input-field ${pwErrors.newPw ? 'border-red-500' : ''}`}
              value={pwForm.newPw}
              onChange={(e) => { setPwForm(f => ({ ...f, newPw: e.target.value })); setPwErrors({}); }}
              placeholder="Min. 8 caractères" />
            {pwErrors.newPw && <p className="text-red-500 text-xs mt-1">{pwErrors.newPw}</p>}
          </div>
          <div>
            <label className="label">Confirmer le mot de passe</label>
            <input type="password" className={`input-field ${pwErrors.confirm ? 'border-red-500' : ''}`}
              value={pwForm.confirm}
              onChange={(e) => { setPwForm(f => ({ ...f, confirm: e.target.value })); setPwErrors({}); }} />
            {pwErrors.confirm && <p className="text-red-500 text-xs mt-1">{pwErrors.confirm}</p>}
          </div>
          <button type="submit" className="btn-primary" disabled={pwLoading}>
            {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Modifier le mot de passe
          </button>
        </form>
      </div>
    </div>
  );
}
