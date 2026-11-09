# MakeMyMarrige API Documentation v1.1

**Contract version:** 1.1.0
**Version note:** Design-contract revision before implementation, not a deployed compatibility release. `/v1` remains the canonical REST path.
**Base path:** `/v1`  
**Protocol:** HTTPS REST + JSON  
**Backend:** NestJS + TypeScript  
**Database:** MongoDB Atlas  
**Timezone:** `Asia/Kolkata`  
**Status:** Reconciled design contract; implementation and conformance testing required. This v1.1 file supersedes v1.0 only for reconciled clauses; historical v1.0 remains preserved.

## 1. API design principles
- Resource-oriented REST endpoints; nouns for resources and explicit action subresources for state transitions.
- Version all public routes under `/v1`; breaking changes require a new major API version.
- JSON request/response bodies; UTF-8; ISO 8601 UTC timestamps; `YYYY-MM-DD` for date-only values.
- Internal IDs are opaque strings to clients. Never expose database implementation details as a client contract.
- The server derives tenant context from authenticated membership. `weddingId` in client input never grants access.
- Cookie-based member and guest sessions; no long-lived role claims trusted without current membership/permission validation.
- Use transactions for atomic multi-document business invariants; transactional outbox for side effects.
- Use idempotency keys for retryable create/payment/financial operations; optimistic concurrency for mutable resources.

## 2. Environments and base URLs
- Production: replace `https://api.example.com` with the deployed API origin.
- Staging: replace `https://staging-api.example.com` with the staging origin.
- Local: `http://localhost:<port>/v1` only for local development; never expose plain HTTP publicly.

## 3. Authentication and actor contexts
### Member sessions
Email/password is the documented member authentication path. Google OAuth uses Authorization Code + PKCE through the Next.js BFF; state, nonce and PKCE are validated server-side and provider credentials/tokens never reach the browser. Google production client registration, redirect origins and deployment configuration remain release/security gates. Access tokens last 15 minutes; refresh tokens expire after seven days of inactivity, rotate on every successful refresh, and token-family reuse revokes the family. Production cookies are Secure and HttpOnly; unsafe requests require synchronizer-token and Origin validation. Exact cookie names/scope, token persistence, concurrent-refresh handling, synchronizer-token transport and BFF-to-Nest forwarding remain implementation design. Account linking requires authentication to the existing account and explicit confirmation; matching email alone is insufficient. Brevo is the adapter provider for member email verification and password reset. Member authentication and verification are distinct from guest OTP.

### Member session technical contract

The proposed implementation uses host-only `__Host-mmm_access` and `__Host-mmm_refresh` Secure/HttpOnly/Lax cookies at `Path=/`; local HTTP uses distinct non-`__Host-` names with `Secure=false`. The BFF forwards required cookies and `X-CSRF-Token` only to Nest. `GET /v1/auth/me` is the authenticated CSRF-token bootstrap response; its returned synchronizer token is submitted on every unsafe member request and Nest validates both the token/session binding and an allowlisted Origin. Exact deployed cookie host topology, token persistence shape and BFF-to-Nest credential transport remain implementation design, not browser API fields.

`POST /v1/auth/sessions/revoke-all` is the proposed sign-out-all operation: it requires the current member session and CSRF validation, accepts an empty request body, returns `GenericSuccess`, transactionally revokes all active refresh-token families for the authenticated user, and writes audit/outbox events. The Next.js BFF clears browser cookies on success using matching attributes; NestJS does not manage browser `Set-Cookie` headers. It does not promise immediate invalidation of already-issued 15-minute access tokens. Missing/invalid session returns generic 401; invalid CSRF/origin returns 403. The active OpenAPI YAML/JSON must add this operation with the next approved contract publication; no endpoint implementation exists.
### Guest sessions
Guests use email OTP only and do not use member email/password or Google OAuth authentication. Brevo is the approved OTP provider. The invitation-linked guest session model is documented, while exact identity resolution (including shared email addresses), invitation token issue/re-send/revoke rules, OTP thresholds and session lifecycle details are proposals/open contract details; see `docs/02-system-architecture/documents/technical-policy-register-v1.0.md`. Do not treat a proposed response shape, expiry or revocation behavior as an approved product rule until the contract is reviewed.

