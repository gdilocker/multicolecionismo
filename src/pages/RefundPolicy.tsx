import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, Shield } from 'lucide-react';

const RefundPolicy: React.FC = () => {
  const sections = [
    {
      title: '1. REGISTRO DE DOMÍNIOS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            De acordo com as políticas da <strong className="text-black">ICANN</strong>, os registros de domínios são considerados <strong className="text-black">finais e não reembolsáveis</strong> após a conclusão do registro.
          </p>
          <p>Isso se aplica a:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Novos registros de domínio</li>
            <li>Renovações de domínio</li>
            <li>Transferências de domínio</li>
            <li>Restaurações de domínio</li>
          </ul>
        </div>
      )
    },
    {
      title: '2. EXCEÇÕES PARA REEMBOLSO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Reembolsos podem ser considerados nas seguintes situações:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li><strong className="text-black">Erro técnico da plataforma</strong> que impediu o registro correto</li>
            <li><strong className="text-black">Cobrança duplicada</strong> comprovada</li>
            <li><strong className="text-black">Falha na entrega do serviço</strong> por problema da Global Digital Identity</li>
          </ul>
          <p>
            Solicitações de reembolso devem ser feitas em até <strong className="text-black">7 dias corridos</strong> após a transação e serão analisadas caso a caso.
          </p>
        </div>
      )
    },
    {
      title: '3. CANCELAMENTO DE SERVIÇOS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Você pode cancelar seus serviços a qualquer momento através do painel de controle ou entrando em contato com nosso suporte.
          </p>
          <p>No entanto:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Cancelamentos <strong className="text-black">não resultam em reembolso automático</strong></li>
            <li>Domínios cancelados permanecerão ativos até o <strong className="text-black">final do período pago</strong></li>
            <li>Renovações automáticas podem ser <strong className="text-black">desativadas a qualquer momento</strong></li>
          </ul>
        </div>
      )
    },
    {
      title: '4. PROCESSO DE SOLICITAÇÃO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Para solicitar um reembolso elegível:</p>
          <ol className="space-y-2 text-[#6B7280]/70 list-decimal list-inside">
            <li>Entre em contato através do email <a href="mailto:contact@com.rich" className="text-[#3B82F6] hover:text-[#6B7280]">contact@com.rich</a></li>
            <li>Forneça o número do pedido e detalhes da transação</li>
            <li>Explique o motivo da solicitação</li>
            <li>Aguarde análise em até <strong className="text-black">5 dias úteis</strong></li>
          </ol>
        </div>
      )
    },
    {
      title: '5. MÉTODOS DE REEMBOLSO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Reembolsos aprovados serão processados através do <strong className="text-black">mesmo método de pagamento</strong> utilizado na compra original, dentro de <strong className="text-black">10 a 15 dias úteis</strong>.
          </p>
          <p>
            Todos os valores são processados em <strong className="text-black">dólares americanos (USD)</strong> via PayPal.
          </p>
        </div>
      )
    },
    {
      title: '6. CONTATO',
      content: (
        <div className="text-[#6B7280]/80 space-y-2">
          <p className="font-semibold text-black">Global Digital Identity LTD</p>
          <p>71–75 Shelton Street, Covent Garden</p>
          <p>Londres, WC2H 9JQ — Reino Unido</p>
          <p>Company No. 16339013</p>
          <p>
            E-mail: <a href="mailto:contact@com.rich" className="text-[#3B82F6] hover:text-[#6B7280]">contact@com.rich</a>
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-6 shadow-lg shadow-sm">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              Política de Reembolso e Cancelamento
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
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
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

export default RefundPolicy;
