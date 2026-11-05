# MakeMyMarrige — Full Product UI/UX Master Handoff
**Version 5.0 | 5 November 2026 | Consolidated product-wide design baseline**

## Document purpose and status
This is the consolidated UI/UX handoff for the MakeMyMarrige product as designed and specified to date. It combines the approved product direction, workspace and guest experience, design system, 44-screen inventory and screen-level specifications, reusable component catalogue, critical workflows, role permissions, edge-state matrix, QA checklist, interactive prototype, visual references, and linked PRD/system/API/database source documents.

**Status:** design-definition handoff ready to guide implementation. It is not a claim that frontend/backend implementation is complete, that a Figma source file exists, or that payment, legal, security or provider reviews have passed. The HTML prototype is illustrative and uses sample data.

## 1. Product and experience strategy
MakeMyMarrige is a family-first wedding planning and coordination product. It supports a private wedding workspace for co-owners, Treasurer and scoped organisers, plus a separate mobile-first guest experience. It is designed to coordinate functions, tasks, guest lists, RSVP, vendors, budgets, expenses, Shagun, gallery, governance and post-wedding lifecycle.

### Experience goals
- Make the next important action obvious; prioritise pending approvals, overdue tasks and blockers over vanity metrics.
- Make role boundaries understandable and enforce them consistently.
- Keep guest journeys simple, invitation-led and mobile-first.
- Treat financial, identity, governance and deletion actions as high-risk workflows.
- Preserve Indian cultural character through restrained visual language rather than decorative overload.
- Provide explicit feedback for all asynchronous, failed, denied and conflicting actions.

### Design principle
Operational clarity first; cultural expression second; decoration never competes with information.

## 2. Personas and experience surfaces
### Co-owner
Primary workspace owner and governance actor. Can manage workspace, functions, guest records, vendor selection, gallery moderation/removal and high-impact approvals. Some actions require both distinct co-owner accounts.

### Treasurer
Finance operations role. Finance visibility is restricted to co-owners and Treasurer. Ordinary expense approval is Treasurer-only; Treasurer-created or beneficiary expenses require both co-owners.

### Organiser
A delegated workspace user. Permissions are explicit grants expressed as **resource + action + optional function-level scope**. Role labels alone do not grant access.

### Guest
A separate wedding-scoped guest session. Guests see published function information only, respond individually per function, submit allowed correction requests, view approved gallery media and use UPI Shagun where enabled. Email OTP proves control of the email channel, not legal identity.

### Main surfaces
1. Workspace web app: desktop-first operational console, responsive to tablet/mobile.
2. Guest portal: mobile-first, invitation-led, isolated from workspace administration and finance data.
3. Operational notifications/deep links: every deep link revalidates current access.

## 3. Information architecture
### Workspace navigation
Dashboard; Functions; Tasks; Guests & Households; RSVP; Budget & Expenses; Vendors; Digital Shagun; Gallery; Approvals; Team & Permissions; Notifications; Activity; Audit Log & Security; Settings.

Desktop: persistent sidebar and contextual top bar. Tablet: collapsible navigation. Mobile: compact navigation and focused detail screens. Avoid forcing wide desktop tables onto mobile; use labelled cards or focused detail views.

### Guest portal navigation
Invitation landing; email verification; guest home; published function details; individual RSVP; approved gallery; Shagun contribution; profile/help. Do not show workspace sidebar, internal approval state, private finance data or unpublished event information.

## 4. End-to-end journeys
### Workspace onboarding
Create workspace → verify co-owner account → invite second co-owner → second co-owner accepts invitation → workspace becomes operational. Invitations are single-use opaque tokens with 7-day expiry and exact verified email matching. A membership conflict must return 409 and must not consume or revoke the pending invitation.

### Organiser governance
Co-owner proposes organiser invitation or permission change → immutable proposal snapshot → first co-owner approval (initiator may count) → second distinct co-owner approval → apply grant → audit event. Scope editor uses resource, action and optional function. No wildcard scope should be implied.