### Browser-to-API boundary
Browser traffic goes to the Next.js BFF/Route Handler, which calls NestJS REST. NestJS remains authoritative for authentication, tenant resolution, permissions, business rules and state transitions. The BFF is transport/session glue only and is not an authorization authority. Use Secure, HttpOnly, SameSite cookies and CSRF protection for state-changing browser requests; Nest re-authorizes every operation. BFF-to-Nest traffic uses a trusted server-side channel and forwards a verifiable session credential and request/correlation ID. Provider secrets and privileged credentials stay server-side. Configure explicit timeouts, propagate safe error codes/request IDs, and restrict CORS to trusted server origins. Direct browser access to privileged NestJS operations is unsupported. Exact cookie topology/token-forwarding mechanics remain an implementation detail requiring security review.
### Webhooks
Payment provider webhooks use provider-specific signature verification, timestamp/replay checks and event deduplication. They do not use member or guest cookies.

## 4. Tenant resolution and authorization
1. Authenticate actor/session.
2. Resolve active membership or guest session from authoritative state.
3. Resolve weddingId server-side and attach immutable request context.
4. Check role, action-level permission and resource scope.
5. Query through tenant-scoped repositories; every tenant record relationship is checked against the same weddingId.
6. Re-check permission for photo downloads, exports and notification deep links.
Never accept a client-provided weddingId as authority. If present for route/resource addressing, compare it with the resolved tenant.

### Role policy summary
- **Co-owner:** full workspace governance and owner-level operations; high-impact actions may require both co-owners.
- **Organiser:** only explicit action-level permissions and scopes. No wedding-wide financial ledger, budget totals or Shagun totals.
- **Treasurer:** dedicated finance role; normal expense approval and payment recording. Treasurer-created or Treasurer-beneficiary expenses route to both co-owners.
- **Guest:** own profile/session, visible published function data, own RSVP, own additional-guest requests, permitted gallery actions and own Shagun history.
- **Platform support:** break-glass, restricted, case-bound and fully audited; no routine workspace administration.

## 5. Request conventions
### Headers
```http
Accept: application/json
Content-Type: application/json
X-Request-Id: <optional-client-correlation-id>
Idempotency-Key: <opaque-key-for-retryable-mutation>
X-CSRF-Token: <required-when-cookie-CSRF-policy-demands>
If-Match: <resource-version-or-etag>
```
`X-Request-Id` is accepted only as a correlation hint; the server validates or replaces it. `Idempotency-Key` is required for payment-intent creation and recommended for invitation acceptance, expense payment recording, export requests and other retryable creates. `If-Match` may be used where the API exposes ETags; otherwise use `expectedVersion` in the request body.

### Pagination
- Cursor pagination for large collections; default limit 20, maximum 50.
- Sort is server-allowlisted. Stable default order is `createdAt DESC, _id DESC`.
- Response: `meta.nextCursor`, `meta.hasMore`, `meta.limit`.
- Cursors are opaque, signed or integrity-protected and bound to tenant, filters and sort.
- Avoid deep `skip` pagination and unrestricted client-selected sort fields.

### Filtering and search
- Only documented filters are accepted; validate enum values, date ranges and maximum query lengths.
- Guest search must be tenant-scoped and rate-limited. Do not expose unrestricted regex search.
- Vendor discovery is mediated through the provider adapter; do not expose provider API keys.

### Dates and money
- Date-only values: `YYYY-MM-DD`, interpreted in `Asia/Kolkata` for wedding scheduling.
- Instants: RFC 3339/ISO 8601 with timezone; responses normalised to UTC (`Z`).
- Monetary request values: integer `amountPaise`, currency `INR`; never accept floating rupees.
- When presenting rupees, round up to the next whole rupee: `ceil(amountPaise / 100)`. This is display-only; stored and settled amounts remain exact paise.

## 6. Response envelope
Successful responses use a stable envelope:
```json
{
  "data": { "id": "opaque-resource-id" },
  "meta": { "requestId": "req_...", "servedAt": "2026-11-04T10:00:00Z" }
}
```
List responses put an array in `data` and cursor metadata in `meta`.

