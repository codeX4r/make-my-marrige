# System Design Architecture Reconciliation v2.1

**Document role:** Amendment to preserved System Design Architecture v2.0. It governs only explicitly reconciled clauses; all non-conflicting v2.0 architecture remains. Historical PDF/DOCX snapshots and diagram outputs are preserved. See `architecture-decision-register-v2.1.md` for approved decisions and their distinct implementation/release statuses. Technical mechanisms described here are proposals unless explicitly identified as approved product decisions; see `technical-policy-register-v1.0.md`.

## Runtime and trust boundary

Browser → Next.js BFF/Route Handler → NestJS REST API (`/v1`) → MongoDB/Mongoose and infrastructure adapters. The browser uses the BFF as its sole application boundary for privileged requests. BFF passes a verifiable session credential and request ID to Nest over a trusted server-side channel. Next.js does not authorize domain actions; Nest authenticates, resolves wedding scope, checks current permission, validates state/version and audits every mutation. Secure/HttpOnly/SameSite cookies and CSRF defenses apply to browser requests. Validate origin; use explicit timeouts, safe error propagation and trusted-service CORS. Provider and service credentials are never browser-visible. Cookie host layout and token-forwarding implementation require security review before implementation.

## Modular monolith and asynchronous work

NestJS remains a modular monolith with domain modules and infrastructure ports. MongoDB transactions protect multi-document governance/payment state changes; transactional outbox/inbox handles provider/email/background side effects. External calls occur outside transactions. Existing conceptual Redis/BullMQ and worker elements remain proposals until deployment requirements are selected. No microservices are introduced.

## Tenant and governance consistency

Every tenant-owned document carries `weddingId`, derived from authenticated member/guest context. Tenant repositories enforce same-wedding relationship checks and default deny. Exactly two active co-owners and one active Treasurer are business invariants. Provisioning permits a first co-owner in setup, then second-owner invitation/acceptance; operational actions require the second owner. Serialize membership/Treasurer transitions by transaction plus conditional wedding-root version/guard, validate final membership state and update membership, finance setting and audit/outbox atomically. Unique partial index can prevent multiple active Treasurer assignments but cannot enforce exact co-owner cardinality. Implementation mechanism remains Proposed pending design review; retries must re-read and revalidate.

## Email and guest access

Brevo is approved for guest email OTP; its use for other transactional messages remains to be confirmed. The challenge/invitation binding, hashed challenge storage, one-time use, rate controls and invalidation behavior are proposed technical policy, not additional approved product decisions. OTP numeric expiry/resend/attempt values and session durations remain open. Provider retry/dead-letter handling is proposed operational design. No production credentials or sender configuration are assumed.

## Shagun and photo processing

Razorpay UPI-only Shagun uses server-side initiation, verified callbacks/webhooks, idempotent inbox, replay checks and reconciliation before success. Amount/currency/recipient must match stored intent. Refund/reversal support is conditional on provider and approved workflow; release blocked on account enablement, legal review and compliance verification. Platform does not hold funds.

Photo upload accepts JPG/JPEG or PNG up to 5 MB/file, per-batch guest cap 5 and co-owner/organiser cap 10. Validate filename extension, declared MIME and content signature; inspect/decode server side; strip GPS EXIF; quarantine/reject invalid objects; store originals/derivatives privately; authorize each short-lived download. Dimensions and per-wedding quota are deferred. Worker transformations/derivative formats must not expand accepted source upload types without approval.

## Operations not yet selected

Hosting provider, region/data residency, secret manager, backup and point-in-time recovery policy, SLO, RPO/RTO, retention and incident escalation are UNSPECIFIED. Existing deployment diagram is conceptual, not an approved provider topology. These are release architecture gates; no hosting choice is inferred.

## Support recovery boundary

The existing architecture's support-recovery requirements remain in force: case-bound access, wedding scope, reason/ticket, explicit approval, expiry, read-only by default and audit. The eligible support actors, approver separation, evidence sufficiency, escalation, exceptional write access and internal interface/API are not specified. Until approved, do not expose or implement a support recovery route or grant a platform actor implicit tenant access.
