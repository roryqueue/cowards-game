# Phase 184: Retry and Non-Retry Lifecycle Semantics in Go Orchestration - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Make Go retry classification deterministic, bounded, layer-aware, and public-safe. This phase defines and tests Go-owned retry semantics; it does not add new app-facing contract fields by default.

</domain>

<decisions>
## Implementation Decisions

### Retry Classification
- **D-01:** Use a single Go-owned retry matrix that splits failures by layer.
- **D-02:** Retryable while attempts remain: runtime-service stopped/unconfigured, transport failure, HTTP timeout, read failure, oversized response, malformed runtime-service envelope, response-side contract mismatch, runtime-service `EXECUTION_EXCEPTION`, and runtime-service `RESPONSE_SCHEMA_INVALID`.
- **D-03:** Non-retryable: request/local validation mismatch, source hash/byte mismatch, unsupported registered runtime metadata, stale artifact/source mismatch, malformed Strategy/runtime output, Strategy runtime violation, invalid Strategy output, validation failure, and eligibility violation.
- **D-04:** Malformed runtime-service HTTP/envelope failure is not the same as malformed Strategy/runtime output; tests and evidence must keep them distinct.

### Bounds and Public Evidence
- **D-05:** Retry attempts must remain bounded by configured job limits and never loop indefinitely.
- **D-06:** Exhausted retryable failures become terminal public-safe system failure evidence through the frozen lifecycle/failure categories.
- **D-07:** Job-attempt details may keep only allowlisted public-safe scalars. Raw diagnostics, source, host paths, env values, tokens, DB details, package paths, and private runtime internals must not persist.

### the agent's Discretion
Planner may choose whether to implement the retry matrix as code constants, table-driven tests, artifact documentation, or a combination, as long as later phases can reuse it for live drills.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/workstreams/v1-26-match-execution-reliability/REQUIREMENTS.md` — RETRY requirements.
- `.planning/workstreams/v1-26-match-execution-reliability/ROADMAP.md` — Phase 184 success criteria.
- `.planning/research/v1.26-SUMMARY.md` — retry split calibration.

### Go Retry Code
- `apps/go-backend/job_lifecycle.go` — `recordAttemptFailure`, bounded retry, lease handling, failure detail sanitization.
- `apps/go-backend/job_lifecycle_test.go` — existing retry, exhausted failure, stale lease, and public-safe detail tests.
- `apps/go-backend/orchestrator.go` — runtime-service failure recording path.
- `apps/go-backend/runtime_service_client.go` — runtime-service failure classes and retryable flags.
- `apps/go-backend/runtime_service_client_test.go` — transport, timeout, malformed, oversized, ABI drift, and redaction tests.

### Historical Retry Semantics
- `scripts/evaluate-runtime-sandbox.ts` — v1.20 retry taxonomy artifact generation.
- `.planning/artifacts/v1.20-exhibition-reliability-retry-semantics.md` — prior retry semantics baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `shouldExhaustMatchJobRetries` already captures bounded retry mechanics.
- `sanitizeMatchJobFailureDetails` already provides a public-safe persistence allowlist.
- `newRuntimeServiceFailure` and `sanitizeRuntimeServiceFailure` already carry retryable flags.

### Established Patterns
- Go records runtime-service failures through `recordAttemptFailure`, then either requeues or marks terminal `failed_system`.
- Runtime-service response validation currently treats malformed envelope/contract drift as retryable.

### Integration Points
- Update or add table-driven Go tests near `job_lifecycle_test.go` and `runtime_service_client_test.go`.
- Later drill phases should consume the same retry matrix rather than duplicating classification.

</code_context>

<specifics>
## Specific Ideas

Keep the decision language simple enough to show in proof artifacts: "retry transport/envelope/system while attempts remain; fail Strategy output and stale artifacts closed."

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 184-Retry and Non-Retry Lifecycle Semantics in Go Orchestration*
*Context gathered: 2026-05-30*
