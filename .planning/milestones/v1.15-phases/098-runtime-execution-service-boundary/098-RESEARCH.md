# Phase 98: Runtime Execution Service Boundary - Research

**Researched:** 2026-05-24
**Domain:** Go-to-TypeScript Match execution service boundary, runtime ABI v1.14, JSON contract validation, failure envelopes, redaction
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

All content in this block is copied from `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`]

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)

- Atomic Go Match completion and Chronicle persistence - Phase 99.
- MatchSet scoring and runtime/system failure scoring classification - Phase 100.
- Public evidence delivery and web route cutover - Phase 101.
- Full topology monitors and promotion gate - Phase 102.
- Production hostile-code sandbox replacement and final TypeScript runtime retirement - v1.16 or later.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RT-01 | Developer can use a versioned Go-to-TypeScript Match execution contract that carries complete Match inputs, Strategy Revision source/hash/bytes/runtime metadata, arena data, seed, player ids, and execution limits. [VERIFIED: `.planning/REQUIREMENTS.md`] | Define `runtime-execution-service-v1.15` request/response schemas in `@cowards/spec`, with TypeScript Zod validation and matching Go structs/strict JSON tests. [VERIFIED: `packages/spec/src/schemas.ts`, `apps/go-backend/main.go`] |
| RT-02 | Developer can verify the TypeScript runtime execution service executes Strategy code only behind `strategy-runtime-abi-v1.14` and does not own normal job claiming, Match completion, Chronicle persistence, or MatchSet scoring writes. [VERIFIED: `.planning/REQUIREMENTS.md`] | Build a dedicated `apps/runtime-service` entrypoint that depends on engine/replay/runtime-js/spec only and has import-boundary tests forbidding `@cowards/persistence`, `pg`, `completeMatch`, `claimNextMatchJob`, and scoring imports. [VERIFIED: `apps/worker/src/runner.ts`, `packages/runtime-js/src/abi-bridge.ts`, `eslint.config.mjs`] |
| RT-03 | Developer can verify Go never imports, evaluates, transpiles, or executes Strategy source and never uses Node `vm`. [VERIFIED: `.planning/REQUIREMENTS.md`] | Keep Go responsible for transport, source hash/byte checks, HTTP failure classification, and JSON validation only; TypeScript runtime service owns transpilation through existing runtime-js paths. [VERIFIED: `apps/go-backend/live_backend.go`, `packages/runtime-js/src/executor.ts`] |
| RT-04 | Developer can verify runtime violations are returned as valid Match/Chronicle outcomes while system failures are returned as retryable or terminal system-failure envelopes for Go classification. [VERIFIED: `.planning/REQUIREMENTS.md`] | Preserve engine `RuntimeResult` behavior for player-caused violations in Chronicles; wrap service/IPC/transport failures in a redacted `systemFailure` envelope for Phase 97 lifecycle handling. [VERIFIED: `packages/engine/src/types.ts`, `packages/replay/src/build.ts`, `packages/spec/src/runtime.ts`] |
| RT-05 | Developer can run invalid output, timeout, malformed response, source hash mismatch, oversized output, stopped runtime service, and redacted diagnostics tests for the execution boundary. [VERIFIED: `.planning/REQUIREMENTS.md`] | Add TypeScript service contract tests, Go `httptest` client tests, malformed-server tests, stopped-service tests, and privacy deny-list assertions. [VERIFIED: `packages/runtime-js/src/adapter-contract.test.ts`, `apps/worker/src/runner.test.ts`, `apps/go-backend/main_test.go`] |
| RT-06 | Developer can verify worker-thread, subprocess, container-subprocess, and non-JS runtime candidates remain at their existing readiness labels unless a later milestone promotes them. [VERIFIED: `.planning/REQUIREMENTS.md`] | Reuse existing runtime registry and monitor checks; do not change adapter readiness or counted eligibility in Phase 98. [VERIFIED: `packages/spec/src/runtime.ts`, `scripts/check-boundary-monitors.ts`] |
</phase_requirements>

## Summary

Phase 98 should create a narrow TypeScript execution service that accepts full Match execution data from Go, executes the Match using the existing TypeScript engine/replay/runtime-js stack, and returns either a Chronicle-ready result or a redacted system-failure envelope. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`, `apps/worker/src/runner.ts`, `packages/replay/src/build.ts`] The service must not load Matches from Postgres, claim jobs, complete Matches, persist Chronicles, refresh MatchSet scoring, or provide product API fallback behavior. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`, `apps/worker/src/runner.ts`]

