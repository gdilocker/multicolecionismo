import { useState } from 'react';
import { Shield, Lock, AlertCircle, Crown, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProtectedBrandAccessProps {
  brandName: string;
  brandDisplayName: string;
  description?: string;
  onPasswordSubmit: (password: string) => Promise<boolean>;
}

export default function ProtectedBrandAccess({
  brandName,
  brandDisplayName,
  description,
  onPasswordSubmit,
}: ProtectedBrandAccessProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const isValid = await onPasswordSubmit(password);
      if (!isValid) {
        setError('Senha de acesso incorreta');
        setPassword('');
      }
    } catch (err) {
      setError('Erro ao verificar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Main card */}
        <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border-2 border-yellow-500/30 rounded-3xl shadow-2xl p-12">
          {/* Crown icon at top */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-6 rounded-2xl shadow-2xl">
              <Crown className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mt-8 mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="w-6 h-6 text-yellow-500" />
              <h1 className="text-4xl font-bold text-white">
                {brandDisplayName}
              </h1>
              <Star className="w-6 h-6 text-yellow-500" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full mb-6">
              <Shield className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-semibold text-sm">Marca Protegida</span>
            </div>

            {description && (
              <p className="text-slate-300 text-lg mb-8 max-w-md mx-auto">
                {description}
              </p>
            )}

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3 text-left">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-200 text-sm leading-relaxed">
                    Este domínio representa uma marca de alto valor e reconhecimento mundial.
                    O acesso requer autorização especial.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-yellow-500 focus:outline-none transition-colors"
                  placeholder="Digite a senha de acesso"
                  required
                  disabled={loading}
                />
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm mt-2 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Acessar Marca Protegida'}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-slate-400 text-xs text-center">
              Para solicitar acesso a marcas protegidas, entre em contato com a administração.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
