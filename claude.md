# MakeMyMarrige — Claude Code Engineering Rules

> Production-grade engineering standards for the MakeMyMarrige wedding planning platform.

## 1. Project Context & Product Boundaries

MakeMyMarrige is a family-first wedding planning platform.

### Core product principles

- Couples/co-owners are the primary workspace owners.
- Family members participate as workspace collaborators.
- Workspace ownership, membership and authorization must remain distinct concepts.
- Do not introduce wedding planner accounts, vendor accounts, vendor dashboards or vendor marketplace workflows.
- Preserve the family-first product experience.
- Respect approved product requirements and business rules.
- Never invent product features or alter established business decisions without authorization.

### Technology Stack

| Layer             | Technology                               |
| ----------------- | ---------------------------------------- |
| Frontend          | Next.js                                  |
| Backend           | NestJS                                   |
| Language          | TypeScript                               |
| Database          | MongoDB                                  |
| ODM               | Mongoose, if established in the project  |
| Cache / Queue     | Redis + BullMQ                           |
| Object Storage    | Cloudflare R2                            |
| Email             | Brevo through an adapter                 |
| API Documentation | OpenAPI 3.1                              |
| Testing           | Jest / project-established testing tools |
| Browser Testing   | Playwright                               |

Do not replace approved technologies without explicit authorization.

---

## 2. Project Authority & Documentation

- Read root `CLAUDE.md`, `AGENTS.md` and relevant project documentation before implementation.
- Inspect the actual repository structure before modifying files.
- Keep application code and documentation in the same Git repository.
- Treat approved PRDs, system architecture, API specifications, database schemas and architecture decision records as authoritative.
- Follow the documented source-of-truth hierarchy.
- Never silently change approved requirements or architectural decisions.
- Identify contradictions between documentation and implementation before making changes.
- If documentation is incomplete, identify the gap rather than inventing business requirements.
- Update affected documentation whenever implementation changes approved system behavior.

### Documentation discipline

Documentation is part of the product, not an afterthought.

Maintain consistency between:

- Product requirements.
- System architecture.
- API contracts.
- Database design.
- Authentication and authorization specifications.
- Implementation.
- Automated tests.

Never implement an undocumented architectural assumption as though it were an approved decision.

---

## 3. Mandatory Engineering Workflow

For every meaningful feature:

1. Understand the requested feature and acceptance criteria.
2. Read relevant PRD and technical documentation.
3. Inspect existing implementation.
4. Identify affected frontend, backend, database and infrastructure components.
5. Identify dependencies and integration boundaries.
6. Prepare an implementation plan for complex changes.
7. Implement incrementally.
8. Add or update automated tests.
9. Run relevant verification commands.
10. Review the final Git diff.
11. Update affected documentation.
12. Provide an evidence-based implementation report.

For simple changes, avoid unnecessary planning overhead.

### Before implementation

Determine:

- What problem is being solved?
- Which users and roles are affected?
- Which existing modules are involved?
- What data is created, read, updated or deleted?
- What authorization rules apply?
- What happens when the operation fails?
- Are database consistency or concurrency concerns involved?
- Does the change affect existing API contracts?

Never begin a large implementation without understanding its dependencies.

---

## 4. Architecture & System Design

### Architecture principles

- Follow the approved modular monolith architecture.
- Maintain clear module boundaries.
- Keep business logic within appropriate backend modules.
- Avoid tightly coupled modules.
- Use dependency injection and established NestJS patterns.
- Keep controllers thin.
- Separate application logic, domain rules and infrastructure concerns where appropriate.
- Use shared abstractions only when they provide genuine value.
- Avoid premature microservices.
- Avoid unnecessary abstractions and overengineering.

### Frontend architecture

- Follow existing Next.js routing and rendering conventions.
- Separate server and client components appropriately.
- Keep business logic out of presentation components.
- Use reusable components and established design patterns.
- Handle server-side and client-side data boundaries carefully.
- Avoid unnecessary client-side state.
- Implement consistent loading, error and empty states.
- Prevent sensitive server-side information from reaching browser bundles.

### Backend architecture

- Use NestJS modules to enforce domain boundaries.
- Keep controllers responsible for HTTP concerns.
- Use services for application operations.
- Use DTOs for request validation and API contracts.
- Use guards and policies for authorization.
- Use interceptors, filters and middleware consistently.
- Avoid direct database access from controllers.
- Use dependency injection instead of tightly coupled service construction.
- Centralize error handling where appropriate.

### Database architecture

- Follow approved MongoDB collection and schema designs.
- Use explicit validation and appropriate indexes.
- Design queries around documented access patterns.
- Avoid unnecessary population and expensive aggregation.
- Maintain tenant/workspace isolation.
- Consider transaction boundaries for multi-document operations.
- Prevent duplicate operations where idempotency is required.
- Use migrations or controlled schema evolution procedures where established.
- Never modify production data assumptions casually.

