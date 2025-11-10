import React, { useState, useRef } from 'react';
import { X, Image, Video, Upload, Loader, Camera, VideoIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CONTENT_LIMITS, validatePostText, validateMediaCount, validateMediaSize } from '../../lib/contentLimits';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated
}) => {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const countValidation = validateMediaCount(files.length + mediaFiles.length);
    if (!countValidation.valid) {
      setError(countValidation.error || 'Limite de mídias atingido');
      return;
    }

    const oversizedFiles = files.filter(file => {
      const sizeValidation = validateMediaSize(file.size);
      return !sizeValidation.valid;
    });

    if (oversizedFiles.length > 0) {
      setError(CONTENT_LIMITS.POSTS.ERROR_MESSAGE_SIZE);
      return;
    }

    setMediaFiles(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!caption.trim() && mediaFiles.length === 0)) return;

    const textValidation = validatePostText(caption);
    if (!textValidation.valid) {
      setError(textValidation.error || 'Texto inválido');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const lastPostKey = `lastPost_${user.id}`;
      const lastPostTime = localStorage.getItem(lastPostKey);

      if (lastPostTime) {
        const timeSinceLastPost = Date.now() - parseInt(lastPostTime);
        const oneMinute = 60 * 1000;

        if (timeSinceLastPost < oneMinute) {
          const remainingSeconds = Math.ceil((oneMinute - timeSinceLastPost) / 1000);
          throw new Error(`Aguarde ${remainingSeconds}s antes de criar outro post`);
        }
      }

      const mediaUrls: string[] = [];

      for (const file of mediaFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('social-media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('social-media')
          .getPublicUrl(fileName);

        mediaUrls.push(publicUrl);
      }

      const hashtags = (caption.match(/#\w+/g) || []).map(tag => tag.toLowerCase());

      const { error: insertError } = await supabase
        .from('social_posts')
        .insert({
          user_id: user.id,
          caption: caption.trim(),
          media_urls: mediaUrls,
          content_type: mediaFiles.length > 0 ? 'media' : 'text',
          privacy: 'public',
          hashtags,
          is_active: true
        });

      if (insertError) throw insertError;

      localStorage.setItem(lastPostKey, Date.now().toString());

      onPostCreated();
      handleClose();
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Erro ao criar post');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCaption('');
    setMediaFiles([]);
    setMediaPreview([]);
    setError('');
    onClose();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setIsRecording(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
      setError('');
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Erro ao acessar câmera');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setMediaFiles(prev => [...prev, file]);
          const reader = new FileReader();
          reader.onloadend = () => {
            setMediaPreview(prev => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file);
        }
      }, 'image/jpeg', 0.9);
    }
    stopCamera();
  };

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);

      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' });
        setMediaFiles(prev => [...prev, file]);
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreview(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
        stopCamera();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setError('');
    } catch (err) {
      console.error('Error starting video recording:', err);
      setError('Erro ao iniciar gravação');
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-[#1A1A1A] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800 shadow-2xl">
        <div className="sticky top-0 bg-[#1A1A1A] border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">Criar Post</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="O que está acontecendo?"
            className="w-full bg-transparent text-white placeholder-gray-500 text-lg resize-none focus:outline-none min-h-[120px]"
            maxLength={CONTENT_LIMITS.POSTS.TEXT_MAX_LENGTH}
          />
          <p className={`text-xs mt-1 ${caption.length >= 450 ? 'text-orange-400 font-medium' : 'text-gray-500'}`}>
            {caption.length}/{CONTENT_LIMITS.POSTS.TEXT_MAX_LENGTH} caracteres
          </p>

          {mediaPreview.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {mediaPreview.map((preview, index) => (
                <div key={index} className="relative group">
                  {mediaFiles[index].type.startsWith('video') ? (
                    <video
                      src={preview}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showCamera && (
            <div className="mt-4 relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover rounded-lg bg-black"
              />
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                {!isRecording ? (
                  <>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-6 py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded-full transition-colors flex items-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Capturar Foto
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-full transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={stopVideoRecording}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full transition-colors animate-pulse"
                  >
                    Parar Gravação
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-4 border-t border-gray-800 pt-4">
            {/* Barra de mídia */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <label className="cursor-pointer p-2.5 hover:bg-white/10 rounded-full transition-colors" title="Galeria de Imagens">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading || mediaFiles.length >= 5}
                  />
                  <Image className="w-5 h-5 text-cyan-400" />
                </label>

                <label className="cursor-pointer p-2.5 hover:bg-white/10 rounded-full transition-colors" title="Galeria de Vídeos">
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading || mediaFiles.length >= 5}
                  />
                  <Video className="w-5 h-5 text-cyan-400" />
                </label>

                <button
                  type="button"
                  onClick={startCamera}
                  disabled={uploading || mediaFiles.length >= 5 || showCamera}
                  className="p-2.5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Tirar Foto"
                >
                  <Camera className="w-5 h-5 text-cyan-400" />
                </button>

                <button
                  type="button"
                  onClick={startVideoRecording}
                  disabled={uploading || mediaFiles.length >= 5 || showCamera}
                  className="p-2.5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Gravar Vídeo"
                >
                  <VideoIcon className="w-5 h-5 text-red-400" />
                </button>

                <div className="hidden sm:block h-6 w-px bg-gray-700 mx-1" />

                <span className="text-sm text-gray-400">
                  {mediaFiles.length}/5
                </span>
              </div>

              <button
                type="submit"
                disabled={uploading || (!caption.trim() && mediaFiles.length === 0)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] hover:from-[#D4AF37] hover:to-[#B8941E] text-black font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
              >
                {uploading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Publicando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Publicar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
