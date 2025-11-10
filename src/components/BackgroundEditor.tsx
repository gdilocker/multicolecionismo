import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, Image as ImageIcon, Video, Palette, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import Toast from './Toast';
import {
  optimizeImage,
  validateMediaFile,
  formatFileSize,
  getRecommendedDimensions
} from '../lib/imageOptimizer';

interface BackgroundEditorProps {
  profile: {
    id: string;
    background_type?: string;
    background_color?: string;
    background_gradient_start?: string;
    background_gradient_end?: string;
    background_media_url?: string;
    background_overlay_opacity?: number;
    background_overlay_color?: string;
  };
  userId: string;
  onUpdate: (updates: any) => void;
  onDeleted?: () => void;
}

export default function BackgroundEditor({ profile, userId, onUpdate, onDeleted }: BackgroundEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [optimizationInfo, setOptimizationInfo] = useState<string>('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentMediaUrl, setCurrentMediaUrl] = useState(profile.background_media_url);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const uploadCancelRef = useRef<boolean>(false);

  const backgroundType = profile.background_type || 'solid';

  // Sync local state with prop changes
  useEffect(() => {
    console.log('🔄 BackgroundEditor: Syncing media URL from prop:', profile.background_media_url);
    setCurrentMediaUrl(profile.background_media_url);
  }, [profile.background_media_url]);

  const cancelUpload = () => {
    uploadCancelRef.current = true;
    setUploading(false);
    setUploadProgress(0);
    setOptimizationInfo('');
    setMessage('Upload cancelado');
    setMessageType('error');
  };

  const handleMediaUpload = async (file: File, type: 'image' | 'video') => {
    uploadCancelRef.current = false;

    try {
      setUploading(true);
      setUploadProgress(10);
      setOptimizationInfo('Validando arquivo...');

      const validation = await validateMediaFile(file, type);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      if (uploadCancelRef.current) {
        throw new Error('Upload cancelado');
      }

      if (validation.warnings && validation.warnings.length > 0) {
        setOptimizationInfo(validation.warnings.join(' '));
      }

      // Delete old media file before uploading new one
      if (currentMediaUrl) {
        console.log('🗑️ Deletando arquivo antigo antes do upload...', currentMediaUrl);
        const oldPath = currentMediaUrl.split('/profile-backgrounds/')[1];
        if (oldPath) {
          const { error: deleteError } = await supabase.storage
            .from('profile-backgrounds')
            .remove([oldPath]);

          if (deleteError) {
            console.warn('⚠️ Erro ao deletar arquivo antigo:', deleteError);
          } else {
            console.log('✅ Arquivo antigo deletado com sucesso');
          }
        }
      }

      setUploadProgress(20);

      let fileToUpload = file;
      let optimizationMessage = '';

      if (type === 'image') {
        setOptimizationInfo('Otimizando imagem...');
        setUploadProgress(30);

        try {
          const optimizationResult = await Promise.race([
            optimizeImage(file, {
              maxWidth: 1920,
              maxHeight: 1080,
              quality: 0.80,
              targetFormat: 'jpeg'
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Otimização demorou muito')), 30000)
            )
          ]) as any;

          fileToUpload = optimizationResult.file;

          if (optimizationResult.compressionRatio > 5) {
            optimizationMessage = ` Otimizada de ${formatFileSize(optimizationResult.originalSize)} para ${formatFileSize(optimizationResult.optimizedSize)} (${Math.round(optimizationResult.compressionRatio)}% menor)`;
          }

          setOptimizationInfo(
            `Imagem otimizada: ${optimizationResult.dimensions.width}x${optimizationResult.dimensions.height}`
          );
          setUploadProgress(45);
        } catch (optError: any) {
          console.warn('Optimization timeout, uploading original:', optError);
          if (file.size > 3 * 1024 * 1024) {
            throw new Error('Imagem muito grande e não foi possível otimizar. Use uma imagem menor que 3MB.');
          }
          setOptimizationInfo('Enviando imagem original...');
        }
      }

      setUploadProgress(50);
      setOptimizationInfo('Enviando para o servidor...');

      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${userId}/${type}-${Date.now()}.${fileExt}`;

      const uploadPromise = supabase.storage
        .from('profile-backgrounds')
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout - tente uma imagem menor')), 60000)
      );

      const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

      if (uploadError) throw uploadError;

      setUploadProgress(90);

      const { data: { publicUrl } } = supabase.storage
        .from('profile-backgrounds')
        .getPublicUrl(fileName);

      setCurrentMediaUrl(publicUrl);

      onUpdate({
        background_media_url: publicUrl,
        background_type: type
      });

      setUploadProgress(100);
      setMessage(`${type === 'video' ? 'Vídeo' : 'Imagem'} carregada com sucesso!${optimizationMessage}`);
      setMessageType('success');

      setTimeout(() => {
        setOptimizationInfo('');
        setUploadProgress(0);
      }, 3000);
    } catch (error: any) {
      console.error('Upload error:', error);
      setMessage(error.message || 'Erro ao fazer upload');
      setMessageType('error');
      setUploadProgress(0);
      setOptimizationInfo('');
    } finally {
      setUploading(false);
    }
  };

  const confirmRemoveMedia = async () => {
    setShowDeleteModal(false);

    try {
      console.log('🗑️ Removendo background...', currentMediaUrl);

      if (currentMediaUrl) {
        const path = currentMediaUrl.split('/profile-backgrounds/')[1];
        console.log('📂 Path do arquivo:', path);

        if (path) {
          const { error: deleteError } = await supabase.storage
            .from('profile-backgrounds')
            .remove([path]);

          if (deleteError) {
            console.warn('⚠️ Erro ao deletar do storage:', deleteError);
          } else {
            console.log('✅ Arquivo removido do storage');
          }
        }
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          background_type: 'solid',
          background_media_url: null
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setCurrentMediaUrl(null);

      onUpdate({
        background_type: 'solid',
        background_media_url: null
      });

      console.log('✅ Background removido e salvo automaticamente');
      setMessage('Background removido e salvo automaticamente!');
      setMessageType('success');

      if (onDeleted) {
        setTimeout(() => {
          onDeleted();
        }, 500);
      }
    } catch (error: any) {
      console.error('❌ Remove error:', error);
      setMessage(error.message || 'Erro ao remover background');
      setMessageType('error');
    }
  };

  const handleRemoveMedia = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      {message && (
        <Toast
          message={message}
          type={messageType}
          onClose={() => setMessage('')}
        />
      )}

      {/* Important Notice */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">!</span>
          </div>
          <div className="flex-1">
            <h4 className="text-amber-900 font-bold text-sm mb-1">
              Lembre-se de Salvar as Alterações
            </h4>
            <p className="text-amber-800 text-xs leading-relaxed">
              Após fazer ajustes na opacidade ou cor da sobreposição, role até o final da página e clique no botão <strong>"Salvar Background"</strong> para aplicar as mudanças à sua página pública.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Tipo de Background
        </label>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onUpdate({ background_type: 'solid' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              backgroundType === 'solid'
                ? 'border-blue-600 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Palette className="w-6 h-6 mx-auto mb-2 text-slate-700" />
            <span className="text-sm font-medium text-slate-700">Cor Sólida</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdate({ background_type: 'gradient' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              backgroundType === 'gradient'
                ? 'border-blue-600 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="w-6 h-6 mx-auto mb-2 rounded bg-gradient-to-r from-purple-500 to-pink-500" />
            <span className="text-sm font-medium text-slate-700">Gradiente</span>
          </button>

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className={`p-4 rounded-lg border-2 transition-all ${
              backgroundType === 'image'
                ? 'border-blue-600 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ImageIcon className="w-6 h-6 mx-auto mb-2 text-slate-700" />
            <span className="text-sm font-medium text-slate-700">Imagem</span>
          </button>

          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading}
            className={`p-4 rounded-lg border-2 transition-all ${
              backgroundType === 'video'
                ? 'border-blue-600 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Video className="w-6 h-6 mx-auto mb-2 text-slate-700" />
            <span className="text-sm font-medium text-slate-700">Vídeo</span>
          </button>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleMediaUpload(file, 'image');
          }}
          className="hidden"
        />

        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleMediaUpload(file, 'video');
          }}
          className="hidden"
        />

      </div>

      {uploading && (
        <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">
                {optimizationInfo || 'Processando...'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-blue-700">{uploadProgress}%</span>
              <button
                onClick={cancelUpload}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>

          <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {!uploading && (backgroundType === 'image' || backgroundType === 'video') && (
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-green-900 font-bold text-sm mb-2">
                Dicas para Melhor Qualidade
              </h4>
              <ul className="text-green-800 text-xs space-y-1.5">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>Resolução recomendada: {getRecommendedDimensions(backgroundType as 'image' | 'video')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    {backgroundType === 'image'
                      ? 'Imagens serão automaticamente otimizadas para 1920x1080'
                      : 'Vídeos em Full HD (1920x1080) funcionam melhor'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    {backgroundType === 'image'
                      ? 'Limite: 10MB (otimização automática reduz o tamanho)'
                      : 'Limite: 50MB para vídeos'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {backgroundType === 'solid' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Cor de Fundo
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={profile.background_color || '#0F172A'}
              onChange={(e) => onUpdate({ background_color: e.target.value })}
              className="h-12 w-20 rounded-lg border border-slate-300 cursor-pointer"
            />
            <input
              type="text"
              value={profile.background_color || '#0F172A'}
              onChange={(e) => onUpdate({ background_color: e.target.value })}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none"
              placeholder="#0F172A"
            />
          </div>
        </div>
      )}

      {backgroundType === 'gradient' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cor Inicial
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={profile.background_gradient_start || '#3B82F6'}
                onChange={(e) => onUpdate({ background_gradient_start: e.target.value })}
                className="h-12 w-20 rounded-lg border border-slate-300 cursor-pointer"
              />
              <input
                type="text"
                value={profile.background_gradient_start || '#3B82F6'}
                onChange={(e) => onUpdate({ background_gradient_start: e.target.value })}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cor Final
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={profile.background_gradient_end || '#8B5CF6'}
                onChange={(e) => onUpdate({ background_gradient_end: e.target.value })}
                className="h-12 w-20 rounded-lg border border-slate-300 cursor-pointer"
              />
              <input
                type="text"
                value={profile.background_gradient_end || '#8B5CF6'}
                onChange={(e) => onUpdate({ background_gradient_end: e.target.value })}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none"
                placeholder="#8B5CF6"
              />
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{
            background: `linear-gradient(to bottom right, ${profile.background_gradient_start || '#3B82F6'}, ${profile.background_gradient_end || '#8B5CF6'})`
          }}>
            <p className="text-white text-center font-medium">Preview do Gradiente</p>
          </div>
        </div>
      )}

      {(backgroundType === 'image' || backgroundType === 'video') && (
        <div className="space-y-4">
          {currentMediaUrl && (
            <div className="relative rounded-lg overflow-hidden border border-slate-300">
              {backgroundType === 'image' ? (
                <img
                  src={currentMediaUrl || ''}
                  alt="Background"
                  className="w-full h-48 object-cover"
                />
              ) : (
                <video
                  src={currentMediaUrl || ''}
                  className="w-full h-48 object-cover"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              )}
              {/* Overlay Preview */}
              <div
                className="absolute inset-0 pointer-events-none transition-all duration-300"
                style={{
                  backgroundColor: profile.background_overlay_color || '#000000',
                  opacity: (profile.background_overlay_opacity || 50) / 100
                }}
              />
              {/* Sample Text for Preview */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <h3 className="text-white text-2xl font-bold drop-shadow-lg">Seu Nome</h3>
                  <p className="text-white/90 mt-2 drop-shadow-lg">Preview da sobreposição</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => handleRemoveMedia(e)}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-lg z-50 pointer-events-auto"
                title="Remover background"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Opacidade da Sobreposição: <span className="text-blue-600 font-bold">{profile.background_overlay_opacity || 50}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={profile.background_overlay_opacity || 50}
              onChange={(e) => onUpdate({ background_overlay_opacity: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-xs text-slate-600 mt-2">
              Adiciona uma camada escura sobre a mídia para melhorar a legibilidade do texto
            </p>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Cor da Sobreposição
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={profile.background_overlay_color || '#000000'}
                onChange={(e) => onUpdate({ background_overlay_color: e.target.value })}
                className="h-12 w-20 rounded-lg border-2 border-purple-300 cursor-pointer"
              />
              <input
                type="text"
                value={profile.background_overlay_color || '#000000'}
                onChange={(e) => onUpdate({ background_overlay_color: e.target.value })}
                className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 focus:outline-none font-mono"
                placeholder="#000000"
              />
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Altere a cor da camada de sobreposição (preto padrão)
            </p>
          </div>

          {!currentMediaUrl && (
            <div className="p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
              <p className="text-sm text-slate-600 text-center">
                {backgroundType === 'video'
                  ? 'Clique no botão "Vídeo" acima para fazer upload (máx. 50MB, MP4 ou WebM)'
                  : 'Clique no botão "Imagem" acima para fazer upload (máx. 10MB)'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform animate-slideUp">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Remover Background</h3>
                  <p className="text-red-100 text-sm">Esta ação não pode ser desfeita</p>
                </div>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="text-slate-700 leading-relaxed">
                  Tem certeza que deseja remover este background?
                </p>
                <p className="text-slate-600 text-sm mt-2">
                  O arquivo será excluído permanentemente e você voltará para o background de cor sólida.
                </p>
              </div>

              {/* Preview do que será removido */}
              {currentMediaUrl && (
                <div className="relative rounded-lg overflow-hidden border-2 border-red-200">
                  {backgroundType === 'image' ? (
                    <img
                      src={currentMediaUrl || ''}
                      alt="Preview"
                      className="w-full h-32 object-cover opacity-75"
                    />
                  ) : (
                    <video
                      src={currentMediaUrl || ''}
                      className="w-full h-32 object-cover opacity-75"
                      muted
                    />
                  )}
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full">
                      <span className="text-red-600 font-semibold text-sm">Será removido</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 p-6 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRemoveMedia}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
