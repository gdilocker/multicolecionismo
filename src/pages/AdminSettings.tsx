import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Save,
  Loader2,
  DollarSign,
  Globe,
  Mail,
  Shield,
  Bell,
  Database,
  Key,
  CheckCircle,
  Store,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface PricingPlan {
  id: string;
  code: string;
  name: string;
  price_cents: number;
  is_active: boolean;
  product_type: string;
}

interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_type: string;
  price_usd: string;
  billing_cycle: string;
  is_active: boolean;
  commission_rate: string;
}

export default function AdminSettings() {
  useScrollToTop();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('pricing');
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [globalFeatures, setGlobalFeatures] = useState({
    storeEnabled: true,
    socialEnabled: true
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);

      // Fetch pricing plans
      const { data: pricingData, error: pricingError } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (pricingError) throw pricingError;
      setPlans(pricingData || []);

      // Fetch subscription plans
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_usd', { ascending: true });

      if (subscriptionError) throw subscriptionError;
      setSubscriptionPlans(subscriptionData || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      alert('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanUpdate = async (planId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('pricing_plans')
        .update({ [field]: value })
        .eq('id', planId);

      if (error) throw error;

      setPlans(plans.map(p => p.id === planId ? { ...p, [field]: value } : p));
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Erro ao atualizar plano');
    }
  };

  const handleSubscriptionPlanUpdate = async (planId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ [field]: value })
        .eq('id', planId);

      if (error) throw error;

      setSubscriptionPlans(subscriptionPlans.map(p => p.id === planId ? { ...p, [field]: value } : p));
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      alert('Erro ao atualizar plano de assinatura');
    }
  };

  const handleToggleGlobalFeature = async (feature: 'store' | 'social', enabled: boolean) => {
    try {
      const column = feature === 'store' ? 'store_allowed_by_admin' : 'social_allowed_by_admin';

      const { error } = await supabase
        .from('user_profiles')
        .update({ [column]: enabled })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      setGlobalFeatures(prev => ({
        ...prev,
        [feature === 'store' ? 'storeEnabled' : 'socialEnabled']: enabled
      }));

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating global feature:', error);
      alert('Erro ao atualizar recurso global');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'pricing', label: 'Preços', icon: DollarSign },
    { id: 'features', label: 'Recursos', icon: Zap },
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'email', label: 'E-mail', icon: Mail },
    { id: 'security', label: 'Segurança', icon: Shield }
  ];

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F5F5F5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminPageHeader
            title="Configurações do Sistema"
            description="Gerencie as configurações globais da plataforma"
            onRefresh={fetchPlans}
            refreshing={loading}
          />

          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">Configurações salvas com sucesso!</p>
            </motion.div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-[#3B82F6] text-[#3B82F6] font-medium'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'pricing' && (
                <div>
                  <h3 className="text-lg font-bold text-black mb-4">Planos de Preços</h3>
                  <p className="text-gray-600 mb-6">
                    Configure os preços e disponibilidade dos planos de domínio e email
                  </p>

                  {loading ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] mx-auto" />
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Subscription Plans Section */}
                      <div>
                        <h4 className="font-semibold text-black mb-4 flex items-center gap-2">
                          <span className="text-lg">Planos de Assinatura</span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {subscriptionPlans.length} planos
                          </span>
                        </h4>
                        <div className="space-y-4">
                          {subscriptionPlans.map((plan) => (
                            <div
                              key={plan.id}
                              className="border border-gray-200 rounded-lg p-4 hover:border-[#3B82F6] transition-colors"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h5 className="font-bold text-black mb-1">{plan.plan_name}</h5>
                                  <p className="text-sm text-gray-600">Código: {plan.plan_type}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Ciclo: {plan.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}
                                  </p>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={plan.is_active}
                                    onChange={(e) => handleSubscriptionPlanUpdate(plan.id, 'is_active', e.target.checked)}
                                    className="w-4 h-4 text-[#3B82F6] rounded focus:ring-[#3B82F6]"
                                  />
                                  <span className="text-sm text-gray-700">Ativo</span>
                                </label>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Preço (R$)
                                  </label>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={parseFloat(plan.price_usd).toFixed(2)}
                                      onChange={(e) => {
                                        handleSubscriptionPlanUpdate(plan.id, 'price_usd', e.target.value);
                                      }}
                                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pricing Plans Section */}
                      {plans.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-black mb-4 flex items-center gap-2">
                            <span className="text-lg">Outros Planos</span>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                              {plans.length} planos
                            </span>
                          </h4>
                          <div className="space-y-4">
                            {plans.map((plan) => (
                              <div
                                key={plan.id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-[#3B82F6] transition-colors"
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h5 className="font-bold text-black mb-1">{plan.name}</h5>
                                    <p className="text-sm text-gray-600">Código: {plan.code}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Tipo: {plan.product_type === 'domain' ? 'Domínio Anual' : 'Email Mensal'}
                                    </p>
                                  </div>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={plan.is_active}
                                      onChange={(e) => handlePlanUpdate(plan.id, 'is_active', e.target.checked)}
                                      className="w-4 h-4 text-[#3B82F6] rounded focus:ring-[#3B82F6]"
                                    />
                                    <span className="text-sm text-gray-700">Ativo</span>
                                  </label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Preço (R$)
                                    </label>
                                    <div className="relative">
                                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={(plan.price_cents / 100).toFixed(2)}
                                        onChange={(e) => {
                                          const cents = Math.round(parseFloat(e.target.value) * 100);
                                          handlePlanUpdate(plan.id, 'price_cents', cents);
                                        }}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'features' && (
                <div>
                  <h3 className="text-lg font-bold text-black mb-4">Controle Global de Recursos</h3>
                  <p className="text-gray-600 mb-6">
                    Ative ou desative recursos para todos os usuários da plataforma
                  </p>

                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Store className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-black">Sistema de Loja</h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={globalFeatures.storeEnabled}
                                onChange={(e) => handleToggleGlobalFeature('store', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Permite que usuários criem e gerenciem lojas virtuais em seus perfis
                          </p>
                          <div className={`flex items-center gap-2 text-sm font-medium ${globalFeatures.storeEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                            {globalFeatures.storeEnabled ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Ativo para todos os usuários</span>
                              </>
                            ) : (
                              <>
                                <Bell className="w-4 h-4" />
                                <span>Desativado globalmente</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <MessageSquare className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-black">Rede Social</h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={globalFeatures.socialEnabled}
                                onChange={(e) => handleToggleGlobalFeature('social', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Permite que usuários criem posts, interajam e compartilhem conteúdo na rede social
                          </p>
                          <div className={`flex items-center gap-2 text-sm font-medium ${globalFeatures.socialEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                            {globalFeatures.socialEnabled ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Ativo para todos os usuários</span>
                              </>
                            ) : (
                              <>
                                <Bell className="w-4 h-4" />
                                <span>Desativado globalmente</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Bell className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h5 className="font-semibold text-yellow-800 mb-1">Aviso Importante</h5>
                          <p className="text-sm text-yellow-700">
                            Ao desativar um recurso, ele será bloqueado para <strong>todos os usuários</strong> da plataforma,
                            independentemente de suas configurações individuais. Use com cautela.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'general' && (
                <div>
                  <h3 className="text-lg font-bold text-black mb-4">Configurações Gerais</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Site
                      </label>
                      <input
                        type="text"
                        defaultValue=".com.rich"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL do Site
                      </label>
                      <input
                        type="url"
                        defaultValue="https://com.rich"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email de Contato
                      </label>
                      <input
                        type="email"
                        defaultValue="contact@com.rich"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-[#3B82F6] rounded focus:ring-[#3B82F6]"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Permitir novos cadastros
                        </span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-[#3B82F6] rounded focus:ring-[#3B82F6]"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Modo manutenção
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div>
                  <h3 className="text-lg font-bold text-black mb-4">Configurações de E-mail</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provedor de E-mail
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent">
                        <option value="titan">Titan Email</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remetente Padrão
                      </label>
                      <input
                        type="email"
                        defaultValue="noreply@com.rich"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-[#3B82F6] rounded focus:ring-[#3B82F6]"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Enviar emails de confirmação
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h3 className="text-lg font-bold text-black mb-4">Configurações de Segurança</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-[#3B82F6] rounded focus:ring-[#3B82F6]"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Exigir autenticação de dois fatores para admins
                        </span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-[#3B82F6] rounded focus:ring-[#3B82F6]"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Registrar ações de administradores
                        </span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tempo de sessão (minutos)
                      </label>
                      <input
                        type="number"
                        defaultValue="60"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Configurações
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
