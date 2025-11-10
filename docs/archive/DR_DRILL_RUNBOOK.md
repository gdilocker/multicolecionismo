# Disaster Recovery Drill - Quarterly Runbook

## Objectives
- Validate backup restoration procedures
- Measure Recovery Time Objective (RTO) and Recovery Point Objective (RPO)
- Train team on DR procedures
- Identify gaps in documentation
- Test failover mechanisms

**Target RTO:** ≤ 60 minutes
**Target RPO:** ≤ 24 hours

---

## Pre-Drill Checklist

- [ ] Schedule drill during low-traffic period
- [ ] Notify all stakeholders (engineering, ops, management)
- [ ] Prepare DR staging environment
- [ ] Ensure all team members have access to required systems
- [ ] Have communication channels ready (Slack #incident-response)
- [ ] Backup current production state
- [ ] Document start time

---

## Phase 1: Preparation (T-0 to T+5 min)

### 1.1 Identify Snapshot
```bash
# List available Supabase backups
# Via Supabase Dashboard: Project > Settings > Database > Point in Time Recovery

# Select snapshot from yesterday (simulate 24h data loss)
SNAPSHOT_ID="backup-2025-10-24-03-00"
SNAPSHOT_TIME="2025-10-24 03:00:00 UTC"
```

**Record:**
- Snapshot ID: ________________
- Snapshot timestamp: ________________
- Data loss window: ________________

### 1.2 Provision DR Environment
```bash
# Create new Supabase project or use existing DR-staging
# Name: "comrich-dr-staging"
# Region: Same as production
# Plan: Pro (for PITR)

DR_PROJECT_URL="https://xxxxx.supabase.co"
DR_ANON_KEY="eyJ..."
DR_SERVICE_ROLE_KEY="eyJ..."
```

**Record:**
- DR environment created: [ ]
- Start time: ________________

---

## Phase 2: Database Restoration (T+5 to T+20 min)

### 2.1 Restore from Snapshot
```bash
# Via Supabase Dashboard:
# 1. Go to DR project > Settings > Database
# 2. Click "Restore from backup"
# 3. Select snapshot: $SNAPSHOT_ID
# 4. Confirm restoration

# Wait for restoration to complete (usually 5-15 min depending on DB size)
```

**Record:**
- Restoration initiated: [ ]
- Restoration time: ________ minutes
- Any errors: ________________

### 2.2 Verify Database Integrity
```sql
-- Connect to DR database
psql $DR_DATABASE_URL

-- Run verification queries
SELECT COUNT(*) as total_customers FROM customers;
SELECT COUNT(*) as total_domains FROM domains;
SELECT COUNT(*) as total_orders FROM orders;
SELECT MAX(created_at) as latest_audit FROM audit_logs;
SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;

-- Check for data consistency
SELECT
  (SELECT COUNT(*) FROM customers) as customers,
  (SELECT COUNT(*) FROM domains) as domains,
  (SELECT COUNT(*) FROM orders) as orders,
  (SELECT COUNT(*) FROM audit_logs) as audit_logs;

-- Verify RLS policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check functions and triggers
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**Record:**
- Total customers: ________________
- Total domains: ________________
- Total orders: ________________
- Latest audit log: ________________
- Database size: ________________
- RLS policies: [ ] Present
- Functions/triggers: [ ] Present

---

## Phase 3: Application Configuration (T+20 to T+30 min)

### 3.1 Update Environment Variables
```bash
# Create DR environment file
cat > .env.dr <<EOF
VITE_SUPABASE_URL=$DR_PROJECT_URL
VITE_SUPABASE_ANON_KEY=$DR_ANON_KEY
VITE_APP_URL=https://dr-staging.com.rich

# Backend
SUPABASE_URL=$DR_PROJECT_URL
SUPABASE_ANON_KEY=$DR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$DR_SERVICE_ROLE_KEY

# Keep same external service keys
PAYPAL_CLIENT_ID=$PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET=$PAYPAL_CLIENT_SECRET
TURNSTILE_SITE_KEY=$TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY=$TURNSTILE_SECRET_KEY

# Test mode flags
DR_MODE=true
EOF
```

### 3.2 Deploy Application to DR
```bash
# Build with DR environment
npm run build -- --mode dr

# Deploy to DR staging environment
# (Netlify/Vercel/etc with different subdomain)
netlify deploy --prod --dir=dist --site=comrich-dr

# Or update DNS to point to DR environment
# (In real DR, this would be production domain)
```

**Record:**
- Environment configured: [ ]
- Application deployed: [ ]
- Deployment URL: ________________

---

## Phase 4: Functional Testing (T+30 to T+50 min)

### 4.1 Authentication Test
```bash
# Test user login
curl -X POST https://dr-staging.com.rich/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@com.rich","password":"DrillTest123!"}'
```

**Manual Test:**
1. Open DR application URL
2. Login with test credentials
3. Verify session works
4. Check 2FA (if enabled)

**Record:**
- Login successful: [ ]
- Session persists: [ ]
- 2FA works: [ ]

### 4.2 Critical Operations Test
```bash
# Test domain search
curl "https://dr-staging.com.rich/api/domains/search?q=example"

# Test checkout flow (do NOT complete payment)
# 1. Search domain
# 2. Add to cart
# 3. Go to checkout
# 4. STOP before payment
```

**Manual Test:**
1. Search for domain
2. View domain details
3. Add to cart
4. View cart
5. Start checkout (don't complete)
6. Check user profile
7. View order history

**Record:**
- Domain search: [ ]
- Add to cart: [ ]
- Checkout page loads: [ ]
- Profile loads: [ ]
- Order history: [ ]

### 4.3 Data Integrity Verification
```sql
-- Verify latest order matches expectation
SELECT id, customer_id, status, total_price, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- Verify user data
SELECT id, email, created_at, last_login
FROM customers
WHERE email = 'test@com.rich';

-- Check for any data corruption
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Record:**
- Data matches production: [ ]
- No corruption detected: [ ]
- All tables present: [ ]

---

## Phase 5: Edge Functions & Webhooks (T+50 to T+60 min)

### 5.1 Deploy Edge Functions
```bash
# Deploy all edge functions to DR project
supabase functions deploy --project-ref $DR_PROJECT_REF

# Or deploy individually
supabase functions deploy paypal-webhook --project-ref $DR_PROJECT_REF
supabase functions deploy security-monitor --project-ref $DR_PROJECT_REF
supabase functions deploy qr --project-ref $DR_PROJECT_REF
```

### 5.2 Test Edge Functions
```bash
# Test QR generation
curl "https://$DR_PROJECT_URL/functions/v1/qr?data=test"

# Test webhook endpoint (with valid signature)
# DO NOT use production webhook - use test webhook
```

**Record:**
- Edge functions deployed: [ ]
- QR function works: [ ]
- Webhook responds: [ ]

---

## Phase 6: Performance & Monitoring (Optional)

### 6.1 Performance Baseline
```bash
# Test response times
for endpoint in /api/health /api/domains /api/auth/login; do
  echo "Testing $endpoint..."
  curl -w "\nTime: %{time_total}s\n" -o /dev/null -s \
    https://dr-staging.com.rich$endpoint
done
```

**Record:**
- /api/health: ________ seconds
- /api/domains: ________ seconds
- /api/auth/login: ________ seconds

### 6.2 Setup Monitoring
```bash
# Verify monitoring works in DR environment
# - Check metrics collection
# - Verify audit logs write successfully
# - Test security monitor
```

---

## Phase 7: Cleanup & Documentation

### 7.1 Calculate Metrics
```
RTO (Recovery Time Objective):
- Start time: ________________
- End time: ________________
- Total RTO: ________ minutes
- Target: 60 minutes
- Result: [ ] PASS [ ] FAIL

RPO (Recovery Point Objective):
- Last backup: ________________
- Simulated incident: ________________
- Data loss: ________ hours
- Target: 24 hours
- Result: [ ] PASS [ ] FAIL
```

### 7.2 Document Findings

**What Went Well:**
1. ________________
2. ________________
3. ________________

**Issues Encountered:**
1. ________________
2. ________________
3. ________________

**Action Items:**
1. ________________
2. ________________
3. ________________

### 7.3 Update Procedures
- [ ] Update DR documentation with learnings
- [ ] Fix any identified gaps
- [ ] Share findings with team
- [ ] Schedule follow-up items

### 7.4 Teardown DR Environment
```bash
# Keep DR environment for 24 hours for review
# Then delete or keep as permanent DR standby

# Delete if needed:
# Supabase Dashboard > Project Settings > General > Delete Project
```

---

## Post-Drill Report Template

```markdown
# DR Drill Report - [DATE]

## Executive Summary
- **Duration:** XX minutes
- **RTO Target:** 60 min | **Actual:** XX min | **Status:** PASS/FAIL
- **RPO Target:** 24h | **Actual:** XX h | **Status:** PASS/FAIL
- **Overall Result:** SUCCESS/PARTIAL/FAILED

## Timeline
| Time | Event |
|------|-------|
| T+0  | Drill initiated |
| T+5  | Database restore started |
| T+XX | Database restore completed |
| T+XX | Application deployed |
| T+XX | Functional tests passed |
| T+XX | Drill completed |

## Test Results
- Database restoration: ✅ / ❌
- Application deployment: ✅ / ❌
- Authentication: ✅ / ❌
- Critical operations: ✅ / ❌
- Edge functions: ✅ / ❌

## Findings
### Strengths
1. ...
2. ...

### Weaknesses
1. ...
2. ...

### Action Items
1. [ ] ...
2. [ ] ...

## Recommendations
...

## Next Drill
- **Date:** [Q+1 yyyy-mm-dd]
- **Focus areas:** ...

---
**Conducted by:** [Name]
**Reviewed by:** [Name]
**Approved by:** [Name]
```

---

## Quarterly Schedule

| Quarter | Target Date | Status | RTO | RPO | Notes |
|---------|-------------|--------|-----|-----|-------|
| Q1 2025 | Jan 15 | Pending | - | - | - |
| Q2 2025 | Apr 15 | Pending | - | - | - |
| Q3 2025 | Jul 15 | Pending | - | - | - |
| Q4 2025 | Oct 15 | Pending | - | - | - |

---

## Emergency Contacts (During Drill)

| Role | Name | Contact |
|------|------|---------|
| Drill Leader | | |
| Database Admin | | |
| DevOps Lead | | |
| Security Lead | | |

---

**Version:** 1.0
**Last Updated:** 2025-10-25
**Next Review:** 2026-01-25
