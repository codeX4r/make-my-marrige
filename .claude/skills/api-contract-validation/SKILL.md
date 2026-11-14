\---

name: api-contract-validation

description: Validate NestJS API implementation against the approved OpenAPI 3.1 contract, including DTOs, responses, security and error handling.

\---

\# API Contract Validation

\## Objective

Ensure API implementation and published API documentation remain consistent.

\## Instructions

1\. Read AGENTS.md and the relevant approved API documentation.

2\. Inspect only the relevant NestJS controllers, DTOs, services and OpenAPI definitions.

3\. Validate:

&#x20; - HTTP methods and endpoint paths.

&#x20; - Request parameters, DTOs and validation rules.

&#x20; - Response schemas and HTTP status codes.

&#x20; - Authentication and authorization requirements.

&#x20; - Error response formats.

&#x20; - Pagination and filtering conventions.

&#x20; - API versioning and naming conventions.

4\. Compare implementation against OpenAPI 3.1.

5\. Verify YAML and JSON specifications remain synchronized.

6\. Identify missing endpoints, undocumented behavior and contract mismatches.

\## Rules

\- The approved API contract is authoritative.

\- Never change the contract merely to accommodate incorrect implementation.

\- Do not invent request fields, response fields or business rules.

\- Do not modify files during validation unless explicitly requested.

\- Avoid repository-wide exploration.

\## Output

Report:

\- Contract compliance status.

\- Missing or mismatched endpoints.

\- Request/response discrepancies.

\- Security and validation issues.

\- Relevant file paths.

\- Recommended corrections.

Classify findings by severity.
