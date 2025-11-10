import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TrialStatus {
  is_trial: boolean;
  trial_ends_at: string | null;
  recovery_window_until: string | null;
  rights_revoked_at: string | null;
  subscription_status: string;
}

export function TrialStatusBanner() {
  const { user } = useAuth();
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchTrialStatus();
    }
  }, [user?.id]);

  const fetchTrialStatus = async () => {
    if (!user?.id) return;

    try {
      // Get customer status
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('is_trial_account, trial_ends_at, recovery_window_until, rights_revoked_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (customerError) throw customerError;

      // Get subscription status
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (customerData) {
        setTrialStatus({
          is_trial: customerData.is_trial_account || false,
          trial_ends_at: customerData.trial_ends_at,
          recovery_window_until: customerData.recovery_window_until,
          rights_revoked_at: customerData.rights_revoked_at,
          subscription_status: subData?.status || 'unknown'
        });
      }
    } catch (error) {
      console.error('Error fetching trial status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !trialStatus || dismissed) return null;

  const now = new Date();

  // Calculate days remaining
  const getDaysRemaining = (dateString: string | null) => {
    if (!dateString) return 0;
    const diff = new Date(dateString).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const trialDaysLeft = getDaysRemaining(trialStatus.trial_ends_at);
  const recoveryDaysLeft = getDaysRemaining(trialStatus.recovery_window_until);

  // Determine banner type
  let bannerConfig = {
    show: false,
    type: 'info' as 'warning' | 'danger' | 'info' | 'success',
    icon: <Clock className="w-6 h-6" />,
    title: '',
    message: '',
    action: null as React.ReactNode,
    dismissible: false
  };

  // Scenario 1: Active trial (not revoked)
  if (trialStatus.is_trial && !trialStatus.rights_revoked_at && trialDaysLeft > 0) {
    bannerConfig = {
      show: true,
      type: trialDaysLeft <= 2 ? 'danger' : trialDaysLeft <= 5 ? 'warning' : 'info',
      icon: trialDaysLeft <= 2 ? <AlertTriangle className="w-6 h-6" /> : <Clock className="w-6 h-6" />,
      title: `Período de Teste - ${trialDaysLeft} ${trialDaysLeft === 1 ? 'dia' : 'dias'} restantes`,
      message: 'Durante o trial, você pode explorar o sistema, mas seus direitos e afiliados só se tornam permanentes após o pagamento confirmado.',
      action: (
        <a
          href="/valores"
          className="bg-white text-slate-900 px-6 py-2 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
        >
          Ativar Agora
        </a>
      ),
      dismissible: trialDaysLeft > 5
    };
  }

  // Scenario 2: Trial expired, rights revoked, within recovery window
  else if (trialStatus.rights_revoked_at && recoveryDaysLeft > 0) {
    bannerConfig = {
      show: true,
      type: 'danger',
      icon: <XCircle className="w-6 h-6" />,
      title: 'Seus Direitos Foram Revogados',
      message: `Seu período de teste terminou sem pagamento. Todos os direitos e afiliados foram cancelados. Você tem ${recoveryDaysLeft} ${recoveryDaysLeft === 1 ? 'dia' : 'dias'} para recuperar sua conta.`,
      action: (
        <a
          href="/painel/billing"
          className="bg-white text-red-900 px-6 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
        >
          Regularizar Pagamento
        </a>
      ),
      dismissible: false
    };
  }

  // Scenario 3: Recovery window expired
  else if (trialStatus.rights_revoked_at && recoveryDaysLeft <= 0) {
    bannerConfig = {
      show: true,
      type: 'danger',
      icon: <AlertCircle className="w-6 h-6" />,
      title: 'Prazo de Recuperação Expirou',
      message: 'O prazo para recuperar seus direitos terminou. Sua conta foi encerrada conforme política de uso. Entre em contato com o suporte se tiver dúvidas.',
      action: (
        <a
          href="/support"
          className="bg-white text-red-900 px-6 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
        >
          Falar com Suporte
        </a>
      ),
      dismissible: false
    };
  }

  // Scenario 4: Fraud hold
  else if (trialStatus.subscription_status === 'fraud_hold') {
    bannerConfig = {
      show: true,
      type: 'danger',
      icon: <AlertCircle className="w-6 h-6" />,
      title: 'Conta Bloqueada para Análise',
      message: 'Detectamos múltiplas tentativas de uso indevido do período de teste. Sua conta foi bloqueada e todos os afiliados foram removidos.',
      action: (
        <a
          href="/support"
          className="bg-white text-red-900 px-6 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
        >
          Solicitar Revisão
        </a>
      ),
      dismissible: false
    };
  }

  if (!bannerConfig.show) return null;

  const bgColors = {
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    success: 'bg-green-500'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`${bgColors[bannerConfig.type]} text-white shadow-lg sticky top-0 z-50`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex-shrink-0">
                {bannerConfig.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mb-1">
                  {bannerConfig.title}
                </h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  {bannerConfig.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {bannerConfig.action}
              {bannerConfig.dismissible && (
                <button
                  onClick={() => setDismissed(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Dismiss"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
