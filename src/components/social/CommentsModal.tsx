import React, { useState, useEffect } from 'react';
import { X, Send, MoreVertical, Trash2, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CONTENT_LIMITS, validateCommentText } from '../../lib/contentLimits';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  user_liked?: boolean;
  user_profile?: {
    display_name: string;
    avatar_url?: string;
    subdomain: string;
  };
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onCommentAdded?: () => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  postId,
  onCommentAdded
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data: commentsData, error } = await supabase
        .from('social_comments')
        .select(`
          id,
          user_id,
          content,
          created_at
        `)
        .eq('post_id', postId)
        .is('parent_id', null)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load user profiles and interaction data
      const enrichedComments = await Promise.all(
        (commentsData || []).map(async (comment) => {
          // Get user profile
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('display_name, avatar_url, subdomain')
            .eq('user_id', comment.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get likes count
          const { count: likesCount } = await supabase
            .from('social_comment_likes')
            .select('*', { count: 'exact', head: true })
            .eq('comment_id', comment.id);

          // Check if current user liked this comment
          let userLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('social_comment_likes')
              .select('id')
              .eq('comment_id', comment.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userLiked = !!likeData;
          }

          return {
            ...comment,
            likes_count: likesCount || 0,
            user_liked: userLiked,
            user_profile: profileData
          };
        })
      );

      setComments(enrichedComments);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    const validation = validateCommentText(newComment);
    if (!validation.valid) {
      alert(validation.error || 'Comentário inválido');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('social_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
          is_active: true
        });

      if (error) throw error;

      setNewComment('');
      await loadComments();
      onCommentAdded?.();
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Erro ao postar comentário. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Deseja deletar este comentário?')) return;

    try {
      const { error } = await supabase
        .from('social_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await loadComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Erro ao deletar comentário.');
    }
  };

  const handleLikeComment = async (commentId: string, currentlyLiked: boolean) => {
    if (!user) {
      alert('Faça login para curtir comentários');
      return;
    }

    try {
      if (currentlyLiked) {
        await supabase
          .from('social_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('social_comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          });
      }

      await loadComments();
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-[#1A1A1A] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            Comentários {comments.length > 0 && `(${comments.length})`}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-gray-400 mt-2">Carregando comentários...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Nenhum comentário ainda.</p>
              <p className="text-gray-500 text-sm mt-1">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {comment.user_profile?.avatar_url ? (
                    <img
                      src={comment.user_profile.avatar_url}
                      alt={comment.user_profile.display_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#F4D03F] to-[#C6941E] flex items-center justify-center">
                      <span className="text-black font-bold">
                        {comment.user_profile?.display_name?.[0] || '?'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-[#252525] rounded-2xl px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => navigate(`/${comment.user_profile?.subdomain}`)}
                          className="font-semibold text-white hover:underline text-sm"
                        >
                          {comment.user_profile?.display_name || 'Usuário'}
                        </button>
                        <p className="text-gray-300 text-sm mt-1 break-words">
                          {comment.content}
                        </p>
                      </div>

                      {/* Menu for owner */}
                      {user?.id === comment.user_id && (
                        <div className="relative">
                          <button
                            onClick={() => setActiveMenu(activeMenu === comment.id ? null : comment.id)}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                          {activeMenu === comment.id && (
                            <div className="absolute right-0 mt-1 bg-[#1A1A1A] border border-gray-800 rounded-lg shadow-xl py-1 z-10 min-w-[120px]">
                              <button
                                onClick={() => {
                                  handleDeleteComment(comment.id);
                                  setActiveMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Deletar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comment Actions */}
                  <div className="flex items-center gap-4 mt-2 px-2">
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                    <button
                      onClick={() => handleLikeComment(comment.id, comment.user_liked || false)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${comment.user_liked ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      {comment.likes_count > 0 && (
                        <span className={comment.user_liked ? 'text-red-500' : ''}>
                          {comment.likes_count}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        {user ? (
          <div className="sticky bottom-0 bg-[#1A1A1A] border-t border-gray-800 p-4">
            <form onSubmit={handleSubmitComment} className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#F4D03F] to-[#C6941E] flex items-center justify-center">
                  <span className="text-black font-bold">
                    {user.email?.[0].toUpperCase() || '?'}
                  </span>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva um comentário..."
                    maxLength={CONTENT_LIMITS.COMMENTS.MAX_LENGTH}
                    className="flex-1 bg-[#252525] text-white placeholder-gray-500 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    disabled={submitting}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="p-2 bg-gradient-to-r from-[#F4D03F] to-[#C6941E] text-black rounded-full hover:from-[#D4AF37] hover:to-[#B8941E] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className={`text-xs px-4 ${newComment.length >= 230 ? 'text-orange-400 font-medium' : 'text-gray-500'}`}>
                  {newComment.length}/{CONTENT_LIMITS.COMMENTS.MAX_LENGTH}
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div className="sticky bottom-0 bg-[#1A1A1A] border-t border-gray-800 p-4 text-center">
            <p className="text-gray-400 text-sm">
              <a href="/entrar" className="text-[#D4AF37] hover:underline">Faça login</a> para comentar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
