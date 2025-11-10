import React from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, Shield, FileText } from 'lucide-react';

const DataRequestPolicy: React.FC = () => {
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
              <Download className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              Política de Solicitação de Dados
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
                  A <strong className="text-black">Global Digital Identity LTD</strong>, operadora da plataforma <strong className="text-black">Com.rich</strong>, reconhece e respeita seu direito de acessar, corrigir e controlar seus dados pessoais.
                </p>
                <p>
                  Em conformidade com o <strong className="text-black">Regulamento Geral sobre a Proteção de Dados (GDPR)</strong>, esta política estabelece como você pode exercer seus direitos relacionados aos seus dados pessoais.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {[
              {
                title: '1. SEUS DIREITOS SOBRE DADOS PESSOAIS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Como titular de dados, você possui os seguintes direitos garantidos por lei:
                    </p>

                    <h3 className="text-lg font-semibold text-black">1.1 Direito de Acesso</h3>
                    <p>
                      Você tem o direito de obter confirmação sobre quais dados pessoais processamos e receber uma cópia completa desses dados.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-6">1.2 Direito de Retificação</h3>
                    <p>
                      Você pode solicitar a correção de dados pessoais imprecisos ou incompletos a qualquer momento.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-6">1.3 Direito de Exclusão ("Direito ao Esquecimento")</h3>
                    <p>
                      Você pode solicitar a remoção de seus dados pessoais, exceto quando houver obrigação legal de retenção.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-6">1.4 Direito de Portabilidade</h3>
                    <p>
                      Você pode receber seus dados em formato estruturado e legível por máquina e transferi-los para outro controlador.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-6">1.5 Direito de Restrição de Processamento</h3>
                    <p>
                      Você pode limitar o processamento de seus dados em circunstâncias específicas, como durante contestação de precisão.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-6">1.6 Direito de Oposição</h3>
                    <p>
                      Você pode se opor ao processamento de dados com base em interesses legítimos ou para marketing direto.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-6">1.7 Direito de Revisão de Decisões Automatizadas</h3>
                    <p>
                      Você tem o direito de não ser sujeito a decisões baseadas exclusivamente em processamento automatizado sem intervenção humana.
                    </p>
                  </div>
                )
              },
              {
                title: '2. TIPOS DE SOLICITAÇÕES',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">2.1 Solicitação de Cópia de Dados (Data Export)</h3>
                    <p>
                      Receba uma cópia completa de todos os dados pessoais que mantemos sobre você, incluindo:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Informações de perfil e conta</li>
                      <li>Histórico de transações e pagamentos</li>
                      <li>Configurações e preferências</li>
                      <li>Logs de atividade (últimos 6 meses)</li>
                      <li>Conteúdo carregado (fotos, textos)</li>
                      <li>Comunicações com suporte</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.2 Solicitação de Correção</h3>
                    <p>
                      Corrija ou atualize dados pessoais imprecisos ou desatualizados:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Nome, email, telefone</li>
                      <li>Endereço postal</li>
                      <li>Informações de faturamento</li>
                      <li>Preferências de comunicação</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.3 Solicitação de Exclusão</h3>
                    <p>
                      Remova permanentemente dados pessoais de nossos sistemas (sujeito a obrigações legais).
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-6">2.4 Solicitação de Restrição</h3>
                    <p>
                      Limite temporariamente o processamento de seus dados enquanto verifica precisão ou contesta o uso.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-6">2.5 Solicitação de Portabilidade</h3>
                    <p>
                      Receba dados em formato legível por máquina (JSON ou CSV) para transferência a outro serviço.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-6">2.6 Oposição ao Processamento</h3>
                    <p>
                      Objete ao processamento de dados para finalidades específicas, como marketing ou perfilamento.
                    </p>
                  </div>
                )
              },
              {
                title: '3. COMO FAZER UMA SOLICITAÇÃO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">3.1 Portal de Autoatendimento (Recomendado)</h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4">
                      <p className="text-black font-semibold mb-2">Acesso Rápido via Painel</p>
                      <ol className="space-y-2 text-[#6B7280]/80 list-decimal list-inside">
                        <li>Faça login em sua conta</li>
                        <li>Acesse <strong>Configurações {'>'} Privacidade e Dados</strong></li>
                        <li>Selecione o tipo de solicitação desejada</li>
                        <li>Confirme sua identidade (senha ou 2FA)</li>
                        <li>Aguarde o processamento automático</li>
                      </ol>
                      <p className="text-[#6B7280]/70 text-sm mt-3">
                        ✓ Processamento instantâneo para exportação de dados<br />
                        ✓ Download imediato de arquivo ZIP com seus dados
                      </p>
                    </div>

                    <h3 className="text-lg font-semibold text-black mt-6">3.2 Solicitação por Email</h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
                      <p className="text-black font-semibold mb-2">Para Solicitações Complexas</p>
                      <p className="text-[#6B7280]/80 mb-2">Envie um email para:</p>
                      <ul className="space-y-1 text-[#6B7280]/80 list-disc list-inside">
                        <li><strong>Email:</strong> <a href="mailto:data-request@com.rich" className="text-[#3B82F6] hover:underline">data-request@com.rich</a></li>
                        <li><strong>Assunto:</strong> "Solicitação de Dados - [Tipo de Solicitação]"</li>
                        <li><strong>Incluir:</strong></li>
                      </ul>
                      <ul className="space-y-1 text-[#6B7280]/70 list-disc list-inside ml-6 mt-2">
                        <li>Nome completo cadastrado</li>
                        <li>Email da conta</li>
                        <li>Tipo de solicitação (acesso, correção, exclusão, etc.)</li>
                        <li>Detalhes específicos da solicitação</li>
                        <li>Documento de identificação (quando necessário)</li>
                      </ul>
                    </div>

                    <h3 className="text-lg font-semibold text-black mt-6">3.3 Solicitação por Correio (Para Casos Especiais)</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
                      <p className="text-black font-semibold mb-2">Endereço Postal</p>
                      <p className="text-[#6B7280]/80">
                        <strong>Global Digital Identity LTD</strong><br />
                        Data Protection Officer<br />
                        71-75 Shelton Street<br />
                        Covent Garden<br />
                        London, WC2H 9JQ<br />
                        United Kingdom
                      </p>
                      <p className="text-[#6B7280]/70 text-sm mt-3">
                        ⚠️ Solicitações por correio têm prazo de resposta de até 45 dias
                      </p>
                    </div>
                  </div>
                )
              },
              {
                title: '4. VERIFICAÇÃO DE IDENTIDADE',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Para proteger seus dados contra acesso não autorizado, precisamos verificar sua identidade antes de processar solicitações.
                    </p>

                    <h3 className="text-lg font-semibold text-black">4.1 Métodos de Verificação</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Login na conta:</strong> Autenticação via senha e 2FA (se habilitado)</li>
                      <li><strong className="text-black">Confirmação por email:</strong> Link único enviado para o email cadastrado</li>
                      <li><strong className="text-black">Perguntas de segurança:</strong> Validação de informações da conta</li>
                      <li><strong className="text-black">Documentação:</strong> Para casos complexos ou sensíveis</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">4.2 Documentos Aceitos (quando necessário)</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Passaporte</li>
                      <li>Carteira de identidade nacional</li>
                      <li>Carteira de motorista</li>
                      <li>Documento com foto emitido por órgão governamental</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">4.3 Proteção de Documentos</h3>
                    <p>
                      Documentos fornecidos são:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Usados exclusivamente para verificação de identidade</li>
                      <li>Excluídos permanentemente após validação (máximo 30 dias)</li>
                      <li>Armazenados com criptografia AES-256</li>
                      <li>Acessíveis apenas por pessoal autorizado</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '5. PRAZOS DE RESPOSTA',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">5.1 Solicitações Automáticas (Portal)</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Exportação de dados:</strong> Processamento instantâneo</li>
                      <li><strong className="text-black">Download disponível:</strong> Imediatamente após geração</li>
                      <li><strong className="text-black">Validade do link:</strong> 7 dias</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">5.2 Solicitações por Email</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Confirmação de recebimento:</strong> Até 48 horas</li>
                      <li><strong className="text-black">Verificação de identidade:</strong> Até 5 dias úteis</li>
                      <li><strong className="text-black">Processamento da solicitação:</strong> Até 30 dias corridos</li>
                      <li><strong className="text-black">Entrega dos dados:</strong> Via email seguro ou download protegido</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">5.3 Extensão de Prazo</h3>
                    <p>
                      Em casos excepcionais (solicitações complexas ou grande volume de dados), podemos estender o prazo por mais 30 dias, notificando você antecipadamente com justificativa.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-6">5.4 Solicitações Urgentes</h3>
                    <p>
                      Para situações de urgência legítima (ex: risco à segurança), entre em contato através de:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Email prioritário:</strong> <a href="mailto:urgent@com.rich" className="text-[#3B82F6] hover:underline">urgent@com.rich</a></li>
                      <li><strong className="text-black">Prazo de resposta:</strong> Até 24 horas</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '6. FORMATO DOS DADOS FORNECIDOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">6.1 Exportação Padrão (Portal)</h3>
                    <p>
                      A exportação automática inclui:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Formato:</strong> Arquivo ZIP contendo múltiplos arquivos JSON</li>
                      <li><strong className="text-black">Estrutura:</strong> Dados organizados por categoria (perfil, transações, logs)</li>
                      <li><strong className="text-black">Legibilidade:</strong> JSON formatado com documentação incluída</li>
                      <li><strong className="text-black">Imagens e arquivos:</strong> Incluídos em pastas separadas</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">6.2 Formatos Alternativos Disponíveis</h3>
                    <p>
                      Mediante solicitação específica, podemos fornecer dados em:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">CSV:</strong> Para dados tabulares (transações, logs)</li>
                      <li><strong className="text-black">PDF:</strong> Relatório legível com resumo de dados</li>
                      <li><strong className="text-black">XML:</strong> Para integração com outros sistemas</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">6.3 Conteúdo do Pacote de Dados</h3>
                    <p>
                      Sua exportação completa inclui:
                    </p>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
                      <p className="text-black font-semibold mb-3">📦 Estrutura do Arquivo</p>
                      <ul className="space-y-1 text-[#6B7280]/80 font-mono text-sm">
                        <li>├─ profile.json (dados de perfil)</li>
                        <li>├─ account.json (configurações de conta)</li>
                        <li>├─ transactions.json (histórico de pagamentos)</li>
                        <li>├─ domains.json (domínios registrados)</li>
                        <li>├─ activity_logs.json (últimos 6 meses)</li>
                        <li>├─ support_tickets.json (tickets resolvidos)</li>
                        <li>├─ preferences.json (preferências e configurações)</li>
                        <li>├─ /images/ (fotos de perfil e backgrounds)</li>
                        <li>└─ README.md (documentação do pacote)</li>
                      </ul>
                    </div>
                  </div>
                )
              },
              {
                title: '7. DADOS INCLUÍDOS NA EXPORTAÇÃO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">7.1 Dados de Identificação</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Nome completo</li>
                      <li>Endereço de email</li>
                      <li>Número de telefone</li>
                      <li>Endereço postal (se fornecido)</li>
                      <li>Data de nascimento (se fornecida)</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">7.2 Dados de Conta</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Nome de usuário</li>
                      <li>Data de criação da conta</li>
                      <li>Data da última modificação</li>
                      <li>Plano de assinatura ativo</li>
                      <li>Configurações de 2FA</li>
                      <li>Preferências de privacidade</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">7.3 Dados de Domínios e Serviços</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Lista de domínios registrados</li>
                      <li>Datas de registro e expiração</li>
                      <li>Status de cada domínio</li>
                      <li>Configurações de DNS</li>
                      <li>Contas de email associadas</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">7.4 Dados Financeiros</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Histórico de transações (últimos 5 anos)</li>
                      <li>Faturas emitidas</li>
                      <li>Método de pagamento (apenas últimos 4 dígitos)</li>
                      <li>Créditos de conta</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">7.5 Dados de Uso e Atividade</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Logs de login (últimos 6 meses)</li>
                      <li>Histórico de navegação na plataforma</li>
                      <li>Atividades realizadas</li>
                      <li>Dispositivos e navegadores usados</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">7.6 Conteúdo Criado</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Fotos de perfil</li>
                      <li>Imagens de background</li>
                      <li>Biografia e descrições</li>
                      <li>Links de redes sociais</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">7.7 Comunicações</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Histórico de tickets de suporte</li>
                      <li>Emails trocados com nossa equipe</li>
                      <li>Preferências de comunicação</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '8. DADOS NÃO INCLUÍDOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Por motivos de segurança, privacidade de terceiros ou obrigações legais, os seguintes dados NÃO são incluídos na exportação:
                    </p>

                    <h3 className="text-lg font-semibold text-black">8.1 Dados de Segurança</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Senhas (mesmo em formato hash)</li>
                      <li>Chaves de API e tokens de acesso</li>
                      <li>Códigos de autenticação de dois fatores</li>
                      <li>Perguntas e respostas de segurança</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">8.2 Dados de Terceiros</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Informações pessoais de outros usuários</li>
                      <li>Dados agregados e anonimizados</li>
                      <li>Informações de terceiros prestadores de serviço</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">8.3 Dados Legais Restritos</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Informações sujeitas a investigações legais em andamento</li>
                      <li>Dados protegidos por sigilo judicial</li>
                      <li>Registros de atividades suspeitas ou fraudulentas</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">8.4 Dados Técnicos Internos</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Logs de sistema detalhados de infraestrutura</li>
                      <li>Informações de depuração técnica</li>
                      <li>Metadados internos de processamento</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '9. CUSTOS E LIMITAÇÕES',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">9.1 Solicitações Gratuitas</h3>
                    <p>
                      Você tem direito a <strong className="text-black">uma exportação completa gratuita</strong> a cada 12 meses.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-6">9.2 Solicitações Adicionais</h3>
                    <p>
                      Solicitações adicionais no mesmo período de 12 meses:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">2ª solicitação:</strong> Gratuita</li>
                      <li><strong className="text-black">3ª solicitação em diante:</strong> Taxa administrativa de £25 (ou equivalente)</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">9.3 Solicitações Manifestamente Infundadas ou Excessivas</h3>
                    <p>
                      Reservamo-nos o direito de:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Cobrar taxa razoável considerando custos administrativos</li>
                      <li>Recusar solicitações claramente abusivas ou repetitivas sem justificativa</li>
                      <li>Solicitar esclarecimentos antes de processar solicitações ambíguas</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">9.4 Limitações de Frequência</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Portal de autoatendimento: Máximo 1 exportação a cada 7 dias</li>
                      <li>Solicitações por email: Sem limite, mas sujeito a revisão de abuso</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '10. SEGURANÇA NA ENTREGA DE DADOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Implementamos medidas rigorosas para proteger seus dados durante o processo de exportação e entrega:
                    </p>

                    <h3 className="text-lg font-semibold text-black">10.1 Criptografia</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Arquivos exportados são criptografados com AES-256</li>
                      <li>Links de download protegidos por HTTPS</li>
                      <li>Senha única gerada para abrir o arquivo ZIP</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">10.2 Autenticação</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Link de download enviado apenas para o email cadastrado</li>
                      <li>Token de acesso com validade de 7 dias</li>
                      <li>Autenticação adicional via código enviado por SMS (opcional)</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">10.3 Logs de Auditoria</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Registro de todas as solicitações e downloads</li>
                      <li>Notificação por email ao completar exportação</li>
                      <li>Alerta de segurança se detectada atividade suspeita</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">10.4 Expiração e Destruição</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Arquivos exportados são excluídos automaticamente após 30 dias</li>
                      <li>Links de download expiram após 7 dias</li>
                      <li>Destruição segura de cópias temporárias</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '11. RECURSOS E RECLAMAÇÕES',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">11.1 Se Não Estiver Satisfeito</h3>
                    <p>
                      Caso não esteja satisfeito com nossa resposta à sua solicitação:
                    </p>
                    <ol className="space-y-2 text-[#6B7280]/70 list-decimal list-inside">
                      <li>Entre em contato com nosso DPO (Data Protection Officer) em <a href="mailto:dpo@com.rich" className="text-[#3B82F6] hover:underline">dpo@com.rich</a></li>
                      <li>Explique detalhadamente sua preocupação</li>
                      <li>Aguarde revisão e resposta dentro de 15 dias úteis</li>
                    </ol>

                    <h3 className="text-lg font-semibold text-black mt-6">11.2 Autoridades de Proteção de Dados</h3>
                    <p>
                      Você tem o direito de apresentar reclamação às autoridades competentes:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Reino Unido:</strong> Information Commissioner's Office (ICO) - <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] hover:underline">ico.org.uk</a></li>
                      <li><strong className="text-black">União Europeia:</strong> Autoridade de proteção de dados do seu país</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '12. CONTATO E SUPORTE',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-900 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
                      <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                          <Shield className="w-6 h-6 text-[#3B82F6] flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="text-lg font-semibold text-black mb-2">Dúvidas sobre Solicitação de Dados?</h3>
                            <p className="text-[#6B7280]/80 mb-4">
                              Nossa equipe de proteção de dados está disponível para ajudar:
                            </p>
                            <ul className="space-y-2 text-[#6B7280]/80">
                              <li><strong className="text-black">Solicitações de dados:</strong> <a href="mailto:data-request@com.rich" className="text-[#3B82F6] hover:underline">data-request@com.rich</a></li>
                              <li><strong className="text-black">Data Protection Officer:</strong> <a href="mailto:dpo@com.rich" className="text-[#3B82F6] hover:underline">dpo@com.rich</a></li>
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
              Esta Política de Solicitação de Dados foi atualizada em 26 de outubro de 2025 e reflete nosso compromisso com a transparência e seus direitos de privacidade.
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default DataRequestPolicy;
