# Phase 185: Runtime Unavailable and Stopped-Service Live Drills - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Prove stopped runtime-service and unavailable-service behavior with local live drills. This phase focuses on live operational evidence and cleanup/idempotency, not app UX expansion.

</domain>

<decisions>
## Implementation Decisions

### Drill Shape
- **D-01:** Use local live drills with local Postgres, Go backend/orchestration, runtime-service availability control, internal run-once paths, result/replay pages where available, and private-marker scans.
- **D-02:** Stopped or unavailable runtime-service must classify as retryable while attempts remain.
- **D-03:** Exhausted unavailable-service attempts must become terminal public-safe system failure evidence.
- **D-04:** Drill evidence must distinguish runtime-service unavailable from Strategy failure and malformed runtime-output failures.

### Cleanup and Idempotency
- **D-05:** Drills must be repeatable and leave no orphaned running jobs, stale active leases, or duplicate terminal MatchSet refreshes.
- **D-06:** Drills should record commands, topology, service state transitions, MatchSet/Match IDs, retry counts, and cleanup checks.

### Public Safety
- **D-07:** Public result/replay pages must remain compatible with `match-execution-app-v1`.
- **D-08:** Drill artifacts must redact raw diagnostics, host paths, env values, tokens, DB details, package paths, and private runtime internals.

### the agent's Discretion
Use the smallest reliable live setup that exercises the real Go/runtime-service boundary. Prefer extending existing proof harnesses over creating a parallel proof system.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/workstreams/v1-26-match-execution-reliability/REQUIREMENTS.md` — DRILL requirements.
- `.planning/workstreams/v1-26-match-execution-reliability/ROADMAP.md` — Phase 185 success criteria.
- `.planning/research/v1.26-SUMMARY.md` — local live drill calibration.

### Existing Live Proof Patterns
- `apps/web/e2e/v1-20-reliability-proof.spec.ts` — signed-in reliability proof pattern and private-marker scanning.
- `apps/web/e2e/v1-23-multi-compiler-exhibition-proof.spec.ts` — signed-in multi-runtime proof pattern.
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts` — result/replay fixture proof and privacy checks.
- `apps/web/app/api/test-support/run-worker-once/route.ts` — test-support worker run-once pattern and diagnostics redaction.

### Go Runtime Boundary
- `apps/go-backend/orchestrator.go` — run-once orchestration and runtime invocation.
- `apps/go-backend/runtime_service_client.go` — stopped/transport/timeout failure classes.
- `apps/go-backend/job_lifecycle.go` — retry queueing and terminal failure persistence.
- `apps/go-backend/matchset_status.go` — MatchSet refresh after failures.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing Playwright proof files already create signed-in revisions, run jobs, open result/replay pages, and scan public output.
- Go internal run-once route exists in proof flows and can be reused if gated properly.

### Established Patterns
- Live proofs write Markdown/JSON artifacts under `.planning/artifacts`.
- Private-marker scans should include Strategy source, memories, objective payloads, raw diagnostics, path/env/token/DB/package markers, and private runtime internals.

### Integration Points
- Runtime-service availability control should be explicit in the proof setup and reflected in the artifact.
- Cleanup checks should query job and MatchSet state after the drill.

</code_context>

<specifics>
## Specific Ideas

The proof should read as an operational drill: "service up, service stopped/unavailable, Go retries while attempts remain, terminal failure after exhaustion, public evidence safe, cleanup clean."

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 185-Runtime Unavailable and Stopped-Service Live Drills*
*Context gathered: 2026-05-30*
