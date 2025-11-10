import { useState, useEffect } from 'react';
import { MessageCircle, Settings, BarChart3, Users, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { PanelLayout } from '../components/PanelLayout';
import { useNavigate } from 'react-router-dom';
import ConversationsView from '../components/ConversationsView';

interface ChatbotSettings {
  enabled: boolean;
  rateLimit: number;
  maxMessageLength: number;
  handoffThreshold: number;
  gdprRetentionDays: number;
}

interface ChatbotStats {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  handoffs: number;
  averageSatisfaction: number;
  messagesPerConversation: number;
}

interface Intent {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  language: string;
  patterns: string[];
  responses: string[];
}

export default function AdminChatbot() {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'intents' | 'conversations'>('overview');
  const [settings, setSettings] = useState<ChatbotSettings>({
    enabled: true,
    rateLimit: 30,
    maxMessageLength: 1000,
    handoffThreshold: 0.3,
    gdprRetentionDays: 90
  });
  const [stats, setStats] = useState<ChatbotStats>({
    totalConversations: 0,
    activeConversations: 0,
    totalMessages: 0,
    handoffs: 0,
    averageSatisfaction: 0,
    messagesPerConversation: 0
  });
  const [intents, setIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        await loadStats();
      } else if (activeTab === 'settings') {
        await loadSettings();
      } else if (activeTab === 'intents') {
        await loadIntents();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    const { data } = await supabase
      .from('chatbot_settings')
      .select('*')
      .in('key', ['enabled', 'rate_limit_messages', 'max_message_length', 'handoff_threshold', 'gdpr_retention_days']);

    if (data) {
      const settingsObj: any = {};
      data.forEach(s => {
        if (s.key === 'enabled') settingsObj.enabled = s.value === true;
        if (s.key === 'rate_limit_messages') settingsObj.rateLimit = Number(s.value);
        if (s.key === 'max_message_length') settingsObj.maxMessageLength = Number(s.value);
        if (s.key === 'handoff_threshold') settingsObj.handoffThreshold = Number(s.value);
        if (s.key === 'gdpr_retention_days') settingsObj.gdprRetentionDays = Number(s.value);
      });
      setSettings(prev => ({ ...prev, ...settingsObj }));
    }
  };

  const loadStats = async () => {
    const { data: conversations } = await supabase
      .from('chatbot_conversations')
      .select('id, status');

    const { data: messages } = await supabase
      .from('chatbot_messages')
      .select('id');

    const { data: handoffs } = await supabase
      .from('chatbot_handoffs')
      .select('id');

    const { data: feedback } = await supabase
      .from('chatbot_feedback')
      .select('helpful');

    const totalConversations = conversations?.length || 0;
    const activeConversations = conversations?.filter(c => c.status === 'active').length || 0;
    const totalMessages = messages?.length || 0;
    const totalHandoffs = handoffs?.length || 0;

    let avgSatisfaction = 0;
    if (feedback && feedback.length > 0) {
      const helpfulCount = feedback.filter(f => f.helpful).length;
      avgSatisfaction = (helpfulCount / feedback.length) * 5;
    }

    setStats({
      totalConversations,
      activeConversations,
      totalMessages,
      handoffs: totalHandoffs,
      averageSatisfaction: avgSatisfaction,
      messagesPerConversation: totalConversations > 0 ? totalMessages / totalConversations : 0
    });
  };

  const loadIntents = async () => {
    const { data } = await supabase
      .from('chatbot_intents')
      .select('*')
      .order('priority', { ascending: false });

    if (data) {
      setIntents(data.map(intent => ({
        id: intent.id,
        name: intent.name,
        description: intent.description || '',
        enabled: intent.enabled,
        priority: intent.priority,
        language: intent.language,
        patterns: intent.patterns as string[],
        responses: intent.responses as string[]
      })));
    }
  };

  const saveSettings = async () => {
    try {
      const updates = [
        { key: 'enabled', value: settings.enabled },
        { key: 'rate_limit_messages', value: settings.rateLimit },
        { key: 'max_message_length', value: settings.maxMessageLength },
        { key: 'handoff_threshold', value: settings.handoffThreshold },
        { key: 'gdpr_retention_days', value: settings.gdprRetentionDays }
      ];

      for (const update of updates) {
        await supabase
          .from('chatbot_settings')
          .update({ value: update.value })
          .eq('key', update.key);
      }

      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar configurações');
    }
  };

  const toggleIntent = async (intentId: string, enabled: boolean) => {
    try {
      await supabase
        .from('chatbot_intents')
        .update({ enabled })
        .eq('id', intentId);

      setIntents(prev => prev.map(i => i.id === intentId ? { ...i, enabled } : i));
    } catch (error) {
      console.error('Error toggling intent:', error);
    }
  };

  return (
    <PanelLayout>
      <div className="p-6">
        <AdminPageHeader
          title="Gerenciamento de Chatbot"
          description="Configure e monitore o assistente virtual"
        />

        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Configurações
            </button>
            <button
              onClick={() => setActiveTab('intents')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'intents'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Intents
            </button>
            <button
              onClick={() => setActiveTab('conversations')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'conversations'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Conversas
            </button>
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total de Conversas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {stats.totalConversations}
                    </p>
                  </div>
                  <MessageCircle className="w-10 h-10 text-blue-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Conversas Ativas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {stats.activeConversations}
                    </p>
                  </div>
                  <Users className="w-10 h-10 text-green-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total de Mensagens</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {stats.totalMessages}
                    </p>
                  </div>
                  <MessageSquare className="w-10 h-10 text-purple-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Handoffs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {stats.handoffs}
                    </p>
                  </div>
                  <Users className="w-10 h-10 text-orange-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Satisfação Média
                </h3>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    {stats.averageSatisfaction.toFixed(1)}
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={`text-2xl ${
                          star <= stats.averageSatisfaction ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Mensagens por Conversa
                </h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {stats.messagesPerConversation.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Configurações do Chatbot
            </h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900 dark:text-white">
                    Chatbot Habilitado
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ativar ou desativar o chatbot globalmente
                  </p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block font-medium text-gray-900 dark:text-white mb-2">
                  Rate Limit (mensagens/minuto)
                </label>
                <input
                  type="number"
                  value={settings.rateLimit}
                  onChange={(e) => setSettings(prev => ({ ...prev, rateLimit: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-900 dark:text-white mb-2">
                  Tamanho Máximo de Mensagem (caracteres)
                </label>
                <input
                  type="number"
                  value={settings.maxMessageLength}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxMessageLength: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="100"
                  max="5000"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-900 dark:text-white mb-2">
                  Threshold para Handoff (0.0 - 1.0)
                </label>
                <input
                  type="number"
                  value={settings.handoffThreshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, handoffThreshold: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                  max="1"
                  step="0.1"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Confiança mínima antes de transferir para humano
                </p>
              </div>

              <div>
                <label className="block font-medium text-gray-900 dark:text-white mb-2">
                  Retenção GDPR (dias)
                </label>
                <input
                  type="number"
                  value={settings.gdprRetentionDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, gdprRetentionDays: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="30"
                  max="365"
                />
              </div>

              <button
                onClick={saveSettings}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        )}

        {activeTab === 'intents' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Idioma
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Prioridade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {intents.map((intent) => (
                    <tr key={intent.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {intent.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {intent.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {intent.language.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {intent.priority}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleIntent(intent.id, !intent.enabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            intent.enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              intent.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'conversations' && (
          <ConversationsView />
        )}
      </div>
    </PanelLayout>
  );
}
