# Security Operations Playbook - COM.RICH

## Backup & Disaster Recovery

### Database Backups

#### Automated Backups
- **Frequency**: Daily at 03:00 UTC
- **Retention**: 30 days
- **Location**: Supabase automated backups + S3 mirror
- **Recovery Point Objective (RPO)**: 24 hours
- **Recovery Time Objective (RTO)**: 4 hours

#### Backup Verification
- **Schedule**: Quarterly (Q1, Q2, Q3, Q4)
- **Process**:
  1. Restore backup to isolated environment
  2. Run data integrity checks
  3. Verify critical tables and row counts
  4. Test application connectivity
  5. Document results with screenshots

```sql
-- Verification Queries
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM domains;
SELECT COUNT(*) FROM orders;
SELECT MAX(created_at) FROM audit_logs;
```

#### Manual Backup Procedure
```bash
# Export full database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Verify backup
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Upload to S3
aws s3 cp backup_*.sql s3://comrich-backups/manual/
```

### Disaster Recovery Plan

#### Scenario: Complete Database Loss
1. **Alert**: Page on-call engineer immediately
2. **Assess**: Determine scope and cause
3. **Restore**:
   - Provision new Supabase instance
   - Restore from most recent backup
   - Verify data integrity
4. **Update**: Point application to new instance
5. **Monitor**: Watch for errors and inconsistencies
6. **Post-Mortem**: Document incident within 48 hours

#### Scenario: Data Corruption
1. **Isolate**: Stop writes to affected tables
2. **Identify**: Determine corruption extent and timestamp
3. **Restore**: Point-in-time recovery to pre-corruption state
4. **Verify**: Run integrity checks
5. **Resume**: Re-enable writes
6. **Investigate**: Root cause analysis

---

## Secrets Rotation (90-Day Policy)

### Secrets Inventory

| Secret | Purpose | Rotation Frequency | Last Rotated |
|--------|---------|-------------------|--------------|
| JWT_SECRET | Auth tokens | 90 days | - |
| PAYPAL_CLIENT_ID | Payment integration | 180 days | - |
| PAYPAL_CLIENT_SECRET | Payment integration | 180 days | - |
| WEBHOOK_SECRET_PAYPAL | Webhook verification | 90 days | - |
| WEBHOOK_SECRET_DYNADOT | Webhook verification | 90 days | - |
| TURNSTILE_SECRET_KEY | CAPTCHA verification | 180 days | - |
| SUPABASE_SERVICE_ROLE_KEY | Admin operations | Never (managed) | - |

### Rotation Process

#### 1. JWT_SECRET Rotation

**Preparation:**
```bash
# Generate new secret
NEW_SECRET=$(openssl rand -base64 32)
echo "New JWT_SECRET: $NEW_SECRET"
```

**Implementation (Zero-Downtime):**
1. Add `JWT_SECRET_NEXT` environment variable with new secret
2. Update auth service to accept BOTH secrets for verification
3. Deploy to production
4. Monitor for 24 hours
5. Update auth service to ISSUE tokens with new secret
6. Deploy to production
7. After 7 days, remove old secret from verification
8. Remove `JWT_SECRET_NEXT` variable

**Code Example:**
```typescript
// Dual-secret verification period
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    if (process.env.JWT_SECRET_NEXT) {
      return jwt.verify(token, process.env.JWT_SECRET_NEXT);
    }
    throw new Error('Invalid token');
  }
};
```

#### 2. Webhook Secret Rotation

**Process:**
1. Generate new secret: `openssl rand -hex 32`
2. Update in partner dashboard (PayPal/Dynadot)
3. Add `WEBHOOK_SECRET_*_NEXT` to environment
4. Deploy dual-verification code
5. Monitor webhook delivery for 48 hours
6. Remove old secret
7. Log rotation in audit system

```typescript
// Example audit log entry
await logAuditEvent({
  action: 'SECRETS_ROTATED',
  severity: 'high',
  details: {
    secret_type: 'WEBHOOK_SECRET_PAYPAL',
    rotated_at: new Date().toISOString(),
    next_rotation: addDays(new Date(), 90)
  },
  success: true
});
```

#### 3. API Key Rotation (PayPal, Cloudflare)

**PayPal:**
1. Log into PayPal Developer Dashboard
2. Generate new REST API credentials
3. Update environment variables
4. Test payment flow in sandbox
5. Deploy to production
6. Revoke old credentials after 24h

**Cloudflare Turnstile:**
1. Log into Cloudflare Dashboard
2. Generate new site key and secret
3. Update both frontend and backend
4. Deploy simultaneously
5. Test CAPTCHA flow
6. Delete old keys

---

## Automated Maintenance

