import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Clock, CheckCircle, Mail, Phone, User, Key } from 'lucide-react';

const Transfer: React.FC = () => {
  const [formData, setFormData] = useState({
    domain: '',
    authCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    acceptTerms: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">

      <div className="relative pt-32 pb-16">
        <motion.section
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16"
          initial="hidden"
          animate="show"
          variants={container}
        >
          <div className="text-center max-w-3xl mx-auto">
            <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full mb-6">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-300">Processo 100% Seguro</span>
            </motion.div>
            <motion.h1
              variants={item}
              className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight"
            >
              Transferência de
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-slate-800 bg-clip-text text-transparent">
                Domínio .com.rich
              </span>
            </motion.h1>
            <motion.p
              variants={item}
              className="text-xl text-slate-200/80 leading-relaxed"
            >
              Transfira seu domínio .com.rich para nós e aproveite preços competitivos com suporte excepcional
            </motion.p>
          </div>
        </motion.section>

        <motion.section
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Como Funciona</h2>
            <p className="text-xl text-blue-200/70">Processo simples em 4 etapas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Obtenha o Código', desc: 'Solicite o código de autorização do seu registrador atual' },
              { step: '2', title: 'Inicie a Transferência', desc: 'Preencha nosso formulário com os dados do domínio' },
              { step: '3', title: 'Confirme por Email', desc: 'Aprove a transferência através do email de confirmação' },
              { step: '4', title: 'Concluído', desc: 'Em até 7 dias seu domínio estará conosco' }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-900 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-900 rounded-full text-white text-xl font-bold mb-4 shadow-lg">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-blue-200/70 text-sm">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-slate-500 to-slate-900 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
              <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <h2 className="text-3xl font-bold text-white mb-6">Iniciar Transferência</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Domínio a Transferir</label>
                    <input
                      type="text"
                      name="domain"
                      value={formData.domain}
                      onChange={handleInputChange}
                      placeholder="exemplo.com.rich"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Código de Autorização</label>
                    <div className="relative">
                      <Key className="w-5 h-5 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="authCode"
                        value={formData.authCode}
                        onChange={handleInputChange}
                        placeholder="Código fornecido pelo registrador"
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        required
                      />
                    </div>
                    <p className="text-xs text-blue-200/60 mt-1">Solicite ao seu registrador atual</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">Nome</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">Sobrenome</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Telefone</label>
                    <div className="relative">
                      <Phone className="w-5 h-5 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 rounded border-white/10 bg-white/5 text-slate-900"
                      required
                    />
                    <label className="text-sm text-blue-200/80">
                      Concordo com os Termos de Uso e Política de Privacidade
                    </label>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting || !formData.acceptTerms}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-slate-500 to-slate-900 hover:from-slate-700 hover:to-slate-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/50 disabled:opacity-50"
                  >
                    Iniciar Transferência
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-900 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-white mb-4">Vantagens da Transferência</h3>
                  <div className="space-y-3">
                    {[
                      'Extensão gratuita por 1 ano',
                      'Migração completa de DNS',
                      'Suporte especializado',
                      'Zero tempo de inatividade',
                      'Preços competitivos'
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-slate-200/80">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-900 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Clock className="w-8 h-8 text-blue-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-semibold text-white">Prazo de Transferência</h4>
                      <p className="text-blue-400 font-medium">3 a 7 dias úteis</p>
                    </div>
                  </div>
                  <p className="text-blue-200/70 text-sm">
                    O prazo pode variar dependendo da aprovação pelo registrador atual e configurações do domínio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Transfer;
