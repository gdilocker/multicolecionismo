import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  Globe,
  Bell,
  LogOut,
  Save,
  CheckCircle,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { PanelLayout } from '../components/PanelLayout';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import { supabase } from '../lib/supabase';

const AccountSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+55 (11) 98765-4321',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    notifications: {
      email: true,
      security: true,
      billing: true
    }
  });

  const handleSave = () => {
    setSuccessMessage('Alterações salvas com sucesso!');
    setShowSuccess(true);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'EXCLUIR') {
      return;
    }

    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir conta');
      }

      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      setSuccessMessage('Erro ao excluir conta. Tente novamente.');
      setShowSuccess(true);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <PanelLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Configurações da Conta"
          subtitle="Gerencie suas informações pessoais e preferências"
          primaryAction={
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="btn-fluid inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl font-semibold shadow-sm hover:shadow-lg transition-all"
            >
              <Save className="w-5 h-5" />
              Salvar Alterações
            </motion.button>
          }
        />

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-[#60A5FA]" />
              Dados Pessoais
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/50 focus:border-[#60A5FA] transition-all"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/50 focus:border-[#60A5FA] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/50 focus:border-[#60A5FA] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
              <Lock className="w-6 h-6 text-[#60A5FA]" />
              Senha e Autenticação
            </h2>

            <div className="space-y-4">
              <button className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left">
                <div>
                  <p className="font-medium text-black">Alterar Senha</p>
                  <p className="text-sm text-[#6B7280]">Última alteração há 3 meses</p>
                </div>
                <Lock className="w-5 h-5 text-[#6B7280]" />
              </button>

              <button className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left">
                <div>
                  <p className="font-medium text-black">Autenticação de Dois Fatores (2FA)</p>
                  <p className="text-sm text-[#6B7280]">Adicione uma camada extra de segurança</p>
                </div>
                <Shield className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
              <Globe className="w-6 h-6 text-[#60A5FA]" />
              Preferências Regionais
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-2">
                  Idioma
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/50 focus:border-[#60A5FA] transition-all"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-2">
                  Fuso Horário
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/50 focus:border-[#60A5FA] transition-all"
                >
                  <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                  <option value="America/New_York">New York (GMT-5)</option>
                  <option value="Europe/London">London (GMT+0)</option>
                </select>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
              <Bell className="w-6 h-6 text-[#60A5FA]" />
              Notificações
            </h2>

            <div className="space-y-4">
              {[
                { key: 'email', label: 'Notificações por E-mail', desc: 'Receba atualizações importantes' },
                { key: 'security', label: 'Alertas de Segurança', desc: 'Notificações de atividades suspeitas' },
                { key: 'billing', label: 'Avisos de Cobrança', desc: 'Lembretes de renovação e faturas' }
              ].map((notif) => (
                <label key={notif.key} className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                  <div>
                    <p className="font-medium text-black">{notif.label}</p>
                    <p className="text-sm text-[#6B7280]">{notif.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notifications[notif.key as keyof typeof formData.notifications]}
                    onChange={(e) => setFormData({
                      ...formData,
                      notifications: {
                        ...formData.notifications,
                        [notif.key]: e.target.checked
                      }
                    })}
                    className="w-5 h-5 text-slate-900 border-slate-300 rounded focus:ring-2 focus:ring-slate-500/50"
                  />
                </label>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <LogOut className="w-6 h-6" />
              Sessão
            </h2>
            <p className="text-sm text-slate-900 mb-4">
              Encerre sua sessão atual neste dispositivo. Você poderá fazer login novamente a qualquer momento.
            </p>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Encerrar Sessão
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-slate-50 border-2 border-rose-300 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Zona de Perigo
            </h2>
            <div className="bg-slate-100 border border-rose-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-slate-900 font-medium mb-2">
                ⚠️ Atenção: Ação Irreversível
              </p>
              <p className="text-sm text-slate-800 mb-3">
                Ao excluir sua conta, todos os seus dados serão permanentemente removidos.
                Esta ação não pode ser desfeita e você perderá acesso a:
              </p>
              <ul className="text-sm text-slate-800 space-y-1 ml-4 list-disc">
                <li>Todos os seus domínios registrados</li>
                <li>Histórico de compras e transações</li>
                <li>Saldo e valores em conta</li>
                <li>Vínculos de afiliados e comissões</li>
                <li>Configurações e preferências</li>
              </ul>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Excluir Conta Permanentemente
            </button>
          </motion.div>
        </div>

        {showSuccess && (
          <Toast
            message={successMessage}
            type="success"
            onClose={() => setShowSuccess(false)}
          />
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Excluir Conta Permanentemente
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Esta ação é irreversível e não pode ser desfeita.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 border border-rose-200 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  O que será excluído:
                </h4>
                <ul className="text-sm text-slate-800 space-y-1 ml-6 list-disc">
                  <li>Todos os seus dados pessoais</li>
                  <li>Todos os domínios registrados</li>
                  <li>Histórico de compras e transações</li>
                  <li>Saldo em conta e valores acumulados</li>
                  <li>Vínculos de afiliados e comissões pendentes</li>
                  <li>Configurações e preferências</li>
                  <li>Acesso completo à plataforma</li>
                </ul>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Digite <span className="font-bold text-slate-600">EXCLUIR</span> para confirmar:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Digite EXCLUIR"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'EXCLUIR' || isDeleting}
                  className="flex-1 px-6 py-3 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Excluir Permanentemente
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PanelLayout>
  );
};

export default AccountSettings;
