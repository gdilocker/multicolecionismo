import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Shield } from 'lucide-react';

const DataProcessingAddendum: React.FC = () => {
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
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              Adendo de Processamento de Dados
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
                  Este Adendo de Processamento de Dados ("Adendo") é parte integrante dos <strong className="text-black">Termos de Uso</strong> da plataforma <strong className="text-black">Com.rich</strong>, operada pela <strong className="text-black">Global Digital Identity LTD</strong> ("Controlador", "nós" ou "nosso"), empresa registrada na Inglaterra e País de Gales sob o número Company No. 16339013.
                </p>
                <p>
                  Este Adendo estabelece os termos sob os quais a Global Digital Identity processa Dados Pessoais em nome dos usuários ("Titulares de Dados"), em conformidade com as leis aplicáveis de proteção de dados, incluindo o <strong className="text-black">Regulamento Geral sobre a Proteção de Dados (GDPR)</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {[
              {
                title: '1. DEFINIÇÕES',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Para fins deste Adendo, os seguintes termos têm os significados atribuídos abaixo:</p>
                    <ul className="space-y-3 text-[#6B7280]/70">
                      <li><strong className="text-black">Dados Pessoais:</strong> Qualquer informação relacionada a uma pessoa natural identificada ou identificável.</li>
                      <li><strong className="text-black">Titular de Dados:</strong> A pessoa natural a quem os Dados Pessoais se referem.</li>
                      <li><strong className="text-black">Controlador:</strong> A Global Digital Identity LTD, que determina as finalidades e os meios do processamento de Dados Pessoais.</li>
                      <li><strong className="text-black">Processador:</strong> Qualquer entidade que processa Dados Pessoais em nome do Controlador.</li>
                      <li><strong className="text-black">Subprocessador:</strong> Qualquer terceiro contratado pelo Processador para auxiliar no processamento de Dados Pessoais.</li>
                      <li><strong className="text-black">Processamento:</strong> Qualquer operação realizada com Dados Pessoais, incluindo coleta, registro, organização, armazenamento, adaptação, uso, divulgação, combinação, bloqueio, exclusão ou destruição.</li>
                      <li><strong className="text-black">Violação de Dados Pessoais:</strong> Qualquer incidente de segurança que resulte em acesso não autorizado, divulgação, alteração ou perda de Dados Pessoais.</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '2. ESCOPO E FINALIDADE DO PROCESSAMENTO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">2.1 Natureza do Processamento</h3>
                    <p>
                      A Global Digital Identity processa Dados Pessoais nas seguintes atividades:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Registro, gerenciamento e renovação de domínios .com.rich</li>
                      <li>Fornecimento de serviços de perfis digitais profissionais</li>
                      <li>Manutenção de contas de usuários e perfis públicos</li>
                      <li>Processamento de pagamentos e emissão de faturas</li>
                      <li>Prestação de suporte técnico e atendimento ao cliente</li>
                      <li>Comunicações relacionadas aos serviços contratados</li>
                      <li>Cumprimento de obrigações legais e regulatórias</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.2 Finalidades do Processamento</h3>
                    <p>Os Dados Pessoais são processados exclusivamente para:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Execução dos serviços contratados conforme Termos de Uso</li>
                      <li>Cumprimento de obrigações contratuais entre o usuário e a plataforma</li>
                      <li>Atendimento a requisitos legais, regulatórios e de conformidade</li>
                      <li>Prevenção de fraudes, abusos e violações de segurança</li>
                      <li>Melhoria da qualidade dos serviços oferecidos</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.3 Duração do Processamento</h3>
                    <p>
                      Os Dados Pessoais serão processados pelo tempo necessário para cumprir as finalidades descritas neste Adendo, incluindo:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Durante a vigência do contrato de prestação de serviços</li>
                      <li>Por períodos adicionais exigidos por obrigações legais (ex: retenção fiscal, contábil)</li>
                      <li>Para defesa de direitos em processos judiciais, administrativos ou arbitrais</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '3. CATEGORIAS DE DADOS PESSOAIS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>As seguintes categorias de Dados Pessoais podem ser processadas:</p>

                    <h3 className="text-lg font-semibold text-black">3.1 Dados de Identificação</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Nome completo</li>
                      <li>Endereço de e-mail</li>
                      <li>Número de telefone</li>
                      <li>Documento de identificação (quando aplicável)</li>
                      <li>Endereço postal</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">3.2 Dados de Conta e Acesso</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Nome de usuário</li>
                      <li>Senha (hash criptográfico)</li>
                      <li>Histórico de login e acessos</li>
                      <li>Endereço IP</li>
                      <li>Informações de dispositivo e navegador</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">3.3 Dados de Pagamento</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Informações de faturamento</li>
                      <li>Histórico de transações</li>
                      <li>Método de pagamento (processado por terceiros certificados)</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">3.4 Dados de Uso e Comunicação</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Registros de atividade na plataforma</li>
                      <li>Histórico de suporte e atendimento</li>
                      <li>Preferências de comunicação</li>
                      <li>Conteúdo de perfis públicos (quando aplicável)</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '4. OBRIGAÇÕES DO CONTROLADOR',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>A Global Digital Identity, na qualidade de Controlador, compromete-se a:</p>

                    <h3 className="text-lg font-semibold text-black">4.1 Processamento Lícito</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Processar Dados Pessoais de forma lícita, leal e transparente</li>
                      <li>Coletar Dados apenas para finalidades legítimas, específicas e explícitas</li>
                      <li>Garantir que o processamento seja adequado, relevante e limitado ao necessário</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">4.2 Precisão e Atualização</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Manter os Dados Pessoais precisos e atualizados</li>
                      <li>Permitir que os Titulares corrijam ou atualizem seus dados</li>
                      <li>Excluir ou retificar dados imprecisos sem demora</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">4.3 Segurança e Confidencialidade</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Implementar medidas técnicas e organizacionais apropriadas para proteger os Dados</li>
                      <li>Prevenir acesso não autorizado, divulgação, alteração ou destruição de Dados</li>
                      <li>Garantir que apenas pessoal autorizado tenha acesso aos Dados Pessoais</li>
                      <li>Treinar funcionários sobre práticas de proteção de dados</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">4.4 Notificação de Violações</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Notificar as autoridades competentes sobre Violações de Dados dentro de 72 horas da descoberta</li>
                      <li>Informar os Titulares afetados quando a violação representar alto risco aos seus direitos</li>
                      <li>Documentar todas as violações e as medidas tomadas para mitigá-las</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '5. DIREITOS DOS TITULARES DE DADOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Os Titulares de Dados têm os seguintes direitos em relação aos seus Dados Pessoais:</p>

                    <h3 className="text-lg font-semibold text-black">5.1 Direito de Acesso</h3>
                    <p>Solicitar confirmação sobre quais Dados Pessoais são processados e obter uma cópia dos mesmos.</p>

                    <h3 className="text-lg font-semibold text-black mt-6">5.2 Direito de Retificação</h3>
                    <p>Corrigir Dados Pessoais imprecisos ou incompletos.</p>

                    <h3 className="text-lg font-semibold text-black mt-6">5.3 Direito de Exclusão ("Direito ao Esquecimento")</h3>
                    <p>Solicitar a exclusão de Dados Pessoais, exceto quando houver obrigação legal de retenção.</p>

                    <h3 className="text-lg font-semibold text-black mt-6">5.4 Direito de Restrição de Processamento</h3>
                    <p>Limitar o processamento de Dados em circunstâncias específicas, como durante contestação de precisão.</p>

                    <h3 className="text-lg font-semibold text-black mt-6">5.5 Direito à Portabilidade</h3>
                    <p>Receber Dados Pessoais em formato estruturado e legível por máquina e transferi-los a outro controlador.</p>

                    <h3 className="text-lg font-semibold text-black mt-6">5.6 Direito de Oposição</h3>
                    <p>Opor-se ao processamento de Dados Pessoais com base em interesses legítimos do Controlador.</p>

                    <h3 className="text-lg font-semibold text-black mt-6">5.7 Direito de Revisão de Decisões Automatizadas</h3>
                    <p>Não ser sujeito a decisões baseadas exclusivamente em processamento automatizado sem intervenção humana.</p>

                    <h3 className="text-lg font-semibold text-black mt-6">5.8 Como Exercer Seus Direitos</h3>
                    <p>Para exercer qualquer um desses direitos, entre em contato através de:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Email:</strong> <a href="mailto:contact@com.rich" className="text-[#3B82F6] hover:underline">contact@com.rich</a></li>
                      <li><strong className="text-black">Prazo de resposta:</strong> Até 30 dias corridos</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '6. SUBPROCESSADORES',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">6.1 Autorização de Subprocessadores</h3>
                    <p>
                      A Global Digital Identity pode contratar terceiros ("Subprocessadores") para auxiliar no processamento de Dados Pessoais. Todos os Subprocessadores são cuidadosamente selecionados e devem cumprir as mesmas obrigações de proteção de dados estabelecidas neste Adendo.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-6">6.2 Lista de Subprocessadores</h3>
                    <p>Atualmente, utilizamos os seguintes Subprocessadores:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Provedores de infraestrutura:</strong> AWS, Google Cloud, Cloudflare</li>
                      <li><strong className="text-black">Processadores de pagamento:</strong> PayPal, Stripe</li>
                      <li><strong className="text-black">Registradores de domínios:</strong> Dynadot</li>
                      <li><strong className="text-black">Serviços de email:</strong> Titan Email</li>
                      <li><strong className="text-black">Ferramentas de análise:</strong> Google Analytics (anonimizado)</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">6.3 Alterações de Subprocessadores</h3>
                    <p>
                      Notificaremos os usuários sobre a adição ou substituição de Subprocessadores com antecedência mínima de 30 dias. Os usuários podem se opor à mudança, caso em que o contrato pode ser rescindido sem penalidades.
                    </p>
                  </div>
                )
              },
              {
                title: '7. TRANSFERÊNCIAS INTERNACIONAIS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">7.1 Transferência para Países Terceiros</h3>
                    <p>
                      Alguns Dados Pessoais podem ser transferidos para países fora do Espaço Econômico Europeu (EEE). Nesses casos, garantimos que:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>As transferências são realizadas para países com nível adequado de proteção de dados reconhecido pela Comissão Europeia</li>
                      <li>São implementadas salvaguardas apropriadas, como Cláusulas Contratuais Padrão (SCC) da UE</li>
                      <li>Obtemos consentimento explícito quando necessário</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">7.2 Garantias Aplicadas</h3>
                    <p>
                      Todas as transferências internacionais são regidas por mecanismos legalmente reconhecidos, incluindo:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Cláusulas Contratuais Padrão aprovadas pela Comissão Europeia</li>
                      <li>Certificações de adequação (ex: Privacy Shield substitutos)</li>
                      <li>Códigos de conduta e mecanismos de certificação</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '8. SEGURANÇA DA INFORMAÇÃO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Implementamos as seguintes medidas de segurança técnicas e organizacionais:</p>

                    <h3 className="text-lg font-semibold text-black">8.1 Medidas Técnicas</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Criptografia de dados em trânsito (TLS/SSL) e em repouso (AES-256)</li>
                      <li>Controle de acesso baseado em funções (RBAC)</li>
                      <li>Autenticação multifator (2FA)</li>
                      <li>Firewalls e sistemas de detecção de intrusão</li>
                      <li>Backups regulares e redundância de dados</li>
                      <li>Monitoramento contínuo de segurança e auditoria de logs</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">8.2 Medidas Organizacionais</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Políticas internas de proteção de dados e privacidade</li>
                      <li>Treinamento regular de funcionários sobre segurança da informação</li>
                      <li>Acordos de confidencialidade com todos os colaboradores</li>
                      <li>Procedimentos de resposta a incidentes de segurança</li>
                      <li>Auditorias e avaliações de segurança periódicas</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '9. RETENÇÃO E EXCLUSÃO DE DADOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">9.1 Critérios de Retenção</h3>
                    <p>Os Dados Pessoais são retidos apenas pelo tempo necessário para:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Cumprir as finalidades para as quais foram coletados</li>
                      <li>Atender a requisitos legais, contábeis ou fiscais</li>
                      <li>Estabelecer, exercer ou defender direitos legais</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">9.2 Períodos de Retenção</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Dados de conta ativa:</strong> Durante a vigência do contrato</li>
                      <li><strong className="text-black">Dados de faturamento:</strong> 5 anos (requisito fiscal)</li>
                      <li><strong className="text-black">Logs de segurança:</strong> 6 meses</li>
                      <li><strong className="text-black">Dados de suporte:</strong> 3 anos</li>
                      <li><strong className="text-black">Contas inativas:</strong> 24 meses após última atividade</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">9.3 Exclusão Segura</h3>
                    <p>
                      Após o término dos períodos de retenção, os Dados Pessoais são permanentemente excluídos ou anonimizados de forma irreversível, utilizando métodos certificados de destruição de dados.
                    </p>
                  </div>
                )
              },
              {
                title: '10. COOPERAÇÃO E AUDITORIAS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">10.1 Cooperação com Autoridades</h3>
                    <p>
                      A Global Digital Identity cooperará plenamente com autoridades de proteção de dados competentes, incluindo:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Information Commissioner's Office (ICO) - Reino Unido</li>
                      <li>Autoridades de proteção de dados dos Estados-Membros da UE</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">10.2 Auditorias e Inspeções</h3>
                    <p>
                      Mediante solicitação razoável e com aviso prévio de 30 dias, os usuários podem solicitar informações sobre nossas práticas de processamento de dados, incluindo:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Relatórios de conformidade e certificações de segurança</li>
                      <li>Resultados de auditorias independentes</li>
                      <li>Documentação sobre medidas técnicas e organizacionais implementadas</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '11. ALTERAÇÕES A ESTE ADENDO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Este Adendo pode ser atualizado periodicamente para refletir mudanças nas práticas de processamento ou em requisitos legais. Alterações materiais serão notificadas aos usuários com antecedência mínima de 30 dias por email ou através da plataforma.
                    </p>
                    <p>
                      O uso continuado dos serviços após as alterações constitui aceitação do Adendo atualizado.
                    </p>
                  </div>
                )
              },
              {
                title: '12. CONTATO E ENCARREGADO DE PROTEÇÃO DE DADOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-900 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
                      <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                          <Shield className="w-6 h-6 text-[#3B82F6] flex-shrink-0 mt-1" />
                          <div>
                            <p className="text-[#6B7280]/80 mb-2">
                              Para questões sobre processamento de Dados Pessoais ou para exercer seus direitos:
                            </p>
                            <p className="text-[#6B7280]/80 mb-2">
                              <strong className="text-black">Encarregado de Proteção de Dados (DPO):</strong> dpo@com.rich
                            </p>
                            <p className="text-[#6B7280]/80 mb-2">
                              <strong className="text-black">Email geral:</strong> <a href="mailto:contact@com.rich" className="text-[#3B82F6] hover:underline">contact@com.rich</a>
                            </p>
                            <p className="text-[#6B7280]/80">
                              <strong className="text-black">Empresa:</strong> Global Digital Identity LTD<br />
                              Registered in England and Wales, Company No. 16339013<br />
                              71-75 Shelton Street, Covent Garden, London, WC2H 9JQ
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
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
              Este Adendo entra em vigor em 26 de outubro de 2025 e substitui todas as versões anteriores.
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default DataProcessingAddendum;
