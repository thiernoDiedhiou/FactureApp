import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import api from '../../utils/api';

export default function ClientForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', companyName: '', email: '', phone: '', address: '', ninea: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      api.get(`/clients/${id}`)
        .then(({ data }) => {
          const c = data.data.client;
          setForm({
            name: c.name || '',
            companyName: c.companyName || '',
            email: c.email || '',
            phone: c.phone || '',
            address: c.address || '',
            ninea: c.ninea || ''
          });
        })
        .catch(() => toast.error('Client non trouvé'));
    }
  }, [id, isEdit]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = t('errors.required');
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errs.email = t('errors.invalidEmail');
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/clients/${id}`, form);
        toast.success(t('clients.updated'));
      } else {
        await api.post('/clients', form);
        toast.success(t('clients.created'));
      }
      navigate('/app/clients');
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/app/clients" className="btn-secondary px-3 py-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="page-title">
          {isEdit ? t('clients.edit') : t('clients.new')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">{t('clients.name')} <span className="text-red-500">*</span></label>
            <input
              type="text"
              className={`input-field ${errors.name ? 'border-red-500' : ''}`}
              value={form.name}
              onChange={(e) => f('name', e.target.value)}
              placeholder="Mamadou Diallo"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="label">{t('clients.company')} <span className="text-gray-400 text-xs">({t('common.optional')})</span></label>
            <input
              type="text"
              className="input-field"
              value={form.companyName}
              onChange={(e) => f('companyName', e.target.value)}
              placeholder="DigiTech Solutions SARL"
            />
          </div>

          <div>
            <label className="label">{t('clients.email')}</label>
            <input
              type="email"
              className={`input-field ${errors.email ? 'border-red-500' : ''}`}
              value={form.email}
              onChange={(e) => f('email', e.target.value)}
              placeholder="contact@exemple.sn"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="label">{t('clients.phone')}</label>
            <input
              type="tel"
              className="input-field"
              value={form.phone}
              onChange={(e) => f('phone', e.target.value)}
              placeholder="+221 77 123 45 67"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">{t('clients.address')}</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              value={form.address}
              onChange={(e) => f('address', e.target.value)}
              placeholder="Rue 10, Cité Keur Gorgui, Dakar"
            />
          </div>

          <div>
            <label className="label">
              {t('clients.ninea')}
              <span className="text-gray-400 text-xs ml-1">({t('common.optional')})</span>
            </label>
            <input
              type="text"
              className="input-field"
              value={form.ninea}
              onChange={(e) => f('ninea', e.target.value)}
              placeholder="012345678 2A3"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <Link to="/app/clients" className="btn-secondary">
            {t('common.cancel')}
          </Link>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
