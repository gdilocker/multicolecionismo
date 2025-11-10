import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ThumbsUp, ThumbsDown, User, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'bot' | 'human';
  text: string;
  timestamp: Date;
  intentDetected?: string;
  confidenceScore?: number;
}

interface QuickReply {
  text: string;
  action?: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(sid);

    loadChatbotSettings();
    detectLanguage();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatbotSettings = async () => {
    try {
      const { data: settings } = await supabase
        .from('chatbot_settings')
        .select('*')
        .in('key', ['enabled', 'quick_replies', `welcome_message_${language}`]);

      if (settings) {
        const enabledSetting = settings.find(s => s.key === 'enabled');
        if (enabledSetting) {
          setIsEnabled(enabledSetting.value === true);
        } else {
          setIsEnabled(true);
        }

        const quickRepliesSetting = settings.find(s => s.key === 'quick_replies');
        if (quickRepliesSetting && Array.isArray(quickRepliesSetting.value)) {
          setQuickReplies(quickRepliesSetting.value.map((text: string) => ({ text })));
        }
      } else {
        setIsEnabled(true);
      }
    } catch (error) {
      console.error('Error loading chatbot settings:', error);
      setIsEnabled(true);
    }
  };

  const detectLanguage = () => {
    const userLang = navigator.language.toLowerCase();
    if (userLang.startsWith('en')) {
      setLanguage('en');
    } else {
      setLanguage('pt');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .insert({
          session_id: sessionId,
          user_id: user?.id || null,
          language,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const saveMessage = async (sender: 'user' | 'bot', text: string, intentDetected?: string, confidence?: number) => {
    if (!conversationId) return;

    try {
      const { error } = await supabase
        .from('chatbot_messages')
        .insert({
          conversation_id: conversationId,
          sender,
          message_text: text,
          intent_detected: intentDetected,
          confidence_score: confidence,
          language
        });

      if (error) throw error;

      await supabase.rpc('log_chatbot_metric', {
        p_metric_name: 'total_messages',
        p_metric_value: 1,
        p_dimension: { language, sender }
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const processWithEdgeFunction = async (userMessage: string): Promise<{ intent: string; response: string; confidence: number; knowledgeBase?: any[] } | null> => {
    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot-process`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          language,
          conversationId,
          userId: user?.id
        })
      });

      if (!response.ok) {
        throw new Error('Edge function failed');
      }

      const data = await response.json();

      return {
        intent: data.intent,
        response: data.response,
        confidence: data.confidence,
        knowledgeBase: data.knowledgeBase
      };
    } catch (error) {
      console.error('Error calling edge function:', error);
      return null;
    }
  };

  const detectIntent = async (userMessage: string): Promise<{ intent: string; response: string; confidence: number } | null> => {
    try {
      const { data: intents } = await supabase
        .from('chatbot_intents')
        .select('*')
        .eq('enabled', true)
        .eq('language', language)
        .order('priority', { ascending: false });

      if (!intents || intents.length === 0) return null;

      const normalizedMessage = userMessage.toLowerCase().trim();

      for (const intent of intents) {
        const patterns = intent.patterns as string[];

        for (const pattern of patterns) {
          if (normalizedMessage.includes(pattern.toLowerCase())) {
            const responses = intent.responses as string[];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            return {
              intent: intent.name,
              response: randomResponse,
              confidence: 0.85
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error detecting intent:', error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !isEnabled) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    if (!conversationId) {
      const newConvId = await createConversation();
      if (newConvId) {
        setConversationId(newConvId);
      }
    }

    await saveMessage('user', userMessage.text);

    setTimeout(async () => {
      let intentResult = await processWithEdgeFunction(userMessage.text);

      if (!intentResult) {
        intentResult = await detectIntent(userMessage.text);
      }

      let botResponse: Message;

      if (intentResult && intentResult.confidence > 0.3) {
        botResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: intentResult.response,
          timestamp: new Date(),
          intentDetected: intentResult.intent,
          confidenceScore: intentResult.confidence
        };

        if (intentResult.intent === 'handoff_request' || intentResult.intent === 'handoff_request_en') {
          await createHandoff(userMessage.text);
        }
      } else {
        const defaultResponses = language === 'pt'
          ? [
              'Desculpe, não entendi sua pergunta. Pode reformular?',
              'Não tenho certeza sobre isso. Que tal falar com um atendente humano?',
              'Não consegui processar sua pergunta. Posso te ajudar com:\n• Domínios\n• Planos\n• Loja\n• Social\n• Afiliados'
            ]
          : [
              'Sorry, I did not understand your question. Can you rephrase?',
              'I am not sure about that. How about talking to a human agent?',
              'I could not process your question. I can help with:\n• Domains\n• Plans\n• Store\n• Social\n• Affiliates'
            ];

        botResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
          timestamp: new Date(),
          confidenceScore: 0.2
        };
      }

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
      await saveMessage('bot', botResponse.text, botResponse.intentDetected, botResponse.confidenceScore);

      if (botResponse.confidenceScore && botResponse.confidenceScore < 0.5) {
        setShowFeedback(botResponse.id);
      }
    }, 1000 + Math.random() * 1000);
  };

  const createHandoff = async (userMessage: string) => {
    if (!conversationId) return;

    try {
      await supabase
        .from('chatbot_handoffs')
        .insert({
          conversation_id: conversationId,
          reason: 'User requested human support',
          user_message: userMessage
        });

      await supabase
        .from('chatbot_conversations')
        .update({ status: 'handed_off' })
        .eq('id', conversationId);

      await supabase.rpc('log_chatbot_metric', {
        p_metric_name: 'handoffs',
        p_metric_value: 1,
        p_dimension: { language }
      });
    } catch (error) {
      console.error('Error creating handoff:', error);
    }
  };

  const handleQuickReply = (reply: QuickReply) => {
    setInputText(reply.text);
  };

  const handleFeedback = async (messageId: string, helpful: boolean) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !conversationId) return;

    try {
      const { data: dbMessage } = await supabase
        .from('chatbot_messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('message_text', message.text)
        .eq('sender', 'bot')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (dbMessage) {
        await supabase
          .from('chatbot_feedback')
          .insert({
            message_id: dbMessage.id,
            conversation_id: conversationId,
            helpful
          });

        setShowFeedback(null);
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const openChat = async () => {
    setIsOpen(true);

    if (messages.length === 0) {
      const welcomeMessage = language === 'pt'
        ? 'Olá! 👋 Sou o assistente virtual da .com.rich. Como posso ajudar você hoje?'
        : 'Hello! 👋 I am the .com.rich virtual assistant. How can I help you today?';

      const botMessage: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        text: welcomeMessage,
        timestamp: new Date()
      };

      setMessages([botMessage]);

      const newConvId = await createConversation();
      if (newConvId) {
        setConversationId(newConvId);
        await saveMessage('bot', welcomeMessage, 'greetings');
      }
    }
  };

  const closeChat = async () => {
    setIsOpen(false);

    if (conversationId) {
      await supabase
        .from('chatbot_conversations')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', conversationId);
    }
  };

  if (!isEnabled) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={openChat}
          className="group relative bg-white text-slate-800 rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-slate-200"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6 transition-colors" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl w-96 h-[600px] flex flex-col overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-white p-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-slate-100 p-2.5 rounded-full">
                  <MessageCircle className="w-4 h-4 text-slate-700" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  Assistente .com.rich
                </h3>
                <p className="text-xs text-slate-500">Online</p>
              </div>
            </div>
            <button
              onClick={closeChat}
              className="hover:bg-slate-100 p-2 rounded-lg transition-all text-slate-400 hover:text-slate-600"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    message.sender === 'user'
                      ? 'bg-slate-900 text-white'
                      : message.sender === 'bot'
                      ? 'bg-white text-slate-800 border border-slate-200 shadow-sm'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  }`}
                >
                  {message.sender !== 'user' && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {message.sender === 'bot' ? (
                        <Sparkles className="w-3 h-3 text-slate-500" />
                      ) : (
                        <User className="w-3 h-3 text-emerald-600" />
                      )}
                      <span className="font-medium text-[10px] text-slate-500">{message.sender === 'bot' ? 'Bot' : 'Atendente'}</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
                  {showFeedback === message.id && message.sender === 'bot' && (
                    <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-slate-100">
                      <span className="text-xs text-slate-500">Foi útil?</span>
                      <button
                        onClick={() => handleFeedback(message.id, true)}
                        className="hover:scale-110 transition-transform text-slate-400 hover:text-emerald-600"
                        aria-label="Thumbs up"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, false)}
                        className="hover:scale-110 transition-transform text-slate-400 hover:text-slate-500"
                        aria-label="Thumbs down"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {quickReplies.length > 0 && messages.length <= 1 && (
            <div className="px-4 py-2 border-t border-slate-100 bg-white">
              <div className="flex flex-wrap gap-1.5">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="text-xs bg-slate-50 text-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-all border border-slate-200 font-medium"
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={language === 'pt' ? 'Digite sua mensagem...' : 'Type your message...'}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white text-slate-900 placeholder-slate-400 transition-all text-sm"
                maxLength={1000}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:cursor-not-allowed text-white disabled:text-slate-400 p-3 rounded-xl transition-all"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              {language === 'pt' ? 'Powered by .com.rich AI' : 'Powered by .com.rich AI'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
