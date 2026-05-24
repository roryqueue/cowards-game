# Phase 104: Isolated Runtime Service Boundary Hardening - Research

**Researched:** 2026-05-24 [VERIFIED: system date]
**Domain:** Broker-ready Strategy Execution Service / Runtime Broker contract around the isolated JS/TS runtime service [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md]
**Confidence:** HIGH for repo-local contract, service, Go client, monitor, and test guidance; MEDIUM for future WASM/WASI notes because v1.16 intentionally does not implement or promote that path [VERIFIED: packages/spec/src/runtime-execution-service.ts; VERIFIED: apps/runtime-service/src/execute-match.ts; VERIFIED: apps/go-backend/runtime_service_client.go; VERIFIED: .planning/REQUIREMENTS.md]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Contract Naming
- **D-01:** Name the future-facing abstraction **Strategy Execution Service / Runtime Broker** in docs, manifests, and monitor-facing artifacts.
- **D-02:** Label today's implementation as the isolated JS/TS runtime service, not as the backend and not as the final Runtime Broker.

### Transport And ABI
- **D-03:** Keep the current HTTP+JSON runtime service as the v1.16 implementation.
- **D-04:** Describe the boundary in transport-neutral contract terms so a future broker can front or replace it without changing Go orchestration, persistence, scoring, or public evidence ownership.
- **D-05:** Require every future language runtime to implement the same JSON/runtime ABI with schema-validated request and response envelopes.
- **D-06:** Do not permit language-specific shortcut contracts for counted Match execution.

### Strategy Revision Artifact Policy
- **D-07:** Validate, compile/transpile, hash, size-check, and package Strategy Revisions at submission where practical.
- **D-08:** Matches must execute immutable Strategy Revision artifacts/revisions rather than mutable source or web/API evaluation paths.
- **D-09:** Go and web/API processes must not import, evaluate, transpile, or execute Strategy source.

### Runtime Service Authority
- **D-10:** The runtime service may execute Strategy code and return schema-validated internal runtime results to Go only.
- **D-11:** The runtime service must not claim jobs, complete Matches, persist Chronicles, refresh scoring, serve public product API routes, deliver public evidence, touch web session state, or act as a backend fallback.
- **D-12:** Runtime service outputs must remain internal to Go orchestration and must preserve public replay/privacy projection boundaries.

### Sandbox And Language Readiness
- **D-13:** Keep worker-thread, subprocess, container-subprocess, non-JS, and WASM/WASI/component-model readiness as explicit labels rather than implicit promotions.
- **D-14:** Treat WASM/WASI/component-model as a strong long-term candidate path for some languages, not a v1.16 promotion or a universal sandbox answer.
- **D-15:** Node `node:wasi` is not accepted as an untrusted Strategy sandbox.

### Failure And Privacy Semantics
- **D-16:** Malformed input, ABI drift, timeout, invalid output, crash, oversized payload, source mismatch, and unsafe diagnostics must fail closed.
- **D-17:** Failure responses must be schema-validated and redacted; they must not leak Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, session, token, DB DSN, host path, or private runtime internals.
- **D-18:** Runtime service failure must not trigger fallback to retired TypeScript backend paths.

### the agent's Discretion
The agent may decide whether Phase 104 expresses the broker-ready contract as spec exports, JSON schema artifacts, runtime-service tests, monitor metadata, documentation, or some combination, provided Go keeps calling the public runtime execution contract and the current service remains DB/job/API-free.

### Deferred Ideas (OUT OF SCOPE)
- Building the actual language-neutral Runtime Broker.
- Replacing JS/TS runtime execution.
- Promoting counted non-JS Strategy play.
- Promoting WASM/WASI/component-model or Node `node:wasi` as a production hostile-code sandbox.
- Replacing the production sandbox boundary.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RT-01 | Inspect broker-ready runtime service boundary including transport, ABI, envelopes, package policy, limits, timeouts, diagnostics, logs, crash, privacy, and no-fallback behavior. | Use `packages/spec/src/runtime-execution-service.ts`, `packages/spec/src/runtime.ts`, `packages/spec/src/schemas.ts`, `apps/runtime-service/src/*`, and a new/updated runtime boundary doc/artifact as the contract source. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: packages/spec/src/runtime-execution-service.ts; VERIFIED: packages/spec/src/runtime.ts; VERIFIED: packages/spec/src/schemas.ts] |
| RT-02 | Verify JS/TS Strategy execution remains only inside isolated runtime service or explicit runtime adapter boundary. | Enforce through runtime-service and runtime-js boundary tests plus inventory fields for `runtime-service` and `runtime-adapter` rows. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json; VERIFIED: apps/runtime-service/src/execute-match.test.ts] |
| RT-03 | Verify runtime service has no job, Match completion, Chronicle persistence, scoring, product API, web request state, or fallback ownership. | Extend tests/monitors to assert production runtime-service files and package deps are DB/job/API-free, not just import-line free. [VERIFIED: apps/runtime-service/src/execute-match.test.ts; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| RT-04 | Verify Go invokes runtime execution exclusively through `runtime-execution-service-v1.15` and `strategy-runtime-abi-v1.14` or compatible successor. | Keep Go client constants aligned with spec constants and add drift tests/monitor metadata. [VERIFIED: apps/go-backend/runtime_service_client.go; VERIFIED: packages/spec/src/runtime-execution-service.ts; VERIFIED: packages/spec/src/runtime.ts] |
| RT-05 | Verify schemas reject ABI drift, malformed inputs, source mismatches, oversized payloads, invalid output, unsafe diagnostics, and private leaks; submission performs practical compile/validation/package checks before immutable execution. | Use Zod request/response schemas, runtime-js revision validation, Go client validation, redaction tests, and artifact policy documentation. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: packages/runtime-js/src/revision.ts; VERIFIED: packages/runtime-js/src/validation.ts; VERIFIED: apps/go-backend/runtime_service_client_test.go] |
| RT-06 | Verify Go and web/API do not import/evaluate/transpile/execute Strategy source and do not use Node `vm` as a hostile-code boundary. | Add monitor checks for forbidden Strategy execution imports outside `apps/runtime-service` and `packages/runtime-js/worker`, plus Node `vm` scan. [VERIFIED: AGENTS.md; VERIFIED: scripts/check-boundary-monitors.ts; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| RT-07 | Verify worker-thread, subprocess, container-subprocess, and non-JS readiness labels do not silently promote production sandbox or counted non-JS play. | Keep registry metadata and monitor guardrails as the source of truth; update wording to Phase 104/v1.16. [VERIFIED: packages/spec/src/runtime.ts; VERIFIED: packages/runtime-js/src/sandbox-evaluation.ts; VERIFIED: scripts/check-boundary-monitors.ts] |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- The engine must remain pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Game rules must not move into React components. [VERIFIED: AGENTS.md]
- User Strategy code must not execute in the web/API process. [VERIFIED: AGENTS.md]
- Engine logic must not use `Math.random`, `Date.now`, system time, filesystem, network, or database access. [VERIFIED: AGENTS.md]
- Node `vm` must not be used as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Strategy code must be treated as hostile and every runtime boundary must be schema-validated. [VERIFIED: AGENTS.md]
- Canonical terminology must be preserved: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: AGENTS.md]
- Runtime tests must cover invalid outputs, timeout behavior, forbidden capabilities, memory/source limits, and schema validation. [VERIFIED: AGENTS.md]
- Worker tests must distinguish strategy failure from system failure. [VERIFIED: AGENTS.md]

