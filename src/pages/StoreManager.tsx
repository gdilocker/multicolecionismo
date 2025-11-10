import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PanelLayout } from '../components/PanelLayout';
import { PageHeader } from '../components/PageHeader';
import { ShoppingBag, Plus, Edit, Trash2, Eye, EyeOff, Save, X, Upload, ExternalLink, Package, DollarSign, ArrowLeft } from 'lucide-react';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

interface StoreProduct {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  image_url: string;
  purchase_link: string;
  status: 'draft' | 'published';
  position: number;
  created_at: string;
  updated_at: string;
}

export default function StoreManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [userSubdomain, setUserSubdomain] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'BRL',
    image_url: '',
    purchase_link: '',
    status: 'draft' as 'draft' | 'published'
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showStoreIcon, setShowStoreIcon] = useState(false);
  const [showStoreButton, setShowStoreButton] = useState(true);
  const [storeEnabled, setStoreEnabled] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/entrar');
      return;
    }
    loadProducts();
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, subdomain, show_store_icon_on_posts, show_store_button_on_profile, store_enabled')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        const profile = data[0];
        setUserSubdomain(profile.subdomain);
        setShowStoreIcon(profile.show_store_icon_on_posts || false);
        setShowStoreButton(profile.show_store_button_on_profile !== false);
        setStoreEnabled(profile.store_enabled !== false);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const loadProducts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      console.error('Error loading products:', err);
      setMessage(err.message || 'Erro ao carregar produtos');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
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
    if (!user) return;

    if (!formData.title || !formData.purchase_link || !formData.price) {
      setMessage('Preencha todos os campos obrigatórios');
      setMessageType('error');
      return;
    }

    try {
      const productData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        image_url: formData.image_url,
        purchase_link: formData.purchase_link,
        status: formData.status,
        position: editingProduct ? editingProduct.position : products.length
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('store_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        setMessage('Produto atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('store_products')
          .insert([productData]);

        if (error) throw error;
        setMessage('Produto criado com sucesso!');
      }

      setMessageType('success');
      resetForm();
      loadProducts();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setMessage(err.message || 'Erro ao salvar produto');
      setMessageType('error');
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
      status: product.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    console.log('[StoreManager] Delete confirmed for product ID:', id);

    try {
      console.log('[StoreManager] Deleting product from database...');
      const { error } = await supabase
        .from('store_products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[StoreManager] Supabase error:', error);
        throw error;
      }

      console.log('[StoreManager] Product deleted successfully');
      setMessage('Produto excluído com sucesso!');
      setMessageType('success');
      loadProducts();
    } catch (err: any) {
      console.error('[StoreManager] Error deleting product:', err);
      setMessage(err.message || 'Erro ao excluir produto');
      setMessageType('error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const toggleStatus = async (product: StoreProduct) => {
    try {
      const newStatus = product.status === 'published' ? 'draft' : 'published';
      const { error } = await supabase
        .from('store_products')
        .update({ status: newStatus })
        .eq('id', product.id);

      if (error) throw error;

      setMessage(`Produto ${newStatus === 'published' ? 'publicado' : 'despublicado'} com sucesso!`);
      setMessageType('success');
      loadProducts();
    } catch (err: any) {
      console.error('Error toggling status:', err);
      setMessage(err.message || 'Erro ao alterar status');
      setMessageType('error');
    }
  };

  const toggleStoreIcon = async () => {
    if (!user) return;

    try {
      const newValue = !showStoreIcon;

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!profiles || profiles.length === 0) {
        throw new Error('Perfil não encontrado');
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ show_store_icon_on_posts: newValue })
        .eq('id', profiles[0].id);

      if (error) throw error;

      setShowStoreIcon(newValue);
      setMessage(
        newValue
          ? 'Ícone da loja ativado! Agora aparecerá em todos os seus posts.'
          : 'Ícone da loja desativado.'
      );
      setMessageType('success');
    } catch (err: any) {
      console.error('Error toggling store icon:', err);
      setMessage(err.message || 'Erro ao atualizar configuração');
      setMessageType('error');
    }
  };

  const toggleStoreButton = async () => {
    if (!user) return;

    try {
      const newValue = !showStoreButton;

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!profiles || profiles.length === 0) {
        throw new Error('Perfil não encontrado');
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ show_store_button_on_profile: newValue })
        .eq('id', profiles[0].id);

      if (error) throw error;

      setShowStoreButton(newValue);
      setMessage(
        newValue
          ? 'Botão da loja ativado! Agora aparecerá no seu perfil público.'
          : 'Botão da loja desativado no perfil público. A loja ainda está acessível via URL direta.'
      );
      setMessageType('success');
    } catch (err: any) {
      console.error('Error toggling store button:', err);
      setMessage(err.message || 'Erro ao atualizar configuração');
      setMessageType('error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      currency: 'BRL',
      image_url: '',
      purchase_link: '',
      status: 'draft'
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const formatPrice = (price: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  return (
    <PanelLayout>
      <PageHeader
        title="Gerenciar Loja"
        subtitle="Adicione e gerencie os produtos da sua loja"
        icon={ShoppingBag}
        action={
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/painel')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            {storeEnabled && (
              <>
                {userSubdomain && (
                  <button
                    onClick={() => navigate(`/${userSubdomain}/loja`)}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all font-semibold"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Ver Loja</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] hover:from-[#D4AF37] hover:to-[#B8941E] text-black rounded-xl transition-all font-bold shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span>Novo Produto</span>
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        {/* No Profile Warning */}
        {!userSubdomain && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">Perfil não encontrado</h3>
            <p className="text-blue-800 mb-4">
              Você precisa criar seu perfil primeiro para poder gerenciar sua loja.
            </p>
            <button
              onClick={() => navigate('/minha-pagina')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all font-bold shadow-lg"
            >
              Ir para Minha Página
            </button>
          </div>
        )}

        {/* Product Form Modal */}
        {userSubdomain && showForm && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1A1A] rounded-2xl max-w-2xl w-full border border-gray-800 shadow-2xl max-h-[90vh] flex flex-col">
              <div className="bg-[#1A1A1A] border-b border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
                <h2 className="text-xl font-bold text-white">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form id="product-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Título do Produto *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                    placeholder="Ex: Curso de Marketing Digital"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] resize-none"
                    placeholder="Descreva seu produto..."
                  />
                </div>

                {/* Price and Currency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                        className="w-full pl-10 pr-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Moeda
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="BRL">BRL (R$)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Imagem do Produto
                  </label>
                  {formData.image_url && (
                    <div className="mb-3 relative">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <div className="px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white hover:border-[#D4AF37] transition-colors flex items-center justify-center gap-2">
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
                  <p className="text-xs text-gray-500 mt-1">Máximo 5MB. Formatos: JPG, PNG, WebP</p>
                </div>

                {/* Purchase Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Link de Compra *
                  </label>
                  <input
                    type="url"
                    value={formData.purchase_link}
                    onChange={(e) => setFormData({ ...formData, purchase_link: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                    placeholder="https://wa.me/5511999999999?text=Quero%20comprar"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Link externo para WhatsApp, PayPal, Mercado Pago, etc.
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicado</option>
                  </select>
                </div>

              </form>

              {/* Action Buttons - Fixed Footer */}
              <div className="bg-[#1A1A1A] border-t border-gray-800 px-6 py-4 rounded-b-2xl flex-shrink-0">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    form="product-form"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] hover:from-[#D4AF37] hover:to-[#B8941E] text-black rounded-xl transition-all font-bold shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>{editingProduct ? 'Atualizar' : 'Criar'} Produto</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Store Settings Card */}
        {userSubdomain && storeEnabled && (
          <div className="bg-white rounded-xl border-2 border-gray-200 hover:border-yellow-300 shadow-lg hover:shadow-xl transition-all duration-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-md">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Configurações da Loja</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Personalize como e onde sua loja aparece
              </p>

              <div className="space-y-3">
                {/* Store Button Toggle */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ShoppingBag className="w-4 h-4 text-yellow-600" />
                        <h4 className="font-semibold text-gray-900">Botão da Loja no Perfil</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        Controla se o botão "Loja" aparece na sua página de perfil público.
                        Quando desativado, sua loja ainda fica acessível via URL direta{' '}
                        <span className="font-medium text-yellow-700">/{userSubdomain || 'sua'}/loja</span>
                      </p>
                    </div>
                    <button
                      onClick={toggleStoreButton}
                      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                        showStoreButton ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          showStoreButton ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {showStoreButton ? (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">Botão visível no seu perfil em /{userSubdomain || 'seu-usuario'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <EyeOff className="w-4 h-4" />
                        <span>Botão oculto (loja acessível apenas por URL direta)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Store Icon Toggle */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingBag className="w-4 h-4 text-yellow-600" />
                      <h4 className="font-semibold text-gray-900">Ícone da Loja nos Posts</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Quando ativado, um ícone de loja aparecerá em todos os seus posts,
                      levando os visitantes diretamente para <span className="font-medium text-yellow-700">/{userSubdomain || 'sua'}/loja</span>
                    </p>
                  </div>
                  <button
                    onClick={toggleStoreIcon}
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                      showStoreIcon ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        showStoreIcon ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {showStoreIcon && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">Ícone ativo em todos os seus posts</span>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Products Grid */}
        {userSubdomain && storeEnabled ? (
          <>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando produtos...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Nenhum produto ainda</h3>
            <p className="text-gray-400 mb-6">Crie seu primeiro produto para começar a vender!</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black font-bold rounded-xl hover:scale-105 transition-transform"
            >
              <Plus className="w-5 h-5" />
              <span>Criar Primeiro Produto</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl overflow-hidden border-2 border-yellow-300 hover:border-yellow-500 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Package className="w-20 h-20 text-gray-400" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                      product.status === 'published'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}>
                      {product.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {product.title}
                  </h3>

                  {product.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="mb-4">
                    <span className="text-2xl font-bold text-yellow-700">
                      {formatPrice(product.price, product.currency)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleStatus(product)}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
                      title={product.status === 'published' ? 'Despublicar' : 'Publicar'}
                    >
                      {product.status === 'published' ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm">Editar</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[StoreManager] Delete button clicked for product:', product.id);
                        setDeleteConfirm(product.id);
                      }}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all font-medium"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        ) : (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <EyeOff className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-yellow-900 mb-2">Loja Desativada</h3>
            <p className="text-yellow-800 mb-4">
              Sua loja está desativada. Ative-a novamente para gerenciar produtos e exibir os botões da loja.
            </p>
            <p className="text-sm text-yellow-700">
              Para ativar, acesse suas configurações de perfil e habilite o recurso de Loja.
            </p>
          </div>
        )}
      </div>

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
    </PanelLayout>
  );
}