### Function lifecycle
Draft function → add date/time/venue/details/invitees → preview guest view → request publication approval → two distinct co-owner approvals → publish immutable guest snapshot. Cancellation follows dual approval. Guests only see published snapshots.

### Task lifecycle
Create task → link to function or General wedding planning → assign one responsible owner and optional additional assignees → define mandatory checklist and dependencies → work through To Do/In Progress/Blocked/Completed → complete only when requirements met → reopening requires a reason. Dependency graph must be acyclic.

### Guest and household lifecycle
Create/import guest → assign household → set primary and secondary tags → invite to functions → guest verifies invitation via email OTP → RSVP individually. Correction requests are reviewed by someone other than requester. Guest merge requires dual co-owner approval. Household transfer preserves individual RSVP history.

### RSVP lifecycle
Invitation → guest opens published function → responds individually per function → optional partial household completion → aggregate rollups update. Extra guest requests are separate approval workflows and never silently create a guest.

### Vendor lifecycle
Discover (Google Places/manual record) → shortlist → compare → select → book. These are distinct states. Selection is not booking; quote is not contract. Only co-owners select/remove selected vendors.

### Expense lifecycle
Draft expense → submit → approval according to creator/beneficiary rule → Treasurer or dual co-owner approval → record paid state/evidence → reconcile budget. Store INR in integer paise. Do not infer approval from payment evidence.

### Shagun lifecycle
Guest sees approved recipient details → enters amount → Razorpay checkout with UPI only → provider status may remain pending → backend verifies signatures/webhooks and reconciles → verified status/receipt shown. Redirect, screenshot or client-entered UTR is never proof. Platform must not claim to hold funds.

### Gallery lifecycle
Guest/member selects allowed photos → upload validation (JPG/PNG, <=5 MB each) → private object storage → technical checks and GPS EXIF stripping → moderation where required → approved photos appear to authorised guest audience. Guests can upload only to functions they are invited to. Guests may view approved photos from all functions. Co-owners decide permanent removal.

### Workspace lifecycle
Wedding date passes → notice and scheduled deletion policy applies → dual-approved cancellation only where permitted → deletion workflow revokes access and tombstones workspace → backup expiry and restore suppression follow legally approved policy. Current proposal: deletion at 00:00 IST on day 31 after wedding date, 7-day notice, backup maximum 30 days after deletion; legal/operational approval remains a release blocker.

## 5. Screen inventory and detailed screen specifications
The screen inventory and `screen_level_specification.csv` are the authoritative screen-level design catalogue for the 44 inventoried screens. Each entry includes area, module, screen, primary role, priority, responsive targets, required content/components, key interactions, detailed behaviour, required states and acceptance criteria.

**Screen-level implementation rule:** do not build a screen from its title or mockup alone. Use the matching row in `02_Screen_Specifications/screen_level_specification.csv` and validate every action against the OpenAPI contract in the reference package.

## 6. Module-specific UX requirements
### Dashboard
Needs-attention-first. Pending approvals, overdue tasks and blockers precede metrics. Finance summary only for co-owners/Treasurer. Every metric links to its filtered source list. Quick actions are permission-aware.

### Functions
Function details include overview, schedule, venue, invitees, linked tasks and publication state. Explicitly label Asia/Kolkata. Guest-visible data comes from published snapshots only.

### Tasks
Board/list/calendar views. Every task has title, description, category, priority, due date, linked function or General planning scope, multiple assignees, exactly one responsible owner, mandatory checklist and dependencies. Completion/reopen rules are explicit.

### Guests and households
Search, filters, household context, contact verification and function invitation states. One primary tag and multiple secondary tags. Correction and merge workflows are governed; no self-approval.

### RSVP
Individual response per guest per function. Household responses may be partial. Extra guest requests are separately approved.

### Budget and expenses
Show planned, committed, paid and remaining separately. Finance role gating is strict. Persist money as integer paise; format INR consistently. Ordinary expense approval is Treasurer-only; Treasurer-created/beneficiary expense requires both co-owners.

### Vendors
Clearly label Google Places sourced information versus manually maintained records and last-verified time. Distinguish shortlist, compare, selection and booking.

