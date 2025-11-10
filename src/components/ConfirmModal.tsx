import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmBtn: 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/30'
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
        };
      default:
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmBtn: 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{
                duration: 0.3,
                ease: [0.34, 1.56, 0.64, 1],
                scale: { type: 'spring', stiffness: 300, damping: 25 }
              }}
              className="relative w-full max-w-md"
            >
              <div className="relative bg-gradient-to-b from-white to-slate-50/50 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 backdrop-blur-xl">
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${styles.confirmBtn.split(' ')[0]}`} />

                <motion.button
                  whileHover={{ scale: 1.15, rotate: 90 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2.5 hover:bg-slate-100 rounded-xl transition-all z-10 group shadow-sm hover:shadow"
                >
                  <X className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </motion.button>

                <div className="p-8 pb-6">
                  <div className="flex items-start gap-5">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.2,
                        type: 'spring',
                        stiffness: 200,
                        damping: 15
                      }}
                      className={`flex-shrink-0 w-16 h-16 ${styles.iconBg} rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white`}
                    >
                      <AlertTriangle className={`w-8 h-8 ${styles.iconColor}`} />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                      className="flex-1 pt-1.5"
                    >
                      <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                        {title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed text-base">
                        {message}
                      </p>
                    </motion.div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-gradient-to-br from-slate-50 via-slate-50/50 to-white px-8 py-6 flex items-center justify-end gap-3 border-t border-slate-200/80"
                >
                  <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onClose}
                    className="px-7 py-3.5 text-slate-700 font-semibold rounded-xl hover:bg-white border-2 border-slate-300 transition-all shadow-sm hover:shadow-md hover:border-slate-400"
                  >
                    {cancelText}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={`px-7 py-3.5 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all ${styles.confirmBtn}`}
                  >
                    {confirmText}
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
