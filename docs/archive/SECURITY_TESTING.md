# Security Testing Guide - COM.RICH

## Manual Testing Suite

### Prerequisites
```bash
export API_URL="https://app.com.rich"
export WEBHOOK_SECRET_PAYPAL="your_secret_here"
```

---

## 1.1 Rate Limiting Test

**Objetivo:** Verificar que múltiplas tentativas de login são bloqueadas

```bash
#!/bin/bash
# Test rate limiting on login endpoint
echo "Testing rate limiting (6 attempts in <1 min)..."

for i in {1..6}; do
  echo -n "Attempt $i: "
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@com.rich","password":"wrongpassword"}' \
    $API_URL/api/auth/login
  sleep 1
done

echo "Last request should be 429 Too Many Requests"
```

**Resultado Esperado:**
```
Attempt 1: 401
Attempt 2: 401
Attempt 3: 401
Attempt 4: 401
Attempt 5: 401
Attempt 6: 429  ← Rate limit triggered
```

**Verificar no DB:**
```sql
SELECT action, severity, details->>'ip' as ip, COUNT(*)
FROM audit_logs
WHERE action = 'login_failure'
  AND created_at > NOW() - INTERVAL '5 minutes'
GROUP BY action, severity, details->>'ip'
ORDER BY COUNT(*) DESC;
```

---

## 1.2 Two-Factor Authentication Test

### Test 2.1: Invalid TOTP Code
```bash
curl -X POST $API_URL/api/auth/verify-2fa \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "code": "000000"
  }' | jq
```

**Expected Response:** 401 + Audit log

**Verify:**
```sql
SELECT action, severity, details
FROM audit_logs
WHERE action = 'login_failure'
  AND severity = 'medium'
  AND details->>'reason' = 'Invalid TOTP code'
ORDER BY created_at DESC LIMIT 1;
```

### Test 2.2: Valid Recovery Code
```bash
curl -X POST $API_URL/api/auth/verify-2fa \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "code": "ABCD-EFGH",
    "isRecoveryCode": true
  }' | jq
```

**Expected:** Success + HIGH severity audit

---

## 1.3 CAPTCHA Test

```bash
# Missing cfToken should fail
curl -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass"}' | jq
```

**Expected:** `{"error":"CAPTCHA verification failed"}`

---

## 1.4 CORS Test

```bash
curl -X POST $API_URL/api/auth/login \
  -H "Origin: https://malicious.example" \
  -v 2>&1 | grep -i "access-control"
```

---

## 1.5 Webhook HMAC Test

```bash
BODY='{"event":"test"}'
SIG=$(printf "%s" "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET_PAYPAL" | sed 's/^.* //')

curl -X POST $API_URL/functions/v1/paypal-webhook \
  -H "X-PayPal-Transmission-Sig: sha256=$SIG" \
  -H "Content-Type: application/json" \
  -d "$BODY"
```

---

## 1.6 Upload Security Test

```bash
# Fake mimetype should be rejected
curl -X POST $API_URL/api/upload \
  -F "file=@/bin/ls;type=image/png"
```

**Expected:** 400 Invalid file type

---

## 1.7 CSP Report Test

```bash
curl -X POST $API_URL/functions/v1/csp-report \
  -H "Content-Type: application/json" \
  -d '{"csp-report":{"violated-directive":"script-src"}}'
```

**Expected:** 204 + Audit log

---

## 1.8 Session Revocation Test

1. Login in 2 browser tabs
2. Click "Revoke All Sessions" in one tab
3. Both tabs should logout within 5s

---

## Automated Test Script

```bash
#!/bin/bash
# security-tests.sh

API_URL="${API_URL:-https://app.com.rich}"

echo "COM.RICH Security Tests"
echo "======================="

# Rate Limiting
echo -e "\n[1] Rate Limiting..."
for i in {1..6}; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -d '{"email":"test@test.com","password":"x"}' \
    $API_URL/api/auth/login)
  echo "  Attempt $i: $CODE"
done

# CAPTCHA
echo -e "\n[2] CAPTCHA Enforcement..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -d '{"email":"test@test.com"}' \
  $API_URL/api/auth/login)
echo "  Response: $CODE (expect 400)"

# Headers
echo -e "\n[3] Security Headers..."
curl -I -s $API_URL | grep -E "Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options"

echo -e "\nTests completed!"
```

**Run:** `chmod +x security-tests.sh && ./security-tests.sh`

---

## Monitoring Queries

```sql
-- Failed logins by IP (last 24h)
SELECT details->>'ip' as ip, COUNT(*) as attempts
FROM audit_logs
WHERE action = 'login_failure'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY details->>'ip'
HAVING COUNT(*) > 10
ORDER BY attempts DESC;

-- CSP Violations
SELECT COUNT(*), details->>'violatedDirective'
FROM audit_logs
WHERE action = 'CSP_VIOLATION'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY details->>'violatedDirective';

-- High Severity Events
SELECT action, COUNT(*)
FROM audit_logs
WHERE severity = 'high'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY action
ORDER BY COUNT(*) DESC;
```
