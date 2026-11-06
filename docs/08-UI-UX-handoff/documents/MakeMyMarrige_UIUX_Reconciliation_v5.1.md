# MakeMyMarrige UI/UX Handoff Reconciliation v5.1

**Authority:** UI/UX Master Handoff v5.0 remains the layout, interaction and visual baseline, except clauses explicitly superseded here. v3.0 and v4.0 are predecessors, not authority over v5.0. The v5.1 supporting contracts are `specifications/final_decision_register_v5.1.csv`, `critical_user_flows_v5.1.csv`, `role_permission_matrix_v5.1.csv` and `screen_level_specification_v5.1.csv`. These supersede the matching v5.0 CSVs for the reconciled clauses below. Root-level copies remain preserved; their v5.0 duplicates were byte-identical to the original `specifications/` copies at reconciliation time. Permission rules defer to the PRD and role matrix, with accepted governance decisions in architecture ADR-0007.

## Changes to the v5.0 implementation baseline

- Guest portal uses email OTP only (Brevo); do not render phone OTP or a shared wedding access code as authentication. Invitation token lifecycle, shared-email identity resolution, and OTP/session controls remain proposed technical policy; see `docs/02-system-architecture/documents/technical-policy-register-v1.0.md`. Do not imply an unapproved identity-resolution rule in UI.
- Shagun uses Razorpay UPI-only. Show pending until NestJS verifies provider state; never accept redirect, screenshot or manual reference as proof. Show no claim that the platform holds funds.
- All privileged browser actions use the Next.js BFF; NestJS API remains the authorization authority.
- Gallery accepts JPG/JPEG and PNG only, max 5 MB/file; per upload batch: guest 5, co-owner/organiser 10. Dimensions and wedding storage quota must not be presented as fixed limits. Remove WebP acceptance and any published 6000×6000, 24MP or 5GB limits.
- Task screens distinguish accountable `responsibleMembershipId` from collaborators; at most one responsible active assignee.
- Correction request detail includes pending/approved/rejected state, reviewer and reason where permitted; requester cannot review their own request.
- Workspace setup must communicate that setup remains incomplete until exactly two active co-owners exist; do not expose operational governance as complete before then. Exactly one active Treasurer is required once operational. Preserve dual approval.

## Source authority and unresolved design content

Screen layout/actions: v5.0 screen-level specification. Role visibility and action grants: `specifications/role_permission_matrix_v5.1.csv`, constrained by latest PRD, API and ADR decisions. Flow ordering: `specifications/critical_user_flows_v5.1.csv`, with email OTP/Shagun/governance updates above. Final owner-approved decisions: this v5.1 amendment and ADR register v2.1; v5.0's old “future decision” proposals for image dimensions/quota remain unapproved. Support recovery UX is blocked until authorized actors, approval, evidence, scope and audit are approved. Numeric OTP limits, failure states for provider configuration and user-facing wording require product/security review before UI freeze.
