import { useState, useEffect } from 'react';
import { Settings, Loader2, Save, Phone, Mail, User } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({ paymentPhone: '', paymentName: '', supportEmail: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/config')
      .then(res => {
        const c = res.data.data.config;
        setConfig(c);
        setForm({ paymentPhone: c.paymentPhone, paymentName: c.paymentName, supportEmail: c.supportEmail });
      })
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false));
  }, []);

  const isDirty = config && (
    form.paymentPhone !== config.paymentPhone ||
    form.paymentName  !== config.paymentName  ||
    form.supportEmail !== config.supportEmail
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/admin/config', form);
      setConfig(res.data.data.config);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-500" />
          Paramètres plateforme
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Configurez les informations de paiement affichées aux utilisateurs.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Informations de paiement</h2>

        {/* Numéro de téléphone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-gray-400" /> Numéro Wave / Orange Money
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="+221 77 000 00 00"
            value={form.paymentPhone}
            onChange={e => setForm(p => ({ ...p, paymentPhone: e.target.value }))}
          />
          <p className="text-xs text-gray-400 mt-1">
            Ce numéro est affiché aux utilisateurs qui souhaitent passer à un plan payant.
          </p>
        </div>

        {/* Nom du bénéficiaire */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <User className="w-4 h-4 text-gray-400" /> Nom du bénéficiaire
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="CFActure"
            value={form.paymentName}
            onChange={e => setForm(p => ({ ...p, paymentName: e.target.value }))}
          />
        </div>

        {/* Email support */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-gray-400" /> Email de support
          </label>
          <input
            type="email"
            className="input-field"
            placeholder="contact@factureapp.sn"
            value={form.supportEmail}
            onChange={e => setForm(p => ({ ...p, supportEmail: e.target.value }))}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            isDirty
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isDirty ? 'Enregistrer' : 'Aucune modification'}
        </button>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        <strong>Astuce :</strong> Si votre numéro Wave ou Orange Money change, mettez-le à jour ici.
        La modification est appliquée immédiatement sur la page Plans des utilisateurs.
      </div>
    </div>
  );
}
