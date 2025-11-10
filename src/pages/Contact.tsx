import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, CheckCircle, MessageSquare, MapPin, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Categorias organizadas de atendimento
const CONTACT_SUBJECTS = [
  {
    category: 'Conta e Assinatura',
    options: [
      'Criar nova conta',
      'Problemas com login',
      'Recuperar senha',
      'Alterar email da conta',
      'Ativar autenticação de dois fatores (2FA)',
      'Desativar autenticação de dois fatores (2FA)',
      'Cancelar assinatura',
      'Alterar plano (upgrade/downgrade)',
      'Reativar assinatura cancelada',
      'Excluir minha conta permanentemente'
    ]
  },
  {
    category: 'Pagamentos e Faturamento',
    options: [
      'Dúvidas sobre cobrança',
      'Atualizar método de pagamento',
      'Solicitar reembolso',
      'Problemas com pagamento via PayPal',
      'Fatura não recebida',
      'Alterar dados de faturamento',
      'Solicitar nota fiscal',
      'Contestar cobrança',
      'Pagamento não processado',
      'Consultar histórico de pagamentos'
    ]
  },
  {
    category: 'Domínios Premium',
    options: [
      'Interesse em domínio premium',
      'Consultar disponibilidade de domínio',
      'Negociar preço de domínio premium',
      'Transferir domínio premium',
      'Problemas técnicos com domínio',
      'Solicitar licença Supreme',
      'Informações sobre domínios premium',
      'Dúvidas sobre exclusividade de uso',
      'Renovação de domínio premium'
    ]
  },
  {
    category: 'Marcas Protegidas',
    options: [
      'Solicitar acesso a marca protegida',
      'Verificação de marca registrada',
      'Contestar uso de marca',
      'Liberar marca para uso comercial',
      'Informações sobre proteção de marca',
      'Partnership com titular da marca'
    ]
  },
  {
    category: 'Perfil e Personalização',
    options: [
      'Problemas ao editar perfil',
      'Upload de imagem não funciona',
      'Alterar URL do perfil',
      'Configurar privacidade do perfil',
      'Adicionar/editar links sociais',
      'Problemas com QR Code',
      'Personalizar tema do perfil',
      'Configurar background personalizado'
    ]
  },
  {
    category: 'Programa de Afiliados',
    options: [
      'Como se tornar afiliado',
      'Consultar comissões acumuladas',
      'Solicitar saque de comissões',
      'Problemas com link de afiliado',
      'Atualizar dados de pagamento (afiliado)',
      'Dúvidas sobre taxas de comissão',
      'Reenviar link de parceria',
      'Relatório de conversões'
    ]
  },
  {
    category: 'Identidade Elite',
    options: [
      'Solicitar identidade física Elite',
      'Rastrear envio da identidade',
      'Problemas com QR Code da identidade',
      'Solicitar reenvio de identidade',
      'Alterar endereço de entrega',
      'Personalização da identidade',
      'Identidade danificada - solicitar nova',
      'Manifestar interesse em acessar lugares exclusivos'
    ]
  },
  {
    category: 'Suporte Técnico',
    options: [
      'Site não carrega',
      'Erro ao acessar painel',
      'Problemas de performance',
      'Bug ou erro no sistema',
      'Página em branco',
      'Incompatibilidade com navegador',
      'App mobile - problemas técnicos',
      'Problemas com DNS'
    ]
  },
  {
    category: 'Segurança e Privacidade',
    options: [
      'Reportar atividade suspeita',
      'Conta comprometida',
      'Solicitar dados pessoais (GDPR)',
      'Excluir dados pessoais',
      'Dúvidas sobre privacidade',
      'Reportar abuso ou spam',
      'Configurações de segurança',
      'Relatório de vulnerabilidade'
    ]
  },
  {
    category: 'Parcerias e Negócios',
    options: [
      'Proposta de parceria comercial',
      'Licenciamento corporativo',
      'White label / Rebranding',
      'Integração de API',
      'Plano Enterprise personalizado',
      'Mídia e imprensa',
      'Investimento e funding'
    ]
  },
  {
    category: 'Jurídico e Compliance',
    options: [
      'Termos de serviço',
      'Política de privacidade',
      'Conformidade GDPR',
      'Questões legais',
      'Direitos autorais',
      'Propriedade intelectual',
      'Documentação legal'
    ]
  },
  {
    category: 'Outros Assuntos',
    options: [
      'Feedback ou sugestão',
      'Reportar problema não listado',
      'Dúvida geral',
      'Elogio ou agradecimento',
      'Outro assunto'
    ]
  }
];

