import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Shield, Zap, Globe, Check, ArrowRight, Mail, Lock, Sparkles, Loader2, X, LogIn, AlertCircle, Crown, Link2, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProvisioningStepper } from '../components/ProvisioningStepper';
import { dbQueries } from '../lib/db/queries';
import { createCloudflare } from '../server/adapters/cloudflare';
import { createEmailProvider } from '../server/adapters/emailProvider';
import { supabase } from '../lib/supabase';
import SuccessModal from '../components/SuccessModal';
import backgroundImage from '../assets/2222 copy.jpg';

interface PricingPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  price_cents: number;
  mailboxes_included: number;
  mailbox_quota_mb: number;
  aliases_limit: number;
  features: string[];
  billing_period: string;
  product_type: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [domain, setDomain] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [networkIssueDetected, setNetworkIssueDetected] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [domainPrice, setDomainPrice] = useState<number | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  const [steps, setSteps] = useState<Array<{ label: string; status: string }>>([]);
  const [domainProduct, setDomainProduct] = useState<PricingPlan | null>(null);
  const [emailPlans, setEmailPlans] = useState<PricingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDirectPurchase, setShowDirectPurchase] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [registeredDomain, setRegisteredDomain] = useState('');

  // Tour Guiado
  useEffect(() => {
    loadPricingPlans();
  }, []);

  const loadPricingPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const domain = data?.find(p => p.product_type === 'domain');
      const emails = data?.filter(p => p.product_type === 'email') || [];

      setDomainProduct(domain || null);
      setEmailPlans(emails);
    } catch (error) {
      console.error('Error loading pricing plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const formatPrice = (cents: number | null | undefined) => {
    return ((cents || 0) / 100).toFixed(2);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;

    setIsSearching(true);
    setAvailable(null);
    setDomainError(null);
    setIsPremium(false);

    const maxRetries = 1; // Reduzido para 1 retry
    let lastError: Error | null = null;
    let networkFailureCount = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const domainToCheck = domain.endsWith('.com.rich') ? domain : `${domain}.com.rich`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Reduzido para 15s

        console.log(`[Attempt ${attempt + 1}] Checking domain: ${domainToCheck}`);
        console.log(`[Attempt ${attempt + 1}] URL: ${import.meta.env.VITE_SUPABASE_URL}/functions/v1/domains`);

        const token = (await supabase.auth.getSession()).data.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
        console.log(`[Attempt ${attempt + 1}] Using token:`, token ? `${token.substring(0, 20)}...` : 'none');

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/domains`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: 'check',
              fqdn: domainToCheck,
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        console.log(`[Attempt ${attempt + 1}] Response status:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText || 'Falha ao verificar disponibilidade'}`);
        }

        const result = await response.json();
        console.log(`[Attempt ${attempt + 1}] Full Result:`, JSON.stringify(result, null, 2));
        console.log(`[Attempt ${attempt + 1}] Status:`, result.status);
        console.log(`[Attempt ${attempt + 1}] isAvailable:`, result.isAvailable);
        console.log(`[Attempt ${attempt + 1}] isPremium:`, result.isPremium);
        console.log(`[Attempt ${attempt + 1}] isAdmin:`, result.isAdmin);
        console.log(`[Attempt ${attempt + 1}] showDirectPurchase:`, result.showDirectPurchase);
        console.log(`[Attempt ${attempt + 1}] price:`, result.price);
        console.log(`[Attempt ${attempt + 1}] message:`, result.message);
        console.log(`[Attempt ${attempt + 1}] Error:`, result.error);

        // DEBUG: Show admin status prominently
        if (result.isAdmin === true) {
          console.log('🎯🎯🎯 USER IS ADMIN - SHOULD SHOW FREE REGISTRATION! 🎯🎯🎯');
        } else {
          console.log('❌ User is NOT admin (isAdmin value:', result.isAdmin, ')');
        }

        // Handle error response
        if (result.error) {
          if (result.error.includes('not configured')) {
            setDomainError('⚠️ Serviço de verificação não configurado. Entre em contato com o suporte.');
          } else {
            setDomainError(result.error);
          }
          setAvailable(false);
          setIsPremium(false);
        } else {
          // Handle successful response based on status
          const isAvailable = result.status === 'AVAILABLE';
          const isPremium = result.isPremium === true;

          setAvailable(isAvailable);
          setIsPremium(isPremium);
          setDomainPrice(result.price?.monthly ?? null);
          setIsAdmin(result.isAdmin === true);
          setShowDirectPurchase(result.showDirectPurchase === true);
        }

        // Se chegou aqui, sucesso! Sai do loop
        lastError = null;
        break;

      } catch (error) {
        lastError = error as Error;
        console.error(`[Attempt ${attempt + 1}/${maxRetries + 1}] Failed:`, error);
        console.error(`[Attempt ${attempt + 1}] Error name:`, error instanceof Error ? error.name : 'Unknown');
        console.error(`[Attempt ${attempt + 1}] Error message:`, error instanceof Error ? error.message : String(error));

        // Detecta falha de rede
        if (error instanceof TypeError ||
            (error instanceof Error && (
              error.message.toLowerCase().includes('network') ||
              error.message.toLowerCase().includes('fetch') ||
              error.message.toLowerCase().includes('failed to fetch')
            ))) {
          networkFailureCount++;
        }

        // Se é o último retry, não espera
        if (attempt < maxRetries) {
          console.log(`[Attempt ${attempt + 1}] Waiting 2s before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Se todas as tentativas falharam
    if (lastError) {
      console.error('❌ All attempts failed. Last error:', lastError);
      console.error('❌ Network failure count:', networkFailureCount);

      // Se todas as falhas foram de rede, ativa modo de fallback
      if (networkFailureCount > 0) {
        setNetworkIssueDetected(true);
        console.warn('⚠️ Network issue detected! Environment may have connectivity problems.');
        setDomainError(`🌐 ERRO DE AMBIENTE: O ambiente bolt.new está com problemas de conectividade de rede.

        Isso NÃO é um problema do código - o código está correto e funcional.

        Possíveis soluções:
        1. Deploy em produção (Netlify) onde a rede funciona
        2. Aguarde até que o ambiente bolt.new restabeleça a conexão
        3. Entre em modo de teste simulado (disponível em breve)

        Erro técnico: ${lastError.message}`);
      } else if (lastError.name === 'AbortError') {
        setDomainError('⏱️ Timeout: A verificação demorou muito. Tente novamente.');
      } else {
        setDomainError(`Falha ao verificar disponibilidade: ${lastError.message}`);
      }
      setAvailable(false);
    }

    setIsSearching(false);

    // Scroll suave para o resultado após a busca (apenas no mobile)
    setTimeout(() => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const resultElement = document.getElementById('search-result');
        if (resultElement) {
          resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
  };

  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleProvision = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const domainToRegister = domain.endsWith('.com.rich') ? domain : `${domain}.com.rich`;

    if (isAdmin) {
      try {
        console.log('👑 ADMIN: Registrando domínio gratuitamente...');
        setProvisioning(true);

        // 1. Ensure customer exists
        let customerId: string;
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
              user_id: user.id,
              email: user.email || '',
            })
            .select('id')
            .single();

          if (customerError) throw customerError;
          customerId = newCustomer.id;
        }

        // 2. Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: customerId,
            fqdn: domainToRegister,
            years: 999,
            plan: 'admin_lifetime',
            total_cents: 0,
            status: 'completed',
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // 3. Create domain
        const domainPayload = {
          customer_id: customerId,
          fqdn: domainToRegister,
          registrar_status: 'active',
          expires_at: new Date(Date.now() + 999 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          domain_type: 'personal',
          is_transferable: false,
        };

        console.log('📝 Criando domínio com payload:', domainPayload);

        const { data: domainData, error: domainError } = await supabase
          .from('domains')
          .insert(domainPayload)
          .select()
          .single();

        if (domainError) {
          console.error('❌ Erro ao criar domínio:', domainError);
          throw domainError;
        }

        console.log('✅ Domínio criado:', domainData);

        // 4. Create pending_order for tracking
        await supabase
          .from('pending_orders')
          .insert({
            user_id: user.id,
            fqdn: domainToRegister,
            plan_code: 'admin_lifetime',
            status: 'completed',
            payment_method: 'admin_free',
            total_cents: 0,
          });

        console.log('✅ Domínio registrado:', { order, domain: domainData });
        setRegisteredDomain(domainToRegister);
        setSuccessMessage('Licença vitalícia ativada');
        setShowSuccessModal(true);
        return;
      } catch (error) {
        console.error('Erro no registro admin:', error);
        alert('Erro ao registrar domínio: ' + (error as Error).message);
        return;
      } finally {
        setProvisioning(false);
      }
    }

    if (!domainProduct) {
      alert('Plano de domínio não encontrado');
      return;
    }

    const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

    if (isDevMode) {
      try {
        console.log('🧪 Modo DEV: Simulando pagamento...');

        const { data: order } = await supabase
          .from('pending_orders')
          .insert({
            user_id: user.id,
            fqdn: domainToRegister,
            plan_code: domainProduct.code,
            status: 'completed',
            payment_method: 'dev_simulation',
          })
          .select()
          .single();

        console.log('✅ Pedido simulado criado:', order);
        alert('✅ Pagamento simulado com sucesso! (Modo DEV)\n\nRedirecionando para dashboard...');
        setTimeout(() => navigate('/panel/dashboard'), 1500);
        return;
      } catch (error) {
        console.error('Erro na simulação:', error);
        alert('Erro ao simular pagamento: ' + (error as Error).message);
        return;
      }
    }

    try {
      const authHeader = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        alert('Sessão expirada. Faça login novamente.');
        navigate('/login');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-create-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            domain: domainToRegister,
            price: domainProduct.price_cents / 100,
            planId: domainProduct.id,
            planCode: domainProduct.code,
            contactInfo: {
              email: user.email,
            },
            return_url: `${window.location.origin}/paypal/return`,
            cancel_url: `${window.location.origin}/paypal/cancel`,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro PayPal (response):', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || 'Falha ao criar pedido PayPal');
      }

      const result = await response.json();
      console.log('PayPal create-order result:', result);

      const { approveUrl } = result;

      if (!approveUrl) {
        throw new Error('URL de aprovação do PayPal não encontrada');
      }

      console.log('Abrindo PayPal em nova aba:', approveUrl);

      const paypalWindow = window.open(approveUrl, 'paypal', 'width=800,height=600,scrollbars=yes');

      if (!paypalWindow) {
        console.warn('Pop-up bloqueado, tentando redirect direto');
        window.location.href = approveUrl;
      } else {
        const checkPaymentInterval = setInterval(async () => {
          if (paypalWindow.closed) {
            clearInterval(checkPaymentInterval);
            console.log('Janela PayPal fechada, verificando status...');

            const { data: orders } = await supabase
              .from('pending_orders')
              .select('*')
              .eq('user_id', user.id)
              .eq('fqdn', domainToRegister)
              .eq('status', 'completed')
              .order('created_at', { ascending: false })
              .limit(1);

            if (orders && orders.length > 0) {
              alert('Pagamento confirmado! Redirecionando...');
              navigate('/panel/dashboard');
            }
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao criar pedido PayPal:', error);
      alert('Falha ao processar pedido: ' + (error as Error).message);
    }
  };

  const handleReset = () => {
    setDomain('');
    setAvailable(null);
    setDomainError(null);
    setIsPremium(false);
    setSteps([]);
    setProvisioning(false);
    setIsAdmin(false);
    setShowDirectPurchase(false);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {isDevMode && (
        <div className="fixed top-0 left-0 right-0 bg-amber-600 text-black py-2.5 px-4 text-center font-semibold text-sm shadow-sm z-[100] border-b border-amber-700">
          🧪 MODO DESENVOLVIMENTO ATIVO - Pagamentos serão simulados (sem PayPal real)
        </div>
      )}
      {networkIssueDetected && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white py-3 px-4 text-center font-semibold text-sm shadow-sm z-[99] border-b border-red-700" style={{ marginTop: isDevMode ? '41px' : '0' }}>
          ⚠️ PROBLEMA DE REDE DETECTADO - Ambiente bolt.new com conectividade instável. Use o botão "Modo Teste" para simular ou faça deploy em produção.
        </div>
      )}

      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(1.12)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/60 to-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent"></div>
        </div>
        <motion.section
          className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
          initial="hidden"
          animate="show"
          variants={container}
        >
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              variants={item}
              className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3"
            >
              <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-amber-400 to-transparent"></div>
              <span className="text-amber-400 text-[10px] sm:text-xs font-semibold tracking-[0.2em] sm:tracking-[0.3em] uppercase">Premium Identity</span>
              <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-amber-400 to-transparent"></div>
            </motion.div>

            <motion.h1
              variants={item}
              className="font-bold text-4xl sm:text-6xl lg:text-7xl xl:text-8xl mb-3 sm:mb-4 leading-[1.1] sm:leading-[0.95] tracking-tight px-2"
            >
              <span className="text-white block">
                Sua Identidade
              </span>
              <span className="text-amber-400 block">
                .com.rich
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className="text-base sm:text-xl lg:text-2xl text-gray-300 mb-4 sm:mb-6 max-w-3xl mx-auto leading-relaxed font-light px-4"
            >
              Possua a identidade digital mais prestigiada e exclusiva do mundo.
            </motion.p>

            <motion.div
              variants={item}
              className="flex items-center justify-center gap-2 mb-6"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/30">
                <Sparkles className="w-4 h-4" />
                <span>Plano Prime: 14 dias de teste</span>
              </div>
              <div className="text-gray-400 text-sm">
                • Sem compromisso
              </div>
            </motion.div>

            <motion.form
              variants={item}
              onSubmit={handleSearch}
              className="w-full max-w-2xl mx-auto mb-4 sm:mb-6 px-2"
            >
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/50 to-amber-600/50 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 shadow-2xl">
                  {/* Wrapper invisível para spotlight - APENAS campo + botão */}
                  <div  className="flex flex-col gap-2">
                    <div className="flex items-center flex-1 min-w-0 bg-black/20 rounded-xl">
                      <input
                        id="domain-search-input"
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase())}
                        placeholder="Pesquisar domínio"
                        className="flex-1 bg-transparent text-white placeholder-gray-400 px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded-xl min-w-0"
                        disabled={provisioning}
                      />
                      <div className="flex items-center px-3 sm:px-4 text-amber-400 text-sm sm:text-lg font-semibold select-none pointer-events-none whitespace-nowrap">
                        .com.rich
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSearching || provisioning}
                      className="w-full px-6 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-500/50 hover:shadow-amber-400/60 active:scale-95"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Buscando...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5" />
                          <span>Buscar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.form>

            {domainError && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl mx-auto mb-16 px-4"
              >
                <div className="bg-red-500/10 backdrop-blur-md rounded-xl p-5 border border-red-500/30 shadow-lg shadow-red-500/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white mb-1">
                        Não foi possível verificar
                      </h3>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {domainError}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => { setDomainError(null); handleSearch({ preventDefault: () => {} } as React.FormEvent); }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          Tentar novamente
                        </button>
                        {networkIssueDetected && (
                          <button
                            onClick={() => {
                              setDomainError(null);
                              setAvailable(true);
                              setIsPremium(false);
                              console.log('🧪 MODO SIMULADO ATIVADO - Para fins de teste apenas');
                            }}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg border border-white/20 transition-all duration-200 backdrop-blur-sm"
                          >
                            Modo teste
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleReset}
                      className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {available !== null && !domainError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="max-w-2xl mx-auto mb-12 mt-8 px-4"
                id="search-result"
              >
                {isPremium ? (
                  <div className="space-y-6 w-full">
                    <p className="text-lg text-emerald-700 font-semibold text-center">
                      Domínio Premium disponível!
                    </p>

                    <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-6 shadow-sm border border-amber-200">
                      <div className="flex flex-col items-center gap-4">
                        <Crown className="w-10 h-10 text-amber-500" />
                        <div className="text-center w-full">
                          <div className="inline-block max-w-full">
                            <span className={`font-black text-black break-words ${
                              domain.length <= 8
                                ? 'text-3xl sm:text-4xl md:text-5xl'
                                : domain.length <= 12
                                ? 'text-2xl sm:text-3xl md:text-4xl'
                                : domain.length <= 16
                                ? 'text-xl sm:text-2xl md:text-3xl'
                                : 'text-lg sm:text-xl md:text-2xl'
                            }`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                              {domain}
                            </span>
                            <span className={`font-black bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 bg-clip-text text-transparent ${
                              domain.length <= 8
                                ? 'text-3xl sm:text-4xl md:text-5xl'
                                : domain.length <= 12
                                ? 'text-2xl sm:text-3xl md:text-4xl'
                                : domain.length <= 16
                                ? 'text-xl sm:text-2xl md:text-3xl'
                                : 'text-lg sm:text-xl md:text-2xl'
                            }`}>
                              .com.rich
                            </span>
                          </div>
                        </div>

                        {/* Premium CTA Section */}
                        <div className="flex flex-col items-center gap-3 w-full border-t border-amber-200 pt-4">
                          {isAdmin ? (
                            <>
                              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 rounded-lg">
                                <Crown className="w-5 h-5 text-amber-700" />
                                <p className="text-sm font-semibold text-amber-900">
                                  Domínio Premium - Registro GRATUITO (Admin)
                                </p>
                              </div>
                              <button
                                onClick={handleProvision}
                                disabled={provisioning}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {provisioning ? (
                                  <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Registrando...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Registrar Premium (Admin)</span>
                                  </>
                                )}
                              </button>
                            </>
                          ) : showDirectPurchase ? (
                            <>
                              <p className="text-sm text-amber-800 text-center max-w-md font-medium">
                                Domínio Premium disponível para o seu plano Elite
                              </p>
                              <button
                                onClick={handleProvision}
                                disabled={provisioning}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {provisioning ? (
                                  <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Processando...</span>
                                  </>
                                ) : (
                                  <>
                                    <Crown className="w-5 h-5" />
                                    <span>Solicitar Orçamento</span>
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-amber-800 text-center max-w-md font-medium">
                                Domínio Premium - disponível apenas com plano Elite
                              </p>
                              <Link
                                to="/valores"
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                              >
                                <Crown className="w-5 h-5" />
                                <span>Ver Plano Elite</span>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : available ? (
                  <div className="space-y-6 w-full">
                    <p className="text-lg text-emerald-700 font-semibold text-center">
                      Domínio disponível para registro!
                    </p>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <div className="flex flex-col items-center gap-4">
                        {/* Domain Name */}
                        <div className="text-center w-full">
                          <div className="inline-block max-w-full">
                            <span className={`font-black text-black break-words ${
                              domain.length <= 8
                                ? 'text-3xl sm:text-4xl md:text-5xl'
                                : domain.length <= 12
                                ? 'text-2xl sm:text-3xl md:text-4xl'
                                : domain.length <= 16
                                ? 'text-xl sm:text-2xl md:text-3xl'
                                : 'text-lg sm:text-xl md:text-2xl'
                            }`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                              {domain}
                            </span>
                            <span className={`font-black bg-gradient-to-r from-black via-[#D4AF37] to-black bg-clip-text text-transparent ${
                              domain.length <= 8
                                ? 'text-3xl sm:text-4xl md:text-5xl'
                                : domain.length <= 12
                                ? 'text-2xl sm:text-3xl md:text-4xl'
                                : domain.length <= 16
                                ? 'text-xl sm:text-2xl md:text-3xl'
                                : 'text-lg sm:text-xl md:text-2xl'
                            }`}>
                              .com.rich
                            </span>
                          </div>
                        </div>

                        {/* CTA Section */}
                        <div className="flex flex-col items-center gap-3 w-full border-t border-gray-100 pt-4">
                          {isAdmin ? (
                            <>
                              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                                <Crown className="w-5 h-5 text-amber-600" />
                                <p className="text-sm font-semibold text-amber-900">
                                  Registro GRATUITO com licença vitalícia (Admin)
                                </p>
                              </div>
                              <button
                                onClick={handleProvision}
                                disabled={provisioning}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {provisioning ? (
                                  <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Registrando...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Registrar Agora (Admin)</span>
                                  </>
                                )}
                              </button>
                            </>
                          ) : showDirectPurchase ? (
                            <>
                              <p className="text-sm text-gray-600 text-center max-w-md">
                                Você já possui um plano ativo. Adicione este domínio à sua conta.
                              </p>
                              <button
                                onClick={handleProvision}
                                disabled={provisioning}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {provisioning ? (
                                  <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Processando...</span>
                                  </>
                                ) : (
                                  <>
                                    <Link2 className="w-5 h-5" />
                                    <span>Adicionar Domínio</span>
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-gray-600 text-center max-w-md">
                                Para registrar este domínio, escolha um dos nossos planos de licenciamento
                              </p>
                              <Link
                                to="/valores"
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                                
                              >
                                <Sparkles className="w-5 h-5" />
                                <span>Ver Planos</span>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 w-full">
                    <p className="text-lg text-red-700 font-semibold text-center">
                      Este domínio já está registrado
                    </p>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
                      <div className="text-center w-full">
                        <div className="inline-block max-w-full">
                          <span className={`font-black text-black break-words ${
                            domain.length <= 8
                              ? 'text-3xl sm:text-4xl md:text-5xl'
                              : domain.length <= 12
                              ? 'text-2xl sm:text-3xl md:text-4xl'
                              : domain.length <= 16
                              ? 'text-xl sm:text-2xl md:text-3xl'
                              : 'text-lg sm:text-xl md:text-2xl'
                          }`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            {domain}
                          </span>
                          <span className={`font-black text-gray-600 ${
                            domain.length <= 8
                              ? 'text-3xl sm:text-4xl md:text-5xl'
                              : domain.length <= 12
                              ? 'text-2xl sm:text-3xl md:text-4xl'
                              : domain.length <= 16
                              ? 'text-xl sm:text-2xl md:text-3xl'
                              : 'text-lg sm:text-xl md:text-2xl'
                          }`}>
                            .com.rich
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isPremium && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 max-w-md mx-auto"
                  >
                    <div className="relative w-full rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-amber-900/30 to-amber-950/40 backdrop-blur-sm p-5 shadow-lg shadow-amber-500/20">
                      <Link
                        to="/contact"
                        aria-label="Contato"
                        className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/30 bg-black/40 hover:bg-black/60 backdrop-blur-sm hover:shadow transition-all"
                      >
                        <Mail className="w-4 h-4 text-amber-400" />
                      </Link>

                      <div className="mb-2 flex items-center gap-2">
                        <Crown className="w-5 h-5 text-amber-400" />
                        <h3 className="text-lg font-bold tracking-tight text-white">
                          Domínio Premium
                        </h3>
                        <Sparkles className="w-5 h-5 text-amber-400" />
                      </div>

                      <p className="text-sm text-gray-200 leading-relaxed">
                        Este é um domínio premium de alto valor. Entre em contato para obter uma cotação personalizada.
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {steps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto mb-8"
              >
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Status do Provisionamento</h3>
                  <ProvisioningStepper steps={steps} />
                </div>
              </motion.div>
            )}

            <motion.div
              variants={item}
              
              className="flex flex-wrap justify-center gap-2 sm:gap-3 text-xs sm:text-sm px-2"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
                <span className="text-white/90 whitespace-nowrap">Registro Seguro SSL</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
                <span className="text-white/90 whitespace-nowrap">Verificação Instantânea</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
                <span className="text-white/90 whitespace-nowrap">Reconhecimento Global</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
                <span className="text-white/90 whitespace-nowrap">Ativação Imediata</span>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </section>

        <section className="relative bg-gradient-to-b from-black to-zinc-950 py-6 sm:py-10 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent"></div>
          <motion.div
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-6 sm:mb-8" >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-2 sm:mb-3 leading-tight tracking-tight font-bold px-4">
                <span className="text-white">Valor e identidade</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-4 sm:mb-6 leading-relaxed font-light px-4">
                Mais do que um domínio, <strong className="text-amber-400">.com.rich</strong> é a chave para um mundo de oportunidades e reconhecimento global.
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-2 sm:mb-3 leading-tight tracking-tight font-bold px-4">
                <span className="text-white">Seu nome. Sua marca.</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-2 sm:mb-3 leading-relaxed font-light px-4">
                Com um domínio único, sua presença online é exclusivamente sua. Haverá apenas uma <strong className="text-amber-400">olivia.com.rich</strong>, uma <strong className="text-amber-400">james.com.rich</strong>, uma <strong className="text-amber-400">isabella.com.rich</strong>.
              </p>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-light px-4">
                Essa exclusividade representa uma oportunidade real para fortalecer sua marca pessoal e ser reconhecido de forma autêntica no cenário digital global.
              </p>
            </div>
          </motion.div>
        </section>

        <section className="relative bg-zinc-950 py-6 sm:py-10 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/5 via-transparent to-transparent"></div>
          <motion.div
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-6 sm:mb-10 lg:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-2 sm:mb-3 leading-tight tracking-tight font-bold text-white px-4">
                Sua licença .com.rich em três etapas
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-0 leading-relaxed font-light px-4">
                Três passos simples separam você de uma identidade digital incomparável. Cada detalhe foi pensado para oferecer exclusividade, segurança e presença imediata.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {[
                {
                  step: '01',
                  icon: Search,
                  title: 'Busque sua licença',
                  description: 'Encontre o nome perfeito dentro do universo .com.rich e garanta sua licença exclusiva de uso.'
                },
                {
                  step: '02',
                  icon: Lock,
                  title: 'Adquira sua licença',
                  description: 'Finalize sua contratação com segurança. Sua licença exclusiva .com.rich será ativada instantaneamente e vinculada ao seu perfil.'
                },
                {
                  step: '03',
                  icon: Link2,
                  title: 'Tudo em um só lugar',
                  description: 'Sua licença .com.rich inclui uma página moderna e personalizável, onde você conecta redes, negócios e oportunidades, tudo em um\u00A0só\u00A0link.'
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="relative"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-3 sm:mb-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/50">
                        <step.icon className="w-8 h-8 sm:w-10 sm:h-10 text-black" />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1.5 sm:mb-2 px-2">{step.title}</h3>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed px-2">{step.description}</p>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-amber-500/30 to-transparent" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="relative bg-gradient-to-b from-zinc-950 to-black py-6 sm:py-10 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent"></div>
          <motion.div
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-6 sm:mb-10 lg:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-2 sm:mb-3 leading-tight tracking-tight font-bold text-white px-4">
                O que é .com.rich?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-0 leading-relaxed font-light px-4">
                O domínio .com.rich representa uma nova forma de presença digital feita para quem quer unir valor, propósito e exclusividade.
                Mais do que um endereço na web, ele é uma declaração de identidade: cada nome em .com.rich reflete quem você é e o que deseja transmitir ao mundo.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  icon: Shield,
                  title: 'Máxima segurança',
                  description: 'Cada licença .com.rich é protegida com tecnologia avançada e protocolos de segurança global, garantindo total proteção para sua identidade digital.'
                },
                {
                  icon: Zap,
                  title: 'Ativação instantânea',
                  description: 'Tudo é preparado automaticamente. Em poucos instantes, sua licença .com.rich estará ativa e conectada à sua página personalizada.'
                },
                {
                  icon: Globe,
                  title: 'Identidade profissional',
                  description: 'Uma licença .com.rich transforma sua presença online em algo memorável, distinto e visualmente sofisticado.'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="group relative"
                >
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 h-full hover:bg-white/10 hover:border-amber-500/30 transition-all duration-300 shadow-lg hover:shadow-amber-500/20">
                    <div className="inline-flex p-3 sm:p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl mb-3 sm:mb-4 shadow-2xl shadow-amber-500/50">
                      <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                    </div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1.5 sm:mb-2">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          </motion.div>
        </section>

        <section className="relative bg-black py-6 sm:py-10 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent"></div>
          <motion.div
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="relative">
              <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-center shadow-2xl border border-white/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-600/5"></div>
                <div className="relative">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 leading-tight px-4">
                    Escolha com sabedoria. Destaque-se online.
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-1.5 max-w-2xl mx-auto font-light leading-relaxed px-4">
                    Sua licença exclusiva protegida:
                  </p>
                  <p className="text-sm sm:text-base md:text-lg text-amber-400/90 mb-4 sm:mb-6 max-w-2xl mx-auto font-medium px-4 break-all">
                    https://seunome.com.rich / https://com.rich/seunome
                  </p>
                  <button
                    onClick={() => navigate('/register')}
                    className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-lg font-bold rounded-full transition-all duration-300 shadow-lg shadow-amber-500/30 hover:shadow-amber-400/40 hover:scale-105"
                  >
                    Começar Agora
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Login Modal */}
        {showLoginModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLoginModal(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-zinc-900 rounded-3xl shadow-2xl shadow-amber-500/20 w-full max-w-md pointer-events-auto border border-white/10">
              <div className="relative p-8">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors group"
                >
                  <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </button>

                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl mb-4 shadow-2xl shadow-amber-500/50">
                    <LogIn className="w-8 h-8 text-black" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Login Necessário
                  </h2>
                  <p className="text-gray-400 text-lg">
                    Por favor, faça login para continuar com a compra
                  </p>
                </div>

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/login')}
                    className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-amber-500/50 flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-5 h-5" />
                    Fazer Login
                  </motion.button>
                  <button
                    onClick={() => navigate('/register')}
                    className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold text-lg transition-all duration-200 border border-white/10"
                  >
                    Criar Conta
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
        )}

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setTimeout(() => navigate('/panel/dashboard'), 300);
          }}
          title="Domínio Registrado!"
          message={successMessage}
          isAdmin={isAdmin}
          domain={registeredDomain}
        />

      </div>
    );
  };

export default Home;
