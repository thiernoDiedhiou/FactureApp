import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Package, Tag, Loader2, X } from 'lucide-react';
import { useConfirm } from '../../contexts/ConfirmContext';
import api from '../../utils/api';
import { useFormatCurrency } from '../../contexts/SettingsContext';
import { SkeletonProductCard } from '../../components/Skeleton';

export default function ProductList() {
  const { t } = useTranslation();
  const formatAmount = useFormatCurrency();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => {
    setSearching(search.length > 0);
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { params: { search: debouncedSearch, category, limit: 50 } }),
        api.get('/products/categories')
      ]);
      setProducts(prodRes.data.data.products);
      setCategories(catRes.data.data.categories);
    } catch (err) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Supprimer ce produit ?',
      message: 'Cette action est irréversible.',
      danger: true,
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success(t('products.deleted'));
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('products.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {products.length} produit{products.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/app/products/new" className="btn-primary">
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
            className={`input-field pl-9 ${search ? 'pr-9' : ''}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
          {!searching && search && (
            <button
              onClick={() => { setSearch(''); setDebouncedSearch(''); setSearching(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <SkeletonProductCard key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="card text-center py-16 px-8">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-primary-50 flex items-center justify-center">
            <Package className="w-10 h-10 text-primary-300" />
          </div>
          {(search || category) ? (
            <>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun résultat</h3>
              <p className="text-sm text-gray-400 mb-5">Aucun produit ne correspond à votre recherche.</p>
              <button onClick={() => { setSearch(''); setCategory(''); }} className="btn-secondary">Effacer les filtres</button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun produit / service</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                Créez votre catalogue pour gagner du temps lors de la facturation.
              </p>
              <Link to="/app/products/new" className="btn-primary inline-flex">
                <Plus className="w-4 h-4" /> Ajouter un produit
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product, idx) => (
            <div key={product.id} className={`card p-5 hover:shadow-md transition-shadow group animate-fade-up stagger-${Math.min(idx + 1, 6)}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Link to={`/app/products/${product.id}/edit`}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-primary-600">
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button onClick={() => handleDelete(product.id)}
                    className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
