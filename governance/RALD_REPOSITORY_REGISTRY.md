# RALD Repository Registry
**Generated:** 2026-06-17 | **Total Repos:** 115 | **Org:** Ostinato-Loop (GitHub) + sekanidev (GitLab)
**Classification:** Active | Deprecated | Merge Candidate | Archive Candidate

---

## LAYER 1 — RALD IDENTITY (auth.rald.cloud / profiles.rald.cloud)

| Repo | Status | Language | URL | Notes |
|------|--------|----------|-----|-------|
| rald-auth-core | ✅ Active | TypeScript | auth.rald.cloud | HMAC-SHA256 JWT auth, Cloudflare Worker |
| rald-identity | ✅ Active | TypeScript | profiles.rald.cloud | Unified customer profiles, provisioning |
| rald-auth-ui | ⚠️ Deprecated | HTML | — | Redirect shell → profiles.rald.cloud |
| rald-auth-server | 🗄 Archive | — | — | Old auth server, superseded by auth-core |
| rald-auth | 🗄 Archive | — | — | Old SSO/OAuth, superseded |
| rald-auth-sdk | ⚠️ Merge Candidate | TypeScript | — | Merge into rald-sdk |
| rald-infrastructure | 🗄 Archive | Shell | — | V1 auth infrastructure, superseded |

---

## LAYER 2 — ALIA NETWORK (alia.rald.cloud / routing.rald.cloud)

| Repo | Status | Language | URL | Notes |
|------|--------|----------|-----|-------|
| rald-alia | ✅ Active | TypeScript | alia.rald.cloud (API) | Financial identity network — 13 microservices (GitLab) |
| alia-ui-ux | ✅ Active | TypeScript | alia.rald.cloud | ALIA frontend |
| rald-routing | ✅ Active | TypeScript | routing.rald.cloud | ALIA routing engine, CF Worker |
| rald-api-core | ⚠️ Merge Candidate | TypeScript | — | Shared API gateway — merge into rald-os |
| rald-trust | ✅ Active | TypeScript | trust.rald.cloud | Public trust center |
| rald-fraud | ⚠️ Merge Candidate | — | — | Merge into rald-alia fraud-service |
| rald-compliance | ⚠️ Merge Candidate | — | — | Merge into rald-alia governance-service |

---

## LAYER 3 — WALLET & PAYMENTS (payrald.io)

| Repo | Status | Language | URL | Notes |
|------|--------|----------|-----|-------|
| payrald-ui-ux | ✅ Active | TypeScript | payrald-ui.pages.dev | Main PayRald UI (this repo) |
| payrald-core | ✅ Active | TypeScript | — | Core payment engine |
| payrald-api | ⚠️ Merge Candidate | TypeScript | — | Merge into payrald-core |
| payrald-wallet | ✅ Active | TypeScript | — | Wallet & balance |
| payrald-checkout | ✅ Active | TypeScript | — | Checkout SDK |
| payrald-merchant | ✅ Active | TypeScript | — | Merchant onboarding |
| payrald-cards | ✅ Active | TypeScript | — | Virtual cards |
| payrald-risk | ✅ Active | TypeScript | — | Fraud & risk engine |
| payrald-settlements | ✅ Active | TypeScript | — | Settlements & reconciliation |
| payrald-your-digital-wallet | ⚠️ Merge Candidate | TypeScript | — | Merge into payrald-wallet |
| payrald | 🗄 Archive Candidate | JavaScript | — | Old monolith, superseded by payrald-* repos |
| payrald-admin | ⚠️ Merge Candidate | — | — | Merge into rald-admin |
| rald-sdk-payments | ⚠️ Merge Candidate | TypeScript | — | Merge into rald-sdk |
| rald-billing | ✅ Active | — | — | Subscriptions & invoicing |

---

## LAYER 4 — COMMUNICATION

### Mail
| Repo | Status | Language | URL | Notes |
|------|--------|----------|-----|-------|
| rald-mail-ui-ux | ✅ Active | TypeScript | mail.rald.cloud | Mail client UI |
| rald-infra | ✅ Active | — | — | AWS SES + CloudFront CDN |
| rald-dispatch-ui-ux | ✅ Active | TypeScript | — | Dispatch/logistics UI |

