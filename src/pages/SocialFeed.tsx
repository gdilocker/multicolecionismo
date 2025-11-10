import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, ArrowLeft, ExternalLink, Bookmark, CircleUser as UserCircle, Home, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { VerticalFeed } from '../components/social/VerticalFeed';
import { CreatePostModal } from '../components/social/CreatePostModal';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { LoginModalSimple } from '../components/LoginModalSimple';

type FeedMode = 'all' | 'following';

export default function SocialFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subdomain } = useParams<{ subdomain?: string }>();
  const [feedMode, setFeedMode] = useState<FeedMode>('all');
  const [profileData, setProfileData] = useState<{ subdomain: string; display_name: string; user_id: string } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(!!subdomain);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
      setProfileData(data);
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

    if (!canPost) {
      setShowUpgradeModal(true);
      return;
    }

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

  const handlePerfilClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    navigate('/minha-pagina');
  };

  const handlePostCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Global Header - Used on all pages */}
      {!subdomain && <Header />}

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

      {/* Feed Content */}
      <div className="fixed inset-0 pt-[64px]">
        {/* Feed Mode Switcher - Desktop */}
        {!subdomain && (
          <div className="hidden md:block bg-black border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                {isLoggedIn && (
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1 border border-white/10">
                    <button
                      onClick={() => setFeedMode('all')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                        feedMode === 'all'
                          ? 'bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black font-semibold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={handleFollowingClick}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                        feedMode === 'following'
                          ? 'bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black font-semibold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Seguindo
                    </button>
                  </div>
                )}

                {isLoggedIn && (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => navigate('/minha-pagina', { state: { from: '/social' } })}
                      className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Meu Feed</span>
                    </button>
                    <button
                      onClick={() => navigate('/salvos')}
                      className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
                    >
                      <Bookmark className="w-4 h-4" />
                      <span>Salvos</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Vertical Feed */}
        <div className={subdomain ? "md:pt-20" : ""}>
          {subdomain && profileData ? (
            <VerticalFeed mode="my_posts" userId={profileData.user_id} key={refreshKey} />
          ) : (
            <VerticalFeed mode={feedMode} key={refreshKey} />
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation - Fixed */}
      {!subdomain && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50 pb-[env(safe-area-inset-bottom)] safe-area-bottom">
          <div className="grid grid-cols-5 items-end px-2 py-2">
            <button
              onClick={() => {
                setFeedMode('all');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center gap-1 py-2 ${feedMode === 'all' ? 'text-white' : 'text-gray-400'}`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">Início</span>
            </button>
            <button
              onClick={handleFollowingClick}
              className={`flex flex-col items-center gap-1 py-2 ${feedMode === 'following' ? 'text-white' : 'text-gray-400'}`}
            >
              <UserCircle className="w-6 h-6" />
              <span className="text-xs font-medium">Seguindo</span>
            </button>
            <button
              onClick={handleCreatePost}
              className="relative -mt-6 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#F4D03F] via-[#D4AF37] to-[#C6941E] rounded-full shadow-xl hover:scale-105 transition-transform"
            >
              <Plus className="w-7 h-7 text-black" />
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
              className="flex flex-col items-center gap-1 py-2 text-gray-400"
            >
              <Bookmark className="w-6 h-6" />
              <span className="text-xs font-medium">Salvos</span>
            </button>
          </div>
        </nav>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Upgrade Necessário</h2>
            <p className="text-gray-300 mb-6">
              Para criar posts, você precisa de um plano Prime, Elite ou Supreme.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => navigate('/valores')}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] hover:from-[#D4AF37] hover:to-[#B8941E] text-black font-bold rounded-xl transition-all shadow-lg"
              >
                Ver Planos
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <LoginModalSimple
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}
