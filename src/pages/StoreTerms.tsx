import React from 'react';
import { motion } from 'framer-motion';
import { Store, Calendar, Shield } from 'lucide-react';

const StoreTerms: React.FC = () => {
  const sections = [
    {
      title: '1. Visão Geral da Funcionalidade Loja',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            A funcionalidade <strong className="text-black">Loja</strong> permite que usuários criem e gerenciem uma vitrine digital de produtos e serviços.
            Esta seção complementa nossos Termos de Uso gerais.
          </p>
          <p>
            A Global Digital Identity LTD atua exclusivamente como <strong className="text-black">provedor de infraestrutura tecnológica</strong>,
            não sendo parte, intermediário ou responsável por transações comerciais.
          </p>
        </div>
      )
    },
    {
      title: '2. Natureza do Serviço',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <h3 className="text-lg font-semibold text-black">2.1. O Que Fornecemos</h3>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Espaço digital para exibição de produtos e serviços</li>
            <li>Ferramentas de customização visual</li>
            <li>Sistema de gerenciamento de catálogo</li>
          </ul>

          <h3 className="text-lg font-semibold text-black mt-4">2.2. O Que NÃO Fornecemos</h3>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Processamento de pagamentos</li>
            <li>Sistema de checkout ou carrinho</li>
            <li>Logística ou envio de produtos</li>
            <li>Atendimento ao cliente pós-venda</li>
            <li>Intermediação de disputas</li>
            <li>Garantias sobre produtos anunciados</li>
          </ul>
        </div>
      )
    },
    {
      title: '3. Responsabilidades do Usuário Vendedor',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Ao utilizar a Loja, você declara que:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Possui licenças necessárias para comercializar produtos/serviços</li>
            <li>Produtos estão em conformidade com leis aplicáveis</li>
            <li>Detém direitos sobre imagens, textos e marcas utilizados</li>
            <li>Cumprirá obrigações legais das transações</li>
            <li>Não comercializará produtos proibidos ou ilegais</li>
          </ul>
          <p className="mt-4">
            Você é responsável por negociar, processar pagamentos, emitir notas fiscais,
            cumprir prazos, gerenciar reclamações e arcar com obrigações tributárias.
          </p>
        </div>
      )
    },
    {
      title: '4. Produtos Proibidos',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>É <strong className="text-black">estritamente proibido</strong> anunciar:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Produtos ilegais (drogas, armas, falsificados)</li>
            <li>Conteúdo adulto explícito</li>
            <li>Produtos perigosos ou controlados</li>
            <li>Propriedade intelectual violada</li>
            <li>Serviços financeiros não regulamentados</li>
            <li>Medicamentos sem autorização</li>
            <li>Serviços ilegais (hacking, lavagem de dinheiro)</li>
          </ul>
          <p className="mt-4 font-semibold">
            Violação resultará em <strong className="text-black">remoção imediata, suspensão
            e possível ação legal</strong>, sem direito a reembolso.
          </p>
        </div>
      )
    },
    {
      title: '5. Limitação de Responsabilidade',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>A com.rich <strong className="text-black">NÃO possui responsabilidade</strong> sobre:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Qualidade, autenticidade ou legalidade dos produtos</li>
            <li>Capacidade dos vendedores de entregar</li>
            <li>Disputas entre compradores e vendedores</li>
            <li>Perdas financeiras de qualquer natureza</li>
            <li>Danos causados por produtos/serviços</li>
            <li>Fraude ou má-fé das partes</li>
          </ul>
          <p className="mt-4">
            Nossa função é <strong className="text-black">exclusivamente tecnológica</strong>.
            Não validamos vendedores, não facilitamos transações, não oferecemos proteção ao comprador.
          </p>
        </div>
      )
    },
    {
      title: '6. Privacidade e Dados',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Se você coletar dados de clientes, você é o <strong className="text-black">controlador de dados</strong> e deve:
          </p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Cumprir leis de proteção de dados (GDPR, LGPD)</li>
            <li>Obter consentimento adequado</li>
            <li>Implementar medidas de segurança</li>
            <li>Fornecer política de privacidade própria</li>
          </ul>
        </div>
      )
    },
    {
      title: '7. Taxas e Comissões',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            O acesso à Loja está disponível conforme planos de assinatura.
            A com.rich <strong className="text-black">não cobra comissões sobre vendas</strong>.
            Você paga apenas a assinatura da plataforma.
          </p>
        </div>
      )
    },
    {
      title: '8. Indenização',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Você concorda em <strong className="text-black">indenizar e isentar</strong> a Global Digital Identity LTD
            de reclamações, processos, perdas e despesas decorrentes de:
          </p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Uso da Loja e transações comerciais</li>
            <li>Violações de direitos de terceiros</li>
            <li>Descumprimento de obrigações legais</li>
          </ul>
        </div>
      )
    },
    {
      title: '9. Contato',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Para questões sobre estes Termos da Loja:</p>
          <ul className="space-y-1 text-[#6B7280]/70">
            <li><strong>E-mail:</strong> legal@com.rich</li>
            <li><strong>Formulário:</strong> <a href="/support" className="text-[#3B82F6] hover:text-[#6B7280]">com.rich/support</a></li>
            <li><strong>Endereço:</strong> Global Digital Identity LTD, 124 City Road, London, EC1V 2NX, England</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#F5F5F5] overflow-hidden">
      <div className="relative pt-32 pb-16">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-500 to-slate-900 rounded-2xl mb-6 shadow-lg shadow-sm">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              Termos da Loja
            </h1>
            <p className="text-xl text-[#6B7280]/70 mb-4">.com.rich</p>
            <div className="inline-flex items-center gap-2 text-[#6B7280]/80">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Última atualização: 01 de novembro de 2025</span>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="relative group mb-8">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-900 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
            <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-[#3B82F6] flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-black mb-2">Global Digital Identity LTD</h2>
                  <p className="text-[#6B7280]/80 leading-relaxed">
                    Termos específicos para uso comercial da funcionalidade Loja.
                    Complementa os Termos de Uso gerais da plataforma.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
                <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-black mb-4">{section.title}</h2>
                  {section.content}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
            <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-black mb-4">Aviso Importante para Compradores</h2>
              <div className="text-[#6B7280]/80 space-y-4">
                <p>
                  A com.rich não processa pagamentos nem oferece proteção ao comprador.
                  Verifique a reputação do vendedor antes de comprar.
                  Denuncie produtos suspeitos através do botão de denúncia.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
};

export default StoreTerms;
