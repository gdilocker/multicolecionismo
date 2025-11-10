import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Crown, Award, Upload, Loader2, Globe, Link2, Instagram, Youtube, Twitter, Linkedin, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface Plan {
  id: string;
  plan_name: string;
  plan_type: string;
  price_usd: number;
  billing_cycle: string;
  description: string;
  features: string[];
  commission_rate?: number;
}

const STEPS = [
  { id: 1, title: 'Escolha seu nome', icon: Globe },
  { id: 2, title: 'Escolha seu plano', icon: Crown },
  { id: 3, title: 'Pagamento', icon: Check },
  { id: 4, title: 'Configure seu perfil', icon: Award },
  { id: 5, title: 'Publicar!', icon: Sparkles }
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onSkip }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [domainName, setDomainName] = useState('');
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [bio, setBio] = useState('');
  const [links, setLinks] = useState([
    { name: 'Instagram', url: '', icon: Instagram },
    { name: 'Website', url: '', icon: Globe },
    { name: 'YouTube', url: '', icon: Youtube }
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_usd', { ascending: true });

      if (data) {
        setPlans(data);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const checkDomainAvailability = async (name: string) => {
    if (!name || name.length < 3) {
      setDomainAvailable(null);
      return;
    }

    setCheckingDomain(true);
    try {
      const { data } = await supabase
        .from('domains')
        .select('domain_name')
        .eq('domain_name', `${name}.com.rich`)
        .maybeSingle();

      setDomainAvailable(!data);
    } catch (error) {
      console.error('Error checking domain:', error);
      setDomainAvailable(null);
    } finally {
      setCheckingDomain(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (domainName) {
        checkDomainAvailability(domainName);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [domainName]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1 && !domainAvailable) {
      return;
    }

    if (currentStep === 2 && selectedPlan !== 'free') {
      navigate('/checkout', {
        state: {
          selectedPlan,
          returnTo: '/onboarding?step=4',
          fromOnboarding: true
        }
      });
      return;
    }

    if (currentStep === 4) {
      await saveProfile();
      return;
    }

    if (currentStep === 5) {
      onComplete();
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let avatarUrl = '';
      if (avatar) {
        const fileExt = avatar.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { data: uploadData } = await supabase.storage
          .from('profile-images')
          .upload(fileName, avatar);

        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('profile-images')
            .getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          display_name: domainName,
          bio: bio || '',
          avatar_url: avatarUrl || null,
          is_public: true,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      for (const link of links) {
        if (link.url) {
          await supabase.from('profile_links').insert({
            profile_id: user.id,
            title: link.name,
            url: link.url,
            is_visible: true
          });
        }
      }

      // Domain registration should be done through the checkout flow
      // The onboarding wizard only collects preferences, not registers domains
      // User will be redirected to register their domain after onboarding

      setCurrentStep(5);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const progress = (currentStep / 5) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Passo {currentStep} de 5: {STEPS[currentStep - 1].title}
            </h2>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-teal-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="absolute -top-8 left-0 right-0 flex justify-between">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isComplete = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center ${
                      isComplete ? 'text-teal-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isComplete
                          ? 'bg-teal-100'
                          : isCurrent
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      {isComplete ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    Escolha sua identidade exclusiva
                  </h3>
                  <p className="text-gray-600">
                    Seu nome único no ecossistema com.rich
                  </p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="flex items-center bg-gray-50 border-2 border-gray-200 rounded-xl p-4 focus-within:border-blue-500 transition-colors">
                    <input
                      type="text"
                      value={domainName}
                      onChange={(e) => setDomainName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="seunome"
                      className="flex-1 bg-transparent border-none outline-none text-xl font-medium"
                      autoFocus
                    />
                    <span className="text-gray-500 font-medium">.com.rich</span>
                  </div>

                  <div className="mt-4 text-center min-h-[24px]">
                    {checkingDomain && (
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verificando...
                      </div>
                    )}
                    {!checkingDomain && domainAvailable === true && (
                      <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                        <Check className="w-5 h-5" />
                        Disponível!
                      </div>
                    )}
                    {!checkingDomain && domainAvailable === false && (
                      <div className="flex items-center justify-center gap-2 text-red-600 font-medium">
                        <X className="w-5 h-5" />
                        Indisponível
                      </div>
                    )}
                  </div>

                  {domainAvailable && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl"
                    >
                      <p className="text-sm text-blue-800">
                        <strong>{domainName}.com.rich</strong> será sua licença exclusiva de uso dentro do ecossistema com.rich
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    Escolha seu plano
                  </h3>
                  <p className="text-gray-600">
                    Plano Prime: Experimente por 14 dias sem compromisso. Cancele quando quiser.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  <div
                    onClick={() => setSelectedPlan('free')}
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPlan === 'free'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {selectedPlan === 'free' && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <Award className="w-10 h-10 text-gray-400 mb-4" />
                    <h4 className="text-xl font-bold mb-2">Free</h4>
                    <div className="text-3xl font-bold mb-4">$0</div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        1 domínio
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        10 links
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Página pública
                      </li>
                    </ul>
                  </div>

                  <div
                    onClick={() => setSelectedPlan('prime')}
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPlan === 'prime'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {selectedPlan === 'prime' && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <Crown className="w-10 h-10 text-blue-500 mb-4" />
                    <h4 className="text-xl font-bold mb-2">Prime</h4>
                    <div className="text-3xl font-bold mb-4">$50<span className="text-sm text-gray-500">/mês</span></div>
                    <div className="text-xs text-teal-600 font-medium mb-4">
                      🎁 14 dias de teste
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Links ilimitados
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Analytics completo
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Ganhe 25% de comissão
                      </li>
                    </ul>
                  </div>

                  <div
                    onClick={() => setSelectedPlan('elite')}
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPlan === 'elite'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {selectedPlan === 'elite' && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="absolute -top-3 -left-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      POPULAR
                    </div>
                    <Sparkles className="w-10 h-10 text-teal-600 mb-4" />
                    <h4 className="text-xl font-bold mb-2">Elite</h4>
                    <div className="text-3xl font-bold mb-4">$70<span className="text-sm text-gray-500">/mês</span></div>
                    <div className="mb-4"></div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Tudo do Prime
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Identidade física QR
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Selo Elite Member
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Ganhe 50% de comissão
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center py-12"
              >
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500 mb-4" />
                <p className="text-gray-600">Redirecionando para pagamento...</p>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    Configure seu perfil
                  </h3>
                  <p className="text-gray-600">
                    Adicione foto e seus principais links
                  </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Upload className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700 mb-2 block">Foto de perfil</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio (opcional)
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Conte um pouco sobre você..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Seus principais links
                    </label>
                    <div className="space-y-3">
                      {links.map((link, index) => {
                        const Icon = link.icon;
                        return (
                          <div key={index} className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <input
                              type="text"
                              value={link.name}
                              onChange={(e) => {
                                const newLinks = [...links];
                                newLinks[index].name = e.target.value;
                                setLinks(newLinks);
                              }}
                              placeholder="Nome do link"
                              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => {
                                const newLinks = [...links];
                                newLinks[index].url = e.target.value;
                                setLinks(newLinks);
                              }}
                              placeholder="https://..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-teal-500 rounded-full mb-6"
                >
                  <Check className="w-12 h-12 text-white" />
                </motion.div>

                <h3 className="text-4xl font-bold text-gray-900 mb-4">
                  🎉 Parabéns!
                </h3>
                <p className="text-xl text-gray-600 mb-8">
                  Seu perfil está no ar:
                </p>

                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-full text-xl font-bold mb-8">
                  <Globe className="w-6 h-6" />
                  {domainName}.com.rich
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => navigate(`/${domainName}`)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:shadow-lg transition-shadow"
                  >
                    Ver Meu Perfil
                  </button>
                  <button
                    onClick={() => navigate('/panel/dashboard')}
                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:border-gray-400 transition-colors"
                  >
                    Ir para Dashboard
                  </button>
                </div>

                <div className="mt-12 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl max-w-md mx-auto">
                  <h4 className="font-bold text-amber-900 mb-2">
                    💼 Programa de Afiliados
                  </h4>
                  <p className="text-sm text-amber-800 mb-3">
                    Promova com.rich e receba 25-50% de comissão recorrente em vendas confirmadas
                  </p>
                  <button
                    onClick={() => navigate('/affiliate-dashboard')}
                    className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-medium rounded-lg hover:shadow-lg transition-shadow"
                  >
                    Ver Meu Link de Parceria
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {currentStep < 5 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <button
                onClick={currentStep === 1 ? onSkip : handleBack}
                className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors flex items-center gap-2"
              >
                {currentStep === 1 ? (
                  <>Pular</>
                ) : (
                  <>
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                  </>
                )}
              </button>

              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !domainAvailable) ||
                  (currentStep === 4 && saving)
                }
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : currentStep === 4 ? (
                  <>
                    Publicar Perfil
                    <Check className="w-4 h-4" />
                  </>
                ) : currentStep === 2 && selectedPlan !== 'free' ? (
                  <>
                    Ir para Pagamento
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
