import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, CreditCard, Lock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PlanChangeValidatorProps {
  userId: string;
  currentPlanId: string;
  newPlanId: string;
  newPlanName: string;
  onValidationComplete: (isEligible: boolean, reason?: string) => void;
  children: (props: {
    isEligible: boolean;
    isLoading: boolean;
    validationResult: ValidationResult | null;
    validateChange: () => Promise<void>;
  }) => React.ReactNode;
}

interface ValidationResult {
  eligible: boolean;
  reason: string | null;
  message?: string;
  balance_due?: number;
  last_payment_at?: string;
  next_change_available?: string;
  days_remaining?: number;
  trial_ended?: string;
  current_plan?: string;
  new_plan?: string;
}

export function PlanChangeValidator({
  userId,
  currentPlanId,
  newPlanId,
  newPlanName,
  onValidationComplete,
  children,
}: PlanChangeValidatorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const validateChange = async () => {
    if (currentPlanId === newPlanId) {
      setValidationResult({
        eligible: false,
        reason: 'SAME_PLAN',
        message: 'Você já está no plano ' + newPlanName,
      });
      onValidationComplete(false, 'SAME_PLAN');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Não autenticado');
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
            userId,
            newPlanId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Falha ao validar mudança de plano');
      }

      const result: ValidationResult = await response.json();
      setValidationResult(result);
      onValidationComplete(result.eligible, result.reason || undefined);
    } catch (error) {
      console.error('Error validating plan change:', error);
      setValidationResult({
        eligible: false,
        reason: 'ERROR',
        message: 'Erro ao validar mudança de plano. Tente novamente.',
      });
      onValidationComplete(false, 'ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {children({
        isEligible: validationResult?.eligible ?? false,
        isLoading,
        validationResult,
        validateChange,
      })}
    </>
  );
}

interface PlanChangeBlockedMessageProps {
  reason: string;
  message?: string;
  balance_due?: number;
  days_remaining?: number;
  next_change_available?: string;
}

export function PlanChangeBlockedMessage({
  reason,
  message,
  balance_due,
  days_remaining,
  next_change_available,
}: PlanChangeBlockedMessageProps) {
  const getIcon = () => {
    switch (reason) {
      case 'PAYMENT_REQUIRED':
        return <CreditCard className="w-6 h-6" />;
      case 'LOCK_PERIOD':
        return <Lock className="w-6 h-6" />;
      case 'TRIAL_EXPIRED':
        return <Clock className="w-6 h-6" />;
      default:
        return <AlertCircle className="w-6 h-6" />;
    }
  };

  const getTitle = () => {
    switch (reason) {
      case 'PAYMENT_REQUIRED':
        return 'Pagamento Pendente';
      case 'LOCK_PERIOD':
        return 'Mudança Temporariamente Bloqueada';
      case 'TRIAL_EXPIRED':
        return 'Período de Teste Encerrado';
      default:
        return 'Mudança de Plano Indisponível';
    }
  };

  const getActionButton = () => {
    if (reason === 'PAYMENT_REQUIRED') {
      return (
        <a
          href="/painel/billing"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Ir para Pagamentos
        </a>
      );
    }
    return null;
  };

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-red-400">
          {getIcon()}
        </div>
        <div className="flex-1 space-y-3">
          <h3 className="text-xl font-semibold text-white">
            {getTitle()}
          </h3>

          <p className="text-gray-300 leading-relaxed">
            {message}
          </p>

          {balance_due && balance_due > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-300">
                <span className="font-semibold">Valor pendente:</span>{' '}
                ${balance_due.toFixed(2)} USD
              </p>
            </div>
          )}

          {days_remaining && days_remaining > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-sm text-amber-300">
                <span className="font-semibold">Tempo restante:</span>{' '}
                {days_remaining} {days_remaining === 1 ? 'dia' : 'dias'}
              </p>
              {next_change_available && (
                <p className="text-xs text-amber-400 mt-1">
                  Disponível em:{' '}
                  {new Date(next_change_available).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          )}

          <div className="pt-2">
            {getActionButton()}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PlanChangeSuccessMessageProps {
  currentPlan: string;
  newPlan: string;
}

export function PlanChangeSuccessMessage({
  currentPlan,
  newPlan,
}: PlanChangeSuccessMessageProps) {
  return (
    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-green-400">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">
            Mudança de Plano Disponível
          </h3>
          <p className="text-gray-300">
            Você pode mudar do plano <span className="font-semibold text-white">{currentPlan}</span>{' '}
            para <span className="font-semibold text-white">{newPlan}</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
