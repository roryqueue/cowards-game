---
phase: 13-close-gap-persisted-owner-replay-debug-authorization
reviewed: 2026-05-18
status: pass
---

# Phase 13 UI Review

## Findings

No blocking UI issues found.

## 6-Pillar Audit

| Pillar | Score | Notes |
| --- | ---: | --- |
| Visual hierarchy | 4/4 | `Open owner debug` is a secondary row action beside `Open replay`; it does not compete with primary Workshop controls. |
| Interaction clarity | 4/4 | Public and owner replay links are distinct. Owner debug still requires the existing replay-page opt-in checkbox before explanations render. |
| Responsive/layout safety | 3/4 | Link text is short and fits existing dense result rows. Future mobile polishing could group replay actions more deliberately if rows become crowded. |
| Accessibility | 4/4 | Links use readable text labels; replay owner toggle remains a real checkbox with test coverage. |
| Privacy UX | 4/4 | Public replay remains default, and owner explanations are hidden until owner mode is authorized and the user opts in. |
| Design-system consistency | 4/4 | Existing Workshop/replay classes are reused; no new component system, nested cards, or decorative layout added. |

## Contract Check

- Workshop result rows preserve `Open replay`.
- Completed replayable Workshop Matches owned by `player:workshop-local` add `Open owner debug`.
- Mirrored top-side local-player Matches are covered by helper tests.
- Public replay URL remains free of owner-debug query params.
- Owner debug replay URL requests `ownerDebug=1&ownerPlayerId=player:workshop-local`, but server authorization decides whether owner mode is returned.

## Verification

- `pnpm --filter @cowards/web test -- workshop-client.test.tsx`
- `pnpm e2e:service`
