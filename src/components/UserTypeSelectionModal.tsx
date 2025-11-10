import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Store, Heart, MessageCircle, Share2, Globe, TrendingUp, X } from 'lucide-react';

interface UserTypeSelectionModalProps {
  isOpen: boolean;
  onSelect: (type: 'social' | 'member') => Promise<void>;
}

export const UserTypeSelectionModal: React.FC<UserTypeSelectionModalProps> = ({
  isOpen,
  onSelect
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'social' | 'member' | null>(null);

  const handleSelect = async (type: 'social' | 'member') => {
    setLoading(true);
    setSelectedType(type);
    try {
      await onSelect(type);
    } catch (error) {
      console.error('Error selecting user type:', error);
      setLoading(false);
      setSelectedType(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
              <h2 className="text-3xl font-bold mb-2">Bem-vindo ao Multicolecionismo!</h2>
              <p className="text-blue-100 text-lg">Como você gostaria de usar a plataforma?</p>
            </div>

            {/* Options */}
            <div className="p-8 grid md:grid-cols-2 gap-6">
              {/* Social User Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect('social')}
                disabled={loading}
                className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                  selectedType === 'social'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {selectedType === 'social' && (
                  <div className="absolute top-4 right-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Usuário Social</h3>
                </div>

                <p className="text-gray-600 mb-4">
                  Quero apenas participar da rede social para curtir, comentar e compartilhar conteúdos.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>Curtir posts e coleções</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <span>Comentar e interagir</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Share2 className="w-4 h-4 text-green-500" />
                    <span>Compartilhar conteúdos</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    ✓ Acesso gratuito e ilimitado
                  </p>
                </div>
              </motion.button>

              {/* Member Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect('member')}
                disabled={loading}
                className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                  selectedType === 'member'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {selectedType === 'member' && (
                  <div className="absolute top-4 right-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent" />
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Store className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Membro Premium</h3>
                </div>

                <p className="text-gray-600 mb-4">
                  Quero criar meu domínio personalizado, loja e perfil profissional.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Globe className="w-4 h-4 text-purple-500" />
                    <span>Domínio personalizado</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Store className="w-4 h-4 text-purple-500" />
                    <span>Loja profissional</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span>Programa de afiliados</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    ✓ 7 dias de teste grátis
                  </p>
                </div>
              </motion.button>
            </div>

            {/* Footer */}
            <div className="px-8 pb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Não se preocupe!</strong> Você pode mudar sua escolha a qualquer momento nas configurações da conta.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
