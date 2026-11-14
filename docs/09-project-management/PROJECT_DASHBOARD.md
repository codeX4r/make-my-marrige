# Project Dashboard

**As of:** 2026-11-14  
**Branch at audit start:** `feature/auth`  
**Overall health:** **RED — not release-ready.** Local development can continue
on the existing foundation, but authentication/security gaps, incomplete
product workflows, absent integration/runtime evidence, and a failed CI
formatting gate prevent a release-readiness claim.

## Current milestone

The latest explicitly named milestone is **Milestone 2.1 — identity and
workspace persistence baseline**. Its implementation/schema slice is classified
`VERIFIED_UNIT` from source inspection and the passing unit suite. Integration
and runtime verification were not performed in this audit. No subsequent
approved milestone sequence was found. The `feature/auth` branch is not, by
itself, evidence of an approved milestone.

## Milestone progress

| Milestone/workstream | Status | Evidence and limitation |
| --- | --- | --- |
| Milestone 2.1 — identity/workspace persistence baseline | `VERIFIED_UNIT` | Mongoose schemas and unit tests exist; the full unit suite passed. Integration and runtime verification remain open. |
| Operational foundation — web/API/worker boundaries | `VERIFIED_UNIT` | Source and unit suite cover selected boundaries; no deployed/runtime verification. This is a workstream, not a separately approved numbered milestone. |
| Member authentication and session hardening | `IN_PROGRESS` | Auth implementation and unit tests exist; critical uncovered or inconsistent flows remain. |
| Product workflows after Milestone 2.1 | `NOT_STARTED` / `BLOCKED` by domain | Contracts exist for many domains; product controllers and operational workflows are not evidenced. No approved milestone ordering was found. |

See the [milestone tracker](./MILESTONE_TRACKER.md) for scope and gates.

## Feature status breakdown

Counts are grouped from the 24 feature rows in the [feature tracker](./FEATURE_TRACKER.md):

| Implementation status | Count |
| --- | ---: |
| `VERIFIED_UNIT` | 6 |
| `IN_PROGRESS` | 3 |
| `BLOCKED` | 6 |
| `NOT_STARTED` | 9 |

These are counts of tracker areas, not completion percentages. The areas vary
greatly in size, and the tracker does not assert that every product requirement
is represented as a separate row.

## Critical blockers and concerns

1. **Authentication security and flow defects:** refresh-token reuse handling
   appears to revoke a family inside a transaction that subsequently throws;
   verification/reset email routing and message semantics do not align; no
   application-level login/registration rate limiter was evidenced.
2. **CSRF/session gaps:** the single-session revoke path lacks the expected
   CSRF/Origin validation evidence; `/me` does not provide the documented
   synchronizer-token bootstrap; the UI's “sign out everywhere” action maps to
   current-session logout rather than an all-session operation.
3. **Product/API coverage:** source controllers are limited to health and auth;
   most documented product operations are not implemented.
4. **Governance and onboarding:** exact active-member cardinality enforcement
   and Treasurer bootstrap/replacement remain unresolved.
5. **Verification:** local unit tests passed, but integration tests and runtime
   verification were not performed. The latest observed CI run failed at
   formatting and skipped subsequent gates.
6. **Documentation quality/drift:** `docs/README.md` contains merge-conflict
   markers; the root README and auth hardening plan do not accurately describe
   all current implementation; the ADR status and current source need owner-led
   reconciliation. The workflow folder contains unversioned diagrams only,
   some of whose details need reconciliation with newer unresolved decisions.
7. **Production decisions:** hosting/region and several deployment controls
   remain unselected; Google OAuth production enablement and other provider
   boundaries are not verified.

Evidence and proposed mitigations are in the [risk register](./RISK_AND_BLOCKER_REGISTER.md).

## Highest-priority actions

1. `PM-001` — make refresh-token family revocation durable on reuse detection and
   test the transaction outcome.
2. `PM-002` — align verification/reset email templates, tokens, and routes with
   their approved flows.
3. `PM-003` — implement and test the documented authentication rate limits and
   input bounds.
4. `PM-004` — close CSRF/Origin and protected-session mutation gaps.
5. `PM-005` — reconcile “sign out everywhere” UI with an approved, correctly
   specified behavior.
6. `PM-006` — run M2.1 integration tests only against isolated test services.
7. `PM-007` — reconcile auth implementation and project documentation with
   owner approval.
8. `PM-008` — resolve governance bootstrap and serialized cardinality design.
9. `PM-009` — address the CI formatting failure and execute the remaining CI
   gates.
10. `PM-010` — close deployment/production environment decisions and release
    controls.

Full acceptance criteria and dependencies are in the [task backlog](./TASK_BACKLOG.md).

## Security and architecture

- NestJS is the authorization authority; the Next.js BFF is a controlled
  boundary, not an open proxy.
- Member authentication source exists, but it is not production-ready based on
  the audit evidence. See [risks](./RISK_AND_BLOCKER_REGISTER.md#security-and-authorization).
- No product workflow implementation was inferred from OpenAPI declarations,
  UI mockups, or persistence schemas alone.
- The project remains a modular monolith with the approved MongoDB, Redis, and
  BullMQ boundaries. No new vendor, deployment provider, or architectural
  decision is proposed here.

## Test and release readiness

| Gate | Current evidence | State |
| --- | --- | --- |
| Unit tests | `pnpm test`: 17 files, 70 tests passed | `VERIFIED_UNIT` |
| Integration tests | Not run; test configuration can mutate database records | `UNVERIFIED` |
| Runtime/browser tests | Not run | `UNVERIFIED` |
| Formatting/CI | Latest observed run failed `pnpm format:check` on 52 files | `BLOCKED` |
| Lint/typecheck/build | Not established by that CI run; later gates were skipped | `UNVERIFIED` |
| Release readiness | Critical auth gaps, incomplete domains, unresolved decisions | `BLOCKED` |

See [release readiness](./RELEASE_READINESS.md) for the full gate list.

## Audit notes

- **Last audit date:** 2026-11-14.
- **Worktree at audit start:** four existing modified UI files were preserved;
  this tracking task did not alter application source or those files.
- **Scope limitation:** integration tests, database mutations, email delivery,
  provider calls, and runtime/browser checks were intentionally not performed.
- **Workflow evidence:** `docs/05-business-workflows/` contains diagrams but no
  standalone workflow documents; potentially conflicting diagram details were
  not treated as approved policy.
- **Recommended next engineering action:** address the P0 authentication
  findings, then verify them with focused tests before expanding product
  workflows.