## 7. Error model
```json
{
  "error": {
    "code": "ACTIVE_WEDDING_MEMBERSHIP_EXISTS",
    "message": "This account already has an active wedding membership.",
    "requestId": "req_...",
    "details": [],
    "retryable": false
  }
}
```
Stable machine-readable `code` is the contract. Human-readable messages may evolve. Do not return stack traces, raw database errors, token state or another tenant's private details.

### HTTP status policy
| Status | Meaning |
|---|---|
| 200 | Successful read/update/action |
| 201 | Resource created |
| 202 | Accepted for asynchronous processing |
| 204 | Successful action with no response body (use sparingly) |
| 400 | Malformed request or invalid syntax |
| 401 | Missing/invalid authentication |
| 403 | Authenticated but not authorised |
| 404 | Resource absent or intentionally concealed |
| 409 | State conflict, duplicate, stale version, membership conflict |
| 410 | Expired/revoked invitation or token |
| 412 | If-Match precondition failed |
| 422 | Syntactically valid but domain validation failed |
| 429 | Rate limited; include Retry-After |
| 500 | Unexpected server failure |
| 503 | Temporarily unavailable/dependency circuit open |

## 8. Concurrency, idempotency and state transitions
- Mutable resources expose `version`; update with expected version or If-Match. Stale writes return 409 (or 412 for If-Match).
- State transitions are explicit action endpoints, not arbitrary status patching.
- The API validates allowed transition, actor permission, required approvals and current resource version.
- Idempotency records bind actor + operation scope + key + request hash. Same key/same payload returns original outcome; same key/different payload returns 409.
- Webhook handlers deduplicate provider event IDs and tolerate duplicate/out-of-order delivery.
- BullMQ consumers are retry-safe and idempotent. Queue delivery is not exactly-once.

## 9. Rate limiting
- Cloudflare edge layer: WAF, DDoS and coarse IP controls.
- NestJS/Redis layer: account, session, guest email, wedding, IP and route-aware controls.
- OTP, login, registration, password reset, invitation preview/acceptance, upload-intent and payment-intent routes receive stricter limits.
- Return 429 with `Retry-After`; do not reveal whether a guest email belongs to an invitation/account.
- Redis outage: fail closed for auth/OTP/payment/upload-sensitive operations; conservative per-instance emergency limits for ordinary reads.

## 10. Security and privacy requirements
- HTTPS only in deployed environments; HSTS at edge; secure cookie flags.
- CSRF protection for unsafe cookie-authenticated requests; CORS allowlist exact frontend origins.
- DTO validation and output allowlisting; reject mass assignment and unknown fields.
- Never log passwords, OTPs, refresh tokens, invitation tokens, payment credentials or raw sensitive provider payloads.
- Store only token hashes; rotate refresh tokens; revoke token family on reuse detection.
- Rate limit enumeration-sensitive endpoints and use generic responses.
- Private R2 bucket; presigned uploads/downloads are short-lived; authorise every download.
- Remove GPS EXIF before publication; validate MIME by decoding actual file bytes, not filename.
- Payment webhook signature, timestamp and replay validation are mandatory.
- Audit sensitive governance, finance, guest, vendor, photo and export actions.

## 11. Workflow API behaviour
- **WF01:** account registration/login, email verification, workspace creation, co-owner invitation and transactional acceptance. Membership conflict returns 409 without consuming invitation.
- **WF02:** dual approvals for organiser invitation/removal and Treasurer changes; immutable proposal snapshot; approval changes invalidate when proposal version changes.
- **WF03:** function draft edits; publication/cancellation dual-approved; guest-facing reads use immutable published snapshots. Task completion checks mandatory checklist and dependencies.
- **WF04:** household and guest records; corrections reviewed by someone other than requester; merge dual-approved; shared contact channels do not merge identities.
- **WF05:** guest self-RSVP until deadline; one record per wedding/function/guest; assisted corrections require permission and reason; unanswered remains pending.
- **WF06:** paise-only finance; normal expense Treasurer approval; Treasurer-created/beneficiary expense requires both co-owners; only Treasurer records payments; void/correction follows dual approval.
- **WF07:** Google Places adapter and manual vendors; explicit availability state; selection is not booking; booking status recorded separately.
- **WF08:** one approved UPI destination; provider-verified webhook only marks contribution successful; manual reconciliation cannot mark success.
- **WF09:** direct-to-R2 presigned upload; quarantine and validation; guest uploads moderated; signed download URLs short-lived; all reads authorised.
- **WF10:** in-app notifications only; dashboard visibility by role; financial summaries restricted to co-owners and Treasurer.
- **WF11:** audit visibility co-owner only; sensitive exports audited; support recovery case-bound and restricted.
- **WF12:** cancellation second approval revokes access immediately; seven-day public notice only; deletion runs asynchronously and idempotently.