The safest implementation shape is a new `apps/runtime-service` TypeScript app with no `@cowards/persistence` or `pg` dependency, plus shared contract schemas in `packages/spec/src/runtime-execution-service.ts`. [VERIFIED: `apps/worker/package.json`, `packages/spec/package.json`, `tsconfig.json`] Go should call this service over HTTP JSON using `net/http` and `encoding/json`, validate source hash/byte consistency before sending and after receiving, and classify stopped/malformed/oversized/timeout responses through the Phase 97 system-failure lifecycle. [VERIFIED: `apps/go-backend/live_backend.go`, `apps/go-backend/main.go`; CITED: https://pkg.go.dev/net/http]

**Primary recommendation:** Use `runtime-execution-service-v1.15` as a versioned service envelope around the existing `strategy-runtime-abi-v1.14` per-method bridge; do not change `strategy-runtime-abi-v1.14` itself in this phase. [VERIFIED: `packages/spec/src/runtime.ts`, `packages/runtime-js/src/abi-bridge.ts`, `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`]

## Project Constraints (from AGENTS.md)

- Keep the engine pure, deterministic, serializable, and side-effect free. [VERIFIED: `AGENTS.md`]
- Do not put game rules in React components. [VERIFIED: `AGENTS.md`]
- Do not execute user Strategy code in the web/API process. [VERIFIED: `AGENTS.md`]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. [VERIFIED: `AGENTS.md`]
- Do not use Node `vm` as a security boundary for untrusted code. [VERIFIED: `AGENTS.md`]
- Treat Strategy code as hostile and validate every runtime boundary with schemas. [VERIFIED: `AGENTS.md`]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: `AGENTS.md`]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: `AGENTS.md`]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: `AGENTS.md`]
- Runtime tests must cover invalid outputs, timeout behavior, forbidden capabilities, memory/source limits, and schema validation. [VERIFIED: `AGENTS.md`]
- Worker/runtime tests must distinguish strategy failure from system failure. [VERIFIED: `AGENTS.md`]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Job claim, lease, retry, exhaustion | Go backend | Database / Storage | Phase 97 assigns normal lifecycle ownership to Go; TypeScript worker lifecycle code becomes parity/rollback only. [VERIFIED: `.planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md`] |
| Runtime service request assembly | Go backend | Database / Storage | Go may retrieve Strategy source and Match inputs but must only transport them through the runtime-boundary contract. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`, `apps/go-backend/live_backend.go`] |
| Strategy source execution | TypeScript runtime service | Runtime adapter subprocess / worker thread | The existing ABI bridge and adapters are TypeScript-owned; Go/web/API must not evaluate or transpile Strategy source. [VERIFIED: `packages/runtime-js/src/abi-bridge.ts`, `packages/runtime-js/src/executor.ts`, `AGENTS.md`] |
| Match simulation and Chronicle construction | TypeScript runtime service | `@cowards/engine`, `@cowards/replay` packages | `buildChronicleFromMatch` already runs the pure engine with a `StrategyRuntime` and returns `chronicle` plus `finalState`; Phase 99 persists that output in Go. [VERIFIED: `packages/replay/src/build.ts`, `packages/engine/src/types.ts`] |
| Match completion and Chronicle persistence | Go backend | Database / Storage | Phase 98 returns a result for later Go completion; persistence is explicitly out of scope for the TypeScript runtime service. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`, `.planning/ROADMAP.md`] |
| Failure classification | Go backend | TypeScript runtime service | The service distinguishes valid runtime violations from system-failure envelopes; Go applies retry/terminal lifecycle policy. [VERIFIED: `packages/spec/src/runtime.ts`, `.planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md`] |
| Public redaction | Go backend and TypeScript runtime service | Monitors / topology scripts | Both sides must avoid leaking source, memories, objective payloads, stack traces, stderr, tokens, paths, DSNs, and runtime internals. [VERIFIED: `packages/spec/src/public-output-privacy.ts`, `apps/go-backend/main.go`, `scripts/check-local-topology.ts`] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@cowards/spec` | workspace `0.1.0` | Owns `STRATEGY_RUNTIME_ABI_VERSION`, runtime metadata, failure envelopes, Zod schemas, privacy checks, and service DTO contracts. [VERIFIED: `packages/spec/package.json`, `packages/spec/src/runtime.ts`, `packages/spec/src/schemas.ts`] | Contract source of truth already used by Go fixtures, runtime ABI, service DTOs, and monitors. [VERIFIED: `packages/spec/src/runtime.ts`, `scripts/check-boundary-monitors.ts`] |
| `@cowards/runtime-js` | workspace `0.1.0` | Executes JS/TS Strategy Revisions through `executeStrategyRuntimeAbiV114` and selected adapters. [VERIFIED: `packages/runtime-js/package.json`, `packages/runtime-js/src/worker.ts`] | Existing bridge validates source hash/bytes and wraps adapter output with the v1.14 ABI envelope. [VERIFIED: `packages/runtime-js/src/abi-bridge.ts`] |
| `@cowards/engine` | workspace `0.1.0` | Runs deterministic Match state transitions through a `StrategyRuntime` interface. [VERIFIED: `packages/engine/package.json`, `packages/engine/src/types.ts`, `packages/engine/src/match.ts`] | Engine already separates game rules from runtime execution and returns deterministic transition results. [VERIFIED: `packages/engine/src/types.ts`, `packages/engine/src/match.ts`] |
| `@cowards/replay` | workspace `0.1.0` | Builds Chronicle and final state from a `RunMatchInput`. [VERIFIED: `packages/replay/package.json`, `packages/replay/src/build.ts`] | `buildChronicleFromMatch` produces intermediate snapshots needed for replay; adapting a plain `runMatch` result is intentionally rejected. [VERIFIED: `packages/replay/src/build.ts`] |
| Go `net/http` + `encoding/json` | Go module target `1.25.0`; local tool `go1.26.3` | Go client for runtime-service HTTP JSON calls and strict response parsing. [VERIFIED: `apps/go-backend/go.mod`, local `go version`; CITED: https://pkg.go.dev/net/http] | Go backend already uses standard `net/http` `ServeMux` patterns for route ownership; no router/client framework is needed. [VERIFIED: `apps/go-backend/main.go`, `apps/go-backend/live_backend.go`] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | `4.4.3`; npm modified 2026-05-04 | Parse and validate TypeScript execution request/response schemas. [VERIFIED: `packages/spec/package.json`; VERIFIED: npm registry; CITED: Context7 `/colinhacks/zod`] | Use `.parse` or `.safeParse` at every TypeScript service ingress/egress; `.safeParse` gives a discriminated success/error result for failure envelopes. [CITED: Context7 `/colinhacks/zod`] |
| `tsx` | repo uses `^4.21.0`; npm current `4.22.3`, modified 2026-05-19 | Local dev/runtime command for TypeScript service entrypoints. [VERIFIED: `apps/worker/package.json`; VERIFIED: npm registry] | Use for dev scripts like `tsx watch src/index.ts`; build uses `tsc -b`. [VERIFIED: `apps/worker/package.json`] |
| `vitest` | repo uses `^4.1.6`; npm current `4.1.7`, modified 2026-05-20 | TypeScript unit and contract tests. [VERIFIED: `package.json`; VERIFIED: npm registry] | Use for service schema tests, malformed response tests, timeout tests, and import-boundary tests. [VERIFIED: `vitest.config.ts`; CITED: Context7 `/vitest-dev/vitest`] |
| `typescript` | `6.0.3`; npm modified 2026-04-16 | Strict TypeScript compilation. [VERIFIED: `package.json`, `tsconfig.base.json`; VERIFIED: npm registry] | Keep the runtime-service app in the existing project-reference graph. [VERIFIED: `tsconfig.json`] |
| `github.com/jackc/pgx/v5` | `v5.9.2`; module time 2026-04-19 | Existing Go database layer for Go-owned lifecycle/input loading. [VERIFIED: `apps/go-backend/go.mod`; VERIFIED: `go list -m -json`] | Use only in Go backend lifecycle/input code, not inside the TypeScript runtime service. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New `apps/runtime-service` | Reuse `apps/worker` with a second entrypoint | Reusing `apps/worker` risks carrying `@cowards/persistence`/`pg` dependency and DB-owner imports into normal runtime-service mode; a new app makes "no DB ownership" easier to monitor. [VERIFIED: `apps/worker/package.json`, `apps/worker/src/runner.ts`] |
| HTTP JSON over `net/http`/Node `http` | stdio subprocess RPC between Go and TS | HTTP gives stopped-service and malformed-response drills that match Phase 98 requirements; subprocess RPC would couple Go process supervision to runtime execution earlier than needed. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`; CITED: https://nodejs.org/api/http.html] |
| Preserve v1.14 method ABI inside service | Replace `strategy-runtime-abi-v1.14` with Match-level ABI | Replacing the ABI would violate the explicit preserve-v1.14 decision; use a new service envelope around the existing per-method ABI instead. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`, `packages/spec/src/runtime.ts`] |

**Installation:**

```bash
# No new packages recommended for Phase 98.
pnpm install
```

**Version verification:** `npm view zod version time.modified`, `npm view tsx version time.modified`, `npm view vitest version time.modified`, `npm view typescript version time.modified`, `go list -m -json github.com/jackc/pgx/v5 golang.org/x/crypto`, and local runtime probes were run on 2026-05-24. [VERIFIED: npm registry; VERIFIED: local command output]

## Architecture Patterns

### System Architecture Diagram

```text
Go claimed Match job
  |
  v
