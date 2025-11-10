import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PostCard } from '../components/social/PostCard';
import Logo from '../components/Logo';


interface MediaItem {
  type: 'image' | 'video' | 'file';
  url: string;
}

interface Post {
  id: string;
  user_id: string;
  content_type: string;
  caption: string;
  media_urls: (string | MediaItem)[];
  privacy: string;
  hashtags: string[];
  created_at: string;
}

// Helper function to normalize media URLs
const normalizeMediaUrl = (url: string | MediaItem, content_type: string): MediaItem => {
  if (typeof url === 'string') {
    const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || content_type === 'video';
    return {
      type: isVideo ? 'video' : 'image',
      url: url
    };
  }
  return url;
};

export default function SavedPosts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/entrar');
      return;
    }
    loadSavedPosts();
  }, [user]);

  const loadSavedPosts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get bookmarked post IDs
      const { data: bookmarksData, error: bookmarksError } = await supabase
        .from('social_bookmarks')
        .select('post_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (bookmarksError) throw bookmarksError;

      if (!bookmarksData || bookmarksData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get the actual posts
      const postIds = bookmarksData.map(b => b.post_id);
      const { data: postsData, error: postsError } = await supabase
        .from('social_posts')
        .select('*')
        .in('id', postIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      setPosts(postsData || []);
    } catch (err) {
      console.error('Error loading saved posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (postId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('social_bookmarks')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Error removing bookmark:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-md z-40 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/social')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Logo size={32} />
            <Bookmark className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-base font-bold text-white">Salvos</span>
          </div>

          <div className="w-10"></div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-md z-40 border-b border-gray-800">
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
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Logo size={40} />
            </button>
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#D4AF37]" />
              <h1 className="text-xl font-bold text-white">Posts Salvos</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="pt-[calc(env(safe-area-inset-top)+60px)] md:pt-[60px]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-gray-400 mt-4">Carregando posts salvos...</p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-full mb-6">
              <Bookmark className="w-16 h-16 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Nenhum post salvo</h2>
            <p className="text-gray-400 text-center max-w-md mb-6">
              Quando você salvar posts, eles aparecerão aqui para você acessar facilmente
            </p>
            <button
              onClick={() => navigate('/social')}
              className="px-6 py-3 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black font-semibold rounded-full hover:from-[#D4AF37] hover:to-[#B8941E] transition-all"
            >
              Explorar Posts
            </button>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Grid View for Desktop */}
            <div className="hidden md:grid grid-cols-3 gap-4 p-4">
              {posts.map((post) => {
                const mediaItem = post.media_urls && post.media_urls.length > 0
                  ? normalizeMediaUrl(post.media_urls[0], post.content_type)
                  : null;

                return (
                  <div key={post.id} className="relative group cursor-pointer">
                    <div
                      onClick={() => navigate(`/social?post=${post.id}`)}
                      className="aspect-[9/16] rounded-2xl overflow-hidden bg-gray-900 relative"
                    >
                      {mediaItem ? (
                        <>
                          {mediaItem.type === 'video' ? (
                            <video
                              src={mediaItem.url}
                              className="w-full h-full object-cover"
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={mediaItem.url}
                              alt="Post"
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                console.error('Image failed to load:', mediaItem.url);
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="14"%3EImagem não disponível%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                          <p className="text-gray-500 text-sm">Sem mídia</p>
                        </div>
                      )}

                      {/* Caption */}
                      {post.caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-white text-sm line-clamp-3">
                            {post.caption}
                          </p>
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBookmark(post.id);
                        }}
                        className="absolute top-3 right-3 p-2 bg-red-500/80 hover:bg-red-600 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10"
                        title="Remover dos salvos"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>

                      {/* Bookmark indicator */}
                      <div className="absolute top-3 left-3 p-2 bg-[#D4AF37]/80 rounded-full backdrop-blur-sm">
                        <Bookmark className="w-4 h-4 text-black fill-black" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vertical Feed for Mobile */}
            <div className="md:hidden">
              {posts.map((post) => (
                <div key={post.id} className="relative">
                  <PostCard
                    post={post}
                    onLike={() => {}}
                    onComment={() => {}}
                    onShare={() => {}}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-2 py-2">
          <button
            onClick={() => navigate('/social')}
            className="flex flex-col items-center gap-1 py-2 px-4 text-gray-400"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-xs font-medium">Voltar</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 py-2 px-4 text-white"
          >
            <Bookmark className="w-6 h-6 fill-white" />
            <span className="text-xs font-medium">Salvos</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
