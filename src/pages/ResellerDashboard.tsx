import React, { useState, useEffect } from 'react';
import Logo from '../components/Logo';
import { motion } from 'framer-motion';

import {
  Store,
  DollarSign,
  TrendingUp,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  Download,
  Clock,
  Users,
  MousePointerClick,
  Target,
  Eye,
  Calendar,
  ChevronRight,
  Award,
  Percent,
  Wallet
} from 'lucide-react';
import { PanelLayout } from '../components/PanelLayout';
import { PageHeader } from '../components/PageHeader';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AffiliateTermsModal } from '../components/AffiliateTermsModal';

interface ResellerData {
  id: string;
  affiliate_code: string;
  status: string;
  commission_rate: number;
  total_sales: number;
  total_earnings: number;
  available_balance: number;
  withdrawn_balance: number;
  payment_method: string | null;
  approved_at: string | null;
  created_at: string;
}

interface Commission {
  id: string;
  order_id: string;
  sale_amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
  confirmed_at: string | null;
}

interface ClickStats {
  total_clicks: number;
  unique_clicks: number;
  conversion_rate: number;
  last_30_days: number;
}

const ResellerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [reseller, setReseller] = useState<ResellerData | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [clickStats, setClickStats] = useState<ClickStats>({
    total_clicks: 0,
    unique_clicks: 0,
    conversion_rate: 0,
    last_30_days: 0
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasCheckedTerms, setHasCheckedTerms] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchResellerData();
    }
  }, [user?.id]);

  const generateAffiliateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleAcceptTerms = async () => {
    if (!user) return;

    try {
      setCreating(true);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-accept-terms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to accept terms');
      }

      const result = await response.json();

      // Close modal and refresh data
      setShowTermsModal(false);
      await fetchResellerData();
    } catch (error) {
      console.error('Erro ao aceitar termos:', error);
      alert('Erro ao aceitar os termos. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  const createAffiliateAccount = async () => {
    if (!user) return;

    try {
      setCreating(true);
      const affiliateCode = generateAffiliateCode();

      const { data, error } = await supabase
        .from('affiliates')
        .insert([{
          user_id: user.id,
          affiliate_code: affiliateCode,
          status: 'active',
          commission_rate: 0.50,
          total_sales: 0,
          total_earnings: 0,
          available_balance: 0,
          withdrawn_balance: 0,
          approved_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setReseller(data);
    } catch (error) {
      console.error('Erro ao criar conta de afiliado:', error);
    } finally {
      setCreating(false);
    }
  };

  const fetchResellerData = async () => {
    try {
      setLoading(true);

      // Check if user has accepted affiliate terms
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('affiliate_terms_accepted_at')
        .eq('user_id', user?.id)
        .maybeSingle();

      // Buscar dados do afiliado
      const { data: resellerData, error: resellerError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (resellerError) throw resellerError;

      setHasCheckedTerms(true);

      // If no affiliate account and no terms accepted, show modal
      if (!resellerData && !profileData?.affiliate_terms_accepted_at) {
        setShowTermsModal(true);
        setLoading(false);
        return;
      }

      if (resellerData) {
        setReseller(resellerData);

        // Buscar comissões
        const { data: commissionsData, error: commissionsError } = await supabase
          .from('affiliate_commissions')
          .select('*')
          .eq('affiliate_id', resellerData.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (commissionsError) throw commissionsError;
        setCommissions(commissionsData || []);

        // Buscar estatísticas de cliques
        const { data: clicksData } = await supabase
          .from('affiliate_clicks')
          .select('*')
          .eq('affiliate_id', resellerData.id);

        if (clicksData) {
          const last30Days = new Date();
          last30Days.setDate(last30Days.getDate() - 30);

          const recentClicks = clicksData.filter(click =>
            new Date(click.clicked_at) >= last30Days
          );

          const uniqueIPs = new Set(clicksData.map(click => click.ip_address)).size;
          const conversionRate = clicksData.length > 0
            ? (resellerData.total_sales / clicksData.length) * 100
            : 0;

          setClickStats({
            total_clicks: clicksData.length,
            unique_clicks: uniqueIPs,
            conversion_rate: conversionRate,
            last_30_days: recentClicks.length
          });
        }

        // Buscar histórico de saques
        const { data: withdrawalsData } = await supabase
          .from('affiliate_withdrawals')
          .select('*')
          .eq('affiliate_id', resellerData.id)
          .order('created_at', { ascending: false });

        if (withdrawalsData) {
          setWithdrawalHistory(withdrawalsData);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalRequest = async () => {
    if (!reseller || !paymentMethod || !paymentDetails) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    const amount = parseFloat(withdrawalAmount || reseller.available_balance.toString());

    if (amount < 200) {
      alert('O valor mínimo para saque é US$ 200');
      return;
    }

    if (amount > reseller.available_balance) {
      alert('Saldo insuficiente para este saque');
      return;
    }

    try {
      setWithdrawing(true);

      const { data, error } = await supabase
        .from('affiliate_withdrawals')
        .insert([{
          affiliate_id: reseller.id,
          amount,
          payment_method: paymentMethod,
          payment_details: { info: paymentDetails },
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar saldo disponível
      const { error: updateError } = await supabase
        .from('affiliates')
        .update({
          available_balance: reseller.available_balance - amount
        })
        .eq('id', reseller.id);

      if (updateError) throw updateError;

      alert('Solicitação de saque enviada com sucesso! Você receberá uma resposta em até 5 dias úteis.');
      setShowWithdrawalModal(false);
      setWithdrawalAmount('');
      setPaymentMethod('');
      setPaymentDetails('');
      fetchResellerData();
    } catch (error) {
      console.error('Erro ao solicitar saque:', error);
      alert('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setWithdrawing(false);
    }
  };

  const copyResellerLink = () => {
    if (reseller) {
      const link = `${window.location.origin}/?ref=${reseller.affiliate_code}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <PanelLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando painel...</p>
          </div>
        </div>
      </PanelLayout>
    );
  }

  if (!reseller) {
    return (
      <PanelLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Programa de Afiliados</h1>
              <p className="text-slate-500">Receba comissões promovendo planos de assinatura</p>
            </div>
            <img
              src="/logo.png"
              alt="Com.rich Logo"
              className="h-16 object-contain"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden p-12 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl text-center mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/80 to-slate-900/80"></div>
            <div className="relative z-10">
              <img
                src="/logo.png"
                alt="Com.rich"
                className="h-20 mx-auto mb-6 drop-shadow-lg"
              />
              <h2 className="text-2xl font-bold text-white mb-3">
                Torne-se um Afiliado
              </h2>
              <p className="text-white/90 mb-8 max-w-xl mx-auto">
                Clique no botão abaixo para ativar sua conta de afiliado e começar a receber comissões recorrentes: 25% (Prime) ou 50% (Elite) em cada pagamento do cliente.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={createAffiliateAccount}
                disabled={creating}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-600 border-t-transparent"></div>
                    Criando conta...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Ativar Conta de Afiliado
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <Percent className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Comissões Recorrentes</h3>
              <p className="text-slate-600 text-sm mb-2">
                25% (Prime) ou 50% (Elite) a cada pagamento
              </p>
              <div className="space-y-1">
                <div className="text-xs text-emerald-600 font-semibold">Prime: 25% recorrente</div>
                <div className="text-xs text-yellow-600 font-semibold">Elite: $35/mês</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-slate-900" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Comissão Recorrente</h3>
              <p className="text-slate-600 text-sm">
                Receba comissão recorrente em cada venda realizada através do seu link de parceria
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Ativação Instantânea</h3>
              <p className="text-slate-600 text-sm">
                Comece a promover imediatamente após ativar
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Como Funciona</h3>
            <div className="space-y-4">
              {[
                {
                  title: 'Ative sua conta de afiliado',
                  description: 'Clique no botão acima para ativar gratuitamente'
                },
                {
                  title: 'Receba seu link exclusivo',
                  description: 'Um código único será gerado automaticamente'
                },
                {
                  title: 'Compartilhe seu link',
                  description: 'Receba comissão recorrente de 25% (Prime) ou 50% (Elite) a cada pagamento'
                },
                {
                  title: 'Solicite saques',
                  description: 'Saque a partir de US$ 200 via Wise, PayPal ou transferência (disponível após 30 dias)'
                }
              ].map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-slate-800 font-semibold mb-1">{step.title}</p>
                    <p className="text-slate-600 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PanelLayout>
    );
  }

  const resellerLink = `${window.location.origin}/?ref=${reseller.affiliate_code}`;

  return (
    <PanelLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Afiliado"
          subtitle="Acompanhe suas vendas, cliques e comissões em tempo real"
        />

        {/* Link de Afiliado - Destaque no Topo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-8 mb-8 shadow-xl shadow-slate-500/20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-500/90 to-slate-900/90"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Seu Link de Afiliado</h3>
                <p className="text-slate-200 text-sm">Compartilhe este link para receber comissões em planos de assinatura</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 mb-4">
              <p className="text-white text-sm leading-relaxed mb-2">
                <span className="font-semibold">💰 Como funciona a comissão:</span>
              </p>
              <ul className="text-white text-sm space-y-1.5 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-300 font-bold mt-0.5">✓</span>
                  <span><span className="font-bold">Planos de assinatura</span>: comissão RECORRENTE a cada mensalidade paga pelo cliente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-300 font-bold mt-0.5">✗</span>
                  <span><span className="font-bold">Domínios Premium</span>: <strong className="text-red-200">SEM comissão</strong> (receita exclusiva da empresa)</span>
                </li>
              </ul>
              <p className="text-slate-200 text-xs mt-3">
                <strong>Percentuais:</strong> 25% (afiliado Prime) • 50% (afiliado Elite)<br/>
                <strong>Base:</strong> valor líquido (após impostos e custos). Cobranças não liquidadas não geram comissão.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={resellerLink}
              readOnly
              className="flex-1 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-xl px-4 py-3 text-white placeholder-slate-200 font-mono text-sm truncate"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={copyResellerLink}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all whitespace-nowrap w-full sm:w-auto"
            >
              {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </motion.button>
          </div>
        </motion.div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl blur opacity-20 group-hover:opacity-30 transition" />
            <div className="relative bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-slate-900" />
                </div>
                <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded-full">Total</span>
              </div>
              <p className="text-3xl font-bold text-slate-800 mb-1">{reseller.total_sales}</p>
              <p className="text-sm text-slate-500 font-medium">Vendas Realizadas</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition" />
            <div className="relative bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Acumulado</span>
              </div>
              <p className="text-3xl font-bold text-slate-800 mb-1">US$ {reseller.total_earnings.toFixed(2)}</p>
              <p className="text-sm text-slate-500 font-medium">Total Ganho</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition" />
            <div className="relative bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">Disponível</span>
              </div>
              <p className="text-3xl font-bold text-slate-800 mb-1">US$ {reseller.available_balance.toFixed(2)}</p>
              <p className="text-sm text-slate-500 font-medium">Saldo Disponível</p>
              {reseller.available_balance >= 200 && (
                <button
                  onClick={() => setShowWithdrawalModal(true)}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Solicitar Saque
                </button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-900 rounded-2xl blur opacity-20 group-hover:opacity-30 transition" />
            <div className="relative bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Download className="w-5 h-5 text-slate-600" />
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">Sacado</span>
              </div>
              <p className="text-3xl font-bold text-slate-800 mb-1">US$ {reseller.withdrawn_balance.toFixed(2)}</p>
              <p className="text-sm text-slate-500 font-medium">Total Retirado</p>
            </div>
          </motion.div>
        </div>

        {/* Informações sobre Saques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 mb-3">Informações sobre Saques</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <DollarSign className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-800 font-semibold">US$ 200 - Saque mínimo</p>
                    <p className="text-slate-600 text-sm">Quando seu saldo aprovado atingir o valor mínimo de retirada, você poderá solicitar um saque.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-800 font-semibold">Período de aprovação</p>
                    <p className="text-slate-600 text-sm">Os valores ficam disponíveis para saque 30 dias após cada recebimento.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Estatísticas de Cliques e Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white border border-slate-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm text-slate-500 font-medium">Total de Cliques</p>
            </div>
            <p className="text-3xl font-bold text-slate-800">{clickStats.total_clicks}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white border border-slate-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Eye className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 font-medium">Visitantes Únicos</p>
            </div>
            <p className="text-3xl font-bold text-slate-800">{clickStats.unique_clicks}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white border border-slate-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 font-medium">Taxa de Conversão</p>
            </div>
            <p className="text-3xl font-bold text-slate-800">{clickStats.conversion_rate.toFixed(1)}%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white border border-slate-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 font-medium">Últimos 30 Dias</p>
            </div>
            <p className="text-3xl font-bold text-slate-800">{clickStats.last_30_days}</p>
          </motion.div>
        </div>

        {/* Comissões Recentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white border border-slate-200 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Histórico de Comissões</h3>
              <p className="text-slate-500 text-sm mt-1">Suas 10 comissões mais recentes</p>
            </div>
            {commissions.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-slate-900 hover:text-slate-900 font-semibold text-sm"
              >
                Ver Todas
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          {commissions.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-10 h-10 text-slate-400" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Nenhuma comissão ainda</h4>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Compartilhe seu link de afiliado nas redes sociais, blogs ou com amigos para começar a receber comissões!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-4 px-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Data</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Valor da Venda</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Sua Comissão</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700 font-medium">
                            {new Date(commission.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-700 font-semibold">
                          US$ {commission.sale_amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-base text-emerald-600 font-bold">
                          US$ {commission.commission_amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
                          commission.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                          commission.status === 'paid' ? 'bg-green-100 text-green-700' :
                          commission.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            commission.status === 'confirmed' ? 'bg-emerald-500' :
                            commission.status === 'paid' ? 'bg-green-500' :
                            commission.status === 'cancelled' ? 'bg-red-500' :
                            'bg-amber-500'
                          }`} />
                          {commission.status === 'confirmed' ? 'Confirmada' :
                           commission.status === 'paid' ? 'Paga' :
                           commission.status === 'cancelled' ? 'Cancelada' :
                           'Pendente'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button className="text-slate-900 hover:text-slate-900 text-sm font-semibold">
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Histórico de Saques */}
        {withdrawalHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white border border-slate-200 rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4">Histórico de Saques</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Valor</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Método</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalHistory.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {new Date(withdrawal.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold text-slate-800">
                        US$ {withdrawal.amount.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600 capitalize">
                        {withdrawal.payment_method}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          withdrawal.status === 'completed' ? 'bg-green-100 text-green-700' :
                          withdrawal.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          withdrawal.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            withdrawal.status === 'completed' ? 'bg-green-500' :
                            withdrawal.status === 'processing' ? 'bg-blue-500' :
                            withdrawal.status === 'rejected' ? 'bg-red-500' :
                            'bg-amber-500'
                          }`} />
                          {withdrawal.status === 'completed' ? 'Concluído' :
                           withdrawal.status === 'processing' ? 'Processando' :
                           withdrawal.status === 'rejected' ? 'Rejeitado' :
                           'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal de Solicitação de Saque */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Solicitar Saque</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Valor do Saque
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">US$</span>
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder={reseller.available_balance.toFixed(2)}
                    min="200"
                    max={reseller.available_balance}
                    step="0.01"
                    className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Disponível: US$ {reseller.available_balance.toFixed(2)} | Mínimo: US$ 200.00
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Método de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  <option value="pix">PIX</option>
                  <option value="bank_transfer">Transferência Bancária</option>
                  <option value="paypal">PayPal</option>
                  <option value="crypto">Criptomoeda</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Detalhes do Pagamento
                </label>
                <textarea
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  placeholder={
                    paymentMethod === 'pix' ? 'Chave PIX (CPF, email, telefone ou aleatória)' :
                    paymentMethod === 'bank_transfer' ? 'Banco, Agência, Conta' :
                    paymentMethod === 'paypal' ? 'Email do PayPal' :
                    paymentMethod === 'crypto' ? 'Endereço da carteira' :
                    'Informações para receber o pagamento'
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Atenção:</strong> Sua solicitação será analisada em até 5 dias úteis.
                  Certifique-se de que as informações estão corretas.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowWithdrawalModal(false)}
                disabled={withdrawing}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleWithdrawalRequest}
                disabled={withdrawing || !paymentMethod || !paymentDetails}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawing ? 'Processando...' : 'Confirmar Saque'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <AffiliateTermsModal
        isOpen={showTermsModal}
        onClose={() => {}}
        onAccept={handleAcceptTerms}
      />
    </PanelLayout>
  );
};

export default ResellerDashboard;
