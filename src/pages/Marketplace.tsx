import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, ShoppingCart, Check, X, Loader2, Settings, Pencil, Trash2, Plus, ChevronDown, Info, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
// Clean gradient background without image

interface PremiumDomain {
  fqdn: string;
  price_usd: number;
  category: string;
  is_featured: boolean;
  description: string | null;
  status: 'available' | 'sold' | 'reserved';
  created_at: string;
  show_price: boolean;
  plan_required?: string;
  exclusive_license_fee_usd?: number;
  requires_approval?: boolean;
}

const ALL_CATEGORIES: Array<{ value: string; label: string; adminOnly?: boolean }> = [
  { value: 'all', label: 'Todas' },
  { value: 'countries', label: 'Países' },
  { value: 'cities', label: 'Cidades' },
  { value: 'lifestyle', label: 'Estilo de Vida' },
  { value: 'business', label: 'Negócios' },
  { value: 'finance', label: 'Finanças' },
  { value: 'real-estate', label: 'Imóveis' },
  { value: 'technology', label: 'Tecnologia' },
  { value: 'travel', label: 'Viagens' },
  { value: 'fashion', label: 'Moda' },
  { value: 'automotive', label: 'Automotivo' },
  { value: 'entertainment', label: 'Entretenimento' },
  { value: 'health', label: 'Saúde' },
  { value: 'education', label: 'Educação' },
  { value: 'protected_brand', label: '🔒 Marcas Protegidas (Admin)', adminOnly: true }
];

const DEFAULT_PRICE = 25000.00;

