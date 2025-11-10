import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, AlertCircle } from 'lucide-react';

interface PasswordProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onVerify: (password: string) => Promise<boolean>;
  profileName: string;
}

export default function PasswordProtectionModal({
  isOpen,
  onClose,
  onSuccess,
  onVerify,
  profileName
}: PasswordProtectionModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      setError('Por favor, digite a senha');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isValid = await onVerify(password);

      if (isValid) {
        onSuccess();
        setPassword('');
        setError('');
      } else {
        setError('Senha incorreta. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao verificar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{
                duration: 0.3,
                ease: [0.34, 1.56, 0.64, 1],
                scale: { type: 'spring', stiffness: 300, damping: 25 }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200/50"
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="absolute top-5 right-5 p-2 hover:bg-slate-100 rounded-xl transition-colors z-10 group"
              >
                <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </motion.button>

              {/* Body */}
              <form onSubmit={handleSubmit} className="p-7 space-y-5">
                <div className="flex items-start gap-5 mb-6">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <Lock className="w-7 h-7 text-blue-600" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex-1 pt-1"
                  >
                    <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Perfil Protegido</h2>
                    <p className="text-slate-600 text-[15px]">
                      Digite a senha para acessar
                    </p>
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <p className="text-slate-700 mb-5 leading-relaxed">
                    O perfil <strong className="text-slate-900">{profileName}</strong> é privado e requer uma senha para visualização.
                  </p>

                  <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                    Senha de Acesso
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Digite a senha"
                    autoFocus
                    className="w-full px-4 py-3.5 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all shadow-sm"
                  />
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </motion.div>
                )}

                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 -mx-7 -mb-7 px-7 py-5 flex items-center justify-end gap-3 mt-6 border-t border-slate-200/60">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleClose}
                    className="px-6 py-3 text-slate-700 font-semibold rounded-xl hover:bg-white border border-slate-200 transition-all shadow-sm hover:shadow"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: loading || !password ? 1 : 1.03, y: loading || !password ? 0 : -1 }}
                    whileTap={{ scale: loading || !password ? 1 : 0.97 }}
                    disabled={loading || !password}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Acessar
                      </>
                    )}
                  </motion.button>
                </div>

                <div className="pt-3 -mx-7 px-7 -mb-4">
                  <p className="text-xs text-slate-500 text-center leading-relaxed">
                    Se você não possui a senha, entre em contato com o proprietário do perfil.
                  </p>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
