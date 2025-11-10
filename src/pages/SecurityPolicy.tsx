import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Calendar, Shield } from 'lucide-react';

const SecurityPolicy: React.FC = () => {
  const sections = [
    {
      title: '1. COMPROMISSO COM A SEGURANÇA',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            A <strong className="text-black">Global Digital Identity</strong> está comprometida em proteger a segurança e privacidade de seus usuários. Implementamos medidas técnicas e organizacionais para salvaguardar seus dados e serviços.
          </p>
        </div>
      )
    },
    {
      title: '2. MEDIDAS DE SEGURANÇA IMPLEMENTADAS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Nossa infraestrutura inclui:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li><strong className="text-black">Criptografia SSL/TLS</strong> para todas as comunicações</li>
            <li><strong className="text-black">Autenticação segura</strong> e proteção de senhas</li>
            <li><strong className="text-black">Firewalls</strong> e sistemas de detecção de intrusão</li>
            <li><strong className="text-black">Backups regulares</strong> e redundância de dados</li>
            <li><strong className="text-black">Monitoramento contínuo</strong> de segurança</li>
            <li><strong className="text-black">Atualizações</strong> e patches de segurança regulares</li>
            <li><strong className="text-black">Proteção contra DDoS</strong> e ataques cibernéticos</li>
          </ul>
        </div>
      )
    },
    {
      title: '3. RESPONSABILIDADES DO USUÁRIO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Você é responsável por:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Manter a <strong className="text-black">confidencialidade</strong> de suas credenciais de acesso</li>
            <li>Usar <strong className="text-black">senhas fortes e únicas</strong></li>
            <li>Atualizar regularmente suas informações de contato</li>
            <li>Notificar imediatamente sobre <strong className="text-black">acessos não autorizados</strong></li>
            <li>Implementar suas próprias medidas de segurança para conteúdo hospedado</li>
            <li>Fazer <strong className="text-black">backup</strong> de dados críticos</li>
            <li>Seguir práticas recomendadas de segurança</li>
          </ul>
        </div>
      )
    },
    {
      title: '4. PROTEÇÃO DE DADOS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Cumprimos regulamentações de proteção de dados incluindo:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li><strong className="text-black">UK GDPR</strong> (Data Protection Act 2018)</li>
            <li><strong className="text-black">GDPR</strong> (Regulamento Geral de Proteção de Dados da UE)</li>
            <li>Políticas da <strong className="text-black">ICANN</strong> sobre dados WHOIS</li>
            <li>Padrões internacionais de privacidade</li>
          </ul>
        </div>
      )
    },
    {
      title: '5. VULNERABILIDADES E INCIDENTES',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Se você descobrir uma vulnerabilidade de segurança:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Reporte imediatamente para <a href="mailto:contact@com.rich" className="text-[#3B82F6] hover:text-[#6B7280]">contact@com.rich</a></li>
            <li><strong className="text-black">Não explore</strong> a vulnerabilidade</li>
            <li>Não divulgue publicamente até que seja corrigida</li>
            <li>Forneça detalhes técnicos suficientes para reprodução</li>
            <li>Aguarde confirmação e plano de correção</li>
          </ul>
          <p>Agradecemos e reconhecemos divulgações responsáveis de vulnerabilidades.</p>
        </div>
      )
    },
    {
      title: '6. RESPOSTA A INCIDENTES',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Em caso de incidente de segurança:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Investigaremos <strong className="text-black">prontamente</strong></li>
            <li>Notificaremos usuários afetados quando apropriado</li>
            <li>Implementaremos <strong className="text-black">medidas corretivas</strong></li>
            <li>Cooperaremos com autoridades quando necessário</li>
            <li>Documentaremos e aprenderemos com o incidente</li>
          </ul>
        </div>
      )
    },
    {
      title: '7. LIMITAÇÕES DE RESPONSABILIDADE',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Apesar de nossos esforços:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Nenhum sistema é <strong className="text-black">100% seguro</strong></li>
            <li>Não podemos garantir segurança absoluta</li>
            <li>Você é responsável pelo conteúdo que hospeda</li>
            <li>Não somos responsáveis por vulnerabilidades de terceiros</li>
            <li>Limitações de responsabilidade conforme Termos de Uso</li>
          </ul>
        </div>
      )
    },
    {
      title: '8. CONTATO',
      content: (
        <div className="text-[#6B7280]/80 space-y-2">
          <p className="font-semibold text-black">Global Digital Identity LTD</p>
          <p>71–75 Shelton Street, Covent Garden</p>
          <p>Londres, WC2H 9JQ — Reino Unido</p>
          <p>Company No. 16339013</p>
          <p>
            E-mail de segurança: <a href="mailto:contact@com.rich" className="text-[#3B82F6] hover:text-[#6B7280]">contact@com.rich</a>
          </p>
          <p className="text-sm">Resposta prioritária para vulnerabilidades críticas</p>
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl mb-6 shadow-lg shadow-sm">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              Política de Segurança e Responsabilidade Técnica
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
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
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

export default SecurityPolicy;