export default function Marketplace() {
  const [suggestions, setSuggestions] = useState<PremiumDomain[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<PremiumDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingDomain, setEditingDomain] = useState<PremiumDomain | null>(null);
  const [addingDomain, setAddingDomain] = useState(false);
  const [newDomain, setNewDomain] = useState({
    fqdn: '',
    category: 'lifestyle',
    price_usd: 25000,
    status: 'available' as 'available' | 'sold' | 'reserved',
    is_featured: false,
    description: '',
    show_price: false
  });
  const [isLicenseInfoOpen, setIsLicenseInfoOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  // Filter categories based on admin status
  const CATEGORIES = isAdmin
    ? ALL_CATEGORIES
    : ALL_CATEGORIES.filter(cat => !cat.adminOnly);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  useEffect(() => {
    filterSuggestions();
  }, [suggestions, searchTerm, selectedCategory, showPremiumOnly]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      console.log('[Marketplace] Fetching premium domains...');
      console.log('[Marketplace] Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

      let query = supabase
        .from('premium_domains')
        .select('*')
        .eq('status', 'available');

      // CRITICAL: Hide protected brand domains from public gallery
      // Only admins can see protected_brand category
      if (!isAdmin) {
        query = query.neq('category', 'protected_brand');
        console.log('[Marketplace] Filtering out protected brands for non-admin user');
      } else {
        console.log('[Marketplace] Admin user - showing all domains including protected brands');
      }

      const { data, error } = await query;

      console.log('[Marketplace] Fetch result:', {
        dataLength: data?.length,
        error: error?.message,
        errorDetails: error
      });

      if (error) {
        console.error('[Marketplace] Supabase error:', error);
        throw error;
      }

      // Shuffle array to show domains randomly mixed (countries, cities, segments, etc.)
      const shuffled = data ? [...data].sort(() => Math.random() - 0.5) : [];

      console.log('[Marketplace] Successfully loaded and shuffled', shuffled.length, 'domains');
      setSuggestions(shuffled);
    } catch (error) {
      console.error('[Marketplace] Error fetching premium domains:', error);
      alert(`Erro ao carregar domínios: ${(error as Error).message}`);
    } finally {
      console.log('[Marketplace] Setting loading to false');
      setLoading(false);
    }
  };

  const filterSuggestions = () => {
    let filtered = [...suggestions];

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.fqdn.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }

    if (showPremiumOnly) {
      filtered = filtered.filter(s => s.is_featured);
    }

    setFilteredSuggestions(filtered);
  };

  // Show all domains mixed together randomly (no separation between featured and regular)
  const allDomains = filteredSuggestions;

  const handleBuyDomain = async (fqdn: string) => {
    if (!user) {
      // Usuário não está logado - redirecionar para login com o domínio salvo
      navigate('/login', { state: {
        prefilledDomain: fqdn,
        redirectTo: '/checkout',
        message: 'Faça login ou crie uma conta para continuar com a compra'
      } });
      return;
    }

    // Verificar se usuário tem plano Elite ativo
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (
            plan_type
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error || !subscription) {
        // Sem assinatura - redirecionar para valores
        navigate('/valores', {
          state: {
            message: 'Você precisa de um plano Elite ativo para adquirir domínios premium.',
            returnTo: `/premium?domain=${fqdn}`
          }
        });
        return;
      }

      const planType = (subscription.subscription_plans as any)?.plan_type;

      if (planType !== 'elite') {
        // Tem plano, mas não é Elite - redirecionar para upgrade
        navigate('/valores', {
          state: {
            message: 'Domínios premium requerem o plano Elite. Faça upgrade agora!',
            returnTo: `/premium?domain=${fqdn}`
          }
        });
        return;
      }

      // Tem Elite ativo - prosseguir para checkout
      navigate('/checkout', { state: {
        domain: fqdn,
        fromMarketplace: true,
        isPremiumDomain: true
      } });

    } catch (err) {
      console.error('Error checking subscription:', err);
      alert('Erro ao verificar sua assinatura. Tente novamente.');
    }
  };

  const getPrice = (domain: PremiumDomain) => {
    return domain.price_usd || DEFAULT_PRICE;
  };

  const handleDeleteDomain = async (fqdn: string) => {
    try {
      const { error } = await supabase
        .from('premium_domains')
        .delete()
        .eq('fqdn', fqdn);

      if (error) {
        console.error('Error deleting domain:', error);
        alert(`Erro ao excluir domínio: ${error.message}\n\nVerifique se você tem permissões de administrador.`);
        return;
      }

      setSuggestions(prev => prev.filter(s => s.fqdn !== fqdn));
      setDeleteConfirm(null);
      setActiveMenuId(null);
    } catch (error) {
      console.error('Error deleting domain:', error);
      alert(`Erro inesperado ao excluir domínio: ${(error as Error).message}`);
    }
  };

  const handleEditDomain = (domain: PremiumDomain) => {
    setEditingDomain(domain);
    setActiveMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingDomain) return;

    try {
      const { data, error } = await supabase
        .from('premium_domains')
        .update({
          category: editingDomain.category,
          price_usd: editingDomain.price_usd,
          is_featured: editingDomain.is_featured,
          status: editingDomain.status,
          description: editingDomain.description,
          show_price: editingDomain.show_price
        })
        .eq('fqdn', editingDomain.fqdn)
        .select();

      if (error) {
        console.error('Error updating domain:', error);

        if (error.message.includes('permission') || error.message.includes('policy')) {
          alert('Erro: Você não tem permissões de administrador para editar domínios.');
        } else {
          alert(`Erro ao atualizar domínio: ${error.message}`);
        }
        return;
      }

      setSuggestions(prev => prev.map(s =>
        s.fqdn === editingDomain.fqdn ? editingDomain : s
      ));
      setEditingDomain(null);
    } catch (error) {
      console.error('Error updating domain:', error);
      alert(`Erro inesperado ao atualizar domínio: ${(error as Error).message}`);
    }
  };

  const handleAddDomain = async () => {
    // Validação
    const fqdn = newDomain.fqdn.trim();
    if (!fqdn) {
      alert('O nome do domínio não pode estar vazio');
      return;
    }

    // Adiciona .com.rich se não tiver
    const fullDomain = fqdn.includes('.com.rich') ? fqdn : `${fqdn}.com.rich`;

    // Verifica se já existe
    const exists = suggestions.find(s =>
      s.fqdn.toLowerCase() === fullDomain.toLowerCase()
    );
    if (exists) {
      alert(`O domínio "${fullDomain}" já existe na coleção premium.`);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('premium_domains')
        .insert({
          fqdn: fullDomain,
          category: newDomain.category,
          price_usd: newDomain.price_usd,
          status: newDomain.status,
          is_featured: newDomain.is_featured,
          description: newDomain.description || null,
          show_price: newDomain.show_price
        })
        .select();

      if (error) {
        console.error('Error adding domain:', error);

        if (error.code === '23505') {
          alert(`O domínio "${fullDomain}" já existe na coleção premium.`);
        } else if (error.message.includes('permission') || error.message.includes('policy')) {
          alert('Erro: Você não tem permissões de administrador para adicionar domínios.');
        } else {
          alert(`Erro ao adicionar domínio: ${error.message}`);
        }
        return;
      }

      if (data && data[0]) {
        setSuggestions(prev => [data[0], ...prev]);
      }

      // Limpar e fechar modal
      setNewDomain({
        fqdn: '',
        category: 'lifestyle',
        price_usd: 25000,
        status: 'available',
        is_featured: false,
        description: '',
        show_price: false
      });
      setAddingDomain(false);
    } catch (error) {
      console.error('Error adding domain:', error);
      alert(`Erro inesperado ao adicionar domínio: ${(error as Error).message}`);
    }
  };

  const handleCancelAdd = () => {
    setNewDomain({
      fqdn: '',
      category: 'lifestyle',
      price_usd: 25000,
      status: 'available',
      is_featured: false,
      description: '',
      show_price: false
    });
    setAddingDomain(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 border border-green-300 rounded-full text-xs font-bold">
            <Check className="w-3 h-3" />
            Disponível
          </span>
        );
      case 'sold':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 border border-red-300 rounded-full text-xs font-bold">
            <X className="w-3 h-3" />
            Vendido
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 border border-amber-300 rounded-full text-xs font-bold">
            <Loader2 className="w-3 h-3" />
            Reservado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <PageLayout>
      {/* Background Layer */}
      <div className="fixed inset-0 top-16 -z-10 bg-gradient-to-br from-amber-50/80 via-white to-yellow-50/80" />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Premium Gallery Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-yellow-200 shadow-2xl shadow-yellow-100/50 p-8 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-full border-2 border-yellow-300 shadow-lg shadow-yellow-200/50 mb-6">
                <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                <span className="text-sm font-bold text-yellow-900 tracking-wider uppercase">Coleção Exclusiva</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Premium
              </h1>
              <p className="text-lg text-gray-600 font-medium mb-3">
                Domínios .com.rich exclusivos e cuidadosamente selecionados
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full shadow-lg">
                <Crown className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white tracking-wide">Exclusivo para assinantes Supreme</span>
              </div>
            </div>
          </motion.div>

          {/* O Que Significa Ser Licenciado - Elegant Accordion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-br from-amber-50/90 via-white/90 to-yellow-50/90 backdrop-blur-xl rounded-2xl border-2 border-yellow-300/40 shadow-xl shadow-yellow-200/30 overflow-hidden">
              <button
                onClick={() => setIsLicenseInfoOpen(!isLicenseInfoOpen)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-yellow-50/50 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                    <Info className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    O Que significa ser licenciado de um domínio Premium .com.rich
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isLicenseInfoOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-6 h-6 text-amber-600 group-hover:text-amber-700" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isLicenseInfoOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 border-t border-yellow-200/50">
                      <div className="bg-white/60 rounded-xl p-6 mt-4 space-y-4 text-gray-700 leading-relaxed">
                        <p>
                          Tornar-se licenciado de um domínio <strong className="text-yellow-800">.com.rich</strong> significa obter o{' '}
                          <strong className="text-gray-900">direito exclusivo de uso e administração global</strong> de um nome digital de prestígio — como{' '}
                          <code className="px-2 py-1 bg-yellow-100 text-yellow-900 rounded font-semibold">socialmedia.com.rich</code>,{' '}
                          <code className="px-2 py-1 bg-yellow-100 text-yellow-900 rounded font-semibold">luxurycars.com.rich</code> ou{' '}
                          <code className="px-2 py-1 bg-yellow-100 text-yellow-900 rounded font-semibold">art.com.rich</code>.
                        </p>

                        <p>
                          Cada domínio representa um <strong className="text-gray-900">segmento global, profissional ou geográfico</strong>, e pode ser totalmente personalizado para operar como uma{' '}
                          <strong className="text-gray-900">plataforma digital independente</strong>, com identidade visual, idioma e público específicos.
                        </p>

                        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 rounded-r-lg p-4">
                          <p className="text-sm text-gray-700">
                            A <strong className="text-gray-900">Global Digital Identity LTD</strong>{' '}
                            <span className="text-gray-600">(Company No. 16339013, registrada na Inglaterra e País de Gales, com sede em Londres)</span>{' '}
                            fornece toda a estrutura técnica e jurídica para que cada licenciado possa desenvolver{' '}
                            <strong className="text-gray-900">sua própria rede digital segmentada</strong>, seja voltada a:
                          </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-3 my-4">
                          <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-lg p-4 border border-yellow-300/50">
                            <div className="font-bold text-yellow-900 mb-2">🏆 Setores de Luxo</div>
                            <div className="text-sm text-gray-700 space-y-1">
                              <div>• fashion.com.rich</div>
                              <div>• realestate.com.rich</div>
                              <div>• crypto.com.rich</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-lg p-4 border border-yellow-300/50">
                            <div className="font-bold text-amber-900 mb-2">🎨 Comunidades Temáticas</div>
                            <div className="text-sm text-gray-700 space-y-1">
                              <div>• art.com.rich</div>
                              <div>• travel.com.rich</div>
                              <div>• wellness.com.rich</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-lg p-4 border border-yellow-300/50">
                            <div className="font-bold text-yellow-900 mb-2">🌍 Regiões e Países</div>
                            <div className="text-sm text-gray-700 space-y-1">
                              <div>• dubai.com.rich</div>
                              <div>• brazil.com.rich</div>
                              <div>• france.com.rich</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-yellow-400/40 rounded-xl p-5">
                          <p className="font-semibold text-gray-900 mb-2">
                            ✨ Cada licença é <span className="text-yellow-700">única, exclusiva e global</span>
                          </p>
                          <p className="text-gray-700">
                            O licenciado obtém controle operacional total de sua área — sempre sob a supervisão da administradora oficial{' '}
                            <strong className="text-gray-900">Global Digital Identity LTD</strong>.
                          </p>
                        </div>

                        <p className="text-gray-600 italic">
                          Esse modelo permite a criação de um <strong className="text-gray-800">ecossistema mundial de plataformas segmentadas</strong>, conectadas entre si, formando a rede digital internacional dos nomes e marcas <strong className="text-yellow-800">.com.rich</strong>.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mb-8"
            >
              <button
                onClick={() => setAddingDomain(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white rounded-xl transition-all duration-300 font-bold shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Adicionar Domínio Premium
              </button>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-yellow-200 shadow-2xl shadow-yellow-100/50 p-8 mb-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                <input
                  type="text"
                  placeholder="Buscar domínios exclusivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-yellow-200 rounded-xl text-gray-900 placeholder-amber-600/60 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all font-medium"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600 z-10" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-yellow-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 appearance-none transition-all cursor-pointer font-medium"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value} className="bg-white">{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center text-sm">
              <p className="text-gray-700">
                <span className="font-bold text-amber-700 text-xl">{filteredSuggestions.length}</span>
                <span className="text-gray-600 ml-2 font-medium">domínios premium disponíveis</span>
              </p>
            </div>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col justify-center items-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-amber-600 mb-4" />
              <p className="text-gray-600 font-medium">Carregando coleção premium...</p>
            </div>
          )}

          {/* All Domains Grid - Optimized for speed */}
          {!loading && allDomains.length > 0 && (
            <div className="mb-16">
              {/* Domains Grid - Simple and fast */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allDomains.map((domain) => (
                <div
                  key={domain.fqdn}
                  className="bg-white rounded-xl border-2 border-yellow-300 hover:border-yellow-500 shadow-lg hover:shadow-xl transition-all duration-200 p-6 relative"
                >
                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="absolute top-3 right-3 z-20">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === domain.fqdn ? null : domain.fqdn)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Settings className="w-4 h-4 text-gray-600" />
                      </button>

                      <AnimatePresence>
                        {activeMenuId === domain.fqdn && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-30"
                          >
                            <button
                              onClick={() => handleEditDomain(domain)}
                              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-left text-sm"
                            >
                              <Pencil className="w-4 h-4 text-[#3B82F6]" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(domain.fqdn)}
                              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-left text-sm text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Excluir</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Featured star badge - top left corner only if featured */}
                  {domain.is_featured && (
                    <div className="absolute top-3 left-3 z-10">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    </div>
                  )}

                  {/* Supreme Plan Badge */}
                  {domain.plan_required === 'supreme' && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Crown className="w-3 h-3" />
                        Gold
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Domain Name */}
                    <h3 className="text-xl font-bold text-gray-900 break-words pt-2">
                      {domain.fqdn}
                    </h3>

                    {/* Description */}
                    {domain.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{domain.description}</p>
                    )}

                    {/* Category and Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-gray-600 capitalize font-medium">
                        {CATEGORIES.find(c => c.value === domain.category)?.label || domain.category}
                      </span>
                      {getStatusBadge(domain.status)}
                    </div>

                    {/* Price and Button */}
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                      {domain.plan_required === 'supreme' ? (
                        <div>
                          <p className="text-xl font-bold text-yellow-700">
                            By Request
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Exclusive License Fee + mensalidade personalizada</p>
                        </div>
                      ) : domain.show_price ? (
                        <div>
                          <p className="text-2xl font-bold text-amber-700">
                            ${getPrice(domain).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Pagamento único</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xl font-bold text-amber-700">
                            Sob Consulta
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Entre em contato para valores</p>
                        </div>
                      )}

                      {domain.status === 'available' ? (
                        domain.plan_required === 'supreme' ? (
                          <button
                            onClick={() => navigate('/contact')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white rounded-lg transition-colors duration-200 font-bold"
                          >
                            <Crown className="w-4 h-4" />
                            Solicitar Licença
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBuyDomain(domain.fqdn)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white rounded-lg transition-colors duration-200 font-bold"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Adquirir
                          </button>
                        )
                      ) : (
                        <button
                          disabled
                          className="w-full px-4 py-3 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed font-bold"
                        >
                          Vendido
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}


          {/* Empty State */}
          {!loading && filteredSuggestions.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Search className="w-16 h-16 text-amber-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                Nenhum domínio encontrado
              </h3>
              <p className="text-gray-600 font-medium">
                Tente ajustar seus filtros de busca
              </p>
            </motion.div>
          )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => handleDeleteDomain(deleteConfirm)}
          title="Excluir Domínio"
          message="Tem certeza que deseja excluir este domínio da coleção premium?"
          confirmText="Excluir"
          cancelText="Cancelar"
        />
      )}

      {/* Edit Modal */}
      {editingDomain && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-black mb-4">Editar Domínio</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Domínio
                </label>
                <input
                  type="text"
                  value={editingDomain.fqdn}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">O nome do domínio não pode ser alterado</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={editingDomain.description || ''}
                  onChange={(e) => setEditingDomain({ ...editingDomain, description: e.target.value })}
                  placeholder="Descrição do domínio"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={editingDomain.category}
                  onChange={(e) => setEditingDomain({ ...editingDomain, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                >
                  {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço (USD)
                </label>
                <input
                  type="number"
                  step="1"
                  value={editingDomain.price_usd || ''}
                  onChange={(e) => setEditingDomain({ ...editingDomain, price_usd: e.target.value ? parseInt(e.target.value) : DEFAULT_PRICE })}
                  placeholder={`Padrão: $${DEFAULT_PRICE.toLocaleString()}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editingDomain.status}
                  onChange={(e) => setEditingDomain({ ...editingDomain, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                >
                  <option value="available">Disponível</option>
                  <option value="sold">Vendido</option>
                  <option value="reserved">Reservado</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingDomain.is_featured}
                  onChange={(e) => setEditingDomain({ ...editingDomain, is_featured: e.target.checked })}
                  className="w-4 h-4 text-[#3B82F6] rounded focus:ring-[#3B82F6]"
                />
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Domínio em Destaque</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingDomain.show_price}
                  onChange={(e) => setEditingDomain({ ...editingDomain, show_price: e.target.checked })}
                  className="w-4 h-4 text-[#3B82F6] rounded focus:ring-[#3B82F6]"
                />
                <span className="text-sm font-medium text-gray-700">Mostrar Preço (se desmarcado, mostra "Sob Consulta")</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingDomain(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors font-medium"
              >
                Salvar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Domain Modal */}
      {addingDomain && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-black mb-4">Adicionar Novo Domínio</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Domínio
                </label>
                <input
                  type="text"
                  value={newDomain.fqdn}
                  onChange={(e) => setNewDomain({ ...newDomain, fqdn: e.target.value })}
                  placeholder="exemplo.com.rich"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Digite o domínio completo ou apenas o nome</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newDomain.description}
                  onChange={(e) => setNewDomain({ ...newDomain, description: e.target.value })}
                  placeholder="Descrição do domínio"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={newDomain.category}
                  onChange={(e) => setNewDomain({ ...newDomain, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                >
                  {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço (USD)
                </label>
                <input
                  type="number"
                  step="1"
                  value={newDomain.price_usd}
                  onChange={(e) => setNewDomain({ ...newDomain, price_usd: e.target.value ? parseInt(e.target.value) : DEFAULT_PRICE })}
                  placeholder={`Padrão: $${DEFAULT_PRICE.toLocaleString()}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={newDomain.status}
                  onChange={(e) => setNewDomain({ ...newDomain, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                >
                  <option value="available">Disponível</option>
                  <option value="sold">Vendido</option>
                  <option value="reserved">Reservado</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newDomain.is_featured}
                  onChange={(e) => setNewDomain({ ...newDomain, is_featured: e.target.checked })}
                  className="w-4 h-4 text-[#3B82F6] rounded focus:ring-[#3B82F6]"
                />
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Domínio em Destaque</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newDomain.show_price}
                  onChange={(e) => setNewDomain({ ...newDomain, show_price: e.target.checked })}
                  className="w-4 h-4 text-[#3B82F6] rounded focus:ring-[#3B82F6]"
                />
                <span className="text-sm font-medium text-gray-700">Mostrar Preço (se desmarcado, mostra "Sob Consulta")</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelAdd}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddDomain}
                className="flex-1 px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors font-medium"
              >
                Adicionar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </PageLayout>
  );
}
