import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Star, Crown, CreditCard, Users, TrendingUp, Sparkles, AlertCircle, Award, DollarSign, Lightbulb, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_type: string;
  price_usd: string | number;
  billing_cycle: string;
  description: string;
  features: string[];
  is_active: boolean;
  commission_rate?: number;
}

const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: 'prime',
    plan_name: 'Prime',
    plan_type: 'prime',
    price_usd: 50,
    billing_cycle: 'monthly',
    description: 'A porta de entrada para o clube com.rich. Presença digital exclusiva com elegância e sofisticação.',
    features: [
      'Licença exclusiva de domínio (seunome.com.rich)',
      'Página de perfil personalizável (pública ou privada)',
      'Editor completo: bio, avatar e links ilimitados',
      'Analytics profissional de acessos e cliques',
      'Acesso à coleção de nomes premium',
      'Integração com redes sociais',
      'Programa de afiliados: 25% de comissão recorrente em cada pagamento do cliente',
      'Suporte via plataforma'
    ],
    is_active: true,
    commission_rate: 0.25
  },
  {
    id: 'elite',
    plan_name: 'Elite',
    plan_type: 'elite',
    price_usd: 70,
    billing_cycle: 'monthly',
    description: 'Identidade digital e física de alto padrão. Voltado para quem deseja ir além da imagem online e fazer parte de um clube exclusivo.',
    features: [
      'Tudo do plano Prime',
      'Identidade física personalizada com QR Code dinâmico',
      'Design Black & Gold Edition exclusivo',
      'Selo Elite Member no painel e na página pública',
      'Destaque premium nas listagens e buscas',
      'Acesso antecipado à coleção de nomes premium',
      'Acesso a eventos e lugares exclusivos (sujeito a verificação)',
      'Programa de afiliados: 50% de comissão recorrente em cada pagamento do cliente',
      'Suporte prioritário dedicado'
    ],
    is_active: true,
    commission_rate: 0.50
  },
  {
    id: 'supreme',
    plan_name: 'Supreme',
    plan_type: 'supreme',
    price_usd: 'By Request',
    billing_cycle: 'monthly',
    description: 'Estrutura completa e personalizada: licenciamento exclusivo de domínios premium com infraestrutura dedicada, suporte corporativo e termos sob medida.',
    features: [
      'Licenciamento exclusivo global de domínio premium',
      'Infraestrutura técnica completa e personalizada',
      'Plataforma digital independente com identidade própria',
      'Exclusive License Fee (taxa única de licenciamento)',
      'Taxa operacional mensal (varia por domínio premium)',
      'Gerente de conta dedicado 24/7',
      'Suporte corporativo white-glove',
      'Garantias contratuais de SLA',
      'Onboarding personalizado e consultoria estratégica',
      'Acesso VIP a eventos e networking exclusivo',
      'Programa de afiliados: 50% sobre mensalidade base'
    ],
    is_active: true,
    commission_rate: 0.50
  }
];

