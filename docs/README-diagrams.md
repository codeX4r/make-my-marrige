# MakeMyMarrige Diagram Pack v1.0

This pack contains new architecture, workflow, security, API-sequence and deployment diagrams based on the approved PRD v2.0, System Design & Architecture v2.0, Database Design v1.0, workflow decisions WF01-WF12, and API Documentation v1.0.

## Included diagrams
- `01-product-architecture/system-context.dot` — editable Graphviz source; `.svg` and `.png` are rendered versions.
- `01-product-architecture/container-architecture.dot` — editable Graphviz source; `.svg` and `.png` are rendered versions.
- `01-product-architecture/component-architecture.dot` — editable Graphviz source; `.svg` and `.png` are rendered versions.
- `01-product-architecture/user-roles-permissions.dot` — editable Graphviz source; `.svg` and `.png` are rendered versions.
- `02-database-design/multi-tenant-architecture.dot` — editable Graphviz source; `.svg` and `.png` are rendered versions.
- `02-database-design/indexing-strategy.dot` — editable Graphviz source; `.svg` and `.png` are rendered versions.
- `03-business-workflows/workspace-lifecycle.dot` — editable Graphviz source; `.svg` and `.png` are rendered versions.
- `03-business-workflows/invitation-membership.dot` — editable Graphviz source; `.svg` and `.png` are rendered versions.
- `03-business-workflows/guest-management.dot` — editable Graphviz source; `.svg` and `.png` are rendered versions.
- `03-business-workflows/function-management.dot` — editable Graphviz source; `.svg` and `.png` are rendered versions.
- `03-business-workflows/budget-management.dot` — editable Graphviz source; `.svg` and `.png` are rendered versions.
- `03-business-workflows/vendor-management.dot` — editable Graphviz source; `.svg` and `.png` are rendered versions.
- `04-technical-design/api-sequences-auth-invitation.dot` — editable Graphviz source; `.svg` and `.png` are rendered versions.
- `04-technical-design/api-sequences-payment-photo.dot` — editable Graphviz source; `.svg` and `.png` are rendered versions.
- `04-technical-design/security-architecture.dot` — editable Graphviz source; `.svg` and `.png` are rendered versions.
- `05-infrastructure/deployment-observability.dot` — editable Graphviz source; `.svg` and `.png` are rendered versions.

## Intentionally skipped to avoid duplication
- `02-database-design/mongodb-schema`: the existing **MakeMyMarrige Database Design v1.0** already specifies the collection inventory, document shapes, fields, lifecycle states, and validation conventions.
- `02-database-design/erd`: the existing **MakeMyMarrige Database Schema Package v1.0** already includes five database context / relationship diagrams covering identity-membership, guests-planning-RSVP, finance-vendor-Shagun, and photos-audit-lifecycle.

The existing database package is preserved as the source of truth; this pack does not recreate those diagrams.

## Important qualifications
- This is a design-level diagram set, not evidence that the product has been implemented.
- Provider-specific deployment details remain abstract where the product documents leave them open.
- `indexing-strategy` visualises documented index principles and examples. Final indexes must still be validated against actual query patterns with MongoDB `explain('executionStats')`.
- The diagrams are not a substitute for the detailed workflow rules, API contract, data dictionary, or security tests.