## 12. Endpoint catalogue
### Audit
- `GET /v1/audit-events` — List audit events (co-owners only).
- `POST /v1/audit-exports` — Request audit CSV/PDF export.
- `GET /v1/audit-exports/{exportId}` — Get export status and authorised short-lived URL.
### Authentication
- `POST /v1/auth/register` — Register account.
- `POST /v1/auth/login` — Authenticate with email and password.
- `POST /v1/auth/google` — Exchange Google OAuth credential/code for an application session.
- `POST /v1/auth/refresh` — Rotate refresh session and detect token reuse.
- `POST /v1/auth/logout` — Revoke current session.
- `GET /v1/auth/me` — Get current account and active membership.
- `GET /v1/auth/sessions` — List account sessions.
- `POST /v1/auth/sessions/{sessionId}/revoke` — Revoke one account session.
- Sign-out-all is approved but has no API operation until cookie/session-family transport is specified; do not infer a route or payload.
- `POST /v1/auth/email/verify` — Consume email verification token.
- `POST /v1/auth/email/resend` — Resend verification email.
- `POST /v1/auth/password/forgot` — Request password reset.
- `POST /v1/auth/password/reset` — Consume reset token and set new password.
### Dashboard
- `GET /v1/dashboard` — Get role-specific dashboard metrics.
- `GET /v1/dashboard/alerts` — Get authorised dashboard alerts.
### Digital Shagun
- `GET /v1/shagun/settings` — Get masked Shagun configuration.
- `POST /v1/shagun/configuration-requests` — Propose UPI destination activation/change.
- `POST /v1/shagun/configuration-requests/{requestId}/approve` — Approve destination configuration as co-owner.
- `POST /v1/shagun/payment-intents` — Create Razorpay UPI-only payment intent for authenticated guest; requires `Idempotency-Key`.
- `GET /v1/shagun/payment-intents/{intentId}` — Read own verified Shagun intent status.
- `GET /v1/shagun/contributions` — List contributions for authorised finance roles.
- `GET /v1/shagun/contributions/mine` — List own verified contribution history.
- `POST /v1/shagun/payment-intents/{intentId}/reconcile` — Initiate provider status check; cannot manually mark paid.
### Finance
- `GET /v1/finance/budget` — Get budget and category allocation summary.
- `PATCH /v1/finance/budget` — Update budget only through governance policy.
- `GET /v1/finance/categories` — List budget categories.
- `POST /v1/finance/categories` — Create budget category.
- `PATCH /v1/finance/categories/{categoryId}` — Update category through authorised governance.
- `GET /v1/finance/estimates` — List expense estimates.
- `POST /v1/finance/estimates` — Create estimate range.
- `GET /v1/finance/expenses` — List expenses visible to caller.
- `POST /v1/finance/expenses` — Create expense.
- `GET /v1/finance/expenses/{expenseId}` — Get expense detail.
- `PATCH /v1/finance/expenses/{expenseId}` — Update draft expense only.
- `POST /v1/finance/expenses/{expenseId}/submit` — Submit expense for approval.
- `POST /v1/finance/expenses/{expenseId}/approve` — Approve using Treasurer or co-owner exception route.
- `POST /v1/finance/expenses/{expenseId}/reject` — Reject expense.
- `POST /v1/finance/expenses/{expenseId}/payments` — Record payment entry (Treasurer only).
- `GET /v1/finance/expenses/{expenseId}/payments` — List expense payment entries.
- `POST /v1/finance/expenses/{expenseId}/void-requests` — Request void of approved expense.
- `POST /v1/finance/expenses/{expenseId}/adjustments` — Request correction/reversal adjustment.
- `POST /v1/finance/reserve-transfers` — Propose reserve allocation transfer with threshold governance.
### Functions
- `GET /v1/functions` — List functions.
- `POST /v1/functions` — Create function draft.
- `GET /v1/functions/{functionId}` — Get function detail.
- `PATCH /v1/functions/{functionId}` — Update unpublished function draft.
- `POST /v1/functions/{functionId}/publish` — Submit or execute dual-approved publication.
- `POST /v1/functions/{functionId}/cancel` — BLOCKED: dual approval is required, but the operation payload/transition contract is unspecified; prior OpenAPI referenced a missing schema.
- `GET /v1/functions/{functionId}/publication-history` — List immutable publication snapshots.
### Governance
- `GET /v1/workspaces/current/governance-requests` — List governance proposals.
- `POST /v1/workspaces/current/governance-requests` — Create governance proposal.
- `GET /v1/workspaces/current/governance-requests/{requestId}` — Get governance proposal.
- `POST /v1/workspaces/current/governance-requests/{requestId}/approve` — Approve proposal as distinct active co-owner.
- `POST /v1/workspaces/current/governance-requests/{requestId}/reject` — Reject proposal.
- `POST /v1/workspaces/current/governance-requests/{requestId}/cancel` — Cancel proposal before execution.
- `GET /v1/workspaces/current/finance-settings` — Get Treasurer and finance governance settings.
### Guest Authentication
- `POST /v1/guest-auth/otp/request` — Request guest OTP.
- `POST /v1/guest-auth/otp/verify` — Verify OTP and issue wedding-scoped guest session.
- `POST /v1/guest-auth/logout` — Revoke guest session.
### Guest Portal
- `GET /v1/guest/me` — Get authenticated guest's own profile and permitted wedding context.
- `GET /v1/guest/functions` — List functions for which guest has visibility/invitation.
- `GET /v1/guest/functions/{functionId}` — Get published function snapshot visible to guest.
- `GET /v1/guest/rsvps` — List own RSVP records.
- `POST /v1/guest/functions/{functionId}/rsvp` — Create or update own RSVP before deadline.
- `POST /v1/guest/functions/{functionId}/additional-guest-requests` — Request additional guests.
- `GET /v1/guest/additional-guest-requests` — List own additional guest requests.
### Guests
- `GET /v1/households` — List households.
- `POST /v1/households` — Create household.
- `GET /v1/households/{householdId}` — Get household and permitted guest summaries.
- `PATCH /v1/households/{householdId}` — Update household.
- `POST /v1/households/{householdId}/archive` — Archive household without deleting guests.
- `GET /v1/guests` — Search/list guests with tenant-scoped filters.
- `POST /v1/guests` — Create guest.
- `GET /v1/guests/{guestId}` — Get guest profile.
- `PATCH /v1/guests/{guestId}` — Update allowed guest fields.
- `POST /v1/guests/{guestId}/correction-requests` — Submit profile correction request.
- `GET /v1/guests/{guestId}/correction-requests` — List requests; requester sees own, co-owner/scoped organiser can review.
- `GET /v1/guests/{guestId}/correction-requests/{requestId}` — Read request status with owner/tenant checks.
- `POST /v1/guests/{guestId}/correction-requests/{requestId}/review` — Approve/reject with reason and expectedVersion; requester cannot self-review; mutation and audit are atomic.
- `POST /v1/guests/{guestId}/merge-requests` — Propose guest merge for dual approval.
- `POST /v1/guests/{guestId}/household-transfer` — Transfer guest between households preserving history.
- `GET /v1/relationship-tags` — List wedding relationship tags.
- `POST /v1/relationship-tags` — Create relationship tag.
### Invitations
- `POST /v1/invitations/preview` — Preview invitation with minimal pre-auth disclosure.
- `POST /v1/invitations/{invitationId}/accept` — Accept invitation transactionally.
- `GET /v1/workspaces/current/invitations` — List workspace invitations.
- `POST /v1/workspaces/current/invitations` — BLOCKED: create-invitation request payload, invitation type/role and permission scope are unspecified; do not implement until approved.
- `POST /v1/workspaces/current/invitations/{invitationId}/revoke` — Revoke pending invitation.
### Lifecycle
- `POST /v1/workspaces/current/lifecycle/cancel-requests` — Request workspace cancellation requiring two co-owner approvals.
- `POST /v1/workspaces/current/lifecycle/cancel-requests/{requestId}/approve` — Second co-owner approval triggers immediate access revocation and deletion workflow.
- `POST /v1/workspaces/current/lifecycle/date-change-requests` — Request wedding date change under post-date guardrails.
- `POST /v1/workspaces/current/exports` — Request final workspace export before cancellation approval completes.
- `GET /v1/workspaces/current/deletion-status` — Get deletion progress where caller remains authorised.
### Membership
- `GET /v1/workspaces/current/members` — List workspace members.
- `GET /v1/workspaces/current/members/{membershipId}` — Get member details.
- `POST /v1/workspaces/current/members/{membershipId}/suspend` — Emergency suspend non-co-owner member.
- `POST /v1/workspaces/current/members/{membershipId}/governance-removal` — Propose member removal through dual approval.
### Notifications
- `GET /v1/notifications` — List own in-app notifications.
- `POST /v1/notifications/{notificationId}/read` — Mark notification read.
- `POST /v1/notifications/read-all` — Mark all visible notifications read.
- `GET /v1/notification-preferences` — Get notification preferences.
- `PATCH /v1/notification-preferences` — Update category preferences.
### Photos
- `GET /v1/photos/albums` — List function albums.
- `GET /v1/photos/albums/{albumId}/photos` — List authorised approved photos.
- `POST /v1/photos/upload-intents` — Create per-file upload reservations for one role-limited batch (guest 5, co-owner/organiser 10).
- `POST /v1/photos/uploads/{uploadId}/complete` — Verify object and enqueue validation/moderation.
- `GET /v1/photos/{photoId}` — Get authorised photo metadata and short-lived download URL.
- `POST /v1/photos/{photoId}/reports` — Report published photo.
- `POST /v1/photos/{photoId}/removal-requests` — Request photo removal.
- `POST /v1/photos/{photoId}/moderate` — Approve/reject/hide/restore photo with permission check.
- `POST /v1/photos/{photoId}/permanent-removal` — Co-owner permanent removal decision.
### RSVP Management
- `GET /v1/rsvps` — List RSVP records for authorised members.
- `PATCH /v1/rsvps/{rsvpId}/assisted-update` — Assisted RSVP correction with explicit permission and reason.
- `GET /v1/additional-guest-requests` — List additional guest requests.
- `POST /v1/additional-guest-requests/{requestId}/arrangements` — Record partial approval/arrangements.
### Tasks
- `GET /v1/tasks` — List tasks.
- `POST /v1/tasks` — Create task.
- `GET /v1/tasks/{taskId}` — Get task detail.
- `PATCH /v1/tasks/{taskId}` — Update task.
- `POST /v1/tasks/{taskId}/assignments` — Assign member(s), with an optional responsible membership selected from the active assignment set.
- `GET /v1/tasks/{taskId}/dependencies` — List prerequisite task links.
- `PUT /v1/tasks/{taskId}/dependencies` — Replace dependency links atomically; same-wedding task permission, cycle/self-edge validation, expectedVersion, idempotent identical retries.
- `DELETE /v1/tasks/{taskId}/dependencies?expectedVersion={version}` — Clear dependency links with optimistic concurrency.
- `POST /v1/tasks/{taskId}/checklist-items` — Add checklist item.
- `PATCH /v1/tasks/{taskId}/checklist-items/{itemId}` — Update checklist item.
- `POST /v1/tasks/{taskId}/complete` — Complete task after mandatory checklist/dependency validation.
- `POST /v1/tasks/{taskId}/reopen` — Reopen task with reason and dependency review.
- `POST /v1/tasks/{taskId}/comments` — Add task comment.