### Messenger (Loop)
| Repo | Status | Language | URL | Notes |
|------|--------|----------|-----|-------|
| messenger | ✅ Active | TypeScript | — | Loop Messenger platform |
| loop-messenger-ui-ux | ✅ Active | TypeScript | — | Messenger frontend |
| rald-realtime | ✅ Active | TypeScript | — | WebSockets & SSE |
| rald-inbox | ✅ Active | TypeScript | inbox.rald.cloud | Unified inbox |
| loop-voice | ✅ Active | — | — | SIP & comms gateway |

---

## LAYER 5 — VERTICAL PRODUCTS

### Elimu (Education)
| Repo | Status | Language | URL | Notes |
|------|--------|----------|-----|-------|
| elimu | ✅ Active | TypeScript | elimu.africa | School Management ERP |
| rald-elimu-ui-ux | ✅ Active | TypeScript | — | Elimu frontend |

### Loop (Social / Commerce)
| Repo | Status | Language | URL | Notes |
|------|--------|----------|-----|-------|
| loop | ✅ Active | TypeScript | — | Social audio platform |
| loop-core | ✅ Active | TypeScript | — | Loop business core |
| loop-mobile | ✅ Active | TypeScript | — | iOS/Android (Expo) |
| loop-admin | ✅ Active | — | — | Loop admin dashboard |
| loop-storefronts | ✅ Active | — | — | Hosted storefronts |
| loop-domains | ✅ Active | — | — | Hosted domains & email |
| loop-logistics | ✅ Active | — | — | Loop logistics |
| loop-dispatch | ✅ Active | — | — | Nigerian last-mile delivery |
| loop-crm | ✅ Active | TypeScript | — | CRM & customer management |
| loop-audio-ui-ux | ✅ Active | TypeScript | — | Loop audio UI |
| loop-business | ✅ Active | — | — | Merchant storefront platform |
| loop-business-8cbd0eb1 | 🗄 Archive | TypeScript | — | Stale fork/clone — archive |
| loop-meta-cloud | ✅ Active | — | — | Meta cloud infrastructure |
| rald-loop-business | ⚠️ Merge Candidate | TypeScript | — | Merge into loop-business |
| loop-admin | ✅ Active | — | — | Admin dashboard |

### GitRald (CI/CD)
| Repo | Status | Language | URL | Notes |
|------|--------|----------|-----|-------|
| gitrald-core | ✅ Active | — | git.rald.cloud | CI/CD orchestration core |
| gitrald-ui-ux | ✅ Active | TypeScript | git.rald.cloud | GitRald frontend |
| gitrald-ai | ✅ Active | — | — | AI agent for CI |
| gitrald-runner | ✅ Active | — | — | Workflow runner |
| gitrald-security | ✅ Active | — | — | Secret scanning |
| gitrald-observability | ✅ Active | — | — | Telemetry |
| gitrald-deploy | ✅ Active | — | — | Deploy engine |
| gitrald-monitor | ✅ Active | — | — | Deployment monitor |
| gitrald-memory | ✅ Active | — | — | AI memory |

### DunaRald (Commerce Discovery)
| Repo | Status | Language | URL | Notes |
|------|--------|----------|-----|-------|
| dunarald | ✅ Active | — | — | African-first discovery commerce |

---

## PLATFORM INFRASTRUCTURE

| Repo | Status | Language | URL | Notes |
|------|--------|----------|-----|-------|
| rald-os | ✅ Active | TypeScript | api.rald.cloud | Ecosystem API gateway (CF Worker) |
| rald-event-bus | ✅ Active | TypeScript | events.rald.cloud | NATS/pubsub event bus |
| rald-control-center | ✅ Active | TypeScript | admin.rald.cloud | Unified admin command plane |
| rald-admin | ✅ Active | TypeScript | admin.rald.cloud | RALDTICS executive dashboard |
| rald-platform | ✅ Active | TypeScript | — | Platform monorepo |
| rald-config | ✅ Active | TypeScript | — | Feature flags & env config |
| rald-notify | ✅ Active | TypeScript | notify.rald.cloud | SMS, email, push, in-app |
| rald-observability | ✅ Active | — | — | Logging, metrics, Sentry |
| rald-status | ✅ Active | TypeScript | status.rald.cloud | Public status page |
| rald-docs | ✅ Active | TypeScript | docs.rald.cloud | Developer documentation |
| rald-dev-console | ✅ Active | TypeScript | console.rald.cloud | Developer portal |
| rald-console | ⚠️ Merge Candidate | — | — | Merge into rald-dev-console |
| rald-workflows | ✅ Active | — | — | Async job orchestration |
| rald-data-core | ✅ Active | — | — | Event streaming & data pipeline |
| rald-media | ✅ Active | — | — | Media storage CDN |
| rald-search | ✅ Active | TypeScript | search.rald.cloud | Search service |
| rald-realtime | ✅ Active | TypeScript | — | WebSockets & SSE |
| rald-events | ⚠️ Merge Candidate | — | — | Merge into rald-event-bus |
| rald-infra | ✅ Active | — | — | AWS infrastructure |
| rald-infrastructure | 🗄 Archive | Shell | — | V1 infra, superseded |

