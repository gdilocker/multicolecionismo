# COM.RICH - Security Sprint v1.0 → v2.0
## Transition Checklist & Action Items

---

**Purpose:** Ensure smooth transition from v1.0 (complete) to v2.0 (2026 roadmap)
**Timeline:** November 2025 - December 2025
**Owner:** Security Team Lead

---

## 📋 Immediate Actions (Week 1)

### 1. Configure Required Secrets ⚠️ CRITICAL

**Action:** Add 5 mandatory secrets to Supabase
**Location:** Supabase Dashboard → Settings → Edge Functions → Secrets
**Timeline:** 1 hour
**Owner:** DevOps Lead

```bash
# Required secrets
TURNSTILE_SECRET_KEY=0x4AAA...        # From Cloudflare Turnstile
PAYPAL_CLIENT_ID=AeB...               # From PayPal Developer Dashboard
PAYPAL_CLIENT_SECRET=EF...            # From PayPal Developer Dashboard (SENSITIVE)
PAYPAL_MODE=sandbox                   # Use 'sandbox' for testing, 'live' for production
APP_URL=https://app.com.rich          # Your production URL
```

**Verification:**
```bash
# Test edge functions after setting secrets
curl https://[project].supabase.co/functions/v1/domains \
  -H "Authorization: Bearer [anon-key]"

# Expected: Function should respond (not 500 error)
```

**Status:** [ ] Complete

---

### 2. Enable GitHub Security Features

**Action:** Enable Dependabot, Secret Scanning, Code Scanning
**Location:** GitHub Repository → Settings → Security
**Timeline:** 30 minutes
**Owner:** Lead Developer

**Steps:**
1. ✅ Enable Dependabot alerts
2. ✅ Enable Dependabot security updates
3. ✅ Enable Secret scanning
4. ✅ Enable Push protection (prevents committing secrets)
5. ✅ Enable Code scanning (CodeQL)

**Configuration:**
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

**Status:** [ ] Complete

---

### 3. Create Security Operations Repository

**Action:** Create private repo for security documentation
**Location:** GitHub Organization
**Timeline:** 15 minutes
**Owner:** CTO

**Repository Structure:**
```
security-ops/
├── README.md
├── audit-reports/
│   └── 2025-Q4-audit.pdf
├── compliance/
│   ├── GDPR-compliance-checklist.md
│   ├── LGPD-compliance-checklist.md
│   └── SOC2-preparation.md
├── incident-response/
│   ├── playbooks/
│   └── post-mortems/
├── policies/
│   ├── vulnerability-disclosure.md
│   └── responsible-ai-usage.md
└── secrets/
    └── rotation-log.md
```

**Access Control:**
- Read: CTO, Security Team (2-3 people)
- Write: Security Lead only
- Admin: CTO only

**Status:** [ ] Complete

---

## 📅 Week 1-2 Actions

### 4. Schedule January 2026 DR Drill

**Action:** Calendar event for disaster recovery test
**Date:** January 15, 2026, 10:00 AM (2 hours blocked)
**Location:** Virtual (Zoom/Meet)
**Owner:** DevOps Lead

**Participants:**
- [ ] DevOps Lead (drill coordinator)
- [ ] CTO (observer)
- [ ] Backend Developer (restore executor)
- [ ] Security Lead (validator)

**Pre-Drill Preparation:**
- [ ] Review `DR_DRILL_RUNBOOK.md`
- [ ] Verify backup integrity (Nov 2025)
- [ ] Test restore to staging environment
- [ ] Prepare communication templates

**Drill Scenarios:**
1. Database corruption + restore
2. Edge function failure + redeploy
3. Secrets compromise + rotation

**Success Criteria:**
- ✅ Database restored in <30 minutes
- ✅ All edge functions redeployed in <15 minutes
- ✅ Secrets rotated in <10 minutes
- ✅ Zero data loss

**Status:** [ ] Scheduled

