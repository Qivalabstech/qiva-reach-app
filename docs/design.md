# Qiva Reach — Design

Source: `company-brain/05-brand.md` and `company-brain/qiva-reach-brand-kit.html`. Direction is fixed by the brand kit, so no new style exploration.

## Style Direction
Calm, editorial and warm: Indigo Ink on Porcelain, one Marigold action per screen, the dashed "see more" fold line used once per layout. A sharp, warm friend, never salesy. Plain, no stock-SaaS gradients, no emoji in product UI.

## Colors
| Token | Hex | Usage |
|---|---|---|
| ink | #1B1F3B | Text, primary buttons, dark sections |
| porcelain | #F3F5F4 | Page background |
| white | #FFFFFF | Cards, inputs |
| marigold | #F2A900 | The one highlight/action per screen, fold line |
| marigold-soft | #FFE8A8 | Focus ring (4 px), highlights, warnings |
| peacock | #00645A | Success, toggles |
| peacock-soft | #D4ECE6 | Success background |
| slate | #5D6475 | Secondary text |
| sindoor | #C8331E | Errors and destructive only |
| line | #D9DEDC | Borders |

Light theme only in Phase 1 (brand kit defines no dark theme).

## Typography
- Headings: Bricolage Grotesque 600–800, tight tracking
- Body/UI: Figtree 400–700
- Scale (px): Display 72, H1 48, H2 32, H3 22, Body large 20, Body 17, Small 14. Sentence case.

## Spacing & Layout
- 4 px base grid; controls radius 12 px, cards 20 px
- Mobile first; every screen works at 390 px; 16 px side gutters
- Max reading width ~36rem for forms and drafts

## Motion
- Engine: CSS transitions (no animation library needed in Phase 1)
- Duration 150–200 ms, ease-out; respects `prefers-reduced-motion`
- Motion only for state feedback (button press, draft appearing)
