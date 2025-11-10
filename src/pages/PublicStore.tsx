import { useEffect, useState } from 'react';
import Logo from '../components/Logo';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingBag, ArrowLeft, ExternalLink, Package, AlertCircle, X, Share2, Edit, Trash2, Save, Upload, DollarSign, Eye, EyeOff, Settings } from 'lucide-react';

import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

interface StoreProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  image_url: string;
  purchase_link: string;
  status: string;
  position: number;
}

interface UserProfile {
  id: string;
  subdomain: string;
  display_name: string;
  avatar_url: string;
  user_id: string;
}

export default function PublicStore() {
  const { subdomain } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [uploading, setUploading] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'BRL',
    image_url: '',
    purchase_link: '',
    status: 'published' as 'draft' | 'published'
  });

  useEffect(() => {
    loadStoreData();
  }, [subdomain]);

  const loadStoreData = async () => {
    if (!subdomain) return;

    setLoading(true);
    setError('');

    try {
      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, subdomain, display_name, avatar_url, user_id')
        .eq('subdomain', subdomain)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        setError('Perfil não encontrado');
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Check if current user is the owner
      const owner = user?.id === profileData.user_id;
      setIsOwner(owner);

      // Get products (all if owner, only published if visitor)
      const query = supabase
        .from('store_products')
        .select('*')
        .eq('user_id', profileData.user_id);

      if (!owner) {
        query.eq('status', 'published');
      }

      const { data: productsData, error: productsError } = await query.order('position', { ascending: true });

      if (productsError) throw productsError;

      setProducts(productsData || []);
    } catch (err: any) {
      console.error('Error loading store:', err);
      setError(err.message || 'Erro ao carregar loja');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const handleShareProduct = async (product: StoreProduct) => {
    const url = `${window.location.origin}/${subdomain}/loja#${product.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Confira ${product.title} na loja de ${profile?.display_name || subdomain}`,
          url: url
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copiado para a área de transferência!');
    }
  };

  const handleEdit = (product: StoreProduct) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description || '',
      price: product.price.toString(),
      currency: product.currency,
      image_url: product.image_url || '',
      purchase_link: product.purchase_link,
      status: product.status as 'draft' | 'published'
    });
    setSelectedProduct(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage('Imagem maior que 5MB. Use uma imagem menor.');
      setMessageType('error');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/store/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
      setMessage('Imagem carregada com sucesso!');
      setMessageType('success');
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setMessage(err.message || 'Erro ao fazer upload da imagem');
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingProduct) return;

    if (!formData.title || !formData.purchase_link || !formData.price) {
      setMessage('Preencha todos os campos obrigatórios');
      setMessageType('error');
      return;
    }

    try {
      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        image_url: formData.image_url,
        purchase_link: formData.purchase_link,
        status: formData.status
      };

      const { error } = await supabase
        .from('store_products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) throw error;

      setMessage('Produto atualizado com sucesso!');
      setMessageType('success');
      setEditingProduct(null);
      loadStoreData();
    } catch (err: any) {
      console.error('Error updating product:', err);
      setMessage(err.message || 'Erro ao atualizar produto');
      setMessageType('error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('store_products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage('Produto excluído com sucesso!');
      setMessageType('success');
      loadStoreData();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setMessage(err.message || 'Erro ao excluir produto');
      setMessageType('error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const toggleStatus = async (product: StoreProduct) => {
    if (!user) return;

    try {
      const newStatus = product.status === 'published' ? 'draft' : 'published';
      const { error } = await supabase
        .from('store_products')
        .update({ status: newStatus })
        .eq('id', product.id);

      if (error) throw error;

      setMessage(`Produto ${newStatus === 'published' ? 'publicado' : 'despublicado'} com sucesso!`);
      setMessageType('success');
      loadStoreData();
    } catch (err: any) {
      console.error('Error toggling status:', err);
      setMessage(err.message || 'Erro ao alterar status');
      setMessageType('error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Carregando loja...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loja não encontrada</h1>
          <p className="text-gray-600 mb-6">{error || 'Esta loja não existe ou foi removida.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
          >
            Ir para Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md z-40 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/${subdomain}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Voltar ao Perfil</span>
            </button>

            <div className="flex items-center gap-3">
              <Logo size={32} />
              <div className="h-6 w-px bg-gray-300" />
              <ShoppingBag className="w-6 h-6 text-yellow-600" />
              <h1 className="text-xl font-bold text-gray-900">Loja</h1>
            </div>

            {isOwner ? (
              <button
                onClick={() => navigate('/painel/loja')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold rounded-lg transition-all text-sm shadow-md"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Gerenciar</span>
              </button>
            ) : (
              <div className="w-20" />
            )}
          </div>
        </div>
      </header>

      {/* Store Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-16 h-16 rounded-full border-2 border-yellow-400 object-cover shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-yellow-400 bg-gray-50 flex items-center justify-center shadow-md">
                <ShoppingBag className="w-8 h-8 text-yellow-600" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Loja de {profile.display_name || profile.subdomain}
              </h2>
              <p className="text-gray-600 text-sm">
                {products.length} {products.length === 1 ? 'produto disponível' : 'produtos disponíveis'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum produto disponível</h3>
            <p className="text-gray-600">Esta loja ainda não tem produtos publicados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-xl overflow-hidden border-2 border-yellow-300 hover:border-yellow-500 transition-all shadow-lg hover:shadow-xl duration-200"
              >
                {/* Product Image - Clickable */}
                <div
                  onClick={() => setSelectedProduct(product)}
                  className="relative aspect-square bg-gray-100 overflow-hidden cursor-pointer"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Package className="w-20 h-20 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-gray-900 font-bold text-sm bg-white/90 px-4 py-2 rounded-lg shadow-md">
                      Ver Detalhes
                    </span>
                  </div>

                  {/* Status Badge - Only for Owner */}
                  {isOwner && (
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                        product.status === 'published'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}>
                        {product.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <h3
                    onClick={() => setSelectedProduct(product)}
                    className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-yellow-700 transition-colors"
                  >
                    {product.title}
                  </h3>

                  {product.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-yellow-700">
                      {formatPrice(product.price, product.currency)}
                    </span>
                  </div>

                  {/* Buy Button */}
                  <a
                    href={product.purchase_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Comprar Agora</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {/* Admin Controls - Only for Owner */}
                  {isOwner && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(product);
                        }}
                        className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium"
                        title={product.status === 'published' ? 'Despublicar' : 'Publicar'}
                      >
                        {product.status === 'published' ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(product);
                        }}
                        className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(product.id);
                        }}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all font-medium"
                        title="Excluir produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">Detalhes do Produto</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                  {selectedProduct.image_url ? (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Package className="w-32 h-32 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex flex-col">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    {selectedProduct.title}
                  </h3>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-yellow-700">
                      {formatPrice(selectedProduct.price, selectedProduct.currency)}
                    </span>
                  </div>

                  {selectedProduct.description && (
                    <div className="mb-6">
                      <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                        Descrição
                      </h4>
                      <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}

                  <div className="mt-auto space-y-3">
                    {/* Buy Button */}
                    <a
                      href={selectedProduct.purchase_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold text-lg rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-105"
                    >
                      <ShoppingBag className="w-6 h-6" />
                      <span>Comprar Agora</span>
                      <ExternalLink className="w-5 h-5" />
                    </a>

                    {/* Share Button */}
                    <button
                      onClick={() => handleShareProduct(selectedProduct)}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all"
                    >
                      <Share2 className="w-5 h-5" />
                      <span>Compartilhar Produto</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal - Owner Only */}
      {editingProduct && isOwner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-gray-200 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Editar Produto</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form id="edit-product-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Produto *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 resize-none"
                />
              </div>

              {/* Price and Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moeda
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                  >
                    <option value="BRL">BRL (R$)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagem do Produto
                </label>
                {formData.image_url && (
                  <div className="mb-3 relative">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-md"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}
                <label className="cursor-pointer">
                  <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 hover:border-yellow-400 transition-colors flex items-center justify-center gap-2 font-medium">
                    <Upload className="w-5 h-5" />
                    <span>{uploading ? 'Enviando...' : 'Escolher Imagem'}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* Purchase Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link de Compra *
                </label>
                <input
                  type="url"
                  value={formData.purchase_link}
                  onChange={(e) => setFormData({ ...formData, purchase_link: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                >
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                </select>
              </div>
            </form>

            {/* Action Buttons - Fixed Footer */}
            <div className="bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl flex-shrink-0">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="edit-product-form"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white rounded-lg transition-all font-bold shadow-md flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Atualizar Produto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Messages */}
      {message && (
        <Toast
          message={message}
          type={messageType}
          onClose={() => setMessage('')}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Excluir Produto"
        message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Logo size={32} />
            <span className="text-yellow-600 font-bold">com.rich</span>
          </div>
          <p className="text-gray-600 text-sm">
            Crie sua identidade digital profissional com loja integrada
          </p>
        </div>
      </footer>
    </div>
  );
}
