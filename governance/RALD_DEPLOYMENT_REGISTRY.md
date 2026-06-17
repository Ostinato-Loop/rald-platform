# RALD Deployment Registry
**Generated:** 2026-06-17 | **Phase 4 — Deployment Governance**

---

## PRODUCTION DEPLOYMENTS

### Cloudflare Workers (Edge APIs)

| Service | Repo | Domain | Status | Secrets Used |
|---------|------|--------|--------|-------------|
| RALD OS API Gateway | rald-os | api.rald.cloud | ✅ Active | CF_API_TOKEN, SUPABASE_*, RALD_JWT_SECRET |
| RALD Auth Core | rald-auth-core | auth.rald.cloud | ✅ Active | CF_API_TOKEN, RALD_JWT_SECRET, SUPABASE_* |
| RALD Config | rald-config | config.rald.cloud | ✅ Active | CF_API_TOKEN |
| RALD Routing | rald-routing | routing.rald.cloud | ✅ Active | CF_API_TOKEN, MACHINE_JWT_SECRET |
| RALD Notify | rald-notify | notify.rald.cloud | ✅ Active | CF_API_TOKEN, SUPABASE_* |
| RALD Event Bus | rald-event-bus | events.rald.cloud | ✅ Active | CF_API_TOKEN |
| RALD Identity | rald-identity | profiles.rald.cloud | ✅ Active | CF_API_TOKEN, SUPABASE_* |

### Cloudflare Pages (Static / SSR)

| App | Repo | Domain | Status |
|-----|------|--------|--------|
| PayRald UI | payrald-ui-ux | payrald-ui.pages.dev | ✅ Active |
| RALD Admin | rald-admin | admin.rald.cloud | 🔄 Deploying |
| RALD Control Center | rald-control-center | admin.rald.cloud | ✅ Active |
| ALIA UI | alia-ui-ux | alia.rald.cloud | ✅ Active |
| RALD Cloud Web | rald-cloud-web | rald.cloud | ✅ Active |
| RALD Auth UI | rald-auth-ui | (legacy domain) | ⚠️ Deprecated → profiles.rald.cloud |
| Loop Messenger UI | loop-messenger-ui-ux | messenger.rald.cloud | ✅ Active |
| GitRald UI | gitrald-ui-ux | git.rald.cloud | ✅ Active |
| RALD Mail UI | rald-mail-ui-ux | mail.rald.cloud | ✅ Active |
| Elimu UI | rald-elimu-ui-ux | elimu.africa | ✅ Active |
| RALD Trust | rald-trust | trust.rald.cloud | ✅ Active |
| RALD Status | rald-status | status.rald.cloud | ✅ Active |
| RALD Docs | rald-docs | docs.rald.cloud | ✅ Active |
| RALD Design | rald-design | design.rald.cloud | ✅ Active |

### AWS (Amazon Web Services)

| Service | Repo | Stack | Status | Region |
|---------|------|-------|--------|--------|
| SES Email Identity | rald-infra | CloudFormation | ✅ Active | AWS_REGION |
| S3 + CloudFront CDN | rald-infra | CloudFormation | ✅ Active | AWS_REGION |
| Media Storage | rald-media | S3 + CloudFront | ✅ Active | AWS_REGION |

### GitLab Container Registry

| Service | Repo | Image | Status |
|---------|------|-------|--------|
| ALIA Identity Service | rald-alia (GitLab) | registry.gitlab.com/sekanidev/rald-alia/identity-service | 🔄 CI Fixing |
| ALIA Alias Service | rald-alia (GitLab) | registry.gitlab.com/sekanidev/rald-alia/alias-service | 🔄 CI Fixing |
| ALIA Resolution Engine | rald-alia (GitLab) | registry.gitlab.com/sekanidev/rald-alia/resolution-engine | 🔄 CI Fixing |
| ALIA Routing Service | rald-alia (GitLab) | registry.gitlab.com/sekanidev/rald-alia/routing-service | 🔄 CI Fixing |
| ALIA Fraud Service | rald-alia (GitLab) | registry.gitlab.com/sekanidev/rald-alia/fraud-service | 🔄 CI Fixing |
| ALIA Audit Service | rald-alia (GitLab) | registry.gitlab.com/sekanidev/rald-alia/audit-service | 🔄 CI Fixing |
| ALIA Notification Service | rald-alia (GitLab) | registry.gitlab.com/sekanidev/rald-alia/notification-service | 🔄 CI Fixing |
| ALIA Governance Service | rald-alia (GitLab) | registry.gitlab.com/sekanidev/rald-alia/governance-service | 🔄 CI Fixing |
| ALIA Consent Service | rald-alia (GitLab) | registry.gitlab.com/sekanidev/rald-alia/consent-service | 🔄 CI Fixing |
| ALIA Trust Service | rald-alia (GitLab) | registry.gitlab.com/sekanidev/rald-alia/trust-service | 🔄 CI Fixing |
| ALIA Merchant Service | rald-alia (GitLab) | registry.gitlab.com/sekanidev/rald-alia/merchant-service | 🔄 CI Fixing |
| ALIA Verification Service | rald-alia (GitLab) | registry.gitlab.com/sekanidev/rald-alia/verification-service | 🔄 CI Fixing |
| ALIA Directory Service | rald-alia (GitLab) | registry.gitlab.com/sekanidev/rald-alia/directory-service | 🔄 CI Fixing |

---

## DEAD / ORPHAN DEPLOYMENTS

| Issue | Detail | Action |
|-------|--------|--------|
| rald-auth-ui CF Pages | Served as full UI — now a redirect shell only | Keep as permanent redirect service |
| rald-infrastructure (Shell) | Old V1 infra scripts, no active deployments | Archive |
| payrald (old monolith) | No active CF deployment found | Archive repo |

---

## ENVIRONMENT MATRIX

| Environment | Access | Supabase | Cloudflare | AWS |
|-------------|--------|----------|-----------|-----|
| Production | api.rald.cloud | onxdcikfttdmnhofsuwo.supabase.co | Account d5a1cd03... | AWS_REGION |
| Staging | — | — | — | — |
| Development | localhost / wrangler dev | Same Supabase (❗ risk) | wrangler preview | — |

> ⚠️ **RISK:** Development and Production share the same Supabase project. A dedicated staging Supabase project is required before any destructive schema migrations.

---

## DEPLOYMENT METHOD STANDARDS

| Method | Repos Using It | Standard? |
|--------|---------------|-----------|
| GitHub Actions → Cloudflare Workers (wrangler deploy) | rald-os, rald-auth-core, rald-config, rald-routing, rald-notify, rald-event-bus | ✅ Standard |
| GitHub Actions → Cloudflare Pages | payrald-ui-ux, rald-admin, rald-control-center | ✅ Standard |
| GitLab CI → Docker → GitLab Registry | rald-alia | ✅ Standard |
| GitHub Actions → AWS CloudFormation | rald-infra | ✅ Standard |
| Manual / Unknown | Most repos with null language | ⚠️ Needs CI setup |
