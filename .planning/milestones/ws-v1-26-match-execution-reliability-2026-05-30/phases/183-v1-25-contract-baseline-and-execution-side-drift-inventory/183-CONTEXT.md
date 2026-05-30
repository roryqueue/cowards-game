# Phase 183: v1.25 Contract Baseline and Execution-Side Drift Inventory - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Rebaseline v1.25's frozen `match-execution-app-v1` contract and inventory execution-side drift risks before any reliability implementation. This phase produces evidence and classification, not runtime behavior changes.

</domain>

<decisions>
## Implementation Decisions

### Contract Baseline
- **D-01:** Treat `match-execution-app-v1` as frozen. No app-facing additions should be proposed unless this inventory proves a strictly backward-compatible public-safe addition is necessary.
- **D-02:** The inventory must explicitly separate frozen app contract surfaces from Go internals, runtime-service internals, persistence internals, owner/test-only proof surfaces, and intentionally unstable details.
- **D-03:** Inventory must include all public outcome emitters for unavailable, degraded, system failure, malformed runtime result, stale artifact, timeout, retryable, and non-retryable evidence.

### Ownership Calibration
- **D-04:** Preserve Go ownership of orchestration, lifecycle, scoring, public evidence, retry policy, and promotion decisions.
- **D-05:** Preserve runtime-service ownership only for hostile Strategy execution through schema-validated ABI envelopes and registered runtime implementations.
- **D-06:** Preserve JS/TS counted status, Python/Rust/Zig non-counted beta status, and Preview 1 stdin/stdout JSON as the active WASM/WASI ABI.

### the agent's Discretion
Use the clearest inventory format for downstream planning, but include both a Markdown artifact and enough machine-checkable structure if existing monitor patterns make that practical.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning and Freeze Baseline
- `.planning/workstreams/v1-26-match-execution-reliability/REQUIREMENTS.md` — v1.26 requirement scope and traceability.
- `.planning/workstreams/v1-26-match-execution-reliability/ROADMAP.md` — phase boundaries and success criteria.
- `.planning/research/v1.26-SUMMARY.md` — milestone research and calibration decisions.
- `.planning/artifacts/v1.25-interface-freeze-decision.md` — frozen surfaces and intentionally unstable internals.
- `.planning/artifacts/v1.25-match-execution-boundary-inventory.md` — v1.25 boundary inventory to rebaseline from.
- `.planning/artifacts/v1.25-match-execution-proof.md` — v1.25 fixture and signed-in proof.

### Contract and Monitors
- `packages/spec/src/match-execution-contract.ts` — `match-execution-app-v1` schemas, fixtures, and projections.
- `packages/spec/src/match-execution-contract.test.ts` — contract tests and existing fail-closed cases.
- `scripts/check-boundary-monitors.ts` — boundary monitor patterns and v1.25 freeze checks.

### Execution-Side Surfaces
- `apps/go-backend/orchestrator.go` — Go runtime-service orchestration entry point.
- `apps/go-backend/runtime_service_client.go` — Go runtime-service request/response validation and failure classification.
- `apps/go-backend/job_lifecycle.go` — retry, lease, and failure persistence behavior.
- `apps/go-backend/completion.go` — Match completion and Chronicle persistence handoff.
- `apps/go-backend/matchset_status.go` — MatchSet status refresh and scoring projection.
- `apps/runtime-service/src/execute-match.ts` — runtime-service execution envelope handling.
- `apps/runtime-service/src/server.ts` — runtime-service HTTP boundary.
- `apps/runtime-service/src/redaction.ts` — runtime-service redaction rules.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/spec/src/match-execution-contract.ts`: existing lifecycle/failure vocabulary and fixture catalog can anchor compatibility.
- `scripts/check-boundary-monitors.ts`: existing freeze monitor can be extended with v1.26 drift inventory checks.

### Established Patterns
- Go validates runtime-service envelopes before completing Matches and records failures through job lifecycle.
- Runtime-service emits schema-validated `systemFailure` envelopes and redacts diagnostics.
- Public app surfaces consume contract projections rather than runtime-service internals.

### Integration Points
- Inventory should cover Go backend files, runtime-service files, spec contract files, web public service boundary, proof harnesses, and existing `.planning/artifacts/v1.25-*` evidence.

</code_context>

<specifics>
## Specific Ideas

The inventory should answer one sharp question before later phases: "Can v1.26 harden execution reliability without changing `match-execution-app-v1`?" The expected answer is yes unless evidence proves otherwise.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 183-v1.25 Contract Baseline and Execution-Side Drift Inventory*
*Context gathered: 2026-05-30*
