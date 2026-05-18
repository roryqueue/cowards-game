# Phase 10: Runtime Isolation Hardening - Pattern Map

**Mapped:** 2026-05-18  
**Files analyzed:** 13 likely new/modified files  
**Analogs found:** 13 / 13

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
| --- | --- | --- | --- | --- |
| `packages/runtime-js/src/execution-adapter.ts` | service | request-response | `packages/engine/src/types.ts` | exact |
| `packages/runtime-js/src/worker-adapter.ts` | service | request-response | `packages/runtime-js/src/worker-bridge.ts` | exact |
| `packages/runtime-js/src/subprocess-adapter.ts` | service | request-response + IPC | `packages/runtime-js/src/worker-bridge.ts` + `apps/web/app/api/test-support/run-worker-once/route.ts` | role-match |
| `packages/runtime-js/src/subprocess-harness.ts` | utility | request-response + IPC | `packages/runtime-js/src/worker-harness.ts` | role-match |
| `packages/runtime-js/src/runtime-config.ts` | config | transform | `packages/runtime-js/src/guards.ts` + `packages/runtime-js/src/worker.ts` | role-match |
| `packages/runtime-js/src/executor.ts` | service | request-response | `packages/runtime-js/src/executor.ts` | exact |
| `packages/runtime-js/src/guards.ts` | utility | transform | `packages/runtime-js/src/guards.ts` | exact |
| `packages/runtime-js/src/worker.ts` | config/export | request-response | `packages/runtime-js/src/worker.ts` | exact |
| `packages/runtime-js/package.json` | config | transform | `packages/runtime-js/package.json` | exact |
| `packages/runtime-js/src/executor.test.ts` | test | request-response | `packages/runtime-js/src/executor.test.ts` | exact |
| `packages/runtime-js/src/adapter-contract.test.ts` | test | request-response + IPC | `packages/runtime-js/src/executor.test.ts` + `apps/worker/src/runner.test.ts` | role-match |
| `apps/worker/src/runner.ts` | service | batch/request-response | `apps/worker/src/runner.ts` | exact |
| `apps/worker/src/runner.test.ts` | test | batch/request-response | `apps/worker/src/runner.test.ts` | exact |
| `packages/spec/src/types.ts` / `packages/spec/src/schemas.ts` | model/schema | transform | `packages/spec/src/types.ts` + `packages/spec/src/schemas.ts` | exact |

## Pattern Assignments

### `packages/runtime-js/src/execution-adapter.ts` (service, request-response)

**Analog:** `packages/engine/src/types.ts`

**Interface shape** (lines 72-79):

```typescript
export type RuntimeResult<T> =
  | { ok: true; value: T }
  | { ok: false; violation: RuntimeViolation }

export interface StrategyRuntime {
  selectActivations(input: StrategyInput): RuntimeResult<StrategyResult>
  runSoldierBrain(input: SoldierBrainInput): RuntimeResult<SoldierBrainResult>
}
```

**Pattern to copy:** keep the new adapter contract language-neutral and small. It should accept `{ source, methodName, input, timeoutMs? }` and return `RuntimeResult<unknown>`, leaving typed output parsing in `executor.ts`.

**Validation boundary analog:** `packages/runtime-js/src/executor.ts` validates raw adapter results after execution, not inside the raw bridge (lines 122-132 and 141-151).

```typescript
const result = runStrategyMethodInWorker({
  source: source.source,
  methodName: "selectActivations",
  input,
  timeoutMs: WORKER_STARTUP_TIMEOUT_MS,
})
if (!result.ok) {
  return result
}

return normalizeStrategyOutput(result.value)
```

### `packages/runtime-js/src/worker-adapter.ts` (service, request-response)

**Analog:** `packages/runtime-js/src/worker-bridge.ts`

**Imports pattern** (lines 1-8):

```typescript
import {
  MessageChannel,
  receiveMessageOnPort,
  Worker,
} from "node:worker_threads"
import type { RuntimeResult } from "@cowards/engine"
import { RUNTIME_TIMEOUT_MS } from "./guards.js"
import { WORKER_HARNESS_SOURCE } from "./worker-harness.js"
```

**Worker containment pattern** (lines 54-70):

```typescript
const worker = new Worker(workerScriptUrl(), {
  workerData: {
    source: args.source,
    methodName: args.methodName,
    input: args.input,
    port: port2,
    signalBuffer,
  },
  transferList: [port2],
  env: {},
  execArgv: [],
  resourceLimits: {
    maxOldGenerationSizeMb: 16,
    maxYoungGenerationSizeMb: 8,
    stackSizeMb: 4,
  },
})
```

