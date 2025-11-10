import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  postId
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const reasons = [
    'Spam',
    'Conteúdo inadequado',
    'Assédio ou bullying',
    'Violação de direitos autorais',
    'Informação falsa',
    'Outro'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reason) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('social_reports')
        .insert({
          post_id: postId,
          reported_by: user.id,
          reason,
          details: details.trim(),
          status: 'pending'
        });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason('');
        setDetails('');
      }, 2000);
    } catch (err) {
      console.error('Error submitting report:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl max-w-md w-full border border-gray-800">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Denunciar Post
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-semibold mb-2">Denúncia enviada!</p>
            <p className="text-gray-400 text-sm">Obrigado por nos ajudar a manter a comunidade segura.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <p className="text-gray-400 text-sm mb-4">
              Por favor, selecione um motivo para a denúncia:
            </p>

            <div className="space-y-2 mb-4">
              {reasons.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4 text-red-500"
                  />
                  <span className="text-white">{r}</span>
                </label>
              ))}
            </div>

            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Detalhes adicionais (opcional)"
              className="w-full bg-white/5 text-white placeholder-gray-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={3}
              maxLength={500}
            />

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!reason || submitting}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Enviando...' : 'Denunciar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
