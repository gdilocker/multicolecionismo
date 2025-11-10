import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginModalSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  affiliateCode?: string;
}

export function LoginModalSimple({ isOpen, onClose, affiliateCode }: LoginModalSimpleProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onClose();
    navigate('/login', { state: { returnTo: window.location.pathname } });
  };

  const handleRegister = () => {
    onClose();

    // Se há um affiliate code, adicionar ao URL e cookie
    if (affiliateCode) {
      // Salvar no cookie com 30 dias de expiração
      const maxAge = 60 * 60 * 24 * 30; // 30 dias em segundos
      document.cookie = `ref=${affiliateCode}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;

      // Navegar com o ref na URL
      const params = new URLSearchParams({
        ref: affiliateCode,
        utm_source: 'login_modal',
        utm_medium: 'referral',
        utm_campaign: 'affiliate'
      });
      navigate(`/register?${params.toString()}`, { state: { returnTo: window.location.pathname } });
    } else {
      navigate('/register', { state: { returnTo: window.location.pathname } });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
          >
            <div className="bg-gradient-to-br from-[#1F1F1F] via-[#252525] to-[#1F1F1F] rounded-2xl p-8 max-w-md w-full border border-[#D4AF37]/20 shadow-2xl relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#C6941E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-black" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Acesso Necessário</h2>
                <p className="text-gray-400">
                  Faça login para acessar sua dashboard ou interagir com a plataforma
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black font-bold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
                >
                  <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  <span>Entrar na minha conta</span>
                </button>

                <button
                  onClick={handleRegister}
                  className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10 group"
                >
                  <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Criar minha conta</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full text-gray-400 hover:text-white font-medium py-3 rounded-xl transition-colors"
                >
                  Voltar ao perfil
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
