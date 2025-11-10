# Security Hardening Checklist - COM.RICH

## Pre-Production Security Validation

Use this checklist before deploying to production or after major security updates.

**Last Review:** ________________
**Reviewed by:** ________________
**Status:** [ ] IN PROGRESS [ ] COMPLETED [ ] BLOCKED

---

## 1. Authentication & Authorization

### 1.1 Password Security
- [ ] Minimum password length: 12 characters
- [ ] Password complexity requirements enforced
- [ ] Passwords hashed with bcrypt/Argon2
- [ ] No password storage in logs or audit trails
- [ ] Password reset tokens expire within 1 hour
- [ ] Rate limiting on password reset requests

### 1.2 Two-Factor Authentication (2FA)
- [ ] 2FA using native TOTP implementation (no external libs)
- [ ] QR code generated via secure edge function
- [ ] Recovery codes hashed before storage (SHA-256)
- [ ] Recovery codes single-use only
- [ ] 2FA verification rate-limited
- [ ] Failed 2FA attempts logged as HIGH severity
- [ ] Recovery code usage triggers HIGH severity alert

**Test:**
```bash
# Invalid TOTP should fail
curl -X POST /api/auth/verify-2fa -d '{"code":"000000"}'
# Expected: 401 + audit log

# Recovery code should work once
curl -X POST /api/auth/verify-2fa -d '{"code":"ABCD-EFGH","isRecoveryCode":true}'
# Expected: 200 + HIGH audit log

# Reuse should fail
# Expected: 401
```

### 1.3 Session Management
- [ ] Sessions stored in database with expiration
- [ ] JWT tokens include unique `jti` (JWT ID)
- [ ] Session revocation immediately invalidates tokens
- [ ] Global session revocation works across all devices
- [ ] Session timeout: 24 hours for standard users
- [ ] "Remember me" extends to 30 days with secure flag
- [ ] Concurrent session limits enforced

**Test:**
```bash
# Login in 2 browsers
# Revoke all sessions
# Both should be logged out within 5 seconds
```

---

## 2. API Security

### 2.1 CAPTCHA (Cloudflare Turnstile)
- [ ] Turnstile active on login endpoint
- [ ] Turnstile active on registration endpoint
- [ ] Turnstile active on password reset endpoint
- [ ] Backend validates token server-side
- [ ] Failed CAPTCHA logged with IP address
- [ ] Production site key configured (not test key)
- [ ] Secret key stored securely in environment variables

**Test:**
```bash
# Request without cfToken should fail
curl -X POST /api/auth/login -d '{"email":"test@test.com","password":"x"}'
# Expected: 400 {"error":"CAPTCHA verification failed"}
```

**Environment Check:**
```bash
# Frontend
echo $VITE_TURNSTILE_SITE_KEY | grep -q "^0x4" && echo "✅ Production key" || echo "❌ Test key"

# Backend
echo $TURNSTILE_SECRET_KEY | grep -q "^0x4" && echo "✅ Production secret" || echo "❌ Test secret"
```

### 2.2 Rate Limiting
- [ ] Rate limiting active on all auth endpoints
- [ ] Login: 5 attempts per 15 minutes per IP
- [ ] Registration: 3 accounts per hour per IP
- [ ] API endpoints: 100 requests per minute per user
- [ ] Rate limit exceeded returns 429 status
- [ ] Rate limit headers included in response
- [ ] Excessive rate limit hits trigger alerts

**Test:**
```bash
# 6 login attempts in <1 minute
for i in {1..6}; do
  curl -X POST /api/auth/login -d '{"email":"test@test.com","password":"x"}'
done
# Expected: Last request returns 429
```

### 2.3 CORS Configuration
- [ ] CORS headers properly configured
- [ ] Only allowed origins accepted
- [ ] Preflight requests handled correctly
- [ ] Credentials flag set appropriately
- [ ] No wildcard (*) in production for credentials

