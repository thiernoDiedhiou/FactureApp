import { useState, useEffect } from 'react';
import { Zap, Loader2, Plus, Trash2, Save, Users, Tag, ToggleLeft, ToggleRight, FileText, UserCheck } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PLAN_STYLES = {
  FREE:       { badge: 'bg-gray-100 text-gray-700',    border: 'border-gray-200' },
  STARTER:    { badge: 'bg-blue-100 text-blue-700',    border: 'border-blue-300' },
  PRO:        { badge: 'bg-purple-100 text-purple-700', border: 'border-purple-300' },
  ENTERPRISE: { badge: 'bg-amber-100 text-amber-700',  border: 'border-amber-300' }
};

function PlanCard({ plan, onSave }) {
  const [form, setForm] = useState({
    price:        plan.price,
    maxMembers:   plan.maxMembers,
    maxDocuments: plan.maxDocuments ?? -1,
    maxClients:   plan.maxClients ?? -1,
    description:  plan.description,
    features:     plan.features || [],
    isActive:     plan.isActive
  });
  const [saving, setSaving] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const isDirty = JSON.stringify(form) !== JSON.stringify({
    price: plan.price, maxMembers: plan.maxMembers,
    maxDocuments: plan.maxDocuments ?? -1, maxClients: plan.maxClients ?? -1,
    description: plan.description, features: plan.features || [], isActive: plan.isActive
  });

  const style = PLAN_STYLES[plan.key] || PLAN_STYLES.FREE;

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const addFeature = () => {
    const v = newFeature.trim();
    if (!v) return;
    f('features', [...form.features, v]);
    setNewFeature('');
  };

  const removeFeature = (i) => f('features', form.features.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(plan.key, {
        ...form,
        price:        parseInt(form.price),
        maxMembers:   parseInt(form.maxMembers),
        maxDocuments: parseInt(form.maxDocuments),
        maxClients:   parseInt(form.maxClients)
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    const newValue = !form.isActive;
    f('isActive', newValue);
    try {
      await onSave(plan.key, {
        ...form,
        isActive:     newValue,
        price:        parseInt(form.price),
        maxMembers:   parseInt(form.maxMembers),
        maxDocuments: parseInt(form.maxDocuments),
        maxClients:   parseInt(form.maxClients)
      });
    } catch {
      f('isActive', !newValue); // rollback on error
    }
  };

  return (
    <div className={`bg-white rounded-2xl border-2 ${style.border} p-6 flex flex-col gap-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${style.badge}`}>
          {plan.key}
        </span>
        <button
          onClick={handleToggleActive}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            form.isActive ? 'text-green-600' : 'text-gray-400'
          }`}
          title={form.isActive ? 'Désactiver ce plan' : 'Activer ce plan'}
        >
          {form.isActive
            ? <ToggleRight className="w-5 h-5" />
            : <ToggleLeft className="w-5 h-5" />
          }
          {form.isActive ? 'Actif' : 'Inactif'}
        </button>
      </div>

      {/* Prix */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
          <Tag className="w-3.5 h-3.5" /> Prix (FCFA/mois)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number" min="0" step="100"
            className="input-field"
            value={form.price}
            onChange={e => f('price', e.target.value)}
          />
          {form.price == 0 && (
            <span className="text-xs text-gray-400 whitespace-nowrap">= Gratuit</span>
          )}
        </div>
      </div>

      {/* Membres max */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
          <Users className="w-3.5 h-3.5" /> Membres max
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number" min="-1"
            className="input-field"
            value={form.maxMembers}
            onChange={e => f('maxMembers', e.target.value)}
          />
          {form.maxMembers == -1 && (
            <span className="text-xs text-gray-400 whitespace-nowrap">= Illimité</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">Mettre -1 pour illimité</p>
      </div>

      {/* Documents max */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" /> Documents max
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number" min="-1"
            className="input-field"
            value={form.maxDocuments}
            onChange={e => f('maxDocuments', e.target.value)}
          />
          {form.maxDocuments == -1 && (
            <span className="text-xs text-gray-400 whitespace-nowrap">= Illimité</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">Mettre -1 pour illimité</p>
      </div>

      {/* Clients max */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5" /> Clients max
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number" min="-1"
            className="input-field"
            value={form.maxClients}
            onChange={e => f('maxClients', e.target.value)}
          />
          {form.maxClients == -1 && (
            <span className="text-xs text-gray-400 whitespace-nowrap">= Illimité</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">Mettre -1 pour illimité</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
        <input
          type="text"
          className="input-field"
          value={form.description}
          onChange={e => f('description', e.target.value)}
          placeholder="Pour les équipes en croissance"
        />
      </div>

      {/* Fonctionnalités */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-2">Fonctionnalités</label>
        <ul className="space-y-1.5 mb-2">
          {form.features.map((feat, i) => (
            <li key={i} className="flex items-center gap-2 group">
              <span className="flex-1 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-1.5">
                {feat}
              </span>
              <button
                onClick={() => removeFeature(i)}
                className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            className="input-field text-sm"
            placeholder="Ajouter une fonctionnalité..."
            value={newFeature}
            onChange={e => setNewFeature(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
          />
          <button onClick={addFeature} className="btn-secondary px-3 flex-shrink-0">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Save */}
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
  );
}

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/plans')
      .then(res => setPlans(res.data.data.plans))
      .catch(() => toast.error('Erreur chargement plans'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key, data) => {
    try {
      const res = await api.patch(`/admin/plans/${key}`, data);
      setPlans(prev => prev.map(p => p.key === key ? res.data.data.plan : p));
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur enregistrement');
      throw err;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" />
          Plans tarifaires
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Modifiez les prix, limites et fonctionnalités de chaque plan. Les changements sont appliqués immédiatement.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {plans.map(plan => (
          <PlanCard key={plan.key} plan={plan} onSave={handleSave} />
        ))}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        <strong>Note :</strong> Les modifications de prix et limites s'appliquent immédiatement pour les nouvelles inscriptions.
        Les organisations existantes conservent leur plan jusqu'au prochain renouvellement.
      </div>
    </div>
  );
}
