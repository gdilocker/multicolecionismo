import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Calendar, Lock, AlertTriangle } from 'lucide-react';

const Privacy: React.FC = () => {
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
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              Política de Privacidade
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
                <Lock className="w-6 h-6 text-[#3B82F6] flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-black mb-2">Global Digital Identity LTD</h2>
                  <p className="text-[#6B7280]/80 leading-relaxed mb-2">
                    A presente Política de Privacidade descreve como a <strong>Global Digital Identity LTD</strong>, registrada na Inglaterra e País de Gales sob o número <strong>Company No. 16339013</strong>, com sede em <strong>71–75 Shelton Street, Covent Garden, Londres, WC2H 9JQ, Reino Unido</strong>, coleta, utiliza, armazena e protege informações pessoais de usuários.
                  </p>
                  <p className="text-[#6B7280]/70 text-sm">
                    O <strong>.com.rich</strong> atua como <strong>Controlador de Dados</strong> conforme o UK GDPR (Data Protection Act 2018) e o GDPR (UE).
                  </p>
                  <p className="text-[#6B7280]/70 text-sm mt-2">
                    <strong>Contato oficial de privacidade:</strong> <a href="mailto:support@com.rich" className="text-[#3B82F6] hover:text-[#6B7280]">support@com.rich</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {[
              {
                title: '1. DADOS COLETADOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">1.1 Dados fornecidos diretamente por você</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Nome completo, país/estado e endereço (para faturamento e contrato de titularidade do domínio);</li>
                      <li>E-mail de contato da conta (login/recuperação);</li>
                      <li>Dados de faturamento necessários à emissão de recibos/faturas;</li>
                      <li>Preferências de idioma e configurações do painel;</li>
                      <li>Registros de suporte (conteúdo de chamados e anexos enviados voluntariamente).</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-4">1.2 Dados coletados automaticamente</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Metadados técnicos:</strong> endereço IP, data/hora de acesso, agente de usuário (navegador/SO), identificadores de sessão, páginas acessadas;</li>
                      <li><strong className="text-black">Cookies essenciais</strong> (autenticação, sessão, idioma);</li>
                      <li><strong className="text-black">Logs de serviço de e-mail</strong> (ex.: registros SMTP/IMAP/Webmail, tamanhos e contagens de mensagens, erros de entrega, status de fila);</li>
                      <li><strong className="text-black">DNS:</strong> consultas e atualizações de registros relacionadas ao seu domínio.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-4">1.3 Dados relativos ao serviço de e-mail</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Conteúdo de e-mail:</strong> mensagens e anexos trafegam criptografados e ficam armazenados exclusivamente nas caixas postais do usuário durante a vigência do serviço;</li>
                      <li><strong className="text-black">Cabeçalhos e roteamento:</strong> informações técnicas de entrega (remetente/destinatário, IPs de origem/relay, timestamps, códigos de status), necessários para funcionamento, diagnóstico e antiabuso.</li>
                    </ul>

                    <div className="relative group mt-4">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg blur" />
                      <div className="relative bg-amber-50 border border-amber-300 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="text-amber-900 text-sm">
                            <strong className="text-amber-900">Observação importante:</strong> <strong className="text-amber-900">não solicitamos nem incentivamos</strong> o envio de <strong className="text-amber-900">categorias especiais</strong> de dados (saúde, religião, dados biométricos, orientação sexual etc.). Caso você armazene tais dados em suas mensagens ou anexos, <strong className="text-amber-900">você</strong> é o único responsável por ter base legal apropriada e por cumprir as leis aplicáveis ao seu tratamento.
                          </p>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-black mt-4">1.4 Dados provenientes de terceiros</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Pagamento:</strong> informações transacionais processadas por <strong className="text-black">PayPal</strong> (Controlador/Processador independente), como status de pagamento, ID da transação e dados antifraude;</li>
                      <li><strong className="text-black">Conformidade/antifraude:</strong> sinais técnicos para prevenção de abuso de rede e de e-mail (por exemplo, reputação de IP/domínio).</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '2. FINALIDADES DO TRATAMENTO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Tratamos dados pessoais para:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Executar o contrato:</strong> criar e manter sua conta, registrar/renovar domínios, provisionar caixas de e-mail, aplicar DNS e autenticações (SPF/DKIM/DMARC), entregar e receber mensagens;</li>
                      <li><strong className="text-black">Suporte e comunicação:</strong> responder chamados, notificações operacionais e alertas de serviço;</li>
                      <li><strong className="text-black">Faturamento:</strong> emissão de faturas/recibos e gestão de cobrança;</li>
                      <li><strong className="text-black">Segurança e integridade:</strong> prevenção de spam, phishing e abuso de rede, detecção de incidentes, auditoria de acesso, proteção contra fraude;</li>
                      <li><strong className="text-black">Melhoria de produto:</strong> métricas agregadas, testes e monitoramento de desempenho;</li>
                      <li><strong className="text-black">Cumprimento legal:</strong> atender obrigações regulatórias e ordens legais válidas.</li>
                    </ul>
                    <p className="font-semibold text-black mt-4">
                      Não vendemos dados pessoais. Não realizamos compartilhamento comercial de dados com terceiros para fins de publicidade.
                    </p>
                  </div>
                )
              },
              {
                title: '3. BASES LEGAIS (UK GDPR/GDPR)',
                content: (
                  <div className="text-[#6B7280]/80 space-y-2">
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Execução de contrato</strong> (Art. 6(1)(b)): prestação do serviço contratado (conta, domínio, e-mail);</li>
                      <li><strong className="text-black">Interesse legítimo</strong> (Art. 6(1)(f)): segurança, antiabuso, melhoria de serviço, prevenção a fraudes;</li>
                      <li><strong className="text-black">Obrigação legal</strong> (Art. 6(1)(c)): conformidade fiscal/regulatória, retenção mínima de registros;</li>
                      <li><strong className="text-black">Consentimento</strong> (Art. 6(1)(a)): comunicações opcionais não essenciais (quando aplicável).</li>
                    </ul>
                    <p className="mt-4">
                      Você pode retirar seu consentimento a qualquer momento, sem afetar a licitude do tratamento anterior.
                    </p>
                  </div>
                )
              },
              {
                title: '4. COMPARTILHAMENTO DE DADOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Podemos compartilhar dados <strong className="text-black">somente</strong> com:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Prestadores de infraestrutura</strong> (hospedagem, segurança, monitoramento) necessários ao funcionamento da plataforma;</li>
                      <li><strong className="text-black">Processadores de pagamento</strong> (p.ex., PayPal) para processar cobranças em USD;</li>
                      <li><strong className="text-black">Fornecedores de defesa/segurança</strong> (antiabuso/antispam) estritamente para proteger a rede e a entrega de e-mails;</li>
                      <li><strong className="text-black">Autoridades legais:</strong> mediante ordem judicial válida, obrigação legal ou solicitação governamental compatível com o UK GDPR.</li>
                    </ul>
                    <p>
                      Todos os terceiros recebem <strong className="text-black">apenas o mínimo necessário</strong> e devem cumprir <strong className="text-black">padrões contratuais</strong> de segurança e confidencialidade alinhados ao UK GDPR/GDPR.
                    </p>
                  </div>
                )
              },
              {
                title: '5. TRANSFERÊNCIAS INTERNACIONAIS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Seus dados podem ser processados fora do Reino Unido/EEE. Quando aplicável, adotamos:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Decisões de adequação</strong> (UK/EU adequacy); e/ou</li>
                      <li><strong className="text-black">Cláusulas Contratuais Padrão</strong> (SCCs) atualizadas, com medidas suplementares de segurança.</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '6. RETENÇÃO E EXCLUSÃO DE DADOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Mantemos dados <strong className="text-black">apenas pelo tempo necessário</strong> às finalidades descritas ou por prazos exigidos por lei.
                    </p>
                    <p className="font-semibold text-black">Prazos referenciais:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Conta ativa:</strong> dados de perfil e configurações — enquanto durar a relação contratual;</li>
                      <li><strong className="text-black">Conteúdo de e-mail:</strong> enquanto a caixa postal estiver ativa; após cancelamento, exclusão programada após janela técnica de desligamento/backup;</li>
                      <li><strong className="text-black">Logs de acesso/serviço (HTTP/SMTP/IMAP):</strong> até 12 meses para segurança e auditoria;</li>
                      <li><strong className="text-black">Faturamento:</strong> conforme exigências fiscais aplicáveis (geralmente 6 anos no Reino Unido);</li>
                      <li><strong className="text-black">Backups:</strong> rotação em ciclos técnicos definidos; exclusões seguem a janela de retenção dos backups.</li>
                    </ul>
                    <p>
                      Após os prazos, dados são <strong className="text-black">excluídos ou anonimizados</strong> de forma segura.
                    </p>
                  </div>
                )
              },
              {
                title: '7. DIREITOS DO TITULAR',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Você possui, quando aplicável, os seguintes direitos:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Acesso</strong> aos dados pessoais;</li>
                      <li><strong className="text-black">Retificação</strong> de dados incorretos/incompletos;</li>
                      <li><strong className="text-black">Eliminação</strong> ("direito ao apagamento"), quando cabível;</li>
                      <li><strong className="text-black">Restrição</strong> de tratamento;</li>
                      <li><strong className="text-black">Portabilidade</strong> (cópia estruturada);</li>
                      <li><strong className="text-black">Oposição</strong> a tratamentos baseados em interesse legítimo;</li>
                      <li><strong className="text-black">Retirada de consentimento</strong> (se aplicável).</li>
                    </ul>
                    <p>
                      Para exercer seus direitos, envie um e-mail para <a href="mailto:support@com.rich" className="text-[#3B82F6] hover:text-[#6B7280] font-semibold">support@com.rich</a> com o assunto <strong className="text-black">"Data Request"</strong>. Podemos solicitar informações adicionais para verificar sua identidade antes de atender ao pedido.
                    </p>
                  </div>
                )
              },
              {
                title: '8. SEGURANÇA DA INFORMAÇÃO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Acesso não autorizado, alteração, destruição ou divulgação indevida;</li>
                      <li>Perda acidental, uso ou tratamento indevido.</li>
                    </ul>
                    <p className="mt-4">Medidas incluem, entre outras:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Criptografia</strong> em trânsito (TLS/HTTPS) e controles de segurança em repouso;</li>
                      <li><strong className="text-black">Controle de acesso</strong> com princípio do menor privilégio;</li>
                      <li><strong className="text-black">Firewalling, monitoramento e auditoria;</strong></li>
                      <li><strong className="text-black">Backups</strong> periódicos e testes de restauração;</li>
                      <li><strong className="text-black">Treinamento</strong> de equipe e procedimentos de resposta a incidentes.</li>
                    </ul>
                    <p className="mt-4">
                      Embora adotemos padrões elevados, <strong className="text-black">nenhum sistema é 100% imune</strong> a incidentes. Em caso de violação que possa afetar seus direitos e liberdades, <strong className="text-black">notificaremos autoridades competentes e os titulares impactados</strong> conforme o UK GDPR.
                    </p>
                  </div>
                )
              },
              {
                title: '9. POLÍTICA DE E-MAIL, ANTIABUSO E METADADOS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-2">
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>É proibido utilizar o serviço para <strong className="text-black">spam, phishing, malware, spoofing, ataques, scraping</strong> ou outros abusos de rede;</li>
                      <li>Podemos manter e analisar <strong className="text-black">metadados técnicos</strong> de e-mails (não o conteúdo) para antiabuso, reputação e entrega;</li>
                      <li>Contas envolvidas em abuso podem ser <strong className="text-black">suspensas ou encerradas</strong> sem aviso prévio;</li>
                      <li>Em circunstâncias restritas (ordem legal/diagnóstico crítico), acesso mínimo e auditado pode ser requerido para análise técnica.</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '10. COOKIES E TECNOLOGIAS SEMELHANTES',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Utilizamos <strong className="text-black">cookies estritamente necessários</strong> para:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li>Autenticação, sessão e prevenção de fraude;</li>
                      <li>Preferências (idioma, layout);</li>
                      <li>Métricas essenciais de desempenho do painel.</li>
                    </ul>
                    <p>
                      Você pode gerenciar cookies no navegador. <strong className="text-black">Cookies essenciais</strong> não podem ser desativados pois são necessários ao funcionamento do serviço.
                    </p>
                  </div>
                )
              },
              {
                title: '11. CRIANÇAS E CONTAS DE MENORES',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      O .com.rich é destinado a <strong className="text-black">maiores de 18 anos</strong>. Não coletamos intencionalmente dados de crianças. Se tomarmos ciência de coleta indevida, <strong className="text-black">excluiremos</strong> os dados conforme aplicável.
                    </p>
                  </div>
                )
              },
              {
                title: '12. COMUNICAÇÕES E NOTIFICAÇÕES',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>Podemos enviar:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
                      <li><strong className="text-black">Comunicados operacionais e de segurança</strong> (obrigatórios);</li>
                      <li><strong className="text-black">Mensagens transacionais</strong> (faturas, avisos de renovação);</li>
                      <li><strong className="text-black">Comunicações opcionais</strong> (somente com consentimento, quando aplicável).</li>
                    </ul>
                    <p>
                      Você pode <strong className="text-black">gerenciar preferências</strong> de comunicações não obrigatórias pelo painel, se disponível.
                    </p>
                  </div>
                )
              },
              {
                title: '13. ALTERAÇÕES DESTA POLÍTICA',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Podemos atualizar esta Política periodicamente. A nova versão terá <strong className="text-black">data de atualização</strong> visível neste documento. O uso contínuo do serviço após alterações indica <strong className="text-black">aceitação</strong> da nova versão.
                    </p>
                  </div>
                )
              },
              {
                title: '14. LEI APLICÁVEL E JURISDIÇÃO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Esta Política é regida exclusivamente pelas <strong className="text-black">leis da Inglaterra e País de Gales</strong>.
                      Qualquer disputa será submetida aos <strong className="text-black">tribunais de Londres, Reino Unido</strong>, sem prejuízo de direitos obrigatórios do consumidor no seu país de residência (quando aplicáveis).
                    </p>
                  </div>
                )
              },
              {
                title: '15. VERSÕES EM DIFERENTES IDIOMAS',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Esta Política pode ser disponibilizada em outros idiomas <strong className="text-black">apenas para conveniência</strong>.
                      Em caso de divergência, <strong className="text-black">a versão em inglês prevalece para todos os efeitos legais</strong>.
                    </p>
                  </div>
                )
              },
              {
                title: '16. CONTATO',
                content: (
                  <div className="text-[#6B7280]/80 space-y-2">
                    <p className="font-semibold text-black">Global Digital Identity LTD</p>
                    <p>71–75 Shelton Street, Covent Garden</p>
                    <p>Londres, WC2H 9JQ — Reino Unido</p>
                    <p>Company No. <strong>16339013</strong></p>
                    <p>
                      E-mail: <a href="mailto:support@com.rich" className="text-[#3B82F6] hover:text-[#6B7280] font-semibold">support@com.rich</a>
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
                Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato conosco.
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

export default Privacy;
