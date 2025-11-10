import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Lock, LogIn, UserPlus, Search, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

interface Post {
  id: string;
  user_id: string;
  content_type: string;
  caption: string;
  media_urls: string[];
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  user_profiles?: {
    subdomain: string;
    display_name: string;
    avatar_url?: string;
  };
}

export default function Home() {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    loadPublicPosts();
  }, []);

  const loadPublicPosts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          user_profiles!inner(subdomain, display_name, avatar_url)
        `)
        .eq('is_active', true)
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInteractionClick = () => {
    setShowLoginModal(true);
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  if (user) {
    navigate('/social');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">Multicolecionismo</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleGoogleLogin}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Entrar
              </button>
              <Link
                to="/register"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Cadastrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold mb-4"
          >
            A Rede Social dos Colecionadores
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl mb-8 text-blue-100"
          >
            Compartilhe suas coleções, descubra produtos e conecte-se com outros colecionadores
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={handleGoogleLogin}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Entrar com Google
            </button>
            <Link
              to="/marketplace"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all"
            >
              <Search className="w-5 h-5" />
              Ver Produtos
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Feed Section */}
      <section className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Posts em Destaque
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">Nenhum post público ainda</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Post Header */}
                <div className="p-4 flex items-center gap-3">
                  {post.user_profiles?.avatar_url ? (
                    <img
                      src={post.user_profiles.avatar_url}
                      alt={post.user_profiles.display_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">
                        {post.user_profiles?.display_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {post.user_profiles?.display_name || 'Usuário'}
                    </p>
                    <p className="text-sm text-gray-500">
                      @{post.user_profiles?.subdomain || 'unknown'}
                    </p>
                  </div>
                </div>

                {/* Post Media */}
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="relative bg-black">
                    <img
                      src={post.media_urls[0]}
                      alt="Post"
                      className="w-full h-auto max-h-[600px] object-contain"
                    />
                  </div>
                )}

                {/* Post Actions - Blocked */}
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      onClick={handleInteractionClick}
                      className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors group"
                    >
                      <Heart className="w-6 h-6" />
                      <span className="text-sm font-medium">{post.likes_count || 0}</span>
                      <Lock className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button
                      onClick={handleInteractionClick}
                      className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors group"
                    >
                      <MessageCircle className="w-6 h-6" />
                      <span className="text-sm font-medium">{post.comments_count || 0}</span>
                      <Lock className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button
                      onClick={handleInteractionClick}
                      className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors group ml-auto"
                    >
                      <Share2 className="w-6 h-6" />
                      <Lock className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>

                  {/* Caption */}
                  {post.caption && (
                    <p className="text-gray-900">
                      <span className="font-semibold mr-2">
                        {post.user_profiles?.display_name || 'Usuário'}
                      </span>
                      {post.caption}
                    </p>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {/* CTA to Login */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-8 text-center border border-blue-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Pronto para participar?
          </h3>
          <p className="text-gray-700 mb-6">
            Cadastre-se agora para curtir, comentar e compartilhar posts!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleGoogleLogin}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Entrar com Google
            </button>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showLoginModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowLoginModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full pointer-events-auto shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Faça login para continuar
                </h3>
                <p className="text-gray-600 mb-6">
                  Entre para curtir, comentar e interagir com a comunidade
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-lg transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuar com Google
                  </button>
                  <Link
                    to="/login"
                    className="w-full inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all text-center"
                  >
                    Entrar com Email
                  </Link>
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="w-full px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
