# Phase 213: Public Privacy Scan Expansion - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 213 expands privacy scans and tests for public result/replay pages, replay-unavailable states, fixtures, generated proof artifacts, and public copy snapshots. It hardens public-output privacy. It must not add new private data flows or expose owner/operator/runtime internals.

</domain>

<decisions>
## Implementation Decisions

### Scan Targets
- **D-01:** Scan public result pages, ready replay pages, replay-unavailable pages, fixture payloads, proof artifacts, and public copy snapshots.
- **D-02:** Include target states from v1.29: complete, queued, running, degraded, failed, stale artifact, unavailable runtime, malformed runtime result, missing Chronicle, no-result, invalid Chronicle, and stale replay evidence.

### Forbidden Markers
- **D-03:** Deny Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, private runtime internals, quarantine details, operator action details, and recovery payloads.
- **D-04:** Prefer player-facing privacy copy that explains categories without exposing implementation field names in prominent UX.

### Debug Boundary
- **D-05:** Public scans must prove owner/test-only debug paths are disabled in public mode and cannot become public evidence fallback.
- **D-06:** Fixture mode remains test/dev-only and must stay disabled in production.

### the agent's Discretion
The agent may consolidate marker lists into a reusable helper if it reduces duplication and does not weaken existing scan coverage.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/REQUIREMENTS.md` - `PRIV-*` requirements.
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/ROADMAP.md` - Phase 213 success criteria.

### Privacy Sources
- `packages/spec/src/public-output-privacy.ts` - Public output privacy helpers.
- `packages/spec/src/match-execution-contract.ts` - Public fields excluded list and fixture validation.
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts` - Existing private-marker page scan.
- `apps/web/e2e/v1-28-operations-recovery-proof.spec.ts` - v1.28 signed-in proof privacy pattern.
- `scripts/check-boundary-monitors.ts` - Public output leak safety and monitor checks.

### Public Surfaces
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - Result page scan target.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` - Ready replay scan target.
- `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx` - Unavailable replay scan target.
- `apps/web/lib/match-execution-fixture-adapter.ts` - Fixture mode gate.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `assertPublicOutputLeakSafe` patterns exist in boundary monitors.
- E2E tests already define private marker arrays.
- Contract fixtures already run service DTO leak checks.

### Established Patterns
- Public-output scans are denylist-based but should be paired with allowlisted public evidence copy.
- Proof Markdown and JSON artifacts are scanned where they could leak private markers.

### Integration Points
- Add/extend shared marker lists where feasible.
- Wire new proof artifact privacy scan into boundary monitors in Phase 215 if not already included here.

</code_context>

<specifics>
## Specific Ideas

Add a small public-copy snapshot test so privacy wording itself does not drift into private field names while still conveying what is excluded.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 213-Public Privacy Scan Expansion*
*Context gathered: 2026-05-31*