Go loads Match input + Strategy Revision source/runtime metadata
  |
  |  runtime-execution-service-v1.15 JSON request
  v
TypeScript runtime service HTTP handler
  |
  +--> Zod parse + source hash/byte validation
  |
  +--> build bottom/top StrategyRuntime from revisions
  |      |
  |      +--> executeStrategyRuntimeAbiV114
  |             |
  |             +--> selected adapter: worker-thread / subprocess / container-subprocess
  |
  +--> buildChronicleFromMatch(input)
  |
  +--> validate/redact response envelope
  |
  |  runtime-execution-service-v1.15 JSON response
  v
Go validates response + source/result identity
  |
  +--> success with Chronicle-ready payload -> Phase 99 completion path
  |
  +--> systemFailure envelope / transport error -> Phase 97 failure path
```

This data flow keeps database ownership in Go and hostile Strategy execution in the TypeScript runtime boundary. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`, `apps/worker/src/runner.ts`, `packages/runtime-js/src/abi-bridge.ts`]

### Recommended Project Structure

```text
apps/
  runtime-service/
    package.json              # no @cowards/persistence, no pg
    tsconfig.json
    src/
      index.ts                # listen, signal handling, no DB pool
      server.ts               # Node HTTP JSON handler
      execute-match.ts        # request -> RuntimeResult -> Chronicle-ready response
      redaction.ts            # boundary-safe diagnostics
      contract.test.ts        # valid/runtime-violation/system-failure tests
      import-boundary.test.ts # fails on persistence/pg/job/scoring imports

packages/spec/src/
  runtime-execution-service.ts # v1.15 service envelope types/constants
  schemas.ts                  # Zod schemas exported beside runtime ABI schemas

apps/go-backend/
  runtime_service_client.go   # HTTP JSON client, strict decode, timeout
  runtime_service_contract_test.go
```

The new app should be added to `tsconfig.json` project references and package scripts, mirroring existing workspace app patterns. [VERIFIED: `tsconfig.json`, `apps/worker/package.json`]

### Pattern 1: Service Envelope Around ABI v1.14

**What:** Define a Match-level service contract with `contractVersion: "runtime-execution-service-v1.15"` while leaving `STRATEGY_RUNTIME_ABI_VERSION` equal to `strategy-runtime-abi-v1.14`. [VERIFIED: `packages/spec/src/runtime.ts`, `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`]

**When to use:** Use for Go-to-TypeScript service calls. Do not use it to change adapter-level runtime method envelopes. [VERIFIED: `packages/runtime-js/src/abi-bridge.ts`]

**Example:**

```typescript
// Source: packages/spec/src/runtime.ts and packages/spec/src/schemas.ts
export const RUNTIME_EXECUTION_SERVICE_VERSION =
  "runtime-execution-service-v1.15" as const

export const RuntimeExecutionRequestSchema = z.object({
  contractVersion: z.literal(RUNTIME_EXECUTION_SERVICE_VERSION),
  kind: z.literal("executeMatch"),
  match: z.object({
    matchId: z.string().min(1),
    seed: z.string().min(1),
    arenaVariant: ArenaVariantSchema,
    bottomPlayerId: z.string().min(1),
    topPlayerId: z.string().min(1),
  }),
  strategies: z.object({
    bottom: StrategyRevisionSchema,
    top: StrategyRevisionSchema,
  }),
  limits: StrategyRuntimeLimitsSchema,
})
```

This pattern reuses existing StrategyRevision and runtime metadata schemas rather than creating a second Strategy source contract. [VERIFIED: `packages/spec/src/schemas.ts`]

### Pattern 2: Execution-Only Service Handler

**What:** The TypeScript handler validates JSON, builds two `createRuntimeFromRevision` instances with the selected adapter, runs `buildChronicleFromMatch`, and returns only the result envelope. [VERIFIED: `packages/runtime-js/src/executor.ts`, `packages/replay/src/build.ts`]

