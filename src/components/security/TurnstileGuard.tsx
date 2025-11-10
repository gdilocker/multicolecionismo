import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    onTurnstileCallback?: () => void;
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback': () => void;
          size: string;
          'refresh-expired': string;
        }
      ) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

interface TurnstileGuardProps {
  onToken: (token: string) => void;
  size?: 'normal' | 'invisible' | 'compact';
}

export default function TurnstileGuard({ onToken, size = 'invisible' }: TurnstileGuardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Avoid loading script multiple times
    if (scriptLoaded.current) return;

    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.warn('TURNSTILE_SITE_KEY not configured');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileCallback';
    script.async = true;
    script.defer = true;

    window.onTurnstileCallback = () => {
      if (ref.current && window.turnstile) {
        window.turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: (token: string) => onToken(token),
          'error-callback': () => onToken(''),
          size: size,
          'refresh-expired': 'auto'
        });
      }
    };

    document.head.appendChild(script);
    scriptLoaded.current = true;

    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {
        // Script already removed
      }
    };
  }, [onToken, size]);

  return <div ref={ref} />;
}
