import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Send, CheckCircle, AlertCircle, ChevronLeft, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import * as yup from 'yup';

const ticketSchema = yup.object().shape({
  name: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome muito curto')
    .max(100, 'Nome muito longo'),
  email: yup
    .string()
    .required('Email é obrigatório')
    .email('Email inválido'),
  subject: yup
    .string()
    .required('Assunto é obrigatório')
    .min(5, 'Assunto muito curto')
    .max(200, 'Assunto muito longo'),
  description: yup
    .string()
    .required('Descrição é obrigatória')
    .min(10, 'Descrição muito curta')
    .max(5000, 'Descrição muito longa'),
});

interface Domain {
  id: string;
  fqdn: string;
}

const OpenTicket: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [domains, setDomains] = useState<Domain[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    domain: '',
    category: 'Domínios',
    subject: '',
    description: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchDomains();
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user?.id, user?.email]);

  const fetchDomains = async () => {
    if (!user?.id) return;

    try {
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (customerData) {
        const { data: domainsData } = await supabase
          .from('domains')
          .select('id, fqdn')
          .eq('customer_id', customerData.id)
          .eq('registrar_status', 'active');

        setDomains(domainsData || []);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await ticketSchema.validate(formData, { abortEarly: false });
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        setError(err.errors[0]);
        setLoading(false);
        return;
      }
    }

    try {
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert([
          {
            customer_id: customerData?.id || null,
            email: formData.email,
            name: formData.name,
            domain: formData.domain || null,
            category: formData.category,
            subject: formData.subject,
            description: formData.description,
            status: 'open',
            priority: 'medium'
          }
        ])
        .select()
        .single();

      if (ticketError) throw ticketError;

      setTicketNumber(ticket.ticket_number);
      setSuccess(true);

      setFormData({
        name: '',
        email: user?.email || '',
        domain: '',
        category: 'Domínios',
        subject: '',
        description: ''
      });

      setTimeout(() => {
        navigate('/panel/support');
      }, 3000);
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      setError(err.message || 'Não foi possível enviar seu chamado. Por favor, tente novamente ou escreva para support@com.rich');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white border-2 border-green-200 rounded-2xl p-8 text-center shadow-xl"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Chamado aberto com sucesso!</h2>
          <p className="text-slate-600 mb-4">
            Número do chamado: <span className="font-mono font-bold text-slate-900">{ticketNumber}</span>
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Enviamos um e-mail de confirmação para {formData.email}. Responderemos em até 24 horas.
          </p>
          <button
            onClick={() => navigate('/panel/support')}
            className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-900 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Voltar para Suporte
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        <button
          onClick={() => navigate('/suporte')}
          className="flex items-center gap-2 text-slate-900 hover:text-slate-900 font-medium mb-8 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Voltar para Suporte
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Abrir Chamado</h1>
          <p className="text-lg text-slate-600">
            Descreva seu problema e nossa equipe entrará em contato.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border-2 border-slate-200 rounded-2xl p-8 shadow-lg"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-slate-500 transition-all"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  E-mail *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-slate-500 transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Domínio (opcional)
                </label>
                <select
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-slate-500 transition-all"
                >
                  <option value="">Selecione um domínio</option>
                  {domains.map(domain => (
                    <option key={domain.id} value={domain.fqdn}>
                      {domain.fqdn}
                    </option>
                  ))}
                  <option value="outro">Outro domínio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Categoria *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-slate-500 transition-all"
                >
                  <option value="Domínios">Domínios</option>
                  <option value="E-mails">E-mails</option>
                  <option value="Faturamento">Faturamento</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Assunto *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-slate-500 transition-all"
                placeholder="Descreva brevemente o problema"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Descrição *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={8}
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-slate-500 transition-all resize-none"
                placeholder="Descreva em detalhes o problema que você está enfrentando. Inclua informações como mensagens de erro, passos que você já tentou, etc."
              />
            </div>

            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
              <h4 className="font-bold text-slate-900 mb-2">SLA de Atendimento</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                Nossa equipe responde todos os chamados em até <strong>24 horas</strong>.<br />
                Dependendo da complexidade do caso, o prazo de resolução pode variar entre <strong>3 a 5 dias úteis</strong>.<br />
                Você receberá um e-mail de confirmação com o número do seu chamado.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-slate-500 to-slate-900 text-white font-bold rounded-xl shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar Chamado
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default OpenTicket;
