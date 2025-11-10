import React from 'react';
import { XCircle, RefreshCw, Home, Mail, AlertCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const Failure: React.FC = () => {
  const query = useQuery();
  const provider = query.get('provider') || 'stripe';
  
  const troubleshootingSteps = [
    {
      title: 'Verifique os dados do cartão',
      description: 'Confirme se o número, data de validade e CVV estão corretos'
    },
    {
      title: 'Verifique o limite disponível',
      description: 'Certifique-se de que há limite suficiente no cartão'
    },
    {
      title: 'Tente outro método de pagamento',
      description: 'Use PayPal ou outro cartão de crédito'
    },
    {
      title: 'Entre em contato com seu banco',
      description: 'Verifique se o pagamento foi bloqueado por segurança'
    }
  ];

  const handleRetryPayment = () => {
    // In a real app, this would redirect back to checkout with preserved data
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Failure Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pagamento Não Processado
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            {provider === 'stripe' 
              ? 'Não foi possível concluir o pagamento. Tente novamente ou fale com o suporte.'
              : 'Pagamento cancelado ou não aprovado pelo PayPal.'
            }
          </p>
          
          <p className="text-gray-500">
            Não se preocupe, nenhum valor foi cobrado
          </p>
        </div>

        {/* Error Details */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              O que aconteceu?
            </h2>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-800">
              <strong>Erro de Pagamento:</strong> {provider === 'stripe' 
                ? 'O pagamento foi recusado pelo processador. Isso pode acontecer por diversos motivos, como dados incorretos, limite insuficiente ou bloqueio de segurança.'
                : 'O pagamento foi cancelado ou não foi aprovado pelo PayPal. Você pode tentar novamente ou usar outro método de pagamento.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Informações do Pedido
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Domínio:</span>
                  <span className="font-medium">exemplo.com.rich</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-medium">$29.99</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-red-600 font-medium">Falhou</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Disponibilidade do Domínio
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <p className="text-sm text-green-800">
                    <strong>Boa notícia!</strong> O domínio ainda está disponível 
                    e será reservado por mais 15 minutos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Como Resolver
          </h2>
          
          <div className="space-y-4">
            {troubleshootingSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alternative Payment Methods */}
        <div className="bg-slate-50 rounded-xl p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Métodos de Pagamento Alternativos
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">PayPal</h4>
              <p className="text-sm text-gray-600 mb-3">
                Use sua conta PayPal ou pague com cartão através do PayPal
              </p>
              <div className="flex items-center space-x-2 text-green-600 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Alta taxa de aprovação</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Outro Cartão</h4>
              <p className="text-sm text-gray-600 mb-3">
                Tente com um cartão de crédito diferente
              </p>
              <div className="flex items-center space-x-2 text-slate-900 text-sm">
                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                <span>Processamento imediato</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetryPayment}
            className="inline-flex items-center justify-center px-8 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Tentar Novamente</span>
          </button>
          
          <Link
            to="/"
            className="inline-flex items-center justify-center px-8 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Voltar ao Início</span>
          </Link>
        </div>

        {/* Support */}
        <div className="text-center mt-12 p-6 bg-gray-100 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ainda com Problemas?
          </h3>
          <p className="text-gray-600 mb-4">
            Nossa equipe de suporte está pronta para ajudar você a completar 
            seu registro de domínio.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/contato"
              className="inline-flex items-center px-6 py-2 bg-white text-slate-900 rounded-lg font-medium hover:bg-gray-50 transition-colors space-x-2"
            >
              <Mail className="w-5 h-5" />
              <span>Falar com Suporte</span>
            </Link>
            <a
              href="mailto:contact@com.rich"
              className="inline-flex items-center px-6 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors space-x-2"
            >
              <Mail className="w-5 h-5" />
              <span>Email Direto</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Failure;