const Contact: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<'success' | 'error' | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        console.log('[Contact] Usuário não logado');
        return;
      }

      console.log('[Contact] Buscando dados para usuário:', user.id);

      // Verificar se é admin
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (customerError) {
        console.error('[Contact] Erro ao buscar dados do cliente:', customerError);
      }

      console.log('[Contact] Dados do cliente:', customerData);
      const userIsAdmin = customerData?.role === 'admin';
      setIsAdmin(userIsAdmin);
      console.log('[Contact] É admin?', userIsAdmin, '(role:', customerData?.role, ')');

      // Buscar plano de assinatura
      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .select('plan_type')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('[Contact] Erro ao buscar plano:', error);
      }

      console.log('[Contact] Plano encontrado:', subscriptionData?.plan_type || 'nenhum');
      setUserPlan(subscriptionData?.plan_type || null);
    };

    fetchUserData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmitResult('success');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <div className="relative min-h-screen bg-[#F5F5F5] overflow-hidden">
      <div className="relative pt-32 pb-16">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-6">
              Entre em <span className="bg-gradient-to-r from-[#60A5FA] via-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">Contato</span>
            </h1>
            <p className="text-xl text-[#6B7280]">Nossa equipe está pronta para ajudar com qualquer dúvida</p>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-black mb-6">Envie uma Mensagem</h2>
              {submitResult === 'success' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">Mensagem enviada com sucesso!</p>
                </motion.div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Nome</label>
                  <input name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Assunto</label>
                  <div className="relative">
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-[#3B82F6] appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Selecione um assunto...</option>
                      {CONTACT_SUBJECTS.map((group) => (
                        <optgroup key={group.category} label={group.category}>
                          {group.options.map((option) => {
                            // Ocultar opção de lugares exclusivos se não for Elite Member ou Admin
                            if (option === 'Manifestar interesse em acessar lugares exclusivos') {
                              console.log('[Contact] Verificando acesso Elite - userPlan:', userPlan, 'isAdmin:', isAdmin, 'isElite:', userPlan === 'elite');
                              if (userPlan !== 'elite' && !isAdmin) {
                                return null;
                              }
                            }
                            return (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            );
                          })}
                        </optgroup>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Mensagem</label>
                  <textarea name="message" rows={5} value={formData.message} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] resize-none" required />
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-black hover:bg-[#1a1b2e] text-white font-semibold rounded-xl shadow-sm disabled:opacity-50">
                  <Send className="w-5 h-5" />
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                </motion.button>
              </form>
            </div>

            <div className="space-y-6">
              {[
                { icon: Mail, title: 'Email', content: 'contact@com.rich', href: 'mailto:contact@com.rich' },
                { icon: MessageSquare, title: 'Formulário', content: 'Use o formulário ao lado para nos contatar', href: null },
                { icon: MapPin, title: 'Endereço', content: 'Global Digital Identity LTD, Registered in England and Wales, Company No. 16339013, 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ', href: null }
              ].map((item, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 flex items-start gap-4 hover:shadow-sm transition-shadow">
                  <div className="p-3 bg-black rounded-lg">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-1">{item.title}</h3>
                    {item.href ? <a href={item.href} className="text-[#3B82F6] hover:text-[#2B6CB0]">{item.content}</a> : <p className="text-[#6B7280]">{item.content}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Contact;
