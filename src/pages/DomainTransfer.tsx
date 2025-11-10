import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Mail, AlertCircle } from 'lucide-react';
import { PanelLayout } from '../components/PanelLayout';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const DomainTransfer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [domain, setDomain] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDomain = async () => {
      if (!user?.id || !id) {
        setLoading(false);
        return;
      }

      try {
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (customerData) {
          const { data: domainData } = await supabase
            .from('domains')
            .select('*')
            .eq('id', id)
            .eq('customer_id', customerData.id)
            .maybeSingle();

          setDomain(domainData);
        }
      } catch (error) {
        console.error('Error fetching domain:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDomain();
  }, [user?.id, id]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (recipientEmail !== confirmEmail) {
      alert('Os emails não coincidem. Por favor, verifique e tente novamente.');
      return;
    }

    if (recipientEmail === user?.email) {
      alert('Você não pode transferir um domínio para si mesmo.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: recipientCustomer } = await supabase
        .from('customers')
        .select('id, email')
        .eq('email', recipientEmail)
        .maybeSingle();

      if (!recipientCustomer) {
        alert('Usuário destinatário não encontrado. Certifique-se de que o email está correto e que o usuário possui uma conta.');
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('domains')
        .update({ customer_id: recipientCustomer.id })
        .eq('id', id);

      if (error) throw error;

      alert(`Domínio ${domain.fqdn} transferido com sucesso para ${recipientEmail}!`);
      navigate('/panel/domains');
    } catch (error) {
      console.error('Error transferring domain:', error);
      alert('Erro ao transferir domínio. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PanelLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-slate-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando...</p>
          </div>
        </div>
      </PanelLayout>
    );
  }

  if (!domain) {
    return (
      <PanelLayout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Domínio não encontrado</h2>
            <p className="text-slate-600 mb-6">O domínio que você está tentando transferir não existe ou não pertence a você.</p>
            <button
              onClick={() => navigate('/panel/domains')}
              className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-900 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Voltar para Meus Domínios
            </button>
          </div>
        </div>
      </PanelLayout>
    );
  }

  return (
    <PanelLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/panel/domains')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Meus Domínios
        </button>

        <PageHeader
          title={`Transferir ${domain.fqdn}`}
          description="Transfira a propriedade deste domínio para outro usuário"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-8">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">Atenção</h4>
                  <p className="text-sm text-amber-800">
                    Ao transferir este domínio, você perderá completamente o acesso a ele.
                    O novo proprietário terá controle total sobre o domínio. Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleTransfer} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email do Destinatário
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  O destinatário deve ter uma conta registrada no sistema
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirmar Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/panel/domains')}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !recipientEmail || !confirmEmail}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-900 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Transferindo...' : 'Confirmar Transferência'}
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </PanelLayout>
  );
};

export default DomainTransfer;
