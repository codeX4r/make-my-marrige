
# MakeMyMarrige — Final UI/UX Product Specification
**Version 3.0 | 5 November 2026 | Status: design handoff baseline (not a certification of production readiness)**

## 1. Product design objective
MakeMyMarrige is a family-first wedding planning workspace for co-owners, organisers, the Treasurer and invited guests. The experience must make wedding operations understandable, permission-safe and dependable while retaining a restrained Indian cultural character.

**Design principle:** operational clarity first; cultural expression second; decoration never competes with information.

## 2. Scope and design coverage
The handoff covers the wedding workspace and the mobile-first guest experience:
- Dashboard and workspace shell
- Functions and event details
- Tasks and dependencies
- Guests, households and guest correction workflow
- RSVP by guest and function
- Budget, expenses and Treasurer workflows
- Vendor discovery, shortlist, comparison, selection and booking states
- Digital Shagun (Razorpay; UPI only)
- Gallery, upload, moderation and permissions
- Approvals and dual-approval governance
- Team, organiser roles and permission scopes
- Notifications and activity
- Audit log, security and workspace settings
- Guest invitation, email OTP verification, event details, RSVP, gallery and Shagun contribution
- Responsive desktop, tablet and mobile layouts
- Loading, empty, success, error, offline, permission-denied and destructive-confirmation states

The screen inventory CSV is the source of truth for the 44-screen baseline and its route/module mapping. The existing 18 generated visual mockups are supplementary visual direction, not an editable design source.

## 3. Personas and permissions
### Co-owner
Owns the workspace, governance, high-impact decisions, finance oversight, vendor selection and permanent removal decisions. High-risk actions require both co-owners where defined by the product rules.

### Treasurer
Manages financial operations and ordinary expense approval. Finance visibility is limited to co-owners and Treasurer. Treasurer-created or beneficiary expenses require both co-owners.

### Organiser
Access is defined by explicit grants: **resource + action + optional function-level scope**. UI must not infer permissions from role labels alone. Hide inaccessible actions where possible, but preserve a clear permission-denied explanation when a deep link is opened.

### Guest
Uses a separate wedding-scoped guest session. Can view published functions, submit individual RSVP responses, submit permitted correction requests, view approved gallery content and use UPI Shagun where enabled. Guest identity verification via email OTP proves control of the email address, not legal identity.

### Permission UX rules
- Server is authoritative; client-side permission checks are presentation only.
- Resolve wedding tenant from authenticated membership/session, never trust a client-supplied weddingId.
- Do not reveal finance data in guest or unauthorised organiser views.
- Guest correction requester cannot approve their own correction.
- Guest merge requires dual co-owner approval.
- Co-owner and organiser actions must show scope and target function before commit.
- Dual approvals must show proposal snapshot, initiator, first approval, second approver, expiry and final outcome.
- Do not silently remove a member or consume an invitation when a membership conflict occurs.

## 4. Information architecture
### Workspace primary navigation
Dashboard; Functions; Tasks; Guests & Households; RSVP; Budget & Expenses; Vendors; Digital Shagun; Gallery; Approvals; Team & Permissions; Notifications; Activity; Audit Log & Security; Settings.

Desktop uses a persistent left sidebar and contextual top bar. Tablet uses collapsible navigation. Mobile uses a compact navigation pattern with a clear active destination and prioritised quick actions. Do not compress desktop tables into unreadable mobile tables; switch to cards or focused detail views.

### Guest portal
Invitation landing; email verification; guest home; event details; RSVP; approved gallery; Shagun contribution; profile/help. The guest portal is mobile-first and must not expose workspace navigation or internal finance/approval data.

## 5. Visual design system
### Brand direction
Modern Indian Minimalism: warm ivory surfaces, deep burgundy actions, restrained antique brass/terracotta accents, editorial serif for display moments, legible sans-serif for operational UI, and subtle architectural/geometric motifs. Avoid heavy maroon panels, ornamental data backgrounds, gold body text and decorative borders around every card.

### Tokens
- Background: `#FAF8F4`
- Surface: `#FFFFFF`
- Primary: `#7A2E42`
- Accent: `#BD9560`
- Text: `#282522`
- Muted: `#77716B`
- Border: `#EAE4DA`
- Success: `#287A52`
- Warning: `#A96816`
- Danger: `#B33A36`
- Info: `#356B9A`
- UI type: Inter (or equivalent accessible sans-serif)
- Editorial type: Playfair Display (or equivalent)
- Devanagari: Noto Sans Devanagari

### Layout and responsive behaviour
- Desktop breakpoint: >= 1280 px; full sidebar, dense but breathable tables.
- Tablet: 768–1279 px; collapsible sidebar, two-column cards where useful.
- Mobile: <= 767 px; single-column content, bottom navigation for guest flows, compact workspace navigation, sticky primary action only when it does not obscure content.
- Use 8-point spacing scale; content max-width 1440 px; standard form width 560–720 px; maintain 16 px minimum body text on mobile.
- Respect safe areas, keyboard focus, reduced motion and browser zoom.

