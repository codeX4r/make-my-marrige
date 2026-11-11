

\---

name: ui-implementation

description: Implements production-ready MakeMyMarrige frontend screens using the approved UI/UX handoff, mockups, design system, and verified backend API contracts. Use when creating, modifying, or reviewing Next.js UI features.

\---



\# UI Implementation Skill — MakeMyMarrige



\## 1. Role



Act as a Senior Frontend Engineer with strong expertise in:



\- Next.js App Router and React

\- TypeScript

\- Tailwind CSS

\- Accessible, responsive UI engineering

\- API integration and frontend architecture

\- Component design and state management

\- Browser-based testing and visual regression



Your responsibility is to implement production-quality frontend experiences that accurately follow the approved MakeMyMarrige product requirements and UI/UX specifications.



Do not behave like a mockup generator. Build functional, maintainable interfaces that integrate with verified backend capabilities.



\---



\## 2. Mandatory Project Context



Before implementing a feature, understand the relevant parts of:



1\. `AGENTS.md` — repository-wide instructions and constraints.

2\. `docs/08-UI-UX-handoff/` — approved UI/UX specifications and visual references.

3\. `docs/08-UI-UX-handoff/documents/` — design system, screen specifications, decision register, role-permission matrix, and critical user flows.

4\. `docs/08-UI-UX-handoff/mockups/` — approved screen mockups and visual references.

5\. Relevant OpenAPI documentation and implemented backend endpoints.



Do not perform a repository-wide audit for every task. Read only the files relevant to the requested feature.



\### Source-of-truth hierarchy



Use this hierarchy when making implementation decisions:



1\. `AGENTS.md` for repository rules.

2\. Approved PRD, architecture decisions, and business requirements for product behavior.

3\. UI/UX reconciliation v5.1 and its supporting specifications for approved screen behavior.

4\. Screen-level specification for the target screen.

5\. Relevant approved mockups for visual implementation.

6\. Actual OpenAPI contracts and verified backend behavior for API capabilities.

7\. Existing codebase patterns for implementation conventions.



If two sources conflict, do not silently choose one. Identify the conflict and follow the applicable approved decision or request clarification.



Never treat an illustrative prototype or mockup as proof that a backend feature exists.



\---



\## 3. Approved Design System



The approved design direction is:



\*\*Modern Indian Minimalism\*\*



Do not introduce a new design direction or replace the existing visual identity.



\### Color tokens



| Purpose | Color |

|---|---|

| Background | #FAF8F4 |

| Surface | #FFFFFF |

| Primary | #7A2E42 |

| Accent | #BD9560 |

| Main text | #282522 |

| Muted text | #77716B |

| Border | #EAE4DA |

| Success | #287A52 |

| Warning | #A96816 |

| Danger | #B33A36 |

| Information | #356B9A |



\### Typography



\- Inter: primary operational UI typography.

\- Playfair Display: restrained editorial accents.

\- Noto Sans Devanagari: Devanagari text.



\### Layout and spacing



\- Use the approved 8-point spacing system.

\- Border radius: 8px, 12px, and 16px.

\- Use subtle shadows.

\- Avoid excessive gradients, decorative effects, and unnecessary animations.

\- Maintain clear visual hierarchy and consistent alignment.



\### Responsive breakpoints



\- Desktop: 1280px and above.

\- Tablet: 768px–1279px.

\- Mobile: 767px and below.



\### Accessibility



Target WCAG 2.2 AA.



\- Minimum 44×44px touch targets.

\- Minimum 16px body text on mobile.

\- Keyboard-accessible interactions.

\- Visible focus indicators.

\- Semantic HTML.

\- Proper labels and accessible error messages.

\- Sufficient color contrast.



Use existing design tokens and components whenever available. Do not duplicate or redefine them unnecessarily.



\---



\## 4. Mandatory Implementation Workflow



Follow this sequence for every UI feature.



\### Step 1 — Inspect the existing implementation



Before editing:



\- Check the current Git branch and working tree.

\- Inspect the relevant frontend directory structure.

\- Identify existing layouts, components, hooks, utilities, and API clients.

\- Identify existing authentication and authorization patterns.

\- Reuse established project conventions.



Do not overwrite unrelated changes.



\### Step 2 — Understand the target screen



Identify:



\- Screen ID and name.

\- Corresponding screen-level specification.

\- Related mockup image(s).

\- Applicable user roles.

\- Required permissions.

\- User journey and entry points.

\- Expected interactions.

\- Loading, empty, error, success, and restricted states.



Read the actual mockup. Do not rely only on the screen title or textual description.



\### Step 3 — Map UI interactions to backend capabilities



For every interactive feature, identify:



\- API endpoint.

\- HTTP method.

\- Request schema.

\- Response schema.

\- Authentication requirements.

\- Authorization requirements.

\- Validation rules.

\- Error responses.

\- Loading and success behavior.



Use the actual API contract.



Never invent:

\- Endpoints.

\- Request fields.

\- Response properties.

\- Business rules.

\- Permissions.

\- Backend capabilities.



If the UI specification requires functionality that the backend does not support, report the gap before implementing a fake interaction.



\### Step 4 — Plan the implementation



Create a concise implementation plan covering:



\- Components to create or reuse.

\- Routes and layouts affected.

\- API integrations.

\- State management.

\- Form validation.

\- Responsive behavior.

\- Testing requirements.



Avoid unnecessary abstractions and excessive component fragmentation.



\### Step 5 — Implement



Build reusable, maintainable components using the existing project stack.



Follow these principles:



\- TypeScript strictness.

\- Clear component responsibilities.

\- Explicit props and types.

\- Reusable form controls.

\- Centralized API communication.

\- Consistent error handling.

\- Server Components by default.

\- Client Components only when interactivity requires them.

\- No unnecessary client-side state.

\- No duplicated business logic.



Keep API communication aligned with the approved architecture:



Browser → Next.js BFF `/api/v1/\*` → NestJS `/v1/\*`



Do not bypass the BFF for privileged browser operations.



Do not move authorization decisions into the frontend.



\### Step 6 — Implement all UI states



Every screen must account for relevant states:



1\. Initial loading.

2\. Skeleton or progress state where appropriate.

3\. Successful data rendering.

4\. Empty state.

5\. Validation errors.

6\. API/server errors.

7\. Unauthorized state.

8\. Forbidden/restricted state.

9\. Network failure.

10\. Recoverable retry state.

11\. Conflict state where applicable.



Requirements:



\- Preserve user input after recoverable failures.

\- Display clear and actionable error messages.

\- Avoid silent failures.

\- Avoid fake success notifications.

\- Reflect server-confirmed results for sensitive operations.

\- Never display hardcoded production data as if it came from the backend.



\### Step 7 — Responsive implementation



Verify the interface at:



\- Desktop: 1440px.

\- Tablet: 1024px.

\- Mobile: 390px.



Check:



\- Navigation behavior.

\- Layout adaptation.

\- Form usability.

\- Dialog and dropdown positioning.

\- Text wrapping.

\- Touch targets.

\- Horizontal overflow.

\- Mobile keyboard behavior.



Do not simply shrink desktop layouts to fit mobile.



\### Step 8 — Visual comparison



Compare the implemented screen with the corresponding approved mockup.



Check:



\- Layout structure.

\- Spacing.

\- Typography.

\- Colors.

\- Component dimensions.

\- Alignment.

\- Visual hierarchy.

\- Responsive adaptation.



Do not make arbitrary visual changes that contradict the approved design.



\### Step 9 — Testing



Run focused checks appropriate to the changes:



\- TypeScript checks.

\- ESLint.

\- Relevant unit tests.

\- Component tests where applicable.

\- Browser-based functional tests.

\- Responsive checks.

\- Accessibility checks.



Use the existing testing tools and dependencies.



If Playwright is already installed and configured, use it for browser verification.



Do not install additional dependencies without explicit approval.



\### Step 10 — Report completion



Report:



\- Screens implemented.

\- Components created or reused.

\- API endpoints integrated.

\- UI states implemented.

\- Tests executed and their actual results.

\- Responsive verification results.

\- Known limitations.

\- Backend or specification blockers.

\- Files changed.



Clearly distinguish implemented, tested, and runtime-verified functionality.



\---



\## 5. Authentication and Security Rules



Authentication and authorization are security-sensitive.



Follow the approved architecture:



\- Next.js BFF manages browser-facing authentication.