## Summary

Phase 104 should not create a broker, replace JS/TS execution, or promote WASM/WASI; it should make the existing TypeScript runtime service look like one implementation behind a future **Strategy Execution Service / Runtime Broker** boundary. [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md] The current implementation already has the core pieces: `runtime-execution-service-v1.15`, `strategy-runtime-abi-v1.14`, Zod request/response schemas, a DB-free runtime-service package, Go HTTP+JSON client validation, runtime-js adapter metadata, and redaction tests. [VERIFIED: packages/spec/src/runtime-execution-service.ts; VERIFIED: packages/spec/src/runtime.ts; VERIFIED: packages/spec/src/schemas.ts; VERIFIED: apps/runtime-service/package.json; VERIFIED: apps/go-backend/runtime_service_client.go; VERIFIED: apps/runtime-service/src/execute-match.test.ts]

The planner should focus implementation on contract clarity and enforcement: add broker-ready naming/metadata/docs, update generated artifacts or schema artifacts, extend runtime-service and Go tests for no DB/job/API ownership, add monitor checks for no fallback and no Strategy execution outside the runtime boundary, and document submission-time artifact policy without moving evaluation into Go or web/API. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json; VERIFIED: scripts/check-boundary-monitors.ts]

**Primary recommendation:** Treat `packages/spec/src/runtime-execution-service.ts` as the public Strategy Execution Service / Runtime Broker contract, keep HTTP+JSON in `apps/runtime-service/src/server.ts` as the v1.16 transport binding, and make `scripts/check-boundary-monitors.ts` fail if runtime-service/runtime-js gain DB/job/scoring/public-API ownership or if Go/web/API gain Strategy execution paths. [VERIFIED: packages/spec/src/runtime-execution-service.ts; VERIFIED: apps/runtime-service/src/server.ts; VERIFIED: scripts/check-boundary-monitors.ts]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Strategy Revision submission validation/artifact policy | API / Backend | Runtime Adapter | Submission must validate/hash/size-check/package where practical before immutable Match execution, while runtime-js owns JS/TS validation/transpile helpers. [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md; VERIFIED: packages/runtime-js/src/revision.ts; VERIFIED: packages/runtime-js/src/validation.ts] |
| Counted Match Strategy execution | Isolated Runtime Service | Runtime Adapter | The runtime service executes Strategy code and returns internal runtime results; runtime-js adapters execute JS/TS methods behind the ABI. [VERIFIED: apps/runtime-service/src/execute-match.ts; VERIFIED: packages/runtime-js/src/executor.ts; VERIFIED: packages/runtime-js/src/abi-bridge.ts] |
| Match orchestration, job ownership, persistence, scoring, public evidence | Go Backend | Database / Storage | v1.15 Go ownership is the backend baseline, and the runtime service must not claim jobs, persist Chronicles, refresh scoring, or serve public evidence. [VERIFIED: .planning/PROJECT.md; VERIFIED: .planning/STATE.md; VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md] |
| Runtime service transport binding | Isolated Runtime Service | Go Backend | v1.16 keeps HTTP+JSON `/execute-match`; Go invokes that contract through the runtime service client. [VERIFIED: apps/runtime-service/src/server.ts; VERIFIED: apps/go-backend/runtime_service_client.go] |
| Public replay/privacy projection | Go Backend | Frontend | Runtime success responses are `internal_runtime_result`; public projection ownership stays outside the runtime service. [VERIFIED: packages/spec/src/runtime-execution-service.ts; VERIFIED: packages/spec/src/schemas.ts; VERIFIED: .planning/REQUIREMENTS.md] |
| Runtime readiness labels | Spec / Contract | Runtime Adapter | Adapter readiness/counting/isolation promotion states are declared in spec metadata and consumed by monitors. [VERIFIED: packages/spec/src/runtime.ts; VERIFIED: scripts/check-boundary-monitors.ts] |

```text
Strategy Revision submitted
  -> API/backend validates, hashes, size-checks, packages immutable revision
  -> Go orchestration creates counted Match request
  -> Strategy Execution Service contract envelope (transport-neutral JSON ABI)
  -> v1.16 HTTP+JSON binding: apps/runtime-service /execute-match
  -> runtime-js adapter executes JS/TS Strategy methods
  -> schema-validated internal runtime result or redacted system failure
  -> Go owns Chronicle persistence handoff, scoring, public evidence projection
```

This flow preserves Phase 104 ownership boundaries. [VERIFIED: .planning/ROADMAP.md; VERIFIED: apps/runtime-service/src/execute-match.ts; VERIFIED: apps/go-backend/runtime_service_client.go]

## Standard Stack

### Core

