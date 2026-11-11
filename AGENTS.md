# MakeMyMarrige — Agent Instructions

## Product and current implementation

MakeMyMarrige is a wedding planning and coordination platform initially targeted at Kanpur, Uttar Pradesh, India. A wedding is one multi-tenant workspace; workspace members are not external guests. The primary workspace persona is a co-owner, with organiser and Treasurer roles, plus a separate guest experience. Product domains include planning, functions, households, guests/RSVPs, tasks, budget/expenses, vendors, gallery, Shagun, governance, notifications, and lifecycle management.

Implemented today: the monorepo foundation, Next.js BFF, NestJS operational health/database boundary, worker Redis/BullMQ boundary, and Milestone 2.1 Mongoose persistence schemas for users, provider identities, weddings, memberships/history, and co-owner invitations. Do not describe product HTTP endpoints, member authentication, guest OTP, sessions, email delivery, payment processing, or frontend product screens as implemented unless the source code proves it.

## Approved stack

- Node.js 22 and pnpm 12 workspaces; TypeScript throughout.
- `apps/web`: Next.js App Router, React, Tailwind CSS.
- `apps/api` and `apps/worker`: NestJS.
- MongoDB/Mongoose; local development uses a single-node replica set.
- Redis/BullMQ for asynchronous work.
- REST with OpenAPI 3.1, canonical NestJS path prefix `/v1`.
- Vitest is the currently installed test runner. The approved wider test direction includes Jest/Vitest, Supertest, and Playwright; do not add a framework without a concrete need.

MongoDB Atlas, private Cloudflare R2 storage, a Google Places adapter, and PWA delivery appear in product/design material but are not implemented in this repository. The reconciled architecture does not select a production hosting, region, or deployment provider. Treat those as planned/deployment-gated unless a later approved decision explicitly closes them. Razorpay UPI-only Shagun, Brevo guest OTP, and Brevo member verification/password-reset delivery are approved choices, but no provider integration exists yet.

Do not introduce microservices, GraphQL, alternative databases, package managers, auth providers, or storage/payment/email vendors without an approved requirement and documented trade-off.

## Workspace boundaries

- `apps/web`: browser UI and same-origin BFF routes only. Keep server-only code out of client bundles.
- `apps/api`: NestJS authorization and domain boundary; it owns validation, tenant resolution, permission checks, mutations, audit, and domain errors.
- `apps/worker`: standalone background processing boundary; it must not report ready when Redis is unavailable.
- `packages/config`, `packages/logger`, `packages/observability`: shared infrastructure utilities. Do not place product-domain behavior here.
- `infrastructure/docker`: local MongoDB replica set and Redis only.
- `tests/integration`: real-infrastructure smoke/integration tests.

Applications must not import one another's implementation internals. Use explicitly exported shared-package contracts. Avoid circular dependencies.

## Architecture and BFF rules

The approved browser boundary is Browser → Next.js BFF (`/api/v1/*`) → NestJS REST API (`/v1/*`). The BFF is controlled, not an open proxy: preserve its route allowlist, upstream timeout/cancellation, body limits, request/header/query forwarding rules, no-store behavior, and sanitized errors. `API_BASE_URL` is server-only; never expose it through `NEXT_PUBLIC_*`, `next.config` public env, or client components.

NestJS, not Next.js, is the authorization authority. Preserve request IDs, structured/redacted logging, validation, error envelopes, liveness/readiness separation, and graceful shutdown.

## Tenancy, authorization, and security

- Treat every wedding-owned record as tenant-scoped by `weddingId`.
- Derive wedding/member/guest context server-side; never trust a client-supplied tenant, membership, guest, role, or permission as authority.
- Default deny and verify same-wedding relationships for every read and mutation.
- Keep member identity/session handling separate from guest invitation-bound email OTP handling. Guest email OTP and Brevo are approved product choices, but their flows are not implemented. Member Google OAuth production enablement is unresolved.
- Member sessions use a 15-minute access token and a seven-day inactivity-based refresh token. Rotate refresh tokens, revoke the token family on reuse detection, use Secure/HttpOnly production cookies, and protect unsafe requests with a synchronizer token plus Origin validation. Google OAuth uses Authorization Code + PKCE through the BFF. Exact cookie names/scopes, token persistence, synchronizer-token transport, and BFF-to-Nest forwarding remain unresolved implementation design.
- Never log secrets, raw passwords, OTPs, session tokens, invitation tokens, payment data, or provider webhook secrets. Store only token hashes where the schema requires hashes.
- Platform administration/support access is deny-by-default and must be case-bound, narrowly scoped, time-limited, and audited once its unresolved actor/approval policy is approved; do not add an implicit platform bypass.
- Exactly two active co-owners and one active Treasurer per operational wedding are approved invariants. Do not create a governance bootstrap bypass. The cross-document exact-count enforcement design remains a later governance task.