Each task may designate one `responsibleMembershipId` from its active assignments as accountable owner; other assignees are collaborators. Assignment management requires co-owner or organiser task-management permission and validates active membership in the resolved wedding. Completion is rejected while prerequisites are incomplete. Dependency changes, task completion and responsible-owner changes are version-checked and audited.
### Vendors
- `GET /v1/vendor-categories` — List wedding vendor categories.
- `POST /v1/vendor-categories` — Create vendor category.
- `GET /v1/vendors` — List wedding vendor shortlist.
- `POST /v1/vendors` — Add vendor from provider reference or manual record.
- `GET /v1/vendors/{vendorId}` — Get vendor record.
- `PATCH /v1/vendors/{vendorId}` — Update permitted vendor data.
- `POST /v1/vendors/discovery/search` — Search Google Places through provider adapter.
- `POST /v1/vendors/{vendorId}/enquiries` — Create/update enquiry state.
- `POST /v1/vendors/{vendorId}/quotes` — Record vendor quote.
- `POST /v1/vendors/{vendorId}/availability-checks` — Record explicit availability check.
- `POST /v1/vendors/{vendorId}/select` — Select vendor (co-owner only).
- `POST /v1/vendors/{vendorId}/booking` — Record booking lifecycle explicitly.
### Webhooks
- `POST /v1/webhooks/payments/{providerId}` — Receive signed Razorpay webhook only (`providerId=razorpay`); verify raw-body signature and deduplicate before processing.
### Workspace
- `POST /v1/workspaces` — Create wedding workspace and first co-owner membership.
- `GET /v1/workspaces/current` — Get current wedding workspace.
- `PATCH /v1/workspaces/current` — Update permitted workspace profile.
- `GET /v1/workspaces/current/setup-progress` — Get progressive setup checklist.

