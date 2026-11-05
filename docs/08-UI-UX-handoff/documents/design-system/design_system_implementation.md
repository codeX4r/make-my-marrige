# Design System Implementation Specification — MakeMyMarrige v4.0

## Brand and visual language
Modern Indian Minimalism. Warm ivory and white surfaces, burgundy as the primary action colour, antique brass/terracotta used sparingly. Operational information must remain calm, legible and scannable. Avoid ornamental backgrounds behind tables, large maroon header slabs and gold body text.

## Foundations
- Background `#FAF8F4`; surface `#FFFFFF`; primary `#7A2E42`; accent `#BD9560`.
- Text `#282522`; muted `#77716B`; border `#EAE4DA`.
- Success `#287A52`; warning `#A96816`; danger `#B33A36`; info `#356B9A`.
- UI font: Inter; editorial accent: Playfair Display; Devanagari: Noto Sans Devanagari.
- 8-point spacing scale; radius 8/12/16; subtle shadows only for overlays.
- Desktop >=1280; tablet 768–1279; mobile <=767.
- Standard interactive target 44×44 CSS px; body text minimum 16px mobile.

## Component contract
Implement the component inventory in `component_inventory.csv`. Components must have documented props, variants, disabled/loading states and accessibility behaviour. Do not create one-off button/input variants inside feature pages when a shared pattern exists.

## Interaction principles
1. One visually dominant primary action per view.
2. Destructive action is separated from primary action and explains consequence.
3. Form labels persist; placeholders are examples, not labels.
4. Preserve user-entered values after recoverable errors.
5. Loading uses skeletons for layout-bearing content.
6. Empty state explains why the area is empty and the next permitted action.
7. Permission denied is not the same as no data.
8. Colour is never the sole status indicator.
9. Use optimistic UI only for reversible low-risk actions.
10. Money, payment, approval, membership and deletion states are server-confirmed.

## Responsive rules
- Desktop: persistent sidebar, full tables, contextual right-side panels when useful.
- Tablet: collapsible sidebar, reduce columns, keep filters accessible.
- Mobile: one-column, convert tables to labelled cards, use bottom navigation for guest portal, use full-screen forms for complex flows.
- Never require horizontal scrolling for core task completion.
- Sticky action bars must respect safe areas and not cover keyboard/focused controls.

## Accessibility
Target WCAG 2.2 AA. Include keyboard operation, visible focus, semantic landmarks, headings, labels, descriptions, error associations, focus trap/return for dialogs, reduced-motion support, contrast >=4.5:1 normal text, screen-reader announcements for async changes, meaningful alt text, and 200% zoom/reflow tests.
