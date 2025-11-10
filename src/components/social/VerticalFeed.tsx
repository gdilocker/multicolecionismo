import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { PostCard } from './PostCard';
import { Loader, AlertCircle } from 'lucide-react';

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
  is_active: boolean;
  created_at: string;
}

type FeedMode = 'all' | 'following' | 'my_posts';

interface VerticalFeedProps {
  mode?: FeedMode;
  userId?: string;
}

export const VerticalFeed: React.FC<VerticalFeedProps> = ({ mode = 'all', userId }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [globalAudioEnabled, setGlobalAudioEnabled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const handleToggleGlobalAudio = () => {
    setGlobalAudioEnabled(prev => !prev);
  };

  useEffect(() => {
    loadPosts();
  }, [mode, user]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('[FEED] Loading posts, mode:', mode);

      let query = supabase
        .from('social_posts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      // For logged out users, only show public posts
      if (!user && mode !== 'my_posts') {
        query = query.eq('privacy', 'public');
      }

      if (mode === 'my_posts' && userId) {
        query = query.eq('user_id', userId);
      } else if (mode === 'following' && user) {
        const { data: following } = await supabase
          .from('social_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (following && following.length > 0) {
          const followingIds = following.map(f => f.following_id);
          query = query.in('user_id', followingIds);
        } else {
          setPosts([]);
          setLoading(false);
          return;
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('[FEED] Error:', fetchError);
        throw fetchError;
      }

      console.log('[FEED] Loaded', data?.length || 0, 'posts');
      console.log('[FEED] First post sample:', data?.[0]);

      const transformedPosts = (data || []).map(post => {
        const mediaUrls = post.media_urls || [];

        const media = Array.isArray(mediaUrls)
          ? mediaUrls.map((url: string) => {
              const isVideo = url.includes('.webm') || url.includes('.mp4') || url.includes('.mov');
              return {
                type: isVideo ? 'video' : 'image',
                url
              };
            })
          : [];

        return {
          ...post,
          media_urls: media,
          media
        };
      });

      console.log('[FEED] Transformed posts with media:', transformedPosts[0]);

      setPosts(transformedPosts as any);
      setHasMore((data?.length || 0) >= 20);
    } catch (err: any) {
      console.error('Error loading posts:', err);
      setError(err.message || 'Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  };

  const scrollToPost = useCallback((index: number) => {
    if (isScrolling.current) return;

    const container = containerRef.current;
    if (!container) return;

    const targetPost = container.children[index] as HTMLElement;
    if (!targetPost) return;

    isScrolling.current = true;

    targetPost.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    setTimeout(() => {
      isScrolling.current = false;
    }, 500);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;
    let touchEndY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndY = e.changedTouches[0].clientY;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeDistance = touchStartY - touchEndY;
      const minSwipeDistance = 50;

      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0 && currentIndex < posts.length - 1) {
          setCurrentIndex(prev => prev + 1);
          scrollToPost(currentIndex + 1);
        } else if (swipeDistance < 0 && currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          scrollToPost(currentIndex - 1);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (isScrolling.current) return;

      if (e.deltaY > 0 && currentIndex < posts.length - 1) {
        setCurrentIndex(prev => prev + 1);
        scrollToPost(currentIndex + 1);
      } else if (e.deltaY < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        scrollToPost(currentIndex - 1);
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [currentIndex, posts.length, scrollToPost]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen px-4 bg-black">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-300">{error}</p>
          <button
            onClick={loadPosts}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] hover:from-[#D4AF37] hover:to-[#B8941E] text-black font-semibold rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen px-4 bg-black">
        <div className="text-center">
          <p className="text-xl text-white mb-2">Nenhum post ainda</p>
          <p className="text-gray-400">
            {mode === 'following'
              ? "Comece a seguir pessoas para ver seus posts aqui"
              : "Seja o primeiro a criar um post!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory bg-black scrollbar-hide"
      style={{
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      {posts.map((post, index) => (
        <div
          key={post.id}
          className="h-screen snap-start snap-always bg-black flex items-center justify-center"
          style={{
            transform: 'translateZ(0)',
            willChange: 'transform'
          }}
        >
          <PostCard
            post={post}
            onLike={loadPosts}
            onComment={() => {}}
            onShare={loadPosts}
            onReport={() => {}}
            globalAudioEnabled={globalAudioEnabled}
            onToggleGlobalAudio={handleToggleGlobalAudio}
          />
        </div>
      ))}

      {posts.length > 0 && (
        <div className="fixed bottom-8 right-24 flex flex-col gap-2 z-20">
          {posts.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                scrollToPost(index);
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-yellow-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
