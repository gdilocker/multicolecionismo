import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Home, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const PayPalReturn: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [error, setError] = useState('');

  const orderId = query.get('token') || query.get('orderId');
  const payerId = query.get('PayerID');
  const isMock = query.get('mock') === 'true';

  console.log('🔍 PayPalReturn - URL params:', { orderId, payerId, isMock, fullUrl: window.location.href });
  console.log('🔍 Estado atual:', { isProcessing, result, error });

  useEffect(() => {
    const processPayment = async () => {
      if (!orderId) {
        setError('ID do pedido não encontrado');
        setResult('error');
        setIsProcessing(false);
        return;
      }

      try {
        const paymentMode = isMock ? 'MOCK' : 'PayPal';
        console.log(`🔄 Processando captura ${paymentMode}:`, orderId);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }

        // Use mock endpoint if in mock mode
        const captureEndpoint = isMock ? 'mock-payment-capture' : 'paypal-capture';

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${captureEndpoint}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ orderId })
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erro HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ Captura ${paymentMode} resultado:`, data);

        // Log mock payment details if in mock mode
        if (isMock && data.data) {
          console.log('🧪 Mock Payment Details:', {
            order_id: data.data.order_id,
            domain_id: data.data.domain_id,
            subscription_id: data.data.subscription_id,
            total_cents: data.data.total_cents,
            processing_time: data.processing_time_ms + 'ms'
          });
        }

        if (data.success) {
          setResult('success');

          if (window.opener) {
            console.log('✅ Pagamento confirmado, fechando popup...');
            setTimeout(() => {
              window.close();
            }, 2000);
          } else {
            setTimeout(() => {
              navigate('/panel/dashboard');
            }, 2000);
          }
        } else {
          throw new Error('Pagamento não foi completado');
        }

      } catch (err) {
        console.error('❌ Erro na captura:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setResult('error');
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [orderId, payerId, navigate]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 text-center max-w-md w-full">
          <Loader2 className="w-16 h-16 text-slate-400 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Processando pagamento...
          </h2>
          <p className="text-blue-200/80 text-lg">
            Aguarde enquanto confirmamos seu pagamento PayPal
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    );
  }

  if (result === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 text-center max-w-md w-full">
          <div className="bg-green-500/20 rounded-full p-4 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            {isMock ? '🧪 Pagamento Mock Confirmado!' : 'Pagamento Confirmado!'}
          </h2>
          <p className="text-blue-200/80 text-lg mb-6">
            {isMock && <span className="block text-sm mb-2 text-yellow-300">⚠️ MODO TESTE - Nenhum pagamento real foi processado</span>}
            {window.opener ? 'Esta janela será fechada automaticamente...' : 'Redirecionando para o dashboard...'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="bg-red-500/20 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <div className="text-red-400 text-5xl">✕</div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Erro no Processamento
            </h1>
            <p className="text-blue-200/70 text-lg">
              Houve um problema ao processar seu pagamento PayPal
            </p>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
            <p className="text-red-300 text-center">
              <strong className="font-semibold">Erro:</strong> {error || 'Erro desconhecido no processamento'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-slate-500 to-slate-900 text-white rounded-xl font-semibold hover:from-slate-700 hover:to-slate-600 transition-all duration-200 shadow-lg gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Tentar Novamente</span>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center justify-center px-8 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-200 gap-2"
            >
              <Home className="w-5 h-5" />
              <span>Voltar ao Início</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayPalReturn;