import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Settings, Home, Users, Globe, MessageCircle, User, Store, Radio, Search, MoreHorizontal, Bookmark, CircleUser as UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { VerticalFeed } from '../components/social/VerticalFeed';
import { CreatePostModal } from '../components/social/CreatePostModal';
import Logo from '../components/Logo';


type FeedMode = 'all' | 'following';

export default function MyProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [feedMode, setFeedMode] = useState<FeedMode>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const canPost = !!user;

  const handleCreatePost = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Allow all logged users to try creating a post
    // Server-side validation will handle permissions
    setShowCreateModal(true);
  };

  const handlePostCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile TikTok-style Top Menu */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-black border-b border-gray-800 z-50 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-3 py-3">
          <button
            onClick={() => navigate('/social')}
            className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">Voltar</span>
          </button>

          <h1 className="text-sm font-medium text-white">Meu Feed</h1>

          <div className="w-6" />
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/social')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center"
            >
              <Logo size={48} />
            </button>
            <h1 className="text-base font-medium text-white">Meu Feed</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Menu items removed as they are now in bottom navigation */}
          </div>
        </div>
      </header>

      {/* Feed Content */}
      <div className="md:pt-[60px]">
        <div className="max-w-2xl mx-auto">
          <VerticalFeed mode="my_posts" userId={user?.id} key={refreshKey} />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 items-end px-2 py-2">
          <button
            onClick={() => navigate('/social')}
            className="flex flex-col items-center gap-1 py-2 text-gray-400"
          >
            <Globe className="w-6 h-6" />
            <span className="text-xs font-medium">Todos</span>
          </button>
          <button
            onClick={() => {
              navigate('/social');
            }}
            className="flex flex-col items-center gap-1 py-2 text-gray-400"
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
            onClick={() => navigate('/meu-perfil')}
            className="flex flex-col items-center gap-1 py-2 text-white"
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Meu Feed</span>
          </button>
          <button
            onClick={() => navigate('/minha-pagina', { state: { from: '/meu-perfil' } })}
            className="flex flex-col items-center gap-1 py-2 text-gray-400"
          >
            <UserCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Minha Página</span>
          </button>
        </div>
      </nav>

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

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}
