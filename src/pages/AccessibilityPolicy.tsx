import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Calendar, Shield } from 'lucide-react';

const AccessibilityPolicy: React.FC = () => {
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
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              Política de Acessibilidade
            </h1>
            <p className="text-xl text-[#6B7280]/70 mb-4">.com.rich</p>
            <div className="inline-flex items-center gap-2 text-[#6B7280]/80">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Última atualização: 26 de outubro de 2025</span>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="relative group mb-12">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-900 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-500" />
            <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-8">
              <div className="text-[#6B7280]/80 space-y-4">
                <p>
                  A <strong className="text-black">Global Digital Identity LTD</strong>, operadora da plataforma <strong className="text-black">Com.rich</strong>, está comprometida em garantir que nossos serviços sejam acessíveis a todas as pessoas, independentemente de suas habilidades ou tecnologias utilizadas.
                </p>
                <p>
                  Acreditamos que a acessibilidade digital é um direito fundamental e nos esforçamos continuamente para melhorar a experiência de todos os usuários, seguindo as melhores práticas e diretrizes internacionais de acessibilidade web.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {[
              {
                title: '1. COMPROMISSO COM A ACESSIBILIDADE',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Nosso compromisso com a acessibilidade inclui:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Conformidade com as <strong className="text-black">Web Content Accessibility Guidelines (WCAG) 2.1</strong> no nível AA</li>
                      <li>Implementação de recursos que facilitem a navegação para todos os usuários</li>
                      <li>Testes regulares com ferramentas de acessibilidade e usuários reais</li>
                      <li>Treinamento contínuo de nossa equipe sobre práticas de acessibilidade</li>
                      <li>Monitoramento e correção proativa de problemas de acessibilidade</li>
                      <li>Melhoria contínua baseada em feedback de usuários</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '2. RECURSOS DE ACESSIBILIDADE IMPLEMENTADOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">2.1 Navegação por Teclado</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Todos os recursos e funcionalidades são acessíveis via teclado</li>
                      <li>Ordem lógica de navegação por TAB</li>
                      <li>Indicadores visuais claros de foco</li>
                      <li>Atalhos de teclado para funções principais</li>
                      <li>Navegação consistente em todas as páginas</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.2 Leitores de Tela</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Compatibilidade com JAWS, NVDA, VoiceOver e outros leitores populares</li>
                      <li>Estrutura semântica HTML adequada (headings, landmarks, etc.)</li>
                      <li>Textos alternativos descritivos para todas as imagens</li>
                      <li>ARIA labels e roles quando necessário</li>
                      <li>Anúncios de atualizações dinâmicas de conteúdo</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.3 Contraste e Legibilidade</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Contraste mínimo de 4.5:1 para texto normal</li>
                      <li>Contraste de 3:1 para texto grande e elementos interativos</li>
                      <li>Fontes legíveis e ajustáveis</li>
                      <li>Opção de zoom até 200% sem perda de funcionalidade</li>
                      <li>Espaçamento adequado entre elementos</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.4 Multimídia</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Legendas para conteúdo em vídeo</li>
                      <li>Transcrições de áudio quando aplicável</li>
                      <li>Controles acessíveis para players de mídia</li>
                      <li>Alternativas textuais para conteúdo não textual</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.5 Formulários e Interatividade</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Labels claros e associados a todos os campos</li>
                      <li>Mensagens de erro descritivas e acessíveis</li>
                      <li>Instruções claras para preenchimento</li>
                      <li>Tempo suficiente para completar ações</li>
                      <li>Confirmações para ações críticas</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.6 Responsividade</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Design responsivo para diferentes tamanhos de tela</li>
                      <li>Suporte a orientação vertical e horizontal</li>
                      <li>Funcionalidade completa em dispositivos móveis</li>
                      <li>Gestos alternativos para interações touch</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '3. TECNOLOGIAS ASSISTIVAS SUPORTADAS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Nossa plataforma foi testada e é compatível com:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Leitores de tela:</strong> JAWS, NVDA, VoiceOver, TalkBack</li>
                      <li><strong className="text-black">Ampliadores de tela:</strong> ZoomText, MAGic</li>
                      <li><strong className="text-black">Software de reconhecimento de voz:</strong> Dragon NaturallySpeaking</li>
                      <li><strong className="text-black">Navegadores com recursos de acessibilidade:</strong> Chrome, Firefox, Safari, Edge</li>
                      <li><strong className="text-black">Dispositivos móveis:</strong> iOS VoiceOver, Android TalkBack</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '4. NAVEGAÇÃO E ESTRUTURA',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">4.1 Estrutura da Página</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Hierarquia clara de cabeçalhos (H1, H2, H3...)</li>
                      <li>Landmarks ARIA para navegação rápida (header, nav, main, footer)</li>
                      <li>Skip links para pular para conteúdo principal</li>
                      <li>Breadcrumbs para orientação de localização</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">4.2 Links e Botões</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Textos descritivos e significativos</li>
                      <li>Diferenciação clara entre links visitados e não visitados</li>
                      <li>Áreas clicáveis suficientemente grandes (mínimo 44x44 pixels)</li>
                      <li>Estados hover, focus e active claramente indicados</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '5. CONTEÚDO ACESSÍVEL',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">5.1 Texto</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Linguagem clara e objetiva</li>
                      <li>Parágrafos com comprimento adequado</li>
                      <li>Evitamos jargões técnicos sem explicação</li>
                      <li>Formatação consistente</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">5.2 Cores e Visual</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Informação não transmitida apenas por cor</li>
                      <li>Padrões e texturas como alternativa visual</li>
                      <li>Animações podem ser pausadas ou desativadas</li>
                      <li>Sem conteúdo piscante que possa causar convulsões</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">5.3 Documentos e Downloads</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>PDFs acessíveis com tags apropriadas</li>
                      <li>Documentos Office com estrutura adequada</li>
                      <li>Indicação clara do formato e tamanho do arquivo</li>
                      <li>Alternativas em HTML quando possível</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '6. TESTES E MONITORAMENTO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Realizamos testes contínuos de acessibilidade utilizando:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Ferramentas automatizadas:</strong> axe, WAVE, Lighthouse</li>
                      <li><strong className="text-black">Testes manuais:</strong> Navegação por teclado, leitores de tela</li>
                      <li><strong className="text-black">Testes com usuários:</strong> Feedback de pessoas com deficiência</li>
                      <li><strong className="text-black">Auditorias periódicas:</strong> Avaliações trimestrais de conformidade</li>
                      <li><strong className="text-black">Monitoramento contínuo:</strong> Sistema de alertas para problemas de acessibilidade</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '7. LIMITAÇÕES CONHECIDAS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Apesar de nossos esforços, algumas limitações ainda podem existir:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Conteúdo de terceiros integrado pode não atender aos nossos padrões de acessibilidade</li>
                      <li>Funcionalidades legadas em processo de atualização</li>
                      <li>Alguns recursos avançados podem ter suporte limitado em tecnologias assistivas mais antigas</li>
                    </ul>
                    <p>
                      Estamos trabalhando ativamente para resolver essas limitações e agradecemos qualquer feedback que nos ajude a melhorar.
                    </p>
                  </div>
                )
              },
              {
                title: '8. COMO RELATAR PROBLEMAS DE ACESSIBILIDADE',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Se você encontrar qualquer barreira de acessibilidade em nossa plataforma, por favor, nos informe:
                    </p>
                    <div className="relative group mt-4">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-900 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
                      <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                          <Shield className="w-6 h-6 text-[#3B82F6] flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="text-lg font-semibold text-black mb-2">Contato para Acessibilidade</h3>
                            <ul className="space-y-2 text-[#6B7280]/80">
                              <li><strong className="text-black">Email:</strong> <a href="mailto:accessibility@com.rich" className="text-[#3B82F6] hover:underline">accessibility@com.rich</a></li>
                              <li><strong className="text-black">Email geral:</strong> <a href="mailto:contact@com.rich" className="text-[#3B82F6] hover:underline">contact@com.rich</a></li>
                              <li><strong className="text-black">Prazo de resposta:</strong> Até 5 dias úteis</li>
                            </ul>
                            <p className="text-[#6B7280]/70 mt-4 text-sm">
                              Ao relatar um problema, por favor inclua:
                            </p>
                            <ul className="space-y-1 text-[#6B7280]/70 text-sm list-disc list-inside mt-2">
                              <li>URL da página onde encontrou o problema</li>
                              <li>Descrição detalhada da dificuldade encontrada</li>
                              <li>Tecnologia assistiva utilizada (se aplicável)</li>
                              <li>Navegador e sistema operacional</li>
                              <li>Capturas de tela, se possível</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              },
              {
                title: '9. TREINAMENTO E CONSCIENTIZAÇÃO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Nossa equipe recebe treinamento regular sobre:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Princípios fundamentais de acessibilidade web</li>
                      <li>Diretrizes WCAG 2.1</li>
                      <li>Uso de tecnologias assistivas</li>
                      <li>Design inclusivo e experiência do usuário</li>
                      <li>Desenvolvimento acessível (HTML semântico, ARIA)</li>
                      <li>Testes de acessibilidade</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '10. PADRÕES E CONFORMIDADE',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Nosso compromisso é seguir os seguintes padrões:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">WCAG 2.1 Nível AA:</strong> Web Content Accessibility Guidelines</li>
                      <li><strong className="text-black">Section 508:</strong> Standards (EUA)</li>
                      <li><strong className="text-black">EN 301 549:</strong> Norma europeia de acessibilidade</li>
                      <li><strong className="text-black">W3C WAI:</strong> Web Accessibility Initiative</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '11. MELHORIA CONTÍNUA',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      A acessibilidade é um processo contínuo. Nosso compromisso inclui:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Auditorias trimestrais de acessibilidade</li>
                      <li>Atualizações regulares baseadas em feedback</li>
                      <li>Acompanhamento de novas diretrizes e tecnologias</li>
                      <li>Investimento contínuo em ferramentas e treinamento</li>
                      <li>Colaboração com a comunidade de acessibilidade</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '12. RECURSOS ADICIONAIS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Para mais informações sobre acessibilidade web:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><a href="https://www.w3.org/WAI/" target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] hover:underline">W3C Web Accessibility Initiative</a></li>
                      <li><a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] hover:underline">WCAG 2.1 Quick Reference</a></li>
                      <li><a href="https://webaim.org/" target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] hover:underline">WebAIM - Web Accessibility In Mind</a></li>
                    </ul>
                  </div>
                )
              }
            ].map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-900 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-500" />
                <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-8">
                  <h2 className="text-2xl font-semibold text-black mb-6">
                    {section.title}
                  </h2>
                  <div className="space-y-4">
                    {section.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-gray-200">
            <p className="text-sm text-[#6B7280]/60 italic text-center">
              Esta Política de Acessibilidade foi atualizada em 26 de outubro de 2025 e reflete nosso compromisso contínuo com a inclusão digital.
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default AccessibilityPolicy;
