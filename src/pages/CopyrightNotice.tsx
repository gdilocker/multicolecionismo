import React from 'react';
import { motion } from 'framer-motion';
import { Copyright, Calendar, Shield } from 'lucide-react';

const CopyrightNotice: React.FC = () => {
  const sections = [
    {
      title: '1. DIREITOS AUTORAIS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>© 2025 Global Digital Identity LTD. Todos os direitos reservados.</p>
          <p>
            Todo o conteúdo presente neste site, incluindo mas não limitado a textos, gráficos, logos, ícones, imagens, clipes de áudio, downloads digitais e compilações de dados, é propriedade da Global Digital Identity ou de seus fornecedores de conteúdo e protegido por leis internacionais de direitos autorais.
          </p>
        </div>
      )
    },
    {
      title: '2. MARCAS REGISTRADAS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>As seguintes marcas são propriedade da Global Digital Identity:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Global Digital Identity</li>
            <li>com.rich</li>
            <li>Logotipos e designs associados</li>
            <li>Slogans e marcas de serviço</li>
          </ul>
          <p>O uso não autorizado de qualquer marca registrada é estritamente proibido.</p>
        </div>
      )
    },
    {
      title: '3. LICENÇA DE USO DO SITE',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Concedemos uma licença limitada para:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Acessar e usar o site para fins pessoais e comerciais legítimos</li>
            <li>Visualizar e imprimir páginas para uso pessoal</li>
            <li>Compartilhar links para nosso conteúdo</li>
          </ul>
          <p>Esta licença não permite:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Modificar ou copiar materiais</li>
            <li>Usar para fins comerciais sem autorização</li>
            <li>Remover avisos de direitos autorais</li>
            <li>Transferir materiais para outra pessoa</li>
            <li>Fazer engenharia reversa de qualquer software</li>
          </ul>
        </div>
      )
    },
    {
      title: '4. CONTEÚDO DE TERCEIROS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Alguns conteúdos exibidos em nosso site podem ser fornecidos por terceiros. Estes materiais são protegidos pelos direitos autorais de seus respectivos proprietários.
          </p>
        </div>
      )
    },
    {
      title: '5. DMCA - NOTIFICAÇÃO DE VIOLAÇÃO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Respeitamos os direitos de propriedade intelectual de terceiros. Se você acredita que seu trabalho foi copiado de forma que constitua violação de direitos autorais, forneça as seguintes informações:
          </p>
          <ol className="space-y-2 text-[#6B7280]/70 list-decimal list-inside">
            <li>Assinatura física ou eletrônica do proprietário dos direitos autorais</li>
            <li>Identificação da obra protegida que foi violada</li>
            <li>Identificação do material infrator e sua localização</li>
            <li>Suas informações de contato (endereço, telefone, email)</li>
            <li>Declaração de boa-fé de que o uso não é autorizado</li>
            <li>Declaração de que as informações são precisas</li>
          </ol>
          <p>
            Envie notificações DMCA para:<br />
            Email: contact@com.rich<br />
            Assunto: "DMCA Takedown Notice"
          </p>
        </div>
      )
    },
    {
      title: '6. CONTRA-NOTIFICAÇÃO DMCA',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Se você acredita que seu conteúdo foi removido por erro, pode enviar uma contra-notificação incluindo:</p>
          <ol className="space-y-2 text-[#6B7280]/70 list-decimal list-inside">
            <li>Sua assinatura física ou eletrônica</li>
            <li>Identificação do conteúdo removido</li>
            <li>Declaração sob pena de perjúrio de boa-fé</li>
            <li>Seu nome, endereço e telefone</li>
            <li>Consentimento para jurisdição judicial</li>
          </ol>
        </div>
      )
    },
    {
      title: '7. SOFTWARE E CÓDIGO ABERTO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Alguns componentes de software podem ser licenciados sob licenças de código aberto. Estes componentes mantêm suas licenças originais e estão identificados conforme requerido.
          </p>
        </div>
      )
    },
    {
      title: '8. USO JUSTO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Reconhecemos os princípios de uso justo sob leis de direitos autorais. Uso limitado para fins educacionais, crítica, comentário ou reportagem pode ser permitido.
          </p>
        </div>
      )
    },
    {
      title: '9. LICENÇAS COMERCIAIS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Para uso comercial de nossos materiais, entre em contato conosco para obter uma licença apropriada:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Email: contact@com.rich</li>
            <li>Assunto: "Solicitação de Licença Comercial"</li>
            <li>Inclua detalhes sobre o uso pretendido</li>
          </ul>
        </div>
      )
    },
    {
      title: '10. VIOLAÇÕES E PENALIDADES',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Violações de direitos autorais podem resultar em:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Suspensão ou encerramento de conta</li>
            <li>Ação legal civil</li>
            <li>Responsabilidade por danos</li>
            <li>Custos legais e honorários advocatícios</li>
          </ul>
        </div>
      )
    },
    {
      title: '11. ATRIBUIÇÃO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Quando permitido usar nosso conteúdo, a atribuição adequada deve incluir:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Nome da Global Digital Identity</li>
            <li>Link para a fonte original</li>
            <li>Indicação de modificações feitas</li>
            <li>Aviso de direitos autorais</li>
          </ul>
        </div>
      )
    },
    {
      title: '12. CONTATO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Para questões sobre direitos autorais e licenciamento:<br />
            Global Digital Identity LTD<br />
            Email: contact@com.rich<br />
            Company № 16339013<br />
            Registered in England and Wales
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-6 shadow-lg shadow-sm">
              <Copyright className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              Aviso de Direitos Autorais e Licenciamento
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
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
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

export default CopyrightNotice;