## Database standards

- Use Mongoose schemas with validation, explicit indexes, timestamps, optimistic versioning where documented, and bounded collections/queries.
- Use MongoDB replica-set transactions for multi-document invariants. External calls belong outside transactions; use outbox/inbox patterns for side effects.
- Do not assume a unique index can enforce arbitrary cross-document counts. Use conditional updates plus a serialized wedding-root/guard transaction where the design requires it.
- Expiry must be checked by application logic; TTL cleanup is asynchronous and not an authorization mechanism.
- Preserve history records; do not replace append-only audit/period/event history with unbounded embedded arrays.

## API and contract rules

- `/v1` is canonical. Keep the BFF route distinct as `/api/v1`.
- The active API contract is `docs/04-api-design/specifications/openapi.yaml` and `.json`, version 1.1.0, read with `API_Documentation_v1.1.md`.
- Add or change an API operation only when its request/response/error/permission/tenant/idempotency/optimistic-concurrency behavior is specified and OpenAPI YAML and JSON stay synchronized.
- Use stable error codes, JSON envelopes, cursor pagination where applicable, and action endpoints for governed or irreversible transitions. Do not create arbitrary status PATCH operations.
- Validate OpenAPI syntax, references, unique operation IDs, and YAML/JSON alignment whenever those contracts change.

## Frontend rules

- Use Next.js App Router, TypeScript, and Tailwind. Keep privileged browser calls behind the BFF.
- Read UI layout/interactions from UI/UX v5.0 plus its v5.1 reconciliation and versioned v5.1 CSV contracts. Read permissions from the role matrix, constrained by PRD/ADR/API authority.
- Do not implement guest phone OTP, WebP uploads, image dimensions/quota, provider checkout fields, or support-recovery UX as fixed behavior: those are superseded, deferred, blocked, or unresolved as documented.

### UI context

The approved visual direction is **Modern Indian Minimalism**. The v5.0 handoff defines the visual baseline: background `#FAF8F4`, surface `#FFFFFF`, primary `#7A2E42`, accent `#BD9560`, text `#282522`, muted `#77716B`, and border `#EAE4DA`; use Inter for UI, Playfair Display for editorial headings, and Noto Sans Devanagari where appropriate. Keep the workspace operational and restrained; the guest experience may be more expressive. Avoid large maroon header blocks, ornamental data backgrounds, and excessive borders/shadows. Use a persistent desktop sidebar and compact mobile navigation where a screen specification calls for them.

The documented Hybrid Dashboard order is Needs Attention, Wedding Overview, Upcoming Functions, Planning Progress, Finance Summary, Recent Activity, then Quick Actions. Do not fabricate dashboard metrics or actionable counts: production UI data must come from an authorised backend contract. Finance remains restricted to co-owners and the active Treasurer.

## Approved business rules and incomplete workflows

Apply these rules only through their detailed domain contracts; listing them here does not authorize implementation of a missing workflow.

- The approved operational invariant is exactly two active co-owners and exactly one active Treasurer. A `SUSPENDED` membership still occupies the user's active wedding-membership slot. Co-owner invitation persistence uses fixed `CO_OWNER`, exact normalized email, a hashed single-use token, and a seven-day expiry.
- Dual approval requires two distinct active co-owner accounts. Expense, function publication/cancellation, RSVP, guest correction, vendor, and task rules must follow the current API/database/UI contract rather than UI-only assumptions.
- Normal expenses require Treasurer approval; Treasurer-created or beneficiary-conflicted expenses require both co-owners. Persist money as integer paise.
- RSVP is per guest per function. Extra-guest requests require approval; vendor selection is not a booking and a quote is not a contract.
- Shagun succeeds only after server-side provider verification; never accept redirects, screenshots, or manually supplied references as proof.
- Gallery input is JPG/JPEG or PNG, at most 5,000,000 bytes, with batch caps of 5 for guests and 10 for co-owner/organiser. Use private storage, authorised short-lived downloads, server-side type/signature validation, and GPS EXIF removal. Guests upload only to functions to which they are invited.
- Do not hard-code task responsible-owner timing, organiser invitation behavior, Treasurer bootstrap/replacement, function-cancellation payloads, workspace deletion policy, or guest invitation/session mechanics: the current documents mark material parts of these as blocked or approval-required.

