# Phase 214: Board Realism and Visual Regression Coverage - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 214 strengthens public browser, board realism, and visual regression coverage for replay/result trust surfaces. It may add tests, screenshots, fixture scenarios, and validation around existing public replay data. It must not change canonical rules, engine behavior, Chronicle persistence, or execution semantics.

</domain>

<decisions>
## Implementation Decisions

### Board Realism
- **D-01:** Preserve existing realism checks: nonblank canvas, unclipped rendering, in-bounds visible Soldiers and STONE terrain, no visible FALLEN Soldiers, visible Soldiers have positions, no overlaps, and canonical starts where applicable.
- **D-02:** Board realism checks should fail loudly before rendering misleading public replay evidence.
- **D-03:** Do not put game rules in React components; board checks should stay in projection/model/test helpers, not invented in presentation-only code.

### Visual Regression
- **D-04:** Add coverage for replay trust panels and unavailable/missing evidence states, not only board event callouts.
- **D-05:** Add result page visual checks for long Match ids, long public messages, rows without replay links, and responsive evidence panels.
- **D-06:** Desktop and mobile proof are both required where practical.

### Design Boundary
- **D-07:** Keep trust surfaces dense, stable, and readable. Avoid decorative redesigns, nested cards, and layout shifts.

### the agent's Discretion
The agent may decide whether to add Playwright snapshots, pixel checks, unit-level board validation tests, or a mix, provided the proof catches blank/clipped/misframed boards and broken trust panels.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/REQUIREMENTS.md` - `BOARD-*` requirements.
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/ROADMAP.md` - Phase 214 success criteria.
- `AGENTS.md` - Board realism testing expectations.

### Replay Board and Visual Tests
- `apps/web/e2e/replay.visual.spec.ts` - Current replay visual/pixel checks.
- `apps/web/e2e/replay.visual.spec.ts-snapshots/` - Existing replay visual baselines.
- `apps/web/app/matches/[matchId]/replay/replay-board.tsx` - Replay board rendering.
- `apps/web/app/matches/[matchId]/replay/replay-board-model.ts` - Board model helpers.
- `apps/web/app/matches/replay-ready.ts` - Board realism validation.
- `apps/web/app/matches/[matchId]/replay/replay-board.test.ts` - Board unit coverage.

### Result Visual Surfaces
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - Result page layout.
- `apps/web/app/globals.css` - Responsive layout classes.
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts` - Existing fixture page proof.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `readPngPixelStats` and `expectNonblankCanvasPixels` already detect blank or under-rendered canvases.
- `replayBoardRealismError` already validates board state before public replay rendering.
- Replay visual tests already cover event callouts and board scale.

### Established Patterns
- Visual tests use Playwright screenshots with disabled animations and max diff tolerance.
- Board realism belongs near replay data construction and tests, not in ad hoc page copy.

### Integration Points
- Extend `replay.visual.spec.ts` or add a v1.29-specific visual proof spec.
- Add fixture scenarios only through test/dev fixture support.

</code_context>

<specifics>
## Specific Ideas

Include at least one visual check for a replay-unavailable/trust state and one result page with no replay link or long evidence text.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 214-Board Realism and Visual Regression Coverage*
*Context gathered: 2026-05-31*
