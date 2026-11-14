# Milestone Tracker

Milestones below follow explicit project authority. This tracker does not assign
new milestone numbers or silently turn an implementation branch into a
milestone.

| ID / milestone | Scope | Status | Verification status | Dependencies / blockers | Next action | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| M2.1 — Identity and workspace persistence baseline | User/provider identity, wedding, membership/history, and co-owner invitation persistence schemas and indexes. This does not imply complete onboarding or cross-document governance enforcement. | `VERIFIED_UNIT` | `VERIFIED_UNIT` | Integration and runtime evidence remain unavailable in this audit; exact-count enforcement is a later governance design. | Run the existing persistence integration tests against explicitly isolated replica-set test services and record results. | [DB design v1.1](../03-database-design/documents/MakeMyMarrige_Database_Schema_Design_v1.1.md); [persistence source](../../apps/api/src/identity/persistence/); [unit suite](../../apps/api/src/identity/persistence/schemas.spec.ts). |
| Unnumbered operational foundation (workstream, not an approved milestone) | Workspace tooling, Next.js BFF, Nest health/database readiness boundary, worker Redis/BullMQ readiness boundary, and shared packages. | `VERIFIED_UNIT` | `VERIFIED_UNIT` | No production runtime or integration verification. | Fix the CI formatting gate, then establish skipped lint/typecheck/build results. | [web app](../../apps/web/src/); [API app](../../apps/api/src/); [worker app](../../apps/worker/src/); [packages](../../packages/). |
| Member authentication/session hardening (no approved milestone ID found) | Existing member auth, session, verification/reset, CSRF, route protection, and logout behavior. | `IN_PROGRESS` | `IMPLEMENTED_UNVERIFIED` | Refresh-family transaction behavior, email route/template mismatch, rate limits, CSRF/Origin coverage, and logout-all semantics require work or clarification. | Complete `PM-001` through `PM-005` in the [task backlog](./TASK_BACKLOG.md). | [auth source](../../apps/api/src/auth/); [auth UI](../../apps/web/src/app/auth/); [auth hardening plan](../../auth-hardening-plan.md). |
| Subsequent product milestones | Product domains and guest experience described by approved requirements/contracts. | `NOT_STARTED` | `NOT_STARTED` | No authoritative post-M2.1 milestone sequencing; some domain decisions are blocked or deferred. | Owner approves milestone order and entry/exit criteria without changing product decisions implicitly. | [PRD reconciliation v2.1](../01-requirements/MakeMyMarrige_PRD_Reconciliation_v2.1.md); [ADR register v2.1](../02-system-architecture/documents/architecture-decision-register-v2.1.md); [API documentation v1.1](../04-api-design/documents/API_Documentation_v1.1.md). |

## Proposed next milestone — not approved

**Proposal only:** “Authentication hardening and verification closeout.” This
would address the P0 authentication findings and verify session behavior before
new product workflows are built. It has no assigned milestone ID, approved
scope, schedule, or owner commitment. Do not treat this proposal as a product
decision; see the [decision log](./DECISION_LOG.md).

## Gate interpretation

`VERIFIED_UNIT` reflects the executed local `pnpm test` run (17 test files, 70
tests). It does not imply that every milestone acceptance criterion is covered,
nor that MongoDB/Redis integration or deployed runtime behavior passed.

