# 🛡️ Guia de Implementação - Segurança Avançada

**Status:** ✅ Pronto para Implementar
**Prioridade:** P0 (Imediato) + P1 (Próximo Sprint)
**Tempo Estimado:** 2-3 sprints

---

## 📋 O Que Já Foi Implementado

### ✅ Concluído (Pronto para Usar)

1. **Rate Limiting System** (`src/lib/security/rateLimit.ts`)
   - Sliding window algorithm
   - Configurações por endpoint
   - Bloqueio automático após excesso
   - Detecção de atividade suspeita
   - Headers de rate limit

2. **2FA (Two-Factor Authentication)**
   - Migration 054: Tabelas e campos criados
   - Utilitários completos (`src/lib/security/twoFactor.ts`)
   - Recovery codes com hash
   - Audit logging integrado

3. **HTML Sanitization**
   - DOMPurify integrado
   - XSS protection ativa
   - 2 componentes já protegidos

4. **Audit Logging Completo**
   - 26 tipos de eventos
   - 4 níveis de severidade
   - Mascaramento de dados sensíveis

5. **Security Headers**
   - HSTS, CSP, X-Frame-Options
   - Permissions-Policy
   - Todos configurados no `_headers`

---

## 🚀 Implementações Prioritárias

---

### 🔴 P0 - CRÍTICO (Implementar Agora)

### **PR #1: Ativar Rate Limiting na API**

**Tempo:** 4 horas
**Arquivo:** Criar `src/middleware/rateLimit.middleware.ts`

**Código a Implementar:**

```typescript
// src/middleware/rateLimit.middleware.ts
import { rateLimit, getRateLimitHeaders } from '@/lib/security/rateLimit';

export async function rateLimitMiddleware(
  req: Request,
  route: string
): Promise<Response | null> {
  const method = req.method;
  const ip = req.headers.get('x-forwarded-for') ||
             req.headers.get('x-real-ip') ||
             'unknown';

  // Get userId from JWT if authenticated
  const authHeader = req.headers.get('authorization');
  let userId: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      // Decode JWT to get user ID (implement based on your auth)
      // userId = decodeToken(token).sub;
    } catch {
      // Invalid token, proceed without userId
    }
  }

  try {
    // Check rate limit
    await rateLimit(method, route, ip, userId);

    // Get headers for response
    const headers = getRateLimitHeaders(method, route, ip, userId);

    // Return headers to add to response
    return new Response(null, { headers });
  } catch (error: any) {
    if (error.statusCode === 429) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: error.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': error.retryAfter?.toString() || '60'
          }
        }
      );
    }
    throw error;
  }
}
```

**Onde Aplicar:**
1. Edge Functions: Adicionar no início de cada função
2. Rotas críticas:
   - `/auth/login`
   - `/auth/register`
   - `/domains/search`
   - `/api/*`

**Exemplo de Uso:**

```typescript
// supabase/functions/paypal-create-order/index.ts
import { rateLimitMiddleware } from '../_shared/rateLimit.middleware.ts';

Deno.serve(async (req: Request) => {
  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(req, '/api/paypal/create-order');
  if (rateLimitResponse && rateLimitResponse.status === 429) {
    return rateLimitResponse;
  }

  // ... rest of your function
});
```

---

### **PR #2: Implementar 2FA para Admins**

**Tempo:** 8 horas
**Arquivos:**
- Criar `src/pages/Settings/TwoFactorAuth.tsx`
- Atualizar `src/pages/Login.tsx`

**Passo 1: Página de Configuração 2FA**

