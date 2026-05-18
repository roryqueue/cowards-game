---
phase: 13
slug: close-gap-persisted-owner-replay-debug-authorization
status: approved
shadcn_initialized: false
preset: none
created: 2026-05-18
---

# Phase 13 - UI Design Contract

## Scope

Phase 13 changes the Workshop result surface and persisted replay owner-debug route only. It must make the owner replay path discoverable from real Workshop Match results without changing the replay viewer's existing opt-in owner-debug interaction model.

## Design System

Use the existing custom CSS in `apps/web/app/globals.css`. Do not add shadcn, Tailwind, new icon libraries, or new card systems.

## Surfaces

| Surface | Contract |
| --- | --- |
| Workshop Match results | Keep the existing public `Open replay` affordance. Add a second owner-only replay affordance only when a completed Match has replay data and the local Workshop player is a participant. |
| Owner replay link | The link requests owner debug with query parameters, but the copy must not imply the query string is authorization. Use concise action copy such as `Open owner debug`. |
| Public replay link | Public replay remains the first/default link and must keep its current URL without owner-debug params. |
| Replay viewer | Preserve the existing `Public view` / `Owner debug` status chip and checkbox-driven owner debug toggle. Owner explanations stay hidden until the user opts in. |
| Replay unavailable states | Do not add dead owner-debug links. Keep unavailable copy focused on missing Chronicle or pending Match state. |

## Interaction Rules

- Owner replay links are rendered from persisted Match summary data, not hard-coded assumptions about bottom/top side.
- Mirrored Workshop Matches must still generate the owner-debug link for `player:workshop-local` when that player is top.
- Public replay links and owner replay links may sit beside each other in the Match row; keep labels short so rows remain scannable.
- No Strategy source, StrategyMemory, SoldierMemory, objective payload, raw Awareness Grid details, raw runtime details, or ownerDebug JSON may appear in Workshop result rows.

## Visual Constraints

- Reuse existing link/button classes for replay actions.
- Preserve dense operational layout; no new hero, nested cards, or explanatory panels.
- New text must fit in existing Match result rows at mobile and desktop widths.
- Use canonical terms exactly: Soldier, Match, Strategy, Chronicle, replay, owner debug.

## Acceptance

- A completed Workshop Match row with replay data shows a public replay link and, when the local Workshop player participated, an owner-debug replay link.
- Opening the owner-debug link lands on a persisted replay whose status chip says `Owner debug` only if the server authorized the requested owner.
- Opening the public replay link for the same Match remains public and contains no owner-only explanation affordances.
