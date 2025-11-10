import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Clock,
  Shield,
  Gavel,
  Trash2,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DomainLifecycleTimelineProps {
  domainId: string;
  fqdn: string;
}

interface DomainStatus {
  registrar_status: string;
  expires_at: string;
  grace_until?: string;
  redemption_until?: string;
  registry_hold_until?: string;
  auction_until?: string;
  pending_delete_until?: string;
  suspension_reason?: string;
  recovery_fee_applied: boolean;
  late_fee_amount: number;
  locked_until?: string;
}

interface RecoveryCost {
  period_type: string;
  monthly_cost: number;
  recovery_fee: number;
  total_cost: number;
  can_recover: boolean;
}

export function DomainLifecycleTimeline({ domainId, fqdn }: DomainLifecycleTimelineProps) {
  const [status, setStatus] = useState<DomainStatus | null>(null);
  const [recoveryCost, setRecoveryCost] = useState<RecoveryCost | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    fetchDomainStatus();
  }, [domainId]);

  const fetchDomainStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('id', domainId)
        .single();

      if (error) throw error;

      setStatus(data);

      // If domain is in recoverable state, fetch recovery cost
      if (['grace', 'redemption', 'registry_hold'].includes(data.registrar_status)) {
        const { data: costData } = await supabase
          .rpc('calculate_recovery_cost', { p_domain_id: domainId });

        if (costData && !costData.error) {
          setRecoveryCost(costData);
        }
      }
    } catch (error) {
      console.error('Error fetching domain status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    if (!recoveryCost) return;

    setRecovering(true);
    try {
      // Redirect to payment page with recovery intent
      window.location.href = `/panel/domains/${domainId}/recover`;
    } catch (error) {
      console.error('Error initiating recovery:', error);
      alert('Erro ao iniciar recuperação. Tente novamente.');
    } finally {
      setRecovering(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-slate-200 rounded-lg"></div>
        <div className="h-32 bg-slate-200 rounded-lg"></div>
      </div>
    );
  }

  if (!status) return null;

  const getStatusInfo = () => {
    const daysUntil = (date: string) => {
      const diff = new Date(date).getTime() - Date.now();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    switch (status.registrar_status) {
      case 'active':
        return {
          title: 'Domínio Ativo',
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          color: 'green',
          message: 'Seu domínio está totalmente operacional.',
          showTimeline: false
        };

      case 'grace':
        const graceDays = status.grace_until ? daysUntil(status.grace_until) : 0;
        return {
          title: 'Período de Graça',
          icon: <Clock className="w-6 h-6 text-amber-500" />,
          color: 'amber',
          message: `Seu pagamento falhou. Você tem ${graceDays} dias para regularizar sem taxas adicionais.`,
          deadline: status.grace_until,
          urgency: graceDays <= 5 ? 'high' : 'medium',
          showTimeline: true
        };

      case 'redemption':
        const redemptionDays = status.redemption_until ? daysUntil(status.redemption_until) : 0;
        return {
          title: 'Período de Resgate',
          icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
          color: 'orange',
          message: `Seu domínio está suspenso. ${redemptionDays} dias restantes para recuperar com taxa de resgate.`,
          deadline: status.redemption_until,
          urgency: 'high',
          showTimeline: true,
          canRecover: true
        };

      case 'registry_hold':
        return {
          title: 'Proteção do Registro',
          icon: <Shield className="w-6 h-6 text-red-500" />,
          color: 'red',
          message: 'Período de proteção antes do leilão. Entre em contato com o suporte para recuperação.',
          deadline: status.registry_hold_until,
          urgency: 'critical',
          showTimeline: true
        };

      case 'auction':
        const priorityActive = status.original_owner_priority_until &&
          new Date(status.original_owner_priority_until) > new Date();
        return {
          title: priorityActive ? 'Leilão - Prioridade do Dono' : 'Em Leilão',
          icon: <Gavel className="w-6 h-6 text-red-500" />,
          color: 'red',
          message: priorityActive
            ? 'Você ainda tem prioridade para recuperar seu domínio antes de ofertas públicas.'
            : 'Seu domínio está disponível para leilão público.',
          deadline: status.auction_until,
          urgency: 'critical',
          showTimeline: true
        };

      case 'pending_delete':
        return {
          title: 'Aguardando Exclusão',
          icon: <Trash2 className="w-6 h-6 text-slate-500" />,
          color: 'slate',
          message: 'Domínio em processo final de exclusão. Não é mais possível recuperar.',
          deadline: status.pending_delete_until,
          urgency: 'critical',
          showTimeline: true
        };

      case 'dispute_hold':
        return {
          title: 'Em Disputa',
          icon: <AlertCircle className="w-6 h-6 text-red-500" />,
          color: 'red',
          message: 'Domínio suspenso por chargeback ou investigação de fraude. Entre em contato com o suporte.',
          showTimeline: false
        };

      default:
        return {
          title: status.registrar_status,
          icon: <AlertCircle className="w-6 h-6" />,
          color: 'slate',
          message: 'Status desconhecido',
          showTimeline: false
        };
    }
  };

  const statusInfo = getStatusInfo();

  const urgencyColors = {
    high: 'bg-red-50 border-red-200',
    medium: 'bg-amber-50 border-amber-200',
    critical: 'bg-red-100 border-red-300'
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border-2 rounded-xl p-6 ${
          statusInfo.urgency
            ? urgencyColors[statusInfo.urgency as keyof typeof urgencyColors]
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {statusInfo.icon}
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="text-xl font-bold text-slate-800">
              {statusInfo.title}
            </h3>
            <p className="text-slate-700 leading-relaxed">
              {statusInfo.message}
            </p>

            {statusInfo.deadline && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Prazo:{' '}
                  {new Date(statusInfo.deadline).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}

            {status.suspension_reason && (
              <div className="text-sm text-slate-600 italic">
                Motivo: {status.suspension_reason}
              </div>
            )}
          </div>
        </div>

        {/* Recovery Action */}
        {statusInfo.canRecover && recoveryCost && (
          <div className="mt-6 pt-6 border-t border-slate-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Custo de Recuperação</p>
                  <p className="text-sm text-slate-600">
                    Mensalidade + taxa de resgate
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">
                    ${recoveryCost.total_cost.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">
                    (${recoveryCost.monthly_cost.toFixed(2)} + $
                    {recoveryCost.recovery_fee.toFixed(2)} taxa)
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRecover}
                disabled={recovering}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <DollarSign className="w-5 h-5" />
                {recovering ? 'Processando...' : 'Recuperar Domínio Agora'}
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Timeline (if applicable) */}
      {statusInfo.showTimeline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-xl p-6"
        >
          <h4 className="text-lg font-bold text-slate-800 mb-4">
            Ciclo de Vida do Domínio
          </h4>

          <div className="space-y-4">
            <TimelineItem
              label="Dia 0-15: Período de Graça"
              active={status.registrar_status === 'grace'}
              completed={['redemption', 'registry_hold', 'auction', 'pending_delete'].includes(
                status.registrar_status
              )}
              description="Serviços ativos, sem taxa adicional"
            />

            <TimelineItem
              label="Dia 16-45: Resgate"
              active={status.registrar_status === 'redemption'}
              completed={['registry_hold', 'auction', 'pending_delete'].includes(
                status.registrar_status
              )}
              description="Domínio suspenso, taxa de recuperação"
            />

            <TimelineItem
              label="Dia 46-60: Proteção do Registro"
              active={status.registrar_status === 'registry_hold'}
              completed={['auction', 'pending_delete'].includes(status.registrar_status)}
              description="Pré-leilão, recuperação com suporte"
            />

            <TimelineItem
              label="Dia 61-75: Leilão"
              active={status.registrar_status === 'auction'}
              completed={status.registrar_status === 'pending_delete'}
              description="Disponível para ofertas públicas"
            />

            <TimelineItem
              label="Dia 76-80: Exclusão Pendente"
              active={status.registrar_status === 'pending_delete'}
              completed={false}
              description="Processo final, sem recuperação"
            />
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Dica:</strong> Quanto mais cedo regularizar, menores as taxas e
              mais rápida a reativação do seu domínio.
            </p>
          </div>
        </motion.div>
      )}

      {/* Transfer Lock Info */}
      {status.locked_until && new Date(status.locked_until) > new Date() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-50 border border-slate-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-slate-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">
                Bloqueio de Transferência Ativo
              </p>
              <p className="text-xs text-slate-600">
                Liberado em:{' '}
                {new Date(status.locked_until).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface TimelineItemProps {
  label: string;
  description: string;
  active: boolean;
  completed: boolean;
}

function TimelineItem({ label, description, active, completed }: TimelineItemProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 mt-1">
        {completed ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : active ? (
          <div className="w-5 h-5 rounded-full bg-amber-500 animate-pulse" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
        )}
      </div>
      <div className={`flex-1 ${active ? 'font-semibold' : ''}`}>
        <p className={`text-sm ${active ? 'text-slate-900' : 'text-slate-600'}`}>
          {label}
        </p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}