---

## SDKs

| Repo | Status | Language | Notes |
|------|--------|----------|-------|
| rald-sdk | ✅ Active | TypeScript | Primary SDK — @rald/sdk |
| rald-sdk-react | ✅ Active | TypeScript | React hooks SDK |
| rald-sdk-react-native | ✅ Active | — | React Native SDK |
| rald-sdk-auth | ⚠️ Merge Candidate | TypeScript | Merge into rald-sdk |
| rald-sdk-messaging | ⚠️ Merge Candidate | — | Merge into rald-sdk |
| rald-sdk-payments | ⚠️ Merge Candidate | TypeScript | Merge into rald-sdk |
| rald-sdk-nextjs | ✅ Active | — | Next.js SDK |
| rald-sdk-logistics | ✅ Active | — | Logistics SDK |
| rald-shared-sdk | ⚠️ Merge Candidate | — | Merge into rald-sdk |
| rald-auth-sdk | ⚠️ Merge Candidate | TypeScript | Merge into rald-sdk |

---

## AI SYSTEMS

| Repo | Status | Language | Notes |
|------|--------|----------|-------|
| rald-ai | ✅ Active | TypeScript | AI APIs, moderation, recommendations |
| rald-ai-ui-ux | ✅ Active | TypeScript | AI UI |
| rald-ai-memory | ✅ Active | — | AI memory & agent context |
| sekani-core | ✅ Active | TypeScript | AI orchestration layer (voice-first) |
| wizmac-core | ✅ Active | TypeScript | Permanent knowledge graph |
| bbc-core | ✅ Active | TypeScript | Linguistic/cultural framework |

---

## RALDTICS (Analytics)

| Repo | Status | Language | Notes |
|------|--------|----------|-------|
| raldtics | ⚠️ Merge Candidate | — | Old logistics repo, name collision |
| raldtics-core | ✅ Active | — | Analytics core |
| raldtics-events | ✅ Active | — | Event tracking |
| raldtics-growth | ✅ Active | — | Growth analytics |
| raldtics-ai | ✅ Active | — | AI summaries & insights |
| raldtics-insights | ✅ Active | — | Merchant intelligence |

---

## DESIGN & BRAND

| Repo | Status | Language | Notes |
|------|--------|----------|-------|
| rald-design-system | ✅ Active | CSS | Unified component library |
| rald-design | ✅ Active | TypeScript | design.rald.cloud |
| rald-cloud-web | ✅ Active | TypeScript | rald.cloud marketing site |

---

## SUPPORT & GROWTH

| Repo | Status | Language | Notes |
|------|--------|----------|-------|
| rald-support | ✅ Active | — | Help desk & ticket management |
| rald-growth | ✅ Active | — | Referrals & growth engine |
| rald-i18n | ✅ Active | — | Internationalisation layer |
| rald-connect | ✅ Active | PHP | WordPress plugin |
| rald-mobile-core | ✅ Active | — | React Native shared foundation |
| rald-memories-ui-ux | ✅ Active | TypeScript | Memories UI |
| rald-app-ui-ux | ✅ Active | TypeScript | App UI |
| rald-cinder-ui-ux | ✅ Active | TypeScript | Cinder UI |
| rald-pro-ui-ux-v1 | ⚠️ Merge Candidate | TypeScript | Superseded by rald-app-ui-ux |
| rald-tv-ui-ux | ✅ Active | TypeScript | TV UI |
| waiting-room | 🗄 Archive | TypeScript | No description, likely stale |
| rald | 🗄 Archive | TypeScript | Unnamed root repo — archive |
| rald-secrets | ✅ Active | — | Secure key rotation |

---

## SUMMARY

| Category | Count |
|----------|-------|
| ✅ Active | 82 |
| ⚠️ Deprecated (keep as redirect) | 2 |
| ⚠️ Merge Candidate | 16 |
| 🗄 Archive Candidate | 6 |
| **Total** | **115** |

> **Governance Rule:** Every repo must have an owner, a purpose, and a deployment target. No orphan repos.
