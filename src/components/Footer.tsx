import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Shield, Clock, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';


export default function Footer() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavigation = (to: string) => {
    navigate(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-6">
          <div className="md:col-span-2">
            <div className="mb-4">
              <Logo size={56} />
            </div>
            <p className="text-[#6B7280] text-sm leading-relaxed max-w-md mb-4">
              A Global Digital Identity é detentora da mais prestigiada extensão digital do mundo, o domínio .com.rich.
              Oferecemos registro, proteção e gestão profissional com infraestrutura de alta performance, suporte internacional 24/7 e tecnologia de ponta.
              Eleve sua presença online com um domínio .com.rich que reflete sucesso, credibilidade e sofisticação.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-black mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleNavigation('/club')}
                  className="text-[#6B7280] hover:text-black transition-colors text-sm"
                >
                  Sobre o Rich Club
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/valores')}
                  className="text-[#6B7280] hover:text-black transition-colors text-sm"
                >
                  Planos
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/premium')}
                  className="text-[#6B7280] hover:text-black transition-colors text-sm flex items-center gap-1.5"
                >
                  Premium
                  <span className="text-[9px] px-1.5 py-0.5 bg-yellow-500 text-white rounded-full font-bold tracking-tight">Supreme</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/faq')}
                  className="text-[#6B7280] hover:text-black transition-colors text-sm"
                >
                  FAQ
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/social')}
                  className="text-[#6B7280] hover:text-black transition-colors text-sm"
                >
                  Rede Social
                </button>
              </li>
              {user && (
                <li>
                  <button
                    onClick={() => handleNavigation('/suporte')}
                    className="text-[#6B7280] hover:text-black transition-colors text-sm"
                  >
                    Suporte
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => handleNavigation('/contato')}
                  className="text-[#6B7280] hover:text-black transition-colors text-sm"
                >
                  Contato
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-black mb-4">Afiliados</h3>
            <ul className="space-y-2">
              {[
                { to: '/afiliados/sobre', label: 'Sobre o Programa' },
                { to: '/afiliados/termos', label: 'Como Funciona' }
              ].map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleNavigation(link.to)}
                    className="text-[#6B7280] hover:text-black transition-colors text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-black mb-4">Políticas</h3>
            <ul className="space-y-2">
              {[
                { to: '/termos', label: 'Termos de Uso' },
                { to: '/politica', label: 'Privacidade' },
                { to: '/cookies', label: 'Cookies' },
                { to: '/politica-reembolso', label: 'Reembolso' },
                { to: '/politica-suspensao', label: 'Suspensão' },
                { to: '/politica-uso-aceitavel', label: 'Uso Aceitável' },
                { to: '/politica-transferencia-dominio', label: 'Transferência' },
                { to: '/adendo-processamento-dados', label: 'Processamento de Dados' },
                { to: '/politica-acessibilidade', label: 'Acessibilidade' },
                { to: '/politica-exclusao', label: 'Exclusão' },
                { to: '/politica-solicitacao-dados', label: 'Solicitação de Dados' }
              ].map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleNavigation(link.to)}
                    className="text-[#6B7280] hover:text-black transition-colors text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-black mb-4">Segurança & Legal</h3>
            <ul className="space-y-2">
              {[
                { to: '/politica-seguranca', label: 'Segurança' },
                { to: '/politica-padroes-comunidade', label: 'Padrões da Comunidade' },
                { to: '/politica-conteudo-usuario', label: 'Conteúdo do Usuário' },
                { to: '/aviso-direitos-autorais', label: 'Direitos Autorais' },
                { to: '/conformidade-legal', label: 'Conformidade Legal' },
                { to: '/policies/store-terms', label: 'Termos da Loja' },
                { to: '/policies/social-terms', label: 'Termos da Rede Social' }
              ].map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleNavigation(link.to)}
                    className="text-[#6B7280] hover:text-black transition-colors text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Pagamento Seguro</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Suporte 24/7</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <Shield className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>SSL Certificado</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#6B7280]">
            <div>
              <p>© 2025 Global Digital Identity LTD. All rights reserved.</p>
              <p className="text-xs mt-1">Company №  16339013 • Registered in England and Wales</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
