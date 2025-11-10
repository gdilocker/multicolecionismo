import React from 'react';
import { motion } from 'framer-motion';
import { Scale, Calendar, Shield } from 'lucide-react';

const LegalCompliance: React.FC = () => {
  const sections = [
    {
      title: '1. INFORMAÇÕES DA EMPRESA',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            <strong className="text-black">Nome Legal:</strong> Global Digital Identity LTD<br />
            <strong className="text-black">Número de Registro:</strong> 16339013<br />
            <strong className="text-black">Jurisdição:</strong> England and Wales<br />
            <strong className="text-black">Tipo de Empresa:</strong> Limited Company<br />
            <strong className="text-black">Email de Contato:</strong> contact@com.rich
          </p>
        </div>
      )
    },
    {
      title: '2. CONFORMIDADE REGULATÓRIA',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>A Global Digital Identity está em conformidade com:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li><strong>ICANN:</strong> Registrador acreditado e em conformidade com políticas</li>
            <li><strong>GDPR:</strong> Regulamento Geral de Proteção de Dados da UE</li>
            <li><strong>Companies Act 2006:</strong> Legislação corporativa do Reino Unido</li>
            <li><strong>Data Protection Act 2018:</strong> Lei de proteção de dados do UK</li>
          </ul>
        </div>
      )
    },
    {
      title: '3. ACREDITAÇÃO ICANN',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Como registrador acreditado pela ICANN, cumprimos:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Registrar Accreditation Agreement (RAA)</li>
            <li>Consensus Policies da ICANN</li>
            <li>Temporary Specification for gTLD Registration Data</li>
            <li>Transfer Policy (IRTP)</li>
            <li>Uniform Domain Name Dispute Resolution Policy (UDRP)</li>
            <li>Uniform Rapid Suspension (URS)</li>
          </ul>
        </div>
      )
    },
    {
      title: '4. PROTEÇÃO DE DADOS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Conformidade com GDPR:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Data Protection Officer (DPO) designado</li>
            <li>Processamento legal de dados pessoais</li>
            <li>Direitos do titular de dados respeitados</li>
            <li>Notificação de violação de dados conforme requerido</li>
            <li>Transferências internacionais adequadas</li>
            <li>Privacy by Design implementado</li>
          </ul>
        </div>
      )
    },
    {
      title: '5. OBRIGAÇÕES FISCAIS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Cumprimento de obrigações fiscais:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Registro VAT quando aplicável</li>
            <li>Declarações fiscais em dia</li>
            <li>Conformidade com UK Tax Law</li>
            <li>Emissão de faturas conforme regulamentação</li>
          </ul>
        </div>
      )
    },
    {
      title: '6. COMBATE À FRAUDE',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Medidas anti-fraude e conformidade:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Know Your Customer (KYC) quando necessário</li>
            <li>Anti-Money Laundering (AML) procedures</li>
            <li>Verificação de identidade em transações suspeitas</li>
            <li>Cooperação com autoridades em investigações</li>
            <li>Monitoramento de transações anômalas</li>
          </ul>
        </div>
      )
    },
    {
      title: '7. PROPRIEDADE INTELECTUAL',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Conformidade com leis de PI:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Copyright, Designs and Patents Act 1988</li>
            <li>Trade Marks Act 1994</li>
            <li>Digital Millennium Copyright Act (DMCA)</li>
            <li>Procedimentos para denúncias de violação</li>
          </ul>
        </div>
      )
    },
    {
      title: '8. RESOLUÇÃO DE DISPUTAS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Conformidade com políticas de disputa:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>UDRP (Uniform Domain Name Dispute Resolution Policy)</li>
            <li>URS (Uniform Rapid Suspension)</li>
            <li>Procedimentos alternativos de resolução de disputas</li>
            <li>Cooperação com provedores de resolução autorizados</li>
          </ul>
        </div>
      )
    },
    {
      title: '9. SEGURANÇA DA INFORMAÇÃO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Conformidade com padrões de segurança:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>ISO 27001 (práticas de gestão de segurança)</li>
            <li>PCI DSS para processamento de pagamentos</li>
            <li>Criptografia de dados em trânsito e em repouso</li>
            <li>Auditorias de segurança regulares</li>
            <li>Plano de resposta a incidentes</li>
          </ul>
        </div>
      )
    },
    {
      title: '10. ACESSIBILIDADE',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Compromisso com acessibilidade digital:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Conformidade com WCAG 2.1 (Web Content Accessibility Guidelines)</li>
            <li>Equality Act 2010 compliance</li>
            <li>Esforços contínuos para melhorar acessibilidade</li>
          </ul>
        </div>
      )
    },
    {
      title: '11. TRANSPARÊNCIA CORPORATIVA',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Conformidade com requisitos de transparência:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Informações corporativas públicas acessíveis</li>
            <li>Relatórios anuais conforme requerido</li>
            <li>Disclosure de informações materiais</li>
            <li>Conformidade com Companies House requirements</li>
          </ul>
        </div>
      )
    },
    {
      title: '12. RESPONSABILIDADE SOCIAL',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Compromissos éticos e sociais:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Modern Slavery Act compliance</li>
            <li>Práticas trabalhistas éticas</li>
            <li>Sustentabilidade ambiental</li>
            <li>Diversidade e inclusão</li>
          </ul>
        </div>
      )
    },
    {
      title: '13. AUDITORIAS E CERTIFICAÇÕES',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Auditorias regulares garantem conformidade contínua:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Auditorias internas trimestrais</li>
            <li>Auditorias externas anuais</li>
            <li>Revisões de conformidade pela ICANN</li>
            <li>Avaliações de segurança por terceiros</li>
          </ul>
        </div>
      )
    },
    {
      title: '14. ATUALIZAÇÕES DE CONFORMIDADE',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Monitoramos e nos adaptamos a:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Novas legislações e regulamentações</li>
            <li>Mudanças em políticas da ICANN</li>
            <li>Evolução de padrões da indústria</li>
            <li>Melhores práticas emergentes</li>
          </ul>
        </div>
      )
    },
    {
      title: '15. CONTATO PARA CONFORMIDADE',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Para questões relacionadas à conformidade legal:<br />
            <strong className="text-black">Email:</strong> contact@com.rich<br />
            <strong className="text-black">Assunto:</strong> "Legal Compliance Inquiry"
          </p>
          <p className="mt-4">
            <strong className="text-black">Data Protection Officer:</strong><br />
            Email: contact@com.rich<br />
            Assunto: "DPO - Data Protection Inquiry"
          </p>
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
              <Scale className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              Declaração de Conformidade Legal
            </h1>
            <p className="text-xl text-[#6B7280]/70 mb-4">.com.rich</p>
            <div className="inline-flex items-center gap-2 text-[#6B7280]/80">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Última atualização: 21 de outubro de 2025</span>
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
                  <p className="text-[#6B7280]/80 leading-relaxed mb-2">
                    Empresa registrada na Inglaterra e País de Gales sob o número <strong>Company No. 16339013</strong>
                  </p>
                  <p className="text-[#6B7280]/70 text-sm">
                    71–75 Shelton Street, Covent Garden, Londres, WC2H 9JQ, Reino Unido
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
        </motion.section>
      </div>
    </div>
  );
};

export default LegalCompliance;
