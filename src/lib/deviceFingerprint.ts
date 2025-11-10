/**
 * Device Fingerprinting for Fraud Detection
 * Generates a unique fingerprint combining multiple browser attributes
 */

export async function generateDeviceFingerprint(): Promise<string> {
  const components: string[] = [];

  // 1. Screen resolution
  components.push(`${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`);

  // 2. Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // 3. Language
  components.push(navigator.language);

  // 4. Platform
  components.push(navigator.platform);

  // 5. User Agent
  components.push(navigator.userAgent);

  // 6. Hardware concurrency
  components.push(String(navigator.hardwareConcurrency || 'unknown'));

  // 7. Device memory (if available)
  if ('deviceMemory' in navigator) {
    components.push(String((navigator as any).deviceMemory));
  }

  // 8. Touch support
  components.push(String('ontouchstart' in window));

  // 9. Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('.com.rich', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('.com.rich', 4, 17);

      const dataURL = canvas.toDataURL();
      components.push(dataURL.slice(-50));
    }
  } catch (e) {
    components.push('canvas_error');
  }

  // Combine all components
  const combined = components.join('|');

  // Hash with SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

// Get user IP (via external service)
export async function getUserIP(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error getting IP:', error);
    return null;
  }
}
