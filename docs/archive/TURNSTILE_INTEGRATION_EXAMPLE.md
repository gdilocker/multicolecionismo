# Cloudflare Turnstile - Integration Example

## Quick Start: Add CAPTCHA to Login

### 1. Frontend Integration (Login.tsx)

```tsx
import { useState } from 'react';
import TurnstileGuard from '../components/security/TurnstileGuard';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cfToken, setCfToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cfToken) {
      setError('Please complete the CAPTCHA verification');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          cfToken  // ← CAPTCHA token incluído
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Success - redirect ou update state
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          {/* CAPTCHA - Invisible Widget */}
          <TurnstileGuard onToken={setCfToken} />

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !cfToken}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 2. Backend Integration (Edge Function)

```typescript
// supabase/functions/auth-login/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyTurnstile, getClientIP } from '../_shared/captcha.verify.ts';
import { logAuditEvent } from '../_shared/audit.ts';
import { applySecurityHeaders } from '../_shared/security.headers.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const response = new Response('', { status: 200, headers: corsHeaders });
  applySecurityHeaders(response.headers);

  try {
    const body = await req.json();
    const { email, password, cfToken } = body;

    // 1. Verify CAPTCHA FIRST
    const clientIP = getClientIP(req);
    const captchaValid = await verifyTurnstile(clientIP, cfToken);

    if (!captchaValid) {
      // Log bot attempt
      await logAuditEvent({
        action: 'login_failure',
        severity: 'medium',
        details: {
          reason: 'CAPTCHA verification failed',
          email,
          ip: clientIP
        },
        success: false
      });

      return new Response(
        JSON.stringify({ error: 'CAPTCHA verification failed' }),
        { status: 400, headers: response.headers }
      );
    }

    // 2. Proceed with authentication
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Log failed login attempt
      await logAuditEvent({
        action: 'login_failure',
        severity: 'low',
        details: {
          reason: error.message,
          email,
          ip: clientIP
        },
        success: false
      });

      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: response.headers }
      );
    }

    // Success
    await logAuditEvent({
      user_id: data.user?.id,
      action: 'login_success',
      severity: 'low',
      details: { email, ip: clientIP },
      success: true
    });

    return new Response(
      JSON.stringify({
        user: data.user,
        session: data.session
      }),
      { status: 200, headers: response.headers }
    );

  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: response.headers }
    );
  }
});
```

### 3. Environment Setup

#### Cloudflare Dashboard:
1. Go to https://dash.cloudflare.com
2. Select your account
3. Go to **Turnstile** (in sidebar)
4. Click **Add Site**
5. Configure:
   - **Site name**: COM.RICH Production
   - **Domain**: com.rich
   - **Mode**: Managed (Recommended)
   - **Widget mode**: Invisible
6. Copy **Site Key** and **Secret Key**

#### Environment Variables:

**Frontend (.env.local or .env):**
```bash
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAAxxxxxxxxxxxxxxxxx
```

**Backend (Supabase Dashboard → Project Settings → Edge Functions → Secrets):**
```bash
TURNSTILE_SECRET_KEY=0x4AAAAAAAxxxxxxxxxxxxxxxxx
```

### 4. Testing

#### Test in Development:
Cloudflare provides test keys that always pass/fail:

**Always Pass:**
```bash
# Site Key
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA

# Secret Key
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

**Always Fail:**
```bash
# Site Key
VITE_TURNSTILE_SITE_KEY=2x00000000000000000000AB

# Secret Key
TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA
```

#### Test Flow:
1. Load login page
2. Fill email/password
3. Turnstile widget loads invisibly
4. Click "Login"
5. Backend verifies CAPTCHA
6. If valid → authenticate user
7. If invalid → show error

### 5. Widget Modes

#### Invisible (Default - Recommended):
```tsx
<TurnstileGuard onToken={setCfToken} size="invisible" />
```
- Runs in background
- Zero user friction
- Best UX

#### Normal (Visible Checkbox):
```tsx
<TurnstileGuard onToken={setCfToken} size="normal" />
```
- Shows "I'm human" checkbox
- User must click
- More visible security

#### Compact (Small):
```tsx
<TurnstileGuard onToken={setCfToken} size="compact" />
```
- Smaller widget
- Good for mobile

### 6. Advanced: Challenge on Suspicious Activity

```tsx
// Show CAPTCHA only for suspicious logins
const [showCaptcha, setShowCaptcha] = useState(false);

// Check if user has failed login attempts
useEffect(() => {
  const failedAttempts = localStorage.getItem('failedLogins') || 0;
  if (failedAttempts >= 3) {
    setShowCaptcha(true);
  }
}, []);

// In form:
{showCaptcha && <TurnstileGuard onToken={setCfToken} size="normal" />}
```

### 7. Error Handling

```tsx
const [captchaError, setCaptchaError] = useState('');

<TurnstileGuard
  onToken={(token) => {
    if (token) {
      setCfToken(token);
      setCaptchaError('');
    } else {
      setCaptchaError('CAPTCHA verification failed. Please try again.');
    }
  }}
/>

{captchaError && (
  <div className="text-red-600 text-sm">{captchaError}</div>
)}
```

### 8. Production Checklist

- [ ] Replace test keys with production keys
- [ ] Test on production domain
- [ ] Monitor false positives (legitimate users blocked)
- [ ] Check Cloudflare Turnstile Analytics dashboard
- [ ] Set up alerts for high failure rates

### 9. Monitoring

#### Cloudflare Dashboard:
- View CAPTCHA solve rates
- Track challenge attempts
- Identify bot patterns

#### Your Analytics:
```sql
-- Failed CAPTCHA attempts
SELECT COUNT(*), DATE(created_at)
FROM audit_logs
WHERE action = 'login_failure'
  AND details->>'reason' = 'CAPTCHA verification failed'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;
```

### 10. Troubleshooting

#### Token not generated:
- Check browser console for errors
- Verify VITE_TURNSTILE_SITE_KEY is correct
- Check domain matches Cloudflare settings

#### Verification fails on backend:
- Verify TURNSTILE_SECRET_KEY is correct
- Check if IP extraction works
- Test with always-pass test keys

#### Widget not loading:
- Check if script is blocked by adblocker
- Verify CORS settings
- Check network tab for 403/404 errors

---

## Same Integration for:
- Register page
- Password reset
- Contact form
- Any sensitive action

Just add:
1. `<TurnstileGuard onToken={setCfToken} />`
2. Include `cfToken` in request
3. Verify on backend with `verifyTurnstile()`

---

**Documentation**: https://developers.cloudflare.com/turnstile/
**Support**: https://community.cloudflare.com/
