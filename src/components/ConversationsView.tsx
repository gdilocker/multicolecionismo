import { useState, useEffect } from 'react';
import { MessageCircle, User, Clock, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Conversation {
  id: string;
  session_id: string;
  user_id: string | null;
  language: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  satisfaction_rating: number | null;
  feedback_text: string | null;
  message_count: number;
}

interface Message {
  id: string;
  sender: string;
  message_text: string;
  intent_detected: string | null;
  confidence_score: number | null;
  created_at: string;
}

export default function ConversationsView() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadConversations();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('chatbot_conversations')
        .select(`
          *,
          message_count:chatbot_messages(count)
        `)
        .order('started_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedConversations = data.map(conv => ({
        ...conv,
        message_count: conv.message_count?.[0]?.count || 0
      }));

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chatbot_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    return conv.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      ended: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: Clock },
      handed_off: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: User }
    };

    const badge = badges[status as keyof typeof badges] || badges.ended;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conversations List */}
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar conversa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Ativas
            </button>
            <button
              onClick={() => setStatusFilter('handed_off')}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                statusFilter === 'handed_off'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Handoffs
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[600px]">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Carregando conversas...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Nenhuma conversa encontrada
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left ${
                  selectedConversation?.id === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {conv.session_id.substring(0, 20)}...
                    </span>
                  </div>
                  {getStatusBadge(conv.status)}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>{formatDate(conv.started_at)}</span>
                  <span className="font-medium">{conv.message_count} msgs</span>
                </div>
                {conv.satisfaction_rating && (
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={`text-xs ${
                          star <= conv.satisfaction_rating! ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages Panel */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Conversa Completa
                </h3>
                {getStatusBadge(selectedConversation.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Iniciada:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {formatDate(selectedConversation.started_at)}
                  </span>
                </div>
                {selectedConversation.ended_at && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Finalizada:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {formatDate(selectedConversation.ended_at)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Idioma:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium uppercase">
                    {selectedConversation.language}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Mensagens:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {selectedConversation.message_count}
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[600px] p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-xs opacity-70">
                      {message.sender === 'user' ? (
                        <User className="w-3 h-3" />
                      ) : (
                        <MessageCircle className="w-3 h-3" />
                      )}
                      <span className="font-medium">{message.sender === 'user' ? 'Usuário' : 'Bot'}</span>
                      <span className="text-[10px]">
                        {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                    {message.intent_detected && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs">
                        <span className="opacity-70">Intent:</span> {message.intent_detected}
                        {message.confidence_score && (
                          <span className="ml-2 opacity-70">
                            ({(message.confidence_score * 100).toFixed(0)}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedConversation.feedback_text && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                  Feedback do usuário:
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  {selectedConversation.feedback_text}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full p-12 text-center">
            <div>
              <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Selecione uma conversa para visualizar os detalhes
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
