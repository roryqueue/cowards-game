# Phase 98: Runtime Execution Service Boundary - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 98 defines the Go-to-TypeScript runtime execution service boundary. Go orchestration may call TypeScript only through a versioned execution contract that preserves `strategy-runtime-abi-v1.14`, keeps hostile Strategy execution out of Go/web/API, and prevents TypeScript from regaining normal backend ownership.

This phase does not promote a production sandbox, retire the TypeScript runtime, complete Matches in Go, persist Chronicles, score MatchSets, or deliver public evidence routes.

</domain>

<decisions>
## Implementation Decisions

### Service Boundary Shape

- **D-01:** Go calls a dedicated TypeScript runtime execution service over a versioned JSON request/response contract.
- **D-02:** The TypeScript runtime execution service performs execution only. It must not claim jobs, complete Matches, persist Chronicles, score MatchSets, or own product API fallback behavior in normal topology.
- **D-03:** The normal runtime service should run without DB ownership or DB credentials where practical.

### Request Contract

- **D-04:** The request carries complete Match execution inputs: Match id, arena data, seed, player ids, Strategy Revision ids, Strategy Revision source/hash/bytes/runtime metadata, package metadata, and execution limits.
- **D-05:** Go may retrieve and transport Strategy source for the execution request, but must not import, transpile, evaluate, execute, log, expose, or persist that source outside the strict runtime-boundary contract.
- **D-06:** Go must validate request/response schema and source hash/byte consistency before accepting a response.

### Runtime ABI And Isolation

- **D-07:** The TypeScript service uses the existing `strategy-runtime-abi-v1.14` bridge and runtime adapters.
- **D-08:** Do not use Node `vm` as a security boundary.
- **D-09:** Do not promote readiness labels for worker-thread, subprocess, container-subprocess, or non-JS runtime candidates in this phase.
- **D-10:** Production sandbox replacement and final TypeScript runtime retirement remain out of scope.

### Response And Failure Semantics

- **D-11:** The service returns either a valid execution result for later Go Match completion/Chronicle persistence or a redacted system-failure envelope.
- **D-12:** Runtime violations remain valid Match/Chronicle outcomes rather than infrastructure failures.
- **D-13:** Infrastructure/service failures, malformed responses, stopped service, source hash mismatch, oversized output, and timeout become retryable or terminal system-failure envelopes for Go classification through Phase 97 lifecycle contracts.

### No-Fallback Behavior

- **D-14:** If the runtime service is stopped or violates the contract, Go fails closed through lifecycle failure handling.
- **D-15:** There must be no silent TypeScript backend fallback. The TypeScript runtime service cannot become a DB-owning worker or Match completion owner in normal workflows.

### Privacy And Diagnostics

- **D-16:** Runtime boundary diagnostics must be redacted by default.
- **D-17:** Public, service, Go, topology, and monitor outputs must omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.

### Verification Scope

- **D-18:** Tests should cover invalid output, timeout, malformed response, source hash mismatch, oversized output, stopped runtime service, runtime violation, system failure, DB ownership absence, and redacted diagnostics.

### the agent's Discretion

The agent may choose the transport implementation, process supervision shape, contract filenames, and local harness details, provided the service is execution-only, schema-validated, ABI-stable, privacy-safe, and no-fallback by default.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Scope

- `.planning/PROJECT.md` — Current v1.15 milestone goal, non-goals, and active constraints.
- `.planning/REQUIREMENTS.md` — RT-01 through RT-06 and full v1.15 requirement vocabulary.
- `.planning/ROADMAP.md` — Phase 98 goal, dependencies, success criteria, and sequencing.
- `.planning/STATE.md` — Active milestone state and ownership warnings.
- `.planning/research/SUMMARY.md` — v1.15 research synthesis and recommended Go ownership flow.

### Prior Phase Inputs

- `.planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md` — Lifecycle ownership labels, no-fallback defaults, rollback semantics, and manifest vocabulary.
- `.planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md` — Go lifecycle failure handling and retry/exhaustion boundaries.
- `.planning/artifacts/v1.14-promotion-decision.md` — Promoted v1.14 runtime ABI and deferred runtime retirement/sandbox scope.
- `.planning/artifacts/v1.14-route-ownership-manifest.json` — Existing runtime boundary and no-fallback vocabulary.

### Primary Specs

- `AGENTS.md` — Non-negotiables for hostile Strategy isolation, deterministic engine boundaries, terminology, and public-output privacy.
- `CowardsGameSpec_Full_Consolidated_v1.md` — Canonical game terminology and rules vocabulary.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Architecture boundary guidance.

</canonical_refs>

<code_context>
## Existing Code Insights

### Runtime ABI And Adapter Code

- `packages/spec/src/runtime.ts`: Defines `STRATEGY_RUNTIME_ABI_VERSION`, request/response envelope shapes, runtime/system failure codes, readiness labels, limits, and runtime metadata.
- `packages/runtime-js/src/abi-bridge.ts`: Current `executeStrategyRuntimeAbiV114` bridge that validates source hash/bytes and wraps adapter execution with v1.14 response envelopes.
- `packages/runtime-js/src/worker.ts`: Exports runtime worker entrypoint, ABI bridge, JS runtime adapters, and subprocess failure types.
- `packages/runtime-js/src/worker-thread-adapter.ts`, `subprocess-adapter.ts`, and `container-subprocess-adapter.ts`: Existing TypeScript-owned runtime adapter implementations.
- `apps/worker/src/runtime-config.ts`: Current adapter selection and readiness/logging behavior.

### Current Coupled Worker Flow

- `apps/worker/src/runner.ts`: Current TypeScript worker combines job claim, Match input loading, runtime execution, Chronicle building, Match completion, and attempt failure recording. Phase 98 should split execution service behavior from DB-owning worker behavior for normal topology.
- `apps/worker/src/index.ts`: Current worker process entrypoint, useful prior art but not the future normal DB-owning runtime service shape.

### Risks To Guard

- Go must not import runtime adapter packages or execute Strategy source.
- The TypeScript service must not import persistence/job completion/scoring paths for normal execution-service mode.
- Diagnostics currently include selected adapter metadata; later implementation must ensure outputs are redacted and source-safe.

</code_context>

<specifics>
## Specific Ideas

The phase should create a narrow execution service contract before Match completion is migrated. A good implementation plan will make it easy for Phase 99 to call "execute Match" and receive either a validated Chronicle-ready result or a bounded system-failure envelope, without giving TypeScript DB authority.

</specifics>

<deferred>
## Deferred Ideas

- Atomic Go Match completion and Chronicle persistence — Phase 99.
- MatchSet scoring and runtime/system failure scoring classification — Phase 100.
- Public evidence delivery and web route cutover — Phase 101.
- Full topology monitors and promotion gate — Phase 102.
- Production hostile-code sandbox replacement and final TypeScript runtime retirement — v1.16 or later.

</deferred>

---

*Phase: 98-Runtime Execution Service Boundary*
*Context gathered: 2026-05-24*
