import { useState } from 'react';
import { Settings, Home, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SettingsButtonProps {
  isProfileOwner: boolean;
  onOpenDashboard: () => void;
  onOpenLogin: () => void;
}

export function SettingsButton({ isProfileOwner, onOpenDashboard, onOpenLogin }: SettingsButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!user) {
      onOpenLogin();
      return;
    }

    if (isProfileOwner) {
      onOpenDashboard();
      return;
    }

    setShowMenu(!showMenu);
  };

  const handleMyProfile = async () => {
    setShowMenu(false);
    try {
      const { data: profile } = await import('../lib/supabase').then(m =>
        m.supabase
          .from('user_profiles')
          .select('subdomain')
          .eq('user_id', user?.id)
          .maybeSingle()
      );

      if (profile) {
        navigate(`/${profile.subdomain}`);
      }
    } catch (error) {
      console.error('Error navigating to profile:', error);
    }
  };

  const handleMyDashboard = () => {
    setShowMenu(false);
    navigate('/panel/dashboard');
  };

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition-all border border-white/10 group"
        title={!user ? 'Fazer Login' : isProfileOwner ? 'Abrir Dashboard' : 'Configurações'}
      >
        <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        <span className="hidden sm:inline font-medium">
          {!user ? 'Login' : isProfileOwner ? 'Dashboard' : 'Menu'}
        </span>
      </motion.button>

      <AnimatePresence>
        {showMenu && user && !isProfileOwner && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="absolute top-full right-0 mt-2 w-56 bg-gradient-to-br from-[#1F1F1F] via-[#252525] to-[#1F1F1F] border border-[#D4AF37]/20 rounded-xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-2 space-y-1">
                <button
                  onClick={handleMyProfile}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-all group"
                >
                  <Home className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Meu Perfil</span>
                </button>

                <button
                  onClick={handleMyDashboard}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-all group"
                >
                  <LayoutDashboard className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Minha Dashboard</span>
                </button>

                <div className="h-px bg-white/10 my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-all group"
                >
                  <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
