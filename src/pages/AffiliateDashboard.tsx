import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, TrendingUp, Copy, Check, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AffiliateTermsModal } from '../components/AffiliateTermsModal';
import { AffiliateROICalculator } from '../components/AffiliateROICalculator';
import PageLayout from '../components/PageLayout';
import Logo from '../components/Logo';

interface AffiliateData {
  affiliate_code: string;
  status: string;
  total_sales: number;
  total_earnings: number;
  available_balance: number;
  commission_rate: number;
}

interface CommissionInfo {
  plan: string;
  rate: number;
  price: number;
}

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [copied, setCopied] = useState(false);
  const [acceptingTerms, setAcceptingTerms] = useState(false);
  const [commissionRates, setCommissionRates] = useState<CommissionInfo[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    checkAffiliateStatus();
  }, [user, navigate]);

  const checkAffiliateStatus = async () => {
    try {
      setLoading(true);

      // Check if user has accepted terms
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_affiliate, affiliate_terms_accepted_at')
        .eq('user_id', user?.id)
        .single();

      if (profile?.is_affiliate && profile?.affiliate_terms_accepted_at) {
        setHasAcceptedTerms(true);
        await Promise.all([loadAffiliateData(), loadCommissionRates()]);
      } else {
        // Show terms modal on first access
        setShowTermsModal(true);
        await loadCommissionRates();
      }
    } catch (error) {
      console.error('Error checking affiliate status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAffiliateData = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setAffiliateData(data);
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    }
  };

  const loadCommissionRates = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('name, commission_rate, price_monthly_cents')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      if (data) {
        const rates = data.map(plan => ({
          plan: plan.name,
          rate: parseFloat(plan.commission_rate || '0'),
          price: plan.price_monthly_cents / 100
        }));
        setCommissionRates(rates);
      }
    } catch (error) {
      console.error('Error loading commission rates:', error);
    }
  };

  const handleAcceptTerms = async () => {
    try {
      setAcceptingTerms(true);

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

      setHasAcceptedTerms(true);
      setShowTermsModal(false);
      setAffiliateData({
        affiliate_code: result.affiliate_code,
        status: result.status,
        total_sales: 0,
        total_earnings: 0,
        available_balance: 0,
        commission_rate: 0.25
      });
    } catch (error) {
      console.error('Error accepting terms:', error);
      alert('Erro ao aceitar os termos. Tente novamente.');
    } finally {
      setAcceptingTerms(false);
    }
  };

  const copyAffiliateLink = () => {
    if (!affiliateData?.affiliate_code) return;

    const link = `${window.location.origin}/r/${affiliateData.affiliate_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
        </div>
      </PageLayout>
    );
  }

  if (!hasAcceptedTerms) {
    return (
      <>
        <PageLayout>
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#C6941E] rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-black" />
            </div>
            <div className="flex justify-center mb-6">
              <Logo size={80} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Programa de Afiliados Multicolecionismo</h1>
            <p className="text-gray-400 text-lg mb-8">
              Ganhe comissões recorrentes promovendo identidades digitais premium em multicolecionismo.social
            </p>
            <div className="bg-gradient-to-br from-[#1F1F1F] to-[#252525] border border-[#D4AF37]/20 rounded-2xl p-8 text-left">
              <h2 className="text-2xl font-bold text-white mb-4">Antes de começar</h2>
              <p className="text-gray-400 mb-6">
                Para participar do programa de afiliados, você precisa ler e aceitar os termos e condições.
              </p>
              <button
                onClick={() => setShowTermsModal(true)}
                className="w-full bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black font-bold py-4 rounded-xl hover:shadow-lg transition-all"
              >
                Ler e Aceitar os Termos
              </button>
            </div>
          </div>
        </PageLayout>

        <AffiliateTermsModal
          isOpen={showTermsModal}
          onClose={() => !acceptingTerms && navigate(-1)}
          onAccept={handleAcceptTerms}
        />
      </>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard de Afiliados</h1>
            <p className="text-gray-400">Acompanhe suas comissões e referências no Multicolecionismo</p>
          </div>
          <Logo size={48} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#1F1F1F] to-[#252525] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-[#D4AF37]" />
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{affiliateData?.total_sales || 0}</div>
            <div className="text-sm text-gray-400">Referências</div>
          </div>

          <div className="bg-gradient-to-br from-[#1F1F1F] to-[#252525] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-emerald-500" />
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              R$ {(affiliateData?.total_earnings || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Ganhos Totais (BRL)</div>
          </div>

          <div className="bg-gradient-to-br from-[#1F1F1F] to-[#252525] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <span className="text-sm text-gray-400">Disponível</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              R$ {(affiliateData?.available_balance || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Disponível para Saque</div>
          </div>
        </div>

        {/* Affiliate Link */}
        <div className="bg-gradient-to-br from-[#1F1F1F] to-[#252525] border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-[#D4AF37]" />
            Seu Link de Afiliado
          </h2>

          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/r/${affiliateData?.affiliate_code}`}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm"
            />
            <button
              onClick={copyAffiliateLink}
              className="bg-[#D4AF37] hover:bg-[#F4D03F] text-black font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-gradient-to-r from-brand-gold/10 to-brand-gold-dark/10 border border-brand-gold/30 rounded-xl p-4">
            <p className="text-brand-gold text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                Compartilhe este link e ganhe <strong>comissões recorrentes</strong> sobre todas as assinaturas dos usuários que você indicar para o Multicolecionismo.
              </span>
            </p>
          </div>
        </div>

        {/* Commission Rates */}
        <div className="bg-gradient-to-br from-[#1F1F1F] to-[#252525] border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-gold" />
            Taxas de Comissão por Plano
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {commissionRates.map((info) => (
              <div key={info.plan} className="bg-black/40 border border-white/10 rounded-xl p-4">
                <div className="text-sm text-gray-400 mb-1">{info.plan}</div>
                <div className="text-2xl font-bold text-brand-gold mb-1">{(info.rate * 100).toFixed(0)}%</div>
                <div className="text-xs text-gray-500">R$ {info.price.toFixed(2)}/mês</div>
                <div className="text-xs text-brand-gold-light mt-2">Você ganha: R$ {(info.price * info.rate).toFixed(2)}/mês</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-4">
            💰 Quanto mais alto o plano que seus referidos assinarem, maior será sua comissão mensal recorrente!
          </p>
        </div>

        {/* ROI Calculator */}
        <div className="mb-8">
          <AffiliateROICalculator commissionRates={commissionRates} />
        </div>

        {/* Status */}
        <div className="bg-gradient-to-br from-[#1F1F1F] to-[#252525] border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Status da Conta</h2>
          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-2 rounded-full font-medium ${
                affiliateData?.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-500'
                  : affiliateData?.status === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-500'
                  : 'bg-red-500/20 text-red-500'
              }`}
            >
              {affiliateData?.status === 'active' && 'Ativo'}
              {affiliateData?.status === 'pending' && 'Pendente de Aprovação'}
              {affiliateData?.status === 'suspended' && 'Suspenso'}
            </div>
            {affiliateData?.status === 'pending' && (
              <p className="text-gray-400 text-sm">
                Sua conta será ativada em breve pela equipe
              </p>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