**When to use:** Use inside `apps/runtime-service`; do not import `@cowards/persistence` or `pg`. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`, `apps/worker/package.json`]

**Example:**

```typescript
// Source: packages/runtime-js/src/executor.ts and packages/replay/src/build.ts
const bottomRuntime = createRuntimeFromRevision(request.strategies.bottom, {
  adapter: runtimeConfig.adapter,
  timeoutMs: request.limits.timeoutMs,
  outputByteLimit: request.limits.stdoutBytes,
})
const topRuntime = createRuntimeFromRevision(request.strategies.top, {
  adapter: runtimeConfig.adapter,
  timeoutMs: request.limits.timeoutMs,
  outputByteLimit: request.limits.stdoutBytes,
})
const result = buildChronicleFromMatch({
  matchId: request.match.matchId,
  seed: request.match.seed,
  arenaVariant: request.match.arenaVariant,
  bottomPlayerId: request.match.bottomPlayerId,
  topPlayerId: request.match.topPlayerId,
  bottomStrategyRevisionId: request.strategies.bottom.id,
  topStrategyRevisionId: request.strategies.top.id,
  runtime: createSideDispatchRuntime(bottomRuntime, topRuntime, {
    bottomPlayerId: request.match.bottomPlayerId,
    topPlayerId: request.match.topPlayerId,
  }),
})
```

The `createSideDispatchRuntime` helper can be moved out of `apps/worker/src/runner.ts` into a runtime-service-safe module because it has no DB dependency. [VERIFIED: `apps/worker/src/runner.ts`]

### Pattern 3: Redacted System-Failure Envelope

**What:** Catch infrastructure failures separately from runtime violations and return a bounded `systemFailure` envelope with stable code, public message, retry hint, and sanitized diagnostics. [VERIFIED: `packages/spec/src/runtime.ts`, `apps/worker/src/runner.ts`]

**When to use:** Use for malformed request, source hash mismatch, response serialization failure, adapter system failure, internal exception before a Chronicle is built, and stopped-service behavior on the Go side. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`, `packages/runtime-js/src/subprocess-ipc.ts`]

**Example:**

```typescript
// Source: packages/spec/src/runtime.ts and apps/worker/src/runner.ts
return {
  contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
  ok: false,
  failureKind: "systemFailure",
  systemFailure: {
    code: "MALFORMED_RESPONSE",
    message: "Runtime execution service returned invalid JSON.",
    publicMessage: "Runtime execution service failed before a Match result.",
    retryable: true,
    diagnostics: sanitizeRuntimeDiagnostics(error),
  },
}
```

Do not put `source`, `stack`, `stderr`, `privateDiagnostics`, tokens, paths, or DSNs in the public/topology/monitor surface. [VERIFIED: `packages/spec/src/public-output-privacy.ts`, `apps/go-backend/main.go`]

### Anti-Patterns to Avoid

- **DB-owning TypeScript runtime service:** The runtime service must not import `@cowards/persistence`, `pg`, `claimNextMatchJob`, `completeMatch`, Chronicle store, MatchSet status, or scoring code. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`, `apps/worker/src/runner.ts`]
- **Changing `strategy-runtime-abi-v1.14`:** A new service contract may wrap Match execution, but the runtime method ABI constant and bridge must stay v1.14. [VERIFIED: `packages/spec/src/runtime.ts`, `packages/runtime-js/src/abi-bridge.ts`]
- **Treating runtime violations as service failures:** `INVALID_OUTPUT`, `TIMEOUT`, `THROWN_EXCEPTION`, `FORBIDDEN_CAPABILITY`, and `OVERSIZED_OUTPUT` are player/runtime violations that can be recorded in a valid Chronicle. [VERIFIED: `packages/spec/src/runtime.ts`, `packages/engine/src/types.ts`, `packages/replay/src/build.ts`]
- **Logging source-bearing requests:** Go may transport Strategy source but must not log or expose it; public Go output currently rejects `source` and related private keys. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`, `apps/go-backend/main.go`]
- **Promoting adapter readiness:** Worker-thread remains local-dev fallback/evidence-only; subprocess remains prototype/evidence-only; container-subprocess remains production-candidate but not enabled for normal counted play; Python remains experimental/non-counted. [VERIFIED: `packages/spec/src/runtime.ts`, `scripts/check-boundary-monitors.ts`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript JSON validation | Ad hoc field checks in service handlers | Zod schemas in `@cowards/spec` | The repo already centralizes StrategyRevision/runtime schemas and uses Zod; `.safeParse()` supports explicit failure branches. [VERIFIED: `packages/spec/src/schemas.ts`; CITED: Context7 `/colinhacks/zod`] |
| Runtime method ABI | New per-method RPC protocol | `executeStrategyRuntimeAbiV114` | Existing bridge validates ABI version, source hash, bytes, method name, and adapter response shape. [VERIFIED: `packages/runtime-js/src/abi-bridge.ts`] |
| Strategy execution isolation | Node `vm`, inline `eval`, Go transpilation, or Go JS execution | Existing runtime-js adapters behind ABI v1.14 | Project rules prohibit Node `vm` as a security boundary and prohibit Go/web/API Strategy execution. [VERIFIED: `AGENTS.md`, `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] |
| Chronicle generation | Go reimplementation in Phase 98 | `buildChronicleFromMatch` | The replay builder records boundary snapshots and private sections; `buildChronicleFromResult` intentionally returns a typed failure for missing intermediate snapshots. [VERIFIED: `packages/replay/src/build.ts`] |
| Public/private leak detection | Custom one-off deny list | Existing `assertPublicOutputLeakSafe`, Go `validateNoPrivateKeys`, and topology safe-detail logic | The repo already blocks source, memories, objective payloads, diagnostics, stack/stderr, tokens, host paths, and DSNs. [VERIFIED: `packages/spec/src/public-output-privacy.ts`, `apps/go-backend/main.go`, `scripts/check-local-topology.ts`] |
| HTTP server/client framework | Fastify/Express/router package | Node `http` for TS service, Go `net/http` for client/server | Existing Go backend uses standard `net/http`; Node's built-in HTTP module supports JSON server use without adding a framework. [VERIFIED: `apps/go-backend/main.go`; CITED: https://nodejs.org/api/http.html; CITED: https://pkg.go.dev/net/http] |

**Key insight:** This phase is a boundary split, not a runtime rewrite. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] The planner should spend tasks on contracts, import fences, redaction, Go client classification, and tests rather than new sandbox technology. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`, `packages/spec/src/runtime.ts`]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | `strategy_revisions` stores Strategy source, source hash, source bytes, runtime metadata, engine compatibility, validation, and metadata; `matches` and `match_jobs` store queued Match work that Go will claim in Phase 97. [VERIFIED: `apps/go-backend/live_backend.go`, `packages/persistence/migrations/0001_initial.sql`] | Code edit only in Phase 98: Go loads and transports source to runtime service; no data migration. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] |
| Live service config | Existing local topology starts `pnpm --filter @cowards/worker dev`; no runtime-service URL/env contract exists yet. [VERIFIED: `scripts/check-local-topology.ts`] | Add explicit `COWARDS_RUNTIME_EXECUTION_SERVICE_URL` and stopped-service drill; do not reuse TypeScript worker as DB owner in normal topology. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] |
| OS-registered state | None found in repo; no launchd/systemd/pm2 service files are present in searched project files. [VERIFIED: `rg --files`, `scripts/check-local-topology.ts`] | None for Phase 98. [VERIFIED: local file inventory] |
| Secrets/env vars | Go backend uses `DATABASE_URL`, `COWARDS_GO_BACKEND_DATA_MODE`, `COWARDS_GO_BACKEND_OWNER_TOKENS`, and URL/env switches; TypeScript runtime service should not receive DB credentials. [VERIFIED: `apps/go-backend/main.go`, `apps/go-backend/live_backend.go`, `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] | Add runtime service URL env only; ensure topology/monitor diagnostics redact tokens and DSNs. [VERIFIED: `scripts/check-local-topology.ts`, `apps/go-backend/main.go`] |
| Build artifacts | Workspace package graph currently includes `apps/worker` and runtime packages but no `apps/runtime-service`. [VERIFIED: `tsconfig.json`, `rg --files apps`] | Add project reference/package scripts if implementing the recommended new app; no cleanup of old artifacts needed. [VERIFIED: `tsconfig.json`, `package.json`] |

## Common Pitfalls

### Pitfall 1: Recreating The Current Coupled Worker

**What goes wrong:** A runtime "service" imports `@cowards/persistence`, claims jobs, calls `completeMatch`, or records failure directly, recreating `apps/worker/src/runner.ts` behind a new endpoint. [VERIFIED: `apps/worker/src/runner.ts`]

**Why it happens:** The current runner already combines claim, load, execute, Chronicle build, completion, and failure recording in one flow. [VERIFIED: `apps/worker/src/runner.ts`]

**How to avoid:** Create a DB-free app, pass all execution inputs from Go, and add import-boundary tests plus monitor checks. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`, `eslint.config.mjs`]

