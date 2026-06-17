# RALD Standard Pipeline Templates
**Generated:** 2026-06-17 | **Phase 3 — Workflow Consolidation**

---

## THE 4 STANDARD RALD PIPELINES

Every repo must use ONLY these 4 pipelines. No custom one-offs.

---

### Pipeline 1: CI (ci.yml)
**Trigger:** push + pull_request to main  
**Purpose:** Validate every commit passes typecheck and build  
**Used by:** ALL repos with TypeScript

```yaml
name: CI
on:
  push:         { branches: [main] }
  pull_request: { branches: [main] }
  workflow_dispatch:

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22" }
      - run: yarn install --ignore-scripts --non-interactive
      - run: yarn run check
```

---

### Pipeline 2: Deploy — Cloudflare Worker (deploy-worker.yml)
**Trigger:** push to main  
**Purpose:** Deploy Cloudflare Worker services  
**Used by:** rald-os, rald-auth-core, rald-config, rald-routing, rald-notify, rald-event-bus, rald-identity

```yaml
name: Deploy Worker
on:
  push: { branches: [main] }
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22" }
      - run: yarn install --ignore-scripts --non-interactive
      - run: yarn run check
      - run: yarn dlx wrangler@3 deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      - if: always()
        run: echo "AUDIT service=$SERVICE commit=${{ github.sha }} actor=${{ github.actor }} ts=$(date -u +%Y-%m-%dT%H:%M:%SZ) status=${{ job.status }}"
```

---

### Pipeline 3: Deploy — Cloudflare Pages (deploy-pages.yml)
**Trigger:** push to main  
**Purpose:** Deploy static/SSR frontends  
**Used by:** payrald-ui-ux, rald-admin, alia-ui-ux, rald-cloud-web

```yaml
name: Deploy Pages
on:
  push: { branches: [main] }
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22" }
      - run: yarn install --non-interactive
      - run: yarn run build
      - run: yarn dlx wrangler@3 pages deploy dist --project-name=$PROJECT_NAME --branch=main
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      - if: always()
        run: echo "AUDIT service=$SERVICE commit=${{ github.sha }} actor=${{ github.actor }} ts=$(date -u +%Y-%m-%dT%H:%M:%SZ) status=${{ job.status }}"
```

---

### Pipeline 4: Security Scan (security.yml)
**Trigger:** push to main + weekly schedule  
**Purpose:** Dependency audit + secret scanning  
**Used by:** ALL repos

```yaml
name: Security Scan
on:
  push: { branches: [main] }
  schedule: [{ cron: "0 9 * * 1" }]  # Weekly Monday 9am

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22" }
      - run: yarn install --non-interactive
      - run: yarn audit --level moderate
        continue-on-error: true

  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## STANDARD GITLAB CI TEMPLATE (rald-alia)

```yaml
image: node:20-alpine
stages: [install, typecheck, build, docker]

# ... (see .gitlab-ci.yml in sekanidev/rald-alia)
```

---

## DEPRECATED PIPELINES (Remove These)

| Pattern | Replace With |
|---------|-------------|
| `npm install` in any workflow | `yarn install --non-interactive` |
| `npm ci` | `yarn install --frozen-lockfile` |
| `npm install -g npm@...` | Remove — use yarn |
| `cloudflare/pages-action@v1` | `yarn dlx wrangler@3 pages deploy` |
| Custom docker steps | Standard Pipeline 4 security scan |
| Any workflow not in the 4 above | Migrate or remove |

---

## REPO OWNERSHIP OF PIPELINES

| Repo | CI | Deploy Worker | Deploy Pages | Security |
|------|----|--------------|--------------|----------|
| rald-os | ✅ | ✅ | — | ❌ TODO |
| rald-auth-core | ✅ | ✅ | — | ❌ TODO |
| rald-routing | ✅ | ✅ | — | ❌ TODO |
| rald-notify | ✅ | ✅ | — | ❌ TODO |
| rald-config | — | ✅ | — | ❌ TODO |
| rald-event-bus | ✅ | ✅ | — | ❌ TODO |
| rald-identity | ✅ | ✅ | — | ❌ TODO |
| rald-admin | ✅ | — | 🔄 Fixing | ❌ TODO |
| rald-sdk | ✅ | — | — | ❌ TODO |
| payrald-ui-ux | ✅ | — | ✅ | ❌ TODO |
| rald-control-center | ✅ | — | ✅ | ❌ TODO |
