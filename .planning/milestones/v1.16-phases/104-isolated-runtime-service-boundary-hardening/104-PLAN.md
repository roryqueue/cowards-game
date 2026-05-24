---
phase: 104-isolated-runtime-service-boundary-hardening
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/spec/src/runtime-execution-service.ts
  - packages/spec/src/runtime.ts
  - packages/spec/src/index.ts
  - packages/spec/src/spec.test.ts
  - .planning/artifacts/v1.16-runtime-service-boundary.json
  - .planning/artifacts/v1.16-runtime-service-boundary.md
  - apps/runtime-service/src/execute-match.test.ts
  - apps/runtime-service/src/server.ts
  - apps/runtime-service/src/server.test.ts
  - apps/runtime-service/src/redaction.test.ts
  - apps/go-backend/runtime_service_client.go
  - apps/go-backend/runtime_service_client_test.go
  - scripts/check-boundary-monitors.ts
  - scripts/check-boundary-monitors.test.ts
  - .planning/phases/104-isolated-runtime-service-boundary-hardening/104-VALIDATION.md
autonomous: true
requirements: [RT-01, RT-02, RT-03, RT-04, RT-05, RT-06, RT-07]
must_haves:
  truths:
    - "Developer can inspect a broker-ready Strategy Execution Service / Runtime Broker contract while today's implementation is labeled isolated JS/TS runtime service."
    - "Developer can run tests proving runtime service requests, responses, limits, crashes, invalid output, source mismatches, and diagnostics fail closed or stay schema-valid."
    - "Developer can verify runtime service and runtime-js do not gain DB, job, Match completion, Chronicle persistence, scoring, product API, web session, public evidence, or fallback authority."
    - "Developer can verify Go invokes runtime execution only through runtime-execution-service-v1.15 and strategy-runtime-abi-v1.14 with no Strategy source execution in Go or web/API."
    - "Developer can verify worker-thread, subprocess, container-subprocess, non-JS, WASM/WASI, and component-model notes remain explicit readiness labels, not production sandbox or counted-play promotion."
  artifacts:
    - path: ".planning/artifacts/v1.16-runtime-service-boundary.json"
      provides: "machine-readable Strategy Execution Service / Runtime Broker boundary, authority matrix, schema/ABI versions, artifact policy, redaction, no-fallback, and non-promotion notes"
      contains: "strategyExecutionService"
    - path: ".planning/artifacts/v1.16-runtime-service-boundary.md"
      provides: "human-readable runtime boundary contract for Phase 104 review"
      contains: "Strategy Execution Service / Runtime Broker"
    - path: "packages/spec/src/runtime-execution-service.ts"
      provides: "public runtime execution service contract metadata and envelope types"
      exports: ["RUNTIME_EXECUTION_SERVICE_VERSION"]
    - path: "apps/runtime-service/src/execute-match.test.ts"
      provides: "runtime service fail-closed and schema/redaction coverage"
      contains: "SOURCE_HASH_MISMATCH"
    - path: "apps/go-backend/runtime_service_client_test.go"
      provides: "Go client contract and no-fallback failure coverage"
      contains: "RuntimeService"
    - path: "scripts/check-boundary-monitors.ts"
      provides: "Phase 104 runtime ownership, no Strategy execution, no Node vm/WASI promotion, privacy, and contract drift monitors"
      contains: "v1.16-runtime-service-boundary"
  key_links:
    - from: "packages/spec/src/runtime-execution-service.ts"
      to: "apps/runtime-service/src/execute-match.ts"
      via: "RuntimeExecutionServiceRequestSchema and RuntimeExecutionServiceResponseSchema"
      pattern: "RuntimeExecutionService(Request|Response)Schema"
    - from: "apps/go-backend/runtime_service_client.go"
      to: "apps/runtime-service/src/server.ts"
      via: "HTTP+JSON POST /execute-match using runtime-execution-service-v1.15"
      pattern: "execute-match"
    - from: ".planning/artifacts/v1.16-typescript-backend-inventory.json"
      to: "scripts/check-boundary-monitors.ts"
      via: "Phase 103 role and policy manifest consumed by Phase 104 checks"
      pattern: "v1.16-typescript-backend-inventory"
    - from: "packages/spec/src/runtime.ts"
      to: "scripts/check-boundary-monitors.ts"
      via: "adapter readiness and non-JS guardrail metadata"
      pattern: "STRATEGY_RUNTIME_ABI_VERSION"
