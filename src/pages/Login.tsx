import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ArrowRight, LogIn } from 'lucide-react';
import * as yup from 'yup';

const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email muito longo')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Formato de email inválido'),
  password: yup
    .string()
    .required('Senha é obrigatória')
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(128, 'Senha muito longa'),
});

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasNavigated, setHasNavigated] = useState(false);

  const { login, loginWithGoogle, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;
  const returnTo = location.state?.returnTo;
  const redirectTo = location.state?.redirectTo;
  const prefilledDomain = location.state?.prefilledDomain;
  const message = location.state?.message;

  // Auto-redirect if user is already logged in
  React.useEffect(() => {
    if (user && !hasNavigated) {
      // Determine destination with correct priority
      let destination = '/'; // Default: home page

      // Priority 1: Explicit redirect paths
      if (returnTo) {
        destination = returnTo;
      } else if (redirectTo) {
        destination = redirectTo;
      } else if (from && from !== '/login') {
        // Priority 2: Return to where they came from (but not /login itself)
        destination = from;
      } else if (user.role === 'admin') {
        // Priority 3: Admin users go to admin dashboard
        destination = '/admin';
      }
      // Otherwise: stay with default home page '/'

      console.log('Login: User detected, role:', user.role, 'navigating to:', destination);
      setHasNavigated(true);
      setLoading(false);

      // Immediate navigation - user is already authenticated
      navigate(destination, {
        replace: true,
        state: prefilledDomain ? { domain: prefilledDomain, fromMarketplace: true } : undefined
      });
    }
  }, [user, hasNavigated, returnTo, redirectTo, from, navigate, prefilledDomain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Login: Form submitted');
    setLoading(true);
    setError('');
    setValidationErrors({});

    // Safety timeout - if login takes more than 15 seconds, something is wrong
    const timeoutId = setTimeout(() => {
      console.error('Login: Timeout - login took too long');
      setLoading(false);
      setError('O login está demorando muito. Tente novamente em alguns instantes.');
    }, 15000);

    try {
      console.log('Login: Validating form data');
      await loginSchema.validate(formData, { abortEarly: false });

      console.log('Login: Attempting login with email:', formData.email);
      await login(formData.email.trim(), formData.password);
      console.log('Login: Login successful - user should be set now');

      // Clear timeout since login succeeded
      clearTimeout(timeoutId);

      // Stop loading immediately - useEffect will navigate
      setLoading(false);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Login error:', err);
      if (err instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        err.inner.forEach((error) => {
          if (error.path) {
            errors[error.path] = error.message;
          }
        });
        setValidationErrors(errors);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Erro no login. Verifique suas credenciais.';
        console.error('Login: Setting error message:', errorMessage);
        setError(errorMessage);
      }
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F5F5F5] overflow-hidden">

      <div className="relative flex flex-col justify-center pt-24 pb-12 sm:px-6 lg:px-8 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="flex justify-center">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-16 h-16 bg-gradient-to-br from-slate-500 to-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50"
            >
              <LogIn className="w-9 h-9 text-white" />
            </motion.div>
          </div>
          <h2 className="mt-6 text-center text-4xl font-bold text-black">
            Bem-vindo de volta
          </h2>
          <p className="mt-2 text-center text-lg text-[#6B7280]">
            Entre na sua conta para continuar
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="relative">
            <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
              {user && !hasNavigated && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                    <p className="text-sm text-green-800 font-medium">
                      Redirecionando para o dashboard...
                    </p>
                  </div>
                </motion.div>
              )}

              {message && !user && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-slate-900 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-900 font-medium">{message}</p>
                      {prefilledDomain && (
                        <p className="text-xs text-slate-900 mt-1">Domínio selecionado: {prefilledDomain}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Google Login Button */}
              {!user && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={loginWithGoogle}
                    className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all duration-200 border-2 border-gray-200 hover:border-gray-300 shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continuar com Google
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-[#6B7280]">ou entre com email</span>
                    </div>
                  </div>
                </div>
              )}

              <form className={`space-y-6 ${user ? 'hidden' : ''}`} onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-[#6B7280] absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 bg-white border rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 transition-all touch-manipulation ${
                        validationErrors.email
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-[#3B82F6] focus:border-[#3B82F6]'
                      }`}
                      placeholder="seu@email.com"
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-[#6B7280] absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-12 py-3 bg-white border rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 transition-all touch-manipulation ${
                        validationErrors.password
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-[#3B82F6] focus:border-[#3B82F6]'
                      }`}
                      placeholder="Sua senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-black active:text-black transition-colors touch-manipulation z-20"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-[#3B82F6] hover:text-[#2B6CB0] transition-colors"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-black hover:bg-[#1a1b2e] active:bg-[#1a1b2e] text-white font-semibold rounded-xl transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-[#6B7280]">Novo por aqui?</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    to="/register"
                    state={{
                      prefilledDomain,
                      redirectTo,
                      message: prefilledDomain ? 'Crie sua conta para continuar com a compra' : undefined
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-black font-medium rounded-xl transition-all duration-200 border border-gray-200"
                  >
                    Criar nova conta
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500">
            Ao entrar, você concorda com nossos{' '}
            <Link
              to="/termos"
              className="text-slate-900 hover:text-slate-900 font-medium underline decoration-blue-300 hover:decoration-blue-500 transition-all duration-200"
            >
              Termos de Uso
            </Link>
            {' '}e{' '}
            <Link
              to="/politica"
              className="text-slate-900 hover:text-slate-900 font-medium underline decoration-blue-300 hover:decoration-blue-500 transition-all duration-200"
            >
              Política de Privacidade
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