**Test:**
```bash
# Request from unauthorized origin
curl -H "Origin: https://malicious.example" -X POST /api/auth/login
# Expected: No Access-Control-Allow-Origin header OR rejection
```

---

## 3. Content Security Policy (CSP)

### 3.1 CSP Configuration
- [ ] CSP Report-Only mode enabled initially (7 days)
- [ ] After 7 days, switch to enforcement mode
- [ ] Nonces generated per request
- [ ] Script-src: 'self' + nonce (no 'unsafe-inline')
- [ ] Style-src: 'self' + nonce (or 'unsafe-inline' only for Tailwind)
- [ ] img-src: 'self' data: https:
- [ ] connect-src: 'self' https:
- [ ] frame-ancestors: 'none'
- [ ] report-uri: /functions/v1/csp-report

**Verify Headers:**
```bash
curl -I https://app.com.rich | grep "Content-Security-Policy"
# Should see CSP header with nonce
```

### 3.2 CSP Reporting
- [ ] CSP report endpoint deployed
- [ ] Violations logged in audit_logs
- [ ] High-risk violations trigger alerts
- [ ] Slack alerts configured for critical violations
- [ ] Daily CSP violation review process

**Test:**
```bash
curl -X POST /functions/v1/csp-report \
  -H "Content-Type: application/json" \
  -d '{"csp-report":{"violated-directive":"script-src","blocked-uri":"eval"}}'
# Expected: 204 + audit log + Slack alert
```

---

## 4. Security Headers

### 4.1 Required Headers
- [ ] Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Permissions-Policy: geolocation=(), camera=(), microphone=()
- [ ] Content-Security-Policy: (see above)

**Verify:**
```bash
curl -I https://app.com.rich | grep -E "Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options"
```

### 4.2 HSTS Preload
- [ ] HSTS header includes `preload` directive
- [ ] Submit domain to HSTS preload list: https://hstspreload.org/
- [ ] Verify all subdomains support HTTPS
- [ ] No mixed content warnings in browser

---

## 5. File Upload Security

### 5.1 Upload Validation
- [ ] Mimetype validation by magic bytes (not extension)
- [ ] Allowed types: PNG, JPEG, WEBP, PDF only
- [ ] Maximum file size: 10MB
- [ ] Filenames generated as UUID (ignore client filename)
- [ ] Files stored in private bucket
- [ ] Signed URLs with 10-minute expiration
- [ ] No double extension attacks possible

**Test:**
```bash
# Try to upload /bin/ls as PNG
curl -F "file=@/bin/ls;type=image/png" /api/upload
# Expected: 400 "Invalid file type"

# Try double extension
echo "test" > malicious.php.png
curl -F "file=@malicious.php.png" /api/upload
# Expected: 400 (magic bytes don't match)
```

### 5.2 Image Processing
- [ ] Images processed server-side (not client-side trust)
- [ ] EXIF data stripped from uploaded images
- [ ] Image dimensions validated
- [ ] No SVG uploads (potential XSS vector)

---

## 6. Webhook Security

### 6.1 Webhook Verification
- [ ] All webhooks verify HMAC signature
- [ ] Signature verification uses constant-time comparison
- [ ] Timestamp validation prevents replay attacks (≤5 min window)
- [ ] Failed verifications logged as HIGH severity
- [ ] Webhook secrets stored in environment variables
- [ ] Secrets rotated every 90 days

**Test:**
```bash
# Invalid signature should fail
curl -X POST /functions/v1/paypal-webhook \
  -H "X-PayPal-Transmission-Sig: invalid" \
  -d '{"event":"test"}'
# Expected: 401 + HIGH severity audit log
```

### 6.2 Webhook Monitoring
- [ ] Failed webhook attempts tracked
- [ ] Alert on >5 failures in 5 minutes
- [ ] Webhook payload size limited
- [ ] Idempotency keys prevent duplicate processing

---

## 7. Data Protection

