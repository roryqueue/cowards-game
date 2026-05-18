# Phase 10: Runtime Isolation Hardening - Research

**Researched:** 2026-05-18 [VERIFIED: environment current_date]
**Domain:** Node.js untrusted Strategy execution boundary, subprocess IPC, runtime failure taxonomy [VERIFIED: .planning/phases/10-runtime-isolation-hardening/10-CONTEXT.md]
**Confidence:** HIGH for worker/subprocess architecture and tests; MEDIUM for production container/WASM direction because Phase 10 keeps that as spike/deferred direction [VERIFIED: local code + Node docs]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

## Implementation Decisions

### Implementation Ambition
- **D-01:** Plan for a real `StrategyExecutionAdapter` boundary and attempt a subprocess adapter implementation.
- **D-02:** If platform friction is high, a documented spike is acceptable only if it leaves adapter contract tests and a clear path toward container/WASM isolation.

### Default Runtime Behavior
- **D-03:** Keep the current worker-thread adapter as the default runtime behavior for now so the v1.0 author -> execute -> replay loop stays stable.
- **D-04:** Add configurability and visibility for which runtime adapter is active, but do not make a stronger adapter default until it is proven.

### Subprocess Contract
- **D-05:** Subprocess execution should use no shell.
- **D-06:** IPC should be one-shot JSON or JSON-lines, with schema-valid input and schema-validated output.
- **D-07:** Subprocess execution should use minimal environment, no inherited app secrets, stdout/stderr byte caps, timeout kill behavior, and no unnecessary inherited host capabilities.

### Failure Taxonomy
- **D-08:** Make runtime/system failures more granular than the v1.0 prototype.
- **D-09:** Distinguish timeout, forbidden capability, invalid output, oversized output, malformed IPC, subprocess nonzero exit, signal termination, and system failure.
- **D-10:** Only player-caused violations should map into gameplay/runtime violation semantics; infrastructure failures remain system failures.

### Hostile Test Posture
- **D-11:** Prefer a hostile test matrix over isolated examples.
- **D-12:** Tests should cover forbidden globals, dynamic import, worker/process access, filesystem/network attempts, infinite loop, memory pressure, oversized output, invalid output, thrown exceptions, and malformed subprocess responses.

### the agent's Discretion
- The planner may choose the exact adapter interface names, config surface, subprocess harness format, and test fixture organization as long as the decisions above are preserved.

