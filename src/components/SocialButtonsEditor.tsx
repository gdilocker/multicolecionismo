import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Eye, EyeOff, Save, Instagram, Twitter, Linkedin, Github, Youtube, Facebook, MessageCircle, Send, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialButton {
  id: string;
  platform: string;
  url: string;
  username: string | null;
  position: number;
  is_visible: boolean;
}

interface SocialButtonsEditorProps {
  profileId: string;
}

const socialPlatforms = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, placeholder: '@seu_usuario', color: '#E4405F' },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, placeholder: '@seu_usuario', color: '#1DA1F2' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, placeholder: '/in/seu_perfil', color: '#0A66C2' },
  { id: 'github', name: 'GitHub', icon: Github, placeholder: '@seu_usuario', color: '#181717' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, placeholder: '@seu_canal', color: '#FF0000' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, placeholder: '/seu_perfil', color: '#1877F2' },
  { id: 'tiktok', name: 'TikTok', icon: Music, placeholder: '@seu_usuario', color: '#000000' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, placeholder: '5511999999999', color: '#25D366' },
  { id: 'telegram', name: 'Telegram', icon: Send, placeholder: '@seu_usuario', color: '#0088CC' },
];

export default function SocialButtonsEditor({ profileId }: SocialButtonsEditorProps) {
  const [buttons, setButtons] = useState<SocialButton[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    loadButtons();
  }, [profileId]);

  const loadButtons = async () => {
    try {
      const { data, error } = await supabase
        .from('social_buttons')
        .select('*')
        .eq('profile_id', profileId)
        .order('position', { ascending: true });

      if (error) throw error;
      setButtons(data || []);
    } catch (error) {
      console.error('Error loading social buttons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddButton = async (platform: string) => {
    const platformData = socialPlatforms.find(p => p.id === platform);
    if (!platformData) return;

    try {
      const { data, error } = await supabase
        .from('social_buttons')
        .insert([{
          profile_id: profileId,
          platform,
          url: '',
          username: null,
          position: buttons.length,
          is_visible: true,
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setButtons([...buttons, data]);
        setShowAddMenu(false);
      }
    } catch (error) {
      console.error('Error adding social button:', error);
    }
  };

  const handleUpdateButton = async (id: string, updates: Partial<SocialButton>) => {
    try {
      const { error } = await supabase
        .from('social_buttons')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setButtons(buttons.map(btn =>
        btn.id === id ? { ...btn, ...updates } : btn
      ));
    } catch (error) {
      console.error('Error updating social button:', error);
    }
  };

  const handleDeleteButton = async (id: string) => {
    if (!confirm('Deseja realmente excluir este botão social?')) return;

    try {
      const { error } = await supabase
        .from('social_buttons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setButtons(buttons.filter(btn => btn.id !== id));
    } catch (error) {
      console.error('Error deleting social button:', error);
    }
  };

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    await handleUpdateButton(id, { is_visible: !isVisible });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Botões de Redes Sociais</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Ícones grandes para suas redes sociais</p>
        </div>
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      <AnimatePresence>
        {showAddMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 sm:p-5 border border-slate-200"
          >
            <p className="text-sm font-semibold text-slate-800 mb-4">Escolha uma rede social:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {socialPlatforms
                .filter(platform => !buttons.some(btn => btn.platform === platform.id))
                .map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <button
                      key={platform.id}
                      onClick={() => handleAddButton(platform.id)}
                      className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 sm:p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-sm hover:shadow-md"
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-slate-900 font-semibold text-center">{platform.name}</span>
                    </button>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {buttons.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 mb-2">Nenhum botão social adicionado</p>
          <p className="text-sm text-slate-500">Clique em "Adicionar" para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {buttons.map((button) => {
            const platformData = socialPlatforms.find(p => p.id === button.platform);
            if (!platformData) return null;

            const Icon = platformData.icon;

            return (
              <motion.div
                key={button.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: platformData.color }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-slate-800 font-semibold">{platformData.name}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleVisibility(button.id, button.is_visible)}
                          className={`p-2 rounded-lg transition-all ${
                            button.is_visible
                              ? 'bg-slate-800 text-white hover:bg-slate-900'
                              : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                          }`}
                          title={button.is_visible ? 'Visível' : 'Oculto'}
                        >
                          {button.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => handleDeleteButton(button.id)}
                          className="p-2 bg-slate-200 text-slate-500 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          Username/Identificador
                        </label>
                        <input
                          type="text"
                          value={button.username || ''}
                          onChange={(e) => handleUpdateButton(button.id, { username: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                          placeholder={platformData.placeholder}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          URL Completa
                        </label>
                        <input
                          type="url"
                          value={button.url}
                          onChange={(e) => handleUpdateButton(button.id, { url: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
