import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Info, CheckCircle, AlertCircle } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'error'
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          accentBar: 'bg-red-500',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          accentBar: 'bg-amber-500',
          buttonColor: 'bg-amber-600 hover:bg-amber-700'
        };
      case 'info':
        return {
          icon: Info,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          accentBar: 'bg-blue-500',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'success':
        return {
          icon: CheckCircle,
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          accentBar: 'bg-emerald-500',
          buttonColor: 'bg-emerald-600 hover:bg-emerald-700'
        };
      default:
        return {
          icon: AlertTriangle,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          accentBar: 'bg-red-500',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
    }
  };

  const styles = getTypeStyles();
  const Icon = styles.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25
              }}
              className="relative w-full max-w-md"
            >
              <div className="relative bg-gradient-to-b from-white to-slate-50/50 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80">
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${styles.accentBar}`} />

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="absolute top-5 right-5 p-2 hover:bg-slate-100 rounded-xl transition-all group"
                >
                  <X className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </motion.button>

                <div className="p-8">
                  <div className="flex items-start gap-5">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.15,
                        type: 'spring',
                        stiffness: 200,
                        damping: 15
                      }}
                      className={`flex-shrink-0 w-16 h-16 ${styles.iconBg} rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white`}
                    >
                      <Icon className={`w-8 h-8 ${styles.iconColor}`} />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex-1 pt-1.5"
                    >
                      <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                        {title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed text-base whitespace-pre-line">
                        {message}
                      </p>
                    </motion.div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-slate-50 via-slate-50/50 to-white px-8 py-6 flex items-center justify-end border-t border-slate-200/80"
                >
                  <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onClose}
                    className={`px-8 py-3.5 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all ${styles.buttonColor}`}
                  >
                    OK
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

export default AlertModal;