const Pricing: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const stateMessage = location.state?.message;
  const returnTo = location.state?.returnTo;

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .in('plan_type', ['prime', 'elite', 'supreme'])
        .order('price_usd', { ascending: true });

      // Reorder to show Prime, Elite, Supreme (Supreme has price 0 so it comes first)
      const orderedData = data ? [
        ...data.filter(p => p.plan_type === 'prime'),
        ...data.filter(p => p.plan_type === 'elite'),
        ...data.filter(p => p.plan_type === 'supreme')
      ] : [];

      if (error) {
        console.error('Error loading subscription plans:', error);
        setPlans(FALLBACK_PLANS);
      } else if (orderedData && orderedData.length > 0) {
        setPlans(orderedData);
      } else {
        console.log('No plans in database, using fallback');
        setPlans(FALLBACK_PLANS);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      setPlans(FALLBACK_PLANS);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planType: string) => {
    if (planType === 'supreme') return Crown;
    return planType === 'elite' ? Award : Star;
  };

  const getPlanColor = (planType: string) => {
    if (planType === 'supreme') return 'from-yellow-500 to-amber-600';
    return planType === 'elite' ? 'from-slate-500 to-teal-600' : 'from-slate-300 to-slate-400';
  };

  return (
    <div className="relative min-h-screen bg-[#F5F5F5] overflow-hidden">
      <div className="relative pt-32 pb-16">
        {stateMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8"
          >
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-6 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 mb-2">Domínio Premium Requer Plano Elite</h3>
                <p className="text-amber-800">{stateMessage}</p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.section
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
              Planos de{' '}
              <span className="bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                Assinatura
              </span>
            </h1>
            <p className="text-xl text-[#6B7280] leading-relaxed mb-8">
              Escolha o plano ideal para sua licença exclusiva .com.rich
            </p>

            {/* Important Notice - Positioned BEFORE trial */}
            <div className="relative max-w-4xl mx-auto mb-8">
              {/* Outer glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-blue-400/20 rounded-3xl blur-xl"></div>

              {/* Main card */}
              <div className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-3xl border-2 border-blue-200/50 shadow-2xl overflow-hidden">
                {/* Decorative top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400"></div>

                {/* Content */}
                <div className="relative p-8">
                  {/* Icon and Title */}
                  <div className="flex flex-col items-center justify-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                      <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-1">
                        Importante
                      </p>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                        Escolha o plano ideal desde o início
                      </h2>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-center text-slate-700 text-lg leading-relaxed mb-3">
                    Por política de estabilidade de assinatura,{' '}
                    <span className="text-slate-900 font-semibold">mudanças de plano só são liberadas 60 dias após cada pagamento confirmado</span>.
                  </p>

                  {/* Example Box */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-blue-100 shadow-sm max-w-2xl mx-auto mb-4">
                    <p className="text-sm text-slate-700 mb-3">
                      <span className="font-bold text-slate-900">Exemplo:</span> Se você começar no Prime e depois de 2 semanas quiser o Elite, terá que esperar ~58 dias.
                    </p>
                    <div className="flex items-start gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200">
                      <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-emerald-900 font-semibold">
                        Recomendação: Se planeja usar recursos Elite (comissão 50%, mais domínios, etc.), assine Elite diretamente!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trial Banner - Redesigned Modern Luxury */}
            <div className="relative max-w-3xl mx-auto">
              {/* Outer glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-teal-400/20 to-emerald-400/20 rounded-3xl blur-xl"></div>

              {/* Main card */}
              <div className="relative bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-3xl border-2 border-emerald-200/50 shadow-2xl overflow-hidden">
                {/* Decorative top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400"></div>

                {/* Content */}
                <div className="relative p-8">
                  {/* Icon and Title */}
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                      Experimente por 14 Dias
                    </h2>
                  </div>

                  {/* Description */}
                  <p className="text-center text-slate-700 text-lg leading-relaxed mb-3">
                    Acesso completo aos recursos do plano Prime sem compromisso.<br />
                    <span className="text-slate-600">Sem cartão de crédito necessário.</span>
                  </p>

                  <p className="text-center text-emerald-800 font-semibold text-base mb-6">
                    Você só será cobrado se decidir continuar após o período de avaliação.
                  </p>

                  {/* Benefits Grid */}
                  <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="flex flex-col items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-100 shadow-sm">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">14 dias de teste</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-100 shadow-sm">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">Sem cartão</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-100 shadow-sm">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">Cancele quando quiser</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B2D42]"></div>
            <p className="text-[#6B7280] mt-4">Carregando planos...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#6B7280] text-xl">Nenhum plano disponível no momento.</p>
            <p className="text-[#6B7280] text-sm mt-2">Por favor, tente novamente mais tarde.</p>
          </div>
        ) : (
          <motion.section
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 mt-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto" >
              {plans.map((plan, index) => {
                const Icon = getPlanIcon(plan.plan_type);
                const isPrime = plan.plan_type === 'prime';
                const isElite = plan.plan_type === 'elite';
                const isSupreme = plan.plan_type === 'supreme';

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    {plan.plan_type === 'prime' && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black px-6 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border-2 border-amber-400 whitespace-nowrap">
                          <Sparkles className="w-4 h-4" />
                          <span>Acesso Exclusivo 14 Dias</span>
                        </div>
                      </div>
                    )}

                    {isElite && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-gradient-to-r from-slate-500 to-teal-600 text-white px-6 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border-2 border-slate-400 whitespace-nowrap">
                          <Sparkles className="w-4 h-4" />
                          <span>Recomendado</span>
                        </div>
                      </div>
                    )}

                    {isSupreme && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black px-6 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border-2 border-amber-400 whitespace-nowrap">
                          <Sparkles className="w-4 h-4" />
                          <span>Premium</span>
                        </div>
                      </div>
                    )}

                    <div className={`bg-white border-2 ${isSupreme ? 'border-yellow-500 shadow-xl' : isElite ? 'border-slate-500 shadow-xl' : 'border-slate-300'} rounded-2xl p-8 h-full hover:shadow-lg transition-all duration-300 relative`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${getPlanColor(plan.plan_type)}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-black">{plan.plan_name}</h3>
                          {isPrime && (
                            <span className="text-sm text-slate-600 font-semibold">Prime Member</span>
                          )}
                          {isElite && (
                            <span className="text-sm text-slate-600 font-semibold">Elite Member</span>
                          )}
                          {isSupreme && (
                            <span className="text-sm text-yellow-600 font-semibold">By Request</span>
                          )}
                        </div>
                      </div>

                      <p className="text-[#6B7280] mb-6 min-h-[60px]">
                        {plan.description}
                      </p>

                      <div className="mb-8">
                        <div className="flex items-baseline gap-2 mb-2">
                          {isElite && (
                            <span className="text-2xl font-bold text-gray-400 line-through">
                              $100
                            </span>
                          )}
                          {isSupreme || (typeof plan.price_usd === 'number' && plan.price_usd === 0) || (typeof plan.price_usd === 'string' && parseFloat(plan.price_usd) === 0) ? (
                            <span className="text-4xl font-bold text-black">
                              By Request
                            </span>
                          ) : (
                            <>
                              <span className="text-5xl font-bold text-black">
                                ${typeof plan.price_usd === 'string' ? parseFloat(plan.price_usd) : plan.price_usd}
                              </span>
                              <span className="text-[#6B7280] text-xl">/mês</span>
                            </>
                          )}
                        </div>
                        {isPrime && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-2">
                            <p className="text-sm text-emerald-800 font-semibold flex items-center gap-1">
                              <Sparkles className="w-4 h-4" />
                              Experimente por 14 dias
                            </p>
                          </div>
                        )}
                        {isElite && (
                          <p className="text-sm text-teal-700 font-semibold mt-1">
                            Promoção até 31/12/2024. Depois $100/mês
                          </p>
                        )}
                      </div>
                      {isElite && (
                        <>
                          <div className="bg-gradient-to-r from-teal-50 to-slate-50 border-2 border-teal-300 rounded-xl p-4 mb-4">
                            <p className="text-sm font-bold text-teal-900 mb-2 flex items-center gap-2">
                              <Check className="w-5 h-5 text-teal-600" />
                              Comece direto no Elite e economize!
                            </p>
                            <p className="text-xs text-slate-700 leading-relaxed">
                              Ao escolher Elite desde o início, você evita o período de 60 dias de permanência obrigatória do Prime e já aproveita todos os benefícios premium imediatamente.
                            </p>
                          </div>
                        </>
                      )}

                      {isSupreme ? (
                        <Link
                          to="/contact"
                          className="block w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 text-center mb-8 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white shadow-md"
                        >
                          Solicitar Licença
                        </Link>
                      ) : (
                        <Link
                          to={`/register?plan=${plan.plan_type}`}
                          className={`block w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 text-center mb-8 ${
                            isElite
                              ? 'bg-gradient-to-r from-slate-500 to-teal-600 hover:from-slate-600 hover:to-teal-700 text-white shadow-md'
                              : 'bg-gradient-to-r from-slate-400 to-slate-900 hover:from-slate-500 hover:to-slate-600 text-white shadow-md'
                          }`}
                          
                        >
                          Começar
                        </Link>
                      )}

                      <div className="space-y-4">
                        <p className="font-semibold text-black mb-3">
                          {isSupreme ? 'Recursos Exclusivos:' : isElite ? 'Tudo do Prime, mais:' : 'Inclui:'}
                        </p>
                        <ul className="space-y-3">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isElite ? 'text-yellow-500' : 'text-green-500'}`} />
                              <span className="text-black text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Affiliate CTA */}
                      {(isElite || isPrime) && plan.commission_rate && plan.commission_rate > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <TrendingUp className="w-4 h-4 text-slate-600" />
                              <p className="text-slate-600 text-xs font-medium uppercase tracking-wide">
                                Programa de Parceria
                              </p>
                            </div>

                            {isPrime ? (
                              <div className="space-y-3">
                                <p className="text-sm text-slate-900 leading-relaxed">
                                  Ao se tornar Membro Prime, você recebe 25% de comissão em todas as vendas realizadas pelos seus convidados, tanto no plano Prime quanto no Elite.
                                </p>
                                <div className="space-y-2">
                                  <p className="text-sm text-slate-800 font-semibold flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                    $12,50 por venda do Plano Prime
                                  </p>
                                  <p className="text-sm text-slate-800 font-semibold flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                    $17,50 por venda do Plano Elite
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <p className="text-sm text-slate-900 leading-relaxed">
                                  Ao se tornar Membro Elite, você recebe 50% de comissão em todas as vendas realizadas pelos seus convidados, tanto no plano Prime quanto no Elite.
                                </p>
                                <div className="space-y-2">
                                  <p className="text-sm text-slate-800 font-semibold flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                    $25 por venda do Plano Prime
                                  </p>
                                  <p className="text-sm text-slate-800 font-semibold flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                    $35 por venda do Plano Elite
                                  </p>
                                </div>
                              </div>
                            )}

                            <Link
                              to="/afiliados/sobre"
                              className="flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 mt-4"
                            >
                              <span>Saiba como funciona</span>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Observação sobre comissões */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center leading-relaxed">
                          As comissões são calculadas sobre o valor líquido efetivamente recebido, após deduções e taxas aplicáveis. Não há repasse de comissão em casos de estorno, cancelamento ou inadimplência.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        <motion.section
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="text-center">
            <p className="text-[#6B7280] text-sm">
              Tem dúvidas? <Link to="/contact" className="text-black hover:underline font-semibold">Entre em contato</Link> ou veja nosso <Link to="/faq" className="text-black hover:underline font-semibold">FAQ</Link>
            </p>
          </div>
        </motion.section>
      </div>

    </div>
  );
};

export default Pricing;
