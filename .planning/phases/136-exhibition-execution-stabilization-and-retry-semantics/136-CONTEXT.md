# Phase 136: Exhibition Execution Stabilization and Retry Semantics - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 136 makes repeated Python exhibition execution more stable where practical and makes retry/no-retry semantics explicit. It must preserve deterministic execution caps, Go-owned orchestration and scoring, runtime-service ABI boundaries, and the distinction between player-caused Strategy failures and retryable system/container/runtime-service failures.

</domain>

<decisions>
## Implementation Decisions

### Stabilization
- **D-01:** Stabilize Python exhibition latency where practical without arbitrary package installs, Python backend ownership, or per-Strategy cap loosening.
- **D-02:** Practical stabilization may include warmup, process-launch cleanup, bounded orchestration tuning, or test/proof sequencing, if consistent with runtime isolation.
- **D-03:** JS/TS support must remain intact and regression-tested.

### Retry Semantics
- **D-04:** Retry only transient/system/container/runtime-service/orchestration failures that are explicitly classified retryable.
- **D-05:** Do not blindly retry Strategy-caused runtime violations, invalid Strategy output, validation failures, or non-retryable source/contract mismatches.
- **D-06:** Retry/no-retry decisions are Go-owned orchestration behavior, not Python runtime policy.

### Failure Ownership
- **D-07:** Runtime violations should remain visible Match outcomes when they are player-caused, not hidden as system repair.
- **D-08:** System failures should be classified separately from player-caused failures and surface as degraded/failed system states where appropriate.
- **D-09:** Match completion, scoring, status refresh, and replay availability remain Go-owned across success, degraded, timeout, and failure paths.

### the agent's Discretion
The agent may decide which stabilization opportunities are worth implementing after measurement, but must document any rejected optimizations that would violate boundaries or exceed scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Inputs
- `.planning/phases/135-timeout-latency-and-reliability-budget-model/135-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`

### Execution And Retry Code
- `apps/go-backend/job_lifecycle.go` - Job retry and terminal failure behavior.
- `apps/go-backend/runtime_service_client.go` - Runtime-service HTTP/system failure classification.
- `apps/runtime-service/src/execute-match.ts` - Runtime broker failure categories.
- `packages/runtime-python/src/python-subprocess-adapter.ts` - Python subprocess execution behavior.
- `packages/persistence/src/matchset-status.ts` - Degraded/completion status logic.

### Tests And Proof
- `apps/runtime-service/src/execute-match.test.ts`
- `packages/runtime-python/src/python-subprocess-adapter.test.ts`
- `apps/web/e2e/v1-19-exhibition-proof.spec.ts`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Go runtime-service client marks transport/timeout/malformed/oversized failures retryable and source/contract mismatches non-retryable.
- Job lifecycle already records attempt failures and stops when max attempts or non-retryable classification is reached.
- Runtime-service distinguishes runtime violations from schema/request/source/runtime adapter/system failures.

### Known Gaps
- User-facing retry/no-retry explanation is not yet explicit enough for exhibition reliability proof.
- Python repeated-use reliability needs measurement-driven stabilization, not broad runtime redesign.

</code_context>

<specifics>
## Specific Ideas

The key product distinction is "your Strategy failed under the rules" versus "the runtime system failed to execute the Match." v1.20 should make that distinction clear in code, artifacts, and UI copy.

</specifics>

<deferred>
## Deferred Ideas

- Retrying hostile Strategy violations as if they were infrastructure failures.
- Python owning job lifecycle or scoring.
- Arbitrary Python package caching/install support.

</deferred>

---

*Phase: 136-exhibition-execution-stabilization-and-retry-semantics*
*Context gathered: 2026-05-25*
