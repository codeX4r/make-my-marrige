# MakeMyMarrige PRD Reconciliation v2.1

**Document role:** Versioned amendment to the preserved PRD v2.0 distribution artifacts at `docs/09-Reference-Contracts/MakeMyMarrige_Updated_PRD_v2.0.docx/.pdf` and `docs/01-requirements/01PRD.pdf`. This is not a replacement for unrelated v2.0 requirements. Where the clauses below conflict, this v2.1 amendment is authoritative; other PRD requirements remain in force. No historical source was edited.

## Approved decisions

1. **Guest authentication:** email OTP only. Guest identity resolution, invitation token behavior, shared-email behavior, OTP controls and session lifecycle are technical policy items; see `docs/02-system-architecture/documents/technical-policy-register-v1.0.md`. No behavior beyond email OTP is promoted here as an approved product rule.
2. **Email delivery:** Brevo is the approved provider for guest email OTP. Whether other transactional email uses Brevo is an implementation scope to confirm. Sender configuration and deliverability are operational gates, not provider-selection questions.
3. **Shagun provider and method:** Razorpay, UPI only. Checkout, payment verification, webhook, refund/reversal, reconciliation and compliance mechanics are implementation/release gates and are not inferred as approved provider capabilities. See ADR-0003 and the technical policy/decision register.
4. **API and web boundary:** REST prefix is `/v1`; browser communication is Next.js BFF → NestJS API. These are approved decisions. Cookie topology, CSRF details, session forwarding and origin configuration are technical specification gates; NestJS remains the documented authorization authority.
5. **Gallery approved limits:** JPG/JPEG and PNG; maximum 5 MB per file; guest batch limit 5; co-owner/organiser batch limit 10. Dimensions and workspace quota are deferred. Validation, storage, EXIF processing and download authorization are technical implementation requirements, not additional product decisions in this approval.
6. **Governance cardinality:** exactly two active co-owners and exactly one active Treasurer per wedding. Transactional enforcement, setup/bootstrap and replacement sequence are technical design items; preserve documented dual approval while resolving them. See ADR-0007 and technical policy register.

## Source precedence and limits

This amendment records the explicit owner-approved decisions above and supersedes conflicting PRD v2.0 clauses only in those topics. It does not approve the technical proposals or close implementation/release gates. The existing `SETUP_IN_PROGRESS` and `TWO_CO_OWNERS_ACTIVE` terms are preserved; this amendment does not create a new lifecycle enum. See architecture decision register v2.1 and technical policy register v1.0 for traceable conflicts and proposals.
