import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Globe,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  FileText,
  Settings,
  Package,
  ArrowUpRight,
  RefreshCw,
  ArrowLeft,
  Crown,
  Shield,
  Server,
  UserCheck,
  MessageSquare,
  Sparkles,
  Award,
  Lock,
  Tag,
  BookOpen,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalDomains: number;
  activeDomains: number;
  pendingOrders: number;
  completedOrders: number;
  monthlyRevenue: number;
  totalRevenue: number;
  serverStatus: 'operational' | 'degraded' | 'down';
  recentAlerts: number;
  totalProfiles: number;
  eliteMembers: number;
  primeMembers: number;
  totalAffiliates: number;
  activeAffiliates: number;
  premiumDomains: number;
  supportTickets: number;
  openTickets: number;
}

interface ActivityItem {
  id: string;
  type: 'domain' | 'user' | 'payment';
  description: string;
  timestamp: string;
  status?: 'success' | 'pending' | 'error';
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalDomains: 0,
    activeDomains: 0,
    pendingOrders: 0,
    completedOrders: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    serverStatus: 'operational',
    recentAlerts: 0,
    totalProfiles: 0,
    eliteMembers: 0,
    primeMembers: 0,
    totalAffiliates: 0,
    activeAffiliates: 0,
    premiumDomains: 0,
    supportTickets: 0,
    openTickets: 0
  });

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [
        customersRes,
        domainsRes,
        ordersRes,
        profilesRes,
        subscriptionsRes,
        affiliatesRes,
        premiumDomainsRes
      ] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact' }),
        supabase.from('domains').select('*', { count: 'exact' }),
        supabase.from('orders').select('*'),
        supabase.from('user_profiles').select('*', { count: 'exact' }),
        supabase.from('subscriptions').select('*, subscription_plans(plan_type)'),
        supabase.from('affiliates').select('*', { count: 'exact' }),
        supabase.from('premium_domains').select('*', { count: 'exact' })
      ]);

      const customers = customersRes.data || [];
      const domains = domainsRes.data || [];
      const orders = ordersRes.data || [];
      const subscriptions = subscriptionsRes.data || [];
      const affiliates = affiliatesRes.data || [];

      const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const activeDomains = domains.filter(d => d.registrar_status === 'active').length;

      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const monthlyOrders = orders.filter(o => new Date(o.created_at) >= firstDayOfMonth);
      const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + (o.total_cents || 0), 0) / 100;
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total_cents || 0), 0) / 100;

      const eliteMembers = subscriptions.filter(s =>
        s.status === 'active' && s.subscription_plans?.plan_type === 'elite'
      ).length;
      const primeMembers = subscriptions.filter(s =>
        s.status === 'active' && s.subscription_plans?.plan_type === 'prime'
      ).length;

      const activeAffiliates = affiliates.filter(a => a.status === 'active').length;

      setStats({
        totalUsers: customers.length,
        activeUsers: customers.filter(c => c.status === 'active').length,
        totalDomains: domains.length,
        activeDomains,
        pendingOrders,
        completedOrders,
        monthlyRevenue,
        totalRevenue,
        serverStatus: 'operational',
        recentAlerts: 0,
        totalProfiles: profilesRes.count || 0,
        eliteMembers,
        primeMembers,
        totalAffiliates: affiliatesRes.count || 0,
        activeAffiliates,
        premiumDomains: premiumDomainsRes.count || 0,
        supportTickets: 0,
        openTickets: 0
      });

      const activities: ActivityItem[] = [];

      customers.slice(0, 3).forEach(c => {
        activities.push({
          id: c.id,
          type: 'user',
          description: `Novo cliente registrado: ${c.email}`,
          timestamp: c.created_at,
          status: 'success'
        });
      });

      domains.slice(0, 3).forEach(d => {
        activities.push({
          id: d.id,
          type: 'domain',
          description: `Domínio registrado: ${d.fqdn}`,
          timestamp: d.created_at,
          status: 'success'
        });
      });

      orders.slice(0, 3).forEach(o => {
        activities.push({
          id: o.id,
          type: 'payment',
          description: `Pagamento ${o.status === 'completed' ? 'recebido' : 'pendente'}: US$ ${((o.total_cents || 0) / 100).toFixed(2)}`,
          timestamp: o.created_at,
          status: o.status === 'completed' ? 'success' : 'pending'
        });
      });

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 10));

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const statCards = [
    {
      title: 'Usuários',
      value: stats.totalUsers.toString(),
      subtitle: `${stats.activeUsers} ativos`,
      icon: Users,
      color: 'from-slate-500 to-slate-700',
      bgColor: 'bg-slate-50',
      iconColor: 'text-slate-600',
      link: '/admin/users'
    },
    {
      title: 'Domínios',
      value: stats.totalDomains.toString(),
      subtitle: `${stats.activeDomains} ativos`,
      icon: Globe,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      link: '/admin/domains'
    },
    {
      title: 'Pedidos Pendentes',
      value: stats.pendingOrders.toString(),
      subtitle: `${stats.completedOrders} completos`,
      icon: Package,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      link: '/admin/orders'
    },
    {
      title: 'Faturamento Total',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      subtitle: `$${stats.monthlyRevenue.toFixed(2)} este mês`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      link: '/admin/orders'
    },
    {
      title: 'Perfis Públicos',
      value: stats.totalProfiles.toString(),
      subtitle: 'Total de perfis',
      icon: UserCheck,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      link: '/admin/profiles'
    },
    {
      title: 'Membros Elite',
      value: stats.eliteMembers.toString(),
      subtitle: `${stats.primeMembers} Prime`,
      icon: Crown,
      color: 'from-yellow-500 to-amber-500',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      link: '/admin/users'
    },
    {
      title: 'Afiliados',
      value: stats.totalAffiliates.toString(),
      subtitle: `${stats.activeAffiliates} ativos`,
      icon: Award,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      link: '/admin/revendedores'
    },
    {
      title: 'Domínios Premium',
      value: stats.premiumDomains.toString(),
      subtitle: 'No catálogo',
      icon: Sparkles,
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      link: '/admin/sugestoes'
    }
  ];

  const quickActionsGestao = [
    { label: 'Gerenciar Usuários', icon: Users, link: '/admin/users' },
    { label: 'Gerenciar Perfis', icon: UserCheck, link: '/admin/profiles' },
    { label: 'Gerenciar Pedidos', icon: Package, link: '/admin/orders' }
  ];

  const quickActionsOperacoes = [
    { label: 'Afiliados', icon: Award, link: '/admin/revendedores' },
    { label: 'Domínios Premium', icon: Tag, link: '/admin/sugestoes' },
    { label: 'Palavras Reservadas', icon: Lock, link: '/admin/reserved-keywords' },
    { label: 'Marcas Protegidas', icon: Shield, link: '/admin/protected-brands' },
    { label: 'Moderação de Links', icon: Shield, link: '/admin/link-moderation' }
  ];

  const quickActionsSistema = [
    { label: 'Ver Logs do Sistema', icon: FileText, link: '/admin/logs' },
    { label: 'Configurações Gerais', icon: Settings, link: '/admin/settings' },
    { label: 'Gerenciar Chatbot', icon: MessageSquare, link: '/admin/chatbot' }
  ];

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-700 font-medium">Carregando painel administrativo...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F5F5F5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-300 bg-white"
                  title="Voltar para Home"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-black">Painel Administrativo</h1>
                  <p className="text-gray-600 mt-1">Visão completa do sistema</p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={card.link}>
                  <div className="group bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`${card.bgColor} p-3 rounded-xl`}>
                        <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{card.title}</p>
                    <p className="text-2xl font-bold text-black mb-1">{card.value}</p>
                    <p className="text-xs text-gray-500 font-medium">{card.subtitle}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-black">Atividade Recente</h3>
                  </div>
                </div>
                <div className="p-6 max-h-[600px] overflow-y-auto">
                  <div className="space-y-3">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                        >
                          <div className={`p-2.5 rounded-lg ${
                            activity.type === 'user' ? 'bg-slate-100' :
                            activity.type === 'domain' ? 'bg-emerald-100' :
                            'bg-green-100'
                          }`}>
                            {activity.type === 'user' && <Users className="w-4 h-4 text-slate-600" />}
                            {activity.type === 'domain' && <Globe className="w-4 h-4 text-emerald-600" />}
                            {activity.type === 'payment' && <CreditCard className="w-4 h-4 text-green-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-black mb-1">{activity.description}</p>
                            <p className="text-xs text-gray-500 font-medium">
                              {new Date(activity.timestamp).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          {activity.status && (
                            <div>
                              {activity.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                              {activity.status === 'pending' && <Clock className="w-5 h-5 text-amber-500" />}
                              {activity.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Activity className="w-8 h-8 text-gray-400" />
                        </div>
                        <h4 className="text-lg font-bold text-black mb-2">Nenhuma atividade recente</h4>
                        <p className="text-sm text-gray-500">As atividades do sistema aparecerão aqui</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Zap className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-black">Ações Rápidas</h3>
                  </div>
                </div>
                <div className="p-4">
                  {/* Gestão */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 px-2">Gestão</p>
                    <div className="space-y-1">
                      {quickActionsGestao.map((action) => (
                        <Link
                          key={action.label}
                          to={action.link}
                          className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                        >
                          <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                            <action.icon className="w-4 h-4 text-slate-600" />
                          </div>
                          <span className="flex-1 text-sm font-semibold text-gray-700 group-hover:text-black transition-colors">
                            {action.label}
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Operações */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 px-2">Operações</p>
                    <div className="space-y-1">
                      {quickActionsOperacoes.map((action) => (
                        <Link
                          key={action.label}
                          to={action.link}
                          className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                        >
                          <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <action.icon className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="flex-1 text-sm font-semibold text-gray-700 group-hover:text-black transition-colors">
                            {action.label}
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Sistema */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 px-2">Sistema</p>
                    <div className="space-y-1">
                      {quickActionsSistema.map((action) => (
                        <Link
                          key={action.label}
                          to={action.link}
                          className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                        >
                          <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                            <action.icon className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="flex-1 text-sm font-semibold text-gray-700 group-hover:text-black transition-colors">
                            {action.label}
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Resources */}
          <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-emerald-50 border-2 border-gray-200 rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-black mb-2">Recursos do Sistema Com.rich</h3>
                <p className="text-gray-700">Plataforma completa para gestão de domínios premium, perfis digitais e sistema de afiliados</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Globe className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-black">Domínios</h4>
                </div>
                <p className="text-sm text-gray-600">Registro automático de domínios, gestão completa de DNS e coleção de domínios premium</p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-black">Perfis Públicos</h4>
                </div>
                <p className="text-sm text-gray-600">Sistema completo de perfis digitais com temas personalizáveis, links sociais e analytics</p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Crown className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h4 className="font-bold text-black">Planos Prime & Elite</h4>
                </div>
                <p className="text-sm text-gray-600">Planos de assinatura com recursos premium e comissões diferenciadas para afiliados</p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="font-bold text-black">Sistema de Afiliados</h4>
                </div>
                <p className="text-sm text-gray-600">Comissões de 25% (Prime) e 50% (Elite & Supreme) com rastreamento de cliques e conversões</p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <Sparkles className="w-5 h-5 text-cyan-600" />
                  </div>
                  <h4 className="font-bold text-black">Domínios Premium</h4>
                </div>
                <p className="text-sm text-gray-600">Coleção exclusiva com preços personalizados e gestão de inventário premium</p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Lock className="w-5 h-5 text-red-600" />
                  </div>
                  <h4 className="font-bold text-black">Segurança Avançada</h4>
                </div>
                <p className="text-sm text-gray-600">RLS policies, autenticação Supabase, keywords reservadas e proteção de dados</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
