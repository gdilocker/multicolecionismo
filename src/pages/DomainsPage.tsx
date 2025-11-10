import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Globe, Plus, CheckCircle, AlertCircle, Clock, Settings, ArrowRight, MoreVertical, CreditCard as Edit, Trash2, RefreshCw, ChevronUp, ChevronDown, XCircle } from 'lucide-react';
import { PanelLayout } from '../components/PanelLayout';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ConfirmModal } from '../components/ConfirmModal';
import { AlertModal } from '../components/AlertModal';

interface Domain {
  id: string;
  fqdn: string;
  registrar_status: string;
  expires_at: string;
  created_at: string;
  domain_type?: 'personal' | 'business';
  display_order?: number;
}

const DomainsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('Prime');
  const [isAdmin, setIsAdmin] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; domainId: string; domainName: string }>({
    isOpen: false,
    domainId: '',
    domainName: ''
  });

  const [renewModal, setRenewModal] = useState<{ isOpen: boolean; domainId: string; domainName: string; currentExpiry: string }>({
    isOpen: false,
    domainId: '',
    domainName: '',
    currentExpiry: ''
  });

  const [refreshing, setRefreshing] = useState(false);
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  const hasPersonalDomain = domains.some(d => d.domain_type === 'personal');
  const hasBusinessDomain = domains.some(d => d.domain_type === 'business');
  const canRegisterMore = isAdmin || domains.length < 2;

  console.log('VERSION 445 - RENDER:', {
    domainsCount: domains.length,
    loading,
    isAdmin,
    userId: user?.id
  });

  useEffect(() => {
    console.log('VERSION 445 - useEffect triggered');

    if (!user?.id) {
      console.log('VERSION 445 - No user ID');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchDomains = async () => {
      try {
        console.log('VERSION 445 - Fetching customer for user:', user.id);

        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id, role, active_domain_id')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('VERSION 445 - Customer query result:', {
          data: customerData,
          error: customerError,
          hasData: !!customerData,
          errorDetails: customerError ? JSON.stringify(customerError) : 'none'
        });

        if (!isMounted) {
          console.log('VERSION 445 - Component unmounted');
          return;
        }

        if (customerError) {
          console.error('VERSION 445 - Customer query error:', customerError);
          setLoading(false);
          return;
        }

        if (!customerData) {
          console.log('VERSION 445 - No customer data, session may have expired');
          setLoading(false);
          return;
        }

        const isUserAdmin = customerData.role === 'admin';
        setIsAdmin(isUserAdmin);
        setCustomerId(customerData.id);
        setActiveDomainId(customerData.active_domain_id);
        console.log('VERSION 442 - User is admin:', isUserAdmin);

        console.log('VERSION 446 - Fetching domains for customer:', customerData.id);
        const { data: domainsData, error: domainsError } = await supabase
          .from('domains')
          .select('*')
          .eq('customer_id', customerData.id)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true });

        console.log('VERSION 446 - Domains query result:', {
          hasData: !!domainsData,
          count: domainsData?.length,
          error: domainsError,
          errorMessage: domainsError?.message,
          errorDetails: domainsError?.details,
          domains: domainsData,
          customerId: customerData.id
        });

        if (!isMounted) {
          console.log('VERSION 442 - Component unmounted');
          return;
        }

        if (domainsData && domainsData.length > 0) {
          console.log('VERSION 442 - Setting', domainsData.length, 'domains');
          setDomains(domainsData);
        } else {
          console.log('VERSION 442 - Setting empty array');
          setDomains([]);
        }

        if (!isUserAdmin) {
          const { data: subscriptionData } = await supabase
            .from('subscriptions')
            .select('plan_id, subscription_plans(plan_name)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

          if (isMounted && subscriptionData?.subscription_plans) {
            setUserPlan((subscriptionData.subscription_plans as any).plan_name);
          }
        } else {
          setUserPlan('Admin');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDomains();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (domainId: string) => {
    setOpenMenuId(openMenuId === domainId ? null : domainId);
  };

  const handleEditDomain = (domainId: string) => {
    navigate(`/panel/domains/${domainId}/settings`);
    setOpenMenuId(null);
  };

  const handleRenewDomain = (domainId: string, fqdn: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (domain) {
      setRenewModal({
        isOpen: true,
        domainId,
        domainName: fqdn,
        currentExpiry: domain.expires_at
      });
    }
    setOpenMenuId(null);
  };

  const confirmRenewDomain = async () => {
    try {
      const currentExpiry = new Date(renewModal.currentExpiry);
      const newExpiry = new Date(currentExpiry);
      newExpiry.setFullYear(currentExpiry.getFullYear() + 1);

      const { error } = await supabase
        .from('domains')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', renewModal.domainId);

      if (error) throw error;

      setDomains(domains.map(d =>
        d.id === renewModal.domainId
          ? { ...d, expires_at: newExpiry.toISOString() }
          : d
      ));

      setAlertModal({
        isOpen: true,
        title: 'Domínio Renovado!',
        message: 'Seu domínio foi renovado com sucesso por mais 1 ano.',
        type: 'success'
      });
      setRenewModal({ isOpen: false, domainId: '', domainName: '', currentExpiry: '' });
    } catch (error) {
      console.error('Error renewing domain:', error);
      setAlertModal({
        isOpen: true,
        title: 'Erro ao Renovar',
        message: 'Não foi possível renovar o domínio. Por favor, tente novamente.',
        type: 'error'
      });
    }
  };

  const handleActivateDomain = async (domainId: string) => {
    if (!customerId) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update({ active_domain_id: domainId })
        .eq('id', customerId);

      if (error) throw error;

      setActiveDomainId(domainId);
      setAlertModal({
        isOpen: true,
        title: 'Domínio Ativado!',
        message: 'Este domínio agora está ativo e visível no Dashboard.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error activating domain:', error);
      setAlertModal({
        isOpen: true,
        title: 'Erro ao Ativar',
        message: 'Não foi possível ativar o domínio. Por favor, tente novamente.',
        type: 'error'
      });
    }
  };

  const handleDeactivateDomain = async () => {
    if (!customerId) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update({ active_domain_id: null })
        .eq('id', customerId);

      if (error) throw error;

      setActiveDomainId(null);
      setAlertModal({
        isOpen: true,
        title: 'Domínio Desativado',
        message: 'O domínio foi desativado. Nenhum domínio está ativo no Dashboard agora.',
        type: 'info'
      });
    } catch (error) {
      console.error('Error deactivating domain:', error);
      setAlertModal({
        isOpen: true,
        title: 'Erro ao Desativar',
        message: 'Não foi possível desativar o domínio. Por favor, tente novamente.',
        type: 'error'
      });
    }
  };

  const handleRefresh = async () => {
    if (!user?.id || refreshing) return;

    setRefreshing(true);
    try {
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, role, active_domain_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (customerData) {
        const { data: domainsData } = await supabase
          .from('domains')
          .select('*')
          .eq('customer_id', customerData.id)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true });

        setDomains(domainsData || []);
        setIsAdmin(customerData.role === 'admin');
        setActiveDomainId(customerData.active_domain_id);
      }
    } catch (error) {
      console.error('Error refreshing domains:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleDeleteDomain = (domainId: string, fqdn: string) => {
    setDeleteModal({ isOpen: true, domainId, domainName: fqdn });
    setOpenMenuId(null);
  };

  const confirmDeleteDomain = async () => {
    try {
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', deleteModal.domainId);

      if (error) throw error;

      setDomains(domains.filter(d => d.id !== deleteModal.domainId));
      setDeleteModal({ isOpen: false, domainId: '', domainName: '' });
    } catch (error) {
      console.error('Error deleting domain:', error);
      setAlertModal({
        isOpen: true,
        title: 'Erro ao Excluir',
        message: 'Não foi possível excluir o domínio. Por favor, tente novamente.',
        type: 'error'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'active') {
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    } else if (status === 'pending_provisioning' || status === 'pending') {
      return <Clock className="w-4 h-4 text-amber-500" />;
    } else if (status === 'failed') {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    } else {
      return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'active': 'Ativo',
      'pending': 'Pendente',
      'pending_provisioning': 'Provisionando',
      'expired': 'Expirado',
      'suspended': 'Suspenso',
      'failed': 'Erro no Registro'
    };
    return statusMap[status] || 'Processando';
  };

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'text-emerald-600';
    if (status === 'pending_provisioning' || status === 'pending') return 'text-amber-600';
    if (status === 'failed') return 'text-red-600';
    return 'text-gray-600';
  };

  const handleMoveDomain = async (domainId: string, direction: 'up' | 'down') => {
    const currentIndex = domains.findIndex(d => d.id === domainId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= domains.length) return;

    const newDomains = [...domains];
    const [movedDomain] = newDomains.splice(currentIndex, 1);
    newDomains.splice(targetIndex, 0, movedDomain);

    setDomains(newDomains);

    try {
      const updates = newDomains.map((domain, index) =>
        supabase
          .from('domains')
          .update({ display_order: index + 1 })
          .eq('id', domain.id)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error updating domain order:', error);
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (customerData) {
        const { data: domainsData } = await supabase
          .from('domains')
          .select('*')
          .eq('customer_id', customerData.id)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true });

        setDomains(domainsData || []);
      }
    }
  };

  if (loading) {
    return (
      <PanelLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando domínios...</p>
          </div>
        </div>
      </PanelLayout>
    );
  }

  return (
    <PanelLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader
          title="Meus Domínios"
          subtitle="Gerencie seus domínios e personalize suas páginas públicas"
          primaryAction={
            <div className="flex flex-col items-stretch gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold shadow-lg transition-all bg-white text-slate-700 border-2 border-slate-300 hover:border-slate-400 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Atualizando...' : 'Atualizar'}
                </motion.button>
                <motion.button
                  whileHover={canRegisterMore ? { scale: 1.02 } : {}}
                  whileTap={canRegisterMore ? { scale: 0.98 } : {}}
                  onClick={() => canRegisterMore && navigate('/')}
                  disabled={!canRegisterMore}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold shadow-lg transition-all ${
                    canRegisterMore
                      ? 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white shadow-slate-500/30 hover:shadow-xl hover:shadow-slate-500/40 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-gray-300/30'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  Registrar Novo Domínio
                </motion.button>
              </div>
              {!canRegisterMore && (
                <p className="text-xs text-center sm:text-right text-teal-600 font-semibold">
                  {domains.length} domínio(s) - Acesso Ilimitado (Admin)
                </p>
              )}
              {canRegisterMore && domains.length > 0 && !isAdmin && (
                <p className="text-xs text-center sm:text-right text-slate-500">
                  {domains.length}/2 domínios registrados
                </p>
              )}
              {isAdmin && domains.length > 0 && (
                <p className="text-xs text-center sm:text-right text-teal-600 font-semibold">
                  {domains.length} domínio(s) - Acesso ilimitado (Admin)
                </p>
              )}
            </div>
          }
        />

        {domains.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-16 bg-white border border-slate-200 rounded-2xl text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum domínio registrado</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Clique em "Registrar Novo Domínio" acima para começar
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {domains.map((domain, index) => {
              const StatusIcon = getStatusIcon(domain.registrar_status);

              return (
                <motion.div
                  key={domain.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-400/20 to-slate-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
                  <div className="relative bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4 sm:mb-6">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Globe className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{domain.fqdn}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            {StatusIcon}
                            <span className={`text-xs sm:text-sm font-semibold ${getStatusColor(domain.registrar_status)}`}>
                              {getStatusText(domain.registrar_status)}
                            </span>
                          </div>
                          {domain.expires_at && (
                            <span className="text-xs text-slate-500 block mt-1">
                              {isAdmin && new Date(domain.expires_at).getFullYear() >= 2099
                                ? 'Acesso Vitalício'
                                : `@${domain.fqdn.split('.')[0]} · Expira ${new Date(domain.expires_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveDomain(domain.id, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Mover para cima"
                          >
                            <ChevronUp className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            onClick={() => handleMoveDomain(domain.id, 'down')}
                            disabled={index === domains.length - 1}
                            className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Mover para baixo"
                          >
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                          </button>
                        </div>
                        <div className="relative flex-shrink-0" ref={openMenuId === domain.id ? menuRef : null}>
                        <button
                          onClick={() => toggleMenu(domain.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Settings className="w-5 h-5 text-slate-500" />
                        </button>

                        <AnimatePresence>
                          {openMenuId === domain.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
                            >
                              <button
                                onClick={() => handleEditDomain(domain.id)}
                                className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors"
                              >
                                <Edit className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">Configurações</span>
                              </button>
                              <button
                                onClick={() => handleRenewDomain(domain.id, domain.fqdn)}
                                className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors"
                              >
                                <RefreshCw className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">Renovar Domínio</span>
                              </button>
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                onClick={() => handleDeleteDomain(domain.id, domain.fqdn)}
                                className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium text-red-600">Excluir Domínio</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
                      <div className="p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50">
                        <p className="text-xs text-slate-500 mb-1">Plano</p>
                        <p className="text-base sm:text-lg font-bold text-slate-900">{userPlan}</p>
                      </div>
                      <div className="p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/30 rounded-xl border border-emerald-200/50">
                        <p className="text-xs text-emerald-700 mb-1">Status DNS</p>
                        <p className="text-base sm:text-lg font-bold text-emerald-700">Configurado</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${domain.id === activeDomainId ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {domain.id === activeDomainId ? 'Domínio Ativo' : 'Domínio Inativo'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {domain.id === activeDomainId ? 'Visível no dashboard' : 'Clique para ativar'}
                            </p>
                          </div>
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => domain.id === activeDomainId ? handleDeactivateDomain() : handleActivateDomain(domain.id)}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            domain.id === activeDomainId
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 focus:ring-emerald-500'
                              : 'bg-slate-300 focus:ring-slate-400'
                          }`}
                        >
                          <motion.span
                            layout
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                              domain.id === activeDomainId ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </motion.button>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => navigate(`/panel/profile/${domain.id}`)}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white rounded-xl font-semibold shadow-lg shadow-slate-500/30 hover:shadow-xl hover:shadow-slate-500/40 transition-all"
                      >
                        Gerenciar Página
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, domainId: '', domainName: '' })}
        onConfirm={confirmDeleteDomain}
        title="Excluir Domínio"
        message={`Tem certeza que deseja excluir o domínio ${deleteModal.domainName}? Esta ação não pode ser desfeita e todos os dados associados serão permanentemente removidos.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="danger"
      />

      <ConfirmModal
        isOpen={renewModal.isOpen}
        onClose={() => setRenewModal({ isOpen: false, domainId: '', domainName: '', currentExpiry: '' })}
        onConfirm={confirmRenewDomain}
        title="Renovar Domínio"
        message={`Deseja renovar o domínio ${renewModal.domainName} por mais 1 ano? O novo prazo de expiração será ${renewModal.currentExpiry ? new Date(new Date(renewModal.currentExpiry).setFullYear(new Date(renewModal.currentExpiry).getFullYear() + 1)).toLocaleDateString('pt-BR') : ''}.`}
        confirmText="Sim, Renovar"
        cancelText="Cancelar"
        variant="primary"
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </PanelLayout>
  );
};

export default DomainsPage;
