# Phase 187: Runtime-Service Failure Envelope Translation Hardening - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden runtime-service failure envelopes, redaction, and Go translation across failure modes. This phase protects the hostile-code boundary and failure data path; it does not move backend ownership into runtime-service.

</domain>

<decisions>
## Implementation Decisions

### Envelope Strictness
- **D-01:** Runtime-service system failures must remain schema-valid and limited to registered failure codes.
- **D-02:** Go must reject unknown runtime-service codes, non-contract fields, ABI drift, response contract drift, oversized responses, malformed JSON, and incomplete success/failure shapes safely.
- **D-03:** Runtime violations inside successful Match execution outcomes must stay distinct from service-level system failures.

### Redaction Boundary
- **D-04:** Runtime-service raw diagnostics must be redacted before any Go persistence, job-attempt detail, public evidence, or proof artifact can expose them.
- **D-05:** Redaction must cover Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, stack/stderr, sessions, and private runtime internals.

### Ownership Boundary
- **D-06:** Runtime-service must remain free of persistence ownership, job lifecycle ownership, MatchSet scoring, public evidence delivery, and web/API product routes.
- **D-07:** Runtime-service may own hostile Strategy execution and schema-validated ABI envelopes only.

### the agent's Discretion
Planner may decide whether hardening lands mostly in runtime-service tests, Go client tests, monitor checks, or all three; the public/private guarantee is mandatory.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/workstreams/v1-26-match-execution-reliability/REQUIREMENTS.md` — RUNTIME requirements.
- `.planning/workstreams/v1-26-match-execution-reliability/ROADMAP.md` — Phase 187 success criteria.
- `.planning/research/v1.26-SUMMARY.md` — envelope translation baseline.

### Runtime-Service Boundary
- `apps/runtime-service/src/execute-match.ts` — system failure envelope creation and runtime outcome distinction.
- `apps/runtime-service/src/server.ts` — HTTP boundary and malformed request handling.
- `apps/runtime-service/src/redaction.ts` — public message and diagnostics redaction.
- `apps/runtime-service/src/execute-match.test.ts` — failure envelope and boundary authority tests.
- `apps/runtime-service/src/server.test.ts` — HTTP route and malformed request tests.
- `apps/runtime-service/src/redaction.test.ts` — redaction expectations.

### Go Translation
- `apps/go-backend/runtime_service_client.go` — Go envelope validation, code allowlist, and sanitization.
- `apps/go-backend/runtime_service_client_test.go` — Go translation and private-marker tests.
- `apps/go-backend/job_lifecycle.go` — persisted detail sanitization.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RuntimeExecutionServiceResponseSchema` already validates runtime-service responses.
- `redactedDiagnostics` and Go `sanitizeRuntimeServiceDetails` already enforce two redaction layers.
- Existing tests already reject unknown system failure codes and non-contract `errorClass`.

### Established Patterns
- Runtime-service returns `systemFailure` envelopes for system failures and successful `executionResult` for Match outcomes that may contain runtime violations.
- Go disallows unknown fields on decoded runtime-service responses.

### Integration Points
- Harden both runtime-service producer tests and Go consumer tests.
- Extend monitors if ownership creep or privacy leaks are not already covered tightly enough.

</code_context>

<specifics>
## Specific Ideas

Downstream agents should treat redaction as a data-path property, not just UI copy. Private data must be removed before persistence and artifacts, not merely hidden from rendered pages.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 187-Runtime-Service Failure Envelope Translation Hardening*
*Context gathered: 2026-05-30*