| Library / Component | Version | Purpose | Why Standard |
|---------------------|---------|---------|--------------|
| `@cowards/spec` runtime execution contract | internal `0.1.0`; `runtime-execution-service-v1.15` | Shared TypeScript contract and Zod schemas for runtime service request/response envelopes. | Existing Go/runtime-service integration already uses this version. [VERIFIED: packages/spec/package.json; VERIFIED: packages/spec/src/runtime-execution-service.ts; VERIFIED: apps/go-backend/runtime_service_client.go] |
| `@cowards/spec` runtime ABI | `strategy-runtime-abi-v1.14` | Shared Strategy method ABI, limits, adapter registry, runtime metadata, and promotion labels. | Existing runtime service and Go client already validate this ABI. [VERIFIED: packages/spec/src/runtime.ts; VERIFIED: apps/go-backend/runtime_service_client.go] |
| `zod` | repo `^4.4.3`; npm latest `4.4.3`, published 2026-05-04 | Runtime boundary schema validation. | Existing schemas are Zod-based; no dependency change is needed for Phase 104. [VERIFIED: packages/spec/package.json; VERIFIED: npm registry] |
| `@cowards/runtime-js` | internal `0.1.0` | JS/TS Strategy Revision validation, hashing, transpile-only compilation, and worker-only execution adapters. | Existing package separates safe public API from worker-only execution API. [VERIFIED: packages/runtime-js/package.json; VERIFIED: packages/runtime-js/README.md; VERIFIED: packages/runtime-js/src/index.ts; VERIFIED: packages/runtime-js/src/worker.ts] |
| Go runtime service client | `go 1.25.0` module target; local toolchain `go1.26.3` | Go-side HTTP+JSON invocation, response cap, drift validation, and redaction. | Existing v1.15 backend calls runtime execution through this client. [VERIFIED: apps/go-backend/go.mod; VERIFIED: apps/go-backend/runtime_service_client.go; VERIFIED: local environment probe] |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| `vitest` | repo `^4.1.6`; installed `4.1.6`; npm latest `4.1.7`, published 2026-05-20 | TypeScript unit/contract tests. | Use for spec/runtime-service/runtime-js/monitor tests. [VERIFIED: package.json; VERIFIED: node_modules listing; VERIFIED: npm registry] |
| `typescript` | repo `^6.0.3`; npm latest `6.0.3`, published 2026-04-16 | Type checking and TS AST-backed scripts. | Use existing compiler version; do not upgrade in Phase 104. [VERIFIED: package.json; VERIFIED: npm registry] |
| `tsx` | runtime-service dev dependency `^4.21.0` | Runtime service dev/start scripts and monitor scripts. | Keep for existing script execution. [VERIFIED: apps/runtime-service/package.json; VERIFIED: package.json] |
| Docker | local `29.4.0` | Container-subprocess evaluation path. | Optional for container candidate evidence only; not required to promote v1.16 production sandbox. [VERIFIED: local environment probe; VERIFIED: packages/runtime-js/src/container-subprocess-adapter.ts; VERIFIED: .planning/REQUIREMENTS.md] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing HTTP+JSON runtime service | gRPC/IPC/new broker service | Out of scope because D-03 keeps HTTP+JSON and D-04 asks only for transport-neutral contract wording. [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md] |
| Existing Zod schemas | Hand-written JSON validation in Go/TS | Do not hand-roll because current boundary schemas already enforce literals, limits, identity checks, and response shape. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: apps/go-backend/runtime_service_client.go] |
| Existing runtime-js adapters | WASM/WASI/component-model promotion | Out of scope for v1.16; keep as long-term notes and readiness labels only. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: packages/runtime-js/src/sandbox-evaluation.ts] |

**Installation:** No new dependency installation is recommended for Phase 104. [VERIFIED: package.json; VERIFIED: .planning/REQUIREMENTS.md]

**Version verification commands run:**
```bash
npm view zod version time --json
npm view vitest version time --json
npm view typescript version time --json
node --version
pnpm --version
go version
docker --version
```
These commands verified current registry/tool versions used above. [VERIFIED: npm registry; VERIFIED: local environment probe]

## Architecture Patterns

### Recommended Project Structure

```text
packages/spec/src/runtime-execution-service.ts      # broker-ready public service contract
packages/spec/src/runtime.ts                        # runtime ABI, limits, readiness labels
packages/spec/src/schemas.ts                        # schema enforcement for envelopes
packages/spec/artifacts/                            # generated runtime contract artifacts
apps/runtime-service/src/                           # v1.16 isolated JS/TS service implementation
packages/runtime-js/src/                            # JS/TS adapter and revision artifact helpers
apps/go-backend/runtime_service_client.go           # Go invocation boundary
scripts/check-boundary-monitors.ts                  # strict drift and no-ownership checks
.planning/artifacts/                                # human/machine-readable boundary evidence
```

This structure matches the existing workspace layout. [VERIFIED: rg --files project scan]

### Pattern 1: Contract-Terms First, HTTP Binding Second

**What:** Define the public boundary as `Strategy Execution Service / Runtime Broker` in spec/docs/artifacts, and label `apps/runtime-service` as the v1.16 isolated JS/TS HTTP+JSON binding. [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md; VERIFIED: apps/runtime-service/src/server.ts]

**When to use:** Use this pattern for docs, monitor metadata, generated artifacts, health responses, and tests that describe future replacement/fronting by a broker. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: scripts/check-boundary-monitors.ts]

**Example:**
```typescript
// Source: packages/spec/src/runtime-execution-service.ts
export const RUNTIME_EXECUTION_SERVICE_VERSION =
  "runtime-execution-service-v1.15" as const
```

### Pattern 2: Schema-Validated Fail-Closed Envelopes

**What:** Parse every request through `RuntimeExecutionServiceRequestSchema`; parse every success/failure response through `RuntimeExecutionServiceResponseSchema`; convert malformed input or execution exceptions into redacted `systemFailure` envelopes. [VERIFIED: apps/runtime-service/src/execute-match.ts; VERIFIED: packages/spec/src/schemas.ts]

**When to use:** Use this pattern for malformed input, ABI drift, source mismatch, oversized limit, response schema invalid, execution exception, and unsafe diagnostics tests. [VERIFIED: apps/runtime-service/src/execute-match.test.ts; VERIFIED: apps/go-backend/runtime_service_client_test.go]

**Example:**
```typescript
// Source: apps/runtime-service/src/execute-match.ts
const parsedRequest =
  RuntimeExecutionServiceRequestSchema.safeParse(rawRequest)
```

### Pattern 3: Runtime-Only Authority Tests

**What:** Test production `apps/runtime-service/src/*.ts` and `apps/runtime-service/package.json` for forbidden persistence/job/scoring/public-API/session imports and dependencies. [VERIFIED: apps/runtime-service/src/execute-match.test.ts]

**When to use:** Keep this test close to runtime-service and mirror it in `scripts/check-boundary-monitors.ts` so CI catches drift even if tests are not run package-locally. [VERIFIED: package.json; VERIFIED: scripts/check-boundary-monitors.ts]

**Implementation guidance:** Extend the current DB-free test to assert no imports or dependency names contain `@cowards/persistence`, `pg`, `apps/worker`, `claimNextMatchJob`, `completeMatch`, `recordAttemptFailure`, `createPostgresChronicleStore`, `matchset-status`, `governance`, `session`, product `route` handlers, or `@cowards/service`. [VERIFIED: apps/runtime-service/src/execute-match.test.ts; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json; VERIFIED: scripts/check-boundary-monitors.ts]

