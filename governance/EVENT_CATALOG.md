# RALD Event Catalog
**Generated:** 2026-06-17 | **Phase 6 — Event Governance**
**Bus:** rald-event-bus (events.rald.cloud) | **Schema:** NATS/pubsub

---

## EVENT NAMING CONVENTION
`{domain}.{entity}.{action}` — all lowercase, dot-separated.
Example: `identity.user.provisioned`, `payment.transfer.completed`

---

## LAYER 1 — IDENTITY EVENTS

| Event | Producer | Consumers | Retry | DLQ | Schema Ver |
|-------|---------|-----------|-------|-----|------------|
| `identity.user.provisioned` | rald-auth-core | rald-notify, rald-routing, payrald-core | 3x exp backoff | ✅ | v1 |
| `identity.user.suspended` | rald-identity | rald-notify, rald-routing, rald-fraud | 3x exp backoff | ✅ | v1 |
| `identity.profile.updated` | rald-identity | rald-routing, rald-alia | 2x | ✅ | v1 |
| `identity.trust.changed` | rald-trust | rald-routing, payrald-risk, rald-fraud | 3x | ✅ | v1 |
| `identity.kyc.completed` | rald-alia (verification-service) | rald-identity, payrald-core | 3x | ✅ | v1 |
| `identity.sanctions.flagged` | rald-compliance | rald-routing, rald-fraud, rald-notify | 5x | ✅ | v1 |

---

## LAYER 2 — ALIA EVENTS

| Event | Producer | Consumers | Retry | DLQ |
|-------|---------|-----------|-------|-----|
| `alia.alias.created` | rald-alia (alias-service) | rald-identity, rald-routing | 3x | ✅ |
| `alia.alias.resolved` | rald-alia (resolution-engine) | rald-routing, raldtics-events | 2x | ✅ |
| `alia.alias.resolution_failed` | rald-alia (resolution-engine) | rald-notify, raldtics-events | 5x | ✅ |
| `alia.consent.granted` | rald-alia (consent-service) | rald-routing, rald-identity | 3x | ✅ |
| `alia.consent.revoked` | rald-alia (consent-service) | rald-routing, rald-identity | 3x | ✅ |
| `alia.route.completed` | rald-routing | raldtics-events, rald-notify | 2x | ✅ |
| `alia.fraud.flagged` | rald-alia (fraud-service) | rald-notify, rald-identity, rald-compliance | 5x | ✅ |
| `alia.audit.logged` | rald-alia (audit-service) | raldtics-events | 1x | ❌ |

---

## LAYER 3 — PAYMENT EVENTS

| Event | Producer | Consumers | Retry | DLQ |
|-------|---------|-----------|-------|-----|
| `payment.transfer.initiated` | payrald-core | rald-notify, payrald-risk, payrald-settlements | 3x | ✅ |
| `payment.transfer.completed` | payrald-core | rald-notify, payrald-wallet, payrald-settlements | 3x | ✅ |
| `payment.transfer.failed` | payrald-core | rald-notify, payrald-risk | 5x | ✅ |
| `payment.transfer.reversed` | payrald-settlements | rald-notify, payrald-wallet | 3x | ✅ |
| `payment.wallet.credited` | payrald-wallet | rald-notify, raldtics-events | 2x | ✅ |
| `payment.wallet.debited` | payrald-wallet | rald-notify, raldtics-events | 2x | ✅ |
| `payment.card.created` | payrald-cards | rald-notify | 3x | ✅ |
| `payment.merchant.onboarded` | payrald-merchant | rald-notify, rald-identity | 3x | ✅ |
| `payment.risk.flagged` | payrald-risk | rald-notify, payrald-core | 5x | ✅ |

---

## LAYER 4 — COMMUNICATION EVENTS

| Event | Producer | Consumers | Retry | DLQ |
|-------|---------|-----------|-------|-----|
| `notification.sent` | rald-notify | raldtics-events | 1x | ❌ |
| `notification.delivery_failed` | rald-notify | raldtics-events, rald-support | 3x | ✅ |
| `message.sent` | messenger | rald-notify (push), raldtics-events | 2x | ✅ |
| `message.read` | messenger | raldtics-events | 1x | ❌ |
| `mail.sent` | rald-mail-ui-ux | raldtics-events | 2x | ✅ |

---

## LAYER 5 — PRODUCT EVENTS

| Event | Producer | Consumers | Retry | DLQ |
|-------|---------|-----------|-------|-----|
| `elimu.school.enrolled` | elimu | rald-notify, raldtics-events | 3x | ✅ |
| `loop.user.followed` | loop | raldtics-events | 1x | ❌ |
| `loop.post.created` | loop | raldtics-events, loop-messenger | 2x | ✅ |
| `gitrald.deploy.completed` | gitrald-deploy | rald-notify, raldtics-events | 3x | ✅ |
| `gitrald.deploy.failed` | gitrald-deploy | rald-notify, gitrald-monitor | 5x | ✅ |

---

## DEAD LETTER QUEUE POLICY

| Scenario | Max Retries | DLQ Action | Alert |
|----------|-------------|------------|-------|
| Payment events | 5 | Manual review required | 🔴 PagerDuty |
| Identity events | 3 | Auto-escalate after 24h | 🟡 Slack |
| Notification events | 3 | Log only | 🟢 None |
| Analytics events | 1 | Discard (non-critical) | 🟢 None |

---

## DUPLICATE EVENT DEFINITIONS FOUND

| Duplicate | Source | Duplicate | Resolution |
|-----------|--------|-----------|------------|
| `user.provisioned` | rald-event-bus | `identity.provisioned` (rald-events repo) | Canonical: `identity.user.provisioned` |
| `transfer.completed` | payrald-api | `payment.completed` (rald-events) | Canonical: `payment.transfer.completed` |

> **Action:** Deprecate rald-events repo. All event schemas belong in rald-event-bus.