---

## 5. Multi-Tenancy & Authorization

Workspace isolation is a critical security boundary.

- Every workspace-scoped operation must enforce workspace authorization.
- Never trust a workspace ID supplied by the client without validating membership and permissions.
- Distinguish workspace ownership from ordinary membership.
- Enforce the approved co-owner constraints.
- Enforce family collaborator permissions according to approved requirements.
- Prevent cross-workspace data access.
- Apply authorization at the backend, not merely through frontend visibility.
- Never assume that hiding a UI element provides security.
- Test unauthorized, unauthenticated and cross-workspace access.
- Avoid insecure direct object references.

Do not introduce additional roles or permissions without product approval.

---

## 6. Authentication & Session Security

Authentication and session management are security-critical.

- Follow the approved authentication architecture.
- Use secure authentication and authorization boundaries.
- Keep provider credentials and sensitive tokens out of browser-accessible storage.
- Follow the documented OAuth authorization flow.
- Validate identity and session state on the backend.
- Implement secure session rotation and revocation according to approved specifications.
- Prevent refresh-token reuse and replay where supported by the approved design.
- Apply CSRF protection where required.
- Use secure cookie settings appropriate to deployment.
- Never bypass authentication to make development or testing easier.
- Never weaken authorization checks.
- Handle account lifecycle and session invalidation consistently.

Never introduce a second authentication implementation without reviewing the existing architecture.

---

## 7. API Engineering Standards

- Follow approved API specifications.
- Use consistent endpoint naming and HTTP semantics.
- Maintain versioning conventions.
- Validate all incoming requests.
- Use consistent response and error structures.
- Implement pagination, filtering and sorting consistently.
- Avoid exposing internal database documents directly.
- Keep API documentation synchronized with implementation.
- Preserve backward compatibility unless a breaking change is approved.
- Apply authentication, authorization, validation and rate limiting at appropriate boundaries.
- Use idempotency for operations that require safe retries.
- Never silently change response contracts.

### OpenAPI

- Maintain OpenAPI 3.1 compatibility where specified.
- Document request schemas and response schemas.
- Document authentication requirements.
- Document error responses.
- Document relevant authorization constraints.
- Ensure implementation and API documentation agree.

---

## 8. Background Processing & Infrastructure

### Redis and BullMQ

- Use queues for appropriate asynchronous workloads.
- Make jobs idempotent where possible.
- Implement retries and backoff deliberately.
- Handle failed jobs and dead-letter scenarios according to project requirements.
- Prevent duplicate processing where required.
- Avoid putting unnecessary business logic into queue processors.
- Maintain observability for background jobs.

### Transactional consistency

- Follow the approved transactional outbox design where applicable.
- Do not assume MongoDB changes and queue publication are automatically atomic.
- Handle retry and duplicate-delivery scenarios.
- Preserve data consistency across asynchronous operations.

### Cloudflare R2

- Use private buckets for private user content.
- Upload directly from the browser using appropriately scoped short-lived signed URLs.
- Enforce authorization through NestJS.
- Store object metadata in MongoDB.
- Never expose permanent private object credentials.
- Validate file type, size and ownership.
- Avoid allowing users to access another workspace's private files.

### Email

- Use Brevo through the established email adapter.
- Keep provider-specific implementation isolated.
- Handle delivery failures and retries appropriately.
- Never expose provider API credentials.
- Avoid embedding email-provider logic inside unrelated domain services.

---

## 9. Frontend UI/UX Standards

The interface must feel like a coherent, polished wedding planning product.

- Follow approved designs and product requirements.
- Prioritize usability, clarity and consistency.
- Use reusable design-system components.
- Maintain consistent typography, spacing, colors and interaction patterns.
- Design for mobile, tablet and desktop.
- Use semantic HTML and accessible interactions.
- Implement loading, empty, error and success states.
- Provide meaningful form validation.
- Avoid unnecessary visual complexity.
- Avoid generic AI-generated layouts.
- Do not introduce new component libraries without evaluating existing dependencies.

### Claude design skills

Use installed skills selectively:

| Skill                        | Purpose                           |
| ---------------------------- | --------------------------------- |
| frontend-design              | UI design and implementation      |
| modern-web-design            | Design patterns and accessibility |
| motion-framer                | Appropriate interface animations  |
| animated-component-libraries | Reusable animated UI components   |
| context7                     | Current framework documentation   |
| playwright                   | Browser-based functional testing  |

Do not use 3D libraries or elaborate animation systems unless explicitly required by the product feature.

---

## 10. Security & Privacy