### Pattern 4: Immutable Submission Artifact Policy Without Web/API Execution

**What:** Document that Strategy Revisions are validated, compiled/transpiled, hashed, size-checked, and packaged at submission where practical, but counted Match execution still happens only through the runtime service boundary. [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md; VERIFIED: packages/runtime-js/src/revision.ts; VERIFIED: packages/runtime-js/src/validation.ts]

**When to use:** Use this for spec docs/artifacts and tests that ensure Go/web/API do not import `transpileStrategySource`, `createRuntimeFromRevision`, or `@cowards/runtime-js/worker`. [VERIFIED: packages/runtime-js/src/revision.ts; VERIFIED: packages/runtime-js/src/executor.ts; VERIFIED: AGENTS.md]

### Anti-Patterns to Avoid

- **Calling the current TypeScript service the backend:** The manifest and roadmap prohibit normal TypeScript backend ownership. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json; VERIFIED: .planning/ROADMAP.md]
- **Letting runtime-service own jobs or evidence:** The runtime service must not claim jobs, complete Matches, persist Chronicles, refresh scoring, serve public routes, or deliver public evidence. [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md]
- **Using Node `vm` or Node `node:wasi` as a hostile-code boundary:** Node `vm` is prohibited by AGENTS, and Node `node:wasi` is rejected by Phase 104 decisions. [VERIFIED: AGENTS.md; VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md; CITED: https://nodejs.org/api/vm.html; CITED: https://nodejs.org/api/wasi.html]
- **Language-specific shortcut contracts:** D-05 and D-06 require future language runtimes to implement the same JSON/runtime ABI. [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md]
- **Publicly projecting runtime results directly:** Runtime success responses are marked `privacy: "internal_runtime_result"`, so Go owns public projection boundaries. [VERIFIED: packages/spec/src/runtime-execution-service.ts; VERIFIED: packages/spec/src/schemas.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Runtime envelope validation | Ad hoc object checks in runtime-service | `RuntimeExecutionServiceRequestSchema` and `RuntimeExecutionServiceResponseSchema` | Existing schemas validate contract literals, request identity, limits, source identity, response variants, and internal privacy marker. [VERIFIED: packages/spec/src/schemas.ts] |
| Runtime ABI validation | Per-language request shapes | `StrategyRuntimeRequestEnvelopeSchema` and `StrategyRuntimeResponseEnvelopeSchema` | Existing ABI schemas enforce `strategy-runtime-abi-v1.14`, method names, runtime metadata, source identity, and JSON response values. [VERIFIED: packages/spec/src/schemas.ts] |
| Strategy source identity | Manual hash/byte logic scattered across processes | `buildStrategyRevision`, `hashStrategySource`, Go client local validation | Existing TS and Go code already validate source hash and byte count before execution/transport. [VERIFIED: packages/runtime-js/src/revision.ts; VERIFIED: packages/runtime-js/src/hash.ts; VERIFIED: apps/go-backend/runtime_service_client.go] |
| Diagnostics redaction | Per-call string cleanup | `redaction.ts` plus Go `sanitizeRuntimeServiceFailure` | Both service and Go client centralize redaction of source, memory, token, host path, stack, stderr, and database markers. [VERIFIED: apps/runtime-service/src/redaction.ts; VERIFIED: apps/go-backend/runtime_service_client.go] |
| Adapter readiness policy | Free-text README labels only | `STRATEGY_RUNTIME_ADAPTER_REGISTRY`, `NON_JS_RUNTIME_SUPPORT_POLICY`, monitor checks | Existing registry has readiness, counted eligibility, isolation promotion state, and criteria fields. [VERIFIED: packages/spec/src/runtime.ts; VERIFIED: scripts/check-boundary-monitors.ts] |
| Runtime ownership auditing | Manual review only | Phase 103 inventory plus `scripts/check-boundary-monitors.ts` | Inventory exposes role/capability booleans and monitor-ready fields for each TS surface. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json; VERIFIED: scripts/check-boundary-monitors.ts] |

**Key insight:** The risky work is not algorithmic; it is boundary drift, ambiguous naming, and fallback ownership. Use existing schemas, manifests, and monitors so Phase 104 creates enforceable contracts rather than another parallel runtime abstraction. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json]

## Exact File Guidance

### Contract / Schema / Artifact Updates

| File | Action |
|------|--------|
| `packages/spec/src/runtime-execution-service.ts` | Add broker-ready public contract metadata/naming comments or exports that distinguish `Strategy Execution Service / Runtime Broker` from the v1.16 isolated JS/TS runtime-service implementation; preserve `runtime-execution-service-v1.15` unless changing it is explicitly planned. [VERIFIED: packages/spec/src/runtime-execution-service.ts; VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md] |
| `packages/spec/src/runtime.ts` | Keep `strategy-runtime-abi-v1.14`; update readiness wording from old milestone strings where needed and ensure worker-thread/subprocess/container/non-JS states remain explicit evidence/prototype/candidate labels. [VERIFIED: packages/spec/src/runtime.ts] |
| `packages/spec/src/schemas.ts` | Do not duplicate schemas; add tests around existing schemas for broker-ready envelope behavior if gaps are found. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: packages/spec/src/spec.test.ts] |
| `packages/spec/artifacts/runtime-execution-service-request.v1.15.json` | Keep fixture parseable and source-containing because it is an internal contract fixture, not a public artifact; add public-safe artifact guidance elsewhere rather than deleting required fixture source. [VERIFIED: packages/spec/artifacts/runtime-execution-service-request.v1.15.json; VERIFIED: apps/runtime-service/src/execute-match.test.ts] |
| New or updated `.planning/artifacts/v1.16-runtime-service-boundary.*` | Recommended artifact: include contract name, current implementation label, transport binding, ABI version, request/response schemas, source package policy, authority matrix, diagnostics/redaction policy, no-fallback policy, and WASM/WASI non-promotion note. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md] |
| `.planning/artifacts/v1.16-typescript-backend-inventory.json` and `.md` | Regenerate only if implementation changes role metadata or scanner classification; keep runtime rows DB/job/API-free. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json; VERIFIED: scripts/generate-typescript-backend-inventory.ts] |

### Runtime Service / Runtime-JS Tests

