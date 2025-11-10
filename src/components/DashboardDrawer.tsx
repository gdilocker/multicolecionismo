import { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useDrawer } from '../contexts/DrawerContext';

const UserDashboard = lazy(() => import('../pages/UserDashboard'));

interface DashboardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  returnUrl?: string;
  returnPageName?: string;
}

export function DashboardDrawer({ isOpen, onClose, returnUrl = '/', returnPageName = 'Perfil' }: DashboardDrawerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { setDrawerState } = useDrawer();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsVisible(true);
      setDrawerState(true, returnUrl, returnPageName);
    } else {
      document.body.style.overflow = '';
      setDrawerState(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, returnUrl, returnPageName, setDrawerState]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible && !isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={handleBackdropClick}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-[90vw] lg:w-[85vw] xl:w-[80vw] bg-white z-[9999] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex-1 overflow-y-auto">
              <Suspense
                fallback={
                  <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mb-4" />
                    <p className="text-gray-600 text-lg font-medium">Carregando dashboard...</p>
                  </div>
                }
              >
                <UserDashboard />
              </Suspense>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