---

<objective>
Create the executable Phase 104 implementation prompt for hardening the isolated runtime service boundary.

Purpose: make JS/TS Strategy execution remain supported only through a broker-ready, schema-validated Strategy Execution Service / Runtime Broker contract while preserving Go ownership of orchestration, persistence, scoring, and public evidence.

Output: contract artifacts/docs, runtime service tests, Go client contract tests, monitor checks, and Phase 104 validation notes proving the current HTTP+JSON isolated JS/TS runtime service is DB/job/API-free and not a backend.
</objective>

<execution_context>
@/Users/roryquinlan/.codex/get-shit-done/workflows/execute-plan.md
@/Users/roryquinlan/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/SUMMARY.md
@.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md
@.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-SUMMARY.md
@.planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md
@.planning/phases/104-isolated-runtime-service-boundary-hardening/104-RESEARCH.md
@.planning/artifacts/v1.16-typescript-backend-inventory.json
@packages/spec/src/runtime-execution-service.ts
@packages/spec/src/runtime.ts
@packages/spec/src/schemas.ts
@apps/runtime-service/src/server.ts
@apps/runtime-service/src/execute-match.ts
@apps/runtime-service/src/redaction.ts
@apps/go-backend/runtime_service_client.go
@scripts/check-boundary-monitors.ts

<interfaces>
From `packages/spec/src/runtime-execution-service.ts`:
```typescript
export const RUNTIME_EXECUTION_SERVICE_VERSION =
  "runtime-execution-service-v1.15" as const

export interface RuntimeExecutionServiceRequest {
  contractVersion: typeof RUNTIME_EXECUTION_SERVICE_VERSION
  kind: "executeMatch"
  requestId: string
  match: RuntimeExecutionMatchInput
  strategies: { bottom: StrategyRevision; top: StrategyRevision }
  limits: StrategyRuntimeLimits
}

export interface RuntimeExecutionServiceSuccessResponse {
  contractVersion: typeof RUNTIME_EXECUTION_SERVICE_VERSION
  ok: true
  kind: "executionResult"
  requestId: string
  matchId: MatchId
  runtimeAbiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION
  result: { privacy: "internal_runtime_result"; chronicle: Chronicle; finalState: RuntimeExecutionFinalState; runtimeViolationEventCount: number }
}

export interface RuntimeExecutionServiceSystemFailureResponse {
  contractVersion: typeof RUNTIME_EXECUTION_SERVICE_VERSION
  ok: false
  kind: "systemFailure"
  requestId: string
  matchId?: MatchId | undefined
  runtimeAbiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION
  systemFailure: { code: RuntimeExecutionServiceSystemFailureCode; message: string; publicMessage: string; retryable: boolean; diagnostics?: JsonValue | undefined }
}
```

From `apps/go-backend/runtime_service_client.go`:
```go
const runtimeExecutionServiceVersion = "runtime-execution-service-v1.15"
const strategyRuntimeABIVersion = "strategy-runtime-abi-v1.14"

func (client *runtimeServiceClient) executeMatch(ctx context.Context, request runtimeServiceRequest) (*runtimeServiceResponse, *runtimeServiceFailure)
func validateRuntimeServiceRequest(request runtimeServiceRequest) *runtimeServiceFailure
func validateRuntimeServiceResponse(request runtimeServiceRequest, response *runtimeServiceResponse) *runtimeServiceFailure
```

From `apps/runtime-service/src/server.ts`:
```typescript
export const createRuntimeExecutionHttpHandler = (options: RuntimeExecutionHttpServerOptions = {}) => { ... }
export const createRuntimeExecutionHttpServer = (options: RuntimeExecutionHttpServerOptions = {}) =>
  createServer(createRuntimeExecutionHttpHandler(options))
```
</interfaces>
</context>

<source_coverage_audit>
## Multi-Source Coverage Audit

