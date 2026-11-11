\---

name: architecture-compliance

description: Check implementation against approved product requirements, architecture decisions, database design and technical constraints.

\---



\# Architecture Compliance



\## Objective

Ensure implementation follows the approved MakeMyMarrige architecture and product decisions.



\## Documentation Authority



Use:

1\. AGENTS.md

2\. Approved PRD

3\. Approved system architecture

4\. Approved Architecture Decision Register

5\. Approved database schema

6\. Approved API documentation

7\. Relevant business workflows



Distinguish approved decisions from proposals and unresolved decisions.



\## Validation Areas



Check:



\- Monorepo and package boundaries.

\- Next.js frontend and BFF responsibilities.

\- NestJS API and worker responsibilities.

\- MongoDB data models and relationships.

\- Redis and BullMQ usage where applicable.

\- Authentication and authorization boundaries.

\- Multi-tenant data isolation.

\- API versioning and contracts.

\- Business workflow consistency.

\- Error handling and audit requirements.



\## Rules



\- Never invent business requirements.

\- Never treat proposed technical decisions as approved.

\- Do not introduce new technologies without approval.

\- Do not perform unrelated refactoring.

\- Do not conduct a full repository audit for a focused feature.

\- Preserve existing implementation and user changes.



\## Output



Provide:



1\. Compliance status.

2\. Violations with file paths.

3\. Relevant approved documentation references.

4\. Missing implementation requirements.

5\. Risks and architectural implications.

6\. Recommended corrections.



Clearly distinguish verified violations from potential concerns.

