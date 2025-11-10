import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { Mail, Plus, Search, Edit2, Trash2, CheckCircle, XCircle, X, AlertTriangle } from 'lucide-react';

interface EmailAccount {
  id: string;
  email_address: string;
  display_name: string;
  purpose: string;
  status: string;
  created_at: string;
  smtp_config?: any;
}

export default function AdminEmail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    email_address: '',
    display_name: '',
    purpose: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadAccounts();
  }, [user]);

  const loadAccounts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAccounts(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccount.email_address || !newAccount.display_name) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (!newAccount.email_address.endsWith('@com.rich')) {
      alert('O e-mail deve terminar com @com.rich');
      return;
    }

    try {
      const { error } = await supabase
        .from('email_accounts')
        .insert({
          user_id: user!.id,
          email_address: newAccount.email_address,
          display_name: newAccount.display_name,
          purpose: newAccount.purpose,
          status: 'active'
        });

      if (error) throw error;

      alert('Conta institucional criada com sucesso!');
      setShowCreateModal(false);
      setNewAccount({ email_address: '', display_name: '', purpose: '' });
      loadAccounts();
    } catch (error: any) {
      console.error('Error creating account:', error);
      alert(`Erro ao criar conta: ${error.message}`);
    }
  };

  const handleToggleStatus = async (accountId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      const { error } = await supabase
        .from('email_accounts')
        .update({ status: newStatus })
        .eq('id', accountId);

      if (error) throw error;

      alert(newStatus === 'suspended' ? 'Conta suspensa' : 'Conta reativada');
      loadAccounts();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta institucional?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      alert('Conta excluída com sucesso');
      loadAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Erro ao excluir conta');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Ativa
          </span>
        );
      case 'suspended':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Suspensa
          </span>
        );
      default:
        return null;
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.email_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.purpose?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <AdminPageHeader
          title="E-mails Institucionais"
          description="Gerencie contas de envio de e-mail @com.rich (uso interno)"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Sistema de E-mail Institucional</h3>
            <p className="text-sm text-blue-700">
              Estas contas são exclusivas para <strong>envio automático</strong> de e-mails transacionais
              (confirmações, notificações, avisos). Não são webmail de uso pessoal.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-gray-600 text-sm mb-1">Total de Contas</div>
            <div className="text-3xl font-bold text-black">{accounts.length}</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-gray-600 text-sm mb-1">Contas Ativas</div>
            <div className="text-3xl font-bold text-green-600">
              {accounts.filter(a => a.status === 'active').length}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-gray-600 text-sm mb-1">Contas Suspensas</div>
            <div className="text-3xl font-bold text-red-600">
              {accounts.filter(a => a.status === 'suspended').length}
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar contas institucionais..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nova Conta
            </button>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando contas...</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-1">Nenhuma conta encontrada</p>
              <p className="text-gray-500 text-sm">
                {searchQuery ? 'Tente uma busca diferente' : 'Crie a primeira conta institucional'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      E-mail
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome de Exibição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Propósito
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">{account.email_address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{account.display_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{account.purpose || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(account.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(account.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(account.id, account.status)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              account.status === 'active'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {account.status === 'active' ? 'Suspender' : 'Reativar'}
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(account.id)}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-black">Nova Conta Institucional</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail @com.rich *
                </label>
                <input
                  type="text"
                  value={newAccount.email_address}
                  onChange={(e) => setNewAccount({ ...newAccount, email_address: e.target.value })}
                  placeholder="noreply@com.rich"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                />
                <p className="text-xs text-gray-500 mt-1">Ex: noreply@com.rich, contact@com.rich</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome de Exibição *
                </label>
                <input
                  type="text"
                  value={newAccount.display_name}
                  onChange={(e) => setNewAccount({ ...newAccount, display_name: e.target.value })}
                  placeholder="com.rich"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Propósito
                </label>
                <textarea
                  value={newAccount.purpose}
                  onChange={(e) => setNewAccount({ ...newAccount, purpose: e.target.value })}
                  placeholder="Ex: Envio de confirmações de cadastro"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateAccount}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
                >
                  Criar Conta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