| Source | Item | Coverage |
| --- | --- | --- |
| GOAL | Phase 104 goal: runtime service is a narrow hostile-code execution service invoked by Go through broker-ready contract and not a backend. | Tasks 1, 2, and 3. |
| REQ | RT-01 broker-ready transport, ABI, schemas, package policy, limits, timeouts, diagnostics, logs, crash, privacy, no-fallback. | Task 1 creates artifacts/docs; Task 2 and Task 3 enforce tests/monitors. |
| REQ | RT-02 JS/TS Strategy execution only inside isolated runtime service or runtime adapter boundary. | Task 2 runtime-service tests; Task 3 monitor scans. |
| REQ | RT-03 runtime service has no job, Match completion, Chronicle persistence, scoring, product API, request state, or fallback ownership. | Task 2 DB/job/API-free tests; Task 3 monitor checks. |
| REQ | RT-04 Go invokes only runtime-execution-service-v1.15 and strategy-runtime-abi-v1.14 or documented compatible successor. | Task 1 contract metadata; Task 3 Go tests and monitor sync. |
| REQ | RT-05 schemas reject drift/malformed/source mismatch/oversized/timeout/invalid output/unsafe diagnostics/private leaks, and submission artifact checks are documented. | Task 1 artifact policy; Task 2 runtime tests; Task 3 Go redaction tests. |
| REQ | RT-06 Go and web/API do not import, evaluate, transpile, or execute Strategy source and do not use Node vm as a hostile-code boundary. | Task 3 monitor scans and tests. |
| REQ | RT-07 readiness labels do not silently promote production sandbox or counted non-JS play. | Task 1 non-promotion notes; Task 3 monitor checks. |
| RESEARCH | Contract in spec first, HTTP binding second; use existing Zod schemas; no new dependency. | Tasks 1 and 2. |
| RESEARCH | Runtime-only authority tests close import/dependency drift. | Tasks 2 and 3. |
| RESEARCH | Redaction tests must cover full serialized failure objects. | Tasks 2 and 3. |
| RESEARCH | WASM/WASI/component-model remains long-term candidate, Node node:wasi not sandbox. | Task 1 and Task 3. |
| CONTEXT | D-01, D-02: Strategy Execution Service / Runtime Broker naming and isolated JS/TS implementation label. | Task 1 and Task 2. |
| CONTEXT | D-03, D-04, D-05, D-06: HTTP+JSON implementation, transport-neutral contract, shared JSON/runtime ABI, and no language-specific shortcuts. | Task 1 and Task 3. |
| CONTEXT | D-07, D-08, D-09: validate/compile/hash/package where practical, execute immutable artifacts/revisions, and no Go/web/API source import/evaluation/transpile/execution. | Task 1 and Task 3. |
| CONTEXT | D-10, D-11, D-12: runtime service returns internal runtime results only, has no backend authority, and preserves replay/privacy projection boundaries. | Task 2 and Task 3. |
| CONTEXT | D-13, D-14, D-15: readiness labels remain explicit; WASM/WASI/component-model not promoted; Node node:wasi rejected as untrusted Strategy sandbox. | Task 1 and Task 3. |
| CONTEXT | D-16, D-17, D-18: fail closed, redacted schema-validated failures, and no retired TypeScript backend fallback. | Task 2 and Task 3. |
| CONTEXT | Deferred: build actual Runtime Broker, replace JS/TS runtime, counted non-JS, WASM/WASI promotion, sandbox replacement. | No task implements these deferred ideas; tasks only document and enforce non-promotion/no-fallback boundaries. |

