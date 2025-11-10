import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { LayoutDashboard, Mail, Globe, CreditCard, Settings, HelpCircle, LogOut, ChevronLeft, ChevronRight, Store, User, Users, CreditCard as Edit3, PlusCircle, BarChart3, ShoppingBag, X } from 'lucide-react'; import { Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDrawer } from '../contexts/DrawerContext';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  backRoute?: string;
}

interface UserStatus {
  hasProfile: boolean;
  isAffiliate: boolean;
  hasAcceptedAffiliateTerms: boolean;
}

export const PanelSidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, backRoute }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { isInDrawer, returnUrl, returnPageName, setDrawerState } = useDrawer();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus>({
    hasProfile: false,
    isAffiliate: false,
    hasAcceptedAffiliateTerms: false
  });

  useEffect(() => {
    const fetchUserStatus = async () => {
      if (!user?.id) return;

      try {
        // Check if user has a profile configured
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        // Check if user is an affiliate
        const { data: affiliateData } = await supabase
          .from('affiliates')
          .select('id, status, approved_at')
          .eq('user_id', user.id)
          .maybeSingle();

        setUserStatus({
          hasProfile: !!profileData?.id,
          isAffiliate: !!affiliateData && affiliateData.status === 'active',
          hasAcceptedAffiliateTerms: !!affiliateData?.approved_at
        });
      } catch (error) {
        console.error('Error fetching user status:', error);
      }
    };

    fetchUserStatus();
  }, [user?.id, location.pathname]);

  const handleBackClick = () => {
    setIsOpen(false);
    setDrawerState(false);
    navigate(returnUrl);
  };

  const menuItems = [
    { path: '/panel/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/panel/domains', icon: Globe, label: 'Gerenciar', subtitle: 'Domínios / Páginas', badge: !userStatus.hasProfile ? 'Criar Página' : undefined },
    { path: '/panel/revendedor', icon: Store, label: 'Afiliado', badge: !userStatus.isAffiliate && !userStatus.hasAcceptedAffiliateTerms ? 'Participe' : undefined },
    { path: '/panel/billing', icon: CreditCard, label: 'Faturamento' },
    { path: '/panel/settings', icon: Settings, label: 'Configurações' },
    { path: '/panel/support', icon: HelpCircle, label: 'Suporte' }
  ];

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    setIsOpen(false);
    setDrawerState(false);

    await logout();

    navigate(returnUrl);
    window.location.reload();
  };

  return (
    <>
      <aside className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-70 bg-white border-r border-slate-200 shadow-lg z-40 flex-col">
        {isInDrawer && (
          <div className="p-4 border-b border-slate-200">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#C4A137] text-white transition-all duration-200 shadow-lg hover:shadow-xl w-full group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <div className="flex flex-col items-start flex-1">
                <span className="text-xs opacity-90">Voltar para</span>
                <span className="font-semibold text-sm truncate max-w-[180px]">{returnPageName}</span>
              </div>
            </button>
          </div>
        )}

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              const badge = (item as any).badge;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative
                    ${isActive
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                  title={badge ? (badge === 'Criar Página' ? 'Configure sua página para começar a usar seu domínio' : 'Ative o programa de afiliados para ganhar comissões automáticas') : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.label}</span>
                      {badge && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400 text-black animate-pulse">
                          {badge}
                        </span>
                      )}
                    </div>
                    {(item as any).subtitle && (
                      <span className={`text-xs ${
                        isActive ? 'text-white/70' : 'text-slate-500'
                      }`}>{(item as any).subtitle}</span>
                    )}
                  </div>
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-slate-200 space-y-3">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <PlusCircle className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="font-semibold">Registrar Domínio</span>
                  <span className="text-xs text-slate-400">Inicial</span>
                </div>
              </Link>
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 border border-red-200 hover:border-red-300"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-semibold">Sair</span>
              </button>
            </div>
          </div>
        </nav>
      </aside>

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 h-screen w-70 bg-white border-r border-slate-200 shadow-lg z-50 flex flex-col lg:hidden"
      >
        <div className="p-6 border-b border-slate-200">
          {isInDrawer ? (
            <button
              onClick={handleBackClick}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#C4A137] text-white transition-all duration-200 shadow-lg hover:shadow-xl w-full group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <div className="flex flex-col items-start flex-1">
                <span className="text-xs opacity-90">Voltar para</span>
                <span className="font-semibold">{returnPageName}</span>
              </div>
            </button>
          ) : location.pathname === '/minha-pagina' && backRoute ? (
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => {
                  navigate(backRoute);
                  setIsOpen(false);
                }}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <span className="text-sm text-slate-600 font-medium">Voltar</span>
            </div>
          ) : (
            <Link to="/" className="flex flex-col gap-2 group">
              <img
                src="/logo.png"
                alt="com.rich"
                className="h-16 w-auto object-contain"
              />
              <p className="text-xs text-slate-500">Painel do Cliente</p>
            </Link>
          )}
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              const badge = (item as any).badge;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative
                    ${isActive
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                  title={badge ? (badge === 'Criar Página' ? 'Configure sua página para começar a usar seu domínio' : 'Ative o programa de afiliados para ganhar comissões automáticas') : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.label}</span>
                      {badge && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400 text-black animate-pulse">
                          {badge}
                        </span>
                      )}
                    </div>
                    {(item as any).subtitle && (
                      <span className={`text-xs ${
                        isActive ? 'text-white/70' : 'text-slate-500'
                      }`}>{(item as any).subtitle}</span>
                    )}
                  </div>
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-slate-200 space-y-3">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <PlusCircle className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="font-semibold">Registrar Domínio</span>
                  <span className="text-xs text-slate-400">Inicial</span>
                </div>
              </Link>
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 border border-red-200 hover:border-red-300"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-semibold">Sair</span>
              </button>
            </div>
          </div>
        </nav>

      </motion.aside>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {location.pathname !== '/minha-pagina' && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed right-4 top-4 w-12 h-12 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all z-50 shadow-lg lg:hidden"
        >
          {isOpen ? (
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          ) : (
            <ChevronRight className="w-6 h-6 text-slate-600" />
          )}
        </button>
      )}

      <AnimatePresence>
        {showLogoutModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] pointer-events-auto"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 m-auto bg-white rounded-2xl shadow-2xl z-[101] w-[90%] max-w-md h-fit max-h-[80vh] overflow-y-auto pointer-events-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <LogOut className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Confirmar Saída</h3>
                      <p className="text-sm text-slate-500">Você será desconectado</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <p className="text-slate-600 mb-6">
                  Tem certeza que deseja sair? Você será redirecionado para sua página pública.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
