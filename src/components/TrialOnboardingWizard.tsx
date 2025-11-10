import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowRight, Sparkles, Target, Settings, Rocket } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    href: string;
  };
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao seu Período de Avaliação! 🎉',
    description: 'Você tem acesso completo a todos os recursos do plano Prime por 14 dias, sem compromisso. Explore à vontade!',
    icon: <Sparkles className="w-8 h-8" />,
  },
  {
    id: 'profile',
    title: 'Crie Seu Perfil',
    description: 'Configure sua página pessoal com foto, bio e links. É o coração da sua identidade digital .com.rich',
    icon: <Target className="w-8 h-8" />,
    action: {
      label: 'Configurar Perfil',
      href: '/painel/perfil'
    }
  },
  {
    id: 'customize',
    title: 'Personalize Seu Domínio',
    description: 'Ajuste cores, fontes e layout do seu perfil. Faça dele único e memorável.',
    icon: <Settings className="w-8 h-8" />,
    action: {
      label: 'Personalizar',
      href: '/painel/perfil'
    }
  },
  {
    id: 'reminder',
    title: 'Lembrete Importante',
    description: 'No dia 12 do seu trial, enviaremos um lembrete para você decidir se quer continuar. Sem surpresas!',
    icon: <Rocket className="w-8 h-8" />,
  },
];

export function TrialOnboardingWizard() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkShouldShow();
  }, [user?.id]);

  const checkShouldShow = async () => {
    if (!user?.id) return;

    try {
      // Check if user has dismissed wizard
      const dismissed = localStorage.getItem(`trial_wizard_dismissed_${user.id}`);
      if (dismissed) {
        setDismissed(true);
        return;
      }

      // Check if user is in trial
      const { data: customer } = await supabase
        .from('customers')
        .select('is_trial_account, trial_ends_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (customer?.is_trial_account && customer?.trial_ends_at) {
        const trialEnds = new Date(customer.trial_ends_at);
        const now = new Date();

        // Show wizard if trial is still active
        if (trialEnds > now) {
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error('Error checking trial wizard status:', error);
    }
  };

  const handleDismiss = () => {
    if (user?.id) {
      localStorage.setItem(`trial_wizard_dismissed_${user.id}`, 'true');
    }
    setIsVisible(false);
    setDismissed(true);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const handleSkip = () => {
    handleDismiss();
  };

  if (!isVisible || dismissed) return null;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white relative">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 rounded-full p-3">
                {step.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-emerald-100 mb-1">
                  Passo {currentStep + 1} de {STEPS.length}
                </div>
                <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                    className="bg-white h-full"
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {step.title}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              {step.description}
            </p>

            {/* Key Benefits */}
            {currentStep === 0 && (
              <div className="bg-emerald-50 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-emerald-900 mb-3">O que você ganha:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-emerald-800">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Acesso completo a todos os recursos Premium</span>
                  </li>
                  <li className="flex items-start gap-2 text-emerald-800">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Domínio .com.rich exclusivo e personalizável</span>
                  </li>
                  <li className="flex items-start gap-2 text-emerald-800">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>14 dias de avaliação sem compromisso</span>
                  </li>
                  <li className="flex items-start gap-2 text-emerald-800">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Cancele quando quiser sem cobranças</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Pular tutorial
              </button>

              <div className="flex items-center gap-3">
                {step.action && (
                  <a
                    href={step.action.href}
                    onClick={handleDismiss}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-semibold transition-colors"
                  >
                    {step.action.label}
                  </a>
                )}

                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg transition-all"
                >
                  <span>{isLastStep ? 'Começar!' : 'Próximo'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
