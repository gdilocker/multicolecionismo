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
  profile_id?: string;
  content: string;
  media_url?: string;
  media_type?: string;
  is_public: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at?: string;
  profile?: {
    id: string;
    subdomain: string;
    display_name: string;
    avatar_url?: string;
    bio?: string;
    whatsapp?: string;
    show_whatsapp_on_posts?: boolean;
  }[];
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
        .select(`
          *,
          profile:user_profiles!user_id (
            id,
            subdomain,
            display_name,
            avatar_url,
            bio,
            whatsapp,
            show_whatsapp_on_posts
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // For logged out users, only show public posts
      if (!user && mode !== 'my_posts') {
        console.log('[FEED] Applying is_public filter for logged out user');
        query = query.eq('is_public', true);
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

        // If column doesn't exist error, try without explicit select
        if (fetchError.message?.includes('does not exist')) {
          console.log('[FEED] Retrying with wildcard select...');
          const { data: retryData, error: retryError } = await supabase
            .from('social_posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

          if (retryError) {
            console.error('[FEED] Retry also failed:', retryError);
            throw retryError;
          }

          // Use retry data
          console.log('[FEED] Retry successful, got', retryData?.length || 0, 'posts');
          const transformedPosts = (retryData || []).map(post => {
            const media: MediaItem[] = [];
            if (post.media_url) {
              const isVideo = post.media_type === 'video' ||
                             post.media_url.includes('.webm') ||
                             post.media_url.includes('.mp4') ||
                             post.media_url.includes('.mov');
              media.push({
                type: isVideo ? 'video' : 'image',
                url: post.media_url
              });
            }
            return { ...post, media };
          });
          setPosts(transformedPosts as any);
          setHasMore((retryData?.length || 0) >= 20);
          setLoading(false);
          return;
        }

        throw fetchError;
      }

      console.log('[FEED] Loaded', data?.length || 0, 'posts');
      console.log('[FEED] First post sample:', data?.[0]);
      if (data?.[0]?.profile) {
        console.log('[FEED] Profile data loaded:', data[0].profile);
      } else {
        console.warn('[FEED] No profile data in response! May need to fetch separately.');
      }

      const transformedPosts = (data || []).map(post => {
        // Convert single media_url to array format for compatibility
        const media: MediaItem[] = [];
        if (post.media_url) {
          const isVideo = post.media_type === 'video' ||
                         post.media_url.includes('.webm') ||
                         post.media_url.includes('.mp4') ||
                         post.media_url.includes('.mov');
          media.push({
            type: isVideo ? 'video' : 'image',
            url: post.media_url
          });
        }

        return {
          ...post,
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