### Database Cleanup (Cron Jobs)

```sql
-- Setup: Run once to enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Purge old audit logs (180 days retention)
SELECT cron.schedule(
  'purge-old-audit-logs',
  '0 3 * * *', -- 03:00 UTC daily
  $$
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '180 days'
  $$
);

-- Purge expired sessions
SELECT cron.schedule(
  'purge-expired-sessions',
  '*/15 * * * *', -- Every 15 minutes
  $$
    DELETE FROM sessions
    WHERE expires_at < NOW()
  $$
);

-- Archive old orders (keep active + 90 days)
SELECT cron.schedule(
  'archive-old-orders',
  '0 4 * * 0', -- 04:00 UTC Sunday
  $$
    INSERT INTO orders_archive
    SELECT * FROM orders
    WHERE status = 'completed'
      AND created_at < NOW() - INTERVAL '90 days';

    DELETE FROM orders
    WHERE status = 'completed'
      AND created_at < NOW() - INTERVAL '90 days';
  $$
);

-- Vacuum and analyze
SELECT cron.schedule(
  'vacuum-analyze',
  '0 5 * * 0', -- 05:00 UTC Sunday
  $$
    VACUUM ANALYZE;
  $$
);
```

### View Scheduled Jobs
```sql
SELECT * FROM cron.job ORDER BY jobid;
```

### Monitor Job Execution
```sql
SELECT * FROM cron.job_run_details
WHERE end_time > NOW() - INTERVAL '7 days'
ORDER BY end_time DESC;
```

---

## Security Monitoring

### Daily Checks (Automated)
- ✅ Check for failed login attempts > 50/hour
- ✅ Monitor 2FA bypass attempts
- ✅ Review CSP violations
- ✅ Verify backup completion
- ✅ Check SSL certificate expiry (< 30 days)

### Weekly Reviews (Manual)
- 📋 Review audit logs for anomalies
- 📋 Check for new high-severity vulnerabilities
- 📋 Verify rate limiting effectiveness
- 📋 Review user-reported security issues

### Monthly Tasks
- 🔄 Test disaster recovery procedure
- 🔄 Review and update firewall rules
- 🔄 Dependency security audit (`npm audit`)
- 🔄 Review access control permissions
- 🔄 Update security documentation

### Quarterly Tasks
- 📅 Penetration testing
- 📅 Security training for team
- 📅 Review and update incident response plan
- 📅 Backup restoration test
- 📅 Secrets rotation (90-day policy)

---

## Incident Response

### Severity Levels

**P0 - Critical (Response: Immediate)**
- Data breach / Unauthorized access
- Complete service outage
- Payment system compromise

**P1 - High (Response: < 1 hour)**
- Partial service outage
- Security vulnerability exploitation
- Database performance degradation

**P2 - Medium (Response: < 4 hours)**
- Non-critical bug affecting users
- Elevated error rates
- Minor security issue

**P3 - Low (Response: < 24 hours)**
- Feature requests
- Minor UI bugs
- Documentation updates

### Response Checklist

#### Immediate Actions (0-15 min)
- [ ] Page on-call engineer
- [ ] Create incident ticket
- [ ] Assess severity and impact
- [ ] Start incident timeline

#### Containment (15-60 min)
- [ ] Stop the bleeding (isolate affected systems)
- [ ] Preserve evidence
- [ ] Notify stakeholders
- [ ] Begin investigation

#### Resolution (1-4 hours)
- [ ] Implement fix
- [ ] Verify resolution
- [ ] Monitor for recurrence
- [ ] Update status page

#### Post-Incident (24-48 hours)
- [ ] Write post-mortem
- [ ] Identify root cause
- [ ] Document lessons learned
- [ ] Implement preventive measures
- [ ] Update runbooks

---

## Compliance & Audit

### Data Retention Policy
- **Audit Logs**: 180 days
- **User Data**: Indefinite (until account deletion)
- **Payment Records**: 7 years (legal requirement)
- **Session Data**: 30 days
- **CSP Reports**: 90 days

### GDPR Compliance
- User data export available via API
- Right to deletion implemented
- Consent tracking in database
- Privacy policy up to date

### SOC 2 Preparation
- Audit logs immutable and complete
- Access control documented
- Backup procedures verified
- Incident response plan tested

---

## Emergency Contacts

| Role | Contact | Escalation Time |
|------|---------|----------------|
| On-Call Engineer | Slack: #oncall | Immediate |
| Security Lead | security@com.rich | < 15 min |
| CTO | cto@com.rich | < 30 min |
| Legal | legal@com.rich | < 1 hour |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-10-25 | Initial playbook created | Security Team |

---

**Last Review**: 2025-10-25
**Next Review Due**: 2026-01-25