**Warning signs:** New runtime-service code imports `@cowards/persistence`, `pg`, `createDatabasePool`, `claimNextMatchJob`, `completeMatch`, `recordAttemptFailure`, `matchset-status`, or `scoring`. [VERIFIED: `apps/worker/src/runner.ts`, `packages/persistence/src/complete-match.ts`]

### Pitfall 2: Collapsing Runtime Violations Into System Failures

**What goes wrong:** Invalid Strategy output or timeouts are classified as service failures, causing false retry/exhaustion behavior instead of valid Match/Chronicle runtime-violation outcomes. [VERIFIED: `packages/spec/src/runtime.ts`, `packages/engine/src/types.ts`]

**Why it happens:** Adapter infrastructure failures and player-caused runtime violations both cross the same execution boundary. [VERIFIED: `packages/runtime-js/src/subprocess-adapter.ts`, `packages/runtime-js/src/subprocess-ipc.ts`]

**How to avoid:** Preserve `RuntimeResult` violation handling inside `buildChronicleFromMatch`; reserve `systemFailure` envelopes for transport, malformed IPC/HTTP, source mismatch, process failure, and service exceptions. [VERIFIED: `packages/replay/src/build.ts`, `packages/spec/src/runtime.ts`]

**Warning signs:** Response examples contain `failureKind: "systemFailure"` for `INVALID_OUTPUT`, `TIMEOUT`, or `FORBIDDEN_CAPABILITY` produced by Strategy code. [VERIFIED: `packages/spec/src/runtime.ts`]

### Pitfall 3: Source Leakage In Diagnostics

**What goes wrong:** Request bodies, server logs, malformed-response details, stack traces, stderr, or topology output expose Strategy source or private runtime internals. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`, `packages/spec/src/public-output-privacy.ts`]

**Why it happens:** Phase 98 requires Go to transport source to TypeScript, increasing the number of source-bearing process boundaries. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`]

**How to avoid:** Redact diagnostics by schema, never echo request bodies, and run the centralized public-output deny list against service, Go, topology, and monitor outputs. [VERIFIED: `packages/spec/src/public-output-privacy.ts`, `apps/go-backend/main.go`, `scripts/check-local-topology.ts`]

**Warning signs:** Public or diagnostic payloads contain keys normalized to `source`, `strategyMemory`, `soldierMemory`, `objective`, `privateDiagnostics`, `stack`, `stderr`, `token`, `hostPath`, or `databaseUrl`. [VERIFIED: `packages/spec/src/public-output-privacy.ts`, `apps/go-backend/main.go`]

### Pitfall 4: ABI Drift By "Improving" Runtime Metadata

**What goes wrong:** The phase updates adapter IDs, readiness labels, runtime limits, counted eligibility, or `STRATEGY_RUNTIME_ABI_VERSION` while adding the service envelope. [VERIFIED: `packages/spec/src/runtime.ts`, `scripts/check-boundary-monitors.ts`]

**Why it happens:** Service contract work touches the same files that define runtime metadata and product semantics. [VERIFIED: `packages/spec/src/runtime.ts`]

**How to avoid:** Add new service constants/schemas beside runtime ABI schemas, and add monitor/test assertions that `STRATEGY_RUNTIME_ABI_VERSION === "strategy-runtime-abi-v1.14"` and adapter readiness labels remain unchanged. [VERIFIED: `scripts/check-boundary-monitors.ts`, `packages/spec/src/runtime.ts`]

**Warning signs:** `strategy-runtime-abi-v1.15`, changed container counted eligibility, enabled Python normal play, or changed worker-thread readiness. [VERIFIED: `packages/spec/src/runtime.ts`]

## Code Examples

### Strict Go Decode Pattern