No unplanned source items remain for Phase 104.
</source_coverage_audit>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Publish broker-ready runtime boundary contract artifacts</name>
  <files>packages/spec/src/runtime-execution-service.ts, packages/spec/src/runtime.ts, packages/spec/src/index.ts, packages/spec/src/spec.test.ts, .planning/artifacts/v1.16-runtime-service-boundary.json, .planning/artifacts/v1.16-runtime-service-boundary.md</files>
  <behavior>
    - Test 1: spec exports identify the future-facing abstraction as "Strategy Execution Service / Runtime Broker" while labeling the current implementation as "isolated JS/TS runtime service", per D-01 and D-02.
    - Test 2: contract metadata keeps `runtime-execution-service-v1.15`, `strategy-runtime-abi-v1.14`, HTTP+JSON as the current transport binding, and transport-neutral replacement wording, per D-03 through D-06.
    - Test 3: artifact JSON and markdown include source package policy, immutable Match artifact execution, no Go/web/API source import/evaluation, runtime authority limits, privacy/redaction denylist, no-fallback behavior, readiness labels, WASM/WASI/component-model non-promotion, and Node `node:wasi` rejection, per D-07 through D-18.
  </behavior>
  <action>Add contract metadata exports in `packages/spec/src/runtime-execution-service.ts` for the Strategy Execution Service / Runtime Broker public boundary, current implementation label, current transport binding, authority matrix, public/privacy semantics, and compatible runtime ABI policy. Preserve the literal `RUNTIME_EXECUTION_SERVICE_VERSION` unless a test proves a compatible successor is already present. Update `packages/spec/src/runtime.ts` only for readiness/policy wording or exported constants needed by the artifact; do not promote WASM/WASI/component-model, non-JS counted play, or Node `node:wasi`. Update `packages/spec/src/index.ts` if new exports are added. Add tests in `packages/spec/src/spec.test.ts` that parse the artifact JSON, assert exact decision coverage for D-01 through D-18, assert no deferred idea is marked promoted, and assert public artifacts do not contain private source/memory/objective/owner/session/host/database/runtime internals. Create `.planning/artifacts/v1.16-runtime-service-boundary.json` as the monitor-readable artifact and `.planning/artifacts/v1.16-runtime-service-boundary.md` as the review artifact. The artifacts must state that v1.16 keeps HTTP+JSON implementation but defines a transport-neutral JSON/runtime ABI contract that a future broker can front without changing Go orchestration, persistence, scoring, or public evidence ownership.</action>
  <verify>
    <automated>pnpm exec vitest run packages/spec/src/spec.test.ts</automated>
    <automated>pnpm --filter @cowards/spec contract:check</automated>
    <automated>node -e "const fs=require('node:fs'); const j=JSON.parse(fs.readFileSync('.planning/artifacts/v1.16-runtime-service-boundary.json','utf8')); for (const key of ['strategyExecutionService','currentImplementation','transport','runtimeAbi','authority','submissionArtifactPolicy','failurePrivacy','noFallback','nonPromotion']) if (!(key in j)) throw new Error('missing '+key);"</automated>
  </verify>
  <done>Spec exports, JSON artifact, and markdown artifact make the broker-ready contract inspectable; the current implementation is labeled isolated JS/TS runtime service; all D-01 through D-18 decisions are represented; no deferred idea is promoted.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Harden runtime-service schema, redaction, authority, and HTTP boundary tests</name>
  <files>apps/runtime-service/src/execute-match.test.ts, apps/runtime-service/src/server.ts, apps/runtime-service/src/server.test.ts, apps/runtime-service/src/redaction.test.ts</files>
  <behavior>
    - Test 1: malformed request, ABI drift, source hash mismatch, source byte mismatch, oversized request body/limits, invalid Strategy output, injected execution exception, timeout/runtime violation, and response schema invalid paths return schema-valid failure or internal runtime result with no private leak, per D-16 and D-17.
    - Test 2: complete serialized failure responses do not contain Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, DB DSNs, host paths, or private runtime internals, per D-12 and D-17.
    - Test 3: `apps/runtime-service` exposes only `/health` and `/execute-match`, health labels service as current HTTP+JSON isolated runtime implementation, and production runtime-service files/dependencies remain DB/job/API/session/scoring/public-evidence-free, per D-02, D-03, D-10, and D-11.
  </behavior>
  <action>Extend runtime service tests around `executeRuntimeServiceRequest`, `createRuntimeExecutionHttpHandler`, and `redaction.ts`. Add `apps/runtime-service/src/server.test.ts` if absent to test health metadata, method/path allowlist, JSON parse failures, request body limit failure, schema-valid error envelopes, and no product API route behavior. Add `apps/runtime-service/src/redaction.test.ts` to table-test messages and diagnostics containing every D-17 forbidden marker, asserting against `JSON.stringify(response)` where possible. Keep runtime violations caused by Strategy behavior as successful Match execution outcomes when the engine can Chronicle them; classify service crashes, malformed envelopes, and schema failures as system failures. Add a production-file authority scan test in runtime-service tests that reads `apps/runtime-service/src` and `apps/runtime-service/package.json` and rejects imports/dependencies or strings for persistence, jobs, Match completion, Chronicle persistence, MatchSet scoring, public/product API routes, `@cowards/service`, sessions, DB clients, and fallback ownership. Do not add product routes, job claiming, persistence, scoring, or public evidence behavior to runtime-service.</action>
  <verify>
    <automated>pnpm exec vitest run apps/runtime-service/src/execute-match.test.ts apps/runtime-service/src/server.test.ts apps/runtime-service/src/redaction.test.ts</automated>
    <automated>pnpm --filter @cowards/runtime-service typecheck</automated>
  </verify>
  <done>Runtime service tests prove schema validation, fail-closed behavior, redaction, HTTP route narrowness, and DB/job/API-free authority for the isolated JS/TS runtime service.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Enforce Go client, monitor, no-fallback, no-execution, and validation gates</name>
  <files>apps/go-backend/runtime_service_client.go, apps/go-backend/runtime_service_client_test.go, scripts/check-boundary-monitors.ts, scripts/check-boundary-monitors.test.ts, .planning/phases/104-isolated-runtime-service-boundary-hardening/104-VALIDATION.md</files>
  <behavior>
    - Test 1: Go client rejects local source mismatch, source byte mismatch, contract mismatch, malformed response, oversized response, timeout, stopped service, response ABI drift, and unsafe service failures without falling back to retired TypeScript backend paths, per D-04, D-05, D-16, and D-18.
    - Test 2: monitor checks consume `.planning/artifacts/v1.16-runtime-service-boundary.json` plus Phase 103 inventory and fail on runtime-service backend authority, Go/web/API Strategy execution imports, Node `vm` security-boundary use, Node `node:wasi` sandbox promotion, public artifact leaks, ABI drift, or readiness label promotion, per D-01 through D-18.
    - Test 3: validation notes map RT-01 through RT-07 to commands and evidence, and state expected `104-SUMMARY.md` contents for execute-phase completion.
  </behavior>
  <action>Keep `apps/go-backend/runtime_service_client.go` aligned with `runtime-execution-service-v1.15` and `strategy-runtime-abi-v1.14`; if code changes are needed, preserve local pre-transport validation, response byte cap, strict JSON decoding, response drift checks, sanitized service failure mapping, and no-fallback behavior. Extend `apps/go-backend/runtime_service_client_test.go` for source byte mismatch, unsafe nested diagnostics denylist coverage, runtime ABI mismatch, empty endpoint/stopped service classification, and absence of any fallback request path. Update `scripts/check-boundary-monitors.ts` to validate `.planning/artifacts/v1.16-runtime-service-boundary.json`, Phase 103 inventory runtime rows, runtime-service production import/dependency authority, Go/spec version sync, no Strategy execution imports in Go/web/API, no Node `vm` security boundary, no Node `node:wasi` sandbox promotion, public artifact privacy, and adapter/non-JS readiness labels. Add focused tests in `scripts/check-boundary-monitors.test.ts` for each new failure mode. Write `.planning/phases/104-isolated-runtime-service-boundary-hardening/104-VALIDATION.md` with commands run, RT-01 through RT-07 evidence mapping, artifact paths, any services needed for full `pnpm boundary:monitors`, and expected completion-summary fields. The execute-phase summary must include files changed, commands run, requirements completed, decisions D-01 through D-18 coverage, no deferred promotions, and residual risks if full live topology was not run.</action>
  <verify>
    <automated>cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'RuntimeServiceClient'</automated>
    <automated>pnpm exec vitest run scripts/check-boundary-monitors.test.ts</automated>
    <automated>pnpm typescript-backend:inventory:check</automated>
    <automated>pnpm boundary:monitors</automated>
  </verify>
  <done>Go client contract tests and boundary monitors prove runtime invocation remains through the public ABI, runtime failures do not fall back to retired TypeScript backend behavior, Go/web/API do not execute Strategy source, and validation notes are ready for Phase 104 verification.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
