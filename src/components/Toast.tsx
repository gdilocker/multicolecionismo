import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      icon: Check,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      bgGradient: 'from-emerald-50 to-white',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-900',
      accentBar: 'bg-emerald-500',
    },
    error: {
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      bgGradient: 'from-red-50 to-white',
      borderColor: 'border-red-200',
      textColor: 'text-red-900',
      accentBar: 'bg-red-500',
    },
    warning: {
      icon: AlertCircle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      bgGradient: 'from-amber-50 to-white',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-900',
      accentBar: 'bg-amber-500',
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      bgGradient: 'from-blue-50 to-white',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900',
      accentBar: 'bg-blue-500',
    },
  };

  const { icon: Icon, iconBg, iconColor, bgGradient, borderColor, textColor, accentBar } = config[type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
        className="fixed top-6 right-6 z-50 max-w-md"
      >
        <div className={`relative bg-gradient-to-br ${bgGradient} border ${borderColor} rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm`}>
          <div className={`absolute top-0 left-0 right-0 h-1 ${accentBar}`} />

          <div className="p-5">
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className={`flex-shrink-0 w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center shadow-md`}
              >
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="flex-1 pt-1"
              >
                <p className={`font-semibold ${textColor} leading-relaxed text-[15px]`}>
                  {message}
                </p>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 hover:bg-slate-200/50 rounded-lg transition-all flex items-center justify-center group"
              >
                <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </motion.button>
            </div>
          </div>

          {duration > 0 && (
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              className={`h-1 ${accentBar} origin-left`}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