### Digital Shagun
Razorpay selected; UPI only. Server-side order creation, signature and webhook verification, idempotency, replay protection and reconciliation required. No client-side proof of payment.

### Gallery
JPG/JPEG and PNG only; max 5 MB per file. Guest cap 5 and co-owner/organiser cap 10 per upload batch (the current interpretation). Strip GPS EXIF, validate file signature/MIME/extension and dimensions, store privately and use short-lived authorised downloads. Image dimension ceiling of 6000×6000 / 24 MP and 5 GB workspace quota are recommendations pending confirmation.

### Governance and permissions
Dual approvals require two distinct co-owner accounts; initiator counts as first approval where policy says so. Proposal snapshots are immutable; 7-day expiry is recommended. Organiser permission editor is resource + action + optional function scope. All sensitive decisions are audited.

### Notifications and audit
In-app notifications initially; polling acceptable for first release. Deep links recheck permission. Audit is append-only and co-owner-only; sensitive export requires dual co-owner approval.

### Settings and lifecycle
Separate workspace settings from personal profile/session settings. High-impact changes require clear consequences and appropriate approvals. Deletion is not launch-ready until legal/operational review is signed off.

## 7. Design system and visual language
### Modern Indian Minimalism
Warm ivory/off-white dominant surfaces, burgundy primary actions, restrained antique brass/terracotta accents, modern sans-serif operational UI, selective editorial serif, and subtle Indian architectural/geometric motifs. Avoid heavy maroon headers, ornamental data backgrounds, gold body text and excessive borders/shadows.

### Design tokens
- Background `#FAF8F4`; surface `#FFFFFF`; primary `#7A2E42`; accent `#BD9560`.
- Text `#282522`; muted `#77716B`; border `#EAE4DA`.
- Success `#287A52`; warning `#A96816`; danger `#B33A36`; info `#356B9A`.
- Inter UI; Playfair Display editorial; Noto Sans Devanagari.
- 8-point spacing scale; 8/12/16 radius family; subtle overlay shadows.
- Desktop >=1280 px; tablet 768–1279 px; mobile <=767 px.
- 44×44 CSS px touch targets; minimum 16 px body text on mobile.

### Component system
The component catalogue in `03_Design_System/component_inventory.csv` defines navigation, data display, forms, overlays, feedback, gallery, governance, finance, payment and system components. Shared components must be implemented before feature-specific screen styling. Avoid one-off controls where a shared component exists.

## 8. Responsive behaviour
- Desktop: persistent sidebar, full tables, contextual panels.
- Tablet: collapsible sidebar, reduced table columns, accessible filters.
- Mobile: single-column layout, tables convert to labelled cards, complex forms become full-screen, guest portal bottom navigation, safe-area-aware sticky actions.
- No core task should require horizontal scrolling.
- Test at 200% zoom and with on-screen keyboard open.

## 9. Content and interaction standards
- Sentence case, plain language and specific action labels.
- One dominant primary action per view.
- Destructive actions are visually separated and explain consequence.
- Labels persist; placeholders are examples only.
- Preserve safe user input after recoverable errors.
- Never expose stack traces, secrets, OTPs or internal database identifiers.
- Dates/times display in Asia/Kolkata; backend instants remain UTC.
- Colour is never the sole indicator of state.
- Use optimistic UI only for reversible low-risk operations. Money, governance, membership, approval and deletion must be server-confirmed.

## 10. Global state and error coverage
Every screen must implement: loading skeleton; first-use empty; filtered empty; populated; validation error; server/provider error; permission denied; offline/degraded; stale/conflict; success; destructive confirmation where applicable. The per-screen state matrix is in `06_QA_and_Implementation/screen_state_coverage.csv`.

Critical cases include expired/revoked invitation, wrong invited email, delayed/expired/rate-limited OTP, membership conflict, stale approval proposal, duplicate co-owner approval, dependency cycle, duplicate guest, household transfer, RSVP changes, Razorpay pending webhook, duplicate webhook, amount mismatch, upload interruption, quota exceeded, spoofed file, moderation rejection, expired signed URL and deletion tombstone/restore.

