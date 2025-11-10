import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  Eye,
  AlertCircle,
  RefreshCw,
  Users,
  Ban
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { supabase } from '../lib/supabase';

interface Reseller {
  id: string;
  user_id: string;
  affiliate_code: string;
  status: string;
  commission_rate: number;
  total_sales: number;
  total_earnings: number;
  available_balance: number;
  withdrawn_balance: number;
  approved_at: string | null;
  created_at: string;
  user_email?: string;
}

interface PendingWithdrawal {
  id: string;
  affiliate_id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  reseller?: {
    affiliate_code: string;
    user_email: string;
  };
}

export default function AdminResellers() {
  useScrollToTop();
  const navigate = useNavigate();
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar afiliados
      const { data: resellersData, error: resellersError } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (resellersError) throw resellersError;

      // Buscar emails dos customers
      const userIds = resellersData?.map(r => r.user_id) || [];
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, email')
        .in('id', userIds);

      const resellersWithEmails = resellersData?.map((reseller: any) => {
        const customer = customersData?.find(c => c.id === reseller.user_id);
        return {
          ...reseller,
          user_email: customer?.email || 'N/A'
        };
      });
      setResellers(resellersWithEmails || []);

      // Buscar saques pendentes
      const { data: withdrawalsData } = await supabase
        .from('affiliate_withdrawals')
        .select('*, affiliates(affiliate_code)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      const withdrawalsWithReseller = withdrawalsData?.map((w: any) => {
        const reseller = resellersWithEmails?.find(r => r.id === w.affiliate_id);
        return {
          ...w,
          reseller: {
            affiliate_code: w.affiliates?.affiliate_code || 'N/A',
            user_email: reseller?.user_email || 'N/A',
          },
        };
      });
      setWithdrawals(withdrawalsWithReseller || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const updateResellerStatus = async (resellerId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'active' && !resellers.find((r) => r.id === resellerId)?.approved_at) {
        updates.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('affiliates')
        .update(updates)
        .eq('id', resellerId);

      if (error) throw error;

      await fetchData();
      setShowMenu(null);
      alert(`Afiliado ${newStatus === 'active' ? 'aprovado' : 'atualizado'} com sucesso!`);
    } catch (error) {
      console.error('Error updating reseller:', error);
      alert('Erro ao atualizar afiliado');
    }
  };

  const processWithdrawal = async (withdrawalId: string, status: 'completed' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('affiliate_withdrawals')
        .update({
          status,
          processed_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      await fetchData();
      alert(`Saque ${status === 'completed' ? 'aprovado' : 'rejeitado'} com sucesso!`);
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert('Erro ao processar saque');
    }
  };

  const filteredResellers = resellers.filter((reseller) => {
    const matchesSearch =
      reseller.affiliate_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reseller.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reseller.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: resellers.length,
    active: resellers.filter((r) => r.status === 'active').length,
    pending: resellers.filter((r) => r.status === 'pending').length,
    totalEarnings: resellers.reduce((sum, r) => sum + r.total_earnings, 0),
    totalSales: resellers.reduce((sum, r) => sum + r.total_sales, 0),
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F5F5F5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminPageHeader
            title="Afiliados"
            description="Administre afiliados, comissões e saques"
            onRefresh={fetchData}
            refreshing={loading}
          />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Total</p>
              <p className="text-3xl font-bold text-black">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Ativos</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Pendentes</p>
              <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-slate-600" />
                <p className="text-sm text-gray-600">Vendas</p>
              </div>
              <p className="text-2xl font-bold text-black">{stats.totalSales}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <p className="text-sm text-gray-600">Comissões</p>
              </div>
              <p className="text-xl font-bold text-emerald-600">
                ${stats.totalEarnings.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Saques Pendentes */}
          {withdrawals.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <h3 className="text-lg font-bold text-black">
                  Saques Pendentes ({withdrawals.length})
                </h3>
              </div>
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="bg-white rounded-lg p-4 flex items-center justify-between border border-gray-200"
                  >
                    <div>
                      <p className="text-black font-semibold">
                        {withdrawal.reseller?.user_email}
                      </p>
                      <p className="text-sm text-gray-600">
                        {withdrawal.reseller?.affiliate_code} • ${withdrawal.amount.toFixed(2)} via{' '}
                        {withdrawal.payment_method.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(withdrawal.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => processWithdrawal(withdrawal.id, 'completed')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all text-sm font-semibold"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => processWithdrawal(withdrawal.id, 'rejected')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all text-sm font-semibold"
                      >
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por código ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendente</option>
                  <option value="active">Ativo</option>
                  <option value="suspended">Suspenso</option>
                  <option value="terminated">Encerrado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabela de Afiliados */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Email / Código
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Vendas</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Ganhos</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Saldo</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Taxa</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Criado</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredResellers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        Nenhum afiliado encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredResellers.map((reseller) => (
                      <tr key={reseller.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <p className="text-black font-medium">{reseller.user_email}</p>
                          <p className="text-sm text-gray-500 font-mono">{reseller.affiliate_code}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              reseller.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : reseller.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : reseller.status === 'suspended'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {reseller.status === 'active'
                              ? 'ATIVO'
                              : reseller.status === 'pending'
                              ? 'PENDENTE'
                              : reseller.status === 'suspended'
                              ? 'SUSPENSO'
                              : 'ENCERRADO'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-black font-semibold">{reseller.total_sales}</td>
                        <td className="py-4 px-6 text-emerald-600 font-semibold">
                          ${reseller.total_earnings.toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-black font-semibold">
                          ${reseller.available_balance.toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          {(reseller.commission_rate * 100).toFixed(0)}%
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {new Date(reseller.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-4 px-6">
                          <div className="relative">
                            <button
                              onClick={() => setShowMenu(showMenu === reseller.id ? null : reseller.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mx-auto block"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>
                            {showMenu === reseller.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                {reseller.status === 'pending' && (
                                  <button
                                    onClick={() => updateResellerStatus(reseller.id, 'active')}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-green-600 text-sm font-medium flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Aprovar
                                  </button>
                                )}
                                {reseller.status === 'active' && (
                                  <button
                                    onClick={() => updateResellerStatus(reseller.id, 'suspended')}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-amber-600 text-sm font-medium flex items-center gap-2"
                                  >
                                    <Ban className="w-4 h-4" />
                                    Suspender
                                  </button>
                                )}
                                {reseller.status === 'suspended' && (
                                  <button
                                    onClick={() => updateResellerStatus(reseller.id, 'active')}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-green-600 text-sm font-medium flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Reativar
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedReseller(reseller)}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-blue-600 text-sm font-medium flex items-center gap-2 border-t border-gray-200"
                                >
                                  <Eye className="w-4 h-4" />
                                  Ver Detalhes
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

      {/* Modal de Detalhes */}
      {selectedReseller && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedReseller(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
          >
            <h3 className="text-2xl font-bold text-black mb-6">Detalhes do Afiliado</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="text-black font-semibold">{selectedReseller.user_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Código</p>
                  <p className="text-black font-mono font-semibold">{selectedReseller.affiliate_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedReseller.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : selectedReseller.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : selectedReseller.status === 'suspended'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedReseller.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Taxa de Comissão</p>
                  <p className="text-black font-semibold">
                    {(selectedReseller.commission_rate * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Vendas</p>
                  <p className="text-black font-semibold">{selectedReseller.total_sales}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ganhos Totais</p>
                  <p className="text-emerald-600 font-semibold">
                    ${selectedReseller.total_earnings.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Saldo Disponível</p>
                  <p className="text-black font-semibold">
                    ${selectedReseller.available_balance.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Já Sacado</p>
                  <p className="text-black font-semibold">
                    ${selectedReseller.withdrawn_balance.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Criado em</p>
                  <p className="text-black">
                    {new Date(selectedReseller.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                {selectedReseller.approved_at && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Aprovado em</p>
                    <p className="text-black">
                      {new Date(selectedReseller.approved_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedReseller(null)}
                className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all font-semibold"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </PageLayout>
  );
}
