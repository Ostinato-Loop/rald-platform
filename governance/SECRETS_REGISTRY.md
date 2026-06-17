# RALD Secrets Registry
**Generated:** 2026-06-17 | **Phase 7 — Secret Governance**
**Source of Truth:** GitHub Org Secrets (Ostinato-Loop) — visibility: all repos

---

## GITHUB ORG SECRETS (Canonical)

| Secret | Purpose | Owner | Created | Last Updated | Risk |
|--------|---------|-------|---------|-------------|------|
| CLOUDFLARE_API_TOKEN | CF Workers + Pages deploy | Platform/DevOps | 2026-05-27 | 2026-05-27 | 🔴 High — rotates all CF deployments |
| CLOUDFLARE_ACCOUNT_ID | CF account targeting | Platform/DevOps | 2026-05-27 | 2026-05-27 | 🟡 Medium |
| AWS_ACCESS_KEY_ID | AWS S3/SES/CloudFormation | Platform/DevOps | 2026-05-27 | 2026-05-27 | 🔴 High |
| AWS_SECRET_ACCESS_KEY | AWS auth | Platform/DevOps | 2026-05-27 | 2026-05-27 | 🔴 High |
| AWS_REGION | AWS region targeting | Platform/DevOps | 2026-05-27 | 2026-05-27 | 🟢 Low |
| SUPABASE_URL | Supabase project URL | Backend | 2026-05-27 | 2026-05-27 | 🟡 Medium (public endpoint) |
| SUPABASE_ANON_KEY | Supabase public key | Backend | 2026-05-27 | 2026-05-27 | 🟡 Medium |
| SUPABASE_SERVICE_ROLE_KEY | Supabase admin key | Backend | 2026-05-27 | 2026-05-27 | 🔴 CRITICAL — full DB access |
| RALD_JWT_SECRET | JWT signing for all auth | Security | 2026-06-11 | 2026-06-11 | 🔴 CRITICAL — compromise = all tokens invalid |
| SESSION_SECRET | Session cookie signing | Security | 2026-05-27 | 2026-05-27 | 🔴 High |

---

## SECRETS USED PER-REPO (NOT ORG-LEVEL)

| Secret | Repo | Notes |
|--------|------|-------|
| MACHINE_JWT_SECRET | rald-routing | M2M JWT for routing → ALIA calls — set via `wrangler secret put` |
| MACHINE_JWT_SECRET | rald-os | Same — should match rald-routing |

---

## GITLAB SECRETS (sekanidev/rald-alia)

| Secret | How Provided | Notes |
|--------|-------------|-------|
| CI_REGISTRY_USER | Auto-injected by GitLab | Docker push to GitLab registry |
| CI_REGISTRY_PASSWORD | Auto-injected by GitLab | Docker push |
| CI_REGISTRY | Auto-injected by GitLab | = registry.gitlab.com |
| CI_COMMIT_SHORT_SHA | Auto-injected | Image tagging |

> ℹ️ No custom GitLab CI variables configured for sekanidev/rald-alia. All secrets come from GitLab auto-provided variables.

---

## CLOUDFLARE SECRETS (Wrangler)

Set via `wrangler secret put <KEY>` per Worker deployment:

| Worker | Secrets Required |
|--------|----------------|
| rald-os | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RALD_JWT_SECRET |
| rald-auth-core | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RALD_JWT_SECRET |
| rald-routing | MACHINE_JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
| rald-notify | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
| rald-config | SUPABASE_URL, SUPABASE_ANON_KEY |
| rald-identity | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RALD_JWT_SECRET |
| rald-event-bus | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |

---

## RISKS & GAPS

| Risk | Severity | Recommendation |
|------|----------|---------------|
| SUPABASE_SERVICE_ROLE_KEY has full DB access | 🔴 CRITICAL | Rotate on any suspected breach. Use RLS policies to limit blast radius. |
| RALD_JWT_SECRET shared across all Workers | 🔴 CRITICAL | If leaked, ALL tokens across all products are compromised. Consider per-product secrets. |
| MACHINE_JWT_SECRET set at repo level, not org | 🟡 Medium | Promote to org secret with selective visibility. |
| No secret rotation policy defined | 🔴 High | Define 90-day rotation schedule for CLOUDFLARE_API_TOKEN, AWS keys, and RALD_JWT_SECRET. |
| No staging secrets (same Supabase for dev/prod) | 🔴 High | Create dedicated Supabase project for staging. |
| AWS credentials never rotated (since 2026-05-27) | 🟡 Medium | Rotate AWS keys on 90-day schedule. |
| SESSION_SECRET scope not documented | 🟡 Medium | Document which services use SESSION_SECRET. |

---

## GOVERNANCE RULES

1. Every secret MUST have a documented owner.
2. Every secret MUST have a 90-day rotation schedule.
3. SUPABASE_SERVICE_ROLE_KEY and RALD_JWT_SECRET are CRITICAL — treat as root keys.
4. No secret shall be hardcoded in source code. All secrets through GitHub/GitLab org secrets or Wrangler.
5. Staging and Production MUST use separate credentials.
