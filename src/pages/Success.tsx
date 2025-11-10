import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Mail, Calendar, Shield } from 'lucide-react';

export default function Success() {
  const urlParams = new URLSearchParams(window.location.search);
  const domain = urlParams.get('domain') || 'seu-dominio.com.rich';
  const orderId = urlParams.get('order_id') || 'N/A';
  const provider = urlParams.get('provider') || 'paypal';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4 pt-20">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pagamento Aprovado!
            </h1>
            <p className="text-lg text-gray-600">
              Seu domínio <span className="font-semibold text-slate-900">{domain}</span> está sendo processado
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <Mail className="w-5 h-5 text-slate-900" />
                <span>E-mail de confirmação enviado</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Calendar className="w-5 h-5 text-green-500" />
                <span>Registro em até 24h</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Shield className="w-5 h-5 text-slate-500" />
                <span>WHOIS Privacy incluído</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p><strong>ID do Pedido:</strong> {orderId}</p>
              <p><strong>Método de Pagamento:</strong> {provider === 'paypal' ? 'PayPal' : 'Stripe'}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/app"
                className="inline-flex items-center justify-center px-6 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Acessar Painel de Controle
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Voltar ao Início
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Dúvidas? Entre em contato conosco em{' '}
              <a href="mailto:support@com.rich" className="text-slate-900 hover:underline">
                support@com.rich
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}