### Deferred Ideas (OUT OF SCOPE)
- Making subprocess/container/WASM the default production runtime is deferred until the stronger adapter is proven.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ISO-01 | Developer can identify which Strategy execution adapter is active and what isolation boundary it provides. | Add runtime adapter metadata/config in `packages/runtime-js` and worker logs/status surfaces. [VERIFIED: .planning/REQUIREMENTS.md + packages/runtime-js/src/worker.ts] |
| ISO-02 | Runtime execution keeps Strategy source out of web/API processes and runs only through worker/runtime execution boundaries. | Preserve default safe `@cowards/runtime-js` entrypoint and executable `@cowards/runtime-js/worker` split; audit web imports. [VERIFIED: packages/runtime-js/README.md + rg @cowards/runtime-js] |
| ISO-03 | Runtime code exposes a replaceable execution adapter boundary that can support worker-thread, subprocess, container, or WASM/WASI execution without changing engine rules. | Introduce `StrategyExecutionAdapter` behind existing `StrategyRuntime`; keep engine interface unchanged. [VERIFIED: packages/engine/src/types.ts + CowardsGameSpec_Full_Consolidated_v1.md] |
| ISO-04 | Developer can run a subprocess/container/WASM/WASI spike or implementation that accepts only schema-valid JSON input and returns only schema-validated JSON output. | Prefer subprocess implementation now; keep container/WASM as documented next boundary. [VERIFIED: 10-CONTEXT.md + Node child_process docs] |
| ISO-05 | Runtime execution enforces wall-clock timeout, output byte caps, memory/resource bounds where available, empty or minimal environment, and no inherited host capabilities. | Worker adapter already uses timeout, empty env, execArgv clearing, V8 `resourceLimits`; subprocess adapter must add stdio caps, timeout kill, minimal env, and no shell. [VERIFIED: packages/runtime-js/src/worker-bridge.ts + Node docs] |
| ISO-06 | Hostile Strategy tests cover forbidden globals, dynamic import attempts, worker/process access, filesystem/network attempts, infinite loops, memory pressure, oversized output, invalid output, and thrown exceptions. | Existing tests cover validation, timeout, invalid/oversized output, thrown exception, some forbidden globals; expand to full matrix and adapter contract tests. [VERIFIED: packages/runtime-js/src/*.test.ts] |
| ISO-07 | Worker and runtime tests distinguish strategy violations from system failures, including timeout, malformed IPC, subprocess exit, signal termination, and validation failure. | Existing worker treats Chronicle `RUNTIME_VIOLATION` as completed and unexpected orchestration exceptions as retryable system failures; add explicit subprocess failure classes. [VERIFIED: apps/worker/src/runner.test.ts] |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- Keep the engine pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Do not put game rules in React components. [VERIFIED: AGENTS.md]
- Do not execute user Strategy code in the web/API process. [VERIFIED: AGENTS.md]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. [VERIFIED: AGENTS.md]
- Do not use Node `vm` as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Treat Strategy code as hostile and validate every runtime boundary with schemas. [VERIFIED: AGENTS.md]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: AGENTS.md]
- Runtime tests must cover invalid outputs, timeout behavior, forbidden capabilities, memory/source limits, and schema validation. [VERIFIED: AGENTS.md]
- Worker tests must distinguish strategy failure from system failure. [VERIFIED: AGENTS.md]

## Summary

Phase 10 should keep the existing worker-thread runtime green while making the execution adapter explicit, configurable, and observable. [VERIFIED: 10-CONTEXT.md] The current runtime already keeps executable APIs out of the safe package entrypoint: `@cowards/runtime-js` exports validation/build helpers, while `@cowards/runtime-js/worker` exports `createRuntimeFromRevision`. [VERIFIED: packages/runtime-js/README.md + packages/runtime-js/src/worker.ts] The gap is that `createRuntimeFromRevision` hardwires the worker-thread bridge instead of delegating to a replaceable adapter contract. [VERIFIED: packages/runtime-js/src/executor.ts]

The worker-thread adapter is useful compatibility containment, but it is not a final hostile-code sandbox. [VERIFIED: Node worker_threads docs + packages/runtime-js/README.md] Node worker threads can share memory with the parent through transferable/shared buffers, and worker `resourceLimits` affect only the JS engine and not all external allocations or global process OOM behavior. [CITED: https://nodejs.org/api/worker_threads.html] Node `vm` is explicitly unsuitable for untrusted code, and Node Permission Model is defense-in-depth only because Node docs state it does not protect against malicious code. [CITED: https://nodejs.org/api/vm.html] [CITED: https://nodejs.org/api/permissions.html]

**Primary recommendation:** Add a `StrategyExecutionAdapter` contract with `worker-thread` as the default adapter, implement a subprocess adapter behind opt-in config if feasible, and make both adapters share schema-validated input/output, timeout, output cap, and failure taxonomy contract tests. [VERIFIED: 10-CONTEXT.md + local code + Node child_process docs]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Adapter selection and visibility | Worker process / runtime package | API only for non-executing metadata display | Strategy execution already belongs in `apps/worker` and `@cowards/runtime-js/worker`; web/API must not execute Strategy source. [VERIFIED: AGENTS.md + apps/worker/src/runner.ts] |
| Worker-thread adapter | Runtime package | Worker process orchestration | `packages/runtime-js/src/worker-bridge.ts` owns current worker-thread execution and returns `RuntimeResult<unknown>`. [VERIFIED: packages/runtime-js/src/worker-bridge.ts] |
| Subprocess adapter | Runtime package | Worker process orchestration | Subprocess spawning should live behind runtime-js adapter code; `apps/worker` should select/configure it without changing engine rules. [VERIFIED: 10-CONTEXT.md + packages/engine/src/types.ts] |
| Engine violation effects | Engine package | Replay package for Chronicle projection | Engine owns activation interruption, stoning, and `RUNTIME_VIOLATION` event emission from `RuntimeResult` failures. [VERIFIED: packages/engine/src/activation.ts] |
| System failure retries | Worker process / persistence | Runtime adapter for failure classification | Worker currently records orchestration exceptions as retryable attempt failures and completes matches with gameplay runtime violations. [VERIFIED: apps/worker/src/runner.ts + apps/worker/src/runner.test.ts] |
| Hostile runtime tests | Runtime package | Worker package for strategy-vs-system propagation | Most hostile cases exercise `packages/runtime-js`; worker tests verify classification at job level. [VERIFIED: packages/runtime-js/src/executor.test.ts + apps/worker/src/runner.test.ts] |

## Standard Stack

### Core

| Library / API | Version | Purpose | Why Standard |
|---------------|---------|---------|--------------|
| Node.js | Local `v24.15.0`; official current docs checked at `v26.1.0` | Runtime host for worker and subprocess execution | Existing repo uses Node APIs and local runtime is installed. [VERIFIED: `node --version` + Node docs] |
| `node:worker_threads` | Built-in | Default compatibility adapter | Existing implementation uses `Worker`, `MessageChannel`, timeout signaling, empty env, `execArgv: []`, and `resourceLimits`. [VERIFIED: packages/runtime-js/src/worker-bridge.ts] |
| `node:child_process` `spawn` or `execFile` | Built-in | Opt-in subprocess adapter | Official docs show `spawn` and `execFile` create subprocesses without shell by default, and options expose `env`, `stdio`, `timeout`, `killSignal`, and output controls. [CITED: https://nodejs.org/api/child_process.html] |
| Zod | `4.4.3`; npm modified 2026-05-04 | Runtime input/output schemas via `@cowards/spec` | Existing spec package uses Zod schemas for Strategy inputs/results and runtime violation types. [VERIFIED: packages/spec/package.json + npm registry + packages/spec/src/schemas.ts] |
| TypeScript | `6.0.3`; npm modified 2026-04-16 | Monorepo language and transpile-only Strategy source support | Current repo uses TypeScript workspaces and runtime-js depends on TypeScript. [VERIFIED: package.json + packages/runtime-js/package.json + npm registry] |

### Supporting

| Library / API | Version | Purpose | When to Use |
|---------------|---------|---------|-------------|
| Vitest | `4.1.6`; npm modified 2026-05-11 | Unit and adapter contract tests | Use for runtime hostile matrix, subprocess harness unit tests, and worker failure taxonomy tests. [VERIFIED: package.json + npm registry + rg test files] |
| Docker Engine | Local `29.4.3`; docs checked | Future container isolation direction and local availability | Use only for documented path or optional spike, not as required default in Phase 10. [VERIFIED: `docker --version` + Docker docs] |
| Node Permission Model | Stable in current Node docs | Defense-in-depth for subprocess child process | Use only inside a separate process with minimal grants; do not present it as a malicious-code sandbox. [CITED: https://nodejs.org/api/permissions.html] |
| Node WASI | Experimental in current Node docs | Future WASM/WASI direction research | Do not rely on Node's `node:wasi` as secure sandboxing for untrusted code. [CITED: https://nodejs.org/api/wasi.html] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Worker-thread default | Subprocess default | Subprocess is a stronger isolation direction but should remain opt-in until contract tests and stability are proven. [VERIFIED: 10-CONTEXT.md] |
| Subprocess adapter | Container adapter | Containers add OS/cgroup controls but require image/build/runtime orchestration beyond current runtime-js package scope. [VERIFIED: Docker resource constraints docs + .planning/ROADMAP.md] |
| Subprocess adapter | WASM/WASI adapter | Node's own WASI docs warn not to rely on Node WASI for untrusted-code sandboxing; a secure WASI runtime may be later work. [CITED: https://nodejs.org/api/wasi.html] |
| Adapter contract | Node `vm` | Node docs explicitly say `node:vm` is not a security mechanism for untrusted code. [CITED: https://nodejs.org/api/vm.html] |

**Installation:**
```bash
# No new production dependency is required for the recommended Phase 10 adapter boundary and subprocess spike.
pnpm install
```
[VERIFIED: package.json + Node built-in docs]

**Version verification:**
```bash
npm view typescript version time.modified
npm view vitest version time.modified
npm view zod version time.modified
npm view @types/node version time.modified
npm view pg version time.modified
npm view tsx version time.modified
```
[VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```txt
Worker job claim
  -> load immutable bottom/top Strategy Revisions
  -> select runtime adapter from explicit config
      -> worker-thread adapter (default)
          -> Worker(data: source, method, input)
          -> RuntimeResult<unknown>
      -> subprocess adapter (opt-in)
          -> spawn node child with no shell + minimal env
          -> one-shot JSON stdin/stdout IPC
          -> RuntimeResult<unknown> or SystemRuntimeFailure
  -> normalize output through StrategyResultSchema / SoldierBrainResultSchema
      -> player-caused violation: RuntimeResult violation to engine
      -> system failure: throw/return worker-level system failure
  -> pure engine applies legal effects
  -> Chronicle builder stores public/private runtime details by projection rules
```
[VERIFIED: apps/worker/src/runner.ts + packages/runtime-js/src/executor.ts + packages/engine/src/activation.ts]

### Recommended Project Structure

```txt
packages/runtime-js/src/
├── adapter.ts                 # StrategyExecutionAdapter types and metadata
├── adapter-config.ts          # env/config parsing and default worker-thread selection
├── worker-adapter.ts          # wrapper around current worker-bridge behavior
├── subprocess-adapter.ts      # opt-in subprocess implementation or spike
├── subprocess-harness.ts      # child-side one-shot JSON executor
├── ipc-schema.ts              # Zod schemas for adapter request/response/failure
├── failure-taxonomy.ts        # strategy violation vs system failure mapping
├── hostile-fixtures.test.ts   # matrix shared by adapter contract tests
└── *.test.ts                  # existing tests expanded, not replaced

apps/worker/src/
├── runner.ts                  # passes adapter config / logs active adapter
└── runner.test.ts             # strategy-vs-system failure propagation
```
[VERIFIED: local package structure + 10-CONTEXT.md]

### Pattern 1: Adapter Contract Outside Engine

**What:** Define a runtime-js adapter contract that executes one method call and returns either raw method output, a player-caused `RuntimeViolation`, or a typed system failure. [VERIFIED: packages/engine/src/types.ts + 10-CONTEXT.md]

**When to use:** Use for `worker-thread`, `subprocess`, and future container/WASM implementations without changing `StrategyRuntime`. [VERIFIED: CowardsGameSpec_Full_Consolidated_v1.md]

**Example:**
```ts
// Source: local engine StrategyRuntime + Phase 10 context
export type StrategyMethodName = "selectActivations" | "soldierBrain"

export interface StrategyExecutionAdapter {
  readonly id: "worker-thread" | "subprocess"
  readonly isolation: string
  execute(args: {
    source: string
    methodName: StrategyMethodName
    input: unknown
    timeoutMs: number
  }): RuntimeExecutionResult
}
```
[VERIFIED: packages/engine/src/types.ts + packages/runtime-js/src/worker-bridge.ts]

### Pattern 2: Subprocess With No Shell and Minimal Env

**What:** Use `spawn(process.execPath, [harnessPath], { shell: false, env: minimalEnv, stdio: ["pipe", "pipe", "pipe"] })`, write one schema-valid JSON request, cap stdout/stderr bytes in stream handlers, and kill on timeout. [CITED: https://nodejs.org/api/child_process.html]

**When to use:** Use when the planner implements ISO-04/ISO-05 as a real subprocess adapter instead of a documentation-only spike. [VERIFIED: 10-CONTEXT.md]

**Example:**
```ts
// Source: Node child_process docs, adapted to Coward's Game adapter contract
const child = spawn(process.execPath, [harnessPath], {
  shell: false,
  env: { NODE_ENV: "production" },
  stdio: ["pipe", "pipe", "pipe"],
  windowsHide: true,
  timeout: timeoutMs,
  killSignal: "SIGKILL",
})
```
[CITED: https://nodejs.org/api/child_process.html]

### Pattern 3: Classification Before Engine Boundary

**What:** Player-caused failures become `RuntimeViolation`; infrastructure failures become worker-level system failures and must not produce gameplay `RUNTIME_VIOLATION` Chronicle events. [VERIFIED: 10-CONTEXT.md + apps/worker/src/runner.test.ts]

**When to use:** Use for malformed IPC, subprocess nonzero exit, signal termination, spawn error, and adapter harness protocol failures. [VERIFIED: 10-CONTEXT.md]

**Example:**
```ts
// Source: Phase 10 failure taxonomy + existing Worker runner behavior
type RuntimeExecutionResult =
  | { kind: "success"; value: unknown }
  | { kind: "strategy_violation"; violation: RuntimeViolation }
  | { kind: "system_failure"; reason: RuntimeSystemFailure }
```
[VERIFIED: packages/engine/src/types.ts + apps/worker/src/runner.ts]

### Anti-Patterns to Avoid

- **Calling worker threads a sandbox:** Worker threads can share memory and resource limits are partial JS-engine limits. [CITED: https://nodejs.org/api/worker_threads.html]
- **Using Node `vm` for Strategy security:** Node docs explicitly forbid relying on `node:vm` for untrusted code. [CITED: https://nodejs.org/api/vm.html]
- **Passing `process.env` to a Strategy subprocess:** child process options default to `process.env`, so the adapter must provide an explicit minimal `env`. [CITED: https://nodejs.org/api/child_process.html]
- **Using shell execution:** shell execution adds metacharacter injection risk and violates Phase 10 D-05. [VERIFIED: 10-CONTEXT.md] [CITED: https://nodejs.org/api/child_process.html]
- **Mapping malformed IPC to gameplay violation:** malformed IPC can indicate harness/system failure and must not be counted as player-caused unless validated as a Strategy output violation. [VERIFIED: 10-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JavaScript isolation in same process | Custom `vm` context sandbox | Worker-thread compatibility adapter plus subprocess/container/WASM direction | Node docs reject `vm` for untrusted code. [CITED: https://nodejs.org/api/vm.html] |
| JSON output shape checks | Manual property checks | Existing Zod schemas in `@cowards/spec` plus adapter IPC schemas | Runtime boundaries already use Zod schemas and project rules require schema validation. [VERIFIED: packages/spec/src/schemas.ts + AGENTS.md] |
| Subprocess command parsing | String command via shell | `spawn`/`execFile` with argv array and `shell: false` | Node child process docs expose no-shell process creation and shell execution is unnecessary. [CITED: https://nodejs.org/api/child_process.html] |
| Output caps | Unbounded stdout/stderr accumulation | Byte-counting stream caps or `execFile` `maxBuffer` where suitable | Node docs document maxBuffer termination behavior; streaming `spawn` needs explicit cap handling. [CITED: https://nodejs.org/api/child_process.html] |
| Failure taxonomy | One catch-all exception string | Typed result union and worker tests | Phase 10 requires timeout, forbidden capability, invalid output, oversized output, malformed IPC, exit, signal, and system failure distinctions. [VERIFIED: 10-CONTEXT.md] |

**Key insight:** The engine already consumes a language-neutral `StrategyRuntime`; Phase 10 should harden the runtime execution boundary without moving rules into adapters or changing engine behavior. [VERIFIED: packages/engine/src/types.ts + CowardsGameSpec_Full_Consolidated_v1.md]

## Common Pitfalls

### Pitfall 1: Worker-Thread Complacency
**What goes wrong:** The default adapter is documented as secure hostile-code isolation. [VERIFIED: .planning/research/PITFALLS.md]
**Why it happens:** Worker threads feel separate, but Node docs say they can share memory and their `resourceLimits` are limited to the JS engine. [CITED: https://nodejs.org/api/worker_threads.html]
**How to avoid:** Label worker-thread as default compatibility adapter and prototype containment; make subprocess/container/WASM the stronger boundary direction. [VERIFIED: 10-CONTEXT.md]
**Warning signs:** Docs or UI claim "sandboxed" without naming the actual adapter and boundary. [VERIFIED: ISO-01]

### Pitfall 2: Permission Model Overclaiming
**What goes wrong:** Node Permission Model is treated as the sandbox. [VERIFIED: .planning/research/PITFALLS.md]
**Why it happens:** Permission flags restrict filesystem/network/process APIs, but Node docs say the feature does not protect against malicious code. [CITED: https://nodejs.org/api/permissions.html]
**How to avoid:** Use permissions only as subprocess defense-in-depth and keep OS/container isolation as the production direction. [VERIFIED: 10-CONTEXT.md]
**Warning signs:** A plan replaces subprocess/container controls with `--permission` only. [VERIFIED: Node docs]

### Pitfall 3: Leaking Host Environment to Child Processes
**What goes wrong:** Strategy subprocess receives database URLs, app secrets, npm env, or other inherited values. [VERIFIED: Node child_process docs]
**Why it happens:** child process `env` defaults to `process.env`. [CITED: https://nodejs.org/api/child_process.html]
**How to avoid:** Always pass a whitelist env object and test that `process.env.DATABASE_URL` and arbitrary secret sentinels are absent. [VERIFIED: 10-CONTEXT.md]
**Warning signs:** Adapter code uses `env: process.env` or spreads parent env. [VERIFIED: apps/web/app/api/test-support/run-worker-once/route.ts has this pattern for test-support process only, not Strategy runtime]

### Pitfall 4: IPC Ambiguity
**What goes wrong:** A malformed child response becomes `THROWN_EXCEPTION` or `INVALID_OUTPUT` gameplay semantics by accident. [VERIFIED: 10-CONTEXT.md]
**Why it happens:** The runtime currently has only `RuntimeViolation` for method execution failures. [VERIFIED: packages/spec/src/types.ts]
**How to avoid:** Add a system-failure branch before converting to engine `RuntimeResult`. [VERIFIED: apps/worker/src/runner.test.ts]
**Warning signs:** Subprocess exit, signal, timeout, and malformed JSON all map to one public runtime violation. [VERIFIED: ISO-07]

### Pitfall 5: Subprocess Output Deadlocks or Memory Growth
**What goes wrong:** Hostile code writes too much stdout/stderr and blocks or grows parent memory. [CITED: https://nodejs.org/api/child_process.html]
**Why it happens:** Node docs state process stdio pipes have limited platform-specific capacity and blocked writers wait for buffer acceptance. [CITED: https://nodejs.org/api/child_process.html]
**How to avoid:** Consume stdout/stderr, count bytes, kill on caps, and test oversized output. [VERIFIED: 10-CONTEXT.md]
**Warning signs:** The child stdout is read only after process close. [VERIFIED: Node child_process docs]

## Code Examples

### Adapter Factory With Default Worker-Thread

```ts
// Source: existing createRuntimeFromRevision pattern + Phase 10 decisions
export const createRuntimeFromRevision = (
  revision: StrategyRevision,
  options: { adapter?: StrategyExecutionAdapter } = {},
): StrategyRuntime => {
  const adapter = options.adapter ?? createWorkerThreadAdapter()
  return createRuntimeFromRevisionWithAdapter(revision, adapter)
}
```
[VERIFIED: packages/runtime-js/src/executor.ts + 10-CONTEXT.md]

### Subprocess Response Schema

```ts
// Source: existing RuntimeViolation schema style in @cowards/spec
const SubprocessResponseSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("success"), value: z.unknown() }),
  z.object({
    kind: z.literal("strategy_violation"),
    violation: RuntimeViolationSchema,
  }),
])
```
[VERIFIED: packages/spec/src/schemas.ts]

### Hostile Matrix Shape

```ts
// Source: Phase 10 D-12 + existing Vitest patterns
it.each([
  ["dynamic import", "import('node:fs')", "FORBIDDEN_CAPABILITY"],
  ["process access", "globalThis.process", "FORBIDDEN_CAPABILITY"],
  ["filesystem token", "require('node:fs')", "FORBIDDEN_CAPABILITY"],
  ["infinite loop", "while (true) {}", "TIMEOUT"],
  ["oversized output", "'x'.repeat(32769)", "OVERSIZED_OUTPUT"],
])("%s is classified", (_name, body, expected) => {
  // Build forged-valid revisions only for runtime-layer escape attempts.
})
```
[VERIFIED: packages/runtime-js/src/executor.test.ts + packages/runtime-js/src/validation.test.ts]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Node `vm` for untrusted JavaScript | Do not use Node `vm` for untrusted code | Current Node docs state this explicitly | Planner must not add `vm` sandbox tasks. [CITED: https://nodejs.org/api/vm.html] |
| Treating worker `resourceLimits` as full memory isolation | Treat as JS-engine resource control only | Current Node docs document scope and OOM caveat | Keep worker default for compatibility, not final isolation. [CITED: https://nodejs.org/api/worker_threads.html] |
| Permission Model as sandbox | Permission Model as seat belt / defense-in-depth | Node docs mark feature stable but warn it lacks malicious-code guarantees | Use only with subprocess and minimal grants. [CITED: https://nodejs.org/api/permissions.html] |
| Node WASI as secure untrusted sandbox | Node WASI not relied on for secure sandboxing | Current Node WASI docs warn against relying on it for untrusted code | WASM/WASI remains future direction with runtime selection, not Node WASI drop-in. [CITED: https://nodejs.org/api/wasi.html] |
| Broad runtime failure bucket | Typed strategy vs system failure taxonomy | Phase 10 requirement | Necessary for ISO-07 and worker retry correctness. [VERIFIED: .planning/REQUIREMENTS.md] |

**Deprecated/outdated:**
- `node:vm` as security boundary: forbidden by project constraints and Node docs. [VERIFIED: AGENTS.md] [CITED: https://nodejs.org/api/vm.html]
- Inheriting parent environment for Strategy execution: incompatible with Phase 10 subprocess contract and Node default-env behavior. [VERIFIED: 10-CONTEXT.md] [CITED: https://nodejs.org/api/child_process.html]
- Public replay exposure of private runtime details: forbidden by project constraints and existing projection tests. [VERIFIED: AGENTS.md + packages/runtime-js/src/integration.test.ts]

## Open Questions

1. **Should the opt-in subprocess adapter be exposed by env var, package API, or worker CLI option?**
   - What we know: Phase 10 requires configurability and visibility while preserving worker-thread default. [VERIFIED: 10-CONTEXT.md]
   - What's unclear: The repo has no existing runtime adapter config convention. [VERIFIED: rg runtime adapter config]
   - Recommendation: Use a small runtime-js config parser plus worker env var such as `COWARDS_RUNTIME_ADAPTER=worker-thread|subprocess`, and expose adapter metadata in logs/tests. [VERIFIED: apps/worker/src/index.ts uses env for worker ID]

2. **Can the subprocess harness run with Node `--permission` without creating brittle local/CI friction?**
   - What we know: Permission Model is stable in current Node docs but not a malicious-code sandbox. [CITED: https://nodejs.org/api/permissions.html]
   - What's unclear: The harness may need file read permission to load its compiled entrypoint in local TypeScript/test mode. [VERIFIED: Node permissions docs]
   - Recommendation: Implement subprocess without relying on permissions first; add permission flags only if tests can prove they work across local and CI. [VERIFIED: 10-CONTEXT.md]

3. **Should malformed IPC be retryable system failure or adapter system failure that fails the Match immediately?**
   - What we know: Phase 10 says infrastructure failures remain system failures, and current worker retries system failures. [VERIFIED: 10-CONTEXT.md + apps/worker/src/runner.ts]
   - What's unclear: Persistence currently stores error class/message but not a richer runtime-system-failure enum. [VERIFIED: apps/worker/src/runner.ts]
   - Recommendation: Add typed system failure details in runtime-js and map to existing worker retry path first; defer persistence schema changes unless current tables cannot store diagnostics. [VERIFIED: local code]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Runtime adapters and tests | yes | `v24.15.0` | None for this phase. [VERIFIED: node --version] |
| pnpm | Workspace scripts | yes | `11.1.2` | npm is available but repo packageManager is pnpm. [VERIFIED: pnpm --version + package.json] |
| npm registry access | Version verification | yes | npm `11.12.1` | Use pinned package.json if offline. [VERIFIED: npm --version + npm view] |
| Docker | Future container direction / optional spike | yes | `29.4.3` | Subprocess adapter remains the Phase 10 default implementation target. [VERIFIED: docker --version + 10-CONTEXT.md] |

**Missing dependencies with no fallback:**
- None found for research and planned subprocess implementation. [VERIFIED: environment audit]

**Missing dependencies with fallback:**
- None found. [VERIFIED: environment audit]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `4.1.6`; Playwright `1.60.0` for existing E2E but Phase 10 should be mostly Vitest. [VERIFIED: package.json + npm registry] |
| Config file | Root `vitest.config.ts`; web-specific `apps/web/vitest.config.ts`; Playwright `playwright.config.ts`. [VERIFIED: rg --files] |
| Quick run command | `pnpm --filter @cowards/runtime-js test -- executor.test.ts` [VERIFIED: packages/runtime-js/package.json] |
| Full suite command | `pnpm --filter @cowards/runtime-js test && pnpm --filter @cowards/worker test && pnpm typecheck` [VERIFIED: package scripts] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| ISO-01 | Active adapter identity and isolation metadata are visible | unit | `pnpm --filter @cowards/runtime-js test -- adapter-config.test.ts` | no - Wave 0. [VERIFIED: rg --files] |
| ISO-02 | Web/API imports do not expose executable runtime APIs | unit/static | `pnpm --filter @cowards/runtime-js test -- public-entrypoint.test.ts` | partial - README/source split exists, dedicated test missing. [VERIFIED: packages/runtime-js/README.md] |
| ISO-03 | Worker-thread and subprocess adapters satisfy the same execution contract | unit | `pnpm --filter @cowards/runtime-js test -- adapter-contract.test.ts` | no - Wave 0. [VERIFIED: rg --files] |
| ISO-04 | Subprocess accepts schema-valid JSON and rejects malformed IPC | unit | `pnpm --filter @cowards/runtime-js test -- subprocess-adapter.test.ts` | no - Wave 0. [VERIFIED: rg --files] |
| ISO-05 | Timeout, output cap, minimal env, and resource-bound behavior are enforced | unit | `pnpm --filter @cowards/runtime-js test -- subprocess-adapter.test.ts hostile-fixtures.test.ts` | partial - worker timeout/resource tests exist, subprocess tests missing. [VERIFIED: packages/runtime-js/src/executor.test.ts] |
| ISO-06 | Hostile Strategy matrix covers forbidden capabilities and resource abuse | unit/integration | `pnpm --filter @cowards/runtime-js test -- hostile-fixtures.test.ts` | partial - existing executor/validation tests cover subset. [VERIFIED: packages/runtime-js/src/*.test.ts] |
| ISO-07 | Strategy violations and system failures stay distinct in worker policy | unit | `pnpm --filter @cowards/worker test -- runner.test.ts` | partial - current tests distinguish Chronicle runtime violations from orchestration errors, not subprocess failure enum. [VERIFIED: apps/worker/src/runner.test.ts] |

### Sampling Rate

- **Per task commit:** `pnpm --filter @cowards/runtime-js test -- adapter-contract.test.ts subprocess-adapter.test.ts hostile-fixtures.test.ts` [VERIFIED: package scripts]
- **Per wave merge:** `pnpm --filter @cowards/runtime-js test && pnpm --filter @cowards/worker test && pnpm typecheck` [VERIFIED: package scripts]
- **Phase gate:** `pnpm verify` after targeted runtime/worker suite passes. [VERIFIED: package.json]

### Wave 0 Gaps

- [ ] `packages/runtime-js/src/adapter.ts` - shared adapter contract. [VERIFIED: file absent]
- [ ] `packages/runtime-js/src/adapter-config.test.ts` - ISO-01 adapter visibility/config. [VERIFIED: file absent]
- [ ] `packages/runtime-js/src/adapter-contract.test.ts` - ISO-03 shared behavior across adapters. [VERIFIED: file absent]
- [ ] `packages/runtime-js/src/subprocess-adapter.test.ts` - ISO-04/ISO-05 subprocess behavior. [VERIFIED: file absent]
- [ ] `packages/runtime-js/src/hostile-fixtures.test.ts` - ISO-06 hostile matrix. [VERIFIED: file absent]
- [ ] `apps/worker/src/runner.test.ts` additions - ISO-07 system failure mapping. [VERIFIED: existing file]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no direct Phase 10 scope | Do not alter auth; Strategy execution must remain outside web/API. [VERIFIED: AGENTS.md] |
| V3 Session Management | no direct Phase 10 scope | Do not pass cookies/session env to runtime subprocess. [VERIFIED: 10-CONTEXT.md + Node child_process docs] |
| V4 Access Control | yes | Only worker/runtime boundary can execute Strategy source; web imports stay safe-only. [VERIFIED: packages/runtime-js/README.md + rg imports] |
| V5 Input Validation | yes | Zod schemas for Strategy input/output and subprocess IPC. [VERIFIED: packages/spec/src/schemas.ts] |
| V6 Cryptography | no new crypto | Keep existing hashes/revision identity; do not add custom crypto. [VERIFIED: packages/runtime-js/src/hash.ts] |
| V8 Data Protection | yes | Minimal env/no secrets, private runtime details owner-only, no public source/memory exposure. [VERIFIED: AGENTS.md + packages/runtime-js/src/integration.test.ts] |
| V10 Malicious Code | yes | Treat Strategy code as hostile; use process boundary direction and hostile test matrix. [VERIFIED: AGENTS.md + 10-CONTEXT.md] |

### Known Threat Patterns for Node Runtime Isolation

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Strategy reads parent secrets through env | Information Disclosure | Explicit minimal subprocess `env`; worker-thread `env: {}`; tests with sentinel secret. [VERIFIED: packages/runtime-js/src/worker-bridge.ts + Node child_process docs] |
| Strategy uses dynamic import or require to access host APIs | Elevation of Privilege | Source validation plus runtime forbidden capability checks plus subprocess permission/container direction. [VERIFIED: packages/runtime-js/src/validation.ts + worker-harness.ts] |
| Infinite loop or CPU burn | Denial of Service | Wall-clock timeout and termination for worker/subprocess; future deterministic fuel is out of Phase 10 scope. [VERIFIED: CowardsGameSpec_Full_Consolidated_v1.md + worker-bridge.ts] |
| Large stdout/stderr or output object | Denial of Service | Byte caps on subprocess streams and Zod size limits for StrategyMemory/SoldierMemory/objective output. [VERIFIED: packages/spec/src/schemas.ts + Node child_process docs] |
| Malformed IPC masquerades as Strategy failure | Tampering / Repudiation | IPC response schema and separate `system_failure` taxonomy. [VERIFIED: 10-CONTEXT.md] |
| Public replay exposes private violation message | Information Disclosure | Public projection keeps runtime message private; owner projection may include details. [VERIFIED: packages/runtime-js/src/integration.test.ts] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ASVS category labels are used as planning taxonomy, not as audited compliance claims. [ASSUMED] | Security Domain | Planner may treat this as formal ASVS certification rather than scoped security mapping. |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project non-negotiables and testing expectations. [VERIFIED: local file]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md` - v1.1 scope and ISO-01 through ISO-07. [VERIFIED: local files]
- `.planning/phases/10-runtime-isolation-hardening/10-CONTEXT.md` - locked Phase 10 decisions. [VERIFIED: local file]
- `CowardsGameSpec_Full_Consolidated_v1.md` - Strategy constraints, forbidden runtime capabilities, memory limits, runtime failure behavior. [VERIFIED: local file]
- `CowardsGame_Technical_Architecture_Spec_V1.md` - worker/runtime boundary, StrategyRuntime abstraction, strategy/system failure split. [VERIFIED: local file]
- `packages/runtime-js/src/**`, `apps/worker/src/**`, `packages/engine/src/types.ts`, `packages/engine/src/activation.ts`, `packages/spec/src/schemas.ts` - existing implementation. [VERIFIED: local code]
- Node `child_process` docs - spawn/execFile behavior, env/defaults, stdio, timeout, maxBuffer, shell behavior. [CITED: https://nodejs.org/api/child_process.html]
- Node `worker_threads` docs - shared memory, env inheritance/defaults, resourceLimits caveat. [CITED: https://nodejs.org/api/worker_threads.html]
- Node `vm` docs - not a security mechanism for untrusted code. [CITED: https://nodejs.org/api/vm.html]
- Node Permission Model docs - stable restrictions and malicious-code warning. [CITED: https://nodejs.org/api/permissions.html]
- Node WASI docs - Node WASI is experimental and not a secure sandbox for untrusted code. [CITED: https://nodejs.org/api/wasi.html]
- npm registry - current versions for TypeScript, Vitest, Zod, @types/node, Playwright, pg, tsx. [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)

- Docker resource constraints docs - container CPU/resource controls for future container direction. [CITED: https://docs.docker.com/engine/containers/resource_constraints/]

### Tertiary (LOW confidence)

- None. [VERIFIED: source log]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package versions and built-in Node APIs were verified locally and against npm/official docs. [VERIFIED: npm registry + Node docs]
- Architecture: HIGH - recommended adapter boundary follows existing engine/runtime split and locked Phase 10 decisions. [VERIFIED: local code + 10-CONTEXT.md]
- Pitfalls: HIGH for Node `vm`, worker thread, permission, env, and child process behavior because official docs were checked. [CITED: Node docs]
- Subprocess implementation feasibility: MEDIUM - Node APIs are available, but compiled harness path, permission flags, and local/CI behavior need implementation tests. [VERIFIED: environment audit + Node docs]

**Research date:** 2026-05-18 [VERIFIED: environment current_date]
**Valid until:** 2026-06-17 for local architecture; re-check Node docs and npm package versions before implementing production-grade container/WASM isolation. [ASSUMED]
