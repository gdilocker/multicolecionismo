import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign
} from 'lucide-react';
import { PanelLayout } from '../components/PanelLayout';
import { PageHeader } from '../components/PageHeader';
import { PlanDowngradeModal } from '../components/PlanDowngradeModal';
import { PlanChangeValidator, PlanChangeBlockedMessage } from '../components/PlanChangeValidator';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  method: string;
  invoiceUrl: string;
}

interface Domain {
  id: string;
  fqdn: string;
}

interface ActiveSubscription {
  id: string;
  plan_id: string;
  plan_name: string;
  plan_type: string;
  price: number;
  status: string;
  current_period_end: string;
}

interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_type: string;
  price_usd: number;
}

const Billing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [premiumDomains, setPremiumDomains] = useState<any[]>([]);
  const [changingPlan, setChangingPlan] = useState(false);
  const [validatingPlan, setValidatingPlan] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const primaryDomain = domains[0];

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
        console.warn('[Billing] Timeout reached, stopping loading');
        if (isMounted) setLoading(false);
      }, 8000);

      try {
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        const customerId = customerData?.id;

        // Fetch active subscription (outside customerId check)
        const { data: subscriptionData, error: subError } = await supabase
          .from('subscriptions')
          .select(`
            id,
            plan_id,
            status,
            next_billing_date,
            subscription_plans (
              id,
              plan_name,
              plan_type,
              price_usd
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (subError) {
          console.error('Error fetching subscription:', subError);
        }

        if (subscriptionData && subscriptionData.subscription_plans && isMounted) {
          console.log('Subscription found:', subscriptionData);
          setActiveSubscription({
            id: subscriptionData.id,
            plan_id: subscriptionData.plan_id,
            plan_name: subscriptionData.subscription_plans.plan_name,
            plan_type: subscriptionData.subscription_plans.plan_type,
            price: subscriptionData.subscription_plans.price_usd,
            status: subscriptionData.status,
            current_period_end: subscriptionData.next_billing_date
          });
        } else {
          console.log('No active subscription found');
        }

        // Fetch available plans (exclude Supreme - it's not a subscription plan)
        const { data: plansData, error: plansError } = await supabase
          .from('subscription_plans')
          .select('id, plan_name, plan_type, price_usd')
          .eq('is_active', true)
          .neq('plan_type', 'supreme')
          .order('price_usd', { ascending: true });

        if (plansError) {
          console.error('Error fetching plans:', plansError);
        } else {
          setAvailablePlans(plansData || []);
        }

        if (customerId) {
          // Fetch domains
          const { data: domainsData } = await supabase
            .from('domains')
            .select('*')
            .eq('customer_id', customerId)
            .eq('registrar_status', 'active')
            .order('created_at', { ascending: false });

          setDomains(domainsData || []);
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

  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user?.id) return;

      try {
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        const customerId = customerData?.id;

        if (customerId) {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', customerId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false });

          if (ordersData && ordersData.length > 0) {
            const formattedInvoices = ordersData.map((order) => ({
              id: order.id,
              date: order.created_at,
              amount: (order.total_cents || 0) / 100,
              status: 'paid' as const,
              method: order.payment_method === 'paypal' ? 'PayPal' : 'Cartão de Crédito',
              invoiceUrl: '#'
            }));
            setInvoices(formattedInvoices);
          }
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
      }
    };

    fetchInvoices();
  }, [user?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'expired':
      case 'failed':
        return <XCircle className="w-5 h-5 text-slate-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: { text: 'Ativo', color: 'text-emerald-600 bg-emerald-50' },
      pending: { text: 'Pendente', color: 'text-amber-600 bg-amber-50' },
      expired: { text: 'Expirado', color: 'text-slate-600 bg-slate-50' },
      paid: { text: 'Pago', color: 'text-emerald-600 bg-emerald-50' },
      failed: { text: 'Falhou', color: 'text-slate-600 bg-slate-50' }
    };
    return labels[status as keyof typeof labels] || { text: status, color: 'text-slate-600 bg-slate-50' };
  };

  const handleViewDetails = (domainId: string) => {
    window.location.href = `/panel/domains/${domainId}`;
  };

  const handleRenew = (domainId: string) => {
    window.location.href = `/panel/domains/${domainId}`;
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Você precisa estar autenticado para baixar a fatura');
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = `${supabaseUrl}/functions/v1/generate-invoice-pdf?orderId=${invoiceId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar fatura');
      }

      const html = await response.text();

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();

        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Erro ao baixar fatura. Tente novamente.');
    }
  };

  const handlePlanChange = async (newPlan: SubscriptionPlan) => {
    if (!user?.id || !activeSubscription) return;

    // Step 1: Validate plan change eligibility
    setValidatingPlan(true);
    setSelectedPlan(newPlan);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-plan-change`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            newPlanId: newPlan.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Falha ao validar mudança de plano');
      }

      const validation = await response.json();
      setValidationResult(validation);
      setValidatingPlan(false);

      // If not eligible, show error message
      if (!validation.eligible) {
        return;
      }

      // Step 2: If eligible, check for downgrade scenarios
      const isDowngrade =
        activeSubscription.plan_type === 'elite' && newPlan.plan_type === 'prime';

      if (isDowngrade) {
        // Check for premium domains first
        try {
          const { data: premiumDomainsData, error } = await supabase
            .rpc('get_user_premium_domains', { p_user_id: user.id });

          if (error) {
            console.error('Error checking premium domains:', error);
            alert('Erro ao verificar domínios premium. Tente novamente.');
            return;
          }

          const activePremium = premiumDomainsData?.filter(
            (d: any) => d.current_status === 'active'
          ) || [];

          if (activePremium.length > 0) {
            // Show confirmation modal
            setPremiumDomains(activePremium);
            setShowDowngradeModal(true);
            return;
          }
        } catch (error) {
          console.error('Error checking premium domains:', error);
          alert('Erro ao verificar domínios premium. Tente novamente.');
          return;
        }
      }

      // Step 3: All checks passed, proceed with plan change
      await executePlanChange(newPlan);
    } catch (error) {
      console.error('Error validating plan change:', error);
      alert('Erro ao validar mudança de plano. Tente novamente.');
      setValidatingPlan(false);
    }
  };

  const executePlanChange = async (newPlan: SubscriptionPlan) => {
    if (!user?.id || !activeSubscription) return;

    setChangingPlan(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = `${supabaseUrl}/functions/v1/handle-plan-change`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          subscriptionId: activeSubscription.id,
          newPlanId: newPlan.id,
          reason: 'user_initiated',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao alterar plano');
      }

      alert(result.message || 'Plano alterado com sucesso!');

      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error changing plan:', error);
      alert(error instanceof Error ? error.message : 'Erro ao alterar plano. Tente novamente.');
    } finally {
      setChangingPlan(false);
      setShowDowngradeModal(false);
    }
  };

  const handleDowngradeConfirm = async () => {
    if (!selectedPlan) return;
    await executePlanChange(selectedPlan);
  };

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Faturamento e Assinaturas"
          subtitle="Gerenciamento de planos e pagamentos"
          primaryAction={
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/valores')}
              className="btn-fluid inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-xl font-semibold shadow-lg shadow-slate-500/30 hover:shadow-slate-500/50 transition-all"
            >
              <ArrowUpCircle className="w-5 h-5" />
              Atualizar Plano
            </motion.button>
          }
        />

        {/* Downgrade Modal */}
        {selectedPlan && (
          <PlanDowngradeModal
            isOpen={showDowngradeModal}
            onClose={() => {
              setShowDowngradeModal(false);
              setSelectedPlan(null);
              setPremiumDomains([]);
            }}
            onConfirm={handleDowngradeConfirm}
            currentPlan={activeSubscription?.plan_name || ''}
            newPlan={selectedPlan.plan_name}
            premiumDomains={premiumDomains.map((d: any) => ({
              fqdn: d.fqdn,
              price_usd: d.price_usd,
            }))}
            loading={changingPlan}
          />
        )}

        {activeSubscription ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    {activeSubscription.plan_name}
                  </h2>
                  {user?.role === 'admin' ? (
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-slate-900 mb-2">
                        $0.00
                        <span className="text-lg text-slate-500">/mês</span>
                      </div>
                      <span className="inline-block px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-lg shadow-md">
                        Admin Vitalício
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <div className="text-3xl font-bold text-slate-900">
                        ${activeSubscription.price.toFixed(2)}
                        <span className="text-lg text-slate-500">/mês</span>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg">
                        Ativo
                      </span>
                    </div>
                  )}
                  {user?.role !== 'admin' && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-5 h-5" />
                      <span>
                        Próxima renovação em {new Date(activeSubscription.current_period_end).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Plan Switcher - Hidden for Admin */}
            {user?.role !== 'admin' && availablePlans.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Alterar Plano</h2>

                {/* Validation Result Message */}
                {validationResult && !validationResult.eligible && (
                  <div className="mb-6">
                    <PlanChangeBlockedMessage
                      reason={validationResult.reason}
                      message={validationResult.message}
                      balance_due={validationResult.balance_due}
                      days_remaining={validationResult.days_remaining}
                      next_change_available={validationResult.next_change_available}
                    />
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {availablePlans
                    .filter((plan) => plan.id !== activeSubscription.plan_id)
                    .map((plan) => {
                      const isUpgrade =
                        (activeSubscription.plan_type === 'prime' && plan.plan_type === 'elite');
                      const isDowngrade =
                        (activeSubscription.plan_type === 'elite' && plan.plan_type === 'prime');

                      return (
                        <motion.div
                          key={plan.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="relative group"
                        >
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-400/20 to-slate-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
                          <div className="relative bg-white border-2 border-slate-200 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-bold text-slate-800">{plan.plan_name}</h3>
                              {isUpgrade && (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                                  UPGRADE
                                </span>
                              )}
                              {isDowngrade && (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                                  DOWNGRADE
                                </span>
                              )}
                            </div>
                            <div className="text-3xl font-bold text-slate-900 mb-4">
                              ${plan.price_usd.toFixed(2)}
                              <span className="text-lg text-slate-500">/mês</span>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handlePlanChange(plan)}
                              disabled={changingPlan || validatingPlan || (validationResult && !validationResult.eligible)}
                              className={`w-full px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                isUpgrade
                                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {validatingPlan ? (
                                'Validando...'
                              ) : isUpgrade ? (
                                <>
                                  <ArrowUpCircle className="w-5 h-5" />
                                  Fazer Upgrade
                                </>
                              ) : (
                                <>
                                  <ArrowDownCircle className="w-5 h-5" />
                                  Fazer Downgrade
                                </>
                              )}
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        ) : primaryDomain ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Plano Básico
                  </h2>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-3xl font-bold text-slate-900">
                      $2.00
                      <span className="text-lg text-slate-500">/ano</span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg">
                      Ativo
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-5 h-5" />
                    <span>
                      Próxima renovação em 1 ano
                    </span>
                  </div>
                </div>
                <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-white" />
                </div>
              </div>
            </motion.div>

            {primaryDomain && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Meus Domínios</h2>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500/20 to-slate-700/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
                  <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">{primaryDomain.fqdn}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <span className="px-2 py-1 rounded text-xs font-medium text-emerald-600 bg-emerald-50">
                              Ativo
                            </span>
                            <span className="text-sm text-slate-500">Domínio Registrado</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-800">$25.00</div>
                        <div className="text-sm text-slate-500">por ano</div>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleViewDetails(primaryDomain.id)}
                            className="px-4 py-2 text-sm border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Ver Detalhes
                          </button>
                          <button
                            onClick={() => handleRenew(primaryDomain.id)}
                            className="px-4 py-2 text-sm bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
                          >
                            Renovar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-12 bg-white border border-slate-200 rounded-2xl mb-8">
            <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Nenhum plano ativo</h2>
            <p className="text-slate-600">
              Você precisa ter um domínio para gerenciar assinaturas.
            </p>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Histórico de Pagamentos</h2>
          {invoices.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum pagamento registrado</h3>
              <p className="text-slate-600">
                Seu histórico de pagamentos aparecerá aqui quando você concluir transações.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Fatura</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Data</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Valor</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Método</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((invoice) => {
                      const statusInfo = getStatusLabel(invoice.status);

                      return (
                        <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm text-slate-800">{invoice.id}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {new Date(invoice.date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            ${(invoice.amount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{invoice.method}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(invoice.status)}
                              <span className={`px-3 py-1 rounded-lg text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.text}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDownloadInvoice(invoice.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Baixar
                            </motion.button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </PanelLayout>
  );
};

export default Billing;
