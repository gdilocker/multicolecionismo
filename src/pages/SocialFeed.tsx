import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Users, Globe, Search, Home, MessageCircle, User, Store, Radio, Menu, Lock, Sparkles, ArrowLeft, ExternalLink, Bookmark, CircleUser as UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { VerticalFeed } from '../components/social/VerticalFeed';
import { CreatePostModal } from '../components/social/CreatePostModal';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';


type FeedMode = 'all' | 'following';


export default function SocialFeed() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { subdomain } = useParams<{ subdomain?: string }>();
  const [feedMode, setFeedMode] = useState<FeedMode>('all');
  const [profileData, setProfileData] = useState<{ subdomain: string; display_name: string; user_id: string } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(!!subdomain);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const handleMinhaPaginaClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    navigate('/minha-pagina');
  };
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);

  const isLoggedIn = !!user;
  const canPost = user?.subscriptionPlan && ['prime', 'elite', 'supreme'].includes(user.subscriptionPlan);

  useEffect(() => {
    if (subdomain) {
      loadProfileData();
    }
  }, [subdomain]);

  const loadProfileData = async () => {
    if (!subdomain) return;

    try {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('subdomain, display_name, user_id')
        .eq('subdomain', subdomain)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfileData(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleCreatePost = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    // Allow all logged users to try creating a post
    // Server-side validation will handle permissions
    setShowCreateModal(true);
  };

  const handleFollowingClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setFeedMode('following');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMinhaLojaClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    navigate('/panel/dashboard');
  };

  const handlePerfilClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    navigate('/meu-perfil');
  };

  const handlePostCreated = () => {
    setRefreshKey(prev => prev + 1);
  };


  return (
    <div className="min-h-screen bg-black">
      {/* User Profile Header - When viewing specific user's feed */}
      {subdomain && profileData && (
        <header className="fixed top-0 left-0 right-0 bg-gradient-to-b from-black via-black/95 to-transparent backdrop-blur-md z-40 pt-[env(safe-area-inset-top)]">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => navigate('/social')}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Voltar ao Feed</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-white font-semibold">{profileData.display_name || profileData.subdomain}</p>
                  <p className="text-xs text-gray-400">@{profileData.subdomain}</p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/${profileData.subdomain}`)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] hover:from-[#D4AF37] hover:to-[#B8941E] text-black font-semibold rounded-lg transition-all text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Ver Página</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Top Header - Simple (when NOT viewing specific user) */}
      {!subdomain && (
        <header className="md:hidden fixed top-0 left-0 right-0 bg-black border-b border-gray-800 z-50 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center"
            >
              <Logo size={32} />
            </button>
            <button
              onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Hamburger Dropdown Menu */}
          {showHamburgerMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowHamburgerMenu(false)}
              />
              <div className="absolute top-full right-2 mt-2 bg-gray-900 rounded-lg shadow-xl border border-gray-800 overflow-hidden z-50 min-w-[200px]">
                {isLoggedIn ? (
                  <>
                    <button
                      onClick={() => {
                        setShowHamburgerMenu(false);
                        navigate('/social');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition-colors"
                    >
                      <Radio className="w-5 h-5" />
                      <span className="text-sm font-medium">Comunidade</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowHamburgerMenu(false);
                        navigate('/minha-pagina', { state: { from: '/social' } });
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition-colors"
                    >
                      <UserCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Minha Página</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowHamburgerMenu(false);
                        navigate('/salvos');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition-colors"
                    >
                      <Bookmark className="w-5 h-5" />
                      <span className="text-sm font-medium">Salvos</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowHamburgerMenu(false);
                        navigate('/panel/dashboard');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition-colors"
                    >
                      <Home className="w-5 h-5" />
                      <span className="text-sm font-medium">Dashboard</span>
                    </button>
                    <button
                      onClick={async () => {
                        setShowHamburgerMenu(false);
                        await logout();
                        navigate('/login');
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
                        setShowHamburgerMenu(false);
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition-colors"
                    >
                      <Home className="w-5 h-5" />
                      <span className="text-sm font-medium">Inicial</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowHamburgerMenu(false);
                        navigate('/valores');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition-colors"
                    >
                      <DollarSign className="w-5 h-5" />
                      <span className="text-sm font-medium">Planos</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowHamburgerMenu(false);
                        navigate('/premium');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition-colors"
                    >
                      <Crown className="w-5 h-5" />
                      <span className="text-sm font-medium">Premium</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowHamburgerMenu(false);
                        navigate('/faq');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition-colors"
                    >
                      <HelpCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">FAQ</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowHamburgerMenu(false);
                        navigate('/social');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition-colors border-t border-gray-800"
                    >
                      <Radio className="w-5 h-5" />
                      <span className="text-sm font-medium">Comunidade</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowHamburgerMenu(false);
                        navigate('/afiliados/sobre');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition-colors"
                    >
                      <Users className="w-5 h-5" />
                      <span className="text-sm font-medium">Afiliados</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </header>
      )}

      {/* Desktop Header */}
      {!subdomain && (
        <header className="hidden md:block fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-md z-40">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/')}
                className="flex items-center"
              >
                <Logo size={48} />
              </button>

              {isLoggedIn && (
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1 border border-white/10">
                <button
                  onClick={() => setFeedMode('all')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    feedMode === 'all'
                      ? 'bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black font-semibold'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Explorar</span>
                </button>
                <button
                  onClick={handleFollowingClick}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    feedMode === 'following'
                      ? 'bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black font-semibold'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Seguindo</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => navigate('/meu-perfil')}
                  className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Meu Feed</span>
                </button>
                <button
                  onClick={() => navigate('/minha-pagina', { state: { from: '/social' } })}
                  className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  <span>Minha Página</span>
                </button>
                <button
                  onClick={() => navigate('/salvos')}
                  className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Salvos</span>
                </button>
                <button
                  onClick={() => navigate('/panel/dashboard')}
                  className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
                >
                  Entrar
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-6 py-2 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] hover:from-[#D4AF37] hover:to-[#B8941E] text-black font-semibold rounded-lg transition-colors"
                >
                  Começar
                </button>
              </>
            )}
          </div>
        </div>
        </header>
      )}

      {/* Feed Content */}
      <div className="fixed inset-0 md:pt-[60px]">
        {/* Vertical Feed */}
        <div className={subdomain ? "md:pt-20" : "md:pt-4"}>
          {subdomain && profileData ? (
            <VerticalFeed mode="my_posts" userId={profileData.user_id} key={refreshKey} />
          ) : (
            <VerticalFeed mode={feedMode} key={refreshKey} />
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation - Only show when NOT viewing specific user */}
      {!subdomain && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-40 pb-[env(safe-area-inset-bottom)]">

          <div className="grid grid-cols-5 items-end px-2 py-2">
            <button
              onClick={() => {
                setFeedMode('all');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center gap-1 py-2 ${feedMode === 'all' ? 'text-white' : 'text-gray-400'}`}
            >
              <Globe className="w-6 h-6" />
              <span className="text-xs font-medium">Todos</span>
            </button>
            <button
              onClick={handleFollowingClick}
              className={`flex flex-col items-center gap-1 py-2 ${feedMode === 'following' ? 'text-white' : 'text-gray-400'}`}
            >
              <Users className="w-6 h-6" />
              <span className="text-xs font-medium">Seguindo</span>
            </button>
            <button
              onClick={handleCreatePost}
              className="flex justify-center -mt-4"
            >
              <div className="w-14 h-14 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] rounded-2xl flex items-center justify-center shadow-lg">
                <Plus className="w-7 h-7 text-black" />
              </div>
            </button>
            <button
              onClick={handlePerfilClick}
              className="flex flex-col items-center gap-1 py-2 text-gray-400"
            >
              <User className="w-6 h-6" />
              <span className="text-xs font-medium">Meu Feed</span>
            </button>
            <button
              onClick={() => navigate('/salvos')}
              className="flex flex-col items-center gap-1 py-2 text-[#D4AF37]"
            >
              <Bookmark className="w-6 h-6 fill-current" />
              <span className="text-xs font-medium">Salvos</span>
            </button>
          </div>
        </nav>
      )}

      {/* Desktop Floating Create Button */}
      {canPost && (
        <button
          onClick={handleCreatePost}
          className="hidden md:flex fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] hover:from-[#D4AF37] hover:to-[#B8941E] text-black rounded-full shadow-lg items-center justify-center transition-all hover:scale-110 z-50"
          title="Criar Post"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Floating Saved Posts Button - Desktop Only (mobile tem na navegação inferior) */}
      {isLoggedIn && (
        <button
          onClick={() => navigate('/salvos')}
          className="hidden md:flex fixed bottom-8 left-8 w-14 h-14 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] hover:from-[#D4AF37] hover:to-[#B8941E] text-black rounded-full shadow-xl items-center justify-center transition-all hover:scale-110 z-50 group"
          title="Posts Salvos"
        >
          <Bookmark className="w-6 h-6 fill-current" />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Posts Salvos
          </span>
        </button>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
      />

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-gray-900 to-black border border-[#D4AF37]/20 rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#F4D03F] via-[#D4AF37] to-[#C6941E] rounded-full flex items-center justify-center">
                <Lock className="w-10 h-10 text-black" />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-white">Entre para Continuar</h2>
                <p className="text-gray-300 text-base">
                  Faça login para acessar conteúdo exclusivo, seguir perfis e interagir com a comunidade com.rich
                </p>
              </div>

              <div className="w-full space-y-3 pt-4">
                <button
                  onClick={() => navigate('/entrar')}
                  className="w-full py-3.5 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] hover:from-[#D4AF37] hover:to-[#B8941E] text-black font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  Fazer Login
                </button>

                <button
                  onClick={() => navigate('/cadastro')}
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all"
                >
                  Criar Conta
                </button>

                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-3 text-gray-400 hover:text-white font-medium transition-colors"
                >
                  Continuar Explorando
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Required Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-gray-900 to-black border border-[#D4AF37]/20 rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#F4D03F] via-[#D4AF37] to-[#C6941E] rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-black" />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-white">Plano Premium Necessário</h2>
                <p className="text-gray-300 text-base">
                  Faça upgrade para Prime, Elite ou Supreme para criar posts e compartilhar conteúdo com a comunidade!
                </p>
              </div>

              <div className="w-full space-y-3 pt-4">
                <button
                  onClick={() => navigate('/valores')}
                  className="w-full py-3.5 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] hover:from-[#D4AF37] hover:to-[#B8941E] text-black font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  Ver Planos
                </button>

                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-3 text-gray-400 hover:text-white font-medium transition-colors"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
