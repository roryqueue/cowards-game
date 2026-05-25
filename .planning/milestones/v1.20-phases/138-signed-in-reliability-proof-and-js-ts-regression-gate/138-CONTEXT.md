# Phase 138: Signed-In Reliability Proof and JS/TS Regression Gate - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 138 upgrades the v1.19 signed-in proof into a bounded repeated-use reliability proof. It must create or sign into a local account, save one JS/TS and two Python Strategy Revisions, create mixed JS/TS-vs-Python and Python-vs-Python non-counted exhibition MatchSets across three cycles, execute through Go -> Runtime Broker/runtime-service -> selected runtime implementations, open result and replay evidence, and verify privacy, candidate evidence, no-fallback behavior, degraded/timeout wording, and JS/TS support.

</domain>

<decisions>
## Implementation Decisions

### Proof Shape
- **D-01:** Use three bounded proof cycles, not one smoke run and not an unbounded stress test.
- **D-02:** Each proof run must include one JS/TS Strategy Revision and two Python Strategy Revisions from a signed-in local account.
- **D-03:** Proof must include non-counted mixed JS/TS-vs-Python and Python-vs-Python exhibition MatchSets.
- **D-04:** Execution must flow through Go -> Runtime Broker/runtime-service -> selected runtime implementation(s).

### Evidence Assertions
- **D-05:** Result and replay pages must show non-counted labels, runtime labels, reliability evidence, candidate lane evidence, degraded/timeout wording where applicable, and public-safe evidence limits.
- **D-06:** Candidate evidence must include the required Docker/runc lane when available and fail-loud runsc preflight evidence.
- **D-07:** Public outputs must pass private marker scans and show no silent fallback, ownership drift, Python counted eligibility, or JS/TS regression.

### JS/TS Regression
- **D-08:** JS/TS support remains intact and counted; Python proof must not weaken the JS/TS Strategy path.
- **D-09:** JS/TS regression proof can reuse the signed-in flow if it verifies counted-path behavior and runtime-service execution remains intact.

### the agent's Discretion
The agent may decide whether the proof artifact is written by the Playwright test, a companion script, or both, but it must be deterministic enough for final audit and monitor checks.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Inputs
- `.planning/phases/133-executable-container-runtime-candidate-lane/133-CONTEXT.md`
- `.planning/phases/135-timeout-latency-and-reliability-budget-model/135-CONTEXT.md`
- `.planning/phases/137-degraded-state-ux-and-public-safe-reliability-evidence/137-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`

### Proof Code
- `apps/web/e2e/v1-19-exhibition-proof.spec.ts` - Existing signed-in proof pattern.
- `apps/go-backend/live_backend.go` - Exhibition creation and `run-once` route.
- `apps/go-backend/runtime_service_client.go` - Runtime-service request/timeout behavior.
- `apps/runtime-service/src/execute-match.ts` - Runtime Broker path.
- `scripts/check-boundary-monitors.ts` - Proof artifact and private marker checks.

### Prior Proof Artifacts
- `.planning/artifacts/v1.19-exhibition-beta-proof.json`
- `.planning/artifacts/v1.19-exhibition-beta-proof.md`
- `.planning/artifacts/v1.19-runtime-isolation-readiness.json`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- v1.19 proof already creates a local account, saves one JS/TS and two Python revisions, creates mixed and Python-vs-Python exhibitions, runs Go `run-once`, and checks result/replay evidence.
- Existing private marker list covers StrategyMemory, SoldierMemory, objectivePayload, strategySource, rawRuntimeDetails, privateRuntime, runtimeInternals, Traceback, stderr, site-packages, DATABASE_URL, and Bearer.
- The current proof is gated by `RUN_V1_19_PROOF=1` and uses a 360 second timeout.

### Known Gaps
- v1.19 proof is one-cycle and does not collect v1.20 reliability/candidate timing evidence.
- v1.20 needs Docker candidate evidence linked to signed-in proof without claiming production sandbox certification.

</code_context>

<specifics>
## Specific Ideas

The proof artifact should record the account shape, strategy revision ids, MatchSet ids, Match ids, runtime labels, candidate lane status, timings, private marker scan result, and promotion stance.

</specifics>

<deferred>
## Deferred Ideas

- Broad production multi-language proof.
- Ranked/ladder Python proof.
- Unbounded endurance or stress testing.

</deferred>

---

*Phase: 138-signed-in-reliability-proof-and-js-ts-regression-gate*
*Context gathered: 2026-05-25*