**Timeout/error pattern** (lines 72-96):

```typescript
const waitResult = Atomics.wait(signal, 0, 0, args.timeoutMs ?? RUNTIME_TIMEOUT_MS)

if (waitResult === "timed-out") {
  void worker.terminate()
  port1.close()
  return {
    ok: false,
    violation: { type: "TIMEOUT", message: "Strategy execution timed out" },
  }
}

void worker.terminate()
const received = receiveMessageOnPort(port1)
port1.close()

if (!received || !isWorkerResult(received.message)) {
  return thrown("Worker did not return a valid runtime message")
}
```

**Guidance:** preserve this as the default/compatibility adapter. Documentation and names should say `worker-thread` is prototype containment, not the final hostile-code sandbox.

### `packages/runtime-js/src/subprocess-adapter.ts` (service, request-response + IPC)

**Analogs:** `packages/runtime-js/src/worker-bridge.ts` and `apps/web/app/api/test-support/run-worker-once/route.ts`

**No-shell subprocess analog** (route lines 74-88):

```typescript
export const runWorkerOnceProcess = async (
  env: RouteEnv = process.env,
): Promise<WorkerProcessResult> => {
  const { command, args } = createPnpmCommand(env)
  return execFileAsync(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
      COWARDS_TEST_WORKER_ID:
        env.COWARDS_TEST_WORKER_ID ?? "worker:test-support",
    },
    maxBuffer: 1024 * 1024,
    timeout: 60_000,
  })
}
```

**JSON response parsing analog** (route lines 91-110):

```typescript
const parseWorkerPayload = (
  stdout: string,
): Record<string, unknown> | undefined => {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of [...lines].reverse()) {
    try {
      const parsed = JSON.parse(line) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // Ignore non-JSON worker logs and keep looking for the result payload.
    }
  }
  return undefined
}
```

**Required divergence from analog:** for Strategy subprocesses, do not copy the route's inherited env pattern. Phase 10 context requires no shell, one-shot JSON/JSON-lines, schema-valid input, schema-validated output, minimal env, byte caps, timeout kill behavior, no app secrets, and no unnecessary inherited host capabilities.

**Failure mapping:** keep player-caused runtime failures in `RuntimeResult<unknown>`. Map malformed IPC, subprocess nonzero exit, signal termination, spawn failure, and adapter protocol failure to system failure types unless the subprocess returned a schema-valid player violation.

### `packages/runtime-js/src/subprocess-harness.ts` (utility, request-response + IPC)

**Analog:** `packages/runtime-js/src/worker-harness.ts`

**Forbidden capability shim pattern** (lines 4-20):

```typescript
const FORBIDDEN_CAPABILITY = "FORBIDDEN_CAPABILITY"

const forbiddenError = (name) =>
  new Error(FORBIDDEN_CAPABILITY + ": " + name)

const forbiddenFunction = (name) =>
  new Proxy(function blockedCapability() {}, {
    apply() {
      throw forbiddenError(name)
    },
    construct() {
      throw forbiddenError(name)
    },
    get() {
      throw forbiddenError(name)
    },
  })
```

**Synthetic module wrapper pattern** (lines 68-98):

```typescript
const createStrategyModuleSource = (source) =>
  [
    'const FORBIDDEN_CAPABILITY = "FORBIDDEN_CAPABILITY"',
    'const forbiddenError = (name) => new Error(FORBIDDEN_CAPABILITY + ": " + name)',
    'const module = { exports: {} }',
    'const exports = module.exports',
    'const Function = forbiddenFunction("Function")',
    'const process = forbiddenFunction("process")',
    'const require = forbiddenFunction("require")',
    'const fetch = forbiddenFunction("fetch")',
    'const WebAssembly = forbiddenFunction("WebAssembly")',
    'const Worker = forbiddenFunction("Worker")',
    'const Date = forbiddenFunction("Date")',
    'const setTimeout = forbiddenFunction("setTimeout")',
    'const setInterval = forbiddenFunction("setInterval")',
    'const setImmediate = forbiddenFunction("setImmediate")',
    'const global = sanitizedGlobalThis',
    'const globalThis = sanitizedGlobalThis',
    source,
    'const strategy = module.exports && module.exports.default',
    'export default strategy',
  ].join("\n")
```

**Runtime result pattern** (lines 133-147):

