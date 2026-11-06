# MakeMyMarrige Documentation

## Documentation Index

| ID | Category | Description |
|---|---|---|
| 01 | Requirements | Product requirements and scope |
| 02 | System Architecture | Application architecture |
| 03 | Database Design | MongoDB schema and relationships |
| 04 | API Design | REST APIs and OpenAPI specifications |
| 05 | Business Workflows | Wedding planning workflows |
| 06 | Architecture Compendium | Consolidated architecture diagrams |
<<<<<<< HEAD
| 07 | Infrastructure | Deployment and infrastructure documentation |
| 08 | UI/UX Handoff | Screen specifications, flows, and design handoff |
| 09 | Reference Contracts | Reference product, architecture, database, and API packages |
=======
| 07 | Infrastructure | Deployment and observability design diagrams |
| 08 | UI/UX Handoff | Product UI, flows, screen and role specifications |
| 09 | Reference Contracts | Preserved release/distribution snapshots |
>>>>>>> origin/master

## Documentation Standards

- Editable source files are the source of truth.
- PDF files are distribution artifacts.
- All diagrams must have version numbers.
- Architecture changes must be reflected in documentation.
- OpenAPI specifications must remain synchronized with implementation.
<<<<<<< HEAD
=======

## Current reconciled authorities

- Product amendments for approved authentication, provider, gallery, governance and communication-boundary decisions: `01-requirements/MakeMyMarrige_PRD_Reconciliation_v2.1.md`.
- Architecture decisions, ADRs, conflicts and open issues: `02-system-architecture/documents/architecture-decision-register-v2.1.md`; architecture amendment: `02-system-architecture/documents/System_Design_Architecture_Reconciliation_v2.1.md`.
- Proposed technical defaults awaiting approval/review (distinct from approved product decisions): `02-system-architecture/documents/technical-policy-register-v1.0.md`.
- Database amendments: `03-database-design/documents/MakeMyMarrige_Database_Schema_Design_v1.1.md`.
- Active API contract: `04-api-design/documents/API_Documentation_v1.1.md` and `04-api-design/specifications/openapi.yaml` / `.json` (1.1.0, canonical `/v1`). `API_Documentation.md` is preserved as historical v1.0.
- UI/UX amendment: `08-UI-UX-handoff/documents/MakeMyMarrige_UIUX_Reconciliation_v5.1.md`; current decision, flow, role and screen CSVs are the corresponding `specifications/*_v5.1.csv` files, read with v5.0 visual/layout master.
- Existing DOCX/PDF/ZIP files and older versioned handoffs remain preserved historical snapshots. Amendments supersede only explicitly reconciled clauses; non-conflicting source requirements continue to apply.

The architecture decision register identifies unresolved owner decisions and release gates. No hosting provider/region, OTP numeric limits, media dimensions/quota, support break-glass authority, or provider legal/compliance outcome is implied by this index.
>>>>>>> origin/master
