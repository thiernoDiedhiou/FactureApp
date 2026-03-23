import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Package, Tag } from 'lucide-react';
import api from '../../utils/api';
import { useFormatCurrency } from '../../contexts/SettingsContext';

export default function ProductList() {
  const { t } = useTranslation();
  const formatAmount = useFormatCurrency();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { params: { search, category, limit: 50 } }),
        api.get('/products/categories')
      ]);
      setProducts(prodRes.data.data.products);
      setCategories(catRes.data.data.categories);
    } catch (err) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      toast.success(t('products.deleted'));
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('products.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} produit(s)</p>
        </div>
        <Link to="/products/new" className="btn-primary">
          <Plus className="w-4 h-4" /> {t('products.new')}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('products.search')}
            className="input-field pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {categories.length > 0 && (
          <select
            className="input-field w-auto"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Toutes catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="card text-center py-16">
          <Package className="w-16 h-16 mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">{t('products.noProducts')}</p>
          <Link to="/products/new" className="btn-primary mt-4 inline-flex">
            <Plus className="w-4 h-4" /> {t('products.new')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <div key={product.id} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link to={`/products/${product.id}/edit`}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-primary-600">
                    <Edit className="w-4 h-4" />
                  </Link>
                  {deleteId === product.id ? (
                    <>
                      <button onClick={() => handleDelete(product.id)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded">Oui</button>
                      <button onClick={() => setDeleteId(null)}
                        className="px-2 py-1 text-xs bg-gray-200 rounded">Non</button>
                    </>
                  ) : (
                    <button onClick={() => setDeleteId(product.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{product.description}</p>
              )}

              <div className="mt-auto space-y-2">
                {product.category && (
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    <Tag className="w-3 h-3" /> {product.category}
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-base">{formatAmount(product.price)}</span>
                  <span className="text-xs text-gray-400">TVA {product.tvaRate}%</span>
                </div>
                <p className="text-xs text-gray-400">
                  TTC: {formatAmount(product.price * (1 + product.tvaRate / 100))}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