Treat personal, family, financial and wedding-related information as sensitive application data.

- Apply least-privilege access.
- Validate and sanitize untrusted inputs.
- Protect against injection vulnerabilities.
- Protect against broken access control.
- Avoid sensitive information in application logs.
- Never print secrets or private keys.
- Never commit `.env` files or credentials.
- Use environment variables and approved secret-management practices.
- Apply rate limiting to sensitive endpoints.
- Protect file uploads and downloads.
- Review authorization for every sensitive operation.
- Avoid leaking information through error messages.
- Never weaken security to bypass configuration problems.

Security review is mandatory for changes involving authentication, authorization, file access, financial operations or personal data.

---

## 11. Testing & Quality Assurance

Testing is mandatory, not optional.

### Frontend

- Component tests where appropriate.
- Form validation tests.
- API integration tests.
- Responsive layout verification.
- Playwright end-to-end tests.
- Browser console and network inspection.

### Backend

- Unit tests.
- Integration tests.
- API contract tests where established.
- Authentication and authorization tests.
- Workspace isolation tests.
- Database consistency tests.
- Background job tests.

### Critical test scenarios

Prioritize:

- Unauthenticated requests.
- Unauthorized workspace access.
- Cross-workspace data access.
- Invalid request payloads.
- Duplicate requests.
- Concurrent operations.
- Expired sessions.
- Failed background jobs.
- External service failures.
- Invalid or unauthorized file access.

### Verification commands

Use the actual scripts defined in the repository.

Run relevant:

- Type checking.
- Linting.
- Unit tests.
- Integration tests.
- E2E tests.
- Production builds.

Do not invent package scripts or claim tests passed without execution.

---

## 12. Performance & Reliability

- Optimize database queries and indexes.
- Avoid unnecessary API calls.
- Prevent excessive frontend re-rendering.
- Use caching deliberately.
- Avoid stale or improperly invalidated cached data.
- Use pagination for large collections.
- Optimize image delivery and static assets.
- Apply lazy loading where appropriate.
- Prevent memory leaks.
- Consider failure and recovery behavior for external services.
- Avoid unnecessary synchronous operations.
- Maintain reasonable application response times.

Performance improvements must be measured or justified, not based on assumptions.

---

## 13. Git & Repository Safety

- Work from repository root using Git Bash and relative paths.
- Inspect `git status` before changes.
- Preserve all tracked and untracked changes.
- Keep application code and documentation in the same repository.
- Follow the existing branch strategy.
- Never commit or push without permission.
- Never reset, clean or discard user changes without permission.
- Never overwrite unrelated work.
- Do not modify Git history without authorization.
- Review the final diff.
- Stage only relevant files when staging is authorized.

Batch independent safe operations and avoid repetitive approval requests.

---

## 14. Plugin & Agent Orchestration

Use installed plugins according to task requirements.

- Context7: consult current documentation when library behavior is uncertain.
- Frontend Design: improve UI quality and design implementation.
- Playwright: verify actual browser behavior.
- TypeScript LSP: inspect TypeScript definitions and diagnostics.
- Superpowers: use relevant planning, debugging and engineering workflows.
- Security Guidance: review security-sensitive changes.
- Three.js / React Three Fiber / GSAP: use only for features requiring those technologies.

Rules:

- Do not invoke every plugin for every task.
- Do not install unnecessary dependencies.
- Do not treat plugin output as authoritative product requirements.
- Review generated code before accepting it.
- Prefer the simplest architecture that satisfies approved requirements.
- Avoid unnecessary agent orchestration for small tasks.

---

## 15. Documentation Maintenance

Update documentation when changes affect:

- Product behavior.
- API contracts.
- Database schemas.
- Architecture.
- Authentication.
- Authorization.
- Infrastructure.
- Deployment.
- Environment configuration.

Never silently overwrite approved documentation.

Keep technical documentation consistent with the implementation.

---

## 16. Completion Criteria

A task is complete only when:

- Requested functionality is implemented.
- Product requirements are respected.
- Existing architecture is preserved.
- Relevant security checks are completed.
- Relevant tests are executed.
- Type checking and linting are verified where applicable.
- Documentation is updated where required.
- The final diff is reviewed.
- Remaining blockers are explicitly reported.

---

## 17. Mandatory Final Report

Every implementation response must contain:

### Changes

What was implemented.

### Files Modified

Important files created, changed or deleted.

### Architecture

Relevant implementation decisions and trade-offs.

### Tests & Verification

Actual commands executed and their results.

### Security

Relevant security considerations and checks.

### Failures & Blockers

Existing failures, newly discovered failures and environment limitations.

### Next Action

Remaining work or the next logical implementation step.

Never claim success without evidence.

Never report planned work as completed work.

Never hide failures or silently skip required verification.
