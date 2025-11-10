import React from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, Shield } from 'lucide-react';

const SocialTerms: React.FC = () => {
  const sections = [
    {
      title: '1. Visão Geral da Funcionalidade Social',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            A funcionalidade <strong className="text-black">Social</strong> permite criar, compartilhar e interagir
            com conteúdo através de posts, comentários e curtidas. Complementa nossos Termos de Uso gerais e Políticas de Conteúdo.
          </p>
          <p>
            A Global Digital Identity LTD fornece a infraestrutura tecnológica, mas não controla, edita ou
            endossa o conteúdo publicado pelos usuários.
          </p>
        </div>
      )
    },
    {
      title: '2. Elegibilidade e Acesso',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Para utilizar a funcionalidade Social, você deve ter:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li><strong>16 anos ou mais</strong> na União Europeia</li>
            <li><strong>13 anos ou mais</strong> nos Estados Unidos e demais jurisdições</li>
            <li>Ou a idade mínima exigida em sua jurisdição</li>
          </ul>
          <p className="mt-2">
            Menores de idade devem ter autorização dos pais. Podemos solicitar verificação de idade a qualquer momento.
          </p>
        </div>
      )
    },
    {
      title: '3. Conteúdo do Usuário',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Você mantém direitos sobre seu conteúdo, mas concede à com.rich uma licença
            <strong className="text-black"> mundial, não exclusiva e gratuita</strong> para usar,
            copiar, exibir e distribuir seu conteúdo na plataforma.
          </p>
          <p>Você é inteiramente responsável por:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Veracidade das informações publicadas</li>
            <li>Legalidade e conformidade com leis aplicáveis</li>
            <li>Não violação de direitos de terceiros</li>
            <li>Adequação aos Padrões da Comunidade</li>
          </ul>
        </div>
      )
    },
    {
      title: '4. Conteúdo Proibido',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>É <strong className="text-black">estritamente proibido</strong> publicar:</p>

          <h3 className="text-lg font-semibold text-black mt-4">4.1. Ilegal e Violência</h3>
          <ul className="space-y-1 text-[#6B7280]/70 list-disc list-inside">
            <li>Conteúdo ilegal, drogas, armas</li>
            <li>Ameaças de violência ou terrorismo</li>
            <li>Promoção de autolesão</li>
          </ul>

          <h3 className="text-lg font-semibold text-black mt-4">4.2. Discurso de Ódio e Assédio</h3>
          <ul className="space-y-1 text-[#6B7280]/70 list-disc list-inside">
            <li>Discriminação por raça, religião, gênero</li>
            <li>Assédio, bullying, doxxing</li>
            <li>Conteúdo íntimo não consensual</li>
          </ul>

          <h3 className="text-lg font-semibold text-black mt-4">4.3. Conteúdo Sexual</h3>
          <ul className="space-y-1 text-[#6B7280]/70 list-disc list-inside">
            <li>Pornografia ou nudez não artística</li>
            <li>Sexualização de menores (qualquer idade)</li>
            <li>Solicitação sexual</li>
          </ul>

          <h3 className="text-lg font-semibold text-black mt-4">4.4. Desinformação e Spam</h3>
          <ul className="space-y-1 text-[#6B7280]/70 list-disc list-inside">
            <li>Desinformação sobre saúde pública</li>
            <li>Manipulação de eleições</li>
            <li>Spam comercial excessivo</li>
            <li>Bots não autorizados</li>
          </ul>

          <p className="mt-4 font-semibold">
            Violação resulta em <strong className="text-black">remoção do conteúdo, advertência, suspensão ou banimento</strong>.
            Violações legais serão reportadas às autoridades.
          </p>
        </div>
      )
    },
    {
      title: '5. Privacidade e Controles',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Você pode controlar a visibilidade do conteúdo através de:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li><strong>Perfil Público:</strong> Qualquer pessoa pode ver</li>
            <li><strong>Perfil Privado:</strong> Apenas seguidores aprovados (se implementado)</li>
            <li><strong>Bloqueio:</strong> Impede interações específicas</li>
          </ul>
          <p className="mt-4">
            Ao usar a rede social, coletamos conteúdo, interações, metadados e dados de engajamento.
            Consulte nossa <a href="/politica" className="text-[#3B82F6] hover:text-[#6B7280]">Política de Privacidade</a> para detalhes.
          </p>
        </div>
      )
    },
    {
      title: '6. Moderação de Conteúdo',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Utilizamos:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li><strong>Moderação automatizada:</strong> Filtros de IA</li>
            <li><strong>Denúncias de usuários:</strong> Sistema de report</li>
            <li><strong>Revisão humana:</strong> Para casos complexos</li>
          </ul>
          <p className="mt-4">
            Podemos remover conteúdo, emitir advertências, suspender temporariamente ou banir permanentemente
            sem aviso prévio. Você pode apelar decisões através do <a href="/support" className="text-[#3B82F6] hover:text-[#6B7280]">suporte</a>.
          </p>
        </div>
      )
    },
    {
      title: '7. Denúncias',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Denuncie conteúdo inadequado através de:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Botão "Denunciar" em cada post</li>
            <li>Formulário em <a href="/support" className="text-[#3B82F6] hover:text-[#6B7280]">/support</a></li>
            <li>E-mail: abuse@com.rich</li>
          </ul>
          <p className="mt-4">
            Para violações de propriedade intelectual, utilize nosso processo DMCA conforme
            <a href="/aviso-direitos-autorais" className="text-[#3B82F6] hover:text-[#6B7280] ml-1">Política de Direitos Autorais</a>.
          </p>
        </div>
      )
    },
    {
      title: '8. Propriedade Intelectual',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Não publique conteúdo que você não criou ou não tem direito de usar:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Fotos/vídeos de terceiros sem permissão</li>
            <li>Músicas, filmes protegidos</li>
            <li>Artigos e textos sem autorização</li>
            <li>Logos e marcas registradas</li>
          </ul>
        </div>
      )
    },
    {
      title: '9. Publicidade e Promoções',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Se você publicar conteúdo patrocinado:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Divulgue claramente (#ad, #patrocinado)</li>
            <li>Cumpra regulamentações de publicidade (FTC, ASA, CONAR)</li>
            <li>Não faça alegações falsas</li>
            <li>Identifique relacionamentos com marcas</li>
          </ul>
        </div>
      )
    },
    {
      title: '10. Limitação de Responsabilidade',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>A com.rich <strong className="text-black">não endossa ou assume responsabilidade</strong> por:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Conteúdo publicado por usuários</li>
            <li>Conflitos entre usuários</li>
            <li>Danos resultantes de interações</li>
            <li>Links externos e sites de terceiros</li>
          </ul>
          <p className="mt-4">
            Nossa responsabilidade máxima está limitada ao valor pago nos últimos 12 meses, ou £100, o que for menor.
          </p>
        </div>
      )
    },
    {
      title: '11. Indenização',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Você concorda em <strong className="text-black">indenizar e isentar</strong> a Global Digital Identity LTD
            de reclamações, demandas e custos relacionados a:
          </p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Seu conteúdo ou comportamento</li>
            <li>Violações de direitos de terceiros</li>
            <li>Violações de leis ou regulamentos</li>
          </ul>
        </div>
      )
    },
    {
      title: '12. Contato',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Para questões sobre estes Termos da Rede Social:</p>
          <ul className="space-y-1 text-[#6B7280]/70">
            <li><strong>Denúncias:</strong> abuse@com.rich</li>
            <li><strong>Legal:</strong> legal@com.rich</li>
            <li><strong>Suporte:</strong> <a href="/support" className="text-[#3B82F6] hover:text-[#6B7280]">com.rich/support</a></li>
            <li><strong>Direitos autorais:</strong> copyright@com.rich</li>
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
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              Termos da Rede Social
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
                    Termos específicos para uso da funcionalidade de Rede Social.
                    Complementa os Termos de Uso gerais e Padrões da Comunidade.
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
              <h2 className="text-2xl font-bold text-black mb-4">Dicas para Uso Seguro</h2>
              <div className="text-[#6B7280]/80 space-y-4">
                <ul className="space-y-2 list-disc list-inside">
                  <li>Pense antes de postar - conteúdo público pode ser visto por qualquer pessoa</li>
                  <li>Proteja sua privacidade - não compartilhe informações pessoais sensíveis</li>
                  <li>Seja gentil e respeitoso - trate outros como gostaria de ser tratado</li>
                  <li>Denuncie comportamento inadequado - ajude a manter a comunidade segura</li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
            <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-black mb-4">Aviso Importante sobre Menores</h2>
              <div className="text-[#6B7280]/80 space-y-4">
                <p>
                  Pais e responsáveis devem monitorar o uso por menores. Se você acredita que um menor está
                  sendo explorado ou em perigo, reporte para abuse@com.rich e contate autoridades locais.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
};

export default SocialTerms;