```typescript
// src/pages/Settings/TwoFactorAuth.tsx
import { useState } from 'react';
import QRCode from 'qrcode';
import {
  generateTOTPSecret,
  generateTOTPUrl,
  enable2FA,
  disable2FA,
  getRemainingRecoveryCodes
} from '@/lib/security/twoFactor';
import { useAuth } from '@/contexts/AuthContext';

export function TwoFactorAuth() {
  const { user } = useAuth();
  const [step, setStep] = useState<'setup' | 'verify' | 'enabled'>('setup');
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const startSetup = async () => {
    const newSecret = generateTOTPSecret();
    setSecret(newSecret);

    const url = generateTOTPUrl(newSecret, user?.email!, 'COM.RICH');
    const qr = await QRCode.toDataURL(url);
    setQrCode(qr);
    setStep('verify');
  };

  const verifyAndEnable = async () => {
    const result = await enable2FA(user?.id!, secret, verificationCode);

    if (result.success) {
      setRecoveryCodes(result.recoveryCodes!);
      setStep('enabled');
      alert('2FA enabled successfully!');
    } else {
      alert(result.error);
    }
  };

  // ... render UI
}
```

**Passo 2: Atualizar Login para Exigir 2FA**

```typescript
// src/pages/Login.tsx - Adicionar após login bem-sucedido

const handleLogin = async (email: string, password: string) => {
  // 1. Login normal
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    // Handle error
    return;
  }

  // 2. Check if 2FA is enabled
  const has2FA = await is2FAEnabled(data.user.id);

  if (has2FA) {
    // Show 2FA input
    setShow2FAInput(true);
    setTempSession(data.session);
    return;
  }

  // 3. If no 2FA, proceed normally
  router.push('/dashboard');
};

const verify2FACode = async (code: string) => {
  const { data: user } = await supabase
    .from('customers')
    .select('totp_secret')
    .eq('id', tempSession.user.id)
    .single();

  const isValid = await verifyTOTPCode(user.totp_secret, code);

  if (isValid) {
    // Proceed with login
    router.push('/dashboard');
  } else {
    alert('Invalid 2FA code');
  }
};
```

**Passo 3: Exigir 2FA para Admins**

```typescript
// Add to middleware or login flow
if (user.role === 'admin' && !user.totp_enabled) {
  // Force 2FA setup
  router.push('/settings/2fa?required=true');
}
```

---

### **PR #3: Integrar Cloudflare Turnstile (CAPTCHA)**

**Tempo:** 3 horas
**Custo:** Grátis (até 1M requests/mês)

**Passo 1: Registrar no Cloudflare**

1. Acesse https://dash.cloudflare.com/
2. Sites > Add Site > Turnstile
3. Copie `Site Key` e `Secret Key`

**Passo 2: Adicionar ao .env**

```bash
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAAA... # Só no servidor!
```

**Passo 3: Instalar SDK**

```bash
npm install @marsidev/react-turnstile
```

**Passo 4: Adicionar ao Login**

```typescript
// src/pages/Login.tsx
import { Turnstile } from '@marsidev/react-turnstile';

function Login() {
  const [turnstileToken, setTurnstileToken] = useState('');

  const handleSubmit = async () => {
    if (!turnstileToken) {
      alert('Please complete CAPTCHA');
      return;
    }

    // Verify on backend
    const response = await fetch('/api/verify-captcha', {
      method: 'POST',
      body: JSON.stringify({ token: turnstileToken })
    });

    if (!response.ok) {
      alert('CAPTCHA verification failed');
      return;
    }

    // Proceed with login
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... form fields ... */}

      <Turnstile
        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
        onSuccess={setTurnstileToken}
        theme="light"
        size="normal"
      />

      <button type="submit">Login</button>
    </form>
  );
}
```

**Passo 5: Verificar no Backend (Edge Function)**

```typescript
// supabase/functions/verify-captcha/index.ts
Deno.serve(async (req: Request) => {
  const { token } = await req.json();

  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: Deno.env.get('TURNSTILE_SECRET_KEY'),
        response: token
      })
    }
  );

  const data = await response.json();

  if (data.success) {
    return new Response(JSON.stringify({ success: true }));
  }

  // Log suspicious activity
  await logSuspiciousActivity('CAPTCHA failed', undefined, { token });

  return new Response(
    JSON.stringify({ success: false }),
    { status: 400 }
  );
});
```

---

### 🟡 P1 - ALTO (Próximo Sprint)

### **PR #4: Melhorar Segurança de Cookies**

**Tempo:** 2 horas

**Atualizar Supabase Client:**

