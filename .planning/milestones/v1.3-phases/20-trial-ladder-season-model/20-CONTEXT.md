# Phase 20: Trial Ladder Season Model - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 20 defines the resettable trial ladder season model: season lifecycle, entry eligibility, immutable entry snapshot behavior, withdrawal, stale revision policy, public season contract, and narrow operator controls. It must preserve exhibition self-play while enforcing one active ladder Strategy Revision per user per season.

This phase does not generate ladder MatchSets, compute standings, build public profiles/Strategy cards, implement dispute review, invalidate results, or harden the production runtime boundary. Those are later v1.3 phases.

</domain>

<decisions>
## Implementation Decisions

### Season Lifecycle Shape
- **D-01:** Use a full explicit season lifecycle: `draft`/`pending`, `open`, `scheduling`, `active`, `completed`, and `archived`.
- **D-02:** Use warmer player-facing labels for raw lifecycle states, such as "Preparing," "Open for entries," "Scheduling matches," "Matches running," "Complete," and "Archived."
- **D-03:** Season transitions are developer/admin controlled in v1.3. No automatic state movement should surprise operators during beta.
- **D-04:** The data model should leave room for scheduled windows and future automation.
- **D-05:** Store optional open/close/scheduled-at/completed-at timestamps for display and future automation, but do not require timestamps to drive transitions yet.
- **D-06:** If a season has too few eligible entries, keep it open with a visible minimum entry requirement and do not schedule MatchSets.
- **D-07:** Do not convert under-filled seasons into exhibitions or mark them failed merely because they have not filled.

### Entry Locking and Withdrawal
- **D-08:** Ladder entries lock on accepted entry. The accepted Strategy Revision snapshot is fixed for the season.
- **D-09:** Player withdrawal affects future scheduling only. Already scheduled or completed evidence remains intact.
- **D-10:** Withdrawal is a safety valve, not a history rewrite.
- **D-11:** Withdrawal status should be public, visible, and neutral. It should not imply misconduct.
- **D-12:** Withdrawal is final for the season. A withdrawn user cannot re-enter that same season, even with the same snapshot.

### Stale Revision Policy
- **D-13:** Submitting a newer Strategy Revision after entry has no effect on the current season entry.
- **D-14:** Deleting or hiding the Strategy after entry does not remove the locked ladder snapshot. Public source remains hidden.
- **D-15:** Runtime or engine incompatibility blocks future scheduling but preserves existing scheduled/completed evidence.
- **D-16:** Already scheduled/completed evidence remains visible and is counted or excluded based on result validity.
- **D-17:** Phase 20 should model policy-invalid or abusive states such as `suspended` or `invalidated`.
- **D-18:** Evidence review, standings exclusion, dispute workflow, and audit decisions for abusive/policy-invalid cases belong to Phase 23 governance.

### Public Season Contract
- **D-19:** Before matches are scheduled, public season pages should show rules and entries.
- **D-20:** Public season pages should include season state, eligibility rules, one-entry policy, replacement policy, scoring policy, privacy/publication policy, minimum entry count, and visible entries.
- **D-21:** Public season pages must not expose Strategy source, private runtime data, owner debug, or private debug fields.
- **D-22:** Public pre-scheduling entrant detail should include player handle plus Strategy metadata: Strategy name, description, tags, revision hash, and entry status.
- **D-23:** Richer public Strategy profile/card presentation belongs to Phase 22.
- **D-24:** Public season pages should explicitly state that trial ladder standings reset at season end and are not permanent all-time ratings.
- **D-25:** Entry counts and minimum scheduling threshold should be public, without exposing private/debug details.

### Operator Controls
- **D-26:** Phase 20 should include lifecycle controls plus narrow entry status controls.
- **D-27:** Operators can create, edit metadata, open, mark scheduling-ready, mark active, complete, and archive seasons.
- **D-28:** Operators can set basic entry states like suspended/restored where needed for compatibility or future governance readiness.
- **D-29:** Phase 20 should record minimal audit events for season lifecycle and entry status changes, including actor, timestamp, target, before/after state, and reason.
- **D-30:** Operator reason fields are required for nontrivial lifecycle and entry status changes. Use short freeform reasons in v1.3.
- **D-31:** Phase 20 operator controls exclude result invalidation, dispute review, entry deletion, and force replacement.
- **D-32:** Operators can change season/entry state with reasons and audit events, but cannot rewrite evidence or swap a user's Strategy Revision.