### Components
Buttons (primary/secondary/tertiary/destructive); text fields; select/combobox; date/time pickers; currency inputs; search and filters; tabs; cards; data tables; status chips; avatars; breadcrumbs; side navigation; bottom navigation; dialogs; drawers; toasts; banners; pagination; skeletons; empty states; upload dropzone; image grid; approval timeline; audit event row; OTP input; confirmation step-up.

## 6. Module-level interaction requirements
### Dashboard
Needs-attention-first hierarchy: pending approvals, overdue tasks and unresolved blockers precede metrics. Show upcoming functions, RSVP summary and recent activity. Finance summary appears only to co-owners/Treasurer. Quick actions must be permission-aware. Every metric links to the filtered underlying list.

### Functions
Support draft, pending approval, published, cancelled and completed states as appropriate. Guests see published information only. Publishing and cancellation follow dual-approval rules. Preview the guest-facing function card before publication. Clearly label timezone as Asia/Kolkata.

### Tasks
Kanban/list views: To Do, In Progress, Blocked, Completed. Every task has title, description, category, priority, due date, linked function or explicit General wedding planning, multiple assignees, exactly one responsible owner, mandatory checklist and dependency handling. Completion requires checklist completion or an explicit permitted override. Reopening a completed task requires a reason. Show overdue state without relying on colour alone.

### Guests and households
Search by name/contact/household, filters and cursor pagination. Show household relationship and function-specific invitation state. Add/edit flows must prevent accidental duplicates. Guest correction requests are separate from direct edits; requester cannot approve own request. Household transfer preserves RSVP history. Phone OTP proves control of a number, not identity.

### RSVP
Individual response per guest per function; support partial household response. Extra guest requests require approval and must never silently create a guest. Distinguish invited, viewed, responded, declined and awaiting response. Avoid presenting aggregate RSVP as a substitute for individual records.

### Budget and expenses
Use INR. Store money in integer paise; format display consistently. Separate planned budget, committed amount, paid amount and remaining amount. Expense form must capture payee/vendor, category, amount, due/paid date, evidence where required and function link. Ordinary expense approval is Treasurer-only; Treasurer-created/beneficiary expense requires both co-owners. Avoid implying a vendor selection is a booking or that an expense is automatically created.

### Vendors
Separate discovery, shortlist, comparison, selection and booking. Use Google Places adapter and manually maintained records; label source and last-verified time. Quote is not contract; selection is not booking. Only co-owners select/remove selected vendor. Provide contact, quote, availability and booking status without overstating third-party verification.

### Digital Shagun
Razorpay selected; UPI only. Show verified destination details, purpose, wedding identity, contribution amount and clear payment state. Payment statuses: initiated, pending, succeeded, failed, expired, refunded/reversed where supported, and under review. UI must not accept screenshots or client-entered UTR as proof. Success is shown only after server-side provider verification/webhook/reconciliation. Never state that MakeMyMarrige holds funds. Show a neutral pending state while provider confirmation is unresolved.

### Gallery
Private media by default. JPG/JPEG and PNG only; maximum 5 MB per file. Recommended image dimension ceiling: 6000×6000 px and 24 MP (confirm before implementation). Guest maximum 5 photos per upload batch; co-owner/organiser maximum 10 per batch (prior decision interpreted as batch limit). Recommended workspace storage quota: 5 GB soft quota, warning at 90%, hard stop at 100% (confirm before implementation). Enforce file signature, MIME, extension, byte size and pixel dimensions; strip GPS EXIF; re-encode derivatives; malware/content scanning and moderation workflow; store originals privately in R2; short-lived authorised downloads. Guest uploads only to functions they are invited to. Guest can view/download approved photos from all functions. Co-owners decide permanent removal. Show upload progress, retry, partial failure and moderation status.

### Approvals and governance
Present approval queue with action, scope, proposer, created time, expiry, risk and required approvers. Dual approval requires two distinct co-owner accounts; initiator counts as first approval. Proposal snapshot/version is immutable. Expiry default recommendation: 7 days. Do not permit self-approval where explicitly prohibited. Confirmation must explain irreversible/high-impact effects.

### Team and permissions
Organiser grants are resource + action + optional function scope. Permission editor should use plain-language resource/action names and show effective access preview. Avoid raw JSON or cryptic permission strings in the UI. Require explicit confirmation when reducing/removing access. Membership states ACTIVE, SUSPENDED, ENDED. Suspended membership occupies the one-active-wedding membership slot.

### Notifications, activity and audit
In-app notifications initially; polling is acceptable for first release. Deep links must re-check permission. Activity is contextual and readable; audit log is append-only and co-owner-only. Sensitive exports require dual co-owner approval. Do not expose security-sensitive event details to guests.

### Settings and lifecycle
Provide workspace profile, wedding date/timezone, member/session security, notification preferences, connected providers and data lifecycle. Post-wedding deletion is proposed for 00:00 IST on day 31 after wedding date with 7-day notice; legal/operational approval is a release blocker. Backup retention proposal is maximum 30 days after deletion, subject to counsel/provider review. Clearly distinguish scheduled, cancelled and completed deletion. Cancellation is dual-approved and irreversible under current product rules.

