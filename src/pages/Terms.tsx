import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Shield, Globe } from 'lucide-react';

const Terms: React.FC = () => {
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
              Termos de Uso
            </h1>
            <p className="text-xl text-[#6B7280]/70 mb-4">Global Digital Identity LTD</p>
            <div className="inline-flex items-center gap-2 text-[#6B7280]/80">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Última atualização: 01 de novembro de 2025</span>
            </div>
            <p className="text-sm text-[#6B7280]/60 mt-2">
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
            {[
              {
                title: '1. INTRODUÇÃO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Bem-vindo ao <strong className="text-black">.com.rich</strong>, um serviço operado pela <strong className="text-black">Global Digital Identity LTD</strong>, empresa registrada na Inglaterra e País de Gales sob o número <strong className="text-black">Company No. 16339013</strong>, com sede em <strong className="text-black">71–75 Shelton Street, Covent Garden, Londres, WC2H 9JQ, Reino Unido</strong> (".com.rich", "Plataforma", "Serviço", "nós", "nosso").
                    </p>
                    <p>
                      <strong className="text-black">Contato oficial:</strong> <a href="mailto:support@com.rich" className="text-[#3B82F6] hover:text-[#6B7280]">support@com.rich</a>
                    </p>
                    <p>
                      Ao acessar, criar uma conta ou utilizar qualquer serviço do .com.rich, você ("Usuário", "Cliente") declara ter lido, compreendido e aceitado integralmente estes <strong className="text-black">Termos de Uso</strong> e a <strong className="text-black">Política de Privacidade</strong> correspondente.
                    </p>
                    <p>
                      O uso contínuo da plataforma constitui aceitação plena e irrevogável das condições aqui estabelecidas.
                    </p>
                  </div>
                )
              },
              {
                title: '2. OBJETO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>O <strong className="text-black">.com.rich</strong> é uma plataforma digital que oferece:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Registro, renovação e administração de domínios com a extensão <strong className="text-black">.com.rich</strong>;</li>
                      <li>Criação, gerenciamento e hospedagem de <strong className="text-black">perfis digitais profissionais personalizados</strong>;</li>
                      <li><strong className="text-black">Funcionalidade Loja:</strong> Vitrine digital para exposição de produtos e serviços (conforme <a href="/policies/store-terms" className="text-[#3B82F6] hover:underline">Termos da Loja</a>);</li>
                      <li><strong className="text-black">Funcionalidade Social:</strong> Rede social integrada para criação e compartilhamento de conteúdo (conforme <a href="/policies/social-terms" className="text-[#3B82F6] hover:underline">Termos da Rede Social</a>);</li>
                      <li>Painel de controle unificado para DNS, perfis, faturamento e suporte.</li>
                    </ul>
                    <p>
                      A <strong className="text-black">Global Digital Identity LTD</strong> atua como <strong className="text-black">intermediadora tecnológica</strong>, fornecendo acesso à infraestrutura necessária para operar perfis digitais e domínios personalizados.
                      O usuário reconhece que o serviço é disponibilizado "no estado em que se encontra", conforme disponibilidade técnica dos sistemas e provedores parceiros.
                    </p>
                  </div>
                )
              },
              {
                title: '3. CADASTRO E CONTA DE USUÁRIO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">3.1 Requisitos</h3>
                    <p>Para utilizar o .com.rich, o usuário deve:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Ter no mínimo 18 anos;</li>
                      <li>Fornecer informações verdadeiras, completas e atualizadas;</li>
                      <li>Aceitar integralmente estes Termos e a Política de Privacidade.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-4">3.2 Responsabilidades do Usuário</h3>
                    <p>O usuário é responsável por:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Manter seus dados e credenciais seguros e atualizados;</li>
                      <li>Garantir que o uso da conta seja legítimo e autorizado;</li>
                      <li>Assumir total responsabilidade pelas ações executadas através de sua conta.</li>
                    </ul>
                    <p>
                      Contas que violem estes Termos, apresentem fraude, spam ou uso abusivo poderão ser <strong className="text-black">suspensas, bloqueadas ou excluídas</strong> sem aviso prévio.
                    </p>
                  </div>
                )
              },
              {
                title: '4. PLANOS, PAGAMENTOS E RENOVAÇÕES',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">4.1 Moeda e Forma de Pagamento</h3>
                    <p>
                      Todos os valores são expressos e cobrados em <strong className="text-black">dólares americanos (USD)</strong>, com pagamento processado <strong className="text-black">exclusivamente via PayPal</strong>.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-4">4.2 Ciclo e Renovação</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Domínios:</strong> cobrança anual, com opção de renovação automática;</li>
                      <li><strong className="text-black">E-mails:</strong> cobrança mensal, conforme plano escolhido;</li>
                      <li>A falta de pagamento implica <strong className="text-black">suspensão automática do serviço</strong>.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-4">4.3 Reembolsos</h3>
                    <p>
                      Serviços digitais ativados automaticamente <strong className="text-black">não são reembolsáveis</strong>, salvo em caso de erro técnico comprovado ou duplicidade de cobrança.
                    </p>
                  </div>
                )
              },
              {
                title: '5. ASSINATURAS, PLANOS E POLÍTICA DE DOWNGRADE',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">5.1 Modelo de Assinatura</h3>
                    <p>
                      O acesso à plataforma .com.rich requer uma <strong className="text-black">assinatura mensal ativa</strong>.
                      Existem dois planos principais:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li><strong className="text-black">Prime ($50/mês):</strong> Inclui 1 domínio .com.rich, sistema completo de links personalizados, analytics, QR codes e participação no programa de afiliados com comissão de 25% sobre vendas de planos de assinatura.</li>
                      <li><strong className="text-black">Elite ($70/mês, aumentando para $100/mês em 1º jan/2026):</strong> Inclui todos os recursos do Prime, acesso exclusivo à Galeria Premium, suporte prioritário, comissão de afiliado de 50% sobre vendas de planos de assinatura e benefícios exclusivos.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-4">5.2 Domínios Adicionais</h3>
                    <p>
                      Usuários com assinatura ativa podem licenciar domínios adicionais:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li><strong className="text-black">Domínios Regulares:</strong> $100/ano por domínio, disponíveis para todos os assinantes.</li>
                      <li><strong className="text-black">Domínios Premium (Galeria):</strong> Valor variável ($500 a $50,000+/ano), disponíveis exclusivamente para assinantes do plano Elite, sob consulta individual.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-4">5.3 Política de Downgrade: Elite → Prime</h3>
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-4">
                      <p className="font-semibold text-amber-900 mb-2">⚠️ ATENÇÃO: SUSPENSÃO AUTOMÁTICA DE DOMÍNIOS PREMIUM</p>
                      <p className="text-amber-800">
                        Ao fazer downgrade do plano Elite para o plano Prime, todos os <strong>domínios premium da Galeria</strong> (valor superior a $500/ano) serão <strong>automaticamente suspensos</strong>.
                      </p>
                    </div>

                    <p className="font-semibold text-black">O que acontece no downgrade:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li><strong className="text-red-600">Você PERDE:</strong>
                        <ul className="ml-6 mt-2 space-y-1 list-circle">
                          <li>Acesso aos domínios premium (suspensos e links inativos)</li>
                          <li>Capacidade de licenciar novos domínios da Galeria Premium</li>
                          <li>Comissões de afiliado reduzem de 50% para 25%</li>
                          <li>Suporte prioritário e benefícios Elite</li>
                        </ul>
                      </li>
                      <li><strong className="text-emerald-600">Você MANTÉM:</strong>
                        <ul className="ml-6 mt-2 space-y-1 list-circle">
                          <li>Domínio principal incluído no plano</li>
                          <li>Todos os domínios regulares ($100/ano) permanecem ativos</li>
                          <li>Sistema completo de links, analytics e QR codes</li>
                          <li>Participação no programa de afiliados (com comissão reduzida)</li>
                        </ul>
                      </li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-4">5.4 Reativação de Domínios Premium</h3>
                    <p>
                      Domínios premium suspensos <strong className="text-black">não são perdidos permanentemente</strong>.
                      Você pode reativá-los a qualquer momento fazendo <strong className="text-black">upgrade de volta para o plano Elite</strong>.
                      A reativação é automática e imediata.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-4">5.5 Cancelamento Total da Assinatura</h3>
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
                      <p className="font-semibold text-red-900 mb-2">🚨 PERDA TOTAL DE ACESSO</p>
                      <p className="text-red-800">
                        Se você <strong>cancelar completamente a assinatura</strong> ou <strong>deixar de pagar dentro dos prazos estabelecidos</strong>,
                        você perderá <strong>automaticamente</strong>:
                      </p>
                      <ul className="mt-2 space-y-1 text-red-800 list-disc list-inside ml-4">
                        <li>TODOS os domínios vinculados (regulares e premium)</li>
                        <li>TODOS os links e sistema de bio links</li>
                        <li>TODAS as comissões de afiliado não pagas</li>
                        <li>TODO o acesso à plataforma</li>
                      </ul>
                      <p className="text-red-800 mt-2 font-semibold">
                        Não há recuperação após 30 dias de inadimplência.
                      </p>
                    </div>

                    <h3 className="text-lg font-semibold text-black mt-4">5.6 Titularidade dos Domínios</h3>
                    <p>
                      <strong className="text-black">IMPORTANTE:</strong> Todos os domínios .com.rich são propriedade exclusiva da
                      <strong className="text-black"> Global Digital Identity LTD</strong>.
                      Os usuários recebem apenas <strong className="text-black">licenças exclusivas de uso</strong>, que são:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Revogáveis em caso de violação dos termos de uso</li>
                      <li>Condicionadas à manutenção da assinatura ativa</li>
                      <li>Não transferíveis para outras plataformas sem autorização</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '6. REGISTRO E GESTÃO DE DOMÍNIOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">6.1 Titularidade</h3>
                    <p>
                      Durante o período contratado, o domínio pertence ao usuário titular da conta, que detém total controle sobre seu uso, DNS e transferências.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-4">6.2 Transferências</h3>
                    <p>
                      O usuário pode solicitar o <strong className="text-black">AuthCode (código de transferência)</strong> a qualquer momento, salvo quando:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>houver pendências financeiras;</li>
                      <li>o domínio estiver sob investigação por abuso ou fraude;</li>
                      <li>o domínio tiver sido registrado há menos de 60 dias.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-4">6.3 Expiração e Recuperação</h3>
                    <p>
                      Após o vencimento, aplica-se o <strong className="text-black">grace period</strong> (período de carência). Caso não seja renovado, o domínio poderá entrar em <strong className="text-black">redemption period</strong>, sujeito a taxas adicionais.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-4">6.4 Uso Indevido de Domínios</h3>
                    <p>É estritamente proibido registrar ou utilizar domínios com propósitos que envolvam:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>envio de spam, phishing, golpes financeiros ou roubo de dados;</li>
                      <li>violação de direitos autorais, marcas ou privacidade de terceiros;</li>
                      <li>conteúdo ilegal, discriminatório, violento, difamatório ou pornográfico.</li>
                    </ul>
                    <p>
                      A empresa reserva-se o direito de <strong className="text-black">suspender imediatamente</strong> qualquer domínio envolvido em atividades suspeitas.
                    </p>
                  </div>
                )
              },
              {
                title: '7. E-MAILS PERSONALIZADOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">7.1 Criação e Armazenamento</h3>
                    <p>
                      Os usuários podem criar caixas de e-mail associadas aos seus domínios.
                      Os serviços de e-mail incluem autenticação, proteção antispam, DNS e acesso via Webmail ou aplicativos IMAP/SMTP.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-4">7.2 Limites Técnicos</h3>
                    <p>O limite de armazenamento e tamanho de anexos depende do plano contratado. Valores referenciais:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Plano Padrão:</strong> 10 GB por conta;</li>
                      <li><strong className="text-black">Plano Pro:</strong> 30 GB por conta;</li>
                      <li><strong className="text-black">Limite de anexo:</strong> 25 MB por mensagem.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-4">7.3 Confidencialidade e Logs</h3>
                    <p>
                      O conteúdo das mensagens de e-mail é confidencial.
                      A Global Digital Identity LTD <strong className="text-black">não lê, copia ou monitora e-mails</strong>, exceto quando:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>houver solicitação legal formal (ordem judicial);</li>
                      <li>houver necessidade técnica para diagnóstico de falha grave;</li>
                      <li>for necessária auditoria de segurança ou investigação de abuso.</li>
                    </ul>
                    <p>
                      Logs de atividade (endereços IP, datas de acesso, registros SMTP) podem ser mantidos para fins de <strong className="text-black">segurança e conformidade legal</strong>.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-4">7.4 Política Anti-Spam e Uso Aceitável</h3>
                    <p>
                      O usuário compromete-se a <strong className="text-black">não enviar e-mails em massa não solicitados</strong> (spam), incluindo:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>campanhas de marketing sem consentimento;</li>
                      <li>envio automatizado de mensagens comerciais;</li>
                      <li>phishing, spoofing ou qualquer prática de manipulação de identidade.</li>
                    </ul>
                    <p>
                      Contas envolvidas em spam, golpes ou abuso de rede podem ser <strong className="text-black">suspensas ou encerradas sem aviso prévio</strong>.
                    </p>
                    <p>
                      A Global Digital Identity LTD pode cooperar com provedores, entidades de segurança e autoridades legais quando houver indícios de atividade ilícita.
                    </p>
                  </div>
                )
              },
              {
                title: '8. CONDUTA DO USUÁRIO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>O usuário se compromete a:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>cumprir as leis do Reino Unido e do país de residência;</li>
                      <li>não usar o serviço para violar direitos de terceiros;</li>
                      <li>manter postura ética e legítima ao utilizar o domínio ou e-mails;</li>
                      <li>proteger suas credenciais e dispositivos contra acesso indevido.</li>
                    </ul>
                    <p>
                      A empresa reserva-se o direito de suspender, limitar ou encerrar o serviço em caso de uso abusivo, fraudulento ou contrário a estes Termos.
                    </p>
                  </div>
                )
              },
              {
                title: '9. LIMITAÇÃO DE RESPONSABILIDADE',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>A <strong className="text-black">Global Digital Identity LTD</strong>:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>atua apenas como intermediadora técnica;</li>
                      <li>não é responsável pelo conteúdo das comunicações enviadas por e-mail;</li>
                      <li>não garante funcionamento ininterrupto, nem ausência de falhas técnicas;</li>
                      <li>não se responsabiliza por danos indiretos, perda de dados, lucros cessantes ou prejuízos comerciais;</li>
                      <li>não assume responsabilidade por atos ou omissões de terceiros prestadores de serviço de rede, DNS ou e-mail.</li>
                    </ul>
                    <p>
                      O uso do .com.rich é feito <strong className="text-black">sob inteira responsabilidade do usuário</strong>.
                    </p>
                  </div>
                )
              },
              {
                title: '10. PRIVACIDADE E PROTEÇÃO DE DADOS (UK GDPR / GDPR)',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      O .com.rich cumpre integralmente o <strong className="text-black">UK Data Protection Act 2018</strong> e o <strong className="text-black">General Data Protection Regulation (GDPR)</strong> da União Europeia.
                    </p>
                    <p>Os dados pessoais são tratados para:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>criação e manutenção de contas;</li>
                      <li>faturamento e suporte técnico;</li>
                      <li>verificação de identidade e segurança;</li>
                      <li>cumprimento de obrigações legais.</li>
                    </ul>
                    <p>O usuário tem direito a:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>acesso, retificação e exclusão de dados;</li>
                      <li>portabilidade e limitação de tratamento;</li>
                      <li>revogação de consentimento a qualquer momento.</li>
                    </ul>
                    <p>
                      Solicitações devem ser enviadas a <a href="mailto:support@com.rich" className="text-[#3B82F6] hover:text-[#6B7280]">support@com.rich</a>.
                    </p>
                    <p>
                      Os dados podem ser armazenados em servidores localizados dentro ou fora do Reino Unido, mantendo-se sempre <strong className="text-black">níveis adequados de proteção e criptografia</strong>.
                    </p>
                  </div>
                )
              },
              {
                title: '11. PROPRIEDADE INTELECTUAL',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Todo o conteúdo, design, código, interface e logotipos exibidos no site e painel são de propriedade da <strong className="text-black">Global Digital Identity LTD</strong>.
                    </p>
                    <p>É proibido:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>reproduzir, modificar, distribuir ou explorar qualquer parte do sistema;</li>
                      <li>utilizar as marcas ".com.rich" ou "Global Digital Identity LTD" sem autorização;</li>
                      <li>realizar engenharia reversa, scraping ou automação não autorizada.</li>
                    </ul>
                    <p>
                      Violadores estarão sujeitos às medidas civis e criminais cabíveis.
                    </p>
                  </div>
                )
              },
              {
                title: '12. SUSPENSÃO, ENCERRAMENTO E COOPERAÇÃO LEGAL',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>A Global Digital Identity LTD pode suspender ou encerrar o serviço de qualquer conta que:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>utilize o serviço para fins ilícitos;</li>
                      <li>infrinja direitos de terceiros;</li>
                      <li>comprometa a segurança da rede;</li>
                      <li>desrespeite ordens judiciais ou regulatórias.</li>
                    </ul>
                    <p>
                      A empresa <strong className="text-black">coopera com autoridades</strong> mediante solicitações formais válidas no Reino Unido ou por tratados internacionais aplicáveis (incluindo UK-EU e UK-LATAM frameworks).
                    </p>
                  </div>
                )
              },
              {
                title: '13. SUPORTE E ATENDIMENTO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>O suporte é realizado <strong className="text-black">exclusivamente por e-mail</strong> ou pelo formulário de contato no site.</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">E-mail:</strong> <a href="mailto:support@com.rich" className="text-[#3B82F6] hover:text-[#6B7280]">support@com.rich</a></li>
                      <li><strong className="text-black">Formulário:</strong> disponível em com.rich/contato</li>
                    </ul>
                    <p>O suporte cobre questões relacionadas a:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>login, acesso e configurações da conta;</li>
                      <li>faturamento e cobrança;</li>
                      <li>funcionamento técnico da plataforma.</li>
                    </ul>
                    <p>
                      Tempo de resposta: <strong className="text-black">até 24 horas</strong>. Resolução: <strong className="text-black">3 a 5 dias úteis</strong> dependendo da complexidade.
                      Não há suporte via telefone, WhatsApp ou redes sociais.
                    </p>
                  </div>
                )
              },
              {
                title: '14. ALTERAÇÕES DESTES TERMOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      A Global Digital Identity LTD poderá atualizar estes Termos a qualquer momento, mediante publicação no site.
                      O uso contínuo do serviço após alterações implica <strong className="text-black">aceitação automática</strong> das novas condições.
                    </p>
                  </div>
                )
              },
              {
                title: '14. LEI APLICÁVEL E JURISDIÇÃO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Estes Termos são regidos pelas <strong className="text-black">leis da Inglaterra e País de Gales (England and Wales)</strong>.
                    </p>
                    <p>
                      Fica eleito o foro exclusivo dos <strong className="text-black">tribunais de Londres, Reino Unido</strong>, para resolver qualquer disputa decorrente deste documento.
                    </p>
                    <p>
                      Nada aqui prejudica direitos legais obrigatórios do consumidor previstos nas leis do país de residência do usuário, quando aplicáveis.
                    </p>
                  </div>
                )
              },
              {
                title: '15. IDIOMA PREVALENTE',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Este documento pode ser disponibilizado em outros idiomas para conveniência dos usuários.
                      Em caso de divergência, <strong className="text-black">a versão em inglês prevalecerá para todos os efeitos legais</strong>.
                    </p>
                    <p>
                      A versão oficial e vinculante é a redigida em inglês, sob jurisdição do Reino Unido.
                    </p>
                  </div>
                )
              },
              {
                title: '17. CONTATO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-2">
                    <p className="font-semibold text-black">Global Digital Identity LTD</p>
                    <p>71–75 Shelton Street, Covent Garden</p>
                    <p>Londres, WC2H 9JQ — Reino Unido</p>
                    <p>Company No. 16339013</p>
                    <p>
                      E-mail: <a href="mailto:support@com.rich" className="text-[#3B82F6] hover:text-[#6B7280]">support@com.rich</a>
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
                Se você tiver dúvidas sobre estes termos, entre em contato conosco.
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

export default Terms;
