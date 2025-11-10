import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown, Home, Store, Bookmark, Radio, DollarSign, Users, LogIn, UserPlus, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProgramsMenuOpen, setIsProgramsMenuOpen] = useState(false);
  const [isPoliciesMenuOpen, setIsPoliciesMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Use memo to prevent unnecessary re-renders
  const showMenu = React.useMemo(() => {
    // Always show menu if user is cached (from localStorage)
    // This prevents the flash of logged-out state
    return !loading || user !== null;
  }, [loading, user]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsProgramsMenuOpen(false);
    setIsPoliciesMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);

  const handleSair = async () => {
    await logout();
  };

  const programsLinks = [
    { to: '/afiliados/sobre', label: 'Sobre o Programa' },
    { to: '/afiliados/termos', label: 'Como Funciona' }
  ];

  const policiesLinks = [
    { to: '/termos', label: 'Termos de Uso' },
    { to: '/privacidade', label: 'Privacidade' },
    { to: '/cookies', label: 'Cookies' },
    { to: '/reembolso', label: 'Reembolso' },
    { to: '/suspensao', label: 'Suspensão' },
    { to: '/uso-aceitavel', label: 'Uso Aceitável' },
    { to: '/transferencia', label: 'Transferência' },
    { to: '/seguranca', label: 'Segurança' },
    { to: '/padroes-comunidade', label: 'Padrões da Comunidade' },
    { to: '/conteudo-usuario', label: 'Conteúdo do Usuário' },
    { to: '/direitos-autorais', label: 'Direitos Autorais' },
    { to: '/conformidade-legal', label: 'Conformidade Legal' }
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed w-full top-0 z-50 bg-black shadow-2xl"
      style={{
        borderBottom: '1px solid transparent',
        borderImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%) 1'
      }}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Logo size={36} />
          </Link>

          {/* Right side - All navigation + auth */}
          <div className="hidden md:flex items-center gap-1">
            {!showMenu ? (
              <div className="flex items-center gap-1 opacity-0 pointer-events-none">
                {/* Invisible placeholder to prevent layout shift */}
                <div className="w-20 h-8"></div>
              </div>
            ) : !user ? (
              <>
                <Link
                  to="/"
                  className={`px-3 py-2 font-medium transition-colors ${
                    location.pathname === '/'
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Inicial
                </Link>
                <Link
                  to="/valores"
                  className={`px-3 py-2 font-medium transition-colors ${
                    location.pathname === '/valores'
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Planos
                </Link>
                <Link
                  to="/afiliados/sobre"
                  className={`px-3 py-2 font-medium transition-colors ${
                    location.pathname === '/afiliados/sobre'
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Afiliados
                </Link>

                {/* Subtle divider */}
                <div className="h-6 w-px bg-gray-700 mx-2"></div>

                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-colors shadow-lg"
                >
                  Começar
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className={`px-3 py-2 font-medium transition-colors ${
                    location.pathname === '/'
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Inicial
                </Link>
                <Link
                  to="/panel/dashboard"
                  className={`px-3 py-2 font-medium transition-colors ${
                    location.pathname === '/dashboard' ||
                    location.pathname === '/panel/dashboard' ||
                    location.pathname === '/app/dashboard'
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-900 rounded-lg transition-colors border border-gray-700"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-white font-medium max-w-32 truncate text-sm">
                      {user.name || user.email}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                      >
                        <div className="p-3 border-b border-gray-100 bg-gray-50">
                          <p className="text-xs text-[#6B7280] mb-1">Conectado como</p>
                          <p className="text-sm font-medium text-black truncate">{user.email}</p>
                        </div>
                        <div className="p-2">
                          <button
                            onClick={handleSair}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-2"
                          >
                            <LogOut className="w-4 h-4" />
                            Sair
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button - right side */}
          <div className="relative md:hidden ml-auto">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded text-white hover:bg-gray-900 transition-colors flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Dropdown Menu */}
            {isMenuOpen && showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute top-full right-0 mt-2 bg-gray-900 rounded-lg shadow-xl border border-gray-800 overflow-hidden z-50 min-w-[200px]">
                  {user ? (
                    <>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition-colors"
                      >
                        <Home className="w-5 h-5" />
                        <span className="text-sm font-medium">Inicial</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/panel/dashboard');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition-colors"
                      >
                        <UserCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Dashboard</span>
                      </button>
                      <button
                        onClick={async () => {
                          setIsMenuOpen(false);
                          await logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors border-t border-gray-800"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Sair</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition-colors"
                      >
                        <Home className="w-5 h-5" />
                        <span className="text-sm font-medium">Inicial</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/valores');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition-colors"
                      >
                        <DollarSign className="w-5 h-5" />
                        <span className="text-sm font-medium">Planos</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/afiliados/sobre');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition-colors"
                      >
                        <Users className="w-5 h-5" />
                        <span className="text-sm font-medium">Afiliados</span>
                      </button>

                      {/* Auth buttons for logged out users */}
                      <div className="border-t border-gray-800 mt-2">
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate('/login');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition-colors"
                        >
                          <LogIn className="w-5 h-5" />
                          <span className="text-sm font-medium">Entrar</span>
                        </button>
                        <div className="px-4 pb-3">
                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              navigate('/register');
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-colors rounded-lg"
                          >
                            <UserPlus className="w-5 h-5" />
                            <span className="text-sm font-medium">Começar</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <AnimatePresence>
          {false && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-gray-800"
            >
              <div className="py-3 space-y-0.5 px-2">
                {user && (
                  <div className="mb-4 px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl border border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-0.5">Conectado como</p>
                        <p className="text-sm font-semibold text-white truncate">
                          {user.name || user.email?.split('@')[0] || 'Usuário'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {!user ? (
                  <>
                    <Link
                      to="/"
                      className={`block px-3 py-2.5 rounded font-medium transition-colors ${
                        location.pathname === '/'
                          ? 'text-white bg-gray-800'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      Início
                    </Link>
                    <Link
                      to="/valores"
                      className={`block px-3 py-2.5 rounded font-medium transition-colors ${
                        location.pathname === '/valores'
                          ? 'text-white bg-gray-800'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      Planos
                    </Link>
                    <Link
                      to="/premium"
                      className={`block px-3 py-2.5 rounded font-medium transition-colors ${
                        location.pathname === '/premium'
                          ? 'text-white bg-gray-800'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        Premium
                        <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500 text-white rounded-full font-bold">Supreme</span>
                      </span>
                    </Link>
                    <Link
                      to="/faq"
                      className={`block px-3 py-2.5 rounded font-medium transition-colors ${
                        location.pathname === '/faq'
                          ? 'text-white bg-gray-800'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      FAQ
                    </Link>

                    <div className="pt-2 pb-1">
                      <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Afiliados</p>
                      {programsLinks.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          className={`block px-3 py-2 rounded font-medium text-sm transition-colors ${
                            location.pathname === link.to
                              ? 'text-white bg-gray-800'
                              : 'text-gray-300 hover:text-white hover:bg-gray-800'
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-gray-800 space-y-1">
                      <Link
                        to="/login"
                        className="block px-3 py-2.5 text-gray-300 hover:text-white font-medium transition-colors hover:bg-gray-800 rounded"
                      >
                        Entrar
                      </Link>
                      <Link
                        to="/register"
                        className="block px-3 py-2.5 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black font-semibold rounded text-center"
                      >
                        Começar
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      to="/panel/domains"
                      className={`block px-4 py-2 rounded font-medium transition-colors ${
                        location.pathname === '/panel/domains'
                          ? 'text-white bg-gray-800'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      Meus Domínios
                    </Link>
                    <button
                      onClick={handleSair}
                      className="w-full text-left px-4 py-2 text-red-400 font-medium transition-colors hover:bg-red-950 rounded flex items-center gap-2 mt-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
