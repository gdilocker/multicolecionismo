import React from 'react';
import { motion } from 'framer-motion';
import { FileEdit, Calendar, Shield } from 'lucide-react';

const UserContentPolicy: React.FC = () => {
  const sections = [
    {
      title: '1. DEFINIÇÃO DE CONTEÚDO DO USUÁRIO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Conteúdo do usuário inclui qualquer informação, dados, textos, software, música, som, fotografias, gráficos, vídeos, mensagens ou outros materiais que você publique, envie ou exiba através dos nossos serviços.
          </p>
        </div>
      )
    },
    {
      title: '2. PROPRIEDADE DO CONTEÚDO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Você mantém todos os direitos sobre o conteúdo que criar:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Você é o proprietário do seu conteúdo</li>
            <li>Mantém direitos autorais sobre suas criações</li>
            <li>A Global Digital Identity não reivindica propriedade</li>
            <li>Você controla como seu conteúdo é usado</li>
          </ul>
        </div>
      )
    },
    {
      title: '3. LICENÇA CONCEDIDA',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Ao postar conteúdo, você nos concede uma licença limitada para:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Armazenar e exibir seu conteúdo</li>
            <li>Fazer backups técnicos</li>
            <li>Transmitir seu conteúdo através de nossa rede</li>
            <li>Modificar formato para compatibilidade técnica</li>
          </ul>
          <p>Esta licença termina quando você remove o conteúdo ou encerra sua conta.</p>
        </div>
      )
    },
    {
      title: '4. RESPONSABILIDADE PELO CONTEÚDO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Você é totalmente responsável por:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Todo conteúdo que você publica</li>
            <li>Garantir que possui direitos para publicar</li>
            <li>Conformidade com leis aplicáveis</li>
            <li>Precisão das informações fornecidas</li>
            <li>Consequências do conteúdo publicado</li>
          </ul>
        </div>
      )
    },
    {
      title: '5. CONTEÚDO PROIBIDO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Não é permitido publicar conteúdo que:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Viole direitos de terceiros</li>
            <li>Seja ilegal, prejudicial ou ofensivo</li>
            <li>Contenha vírus ou códigos maliciosos</li>
            <li>Promova atividades ilegais</li>
            <li>Seja spam ou não solicitado</li>
            <li>Viole privacidade de outros</li>
            <li>Contenha informações falsas ou enganosas</li>
            <li>Incite ódio ou violência</li>
          </ul>
        </div>
      )
    },
    {
      title: '6. MODERAÇÃO DE CONTEÚDO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>A Global Digital Identity reserva-se o direito de:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Revisar conteúdo quando necessário</li>
            <li>Remover conteúdo que viole políticas</li>
            <li>Suspender contas que publiquem conteúdo proibido</li>
            <li>Cooperar com autoridades em investigações</li>
          </ul>
          <p>Nota: Não monitoramos ativamente todo conteúdo, mas agimos quando violações são reportadas.</p>
        </div>
      )
    },
    {
      title: '7. DENÚNCIA DE CONTEÚDO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Para denunciar conteúdo inadequado:</p>
          <ol className="space-y-2 text-[#6B7280]/70 list-decimal list-inside">
            <li>Envie email para contact@com.rich</li>
            <li>Descreva o conteúdo e localização</li>
            <li>Explique por que viola políticas</li>
            <li>Forneça evidências se disponível</li>
          </ol>
          <p>Todas as denúncias são analisadas em até 48 horas.</p>
        </div>
      )
    },
    {
      title: '8. BACKUP E ARMAZENAMENTO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Recomendações sobre seu conteúdo:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Mantenha backups próprios de conteúdo importante</li>
            <li>Não dependa apenas de nossos servidores</li>
            <li>Fazemos backups regulares, mas não garantimos recuperação</li>
            <li>Você é responsável por preservar seu próprio conteúdo</li>
          </ul>
        </div>
      )
    },
    {
      title: '9. REMOÇÃO DE CONTEÚDO',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>Você pode remover seu conteúdo a qualquer momento:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Através do painel de controle</li>
            <li>Solicitando exclusão por email</li>
            <li>Encerrando sua conta</li>
          </ul>
          <p>Nota: Cópias em backup podem persistir por até 30 dias após exclusão.</p>
        </div>
      )
    },
    {
      title: '10. LIMITAÇÃO DE RESPONSABILIDADE',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>A Global Digital Identity não é responsável por:</p>
          <ul className="space-y-2 text-[#6B7280]/70 list-disc list-inside">
            <li>Conteúdo publicado por usuários</li>
            <li>Perda ou corrupção de conteúdo</li>
            <li>Uso indevido de seu conteúdo por terceiros</li>
            <li>Violações de direitos autorais por usuários</li>
          </ul>
        </div>
      )
    },
    {
      title: '11. ATUALIZAÇÕES DA POLÍTICA',
      content: (
        <div className="text-[#6B7280]/80 space-y-4">
          <p>
            Esta política pode ser atualizada periodicamente. Mudanças significativas serão comunicadas com antecedência. Seu uso continuado após alterações constitui aceitação dos novos termos.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#F5F5F5] overflow-hidden">
      <div className="relative pt-32 pb-16">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-6 shadow-lg shadow-sm">
              <FileEdit className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              Política de Conteúdo Gerado pelo Usuário
            </h1>
            <p className="text-xl text-[#6B7280]/70 mb-4">.com.rich</p>
            <div className="inline-flex items-center gap-2 text-[#6B7280]/80">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Última atualização: 21 de outubro de 2025</span>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="relative group mb-8">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
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

export default UserContentPolicy;