## 13. Critical endpoint contract examples
### Accept an invitation
```http
POST /v1/invitations/{invitationId}/accept
Idempotency-Key: <key>
```
```json
{ "token": "<opaque-invitation-token>" }
```
Rules: authenticated verified email must exactly match invited email; transaction checks active/suspended membership slot; if occupied, return 409 `ACTIVE_WEDDING_MEMBERSHIP_EXISTS` and leave invitation pending; successful acceptance creates/reactivates membership and records audit/outbox.

### Guest RSVP
```http
POST /v1/guest/functions/{functionId}/rsvp
```
```json
{ "response": "ATTENDING", "expectedVersion": 2 }
```
Rules: guest session must resolve to this guest and wedding; guest must be individually invited; deadline must be open; upsert uses unique `(weddingId,functionId,guestId)`; append RSVP event; never accept a guestId from request body.

### Create expense
```http
POST /v1/finance/expenses
Idempotency-Key: <key>
```
```json
{ "categoryId": "...", "title": "Venue advance", "beneficiary": "vendor-or-member-reference", "amountPaise": 2500000, "currency": "INR" }
```
Rules: validate category and beneficiary in same wedding; creator cannot self-approve; submit/approve are separate actions; approval route is Treasurer or both co-owners for Treasurer-related expense.