```typescript
// src/lib/supabase.ts
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: {
        getItem: (key) => {
          return document.cookie
            .split('; ')
            .find(row => row.startsWith(`${key}=`))
            ?.split('=')[1];
        },
        setItem: (key, value) => {
          document.cookie = `${key}=${value}; path=/; secure; samesite=strict; max-age=604800`;
        },
        removeItem: (key) => {
          document.cookie = `${key}=; path=/; max-age=0`;
        }
      }
    }
  }
);
```

---

### **PR #5: Sistema de Alertas em Tempo Real**

**Tempo:** 6 horas
**Opções:** Slack, Discord, Email

**Criar Edge Function de Monitoramento:**

```typescript
// supabase/functions/security-monitor/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Run every 5 minutes via cron
serve(async (_req) => {
  // Query audit logs for suspicious patterns
  const { data: suspiciousLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('severity', 'high')
    .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

  if (suspiciousLogs && suspiciousLogs.length > 0) {
    // Send alert to Slack
    await fetch(Deno.env.get('SLACK_WEBHOOK_URL')!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Security Alert: ${suspiciousLogs.length} suspicious activities detected`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Security Incidents:*\n${suspiciousLogs.map(log =>
                `• ${log.action} by user ${log.user_id}`
              ).join('\n')}`
            }
          }
        ]
      })
    });
  }

  return new Response('OK');
});
```

**Configurar Supabase Cron:**

```sql
-- Add to Supabase dashboard > Database > Cron Jobs
SELECT cron.schedule(
  'security-monitoring',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/security-monitor',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

---

### **PR #6: CORS Restritivo**

**Tempo:** 1 hora

**Atualizar Edge Functions:**

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://com.rich', // Apenas domínio oficial
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '300' // 5 minutes cache
};

// Validar origin
Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const allowedOrigins = [
    'https://com.rich',
    'https://www.com.rich',
    'https://app.com.rich'
  ];

  if (origin && !allowedOrigins.includes(origin)) {
    return new Response('Forbidden', { status: 403 });
  }

  // ... rest of function
});
```

---

## 📦 Dependências Necessárias

```bash
# Para 2FA (TOTP)
npm install otplib qrcode
npm install --save-dev @types/qrcode

# Para CAPTCHA
npm install @marsidev/react-turnstile

# Para Rate Limiting em Produção (opcional)
npm install @upstash/redis
```

---

## 🧪 Testes Necessários

### 1. Rate Limiting
```bash
# Teste de carga
for i in {1..10}; do
  curl -X POST https://your-api.com/auth/login
done
# Deve retornar 429 após 5 requests
```

### 2. 2FA
- [ ] QR code gera corretamente
- [ ] Código TOTP válida
- [ ] Recovery codes funcionam
- [ ] Não permite login sem 2FA se habilitado

### 3. CAPTCHA
- [ ] Widget carrega
- [ ] Backend valida token
- [ ] Bloqueia sem token

---

## 📊 Métricas de Sucesso

**Rate Limiting:**
- [ ] 0 abusos de API detectados
- [ ] < 0.1% de false positives

**2FA:**
- [ ] 100% dos admins com 2FA
- [ ] < 1% de suporte para recovery codes

**CAPTCHA:**
- [ ] 95%+ taxa de sucesso legítimo
- [ ] < 5% de bots passando

---

## 🚨 Rollback Plan

Se algo der errado:

1. **Rate Limiting:** Aumentar limites temporariamente
2. **2FA:** Desabilitar exigência, permitir bypass temporário
3. **CAPTCHA:** Remover widget, permitir acesso sem validação

---

## 📝 Checklist Final

Antes de produção:

- [ ] Rate limiting testado em staging
- [ ] 2FA testada por equipe
- [ ] CAPTCHA validada no backend
- [ ] Cookies com Secure/HttpOnly
- [ ] CORS fechado para domínios oficiais
- [ ] Alertas funcionando
- [ ] Documentação atualizada
- [ ] Equipe treinada

---

**Próximo Passo:** Começar pelo PR #1 (Rate Limiting)
**Dúvidas:** Criar issue no repositório

Build executado com sucesso! 🔒