```go
// Source: apps/go-backend/main.go
decoder := json.NewDecoder(response.Body)
decoder.DisallowUnknownFields()
if err := decoder.Decode(&envelope); err != nil {
    return RuntimeExecutionResult{}, systemFailure("MALFORMED_RESPONSE")
}
```

Use the existing Go strict-decode style for runtime-service responses and test malformed responses with `httptest`. [VERIFIED: `apps/go-backend/main.go`, `apps/go-backend/main_test.go`]

### Source Hash And Byte Consistency

```typescript
// Source: packages/runtime-js/src/abi-bridge.ts
if (
  hashStrategySource(request.source.text) !== request.source.hash ||
  new TextEncoder().encode(request.source.text).length !== request.source.bytes
) {
  return {
    ok: false,
    violation: {
      type: "INVALID_OUTPUT",
      message: "Strategy Revision failed ABI source validation",
    },
  }
}
```

The service should perform this validation before execution; Go should independently check the same hash/byte fields before sending and before accepting a response tied to those revisions. [VERIFIED: `packages/runtime-js/src/abi-bridge.ts`, `apps/go-backend/live_backend.go`]

### Adapter System Failure Classification

```typescript
// Source: packages/runtime-js/src/subprocess-ipc.ts
throw new SubprocessSystemFailure(
  "MALFORMED_IPC",
  "Subprocess stdout was not valid JSON",
)
```

System failures from subprocess/container adapters must stay out of gameplay `RuntimeResult` violations and become service system-failure envelopes. [VERIFIED: `packages/runtime-js/src/subprocess-ipc.ts`, `packages/runtime-js/src/subprocess-adapter.ts`, `apps/worker/src/runner.ts`]

### Public Output Redaction Guard

```typescript
// Source: packages/spec/src/public-output-privacy.ts
assertPublicOutputLeakSafe(value, "Runtime execution service diagnostic")
```

Use the central privacy deny list for any public, monitor, or topology payload emitted by the service. [VERIFIED: `packages/spec/src/public-output-privacy.ts`]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TypeScript worker owns DB claim, execution, Chronicle build, Match completion, and failure recording. [VERIFIED: `apps/worker/src/runner.ts`] | Go owns lifecycle; TypeScript runtime service executes only and returns result/failure envelopes. [VERIFIED: `.planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md`, `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] | v1.15 Phase 97-98. [VERIFIED: `.planning/ROADMAP.md`] | Prevents mixed DB-completing owners while keeping hostile Strategy execution out of Go. [VERIFIED: `.planning/PROJECT.md`, `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] |
| Runtime ABI v1.7 stabilization. [VERIFIED: `.planning/PROJECT.md`] | `strategy-runtime-abi-v1.14` is the promoted public Strategy runtime boundary. [VERIFIED: `.planning/artifacts/v1.14-promotion-decision.md`, `packages/spec/src/runtime.ts`] | v1.14 shipped 2026-05-23. [VERIFIED: `.planning/PROJECT.md`] | Phase 98 must wrap, not replace, ABI v1.14. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] |
| Fixture/read-only Go parity routes. [VERIFIED: `apps/go-backend/main.go`] | Live Go backend already creates exhibition MatchSets and `match_jobs`. [VERIFIED: `apps/go-backend/live_backend.go`] | v1.13-v1.14. [VERIFIED: `.planning/PROJECT.md`] | Runtime service call becomes the next lifecycle hop after Go claim. [VERIFIED: `.planning/ROADMAP.md`] |
| Worker-thread default treated as compatibility boundary. [VERIFIED: `packages/runtime-js/src/adapter.ts`] | Container-subprocess is a future production candidate but evidence-only and not enabled for normal play. [VERIFIED: `packages/spec/src/runtime.ts`] | v1.8-v1.14 guardrails. [VERIFIED: `.planning/PROJECT.md`, `scripts/check-boundary-monitors.ts`] | Do not promote sandbox readiness in Phase 98. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] |

**Deprecated/outdated:**

- Treating `apps/worker` as the normal DB-owning runtime process is outdated for Go-selected v1.15 topology; it remains parity/rollback/test implementation after Phase 97/98. [VERIFIED: `.planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md`, `apps/worker/src/runner.ts`]
- Using Node `vm` as a hostile-code security boundary is forbidden by project rules and Phase 98 decisions. [VERIFIED: `AGENTS.md`, `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| - | No `[ASSUMED]` claims are used. | All sections | None. |

## Open Questions

1. **Should Phase 98 add `apps/runtime-service` or a DB-free entrypoint under `apps/worker`?**
   - What we know: A dedicated TypeScript execution service is locked, and no DB ownership/credentials are required where practical. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`]
   - What's unclear: The user has not locked the package path. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`]
   - Recommendation: Use `apps/runtime-service` because it makes dependency and import monitoring materially clearer. [VERIFIED: `apps/worker/package.json`, `apps/worker/src/runner.ts`]

2. **Should the service return Chronicle plus final state in Phase 98, or only a dry-run response contract?**
   - What we know: Phase 98 returns a valid execution result for later Go Match completion/Chronicle persistence. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`]
   - What's unclear: Phase 99 owns persistence, not construction, so Phase 98 should still produce the Chronicle-ready payload to unblock Phase 99. [VERIFIED: `.planning/ROADMAP.md`, `packages/replay/src/build.ts`]
   - Recommendation: Return `chronicle` and `finalState` in the success envelope but do not persist them. [VERIFIED: `packages/replay/src/build.ts`, `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | TypeScript runtime service and tests | yes | `v24.15.0` | None needed. [VERIFIED: local `node --version`] |
