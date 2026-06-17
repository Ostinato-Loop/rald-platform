# RALD Duplication Report
**Generated:** 2026-06-17 | **Analyst:** Principal Architect

---

## 1. AUTHENTICATION — HIGH SEVERITY

| Duplicate | Source (canonical) | Duplicate Repo | Action |
|-----------|-------------------|----------------|--------|
| Auth server | rald-auth-core | rald-auth-server | Archive rald-auth-server |
| Auth SDK | rald-sdk (modules/auth) | rald-auth-sdk | Merge rald-auth-sdk → rald-sdk |
| SSO/OAuth | rald-auth-core | rald-auth | Archive rald-auth |
| Auth infra | rald-infra | rald-infrastructure | Archive rald-infrastructure |

**Consolidation:** One auth system = **rald-auth-core** (auth.rald.cloud). All other auth repos archive.

---

## 2. SDK FRAGMENTATION — HIGH SEVERITY

| Canonical | Duplicates | Action |
|-----------|-----------|--------|
| rald-sdk | rald-auth-sdk | Merge → rald-sdk/src/modules/auth |
| rald-sdk | rald-sdk-payments | Merge → rald-sdk/src/modules/payments |
| rald-sdk | rald-sdk-messaging | Merge → rald-sdk/src/modules/messaging |
| rald-sdk | rald-sdk-auth | Merge → rald-sdk/src/modules/auth |
| rald-sdk | rald-shared-sdk | Merge → rald-sdk/src/core |
| rald-sdk | rald-sdk-react | Keep — React-specific wrapper |
| rald-sdk | rald-sdk-react-native | Keep — RN-specific wrapper |
| rald-sdk | rald-sdk-nextjs | Keep — Next.js-specific wrapper |

**Rule:** One SDK core (@rald/sdk). Framework wrappers are allowed.

---

## 3. ADMIN / CONTROL PLANE — MEDIUM SEVERITY

| Canonical | Duplicate | Action |
|-----------|-----------|--------|
| rald-control-center | rald-admin | Clarify: control-center = operator plane, admin = RALDTICS dashboard |
| rald-control-center | rald-console | Merge rald-console → rald-control-center |
| rald-control-center | payrald-admin | Merge PayRald admin into rald-admin or rald-control-center |

---

## 4. API GATEWAY — MEDIUM SEVERITY

| Canonical | Duplicate | Action |
|-----------|-----------|--------|
| rald-os | rald-api-core | Merge rald-api-core rate-limiting → rald-os middleware |
| rald-os | rald-platform (API parts) | Extract platform services into their own repos |

---

## 5. EVENT SYSTEM — MEDIUM SEVERITY

| Canonical | Duplicate | Action |
|-----------|-----------|--------|
| rald-event-bus | rald-events | Merge rald-events schema → rald-event-bus |
| rald-event-bus | rald-data-core (streaming) | Define boundary: event-bus = pub/sub; data-core = pipelines |

---

## 6. PAYRALD FRAGMENTATION — MEDIUM SEVERITY

| Issue | Repos | Action |
|-------|-------|--------|
| `payrald` (old monolith) | payrald | Archive — superseded by payrald-* repos |
| `payrald-your-digital-wallet` | payrald-wallet | Merge — identical domain |
| `rald-loop-business` | loop-business | Merge |
| `loop-business-8cbd0eb1` | loop-business | Archive (stale fork) |

---

## 7. ANALYTICS NAMING COLLISION — LOW SEVERITY

| Issue | Repos | Action |
|-------|-------|--------|
| `raldtics` registered as "Logistics abstraction" but all other `raldtics-*` repos are analytics | raldtics | Rename to `rald-logistics` or clarify purpose |

---

## 8. RALD IDENTITY PRODUCTS — LOW SEVERITY

| Canonical | Duplicate | Action |
|-----------|-----------|--------|
| rald-identity | rald-auth-ui | rald-auth-ui is now a redirect shell — keep as permanent redirect |
| rald-pro-ui-ux-v1 | rald-app-ui-ux | Archive v1 — superseded |

---

## CONSOLIDATION PRIORITY ORDER

1. **CRITICAL:** Archive rald-auth-server, rald-auth, rald-infrastructure (V1 legacy)
2. **HIGH:** Merge all SDK fragments into rald-sdk
3. **HIGH:** Archive payrald monolith and loop-business-8cbd0eb1
4. **MEDIUM:** Merge rald-api-core, rald-events, rald-console
5. **MEDIUM:** Clarify raldtics vs logistics
6. **LOW:** rald-pro-ui-ux-v1 archive

---

**Target:** 115 repos → ~85 repos after consolidation (27% reduction, all meaningful).
