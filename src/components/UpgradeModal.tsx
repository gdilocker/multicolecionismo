import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Store, Globe, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, feature }) => {
  const navigate = useNavigate();

  const features = [
    { icon: Globe, text: 'Domínio personalizado profissional' },
    { icon: Store, text: 'Loja online completa' },
    { icon: Sparkles, text: 'Perfil público customizável' },
    { icon: Crown, text: 'Recursos premium exclusivos' }
  ];

  const handleUpgrade = () => {
    onClose();
    navigate('/valores');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <Crown className="w-12 h-12 mb-3" />
                <h2 className="text-2xl font-bold mb-2">
                  Upgrade para Membro Premium
                </h2>
                <p className="text-white/90">
                  {feature || 'Este recurso está disponível apenas para membros premium'}
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  <p className="text-gray-700 font-medium">
                    Desbloqueie todo o potencial da plataforma:
                  </p>
                  {features.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 text-gray-700"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-purple-600" />
                      </div>
                      <span>{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Trial Badge */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800 font-semibold text-center">
                    🎁 14 dias de teste grátis
                  </p>
                  <p className="text-green-700 text-sm text-center mt-1">
                    Experimente todos os recursos sem compromisso
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Agora não
                  </button>
                  <button
                    onClick={handleUpgrade}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg"
                  >
                    Ver Planos
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