---

### 5. Switch CSP from Report-Only to Enforce

**Action:** Enforce Content Security Policy (gradual rollout)
**Timeline:** 2 weeks (monitor, then enforce)
**Owner:** Frontend Lead

**Current State:**
```
Content-Security-Policy-Report-Only: ...
```

**Phase 1 (Week 1): Monitor Only**
```bash
# Review CSP violations (last 7 days)
SELECT
  details->>'violatedDirective' as directive,
  details->>'blockedUri' as blocked,
  COUNT(*) as occurrences
FROM audit_logs
WHERE action = 'CSP_VIOLATION'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY directive, blocked
ORDER BY occurrences DESC;
```

**Phase 2 (Week 2): Enforce**
- [ ] No critical violations for 7 days
- [ ] Update `_headers` file:
```
# Change to enforcing mode
Content-Security-Policy: default-src 'self'; ...
```

**Rollback Plan:**
- If legitimate features break, revert to Report-Only
- Fix CSP policy, re-test, re-deploy

**Status:** [ ] Complete

---

### 6. Generate Security Sprint v1.0 Final PDF

**Action:** Create PDF for board/investors
**Tool:** Markdown to PDF converter (e.g., Pandoc, Prince)
**Timeline:** 2 hours
**Owner:** Security Lead

**Source File:** `SECURITY_SPRINT_V1_FINAL_REPORT.md`

**Conversion:**
```bash
# Using Pandoc
pandoc SECURITY_SPRINT_V1_FINAL_REPORT.md \
  -o COM.RICH_Security_Sprint_v1.0_Final_Report.pdf \
  --pdf-engine=xelatex \
  --toc \
  --toc-depth=2 \
  -V geometry:margin=1in \
  -V fontsize=11pt
```

**Distribution:**
- [ ] Board of Directors
- [ ] C-Suite Executives
- [ ] Legal/Compliance Team
- [ ] External Auditor (future)

**Status:** [ ] Complete

---

## 📅 Week 3-4 Actions

### 7. First Monthly Security Review

**Action:** Run security queries and generate report
**Date:** Last Friday of November 2025
**Duration:** 1 hour
**Owner:** Security Lead

**Review Checklist:**

#### 7.1 High-Severity Events
```sql
SELECT
  action,
  severity,
  details,
  created_at
FROM audit_logs
WHERE severity IN ('high', 'critical')
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

**Expected:** <10 events (mostly legitimate, e.g., 2FA setup)

#### 7.2 Failed Authentication Patterns
```sql
SELECT
  ip_address,
  COUNT(*) as failures,
  MAX(created_at) as last_attempt
FROM audit_logs
WHERE action = 'login_failure'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY ip_address
HAVING COUNT(*) > 10
ORDER BY failures DESC;
```

**Expected:** <5 IPs (investigate if >20 failures)

#### 7.3 Admin Activity Audit
```sql
SELECT
  user_id,
  action,
  COUNT(*) as count
FROM audit_logs
WHERE details->>'role' = 'admin'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id, action
ORDER BY count DESC;
```

**Expected:** All admin actions documented

#### 7.4 Rate Limit Analysis
```sql
SELECT
  details->>'route' as endpoint,
  COUNT(*) as violations
