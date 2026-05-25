# Phase 135: Timeout, Latency, and Reliability Budget Model - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 135 defines and tests the reliability budget model for repeated exhibition use. It separates deterministic Strategy execution caps from outer Match, MatchSet/job, runtime-service HTTP, and browser proof budgets, then measures mixed JS/TS-vs-Python and Python-vs-Python latency with bounded repeat counts.

</domain>

<decisions>
## Implementation Decisions

### Budget Layers
- **D-01:** Define named budgets for Strategy call, whole Match execution, MatchSet/job orchestration, runtime-service HTTP, and browser proof.
- **D-02:** Preserve deterministic per-Strategy execution caps; do not loosen Strategy caps to hide Python exhibition latency.
- **D-03:** Runtime-service HTTP and browser proof budgets may be tuned if evidence shows the outer budget is unrealistically low for healthy exhibition Matches.
- **D-04:** MatchSet/job orchestration should distinguish queued/running/slow/degraded/failed states instead of collapsing all slowness into runtime failure.

### Measurement
- **D-05:** Measure JS/TS-vs-Python and Python-vs-Python exhibition MatchSet latency.
- **D-06:** Use bounded repeat counts only; no unbounded local stress tests.
- **D-07:** Timing evidence should separate cold-start, runtime call, whole Match, job orchestration, result page, and replay page timings where practical.

### Evidence
- **D-08:** Produce v1.20-specific timeout/latency evidence that downstream UI/proof phases can reference.
- **D-09:** Evidence must state what passed locally and what remains a local proof limit.

### the agent's Discretion
The agent may choose exact budget defaults after measuring current behavior, but any budget change must be justified in artifact prose and tests.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Inputs
- `.planning/phases/132-v1-20-baseline-candidate-decision-and-budget-contract/132-CONTEXT.md`
- `.planning/phases/134-hostile-probe-and-no-fallback-parity-across-subprocess-and-container/134-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`

### Runtime And Job Code
- `apps/go-backend/runtime_service_client.go` - Runtime-service HTTP timeout handling.
- `apps/go-backend/job_lifecycle.go` - Retry and Match job failure lifecycle.
- `apps/runtime-service/src/execute-match.ts` - Runtime execution and failure classification.
- `packages/persistence/src/matchset-status.ts` - MatchSet status derivation.
- `apps/web/e2e/v1-19-exhibition-proof.spec.ts` - Existing signed-in proof timing envelope.

### Prior Learnings
- `.planning/RETROSPECTIVE.md` - v1.19 lesson that whole-Match service timeouts differ from per-Strategy caps.
- `.planning/artifacts/v1.19-exhibition-beta-proof.json` - Prior proof evidence.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Go currently has a configurable runtime-service HTTP timeout via `COWARDS_RUNTIME_SERVICE_HTTP_TIMEOUT_MS`.
- The v1.19 proof uses a bounded Playwright test and Go `run-once` calls to process Match jobs.
- MatchSet status already supports degraded/incomplete distinctions.

### Known Gaps
- Current budgets are not documented as a layered contract.
- Existing proof does not provide repeated-cycle latency evidence.
- Browser proof timing is implicit in test timeout rather than explained as a budget.

</code_context>

<specifics>
## Specific Ideas

Treat latency evidence as a user trust artifact, not just performance data: a healthy but slow Python exhibition should be understandable and bounded rather than surprising.

</specifics>

<deferred>
## Deferred Ideas

- Load testing.
- Production SLO/SLA claims.
- Per-Strategy cap loosening for Python.

</deferred>

---

*Phase: 135-timeout-latency-and-reliability-budget-model*
*Context gathered: 2026-05-25*
