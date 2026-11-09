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

## Member authentication reconciliation

Google sign-in is an approved Authorization Code + PKCE flow handled by the Next.js BFF. The BFF validates state, nonce and PKCE and does not expose provider access/refresh tokens or provider secrets to the browser. Google identity attachment never occurs solely by matching email: the existing account must be authenticated and the user must explicitly confirm linking. Production enablement, client registration, redirect origins and deployment configuration remain release/security gates.

Member access tokens have a 15-minute lifetime; refresh tokens have a seven-day inactivity-based lifetime. Refresh rotates on every successful use; detected reuse revokes the associated token family and requires authentication again. Production cookies are Secure and HttpOnly; unsafe requests require synchronizer-token and Origin validation. Current-session logout and sign-out-all are required. Cookie names, domains, paths, SameSite configuration, token/session persistence, concurrent-refresh transaction mechanics, synchronizer-token transport, and BFF-to-Nest credential forwarding remain technical design details. Brevo is approved behind an adapter boundary for member email-verification and password-reset delivery. Member verification is distinct from guest email OTP.

## Shagun and photo processing

Razorpay UPI-only Shagun uses server-side initiation, verified callbacks/webhooks, idempotent inbox, replay checks and reconciliation before success. Amount/currency/recipient must match stored intent. Refund/reversal support is conditional on provider and approved workflow; release blocked on account enablement, legal review and compliance verification. Platform does not hold funds.

Photo upload accepts JPG/JPEG or PNG up to 5 MB/file, per-batch guest cap 5 and co-owner/organiser cap 10. Validate filename extension, declared MIME and content signature; inspect/decode server side; strip GPS EXIF; quarantine/reject invalid objects; store originals/derivatives privately; authorize each short-lived download. Dimensions and per-wedding quota are deferred. Worker transformations/derivative formats must not expand accepted source upload types without approval.

## Operations not yet selected

Hosting provider, region/data residency, secret manager, backup and point-in-time recovery policy, SLO, RPO/RTO, retention and incident escalation are UNSPECIFIED. Existing deployment diagram is conceptual, not an approved provider topology. These are release architecture gates; no hosting choice is inferred.

## Support recovery boundary

The existing architecture's support-recovery requirements remain in force: case-bound access, wedding scope, reason/ticket, explicit approval, expiry, read-only by default and audit. The eligible support actors, approver separation, evidence sufficiency, escalation, exceptional write access and internal interface/API are not specified. Until approved, do not expose or implement a support recovery route or grant a platform actor implicit tenant access.

## Milestone 2.1 persistence implementation note

The NestJS modular monolith now has Mongoose persistence schemas for global users/provider identities, wedding roots, wedding memberships with append-only period events, and co-owner invitations. Provider identities are separate records with a unique `(provider, providerSubject)` constraint; this is the account-link data boundary, not an approved OAuth flow. The persistence contract requires workspace creation and membership history writes to use the MongoDB replica-set transaction boundary described above; real replica-set integration coverage exercises that boundary. The membership slot and active-Treasurer partial unique indexes are database guards; exact co-owner/Treasurer operational cardinality still requires the proposed serialized governance transaction and is not treated as implemented.

No browser route, NestJS HTTP route, email sender, provider integration, session/cookie behavior, or governance bootstrap is introduced by this milestone. Those remain subject to their respective approved contracts and unresolved-policy gates.

## Member session technical design (proposed implementation of approved policy)

The following is an implementation design, not a new product-policy approval. Browser traffic remains same-origin Browser → Next.js BFF → NestJS. NestJS owns session validation and all authorization. The BFF owns the Google callback and refresh single-flight coordination, forwards only the required session cookies and `X-CSRF-Token` to Nest over the configured server-side API origin, and never forwards provider credentials/tokens to the browser. The existing BFF allowlist must add only approved auth operations when they are implemented.

Use `__Host-mmm_access` and `__Host-mmm_refresh` production cookies: `Secure`, `HttpOnly`, `Path=/`, no `Domain`, `SameSite=Lax`, with Max-Age aligned to the 15-minute access and seven-day inactivity refresh policy. On local HTTP development use non-`__Host-` names with `Secure=false`; production must fail configuration validation if secure host-only cookies cannot be used. The browser-facing BFF, not NestJS, sets and clears these cookies with identical name/path/host attributes. NestJS returns authentication/session-operation results and never claims to clear a browser cookie. Cookie naming, BFF/API host layout, and deployed origin allowlist must be verified in deployment review; do not use a parent-domain cookie or expose an access/refresh token to JavaScript.

Use a synchronizer CSRF token, generated from cryptographic randomness at authenticated-session creation/rotation, stored only as a hash with the active session, and delivered in the authenticated `GET /v1/auth/me` envelope over the BFF. The browser sends it in `X-CSRF-Token` for every unsafe member request. Nest validates it after session resolution, using a timing-safe hash comparison, and validates an allowlisted `Origin`; missing/invalid/expired token or invalid/missing production Origin fails with a generic 403. Login and OAuth callback are pre-session actions protected by OAuth state/nonce/PKCE; refresh and logout remain CSRF-protected. CORS does not permit browser credentials directly to Nest.

Google OAuth uses BFF-owned Authorization Code + PKCE: BFF creates/stores a short-lived state/nonce/verifier correlation, receives the configured callback, validates all three before code exchange/hand-off, and handles cancellation/provider errors without creating a session. Secrets, client configuration, callback origin, and local versus production redirect URIs are deployment configuration, never source control or browser environment. The BFF requires a single configured public origin and Google callback URL per environment; their exact production values remain deployment gates.