## 7. Authentication and provider UX
### Brevo email OTP
Use email OTP for guest invitation verification and applicable email verification. OTP UI needs six-digit input, paste support, auto-advance, resend countdown, expiry, attempt limit, accessible error messages and change-email path. Do not reveal whether an email is registered. Use transactional templates with wedding name, action, expiry and support route. Credentials and sending domain configuration remain deployment work.

### Razorpay UPI-only
Expose only UPI as the payment method. Provider checkout should be initiated server-side. Verify checkout signature and webhook signatures server-side; deduplicate webhook events; reconcile uncertain states; make payment creation idempotent. Keep provider IDs and status separate from user-facing receipt number. Razorpay account enablement, product approval, fee disclosure, merchant classification, refund/chargeback and applicable legal review remain launch gates.

## 8. Content, forms and validation
- Use sentence case, plain language and specific action labels.
- Avoid vague destructive actions such as “Proceed”; use “Cancel function” or “Remove organiser”.
- For financial actions, show amount, currency, payee, function and approval state before confirmation.
- Inline validation should explain how to fix the problem; preserve safe user input after recoverable errors.
- Never show raw stack traces, provider secrets or internal database identifiers.
- Dates/times display in Asia/Kolkata; API instants remain UTC.
- Currency input accepts INR decimal entry but persists integer paise.
- Do not rely on colour alone for status; pair with text/icon.

## 9. UX states and edge cases
Every route must specify:
1. Initial loading/skeleton
2. Empty state with relevant next action
3. Populated state
4. Validation error
5. Server/provider error with retry guidance
6. Permission denied
7. Offline/degraded connectivity
8. Stale/conflict state (optimistic version/If-Match)
9. Success confirmation
10. Destructive confirmation/undo where safe

Critical edge cases: invitation expired/revoked; email OTP delayed/invalid/expired/rate-limited; membership conflict; stale approval proposal; co-owner unavailable; task dependency cycle; duplicate guest; household transfer; RSVP changed after cutoff; Razorpay pending webhook; duplicate webhook; payment mismatch; upload interrupted; quota exceeded; file spoofing; moderation rejection; expired signed URL; deletion already scheduled; restore after tombstone.

## 10. Accessibility and quality bar
Target WCAG 2.2 AA. Keyboard-operable controls, visible focus, semantic headings, labelled inputs, descriptive errors, accessible dialogs, 4.5:1 normal text contrast, reduced motion, touch targets around 44×44 CSS px, alt text for meaningful images and screen-reader announcements for async status. Test zoom/reflow at 200% and mobile screen readers.

## 11. Analytics and usability instrumentation
Track product events without sensitive payloads: onboarding completed, invitation accepted, OTP verified/failed, task created/completed/reopened, RSVP submitted, approval requested/approved/rejected/expired, vendor shortlisted/selected/booked, Shagun initiated/verified/failed, photo upload/moderation outcomes, deletion scheduled/cancelled/completed. Never log OTPs, payment secrets, full UPI IDs, private image URLs or unnecessary personal data.

## 12. Developer handoff rules
- Next.js + TypeScript App Router; server is authoritative for permissions.
- NestJS REST API and OpenAPI 3.1 are the contract baseline; UI must not invent endpoints.
- Shared UI components and design tokens should be implemented before feature screens.
- Use feature-owned components, hooks, schemas and API services.
- Use cursor pagination; preserve filter/sort state in URL where safe.
- Optimistic updates only for reversible low-risk actions; use server-confirmed flows for money, approvals, governance, deletion and membership.
- Use request IDs in error surfaces/support logs; do not expose internal IDs to guests.
- Build visual regression, accessibility, contract and end-to-end tests for high-risk flows.
- Test tenant isolation and permission changes through API tests, not only UI tests.

## 13. Acceptance criteria
A screen is handoff-complete only when it has: route/entry point; persona and permission; purpose; layout hierarchy; component inventory; responsive behaviour; field definitions and validation; action/result mapping; loading/empty/error/success/denied states; analytics events; accessibility notes; API contract references; test scenarios; copy strings.
A module is release-ready only after implementation, API contract tests, permission tests, accessibility review, visual QA, analytics verification and product-owner sign-off.

## 14. Release blockers / decisions still requiring confirmation
1. Confirm recommended photo dimension ceiling (6000×6000 / 24 MP).
2. Confirm 5 GB per-wedding storage quota and 90% warning threshold.
3. Confirm upload count is per batch, not per function or lifetime.
4. Complete Razorpay account enablement, UPI-only configuration, webhook setup, refund/chargeback and compliance review.
5. Configure Brevo sending domain, templates, deliverability and secrets.
6. Legal/operational approval for deletion, audit/payment retention, backups and restore suppression.
7. Replace temporary brand assets when final identity is ready.
8. Verify all screen routes and actions against final OpenAPI contract and implemented backend.

**Important status statement:** this package is a detailed UI/UX design and developer-handoff baseline. It does not itself create a Figma project, implement the application, configure provider accounts, perform a legal review, or certify production readiness.
