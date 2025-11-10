import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles } from 'lucide-react';
import { profileTemplates, templateCategories, ProfileTemplate } from '../data/profileTemplates';

interface TemplateSelectorProps {
  onSelect: (template: ProfileTemplate) => void;
  onClose: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const filteredTemplates = selectedCategory === 'Todos'
    ? profileTemplates
    : profileTemplates.filter(t => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Escolha um Template</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-blue-100">
            Comece rápido com um template profissional pronto
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="flex flex-wrap gap-2 mb-6">
            {templateCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  onHoverStart={() => setHoveredTemplate(template.id)}
                  onHoverEnd={() => setHoveredTemplate(null)}
                  onClick={() => onSelect(template)}
                  className="relative cursor-pointer group"
                >
                  <div className="relative h-64 rounded-xl overflow-hidden border-2 border-gray-200 group-hover:border-blue-500 transition-colors">
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center p-6"
                      style={{
                        background: template.theme.background_gradient || template.theme.background_color,
                        color: template.theme.text_color
                      }}
                    >
                      <div className="text-6xl mb-4">{template.avatar}</div>
                      <div className="text-lg font-bold mb-2 text-center">{template.name}</div>
                      <div className="text-sm text-center opacity-80 line-clamp-2">{template.bio}</div>

                      <div className="mt-4 space-y-2 w-full">
                        {template.links.slice(0, 3).map((link, index) => (
                          <div
                            key={index}
                            className={`px-4 py-2 text-sm rounded-lg text-center ${
                              template.theme.button_style === 'outline'
                                ? 'border-2'
                                : template.theme.button_style === 'rounded'
                                ? 'bg-white bg-opacity-20'
                                : 'bg-white bg-opacity-30'
                            }`}
                          >
                            {link.title}
                          </div>
                        ))}
                      </div>
                    </div>

                    {hoveredTemplate === template.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-blue-600 bg-opacity-95 flex items-center justify-center p-6"
                      >
                        <div className="text-center text-white">
                          <Check className="w-12 h-12 mx-auto mb-3" />
                          <div className="font-bold mb-2">Usar este Template</div>
                          <div className="text-sm text-blue-100">{template.description}</div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{template.name}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {template.category}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
