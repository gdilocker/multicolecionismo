import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Mail,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  Clock
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

interface Order {
  id: string;
  fqdn: string;
  total_cents: number;
  plan: string;
  created_at: string;
}

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchData = async () => {
      if (!user?.id) {
        if (isMounted) setLoading(false);
        return;
      }

      // Safety timeout - 8 seconds max
      timeoutId = setTimeout(() => {
        console.warn('[UserDashboard] Timeout reached, stopping loading');
        if (isMounted) setLoading(false);
      }, 8000);

      try {
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        const customerId = customerData?.id;

        if (customerId && isMounted) {
          const { data: domainsData } = await supabase
            .from('domains')
            .select('*')
            .eq('customer_id', customerId)
            .eq('registrar_status', 'active')
            .order('created_at', { ascending: false });

          const { data: ordersData } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

          if (isMounted) {
            setDomains(domainsData || []);
            setOrders(ordersData || []);
          }
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

  const primaryDomain = domains[0];
  const activeDomains = domains.filter(d => d.registrar_status === 'active');
  const totalSpent = orders.reduce((sum, order) => sum + ((order.total_cents || 0) / 100), 0);

  const getDaysUntilExpiry = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const notifications: Array<{
    icon: typeof CheckCircle;
    iconColor: string;
    title: string;
    description: string;
    date: string;
  }> = [];

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

  if (primaryDomain) {
    const daysUntilExpiry = getDaysUntilExpiry(primaryDomain.expires_at);
    if (daysUntilExpiry <= 60 && daysUntilExpiry > 0) {
      notifications.push({
        icon: AlertCircle,
        iconColor: 'text-amber-500',
        title: 'Renovação próxima',
        description: `Seu domínio ${primaryDomain.fqdn} renova em ${daysUntilExpiry} dias`,
        date: 'Ação necessária'
      });
    }
  }

  // Dashboard stats - apenas 3 cards principais
  const stats = [
    {
      icon: Globe,
      label: 'Domínios',
      value: activeDomains.length.toString(),
      status: activeDomains.length > 0 ? `${activeDomains.length} ativo${activeDomains.length > 1 ? 's' : ''}` : 'Nenhum ativo',
      statusColor: activeDomains.length > 0 ? 'text-emerald-600' : 'text-gray-500',
      bgColor: 'from-slate-700 to-slate-900',
      action: () => navigate('/panel/domains')
    },
    {
      icon: Clock,
      label: 'Notificações',
      value: notifications.length.toString(),
      status: notifications.length > 0 ? 'Requer atenção' : 'Tudo em ordem',
      statusColor: notifications.length > 0 ? 'text-amber-600' : 'text-emerald-600',
      bgColor: 'from-slate-600 to-slate-800',
      action: () => {}
    },
    {
      icon: CreditCard,
      label: 'Plano Atual',
      value: user?.role === 'admin' ? 'Elite' : (orders.length > 0 ? 'Ativo' : 'Sem plano'),
      status: user?.role === 'admin' ? 'Administrador do sistema' : (orders.length > 0 ? `${orders.length} pedido${orders.length > 1 ? 's' : ''}` : 'Nenhum pedido'),
      statusColor: user?.role === 'admin' ? 'text-yellow-600' : (orders.length > 0 ? 'text-emerald-600' : 'text-slate-600'),
      bgColor: 'from-slate-500 to-slate-700',
      action: () => navigate('/panel/billing')
    }
  ];

  const quickActions = [
    {
      icon: Globe,
      label: 'Meus Domínios',
      description: 'Gerenciar domínios registrados',
      action: () => navigate('/panel/domains'),
      disabled: false
    },
    {
      icon: CreditCard,
      label: 'Faturas',
      description: 'Histórico de pagamentos',
      action: () => navigate('/panel/billing'),
      disabled: false
    },
    {
      icon: CheckCircle,
      label: 'Registrar Domínio',
      description: 'Buscar novo domínio',
      action: () => navigate('/'),
      disabled: false
    }
  ];

  const adminActions: any[] = [];

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
        <div className="mb-8" >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Bem-vindo, {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'}!
          </h1>
          <p className="text-slate-500">
            Aqui está um resumo da sua conta
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                onClick={stat.action}
                className="group relative cursor-pointer"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500/20 to-slate-700/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
                <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">{stat.label}</h3>
                  <p className="text-2xl font-bold text-slate-800 mb-1">{stat.value}</p>
                  <p className={`text-sm ${stat.statusColor}`}>{stat.status}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Atalhos Rápidos</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={!action.disabled ? { scale: 1.05 } : {}}
                    onClick={action.disabled ? undefined : action.action}
                    className={`bg-white border border-slate-200 rounded-xl p-6 transition-all group ${
                      action.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer hover:shadow-lg'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                      action.disabled
                        ? 'bg-gray-100'
                        : 'bg-slate-100 group-hover:bg-slate-500'
                    }`}>
                      <Icon className={`w-5 h-5 transition-colors ${
                        action.disabled
                          ? 'text-gray-400'
                          : 'text-slate-900 group-hover:text-white'
                      }`} />
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1">{action.label}</h3>
                    <p className="text-sm text-slate-500">{action.description}</p>
                  </motion.div>
                );
              })}
              {adminActions.map((action, index) => {
                const Icon = action.icon;

                return (
                  <motion.div
                    key={`admin-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={action.action}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-amber-900 mb-1">{action.label}</h3>
                    <p className="text-sm text-amber-700">{action.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

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
                      transition={{ delay: 0.6 + index * 0.1 }}
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

        {primaryDomain && (
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
                  Todos os sistemas operando normalmente. Próxima renovação em {getDaysUntilExpiry(primaryDomain.expires_at)} dias.
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

        {!primaryDomain && (
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

export default UserDashboard;