| File | Action |
|------|--------|
| `apps/runtime-service/src/execute-match.test.ts` | Extend malformed input, source bytes mismatch, ABI drift, timeout/runtime violation, invalid output, oversized body/limits, response schema invalid, execution exception, and redaction tests. [VERIFIED: apps/runtime-service/src/execute-match.test.ts] |
| `apps/runtime-service/src/server.ts` | Add tests around `/health`, `/execute-match`, body limit fail-closed behavior, and absence of product API routes; do not add product routes here. [VERIFIED: apps/runtime-service/src/server.ts] |
| `apps/runtime-service/src/redaction.ts` | Add table tests for Strategy source, StrategyMemory, SoldierMemory, objective payload, owner debug, raw Awareness Grid, stack, stderr, session, token, DB DSN, host path, and private runtime internals. [VERIFIED: apps/runtime-service/src/redaction.ts; VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md] |
| `packages/runtime-js/src/adapter-contract.test.ts` | Ensure adapter contract tests still distinguish runtime violations from system failures. [VERIFIED: packages/runtime-js/src/adapter-contract.test.ts; VERIFIED: AGENTS.md] |
| `packages/runtime-js/src/isolation-boundary.test.ts` and `hostile-matrix.test.ts` | Keep forbidden capability and hostile probe coverage as runtime-adapter evidence only, not production sandbox promotion. [VERIFIED: packages/runtime-js/src/isolation-boundary.test.ts; VERIFIED: packages/runtime-js/src/hostile-matrix.test.ts; VERIFIED: packages/spec/src/runtime.ts] |
| `packages/runtime-js/src/validation.test.ts` | Preserve/extend validation for forbidden `WebAssembly`, imports, `eval`, `Function`, process, filesystem/network, clocks, randomness, workers, child processes, and package install commands. [VERIFIED: packages/runtime-js/src/validation.ts; VERIFIED: packages/runtime-js/src/validation.test.ts] |

### Go Client / No-Fallback Tests

| File | Action |
|------|--------|
| `apps/go-backend/runtime_service_client.go` | Keep constants aligned with spec; preserve local pre-transport validation, response byte cap, strict JSON decode, response drift checks, and sanitized service failure mapping. [VERIFIED: apps/go-backend/runtime_service_client.go] |
| `apps/go-backend/runtime_service_client_test.go` | Add/keep tests for stopped service, timeout, malformed response, oversized response, response contract drift, source mismatch before transport, and redacted service failure. [VERIFIED: apps/go-backend/runtime_service_client_test.go] |
| Go orchestration caller files | Verify they call `runtimeServiceClient.executeMatch` and do not import/evaluate/transpile Strategy source; exact caller search should be part of implementation wave 0. [VERIFIED: apps/go-backend/runtime_service_client.go; VERIFIED: AGENTS.md] |

### Monitor / Inventory Updates

