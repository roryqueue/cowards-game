# Phase 210: Public Result/Replay Baseline Inventory - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 210 produces a public result/replay baseline inventory for v1.29. It maps existing public UX, fixture, proof, visual, privacy, and monitor surfaces to the target states before implementation. It must classify surfaces and gaps only; it must not change runtime behavior, public DTOs, or product UX yet.

</domain>

<decisions>
## Implementation Decisions

### Phase Map
- **D-01:** Use the confirmed sequential v1.29 phase map: 210 baseline, 211 result state polish, 212 replay trust, 213 privacy scans, 214 board/visual proof, 215 compatibility monitors, 216 public page proof, 217 closeout.
- **D-02:** Map `BASE-*` requirements only to Phase 210.

### Contract Boundary
- **D-03:** Treat `match-execution-app-v1` as frozen. Do not add, rename, remove, repurpose, semantically narrow, or version-bump public execution DTO fields.
- **D-04:** Inventory may recommend later app/public UX changes, but it must not recommend execution-side changes unless it finds a read-only public projection bug and documents why.

### Inventory Style
- **D-05:** Inventory should be concrete and file-backed: list pages, components, tests, fixtures, scripts, proof artifacts, and monitors with current coverage/gaps.
- **D-06:** Missing-Chronicle and no-result should be called out as weaker public page proof areas if confirmed by the inventory.

### the agent's Discretion
The agent may choose table shape, artifact filename, and exact gap taxonomy if the artifact remains public-safe, monitor-readable, and aligned with the roadmap.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` - Current v1.29 goal and global constraints.
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/REQUIREMENTS.md` - Phase 210 requirements and milestone boundary.
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/ROADMAP.md` - Confirmed phase map and success criteria.
- `.planning/research/v1.29-SUMMARY.md` - Research baseline and current UX/proof findings.
- `.planning/milestones/v1.28-MILESTONE-AUDIT.md` - Frozen-contract and non-claim baseline from v1.28 closeout.

### Contract and UX Surfaces
- `packages/spec/src/match-execution-contract.ts` - Frozen lifecycle/failure/replay vocabulary and fixtures.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - Public MatchSet result page.
- `apps/web/app/matchsets/evidence-copy.ts` - Existing public evidence copy rows.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` - Ready replay page.
- `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx` - Replay unavailable page.
- `apps/web/lib/match-execution-fixture-adapter.ts` - Test/dev-only fixture-backed public read adapter.

### Proof and Monitors
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts` - Existing public-safe fixture page proof.
- `apps/web/e2e/replay.visual.spec.ts` - Replay board visual coverage and canvas-pixel checks.
- `scripts/check-boundary-monitors.ts` - Boundary monitor and v1.28 proof checks.
- `.planning/artifacts/v1.28-match-execution-operations-proof.md` - v1.28 public compatibility outcome inventory.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MATCH_EXECUTION_CONTRACT_FIXTURES_V1`: current public fixture catalog for result/replay states.
- `matchSetEvidenceRows` and `replayEvidenceRows`: central public copy generators.
- `checkV128MatchExecutionOperationsProof`: monitor pattern for proof artifacts.

### Established Patterns
- Fixture adapter is test/dev only and disabled in production.
- Public result/replay copy is derived from service DTOs plus app contract projection.
- Boundary monitors enforce ownership, privacy, non-promotion, and frozen contract claims.

### Integration Points
- New inventory artifact should likely live under `.planning/artifacts/v1.29-*`.
- Any new check should be referenced by `scripts/check-boundary-monitors.ts`.

</code_context>

<specifics>
## Specific Ideas

Use a state-by-state matrix with columns for public state, existing DTO inputs, current page behavior, fixture coverage, replay proof coverage, privacy scan coverage, visual proof coverage, and v1.29 gap.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 210-Public Result/Replay Baseline Inventory*
*Context gathered: 2026-05-31*