### 7.1 Database Security
- [ ] Row Level Security (RLS) enabled on ALL tables
- [ ] RLS policies restrictive by default (deny all)
- [ ] Policies check authentication (auth.uid())
- [ ] No policies with `USING (true)`
- [ ] Service role key used only in edge functions
- [ ] Anon key has minimal permissions
- [ ] No sensitive data in logs

**Verify:**
```sql
-- All tables should have RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
-- Expected: 0 rows

-- Check for permissive policies
SELECT policyname, tablename, permissive
FROM pg_policies
WHERE permissive = 'PERMISSIVE' AND qual = 'true'::pg_node_tree;
-- Expected: 0 rows with USING (true)
```

### 7.2 Sensitive Data Handling
- [ ] Passwords never logged
- [ ] API keys never in version control
- [ ] Secrets in environment variables only
- [ ] Database connection strings secured
- [ ] Payment card data never stored (PCI-DSS)
- [ ] PII encrypted at rest and in transit

### 7.3 Data Retention
- [ ] Audit logs: 180 days
- [ ] Session data: 30 days
- [ ] Expired sessions purged automatically
- [ ] Deleted user data purged within 30 days (GDPR)
- [ ] Backup retention: 30 days

---

## 8. Monitoring & Alerting

### 8.1 Security Monitoring
- [ ] Security monitor edge function deployed
- [ ] Monitor runs every 5 minutes (cron)
- [ ] Slack webhook URL configured
- [ ] Email alerts configured
- [ ] High severity events trigger immediate alerts
- [ ] Daily security report generated

**Test:**
```bash
# Trigger monitor manually
curl -X POST /functions/v1/security-monitor \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY"
# Check Slack for alert
```

### 8.2 Alert Rules
- [ ] 10+ failed logins from same IP in 5 min → HIGH alert
- [ ] Recovery code used → HIGH alert
- [ ] Webhook signature fail → HIGH alert
- [ ] 50+ CSP violations in 1 min → HIGH alert
- [ ] 5+ rate limit hits per user → MEDIUM alert

### 8.3 Audit Logging
- [ ] All authentication events logged
- [ ] All admin actions logged
- [ ] All failed access attempts logged
- [ ] Audit logs immutable (no UPDATE/DELETE)
- [ ] Logs include: timestamp, user_id, action, ip, user_agent
- [ ] Sensitive data NOT included in logs

**Verify:**
```sql
-- Check audit log coverage
SELECT action, COUNT(*) as count
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY action
ORDER BY count DESC;
```

---

## 9. Supply Chain Security

### 9.1 Dependency Management
- [ ] SBOM (Software Bill of Materials) generated on every build
- [ ] `npm audit` runs in CI/CD
- [ ] No critical vulnerabilities in production
- [ ] High vulnerabilities limited to <5
- [ ] Dependencies updated monthly
- [ ] Lock file (package-lock.json) committed

**Run:**
```bash
npm audit --production --audit-level=moderate
# Expected: 0 critical, <5 high
```

### 9.2 CI/CD Security
- [ ] GitHub Actions security workflow enabled
- [ ] Semgrep SAST running on all PRs
- [ ] Gitleaks secret scanning enabled
- [ ] TypeScript compilation errors block merge
- [ ] Security pipeline must pass before deploy
- [ ] Branch protection rules enforced

**Verify:**
```bash
# Check latest workflow run
gh run list --workflow=security.yml --limit=1
```

### 9.3 Code Security
- [ ] No `eval()` usage in codebase
- [ ] No `dangerouslySetInnerHTML` without DOMPurify
- [ ] No hardcoded secrets/API keys
- [ ] No commented-out sensitive code
- [ ] TypeScript strict mode enabled
- [ ] ESLint security rules enforced

