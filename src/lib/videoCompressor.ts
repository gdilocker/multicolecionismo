export interface CompressionProgress {
  stage: 'loading' | 'compressing' | 'finalizing';
  progress: number;
}

export class VideoCompressor {
  private static readonly TARGET_SIZE = 2 * 1024 * 1024;
  private static readonly MAX_DIMENSION = 1280;
  private static readonly TARGET_BITRATE = 1000000;

  static async compressVideo(
    file: File,
    onProgress?: (progress: CompressionProgress) => void
  ): Promise<File> {
    console.log('[COMPRESS] Starting compression for:', file.name);
    console.log('[COMPRESS] Original size:', (file.size / (1024 * 1024)).toFixed(2), 'MB');

    if (file.size <= this.TARGET_SIZE) {
      console.log('[COMPRESS] File already small enough, skipping compression');
      return file;
    }

    try {
      onProgress?.({ stage: 'loading', progress: 10 });

      const videoElement = document.createElement('video');
      videoElement.src = URL.createObjectURL(file);
      videoElement.muted = true;

      await new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = resolve;
        videoElement.onerror = reject;
      });

      console.log('[COMPRESS] Video loaded:', {
        duration: videoElement.duration,
        width: videoElement.videoWidth,
        height: videoElement.videoHeight
      });

      onProgress?.({ stage: 'compressing', progress: 30 });

      const canvas = document.createElement('canvas');
      const scale = Math.min(
        this.MAX_DIMENSION / videoElement.videoWidth,
        this.MAX_DIMENSION / videoElement.videoHeight,
        1
      );

      canvas.width = Math.floor(videoElement.videoWidth * scale);
      canvas.height = Math.floor(videoElement.videoHeight * scale);

      console.log('[COMPRESS] Target dimensions:', canvas.width, 'x', canvas.height);

      const ctx = canvas.getContext('2d')!;
      const stream = canvas.captureStream(30);
      const videoTrack = stream.getVideoTracks()[0];

      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: this.TARGET_BITRATE
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const recordingPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          resolve(new Blob(chunks, { type: 'video/webm' }));
        };
      });

      mediaRecorder.start(100);
      videoElement.currentTime = 0;
      videoElement.play();

      let frameCount = 0;
      const totalFrames = Math.ceil(videoElement.duration * 30);

      const renderFrame = () => {
        if (videoElement.ended || videoElement.paused) {
          mediaRecorder.stop();
          videoTrack.stop();
          URL.revokeObjectURL(videoElement.src);
          return;
        }

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        frameCount++;

        const progress = 30 + Math.floor((frameCount / totalFrames) * 60);
        onProgress?.({ stage: 'compressing', progress: Math.min(progress, 90) });

        requestAnimationFrame(renderFrame);
      };

      renderFrame();

      const compressedBlob = await recordingPromise;

      console.log('[COMPRESS] Compression complete');
      console.log('[COMPRESS] Compressed size:', (compressedBlob.size / (1024 * 1024)).toFixed(2), 'MB');
      console.log('[COMPRESS] Reduction:', ((1 - compressedBlob.size / file.size) * 100).toFixed(1), '%');

      onProgress?.({ stage: 'finalizing', progress: 100 });

      const compressedFile = new File(
        [compressedBlob],
        file.name.replace(/\.[^.]+$/, '.webm'),
        { type: 'video/webm' }
      );

      return compressedFile;

    } catch (error) {
      console.error('[COMPRESS] Error:', error);
      console.log('[COMPRESS] Falling back to original file');
      return file;
    }
  }

  static shouldCompress(file: File): boolean {
    return file.type.startsWith('video/') && file.size > this.TARGET_SIZE;
  }

  static getCompressionEstimate(fileSize: number): string {
    const estimatedSize = Math.max(this.TARGET_SIZE, fileSize * 0.3);
    const estimatedMB = (estimatedSize / (1024 * 1024)).toFixed(1);
    return `~${estimatedMB}MB`;
  }
}
