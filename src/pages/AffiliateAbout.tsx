import React from 'react';
import { Users, DollarSign, Link2, TrendingUp, AlertCircle } from 'lucide-react';
import PolicyLayout from '../components/PolicyLayout';
import PolicySection from '../components/PolicySection';
import { AffiliateROICalculator } from '../components/AffiliateROICalculator';

const AffiliateAbout: React.FC = () => {
  const sections = [
    {
      title: 'Comissões mensais recorrentes',
      icon: DollarSign,
      content: (
        <div className="text-[#6B7280] space-y-4">
          <div className="bg-gradient-to-r from-emerald-50 to-slate-100 border-l-4 border-emerald-500 p-4 rounded-r-lg mb-4">
            <p className="font-semibold text-black mb-2">✓ Comissões mensais recorrentes</p>
            <p className="leading-relaxed text-[#6B7280]/90">
              Você recebe comissões mensais recorrentes em cada venda realizada através do seu link de parceria, conforme validação e confirmação dos pagamentos.
            </p>
          </div>
          <div className="space-y-3">
            <p className="leading-relaxed">
              As comissões são vinculadas a transações efetivamente pagas e podem ser solicitadas após 30 dias da confirmação do pagamento.
            </p>
            <div className="bg-white/80 rounded-lg p-4 space-y-3">
              <div className="space-y-2">
                <p className="font-semibold text-emerald-700 text-sm">Plano Prime (25% de comissão):</p>
                <p className="text-black pl-4"><strong>USD $12.50</strong> por venda realizada</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-yellow-700 text-sm">Plano Elite (50% de comissão):</p>
                <p className="text-black pl-4"><strong>USD $17.50</strong> por venda realizada (Membros Prime)</p>
                <p className="text-black pl-4"><strong>USD $35.00</strong> por venda realizada (Membros Elite)</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-amber-700 text-sm">Plano Supreme (50% de comissão):</p>
                <p className="text-black pl-4">50% sobre mensalidade base (equivalente ao Elite)</p>
              </div>
            </div>
          </div>
          <p className="leading-relaxed">
            Todos os detalhes estão disponíveis nos <a href="/afiliados/termos" className="text-[#3B82F6] hover:underline font-medium">Termos de Afiliados</a>.
          </p>
        </div>
      )
    },
    {
      title: 'USD 200 Saque mínimo',
      icon: DollarSign,
      content: (
        <div className="text-[#6B7280] space-y-4">
          <p className="leading-relaxed">
            O saque mínimo é de <strong className="text-black">US$ 200 (duzentos dólares americanos)</strong>. Quando seu saldo aprovado atingir esse valor, você poderá solicitar um saque. Os valores ficam disponíveis para saque 30 dias após cada recebimento.
          </p>
        </div>
      )
    },
    {
      title: 'Como funciona?',
      icon: TrendingUp,
      content: (
        <div className="text-[#6B7280] space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-white text-sm font-bold">1</span>
              Registre-se e ative seu plano
            </h3>
            <p className="leading-relaxed pl-9">
              Adquira sua licença exclusiva .com.rich, crie sua conta e ative um dos planos pagos disponíveis.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-white text-sm font-bold">2</span>
              Compartilhe seu link de vendas exclusivo
            </h3>
            <p className="leading-relaxed pl-9">
              Após ativar sua conta, acesse a aba "Link de Vendas" e copie seu link exclusivo para começar a divulgar.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-white text-sm font-bold">3</span>
              Acompanhe suas vendas
            </h3>
            <p className="leading-relaxed pl-9">
              Sempre que um cliente adquirir um <strong className="text-black">plano de assinatura</strong> através do seu link, você receberá comissão recorrente a cada pagamento realizado.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 ml-9 mt-2">
              <p className="text-sm text-amber-900">
                <strong>Importante:</strong> Comissões aplicam-se <strong>exclusivamente</strong> a vendas de planos de assinatura (Prime, Elite, Supreme). Domínios premium são receita exclusiva da empresa.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-white text-sm font-bold">4</span>
              Solicite suas comissões
            </h3>
            <p className="leading-relaxed pl-9">
              Após 30 dias da confirmação do pagamento da assinatura, você poderá solicitar o saque conforme os Termos do Programa. Os pagamentos são processados dentro do prazo de até 10 dias úteis, conforme política vigente.
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Aviso',
      icon: AlertCircle,
      content: (
        <div className="text-[#6B7280] space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-3">
                <p className="leading-relaxed text-amber-900">
                  O recebimento de comissões está condicionado à validação interna, manutenção da conta ativa e confirmação da assinatura pelo cliente. <strong>É OBRIGATÓRIO ter licença .com.rich ativa E plano de assinatura pago para participar.</strong>
                </p>
                <p className="leading-relaxed text-amber-900 font-medium">
                  Este programa não garante retorno financeiro e não constitui oferta de investimento.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <PolicyLayout
      icon={Users}
      title="Programa de Afiliados"
      subtitle="Sobre o Programa"
      lastUpdated="21 de outubro de 2025"
    >
      <div className="relative group mb-8">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-slate-900 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
        <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Users className="w-8 h-8 text-emerald-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-black mb-2">Programa de Parceria</h2>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                Ao se tornar Membro Prime ou Elite, você recebe comissões em todas as vendas realizadas pelos seus convidados.
              </p>
              <div className="space-y-4">
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg">
                  <p className="font-bold text-emerald-900 mb-2">Membro Prime - 25% de Comissão</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-emerald-800"><strong>$12.50</strong> por venda do Plano Prime</p>
                    <p className="text-emerald-800"><strong>$17.50</strong> por venda do Plano Elite</p>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                  <p className="font-bold text-yellow-900 mb-2">Membro Elite - 50% de Comissão</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-yellow-800"><strong>$25.00</strong> por venda do Plano Prime</p>
                    <p className="text-yellow-800"><strong>$35.00</strong> por venda do Plano Elite</p>
                  </div>
                </div>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <p className="font-bold text-amber-900 mb-2">Membro Supreme - 50% de Comissão</p>
                  <p className="text-amber-800 text-sm">50% recorrente sobre mensalidade base (equivalente ao Elite)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="my-12">
        <AffiliateROICalculator />
      </div>

      <div className="space-y-8">
        {sections.map((section, index) => (
          <PolicySection
            key={index}
            title={section.title}
            content={section.content}
            index={index}
          />
        ))}
      </div>

      <div className="mt-12 bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-blue-300 rounded-2xl p-8 shadow-lg">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-8 h-8 text-blue-700 flex-shrink-0 mt-1" />
          <div className="text-left">
            <h3 className="text-xl font-bold text-blue-900 mb-3">Documento Oficial Registrado</h3>
            <p className="text-[#6B7280]/90 leading-relaxed mb-3">
              Os <strong className="text-black">Termos de Afiliados do .com.rich</strong> são documentos oficiais registrados na <strong className="text-black">Companies House</strong>, órgão do governo do Reino Unido responsável pelo registro e supervisão de empresas.
            </p>
            <p className="text-[#6B7280]/90 leading-relaxed mb-3">
              Essa formalização garante <strong className="text-black">transparência jurídica e autenticidade internacional</strong>, assegurando que todas as regras de afiliação, comissões e licenciamento sigam padrões legais do Reino Unido.
            </p>
            <div className="bg-white/70 rounded-lg p-4 border-l-4 border-blue-600">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                📋 Referência Legal:
              </p>
              <p className="text-sm text-[#6B7280]/90">
                <strong className="text-black">Global Digital Identity LTD</strong> — Registrada na Companies House – England & Wales
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gradient-to-br from-black to-[#1a1b2e] rounded-2xl p-8 text-center">
        <h3 className="text-2xl font-bold text-white mb-3">Pronto para começar?</h3>
        <p className="text-white/80 mb-6 max-w-2xl mx-auto">
          Adquira sua licença .com.rich, ative um plano pago (Prime ou Elite) e comece a receber comissões mensais recorrentes hoje mesmo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-black rounded-lg font-semibold transition-all duration-200"
          >
            Adquirir Licença
          </a>
          <a
            href="/afiliados/termos"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-semibold transition-all duration-200"
          >
            Ver Termos Completos
          </a>
        </div>
      </div>
    </PolicyLayout>
  );
};

export default AffiliateAbout;