### Create photo upload batch intent
```http
POST /v1/photos/upload-intents
```
```json
{ "files": [{ "functionId": "...", "fileName": "photo.jpg", "mimeType": "image/jpeg", "byteSize": 2400000 }] }
```
One request is one upload batch. Server caps a guest at 5 files and a co-owner/organiser at 10, regardless of client selection. Each file is limited to 5,000,000 bytes (5 MB), JPEG or PNG. The request requires an `Idempotency-Key`; replaying it returns the same reservations. Response contains a short-lived presigned PUT URL, required headers, uploadId and expiry per file. Client uploads directly to private object storage; then calls completion for each upload. Completion is idempotent by uploadId. API verifies object metadata and queues byte-level signature/type validation, GPS EXIF stripping and moderation. Failed or partial batches return per-file outcomes and cannot create duplicate photo records on retry.

Shagun checkout handoff response details remain blocked on a provider-tested contract; do not invent Razorpay response fields. Refund/reversal request and approval operations remain blocked pending provider capability and product authorization policy.

### Payment webhook
```http
POST /v1/webhooks/payments/{providerId}
```
Rules: validate provider signature and timestamp; persist/deduplicate event; acknowledge quickly; process asynchronously; reconcile amount, currency, intent and beneficiary; only provider-verified final state creates verified contribution.

