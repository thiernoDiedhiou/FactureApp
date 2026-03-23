import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import { useSettings, useFormatCurrency } from '../../contexts/SettingsContext';

export default function ProductForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const formatAmount = useFormatCurrency();
  const isEdit = Boolean(id);
  const tvaInitialized = useRef(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    tvaRate: settings.defaultTvaRate || 18,
    category: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Sync TVA par défaut au chargement des settings (nouveau produit uniquement)
  useEffect(() => {
    if (!isEdit && !tvaInitialized.current && settings.defaultTvaRate !== undefined) {
      tvaInitialized.current = true;
      setForm(prev => ({ ...prev, tvaRate: settings.defaultTvaRate }));
    }
  }, [settings.defaultTvaRate, isEdit]);

  useEffect(() => {
    if (isEdit) {
      api.get(`/products/${id}`)
        .then(({ data }) => {
          const p = data.data.product;
          setForm({
            name: p.name || '',
            description: p.description || '',
            price: p.price || '',
            tvaRate: p.tvaRate || 18,
            category: p.category || ''
          });
        })
        .catch(() => toast.error('Produit non trouvé'));
    }
  }, [id, isEdit]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = t('errors.required');
    if (!form.price || parseFloat(form.price) < 0) errs.price = 'Prix invalide';
    if (isNaN(form.tvaRate) || form.tvaRate < 0 || form.tvaRate > 100) errs.tvaRate = 'Taux TVA invalide (0-100)';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        tvaRate: parseFloat(form.tvaRate)
      };
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        toast.success(t('products.updated'));
      } else {
        await api.post('/products', payload);
        toast.success(t('products.created'));
      }
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const f = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const price = parseFloat(form.price) || 0;
  const tva = parseFloat(form.tvaRate) || 0;
  const priceTTC = price * (1 + tva / 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/products" className="btn-secondary px-3 py-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="page-title">
          {isEdit ? t('products.edit') : t('products.new')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">{t('products.name')} <span className="text-red-500">*</span></label>
          <input
            type="text"
            className={`input-field ${errors.name ? 'border-red-500' : ''}`}
            value={form.name}
            onChange={(e) => f('name', e.target.value)}
            placeholder="Maintenance PC annuelle"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="label">{t('products.description')}</label>
          <textarea
            className="input-field resize-none"
            rows={3}
            value={form.description}
            onChange={(e) => f('description', e.target.value)}
            placeholder="Description détaillée du produit ou service..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">{t('products.price')} <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              step="500"
              className={`input-field ${errors.price ? 'border-red-500' : ''}`}
              value={form.price}
              onChange={(e) => f('price', e.target.value)}
              placeholder="25000"
            />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="label">{t('products.tvaRate')}</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              className={`input-field ${errors.tvaRate ? 'border-red-500' : ''}`}
              value={form.tvaRate}
              onChange={(e) => f('tvaRate', e.target.value)}
            />
            {errors.tvaRate && <p className="text-red-500 text-xs mt-1">{errors.tvaRate}</p>}
          </div>

          <div>
            <label className="label">{t('products.category')}</label>
            <input
              type="text"
              className="input-field"
              value={form.category}
              onChange={(e) => f('category', e.target.value)}
              placeholder="Maintenance"
            />
          </div>
        </div>

        {/* Price preview */}
        {price > 0 && (
          <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 space-y-2">
            <p className="text-xs font-medium text-primary-700 mb-2">Aperçu des prix</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Prix HT</span>
              <span className="font-medium">{formatAmount(price)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">TVA ({tva}%)</span>
              <span className="font-medium">{formatAmount(price * tva / 100)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-primary-200 pt-2 mt-2">
              <span className="text-primary-800">Prix TTC</span>
              <span className="text-primary-800">{formatAmount(priceTTC)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <Link to="/products" className="btn-secondary">{t('common.cancel')}</Link>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
