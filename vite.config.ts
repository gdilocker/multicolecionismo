import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/',
    plugins: [react()],
    publicDir: 'public',
    build: {
      assetsDir: 'assets',
      // Code splitting configuration
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'yup'],
            // UI chunks
            'ui-vendor': ['framer-motion', 'lucide-react'],
            // Utility chunks
            'utils-vendor': ['date-fns', 'dompurify', 'qrcode', 'otplib'],
          }
        }
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
      // Minification (esbuild is faster and doesn't need extra deps)
      minify: 'esbuild',
      // Source maps for debugging (disable in production)
      sourcemap: mode !== 'production'
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    // Explicitly define env variables to make them available in the app
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_DEV_MODE': JSON.stringify(env.VITE_DEV_MODE || 'false'),
    }
  };
});