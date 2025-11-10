import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Palette, Check, Crown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  preview_image: string | null;
  category: string;
  is_premium: boolean;
  background_type: string;
  background_value: any;
  button_style: string;
  font_family: string;
  link_color: string;
  link_opacity: number;
  button_text_color: string;
  custom_css: string | null;
}

interface ThemeTemplateSelectorProps {
  profileId: string;
  isEliteMember: boolean;
  onThemeApplied: (template: ThemeTemplate) => void;
  onClose: () => void;
}

export default function ThemeTemplateSelector({ profileId, isEliteMember, onThemeApplied, onClose }: ThemeTemplateSelectorProps) {
  const [templates, setTemplates] = useState<ThemeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const { data, error } = await supabase
        .from('profile_theme_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function applyTemplate(template: ThemeTemplate) {
    if (template.is_premium && !isEliteMember) {
      alert('Este tema é exclusivo para membros Elite/Supreme');
      return;
    }

    setApplyingTemplate(template.id);

    try {
      const { error: applyError } = await supabase
        .from('profile_applied_templates')
        .upsert({
          profile_id: profileId,
          template_id: template.id,
          applied_at: new Date().toISOString()
        });

      if (applyError) throw applyError;

      onThemeApplied(template);
      onClose();
    } catch (error: any) {
      console.error('Error applying template:', error);
      alert('Erro ao aplicar tema: ' + error.message);
    } finally {
      setApplyingTemplate(null);
    }
  }

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];
  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  function renderBackground(template: ThemeTemplate) {
    const bgValue = template.background_value;

    if (template.background_type === 'gradient') {
      return {
        background: `linear-gradient(${bgValue.direction || 'to bottom'}, ${bgValue.from}, ${bgValue.to})`
      };
    } else if (template.background_type === 'color') {
      return {
        backgroundColor: bgValue.value
      };
    }
    return {};
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Temas Prontos</h2>
              <p className="text-sm text-gray-600">Escolha um tema para sua página</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'Todos' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Carregando temas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div
                    className="h-32 relative flex items-center justify-center"
                    style={renderBackground(template)}
                  >
                    {template.is_premium && (
                      <div className="absolute top-2 right-2">
                        <Crown className="w-5 h-5 text-yellow-400" />
                      </div>
                    )}
                    <div
                      className="text-center px-4"
                      style={{
                        color: template.link_color,
                        fontFamily: template.font_family
                      }}
                    >
                      <div className="text-lg font-bold mb-2">Preview</div>
                      <div
                        className={`px-6 py-2 rounded-${template.button_style === 'pill' ? 'full' : template.button_style === 'square' ? 'none' : 'lg'} inline-block`}
                        style={{
                          backgroundColor: template.link_color,
                          color: template.button_text_color,
                          opacity: template.link_opacity
                        }}
                      >
                        Botão
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900">{template.name}</h3>
                      {template.is_premium && !isEliteMember && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {template.font_family}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded capitalize">
                        {template.category}
                      </span>
                    </div>
                    <button
                      onClick={() => applyTemplate(template)}
                      disabled={applyingTemplate === template.id || (template.is_premium && !isEliteMember)}
                      className={`w-full py-2 rounded-lg font-medium transition-colors ${
                        applyingTemplate === template.id
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : template.is_premium && !isEliteMember
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {applyingTemplate === template.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Aplicando...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" />
                          Aplicar Tema
                        </span>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum tema encontrado nesta categoria</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