| File | Action |
|------|--------|
| `scripts/check-boundary-monitors.ts` | Add Phase 104 checks for runtime-service contract naming, runtime-service DB/job/API-free production files, Go/spec version sync, runtime ABI drift, no Node `vm`, no Go/web Strategy execution, no retired TypeScript fallback on runtime failure, and public artifact privacy. [VERIFIED: scripts/check-boundary-monitors.ts; VERIFIED: .planning/REQUIREMENTS.md] |
| `scripts/generate-typescript-backend-inventory.ts` | Update classification metadata only if new broker-ready fields are added to the manifest; keep allowed roles unchanged. [VERIFIED: scripts/generate-typescript-backend-inventory.ts; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| `scripts/check-boundary-monitors.test.ts` | Add unit tests for the new monitor checks so Phase 108 can promote them to strict topology gates. [VERIFIED: scripts/check-boundary-monitors.test.ts; VERIFIED: .planning/ROADMAP.md] |
| `package.json` | Keep `pnpm boundary:monitors` as the aggregate gate; no new script is required unless artifact generation is added. [VERIFIED: package.json] |

## Common Pitfalls

### Pitfall 1: Naming The Current Runtime Service As The Final Broker
**What goes wrong:** Documentation or health metadata implies `apps/runtime-service` is the final Runtime Broker. [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md]
**Why it happens:** The current service is the only runtime execution service implementation today. [VERIFIED: apps/runtime-service/src/server.ts]
**How to avoid:** Use `Strategy Execution Service / Runtime Broker` for the future abstraction and `isolated JS/TS runtime service` for v1.16 implementation. [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md]
**Warning signs:** Health logs or artifacts say the TypeScript service is "the backend" or "the broker" without "v1.16 JS/TS implementation" qualification. [VERIFIED: apps/runtime-service/src/index.ts; VERIFIED: .planning/REQUIREMENTS.md]

### Pitfall 2: Runtime Service Gains Backend Ownership Through Imports
**What goes wrong:** Runtime-service imports persistence, jobs, scoring, public API, web session, or service packages. [VERIFIED: .planning/REQUIREMENTS.md]
**Why it happens:** Runtime execution sits near Match completion semantics and can accidentally absorb orchestration responsibilities. [VERIFIED: apps/runtime-service/src/execute-match.ts; VERIFIED: .planning/STATE.md]
**How to avoid:** Test `apps/runtime-service/src` production imports and dependencies; add monitor checks against Phase 103 capability booleans. [VERIFIED: apps/runtime-service/src/execute-match.test.ts; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json]
**Warning signs:** Runtime-service dependency list includes `@cowards/persistence`, `pg`, `@cowards/service`, `apps/worker`, or route/session modules. [VERIFIED: apps/runtime-service/package.json; VERIFIED: apps/runtime-service/src/execute-match.test.ts]

### Pitfall 3: Redaction Tests Cover Messages But Not Diagnostics
**What goes wrong:** `publicMessage` is safe but nested diagnostics leak stderr, host paths, Strategy source, memory, tokens, or DB DSNs. [VERIFIED: apps/runtime-service/src/redaction.ts; VERIFIED: apps/go-backend/runtime_service_client_test.go]
**Why it happens:** Runtime failures cross two redaction layers: TS service response and Go client sanitization. [VERIFIED: apps/runtime-service/src/execute-match.ts; VERIFIED: apps/go-backend/runtime_service_client.go]
**How to avoid:** Test complete serialized failure objects in both TS and Go. [VERIFIED: apps/runtime-service/src/execute-match.test.ts; VERIFIED: apps/go-backend/runtime_service_client_test.go]
**Warning signs:** Tests assert a field value but do not run denylist checks against `JSON.stringify(response)` or `runtimeServiceFailureJSONSafe`. [VERIFIED: apps/runtime-service/src/execute-match.test.ts; VERIFIED: apps/go-backend/runtime_service_client_test.go]

### Pitfall 4: Submission Artifact Policy Becomes Runtime Execution In Web/API
**What goes wrong:** Web/API or Go starts importing `@cowards/runtime-js/worker`, transpiling source, or executing Strategy code to validate submissions. [VERIFIED: AGENTS.md; VERIFIED: packages/runtime-js/README.md]
**Why it happens:** Compile/transpile/hash/size-check wording can be misread as permission to execute Strategy code outside the runtime service. [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md]
**How to avoid:** Allow safe revision construction/validation artifacts, but forbid worker execution imports outside runtime-service/runtime-js test scopes. [VERIFIED: packages/runtime-js/README.md; VERIFIED: packages/runtime-js/src/index.ts; VERIFIED: packages/runtime-js/src/worker.ts]
**Warning signs:** Go/web files import `createRuntimeFromRevision`, `transpileStrategySource`, runtime worker entrypoints, or Node `vm`. [VERIFIED: packages/runtime-js/src/executor.ts; VERIFIED: AGENTS.md]

### Pitfall 5: WASM/WASI Notes Read Like Promotion
**What goes wrong:** Documentation implies WASM/WASI/component-model is a v1.16 production sandbox or counted non-JS path. [VERIFIED: .planning/REQUIREMENTS.md]
**Why it happens:** Project docs describe WASM/WASI as a promising long-term candidate. [VERIFIED: .planning/PROJECT.md; VERIFIED: packages/runtime-js/src/sandbox-evaluation.ts]
**How to avoid:** Keep WASM/WASI/component-model in "future candidate / no promotion" notes, with required future proof: deterministic execution, capability sandboxing, resource limits, compilation provenance, and host-runtime security. [VERIFIED: .planning/REQUIREMENTS.md]
**Warning signs:** Adapter registry gains a counted WASM/non-JS runtime, public language picker changes, or Node `node:wasi` appears as an accepted sandbox. [VERIFIED: packages/spec/src/runtime.ts; VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md]

## Code Examples

### Runtime Service Request Parse
```typescript
// Source: apps/runtime-service/src/execute-match.ts
const parsedRequest =
  RuntimeExecutionServiceRequestSchema.safeParse(rawRequest)
```

### Schema-Validated Internal Result
```typescript
// Source: packages/spec/src/schemas.ts
result: z.object({
  privacy: z.literal("internal_runtime_result"),
  chronicle: ChronicleSchema,
  finalState: RuntimeExecutionFinalStateSchema,
  runtimeViolationEventCount: z.number().int().nonnegative(),
})
```

### Go-Side Response Cap And Strict Decode
```go
// Source: apps/go-backend/runtime_service_client.go
payload, err := io.ReadAll(io.LimitReader(response.Body, maxBytes+1))
decoder := json.NewDecoder(bytes.NewReader(payload))
decoder.DisallowUnknownFields()
```

### Adapter Readiness Metadata
```typescript
// Source: packages/spec/src/runtime.ts
isolationPromotionState: "evidence-only",
countedResultsAllowed: false,
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TypeScript service/backend could own selected backend-like workflows | Go is the normal backend baseline and TypeScript is frontend plus isolated runtime service/parity/rollback/test/deferred only | v1.15/v1.16 baseline | Phase 104 must not add runtime-service backend ownership. [VERIFIED: .planning/PROJECT.md; VERIFIED: .planning/STATE.md; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| Runtime execution described as implementation-specific JS worker behavior | Runtime execution crosses `runtime-execution-service-v1.15` and `strategy-runtime-abi-v1.14` | v1.15 | Phase 104 should make this broker-ready and language-neutral in docs/artifacts. [VERIFIED: packages/spec/src/runtime-execution-service.ts; VERIFIED: packages/spec/src/runtime.ts; VERIFIED: .planning/PROJECT.md] |
| Non-JS/WASM candidates as broad future ideas | Runtime registry and sandbox evaluation keep candidates evidence-only/non-counted unless explicitly promoted | v1.8-v1.16 | Phase 104 should preserve labels and avoid promotion. [VERIFIED: packages/spec/src/runtime.ts; VERIFIED: packages/runtime-js/src/sandbox-evaluation.ts; VERIFIED: .planning/REQUIREMENTS.md] |

**Deprecated/outdated:**
- Treating Node `vm` as a security boundary is prohibited by project instructions and contradicted by official Node docs warning that `node:vm` is not a security mechanism. [VERIFIED: AGENTS.md; CITED: https://nodejs.org/api/vm.html]
- Treating Node `node:wasi` as a production untrusted-code sandbox is prohibited by Phase 104 context; Node docs mark WASI as experimental and discuss WASI configuration rather than accepting it as a full hostile-code sandbox. [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md; CITED: https://nodejs.org/api/wasi.html]

## WASM / WASI / Component Model Notes

- WASM/WASI/component-model should be documented as a long-term candidate path for some languages, not as a v1.16 implementation or counted-play promotion. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md]
- Any future WASM/WASI promotion must prove deterministic execution, capability sandboxing, resource limits, compilation provenance, and host-runtime security. [VERIFIED: .planning/REQUIREMENTS.md]
- Current repo evidence treats `wasm-wasi` as `tradeoff-only`, with no adapter/toolchain and required host-defined capabilities/fuel/epoch/time/memory policy. [VERIFIED: packages/runtime-js/src/sandbox-evaluation.ts; VERIFIED: .planning/artifacts/runtime-sandbox-evaluation.json]
- Node `node:wasi` must remain rejected for hostile Strategy sandboxing in Phase 104. [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md; CITED: https://nodejs.org/api/wasi.html]
- Wasmtime-style fuel/resource-limiter ideas belong in future runtime research, not in Phase 104 implementation tasks. [VERIFIED: .planning/research/v1.9-RUNTIME-ISOLATION.md; CITED: https://docs.wasmtime.dev/examples-interrupting-wasm.html; CITED: https://docs.wasmtime.dev/api/wasmtime/trait.ResourceLimiter.html]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|

All claims in this research were verified from repo files, local commands, npm registry queries, or cited official documentation; no `[ASSUMED]` claims are intentionally used. [VERIFIED: research source audit]

## Open Questions

1. **Should Phase 104 generate a new JSON schema artifact for runtime service response/request, or only update docs/monitor metadata?** [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md]
   - What we know: Existing schemas live in TypeScript and the request fixture already exists. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: packages/spec/artifacts/runtime-execution-service-request.v1.15.json]
   - What's unclear: No current generator emits standalone JSON Schema for the runtime execution service. [VERIFIED: rg --files packages/spec/artifacts]
   - Recommendation: Prefer a small broker-boundary artifact in `.planning/artifacts` unless implementation discovers an existing schema generation pattern to reuse. [VERIFIED: packages/spec/scripts/generate-service-openapi.ts; VERIFIED: .planning/REQUIREMENTS.md]

2. **How strict should Phase 104 make no-fallback checks before Phase 108 topology hardening?** [VERIFIED: .planning/ROADMAP.md]
   - What we know: Phase 104 owns runtime boundary; Phase 108 owns strict no-TypeScript-backend topology. [VERIFIED: .planning/ROADMAP.md]
   - What's unclear: Whether all no-fallback behavior should be live-topology tested now or only contract/monitor tested now. [VERIFIED: .planning/ROADMAP.md]
   - Recommendation: Add unit/monitor checks now; leave live stopped-service drills and strict topology promotion to Phase 108. [VERIFIED: .planning/ROADMAP.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | TS tests/scripts/runtime-service | yes | `v24.15.0` | none needed. [VERIFIED: local environment probe] |
| pnpm | Monorepo scripts | yes | `11.1.2` | none needed. [VERIFIED: local environment probe; VERIFIED: package.json] |
| Go | Go runtime client tests | yes | `go1.26.3`; module target `go 1.25.0` | none needed. [VERIFIED: local environment probe; VERIFIED: apps/go-backend/go.mod] |
| Docker | Container-subprocess optional evidence | yes | `29.4.0` | Skip container evidence if unavailable; do not promote sandbox in Phase 104. [VERIFIED: local environment probe; VERIFIED: .planning/REQUIREMENTS.md] |
| `gsd-sdk query` | GSD helper in research instructions | no | installed CLI lacks `query` subcommand | Direct planning-file inspection used. [VERIFIED: failed `gsd-sdk query init.phase-op 104`] |
| Graphify | Optional graph context | disabled | graphify reports disabled | Continue without graph context. [VERIFIED: graphify status command] |

**Missing dependencies with no fallback:** None for Phase 104 research/planning. [VERIFIED: local environment probe]

**Missing dependencies with fallback:** `gsd-sdk query` and graphify are unavailable, with direct file inspection as fallback. [VERIFIED: failed `gsd-sdk query init.phase-op 104`; VERIFIED: graphify status command]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest for TypeScript plus Go `testing`; package uses `vitest` and Go module uses standard `go test`. [VERIFIED: package.json; VERIFIED: apps/go-backend/runtime_service_client_test.go] |
| Config file | Root `vitest.config.ts`, app web `apps/web/vitest.config.ts`, per-package scripts in `package.json`. [VERIFIED: rg --files config scan; VERIFIED: package.json] |
| Quick run command | `pnpm --filter @cowards/runtime-service test && pnpm --filter @cowards/spec test && cd apps/go-backend && go test ./...` [VERIFIED: apps/runtime-service/package.json; VERIFIED: packages/spec/package.json; VERIFIED: apps/go-backend/go.mod] |
| Full suite command | `pnpm boundary:monitors` plus targeted Go tests. [VERIFIED: package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| RT-01 | Broker-ready contract artifacts and metadata remain synchronized. | unit/monitor | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts` | yes; extend in Wave 0. [VERIFIED: scripts/check-boundary-monitors.test.ts] |
| RT-02 | JS/TS execution only through runtime service/runtime adapter boundary. | unit/monitor | `pnpm --filter @cowards/runtime-js test` and `pnpm boundary:monitors` | yes; extend monitor. [VERIFIED: packages/runtime-js/package.json; VERIFIED: scripts/check-boundary-monitors.ts] |
| RT-03 | Runtime service has no DB/job/API/public evidence ownership. | unit/monitor | `pnpm --filter @cowards/runtime-service test` | yes; extend `execute-match.test.ts`. [VERIFIED: apps/runtime-service/src/execute-match.test.ts] |
| RT-04 | Go/spec runtime contract versions and JSON shapes stay aligned. | Go unit + spec unit | `cd apps/go-backend && go test ./...`; `pnpm --filter @cowards/spec test` | yes; extend tests. [VERIFIED: apps/go-backend/runtime_service_client_test.go; VERIFIED: packages/spec/src/spec.test.ts] |
| RT-05 | Malformed, drifted, oversized, invalid, timeout, source mismatch, unsafe diagnostics fail closed. | unit/integration | `pnpm --filter @cowards/runtime-service test && cd apps/go-backend && go test ./...` | yes; extend tests. [VERIFIED: apps/runtime-service/src/execute-match.test.ts; VERIFIED: apps/go-backend/runtime_service_client_test.go] |
| RT-06 | Go/web/API do not execute Strategy source or use Node `vm`. | monitor | `pnpm boundary:monitors` | existing monitor file; add checks. [VERIFIED: scripts/check-boundary-monitors.ts; VERIFIED: AGENTS.md] |
| RT-07 | Runtime readiness labels remain explicit and non-promoted. | spec/runtime-js test + monitor | `pnpm --filter @cowards/spec test && pnpm boundary:monitors` | yes; extend where needed. [VERIFIED: packages/spec/src/spec.test.ts; VERIFIED: scripts/check-boundary-monitors.ts] |

### Sampling Rate

- **Per task commit:** Run the narrow package test for touched files, plus `pnpm exec vitest run scripts/check-boundary-monitors.test.ts` when monitors change. [VERIFIED: package.json]
- **Per wave merge:** Run `pnpm --filter @cowards/runtime-service test`, `pnpm --filter @cowards/runtime-js test`, `pnpm --filter @cowards/spec test`, and `cd apps/go-backend && go test ./...`. [VERIFIED: package.json; VERIFIED: apps/go-backend/go.mod]
- **Phase gate:** Run `pnpm boundary:monitors` after any generated artifact updates. [VERIFIED: package.json]

### Wave 0 Gaps

- [ ] Extend `apps/runtime-service/src/execute-match.test.ts` for source byte mismatch, full denylist diagnostics, server body cap, and stronger no DB/job/API ownership assertions. [VERIFIED: apps/runtime-service/src/execute-match.test.ts]
- [ ] Extend `apps/go-backend/runtime_service_client_test.go` for publicMessage/details denylist and no fallback classification when runtime service is stopped. [VERIFIED: apps/go-backend/runtime_service_client_test.go]
- [ ] Extend `scripts/check-boundary-monitors.test.ts` for runtime contract naming, no Node `vm`, no Go/web Strategy execution, runtime-service no DB/job/API imports, and version sync. [VERIFIED: scripts/check-boundary-monitors.test.ts]
- [ ] Add/update `.planning/artifacts/v1.16-runtime-service-boundary.*` and make stale checks part of monitor or artifact validation if generated. [VERIFIED: .planning/REQUIREMENTS.md]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no for runtime-service; yes for Go/web surrounding flows | Runtime service must not touch web session state; auth/session stays outside this phase. [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md] |
| V3 Session Management | no for runtime-service | Add monitor checks that runtime-service imports no session/web request state. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: apps/runtime-service/src/* scan] |
| V4 Access Control | yes at service boundary | Runtime-service authority is execute-only; Go owns orchestration and public/private projection. [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md; VERIFIED: packages/spec/src/runtime-execution-service.ts] |
| V5 Input Validation | yes | Use Zod request/response schemas and Go pre/post validation. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: apps/go-backend/runtime_service_client.go] |
| V6 Cryptography | yes for source identity only | Use SHA-256 source hash helpers already present; do not invent new hashing. [VERIFIED: packages/runtime-js/src/hash.ts; VERIFIED: apps/go-backend/runtime_service_client.go] |
| V8 Data Protection | yes | Redact source, memory, objective, owner, stack, stderr, token, DB DSN, host path, and private runtime internals. [VERIFIED: apps/runtime-service/src/redaction.ts; VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md] |

### Known Threat Patterns for Runtime Boundary

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| ABI/request drift | Tampering | Literal contract versions, Zod parse, Go strict decode, response validation. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: apps/go-backend/runtime_service_client.go] |
| Host capability escape in Strategy code | Elevation of Privilege | Forbidden source validation, runtime harness shadowing, adapter isolation labels, and no Node `vm` boundary. [VERIFIED: packages/runtime-js/src/validation.ts; VERIFIED: packages/runtime-js/src/worker-harness.ts; VERIFIED: AGENTS.md] |
| Private data leak in diagnostics | Information Disclosure | Central TS redaction plus Go failure sanitization and serialized denylist tests. [VERIFIED: apps/runtime-service/src/redaction.ts; VERIFIED: apps/go-backend/runtime_service_client.go] |
| Runtime service acting as backend fallback | Elevation of Privilege / Tampering | Monitor no DB/job/API ownership and no fallback on stopped runtime service. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: scripts/check-boundary-monitors.ts] |
| Oversized request/response payload | Denial of Service | HTTP body cap, Zod limits maximums, adapter output caps, Go response cap. [VERIFIED: apps/runtime-service/src/server.ts; VERIFIED: packages/spec/src/schemas.ts; VERIFIED: packages/runtime-js/src/subprocess-adapter.ts; VERIFIED: apps/go-backend/runtime_service_client.go] |

## Sources

### Primary (HIGH confidence)
- `AGENTS.md` - project non-negotiables and testing expectations. [VERIFIED: AGENTS.md]
- `.planning/REQUIREMENTS.md` - RT-01 through RT-07 and v1.16 non-goals. [VERIFIED: .planning/REQUIREMENTS.md]
- `.planning/ROADMAP.md` - Phase 104 scope and success criteria. [VERIFIED: .planning/ROADMAP.md]
- `.planning/STATE.md` - current v1.16 position and blockers. [VERIFIED: .planning/STATE.md]
- `.planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md` - locked Phase 104 decisions. [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md]
- `.planning/artifacts/v1.16-typescript-backend-inventory.json` - Phase 103 runtime surface role/capability baseline. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json]
- `packages/spec/src/runtime-execution-service.ts`, `runtime.ts`, and `schemas.ts` - contract, ABI, and schemas. [VERIFIED: packages/spec/src/runtime-execution-service.ts; VERIFIED: packages/spec/src/runtime.ts; VERIFIED: packages/spec/src/schemas.ts]
- `apps/runtime-service/src/*` - v1.16 runtime-service implementation and tests. [VERIFIED: apps/runtime-service/src/server.ts; VERIFIED: apps/runtime-service/src/execute-match.ts; VERIFIED: apps/runtime-service/src/redaction.ts; VERIFIED: apps/runtime-service/src/runtime-config.ts; VERIFIED: apps/runtime-service/src/execute-match.test.ts]
- `packages/runtime-js/src/*` - JS/TS runtime adapters, revision validation, hash, execution, and sandbox evidence. [VERIFIED: packages/runtime-js/src/revision.ts; VERIFIED: packages/runtime-js/src/validation.ts; VERIFIED: packages/runtime-js/src/executor.ts; VERIFIED: packages/runtime-js/src/abi-bridge.ts]
- `apps/go-backend/runtime_service_client.go` and test - Go invocation and validation boundary. [VERIFIED: apps/go-backend/runtime_service_client.go; VERIFIED: apps/go-backend/runtime_service_client_test.go]
- `scripts/check-boundary-monitors.ts` - current aggregate monitor architecture. [VERIFIED: scripts/check-boundary-monitors.ts]
- npm registry checks for `zod`, `vitest`, and `typescript` versions. [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)
- Node.js `node:vm` docs for official warning that `vm` is not a security mechanism. [CITED: https://nodejs.org/api/vm.html]
- Node.js `node:wasi` docs for official current WASI API status/behavior. [CITED: https://nodejs.org/api/wasi.html]
- Wasmtime docs for future fuel/resource-limiter notes. [CITED: https://docs.wasmtime.dev/examples-interrupting-wasm.html; CITED: https://docs.wasmtime.dev/api/wasmtime/trait.ResourceLimiter.html]

### Tertiary (LOW confidence)
- None. [VERIFIED: source audit]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified from package files, npm registry, Go module, and local tool probes. [VERIFIED: package.json; VERIFIED: npm registry; VERIFIED: apps/go-backend/go.mod; VERIFIED: local environment probe]
- Architecture: HIGH - derived from Phase 104 locked decisions and current runtime/Go contract files. [VERIFIED: .planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md; VERIFIED: apps/runtime-service/src/execute-match.ts; VERIFIED: apps/go-backend/runtime_service_client.go]
- Pitfalls: HIGH for repo-local boundary drift and privacy risks; MEDIUM for future WASM/WASI notes. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json; VERIFIED: packages/runtime-js/src/sandbox-evaluation.ts; CITED: https://nodejs.org/api/wasi.html]

**Research date:** 2026-05-24 [VERIFIED: system date]
**Valid until:** 2026-06-23 for repo-local guidance; re-check npm/tool and Node/WASI docs before implementing future runtime promotion work. [VERIFIED: current date; VERIFIED: npm registry]