| --- | --- |
| Go backend -> Strategy Execution Service HTTP binding | Go sends immutable Strategy Revision artifacts/source packages to isolated JS/TS runtime service over HTTP+JSON. |
| Runtime service -> runtime-js adapter | Hostile Strategy source crosses into execution adapter behind the runtime ABI. |
| Runtime service -> Go response | Runtime service returns internal runtime results or redacted system failures for Go-owned orchestration. |
| Artifacts/monitors -> developer/public diagnostics | Planning and monitor artifacts must be reviewable without leaking private Strategy, owner, host, DB, session, or runtime internals. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
| --- | --- | --- | --- | --- |
| T-104-01 | Spoofing | runtime service request/response contract | mitigate | Validate `contractVersion`, `kind`, `requestId`, `matchId`, Strategy Revision ids, and `runtimeAbiVersion` in TS schemas and Go client tests. |
| T-104-02 | Tampering | Strategy source package identity | mitigate | Validate source hash and byte count before transport in Go and at runtime service entry; fail closed on mismatch. |
| T-104-03 | Repudiation | runtime failure classification | mitigate | Record stable failure codes, retryable flags, and redacted diagnostics in schema-valid envelopes and Phase 104 validation notes. |
| T-104-04 | Information Disclosure | runtime diagnostics, artifacts, and public outputs | mitigate | Denylist full serialized failure objects and artifacts for source, memory, objectives, owner debug, Awareness Grid, stack, stderr, sessions, tokens, DB DSNs, host paths, and private runtime internals. |
| T-104-05 | Denial of Service | oversized requests/responses and timeouts | mitigate | Keep body/response byte caps, runtime limits, timeout handling, and tests for oversized payloads and timeout classification. |
| T-104-06 | Elevation of Privilege | runtime service gaining backend authority | mitigate | Add tests and monitors rejecting persistence, jobs, Match completion, Chronicle persistence, MatchSet scoring, product API routes, session state, public evidence, and fallback imports/dependencies. |
| T-104-07 | Elevation of Privilege | Go/web/API executing Strategy source or Node vm/WASI sandbox misuse | mitigate | Monitor Go/web/API imports and source strings for runtime execution, transpile/eval, Node `vm`, and Node `node:wasi` promotion markers. |
</threat_model>