**Check:**
```bash
# Search for dangerous patterns
grep -r "eval(" src/ --include="*.ts" --include="*.tsx"
grep -r "innerHTML" src/ --include="*.ts" --include="*.tsx"
grep -r "dangerouslySetInnerHTML" src/ --include="*.tsx"
# Expected: 0 results (or only DOMPurify-protected)
```

---

## 10. Operational Security

### 10.1 Backup & DR
- [ ] Daily automated backups configured
- [ ] Backups retained for 30 days
- [ ] Backup restoration tested quarterly
- [ ] DR drill completed this quarter
- [ ] RTO ≤ 60 minutes
- [ ] RPO ≤ 24 hours
- [ ] DR runbook up to date

### 10.2 Secrets Rotation
- [ ] JWT_SECRET rotation scheduled (90 days)
- [ ] WEBHOOK_SECRET_* rotation scheduled (90 days)
- [ ] PAYPAL_* rotation scheduled (180 days)
- [ ] TURNSTILE_SECRET_KEY rotation scheduled (180 days)
- [ ] Rotation procedure documented
- [ ] Last rotation date recorded

**Check:**
```bash
# Verify secrets are set
env | grep -E "JWT_SECRET|WEBHOOK_SECRET|TURNSTILE_SECRET" | wc -l
# Expected: 3+ secrets configured
```

### 10.3 Incident Response
- [ ] Incident response plan documented
- [ ] On-call rotation established
- [ ] Emergency contact list up to date
- [ ] Communication channels ready (Slack #incident)
- [ ] Post-mortem template prepared
- [ ] Team trained on procedures

---

## 11. Compliance

### 11.1 GDPR
- [ ] Privacy policy published and linked
- [ ] Cookie consent implemented
- [ ] Data export functionality available
- [ ] Right to deletion implemented
- [ ] Data processing records maintained
- [ ] User consent tracked in database

### 11.2 PCI-DSS (if storing payment data)
- [ ] Payment data NOT stored (using PayPal/Stripe)
- [ ] If stored: Encrypted at rest
- [ ] If stored: Encrypted in transit (TLS 1.2+)
- [ ] If stored: Access logged and monitored
- [ ] If stored: Regular security audits

### 11.3 SOC 2 Readiness
- [ ] Audit logs comprehensive and immutable
- [ ] Access control documented and enforced
- [ ] Backup procedures verified
- [ ] Incident response tested
- [ ] Security policies documented

---

## 12. Production Deployment

### 12.1 Pre-Deployment
- [ ] All checklist items above completed
- [ ] Security testing passed
- [ ] Penetration testing completed (if required)
- [ ] Load testing completed
- [ ] Monitoring configured
- [ ] Rollback plan prepared

### 12.2 Deployment Process
- [ ] Deploy during maintenance window
- [ ] Database migrations tested in staging
- [ ] Edge functions deployed
- [ ] Environment variables configured
- [ ] DNS updated (if needed)
- [ ] Health checks passing

### 12.3 Post-Deployment
- [ ] Smoke tests passed
- [ ] Monitoring shows normal metrics
- [ ] No error spike in logs
- [ ] Security headers verified in production
- [ ] CAPTCHA working in production
- [ ] 2FA working in production
- [ ] Webhooks receiving and processing

### 12.4 First Week Monitoring
- [ ] CSP in Report-Only mode
- [ ] Daily CSP violation review
- [ ] Monitor false positive rate
- [ ] Adjust policies if needed
- [ ] After 7 days: Switch to enforcement
- [ ] Continue monitoring for issues

---

## Sign-Off

**Security Review Completed:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Security Lead | | | |
| DevOps Lead | | | |
| Engineering Manager | | | |
| CTO | | | |

**Status:** [ ] APPROVED FOR PRODUCTION [ ] REQUIRES REMEDIATION

**Notes:**
________________________________________________________________________________
________________________________________________________________________________
________________________________________________________________________________

---

**Checklist Version:** 1.0
**Last Updated:** 2025-10-25
**Next Review:** 2026-01-25 (quarterly)
