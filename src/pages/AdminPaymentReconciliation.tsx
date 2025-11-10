import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, CheckCircle, Clock, DollarSign, RefreshCw } from 'lucide-react';
import AdminPageHeader from '../components/AdminPageHeader';
import PanelLayout from '../components/PanelLayout';

interface ReconciliationLog {
  id: string;
  started_at: string;
  status: string;
  paypal_transactions_checked: number;
  db_orders_checked: number;
  discrepancies_found: number;
  discrepancies_resolved: number;
  execution_time_ms: number;
  error_message?: string;
}

interface Discrepancy {
  id: string;
  discrepancy_type: string;
  paypal_transaction_id: string;
  paypal_amount: number;
  paypal_status: string;
  db_order_id: string | null;
  db_amount: number | null;
  db_status: string | null;
  auto_resolved: boolean;
  resolved_at: string | null;
  notes: string;
  created_at: string;
}

const AdminPaymentReconciliation: React.FC = () => {
  const [logs, setLogs] = useState<ReconciliationLog[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: logsData } = await supabase
      .from('payment_reconciliation_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    const { data: discData } = await supabase
      .from('payment_discrepancies')
      .select('*')
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    setLogs(logsData || []);
    setDiscrepancies(discData || []);
    setLoading(false);
  };

  const runReconciliation = async () => {
    setRunning(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-reconciliation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        alert(`✅ Reconciliação concluída!\n\nDiscrepâncias encontradas: ${result.summary.discrepancies_found}\nAuto-resolvidas: ${result.summary.auto_resolved}\nPendentes: ${result.summary.unresolved}`);
      } else {
        alert(`❌ Erro: ${result.error}`);
      }

      fetchData();
    } catch (error) {
      console.error('Error running reconciliation:', error);
      alert('Erro ao executar reconciliação');
    } finally {
      setRunning(false);
    }
  };

  const resolveDiscrepancy = async (discrepancyId: string) => {
    const notes = prompt('Adicione notas sobre a resolução manual:');
    if (!notes) return;

    const { error } = await supabase.rpc('mark_discrepancy_resolved', {
      p_discrepancy_id: discrepancyId,
      p_resolution_action: 'Manual resolution by admin',
      p_notes: notes
    });

    if (!error) {
      alert('✅ Discrepância marcada como resolvida');
      fetchData();
    } else {
      alert('❌ Erro ao resolver: ' + error.message);
    }
  };

  if (loading) {
    return (
      <PanelLayout>
        <div className="flex items-center justify-center h-screen">
          <Clock className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </PanelLayout>
    );
  }

  const latestLog = logs[0];
  const unresolvedCount = discrepancies.length;

  return (
    <PanelLayout>
      <AdminPageHeader
        title="Payment Reconciliation"
        description="Monitor e resolva discrepâncias entre PayPal e banco de dados"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Última Execução</p>
              <p className="text-lg font-bold">
                {latestLog ? new Date(latestLog.started_at).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A'}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-red-600">{unresolvedCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Auto-Resolvidas</p>
              <p className="text-2xl font-bold text-green-600">
                {latestLog?.discrepancies_resolved || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transações Verificadas</p>
              <p className="text-2xl font-bold">
                {latestLog?.paypal_transactions_checked || 0}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mb-6">
        <button
          onClick={runReconciliation}
          disabled={running}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Executando...' : 'Executar Reconciliação Agora'}
        </button>
        <p className="text-sm text-gray-600 mt-2">
          A reconciliação automática roda a cada 6 horas. Use este botão apenas se necessário.
        </p>
      </div>

      {/* Unresolved Discrepancies */}
      {unresolvedCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Discrepâncias Não Resolvidas ({unresolvedCount})
          </h3>
          <div className="space-y-4">
            {discrepancies.map((disc) => (
              <div key={disc.id} className="bg-white p-4 rounded border border-red-300">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded mr-2">
                      {disc.discrepancy_type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(disc.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <button
                    onClick={() => resolveDiscrepancy(disc.id)}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                  >
                    Resolver Manualmente
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">PayPal Transaction ID:</p>
                    <p className="font-mono text-xs break-all">{disc.paypal_transaction_id}</p>
                    <p className="text-gray-600 mt-2">PayPal Amount:</p>
                    <p className="font-semibold text-green-700">${disc.paypal_amount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">DB Order ID:</p>
                    <p className="font-mono text-xs break-all">{disc.db_order_id || 'N/A'}</p>
                    <p className="text-gray-600 mt-2">DB Amount:</p>
                    <p className="font-semibold">${disc.db_amount?.toFixed(2) || 'N/A'}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                  <strong>Notas:</strong> {disc.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Histórico de Reconciliações</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PayPal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DB</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Encontradas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolvidas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(log.started_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      log.status === 'completed' ? 'bg-green-100 text-green-800' :
                      log.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{log.paypal_transactions_checked}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{log.db_orders_checked}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={log.discrepancies_found > 0 ? 'font-semibold text-red-600' : ''}>
                      {log.discrepancies_found}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {log.discrepancies_resolved}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {(log.execution_time_ms / 1000).toFixed(2)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PanelLayout>
  );
};

export default AdminPaymentReconciliation;
