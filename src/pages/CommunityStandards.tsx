import React from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, Shield } from 'lucide-react';

const CommunityStandards: React.FC = () => {
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
              Política de Padrões da Comunidade
            </h1>
            <p className="text-xl text-[#6B7280]/70 mb-4">.com.rich</p>
            <div className="inline-flex items-center gap-2 text-[#6B7280]/80">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Última atualização: 10 de julho de 2025</span>
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
                <Shield className="w-6 h-6 text-slate-700 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-black mb-2">Operado por Global Digital Identity LTD</h2>
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
                title: '1. Nossa Visão',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      A <strong className="text-black">com.rich</strong> se compromete a criar e manter uma comunidade digital <strong className="text-black">segura, respeitosa, inclusiva e profissional</strong>. Acreditamos que um ambiente positivo beneficia todos os usuários e fortalece nossa rede global.
                    </p>
                    <p>
                      Esta Política de Padrões da Comunidade estabelece as diretrizes de conduta que todos os usuários devem seguir ao interagir na plataforma, seja através de perfis públicos, mensagens, comentários ou qualquer outra forma de comunicação.
                    </p>
                    <p>
                      Esperamos que <strong className="text-black">todos os membros contribuam ativamente</strong> para um espaço onde a diversidade é celebrada, o respeito mútuo é fundamental e a colaboração construtiva é incentivada.
                    </p>
                  </div>
                )
              },
              {
                title: '2. Respeito e Civilidade',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">2.1 Princípios Fundamentais</h3>
                    <p>Esperamos que todos os usuários:</p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li><strong className="text-black">Tratem todos com respeito e cortesia</strong>, independentemente de diferenças de opinião ou background;</li>
                      <li><strong className="text-black">Mantenham comunicações profissionais e educadas</strong> em todas as interações;</li>
                      <li><strong className="text-black">Respeitem diferentes opiniões, perspectivas e culturas</strong>, promovendo diálogo construtivo;</li>
                      <li><strong className="text-black">Evitem linguagem ofensiva, agressiva ou depreciativa</strong>;</li>
                      <li><strong className="text-black">Contribuam de forma construtiva</strong> para discussões e debates;</li>
                      <li><strong className="text-black">Sejam empáticos e compreensivos</strong> com as experiências e situações dos outros.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">2.2 Comunicação Respeitosa</h3>
                    <p>
                      A comunicação respeitosa é a base de nossa comunidade. Isso inclui <strong className="text-black">escolher palavras com cuidado</strong>, <strong className="text-black">considerar o impacto de suas mensagens</strong> e <strong className="text-black">buscar sempre o entendimento mútuo</strong>.
                    </p>
                    <p>
                      Discordâncias são naturais e bem-vindas, desde que expressas de maneira civilizada e focadas em ideias, não em ataques pessoais.
                    </p>
                  </div>
                )
              },
              {
                title: '3. Comportamentos Proibidos',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      A <strong className="text-black">com.rich</strong> <strong className="text-black">não tolera absolutamente</strong> os seguintes comportamentos:
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-4">3.1 Assédio e Intimidação</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Assédio de qualquer natureza (sexual, moral, psicológico);</li>
                      <li>Bullying ou cyberbullying;</li>
                      <li>Intimidação ou coação;</li>
                      <li>Perseguição (stalking) online ou offline;</li>
                      <li>Envio repetido de mensagens indesejadas;</li>
                      <li>Criação de múltiplas contas para assediar um usuário.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">3.2 Discriminação e Discurso de Ódio</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Discriminação baseada em raça, cor, etnia ou origem nacional;</li>
                      <li>Discriminação por religião, crenças ou afiliação religiosa;</li>
                      <li>Discriminação por gênero, identidade de gênero ou expressão de gênero;</li>
                      <li>Discriminação por orientação sexual;</li>
                      <li>Discriminação por idade;</li>
                      <li>Discriminação por deficiência física ou mental;</li>
                      <li>Discurso de ódio ou incitação à violência contra qualquer grupo;</li>
                      <li>Uso de símbolos, linguagem ou propaganda de grupos extremistas.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">3.3 Ameaças e Violência</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Ameaças diretas ou indiretas de violência física;</li>
                      <li>Incitação à violência ou ao suicídio;</li>
                      <li>Glorificação de atos violentos;</li>
                      <li>Compartilhamento de conteúdo gráfico violento sem aviso prévio;</li>
                      <li>Planos ou instruções para atos violentos.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">3.4 Violação de Privacidade</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Doxxing (divulgação de informações pessoais identificáveis sem consentimento);</li>
                      <li>Compartilhamento de dados privados de terceiros;</li>
                      <li>Publicação de informações confidenciais;</li>
                      <li>Compartilhamento não autorizado de conversas privadas;</li>
                      <li>Invasão de privacidade através de qualquer meio técnico.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">3.5 Conteúdo Inadequado</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Conteúdo sexualmente explícito ou pornográfico;</li>
                      <li>Nudez não autorizada ou conteúdo íntimo sem consentimento;</li>
                      <li>Conteúdo relacionado à exploração ou abuso infantil (tolerância zero);</li>
                      <li>Conteúdo que promova automutilação ou transtornos alimentares;</li>
                      <li>Spam, publicidade não solicitada ou esquemas fraudulentos.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">3.6 Fraude e Má-fé</h3>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Falsificação de identidade (impersonation);</li>
                      <li>Representação enganosa de afiliação com organizações;</li>
                      <li>Fraude, phishing ou tentativas de golpe;</li>
                      <li>Manipulação de sistemas ou métricas da plataforma;</li>
                      <li>Uso de bots ou automação não autorizada;</li>
                      <li>Violação de direitos de propriedade intelectual.</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '4. Conduta Profissional',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">4.1 Contexto de Negócios</h3>
                    <p>
                      Para usuários que utilizam a plataforma para fins profissionais ou comerciais, esperamos:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li><strong className="text-black">Honestidade e transparência</strong> em todas as transações e comunicações comerciais;</li>
                      <li><strong className="text-black">Cumprimento de compromissos e acordos</strong> estabelecidos;</li>
                      <li><strong className="text-black">Resolução civilizada de disputas</strong>, preferencialmente através de diálogo direto;</li>
                      <li><strong className="text-black">Divulgação clara</strong> de termos de serviço, políticas de reembolso e condições de venda;</li>
                      <li><strong className="text-black">Respeito aos direitos do consumidor</strong> e legislação aplicável;</li>
                      <li><strong className="text-black">Não participação em práticas comerciais desleais</strong> ou antiéticas.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">4.2 Relacionamentos Comerciais</h3>
                    <p>
                      Ao estabelecer relações comerciais através da plataforma:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Mantenha registros adequados de transações;</li>
                      <li>Responda prontamente a dúvidas e reclamações;</li>
                      <li>Seja transparente sobre limitações ou problemas;</li>
                      <li>Respeite prazos e expectativas estabelecidas;</li>
                      <li>Forneça produtos/serviços conforme descritos.</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '5. Conteúdo Apropriado',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">5.1 Diretrizes Gerais</h3>
                    <p>
                      Todo conteúdo publicado na plataforma deve:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li><strong className="text-black">Ser autêntico e verdadeiro</strong> em sua representação;</li>
                      <li><strong className="text-black">Respeitar direitos autorais e propriedade intelectual</strong>;</li>
                      <li><strong className="text-black">Ser apropriado para audiência geral</strong> (salvo quando claramente identificado e restrito);</li>
                      <li><strong className="text-black">Não conter malware, vírus ou código malicioso</strong>;</li>
                      <li><strong className="text-black">Estar em conformidade com leis aplicáveis</strong>.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">5.2 Propriedade Intelectual</h3>
                    <p>
                      Usuários devem:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Possuir direitos sobre todo conteúdo que publicam;</li>
                      <li>Obter permissões necessárias para uso de conteúdo de terceiros;</li>
                      <li>Respeitar marcas registradas e direitos de imagem;</li>
                      <li>Dar crédito apropriado quando usar conteúdo de domínio público;</li>
                      <li>Responder prontamente a notificações de violação de direitos autorais.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">5.3 Conteúdo Sensível</h3>
                    <p>
                      Conteúdo que possa ser considerado sensível (violência, temas adultos, conteúdo perturbador) deve:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Conter avisos claros (content warnings);</li>
                      <li>Ser marcado apropriadamente na plataforma;</li>
                      <li>Ter justificativa contextual legítima (educacional, artística, jornalística);</li>
                      <li>Ser apresentado com sensibilidade e responsabilidade.</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '6. Segurança da Conta',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">6.1 Responsabilidades do Usuário</h3>
                    <p>
                      Cada usuário é responsável por:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li><strong className="text-black">Manter credenciais de acesso seguras</strong> e confidenciais;</li>
                      <li><strong className="text-black">Usar senhas fortes e únicas</strong>;</li>
                      <li><strong className="text-black">Habilitar autenticação de dois fatores</strong> quando disponível;</li>
                      <li><strong className="text-black">Não compartilhar acesso à conta</strong> com terceiros;</li>
                      <li><strong className="text-black">Notificar imediatamente</strong> sobre acessos não autorizados;</li>
                      <li><strong className="text-black">Manter informações de contato atualizadas</strong>.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">6.2 Atividades Proibidas</h3>
                    <p>
                      É estritamente proibido:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Tentar acessar contas de outros usuários;</li>
                      <li>Realizar ataques de força bruta ou tentativas de invasão;</li>
                      <li>Explorar vulnerabilidades de segurança (sem reportá-las responsavelmente);</li>
                      <li>Criar contas falsas ou múltiplas contas sem autorização;</li>
                      <li>Vender, transferir ou compartilhar acesso a contas.</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '7. Denúncias e Moderação',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">7.1 Sistema de Denúncias</h3>
                    <p>
                      A <strong className="text-black">com.rich</strong> disponibiliza ferramentas para que usuários reportem violações desta política:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li><strong className="text-black">Botões de denúncia</strong> em conteúdos e perfis;</li>
                      <li><strong className="text-black">Email de suporte</strong> para casos graves: <a href="mailto:legal@com.rich" className="text-slate-700 hover:text-black underline">legal@com.rich</a>;</li>
                      <li><strong className="text-black">Formulário de contato</strong> para denúncias detalhadas;</li>
                      <li><strong className="text-black">Proteção de denunciantes</strong> contra retaliação.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">7.2 Processo de Moderação</h3>
                    <p>
                      Ao receber uma denúncia:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li><strong className="text-black">Análise imparcial</strong> será conduzida por nossa equipe;</li>
                      <li><strong className="text-black">Investigação baseada em evidências</strong> e contexto;</li>
                      <li><strong className="text-black">Decisões proporcionais</strong> à gravidade da violação;</li>
                      <li><strong className="text-black">Notificação aos envolvidos</strong> quando apropriado;</li>
                      <li><strong className="text-black">Possibilidade de recurso</strong> para decisões de moderação.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">7.3 Confidencialidade</h3>
                    <p>
                      Denúncias são tratadas com <strong className="text-black">máxima confidencialidade</strong>. A identidade de denunciantes não será revelada sem consentimento explícito, exceto quando exigido por lei.
                    </p>
                  </div>
                )
              },
              {
                title: '8. Consequências por Violações',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <h3 className="text-lg font-semibold text-black">8.1 Medidas Disciplinares</h3>
                    <p>
                      Dependendo da <strong className="text-black">gravidade e recorrência</strong> das violações, as seguintes medidas podem ser aplicadas:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li><strong className="text-black">Advertência formal</strong> com orientação sobre a violação;</li>
                      <li><strong className="text-black">Remoção de conteúdo</strong> que viole esta política;</li>
                      <li><strong className="text-black">Restrição temporária</strong> de funcionalidades específicas;</li>
                      <li><strong className="text-black">Suspensão temporária</strong> da conta (7 a 90 dias);</li>
                      <li><strong className="text-black">Suspensão permanente</strong> (banimento) em casos graves;</li>
                      <li><strong className="text-black">Cancelamento de serviços pagos</strong> sem reembolso;</li>
                      <li><strong className="text-black">Reporte às autoridades</strong> em casos de atividades ilegais.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">8.2 Violações Graves</h3>
                    <p>
                      As seguintes violações resultarão em <strong className="text-black">suspensão imediata e permanente</strong>:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Conteúdo relacionado à exploração ou abuso infantil;</li>
                      <li>Ameaças credíveis de violência;</li>
                      <li>Terrorismo ou extremismo violento;</li>
                      <li>Tráfico humano ou exploração sexual;</li>
                      <li>Venda de drogas ilegais ou armas;</li>
                      <li>Fraude financeira em larga escala;</li>
                      <li>Violações repetidas após múltiplas advertências.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">8.3 Direito de Recurso</h3>
                    <p>
                      Usuários que discordam de decisões de moderação podem:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Enviar recurso formal para <a href="mailto:legal@com.rich" className="text-slate-700 hover:text-black underline">legal@com.rich</a>;</li>
                      <li>Fornecer contexto adicional ou evidências;</li>
                      <li>Solicitar revisão por equipe sênior de moderação;</li>
                      <li>Receber resposta dentro de 5-7 dias úteis.</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '9. Responsabilidade Compartilhada',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      A manutenção de uma comunidade saudável é uma <strong className="text-black">responsabilidade compartilhada</strong> entre a plataforma e seus usuários.
                    </p>

                    <h3 className="text-lg font-semibold text-black mt-4">9.1 Papel da Plataforma</h3>
                    <p>
                      A <strong className="text-black">com.rich</strong> se compromete a:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Fornecer ferramentas de moderação e denúncia eficazes;</li>
                      <li>Responder prontamente a denúncias de violações graves;</li>
                      <li>Aplicar políticas de forma justa e consistente;</li>
                      <li>Educar usuários sobre padrões comunitários;</li>
                      <li>Melhorar continuamente sistemas de segurança;</li>
                      <li>Ser transparente sobre decisões de moderação (quando possível).</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">9.2 Papel dos Usuários</h3>
                    <p>
                      Cada membro da comunidade deve:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Conhecer e seguir esta política;</li>
                      <li>Reportar violações quando testemunhá-las;</li>
                      <li>Promover cultura de respeito e inclusão;</li>
                      <li>Ser modelo de conduta positiva;</li>
                      <li>Apoiar novos usuários no entendimento das normas;</li>
                      <li>Contribuir para um ambiente acolhedor.</li>
                    </ul>
                  </div>
                )
              },
              {
                title: '10. Atualizações desta Política',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      A <strong className="text-black">com.rich</strong> reserva-se o direito de <strong className="text-black">atualizar esta Política de Padrões da Comunidade</strong> a qualquer momento para refletir:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Mudanças em leis e regulamentações aplicáveis;</li>
                      <li>Evolução de melhores práticas da indústria;</li>
                      <li>Feedback da comunidade e aprendizados operacionais;</li>
                      <li>Novas funcionalidades ou serviços da plataforma;</li>
                      <li>Ameaças emergentes à segurança ou integridade da comunidade.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-black mt-6">10.1 Notificação de Mudanças</h3>
                    <p>
                      Alterações significativas serão comunicadas através de:
                    </p>
                    <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
                      <li>Notificação na plataforma;</li>
                      <li>Email para usuários registrados;</li>
                      <li>Atualização da data de "Última atualização" no topo desta página;</li>
                      <li>Período de 30 dias para revisão antes da entrada em vigor.</li>
                    </ul>

                    <p className="mt-4">
                      O <strong className="text-black">uso continuado da plataforma</strong> após alterações constitui <strong className="text-black">aceitação da política atualizada</strong>.
                    </p>
                  </div>
                )
              },
              {
                title: '11. Contato',
                content: (
                  <div className="text-[#6B7280]/80 space-y-4">
                    <p>
                      Para dúvidas, esclarecimentos ou denúncias relacionadas a esta Política de Padrões da Comunidade:
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mt-4">
                      <h3 className="text-lg font-semibold text-black mb-4">Canais de Contato</h3>
                      <div className="space-y-3 text-[#6B7280]/70">
                        <p>
                          <strong className="text-black">Email geral:</strong>{' '}
                          <a href="mailto:support@com.rich" className="text-slate-700 hover:text-black underline">
                            support@com.rich
                          </a>
                        </p>
                        <p>
                          <strong className="text-black">Questões legais e denúncias graves:</strong>{' '}
                          <a href="mailto:legal@com.rich" className="text-slate-700 hover:text-black underline">
                            legal@com.rich
                          </a>
                        </p>
                        <p>
                          <strong className="text-black">Endereço postal:</strong><br />
                          Global Digital Identity LTD<br />
                          71–75 Shelton Street<br />
                          Covent Garden, Londres<br />
                          WC2H 9JQ, Reino Unido
                        </p>
                      </div>
                    </div>

                    <p className="mt-6">
                      Nossa equipe está comprometida em responder a todas as solicitações de forma <strong className="text-black">ágil, justa e transparente</strong>, mantendo sempre o foco em construir uma comunidade segura e respeitosa para todos.
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
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-900 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-500" />
                <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6 sm:p-8">
                  <h2 className="text-2xl font-bold text-black mb-6">{section.title}</h2>
                  {section.content}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-16 pt-8 border-t border-gray-200"
          >
            <div className="text-center text-sm text-[#6B7280]/60">
              <p className="mb-2">
                © Global Digital Identity LTD — 71–75 Shelton Street, Covent Garden, London WC2H 9JQ, Reino Unido
              </p>
              <p>
                <a href="mailto:legal@com.rich" className="text-slate-700 hover:text-black underline">
                  legal@com.rich
                </a>
                {' | '}
                Company No. 16339013
              </p>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
};

export default CommunityStandards;
