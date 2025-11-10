import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Bell, Shield, Save, Check } from 'lucide-react';
import { PanelLayout } from '../components/PanelLayout';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface CommunicationPrefs {
  email_enabled: boolean;
  email_address: string | null;
  whatsapp_enabled: boolean;
  whatsapp_number: string | null;
  push_enabled: boolean;
  renewal_reminders: boolean;
  payment_alerts: boolean;
  domain_lifecycle: boolean;
  security_alerts: boolean;
  marketing_updates: boolean;
  reminder_days_before: number[];
  gdpr_consent: boolean;
  lgpd_consent: boolean;
}

export default function CommunicationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<CommunicationPrefs>({
    email_enabled: true,
    email_address: null,
    whatsapp_enabled: false,
    whatsapp_number: null,
    push_enabled: true,
    renewal_reminders: true,
    payment_alerts: true,
    domain_lifecycle: true,
    security_alerts: true,
    marketing_updates: false,
    reminder_days_before: [14, 7, 3, 1],
    gdpr_consent: false,
    lgpd_consent: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('communication_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPrefs({
          email_enabled: data.email_enabled,
          email_address: data.email_address,
          whatsapp_enabled: data.whatsapp_enabled,
          whatsapp_number: data.whatsapp_number,
          push_enabled: data.push_enabled,
          renewal_reminders: data.renewal_reminders,
          payment_alerts: data.payment_alerts,
          domain_lifecycle: data.domain_lifecycle,
          security_alerts: data.security_alerts,
          marketing_updates: data.marketing_updates,
          reminder_days_before: data.reminder_days_before || [14, 7, 3, 1],
          gdpr_consent: data.gdpr_consent,
          lgpd_consent: data.lgpd_consent
        });
      } else {
        // Set email from auth
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user?.email) {
          setPrefs(prev => ({ ...prev, email_address: userData.user!.email }));
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const { error } = await supabase
        .from('communication_preferences')
        .upsert({
          user_id: user!.id,
          ...prefs,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Erro ao salvar preferências. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PanelLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </PanelLayout>
    );
  }

  return (
    <PanelLayout>
      <PageHeader
        title="Preferências de Comunicação"
        subtitle="Configure como e quando você deseja ser notificado"
      />

      <div className="max-w-4xl space-y-6">
        {/* Channels */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            Canais de Comunicação
          </h3>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                checked={prefs.email_enabled}
                onChange={(e) => setPrefs({ ...prefs, email_enabled: e.target.checked })}
                className="mt-1 w-5 h-5 text-blue-600 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <h4 className="font-semibold text-slate-900">E-mail</h4>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Receba notificações importantes sobre seus domínios e pagamentos.
                </p>
                <input
                  type="email"
                  value={prefs.email_address || ''}
                  onChange={(e) => setPrefs({ ...prefs, email_address: e.target.value })}
                  disabled={!prefs.email_enabled}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                checked={prefs.whatsapp_enabled}
                onChange={(e) => setPrefs({ ...prefs, whatsapp_enabled: e.target.checked })}
                className="mt-1 w-5 h-5 text-green-600 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  <h4 className="font-semibold text-slate-900">WhatsApp</h4>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Em breve
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Alertas urgentes sobre vencimentos e suspensões (apenas transacionais).
                </p>
                <input
                  type="tel"
                  value={prefs.whatsapp_number || ''}
                  onChange={(e) => setPrefs({ ...prefs, whatsapp_number: e.target.value })}
                  disabled={!prefs.whatsapp_enabled}
                  placeholder="+55 11 99999-9999"
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Push Notifications */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                checked={prefs.push_enabled}
                onChange={(e) => setPrefs({ ...prefs, push_enabled: e.target.checked })}
                className="mt-1 w-5 h-5 text-purple-600 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-5 h-5 text-purple-500" />
                  <h4 className="font-semibold text-slate-900">Notificações no Painel</h4>
                </div>
                <p className="text-sm text-slate-600">
                  Alertas visuais dentro do painel quando você estiver logado.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Tipos de Notificação
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.renewal_reminders}
                onChange={(e) => setPrefs({ ...prefs, renewal_reminders: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <div>
                <p className="font-semibold text-slate-900">Lembretes de Renovação</p>
                <p className="text-sm text-slate-600">
                  Avisos antes do vencimento do seu domínio
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.payment_alerts}
                onChange={(e) => setPrefs({ ...prefs, payment_alerts: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <div>
                <p className="font-semibold text-slate-900">Alertas de Pagamento</p>
                <p className="text-sm text-slate-600">
                  Confirmações de pagamento, falhas e cobranças
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.domain_lifecycle}
                onChange={(e) => setPrefs({ ...prefs, domain_lifecycle: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <div>
                <p className="font-semibold text-slate-900">Ciclo de Vida do Domínio</p>
                <p className="text-sm text-slate-600">
                  Grace period, resgate, leilão e outros status
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.security_alerts}
                onChange={(e) => setPrefs({ ...prefs, security_alerts: e.target.checked })}
                disabled
                className="w-5 h-5 text-red-600 rounded disabled:cursor-not-allowed"
              />
              <div>
                <p className="font-semibold text-slate-900 flex items-center gap-2">
                  Alertas de Segurança
                  <Shield className="w-4 h-4 text-red-500" />
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    Obrigatório
                  </span>
                </p>
                <p className="text-sm text-slate-600">
                  Bloqueios, fraude, chargebacks (não pode ser desativado)
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.marketing_updates}
                onChange={(e) => setPrefs({ ...prefs, marketing_updates: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <div>
                <p className="font-semibold text-slate-900">Novidades e Promoções</p>
                <p className="text-sm text-slate-600">
                  Atualizações sobre novos recursos e ofertas exclusivas
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Reminder Schedule */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Cronograma de Lembretes
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Escolha quando deseja receber lembretes antes do vencimento:
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[14, 7, 3, 1].map((days) => (
              <label
                key={days}
                className="flex items-center gap-2 p-3 border-2 border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={prefs.reminder_days_before.includes(days)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPrefs({
                        ...prefs,
                        reminder_days_before: [...prefs.reminder_days_before, days].sort((a, b) => b - a)
                      });
                    } else {
                      setPrefs({
                        ...prefs,
                        reminder_days_before: prefs.reminder_days_before.filter(d => d !== days)
                      });
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-slate-900">
                  {days} {days === 1 ? 'dia' : 'dias'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Privacy & Compliance */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacidade e Consentimento
          </h3>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.gdpr_consent}
                onChange={(e) => setPrefs({ ...prefs, gdpr_consent: e.target.checked })}
                className="mt-1 w-5 h-5 text-blue-600 rounded"
              />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Consentimento GDPR</p>
                <p>
                  Autorizo o processamento dos meus dados pessoais conforme a{' '}
                  <a href="/privacy" className="underline font-medium">
                    Política de Privacidade
                  </a>
                  .
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.lgpd_consent}
                onChange={(e) => setPrefs({ ...prefs, lgpd_consent: e.target.checked })}
                className="mt-1 w-5 h-5 text-blue-600 rounded"
              />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Consentimento LGPD</p>
                <p>
                  Autorizo o tratamento dos meus dados pessoais conforme a Lei Geral de Proteção de Dados (Brasil).
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4">
          {saved && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-green-600"
            >
              <Check className="w-5 h-5" />
              <span className="font-medium">Salvo com sucesso!</span>
            </motion.div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Preferências
              </>
            )}
          </button>
        </div>
      </div>
    </PanelLayout>
  );
}