```typescript
try {
  port.postMessage(await runStrategy(workerData.source))
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  port.postMessage({
    ok: false,
    violation: isForbiddenCapabilityMessage(message)
      ? toViolation("FORBIDDEN_CAPABILITY", message)
      : toViolation("THROWN_EXCEPTION", message),
  })
} finally {
  Atomics.store(signal, 0, 1)
  Atomics.notify(signal, 0)
  port.close()
}
```

**Guidance:** subprocess harness should read a single schema-valid request from stdin and write a single schema-valid JSON result to stdout. Keep stderr for diagnostics with a byte cap. Do not use `node:vm`.

### `packages/runtime-js/src/runtime-config.ts` (config, transform)

**Analogs:** `packages/runtime-js/src/guards.ts`, `packages/runtime-js/src/worker.ts`, `packages/runtime-js/package.json`

**Constants/export pattern** (`guards.ts` lines 1-8):

```typescript
import type { RuntimeViolation, RuntimeViolationType } from "@cowards/spec"

export const RUNTIME_TIMEOUT_MS = 50

export const createRuntimeViolation = (
  type: RuntimeViolationType,
  message: string,
): RuntimeViolation => ({ type, message })
```

**Worker entrypoint visibility pattern** (`worker.ts` lines 1-3):

```typescript
export const runtimeJsWorkerEntrypoint = "@cowards/runtime-js/worker"
export { createRuntimeFromRevision } from "./executor.js"
export { RUNTIME_TIMEOUT_MS } from "./guards.js"
```

**Package subpath export pattern** (`package.json` lines 8-11):

```json
"exports": {
  ".": "./src/index.ts",
  "./worker": "./src/worker.ts"
}
```

**Guidance:** expose active adapter name and isolation summary from runtime-js, then have `apps/worker` log it. Keep selection in `packages/runtime-js` and `apps/worker`, not `apps/web`.

### `packages/runtime-js/src/executor.ts` (service, request-response)

**Analog:** `packages/runtime-js/src/executor.ts`

**Import style** (lines 1-20):

```typescript
import {
  SoldierBrainResultSchema,
  StrategyResultSchema,
  type RuntimeViolation,
  type SoldierBrainResult,
  type StrategyResult,
  type StrategyRevision,
} from "@cowards/spec"
import {
  success,
  type RuntimeResult,
  type StrategyRuntime,
} from "@cowards/engine"
```

**Output normalization pattern** (lines 43-62 and 64-83):

```typescript
const parsed = StrategyResultSchema.safeParse(value)
if (!parsed.success) {
  const message = parsed.error.message
  return {
    ok: false,
    violation: schemaFailureIsOversized(message)
      ? toOversizedOutputViolation(message)
      : toInvalidOutputViolation(message),
  }
}

return success(parsed.data as StrategyResult)
```

**Revision validation gate** (lines 85-109):

```typescript
if (!revision.validation.valid) {
  return {
    ok: false,
    violation: {
      type: "INVALID_OUTPUT",
      message: "Strategy Revision is not valid",
    },
  }
}
```

**Guidance:** adapt `createRuntimeFromRevision` to accept an optional adapter/config while defaulting to worker-thread. Do not move schema parsing into adapters. Do not execute Strategy code in callers.

### `packages/runtime-js/src/guards.ts` (utility, transform)

**Analog:** `packages/runtime-js/src/guards.ts`

**Violation mapping pattern** (lines 10-33):

```typescript
export const isForbiddenRuntimeError = (error: unknown): boolean =>
  error instanceof Error && error.message.startsWith("FORBIDDEN_CAPABILITY:")

export const toThrownExceptionViolation = (
  error: unknown,
): RuntimeViolation => {
  if (isForbiddenRuntimeError(error)) {
    return createRuntimeViolation("FORBIDDEN_CAPABILITY", String(error))
  }

  return createRuntimeViolation(
    "THROWN_EXCEPTION",
    error instanceof Error ? error.message : String(error),
  )
}
```

**Guidance:** add granular helpers only when they still represent player-caused runtime violations. System failures should be represented separately from `RuntimeViolation` or returned through an adapter/system result discriminant.

### `packages/spec/src/types.ts` and `packages/spec/src/schemas.ts` (model/schema, transform)

**Analogs:** `packages/spec/src/types.ts`, `packages/spec/src/schemas.ts`

**Runtime violation type source** (`types.ts` lines 142-152):

