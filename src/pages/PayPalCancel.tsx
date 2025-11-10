import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, Home } from 'lucide-react';

const PayPalCancel: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F5] pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Cancel Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-yellow-600" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pagamento Cancelado
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            Você cancelou o pagamento no PayPal.
          </p>
          
          <p className="text-gray-500">
            Nenhum valor foi cobrado e o domínio ainda está disponível.
          </p>
        </div>

        {/* Cancel Details */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            O que aconteceu?
          </h2>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <p className="text-yellow-800">
              <strong>Pagamento Cancelado:</strong> Você optou por cancelar o pagamento 
              durante o processo no PayPal. Isso é completamente normal e nenhum valor 
              foi cobrado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Próximos Passos
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-slate-500 rounded-full mr-3"></div>
                  O domínio ainda está disponível
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-slate-500 rounded-full mr-3"></div>
                  Você pode tentar novamente a qualquer momento
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-slate-500 rounded-full mr-3"></div>
                  Experimente outro método de pagamento
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Métodos Alternativos
              </h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900">Cartão de Crédito</h4>
                  <p className="text-sm text-gray-600">Pagamento direto via Stripe</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900">PayPal Novamente</h4>
                  <p className="text-sm text-gray-600">Tente o PayPal mais uma vez</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/checkout"
            className="inline-flex items-center justify-center px-8 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Tentar Novamente</span>
          </Link>
          
          <Link
            to="/"
            className="inline-flex items-center justify-center px-8 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Voltar ao Início</span>
          </Link>
        </div>

        {/* Help Section */}
        <div className="text-center mt-12 p-6 bg-slate-50 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Precisa de Ajuda?
          </h3>
          <p className="text-gray-600 mb-4">
            Se você teve problemas durante o pagamento ou tem dúvidas sobre 
            o processo PayPal, nossa equipe está aqui para ajudar.
          </p>
          <Link
            to="/contato"
            className="inline-flex items-center px-6 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors space-x-2"
          >
            <span>Falar com Suporte</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PayPalCancel;