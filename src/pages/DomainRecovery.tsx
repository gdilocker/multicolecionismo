import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  DollarSign,
  Calendar,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
  CreditCard
} from 'lucide-react';
import { PanelLayout } from '../components/PanelLayout';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface RecoveryCost {
  domain_id: string;
  domain_name: string;
  status: string;
  days_in_status: number;
  monthly_fee: number;
  recovery_fee: number;
  total_amount: number;
  currency: string;
  can_recover: boolean;
  requires_recovery_fee: boolean;
}

interface Domain {
  id: string;
  fqdn: string;
  registrar_status: string;
  grace_until: string | null;
  redemption_until: string | null;
  created_at: string;
  last_payment_at: string | null;
}

export default function DomainRecovery() {
  const { domainId } = useParams<{ domainId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [domain, setDomain] = useState<Domain | null>(null);
  const [recoveryCost, setRecoveryCost] = useState<RecoveryCost | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && domainId) {
      loadDomainDetails();
    }
  }, [user?.id, domainId]);

  const loadDomainDetails = async () => {
    try {
      // Get domain details
      const { data: domainData, error: domainError } = await supabase
        .from('domains')
        .select('*')
        .eq('id', domainId)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (domainError) throw domainError;
      if (!domainData) {
        setError('Domínio não encontrado ou você não tem permissão para acessá-lo.');
        setLoading(false);
        return;
      }

      setDomain(domainData);

      // Calculate recovery cost
      const { data: costData, error: costError } = await supabase
        .rpc('calculate_recovery_cost', {
          p_domain_id: domainId
        });

      if (costError) throw costError;

      if (!costData.can_recover) {
        setError('Este domínio não pode ser recuperado no momento.');
      }

      setRecoveryCost(costData);
    } catch (error: any) {
      console.error('Error loading domain details:', error);
      setError(error.message || 'Erro ao carregar detalhes do domínio.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!recoveryCost || !domain) return;

    setProcessing(true);
    setError(null);

    try {
      // Create PayPal order for recovery
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-create-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            items: [
              {
                name: `Recuperação de Domínio - ${recoveryCost.domain_name}`,
                quantity: 1,
                unit_amount: {
                  currency_code: 'USD',
                  value: recoveryCost.total_amount.toFixed(2)
                }
              }
            ],
            metadata: {
              domain_id: domainId,
              payment_type: 'recovery',
              includes_recovery_fee: recoveryCost.requires_recovery_fee
            }
          })
        }
      );

      const data = await response.json();

      if (data.approve_url) {
        // Redirect to PayPal
        window.location.href = data.approve_url;
      } else {
        throw new Error('Erro ao criar ordem de pagamento');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <PanelLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </PanelLayout>
    );
  }

  if (error && !recoveryCost) {
    return (
      <PanelLayout>
        <div className="max-w-2xl mx-auto mt-12 bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-900 mb-3">Erro</h2>
          <p className="text-red-800 mb-6">{error}</p>
          <button
            onClick={() => navigate('/painel/billing')}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Voltar para Faturamento
          </button>
        </div>
      </PanelLayout>
    );
  }

  const getStatusConfig = () => {
    if (!domain) return null;

    switch (domain.registrar_status) {
      case 'grace':
        return {
          color: 'amber',
          title: 'Período de Graça',
          message: 'Seu domínio está em período de graça. Você pode reativá-lo sem taxas adicionais.',
          deadline: domain.grace_until
        };
      case 'redemption':
        return {
          color: 'red',
          title: 'Período de Resgate',
          message: 'Domínio suspenso. Taxa de recuperação necessária para reativação.',
          deadline: domain.redemption_until
        };
      case 'registry_hold':
        return {
          color: 'red',
          title: 'Proteção de Registro',
          message: 'Período final antes do leilão. Taxa de recuperação elevada.',
          deadline: null
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <PanelLayout>
      <PageHeader
        title="Recuperar Domínio"
        subtitle={recoveryCost?.domain_name || ''}
      />

      {/* Status Banner */}
      {statusConfig && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-${statusConfig.color}-50 border-2 border-${statusConfig.color}-200 rounded-xl p-6 mb-6`}
        >
          <div className="flex items-start gap-4">
            <AlertCircle className={`w-6 h-6 text-${statusConfig.color}-500 flex-shrink-0 mt-1`} />
            <div className="flex-1">
              <h3 className={`text-lg font-bold text-${statusConfig.color}-900 mb-2`}>
                {statusConfig.title}
              </h3>
              <p className={`text-${statusConfig.color}-800 mb-3`}>
                {statusConfig.message}
              </p>
              {statusConfig.deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className={`w-4 h-4 text-${statusConfig.color}-600`} />
                  <span className={`font-medium text-${statusConfig.color}-900`}>
                    Prazo: {new Date(statusConfig.deadline).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Breakdown */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Detalhes do Pagamento
            </h3>

            <div className="space-y-4">
              {/* Monthly Fee */}
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-slate-900">Renovação Mensal</p>
                    <p className="text-xs text-slate-500">{recoveryCost?.domain_name}</p>
                  </div>
                </div>
                <p className="font-semibold text-slate-900">
                  ${recoveryCost?.monthly_fee.toFixed(2)}
                </p>
              </div>

              {/* Recovery Fee */}
              {recoveryCost?.requires_recovery_fee && (
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-medium text-slate-900">Taxa de Recuperação</p>
                      <p className="text-xs text-slate-500">Reativação do domínio suspenso</p>
                    </div>
                  </div>
                  <p className="font-semibold text-amber-600">
                    +${recoveryCost.recovery_fee.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between py-4 bg-slate-50 rounded-lg px-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <p className="text-lg font-bold text-slate-900">Total a Pagar</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ${recoveryCost?.total_amount.toFixed(2)} USD
                </p>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={processing || !recoveryCost?.can_recover}
              className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="w-6 h-6" />
                  Pagar com PayPal
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* What Happens Next */}
        <div className="space-y-6">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
            <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Após o Pagamento
            </h4>
            <ul className="space-y-3 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Domínio reativado imediatamente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>DNS restaurado automaticamente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Renovação por mais 1 mês</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Bloqueio de transferência por 60 dias (segurança)</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h4 className="font-bold text-blue-900 mb-3">💡 Dica</h4>
            <p className="text-sm text-blue-800 leading-relaxed">
              Para evitar suspensões futuras, mantenha seu método de pagamento atualizado
              e ative a renovação automática no painel de domínios.
            </p>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
