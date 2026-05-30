# Phase 192: v1.25 App Contract Baseline and Result/Replay UX Inventory - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 192 creates the v1.27 baseline inventory for building result/replay/workbench UX in front of the frozen `match-execution-app-v1` boundary. It must map current result and replay UX dependencies, fixture surfaces, public/private evidence rules, adapter gates, visual baseline gaps, and coupling risks. It does not redesign the UI, change the frozen contract, or implement later workbench features.

</domain>

<decisions>
## Implementation Decisions

### Inventory Shape
- **D-01:** Produce one combined baseline artifact for Phase 192, tentatively `.planning/artifacts/v1.27-result-replay-ux-inventory.md`.
- **D-02:** The artifact should tie together frozen contract surfaces, result UX, replay UX, fixtures, privacy, visual baseline, and coupling risks so later phases plan from one canonical map.
- **D-03:** Separate appendices or screenshots may be referenced if needed, but the primary Phase 192 deliverable should remain one canonical inventory.

### Coupling Standard
- **D-04:** Use a strict boundary taxonomy for every touched result/replay/fixture surface.
- **D-05:** Classify surfaces as frozen app contract, public service projection, owner/test-only, execution-internal, persistence-internal, or intentionally unstable.
- **D-06:** Any result/replay UI dependency outside frozen app-facing DTOs or existing public service DTO projections should be recorded as a finding for later phases.
- **D-07:** Treat Go orchestration internals, runtime-service envelopes, retry implementation details, persistence internals, raw diagnostics, private Chronicle/debug payloads, host/env/token/DB/package details, Strategy source, StrategyMemory, SoldierMemory, objective payloads, and private runtime internals as unacceptable default public UI dependencies.

### UX Evidence Bar
- **D-08:** Perform a full visual audit during Phase 192, not just a text inventory.
- **D-09:** Capture current desktop and mobile screenshots or equivalent browser evidence for the existing result and replay pages where fixture mode makes this practical.
- **D-10:** Score current workbench gaps so later phases have a concrete visual baseline before implementation.
- **D-11:** The visual audit should remain baseline evidence only; detailed redesign, implementation, and final visual proof belong to later phases.

### Carry-Forward Defaults
- **D-12:** Carry these defaults through v1.27 unless a later phase has a clear reason to differ: use one canonical artifact per phase when practical, classify boundaries strictly, and include visual/browser evidence whenever a phase touches user-facing result/replay UI.
- **D-13:** Closure and audit phases may summarize instead of creating large new inventory documents.

### the agent's Discretion
- The agent may choose the exact inventory headings, screenshot filenames, and visual scoring rubric as long as they serve the decisions above and preserve the v1.27 requirements.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Planning
- `.planning/PROJECT.md` — Project context, constraints, key decisions, and v1.27 parallel workstream note.
- `.planning/workstreams/v1-27-result-replay-workbench/REQUIREMENTS.md` — v1.27 requirements and traceability.
- `.planning/workstreams/v1-27-result-replay-workbench/ROADMAP.md` — Phase 192 scope, success criteria, and downstream phase structure.
- `.planning/workstreams/v1-27-result-replay-workbench/research/SUMMARY.md` — v1.27 research baseline and watch-outs.

### v1.25 Frozen Boundary
- `.planning/milestones/v1.25-REQUIREMENTS.md` — Completed v1.25 contract requirements and fixture coverage.
- `.planning/milestones/v1.25-ROADMAP.md` — Completed phase structure for the frozen Match execution boundary.
- `.planning/milestones/v1.25-MILESTONE-AUDIT.md` — Final audit that the boundary freeze passed.
- `.planning/milestones/v1.25-VERIFY-WORK.md` — Verification evidence for fixtures, result/replay pages, and live regression.
- `.planning/milestones/v1.25-CODE-REVIEW.md` — Fixed findings and residual intentional instability.
- `.planning/artifacts/v1.25-match-execution-boundary-inventory.md` — Frozen app-facing, owner/test-only, and execution-internal surface inventory.
- `.planning/artifacts/v1.25-match-execution-proof.md` — Fixture-mode and signed-in live proof details.
- `.planning/artifacts/v1.25-interface-freeze-decision.md` — Frozen surfaces, intentionally unstable internals, and non-claims.

### Source Surfaces To Inventory
- `packages/spec/src/match-execution-contract.ts` — `match-execution-app-v1`, lifecycle vocabulary, fixture catalog, and privacy fields.
- `apps/web/lib/match-execution-fixture-adapter.ts` — Non-production fixture adapter gates.
- `apps/web/lib/public-service-boundary.ts` — Public MatchSet result projection into contract-backed UI data.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` — Current result page UX surface.
- `apps/web/app/matchsets/evidence-copy.ts` — Current result/replay evidence copy.
- `apps/web/app/matches/[matchId]/replay/page.tsx` — Replay route and owner-debug option resolution.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` — Current replay workbench UI.
- `apps/web/app/matches/replay-ready.ts` — Replay projection, focus, and board realism checks.
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts` — Existing fixture browser proof.
- `scripts/check-boundary-monitors.ts` — Existing boundary, fixture, privacy, and ownership monitors.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/spec/src/match-execution-contract.ts`: provides the frozen contract, required fixture IDs, lifecycle/failure/retry/replay availability values, and privacy exclusions.
- `apps/web/lib/match-execution-fixture-adapter.ts`: provides a gated fixture read path that Phase 192 can use for screenshots and current-page inspection without live execution services.
- `apps/web/app/matchsets/evidence-copy.ts`: centralizes much of the current public evidence copy and should be inventoried before later phases refactor readability.
- `apps/web/app/matches/replay-ready.ts`: already validates replay board realism and should be called out as the source of server/projection realism checks.
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts`: already iterates all v1.25 MatchSet fixture IDs and can inspire Phase 192's visual audit proof.

### Established Patterns
- Fixture mode is explicit and non-production gated via `PLAYWRIGHT_TEST=1`, `NODE_ENV=test`, or `COWARDS_ENABLE_MATCH_EXECUTION_FIXTURES=1`, with production disabled.
- Result and replay pages should consume frozen app-facing DTOs or public service projections, not runtime-service or orchestration internals.
- Public evidence copy is intentionally privacy-first and should avoid private Strategy/runtime details by default.
- Replay board realism is validated before rendering, while browser proof checks nonblank canvas and visible in-bounds pieces.

### Integration Points
- Phase 192 should inspect `/matchsets/match-set%3Afixture%3A<fixture-id>` for every v1.25 result fixture.
- Phase 192 should inspect `/matches/match%3Afixture%3Apublic-safe-replay/replay` for current replay UX.
- Phase 192 should record where current pages use result lifecycle state, replay availability, evidence copy, fixture gates, and owner-debug surfaces.

</code_context>

<specifics>
## Specific Ideas

- The inventory should be practical enough that Phases 193-199 can plan from it without rediscovering the frozen boundary.
- The user explicitly chose a stronger visual baseline for Phase 192: desktop/mobile screenshots or browser evidence and visual gap scoring should happen now.
- Similar artifact/taxonomy/visual-proof decisions should be carried forward across v1.27 unless a later phase has an obvious exception.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 192-v1.25 App Contract Baseline and Result/Replay UX Inventory*
*Context gathered: 2026-05-30*
