# Required Secrets Configuration - COM.RICH

## Overview

This document lists the **mandatory secrets** required for the COM.RICH platform to function in production.

Optional secrets have been removed from the codebase to simplify configuration.

---

## Mandatory Secrets (5)

### 1. TURNSTILE_SECRET_KEY
**Purpose:** Server-side validation of Cloudflare Turnstile CAPTCHA
**Where used:** Edge functions for CAPTCHA verification
**How to get:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Turnstile
3. Select your site
4. Copy the "Secret Key"

**Format:** `0x4AAAA...`
**Status:** ⚠️ **REQUIRED**

---

### 2. PAYPAL_CLIENT_ID
**Purpose:** Authentication with PayPal API for payment processing
**Where used:** `paypal-create-order`, `paypal-capture` edge functions
**How to get:**
1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Apps & Credentials
3. Create App (or use existing)
4. Copy "Client ID"

**Format:** `AeB...xyz`
**Status:** ⚠️ **REQUIRED**

---

### 3. PAYPAL_CLIENT_SECRET
**Purpose:** Authentication with PayPal API
**Where used:** `paypal-create-order`, `paypal-capture` edge functions
**How to get:**
1. Same location as PAYPAL_CLIENT_ID
2. Copy "Secret"

**Format:** `EF...xyz`
**Status:** ⚠️ **REQUIRED**
**Security:** 🔒 NEVER share or commit this value

---

### 4. PAYPAL_MODE
**Purpose:** Define PayPal environment (sandbox vs production)
**Where used:** All PayPal edge functions
**Values:**
- `sandbox` - For testing (use first)
- `live` - For production

**Format:** String
**Status:** ⚠️ **REQUIRED**
**Recommendation:** Start with `sandbox`, switch to `live` after testing

---

### 5. APP_URL (OPCIONAL)
**Purpose:** Base URL of the application (for PayPal return/cancel URLs)
**Where used:** `paypal-create-order` edge function
**Default fallback:** `https://com.rich` (hardcoded)

**Values:**
- Production: `https://com.rich`
- Custom domain: `https://seu-dominio.com`

**Format:** Full URL with protocol (no trailing slash)
**Status:** 🟡 **OPTIONAL** (has fallback)

**Note:** Only needed if you want to customize PayPal return URLs. System works without it.

---

## Auto-Injected Secrets (No configuration needed)

These are automatically available in all Supabase edge functions:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin access)

---

## How to Configure Secrets

### Via Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Settings → Edge Functions → Secrets
4. Click "Add Secret"
5. Enter name and value
6. Redeploy edge functions

### Via Supabase CLI

```bash
# Set individual secret
supabase secrets set TURNSTILE_SECRET_KEY=0x4AAA...

# Set multiple from .env file
supabase secrets set --env-file .env.production

# List all secrets (values hidden)
supabase secrets list

# Remove secret
supabase secrets unset SECRET_NAME
```

---

## Quick Setup Checklist

### Phase 1: Minimum Viable Setup

```bash
# Configure these 4 secrets first
✓ TURNSTILE_SECRET_KEY=0x4AAAA...
✓ PAYPAL_CLIENT_ID=AeB...
✓ PAYPAL_CLIENT_SECRET=EF...
✓ PAYPAL_MODE=sandbox

# Optional (has fallback to https://com.rich)
○ APP_URL=https://com.rich
```

### Phase 2: Production Ready

```bash
# Switch to production PayPal
✓ PAYPAL_MODE=live
✓ PAYPAL_CLIENT_ID=[production key]
✓ PAYPAL_CLIENT_SECRET=[production key]
```

---

## Removed Optional Secrets

The following secrets were removed from the codebase to simplify configuration:

| Secret | Purpose | Status |
|--------|---------|--------|
| SLACK_WEBHOOK_URL | Slack security alerts | ❌ Removed |
| SECURITY_ALERT_EMAIL | Email security alerts | ❌ Removed |
| DENO_ENV | Environment flag | ❌ Removed |
| CLOUDFLARE_API_TOKEN | DNS management | ❌ Removed |
| CLOUDFLARE_ZONE_ID | DNS zone ID | ❌ Removed |
| DYNADOT_PROXY_URL | Domain registration | ❌ Removed |
| PAYPAL_WEBHOOK_ID | Webhook validation | ❌ Removed |

**What happens now:**
- Security events are logged to `audit_logs` table (query via SQL)
- DNS management is disabled (configure DNS manually)
- Domain registration uses mock mode
- PayPal webhooks skip signature validation (⚠️ less secure but functional)

---

## Security Best Practices

### 1. Never Commit Secrets
```bash
# ✅ Good - use .env (gitignored)
PAYPAL_CLIENT_SECRET=xxx

# ❌ Bad - hardcoded
const secret = "EF12345..."
```

### 2. Use Different Secrets per Environment
```bash
# Development
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=[sandbox key]

# Production
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=[production key]
```

### 3. Rotate Secrets Every 90 Days
```sql
-- Log rotation in database
INSERT INTO audit_logs (action, severity, details, success)
VALUES (
  'SECRETS_ROTATED',
  'high',
  jsonb_build_object(
    'secrets_rotated', ARRAY['PAYPAL_CLIENT_SECRET'],
    'rotation_date', NOW(),
    'next_rotation', NOW() + INTERVAL '90 days'
  ),
  true
);
```

### 4. Audit Secret Access
```sql
-- Check who accessed secrets recently
SELECT
  created_at,
  action,
  details->>'secret_name' as secret,
  user_id
FROM audit_logs
WHERE action LIKE '%SECRET%'
ORDER BY created_at DESC
LIMIT 20;
```

---

## Troubleshooting

### Issue: "TURNSTILE_SECRET_KEY not found"
**Solution:** Configure the secret in Supabase Dashboard → Edge Functions → Secrets

### Issue: "PayPal authentication failed"
**Solution:**
1. Verify PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are correct
2. Check PAYPAL_MODE matches your credentials (sandbox vs live)

### Issue: "Invalid APP_URL"
**Solution:** Ensure APP_URL includes protocol (https://) and has no trailing slash

### Issue: Edge functions not using new secrets
**Solution:** Redeploy edge functions after changing secrets
```bash
supabase functions deploy
```

---

## Environment Template

Create a `.env.production` file (DO NOT COMMIT):

```bash
# Required Secrets
TURNSTILE_SECRET_KEY=0x4AAAA...
PAYPAL_CLIENT_ID=AeB...
PAYPAL_CLIENT_SECRET=EF...
PAYPAL_MODE=live

# Optional (has default fallback)
# APP_URL=https://com.rich
```

Then deploy:
```bash
supabase secrets set --env-file .env.production
```

---

## Support

For questions about secrets configuration:
- Email: security@com.rich
- Documentation: See SECURITY_OPERATIONS.md
- Emergency: Check SECURITY_MAINTENANCE_ROADMAP.md

---

**Last Updated:** 2025-10-25
**Status:** ✅ Production Ready (Simplified)
**Next Review:** Q1 2026
