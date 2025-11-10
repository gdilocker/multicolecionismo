import React, { useEffect, useState } from 'react';
import { Download, CreditCard } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { dbQueries } from '../../../lib/db/queries';

interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
}

const BillingPage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, [user]);

  const loadInvoices = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const customerId = await dbQueries.getCustomerId(user.id);
      if (!customerId) return;

      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id,
          fqdn,
          years,
          total_cents,
          created_at,
          invoices (
            id,
            amount_cents,
            status,
            created_at
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (ordersData) {
        const mappedInvoices: Invoice[] = [];
        ordersData.forEach(order => {
          if (order.invoices && order.invoices.length > 0) {
            order.invoices.forEach((inv: any) => {
              mappedInvoices.push({
                id: inv.id,
                date: inv.created_at,
                description: `Domain Registration - ${order.fqdn} (${order.years} year${order.years > 1 ? 's' : ''})`,
                amount: inv.amount_cents,
                status: inv.status
              });
            });
          } else {
            mappedInvoices.push({
              id: order.id,
              date: order.created_at,
              description: `Domain Registration - ${order.fqdn} (${order.years} year${order.years > 1 ? 's' : ''})`,
              amount: order.total_cents,
              status: 'completed'
            });
          }
        });
        setInvoices(mappedInvoices);
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 pt-24 flex items-center justify-center">
        <p className="text-gray-600">Carregando informações de cobrança...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 pt-24">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cobrança e Faturas</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Plano Atual</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Basic Plan</p>
              <p className="text-2xl font-bold text-gray-900">R$ 49,90/month</p>
              <p className="text-sm text-gray-500 mt-1">5 mailboxes, 25 GB storage</p>
            </div>
            <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Atualizar Método de Pagamento
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Histórico de Faturas</h2>
          </div>
          {invoices.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {invoice.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          invoice.status === 'completed' || invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {invoice.status === 'completed' || invoice.status === 'paid' ? 'Pago' : invoice.status === 'pending' ? 'Pendente' : 'Falhou'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1 ml-auto">
                        <Download className="w-4 h-4" />
                        Baixar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">Nenhuma fatura ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
