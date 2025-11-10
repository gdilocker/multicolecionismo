import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';
import DomainSearch from '../components/DomainSearch';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

export default function RegisterDomain() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      setShowLoginPrompt(true);
    }
  }, [user]);

  const handleLoginClick = () => {
    navigate('/login', { state: { from: '/registrar-dominio' } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>

            <div className="flex items-center gap-2">
              <Logo size={32} />
              <span className="text-white font-bold text-lg">Multicolecionismo</span>
            </div>

            {!user ? (
              <button
                onClick={handleLoginClick}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
              >
                Entrar
              </button>
            ) : (
              <button
                onClick={() => navigate('/panel/dashboard')}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all"
              >
                Meu Painel
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-400/30 mb-6">
              <Globe className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 font-medium">Registre seu Domínio</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Sua Identidade Digital
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Começa Aqui
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Crie seu domínio personalizado .multicolecionismo.social e tenha sua página profissional na internet
            </p>
          </div>

          {/* Login Prompt for Non-logged Users */}
          {showLoginPrompt && (
            <div className="mb-8 p-6 bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-yellow-300 font-semibold mb-2">
                    Faça login para registrar seu domínio
                  </h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Você pode pesquisar domínios disponíveis agora, mas para concluir o registro você precisa estar logado.
                  </p>
                  <button
                    onClick={handleLoginClick}
                    className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-all"
                  >
                    Fazer Login Agora
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Domain Search Component */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
            <DomainSearch />
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">
                Domínio Exclusivo
              </h3>
              <p className="text-gray-400 text-sm">
                Seu nome único na internet com .multicolecionismo.social
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">
                Configuração Rápida
              </h3>
              <p className="text-gray-400 text-sm">
                Domínio ativo em minutos com configuração automática
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">
                Presença Profissional
              </h3>
              <p className="text-gray-400 text-sm">
                Aumente sua credibilidade com domínio personalizado
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">
              Pronto para começar?
            </h2>
            <p className="text-gray-300 mb-6">
              Digite seu nome desejado acima e veja se está disponível!
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => navigate('/valores')}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all border border-white/20"
              >
                Ver Planos
              </button>
              <button
                onClick={() => navigate('/suporte')}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
              >
                Precisa de Ajuda?
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/30 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            &copy; 2024 Multicolecionismo. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
