import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, CheckCircle, ArrowRight, Gift } from 'lucide-react';
import PhoneInput from '../components/PhoneInput';
import { RegisterForm } from '../types';
import * as yup from 'yup';

const registerSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email muito longo')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Formato de email inválido'),
  password: yup
    .string()
    .required('Senha é obrigatória')
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(128, 'Senha muito longa')
    .matches(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .matches(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .matches(/[0-9]/, 'Senha deve conter pelo menos um número'),
  confirmPassword: yup
    .string()
    .required('Confirmação de senha é obrigatória')
    .oneOf([yup.ref('password')], 'As senhas não coincidem'),
  firstName: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome muito curto')
    .max(50, 'Nome muito longo')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  lastName: yup
    .string()
    .required('Sobrenome é obrigatório')
    .min(2, 'Sobrenome muito curto')
    .max(50, 'Sobrenome muito longo')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/, 'Sobrenome deve conter apenas letras'),
  phone: yup
    .string()
    .required('Telefone é obrigatório')
    .matches(/^[0-9]*$/, 'Telefone inválido')
    .min(8, 'Telefone muito curto')
    .max(15, 'Telefone muito longo'),
  countryCode: yup
    .string()
    .required('País é obrigatório'),
  phoneCountryPrefix: yup
    .string()
    .required('Prefixo do país é obrigatório'),
  acceptTerms: yup
    .boolean()
    .oneOf([true], 'Você deve aceitar os termos de uso'),
});

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterForm>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    countryCode: 'BR',
    phoneCountryPrefix: '+55',
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.redirectTo;
  const prefilledDomain = location.state?.prefilledDomain;
  const message = location.state?.message;

  // Extract affiliate code from URL or cookie
  const getAffiliateCode = (): string | null => {
    const params = new URLSearchParams(location.search);
    const urlRef = params.get('ref');
    if (urlRef) return urlRef;

    // Fallback to cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'ref') return value;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationErrors({});

    try {
      await registerSchema.validate(formData, { abortEarly: false });

      // Pass affiliate code to register function
      const affiliateCode = getAffiliateCode();

      await register({
        email: formData.email.trim(),
        password: formData.password,
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        phone: formData.phone,
        countryCode: formData.countryCode,
        phoneCountryPrefix: formData.phoneCountryPrefix,
        affiliateCode: affiliateCode || undefined,
        affiliateSource: location.state?.returnTo ? 'login_modal' : 'direct'
      });

      if (redirectTo) {
        navigate(redirectTo, {
          state: prefilledDomain ? { domain: prefilledDomain, fromMarketplace: true } : undefined
        });
      } else {
        navigate('/panel/dashboard');
      }
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        err.inner.forEach((error) => {
          if (error.path) {
            errors[error.path] = error.message;
          }
        });
        setValidationErrors(errors);
      } else {
        setError(err instanceof Error ? err.message : 'Erro no cadastro');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePhoneChange = (phone: string, countryCode: string, prefix: string) => {
    setFormData(prev => ({
      ...prev,
      phone,
      countryCode,
      phoneCountryPrefix: prefix
    }));

    if (validationErrors.phone || validationErrors.countryCode) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.phone;
        delete newErrors.countryCode;
        delete newErrors.phoneCountryPrefix;
        return newErrors;
      });
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-slate-500', 'bg-green-500'];
  const strengthLabels = ['Muito Fraca', 'Fraca', 'Média', 'Forte', 'Muito Forte'];

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(96,165,250,0.1),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />

      <div className="relative flex flex-col justify-center pt-24 pb-12 sm:px-6 lg:px-8 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="flex justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-16 h-16 bg-gradient-to-br from-black to-[#3B82F6] rounded-2xl flex items-center justify-center shadow-lg"
            >
              <User className="w-9 h-9 text-white" />
            </motion.div>
          </div>
          <h2 className="mt-6 text-center text-4xl font-black text-black" style={{ fontWeight: 900 }}>
            Criar Nova Conta
          </h2>
          <p className="mt-2 text-center text-lg text-[#6B7280]">
            Comece sua jornada com .com.rich
          </p>

          {getAffiliateCode() && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-6 max-w-md mx-auto"
            >
              <div className="bg-gradient-to-r from-emerald-50 to-slate-50 border-2 border-emerald-200 rounded-2xl p-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-slate-600 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-emerald-900 mb-1 flex items-center gap-1">
                      <Gift className="w-4 h-4" />
                      Você foi convidado por um Parceiro Elite
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Você terá suporte prioritário na ativação e onboarding guiado.
                      Seu parceiro receberá comissões recorrentes pelas vendas efetivadas.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="relative">
            <div className="relative bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
              {message && (
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
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </motion.div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">Nome</label>
                    <input
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                        validationErrors.firstName
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-[#3B82F6] focus:border-[#3B82F6]'
                      }`}
                      placeholder="João"
                    />
                    {validationErrors.firstName && (
                      <p className="mt-1 text-xs text-red-600">{validationErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">Sobrenome</label>
                    <input
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                        validationErrors.lastName
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-[#3B82F6] focus:border-[#3B82F6]'
                      }`}
                      placeholder="Silva"
                    />
                    {validationErrors.lastName && (
                      <p className="mt-1 text-xs text-red-600">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">Email</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-[#6B7280] absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                        validationErrors.email
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-[#3B82F6] focus:border-[#3B82F6]'
                      }`}
                      placeholder="seu@email.com"
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">Senha</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-[#6B7280] absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-12 py-3 bg-gray-50 border rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                        validationErrors.password
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-[#3B82F6] focus:border-[#3B82F6]'
                      }`}
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-black transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
                  )}
                  {formData.password && !validationErrors.password && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      {passwordStrength > 0 && (
                        <p className="text-xs text-[#6B7280]">
                          Força: {strengthLabels[passwordStrength - 1]}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-[#6B7280] absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-12 py-3 bg-gray-50 border rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                        validationErrors.confirmPassword
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-[#3B82F6] focus:border-[#3B82F6]'
                      }`}
                      placeholder="Repita sua senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-black transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.confirmPassword}</p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && !validationErrors.confirmPassword && (
                    <div className="mt-2 flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs">Senhas coincidem</span>
                    </div>
                  )}
                </div>

                <PhoneInput
                  value={formData.phone}
                  countryCode={formData.countryCode}
                  onChange={handlePhoneChange}
                  error={validationErrors.phone || validationErrors.countryCode}
                  required
                />

                <div className="flex items-start">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 rounded border-gray-300 bg-white text-[#3B82F6] focus:ring-[#3B82F6]"
                  />
                  <label htmlFor="acceptTerms" className="ml-3 text-sm text-[#6B7280]">
                    Aceito os{' '}
                    <Link to="/termos" className="text-[#3B82F6] hover:text-black transition-colors font-medium">
                      Termos de Uso
                    </Link>
                    {' '}e{' '}
                    <Link to="/politica" className="text-[#3B82F6] hover:text-black transition-colors font-medium">
                      Política de Privacidade
                    </Link>
                  </label>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-black hover:bg-[#1a1b2e] text-white font-bold rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Criar Conta
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-[#6B7280]">Já tem uma conta?</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-gray-50 text-black font-semibold rounded-xl transition-all duration-200 border border-gray-300"
                  >
                    Fazer Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-sm text-[#9CA3AF]"
        >
          Ao criar uma conta, você concorda com nossos termos e políticas
        </motion.p>
      </div>
    </div>
  );
};

export default Register;
