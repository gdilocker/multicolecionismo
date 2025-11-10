import React from 'react';
import { motion } from 'framer-motion';
import { Ban, Calendar, Shield } from 'lucide-react';

const SuspensionPolicy: React.FC = () => {
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
              <Ban className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              Política de Suspensão e Encerramento
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
          <div className="text-[#6B7280]/80 space-y-4 mb-12">
            <p>
              Esta Política de Suspensão e Encerramento estabelece as condições sob as quais a <strong className="text-black">Global Digital Identity LTD</strong> ("Com.rich", "nós" ou "nosso") pode suspender temporariamente ou encerrar definitivamente contas de usuários, acesso a serviços, ou domínios registrados na plataforma.
            </p>
            <p>
              Nosso objetivo é manter um ambiente seguro, confiável e em conformidade com as leis aplicáveis. Esta política aplica-se a todos os usuários da plataforma Com.rich.
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                title: '1. DEFINIÇÕES',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <ul className="space-y-3 text-[#6B7280]/70">
                      <li><strong className="text-black">Suspensão:</strong> Bloqueio temporário do acesso à conta ou serviços, com possibilidade de reativação mediante resolução das questões identificadas.</li>
                      <li><strong className="text-black">Encerramento:</strong> Desativação permanente da conta e perda de acesso a todos os serviços associados.</li>
                      <li><strong className="text-black">Violação:</strong> Qualquer ação ou omissão que contrarie os Termos de Uso, políticas da plataforma ou leis aplicáveis.</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '2. MOTIVOS PARA SUSPENSÃO OU ENCERRAMENTO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      A Global Digital Identity reserva-se o direito de suspender ou encerrar contas e serviços nas seguintes situações, sem prejuízo de outras hipóteses previstas nos Termos de Uso:
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-6">2.1 Violação dos Termos de Uso</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Descumprimento de qualquer cláusula dos Termos de Uso da plataforma</li>
                      <li>Uso indevido dos serviços para fins não autorizados</li>
                      <li>Violação das políticas de uso aceitável, conteúdo, privacidade ou segurança</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.2 Atividades Ilegais ou Fraudulentas</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Uso da plataforma para atividades criminosas ou ilegais</li>
                      <li>Fraude em pagamentos, identidade ou documentação</li>
                      <li>Tentativas de acesso não autorizado a sistemas ou dados de terceiros</li>
                      <li>Distribuição de malware, vírus ou conteúdo malicioso</li>
                      <li>Phishing, scam ou esquemas fraudulentos</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.3 Informações Falsas ou Enganosas</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Uso de informações falsas, enganosas ou de terceiros durante o registro</li>
                      <li>Representação indevida de identidade ou afiliação</li>
                      <li>Falsificação de documentos ou informações de contato</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.4 Inadimplência e Falta de Pagamento</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Falta de pagamento de taxas de assinatura, renovação ou serviços adicionais</li>
                      <li>Contestação indevida de cobranças ou chargebacks fraudulentos</li>
                      <li>Inadimplência superior a 15 dias após o vencimento</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.5 Abuso da Plataforma</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Uso excessivo de recursos que comprometa o desempenho da plataforma</li>
                      <li>Tentativas de explorar vulnerabilidades ou brechas de segurança</li>
                      <li>Automação não autorizada ou scraping de dados</li>
                      <li>Spam, flooding ou ataques de negação de serviço (DDoS)</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.6 Violação de Direitos de Terceiros</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Violação de direitos autorais, marcas registradas ou propriedade intelectual</li>
                      <li>Registro de domínios que violem direitos de terceiros (cybersquatting)</li>
                      <li>Uso de conteúdo protegido sem autorização</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.7 Comportamento Prejudicial</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Assédio, ameaças ou intimidação a outros usuários ou à equipe da plataforma</li>
                      <li>Publicação de conteúdo ilegal, difamatório, discriminatório ou ofensivo</li>
                      <li>Comportamento que comprometa a segurança ou reputação da plataforma</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.8 Ordem Judicial ou Legal</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Cumprimento de ordens judiciais, mandados ou solicitações de autoridades competentes</li>
                      <li>Conformidade com leis locais, nacionais ou internacionais</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '3. PROCESSO DE SUSPENSÃO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">3.1 Notificação Prévia</h3>
                    <p>
                      Sempre que possível e apropriado, antes de proceder com a suspensão, nós:
                    </p>
                    <ol className="space-y-2 text-[#6B7280]/70 list-decimal list-inside">
                      <li>Enviaremos uma notificação por email para o endereço cadastrado, descrevendo a violação identificada</li>
                      <li>Concederemos um prazo de <strong className="text-black">48 horas</strong> para resposta, esclarecimentos ou correção da situação</li>
                      <li>Avaliaremos a resposta e tomaremos as medidas apropriadas</li>
                    </ol>

                    <h3 className="text-lg font-semibold text-black mt-6">3.2 Suspensão Imediata</h3>
                    <p>
                      Em casos graves que representem risco imediato à segurança, legalidade ou integridade da plataforma, a suspensão pode ser imediata e sem aviso prévio, incluindo, mas não se limitando a:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Atividades criminosas ou ilegais em andamento</li>
                      <li>Ataques de segurança ou tentativas de comprometimento da plataforma</li>
                      <li>Fraude comprovada ou tentativa de fraude</li>
                      <li>Ordem judicial ou legal</li>
                      <li>Risco iminente de dano a terceiros</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">3.3 Direito de Defesa</h3>
                    <p>
                      Mesmo em casos de suspensão imediata, você terá oportunidade de contestar a decisão e apresentar sua defesa conforme descrito na Seção 6 desta política.
                    </p>
                  </div>
                )
              },
              {
                title: '4. EFEITOS DA SUSPENSÃO TEMPORÁRIA',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Durante uma suspensão temporária:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Acesso à conta:</strong> O login e acesso ao painel de controle serão bloqueados</li>
                      <li><strong className="text-black">Domínios e serviços:</strong> Os domínios permanecerão registrados, mas podem ficar inacessíveis ou com funcionalidades limitadas</li>
                      <li><strong className="text-black">Conteúdo público:</strong> Perfis públicos e páginas podem ser removidos temporariamente</li>
                      <li><strong className="text-black">Renovações:</strong> Renovações automáticas podem ser pausadas</li>
                      <li><strong className="text-black">Reembolso:</strong> Não haverá reembolso do período suspenso, exceto se a suspensão for posteriormente considerada indevida</li>
                      <li><strong className="text-black">Prazo:</strong> A suspensão pode durar até que a situação seja resolvida ou por um período máximo de 90 dias, após o qual pode ser convertida em encerramento definitivo</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">4.1 Reativação</h3>
                    <p>
                      A suspensão pode ser revertida mediante:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Resolução satisfatória do problema identificado</li>
                      <li>Pagamento de valores em atraso (se aplicável)</li>
                      <li>Fornecimento de documentação ou informações solicitadas</li>
                      <li>Compromisso de conformidade com os Termos de Uso</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '5. ENCERRAMENTO DEFINITIVO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">5.1 Motivos para Encerramento</h3>
                    <p>O encerramento definitivo da conta ocorrerá em casos de:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Violações graves ou repetidas:</strong> Múltiplas violações dos Termos de Uso após advertências</li>
                      <li><strong className="text-black">Fraude comprovada:</strong> Confirmação de atividades fraudulentas</li>
                      <li><strong className="text-black">Atividades criminosas:</strong> Uso da plataforma para fins ilegais</li>
                      <li><strong className="text-black">Não resolução de suspensão:</strong> Falha em resolver questões durante o período de suspensão temporária</li>
                      <li><strong className="text-black">Solicitação do usuário:</strong> Pedido voluntário de encerramento de conta</li>
                      <li><strong className="text-black">Inatividade prolongada:</strong> Ausência de atividade por período superior a 24 meses sem pagamentos</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">5.2 Consequências do Encerramento</h3>
                    <p>Após o encerramento definitivo:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Você perderá <strong className="text-black">acesso permanente</strong> à conta e todos os serviços associados</li>
                      <li><strong className="text-black">Domínios:</strong> Domínios registrados podem ser liberados para registro público ou transferidos conforme aplicável</li>
                      <li><strong className="text-black">Dados:</strong> Dados pessoais serão tratados conforme nossa Política de Privacidade e legislação aplicável</li>
                      <li><strong className="text-black">Reembolso:</strong> Não haverá reembolso de valores pagos, exceto conforme previsto na Política de Reembolso ou por determinação legal</li>
                      <li><strong className="text-black">Novo registro:</strong> Poderá ser impedido de criar nova conta na plataforma</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '6. RECUPERAÇÃO E BACKUP DE DADOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">6.1 Período de Graça</h3>
                    <p>
                      Em caso de suspensão ou encerramento, você terá um período de <strong className="text-black">30 dias corridos</strong> para:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Solicitar backup ou exportação de dados pessoais e conteúdo</li>
                      <li>Iniciar processo de transferência de domínios para outro registrador (sujeito a taxas aplicáveis e políticas de transferência)</li>
                      <li>Recuperar informações essenciais da conta</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">6.2 Exclusão de Dados</h3>
                    <p>
                      Após o período de 30 dias, os dados podem ser permanentemente excluídos conforme nossa Política de Privacidade e requisitos legais de retenção de dados.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-6">6.3 Transferência de Domínios</h3>
                    <p>
                      Para transferir domínios após suspensão ou encerramento:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Entre em contato com o suporte em <a href="mailto:contact@com.rich" className="text-[#3B82F6] hover:underline">contact@com.rich</a></li>
                      <li>Forneça documentação de identidade e comprovação de titularidade</li>
                      <li>Quite eventuais débitos pendentes</li>
                      <li>Solicite o código de autorização (EPP code) para transferência</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '7. DIREITO DE CONTESTAÇÃO E RECURSO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">7.1 Como Contestar</h3>
                    <p>
                      Você tem o direito de contestar qualquer suspensão ou encerramento através do email <a href="mailto:contact@com.rich" className="text-[#3B82F6] hover:underline">contact@com.rich</a>, fornecendo:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Número da conta</strong> ou domínio afetado</li>
                      <li><strong className="text-black">Motivo da contestação</strong> de forma clara e detalhada</li>
                      <li><strong className="text-black">Evidências ou documentação relevante</strong> que suporte sua contestação</li>
                      <li><strong className="text-black">Proposta de resolução,</strong> se aplicável</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">7.2 Análise e Resposta</h3>
                    <p>
                      Todas as contestações serão analisadas por nossa equipe em até <strong className="text-black">5 dias úteis.</strong> Durante a análise:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Revisaremos todas as evidências e documentação fornecidas</li>
                      <li>Poderemos solicitar informações adicionais</li>
                      <li>Você receberá uma resposta formal por email com a decisão fundamentada</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">7.3 Decisão Final</h3>
                    <p>
                      Nossa decisão após análise da contestação é final, exceto quando houver:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Novas evidências significativas não apresentadas anteriormente</li>
                      <li>Erro manifesto na aplicação desta política</li>
                      <li>Determinação legal ou judicial em contrário</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '8. CASOS ESPECIAIS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">8.1 Suspensão por Ordem Judicial</h3>
                    <p>
                      Em casos de ordem judicial ou solicitação de autoridades competentes, podemos ser obrigados a suspender ou encerrar contas sem aviso prévio ou possibilidade de contestação até que haja decisão judicial definitiva.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-6">8.2 Situações de Emergência</h3>
                    <p>
                      Em situações de emergência que representem risco iminente à segurança da plataforma, outros usuários ou terceiros, podemos tomar ações imediatas de suspensão ou bloqueio sem seguir o processo padrão, com notificação posterior.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-6">8.3 Falecimento do Titular</h3>
                    <p>
                      Em caso de falecimento do titular da conta, herdeiros ou representantes legais podem solicitar acesso aos dados ou transferência de domínios mediante apresentação de documentação legal apropriada (certidão de óbito, inventário, procuração, etc.).
                    </p>
                  </div>
                )
              },
              {
                title: '9. LIMITAÇÃO DE RESPONSABILIDADE',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      A Global Digital Identity não será responsável por:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Perdas financeiras, de dados ou oportunidades decorrentes de suspensão ou encerramento legítimos</li>
                      <li>Danos indiretos, incidentais ou consequenciais relacionados à suspensão ou encerramento</li>
                      <li>Falhas em notificar tempestivamente em casos de suspensão imediata por motivos de segurança</li>
                      <li>Impossibilidade de recuperar dados após o período de 30 dias</li>
                    </ul>
                    <p className="mt-4">
                      Nossa responsabilidade máxima, se aplicável, limita-se ao valor pago pelos serviços nos últimos 12 meses.
                    </p>
                  </div>
                )
              },
              {
                title: '10. MODIFICAÇÕES A ESTA POLÍTICA',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Reservamos o direito de modificar esta Política de Suspensão e Encerramento a qualquer momento. Alterações significativas serão notificadas por email ou através da plataforma com antecedência mínima de 15 dias. O uso continuado dos serviços após as modificações constitui aceitação das novas condições.
                    </p>
                  </div>
                )
              },
              {
                title: '11. CONTATO E SUPORTE',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-900 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
                      <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                          <Shield className="w-6 h-6 text-[#3B82F6] flex-shrink-0 mt-1" />
                          <div>
                            <p className="text-[#6B7280]/80 mb-2">
                              Para questões sobre suspensões, encerramentos ou contestações:
                            </p>
                            <p className="text-[#6B7280]/80 mb-2">
                              <strong className="text-black">Email:</strong> <a href="mailto:contact@com.rich" className="text-[#3B82F6] hover:underline">contact@com.rich</a>
                            </p>
                            <p className="text-[#6B7280]/80 mb-2">
                              <strong className="text-black">Suporte:</strong> Disponível 24/7
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
              Esta política entra em vigor em 26 de outubro de 2025 e substitui todas as versões anteriores.
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default SuspensionPolicy;
