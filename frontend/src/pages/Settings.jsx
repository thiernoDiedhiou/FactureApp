import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Save, Upload, Trash2, Loader2, Building2, Palette,
  Globe, Image, FileText, Lock, Eye, EyeOff, ChevronDown
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

const DOCUMENT_STYLES = [
  { value: 'classique', label: 'Classique', desc: 'Sobre, noir et blanc' },
  { value: 'moderne',   label: 'Moderne',   desc: 'Couleurs vives, épuré' },
  { value: 'compact',  label: 'Compact',   desc: 'Format condensé' }
];

// ── Mini aperçu de document ───────────────────────────────────────────────────
function DocumentPreview({ style, color, companyName }) {
  const name = companyName || 'Votre Entreprise';

  const wrapper = { position: 'relative', width: '100%', height: '220px', overflow: 'hidden' };
  const inner = {
    position: 'absolute', top: 0, left: 0, width: '520px',
    transformOrigin: 'top left', transform: 'scale(0.44)',
    fontFamily: 'system-ui, sans-serif', background: '#ffffff',
    borderRadius: '8px', boxShadow: '0 2px 16px rgba(0,0,0,0.13)',
    overflow: 'hidden', userSelect: 'none',
  };
  const thStyle = {
    display: 'grid', gridTemplateColumns: '1fr 38px 68px 48px 72px',
    padding: '6px 18px', background: '#f0f0f0', borderBottom: '1px solid #ddd',
    fontSize: '9px', fontWeight: 700, color: '#555', textTransform: 'uppercase',
  };
  const items = [
    { desc: 'Prestation de service',  qty: 1, pu: '50 000', tva: '18%', total: '59 000' },
    { desc: 'Consultation mensuelle', qty: 2, pu: '15 000', tva: '18%', total: '35 400' },
  ];
  const totals = [['Sous-total', '80 000 FCFA'], ['TVA (18%)', '14 400 FCFA']];

  // ── Template MODERNE ──────────────────────────────────────────────────────
  if (style === 'moderne') {
    return (
      <div style={wrapper}>
        <div style={inner}>
          <div style={{ background: color, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#fff' }}>{name}</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.72)', marginTop: '2px' }}>Dakar, Sénégal</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 900, fontSize: '20px', color: '#fff', letterSpacing: '2px' }}>FACTURE</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>N° FAC-2026-001</div>
            </div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
            <div style={{ flex: 1, padding: '10px 18px', borderRight: '1px solid #eee' }}>
              <div style={{ fontSize: '8px', fontWeight: 700, color: color, textTransform: 'uppercase', marginBottom: '4px' }}>Facturé à</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>Client Exemple</div>
              <div style={{ fontSize: '9px', color: '#666' }}>Mbour 2</div>
              <div style={{ fontSize: '9px', color: '#666' }}>client@exemple.sn</div>
            </div>
            <div style={{ flex: 1, padding: '10px 18px' }}>
              <div style={{ fontSize: '8px', fontWeight: 700, color: color, textTransform: 'uppercase', marginBottom: '4px' }}>Détails</div>
              <div style={{ fontSize: '9px', color: '#444' }}>Date: 28/08/2026</div>
              <div style={{ fontSize: '9px', color: '#444' }}>Échéance: 27/09/2026</div>
              <div style={{ fontSize: '9px', marginTop: '2px' }}>Statut: <span style={{ color: '#16a34a', fontWeight: 700 }}>Payé</span></div>
            </div>
          </div>
          <div style={thStyle}>
            <span>Description</span><span style={{ textAlign: 'center' }}>Qté</span>
            <span style={{ textAlign: 'right' }}>P.U.</span><span style={{ textAlign: 'right' }}>TVA</span>
            <span style={{ textAlign: 'right' }}>Total</span>
          </div>
          {items.map((item, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 38px 68px 48px 72px',
              padding: '8px 18px', borderBottom: '1px solid #f5f5f5',
              background: i % 2 === 0 ? '#fafafa' : '#fff', fontSize: '11px', color: '#111',
            }}>
              <span>{item.desc}</span>
              <span style={{ textAlign: 'center', color: '#888' }}>{item.qty}</span>
              <span style={{ textAlign: 'right', color: '#888' }}>{item.pu}</span>
              <span style={{ textAlign: 'right', color: '#888' }}>{item.tva}</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>{item.total}</span>
            </div>
          ))}
          <div style={{ padding: '10px 18px', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '200px' }}>
              {totals.map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '10px', color: '#777' }}>
                  <span>{label}</span><span>{val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', marginTop: '4px', borderRadius: '4px', background: color, color: '#fff', fontSize: '13px', fontWeight: 800 }}>
                <span>TOTAL TTC</span><span>94 400 FCFA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Template COMPACT ──────────────────────────────────────────────────────
  if (style === 'compact') {
    return (
      <div style={wrapper}>
        <div style={inner}>
          {/* En-tête : nom entreprise | FACTURE */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 18px', borderBottom: `2px solid ${color}` }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#111' }}>{name}</div>
              <div style={{ fontSize: '9px', color, marginTop: '2px' }}>Dakar, Sénégal</div>
              <div style={{ fontSize: '9px', color }}>+221 77 123 45 67</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '1px', color: '#111' }}>FACTURE</div>
              <div style={{ fontSize: '9px', color, marginTop: '2px' }}>N° FAC-2026-001</div>
              <div style={{ fontSize: '9px', color }}>28/08/2026</div>
              <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700, marginTop: '2px' }}>Payé</div>
            </div>
          </div>
          {/* Section client — infos en couleur primaire */}
          <div style={{ padding: '7px 18px', borderBottom: '1px solid #eee' }}>
            <div style={{ fontSize: '8px', fontWeight: 700, color, textTransform: 'uppercase', marginBottom: '3px' }}>Client:</div>
            <div style={{ fontSize: '11px', color }}>Client Exemple | Mbour 2</div>
            <div style={{ fontSize: '9px', color }}>+221 77 000 00 00 | client@exemple.sn</div>
          </div>
          {/* Header tableau — fond sombre #333333 */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 38px 68px 48px 72px',
            padding: '5px 18px', background: '#333333',
            fontSize: '9px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase',
          }}>
            <span>Description</span><span style={{ textAlign: 'center' }}>Qté</span>
            <span style={{ textAlign: 'right' }}>P.U.</span><span style={{ textAlign: 'right' }}>TVA</span>
            <span style={{ textAlign: 'right' }}>Total</span>
          </div>
          {/* Lignes — description en couleur, données numériques en gris */}
          {items.map((item, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 38px 68px 48px 72px',
              padding: '5px 18px', borderBottom: '1px solid #f0f0f0',
              background: i % 2 === 0 ? '#ffffff' : '#f9f9f9', fontSize: '10px',
            }}>
              <span style={{ color }}>{item.desc}</span>
              <span style={{ textAlign: 'center', color: '#666' }}>{item.qty}</span>
              <span style={{ textAlign: 'right', color: '#666' }}>{item.pu}</span>
              <span style={{ textAlign: 'right', color: '#666' }}>{item.tva}</span>
              <span style={{ textAlign: 'right', fontWeight: 600, color: '#333' }}>{item.total}</span>
            </div>
          ))}
          <div style={{ padding: '8px 18px', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '200px' }}>
              {totals.map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '10px', color: '#777' }}>
                  <span>{label}</span><span>{val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', marginTop: '4px', borderRadius: '4px', background: '#f1f5f9', color: '#111111', fontSize: '12px', fontWeight: 800 }}>
                <span>TOTAL TTC</span><span>94 400 FCFA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Template CLASSIQUE (défaut) ────────────────────────────────────────────
  return (
    <div style={wrapper}>
      <div style={inner}>
        {/* En-tête : nom entreprise à gauche, FACTURE + infos à droite */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 18px', borderBottom: '1px solid #e0e0e0' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: '#111' }}>{name}</div>
            <div style={{ fontSize: '9px', color: '#666', marginTop: '3px' }}>Dakar, Sénégal</div>
            <div style={{ fontSize: '9px', color: '#666' }}>+221 77 123 45 67</div>
            <div style={{ fontSize: '9px', color: '#666' }}>contact@entreprise.sn</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 900, fontSize: '22px', letterSpacing: '2px', color: '#111' }}>FACTURE</div>
            <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>N° FAC-2026-001</div>
            <div style={{ fontSize: '9px', color: '#555' }}>Date: 28/08/2026</div>
            <div style={{ fontSize: '9px', color: '#555' }}>Échéance: 27/09/2026</div>
            <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700, marginTop: '3px' }}>Payé</div>
          </div>
        </div>
        {/* Section client */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid #eee' }}>
          <div style={{ fontSize: '8px', fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Facturé à:</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>Client Exemple</div>
          <div style={{ fontSize: '10px', color: '#555' }}>Mbour 2</div>
          <div style={{ fontSize: '10px', color: '#555' }}>+221 77 000 00 00 | client@exemple.sn</div>
        </div>
        {/* En-tête tableau — fond sombre comme le PDF */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 38px 68px 48px 72px',
          padding: '7px 18px', background: '#1a1a1a',
          fontSize: '9px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase',
        }}>
          <span>Description</span><span style={{ textAlign: 'center' }}>Qté</span>
          <span style={{ textAlign: 'right' }}>P.U.</span><span style={{ textAlign: 'right' }}>TVA</span>
          <span style={{ textAlign: 'right' }}>Total</span>
        </div>
        {/* Lignes — Classique est noir et blanc, pas de couleur primaire */}
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr 38px 68px 48px 72px',
            padding: '8px 18px', borderBottom: '1px solid #f0f0f0',
            background: i % 2 === 0 ? '#fafafa' : '#fff', fontSize: '11px',
          }}>
            <span style={{ color: '#111111' }}>{item.desc}</span>
            <span style={{ textAlign: 'center', color: '#888' }}>{item.qty}</span>
            <span style={{ textAlign: 'right', color: '#444' }}>{item.pu}</span>
            <span style={{ textAlign: 'right', color: '#888' }}>{item.tva}</span>
            <span style={{ textAlign: 'right', fontWeight: 600, color: '#111' }}>{item.total}</span>
          </div>
        ))}
        {/* Totaux */}
        <div style={{ padding: '10px 18px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '200px' }}>
            {totals.map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '10px', color: '#777' }}>
                <span>{label}</span><span>{val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', marginTop: '4px', borderRadius: '4px', background: '#f4f4f4', color: '#111111', fontSize: '13px', fontWeight: 800 }}>
              <span>TOTAL TTC</span><span>94 400 FCFA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    activity: settings.activity || '',
    address: settings.address || '',
    phone: settings.phone || '',
    email: settings.email || '',
    website: settings.website || '',
    ninea: settings.ninea || '',
    rccm: settings.rccm || '',
    bankName: settings.bankName || '',
    bankAccount: settings.bankAccount || '',
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
      activity: settings.activity || '',
      address: settings.address || '',
      phone: settings.phone || '',
      email: settings.email || '',
      website: settings.website || '',
      ninea: settings.ninea || '',
      rccm: settings.rccm || '',
      bankName: settings.bankName || '',
      bankAccount: settings.bankAccount || '',
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
  const [showPwSection, setShowPwSection] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const togglePw = (key) => setShowPw(p => ({ ...p, [key]: !p[key] }));

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
          <h2 className="section-title flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-primary-600" />
            {t('settings.company')}
          </h2>

          {/* ── Identité ── */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Identité</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">{t('settings.companyName')}</label>
                <input type="text" className="input-field" value={form.companyName}
                  onChange={(e) => f('companyName', e.target.value)}
                  placeholder="DigiTech Solutions SARL" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">
                  Secteur / Activité
                  <span className="text-gray-400 text-xs ml-1 font-normal">— affiché sous le nom sur les documents</span>
                </label>
                <input type="text" className="input-field" value={form.activity}
                  onChange={(e) => f('activity', e.target.value)}
                  placeholder="Commerce Général Import - Export" />
              </div>
            </div>
          </div>

          {/* ── Coordonnées ── */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Coordonnées</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="sm:col-span-2">
                <label className="label">{t('settings.website')}</label>
                <input type="text" className="input-field" value={form.website}
                  onChange={(e) => f('website', e.target.value)}
                  placeholder="www.entreprise.sn" />
              </div>
            </div>
          </div>

          {/* ── Identifiants légaux ── */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Identifiants légaux</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  {t('settings.ninea')}
                  <span className="text-gray-400 text-xs ml-1 font-normal">Numéro fiscal</span>
                </label>
                <input type="text" className="input-field font-mono" value={form.ninea}
                  onChange={(e) => f('ninea', e.target.value)}
                  placeholder="012345678 2A3" />
              </div>
              <div>
                <label className="label">
                  RCCM
                  <span className="text-gray-400 text-xs ml-1 font-normal">Registre du Commerce</span>
                </label>
                <input type="text" className="input-field font-mono" value={form.rccm}
                  onChange={(e) => f('rccm', e.target.value)}
                  placeholder="SN-DKR-2023-B-12345" />
              </div>
            </div>
          </div>

          {/* ── Informations bancaires ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Informations bancaires</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nom de la banque</label>
                <input type="text" className="input-field" value={form.bankName}
                  onChange={(e) => f('bankName', e.target.value)}
                  placeholder="CBAO, Ecobank, BIS..." />
              </div>
              <div>
                <label className="label">Numéro de compte</label>
                <input type="text" className="input-field font-mono" value={form.bankAccount}
                  onChange={(e) => f('bankAccount', e.target.value)}
                  placeholder="SN28 0100 1234 5678 9012 3456 789" />
              </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Colonne gauche : contrôles */}
            <div className="space-y-5">
              {/* Sélecteur de template */}
              <div className="grid grid-cols-3 gap-3">
                {DOCUMENT_STYLES.map(style => (
                  <label key={style.value}
                    className={`relative p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      form.documentStyle === style.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <input type="radio" name="documentStyle" value={style.value}
                      checked={form.documentStyle === style.value}
                      onChange={(e) => f('documentStyle', e.target.value)}
                      className="sr-only" />
                    <div className="flex items-center gap-1.5 mb-1">
                      {form.documentStyle === style.value && (
                        <div className="w-3.5 h-3.5 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                      )}
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{style.label}</p>
                    </div>
                    <p className="text-xs text-gray-400 leading-tight">{style.desc}</p>
                  </label>
                ))}
              </div>

              {/* Sélecteur de couleur */}
              <div>
                <label className="label flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  {t('settings.primaryColor')}
                </label>
                <div className="flex flex-wrap items-center gap-2.5 mt-2">
                  {PRESET_COLORS.map(color => (
                    <button key={color} type="button"
                      onClick={() => f('primaryColor', color)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        form.primaryColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input type="color" value={form.primaryColor}
                    onChange={(e) => f('primaryColor', e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer border border-gray-300"
                    title="Couleur personnalisée" />
                  <span className="text-xs text-gray-500 font-mono">{form.primaryColor}</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full transition-colors duration-300" style={{ backgroundColor: form.primaryColor }} />
              </div>
            </div>

            {/* Colonne droite : aperçu live */}
            <div>
              <p className="label mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: form.primaryColor }} />
                Aperçu en direct
              </p>
              <div className="bg-gray-100 rounded-2xl p-3 border border-gray-200">
                <DocumentPreview
                  style={form.documentStyle}
                  color={form.primaryColor}
                  companyName={form.companyName}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Modifiez le style et la couleur pour voir le résultat
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary px-8 py-3" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('settings.save')}
          </button>
        </div>
      </form>

      {/* Change password — section repliable */}
      <div className="card overflow-hidden">
        {/* En-tête cliquable */}
        <button
          type="button"
          onClick={() => {
            setShowPwSection(v => !v);
            if (showPwSection) {
              setPwForm({ current: '', newPw: '', confirm: '' });
              setPwErrors({});
              setShowPw({ current: false, newPw: false, confirm: false });
            }
          }}
          className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
        >
          <h2 className="section-title flex items-center gap-2 mb-0">
            <Lock className="w-5 h-5 text-primary-600" />
            Changer le mot de passe
          </h2>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showPwSection ? 'rotate-180' : ''}`} />
        </button>

        {/* Formulaire repliable */}
        {showPwSection && (
          <div className="px-6 pb-6 border-t border-gray-100 pt-5">
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">

              {/* Mot de passe actuel */}
              <div>
                <label className="label">Mot de passe actuel</label>
                <div className="relative">
                  <input
                    type={showPw.current ? 'text' : 'password'}
                    className={`input-field pr-10 ${pwErrors.current ? 'border-red-500' : ''}`}
                    value={pwForm.current}
                    onChange={(e) => { setPwForm(f => ({ ...f, current: e.target.value })); setPwErrors({}); }}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => togglePw('current')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwErrors.current && <p className="text-red-500 text-xs mt-1">{pwErrors.current}</p>}
              </div>

              {/* Nouveau mot de passe */}
              <div>
                <label className="label">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showPw.newPw ? 'text' : 'password'}
                    className={`input-field pr-10 ${pwErrors.newPw ? 'border-red-500' : ''}`}
                    value={pwForm.newPw}
                    onChange={(e) => { setPwForm(f => ({ ...f, newPw: e.target.value })); setPwErrors({}); }}
                    placeholder="Min. 8 caractères"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => togglePw('newPw')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPw.newPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwErrors.newPw && <p className="text-red-500 text-xs mt-1">{pwErrors.newPw}</p>}
              </div>

              {/* Confirmer */}
              <div>
                <label className="label">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showPw.confirm ? 'text' : 'password'}
                    className={`input-field pr-10 ${pwErrors.confirm ? 'border-red-500' : ''}`}
                    value={pwForm.confirm}
                    onChange={(e) => { setPwForm(f => ({ ...f, confirm: e.target.value })); setPwErrors({}); }}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => togglePw('confirm')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwErrors.confirm && <p className="text-red-500 text-xs mt-1">{pwErrors.confirm}</p>}
              </div>

              <button type="submit" className="btn-primary" disabled={pwLoading}>
                {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Modifier le mot de passe
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
