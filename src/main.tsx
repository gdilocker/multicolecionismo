import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Build info for debugging production issues
const BUILD_TIMESTAMP = import.meta.env.VITE_BUILD_TIMESTAMP || new Date().toISOString();
const BUILD_VERSION = import.meta.env.VITE_BUILD_VERSION || `${import.meta.env.MODE}-${Date.now()}`;

console.log('============================================================');
console.log('🚀 Multi Colecionismo - Build Info');
console.log('============================================================');
console.log('📦 Build Version:', BUILD_VERSION);
console.log('⏰ Build Time:', BUILD_TIMESTAMP);
console.log('🌍 Environment:', import.meta.env.MODE);
console.log('🔄 Force Reload: Add ?v=' + Date.now() + ' to URL if issues persist');
console.log('============================================================');

// Detect if user is on old cached version
const expectedMinTimestamp = '2025-11-12T15:00:00.000Z';
if (BUILD_TIMESTAMP < expectedMinTimestamp) {
  console.warn('⚠️ OLD VERSION DETECTED! This build is outdated.');
  console.warn('⚠️ Please hard reload: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
  console.warn('⚠️ Or clear browser cache and reload');
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element');
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to render application:', error);
  rootElement.innerHTML = `
    <div style="padding: 40px; text-align: center; font-family: system-ui;">
      <h1 style="color: #ef4444;">Erro ao Carregar Aplicação</h1>
      <p style="color: #64748b; margin: 20px 0;">Por favor, recarregue a página ou entre em contato com o suporte.</p>
      <pre style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: left; overflow-x: auto;">${error}</pre>
    </div>
  `;
}

