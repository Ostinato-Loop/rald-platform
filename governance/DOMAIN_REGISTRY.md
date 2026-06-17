# RALD Domain Registry
**Generated:** 2026-06-17 | **Phase 8 — Domain Governance**

---

## RALD.CLOUD — Core Platform

| Domain | Service | Repo | Status |
|--------|---------|------|--------|
| rald.cloud | Marketing site | rald-cloud-web | ✅ Active |
| api.rald.cloud | OS API Gateway | rald-os | ✅ Active |
| auth.rald.cloud | Auth Core | rald-auth-core | ✅ Active |
| profiles.rald.cloud | Identity Portal | rald-identity | ✅ Active |
| admin.rald.cloud | Control Center | rald-control-center | ✅ Active |
| alia.rald.cloud | ALIA Network | alia-ui-ux | ✅ Active |
| routing.rald.cloud | Routing Engine | rald-routing | ✅ Active |
| events.rald.cloud | Event Bus | rald-event-bus | ✅ Active |
| notify.rald.cloud | Notifications | rald-notify | ✅ Active |
| identity.rald.cloud | Identity API | rald-identity | ✅ Active |
| trust.rald.cloud | Trust Center | rald-trust | ✅ Active |
| status.rald.cloud | Status Page | rald-status | ✅ Active |
| docs.rald.cloud | Developer Docs | rald-docs | ✅ Active |
| console.rald.cloud | Dev Console | rald-dev-console | ✅ Active |
| design.rald.cloud | Design System | rald-design | ✅ Active |
| search.rald.cloud | Search | rald-search | ✅ Active |
| inbox.rald.cloud | Unified Inbox | rald-inbox | ✅ Active |
| mail.rald.cloud | Mail Client | rald-mail-ui-ux | ✅ Active |
| messenger.rald.cloud | Loop Messenger | loop-messenger-ui-ux | ✅ Active |
| git.rald.cloud | GitRald | gitrald-ui-ux | ✅ Active |

---

## PAYRALD.IO — Payments Platform

| Domain | Service | Repo | Status |
|--------|---------|------|--------|
| payrald.io | Main site | payrald-ui-ux | ✅ Active |
| payrald-ui.pages.dev | UI (CF Pages) | payrald-ui-ux | ✅ Active |
| checkout.payrald.io | Checkout | payrald-checkout | ✅ Active |
| merchant.payrald.io | Merchant Portal | payrald-merchant | ✅ Active |

---

## ELIMU.AFRICA / EDU.AFRICA — Education

| Domain | Service | Repo | Status |
|--------|---------|------|--------|
| elimu.africa | Education ERP | elimu, rald-elimu-ui-ux | ✅ Active |
| edu.africa | (redirect?) | — | ⚠️ Verify |
| *.edu.africa | School subdomains | elimu | ✅ Planned |
| *.elimu.africa | School subdomains | elimu | ✅ Planned |

---

## LOOP — Social Platform

| Domain | Service | Repo | Status |
|--------|---------|------|--------|
| loop.rald.cloud | Loop Platform | loop | ✅ Active |
| business.loop.rald.cloud | Loop Business | loop-business | ✅ Active |

---

## LEGACY / DEPRECATED DOMAINS

| Domain | Issue | Action |
|--------|-------|--------|
| (rald-auth-ui old domain) | Redirect to profiles.rald.cloud | ✅ Redirect in place |
| (payrald V1 domain) | Old monolith domain | Verify CF DNS |

---

## BROKEN / UNKNOWN DOMAINS

| Domain | Issue |
|--------|-------|
| config.rald.cloud | Not verified — rald-config Worker deployed but domain mapping not confirmed |

---

## DOMAIN → SERVICE → REPO MAP (Summary)

```
rald.cloud             → rald-cloud-web
api.rald.cloud         → rald-os (Cloudflare Worker)
auth.rald.cloud        → rald-auth-core (Cloudflare Worker)
profiles.rald.cloud    → rald-identity (Cloudflare Worker)
alia.rald.cloud        → alia-ui-ux (CF Pages) + rald-alia (GitLab services)
routing.rald.cloud     → rald-routing (Cloudflare Worker)
admin.rald.cloud       → rald-control-center + rald-admin (CF Pages)
events.rald.cloud      → rald-event-bus (Cloudflare Worker)
notify.rald.cloud      → rald-notify (Cloudflare Worker)
trust.rald.cloud       → rald-trust (CF Pages)
status.rald.cloud      → rald-status (CF Pages)
docs.rald.cloud        → rald-docs (CF Pages)
inbox.rald.cloud       → rald-inbox (Cloudflare Worker)
mail.rald.cloud        → rald-mail-ui-ux (CF Pages)
messenger.rald.cloud   → loop-messenger-ui-ux (CF Pages)
git.rald.cloud         → gitrald-ui-ux (CF Pages)
payrald.io             → payrald-ui-ux (CF Pages)
elimu.africa           → elimu + rald-elimu-ui-ux (CF Pages)
```
