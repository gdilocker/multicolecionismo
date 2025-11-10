export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetFormat?: 'jpeg' | 'webp' | 'png';
}

export interface OptimizationResult {
  file: File;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.75,
  targetFormat: 'jpeg'
};

export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'));
          return;
        }

        let { width, height } = img;
        const originalWidth = width;
        const originalHeight = height;

        if (opts.maxWidth && width > opts.maxWidth) {
          height = Math.round((height * opts.maxWidth) / width);
          width = opts.maxWidth;
        }

        if (opts.maxHeight && height > opts.maxHeight) {
          width = Math.round((width * opts.maxHeight) / height);
          height = opts.maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erro ao comprimir imagem'));
              return;
            }

            const fileExt = opts.targetFormat === 'jpeg' ? 'jpg' : opts.targetFormat || 'jpg';
            const fileName = file.name.replace(/\.[^/.]+$/, `.${fileExt}`);
            const optimizedFile = new File([blob], fileName, {
              type: `image/${opts.targetFormat}`,
              lastModified: Date.now()
            });

            const compressionRatio = ((file.size - optimizedFile.size) / file.size) * 100;

            resolve({
              file: optimizedFile,
              originalSize: file.size,
              optimizedSize: optimizedFile.size,
              compressionRatio: Math.max(0, compressionRatio),
              dimensions: { width, height }
            });
          },
          `image/${opts.targetFormat}`,
          opts.quality
        );
      };

      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

export function getRecommendedDimensions(type: 'image' | 'video'): string {
  if (type === 'image') {
    return '1920x1080 (Full HD) ou 2560x1440 (2K)';
  }
  return '1920x1080 (Full HD) para melhor compatibilidade';
}

export async function validateMediaFile(
  file: File,
  type: 'image' | 'video'
): Promise<{ valid: boolean; error?: string; warnings?: string[] }> {
  const warnings: string[] = [];

  const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo permitido: ${formatFileSize(maxSize)}`
    };
  }

  if (type === 'image') {
    if (!isImageFile(file)) {
      return {
        valid: false,
        error: 'Por favor, selecione um arquivo de imagem válido (JPEG, PNG, WebP, GIF)'
      };
    }

    const acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!acceptedFormats.includes(file.type)) {
      warnings.push('Formato não recomendado. Use JPEG, PNG ou WebP para melhor compatibilidade.');
    }

    if (file.size > 5 * 1024 * 1024) {
      warnings.push('Imagem grande detectada. Será otimizada automaticamente.');
    }
  } else {
    if (!isVideoFile(file)) {
      return {
        valid: false,
        error: 'Por favor, selecione um arquivo de vídeo válido (MP4, WebM)'
      };
    }

    const acceptedFormats = ['video/mp4', 'video/webm'];
    if (!acceptedFormats.includes(file.type)) {
      return {
        valid: false,
        error: 'Formato de vídeo não suportado. Use MP4 ou WebM.'
      };
    }

    if (file.size > 30 * 1024 * 1024) {
      warnings.push('Vídeo grande pode demorar para carregar. Considere compressão externa.');
    }
  }

  return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
}
