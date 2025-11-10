import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Shield,
  Ban,
  CheckCircle,
  Mail,
  Calendar,
  Loader2,
  RefreshCw,
  Edit,
  Trash2,
  UserCog
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface Customer {
  id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  domains?: number;
  orders?: number;
}

export default function AdminUsers() {
  useScrollToTop();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showActions, setShowActions] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      const { data: domainsData } = await supabase
        .from('domains')
        .select('customer_id');

      const { data: ordersData } = await supabase
        .from('orders')
        .select('customer_id');

      const enrichedCustomers = (customersData || []).map(customer => {
        const domainsCount = domainsData?.filter(d => d.customer_id === customer.id).length || 0;
        const ordersCount = ordersData?.filter(o => o.customer_id === customer.id).length || 0;

        return {
          ...customer,
          domains: domainsCount,
          orders: ordersCount
        };
      });

      setCustomers(enrichedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      alert('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (customerId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ role: newRole })
        .eq('id', customerId);

      if (error) throw error;

      alert(`Função alterada para ${newRole === 'admin' ? 'Administrador' : 'Usuário'}`);
      fetchCustomers();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Erro ao alterar função');
    }
  };

  const handleDeleteUser = async (customerId: string, email: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${email}?\n\nISTO IRÁ REMOVER TODOS OS DOMÍNIOS E PEDIDOS ASSOCIADOS!`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      alert('Usuário excluído com sucesso');
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erro ao excluir usuário');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || customer.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: customers.length,
    admins: customers.filter(c => c.role === 'admin').length,
    users: customers.filter(c => c.role === 'user').length,
    withDomains: customers.filter(c => c.domains && c.domains > 0).length
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F5F5F5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminPageHeader
            title="Gerenciar Usuários"
            description="Administre contas e permissões dos usuários"
            onRefresh={fetchCustomers}
            refreshing={loading}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Total de Usuários</p>
              <p className="text-3xl font-bold text-black">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Administradores</p>
              <p className="text-3xl font-bold text-slate-900">{stats.admins}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Usuários Comuns</p>
              <p className="text-3xl font-bold text-gray-600">{stats.users}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Com Domínios</p>
              <p className="text-3xl font-bold text-green-600">{stats.withDomains}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                >
                  <option value="all">Todas as Funções</option>
                  <option value="user">Usuários</option>
                  <option value="admin">Administradores</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Usuário
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Função
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Domínios
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Pedidos
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Cadastro
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] mx-auto" />
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-900 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-black">{customer.email}</p>
                              <p className="text-xs text-gray-500">ID: {customer.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={customer.role}
                            onChange={(e) => handleRoleChange(customer.id, e.target.value)}
                            className={`text-sm px-3 py-1 rounded-full border-2 font-medium ${
                              customer.role === 'admin'
                                ? 'bg-slate-50 text-slate-700 border-slate-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            <option value="user">Usuário</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {customer.domains || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {customer.orders || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block">
                            <button
                              onClick={() => setShowActions(showActions === customer.id ? null : customer.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>
                            {showActions === customer.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                <button
                                  onClick={() => {
                                    handleDeleteUser(customer.id, customer.email);
                                    setShowActions(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Excluir Usuário
                                </button>
                              </div>
                            )}
                          </div>
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
