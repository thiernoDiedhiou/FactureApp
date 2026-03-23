import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Save, Loader2, Plus, Trash2, Search,
  Package, ChevronDown, X
} from 'lucide-react';
import api from '../../utils/api';
import { calculateTotals } from '../../utils/formatCFA';
import { today, addDays } from '../../utils/dateUtils';
import { useSettings, useFormatCurrency } from '../../contexts/SettingsContext';

const EMPTY_ITEM = { description: '', quantity: 1, unitPrice: '', tvaRate: 18, productId: null };

export default function DocumentForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings } = useSettings();
  const formatAmount = useFormatCurrency();
  const isEdit = Boolean(id);
  const tvaInitialized = useRef(false);

  const [form, setForm] = useState({
    type: 'facture',
    clientId: searchParams.get('clientId') || '',
    issuedDate: today(),
    dueDate: addDays(30),
    discount: 0,
    notes: '',
    status: 'en_attente'
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM, tvaRate: settings.defaultTvaRate || 18 }]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Sync TVA par défaut au chargement des settings (nouveau document uniquement)
  useEffect(() => {
    if (!isEdit && !tvaInitialized.current && settings.defaultTvaRate !== undefined) {
      tvaInitialized.current = true;
      setItems(prev => prev.map(item => ({ ...item, tvaRate: settings.defaultTvaRate })));
    }
  }, [settings.defaultTvaRate, isEdit]);

  // Load clients and products
  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          api.get('/clients', { params: { limit: 200 } }),
          api.get('/products', { params: { limit: 200 } })
        ]);
        setClients(cRes.data.data.clients);
        setProducts(pRes.data.data.products);
      } catch {}
    };
    load();
  }, []);

  // Load document for edit
  useEffect(() => {
    if (isEdit) {
      api.get(`/documents/${id}`)
        .then(({ data }) => {
          const doc = data.data.document;
          setForm({
            type: doc.type,
            clientId: doc.clientId,
            issuedDate: doc.issuedDate.substring(0, 10),
            dueDate: doc.dueDate ? doc.dueDate.substring(0, 10) : '',
            discount: doc.discount || 0,
            notes: doc.notes || '',
            status: doc.status
          });
          setItems(doc.items.map(item => ({
            id: item.id,
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            tvaRate: item.tvaRate
          })));
        })
        .catch(() => toast.error('Document non trouvé'));
    }
  }, [id, isEdit]);

  const selectedClient = clients.find(c => c.id === form.clientId);
  const filteredClients = clients.filter(c =>
    `${c.name} ${c.companyName || ''}`.toLowerCase().includes(clientSearch.toLowerCase())
  );
  const filteredProducts = (idx) => {
    const search = productSearch;
    return products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase())
    );
  };

  const totals = calculateTotals(items, parseFloat(form.discount) || 0);

  const addItem = () => {
    setItems(prev => [...prev, { ...EMPTY_ITEM, tvaRate: settings.defaultTvaRate || 18 }]);
  };

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, key, val) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: val } : item));
  };

  const selectProduct = (idx, product) => {
    setItems(prev => prev.map((item, i) => i === idx ? {
      ...item,
      productId: product.id,
      description: product.name,
      unitPrice: product.price,
      tvaRate: product.tvaRate
    } : item));
    setShowProductSearch(null);
    setProductSearch('');
  };

  const validate = () => {
    const errs = {};
    if (!form.clientId) errs.clientId = 'Client requis';
    if (!form.issuedDate) errs.issuedDate = 'Date requise';
    if (items.length === 0) errs.items = 'Au moins une ligne requise';
    items.forEach((item, i) => {
      if (!item.description) errs[`item_${i}_desc`] = 'Description requise';
      if (!item.unitPrice || parseFloat(item.unitPrice) < 0) errs[`item_${i}_price`] = 'Prix invalide';
      if (!item.quantity || parseFloat(item.quantity) <= 0) errs[`item_${i}_qty`] = 'Quantité invalide';
    });
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Veuillez corriger les erreurs');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        discount: parseFloat(form.discount) || 0,
        items: items.map(item => ({
          productId: item.productId || null,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          tvaRate: parseFloat(item.tvaRate)
        }))
      };
      if (isEdit) {
        await api.put(`/documents/${id}`, payload);
        toast.success(t('documents.updated'));
        navigate(`/documents/${id}`);
      } else {
        const { data } = await api.post('/documents', payload);
        toast.success(t('documents.created'));
        navigate(`/documents/${data.data.document.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/documents" className="btn-secondary px-3 py-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="page-title">
          {isEdit ? 'Modifier le document' : 'Nouveau document'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document info */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Informations du document</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Type <span className="text-red-500">*</span></label>
              <select className="input-field" value={form.type}
                onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="facture">Facture</option>
                <option value="devis">Devis</option>
                <option value="proforma">Facture Proforma</option>
              </select>
            </div>
            <div>
              <label className="label">Statut</label>
              <select className="input-field" value={form.status}
                onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="en_attente">En attente</option>
                <option value="paye">Payé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
            <div>
              <label className="label">Date d'émission <span className="text-red-500">*</span></label>
              <input type="date" className={`input-field ${errors.issuedDate ? 'border-red-500' : ''}`}
                value={form.issuedDate}
                onChange={(e) => setForm(f => ({ ...f, issuedDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Date d'échéance</label>
              <input type="date" className="input-field"
                value={form.dueDate}
                onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Client selection */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Client <span className="text-red-500">*</span></h2>
          {errors.clientId && <p className="text-red-500 text-xs mb-2">{errors.clientId}</p>}

          {selectedClient ? (
            <div className="flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">{selectedClient.name}</p>
                {selectedClient.companyName && (
                  <p className="text-sm text-gray-500">{selectedClient.companyName}</p>
                )}
                {selectedClient.address && (
                  <p className="text-xs text-gray-400">{selectedClient.address}</p>
                )}
              </div>
              <button type="button"
                onClick={() => { setForm(f => ({ ...f, clientId: '' })); setClientSearch(''); }}
                className="text-gray-400 hover:text-red-500">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="input-field pl-9"
                  placeholder="Rechercher un client..."
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); setShowClientSearch(true); }}
                  onFocus={() => setShowClientSearch(true)}
                />
              </div>
              {showClientSearch && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <p className="p-3 text-sm text-gray-400">Aucun client trouvé</p>
                  ) : filteredClients.slice(0, 10).map(c => (
                    <button key={c.id} type="button"
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      onClick={() => {
                        setForm(f => ({ ...f, clientId: c.id }));
                        setClientSearch('');
                        setShowClientSearch(false);
                      }}>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      {c.companyName && <p className="text-xs text-gray-400">{c.companyName}</p>}
                    </button>
                  ))}
                  <Link to="/clients/new" className="flex items-center gap-2 px-4 py-3 text-sm text-primary-600 hover:bg-primary-50 border-t">
                    <Plus className="w-4 h-4" /> Créer un nouveau client
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Line items */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">{t('documents.items')}</h2>
            <button type="button" onClick={addItem} className="btn-secondary text-sm px-3 py-1.5">
              <Plus className="w-4 h-4" /> {t('documents.addItem')}
            </button>
          </div>

          {errors.items && <p className="text-red-500 text-xs mb-3">{errors.items}</p>}

          <div className="space-y-3">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase px-2">
              <div className="col-span-5">Description</div>
              <div className="col-span-1 text-center">Qté</div>
              <div className="col-span-2 text-right">Prix HT</div>
              <div className="col-span-1 text-center">TVA%</div>
              <div className="col-span-2 text-right">Total TTC</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item, idx) => {
              const ht = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
              const tvaAmt = ht * ((parseFloat(item.tvaRate) || 0) / 100);
              const lineTotal = Math.round((ht + tvaAmt) * (1 - (parseFloat(form.discount) || 0) / 100));

              return (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                  <div className="md:grid md:grid-cols-12 md:gap-2 md:items-center space-y-2 md:space-y-0">
                    {/* Description */}
                    <div className="col-span-5 relative">
                      <input
                        type="text"
                        className={`input-field text-sm ${errors[`item_${idx}_desc`] ? 'border-red-400' : ''}`}
                        placeholder="Description du service..."
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        onFocus={() => setShowProductSearch(idx)}
                      />
                      {/* Product picker dropdown */}
                      {showProductSearch === idx && products.length > 0 && (
                        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {products.filter(p =>
                            p.name.toLowerCase().includes(item.description.toLowerCase())
                          ).slice(0, 6).map(p => (
                            <button key={p.id} type="button"
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                              onMouseDown={() => selectProduct(idx, p)}>
                              <p className="text-sm font-medium">{p.name}</p>
                              <p className="text-xs text-gray-400">{formatAmount(p.price)} HT</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className={`input-field text-sm text-center ${errors[`item_${idx}_qty`] ? 'border-red-400' : ''}`}
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        placeholder="1"
                      />
                    </div>

                    {/* Unit price */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="500"
                        className={`input-field text-sm text-right ${errors[`item_${idx}_price`] ? 'border-red-400' : ''}`}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    {/* TVA rate */}
                    <div className="col-span-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        className="input-field text-sm text-center"
                        value={item.tvaRate}
                        onChange={(e) => updateItem(idx, 'tvaRate', e.target.value)}
                      />
                    </div>

                    {/* Line total */}
                    <div className="col-span-2 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatAmount(lineTotal)}
                      </span>
                    </div>

                    {/* Remove */}
                    <div className="col-span-1 flex justify-end">
                      <button type="button" onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded disabled:opacity-30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Discount and totals */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="label">Remise globale (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className="input-field max-w-xs"
                  value={form.discount}
                  onChange={(e) => setForm(f => ({ ...f, discount: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Notes / Conditions de paiement</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Paiement sous 30 jours par virement bancaire..."
                />
              </div>
            </div>

            {/* Totals block */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-3 self-start">
              {parseFloat(form.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Remise ({form.discount}%)</span>
                  <span className="text-red-600">-{formatAmount(totals.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total HT</span>
                <span className="font-medium">{formatAmount(totals.totalHt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">TVA</span>
                <span className="font-medium">{formatAmount(totals.totalTva)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3 mt-3">
                <span className="text-gray-900">Total TTC</span>
                <span className="text-primary-600">{formatAmount(totals.totalTtc)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link to="/documents" className="btn-secondary">{t('common.cancel')}</Link>
          <button type="submit" className="btn-primary px-6" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Mettre à jour' : 'Créer le document'}
          </button>
        </div>
      </form>
    </div>
  );
}
