import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  currentCaption: string;
  onPostUpdated?: () => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  onClose,
  postId,
  currentCaption,
  onPostUpdated
}) => {
  const [caption, setCaption] = useState(currentCaption);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCaption(currentCaption);
  }, [currentCaption, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!caption.trim()) {
      setError('A legenda não pode estar vazia');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('social_posts')
        .update({
          caption: caption.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (updateError) throw updateError;

      onPostUpdated?.();
      onClose();
    } catch (err: any) {
      console.error('Error updating post:', err);
      setError(err.message || 'Erro ao atualizar post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl max-w-lg w-full border border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-xl font-semibold text-white">Editar Post</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Escreva sua legenda..."
            className="w-full h-40 px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
            disabled={isSubmitting}
          />

          {error && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !caption.trim()}
              className="px-6 py-2 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] hover:from-[#D4AF37] hover:to-[#B8941E] text-black font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
