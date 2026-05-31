# Phase 215: Contract Compatibility Monitors - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 215 adds or extends monitors proving v1.29 public UX/proof changes did not drift from frozen `match-execution-app-v1`. It validates contract version, DTO shape, fixture categories, public privacy, ownership boundaries, no runtime promotion, and no public recovery/operator/internal state. It must not change the contract to make monitors pass.

</domain>

<decisions>
## Implementation Decisions

### No-Drift Proof
- **D-01:** Monitors must prove no public execution DTO fields were added, removed, renamed, semantically narrowed, or repurposed.
- **D-02:** Monitors must prove no v1.29-specific public contract version appears; `match-execution-app-v1` remains the only app execution contract.
- **D-03:** v1.29 proof should be classified as app/public presentation and proof over existing DTOs.

### Boundary Coverage
- **D-04:** Continue checking ownership creep, Strategy execution in web/API/Go, runtime-service recovery ownership, TypeScript backend fallback, fixture fallback in production, privacy leaks, and premature runtime promotion claims.
- **D-05:** Explicitly reject public recovery, quarantine, operator, runtime-service-internal, raw diagnostics, or private diagnostics state in UX copy/fixtures/proof.

### Monitor Style
- **D-06:** Prefer a monitor-readable v1.29 proof artifact, likely JSON plus Markdown, following v1.26/v1.28 patterns.
- **D-07:** The monitor should fail loudly on missing target-state proof rather than silently accepting partial coverage.

### the agent's Discretion
The agent may decide exact schema fields for v1.29 proof artifacts if they are public-safe, stable enough for monitors, and do not become product DTOs.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/REQUIREMENTS.md` - `COMPAT-*` requirements.
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/ROADMAP.md` - Phase 215 success criteria.

### Existing Monitors and Proof
- `scripts/check-boundary-monitors.ts` - Boundary monitor implementation.
- `scripts/evaluate-v1-26-match-execution-reliability.ts` - Reliability proof generator pattern.
- `scripts/evaluate-v1-28-match-execution-operations.ts` - Operations proof generator pattern.
- `.planning/artifacts/v1.28-match-execution-operations-proof.json` - Existing proof schema example.
- `.planning/artifacts/v1.28-match-execution-operations-proof.md` - Existing public-safe proof summary.

### Contract
- `packages/spec/src/match-execution-contract.ts` - Frozen contract source.
- `packages/spec/src/match-execution-contract.test.ts` - Contract test expectations.
- `apps/web/lib/match-execution-fixture-adapter.ts` - Fixture adapter production gate.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `checkV125MatchExecutionContractFreeze`, `checkV126MatchExecutionReliabilityProof`, and `checkV128MatchExecutionOperationsProof` are direct monitor patterns.
- Existing proof artifacts include schema version, contract version, ownership, fixture validation, relevant pages, and non-claims.

### Established Patterns
- Boundary monitors read JSON artifacts and assert exact public contract/non-claim fields.
- Markdown proof artifacts are scanned for private output leaks.

### Integration Points
- Add v1.29 artifact paths near existing v1.28 constants.
- Add new check into `runBoundaryMonitorChecks`.
- Ensure package scripts or proof generation command are documented for Phase 216/217.

</code_context>

<specifics>
## Specific Ideas

Monitor should include a "contract shape snapshot" or equivalent field list/hash to prove v1.29 did not alter public DTO shape.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 215-Contract Compatibility Monitors*
*Context gathered: 2026-05-31*
