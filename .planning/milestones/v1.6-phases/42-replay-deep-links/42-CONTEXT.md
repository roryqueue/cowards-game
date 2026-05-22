# Phase 42: Replay Deep Links - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>

## Phase Boundary

Phase 42 adds public-safe replay deep links targeted to meaningful moments: Backstab, contraction, no-advance cleanup, fall, decisive push, and late-cycle stabilization. It defines deterministic moment selection, query-param URL state, replay startup/focus behavior, fallback handling, and owner-debug separation. It does not build saved profiles, heatmaps, evidence explorer tables, or export endpoints.

</domain>

<decisions>

## Implementation Decisions

### Moment Selection Rules

- **D-01:** Moment selection uses type-specific deterministic rules.
- **D-02:** `BACKSTAB` selects the first public Backstab resolution.
- **D-03:** `CONTRACTION` selects the first public contraction.
- **D-04:** `FALL` selects the first public fall.
- **D-05:** `NO_ADVANCE_CLEANUP` selects the first qualifying public no-advance/blocked/no-reverse cleanup moment.
- **D-06:** `DECISIVE_PUSH` selects a deterministic push nearest final outcome or strongest public scoring/position swing available.
- **D-07:** `LATE_CYCLE_STABILIZATION` selects the latest qualifying public late-cycle stabilization before outcome.
- **D-08:** Derived moments use conservative detection. If public projection data does not clearly support `NO_ADVANCE_CLEANUP`, `DECISIVE_PUSH`, or `LATE_CYCLE_STABILIZATION`, do not invent one.
- **D-09:** Missing derived moments are not errors.
- **D-10:** Labels must be honest and plain, not tactical overclaims.
- **D-11:** Raw public event moments such as Backstab, contraction, and fall are preferred when available.

### URL Shape and Replay Startup

- **D-12:** Deep-link target state uses query params, e.g. `/matches/[matchId]/replay?moment=BACKSTAB&sequence=42`.
- **D-13:** Query params should be parsed safely and ignored if invalid.
- **D-14:** Generated links should use the encoded Match id pattern already required by current replay routes.
- **D-15:** Replay opens focused at the target sequence before playback, without surprise autoplay.
- **D-16:** Timeline entry should be focused/highlighted.
- **D-17:** Board state initializes at or nearest to the target sequence.
- **D-18:** If the exact state snapshot is unavailable, use the nearest replay state before or at the sequence.
- **D-19:** User playback controls remain normal after load.

### Fallback Behavior

- **D-20:** Fallback state is explicit and typed.
- **D-21:** If the target sequence is unavailable but the public replay exists, open Match start with a visible fallback notice.
- **D-22:** Fallback notices use safe reason categories only: unavailable, private/incompatible, no longer present, or replay unavailable.
- **D-23:** Fallback notices must not expose stack traces, raw Chronicle errors, owner debug, private payloads, or runtime internals.
- **D-24:** Fallback notice should not block normal replay use.
- **D-25:** Omit absent moment types from heatmap/cell-level surfaces.
- **D-26:** Evidence Explorer and Match detail surfaces may show unavailable placeholders such as “not found in public evidence” for useful expected moment types.
- **D-27:** Missing moment is not a system failure.

### Owner Debug Separation

- **D-28:** Public deep links never grant owner debug.
- **D-29:** Owner debug remains server-authorized and separate from public moment targeting.
- **D-30:** Query params may request owner mode, but the server decides whether owner debug is allowed.
- **D-31:** Public analytics references are generated from public projection data by default.
- **D-32:** If an authorized owner opens a public moment link, it opens in public mode unless the owner explicitly toggles debug.
- **D-33:** Owner debug toggle may preserve target sequence where possible after authorization.
- **D-34:** Public link semantics stay reproducible and do not surprise owners into private view.

### the agent's Discretion

- The user approved auto-locking choices that clearly follow from deterministic public projections, privacy, strict fallback semantics, and owner-debug authorization boundaries.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Context

- `.planning/PROJECT.md` — Core privacy, replay, runtime, and deterministic evidence constraints.
- `.planning/REQUIREMENTS.md` — Phase 42 requirements LINK-01 through LINK-07.
- `.planning/ROADMAP.md` — Phase 42 boundary and success criteria.
- `.planning/research/SUMMARY.md` — v1.6 replay deep-link research direction.
- `.planning/phases/38-analytics-evidence-model/38-CONTEXT.md` — Compact replay reference shape, fixed moment enum, fallback states, and public projection decisions.
- `.planning/phases/41-evidence-explorer-ux/41-CONTEXT.md` — Explorer handoff and current-replay-link boundary consumed by Phase 42.

### Replay and Chronicle Code

- `apps/web/app/matches/replay-ready.ts` — Public/owner projection, replay timeline construction, initial sequence behavior, and owner debug projection path.
- `apps/web/app/matches/types.ts` — Replay page DTOs, timeline entry shape, and replay options.
- `apps/web/app/matches/server.ts` — Replay retrieval and owner authorization path.
- `apps/web/app/matches/[matchId]/replay/page.tsx` — Replay route/page entry point.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` — Replay client startup/playback/timeline UI behavior.
- `apps/web/app/matches/[matchId]/replay/replay-state.ts` — Replay state model and sequence handling.
- `packages/replay/src/project.ts` — Public/owner Chronicle projection behavior.
- `packages/replay/src/reconstruct.ts` — Replay reconstruction and sequence/state availability.
- `packages/spec/src/types.ts` — Chronicle event types, privacy model, and replay-compatible ids.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- Replay timeline entries already expose sequence, event type, round, activation, cycle, label, privacy, context, and payload.
- `buildReadyReplayFromChronicle` already computes `states`, `timeline`, `projection`, and `initialSequence`.
- `trustedOwnerReplayOptions` already separates requested owner debug from authorized owner debug.
- Replay route can be extended to parse query params and pass initial sequence/moment focus into replay data or client state.

### Established Patterns

- Public replay projection hides private/owner event payloads by default.
- Owner debug authorization is server-side and cannot be granted by query params alone.
- Replay validation/fallback returns safe unavailable DTOs instead of raw Chronicle errors.
- Canonical replay state is sequence-oriented.

### Integration Points

- Add deterministic moment-detection helpers that operate on public-projected timeline/events.
- Add query-param parsing for `moment` and `sequence` in replay route/server/client flow.
- Extend replay-ready DTOs or client state to carry focused/highlighted target metadata and fallback notice.
- Add tests for deterministic moment selection, invalid query params, fallback categories, owner debug separation, and public privacy.
- Add browser checks for opening a deep link at target sequence and seeing the focused/highlighted timeline entry.

</code_context>

<specifics>

## Specific Ideas

- Deep links are for study, so they should open focused and paused rather than auto-playing.
- Conservative detection is better than overconfident tactical labeling.
- Public link behavior should be reproducible whether the viewer is anonymous, owner-authorized, or later toggles owner debug.

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 42-Replay Deep Links*
*Context gathered: 2026-05-22*