<verification>
Run focused gates first:

```bash
pnpm exec vitest run packages/spec/src/spec.test.ts
pnpm exec vitest run apps/runtime-service/src/execute-match.test.ts apps/runtime-service/src/server.test.ts apps/runtime-service/src/redaction.test.ts
cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'RuntimeServiceClient'
pnpm exec vitest run scripts/check-boundary-monitors.test.ts
pnpm typescript-backend:inventory:check
```

Run full boundary evidence after local services are available:

```bash
pnpm boundary:monitors
```

If `pnpm boundary:monitors` fails because web, Go, runtime-service, or local Postgres/Redis are not running, document that in `104-VALIDATION.md` and include the exact service startup commands needed before rerun. Do not mark RT-01 through RT-07 complete until the focused gates pass and the full boundary monitor result is either passing or explicitly blocked by missing local service prerequisites.
</verification>

<success_criteria>
- `RT-01` through `RT-07` are mapped to passing commands and artifacts in `104-VALIDATION.md`.
- `.planning/artifacts/v1.16-runtime-service-boundary.json` and `.md` are present, public-safe, and name Strategy Execution Service / Runtime Broker without calling today's TypeScript runtime service the backend or final broker.
- Runtime service tests cover malformed input, ABI drift, timeout/runtime violation, invalid output, oversized body/limits, source hash/byte mismatch, response schema invalid, execution exception, and redacted diagnostics.
- Go runtime service client tests prove version sync, local validation, response validation, byte caps, failure sanitization, stopped service/timeout classification, and no fallback.
- `scripts/check-boundary-monitors.ts` fails on runtime-service authority creep, Go/web/API Strategy execution, Node `vm`, Node `node:wasi` sandbox promotion, public artifact leaks, ABI drift, and readiness promotion drift.
- Worker-thread, subprocess, container-subprocess, non-JS, WASM/WASI, and component-model statuses remain explicit readiness/evaluation labels without v1.16 production sandbox or counted non-JS promotion.
</success_criteria>

<output>
After completion, create `.planning/phases/104-isolated-runtime-service-boundary-hardening/104-SUMMARY.md` with:

- requirements completed: RT-01, RT-02, RT-03, RT-04, RT-05, RT-06, RT-07
- decisions covered: D-01 through D-18
- artifacts created and files modified
- validation commands and results
- no deferred ideas promoted
- any residual risk or local service prerequisite for full `pnpm boundary:monitors`
</output>