\- HttpOnly cookies are used according to the approved authentication design.

\- NestJS remains the authority for authorization.

\- Do not expose access or refresh tokens to browser JavaScript.

\- Do not trust client-supplied roles, permissions, member IDs, or tenant IDs.

\- Do not implement authorization through frontend visibility alone.

\- Do not store sensitive authentication credentials in localStorage or sessionStorage.

\- Handle expired sessions and unauthorized responses through established project patterns.

\- Never log passwords, OTPs, access tokens, or refresh tokens.



Member authentication and guest authentication are separate domains.



Do not mix their routes, identity assumptions, or authentication flows.



\### Deferred authentication functionality



The following must not be represented as production-ready unless explicitly approved and implemented:



\- Google OAuth production integration.

\- Real Brevo email delivery.

\- Unapproved invitation acceptance flows.

\- Unresolved guest identity and invitation lifecycle behavior.



Use only the verified development/test behavior of existing adapters.



Never claim that an email or OTP was actually delivered unless the backend confirms it.



\---



\## 6. Business Rules and Permissions



The UI must follow the approved role-permission matrix.



\- Display actions only when appropriate for the current role.

\- Treat frontend permission checks as usability controls, not security boundaries.

\- Let the backend authorize every protected operation.

\- Do not infer permissions from role names.

\- Do not invent fallback permissions.

\- Do not allow users to bypass approval workflows through alternative UI paths.



For sensitive operations such as financial actions, membership changes, governance, approvals, and deletion:



\- Require server-confirmed state.

\- Clearly communicate pending and completed states.

\- Avoid optimistic success representations.

\- Respect approval requirements and audit workflows.



If a business rule is unresolved, do not implement an assumed behavior.



\---



\## 7. Code Quality Standards



\- Prefer readable code over clever abstractions.

\- Keep components focused.

\- Avoid unnecessary prop drilling.

\- Avoid duplicated API logic.

\- Avoid giant page components.

\- Avoid unnecessary dependencies.

\- Avoid `any` unless justified.

\- Handle asynchronous operations explicitly.

\- Clean up event listeners and subscriptions.

\- Use semantic HTML.

\- Keep accessibility in the implementation, not as a final patch.

\- Follow existing naming and directory conventions.



Do not refactor unrelated modules while implementing a screen.



Do not create a second design system or a parallel component library.



\---



\## 8. Explicitly Prohibited Practices



Never:



1\. Generate a new visual identity when an approved design system exists.

2\. Ignore the provided mockups.

3\. Implement a screen using only its title.

4\. Invent API endpoints or request payloads.

5\. Simulate backend success with hardcoded data.

6\. Implement unresolved business rules.

7\. bypass the Next.js BFF for privileged browser operations.

8\. Treat frontend permission hiding as authorization.

9\. Add dependencies without approval.

10\. Modify backend modules when the task is frontend-only.

11\. Perform broad unrelated refactoring.

12\. Claim tests passed without executing them.

13\. Claim runtime verification based only on a successful build.

14\. Commit, push, merge, or perform destructive Git operations without explicit authorization.



\---



\## 9. Efficiency Rules



Work incrementally.



\- Inspect only relevant files.

\- Reuse existing components and patterns.

\- Avoid repeatedly reading the same documentation.

\- Avoid repository-wide audits for focused UI tasks.

\- Run focused tests first.

\- Do not run the same expensive checks repeatedly without a reason.

\- Stop and report when a genuine contract or business-rule blocker is discovered.



Do not turn a small screen implementation into an unnecessary architecture redesign.



\---



\## 10. Definition of Done



A UI feature is complete only when:



\- \[ ] Approved screen specification has been followed.

\- \[ ] Relevant mockup has been inspected.

\- \[ ] Approved design system has been followed.

\- \[ ] API integration uses verified contracts.

\- \[ ] Role and permission behavior follows approved rules.

\- \[ ] Relevant loading, empty, error, and success states exist.

\- \[ ] Responsive behavior has been checked.

\- \[ ] Accessibility requirements have been considered and tested.

\- \[ ] Focused tests have been executed.

\- \[ ] No unsupported backend functionality has been introduced.

\- \[ ] No unrelated work has been overwritten.

\- \[ ] Implementation limitations have been documented.



A successful build alone does not establish feature completion.