## 11. Accessibility and usability
Target WCAG 2.2 AA: keyboard operability, visible focus, semantic headings/landmarks, persistent labels, descriptive errors, accessible dialogs, focus return, 4.5:1 normal text contrast, reduced motion, screen-reader announcements, meaningful alt text, 44×44 touch targets and 200% zoom/reflow. Conduct moderated usability testing with representative co-owners, organisers, Treasurer and guests.

## 12. Analytics and privacy
Track only product events needed for funnel and operational quality: onboarding, invitation acceptance, OTP outcomes, task lifecycle, RSVP, approval, vendor selection/booking, Shagun provider outcomes, gallery upload/moderation and deletion lifecycle. Never log OTPs, provider secrets, full UPI identifiers, private image URLs or unnecessary personal data.

## 13. Developer handoff and implementation sequence
1. Foundations: tokens, typography, app shell, navigation, shared components, authentication and permission-aware routing.
2. Core operations: dashboard, functions, tasks, guests/households and RSVP.
3. Governance: approvals, organiser scope editor, membership controls.
4. Finance: budget, expenses and Shagun.
5. Supporting modules: vendors, gallery, notifications, audit and settings.
6. Guest portal: invitation, Brevo email OTP, published functions, RSVP, gallery and Shagun.
7. Cross-cutting QA: API contract, tenant isolation, role matrix, responsive, accessibility and visual regression.

Stack baseline: Next.js + TypeScript App Router frontend; NestJS REST API; MongoDB Atlas; Redis/BullMQ for jobs; Cloudflare R2 private media; Google Places adapter/manual vendor records. OpenAPI 3.1 is the API contract baseline. Do not invent routes or payloads; map each UI action to the actual contract.

## 14. Definition of done
A screen is implementation-complete only when it has a route/entry point, persona and permission, purpose, content hierarchy, component inventory, responsive behaviour, field definitions/validation, action/result mapping, all relevant states, analytics events, accessibility notes, API contract references and test scenarios.

A module is release-ready only after implementation, API contract tests, tenant and permission tests, accessibility review, visual QA, analytics verification and product-owner sign-off.

## 15. Decisions and release gates
### Confirmed
- Email OTP provider: Brevo.
- Shagun provider: Razorpay, UPI only.
- Gallery formats: JPG/JPEG and PNG.
- Maximum file size: 5 MB per file.
- Guest upload cap: 5 photos per batch.
- Co-owner/organiser upload cap: 10 photos per batch.
- Organiser permission model: resource + action + optional function-level scope.
- Vendor discovery: Google Places + manually maintained records.
- Brand assets: temporary default treatment; final identity can replace later.
- Deletion policy: legal/operational review required before launch.

### Recommended but not yet approved
- Maximum image dimensions: 6000×6000 px and 24 MP.
- Workspace storage quota: 5 GB per wedding; warning at 90%; hard stop at 100%.
- Batch caps interpreted per upload batch, not lifetime/per-function cap.

### External/release blockers
- Brevo sender domain, templates, deliverability, rate limits and secret management.
- Razorpay account enablement, UPI-only checkout, webhook/signature verification, refunds/reconciliation and compliance review.
- Legal approval for deletion, payment/audit retention, backups and restore suppression.
- Actual frontend implementation and API verification.
- Real-user usability testing and WCAG 2.2 AA audit.
- Final brand identity.

## 16. Included package map
- `01_Product_and_Experience/`: product strategy and journey documentation.
- `02_Screen_Specifications/`: screen inventory, 44 screen-level specifications, role matrix, critical flows and decision logs.
- `03_Design_System/`: design tokens, component inventory and design-system implementation rules.
- `04_Flows_and_Permissions/`: workflow and permission references.
- `05_Prototype_and_Mockups/`: clickable HTML prototype and all available visual reference mockups.
- `06_QA_and_Implementation/`: screen state coverage and implementation readiness checklist.
- `07_Reference_Contracts/`: PRD, system design, database design, API package and diagram compendium.

**Final status:** This is the consolidated UI/UX handoff for the product as designed to date. It is suitable as the design baseline for implementation planning and frontend development, subject to the explicit release gates above.
