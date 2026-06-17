# RALD Executive Recommendations
**Generated:** 2026-06-17 | **Phase 10 — Executive Summary**
**Prepared by:** Principal Architect | **Classification:** Strategic

---

## CRITICAL ACTIONS (Do Now)

### C1. Fix GitLab CI Quota — RALD ALIA (sekanidev)
**Risk:** The entire ALIA microservice layer (13 services) cannot build or deploy Docker images.
**Root Cause:** GitLab namespace CI compute quota exhausted.
**Action:** Add GitLab compute credits to sekanidev namespace OR register a self-hosted runner.
**Impact:** Blocks Docker image releases for identity, routing, fraud, audit, consent services.

### C2. Create Dedicated Staging Environment
**Risk:** Development and production share the same Supabase database.
**Action:** Provision a separate Supabase project for staging. Rotate all staging secrets.
**Impact:** Any destructive migration in dev can corrupt production data.

### C3. RALD_JWT_SECRET is a Single Point of Failure
**Risk:** One compromised secret = all sessions across all products invalidated.
**Action:** Implement per-product JWT secrets (rald-os, rald-identity, rald-auth-core each get their own secret).
**Impact:** Breach containment improves from 0% to per-product isolation.

---

## HIGH PRIORITY (This Sprint)

### H1. Archive 6 Dead Repositories
Repos to archive immediately — no active deployment, superseded, or stale:
- `rald-auth-server` → superseded by rald-auth-core
- `rald-auth` → superseded by rald-auth-core
- `rald-infrastructure` → V1 shell scripts, superseded by rald-infra
- `payrald` → JavaScript monolith, superseded by payrald-* repos
- `loop-business-8cbd0eb1` → stale fork
- `rald` → unnamed root repo, no purpose
- `waiting-room` → no description, no recent activity

### H2. Consolidate 8 SDK Repos into 1
Current: rald-sdk + rald-auth-sdk + rald-sdk-payments + rald-sdk-messaging + rald-shared-sdk + rald-auth-sdk
Target: `@rald/sdk` (one package, all modules)
Allowed wrappers: rald-sdk-react, rald-sdk-react-native, rald-sdk-nextjs
**Timeline:** 2 weeks

### H3. Merge 4 Auth Repos into 1
`rald-auth-server`, `rald-auth`, `rald-infrastructure` → archive
`rald-auth-sdk` → merge into rald-sdk
Canonical: `rald-auth-core` only.

### H4. Define Secret Rotation Policy
Every secret must rotate on a documented schedule:
- CLOUDFLARE_API_TOKEN: 90 days
- AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY: 90 days
- RALD_JWT_SECRET: 180 days (with coordinated rollover)
- SUPABASE_SERVICE_ROLE_KEY: 180 days

---

## MEDIUM PRIORITY (Next 30 Days)

### M1. Merge API Fragments
- `rald-api-core` → merge rate-limiting middleware into rald-os
- `rald-events` → merge schema definitions into rald-event-bus
- `rald-console` → merge into rald-dev-console
- `rald-loop-business` → merge into loop-business

### M2. Resolve raldtics Namespace Collision
`raldtics` repo is described as "Logistics abstraction" but all `raldtics-*` repos are analytics tools. Rename `raldtics` to `rald-logistics` or update description. This causes confusion in onboarding.

### M3. Deploy rald-observability to All Workers
The `rald-observability` repo exists but adoption is unclear. Structured logging, Sentry, and CloudWatch must be active on all production Workers before next incident.

### M4. Enable Branch Protection on All Active Repos
Require:
- Pull request before merge
- At least 1 approval
- CI must pass before merge
**Currently:** Unknown state across 115 repos.

### M5. Add Security Scanning to All CI Pipelines
Add to standard CI template:
- `npm audit` / `yarn audit` for dependency vulnerabilities
- Secret scanning (GitLeaks or TruffleHog)
- SAST (Semgrep or CodeQL for TypeScript)

---

## INFRASTRUCTURE RISKS

| Risk | Severity | Detail |
|------|----------|--------|
| No staging environment | 🔴 Critical | Dev and prod share Supabase |
| GitLab CI quota | 🔴 Critical | ALIA microservices cannot deploy |
| Single JWT secret | 🔴 Critical | One breach = all products compromised |
| No secret rotation | 🔴 High | AWS keys unchanged since May 2026 |
| No rollback procedure | 🟡 Medium | CF has version history but no formal process |
| No observability on most Workers | 🟡 Medium | Blind production deployments |
| Branch protection missing | 🟡 Medium | Accidental force-pushes to main possible |
| raldtics naming collision | 🟢 Low | Confusing but not operational risk |

---

## GOVERNANCE RISKS

| Risk | Severity | Detail |
|------|----------|--------|
| No owner per repo | 🔴 High | 115 repos, 0 have documented owners in GitHub |
| 115 repos for 1 platform | 🟡 Medium | Creates cognitive overhead; target 85 |
| SDK fragmented across 8 repos | 🟡 Medium | Developer confusion, version drift |
| No ADRs | 🟡 Medium | Architecture decisions are tribal knowledge |
| No incident response playbook | 🟡 Medium | No documented response process |
| Dead repos not archived | 🟢 Low | 6 repos adding noise to org navigation |

---

## WHAT'S WORKING WELL

✅ Cloudflare Workers architecture — correct and scalable  
✅ HMAC-SHA256 JWT in rald-auth-core — secure and consistent  
✅ GitHub org secrets as single source of truth  
✅ Supabase for unified data layer  
✅ ALIA financial identity network (13 microservices) — well-architected  
✅ Event bus architecture — pub/sub with rald-event-bus  
✅ Audit logs in every workflow  
✅ payrald-ui → Cloudflare Pages with custom domain  
✅ rald-identity (profiles.rald.cloud) consolidating auth UI  
✅ Rate limiting in rald-notify  
✅ Notification center with push token management  

---

## RECOMMENDED SPRINT PLAN

| Sprint | Goal | Outcome |
|--------|------|---------|
| Sprint 0 (Today) | Fix all broken CI/CD | All core services deployable |
| Sprint 1 (Week 1) | Security hardening + staging | Isolated environments, secret rotation |
| Sprint 2 (Week 2) | SDK consolidation | 8 SDK repos → 1 |
| Sprint 3 (Week 3) | Observability | Sentry + structured logging live |
| Sprint 4 (Month 2) | Consolidation | 115 repos → 85, branch protection, ADRs |
| Sprint 5 (Month 3) | RALD READY | Score ≥ 80/100 across all dimensions |
