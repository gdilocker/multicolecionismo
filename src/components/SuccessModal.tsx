import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Crown, Sparkles, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  isAdmin?: boolean;
  domain?: string;
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  isAdmin = false,
  domain
}: SuccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header with gradient */}
            <div className={`relative p-8 text-center ${
              isAdmin
                ? 'bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600'
                : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600'
            }`}>
              {/* Animated background particles */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white/20 rounded-full"
                    initial={{
                      x: Math.random() * 400,
                      y: Math.random() * 200,
                      scale: 0
                    }}
                    animate={{
                      y: [null, Math.random() * -100],
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                  />
                ))}
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon with animation */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2
                }}
                className="relative inline-flex items-center justify-center mb-4"
              >
                {isAdmin ? (
                  <div className="relative">
                    <Crown className="w-20 h-20 text-white drop-shadow-lg" />
                    <motion.div
                      animate={{
                        rotate: 360,
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                        scale: { duration: 2, repeat: Infinity }
                      }}
                      className="absolute -top-2 -right-2"
                    >
                      <Sparkles className="w-8 h-8 text-yellow-200" />
                    </motion.div>
                  </div>
                ) : (
                  <CheckCircle2 className="w-20 h-20 text-white drop-shadow-lg" />
                )}
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-white mb-2"
              >
                {title}
              </motion.h2>

              {/* Domain name if provided */}
              {domain && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg"
                >
                  <p className="text-white font-semibold text-lg">
                    {domain}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Body */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="p-8"
            >
              <div className="space-y-4 text-center">
                {message.split('\n').map((line, index) => {
                  if (!line.trim()) return null;

                  const isSuccess = line.includes('✅');
                  const isBenefit = line.startsWith('•') || line.startsWith('-');

                  return (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className={`
                        ${isSuccess ? 'text-emerald-600 font-semibold text-lg' : ''}
                        ${isBenefit ? 'text-gray-700 text-left ml-4' : 'text-gray-600'}
                      `}
                    >
                      {line}
                    </motion.p>
                  );
                })}
              </div>

              {/* Benefits for admin */}
              {isAdmin && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border-2 border-amber-200"
                >
                  <div className="flex items-start gap-3">
                    <Crown className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                    <div className="space-y-2 text-sm text-gray-700">
                      <p className="font-semibold text-amber-900">Benefícios da Licença Vitalícia:</p>
                      <ul className="space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          <span>Sem custo de renovação</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          <span>Recursos premium ilimitados</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          <span>Suporte prioritário</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                onClick={onClose}
                className={`
                  mt-6 w-full py-3 px-6 rounded-xl font-semibold text-white
                  transition-all duration-200 shadow-lg
                  ${isAdmin
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                  }
                  hover:shadow-xl hover:scale-105 active:scale-95
                `}
              >
                Ir para o Dashboard
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
