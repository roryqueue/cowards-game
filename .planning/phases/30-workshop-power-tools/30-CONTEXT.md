# Phase 30: Workshop Power Tools - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 30 delivers the Strategy Workshop power-tool layer for v1.5: deterministic gauntlet matrices, revision comparison, structured diagnostics, replay handoff, and profile-scoped gauntlet result summaries. It clarifies how players author, test, compare, and diagnose immutable Strategy Revisions before later phases design and validate the Advanced Strategy Library.

This phase does not design the Advanced Strategy set, generate example MatchSets, generate the demo tournament, or perform final replay review. Those belong to Phases 32-36.

</domain>

<decisions>
## Implementation Decisions

### Gauntlet Matrix Shape

- **D-01:** The default gauntlet launch experience should optimize for guided Smoke first, not matrix-first power mode. The initial experience should help a player run a credible small test quickly.
- **D-02:** The guided Smoke default should use a curated v1.4 benchmark subset, especially the strongest v1.4 evidence opponents plus one foil, rather than all 10 Starters.
- **D-03:** Matrix size limits should use hard preset caps with a visible match-count preview. Launch should be disabled when the selected run exceeds the cap.
- **D-04:** Matrix rows should be candidate revisions and columns should be opponents. This supports comparing several revisions against the same field.

### Revision Comparison Flow

- **D-05:** Revision comparison should live in a dedicated Compare tab inside the Workshop. Do not bury the flow only inside revision history or require a separate route for Phase 30.
- **D-06:** The default comparison pair should be the current selected revision vs the previous revision.
- **D-07:** Result deltas require an exact matching gauntlet profile hash. If the profiles differ, the UI should explain the mismatch instead of showing approximate deltas.
- **D-08:** Source diff is owner-only/local Workshop only. Public pages never expose Strategy source through comparison.

### Diagnostics and Replay Handoff

- **D-09:** Phase 30 diagnostics should prioritize grouped failure categories first: validation error, transpile error, invalid Strategy output, invalid Action, timeout, source/memory limit, Strategy failure, system failure, Chronicle unavailable, and replay projection unavailable.
- **D-10:** Diagnostics should show public-safe tactical context by default when available: Match, side, Soldier, Round, Activation, Cycle, Action type, terminal reason, result impact, and replay context.
- **D-11:** Owner-debug replay links should appear only when server-authorized, next to the public replay link.
- **D-12:** Replay deep links to exact Cycle/event are nice-to-have for Phase 30, not required. Whole-Match replay links are required.

### Performance Summary Vocabulary

- **D-13:** The top-level summary should emphasize gauntlet record and reliability first: W-L-D, points, Strategy failures, and system/degraded counts.
- **D-14:** The primary user-facing term should be "Gauntlet results".
- **D-15:** System failures belong in a separate reliability bucket and must never count as Strategy performance.
- **D-16:** Summary copy should use profile-scoped language everywhere, such as "In this gauntlet profile...", with profile hash/version labels. Avoid durable rating implications.

### the agent's Discretion

The planner may decide exact component boundaries, API shapes, database migration details, polling mechanics, and internal DTO names as long as the decisions above are preserved. The planner may also decide whether replay deep links are cheap enough to include, but they must remain optional for Phase 30.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning and Research

- `.planning/PROJECT.md` — Current milestone context, non-negotiable constraints, and v1.5 goal.
- `.planning/REQUIREMENTS.md` — Phase 30 requirements WSHOP-01 through WSHOP-09 and DIAG-01 through DIAG-06.
- `.planning/ROADMAP.md` — Phase 30 goal, success criteria, notes, and boundaries.
- `.planning/STATE.md` — Current milestone state and next workflow position.
- `.planning/research/v1.5-WORKSHOP-UX.md` — Research recommendations for deterministic gauntlet matrix, comparison, diagnostics, replay handoff, and gauntlet results.
- `.planning/research/v1.5-STRATEGY-LIBRARY.md` — Strategy-library evidence needs that Phase 30 tooling must support downstream.
- `.planning/research/v1.5-SUMMARY.md` — Balanced synthesis of Workshop tooling and Advanced Library evidence direction.

### Existing Workshop and MatchSet Code

- `apps/web/app/workshop/workshop-client.tsx` — Current Workshop UI: Starter Library, editor, validation panel, revision history, single Workshop test, scoring, and replay links.
- `apps/web/app/workshop/workshop-client-state.ts` — Existing Workshop helper functions for validation state, test status, replay availability, owner replay links, and formatting.
- `apps/web/app/workshop/server.ts` — Current Workshop server facade for snapshot loading, validation, submission, source loading, test launch, and test summary.
- `apps/web/app/workshop/types.ts` — Current Workshop request/response DTOs.
- `apps/web/app/workshop/monaco-editor.tsx` — Existing Monaco editor integration to extend for source diff and markers.
- `packages/persistence/src/workshop.ts` — Current Workshop persistence/service layer: local Workshop revisions, opponents, presets, samples, single-opponent MatchSet creation, summary loading.
- `packages/persistence/src/matchset-service.ts` — Existing deterministic matrix creation and MatchSet/job insertion path to reuse.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `StrategySourceEditor` in `apps/web/app/workshop/monaco-editor.tsx` already wraps Monaco and can be extended or paired with Monaco diff/marker behavior.
- `WorkshopClient` already has the three-column Workshop shell, revision history, validation display, and Workshop test panel.
- `workshop-client-state.ts` already centralizes status copy, validation formatting, replay hrefs, owner replay hrefs, terminal status checks, and replay availability.
- `createWorkshopTestMatchSet` already creates a persisted MatchSet from a valid immutable Workshop revision and opponent.
- `generatePresetMatrix` and `createMatchSetService` already provide deterministic preset expansion, revision locking, match insertion, match job insertion, and matrix index recording.

### Established Patterns

- Workshop tests currently require submitted immutable Strategy Revisions, not mutable drafts.
- Public Workshop/test summaries do not return Strategy source.
- Owner replay links are URL requests, but actual owner-debug authorization remains server-side.
- MatchSet status is polled from the client and refreshed server-side through persistence services.
- Presets already expose Smoke, Standard, and Stress match counts from arena variants, seeds, and mirror side policy.

### Integration Points

- Add gauntlet matrix request/response types near `apps/web/app/workshop/types.ts`.
- Add Workshop server facade methods near `apps/web/app/workshop/server.ts`.
- Extend persistence around `packages/persistence/src/workshop.ts` while reusing `packages/persistence/src/matchset-service.ts`.
- Extend Workshop UI in `apps/web/app/workshop/workshop-client.tsx`; keep logic helpers in `workshop-client-state.ts`.
- Keep replay links compatible with existing `/matches/[matchId]/replay` and owner-debug query behavior.

</code_context>

<specifics>
## Specific Ideas

- Guided Smoke should be the first-run path, with power available after the player understands the shape of the run.
- The curated v1.4 benchmark subset should include top evidence opponents from v1.4 and one foil so the Smoke default is not merely "fight the three strongest brawlers."
- The Compare tab should make the current revision vs previous revision path feel immediate.
- "Gauntlet results" should be profile-scoped and should not read like a durable ranking, ladder, Elo, or permanent rating surface.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 30-Workshop Power Tools*
*Context gathered: 2026-05-20*