| pnpm | Workspace scripts | yes | `11.1.2` | None needed. [VERIFIED: local `pnpm --version`, `package.json`] |
| Go | Go client/tests | yes | local `go1.26.3`; module target `1.25.0` | None needed. [VERIFIED: local `go version`, `apps/go-backend/go.mod`] |
| Docker | Existing container-subprocess evidence path | yes | `29.4.3` | Optional for Phase 98 unless container evidence is explicitly required. [VERIFIED: local `docker --version`, `packages/runtime-js/src/container-subprocess-adapter.ts`] |
| PostgreSQL service | Go source/input loading in integrated tests | not probed as running | - | Use unit/httptest contract fixtures for Phase 98; full DB topology belongs later. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`, `.planning/ROADMAP.md`] |

**Missing dependencies with no fallback:**
- None for contract/unit research. [VERIFIED: local environment probes]

**Missing dependencies with fallback:**
- Running PostgreSQL was not probed; Phase 98 can validate the HTTP/service boundary with fixtures and Go `httptest`, while later topology phases require live services. [VERIFIED: `.planning/ROADMAP.md`, `scripts/check-local-topology.ts`]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `^4.1.6` in repo, npm current `4.1.7`; Go `testing` via `go test ./...`. [VERIFIED: `package.json`, `vitest.config.ts`, `apps/go-backend/go.mod`; VERIFIED: npm registry] |
| Config file | `vitest.config.ts`, `apps/web/vitest.config.ts`; Go tests use standard package files. [VERIFIED: `vitest.config.ts`, `apps/web/vitest.config.ts`, `apps/go-backend/main_test.go`] |
| Quick run command | `pnpm --filter @cowards/spec test && pnpm --filter @cowards/runtime-js test -- adapter-contract.test.ts && pnpm --filter @cowards/runtime-service test` after app exists. [VERIFIED: `packages/spec/package.json`, `packages/runtime-js/package.json`] |
| Full suite command | `pnpm test:fast && cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` [VERIFIED: `package.json`, `apps/go-backend/main_test.go`] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| RT-01 | Versioned request/response carries complete Match input and source/runtime metadata. [VERIFIED: `.planning/REQUIREMENTS.md`] | unit/contract | `pnpm --filter @cowards/spec test -- spec.test.ts` plus new runtime-service schema tests. [VERIFIED: `packages/spec/package.json`] | No - Wave 0 add `packages/spec/src/runtime-execution-service.test.ts`. |
| RT-02 | Service executes only and owns no DB writes/claims. [VERIFIED: `.planning/REQUIREMENTS.md`] | unit/import-boundary | `pnpm --filter @cowards/runtime-service test -- import-boundary.test.ts` after app exists. [VERIFIED: `eslint.config.mjs`] | No - Wave 0 add runtime-service import-boundary test. |
| RT-03 | Go does not execute/import/transpile Strategy source or use Node `vm`. [VERIFIED: `.planning/REQUIREMENTS.md`] | Go static/unit | `cd apps/go-backend && go test ./...` plus source scan for `vm`, `eval`, JS runtimes. [VERIFIED: `apps/go-backend/main_test.go`] | Partial - existing Go tests, add runtime client test. |
| RT-04 | Runtime violations are valid Match/Chronicle outcomes; system failures are envelopes. [VERIFIED: `.planning/REQUIREMENTS.md`] | unit/integration | `pnpm --filter @cowards/runtime-js test -- integration.test.ts adapter-contract.test.ts` plus runtime-service failure tests. [VERIFIED: `packages/runtime-js/src/integration.test.ts`, `packages/runtime-js/src/adapter-contract.test.ts`] | Partial - runtime-js exists; service tests missing. |
| RT-05 | Invalid output, timeout, malformed response, source hash mismatch, oversized output, stopped service, redaction. [VERIFIED: `.planning/REQUIREMENTS.md`] | unit/Go httptest | `pnpm --filter @cowards/runtime-service test && cd apps/go-backend && go test ./...` [VERIFIED: `apps/worker/src/runner.test.ts`, `apps/go-backend/main_test.go`] | No - Wave 0 add service and Go client tests. |
| RT-06 | Adapter readiness labels unchanged. [VERIFIED: `.planning/REQUIREMENTS.md`] | monitor/unit | `pnpm boundary:monitors` [VERIFIED: `package.json`, `scripts/check-boundary-monitors.ts`] | Yes - existing monitor, extend for runtime-service if needed. |

### Sampling Rate

- **Per task commit:** `pnpm --filter @cowards/spec test && pnpm --filter @cowards/runtime-js test -- adapter-contract.test.ts` plus new runtime-service focused tests. [VERIFIED: `packages/spec/package.json`, `packages/runtime-js/package.json`]
- **Per wave merge:** `pnpm test:fast && cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` [VERIFIED: `package.json`, `apps/go-backend/main_test.go`]
- **Phase gate:** Full suite and boundary monitors green before verification. [VERIFIED: `package.json`, `.planning/ROADMAP.md`]

### Wave 0 Gaps

- [ ] `packages/spec/src/runtime-execution-service.ts` and `.test.ts` - covers RT-01 request/response schemas. [VERIFIED: `packages/spec/src/runtime.ts`, `packages/spec/src/schemas.ts`]
- [ ] `apps/runtime-service/src/server.ts`, `execute-match.ts`, `contract.test.ts`, `redaction.test.ts`, `import-boundary.test.ts` - covers RT-02, RT-04, RT-05. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`]
- [ ] `apps/go-backend/runtime_service_client.go` and `runtime_service_contract_test.go` - covers Go-side strict decode, stopped-service, malformed response, timeout, and redaction. [VERIFIED: `apps/go-backend/main.go`, `apps/go-backend/main_test.go`]
- [ ] Monitor update to assert runtime-service has no persistence/pg imports and ABI remains v1.14. [VERIFIED: `scripts/check-boundary-monitors.ts`, `eslint.config.mjs`]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | No direct end-user auth in runtime service. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] | Keep runtime service internal/local; Go backend remains authenticated workflow owner. [VERIFIED: `apps/go-backend/live_backend.go`] |
| V3 Session Management | No direct session handling in runtime service. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] | Do not forward cookies/tokens to runtime service. [VERIFIED: `packages/spec/src/public-output-privacy.ts`, `apps/go-backend/main.go`] |
| V4 Access Control | Yes, process-boundary access control applies. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] | Go is the only normal caller; runtime service owns no product routes or DB credentials. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] |
| V5 Input Validation | Yes. [VERIFIED: `AGENTS.md`] | Zod schemas on TypeScript boundary and strict Go JSON decode; source hash/byte validation on both sides. [VERIFIED: `packages/spec/src/schemas.ts`, `apps/go-backend/main.go`, `packages/runtime-js/src/abi-bridge.ts`] |
| V6 Cryptography | Yes for source hashing only. [VERIFIED: `packages/runtime-js/src/hash.ts`, `apps/go-backend/live_backend.go`] | Use existing SHA-256 source hash semantics; do not invent alternate hashes. [VERIFIED: `packages/runtime-js/src/hash.ts`, `apps/go-backend/live_backend.go`] |
| V8 Data Protection | Yes. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] | Redact source, memories, objective payloads, diagnostics, stack/stderr, tokens, host paths, and DSNs from public/monitor/topology outputs. [VERIFIED: `packages/spec/src/public-output-privacy.ts`, `apps/go-backend/main.go`] |
| V14 Configuration | Yes. [VERIFIED: `scripts/check-local-topology.ts`] | Explicit runtime service URL/env; stopped service fails closed without TypeScript DB fallback. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] |

