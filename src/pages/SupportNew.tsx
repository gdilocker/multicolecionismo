import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Mail, MessageCircle } from 'lucide-react';

const SupportNew: React.FC = () => {
  const handleOpenChat = () => {
    const chatWidget = document.querySelector('.chat-widget-button') as HTMLElement;
    if (chatWidget) {
      chatWidget.click();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            Como podemos ajudar?
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Entre em contato diretamente com nossa equipe de suporte oficial.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl p-8 shadow-xl text-white"
          >
            <div className="bg-white/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <MessageCircle className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-bold mb-3 text-white">
              Falar com o Suporte
            </h2>

            <p className="text-white/90 mb-6 leading-relaxed">
              Nossa equipe está pronta para ajudar com qualquer dúvida.
            </p>

            <a
              href="/suporte/abrir-chamado"
              className="w-full bg-white text-slate-800 py-3 px-6 rounded-xl font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <MessageCircle className="w-5 h-5" />
              Abrir Chamado
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 shadow-lg border-2 border-slate-200"
          >
            <div className="bg-slate-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <Mail className="w-7 h-7 text-slate-700" />
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-3">
              E-mail de Suporte
            </h2>

            <p className="text-slate-600 mb-6 leading-relaxed">
              Envie um e-mail e responderemos em até 24 horas.
            </p>

            <a
              href="mailto:support@com.rich"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border-2 border-slate-200"
            >
              <Mail className="w-5 h-5" />
              support@com.rich
            </a>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default SupportNew;
