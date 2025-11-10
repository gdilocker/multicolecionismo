import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ProfileSwitcher } from '../components/ProfileSwitcher';
import { TrialOnboardingWizard } from '../components/TrialOnboardingWizard';
import {
  Package,
  Globe,
  CreditCard,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';

interface Order {
  id: string;
  fqdn: string;
  status: string;
  total_cents: number;
  created_at: string;
}

interface DomainRecord {
  id: string;
  fqdn: string;
  registrar_status: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!customer) {
          setLoading(false);
          return;
        }

        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false });

        const { data: domainsData } = await supabase
          .from('domains')
          .select('*')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false });

        setOrders(ordersData || []);
        setDomains(domainsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'registered':
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'processing': return 'Processando';
      case 'registered': return 'Registrado';
      case 'failed': return 'Falhou';
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'expired': return 'Expirado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pt-16">
      {/* Trial Onboarding Wizard */}
      <TrialOnboardingWizard />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Área do Cliente</h1>
              <p className="text-gray-600">Gerencie seus domínios e pedidos</p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Novo Domínio
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Switcher (only shows if user has multiple profiles) */}
        <ProfileSwitcher />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Globe className="w-8 h-8 text-slate-900" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Domínios</p>
                <p className="text-2xl font-bold text-gray-900">
                  {domains.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-slate-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Gasto</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${orders.reduce((sum, order) => sum + (order.total_cents / 100), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/app/orders"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <Package className="w-10 h-10 text-slate-900" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Meus Pedidos</h3>
                <p className="text-gray-600">Visualizar histórico de pedidos</p>
              </div>
            </div>
          </Link>

          <Link
            to="/app/domains"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <Globe className="w-10 h-10 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Meus Domínios</h3>
                <p className="text-gray-600">Gerenciar DNS e configurações</p>
              </div>
            </div>
          </Link>

          <Link
            to="/app/billing"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <CreditCard className="w-10 h-10 text-slate-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Faturamento</h3>
                <p className="text-gray-600">Histórico de pagamentos</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Pedidos Recentes</h3>
                <Link
                  to="/app/orders"
                  className="text-sm text-slate-900 hover:text-slate-900"
                >
                  Ver todos
                </Link>
              </div>
            </div>
            <div className="p-6">
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum pedido encontrado</p>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(order.status)}
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{order.fqdn}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${(order.total_cents / 100).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {getStatusText(order.status)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Domains */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Domínios Ativos</h3>
                <Link
                  to="/app/domains"
                  className="text-sm text-slate-900 hover:text-slate-900"
                >
                  Ver todos
                </Link>
              </div>
            </div>
            <div className="p-6">
              {domains.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum domínio encontrado</p>
              ) : (
                <div className="space-y-4">
                  {domains.slice(0, 3).map((domain) => (
                    <div key={domain.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(domain.registrar_status || 'pending')}
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{domain.fqdn}</p>
                          <p className="text-sm text-gray-500">
                            {domain.expires_at ? `Expira em ${new Date(domain.expires_at).toLocaleDateString('pt-BR')}` : 'Data de expiração não definida'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {getStatusText(domain.registrar_status || 'pending')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}