### the agent's Discretion
- The planner may choose exact enum names if they preserve the locked semantics and player-facing labels.
- The planner may decide which lifecycle transitions count as "nontrivial" for required reasons, but entry status changes and public lifecycle changes should require reasons.
- The planner may choose the minimal operator UI/API surface needed to exercise these controls in beta.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` — v1.3 milestone constraints and competition trust goals.
- `.planning/REQUIREMENTS.md` — SEASON-01 through SEASON-06 and ENTRY-01 through ENTRY-08 define Phase 20 requirements.
- `.planning/ROADMAP.md` — Phase 20 goal, success criteria, and notes.
- `.planning/research/SUMMARY.md` — v1.3 research direction for seasons, eligibility, standings, and governance.

### Existing Competition Model
- `packages/spec/src/competition.ts` — Existing competition preset, entrant snapshot, public result, standings, and leak-safe DTO contracts.
- `packages/persistence/migrations/0003_competitive_alpha.sql` — Existing v1.2 account, session, MatchSet, competition entrant, duplicate, and submission event tables.
- `packages/persistence/src/competition.ts` — Existing exhibition validation, duplicate policy, entrant snapshot loading, MatchSet generation, and public result construction.
- `packages/persistence/src/scoring.ts` — Existing scoring/tie-breaker behavior that future season standings will aggregate.
- `apps/web/app/exhibitions/new/exhibition-client.tsx` — Existing exhibition entry UI that must remain flexible and self-play friendly.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CompetitionEntrantSnapshot` in `packages/spec/src/competition.ts`: useful basis for season entry locked snapshots.
- `CompetitionStatus`, `PublicMatchSetResultDto`, and leak-safe assertion helpers: useful patterns for public season DTOs and privacy checks.
- `createManualExhibitionMatchSet()` and related validation in `packages/persistence/src/competition.ts`: existing ownership/validity/compatibility validation patterns.
- `competition_submission_events` table: existing event pattern can inform minimal audit events, though season audit likely needs a dedicated table.
- Existing `match_sets` competition fields: future season MatchSets can link to season/pod metadata in Phase 21.

### Established Patterns
- v1.2 snapshots immutable entrant data at competition entry time and does not expose source in public results.
- Existing exhibition allows 2-8 owned revisions, including same-user self-play; Phase 20 must not regress that surface.
- Current competition duplicate/rate-limit checks are server-side and return explicit user-facing errors.
- Existing public result DTOs separate public evidence from private Strategy data.

### Integration Points
- Add season and season entry contracts in `packages/spec`.
- Add v1.3 migration for seasons, season entries, entry status, lifecycle/audit events, and optional schedule metadata.
- Add persistence services for season lifecycle, entry eligibility, locked snapshots, withdrawal, stale status, and public season DTOs.
- Add public season route/page that shows rules, entries, resettable-not-permanent copy, counts, and minimum threshold.

</code_context>

<specifics>
## Specific Ideas

- Player-facing lifecycle labels: Preparing, Open for entries, Scheduling matches, Matches running, Complete, Archived.
- Public season copy should plainly say standings reset and are not permanent all-time ratings.
- Withdrawal should be visible in a neutral tone, such as "Withdrawn from future scheduling."
- Under-filled seasons should communicate the minimum needed for scheduling rather than feeling broken.

</specifics>

<deferred>
## Deferred Ideas

- Automatic time-window-based season transitions — model should support later automation, but v1.3 transitions are operator-controlled.
- Result invalidation and dispute review — Phase 23.
- Scheduling trigger and MatchSet generation — Phase 21.
- Rich public Strategy cards/profiles — Phase 22.
- Preset operator reason values — defer until beta patterns emerge.

</deferred>

---

*Phase: 20-Trial Ladder Season Model*
*Context gathered: 2026-05-19*
