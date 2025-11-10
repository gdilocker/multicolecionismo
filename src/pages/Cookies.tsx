import React from 'react';
import { motion } from 'framer-motion';
import { Cookie, Calendar, Settings, ExternalLink, AlertCircle } from 'lucide-react';

const Cookies: React.FC = () => {
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
              <Cookie className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              Política de Cookies
            </h1>
            <p className="text-xl text-[#6B7280]/70 mb-4">.com.rich</p>
            <div className="inline-flex items-center gap-2 text-[#6B7280]/80">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Última atualização: 16 de outubro de 2025</span>
            </div>
            <p className="text-sm text-[#6B7280]/60 mt-2">
              Em conformidade com UK GDPR (Data Protection Act 2018) e GDPR (UE)
            </p>
            <p className="text-sm text-[#6B7280]/60">
              Versão em português (tradução de conveniência) • A versão em inglês prevalece legalmente
            </p>
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
                <Settings className="w-6 h-6 text-[#3B82F6] flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-black mb-2">Global Digital Identity LTD</h2>
                  <p className="text-[#6B7280]/80 leading-relaxed">
                    O <strong>.com.rich</strong>, operado pela <strong>Global Digital Identity LTD</strong>, utiliza cookies e tecnologias similares para garantir o funcionamento seguro da plataforma e aprimorar nossos serviços.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {[
              {
                title: '1. O que são Cookies',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Cookies são pequenos arquivos de texto armazenados no seu dispositivo (computador, tablet ou smartphone) quando você visita um site.
                      Eles permitem que a plataforma reconheça seu navegador, memorize preferências e melhore sua experiência de navegação.
                    </p>
                    <p>
                      O <strong className="text-black">.com.rich</strong>, operado pela <strong className="text-black">Global Digital Identity LTD</strong>, utiliza cookies e tecnologias similares (como <em>local storage</em> e <em>pixels</em>) para garantir o funcionamento seguro da plataforma e aprimorar nossos serviços.
                    </p>
                  </div>
                )
              },
              {
                title: '2. Como Usamos Cookies',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Utilizamos cookies para as seguintes finalidades:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Funcionalidade:</strong> lembrar suas preferências e configurações (como idioma e sessão).</li>
                      <li><strong className="text-black">Segurança:</strong> proteger sua conta, detectar atividades suspeitas e prevenir fraudes.</li>
                      <li><strong className="text-black">Performance:</strong> entender como o site é utilizado e otimizar seu desempenho.</li>
                      <li><strong className="text-black">Personalização:</strong> manter preferências de exibição e comportamento do painel.</li>
                      <li><strong className="text-black">Consentimento:</strong> registrar sua aceitação dos termos e políticas.</li>
                    </ul>
                    <p className="font-semibold text-black mt-4">
                      O .com.rich não utiliza cookies de marketing nem rastreamento publicitário.
                    </p>
                  </div>
                )
              },
              {
                title: '3. Tipos de Cookies que Utilizamos',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">3.1 Cookies Essenciais</h3>
                    <p>
                      Necessários para o funcionamento básico do site.
                      Sem esses cookies, a plataforma pode não operar corretamente.
                      Incluem:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Autenticação e login;</li>
                      <li>Segurança (proteção contra ataques e fraudes);</li>
                      <li>Idioma e preferências regionais;</li>
                      <li>Balanceamento de carga entre servidores.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-4">3.2 Cookies de Performance</h3>
                    <p>
                      Ajudam a entender o uso do site e a melhorar a experiência do usuário.
                      Coletam informações de forma agregada e anônima, incluindo:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Páginas mais acessadas e tempo de navegação;</li>
                      <li>Mensagens de erro e relatórios técnicos;</li>
                      <li>Métricas internas de velocidade e disponibilidade.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-4">3.3 Cookies de Funcionalidade</h3>
                    <p>Permitem que o site memorize suas escolhas e forneça recursos personalizados:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Preferências de idioma e layout do painel;</li>
                      <li>Tema e configurações de exibição;</li>
                      <li>Dados temporários de sessão do usuário autenticado.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-4">3.4 Cookies de Terceiros</h3>
                    <p>Alguns cookies podem ser definidos por serviços externos necessários à operação da plataforma, como:</p>

                    <div className="overflow-x-auto mt-4">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-white/20">
                            <th className="text-left py-3 px-4 text-black font-semibold">Serviço</th>
                            <th className="text-left py-3 px-4 text-black font-semibold">Finalidade</th>
                            <th className="text-left py-3 px-4 text-black font-semibold">Política de Privacidade</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-200">
                            <td className="py-3 px-4 text-black font-semibold">Cloudflare</td>
                            <td className="py-3 px-4 text-[#6B7280]/70">Segurança e desempenho (proteção contra ataques e CDN)</td>
                            <td className="py-3 px-4">
                              <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#3B82F6] hover:text-[#6B7280]">
                                Link <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-3 px-4 text-black font-semibold">PayPal</td>
                            <td className="py-3 px-4 text-[#6B7280]/70">Processamento de pagamentos em USD</td>
                            <td className="py-3 px-4">
                              <a href="https://www.paypal.com/webapps/mpp/ua/privacy-full" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#3B82F6] hover:text-[#6B7280]">
                                Link <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-3 px-4 text-black font-semibold">Google reCAPTCHA</td>
                            <td className="py-3 px-4 text-[#6B7280]/70">Proteção contra bots e spam em formulários</td>
                            <td className="py-3 px-4">
                              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#3B82F6] hover:text-[#6B7280]">
                                Link <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              },
              {
                title: '4. Duração dos Cookies',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-white/20">
                            <th className="text-left py-3 px-4 text-black font-semibold">Tipo</th>
                            <th className="text-left py-3 px-4 text-black font-semibold">Duração</th>
                            <th className="text-left py-3 px-4 text-black font-semibold">Finalidade</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-200">
                            <td className="py-3 px-4 text-black">Sessão</td>
                            <td className="py-3 px-4 text-[#6B7280]/70">Até o fechamento do navegador</td>
                            <td className="py-3 px-4 text-[#6B7280]/70">Login e navegação segura</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-3 px-4 text-black">Persistentes</td>
                            <td className="py-3 px-4 text-[#6B7280]/70">6 a 12 meses</td>
                            <td className="py-3 px-4 text-[#6B7280]/70">Lembrar idioma e preferências</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-3 px-4 text-black">Segurança</td>
                            <td className="py-3 px-4 text-[#6B7280]/70">Até 6 meses</td>
                            <td className="py-3 px-4 text-[#6B7280]/70">Detecção de fraude e verificação de integridade</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-sm italic text-[#6B7280]/60">
                      (Estes prazos podem variar conforme ajustes técnicos ou requisitos legais.)
                    </p>
                  </div>
                )
              },
              {
                title: '5. Seu Controle sobre Cookies',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">5.1 Configurações do Navegador</h3>
                    <p>Você pode controlar o uso de cookies diretamente nas configurações do seu navegador:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Chrome:</strong> Configurações › Privacidade e segurança › Cookies</li>
                      <li><strong className="text-black">Firefox:</strong> Preferências › Privacidade e Segurança</li>
                      <li><strong className="text-black">Safari:</strong> Preferências › Privacidade</li>
                      <li><strong className="text-black">Edge:</strong> Configurações › Cookies e permissões do site</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-4">5.2 Centro de Preferências</h3>
                    <p>
                      O <strong className="text-black">.com.rich</strong> disponibiliza um <strong className="text-black">Centro de Preferências de Cookies</strong>, acessível pelo banner de consentimento no rodapé do site, onde você pode:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Aceitar ou recusar cookies não essenciais;</li>
                      <li>Gerenciar suas escolhas de forma granular.</li>
                    </ul>

                    <div className="relative group mt-4">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg blur" />
                      <div className="relative bg-amber-50 border border-amber-300 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="text-amber-900 text-sm">
                            <strong className="text-amber-900">Nota:</strong> Cookies essenciais não podem ser desativados.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              },
              {
                title: '6. Tecnologias Similares',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Além de cookies, podemos utilizar tecnologias como:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Local Storage / Session Storage:</strong> para guardar dados de sessão e idioma;</li>
                      <li><strong className="text-black">IndexedDB:</strong> para armazenamento temporário no navegador;</li>
                      <li><strong className="text-black">Web Beacons / Pixels:</strong> para monitorar estabilidade e carregamento (sem rastrear usuários individualmente).</li>
                    </ul>
                    <p>
                      Essas tecnologias têm o mesmo propósito: manter a funcionalidade e segurança do serviço.
                    </p>
                  </div>
                )
              },
              {
                title: '7. Conformidade Legal',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">7.1 UK GDPR e GDPR (UE)</h3>
                    <p>
                      O .com.rich obtém <strong className="text-black">consentimento explícito</strong> para qualquer cookie não essencial, conforme exigido pelas legislações britânica e europeia de proteção de dados.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-4">7.2 Legislação Aplicável</h3>
                    <p>
                      Esta Política de Cookies segue o <strong className="text-black">UK Data Protection Act 2018</strong>, o <strong className="text-black">Regulamento Geral de Proteção de Dados (GDPR da UE)</strong> e normas equivalentes aplicáveis internacionalmente.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-4">7.3 Outras jurisdições</h3>
                    <p>
                      Quando aplicável, respeitamos as normas locais de privacidade, inclusive as que garantem o direito de opt-out ou gestão de consentimento.
                    </p>
                  </div>
                )
              },
              {
                title: '8. Impacto da Desativação de Cookies',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">8.1 Essenciais</h3>
                    <p>
                      A desativação pode impedir login, salvar preferências ou acessar partes restritas do painel.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-4">8.2 Performance</h3>
                    <p>
                      Sem esses cookies, não poderemos otimizar a experiência do usuário nem detectar erros técnicos de forma eficiente.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-4">8.3 Funcionalidade</h3>
                    <p>
                      Certas opções personalizadas (idioma, tema) podem não ser lembradas entre visitas.
                    </p>
                  </div>
                )
              },
              {
                title: '9. Atualizações desta Política',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Podemos atualizar esta Política de Cookies periodicamente para refletir mudanças técnicas, legais ou operacionais.
                      A data da última atualização é sempre indicada no topo deste documento.
                      Em caso de alterações significativas, notificaremos você via site ou e-mail.
                    </p>
                  </div>
                )
              },
              {
                title: '10. Contato',
                content: (
                  <div className="text-[#6B7280]/80 space-y-2">
                    <p className="font-semibold text-black">Global Digital Identity LTD</p>
                    <p>71–75 Shelton Street, Covent Garden</p>
                    <p>Londres, WC2H 9JQ — Reino Unido</p>
                    <p>Company No. <strong>16339013</strong></p>
                    <p className="mt-3">
                      E-mail: <a href="mailto:privacy@com.rich" className="text-[#3B82F6] hover:text-[#6B7280] font-semibold">privacy@com.rich</a>
                    </p>
                    <p>
                      Suporte: <a href="mailto:support@com.rich" className="text-[#3B82F6] hover:text-[#6B7280] font-semibold">support@com.rich</a>
                    </p>
                    <p className="mt-3 text-[#6B7280]/70">
                      <strong className="text-black">Centro de Preferências de Cookies:</strong> disponível no rodapé do site.
                    </p>
                  </div>
                )
              }
            ].map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-900 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
                <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-black mb-4">{section.title}</h2>
                  <div className="prose prose-invert max-w-none">{section.content}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-12 relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-900 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
            <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-8 text-center">
              <p className="text-[#6B7280]/80 mb-2 text-sm">
                © 2025 <strong className="text-black">.com.rich</strong> — Todos os direitos reservados.
              </p>
              <p className="text-[#6B7280]/80 mb-6">
                Para gerenciar suas preferências de cookies ou esclarecer dúvidas, entre em contato conosco.
              </p>
              <a
                href="/contato"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-900 hover:from-slate-700 hover:to-slate-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sm"
              >
                Entre em Contato
              </a>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
};

export default Cookies;
