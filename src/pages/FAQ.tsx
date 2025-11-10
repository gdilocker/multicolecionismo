import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Building2, Globe, Mail, CreditCard, Shield, Scale, Headphones, Users, Clock } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string | JSX.Element;
}

interface FAQSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const FAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId);
    } else {
      newOpenItems.add(itemId);
    }
    setOpenItems(newOpenItems);
  };

  const faqSections: FAQSection[] = [
    {
      id: 'about',
      title: 'Sobre a Plataforma',
      icon: <Building2 className="w-5 h-5" />,
      items: [
        {
          question: 'O que é o com.rich?',
          answer: (
            <div className="space-y-2">
              <p>O <strong>com.rich</strong> é uma plataforma de identidade digital que oferece domínios exclusivos com a extensão <strong>.com.rich</strong>, desenvolvida para profissionais e marcas que desejam destacar-se online com um nome de domínio sofisticado e premium.</p>
              <p>Além do registro de domínio, oferecemos integração com perfis sociais personalizáveis, permitindo que você centralize sua presença digital em um único lugar profissional.</p>
              <p className="mt-3 text-sm">O serviço é operado por:<br />
                <strong>Global Digital Identity LTD</strong><br />
                Registered in England and Wales<br />
                Company No. <strong>16339013</strong><br />
                71-75 Shelton Street, Covent Garden,<br />
                London, WC2H 9JQ
              </p>
            </div>
          )
        },
        {
          question: 'O com.rich é uma empresa independente?',
          answer: 'Sim. O com.rich é operado pela Global Digital Identity LTD, empresa independente registrada no Reino Unido, que atua de forma autônoma em sua operação comercial e tecnológica. A plataforma mantém controle total sobre a experiência do usuário, suporte e gestão de contas.'
        },
        {
          question: 'Onde os serviços são hospedados?',
          answer: 'A infraestrutura técnica utiliza provedores internacionais de nuvem e segurança para garantir estabilidade, desempenho e proteção de dados. Todas as conexões são protegidas por criptografia SSL (HTTPS) e seguem padrões globais de segurança e conformidade.'
        }
      ]
    },
    {
      id: 'licensing',
      title: 'Licenciamento',
      icon: <Shield className="w-5 h-5" />,
      items: [
        {
          question: 'O que é o modelo de licenciamento exclusivo?',
          answer: (
            <div className="space-y-2">
              <p>Ao adquirir um domínio .com.rich, você recebe uma <strong>licença exclusiva de uso</strong>. Isso significa que você tem direitos totais de personalização, configuração e uso do domínio, mas a titularidade permanece com Global Digital Identity LTD.</p>
              <p>É similar a alugar um imóvel premium: você tem uso exclusivo e total controle, mas não é o proprietário legal do registro.</p>
            </div>
          )
        },
        {
          question: 'Ainda tenho controle total sobre meu domínio?',
          answer: 'Sim! Como licenciado exclusivo, você tem 100% de controle sobre DNS, perfis, conteúdo e personalizações. A diferença está apenas na estrutura jurídica: você é o usuário exclusivo, não o proprietário registrado.'
        },
        {
          question: 'Posso perder minha licença?',
          answer: 'Sua licença é garantida enquanto você: (1) mantiver os pagamentos em dia, (2) seguir nossos Termos de Uso, (3) não usar o domínio para atividades ilícitas. Licenças só são revogadas em casos de violação grave ou ordem judicial.'
        },
        {
          question: 'Posso transferir minha licença para outra pessoa?',
          answer: 'Sim, transferências de licença são permitidas mediante aprovação. Entre em contato com support@com.rich para iniciar o processo.'
        },
        {
          question: 'O que acontece se eu cancelar minha assinatura?',
          answer: 'Sua licença expira ao final do período pago. Após o período de carência (30 dias), o domínio volta ao pool da Global Digital Identity LTD e pode ser licenciado para outro usuário.'
        },
        {
          question: 'Por que vocês usam modelo de licenciamento?',
          answer: 'O modelo de licenciamento nos permite manter controle central sobre a rede .com.rich, garantir qualidade do ecossistema, prevenir abuso e oferecer melhor suporte. Além disso, facilita resolução de disputas e proteção de marca.'
        }
      ]
    },
    {
      id: 'domains',
      title: 'Domínios',
      icon: <Globe className="w-5 h-5" />,
      items: [
        {
          question: 'O que é um domínio .com.rich?',
          answer: 'É uma extensão de domínio premium e exclusiva, projetada para profissionais, marcas e indivíduos que buscam uma identidade digital sofisticada. Com uma licença exclusiva .com.rich (exemplo: seunome.com.rich), você terá uma URL personalizada que reflete sucesso e exclusividade.'
        },
        {
          question: 'Como adquiro uma licença de domínio?',
          answer: (
            <ol className="list-decimal list-inside space-y-1">
              <li>Pesquise o nome desejado na barra de busca do site.</li>
              <li>Se estiver disponível, adicione ao carrinho.</li>
              <li>Finalize o pagamento via PayPal (em dólares americanos – USD).</li>
              <li>O sistema executa o registro automaticamente e envia a confirmação por e-mail.</li>
              <li>Em poucos minutos, seu domínio estará ativo e visível no painel.</li>
            </ol>
          )
        },
        {
          question: 'Por quanto tempo a licença é válida?',
          answer: 'Todas as licenças são válidas por 1 ano, podendo ser renovadas anualmente através de planos de assinatura. Você pode gerenciar suas renovações diretamente no painel.'
        },
        {
          question: 'Posso transferir minha licença para outro registrador?',
          answer: 'Não. A extensão .com.rich é proprietária e exclusiva da Global Digital Identity LTD, e o modelo de licenciamento não permite transferência para outros registradores. Você mantém total controle sobre sua licença e configurações DNS enquanto sua assinatura estiver ativa, podendo apontar para qualquer hospedagem e gerenciar todos os aspectos técnicos através do nosso painel.'
        },
        {
          question: 'O que acontece se eu não renovar minha licença?',
          answer: (
            <div className="space-y-4">
              <p>Quando uma licença não é renovada, o domínio passa por um ciclo profissional de recuperação com múltiplos períodos de proteção:</p>

              <div className="space-y-3">
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                  <p className="font-semibold text-green-900 mb-1">📅 Dias 1-15: Período de Graça</p>
                  <p className="text-green-800 text-sm">Seus serviços continuam ativos e você pode regularizar sem taxas adicionais. Notificações são enviadas D-14, D-7, D-3 e D-1 antes do vencimento.</p>
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <p className="font-semibold text-amber-900 mb-1">⚠️ Dias 16-45: Período de Resgate</p>
                  <p className="text-amber-800 text-sm">Domínio suspenso. Para recuperar, é necessário pagar a mensalidade + taxa de resgate (USD $50). Seu painel mostra contador regressivo e custo total.</p>
                </div>

                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                  <p className="font-semibold text-orange-900 mb-1">🛡️ Dias 46-60: Proteção do Registro</p>
                  <p className="text-orange-800 text-sm">Período de proteção antes do leilão. O domínio não está disponível para terceiros. Recuperação possível mediante contato com suporte.</p>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <p className="font-semibold text-red-900 mb-1">🔨 Dias 61-75: Leilão Interno</p>
                  <p className="text-red-800 text-sm">O domínio entra em leilão/lista de interesse. O dono original tem prioridade até o Dia 65 para reclamar pagando todas as taxas pendentes.</p>
                </div>

                <div className="bg-slate-50 border-l-4 border-slate-500 p-4 rounded-r-lg">
                  <p className="font-semibold text-slate-900 mb-1">🗑️ Dias 76-80: Exclusão Pendente</p>
                  <p className="text-slate-800 text-sm">Janela técnica final sem possibilidade de recuperação pelo titular anterior.</p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p className="font-semibold text-blue-900 mb-1">✨ Dia 81+: Liberado</p>
                  <p className="text-blue-800 text-sm">Domínio volta ao inventário geral e pode ser registrado por qualquer usuário (pode se tornar Premium a critério do registro).</p>
                </div>
              </div>

              <p className="text-sm mt-4"><strong>💡 Importante:</strong> Este sistema profissional garante que você tenha tempo suficiente para recuperar seu domínio, evita "drop catching" imediato e protege sua identidade digital.</p>
            </div>
          )
        },
        {
          question: 'Posso usar minha licença para criar um site?',
          answer: 'Sim. Por padrão, sua licença .com.rich exibe seu perfil social personalizado dentro da nossa plataforma. No entanto, você tem total flexibilidade para configurar os registros DNS pelo painel e redirecionar para qualquer site externo, serviço de hospedagem ou aplicação web de sua escolha. Sua licença permanece sob seu controle exclusivo durante todo o período contratado.'
        },
        {
          question: 'Quantos domínios posso ter no meu plano?',
          answer: (
            <div className="space-y-3">
              <p>O número de domínios que você pode adquirir depende do seu plano de assinatura:</p>

              <div className="space-y-3">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p className="font-semibold text-blue-900 mb-2">📦 Plano Prime (Trial e Pago)</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                    <li><strong>1 domínio apenas</strong> (incluído no plano)</li>
                    <li>Ideal para identidade pessoal ou marca única</li>
                    <li>Durante trial: domínio em modo limitado até pagamento</li>
                  </ul>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                  <p className="font-semibold text-green-900 mb-2">🌟 Plano Elite</p>
                  <ul className="list-disc list-inside space-y-1 text-green-800 text-sm">
                    <li><strong>Domínios ilimitados</strong></li>
                    <li>Primeiro domínio incluído com a ativação do plano</li>
                    <li>Adquira quantos domínios adicionais quiser</li>
                    <li>Perfeito para múltiplas marcas, projetos ou portfólio</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                  <p className="font-semibold text-purple-900 mb-2">👑 Plano Supreme</p>
                  <ul className="list-disc list-inside space-y-1 text-purple-800 text-sm">
                    <li><strong>Domínios ilimitados</strong></li>
                    <li>Primeiro domínio incluído com a ativação</li>
                    <li>Todos os benefícios Elite + acesso VIP</li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mt-4">
                <p className="font-semibold text-amber-900 mb-2">⚠️ Importante:</p>
                <p className="text-amber-800 text-sm">
                  Se você tentar adquirir um segundo domínio no plano Prime, o sistema bloqueará automaticamente com uma mensagem clara. Para domínios ilimitados, faça upgrade para Elite.
                </p>
              </div>

              <p className="text-sm mt-3">
                <strong>💡 Dica:</strong> Avalie suas necessidades antes de escolher o plano. Se você planeja gerenciar múltiplas marcas ou projetos, o plano Elite é mais adequado desde o início.
              </p>
            </div>
          )
        }
      ]
    },
    {
      id: 'profile',
      title: 'Perfil Social',
      icon: <Mail className="w-5 h-5" />,
      items: [
        {
          question: 'O que é o perfil social personalizado?',
          answer: 'É uma página web vinculada ao seu domínio .com.rich onde você pode centralizar todos os seus links importantes: redes sociais, portfólio, contatos e muito mais. Funciona como um cartão de visitas digital profissional.'
        },
        {
          question: 'Como personalizo meu perfil?',
          answer: 'Através do painel de controle, você pode editar seu nome, biografia, foto de perfil, tema de cores e adicionar botões personalizados com links para suas redes sociais, site, WhatsApp, e-mail e outros.'
        },
        {
          question: 'Preciso de um plano pago para ter um perfil?',
          answer: 'Sim. O perfil social personalizado está disponível apenas para usuários com planos de assinatura ativos (Prime ou Elite).'
        },
        {
          question: 'Posso usar meu domínio para criar um site completo?',
          answer: 'Sim. Seu domínio .com.rich vem com um perfil social personalizado integrado na plataforma, mas você tem liberdade total para configurar os registros DNS e redirecionar para qualquer site ou serviço de hospedagem externo. Dessa forma, você mantém controle completo sobre como utiliza seu domínio.'
        },
        {
          question: 'Como funciona a personalização de temas?',
          answer: 'No painel, você pode escolher entre diferentes esquemas de cores e estilos visuais para que seu perfil reflita sua identidade pessoal ou marca.'
        },
        {
          question: 'Meu perfil é público?',
          answer: (
            <div className="space-y-2">
              <p>Você tem total controle sobre a privacidade do seu perfil. Você pode escolher entre:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Público:</strong> Qualquer pessoa pode visualizar seu perfil e links</li>
                <li><strong>Público com Senha:</strong> Visível para todos, mas requer senha para acesso</li>
                <li><strong>Privado:</strong> Apenas você pode visualizar seu perfil</li>
              </ul>
              <p className="mt-3">Quando você protege seu perfil com senha, pode:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Usar a senha padrão da plataforma (comrich2024) para fácil compartilhamento</li>
                <li>Definir uma senha personalizada exclusiva para seu perfil</li>
                <li>Combinar ambas as opções, permitindo acesso com qualquer uma das senhas</li>
              </ul>
              <p className="mt-3">Configure estas opções no painel de gerenciamento do seu perfil.</p>
            </div>
          )
        }
      ]
    },
    {
      id: 'elite',
      title: 'Benefícios Elite Member',
      icon: <Users className="w-5 h-5" />,
      items: [
        {
          question: 'Quanto tempo leva para receber a identidade física Elite?',
          answer: 'Membros do plano Elite recebem uma identidade física personalizada com QR Code dinâmico. O prazo de produção e envio pode levar até 60 dias após a confirmação da assinatura. Você será notificado quando o envio for realizado e receberá informações de rastreamento.'
        },
        {
          question: 'Como funciona o acesso aos lugares exclusivos do Elite Member?',
          answer: (
            <div className="space-y-3">
              <p>Ser parte do <strong>Elite Member</strong> oferece acesso a lugares exclusivos e eventos premium. No entanto, o acesso a determinados locais e encontros especiais requer um processo de verificação rigoroso por questões de segurança e relacionamento.</p>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <p className="font-semibold text-amber-900 mb-2">🔶 Tempo de Processo:</p>
                <p className="text-amber-800">O processo de verificação e aprovação pode levar um tempo considerável, com <strong>média entre 6 meses e até 2 anos</strong>, dependendo da disponibilidade e dos critérios de cada local exclusivo.</p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <p className="font-semibold text-blue-900 mb-2">🔒 Processo de Verificação:</p>
                <p className="text-blue-800">Todos os membros Elite interessados em frequentar <strong>lugares exclusivos</strong> devem passar por um processo de verificação interna. Este processo garante a segurança de todos os membros e mantém o padrão de excelência da rede Elite.</p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="font-semibold text-green-900 mb-2">💠 Acesso e Participação em Eventos:</p>
                <p className="text-green-800 text-sm mb-2">Existem <strong>eventos e lugares aos quais os membros poderão ter acesso imediato</strong>, conforme sua categoria e disponibilidade de convites.</p>
                <p className="text-green-800 text-sm">Contudo, <strong>para eventos de maior prestígio, reuniões restritas ou locais de alta exigência</strong>, aplicam-se as regras mencionadas acima — com aprovação e convite sob critério da administração ou parceiros locais.</p>
              </div>

              <div className="bg-slate-50 border-l-4 border-slate-500 p-4 rounded-r-lg">
                <p className="font-semibold text-slate-900 mb-2">📌 Importante:</p>
                <p className="text-slate-800 text-sm">O acesso aos lugares exclusivos <strong>não é automático</strong> com a assinatura Elite. É necessário manifestar interesse e aguardar aprovação conforme os critérios estabelecidos por cada local parceiro.</p>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'trial',
      title: 'Período de Teste e Direitos',
      icon: <Clock className="w-5 h-5" />,
      items: [
        {
          question: 'Como funciona o período de teste (trial) do Plano Prime?',
          answer: (
            <div className="space-y-3">
              <p>O plano Prime oferece <strong>14 dias de teste gratuito</strong> para você conhecer a plataforma.</p>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <p className="font-semibold text-blue-900 mb-2">Durante o Trial:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                  <li>Você pode explorar o sistema e suas funcionalidades</li>
                  <li>Pode convidar afiliados, mas os vínculos ficam <strong>pendentes</strong></li>
                  <li>Nenhuma comissão é gerada durante o teste</li>
                  <li>Domínio em modo "parked" (DNS limitado)</li>
                  <li>Sem acesso completo a recursos premium</li>
                </ul>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <p className="font-semibold text-amber-900 mb-2">⚠️ Importante:</p>
                <p className="text-amber-800 text-sm">
                  <strong>Nenhum direito é garantido até que o pagamento seja confirmado.</strong> Todos os vínculos, comissões e benefícios só se tornam permanentes após o primeiro pagamento.
                </p>
              </div>
            </div>
          )
        },
        {
          question: 'O que acontece se eu não pagar após o trial?',
          answer: (
            <div className="space-y-3">
              <p>Se o pagamento não for confirmado após os 14 dias de teste:</p>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="font-semibold text-red-900 mb-2">❌ Perda Automática de Direitos:</p>
                <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
                  <li><strong>Afiliados vinculados:</strong> Liberados para se associar a outro patrocinador</li>
                  <li><strong>Comissões ou pontos:</strong> Cancelados definitivamente</li>
                  <li><strong>Posição na estrutura:</strong> Removida da rede</li>
                  <li><strong>Domínio .com.rich:</strong> Entra em estado protegido</li>
                  <li><strong>Acesso a áreas exclusivas:</strong> Bloqueado</li>
                </ul>
              </div>

              <div className="bg-slate-50 border-l-4 border-slate-500 p-4 rounded-r-lg">
                <p className="font-semibold text-slate-900 mb-2">Conta Status:</p>
                <p className="text-slate-800 text-sm">
                  Sua conta entra em status <strong>"unpaid_hold"</strong> (suspensa por falta de pagamento).
                  Uma mensagem clara será exibida ao acessar o painel.
                </p>
              </div>
            </div>
          )
        },
        {
          question: 'Posso recuperar minha conta após perder os direitos?',
          answer: (
            <div className="space-y-3">
              <p>Sim, existe um <strong>prazo de proteção de 15 dias</strong> após o fim do trial para recuperar sua conta.</p>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="font-semibold text-green-900 mb-2">✅ Dentro do Prazo (15 dias):</p>
                <ul className="list-disc list-inside space-y-1 text-green-800 text-sm">
                  <li>Confirme o pagamento do plano Prime</li>
                  <li>Sua conta e domínio são reativados</li>
                  <li>Afiliados podem ser restaurados (se ainda não se reassociaram)</li>
                  <li>Direitos são recuperados conforme disponibilidade</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="font-semibold text-red-900 mb-2">❌ Após o Prazo:</p>
                <p className="text-red-800 text-sm">
                  Depois de 15 dias, a conta é <strong>encerrada definitivamente</strong>. Os afiliados já foram reassociados e o domínio segue o ciclo normal de liberação (grace → redemption → leilão → liberação).
                </p>
              </div>

              <p className="text-sm mt-3">
                <strong>💡 Dica:</strong> Recomendamos converter o trial em conta paga antes do prazo para evitar perda de direitos e vínculos importantes.
              </p>
            </div>
          )
        },
        {
          question: 'O que acontece se eu tentar criar múltiplas contas trial?',
          answer: (
            <div className="space-y-3">
              <p>Nosso sistema detecta automaticamente tentativas de abuso do período de teste.</p>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="font-semibold text-red-900 mb-2">🚨 Detecção de Fraude:</p>
                <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
                  <li>Múltiplas contas com mesmo CPF/documento</li>
                  <li>Mesmo e-mail ou método de pagamento</li>
                  <li>Mesmo IP ou dispositivo</li>
                </ul>
              </div>

              <div className="bg-slate-50 border-l-4 border-slate-500 p-4 rounded-r-lg">
                <p className="font-semibold text-slate-900 mb-2">Consequências:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-800 text-sm">
                  <li><strong>Todos os trials são bloqueados</strong></li>
                  <li>Conta principal entra em status <strong>"fraud_hold"</strong></li>
                  <li>Todos os afiliados são removidos</li>
                  <li>Análise manual obrigatória</li>
                </ul>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <p className="font-semibold text-amber-900 mb-2">Mensagem Exibida:</p>
                <p className="text-amber-800 text-sm italic">
                  "Detectamos múltiplas tentativas de uso indevido do período de teste. Sua conta foi bloqueada para análise."
                </p>
              </div>

              <p className="text-sm mt-3">
                Esta política garante exclusividade, controle e transparência, evitando fraudes e uso indevido da plataforma.
              </p>
            </div>
          )
        }
      ]
    },
    {
      id: 'payment',
      title: 'Pagamentos e Faturamento',
      icon: <CreditCard className="w-5 h-5" />,
      items: [
        {
          question: 'Quais formas de pagamento são aceitas?',
          answer: 'Aceitamos exclusivamente PayPal. Os pagamentos podem ser feitos com cartões de crédito, débito ou saldo PayPal, e são processados em dólares americanos (USD).'
        },
        {
          question: 'Os planos são mensais ou anuais?',
          answer: 'Os planos de assinatura (Prime e Elite) são cobrados mensalmente em dólares americanos (USD). O registro inicial do domínio é feito por 1 ano, e a renovação anual é incluída no plano de assinatura escolhido. O plano Prime inclui uma Experiência de Acesso Exclusivo de 14 dias.'
        },
        {
          question: 'O pagamento é automático?',
          answer: 'Sim. As assinaturas são renovadas automaticamente todos os meses através do PayPal. Você pode cancelar a assinatura a qualquer momento pelo painel, e o cancelamento entrará em vigor no final do período pago.'
        },
        {
          question: 'Posso mudar de plano quando quiser?',
          answer: (
            <div className="space-y-3">
              <p>As mudanças de plano estão sujeitas a uma <strong>política de estabilidade de assinatura</strong> que protege a exclusividade e consistência do clube.</p>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <p className="font-semibold text-amber-900 mb-2">📅 Período de Bloqueio de 60 Dias</p>
                <p className="text-amber-800">Após cada pagamento confirmado, você só poderá mudar de plano depois de <strong>60 dias</strong>. Este período vale para qualquer mudança (upgrade ou downgrade).</p>
              </div>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="font-semibold text-red-900 mb-2">⚠️ Bloqueio por Pagamento Pendente</p>
                <p className="text-red-800">Se você tiver alguma fatura vencida ou pagamento pendente, não será possível mudar de plano até regularizar a situação financeira.</p>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <p className="font-semibold text-blue-900 mb-2">🎁 Período Trial do Prime</p>
                <p className="text-blue-800">O plano Prime oferece <strong>14 dias de teste</strong>. Se não pagar após o trial, o sistema bloqueia automaticamente a assinatura e impede mudanças de plano até o pagamento.</p>
              </div>
              <p className="text-sm mt-3"><strong>Por que essas regras?</strong> Elas garantem estabilidade nas assinaturas, protegem contra abusos e reforçam a exclusividade da plataforma .com.rich.</p>
            </div>
          )
        },
        {
          question: 'Posso cancelar ou pedir reembolso?',
          answer: 'Por se tratar de serviço digital ativado automaticamente, o registro de domínio não é reembolsável após concluído. Assinaturas podem ser canceladas a qualquer momento, mas não há devolução proporcional do período já pago.'
        },
        {
          question: 'O que acontece se eu cancelar minha assinatura?',
          answer: 'Ao cancelar, você mantém acesso ao seu domínio e perfil até o final do período mensal pago. Após isso, o domínio entra em período de graça (15 dias) onde você ainda pode reativar sem custos extras. Se não houver reativação, o domínio passa por estados de suspensão progressiva até eventual liberação após 80 dias. Consulte a documentação completa do ciclo de vida de domínios para mais detalhes.'
        }
      ]
    },
    {
      id: 'security',
      title: 'Segurança e Proteção de Dados',
      icon: <Shield className="w-5 h-5" />,
      items: [
        {
          question: 'Meus dados estão seguros?',
          answer: 'Sim. Todas as conexões usam HTTPS e criptografia TLS. Os dados de pagamento são processados diretamente pelo PayPal, e não são armazenados em nossos servidores. A Global Digital Identity LTD segue práticas compatíveis com o UK Data Protection Act 2018 e o GDPR europeu.'
        },
        {
          question: 'Como funciona a verificação de segurança dos meus links?',
          answer: (
            <div className="space-y-3">
              <p>Todos os links adicionados ao seu perfil passam por <strong>verificação automática de segurança</strong> usando a tecnologia Google Safe Browsing API.</p>
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="font-semibold text-green-900 mb-2">✅ Proteção Automática</p>
                <ul className="list-disc list-inside space-y-1 text-green-800 text-sm">
                  <li>Verificação imediata ao adicionar ou editar link</li>
                  <li>Verificação periódica diária de todos os links ativos</li>
                  <li>Bloqueio automático de links maliciosos</li>
                  <li>Proteção contra phishing, malware e sites comprometidos</li>
                </ul>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <p className="font-semibold text-blue-900 mb-2">📊 Status Transparente</p>
                <p className="text-blue-800 text-sm">Você pode ver o status de segurança de cada link no seu painel: Seguro (✅), Sob Revisão (⚠️), Bloqueado (🔒) ou Pendente (🔄).</p>
              </div>
              <p className="text-sm mt-3">
                <strong>💡 Saiba mais:</strong> Acesse nossos artigos de suporte sobre <a href="/suporte/como-funciona-verificacao-seguranca" className="text-[#3B82F6] hover:underline">Como funciona a verificação</a> e <a href="/suporte/meu-link-foi-bloqueado" className="text-[#3B82F6] hover:underline">O que fazer se seu link for bloqueado</a>.
              </p>
            </div>
          )
        },
        {
          question: 'Por que meu link foi bloqueado?',
          answer: (
            <div className="space-y-3">
              <p>Um link pode ser bloqueado por diversos motivos de segurança:</p>
              <div className="space-y-2">
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg">
                  <p className="font-semibold text-red-900 text-sm mb-1">🦠 Malware ou Vírus</p>
                  <p className="text-red-800 text-sm">Site distribui software malicioso</p>
                </div>
                <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded-r-lg">
                  <p className="font-semibold text-orange-900 text-sm mb-1">🎣 Phishing</p>
                  <p className="text-orange-800 text-sm">Tentativa de roubar informações pessoais</p>
                </div>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg">
                  <p className="font-semibold text-amber-900 text-sm mb-1">🔓 Site Comprometido</p>
                  <p className="text-amber-800 text-sm">Site legítimo que foi hackeado</p>
                </div>
                <div className="bg-slate-50 border-l-4 border-slate-500 p-3 rounded-r-lg">
                  <p className="font-semibold text-slate-900 text-sm mb-1">⚠️ Falso Positivo</p>
                  <p className="text-slate-800 text-sm">Site seguro identificado incorretamente</p>
                </div>
              </div>
              <p className="text-sm mt-3">
                <strong>📝 Solução:</strong> Se você acredita que é um erro, pode solicitar revisão manual através do painel. Nossa equipe analisará em até 24-48 horas. <a href="/suporte/meu-link-foi-bloqueado" className="text-[#3B82F6] hover:underline">Ver guia completo</a>.
              </p>
            </div>
          )
        },
        {
          question: 'Com que frequência os links são verificados?',
          answer: (
            <div className="space-y-2">
              <p>A verificação de segurança acontece em dois momentos:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Imediata:</strong> Quando você adiciona ou edita um link (menos de 5 segundos)</li>
                <li><strong>Periódica:</strong> Todos os links são reverificados diariamente às 2h da manhã</li>
              </ul>
              <p className="mt-3 text-sm bg-blue-50 p-3 rounded">
                <strong>Por que reverificar?</strong> Sites seguros podem ser comprometidos após serem adicionados. A verificação contínua garante que seus visitantes estejam sempre protegidos.
              </p>
            </div>
          )
        },
        {
          question: 'Quais dados são coletados?',
          answer: (
            <div className="space-y-2">
              <p>Apenas os necessários para executar o contrato: nome, e-mail, endereço e informações de pagamento.</p>
              <p>Esses dados são usados exclusivamente para:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>registrar o domínio em seu nome;</li>
                <li>emitir faturas;</li>
                <li>prover suporte técnico;</li>
                <li>gerenciar seu perfil público.</li>
              </ul>
              <p>Nenhum dado é vendido, compartilhado ou usado para fins publicitários sem consentimento explícito.</p>
            </div>
          )
        },
        {
          question: 'O com.rich utiliza cookies?',
          answer: 'Sim, apenas cookies técnicos essenciais para autenticação, idioma e manutenção de sessão. Não utilizamos cookies de rastreamento publicitário de terceiros.'
        },
        {
          question: 'O que devo fazer em caso de suspeita de fraude?',
          answer: 'Entre em contato imediatamente pelo e-mail contact@com.rich. Casos comprovados de uso fraudulento resultam em suspensão imediata da conta e notificação às autoridades competentes.'
        }
      ]
    },
    {
      id: 'affiliate',
      title: 'Programa de Afiliados',
      icon: <Users className="w-5 h-5" />,
      items: [
        {
          question: 'Como funciona o Programa de Afiliados?',
          answer: (
            <div className="space-y-3">
              <p>O Programa de Afiliados permite que você ganhe comissões recorrentes promovendo <strong className="text-black">exclusivamente planos de assinatura</strong> da plataforma .com.rich.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                <p className="text-sm text-amber-900">
                  <strong>⚠️ Importante:</strong> Comissões aplicam-se apenas a vendas de planos de assinatura. Domínios premium são receita exclusiva da empresa e não geram comissão.
                </p>
              </div>
              <div className="space-y-3">
                <p className="font-semibold text-black mb-2">📊 Estrutura de Comissões:</p>

                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg">
                  <p className="font-bold text-emerald-900 mb-2">Membro Prime - 25% de Comissão</p>
                  <ul className="space-y-1 text-sm">
                    <li className="text-emerald-800"><strong>$12.50</strong> por venda do Plano Prime</li>
                    <li className="text-emerald-800"><strong>$17.50</strong> por venda do Plano Elite</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                  <p className="font-bold text-yellow-900 mb-2">Membro Elite - 50% de Comissão</p>
                  <ul className="space-y-1 text-sm">
                    <li className="text-yellow-800"><strong>$25.00</strong> por venda do Plano Prime</li>
                    <li className="text-yellow-800"><strong>$35.00</strong> por venda do Plano Elite</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <p className="font-bold text-amber-900 mb-2">Membro Supreme</p>
                  <p className="text-amber-800 text-sm">50% de comissão recorrente (equivalente ao Elite)</p>
                </div>
              </div>
            </div>
          )
        },
        {
          question: 'As comissões são recorrentes?',
          answer: (
            <div className="space-y-2">
              <p><strong>Sim!</strong> Você recebe comissão recorrente em todas as vendas realizadas através do seu link de parceria.</p>
              <p className="font-semibold text-black mt-3">Valores por Venda:</p>
              <div className="ml-4 space-y-2 mt-2">
                <div>
                  <p className="font-medium text-emerald-700">Como Membro Prime (25%):</p>
                  <ul className="list-disc list-inside ml-2 text-sm space-y-1">
                    <li>$12.50 por venda do Plano Prime</li>
                    <li>$17.50 por venda do Plano Elite</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-yellow-700">Como Membro Elite (50%):</p>
                  <ul className="list-disc list-inside ml-2 text-sm space-y-1">
                    <li>$25.00 por venda do Plano Prime</li>
                    <li>$35.00 por venda do Plano Elite</li>
                  </ul>
                </div>
              </div>
            </div>
          )
        },
        {
          question: 'Quais são os requisitos para participar?',
          answer: (
            <div className="space-y-2">
              <p>Para participar do programa de afiliados você DEVE ter:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Licença .com.rich ativa</strong></li>
                <li><strong>Plano de assinatura pago ativo</strong> (Prime ou Elite)</li>
                <li>Perfil social integrado</li>
                <li>Ser maior de 18 anos</li>
              </ul>
              <p className="mt-2 text-sm font-semibold text-amber-900 bg-amber-50 p-2 rounded">
                ⚠️ Sem licença ativa E plano pago, o link de afiliado NÃO é gerado.
              </p>
            </div>
          )
        },
        {
          question: 'Existe comissão sobre domínios Premium?',
          answer: (
            <div className="space-y-3">
              <p className="font-semibold text-red-900">❌ Não. Domínios premium são receita exclusiva da empresa.
              </p>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="text-red-800 text-sm">
                  O programa de afiliados aplica comissões <strong>exclusivamente</strong> a vendas de planos de assinatura (Prime, Elite, Supreme). Vendas de domínios premium da galeria não geram comissão para afiliados, conforme política comercial da plataforma.
                </p>
              </div>
            </div>
          )
        },
        {
          question: 'Quando eu não recebo comissão?',
          answer: 'Em casos de estorno, inadimplência, chargeback ou cancelamento antes da liquidação. Cobranças não liquidadas não geram comissão.'
        },
        {
          question: 'Qual é o valor mínimo para saque?',
          answer: 'O valor mínimo para solicitar saque é US$ 200. As comissões ficam disponíveis para saque 30 dias após a confirmação do pagamento do cliente. Os pagamentos são processados em até 10 dias úteis via Wise, PayPal ou Payoneer.'
        },
        {
          question: 'Onde posso ver os termos completos?',
          answer: (
            <p>
              Todos os detalhes estão disponíveis em:
              <br />
              <a href="/afiliados/sobre" className="text-[#3B82F6] hover:underline font-medium">Sobre o Programa</a>
              {' | '}
              <a href="/afiliados/termos" className="text-[#3B82F6] hover:underline font-medium">Termos Completos</a>
            </p>
          )
        }
      ]
    },
    {
      id: 'legal',
      title: 'Termos Legais e Responsabilidade',
      icon: <Scale className="w-5 h-5" />,
      items: [
        {
          question: 'Quem é o responsável legal pelo serviço?',
          answer: (
            <p className="text-sm">
              <strong>Global Digital Identity LTD</strong><br />
              Registered in England and Wales – Company No. <strong>16339013</strong><br />
              71-75 Shelton Street, Covent Garden, London, WC2H 9JQ
            </p>
          )
        },
        {
          question: 'O com.rich é responsável pelo conteúdo publicado pelos usuários?',
          answer: 'Não. Todo o conteúdo publicado nos perfis públicos ou hospedado através dos domínios é de responsabilidade exclusiva do titular da conta. A Global Digital Identity LTD atua apenas como intermediária técnica e administrativa.'
        },
        {
          question: 'Existe alguma restrição de uso?',
          answer: (
            <div className="space-y-2">
              <p>Sim. É proibido usar o serviço para:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>publicação de conteúdo ilegal, difamatório, pornográfico ou que viole direitos autorais;</li>
                <li>práticas de phishing, fraude ou golpes financeiros;</li>
                <li>atividades que violem leis do Reino Unido ou do país do usuário;</li>
                <li>spam ou uso abusivo dos recursos da plataforma.</li>
              </ul>
              <p>Violação dessas regras pode resultar em <strong>suspensão imediata e sem reembolso</strong>.</p>
            </div>
          )
        },
        {
          question: 'Qual é a jurisdição legal do com.rich?',
          answer: 'Todas as relações contratuais são regidas pelas leis da Inglaterra e País de Gales (England and Wales). Qualquer disputa será resolvida nos tribunais de Londres, Reino Unido.'
        },
        {
          question: 'Qual idioma prevalece legalmente?',
          answer: 'O idioma oficial e legalmente prevalente para todos os contratos, políticas, comunicações e interpretações jurídicas da Global Digital Identity LTD é o inglês. Versões traduzidas para outros idiomas (como português ou espanhol) são fornecidas apenas para conveniência. Em caso de discrepância entre versões, a versão em inglês prevalecerá integralmente.'
        }
      ]
    },
    {
      id: 'support',
      title: 'Suporte e Atendimento',
      icon: <Headphones className="w-5 h-5" />,
      items: [
        {
          question: 'Como posso entrar em contato com o suporte?',
          answer: (
            <div className="space-y-2">
              <p>O atendimento é realizado <strong>exclusivamente por e-mail</strong> ou pelo <strong>formulário de contato disponível no site</strong>.</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>E-mail:</strong> contact@com.rich</li>
                <li><strong>Formulário:</strong> disponível na página "Contato"</li>
              </ul>
              <p>Não há atendimento telefônico, WhatsApp ou redes sociais, para garantir segurança, privacidade e registro formal de todas as comunicações.</p>
            </div>
          )
        },
        {
          question: 'Em quanto tempo respondem as solicitações?',
          answer: 'Respondemos em até 24 horas. Dependendo da complexidade, a resolução pode levar de 3 a 5 dias úteis. Casos urgentes (como problemas críticos de domínio ou falhas técnicas) recebem prioridade imediata.'
        },
        {
          question: 'O com.rich oferece suporte em outros idiomas?',
          answer: 'Sim. Oferecemos atendimento em português, espanhol e inglês, conforme a origem do cliente. Contudo, em caso de conflito de interpretação, prevalece sempre o idioma inglês.'
        },
        {
          question: 'Como posso reportar abuso ou uso indevido?',
          answer: 'Envie um e-mail para abuse@com.rich com o máximo de informações possíveis (capturas de tela, URLs, data, domínio envolvido). As denúncias são analisadas pela equipe de conformidade dentro de 48h.'
        },
        {
          question: 'Posso usar o com.rich em qualquer país?',
          answer: 'Sim. O sistema é global, acessível de qualquer lugar do mundo. Alguns países podem ter restrições legais específicas para registro de domínios, que serão informadas caso se apliquem.'
        },
        {
          question: 'O que diferencia o com.rich de outros serviços?',
          answer: (
            <ul className="list-disc list-inside space-y-1">
              <li>Extensão de domínio exclusiva e premium (.com.rich).</li>
              <li>Perfil social integrado para centralizar sua presença online.</li>
              <li>Interface moderna e intuitiva.</li>
              <li>Registro e ativação instantânea.</li>
              <li>Pagamentos seguros via PayPal (USD).</li>
              <li>Suporte humano real, via e-mail.</li>
              <li>Empresa britânica com conformidade legal internacional.</li>
            </ul>
          )
        }
      ]
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#F5F5F5] overflow-hidden">
      <div className="relative pt-32 pb-16">
        <motion.section
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
              Perguntas <span className="bg-gradient-to-r from-[#60A5FA] via-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">Frequentes</span>
            </h1>
            <p className="text-xl text-[#6B7280] leading-relaxed">
              Encontre respostas para as dúvidas mais comuns sobre domínios .com.rich, perfis sociais, pagamentos, segurança e muito mais
            </p>
          </div>
        </motion.section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {faqSections.map((section, sectionIndex) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="bg-black p-6">
                  <div className="flex items-center gap-3 text-white">
                    {section.icon}
                    <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {section.items.map((item, itemIndex) => {
                    const itemId = `${section.id}-${itemIndex}`;
                    const isOpen = openItems.has(itemId);

                    return (
                      <div key={itemId}>
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                          <span className="text-lg font-semibold text-black pr-4">
                            {item.question}
                          </span>
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0"
                          >
                            <ChevronDown className="w-5 h-5 text-[#6B7280]" />
                          </motion.div>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-5 text-[#6B7280] leading-relaxed">
                                {typeof item.answer === 'string' ? (
                                  <p>{item.answer}</p>
                                ) : (
                                  item.answer
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 p-8 bg-black rounded-2xl shadow-sm text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-3">
            Ainda tem dúvidas?
          </h3>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">
            Nossa equipe está pronta para ajudar. Entre em contato conosco e responderemos em até 24 horas.
          </p>
          <motion.a
            href="/contato"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-8 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-all"
          >
            Falar com Suporte
          </motion.a>
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
