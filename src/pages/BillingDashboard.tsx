import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  Clock,
  Check,
  XCircle,
  DollarSign,
  RefreshCw,
  FileText,
  ArrowRight
} from 'lucide-react';
import { PanelLayout } from '../components/PanelLayout';
import { PageHeader } from '../components/PageHeader';
import { DomainStatusBadge } from '../components/DomainCardNotification';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface BillingDomain {
  domain_id: string;
  domain_name: string;
  status: string;
  registered_at: string;
  last_payment_at: string | null;
  next_renewal_at: string | null;
  grace_until: string | null;
  redemption_until: string | null;
  monthly_fee_usd: number;
  recovery_fee_usd: number;
  auto_renew: boolean;
  days_until_action: number | null;
  action_required: string;
  latest_payment: any;
  open_invoices_count: number;
}

export default function BillingDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [domains, setDomains] = useState<BillingDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<BillingDomain | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadBillingDashboard();
    }
  }, [user?.id]);

  const loadBillingDashboard = async () => {
    try {
      const { data, error } = await supabase
        .from('user_billing_dashboard')
        .select('*')
        .eq('user_id', user!.id)
        .order('days_until_action', { ascending: true, nullsFirst: false });

      if (error) throw error;

      setDomains(data || []);
    } catch (error) {
      console.error('Error loading billing dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionButton = (domain: BillingDomain) => {
    const colors = {
      renew: 'bg-blue-500 hover:bg-blue-600',
      recover: 'bg-amber-500 hover:bg-amber-600',
      priority_recover: 'bg-red-500 hover:bg-red-600',
      cannot_recover: 'bg-slate-300 cursor-not-allowed',
      none: 'bg-slate-200 cursor-not-allowed'
    };

    const labels = {
      renew: 'Renovar',
      recover: 'Recuperar',
      priority_recover: 'Recuperar com Prioridade',
      cannot_recover: 'Não Recuperável',
      none: 'Ativo'
    };

    const color = colors[domain.action_required as keyof typeof colors] || colors.none;
    const label = labels[domain.action_required as keyof typeof labels] || 'Ver Detalhes';

    return (
      <button
        onClick={() => handleDomainAction(domain)}
        disabled={domain.action_required === 'cannot_recover' || domain.action_required === 'none'}
        className={`${color} text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2`}
      >
        {label}
        {domain.action_required !== 'none' && domain.action_required !== 'cannot_recover' && (
          <ArrowRight className="w-4 h-4" />
        )}
      </button>
    );
  };

  const handleDomainAction = async (domain: BillingDomain) => {
    // Navigate to payment/recovery page
    if (domain.action_required === 'recover' || domain.action_required === 'priority_recover') {
      navigate(`/painel/domains/${domain.domain_id}/recover`);
    } else if (domain.action_required === 'renew') {
      navigate(`/painel/domains/${domain.domain_id}/renew`);
    }
  };

  const getDaysDisplay = (domain: BillingDomain) => {
    if (!domain.days_until_action) return null;

    const days = Math.floor(domain.days_until_action);
    const isUrgent = days <= 7;
    const isCritical = days <= 2;

    const color = isCritical
      ? 'text-red-600'
      : isUrgent
      ? 'text-amber-600'
      : 'text-slate-600';

    return (
      <div className={`flex items-center gap-1 text-sm ${color}`}>
        <Clock className="w-4 h-4" />
        <span className="font-medium">
          {days} {days === 1 ? 'dia' : 'dias'}
        </span>
      </div>
    );
  };

  const getCostDisplay = (domain: BillingDomain) => {
    const needsRecoveryFee = ['redemption', 'registry_hold', 'auction'].includes(domain.status);
    const total = needsRecoveryFee
      ? domain.monthly_fee_usd + domain.recovery_fee_usd
      : domain.monthly_fee_usd;

    return (
      <div className="text-right">
        <div className="font-semibold text-slate-900">
          ${total.toFixed(2)}
        </div>
        {needsRecoveryFee && (
          <div className="text-xs text-slate-500">
            ${domain.monthly_fee_usd} + ${domain.recovery_fee_usd} taxa
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <PanelLayout>
        <PageHeader
          title="Faturamento e Pagamentos"
          subtitle="Gerencie suas assinaturas e domínios"
        />
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-200 h-20 rounded-lg" />
          ))}
        </div>
      </PanelLayout>
    );
  }

  return (
    <PanelLayout>
      <PageHeader
        title="Faturamento e Pagamentos"
        subtitle="Gerencie renovações, recuperações e faturas de domínios"
        action={
          <button
            onClick={() => navigate('/valores')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Ver Planos
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-700">Domínios Ativos</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {domains.filter(d => d.status === 'active').length}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-amber-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-700">Ação Necessária</h3>
          </div>
          <p className="text-3xl font-bold text-amber-600">
            {domains.filter(d => ['recover', 'priority_recover'].includes(d.action_required)).length}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-700">Faturas Abertas</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {domains.reduce((sum, d) => sum + d.open_invoices_count, 0)}
          </p>
        </div>
      </div>

      {/* Domains Table */}
      <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Domínio
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Prazo
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                  Valor
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {domains.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhum domínio encontrado
                  </td>
                </tr>
              ) : (
                domains.map((domain) => (
                  <tr key={domain.domain_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {domain.domain_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          Registrado em {new Date(domain.registered_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <DomainStatusBadge status={domain.status} />
                    </td>
                    <td className="px-6 py-4">
                      {getDaysDisplay(domain)}
                      {domain.next_renewal_at && domain.status === 'active' && (
                        <div className="text-xs text-slate-500 mt-1">
                          Renova em {new Date(domain.next_renewal_at).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      {domain.grace_until && domain.status === 'grace' && (
                        <div className="text-xs text-amber-600 mt-1">
                          Graça até {new Date(domain.grace_until).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      {domain.redemption_until && domain.status === 'redemption' && (
                        <div className="text-xs text-red-600 mt-1">
                          Resgate até {new Date(domain.redemption_until).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getCostDisplay(domain)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {getActionButton(domain)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-3">💡 Entenda os Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-800 mb-1">
              <strong>Ativo:</strong> Domínio funcionando normalmente.
            </p>
            <p className="text-blue-800 mb-1">
              <strong>Período de Graça:</strong> 15 dias após vencimento, sem taxa adicional.
            </p>
          </div>
          <div>
            <p className="text-blue-800 mb-1">
              <strong>Em Resgate:</strong> Dias 16-45, requer taxa de recuperação.
            </p>
            <p className="text-blue-800">
              <strong>Em Leilão:</strong> Após dia 60, prioridade para o proprietário original.
            </p>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
