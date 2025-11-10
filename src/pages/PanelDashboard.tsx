import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  Shield,
  Clock,
  Users,
  User,
  ShoppingBag,
  MessageSquare,
  Globe
} from 'lucide-react';
import { PanelLayout } from '../components/PanelLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Domain {
  id: string;
  fqdn: string;
  registrar_status: string;
  expires_at: string;
}

interface ProfileData {
  id: string;
  subdomain: string;
  store_enabled: boolean;
  social_enabled: boolean;
  domain_id: string;
}

interface Order {
  id: string;
  fqdn: string;
  total_cents: number;
  plan: string;
  created_at: string;
}

const PanelDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchData = async () => {
      if (!user?.id) {
        if (isMounted) setLoading(false);
        return;
      }

      timeoutId = setTimeout(() => {
        console.warn('[PanelDashboard] Timeout reached, stopping loading');
        if (isMounted) setLoading(false);
      }, 8000);

      try {
        const { data: customerData } = await supabase
          .from('customers')
          .select('id, active_domain_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!customerData || !isMounted) {
          if (isMounted) setLoading(false);
          return;
        }

        const custId = customerData.id;
        setCustomerId(custId);
        setActiveDomainId(customerData.active_domain_id);

        const { data: domainsData } = await supabase
          .from('domains')
          .select('*')
          .eq('customer_id', custId)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true });

        if (isMounted) {
          setDomains(domainsData || []);
        }

        if (customerData.active_domain_id) {
          // Primeiro tenta buscar pelo domain_id
          let { data: activeProfileData } = await supabase
            .from('user_profiles')
            .select('id, subdomain, store_enabled, social_enabled, domain_id')
            .eq('domain_id', customerData.active_domain_id)
            .maybeSingle();

          // Se não encontrar, busca o perfil do usuário (compatibilidade com perfis antigos)
          if (!activeProfileData) {
            const { data: fallbackProfileData } = await supabase
              .from('user_profiles')
              .select('id, subdomain, store_enabled, social_enabled, domain_id')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            activeProfileData = fallbackProfileData;
          }

          if (activeProfileData && isMounted) {
            setProfileData(activeProfileData);
          }
        }

        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', custId)
          .order('created_at', { ascending: false });

        if (isMounted) {
          setOrders(ordersData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user?.id]);

  const activeDomain = domains.find(d => d.id === activeDomainId);
  const activeDomains = domains.filter(d => d.registrar_status === 'active');
  const totalSpent = orders.reduce((sum, order) => sum + ((order.total_cents || 0) / 100), 0);

  const handleSwitchDomain = async (domainId: string) => {
    if (!customerId) {
      console.error('No customer ID found');
      return;
    }

    // Previne múltiplos cliques no mesmo domínio
    if (domainId === activeDomainId) {
      return;
    }

    console.log('Switching domain to:', domainId);

    try {
      const { data, error } = await supabase
        .from('customers')
        .update({ active_domain_id: domainId })
        .eq('id', customerId)
        .select();

      if (error) {
        console.error('Error updating active domain:', error);
        throw error;
      }

      console.log('Domain updated successfully:', data);
      setActiveDomainId(domainId);

      // Primeiro tenta buscar pelo domain_id
      let { data: newProfileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, subdomain, store_enabled, social_enabled, domain_id')
        .eq('domain_id', domainId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile by domain_id:', profileError);
      }

      // Se não encontrar, busca o perfil do usuário (compatibilidade com perfis antigos)
      if (!newProfileData && user?.id) {
        console.log('Profile not found by domain_id, trying user_id fallback');
        const { data: fallbackProfileData } = await supabase
          .from('user_profiles')
          .select('id, subdomain, store_enabled, social_enabled, domain_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        newProfileData = fallbackProfileData;
      }

      console.log('Profile data loaded:', newProfileData);

      if (newProfileData) {
        setProfileData(newProfileData);
      } else {
        setProfileData(null);
        console.log('No profile found for this domain');
      }
    } catch (error) {
      console.error('Error switching domain:', error);
      alert('Erro ao trocar domínio. Por favor, tente novamente.');
    }
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const quickActions = [];

  if (profileData) {
    quickActions.push({
      icon: User,
      label: 'Minha Página',
      domain: profileData.subdomain,
      description: 'Personalize sua página pública',
      action: () => navigate(`/panel/profile/${activeDomainId}`),
      disabled: false,
      highlight: true,
      stats: null
    });
  }

  if (profileData && profileData.store_enabled) {
    quickActions.push({
      icon: ShoppingBag,
      label: 'Loja',
      domain: profileData.subdomain,
      description: 'Gerencie seus produtos',
      action: () => navigate('/panel/loja'),
      disabled: false,
      highlight: true,
      stats: null
    });
  }

  if (profileData && profileData.social_enabled) {
    quickActions.push({
      icon: MessageSquare,
      label: 'Feed Social',
      domain: profileData.subdomain,
      description: 'Conecte-se com outros usuários',
      action: () => navigate('/social'),
      disabled: false,
      highlight: true,
      stats: null
    });
  }

  const adminActions = user?.role === 'admin' ? [
    {
      icon: Shield,
      label: 'Admin Global',
      description: 'Gerenciar todo o sistema',
      action: () => navigate('/admin/dashboard')
    }
  ] : [];

  const notifications = [];

  if (orders.length > 0) {
    const latestOrder = orders[0];
    const orderDate = new Date(latestOrder.created_at);
    const daysAgo = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

    notifications.push({
      icon: CheckCircle,
      iconColor: 'text-emerald-500',
      title: 'Pagamento confirmado',
      description: `Fatura de ${latestOrder.fqdn} paga`,
      date: daysAgo === 0 ? 'Hoje' : daysAgo === 1 ? 'Ontem' : `${daysAgo} dias atrás`
    });
  }

  if (activeDomain) {
    const daysUntilExpiry = getDaysUntilExpiry(activeDomain.expires_at);
    if (daysUntilExpiry <= 60 && daysUntilExpiry > 0) {
      notifications.push({
        icon: AlertCircle,
        iconColor: 'text-amber-500',
        title: 'Renovação próxima',
        description: `Seu domínio ${activeDomain.fqdn} renova em ${daysUntilExpiry} dias`,
        date: 'Ação necessária'
      });
    }
  }

  if (loading) {
    return (
      <PanelLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </PanelLayout>
    );
  }

  return (
    <PanelLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Bem-vindo, {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'}!
          </h1>
          <p className="text-slate-600">
            Aqui está um resumo da sua conta
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {domains.length > 1 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Domínio Ativo</h2>
              <div className="flex flex-wrap gap-3">
                {domains.map((domain) => (
                  <button
                    key={domain.id}
                    onClick={() => handleSwitchDomain(domain.id)}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      domain.id === activeDomainId
                        ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span className="text-sm">{domain.fqdn}</span>
                      {domain.id === activeDomainId && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Os atalhos abaixo refletem apenas o domínio ativo selecionado
              </p>
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Atalhos Rápidos</h2>
            {!profileData && activeDomain && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-1">Perfil não configurado</h3>
                    <p className="text-sm text-amber-700 mb-3">
                      Configure seu perfil para o domínio {activeDomain.fqdn} para ver os atalhos disponíveis.
                    </p>
                    <button
                      onClick={() => navigate(`/panel/profile/${activeDomain.id}`)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-all"
                    >
                      <User className="w-4 h-4" />
                      Configurar Perfil
                    </button>
                  </div>
                </div>
              </div>
            )}
            {quickActions.length === 0 && profileData && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">Apenas a Página está ativa</h3>
                    <p className="text-sm text-slate-600">
                      Ative a Loja ou o Feed Social nas configurações do seu perfil para ver mais atalhos.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    whileHover={!action.disabled ? { scale: 1.03 } : {}}
                    onClick={action.disabled ? undefined : action.action}
                    className={`${
                      action.highlight
                        ? 'bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 shadow-lg'
                        : 'bg-white border border-slate-200'
                    } rounded-xl p-8 transition-all group ${
                      action.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer hover:shadow-xl'
                    }`}
                  >
                    <div className={`${
                      action.highlight ? 'w-16 h-16' : 'w-12 h-12'
                    } rounded-xl flex items-center justify-center mb-5 transition-all ${
                      action.disabled
                        ? 'bg-gray-100'
                        : action.highlight
                        ? 'bg-gradient-to-br from-slate-700 to-slate-900 group-hover:from-slate-800 group-hover:to-black shadow-md'
                        : 'bg-slate-100 group-hover:bg-slate-500'
                    }`}>
                      <Icon className={`${
                        action.highlight ? 'w-8 h-8' : 'w-6 h-6'
                      } transition-colors ${
                        action.disabled
                          ? 'text-gray-400'
                          : action.highlight
                          ? 'text-white'
                          : 'text-slate-900 group-hover:text-white'
                      }`} />
                    </div>
                    <h3 className={`${
                      action.highlight ? 'text-xl' : 'text-lg'
                    } font-bold text-slate-800 mb-2`}>{action.label}</h3>
                    <div className="flex items-center gap-1.5 mb-3">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-500">
                        {action.domain ? `${action.domain}.com.rich` : 'Nenhum domínio'}
                      </span>
                    </div>
                    <p className={`${
                      action.highlight ? 'text-base' : 'text-sm'
                    } text-slate-600`}>{action.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {adminActions.length > 0 && (
            <div>
              {adminActions.map((action, index) => {
                const Icon = action.icon;

                return (
                  <motion.div
                    key={`admin-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={action.action}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-amber-900 mb-1">{action.label}</h3>
                        <p className="text-sm text-amber-700">{action.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Notificações</h2>
            {notifications.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Nenhuma notificação no momento</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notif, index) => {
                  const Icon = notif.icon;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all"
                    >
                      <div className="flex gap-3">
                        <Icon className={`w-5 h-5 ${notif.iconColor} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 text-sm mb-1">{notif.title}</h4>
                          <p className="text-sm text-slate-500 mb-2">{notif.description}</p>
                          <p className="text-xs text-slate-400">{notif.date}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {activeDomain && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-8 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2 text-white">Seu domínio está seguro e ativo</h3>
                <p className="text-slate-200 mb-4">
                  Todos os sistemas operando normalmente. Próxima renovação em {getDaysUntilExpiry(activeDomain.expires_at)} dias.
                </p>
                <button
                  onClick={() => navigate('/panel/billing')}
                  className="px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Ver Detalhes
                </button>
              </div>
              <Shield className="w-24 h-24 opacity-20" />
            </div>
          </motion.div>
        )}

        {!activeDomain && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl p-8 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2 text-white">Registre seu primeiro domínio</h3>
                <p className="text-slate-200 mb-4">
                  Comece sua jornada digital registrando um domínio .com.rich personalizado.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-white text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Buscar Domínio
                </button>
              </div>
              <Globe className="w-24 h-24 opacity-20" />
            </div>
          </motion.div>
        )}
      </div>
    </PanelLayout>
  );
};

export default PanelDashboard;