### Shagun provider and state policy
Razorpay is the approved Shagun provider and UPI is the only checkout method. NestJS creates the payment/order intent and fixes the INR amount and approved wedding recipient. Verify signatures and webhooks server-side, deduplicate provider events, reject replay, and reconcile amount, currency, intent and recipient before success. Keep pending, successful, failed and reconciliation-required states distinct. Client redirect, screenshot or manually entered transaction reference is never proof. Refund/reversal handling applies where supported by the approved workflow/provider; no unsupported capability is assumed. The platform does not hold funds. Provider account configuration, legal review and compliance verification are release gates.

## 14. Webhook and asynchronous processing
- Webhook ingress validates signature/replay window and persists inbox event before acknowledging.
- Outbox event is committed in same transaction as domain mutation.
- Dispatcher publishes to BullMQ; consumers use inbox/idempotency keys and retry-safe state transitions.
- External API calls occur outside MongoDB transactions.
- Dead-letter/failed events are observable and manually replayable through restricted operational tooling.

## 15. OpenAPI / Swagger and Postman usage
- Import `openapi.yaml` or `openapi.json` into Swagger UI, Redoc or Postman.
- Replace placeholder server URLs with deployed origins.
- Configure cookie auth/CSRF in the API test environment; browser cookie auth may not be fully testable from every API client.
- Treat schemas and endpoint descriptions as a contract baseline. Run OpenAPI linting and contract tests in CI.
- Do not publish internal admin/support endpoints or real provider webhook secrets in public API docs.

## 16. Product decisions deliberately standardised
- REST over GraphQL for pilot: aligns with workflow/state-transition APIs, predictable caching and OpenAPI tooling.
- `/v1` version prefix; JSON envelope; cursor pagination; stable error codes.
- Secure HttpOnly cookie sessions for browser clients; guest cookie sessions separate.
- Action endpoints for irreversible/high-governance transitions; no arbitrary status PATCH.
- Member API and guest API are separate security surfaces.
- Browser calls the Next.js BFF, which calls NestJS; NestJS is the only authorization authority.
- Brevo is approved for guest email OTP; use for other transactional email remains unspecified. Razorpay UPI-only is the approved Shagun path.
- Guest OTP is invitation-bound email only. OTP numeric expiry/resend/attempt and guest session duration values remain unresolved.
- Gallery source files are JPG/JPEG or PNG, 5 MB maximum per file; 5 guest / 10 co-owner-or-organiser files per upload batch. Dimensions and wedding quota remain deferred.
- No vendor account API, public photo API, WhatsApp notification API, or guest platform account API in v1.

## 17. Release checklist
- Every endpoint has an owner, permission requirement, DTO, response schema and error mapping.
- Cross-tenant access tests for every tenant resource and worker.
- Auth/session rotation, CSRF, rate-limit and account-enumeration tests.
- Idempotency and concurrent request tests for invitation, finance and payment operations.
- Provider webhook signature/replay tests and reconciliation tests.
- Photo upload content validation, EXIF removal, access and signed URL expiry tests.
- OpenAPI lint, generated client compatibility and backward-compatibility checks.
- Production URLs, CORS origins, cookie domain, rate policies, request size limits and observability configured.

## 18. Explicit unresolved implementation inputs
- Production API hostname and frontend origin (deployment decisions, not required to design the contract).
- Guest OTP provider is Brevo. OTP challenge persistence location (MongoDB as authority versus any provider-assisted storage) remains an internal architecture choice; provider must not become identity/session authority.
- Provider-tested Razorpay UPI checkout handoff and exact webhook/settlement contract; provider and UPI-only selection are approved, while integration/account enablement are release gates.
- Exact organiser permission catalogue and scope grammar, to be implemented from approved permission matrix.
- Approved upload format, file-size and batch limits are defined in §13. Image dimensions and per-wedding storage quota are explicitly deferred; do not promote suggested values.
- SLOs and numeric rate-limit thresholds, to be established from pilot measurements and load tests.
