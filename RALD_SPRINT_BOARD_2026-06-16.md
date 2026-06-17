# RALD Platform — Master Sprint Board
**Generated:** June 16, 2026  
**Mission:** Transform RALD from independent products into a unified ecosystem  
**Total issues created:** 17 GitHub Issues across 9 repos

---

## HOW TO READ THIS BOARD

**P0** = Production broken right now. Fix today.  
**P1** = Blocks the sprint. Fix this week.  
**SPRINT** = Integration work. Deliver in phases.

Each card has: the GitHub Issue link, the exact file(s) to touch, the command to verify it's done.

---

## 🔴 WEEK 0 — P0 BLOCKERS (Fix before anything else)

### B-01 · rald-alia Docker builds — ALL 20 services failing
**Repo:** [rald-alia #6](https://github.com/Ostinato-Loop/rald-alia/issues/6)  
**Who:** DevOps  
**ETA:** 2 hours

| Step | Action |
|---|---|
| 1 | Create a PAT at `github.com/settings/tokens/new?scopes=write:packages` |
| 2 | Add secret `GHCR_TOKEN` at `github.com/organizations/Ostinato-Loop/settings/secrets/actions` |
| 3 | Update `.github/workflows/ci.yml` — add `docker/login-action@v3` with `registry: ghcr.io` before each build step |
| 4 | Push to main → watch all 20 Docker Build jobs turn green |

**File:** `.github/workflows/ci.yml` — all `Docker Build & Push (*)` jobs  
**Verify:** `gh run list --repo Ostinato-Loop/rald-alia --limit 1` → `conclusion: success`

---

### B-02 · SECURITY: Supabase anon key committed in GitLab
**Repo:** [rald-alia #7](https://github.com/Ostinato-Loop/rald-alia/issues/7)  
**Who:** Security lead  
**ETA:** 30 minutes — DO THIS FIRST

| Step | Action |
|---|---|
| 1 | `supabase.com/dashboard/project/onxdcikfttdmnhofsuwo/settings/api` → Generate new anon key |
| 2 | GitLab → sekanidev/loop-messenger-lvb → Repository → Cleanup → remove `.env` from history |
| 3 | Add `.env` to `.gitignore` in loop-messenger-lvb |
| 4 | Update `VITE_SUPABASE_PUBLISHABLE_KEY` in all CF Pages env settings (Lovable dashboard + Cloudflare) |
| 5 | Audit RLS on `payrald_wallets`, `payrald_transactions`, `payrald_payments` |

**Verify:** `grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" .` returns no results across all repos

---

### B-03 · Voucher 500 — `payrald_voucher_products` table empty
**Repo:** [payrald-core #2](https://github.com/Ostinato-Loop/payrald-core/issues/2)  
**Who:** Backend dev  
**ETA:** 1 hour

**Files to touch:**
- `src/routes/vouchers.ts` — fix error handling (empty table → 200 `[]` not 500)

**SQL to run** in Supabase Dashboard → SQL Editor:
```sql
INSERT INTO payrald_voucher_products (id, merchant_id, name, slug, category, min_amount, max_amount, fee_pct, is_active) VALUES
  (gen_random_uuid(), 'mtn',   'MTN Airtime',   'mtn-airtime',   'airtime',     50, 50000, 0.5, true),
  (gen_random_uuid(), 'airtel','Airtel Airtime', 'airtel-airtime','airtime',     50, 50000, 0.5, true),
  (gen_random_uuid(), 'glo',   'Glo Airtime',   'glo-airtime',   'airtime',     50, 50000, 0.5, true),
  (gen_random_uuid(), 'mtn',   'MTN Data',      'mtn-data',      'data',       100,100000, 1.0, true),
  (gen_random_uuid(), 'airtel','Airtel Data',   'airtel-data',   'data',       100,100000, 1.0, true),
  (gen_random_uuid(), 'ikedc', 'IKEDC Electricity','ikedc',      'electricity',500,500000, 1.5, true),
  (gen_random_uuid(), 'dstv',  'DStv',          'dstv',          'tv',        2000, 50000, 1.0, true),
  (gen_random_uuid(), 'gotv',  'GOtv',          'gotv',          'tv',        1000, 20000, 1.0, true)
ON CONFLICT (slug) DO NOTHING;
```

**Verify:** `curl https://pay.rald.cloud/v1/vouchers/products` → HTTP 200, `products` array length ≥ 8

---

### B-04 · Missing Supabase tables: otp_codes, user_devices, product_access
**Repo:** [payrald-core #1](https://github.com/Ostinato-Loop/payrald-core/issues/1)  
**Who:** Backend dev  
**ETA:** 2 hours

**SQL to run** in Supabase Dashboard → SQL Editor — full migration in the issue.

**Files to touch:**
- `src/routes/auth.ts` — OTP generate/verify routes that query `otp_codes`
- `src/middleware/auth.ts` — device binding check that queries `user_devices`

**Verify:** OTP login flow completes end-to-end without 500 errors

---

### B-05 · rald-routing CF Worker not deployed
**Repo:** [rald-routing #1](https://github.com/Ostinato-Loop/rald-routing/issues/1)  
**Who:** DevOps  
**ETA:** 1 hour (after B-01 and B-06 complete)  
**Depends on:** B-01 (ALIA Docker builds), B-06 (ALIA staging deployed)

```bash
# Once ALIA resolution-engine is running:
wrangler secret put RALD_JWT_SECRET
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put MACHINE_JWT_SECRET
wrangler secret put ALIA_RESOLUTION_ENGINE_URL
# ALIA_RESOLUTION_ENGINE_URL = https://api.alia.rald.cloud
```

**Verify:** `curl https://routing.rald.cloud/health` → 200 OK

---

## 🟠 WEEK 1 — P1 ISSUES (This week)

### B-06 · rald-alia: Add deployment workflow — 20 services, zero deployed
**Repo:** [rald-alia #8](https://github.com/Ostinato-Loop/rald-alia/issues/8)  
**Who:** DevOps + Backend  
**ETA:** 1 day  
**Depends on:** B-01

**File to create:** `.github/workflows/deploy-staging.yml`

```yaml
name: Deploy — Staging
on:
  workflow_run:
    workflows: ["RALD ALIA CI/CD"]
    types: [completed]
    branches: [main]
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx drizzle-kit push
        env:
          DATABASE_URL: ${{ secrets.ALIA_DATABASE_URL }}
  deploy:
    needs: migrate
    runs-on: ubuntu-latest
    permissions: { id-token: write, contents: read }
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_OIDC_ROLE_ARN }}
          aws-region: ${{ secrets.AWS_REGION }}
      - name: Force deploy all services
        run: |
          for SVC in alias-service fraud-service resolution-engine gateway routing-service \
            governance-service trust-service verification-service developer-service \
            institution-service consent-service audit-service directory-service \
            registry-service identity-service merchant-service notification-service \
            control-plane loop-voice; do
            aws ecs update-service --cluster rald-alia-staging --service $SVC --force-new-deployment
          done
```

**New org secrets needed:** `AWS_OIDC_ROLE_ARN`, `AWS_REGION`, `ALIA_DATABASE_URL`, `ALIA_KAFKA_BROKERS`, `ALIA_MACHINE_JWT_SECRET`

**Verify:** `curl https://staging.alia.rald.cloud/health` → 200 OK

---

### B-07 · payrald-ui-ux: CF Pages domain attachment keeps failing
**Repo:** [payrald-ui-ux #1](https://github.com/Ostinato-Loop/payrald-ui-ux/issues/1)  
**Who:** Frontend dev  
**ETA:** 2 hours

**File to fix:** `.github/workflows/fix-domain.yml`

Replace auto-detect logic with:
```yaml
- name: Attach custom domain (idempotent)
  env:
    CF_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CF_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    CF_PROJECT: payrald
    CF_DOMAIN: payrald.rald.cloud
  run: |
    EXISTING=$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
      "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$CF_PROJECT/domains" \
      | jq -r '.result[] | select(.name == env.CF_DOMAIN) | .name')
    [ "$EXISTING" = "$CF_DOMAIN" ] && echo "Already attached." && exit 0
    curl -sf -X POST -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$CF_PROJECT/domains" \
      -d "{\"name\":\"$CF_DOMAIN\"}" | jq .
```

**Verify:** Workflow shows `conclusion: success`, re-run is idempotent

---

### B-08 · sekani-core: Zero CI — AI orchestration layer never tested
**Repo:** [sekani-core #1](https://github.com/Ostinato-Loop/sekani-core/issues/1)  
**Who:** AI team  
**ETA:** 3 hours

**File to create:** `.github/workflows/ci.yml`
```yaml
name: CI
on: { push: { branches: [main] }, pull_request: { branches: [main] } }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm build
```

**Also create CI for:** `bbc-core` and `wizmac-core` (same pattern)

**Verify:** CI badge on README shows green

---

### B-09 · payrald-ui-ux: JWT in localStorage — XSS risk on live payment app
**Repo:** [payrald-ui-ux #2](https://github.com/Ostinato-Loop/payrald-ui-ux/issues/2)  
**Who:** Frontend dev  
**ETA:** 4 hours

**Files to touch:**
- `artifacts/payrald/src/lib/auth.tsx` — replace `localStorage.setItem('rald_token', ...)` with memory store
- `artifacts/api-server/src/routes/auth.ts` — set `rald_refresh` as httpOnly cookie on login
- `artifacts/payrald/src/lib/api.ts` — read from memory store instead of localStorage

```typescript
// artifacts/payrald/src/lib/auth.tsx
let _token: string | null = null;
export const tokenStore = {
  set: (t: string) => { _token = t; },
  get: () => _token,
  clear: () => { _token = null; },
};
```

**Verify:** `localStorage.getItem('rald_token')` returns `null` after login in browser console

---

### B-10 · payrald-api: Rate limiting KV namespace commented out
**Repo:** [payrald-api #1](https://github.com/Ostinato-Loop/payrald-api/issues/1)  
**Who:** Backend dev  
**ETA:** 3 hours

**Files to touch:**
- `wrangler.toml` — uncomment `[[kv_namespaces]]` block with real IDs
- `src/middleware/rateLimit.ts` — NEW (see issue for full code)
- `src/routes/auth.ts` — add 5 req/min on login, 3 req/min on OTP

```bash
# Create KV namespaces:
wrangler kv:namespace create RATE_LIMIT
wrangler kv:namespace create RATE_LIMIT --preview
# Copy IDs into wrangler.toml
```

**Verify:** 6th login attempt from same IP within 60s returns HTTP 429

---

### B-11 · rald-control-center: CORS wildcard on admin API
**Repo:** [rald-control-center #1](https://github.com/Ostinato-Loop/rald-control-center/issues/1)  
**Who:** Backend dev  
**ETA:** 1 hour

**File:** `packages/cc-api/src/index.ts` (or equivalent app entry)

```typescript
// Replace: app.use(cors())
// With:
app.use(cors({
  origin: (origin) => {
    const ALLOWED = new Set(['https://admin.rald.cloud', 'https://control.rald.cloud',
      'http://localhost:5173', 'http://localhost:3000']);
    return ALLOWED.has(origin ?? '') ? origin : null;
  },
  credentials: true,
}));
```

**Verify:** `curl -H "Origin: https://evil.com" -X OPTIONS https://api.control.rald.cloud` → no `Access-Control-Allow-Origin` header

---

## 🔵 MASTER SPRINT — Integration Phases

> These are the 8 phases from the RALD Platform Integration sprint document. Each builds on the previous. Start Phase 1 in parallel with P0 fixes.

---

### PHASE 1 · Universal RALD Identity
**Repo:** [rald-control-center #2](https://github.com/Ostinato-Loop/rald-control-center/issues/2)  
**Also affects:** `rald-sdk-react`, `payrald-core`, `rald-inbox`, `loop-crm`, `loop-messenger-ui-ux`, `rald-identity`, `payrald-ui-ux`, `elimu`

**Every user receives on signup:**
```
RALD UUID:   rld_8dj39sj29
Username:    boyd
RALD Email:  boyd@rald.cloud
ALIA Handle: boyd@rald
Wallet ID:   wallet_rld_8dj39sj29
Trust Score: 0
KYC Tier:    1
```

**Key deliverable:** Unified `rald_users` Supabase table + `useRALDIdentity()` hook in `rald-sdk-react`

**New Supabase table:**
```sql
CREATE TABLE rald_users (
  id            text PRIMARY KEY,  -- rld_xxxxxxxx
  username      text UNIQUE NOT NULL,
  email         text UNIQUE NOT NULL,
  rald_email    text UNIQUE,       -- boyd@rald.cloud
  alia_handle   text UNIQUE,       -- boyd@rald
  wallet_id     text UNIQUE,
  trust_score   int DEFAULT 0,
  kyc_tier      int DEFAULT 1,
  activated_products jsonb DEFAULT '[]',
  created_at    timestamptz DEFAULT now()
);
```

**rald-auth signup provisioning chain:**
```
POST auth.rald.cloud/signup
  → CREATE rald_users record
  → POST rald-alia/aliases (type: username, value: boyd)
  → POST payrald-wallet/v1/provision
  → POST rald-mail/v1/mailbox/provision (boyd@rald.cloud)
  → EMIT identity.created → Event Bus
```

---

### PHASE 2 · ALIA Universal Routing
**Repo:** [rald-alia #9](https://github.com/Ostinato-Loop/rald-alia/issues/9)  
**Depends on:** B-01, B-06, B-05

**Alias types to support:**
| Alias | Resolves to |
|---|---|
| `boyd@rald` | Personal wallet |
| `merchantstore@rald` | Merchant wallet |
| `lagosacademy@rald` | School wallet |
| `dispatch@rald` | Dispatch wallet |
| `boyd@rald.cloud` | RALD email identity |
| `+2348012345678` | RALD identity |

**New `rald-sdk-react` exports:**
```typescript
export function useALIAResolve(alias: string): { identity, loading, error };
export async function resolveAlias(alias: string): Promise<ResolvedIdentity>;
export async function previewAlias(alias: string): Promise<AliasPreview>;
```

---

### PHASE 3 · PayRald Wallet Auto-Provisioning
**Repo:** [payrald-core #3](https://github.com/Ostinato-Loop/payrald-core/issues/3)  
**Also affects:** `payrald-wallet`, `rald-sdk-payments`

**Auto-provision on `identity.created` event:**
```typescript
app.post('/events/identity.created', eventBusAuth(), async (c) => {
  const { userId } = await c.req.json();
  await provisionWallet(c.env, userId);  // idempotent
  return c.json({ ok: true });
});
```

**Wallet ID convention:** `wallet_${raldUUID}` (always mirrors identity)

**New `rald-sdk-payments` exports:**
```typescript
export function useWallet(): { balance, transactions, transfer, pay, withdraw };
export function useVouchers(): { products, purchase };
```

---

### PHASE 4 · RALD Mail Provisioning
**Repos:** `rald-mail-ui-ux` (needs backend), `rald-sdk-react`

**Mail domain types:**
```
Personal:    boyd@rald.cloud
Business:    admin@business.rald.cloud
School:      student@lagosacademy.elimu.africa
University:  student@university.edu.africa
Government:  official@agency.gov.rald.cloud
```

**API to build:** `POST mail-api.rald.cloud/v1/mailbox/provision`  
**Auto-triggered by:** `identity.created`, `school.created`, `org.created` events

---

### PHASE 5 · Elimu Integration — School auto-provisioning
**Repo:** [elimu #1](https://github.com/Ostinato-Loop/elimu/issues/1)  
**Also affects:** `payrald-core`, `rald-routing`, `rald-alia`

**School registration auto-provisions:**
```
Name: Lagos Academy    Slug: lagosacademy
→ ALIA handle:         lagosacademy@rald
→ Wallet:              wallet_rld_<schoolId>
→ Mail domain:         lagosacademy.elimu.africa
→ Admin mailbox:       admin@lagosacademy.elimu.africa
→ Messenger workspace: lagosacademy@rald group chat
→ Event emitted:       school.created
```

**Student lifecycle:**
```
Enroll → boyd@lagosacademy student account
Graduate → upgrades to personal boyd@rald account
```

**Fee payment via alias:**
```
POST pay.rald.cloud/v1/payments
{ to_alias: 'lagosacademy@rald', amount: 50000, purpose: 'school_fee' }
```

**New Elimu table:** `school_integrations (school_id, alia_handle, wallet_id, mail_domain, messenger_ws_id)`

---

### PHASE 6 · Messenger Integration — RALD Identity + inline payments
**Repo:** [loop-messenger-ui-ux #1](https://github.com/Ostinato-Loop/loop-messenger-ui-ux/issues/1)  
**Also affects:** `loop-messenger-private` (GitLab), `rald-sdk-react`, `payrald-core`

**Replace Lovable auth stub:**
```typescript
// src/lib/auth.tsx
import { useRALDAuth } from '@rald/sdk-react';
// No separate users table. No local auth.
```

**Add PaymentBar to chat thread:**
```typescript
// src/routes/chat.$chatId.tsx
<PaymentBar
  recipientAlias={chat.participantAlias}
  onSend={(amount) => sendToAlias(recipientAlias, amount)}
  onRequest={(amount) => requestFromAlias(recipientAlias, amount)}
/>
```

**Payment message type in conversation:**
```typescript
{ type: 'payment', direction: 'sent', amount: 5000, currency: 'NGN', reference: 'txn_xxx' }
```

**Chat types:** User DM · Business chat · School chat · Merchant chat (all via ALIA)

---

### PHASE 7 · RALD Event Bus
**Repo:** [rald-control-center #3](https://github.com/Ostinato-Loop/rald-control-center/issues/3)  
**Affects:** ALL repos

**Core event table (Supabase — quick start):**
```sql
CREATE TABLE rald_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text NOT NULL,
  producer   text NOT NULL,
  payload    jsonb NOT NULL DEFAULT '{}',
  processed  boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_rald_events_type ON rald_events(type);
```

**Event catalog:**
| Event | Producer | Key Consumers |
|---|---|---|
| `identity.created` | rald-auth | payrald-wallet, rald-alia, rald-mail, loop-messenger |
| `wallet.created` | payrald-wallet | payrald-core, rald-control-center |
| `school.created` | elimu | rald-alia, rald-mail, payrald-wallet, loop-messenger |
| `transfer.completed` | payrald-core | loop-messenger (payment bubble), raldtics |
| `fraud.detected` | rald-alia | payrald-wallet (freeze), rald-control-center |
| `alias.created` | rald-alia | rald-control-center, raldtics |
| `kyc.approved` | payrald-core | rald-alia (upgrade tier), payrald-wallet (raise limits) |
| `message.sent` | loop-messenger | rald-inbox (unread count), raldtics |

**Migrate to Kafka (rald-alia already has `packages/kafka/`) once Supabase Realtime hits limits.**

---

### PHASE 8 · Control Center — Unified Command Plane
**Repo:** [rald-control-center #4](https://github.com/Ostinato-Loop/rald-control-center/issues/4)

**New management modules:**

| Module | Key Operations |
|---|---|
| Identity Management | Search users, adjust trust score, suspend/reactivate |
| ALIA Network | View aliases, resolve disputes, view fraud events |
| Wallet & Payments | Freeze wallets, view transactions, manual credit/debit (audited) |
| School Management | View schools, provisioning status, wallet balances |
| Event Stream | Live SSE feed of all events, filter, replay failed |
| Mail Domains | View/add/remove domains, mailbox counts |
| Feature Flags | Per-user, per-org toggles, gradual rollout % |

**New CC-API routes:**
```
GET  /api/users?search=boyd        → search RALD users
GET  /api/users/:raldId            → full user profile
PATCH /api/users/:raldId/suspend   → suspend (logged)
GET  /api/aliases?status=active    → ALIA alias list
PATCH /api/wallets/:id/freeze      → freeze wallet (logged)
GET  /api/events/stream            → SSE live event feed
GET  /api/schools                  → Elimu school list
```

---

## SPRINT DEPENDENCY GRAPH

```
TODAY ──────────────────────────────────────────────────────────► FUTURE

[B-02 Security]  ────────────────────────────────────────────► done

[B-03 Vouchers]  ────────────────────────────────────────────► done
[B-04 DB Tables] ────────────────────────────────────────────► done

[B-01 Docker]    ──► [B-06 Deploy] ──► [B-05 Routing]
                           │
                           ▼
                    [Phase 2: ALIA]  ──► [Phase 3: Wallet] ──► [Phase 5: Elimu]
                                                 │
                    [Phase 1: Identity] ──────────┤
                                                 │
                    [Phase 7: Event Bus] ◄────────┘
                           │
                    [Phase 6: Messenger]
                    [Phase 4: Mail]
                    [Phase 8: Control Center]

[B-07 Domain]    ──► done (independent)
[B-08 CI]        ──► done (independent)
[B-09 JWT]       ──► done (independent)
[B-10 RateLimit] ──► done (independent)
[B-11 CORS]      ──► done (independent)
```

---

## ISSUE REGISTRY (all 17 GitHub Issues)

| ID | Title | Repo | Issue Link | Priority |
|---|---|---|---|---|
| B-01 | Fix Docker Build & Push — 20 services failing | rald-alia | [#6](https://github.com/Ostinato-Loop/rald-alia/issues/6) | 🔴 P0 |
| B-02 | SECURITY: Rotate exposed Supabase anon key | rald-alia | [#7](https://github.com/Ostinato-Loop/rald-alia/issues/7) | 🔴 P0 |
| B-03 | Fix /v1/vouchers/products → 500 | payrald-core | [#2](https://github.com/Ostinato-Loop/payrald-core/issues/2) | 🔴 P0 |
| B-04 | Create missing Supabase tables | payrald-core | [#1](https://github.com/Ostinato-Loop/payrald-core/issues/1) | 🔴 P0 |
| B-05 | rald-routing CF Worker not deployed | rald-routing | [#1](https://github.com/Ostinato-Loop/rald-routing/issues/1) | 🔴 P0 |
| B-06 | Add rald-alia deployment workflow | rald-alia | [#8](https://github.com/Ostinato-Loop/rald-alia/issues/8) | 🟠 P1 |
| B-07 | Fix CF Pages domain attachment | payrald-ui-ux | [#1](https://github.com/Ostinato-Loop/payrald-ui-ux/issues/1) | 🟠 P1 |
| B-08 | Add CI to sekani-core (+ bbc-core, wizmac-core) | sekani-core | [#1](https://github.com/Ostinato-Loop/sekani-core/issues/1) | 🟠 P1 |
| B-09 | Move JWT from localStorage | payrald-ui-ux | [#2](https://github.com/Ostinato-Loop/payrald-ui-ux/issues/2) | 🟠 P1 |
| B-10 | Enable KV rate limiting on auth endpoints | payrald-api | [#1](https://github.com/Ostinato-Loop/payrald-api/issues/1) | 🟠 P1 |
| B-11 | Restrict CORS on Control Center API | rald-control-center | [#1](https://github.com/Ostinato-Loop/rald-control-center/issues/1) | 🟠 P1 |
| S-P1 | Universal RALD Identity Layer | rald-control-center | [#2](https://github.com/Ostinato-Loop/rald-control-center/issues/2) | 🔵 Sprint |
| S-P2 | ALIA Universal Routing | rald-alia | [#9](https://github.com/Ostinato-Loop/rald-alia/issues/9) | 🔵 Sprint |
| S-P3 | PayRald Wallet Auto-Provisioning | payrald-core | [#3](https://github.com/Ostinato-Loop/payrald-core/issues/3) | 🔵 Sprint |
| S-P5 | Elimu Integration | elimu | [#1](https://github.com/Ostinato-Loop/elimu/issues/1) | 🔵 Sprint |
| S-P6 | Messenger Integration | loop-messenger-ui-ux | [#1](https://github.com/Ostinato-Loop/loop-messenger-ui-ux/issues/1) | 🔵 Sprint |
| S-P7 | RALD Event Bus | rald-control-center | [#3](https://github.com/Ostinato-Loop/rald-control-center/issues/3) | 🔵 Sprint |
| S-P8 | Control Center Command Plane | rald-control-center | [#4](https://github.com/Ostinato-Loop/rald-control-center/issues/4) | 🔵 Sprint |

---

## SUCCESS METRIC

> A school registers once and automatically receives — school profile, RALD ALIA handle (`lagosacademy@rald`), school wallet, mail domain (`lagosacademy.elimu.africa`), student mailboxes, parent accounts, and a Messenger workspace — **without manual intervention**.

This is achieved when Phases 1 → 7 are complete.

---

*Sprint board generated June 16, 2026. All GitHub Issues live. Start with B-02 (security) and B-03 (vouchers) — both can be done in under an hour with no code changes.*