### Known Threat Patterns for Runtime Boundary

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Strategy source leakage through logs or diagnostics | Information Disclosure | Never log request bodies; run privacy deny-list on diagnostics; return public messages only. [VERIFIED: `packages/spec/src/public-output-privacy.ts`, `scripts/check-local-topology.ts`] |
| Malformed runtime-service response accepted by Go | Tampering | Go strict decode with unknown-field rejection and contract tests for bad JSON/extra fields. [VERIFIED: `apps/go-backend/main.go`, `apps/go-backend/main_test.go`] |
| Source hash mismatch between DB and runtime service | Tampering | SHA-256 source hash and byte validation before execution and before Go accepts response identity. [VERIFIED: `packages/runtime-js/src/hash.ts`, `packages/runtime-js/src/abi-bridge.ts`, `apps/go-backend/live_backend.go`] |
| Runtime service gains persistence authority | Elevation of Privilege | New app with no DB deps, import-boundary tests, and monitor checks. [VERIFIED: `apps/worker/package.json`, `apps/worker/src/runner.ts`, `scripts/check-boundary-monitors.ts`] |
| Node `vm` introduced as sandbox | Elevation of Privilege | Static scan/import ban; use existing adapters only. [VERIFIED: `AGENTS.md`, `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`] |
| Adapter system failure scored as player loss | Repudiation / Tampering | Preserve runtimeViolation vs systemFailure channels; Go lifecycle classifies infrastructure failures. [VERIFIED: `packages/spec/src/runtime.ts`, `packages/runtime-js/src/subprocess-adapter.ts`, `.planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md`] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project non-negotiables for deterministic engine, hostile Strategy isolation, no Node `vm`, schemas, canonical terms, and privacy. [VERIFIED: `AGENTS.md`]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/research/SUMMARY.md` - v1.15 scope, Phase 98 requirements, sequencing, and current milestone state. [VERIFIED: planning docs]
- `.planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md`, `.planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md`, `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md` - ownership labels, no-fallback rules, lifecycle failure boundaries, and Phase 98 locked decisions. [VERIFIED: phase contexts]
- `.planning/artifacts/v1.14-promotion-decision.md`, `.planning/artifacts/v1.14-route-ownership-manifest.json`, `.planning/artifacts/v1.14-boundary-baseline.md` - promoted runtime ABI v1.14 and deferred runtime/sandbox scope. [VERIFIED: planning artifacts]
- `packages/spec/src/runtime.ts`, `packages/spec/src/schemas.ts`, `packages/spec/src/public-output-privacy.ts` - runtime ABI, adapter readiness, Zod schemas, and privacy deny-list. [VERIFIED: repo code]
- `packages/runtime-js/src/abi-bridge.ts`, `executor.ts`, `adapter.ts`, `worker-thread-adapter.ts`, `subprocess-adapter.ts`, `container-subprocess-adapter.ts`, `subprocess-ipc.ts`, `hash.ts` - runtime bridge, adapter metadata, failure taxonomy, and source hashing. [VERIFIED: repo code]
- `apps/worker/src/runner.ts`, `apps/worker/src/runtime-config.ts`, `apps/worker/src/index.ts` - current coupled worker flow and reusable runtime configuration patterns. [VERIFIED: repo code]
- `apps/go-backend/live_backend.go`, `apps/go-backend/main.go`, `apps/go-backend/main_test.go`, `apps/go-backend/go.mod` - Go route/service patterns, source metadata handling, privacy checks, strict JSON decode, and Go versions/dependencies. [VERIFIED: repo code]

### Secondary (MEDIUM confidence)

- Context7 `/colinhacks/zod` docs - `.safeParse()` discriminated-union validation pattern. [CITED: Context7 `/colinhacks/zod`]
- Context7 `/vitest-dev/vitest` docs - fake timers and async wait utilities for timeout/service tests. [CITED: Context7 `/vitest-dev/vitest`]
- Node.js HTTP documentation - built-in Node HTTP server/client API. [CITED: https://nodejs.org/api/http.html]
- Go `net/http` documentation - standard library HTTP server/client package. [CITED: https://pkg.go.dev/net/http]
- npm registry - current versions and modified timestamps for `zod`, `tsx`, `vitest`, `typescript`, `@types/node`. [VERIFIED: npm registry]

### Tertiary (LOW confidence)

- None. [VERIFIED: source list]

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - versions and dependencies were verified from package files, npm registry, Go module metadata, and local runtime probes. [VERIFIED: `package.json`, `apps/go-backend/go.mod`, npm registry, local command output]
- Architecture: HIGH - locked Phase 98 decisions and current worker/runtime code define the split clearly. [VERIFIED: `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md`, `apps/worker/src/runner.ts`, `packages/runtime-js/src/abi-bridge.ts`]
- Pitfalls: HIGH - pitfalls are direct consequences of current coupled worker code, existing privacy deny-lists, and ABI/adapter monitors. [VERIFIED: `apps/worker/src/runner.ts`, `packages/spec/src/public-output-privacy.ts`, `scripts/check-boundary-monitors.ts`]

**Research date:** 2026-05-24
**Valid until:** 2026-06-23 for repo-local architecture; recheck npm/runtime versions after 30 days. [VERIFIED: current date; VERIFIED: npm registry]
