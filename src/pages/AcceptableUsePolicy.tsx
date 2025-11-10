import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Calendar, Shield } from 'lucide-react';

const AcceptableUsePolicy: React.FC = () => {
  const sections = [
    {
      title: '1. PROPÓSITO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Esta Política de Uso Aceitável define as diretrizes para o uso adequado dos serviços da Global Digital Identity. Ao utilizar nossos serviços, você concorda em seguir estas diretrizes.
          </p>
        </div>
      )
    },
    {
      title: '2. USOS PROIBIDOS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>É expressamente proibido utilizar nossos serviços para:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Atividades ilegais ou fraudulentas</li>
            <li>Phishing, spam ou distribuição de malware</li>
            <li>Violação de propriedade intelectual de terceiros</li>
            <li>Hospedagem ou distribuição de conteúdo ilegal</li>
            <li>Ataques a sistemas ou redes (DDoS, hacking, etc.)</li>
            <li>Venda ou distribuição de produtos falsificados</li>
            <li>Conteúdo que promova violência, ódio ou discriminação</li>
            <li>Exploração de menores</li>
            <li>Pornografia infantil ou conteúdo de abuso</li>
            <li>Esquemas de pirâmide ou fraudes financeiras</li>
          </ul>
        </div>
      )
    },
    {
      title: '3. SPAM E COMUNICAÇÕES EM MASSA',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>É proibido:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Enviar emails não solicitados em massa</li>
            <li>Usar nossos serviços para campanhas de spam</li>
            <li>Coletar endereços de email sem consentimento</li>
            <li>Falsificar cabeçalhos de email</li>
            <li>Utilizar listas de email compradas ou roubadas</li>
          </ul>
        </div>
      )
    },
    {
      title: '4. SEGURANÇA E INTEGRIDADE',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Você não deve:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Tentar acessar contas ou sistemas sem autorização</li>
            <li>Interferir com a operação normal dos serviços</li>
            <li>Sobrecarregar a infraestrutura da plataforma</li>
            <li>Distribuir vírus, worms ou outros códigos maliciosos</li>
            <li>Contornar medidas de segurança implementadas</li>
          </ul>
        </div>
      )
    },
    {
      title: '5. PROPRIEDADE INTELECTUAL',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>É proibido:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Registrar domínios que infrinjam marcas registradas</li>
            <li>Usar nossos serviços para violar direitos autorais</li>
            <li>Fazer cybersquatting ou typosquatting</li>
            <li>Registrar domínios de má-fé</li>
          </ul>
        </div>
      )
    },
    {
      title: '6. CONFORMIDADE LEGAL',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Você deve:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Cumprir todas as leis e regulamentos aplicáveis</li>
            <li>Respeitar as políticas da ICANN</li>
            <li>Fornecer informações precisas e atualizadas no registro</li>
            <li>Responder a solicitações legítimas de informação</li>
          </ul>
        </div>
      )
    },
    {
      title: '7. CONSEQUÊNCIAS DE VIOLAÇÃO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Violações desta política podem resultar em:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Advertência formal</li>
            <li>Suspensão temporária da conta</li>
            <li>Encerramento definitivo da conta</li>
            <li>Cancelamento de domínios sem reembolso</li>
            <li>Ação legal quando aplicável</li>
          </ul>
        </div>
      )
    },
    {
      title: '8. DENÚNCIAS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Para denunciar violações desta política:<br />
            Email: contact@com.rich<br />
            Todas as denúncias serão investigadas confidencialmente.
          </p>
        </div>
      )
    },
    {
      title: '9. ATUALIZAÇÕES',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Esta política pode ser atualizada periodicamente. Mudanças significativas serão comunicadas por email. O uso continuado dos serviços após alterações constitui aceitação das novas diretrizes.
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl mb-6 shadow-lg shadow-sm">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              Política de Uso Aceitável
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
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
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

export default AcceptableUsePolicy;