FROM audit_logs
WHERE action = 'rate_limit_exceeded'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY endpoint
ORDER BY violations DESC;
```

**Expected:** <100 violations/month (mostly legitimate API users)

**Report Output:**
- Document: `monthly-security-review-[YYYY-MM].md`
- Distribution: CTO, Security Team
- Action Items: Track in GitHub Issues

**Status:** [ ] Complete

---

### 8. Baseline Metrics Collection

**Action:** Establish baseline for v2.0 comparison
**Timeline:** End of November 2025
**Owner:** Data Analyst + Security Lead

**Metrics to Collect:**

| Metric | SQL Query | Target |
|--------|-----------|--------|
| Total Users | `SELECT COUNT(*) FROM users;` | Baseline |
| 2FA Adoption | `SELECT COUNT(*) FROM users WHERE totp_secret IS NOT NULL;` | 30% |
| Audit Log Volume | `SELECT COUNT(*) FROM audit_logs WHERE created_at > NOW() - INTERVAL '30 days';` | Baseline |
| Failed Logins | `SELECT COUNT(*) FROM audit_logs WHERE action = 'login_failure' AND created_at > NOW() - INTERVAL '30 days';` | <100 |
| High-Severity Events | `SELECT COUNT(*) FROM audit_logs WHERE severity IN ('high', 'critical') AND created_at > NOW() - INTERVAL '30 days';` | <10 |

**Output:** Baseline metrics dashboard (Google Sheets or internal BI tool)

**Status:** [ ] Complete

---

## 📅 December 2025 Actions

### 9. Q1 2026 Vendor Selection

**Action:** Research and select vendors for Q1 projects
**Timeline:** December 2025
**Owner:** CTO + Procurement

#### 9.1 Penetration Testing Vendor

**Requirements:**
- OSCP/OSCE certified testers
- Web application focus
- API security expertise
- Experience with Supabase/serverless

**Candidates:**
1. **CrowdStrike** - $12k-$15k (premium)
2. **Rapid7** - $8k-$12k (mid-range)
3. **Coalfire** - $6k-$10k (cost-effective)
4. **Cobalt** - $5k-$8k (agile pentest platform)

**Selection Criteria:**
- [ ] Price vs budget ($8k-$12k target)
- [ ] Availability (Jan-Feb 2026)
- [ ] Experience (3+ similar projects)
- [ ] References (2+ client references)

**Decision Deadline:** December 15, 2025
**Status:** [ ] Vendor selected

#### 9.2 SOC 2 Auditor Research

**Requirements:**
- AICPA licensed
- Technology sector experience
- Reasonable cost ($20k-$30k target)

**Candidates:**
1. **Deloitte** (Big 4) - $40k-$60k
2. **A-LIGN** (specialized) - $25k-$35k
3. **Prescient Assurance** (specialized) - $20k-$30k
4. **Sensiba San Filippo** (mid-market) - $18k-$25k

**Selection Criteria:**
- [ ] Cost fits budget
- [ ] Timeline (Q3 2026 audit)
- [ ] Scope (all 5 TSC criteria)

**Decision Deadline:** December 31, 2025
**Status:** [ ] Auditor selected

#### 9.3 SIEM Platform Decision

**Options:**
1. **Elastic Stack (ELK)** - $0 (self-hosted) or $3k/year (cloud)
2. **Splunk** - $5k-$10k/year (enterprise)
3. **Sumo Logic** - $2k-$5k/year (cloud)

**Recommendation:** Elastic Stack (cost-effective, flexible)

**Decision Deadline:** December 20, 2025
**Status:** [ ] Platform selected

---

### 10. 2026 Budget Approval

**Action:** Present Security Sprint v2.0 budget to executives
**Meeting Date:** Mid-December 2025
**Participants:** CTO, CFO, CEO
**Owner:** CTO

**Budget Request:**

| Quarter | Budget | Justification |
|---------|--------|---------------|
| Q1 2026 | $15k-$25k | Pentesting + SIEM + Threat Intel |
| Q2 2026 | $50k-$55k | Bug Bounty Program (reward pool) |
| Q3 2026 | $30k-$50k | SOC 2 Type II Certification |
| Q4 2026 | $20k-$40k | Vault + UBA + Zero-Trust |
| **Total** | **$115k-$170k** | Full year security investment |
| **Recurring** | **$27k/year** | Ongoing tool costs |

**ROI Justification:**
- ✅ SOC 2 unlocks $500k+ enterprise deals (30% close rate increase)
- ✅ Bug bounty prevents $1M+ breach costs (industry average)
- ✅ Automation saves 500+ hours/year (manual security work)
- ✅ Compliance avoids $250k+ GDPR fines

**Approval Status:** [ ] Approved

---

### 11. Team Training & Onboarding

**Action:** Train team on v1.0 security features
**Timeline:** December 2025
**Owner:** Security Lead

**Training Modules:**

#### 11.1 Developer Security Training (2 hours)
**Audience:** All developers
**Topics:**
- RLS policy creation
- Input validation best practices
- Secure edge function development
- Secrets management (Vault preview)

**Materials:**
- [ ] Slide deck created
- [ ] Video recorded
- [ ] Quiz (80% pass required)

#### 11.2 Admin Security Training (1 hour)
**Audience:** Admin users
**Topics:**
- 2FA setup and recovery
- Audit log review
- Security incident reporting
- Social engineering awareness

**Materials:**
- [ ] User guide created
- [ ] Video tutorial
- [ ] Compliance acknowledgment

#### 11.3 Incident Response Training (3 hours)
**Audience:** On-call engineers, security team
**Topics:**
- Incident classification (L1-L4)
- Escalation procedures
- DR drill procedures
- Post-mortem process

**Materials:**
- [ ] Runbook review
- [ ] Tabletop exercise
- [ ] Role assignments

**Completion Deadline:** December 31, 2025
**Status:** [ ] Training complete

---

## 📊 Transition Success Criteria

### Technical Criteria

- [x] Build passing (100% success rate)
- [ ] All 5 secrets configured
- [ ] GitHub security features enabled
- [ ] CSP enforcing (no false positives)
- [ ] Monthly security review completed

### Operational Criteria

- [ ] DR drill scheduled (Jan 2026)
- [ ] Security ops repo created
- [ ] Team training completed
- [ ] Baseline metrics collected
- [ ] Q1 vendors selected

### Documentation Criteria

- [x] Final report created (Markdown)
- [ ] Final report PDF generated
- [ ] v2.0 roadmap approved
- [ ] Budget approved
- [ ] Distributed to stakeholders

### Compliance Criteria

- [x] RLS 100% coverage maintained
- [x] Audit logs operational
- [x] 2FA available to all users
- [ ] First monthly audit passed
- [ ] No security incidents

---

## 🚨 Escalation Path

**Issue:** Secrets not working
**First Contact:** DevOps Lead
**Escalate to:** CTO (if >1 hour unresolved)

**Issue:** CSP breaking features
**First Contact:** Frontend Lead
**Escalate to:** CTO (if customer impact)

**Issue:** Security incident
**First Contact:** Security Lead (immediate)
**Escalate to:** CTO → CEO (if critical)

---

## 📅 Key Dates Summary

| Date | Event | Owner |
|------|-------|-------|
| Nov 1, 2025 | Configure secrets | DevOps |
| Nov 8, 2025 | GitHub security on | Dev Lead |
| Nov 15, 2025 | CSP enforcement | Frontend |
| Nov 29, 2025 | Monthly review #1 | Security Lead |
| Dec 15, 2025 | Pentest vendor selected | CTO |
| Dec 20, 2025 | SIEM platform selected | Security Lead |
| Dec 31, 2025 | Team training done | Security Lead |
| Jan 15, 2026 | DR Drill | DevOps Lead |

---

## ✅ Sign-Off

**Reviewed by:**
- [ ] CTO - Date: __________
- [ ] Security Lead - Date: __________
- [ ] DevOps Lead - Date: __________
- [ ] CFO (Budget) - Date: __________

**Approved to proceed with v2.0:** [ ] YES  [ ] NO

**Signature:** _________________________
**Date:** _____________________________

---

**Document Version:** 1.0.0
**Last Updated:** October 25, 2025
**Next Review:** November 30, 2025

---

*This checklist is a living document. Update completion status as tasks are finished.*