## Testing and verification

- Add unit tests beside source (`*.spec.ts`) and use real MongoDB replica-set/Redis integration tests for transactions and queue behavior. Do not replace transaction coverage with mocks.
- Run the narrowest relevant checks during development. Before handoff, run applicable formatting, lint, typecheck, unit tests, integration tests with services available, and affected production builds.
- Root commands: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, and `pnpm build` (or `pnpm check` when the existing baseline permits it).
- Report blocked infrastructure tests honestly; do not call a test passed because a script exists or because a test was skipped.

## Engineering implementation standards

- Inspect existing code, folder conventions, and dependencies before adding files or packages. Use strict TypeScript; avoid unnecessary `any`.
- Keep NestJS controllers thin. Put domain rules in the owning domain module, not controllers, React components, or shared infrastructure packages.
- Validate every external input and enforce authorization and tenant isolation on the server. Use structured logging and request IDs without leaking sensitive values.
- Write unit tests for business rules; write real persistence/transaction integration tests where state spans documents; add authorization and cross-tenant isolation tests for protected operations.
- Preserve backward compatibility unless a breaking contract change is explicitly approved. Do not weaken tests or validation merely to make a build pass.

## Documentation authority and maintenance

Before deciding, coding, or editing, inspect the relevant current documentation. Use this precedence: latest explicitly approved reconciliation and decision-register clauses; current approved product requirements; current architecture and technical policy documents; database/API contracts; workflows/UI specifications; then implementation only where it does not contradict those sources. Use the latest explicitly versioned document in each family; consult earlier versions only for gaps, never to override a newer explicit clause.

Authority by concern:

- Product: `docs/01-requirements/MakeMyMarrige_PRD_Reconciliation_v2.1.md` plus non-conflicting PRD v2.0.
- Architecture/security/ADRs: `docs/02-system-architecture/documents/System_Design_Architecture_Reconciliation_v2.1.md` and `architecture-decision-register-v2.1.md`.
- Database: `docs/03-database-design/documents/MakeMyMarrige_Database_Schema_Design_v1.1.md` plus non-conflicting v1.0.
- API: API documentation v1.1 and OpenAPI YAML/JSON.
- UI: UI/UX reconciliation v5.1, v5.1 CSVs, and v5.0 layout master.
- Workflows: latest applicable documents under `docs/05-business-workflows/`.

The technical policy register is proposal-only unless an approved ADR/PRD clause explicitly closes an item. Record conflicts with exact paths/sections and stop for product-owner direction rather than silently resolving them. If an explicit user approval has not been reconciled into the documents, treat documentation reconciliation as required before implementing the affected policy. Preserve historical PDF, DOCX, ZIP, diagrams, and prior versions; do not rewrite them unless explicitly asked. Update affected active documentation with implementation changes and clearly label implemented, planned, blocked, and unresolved work.

## Change and Git safety

- Inspect `git status --short` before editing. Preserve unrelated tracked/untracked user changes.
- Do not reset, checkout, clean, delete volumes/data, rewrite history, commit, push, or alter Git configuration unless explicitly authorized.
- Do not install or upgrade dependencies, regenerate lockfiles, or add secrets without explicit approval.
- Keep `.env` values private. Do not commit generated output, `dist`, `.next`, coverage, logs, local databases, or credentials.
- Prefer focused changes; avoid broad refactors outside the requested milestone.

## Handoff report

For every task: read this file; inspect applicable authority documents, implementation, and `git status`; identify dependencies/unresolved decisions; state scope and out-of-scope work; make the smallest coherent change; add relevant tests; update affected contracts/docs; run applicable verification; then stop after reporting the next logical task rather than starting it automatically.

Report separately: implemented, unit tested, integration tested, runtime verified, blocked, and not implemented. Include files changed, documentation/contracts/indexes affected, exact verification commands and results, skipped checks, assumptions, unresolved decisions, risks, and follow-up. A successful typecheck/build does not prove runtime correctness, and skipped integration tests do not pass. Never claim an approval, migration, provider integration, or production readiness that was not actually verified.
