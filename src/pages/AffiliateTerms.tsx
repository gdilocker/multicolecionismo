import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const AffiliateTerms: React.FC = () => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  const sections = [
    {
      title: '1. DEFINIÇÕES',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-black mb-2">1.1 Afiliado</h3>
            <p>Participante aceito no Programa de Afiliados .com.rich.</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-black mb-2">1.2 Venda Confirmada</h3>
            <p className="mb-2">Transação considerada válida e elegível para comissão, desde que:</p>
            <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
              <li>O pagamento tenha sido aprovado e recebido com sucesso pela plataforma;</li>
              <li>A compra não tenha sido reembolsada, contestada ou cancelada;</li>
              <li>O cliente não tenha solicitado cancelamento dentro do prazo legal de arrependimento (quando aplicável);</li>
              <li>A transação não apresente sinais de fraude ou tentativa de manipulação do sistema;</li>
              <li>O afiliado tenha cumprido todas as políticas da plataforma no processo de divulgação.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-black mb-2">1.3 Plataforma</h3>
            <p>Os serviços e sites digitais operados sob o domínio .com.rich, gerenciados pela empresa Global Digital Identity LTD.</p>
          </div>
        </div>
      )
    },
    {
      title: '2. REGISTRO PÚBLICO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            A presente política foi registrada publicamente no órgão britânico <strong className="text-black">Companies House</strong> sob o título <strong className="text-black">"Affiliate Program Governance Policy – .com.rich"</strong>, como documento oficial de governança vinculado à empresa <strong className="text-black">Global Digital Identity LTD</strong>.
          </p>
        </div>
      )
    },
    {
      title: '3. VISÃO GERAL',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            O Programa de Afiliados .com.rich é uma iniciativa comercial legítima, criada para permitir que afiliados promovam os serviços digitais da plataforma e recebam comissões com base em vendas reais e confirmadas, sempre em conformidade com as leis aplicáveis e os princípios de transparência, responsabilidade e legalidade.
          </p>
        </div>
      )
    },
    {
      title: '4. QUEM PODE PARTICIPAR',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
            <li><strong className="text-black">4.1</strong> Pessoas físicas maiores de 18 anos e plenamente capazes;</li>
            <li><strong className="text-black">4.2</strong> Usuários com domínio ativo registrado na plataforma .com.rich;</li>
            <li><strong className="text-black">4.3</strong> Indivíduos que aceitem integralmente estes Termos e Condições;</li>
            <li><strong className="text-black">4.4</strong> AO SOLICITAR PARTICIPAÇÃO E/OU UTILIZAR LINKS DE AFILIADO, O PARTICIPANTE DECLARA QUE LEU, ENTENDEU E ACEITOU PLENAMENTE ESTA POLÍTICA, INCLUSIVE SUAS ATUALIZAÇÕES FUTURAS.</li>
          </ul>
        </div>
      )
    },
    {
      title: '5. RECUSA OU REMOÇÃO DE PARTICIPANTES',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            A empresa se reserva o direito de recusar, suspender ou encerrar a participação de qualquer indivíduo a qualquer momento, sem obrigação de justificativa, especialmente em casos de suspeita de fraude, risco reputacional ou incompatibilidade com os valores institucionais.
          </p>
        </div>
      )
    },
    {
      title: '6. COMO FUNCIONAM AS COMISSÕES',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <ul className="space-y-3 text-[#6B7280]/80">
            <li><strong className="text-black">6.1</strong> As comissões são geradas exclusivamente por compras realizadas por meio do link único do afiliado no momento do pagamento.</li>
            <li><strong className="text-black">6.2</strong> O percentual da comissão é definido pela plataforma e exibido publicamente nas páginas oficiais, podendo ser alterado a qualquer momento mediante aviso por canais institucionais.</li>
            <li><strong className="text-black">6.3</strong> As comissões se aplicam apenas a vendas diretas. Não há qualquer remuneração por cadastros, visitas ou estrutura de múltiplos níveis.</li>
            <li><strong className="text-black">6.4</strong> A validade de cada comissão depende da classificação da venda como Venda Confirmada.</li>
            <li><strong className="text-black">6.5</strong> O cálculo da comissão é feito com base no valor líquido efetivamente recebido, já descontadas taxas, impostos, estornos e custos operacionais.</li>
            <li><strong className="text-black">6.6</strong> O afiliado é o único responsável por declarar e pagar eventuais tributos sobre os valores recebidos, conforme sua legislação local.</li>
            <li><strong className="text-black">6.7</strong> A PARTICIPAÇÃO NO PROGRAMA E O PERCENTUAL DE COMISSÃO NÃO CONSTITUEM DIREITO ADQUIRIDO. ALTERAÇÕES PODEM SER FEITAS A QUALQUER MOMENTO, AFETANDO COMISSÕES FUTURAS.</li>
          </ul>
        </div>
      )
    },
    {
      title: '7. VERIFICAÇÃO E PREVENÇÃO DE FRAUDES',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <ul className="space-y-2 text-[#6B7280]/80">
            <li><strong className="text-black">7.1</strong> Todas as comissões estão sujeitas à validação interna.</li>
            <li><strong className="text-black">7.2</strong> A empresa poderá reter pagamentos ou revisar transações em caso de sinais de fraude, comportamento suspeito ou violação de regras.</li>
          </ul>
        </div>
      )
    },
    {
      title: '8. RASTREAMENTO DE VENDAS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <ul className="space-y-2 text-[#6B7280]/80">
            <li><strong className="text-black">8.1</strong> O rastreamento é feito por meio de link único fornecido ao afiliado.</li>
            <li><strong className="text-black">8.2</strong> A comissão será gerada apenas se a compra for concluída através desse link.</li>
            <li><strong className="text-black">8.3</strong> O sistema poderá utilizar cookies ou sessões temporárias.</li>
            <li><strong className="text-black">8.4</strong> COMPRAS FUTURAS SEM NOVO CLIQUE NO LINK DO AFILIADO NÃO GERARÃO COMISSÃO.</li>
          </ul>
        </div>
      )
    },
    {
      title: '9. TRANSPARÊNCIA E CONTROLE',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>O afiliado terá acesso a um painel exclusivo com:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
            <li>Histórico de vendas confirmadas</li>
            <li>Comissões acumuladas</li>
            <li>Relatórios de desempenho</li>
            <li>Links personalizados e materiais promocionais</li>
            <li>Solicitação de saques</li>
          </ul>
        </div>
      )
    },
    {
      title: '10. PAGAMENTOS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg mb-4">
            <h4 className="font-semibold text-blue-900 mb-2">10.1 RESPONSABILIDADE PELOS PAGAMENTOS</h4>
            <p className="text-[#6B7280]/90 leading-relaxed mb-3">
              A responsabilidade integral pelo pagamento de comissões e repasses financeiros aos afiliados é única e exclusivamente da empresa <strong className="text-black">GLOBAL DIGITAL IDENTITY LTD</strong>, registrada no Reino Unido sob o número 16339013.
            </p>
            <p className="text-[#6B7280]/90 leading-relaxed mb-3">
              Os gateways de pagamento utilizados pela plataforma, como PayPal, Stripe, Wise, Payoneer, Paddle, Checkout.com, entre outros, atuam apenas como processadores técnicos, não tendo qualquer responsabilidade sobre os valores devidos aos afiliados, nem sobre prazos, retenções, disputas ou liberações de comissões.
            </p>
            <p className="text-[#6B7280]/90 leading-relaxed mb-3">
              Os repasses de valores ocorrerão somente após confirmação do recebimento integral, verificação de estornos, cancelamentos ou disputas, e desde que o valor acumulado atinja o mínimo exigido para saque. Em caso de contestação ou disputa dentro do prazo legal aplicável, o pagamento poderá ser retido até a resolução definitiva.
            </p>
            <p className="text-[#6B7280]/90 leading-relaxed">
              A empresa se reserva o direito de aplicar medidas internas de auditoria e conformidade, podendo reter ou cancelar valores associados a atividades suspeitas, em desacordo com esta política ou com os Termos de Uso da plataforma.
            </p>
          </div>

          <ul className="space-y-2 text-[#6B7280]/80">
            <li><strong className="text-black">10.2</strong> As comissões são liberadas após confirmação do pagamento e verificação de até 30 dias.</li>
            <li><strong className="text-black">10.3</strong> Os saques são processados manualmente mediante solicitação, respeitando o valor mínimo exibido no painel. Comissões não reivindicadas por mais de 12 meses serão consideradas perdidas.</li>
            <li><strong className="text-black">10.4</strong> Métodos de pagamento incluem: PayPal, Stripe, Wise, Payoneer, Paddle, Checkout.com, entre outros, conforme disponibilidade e conformidade local.</li>
            <li><strong className="text-black">10.5</strong> Os pagamentos são feitos diretamente ao titular da conta. Não são permitidos pagamentos a terceiros.</li>
            <li><strong className="text-black">10.6</strong> Enquanto a assinatura do cliente estiver ativa e os pagamentos em dia, o afiliado poderá continuar recebendo comissões mensais, desde que classificadas como Vendas Confirmadas. Não há garantia de comissões recorrentes futuras. Cada comissão depende de um novo pagamento bem-sucedido.</li>
          </ul>
        </div>
      )
    },
    {
      title: '11. RETENÇÃO E RESPONSABILIDADES',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            A empresa poderá reter comissões por até 120 dias após o encerramento da conta, para fins de auditoria, estornos ou questões legais.
          </p>
          <p>
            Valores relacionados a disputas ou fraudes poderão ser cancelados a qualquer momento.
          </p>
        </div>
      )
    },
    {
      title: '12. LEGALIDADE E CONFORMIDADE',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-r-lg mb-4">
            <h4 className="font-semibold text-green-900 mb-2">12.1 ESTE PROGRAMA:</h4>
            <ul className="space-y-2 text-[#6B7280]/80">
              <li>• <strong className="text-black">NÃO</strong> é um plano de investimento</li>
              <li>• <strong className="text-black">NÃO</strong> oferece retornos fixos, renda passiva ou lucros automáticos</li>
              <li>• <strong className="text-black">NÃO</strong> utiliza estruturas em rede ou multinível</li>
              <li>• É UMA <strong className="text-black">ATIVIDADE COMERCIAL LEGÍTIMA</strong>, baseada exclusivamente em vendas reais de serviços digitais</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-black mb-2">12.2 Em conformidade com:</h4>
            <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
              <li>Consumer Rights Act 2015 (Reino Unido)</li>
              <li>Data Protection Act 2018 (Reino Unido)</li>
              <li>Regulamento Geral de Proteção de Dados – GDPR (UE)</li>
              <li>Políticas vigentes do PayPal, Stripe, Wise, Payoneer, Paddle, Checkout.com</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: '13. CONDUTAS PROIBIDAS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg mb-4">
            <p className="font-semibold text-red-900 mb-2">
              A conta será suspensa e as comissões canceladas nos seguintes casos:
            </p>
          </div>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
            <li>Criação de múltiplas contas para simular vendas</li>
            <li>Promessas de "renda garantida", "renda passiva" ou "lucro automático"</li>
            <li>Divulgação como "oportunidade de investimento"</li>
            <li>Prática de spam, automações não autorizadas ou publicidade enganosa</li>
            <li>Envolvimento em esquemas de pirâmide ou marketing multinível</li>
            <li>Conteúdo ilegal, ofensivo ou discriminatório</li>
            <li>Qualquer ação que prejudique a imagem ou reputação da plataforma</li>
          </ul>
        </div>
      )
    },
    {
      title: '14. PROTEÇÃO DE DADOS',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Os dados dos afiliados são usados exclusivamente para operação do programa.
          </p>
          <p>
            É proibido armazenar, utilizar ou divulgar dados de terceiros sem consentimento legal.
          </p>
          <p>
            Todas as práticas seguem a Política de Privacidade da plataforma e a legislação do Reino Unido/UE.
          </p>
        </div>
      )
    },
    {
      title: '15. ENCERRAMENTO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            O afiliado pode encerrar sua participação a qualquer momento pelo painel.
          </p>
          <p>
            A empresa pode encerrar contas por inatividade, violação, risco ou estratégia.
          </p>
          <p>
            Comissões acumuladas serão pagas, exceto em casos de retenção justificada.
          </p>
        </div>
      )
    },
    {
      title: '16. NATUREZA DA RELAÇÃO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            A participação não cria qualquer vínculo empregatício, societário ou de representação.
          </p>
          <p>
            O afiliado atua de forma independente, por sua conta e risco.
          </p>
        </div>
      )
    },
    {
      title: '17. LIMITAÇÃO DE RESPONSABILIDADE',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p className="mb-2">A empresa não se responsabiliza por:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside ml-4">
            <li>Danos indiretos ou consequenciais</li>
            <li>Interrupções técnicas</li>
            <li>Falhas dos gateways de pagamento</li>
            <li>Indisponibilidade de terceiros</li>
            <li>Perda de lucros</li>
          </ul>
          <p className="mt-4 font-semibold text-black">
            O FUNCIONAMENTO DO SISTEMA NÃO É GARANTIDO DE FORMA ININTERRUPTA, E O AFILIADO ACEITA OS RISCOS INERENTES ÀS ATIVIDADES DIGITAIS.
          </p>
        </div>
      )
    },
    {
      title: '18. JURISDIÇÃO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Este programa é regido pelas leis do <strong className="text-black">Reino Unido</strong>.
          </p>
          <p>
            O foro competente é o da cidade de <strong className="text-black">Londres, Inglaterra</strong>.
          </p>
        </div>
      )
    },
    {
      title: '19. ATUALIZAÇÕES DA POLÍTICA',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            A empresa poderá alterar esta política a qualquer momento.
          </p>
          <p>
            As alterações terão efeito imediato após publicação oficial.
          </p>
        </div>
      )
    },
    {
      title: '20. AVISO FINAL',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            O Programa de Afiliados .com.rich é <strong className="text-black">transparente, legítimo e baseado em valor real</strong>.
          </p>
          <p>
            Não se trata de investimento nem de promessa de lucros.
          </p>
          <p>
            As comissões decorrem exclusivamente de vendas confirmadas de serviços digitais realizadas pelo link do afiliado.
          </p>
        </div>
      )
    },
    {
      title: '21. CONFIDENCIALIDADE',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            O afiliado se compromete a manter absoluto sigilo sobre qualquer informação estratégica, técnica ou comercial acessada por meio do programa.
          </p>
          <p>
            É terminantemente proibido divulgar dados internos, condições ou estratégias da plataforma sem autorização prévia e por escrito da empresa.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 lg:pt-48 lg:pb-24">
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Termos e Condições para Afiliados
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 mt-4">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Parceria
              </span>
            </div>
            <div className="mt-6 space-y-2">
              <p className="text-xl font-bold text-gray-900">
                PROGRAMA DE AFILIADOS – .COM.RICH
              </p>
              <p className="text-lg font-semibold text-gray-700">
                POLÍTICA OFICIAL DE GOVERNANÇA
              </p>
              <p className="text-base font-medium text-gray-600">
                GLOBAL DIGITAL IDENTITY LTD – EMPRESA Nº 16339013
              </p>
              <p className="text-sm font-medium text-blue-900">
                VERSÃO PÚBLICA REGISTRADA – COMPANIES HOUSE – REINO UNIDO
              </p>
              <p className="text-sm text-gray-600 mt-4">
                Data de Vigência: {formattedDate}
              </p>
            </div>
          </motion.div>

          <div className="relative group mb-8">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
            <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-emerald-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-black mb-2">Leia atentamente antes de participar</h2>
                  <p className="text-[#6B7280]/80 leading-relaxed">
                    Este documento estabelece as regras oficiais do Programa de Afiliados com.rich. Ao participar, você concorda integralmente com todos os termos aqui descritos.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative bg-gradient-to-r from-slate-50 to-blue-50 backdrop-blur-xl border-2 border-blue-300 rounded-xl p-6 shadow-lg mt-4">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-blue-700 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-lg font-bold text-blue-900 mb-3">Documento Oficial Registrado</h2>
                  <p className="text-[#6B7280]/90 leading-relaxed mb-3">
                    Os <strong className="text-black">Termos de Afiliados do .com.rich</strong> são documentos oficiais registrados na <strong className="text-black">Companies House</strong>, órgão do governo do Reino Unido responsável pelo registro e supervisão de empresas.
                  </p>
                  <p className="text-[#6B7280]/90 leading-relaxed mb-3">
                    Essa formalização garante <strong className="text-black">transparência jurídica e autenticidade internacional</strong>, assegurando que todas as regras de afiliação, comissões e licenciamento sigam padrões legais do Reino Unido.
                  </p>
                  <div className="bg-white/70 rounded-lg p-3 border-l-4 border-blue-600">
                    <p className="text-sm font-semibold text-blue-900">
                      📋 Referência Legal:
                    </p>
                    <p className="text-sm text-[#6B7280]/90 mt-1">
                      <strong className="text-black">Global Digital Identity LTD</strong> — Registrada na Companies House – England & Wales
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
                <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-black mb-4">{section.title}</h2>
                  {section.content}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default AffiliateTerms;
