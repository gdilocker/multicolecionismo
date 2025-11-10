import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  Loader2,
  RefreshCw,
  Eye,
  Download,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface Order {
  id: string;
  customer_id: string;
  fqdn: string;
  years: number;
  plan: string;
  total_cents: number;
  status: string;
  created_at: string;
  customer_email?: string;
}

const STATUS_COLORS = {
  created: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: 'Criado' },
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Pendente' },
  processing: { bg: 'bg-slate-50', text: 'text-slate-900', border: 'border-slate-200', label: 'Processando' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Completo' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Falhou' },
  cancelled: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: 'Cancelado' }
};

export default function AdminOrders() {
  useScrollToTop();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showActions, setShowActions] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, customer:customers(email)')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const enrichedOrders = (ordersData || []).map(order => ({
        ...order,
        customer_email: order.customer?.email || 'N/A'
      }));

      setOrders(enrichedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      alert(`Status alterado para: ${STATUS_COLORS[newStatus as keyof typeof STATUS_COLORS]?.label || newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao alterar status');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.fqdn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending' || o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue: orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.total_cents || 0), 0) / 100
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F5F5F5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminPageHeader
            title="Gerenciar Pedidos"
            description="Acompanhe e gerencie todos os pedidos do sistema"
            onRefresh={fetchOrders}
            refreshing={loading}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Total de Pedidos</p>
              <p className="text-3xl font-bold text-black">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Pendentes</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Completos</p>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Receita Total</p>
              <p className="text-3xl font-bold text-slate-900">R$ {stats.revenue.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por domínio ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                >
                  <option value="all">Todos os Status</option>
                  <option value="created">Criado</option>
                  <option value="pending">Pendente</option>
                  <option value="processing">Processando</option>
                  <option value="completed">Completo</option>
                  <option value="failed">Falhou</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] mx-auto" />
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        Nenhum pedido encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-black">{order.fqdn}</p>
                            <p className="text-xs text-gray-500">{order.id.slice(0, 8)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {order.customer_email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {order.plan} ({order.years} {order.years === 1 ? 'ano' : 'anos'})
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          R$ {((order.total_cents || 0) / 100).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`text-xs px-3 py-1 rounded-full border-2 font-medium ${
                              STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]?.bg || 'bg-gray-50'
                            } ${
                              STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]?.text || 'text-gray-700'
                            } ${
                              STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]?.border || 'border-gray-200'
                            }`}
                          >
                            <option value="created">Criado</option>
                            <option value="pending">Pendente</option>
                            <option value="processing">Processando</option>
                            <option value="completed">Completo</option>
                            <option value="failed">Falhou</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
