import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Calendar, Shield, AlertTriangle } from 'lucide-react';

const DeletionPolicy: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-[#F5F5F5] overflow-hidden">

      <div className="relative pt-32 pb-16">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mb-6 shadow-lg shadow-sm">
              <Trash2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              Política de Exclusão de Conta e Dados
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
          <div className="relative group mb-8">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
            <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-[#EF4444] flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-black mb-2">Aviso Importante</h2>
                  <p className="text-[#6B7280]/80 leading-relaxed">
                    A exclusão de conta é uma ação <strong className="text-[#EF4444]">permanente e irreversível</strong>. Todos os seus dados, domínios, perfis e configurações serão removidos definitivamente de nossos sistemas. Por favor, leia esta política com atenção antes de proceder.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group mb-12">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-900 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-500" />
            <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-8">
              <div className="text-[#6B7280]/80 space-y-4">
                <p>
                  Esta Política de Exclusão de Conta e Dados estabelece os procedimentos e condições para a remoção permanente de sua conta na plataforma <strong className="text-black">Com.rich</strong>, operada pela <strong className="text-black">Global Digital Identity LTD</strong>.
                </p>
                <p>
                  Reconhecemos seu direito de solicitar a exclusão de seus dados pessoais, em conformidade com o <strong className="text-black">GDPR</strong>, e nos comprometemos a processar sua solicitação de forma transparente e segura.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {[
              {
                title: '1. DIREITO À EXCLUSÃO DE DADOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      De acordo com as leis de proteção de dados aplicáveis, você tem o direito de solicitar:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Exclusão total da conta:</strong> Remoção permanente de todos os dados pessoais e cancelamento completo dos serviços</li>
                      <li><strong className="text-black">Exclusão seletiva de dados:</strong> Remoção de categorias específicas de informações, quando tecnicamente viável</li>
                      <li><strong className="text-black">Cancelamento de serviços:</strong> Encerramento de assinaturas e domínios sem exclusão imediata de dados (sujeito a períodos de retenção)</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '2. TIPOS DE EXCLUSÃO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">2.1 Exclusão Imediata de Conta</h3>
                    <p>A exclusão imediata remove permanentemente:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Dados de identificação pessoal (nome, email, telefone)</li>
                      <li>Informações de conta e perfil</li>
                      <li>Preferências e configurações</li>
                      <li>Histórico de navegação e atividades na plataforma</li>
                      <li>Conteúdo carregado (fotos de perfil, backgrounds)</li>
                      <li>Dados de acesso (senhas, tokens de sessão)</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.2 Exclusão com Período de Retenção</h3>
                    <p>Alguns dados devem ser mantidos temporariamente para:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Obrigações legais:</strong> Dados fiscais e de faturamento (5 anos)</li>
                      <li><strong className="text-black">Prevenção de fraudes:</strong> Registros de transações suspeitas (até 7 anos)</li>
                      <li><strong className="text-black">Disputas legais:</strong> Informações relevantes a processos em andamento</li>
                      <li><strong className="text-black">Backup e recuperação:</strong> Dados em backups até a próxima rotação (máximo 90 dias)</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.3 Dados que Podem Permanecer Anonimizados</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Estatísticas agregadas e anonimizadas para análises</li>
                      <li>Logs de sistema sem identificadores pessoais</li>
                      <li>Dados de uso da plataforma para melhorias de serviço</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '3. PROCESSO DE SOLICITAÇÃO DE EXCLUSÃO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">3.1 Como Solicitar</h3>
                    <p>Para solicitar a exclusão de sua conta, você pode:</p>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4">
                      <p className="text-black font-semibold mb-2">Opção 1: Autoatendimento (Recomendado)</p>
                      <ol className="space-y-2 text-[#6B7280]/80 list-decimal list-inside">
                        <li>Faça login em sua conta</li>
                        <li>Acesse <strong>Configurações {'>'} Conta</strong></li>
                        <li>Role até a seção "Zona de Perigo"</li>
                        <li>Clique em <strong>"Excluir Minha Conta"</strong></li>
                        <li>Confirme sua identidade (senha ou 2FA)</li>
                        <li>Leia os avisos e confirme a exclusão</li>
                      </ol>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
                      <p className="text-black font-semibold mb-2">Opção 2: Solicitação por Email</p>
                      <p className="text-[#6B7280]/80 mb-2">Envie um email para:</p>
                      <ul className="space-y-1 text-[#6B7280]/80 list-disc list-inside">
                        <li><strong>Email:</strong> <a href="mailto:deletion@com.rich" className="text-[#3B82F6] hover:underline">deletion@com.rich</a></li>
                        <li><strong>Assunto:</strong> "Solicitação de Exclusão de Conta"</li>
                        <li><strong>Informações necessárias:</strong></li>
                      </ul>
                      <ul className="space-y-1 text-[#6B7280]/70 list-disc list-inside ml-6 mt-2">
                        <li>Nome completo cadastrado</li>
                        <li>Email da conta</li>
                        <li>Domínios associados (se aplicável)</li>
                        <li>Confirmação expressa: "Solicito a exclusão permanente de minha conta"</li>
                      </ul>
                    </div>

                    <h3 className="text-lg font-semibold text-black mt-6">3.2 Verificação de Identidade</h3>
                    <p>
                      Para proteger sua conta contra exclusões não autorizadas, precisaremos verificar sua identidade através de:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Autenticação de dois fatores (2FA), se habilitado</li>
                      <li>Confirmação via email cadastrado</li>
                      <li>Resposta a perguntas de segurança</li>
                      <li>Em casos excepcionais, documentação adicional pode ser solicitada</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">3.3 Prazo de Processamento</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Confirmação de recebimento:</strong> Até 48 horas</li>
                      <li><strong className="text-black">Verificação de identidade:</strong> Até 5 dias úteis</li>
                      <li><strong className="text-black">Exclusão efetiva:</strong> Até 30 dias corridos após confirmação</li>
                      <li><strong className="text-black">Confirmação final:</strong> Email notificando conclusão do processo</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '4. O QUE É EXCLUÍDO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Durante o processo de exclusão, os seguintes dados são permanentemente removidos:</p>

                    <h3 className="text-lg font-semibold text-black">4.1 Dados de Identificação</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Nome completo</li>
                      <li>Endereço de email</li>
                      <li>Número de telefone</li>
                      <li>Endereço postal (se fornecido)</li>
                      <li>Documentos de identificação (quando aplicável)</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">4.2 Dados de Conta</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Nome de usuário e credenciais de acesso</li>
                      <li>Senha (hash criptográfico)</li>
                      <li>Configurações de 2FA</li>
                      <li>Preferências e configurações pessoais</li>
                      <li>Histórico de login e atividades</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">4.3 Conteúdo e Perfil</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Foto de perfil e imagens de background</li>
                      <li>Biografia e descrição pessoal</li>
                      <li>Links de redes sociais</li>
                      <li>Perfis públicos criados</li>
                      <li>Temas e personalizações</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">4.4 Dados de Uso</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Histórico de navegação na plataforma</li>
                      <li>Registros de atividade</li>
                      <li>Preferências de comunicação</li>
                      <li>Tickets de suporte e conversas (após resolução)</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">4.5 Dados de Pagamento</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Informações de pagamento (mantemos apenas os últimos 4 dígitos para referência fiscal por 5 anos)</li>
                      <li>Histórico de transações pessoais (dados fiscais são anonimizados após período legal)</li>
                      <li>Assinaturas ativas são canceladas</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '5. O QUE NÃO É EXCLUÍDO IMEDIATAMENTE',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Por obrigações legais, os seguintes dados devem ser retidos temporariamente:</p>

                    <h3 className="text-lg font-semibold text-black">5.1 Dados Fiscais e Contábeis (5 anos)</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Faturas e notas fiscais emitidas</li>
                      <li>Registros de pagamentos recebidos</li>
                      <li>Informações de faturamento necessárias para auditorias</li>
                      <li>Dados exigidos por legislação tributária</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">5.2 Registros de Segurança (até 7 anos)</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Logs de atividades suspeitas ou fraudulentas</li>
                      <li>Registros de violações de termos de uso</li>
                      <li>Informações relacionadas a investigações de segurança</li>
                      <li>Dados necessários para prevenção de fraudes futuras</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">5.3 Disputas Legais (até resolução)</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Informações relevantes a processos judiciais em andamento</li>
                      <li>Evidências de disputas contratuais</li>
                      <li>Dados necessários para defesa de direitos legais</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">5.4 Backups de Sistema (até 90 dias)</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Dados em backups automáticos são sobrescritos gradualmente</li>
                      <li>Exclusão completa ocorre na próxima rotação de backup</li>
                      <li>Backups de segurança não são acessíveis para uso operacional</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '6. IMPACTO DA EXCLUSÃO EM DOMÍNIOS E SERVIÇOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-black font-semibold mb-2">Atenção: Impacto em Domínios</p>
                          <p className="text-[#6B7280]/80">
                            A exclusão de sua conta afetará todos os domínios e serviços associados. Por favor, revise cuidadosamente antes de proceder.
                          </p>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-black">6.1 Domínios Registrados</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Domínios ativos <strong className="text-[#EF4444]">NÃO são renovados automaticamente</strong></li>
                      <li>Você tem até a data de expiração para transferir ou renovar domínios antes da exclusão</li>
                      <li>Após expiração, domínios retornam ao pool de disponibilidade</li>
                      <li>Recomendamos transferir domínios importantes para outra conta antes da exclusão</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">6.2 Contas de Email Profissionais</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Todas as contas de email são <strong className="text-[#EF4444]">permanentemente desativadas</strong></li>
                      <li>Emails armazenados são excluídos e <strong className="text-[#EF4444]">não podem ser recuperados</strong></li>
                      <li>Faça backup de emails importantes antes de solicitar exclusão</li>
                      <li>Configure redirecionamentos de email se necessário</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">6.3 Assinaturas e Pagamentos</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Todas as assinaturas ativas são <strong className="text-black">canceladas imediatamente</strong></li>
                      <li><strong className="text-[#EF4444]">Não há reembolso</strong> por períodos não utilizados de assinaturas anuais</li>
                      <li>Pagamentos recorrentes são interrompidos</li>
                      <li>Créditos de conta são perdidos</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">6.4 Perfis Públicos</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Perfis públicos (ex: seunome.com.rich) são <strong className="text-[#EF4444]">permanentemente removidos</strong></li>
                      <li>URLs personalizados ficam indisponíveis</li>
                      <li>Visitantes encontrarão página de erro 404</li>
                      <li>Links externos para seu perfil deixarão de funcionar</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '7. PERÍODO DE GRAÇA E CANCELAMENTO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">7.1 Período de Reflexão (48 horas)</h3>
                    <p>
                      Após solicitar a exclusão, você tem <strong className="text-black">48 horas</strong> para cancelar a solicitação antes que o processo se torne irreversível:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Durante este período, sua conta permanece ativa mas em modo "pendente de exclusão"</li>
                      <li>Você pode fazer login e clicar em "Cancelar Exclusão" nas configurações</li>
                      <li>Alternativamente, responda ao email de confirmação solicitando o cancelamento</li>
                      <li>Após 48 horas, o processo se torna irreversível</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">7.2 Conta em Modo "Pendente de Exclusão"</h3>
                    <p>Durante o período de reflexão:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Você pode acessar e fazer backup de seus dados</li>
                      <li>Não é possível realizar novas compras ou renovações</li>
                      <li>Perfis públicos exibem aviso de "conta em processo de desativação"</li>
                      <li>Emails e serviços continuam funcionando normalmente</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '8. ALTERNATIVAS À EXCLUSÃO COMPLETA',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Antes de excluir permanentemente sua conta, considere estas alternativas:</p>

                    <h3 className="text-lg font-semibold text-black">8.1 Desativação Temporária</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Oculta seu perfil público sem excluir dados</li>
                      <li>Mantém domínios e assinaturas ativas</li>
                      <li>Pode ser reativada a qualquer momento</li>
                      <li>Ideal para pausas temporárias</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">8.2 Cancelamento de Assinaturas</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Cancela cobranças recorrentes sem excluir a conta</li>
                      <li>Mantém acesso aos serviços até o fim do período pago</li>
                      <li>Preserva dados e domínios</li>
                      <li>Pode retornar e renovar quando desejar</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">8.3 Limpeza Seletiva de Dados</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Remove apenas dados específicos que desejar</li>
                      <li>Mantém conta e serviços essenciais ativos</li>
                      <li>Por exemplo: remover foto de perfil, limpar histórico</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">8.4 Transferência de Domínios</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Transfira domínios para outra conta antes de excluir</li>
                      <li>Preserva seus investimentos em domínios</li>
                      <li>Permite excluir conta sem perder domínios importantes</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '9. RECUPERAÇÃO APÓS EXCLUSÃO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-black font-semibold mb-2">Exclusão é Permanente e Irreversível</p>
                          <p className="text-[#6B7280]/80">
                            Após a conclusão do processo de exclusão, <strong className="text-[#EF4444]">não é possível recuperar</strong> sua conta, dados, domínios ou qualquer informação associada. Esta ação é definitiva.
                          </p>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-black">9.1 O Que NÃO Pode Ser Recuperado</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Credenciais de acesso (email, senha)</li>
                      <li>Histórico de compras e transações</li>
                      <li>Configurações e preferências</li>
                      <li>Conteúdo carregado (fotos, textos)</li>
                      <li>Perfis públicos e URLs personalizados</li>
                      <li>Domínios expirados (retornam ao pool de disponibilidade)</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">9.2 Criação de Nova Conta</h3>
                    <p>
                      Você pode criar uma nova conta a qualquer momento, mas:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Será considerada uma conta completamente nova, sem histórico</li>
                      <li>Não haverá acesso a dados ou configurações da conta anterior</li>
                      <li>Domínios excluídos podem não estar mais disponíveis</li>
                      <li>Será necessário reconfigurar tudo do zero</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '10. CHECKLIST ANTES DA EXCLUSÃO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Antes de solicitar a exclusão de sua conta, certifique-se de:</p>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 my-4">
                      <h3 className="text-black font-semibold mb-4">✓ Checklist de Preparação</h3>
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 text-[#6B7280]/80">
                          <input type="checkbox" className="mt-1" disabled />
                          <span>Fazer backup de todos os dados importantes da plataforma</span>
                        </label>
                        <label className="flex items-start gap-3 text-[#6B7280]/80">
                          <input type="checkbox" className="mt-1" disabled />
                          <span>Salvar cópias de faturas e comprovantes fiscais</span>
                        </label>
                        <label className="flex items-start gap-3 text-[#6B7280]/80">
                          <input type="checkbox" className="mt-1" disabled />
                          <span>Exportar ou transferir domínios que deseja manter</span>
                        </label>
                        <label className="flex items-start gap-3 text-[#6B7280]/80">
                          <input type="checkbox" className="mt-1" disabled />
                          <span>Cancelar todas as assinaturas ativas</span>
                        </label>
                        <label className="flex items-start gap-3 text-[#6B7280]/80">
                          <input type="checkbox" className="mt-1" disabled />
                          <span>Informar contatos sobre mudança de email (se aplicável)</span>
                        </label>
                        <label className="flex items-start gap-3 text-[#6B7280]/80">
                          <input type="checkbox" className="mt-1" disabled />
                          <span>Remover links de perfil público de sites externos</span>
                        </label>
                        <label className="flex items-start gap-3 text-[#6B7280]/80">
                          <input type="checkbox" className="mt-1" disabled />
                          <span>Resolver tickets de suporte abertos</span>
                        </label>
                        <label className="flex items-start gap-3 text-[#6B7280]/80">
                          <input type="checkbox" className="mt-1" disabled />
                          <span>Confirmar que não há disputas ou pagamentos pendentes</span>
                        </label>
                      </div>
                    </div>
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
                            <h3 className="text-lg font-semibold text-black mb-2">Dúvidas sobre Exclusão de Conta?</h3>
                            <p className="text-[#6B7280]/80 mb-4">
                              Nossa equipe está disponível para esclarecer qualquer dúvida sobre o processo de exclusão antes que você tome a decisão final.
                            </p>
                            <ul className="space-y-2 text-[#6B7280]/80">
                              <li><strong className="text-black">Email para exclusão:</strong> <a href="mailto:deletion@com.rich" className="text-[#3B82F6] hover:underline">deletion@com.rich</a></li>
                              <li><strong className="text-black">Suporte geral:</strong> <a href="mailto:contact@com.rich" className="text-[#3B82F6] hover:underline">contact@com.rich</a></li>
                              <li><strong className="text-black">Prazo de resposta:</strong> Até 48 horas</li>
                            </ul>
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
              Esta Política de Exclusão foi atualizada em 26 de outubro de 2025. Reservamo-nos o direito de alterar esta política mediante notificação prévia.
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default DeletionPolicy;