```typescript
export type RuntimeViolationType =
  | "INVALID_OUTPUT"
  | "TIMEOUT"
  | "THROWN_EXCEPTION"
  | "FORBIDDEN_CAPABILITY"
  | "OVERSIZED_OUTPUT"

export interface RuntimeViolation {
  type: RuntimeViolationType
  message: string
}
```

**Schema mirror** (`schemas.ts` lines 175-181):

```typescript
export const RuntimeViolationTypeSchema = z.enum([
  "INVALID_OUTPUT",
  "TIMEOUT",
  "THROWN_EXCEPTION",
  "FORBIDDEN_CAPABILITY",
  "OVERSIZED_OUTPUT",
])
```

**Runtime event privacy payload** (`schemas.ts` lines 463-472):

```typescript
ChronicleEventBaseSchema.extend({
  type: z.literal("RUNTIME_VIOLATION"),
  payload: z.object({
    type: RuntimeViolationTypeSchema,
    category: z.string().min(1).optional(),
    playerId: z.string().min(1).optional(),
    ownerPlayerId: z.string().min(1).optional(),
    soldierId: z.string().min(1).optional(),
  }),
})
```

**Guidance:** if Phase 10 adds violation names, update type and Zod enum together. Do not put subprocess nonzero exit, malformed IPC, or signal termination into public replay runtime violation semantics unless clearly player-caused and schema-valid.

### `apps/worker/src/runner.ts` (service, batch/request-response)

**Analog:** `apps/worker/src/runner.ts`

**Imports pattern** (lines 1-17):

```typescript
import { buildChronicleFromMatch } from "@cowards/replay"
import { setTimeout as sleep } from "node:timers/promises"
import {
  createRepositories,
  claimNextMatchJob,
  completeMatch,
  recordAttemptFailure,
  type ClaimedMatchJob,
} from "@cowards/persistence"
import { createRuntimeFromRevision } from "@cowards/runtime-js/worker"
```

**Runtime construction boundary** (lines 85-101):

```typescript
return {
  matchId,
  seed: String(match.seed),
  arenaVariant,
  bottomPlayerId: String(match.bottom_player_id),
  topPlayerId: String(match.top_player_id),
  bottomStrategyRevisionId,
  topStrategyRevisionId,
  runtime: createSideDispatchRuntime(
    createRuntimeFromRevision(bottomRevision),
    createRuntimeFromRevision(topRevision),
    {
      bottomPlayerId: String(match.bottom_player_id),
      topPlayerId: String(match.top_player_id),
    },
  ),
}
```

**System failure persistence pattern** (lines 124-147):

```typescript
try {
  const input = await dependencies.loadRunMatchInput(pool, claimed.matchId)
  const result = dependencies.buildChronicleFromMatch(input)
  await dependencies.completeMatch(pool, {
    jobId: claimed.jobId,
    leaseToken: claimed.leaseToken,
    chronicle: result.chronicle,
    finalState: result.finalState,
  })
  return "completed"
} catch (error) {
  const failureStatus = await dependencies.recordAttemptFailure(pool, {
    jobId: claimed.jobId,
    leaseToken: claimed.leaseToken,
    errorClass: error instanceof Error ? error.name : "UnknownError",
    errorMessage: error instanceof Error ? error.message : String(error),
    retryable: true,
    details: {
      workerId: options.workerId,
      matchId: claimed.matchId,
    },
  })
  return failureStatus === "failed_system" ? "failed_system" : "idle"
}
```

**Guidance:** active adapter selection belongs here or in runtime-js config passed from here. Strategy runtime violations should complete Matches with Chronicle events; adapter/system failures should use `recordAttemptFailure`.

### `packages/runtime-js/src/executor.test.ts` (test, request-response)

**Analog:** `packages/runtime-js/src/executor.test.ts`

**Fixture style** (lines 19-73 and 95-109):

```typescript
const bottomSoldier: SoldierSnapshot = {
  id: "bottom-1",
  ownerPlayerId: "bottom",
  status: "ACTIVE",
  position: { x: 5, y: 10 },
  facing: "UP",
  lastSuccessfulMoveDirection: null,
}

const runtimeForSource = (source: string) =>
  createRuntimeFromRevision(buildStrategyRevision({ source }))

const forgedValidRevision = (source: string): StrategyRevision => {
  const revision = buildStrategyRevision({ source: validSource })
  return {
    ...revision,
    source,
    validation: {
      ...revision.validation,
      valid: true,
      errors: [],
    },
  }
}
```

**No Node vm guard** (lines 140-152):

