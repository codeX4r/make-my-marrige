\---

name: feature-implementation

description: Implement approved MakeMyMarrige features efficiently while preserving architecture, existing work, security and testing standards.

\---

\# Feature Implementation

\## Objective

Implement production-quality features without unnecessary exploration or overengineering.

\## Execution Workflow

\### 1. Understand

\- Read AGENTS.md.

\- Identify the relevant approved requirements.

\- Inspect Git status once.

\- Identify only files relevant to the requested feature.

\### 2. Plan

\- Write a brief implementation plan.

\- Identify dependencies and affected modules.

\- Identify required tests.

\- Resolve genuinely blocking ambiguities only.

\### 3. Implement

\- Reuse existing architecture and coding patterns.

\- Follow established TypeScript conventions.

\- Keep modules cohesive and responsibilities separated.

\- Implement proper validation and error handling.

\- Maintain security and tenant isolation.

\- Avoid unnecessary abstractions and refactoring.

\- Do not repeatedly inspect unrelated repository files.

\### 4. Test

\- Write or update focused tests.

\- Test important success and failure scenarios.

\- Run relevant type checks and linting.

\- Run broader checks when appropriate.

\- Never claim runtime verification based only on a successful build.

\### 5. Report

Summarize:

\- What was implemented.

\- Files created or modified.

\- Tests executed and actual results.

\- Build and type-check results.

\- Remaining issues and blockers.

\- Deferred work.

\## Mandatory Constraints

\- Follow AGENTS.md and approved documentation.

\- Never invent unresolved business rules.

\- Never install new dependencies without explicit user approval.

\- Never perform destructive Git operations without approval.

\- Never kill processes without identifying them and obtaining approval.

\- Never send real external emails or use production credentials without authorization.

\- Preserve existing user changes.

\- Do not implement unrelated modules.

\- Do not claim completion when requirements remain unverified.

\## Efficiency

Prioritize implementation over excessive planning.

Use the smallest sufficient investigation.

Avoid repeated repository-wide audits.

Reuse existing dependencies and utilities.

Do not repeat successful checks unnecessarily.
