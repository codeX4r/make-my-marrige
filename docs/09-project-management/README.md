# Project Management

This directory is the evidence-based project control index for MakeMyMarrige. It
tracks implementation and verification without replacing product requirements,
architecture decisions, database/API contracts, or UI specifications.

**Audit baseline:** 2026-11-14  
**Repository branch at audit start:** `feature/auth`

## Documents

- [Project dashboard](./PROJECT_DASHBOARD.md) — health, milestone, blockers, and
  next actions.
- [Milestone tracker](./MILESTONE_TRACKER.md) — named milestones and evidence.
- [Feature tracker](./FEATURE_TRACKER.md) — feature-level status and source
  evidence.
- [Task backlog](./TASK_BACKLOG.md) — prioritized, actionable work with
  acceptance criteria.
- [Risk and blocker register](./RISK_AND_BLOCKER_REGISTER.md) — material risks
  and unresolved gates.
- [Decision log](./DECISION_LOG.md) — references to approved decisions and
  unresolved choices.
- [Release readiness](./RELEASE_READINESS.md) — release gates and current
  evidence.
- [Progress reports](./progress-reports/) — immutable, dated audit snapshots.

## Source-of-truth policy

Trackers summarize implementation evidence; they do not amend product policy.
Resolve conflicts using the authority order in [`AGENTS.md`](../../AGENTS.md):
approved reconciliations and decision registers, product requirements,
architecture, database/API contracts, workflows/UI specifications, and then
implementation where it does not contradict those sources. Link to authoritative
documents rather than copying their requirements.

An implementation that conflicts with an approved contract is recorded as a
gap, not treated as a new decision. An unresolved policy dependency is marked
`BLOCKED`; do not infer a business rule to make a task appear unblocked.

## Status vocabulary

Use these values consistently for feature implementation, feature verification,
milestone state, and task status:

| Status | Meaning |
| --- | --- |
| `NOT_STARTED` | No implementation work is evidenced for the tracked scope. |
| `IN_PROGRESS` | Some work exists, but the tracked scope is incomplete. |
| `BLOCKED` | Further completion depends on an unresolved decision, prerequisite, or material blocker. |
| `IMPLEMENTED_UNVERIFIED` | Source implementation exists, but the behavior has not been adequately verified. |
| `VERIFIED_UNIT` | Focused unit-level evidence was run successfully. This does not imply integration or runtime verification. |
| `VERIFIED_INTEGRATION` | The relevant integration behavior was verified against its required services. |
| `VERIFIED_RUNTIME` | The relevant behavior was verified in a running application/environment. |
| `DEFERRED` | The work is explicitly deferred by an authoritative decision. |

For features, `Implementation status` describes the implementation state and
`Verification status` is the strongest evidence for the feature as a whole.
Partial unit tests do not verify uncovered paths: state their limits in the
evidence field. Use the separate documentation-state field to distinguish
`DOCUMENTED`, `PARTIAL`, `NOT_DOCUMENTED`, and `DEFERRED` from code status.
Use `UNKNOWN` or `UNVERIFIED` for evidence that cannot be established.

## Record standards

Every feature record includes its ID and name, product module, requirement and
architecture/API references, documentation state, implementation and
verification status, dependencies, blockers, next actionable task, and source
evidence.

Every backlog item includes a stable task ID, description, P0–P3 priority,
related feature, dependencies, measurable acceptance criteria, status, and
verification evidence. `P0` denotes a release/security-critical issue; `P1`
denotes a prerequisite for the next milestone or staging; `P2` denotes
important planned work; `P3` denotes lower-priority or explicitly deferred
follow-up.

## Audit and history rules

- Statuses describe evidence available on the report date, not intentions.
- A requirement, mockup, route declaration, source file, successful compilation,
  or prior report alone does not prove a feature works.
- Record unit, integration, and runtime verification separately.
- Do not calculate a project-completion percentage from the feature list. Its
  areas are neither exhaustive nor equally sized.
- Keep each dated progress report unchanged after publication. Add a new dated
  report for a later audit.
- Update trackers only when new source, test, runtime, approval, or blocker
  evidence is available.

## Initial audit scope and limitations

The initial audit inspected the current source, test configuration, authority
documents, and existing progress material. `pnpm test` passed 17 test files and
70 tests. Integration tests were not run because they can mutate test database
records; no runtime, browser, email-delivery, or provider verification was
performed. The latest observed GitHub Actions run failed at `pnpm format:check`,
so later CI gates on that run were skipped.

The v2.1 PRD reconciliation and current authority documents were consulted. The
original PRD PDF could not be text-extracted with the available tools; where its
non-conflicting details were not restated in the reconciliation or newer
authority documents, they remain an evidence gap rather than an assumption.
The business-workflows directory contains diagrams but no standalone workflow
documents. Some diagram details appear to need reconciliation with newer
unresolved decisions; they are not treated as approval to implement those
details.