```typescript
it("does not use Node vm in the production worker harness", () => {
  const harnessSource = readFileSync(
    new URL("./worker-harness.ts", import.meta.url),
    "utf8",
  )

  const forbiddenRuntimeBoundaryPattern = new RegExp(
    "node:" + "vm|vm" + "\\.",
  )

  expect(harnessSource).not.toMatch(forbiddenRuntimeBoundaryPattern)
})
```

**Hostile matrix seed** (lines 291-326 and 328-367):

```typescript
it("infinite loop returns TIMEOUT", () => {
  const result = runtimeForSource(`
export default {
  selectActivations() {
    while (true) {}
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`).selectActivations(strategyInput)

  expect(result.ok).toBe(false)
  expect(!result.ok && result.violation.type).toBe("TIMEOUT")
})
```

**Guidance:** expand this into a table-driven hostile matrix for forbidden globals, dynamic import, worker/process access, filesystem/network attempts, infinite loop, memory pressure, oversized output, invalid output, thrown exceptions, and malformed subprocess responses.

### `packages/runtime-js/src/adapter-contract.test.ts` (test, request-response + IPC)

**Analogs:** `packages/runtime-js/src/executor.test.ts`, `apps/worker/src/runner.test.ts`

**Contract test style:** use `describe`, `it`, `expect`, `vi` from Vitest. Existing worker tests inject dependencies through simple factories (runner test lines 13-28):

```typescript
const baseDependencies = (): WorkerRunnerDependencies => ({
  claimNextMatchJob: vi.fn().mockResolvedValue(createClaimedMatchJobForTest()),
  loadRunMatchInput: vi.fn().mockResolvedValue({}),
  buildChronicleFromMatch: vi.fn().mockReturnValue({
    chronicle: {
      events: [{ type: "RUNTIME_VIOLATION" }],
    },
    finalState: {},
  }),
  completeMatch: vi.fn().mockResolvedValue({
    status: "complete",
    matchId: "match:test",
    chronicleId: "chronicle:test",
  }),
  recordAttemptFailure: vi.fn().mockResolvedValue("retry_queued"),
})
```

**Strategy versus system distinction tests** (`apps/worker/src/runner.test.ts` lines 56-87):

```typescript
it("completes Matches whose Chronicle includes RUNTIME_VIOLATION gameplay events", async () => {
  const dependencies = baseDependencies()

  await expect(
    runWorkerOnce(pool, { workerId: "worker:test" }, dependencies),
  ).resolves.toBe("completed")
  expect(dependencies.completeMatch).toHaveBeenCalledOnce()
  expect(dependencies.recordAttemptFailure).not.toHaveBeenCalled()
})

it("records unexpected orchestration errors as system failures", async () => {
  const dependencies = baseDependencies()
  vi.mocked(dependencies.buildChronicleFromMatch).mockImplementation(() => {
    throw new Error("database write unavailable")
  })

  await expect(
    runWorkerOnce(pool, { workerId: "worker:test" }, dependencies),
  ).resolves.toBe("idle")
  expect(dependencies.recordAttemptFailure).toHaveBeenCalledWith(
    pool,
    expect.objectContaining({
      errorClass: "Error",
      errorMessage: "database write unavailable",
      retryable: true,
    }),
  )
})
```

**Guidance:** write adapter contract tests once and run them against worker-thread and subprocess adapters. Keep malformed IPC, nonzero exit, signal termination, and spawn failure as system outcomes; keep invalid output, timeout inside Strategy execution, forbidden capability, oversized output, and thrown Strategy exception as player-caused runtime results when attributable.

## Shared Patterns

### Boundary Ownership

**Sources:** `AGENTS.md` lines 22-30, `CowardsGame_Technical_Architecture_Spec_V1.md` lines 728-739, `CowardsGameSpec_Full_Consolidated_v1.md` lines 1224-1237.

Apply to all Phase 10 work:

```text
The engine calls StrategyRuntime.
The engine does not directly execute user code.
User code must be treated as hostile.
Runtime must be isolated from engine internals, host machine, secrets, network, filesystem, and database.
```

Do not add Strategy execution to `apps/web`, API routes, persistence, or engine internals. `apps/web/app/api/test-support/run-worker-once/route.ts` is an E2E helper that starts the worker process; it is not a pattern for web/API Strategy execution.

### Runtime Validation

**Sources:** `packages/spec/src/schemas.ts` lines 144-181, `packages/runtime-js/src/executor.ts` lines 43-83.

Raw execution adapters return `RuntimeResult<unknown>`. Typed output parsing remains in `executor.ts` using `StrategyResultSchema.safeParse` and `SoldierBrainResultSchema.safeParse`.

### Chronicle Runtime Violation Privacy

**Sources:** `packages/engine/src/activation.ts` lines 84-120 and 122-174; `packages/spec/src/schemas.ts` lines 463-472.

Public payloads should expose only violation type and actor identifiers. Detailed messages stay in owner/private payloads.

### Worker System Failure Policy

**Sources:** `apps/worker/src/runner.ts` lines 124-147; `packages/persistence/src/jobs.ts` lines 120-210.

Infrastructure exceptions are retried/failed through `recordAttemptFailure`. Do not convert adapter infrastructure failures into gameplay Chronicle events unless they are schema-valid player-caused runtime violations.

### Config And Exports

**Sources:** `packages/runtime-js/package.json` lines 8-16, `packages/runtime-js/src/index.ts` lines 1-14, `packages/runtime-js/src/worker.ts` lines 1-3, root `tsconfig.base.json` lines 2-23.

Use ESM, `.js` relative imports in TS source, package subpath exports for worker/runtime entrypoints, and workspace dependencies. If adding a subprocess entrypoint, expose it through a package subpath instead of importing private source paths from `apps/worker`.

### Testing Style

**Sources:** runtime-js tests and worker tests.

Use Vitest `describe/it/expect`; table-drive hostile cases with `it.each` following `validation.test.ts` lines 23-64. Use dependency injection with `vi.fn()` following `runner.test.ts` lines 13-28. Prefer focused package tests:

```bash
pnpm --filter @cowards/runtime-js test
pnpm --filter @cowards/worker test
pnpm --filter @cowards/spec test
```

## Safe Parallelization Boundaries

| Workstream | Safe In Parallel With | Do Not Parallelize With |
| --- | --- | --- |
| Adapter contract/type file | Hostile test fixture drafting | Executor refactor touching the same call signature |
| Worker-thread adapter rename/extraction | Subprocess spike behind separate file | Broad `executor.ts` validation changes |
| Subprocess adapter/harness | Spec taxonomy discussion if no shared enums changed yet | Spec enum/schema edits until failure contract is settled |
| Runtime violation enum/schema changes | Test expectation updates after enum names are decided | Replay/engine runtime violation privacy edits in separate branches without coordination |
| Worker runner active-adapter visibility | Runtime config exports | Worker failure taxonomy if return type changes |
| Hostile runtime tests | Worker runner tests | Harness rewrites that change expected error text |

Recommended plan split:

1. Define adapter contract and active adapter metadata.
2. Extract worker-thread adapter without behavior change.
3. Add subprocess adapter spike/implementation and harness.
4. Expand failure taxonomy and schema tests.
5. Wire worker visibility and worker/system failure tests.

## No Analog Found

None. Subprocess execution has only a partial analog in `apps/web/app/api/test-support/run-worker-once/route.ts`; use it only for no-shell process invocation and JSON-output parsing shape, not for Strategy isolation or env inheritance.

## Explicit Anti-Patterns

- Do not use Node `vm` as a hostile-code boundary. Existing test `packages/runtime-js/src/executor.test.ts` lines 140-152 should be extended to cover any new harness files.
- Do not describe `worker_threads` or Node permissions as the final sandbox. Research says worker resource limits and Node Permission Model are defense-in-depth, not a malicious-code sandbox.
- Do not pass `process.env` into Strategy subprocesses. Use a minimal explicit env and avoid app secrets.
- Do not let subprocess malformed IPC, nonzero exit, signal termination, spawn errors, or byte-cap truncation become public `RUNTIME_VIOLATION` events unless the failure is clearly player-caused and schema-valid.
- Do not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, or runtime messages in public replay projections.

## Metadata

**Analog search scope:** `packages/runtime-js/src`, `apps/worker/src`, `packages/engine/src`, `packages/spec/src`, `packages/persistence/src`, selected web test-support route.  
**Files scanned:** 48 source/test/config files by `rg --files`; 25 files read with line numbers.  
**Pattern extraction date:** 2026-05-18.  
**Project skills:** no repo-local `.codex/skills/` or `.agents/skills/` directory exists.  
**Phase research:** no phase-local research file exists; used `.planning/research/SUMMARY.md`, `STACK.md`, `ARCHITECTURE.md`, and `PITFALLS.md`.
