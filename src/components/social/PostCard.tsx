import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical, Flag, CreditCard as Edit2, Trash2, Link as LinkIcon, Eye, EyeOff, Store, UserPlus, UserMinus, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CommentsModal } from './CommentsModal';
import { ReportModal } from './ReportModal';
import { EditPostModal } from './EditPostModal';
import { createSafeInternalUrl } from '../../lib/security/urlValidator';

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
const normalizeMediaUrls = (media_urls: (string | MediaItem)[] | undefined, content_type: string): MediaItem[] => {
  if (!media_urls || media_urls.length === 0) return [];

  return media_urls.map(item => {
    if (typeof item === 'string') {
      // Detect type from URL or content_type
      const isVideo = item.includes('.mp4') || item.includes('.webm') || item.includes('.mov') || content_type === 'video';
      return {
        type: isVideo ? 'video' : 'image',
        url: item
      };
    }
    return item;
  });
};

interface UserProfile {
  subdomain: string;
  display_name: string;
  avatar_url?: string;
  has_store?: boolean;
  whatsapp_number?: string;
  show_whatsapp_on_posts?: boolean;
  show_store_icon_on_posts?: boolean;
}

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  globalAudioEnabled?: boolean;
  onToggleGlobalAudio?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onReport,
  globalAudioEnabled = false,
  onToggleGlobalAudio
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [stats, setStats] = useState({
    likes: 0,
    comments: 0,
    shares: 0
  });
  const [showMenu, setShowMenu] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const normalizedMedia = normalizeMediaUrls(post.media_urls, post.content_type);
  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPostStats();
    checkUserInteractions();
    loadUserProfile();
    checkFollowStatus();
    setIsOwner(user?.id === post.user_id);
  }, [post.id, user]);

  // Autoplay video when in viewport
  useEffect(() => {
    if (!videoRef.current || !containerRef.current) return;

    const video = videoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(err => console.log('Autoplay prevented:', err));
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [currentMediaIndex, normalizedMedia]);

  // Sync audio with global preference
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !globalAudioEnabled;
    }
  }, [globalAudioEnabled]);

  const handleVideoClick = () => {
    if (onToggleGlobalAudio) {
      onToggleGlobalAudio();
    }
  };

  const loadPostStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_post_stats', {
        post_uuid: post.id
      });

      if (!error && data && data.length > 0) {
        setStats({
          likes: parseInt(data[0].likes_count || '0'),
          comments: parseInt(data[0].comments_count || '0'),
          shares: parseInt(data[0].shares_count || '0')
        });
      }
    } catch (err) {
      console.error('Error loading post stats:', err);
    }
  };

  const checkUserInteractions = async () => {
    if (!user) return;

    try {
      const { data: likeData } = await supabase
        .from('social_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();

      setLiked(!!likeData);

      const { data: bookmarkData } = await supabase
        .from('social_bookmarks')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();

      setBookmarked(!!bookmarkData);
    } catch (err) {
      console.error('Error checking user interactions:', err);
    }
  };

  const loadUserProfile = async () => {
    try {
      // Get all profiles for this user, ordered by creation date
      const { data: profilesData, error } = await supabase
        .from('user_profiles')
        .select('id, subdomain, display_name, avatar_url, whatsapp_number, show_whatsapp_on_posts, show_store_icon_on_posts, created_at')
        .eq('user_id', post.user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[PostCard] Error loading profiles:', error);
        return;
      }

      // Use the first profile (most recent if multiple)
      const profileData = profilesData?.[0];

      if (profileData) {
        console.log('[PostCard] Loaded profile:', profileData);

        // Check if user has any active links (store)
        const { data: linksData } = await supabase
          .from('profile_links')
          .select('id')
          .eq('profile_id', profileData.id)
          .limit(1);

        setUserProfile({
          subdomain: profileData.subdomain,
          display_name: profileData.display_name,
          avatar_url: profileData.avatar_url,
          whatsapp_number: profileData.whatsapp_number,
          show_whatsapp_on_posts: profileData.show_whatsapp_on_posts,
          show_store_icon_on_posts: profileData.show_store_icon_on_posts,
          has_store: (linksData && linksData.length > 0) || false
        });
      } else {
        console.warn('[PostCard] No profile found for user_id:', post.user_id);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || !post.user_id || user.id === post.user_id) return;

    try {
      const { data, error } = await supabase
        .from('social_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', post.user_id)
        .maybeSingle();

      if (!error && data) {
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) {
      alert('Faça login para seguir usuários');
      return;
    }

    if (user.id === post.user_id) return;

    try {
      if (isFollowing) {
        await supabase
          .from('social_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', post.user_id);
        setIsFollowing(false);
      } else {
        await supabase
          .from('social_follows')
          .insert({
            follower_id: user.id,
            following_id: post.user_id
          });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      alert('Erro ao seguir/deixar de seguir');
    }
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      if (liked) {
        await supabase
          .from('social_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        setLiked(false);
        setStats(prev => ({ ...prev, likes: Math.max(0, prev.likes - 1) }));
      } else {
        await supabase
          .from('social_likes')
          .insert({ post_id: post.id, user_id: user.id });
        setLiked(true);
        setStats(prev => ({ ...prev, likes: prev.likes + 1 }));
      }

      onLike?.();
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleBookmark = async () => {
    if (!user) return;

    try {
      if (bookmarked) {
        await supabase
          .from('social_bookmarks')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        setBookmarked(false);
      } else {
        await supabase
          .from('social_bookmarks')
          .insert({ post_id: post.id, user_id: user.id });
        setBookmarked(true);
      }
    } catch (err) {
      console.error('Error bookmarking post:', err);
    }
  };

  const handleShare = async () => {
    try {
      const postUrl = `${window.location.origin}/social?post=${post.id}`;
      const shareData = {
        title: userProfile?.display_name ? `Post de ${userProfile.display_name}` : 'Veja este post',
        text: post.caption || 'Confira este post incrível!',
        url: postUrl
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);

        await supabase
          .from('social_shares')
          .insert({ post_id: post.id, user_id: user?.id });

        setStats(prev => ({ ...prev, shares: prev.shares + 1 }));
        onShare?.();
      } else if (navigator.share) {
        try {
          await navigator.share(shareData);

          await supabase
            .from('social_shares')
            .insert({ post_id: post.id, user_id: user?.id });

          setStats(prev => ({ ...prev, shares: prev.shares + 1 }));
          onShare?.();
        } catch (shareErr: any) {
          if (shareErr.name !== 'AbortError') {
            await handleCopyLinkFallback(postUrl);
          }
        }
      } else {
        await handleCopyLinkFallback(postUrl);
      }
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  const handleCopyLinkFallback = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copiado para a área de transferência!');

      await supabase
        .from('social_shares')
        .insert({ post_id: post.id, user_id: user?.id });

      setStats(prev => ({ ...prev, shares: prev.shares + 1 }));
      onShare?.();
    } catch (clipErr) {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Link copiado para a área de transferência!');

        await supabase
          .from('social_shares')
          .insert({ post_id: post.id, user_id: user?.id });

        setStats(prev => ({ ...prev, shares: prev.shares + 1 }));
        onShare?.();
      } catch (e) {
        alert(`Copie este link manualmente: ${url}`);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleCopyLink = async () => {
    const postUrl = `${window.location.origin}/social?post=${post.id}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      alert('Link copiado!');
      setShowMenu(false);
    } catch (err) {
      console.error('Error copying link:', err);
    }
  };

  const handleDelete = async () => {
    console.log('[PostCard] Delete button clicked for post:', post.id);
    setShowMenu(false);

    if (!confirm('Tem certeza que deseja excluir este post?')) {
      console.log('[PostCard] Delete cancelled by user');
      return;
    }

    console.log('[PostCard] Starting delete process...');

    try {
      console.log('[PostCard] Updating post is_active to false...');
      const { error } = await supabase
        .from('social_posts')
        .update({ is_active: false })
        .eq('id', post.id);

      if (error) {
        console.error('[PostCard] Error from Supabase:', error);
        throw error;
      }

      console.log('[PostCard] Post deleted successfully');
      alert('Post excluído com sucesso!');
      window.location.reload();
    } catch (err) {
      console.error('[PostCard] Error deleting post:', err);
      alert('Erro ao excluir post. Tente novamente.');
    }
  };

  const handleTogglePrivacy = async () => {
    try {
      const newPrivacy = post.privacy === 'public' ? 'private' : 'public';

      const { error } = await supabase
        .from('social_posts')
        .update({ privacy: newPrivacy })
        .eq('id', post.id);

      if (error) throw error;

      alert(`Post agora é ${newPrivacy === 'public' ? 'público' : 'privado'}!`);
      window.location.reload();
    } catch (err) {
      console.error('Error toggling privacy:', err);
      alert('Erro ao alterar privacidade');
    }
  };

  return (
    <div ref={containerRef} className="relative bg-black overflow-hidden h-screen w-full md:max-w-md md:mx-auto md:h-[80vh] md:my-auto md:rounded-2xl md:border md:border-gray-800 pt-0 md:pt-0">
      {/* Background Media */}
      {normalizedMedia && normalizedMedia.length > 0 && (
        <div className="absolute inset-0 w-full h-full z-0">
          {normalizedMedia[currentMediaIndex]?.type === 'video' ? (
            <video
              ref={videoRef}
              src={normalizedMedia[currentMediaIndex].url}
              className="w-full h-full object-cover md:rounded-2xl cursor-pointer"
              playsInline
              loop
              muted={!globalAudioEnabled}
              onClick={handleVideoClick}
            />
          ) : (
            <img
              src={normalizedMedia[currentMediaIndex]?.url}
              alt="Post content"
              className="w-full h-full object-cover md:rounded-2xl"
            />
          )}
          {/* Dark overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-b via-transparent to-black/80 md:rounded-2xl pointer-events-none">
            {/* Mobile gradient */}
            <div
              className="absolute inset-0 md:hidden"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.6) 15%, transparent 30%, transparent 70%, rgba(0,0,0,0.8) 100%)'
              }}
            />
            {/* Desktop/Tablet gradient - stronger at top */}
            <div
              className="hidden md:block absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.7) 10%, rgba(0,0,0,0.3) 20%, transparent 30%, transparent 70%, rgba(0,0,0,0.8) 100%)'
              }}
            />
          </div>
        </div>
      )}

      {/* Top Section - User Info */}
      <div className="absolute left-0 right-0 px-4 py-3 flex items-center justify-between z-30 top-[env(safe-area-inset-top)] md:!top-0">
        <div className="flex items-center gap-3">
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt={userProfile.display_name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white/30 shadow-lg"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-semibold ring-2 ring-white/30 shadow-lg">
              {userProfile?.display_name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white drop-shadow-lg">
                {userProfile?.display_name || 'Usuário'}
              </span>
              {!isOwner && user && (
                <button
                  onClick={handleFollowToggle}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all backdrop-blur-sm ${
                    isFollowing
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600'
                  }`}
                >
                  {isFollowing ? (
                    <span className="flex items-center gap-1">
                      <UserMinus className="w-3 h-3" />
                      Seguindo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <UserPlus className="w-3 h-3" />
                      Seguir
                    </span>
                  )}
                </button>
              )}
            </div>
            <div className="text-xs text-white/80 drop-shadow-lg">
              @{userProfile?.subdomain || 'user'} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
          >
            <MoreVertical className="w-5 h-5 text-white drop-shadow-lg" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#2A2A2A] rounded-lg shadow-xl border border-gray-700 py-1 z-[60]">
              {isOwner && (
                <>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowEdit(true);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-white/5 flex items-center gap-2 text-cyan-400"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar Post
                  </button>
                  <button
                    onClick={handleTogglePrivacy}
                    className="w-full px-4 py-2 text-left hover:bg-white/5 flex items-center gap-2 text-blue-400"
                  >
                    {post.privacy === 'public' ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Tornar Privado
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Tornar Público
                      </>
                    )}
                  </button>
                  <div className="border-t border-gray-700 my-1" />
                </>
              )}
              <button
                onClick={handleCopyLink}
                className="w-full px-4 py-2 text-left hover:bg-white/5 flex items-center gap-2 text-gray-300"
              >
                <LinkIcon className="w-4 h-4" />
                Copiar Link
              </button>
              {isOwner && (
                <>
                  <div className="border-t border-gray-700 my-1" />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-white/5 flex items-center gap-2 text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir Post
                  </button>
                </>
              )}
              {!isOwner && (
                <>
                  <div className="border-t border-gray-700 my-1" />
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowReport(true);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-white/5 flex items-center gap-2 text-red-400"
                  >
                    <Flag className="w-4 h-4" />
                    Denunciar Post
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media Navigation Dots */}
      {normalizedMedia && normalizedMedia.length > 1 && (
        <div className="absolute left-1/2 transform -translate-x-1/2 flex gap-2 z-20" style={{ top: 'calc(env(safe-area-inset-top) + 130px)' }}>
          {normalizedMedia.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentMediaIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors shadow-lg ${
                index === currentMediaIndex ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Bottom Left Section - Caption */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-24 sm:pb-22 lg:pb-20 z-30">
        {/* Caption */}
        {post.caption && (
          <div className="max-h-16 sm:max-h-18 lg:max-h-24 overflow-y-auto pr-16 sm:pr-18 lg:pr-24">
            <p className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] whitespace-pre-wrap text-sm sm:text-base lg:text-lg leading-relaxed">
              {post.caption.split(/(#\w+)/g).map((part, i) =>
                part.startsWith('#') ? (
                  <span key={i} className="text-cyan-400 font-medium">
                    {part}
                  </span>
                ) : (
                  part
                )
              )}
            </p>
          </div>
        )}
      </div>

      {/* Right Side Actions - TikTok Style (Mobile, Tablet & Desktop) */}
      <div className="absolute right-3 sm:right-4 md:right-5 lg:right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 sm:gap-4 lg:gap-5 z-20">
        {/* Store Button - Only if user has enabled store icon on posts */}
        {userProfile?.show_store_icon_on_posts && userProfile?.subdomain && (
          <button
            onClick={() => {
              // Validate and create safe URL to prevent XSS attacks
              const safeUrl = createSafeInternalUrl(userProfile.subdomain, 'loja');
              if (safeUrl) {
                navigate(safeUrl);
              } else {
                console.warn('[Security] Blocked invalid store link');
              }
            }}
            className="flex flex-col items-center gap-1 hover:scale-110 transition-all duration-300 group relative"
            title="Visitar Loja Premium"
          >
            {/* Premium Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 via-blue-500/20 to-purple-600/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150"></div>

            {/* Main Button */}
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex items-center justify-center backdrop-blur-md bg-gradient-to-br from-cyan-500/90 via-blue-600/90 to-purple-700/90 group-hover:from-cyan-400 group-hover:via-blue-500 group-hover:to-purple-600 rounded-full shadow-2xl ring-2 ring-cyan-400/40 group-hover:ring-cyan-300/60 transition-all duration-300">
              {/* Inner shimmer effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <Store className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] relative z-10" />
            </div>

            <span className="text-[10px] sm:text-xs font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] opacity-0 group-hover:opacity-100 transition-all duration-300">
              LOJA
            </span>
          </button>
        )}

        {/* WhatsApp Button - Only if user has enabled it */}
        {userProfile?.show_whatsapp_on_posts && userProfile?.whatsapp_number && (
          <a
            href={`https://wa.me/${userProfile.whatsapp_number.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
            title="Falar no WhatsApp"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex items-center justify-center backdrop-blur-sm bg-black/30 rounded-full shadow-lg">
              <Phone className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white drop-shadow-lg" />
            </div>
          </a>
        )}

        {/* Like */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex items-center justify-center backdrop-blur-sm bg-black/30 rounded-full shadow-lg">
            <Heart
              className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 drop-shadow-lg ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`}
            />
          </div>
          {stats.likes > 0 && (
            <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-white drop-shadow-lg">{stats.likes}</span>
          )}
        </button>

        {/* Comments */}
        <button
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex items-center justify-center backdrop-blur-sm bg-black/30 rounded-full shadow-lg">
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white drop-shadow-lg" />
          </div>
          {stats.comments > 0 && (
            <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-white drop-shadow-lg">{stats.comments}</span>
          )}
        </button>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex items-center justify-center backdrop-blur-sm bg-black/30 rounded-full shadow-lg">
            <Bookmark
              className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 drop-shadow-lg ${bookmarked ? 'fill-yellow-500 text-yellow-500' : 'text-white'}`}
            />
          </div>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex items-center justify-center backdrop-blur-sm bg-black/30 rounded-full shadow-lg">
            <Share2 className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white drop-shadow-lg" />
          </div>
          {stats.shares > 0 && (
            <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-white drop-shadow-lg">{stats.shares}</span>
          )}
        </button>
      </div>


      <CommentsModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        postId={post.id}
      />

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        postId={post.id}
      />

      <EditPostModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        postId={post.id}
        currentCaption={post.caption}
        onPostUpdated={() => {
          setShowEdit(false);
          window.location.reload();
        }}
      />
    </div>
  );
};
