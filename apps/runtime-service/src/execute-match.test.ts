import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  DEFAULT_RUNTIME_LIMITS,
  INITIAL_BOUNDS,
  RUNTIME_EXECUTION_SERVICE_VERSION,
  RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS,
  RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  RuntimeExecutionServiceRequestSchema,
  createAuthenticatedRuntimeInvocationRequestV117,
  createAuthenticatedRuntimeInvocationResponseV117,
  createRuntimeAbiV117ExecutionLedger,
  createRuntimeInvocationBudgetV117,
  createRuntimeInvocationExecutionReceiptV117,
  createRuntimeInvocationTraceV117,
  debitRuntimeAbiV117Ledger,
  encodeCanonicalJson,
  serializeRuntimeInvocationRequestV117,
  serializeRuntimeInvocationResponseV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type JsonValue,
  type RuntimeAbiV117ExecutionLedger,
  type RuntimeInvocationExecutionReceiptEvidenceV117,
  type RuntimeInvocationResultV117,
  type RuntimeInvocationTraceV117,
  type RuntimeExecutionServiceRequest,
  type SoldierBrainInput,
  type SoldierBrainResult,
  type StrategyRevision,
} from "@cowards/spec"
import { MATCH_KERNEL, type GameState } from "@cowards/engine"
import { buildStrategyRevision } from "@cowards/runtime-js"
import { buildPythonStrategyRevision } from "@cowards/runtime-python"
import {
  buildRustStrategyRevision,
  buildZigStrategyRevision,
  compileRustWasmArtifact,
  compileZigWasmArtifact,
} from "@cowards/runtime-wasm-wasi"
import {
  executeRuntimeServiceRequest as executeRuntimeServiceRequestWithAuthority,
  executeCandidateRuntimeInvocationV117,
  type RuntimeExecutionServiceDependencies,
} from "./execute-match.js"
import {
  createFixtureRuntimeEvidenceAuthorityLoader,
  createFixtureDeploymentLaneIdentity,
  createFixtureRuntimeExecutionEvidenceSnapshot,
} from "./runtime-execution-evidence.test-support.js"
import {
  createRuntimeServiceConfig,
  RuntimeServiceConfigError,
} from "./runtime-config.js"
import { admitStrategyPayloadBytesV117 } from "./server.js"

const runtimeConfig = createRuntimeServiceConfig({
  strategyExecutionAdapter: "worker-thread",
  semanticReceiptSecret: "fixture-semantic-receipt-secret-v1",
  resolveDeploymentLaneIdentity: createFixtureDeploymentLaneIdentity,
})

const executeRuntimeServiceRequest = (
  rawRequest: unknown,
  config = runtimeConfig,
  dependencies: Partial<RuntimeExecutionServiceDependencies> = {},
) => {
  const parsed = RuntimeExecutionServiceRequestSchema.safeParse(rawRequest)
  return executeRuntimeServiceRequestWithAuthority(rawRequest, config, {
    ...dependencies,
    ...(parsed.success
      ? {
          authorityLoader: createFixtureRuntimeEvidenceAuthorityLoader(
            parsed.data.evidenceSnapshot,
            parsed.data.strategies,
          ),
        }
      : {}),
  })
}

const candidateIdentity = {
  keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  secret: "fixture-only:runtime-invocation-v1.17:service-secret",
} as const

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const sha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const candidateRequest = (
  overrides: Partial<{
    invocationId: string
    kernelRequestId: string
    prestate: RuntimeAbiV117ExecutionLedger
  }> = {},
): AuthenticatedRuntimeInvocationRequestV117 => {
  const kernelRequest = candidateKernelRequest()
  return createAuthenticatedRuntimeInvocationRequestV117(
    {
      requestId: "request:service-candidate:v1.17",
      invocationId:
        overrides.invocationId ?? "invocation:service-candidate:v1.17",
      kernelRequestId: overrides.kernelRequestId ?? kernelRequest.requestId,
      method: "soldierBrain",
      semanticTuple: {
        rules: "cowards-rules-v1.4",
        engine: "engine-kernel-v1.37-candidate-1",
        runtimeAbi: "strategy-runtime-abi-v1.17",
        chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
        arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
        setPolicy: "canonical-set-policy-v1.4",
      },
      sourceIdentity: {
        strategyRevisionId: "strategy-revision:service-candidate:v1.17",
        originalSourceSha256: hash("a"),
        normalizedSourceSha256: hash("b"),
        artifactSha256: hash("c"),
      },
      budget: createRuntimeInvocationBudgetV117("soldierBrain"),
      accounting: {
        prestate:
          overrides.prestate ?? createRuntimeAbiV117ExecutionLedger(),
      },
      input: { value: kernelRequest.input as unknown as JsonValue },
      retry: {
        retryId: "retry:service-candidate:v1.17",
        attempt: 0,
        previousRequestSha256: null,
      },
    },
    candidateIdentity,
  )
}

const candidateTrace = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  overrides: Partial<RuntimeInvocationTraceV117> = {},
): RuntimeInvocationTraceV117 => ({
  ...createRuntimeInvocationTraceV117(request, [
    "ADAPTER_AUTHENTICATED",
    "PAYLOAD_CANONICAL",
  ]),
  ...overrides,
})

const candidateEvidence = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  overrides: Partial<{
    attribution: RuntimeInvocationExecutionReceiptEvidenceV117["attribution"]
    wallMilliseconds: number
    computeFuel: number
    payloadBytes: number
    stdoutBytes: number
    stderrBytes: number
    memoryBytes: number
  }> = {},
): RuntimeInvocationExecutionReceiptEvidenceV117 => {
  const prestate = request.accounting.prestate
  const deltas = {
    wallMilliseconds: overrides.wallMilliseconds ?? 1,
    computeFuel: overrides.computeFuel ?? 1,
    payloadBytes: overrides.payloadBytes ?? 1,
    stdoutBytes: overrides.stdoutBytes ?? 1,
    stderrBytes: overrides.stderrBytes ?? 0,
  }
  const counters = Object.fromEntries(
    Object.entries(deltas).map(([counter, delta]) => [
      counter,
      {
        status: "measured" as const,
        delta,
        cumulative:
          prestate.cumulative[
            counter as keyof typeof prestate.cumulative
          ] + delta,
      },
    ]),
  ) as RuntimeInvocationExecutionReceiptEvidenceV117["counters"]
  const memoryBytes = overrides.memoryBytes ?? 1
  return {
    attribution: overrides.attribution ?? "proven_strategy",
    counters,
    memory: {
      status: "measured",
      peakBytes: memoryBytes,
      cumulativePeakBytes: Math.max(
        prestate.cumulative.memoryBytes,
        memoryBytes,
      ),
    },
    process: {
      status: "verified",
      processes: 1,
      threads: 1,
      children: 0,
    },
    capabilities: {
      status: "verified",
      filesystem: "none",
      network: "disabled",
      environment: "empty",
      shell: "disabled",
    },
    cancellation: {
      status: "verified",
      terminationRequired: false,
      receiptPresent: false,
      graceMilliseconds: 0,
    },
    accountingEvidence: {
      status: "verified",
      signatureVerified: true,
      monotonic: true,
    },
  }
}

const candidateReceipt = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  evidence = candidateEvidence(request),
) => createRuntimeInvocationExecutionReceiptV117(request, evidence)

const candidateReceiptForOutcome = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  outcome: RuntimeInvocationResultV117<JsonValue>,
  evidence = candidateEvidence(request),
) => {
  if (outcome.kind !== "success") {
    return candidateReceipt(request, evidence)
  }
  const payload = encodeCanonicalJson(outcome.value, {
    context: "authenticated-outer-envelope",
  })
  if (!payload.ok) {
    throw new Error("runtime-service success fixture payload is not canonical")
  }
  const measuredCounter = (
    counter: "payloadBytes" | "stdoutBytes" | "stderrBytes",
    delta: number,
  ) => ({
    status: "measured" as const,
    delta,
    cumulative: request.accounting.prestate.cumulative[counter] + delta,
  })
  return candidateReceipt(request, {
    ...evidence,
    counters: {
      ...evidence.counters,
      payloadBytes: measuredCounter("payloadBytes", payload.bytes.byteLength),
      stdoutBytes: measuredCounter(
        "stdoutBytes",
        payload.bytes.byteLength + 1,
      ),
      stderrBytes: measuredCounter("stderrBytes", 0),
    },
  })
}

const candidatePrestateWithWallMilliseconds = (
  wallMilliseconds: number,
): RuntimeAbiV117ExecutionLedger => {
  const request = candidateRequest({
    invocationId: `invocation:service-candidate:prestate:${wallMilliseconds}`,
    kernelRequestId: `kernel-request:service-candidate:prestate:${wallMilliseconds}`,
  })
  const receipt = candidateReceipt(
    request,
    candidateEvidence(request, {
      wallMilliseconds,
      computeFuel: 0,
      payloadBytes: 0,
      stdoutBytes: 0,
      stderrBytes: 0,
      memoryBytes: 0,
    }),
  )
  const debit = debitRuntimeAbiV117Ledger(
    request.accounting.prestate,
    receipt,
  )
  if (debit.kind === "system_failure") {
    throw new Error(debit.failure.code)
  }
  return debit.ledger
}

const candidateState = (): GameState => {
  const machine = MATCH_KERNEL.createMachine({
    matchId: "match:service-candidate:v1.17",
    seed: "seed:service-candidate:v1.17",
    arenaVariant: {
      id: "arena:service-candidate:v1.17",
      name: "Service candidate v1.17",
      initialBounds: INITIAL_BOUNDS,
      terrainStones: [],
    },
    bottomPlayerId: "player:bottom",
    topPlayerId: "player:top",
    bottomStrategyRevisionId: "revision:bottom",
    topStrategyRevisionId: "revision:top",
  })
  const state = globalThis.structuredClone(machine.state)
  state.soldiers = state.soldiers.map((soldier, index) => ({
    ...soldier,
    soldierMemory: { retained: index, privateMarker: "never-public" },
  }))
  return state
}

const candidateKernelRequest = () => {
  const state = candidateState()
  const soldier = state.soldiers.find(
    (candidate) => candidate.ownerPlayerId === state.players[0].id,
  )
  if (!soldier) throw new Error("missing candidate fixture soldier")
  let machine = MATCH_KERNEL.createActivationMachineV117({
    state,
    soldierId: soldier.id,
  })
  for (let index = 0; index < 32; index += 1) {
    const stepped = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
    if (stepped.kind === "effect") return stepped.request
    if (stepped.kind === "failure" || stepped.kind === "completed") {
      throw new Error("candidate fixture failed before runtime effect")
    }
    machine = stepped.machine
  }
  throw new Error("candidate fixture did not yield a runtime effect")
}

const executeCandidateOutcome = (
  outcome: RuntimeInvocationResultV117<SoldierBrainResult>,
  request: AuthenticatedRuntimeInvocationRequestV117,
) => {
  const state = candidateState()
  const soldier = state.soldiers.find(
    (candidate) => candidate.ownerPlayerId === state.players[0].id,
  )
  if (!soldier) throw new Error("missing candidate fixture soldier")
  return MATCH_KERNEL.runActivationFromStateV117({
    state,
    soldierId: soldier.id,
    runtime: {
      selectActivations() {
        throw new Error("selection is unreachable in activation mode")
      },
      runSoldierBrain(
        _input: SoldierBrainInput,
      ) {
        return { kind: "v1_17_bound" as const, request, outcome }
      },
    },
  })
}

const arenaVariant = {
  id: "runtime-service-test-arena",
  name: "Runtime Service Test Arena",
  initialBounds: INITIAL_BOUNDS,
  terrainStones: [],
}

const passiveSource = `
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: {} }
  },
  soldierBrain() {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: {},
    }
  },
}
`

const invalidOutputSource = `
export default {
  selectActivations() {
    return { activationOrders: "not-an-array", strategyMemory: {} }
  },
  soldierBrain() {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: {},
    }
  },
}
`

const pythonTacticalSource = `
def select_activations(input):
    active = [soldier for soldier in input["mySoldiers"] if soldier["status"] == "ACTIVE"]
    return {
        "activationOrders": [
            {"soldierId": soldier["id"], "objective": {"stance": "hold"}}
            for soldier in active[: input["activationCount"]]
        ],
        "strategyMemory": input["strategyMemory"],
    }


def soldier_brain(input):
    return {
        "action": {"type": "TURN_TO_STONE"},
        "soldierMemory": input["soldierMemory"],
    }
`

const rustWasiSource = `
use std::io::{self, Read};

fn first_active_soldier_id(input: &str) -> Option<&str> {
    let soldiers_start = input.find("\\"mySoldiers\\":[")?;
    let soldiers = &input[soldiers_start..];
    let active = soldiers.find("\\"status\\":\\"ACTIVE\\"")?;
    let before_active = &soldiers[..active];
    let id_start = before_active.rfind("\\"id\\":\\"")? + "\\"id\\":\\"".len();
    let after_id = &before_active[id_start..];
    let id_end = after_id.find('"')?;
    Some(&after_id[..id_end])
}

fn main() {
    let mut input = String::new();
    let _ = io::stdin().read_to_string(&mut input);
    if input.contains("\\"methodName\\":\\"soldierBrain\\"") {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"action":{{"type":"TURN_TO_STONE"}},"soldierMemory":null}}}}"#);
    } else if let Some(soldier_id) = first_active_soldier_id(&input) {
        println!(
            r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[{{"soldierId":"{}","objective":{{"stance":"stone"}}}}],"strategyMemory":null}}}}"#,
            soldier_id
        );
    } else {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[],"strategyMemory":null}}}}"#);
    }
}
`

const zigWasiSource = `
const Iovec = extern struct { buf: [*]u8, buf_len: usize };
const Ciovec = extern struct { buf: [*]const u8, buf_len: usize };

extern "wasi_snapshot_preview1" fn fd_read(u32, *const Iovec, usize, *usize) u16;
extern "wasi_snapshot_preview1" fn fd_write(u32, *const Ciovec, usize, *usize) u16;

fn contains(haystack: []const u8, needle: []const u8) bool {
    if (needle.len == 0) return true;
    if (haystack.len < needle.len) return false;
    var index: usize = 0;
    while (index <= haystack.len - needle.len) : (index += 1) {
        var matched = true;
        var offset: usize = 0;
        while (offset < needle.len) : (offset += 1) {
            if (haystack[index + offset] != needle[offset]) {
                matched = false;
                break;
            }
        }
        if (matched) return true;
    }
    return false;
}

fn writeAll(bytes: []const u8) void {
    var written: usize = 0;
    var iov = Ciovec{ .buf = bytes.ptr, .buf_len = bytes.len };
    _ = fd_write(1, &iov, 1, &written);
}

export fn _start() void {
    var input_buf: [16384]u8 = undefined;
    var iov = Iovec{ .buf = &input_buf, .buf_len = input_buf.len };
    var nread: usize = 0;
    _ = fd_read(0, &iov, 1, &nread);
    if (contains(input_buf[0..nread], "\\"methodName\\":\\"soldierBrain\\"")) {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":null}}\\n");
    } else {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":null}}\\n");
    }
}
`

const rustWasiCompileProbe = compileRustWasmArtifact(rustWasiSource)
const zigWasiCompileProbe = compileZigWasmArtifact(zigWasiSource)

const requestFor = (
  input: {
    bottom?: StrategyRevision | undefined
    top?: StrategyRevision | undefined
  } = {},
): RuntimeExecutionServiceRequest => {
  const bottom =
    input.bottom ??
    buildStrategyRevision({
      source: passiveSource,
      strategyId: "strategy:bottom",
    })
  const top =
    input.top ??
    buildStrategyRevision({
      source: passiveSource,
      strategyId: "strategy:top",
    })
  return {
    contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
    kind: "executeMatch",
    requestId: "runtime-request:test",
    match: {
      matchId: "match:runtime-service-test",
      seed: "seed:runtime-service-test",
      arenaVariant,
      bottomPlayerId: "player:bottom",
      topPlayerId: "player:top",
      bottomStrategyRevisionId: bottom.id,
      topStrategyRevisionId: top.id,
      maxPhases: 1,
    },
    strategies: { bottom, top },
    limits: {
      ...DEFAULT_RUNTIME_LIMITS,
      timeoutMs: DEFAULT_RUNTIME_LIMITS.timeoutMs,
      stdoutBytes: 32 * 1024,
    },
    evidenceSnapshot: createFixtureRuntimeExecutionEvidenceSnapshot({
      fixtureId: "execute-match",
      bottom,
      top,
    }),
  }
}

const stringify = (value: unknown): string => JSON.stringify(value)
describe("runtime execution service", () => {
  it("keeps active-old requests on the unchanged current response route", () => {
    const response = executeRuntimeServiceRequest(requestFor(), runtimeConfig)

    expect(response.ok).toBe(true)
    if (!response.ok) throw new Error(response.systemFailure.code)
    expect(response.contractVersion).toBe(RUNTIME_EXECUTION_SERVICE_VERSION)
    expect(response.kind).toBe("executionResult")
    expect(response.result.privacy).toBe("internal_runtime_result")
    expect(response).not.toHaveProperty("profile")
    expect(response).not.toHaveProperty("counted")
    expect(response).not.toHaveProperty("publishable")
  })

  it("requires an explicit adapter unless local fallback is enabled", () => {
    expect(() => createRuntimeServiceConfig()).toThrow(
      RuntimeServiceConfigError,
    )
    expect(
      createRuntimeServiceConfig({
        allowLocalWorkerThreadFallback: true,
        semanticReceiptSecret: "fixture-semantic-receipt-secret-v1",
      }).metadata.id,
    ).toBe("worker-thread")
  })

  it("validates and executes a complete request as a schema-valid success", () => {
    const request = requestFor()
    expect(request.evidenceSnapshot.authorityBundleHash).toMatch(
      /^sha256:[0-9a-f]{64}$/u,
    )
    expect(
      Object.values(request.evidenceSnapshot.entrants).map(
        (entrant) => entrant.containmentCertificateId,
      ),
    ).toEqual([
      expect.stringContaining("fixture-only:untrusted"),
      expect.stringContaining("fixture-only:untrusted"),
    ])
    expect(
      Object.values(request.evidenceSnapshot.entrants).map(
        (entrant) => entrant.effectiveStatus,
      ),
    ).toEqual(["exhibition_only", "exhibition_only"])
    expect(
      Object.values(request.evidenceSnapshot.entrants).every(
        (entrant) => entrant.conformanceCertificateId === undefined,
      ),
    ).toBe(true)
    const response = executeRuntimeServiceRequest(request, runtimeConfig)

    expect(response.ok).toBe(true)
    if (!response.ok) {
      throw new Error(response.systemFailure.message)
    }
    expect(response.contractVersion).toBe(RUNTIME_EXECUTION_SERVICE_VERSION)
    expect(response.result.chronicle.reproducibility.matchId).toBe(
      "match:runtime-service-test",
    )
    expect(response.result.finalState.matchId).toBe(
      "match:runtime-service-test",
    )
    expect(response.result.runtimeViolationEventCount).toBe(0)
    expect(response.result.privacy).toBe("internal_runtime_result")
  })

  it("parses the shared v1.16 golden request fixture", () => {
    const fixture = JSON.parse(
      readFileSync(
        join(
          new URL("../../..", import.meta.url).pathname,
          "packages/spec/artifacts/runtime-execution-service-request.v1.16.json",
        ),
        "utf8",
      ),
    ) as unknown

    expect(RuntimeExecutionServiceRequestSchema.parse(fixture)).toEqual(fixture)
  })

  it("accepts self-play where both sides use the same immutable Strategy Revision", () => {
    const revision = buildStrategyRevision({
      source: passiveSource,
      strategyId: "strategy:self-play",
    })
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: revision, top: revision }),
      runtimeConfig,
    )

    expect(response.ok).toBe(true)
  })

  it("returns runtime violations as successful Match execution outcomes", () => {
    const badRevision = buildStrategyRevision({ source: invalidOutputSource })
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: badRevision }),
      runtimeConfig,
    )

    expect(response.ok).toBe(true)
    if (!response.ok) {
      throw new Error(response.systemFailure.message)
    }
    expect(response.result.runtimeViolationEventCount).toBeGreaterThan(0)
    expect(
      response.result.chronicle.events.some(
        (event) => event.type === "RUNTIME_VIOLATION",
      ),
    ).toBe(true)
  })

  it("executes a Python Strategy through broker selection without JS fallback", () => {
    const pythonRevision = buildPythonStrategyRevision({
      source: pythonTacticalSource,
      strategyId: "strategy:python",
    })
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: pythonRevision }),
      runtimeConfig,
    )

    expect(response.ok).toBe(true)
    if (!response.ok) {
      throw new Error(response.systemFailure.message)
    }
    expect(response.result.finalState.matchId).toBe(
      "match:runtime-service-test",
    )
    expect(response.result.runtimeViolationEventCount).toBe(0)
  }, 10_000)

  it.skipIf(!rustWasiCompileProbe.ok)(
    "executes Rust WASM artifacts through Wasmtime without source fallback",
    () => {
      const rustRevision = buildRustStrategyRevision({
        source: rustWasiSource,
        strategyId: "strategy:rust-wasi",
      })
      const response = executeRuntimeServiceRequest(
        requestFor({ bottom: rustRevision, top: rustRevision }),
        runtimeConfig,
      )

      expect(response.ok).toBe(true)
      if (!response.ok) {
        throw new Error(response.systemFailure.message)
      }
      expect(response.result.finalState.matchId).toBe(
        "match:runtime-service-test",
      )
      expect(
        response.result.chronicle.events.filter(
          (event) => event.type === "RUNTIME_VIOLATION",
        ),
      ).toEqual([])
    },
  )

  it.skipIf(!zigWasiCompileProbe.ok)(
    "executes Zig WASM artifacts through Wasmtime after compile+run proof",
    () => {
      const zigRevision = buildZigStrategyRevision({
        source: zigWasiSource,
        strategyId: "strategy:zig-wasi",
      })
      const response = executeRuntimeServiceRequest(
        requestFor({ bottom: zigRevision, top: zigRevision }),
        runtimeConfig,
      )

      expect(response.ok).toBe(true)
      if (!response.ok) {
        throw new Error(response.systemFailure.message)
      }
      expect(response.result.finalState.matchId).toBe(
        "match:runtime-service-test",
      )
      expect(response.result.runtimeViolationEventCount).toBe(0)
    },
    20_000,
  )

  it.skipIf(!rustWasiCompileProbe.ok)(
    "fails closed when a Rust WASM artifact is missing",
    () => {
      const rustRevision = buildRustStrategyRevision({
        source: rustWasiSource,
        strategyId: "strategy:rust-wasi",
      })
      const brokenRevision: StrategyRevision = {
        ...rustRevision,
        metadata: {
          ...rustRevision.metadata,
          compiledArtifact: undefined,
        },
      }
      const response = executeRuntimeServiceRequest(
        requestFor({ bottom: brokenRevision }),
        runtimeConfig,
      )

      expect(response.ok).toBe(false)
      if (response.ok) {
        throw new Error("expected missing artifact to fail")
      }
      expect(response.systemFailure.code).toBe("MALFORMED_REQUEST")
      expect(stringify(response)).not.toContain(rustWasiSource.trim())
    },
  )

  it("fails closed when broker registry metadata drifts", () => {
    const pythonRevision = buildPythonStrategyRevision({
      source: pythonTacticalSource,
      strategyId: "strategy:python",
    })
    const driftedRevision: StrategyRevision = {
      ...pythonRevision,
      runtime: {
        ...pythonRevision.runtime,
        adapter: {
          ...pythonRevision.runtime.adapter,
          version: "0.0.0-drifted",
        },
      },
    }
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: driftedRevision }),
      runtimeConfig,
    )

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected registry drift to fail")
    }
    expect(response.systemFailure.code).toBe("UNSUPPORTED_RUNTIME_ADAPTER")
    expect(stringify(response)).not.toContain("def select_activations")
  })

  it("fails closed when provider and runtime adapter disagree", () => {
    const revision = buildStrategyRevision({
      source: passiveSource,
      strategyId: "strategy:provider-mismatch",
    })
    const mismatchedRevision: StrategyRevision = {
      ...revision,
      runtime: {
        ...revision.runtime,
        adapter: {
          id: "runtime-python-subprocess-experimental",
          version: "0.1.0-experimental",
        },
      },
    }
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: mismatchedRevision }),
      runtimeConfig,
    )

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected provider mismatch to fail")
    }
    expect(response.systemFailure.code).toBe("UNSUPPORTED_RUNTIME_ADAPTER")
    expect(stringify(response)).not.toContain(passiveSource.trim())
  })

  it("fails closed when JS runtime metadata declares a different service adapter", () => {
    const revision = buildStrategyRevision({
      source: passiveSource,
      strategyId: "strategy:js-adapter-drift",
    })
    const mismatchedRevision: StrategyRevision = {
      ...revision,
      runtime: {
        ...revision.runtime,
        adapter: {
          id: "runtime-js-subprocess",
          version: revision.runtime.adapter.version,
        },
      },
    }
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: mismatchedRevision }),
      runtimeConfig,
    )

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected JS adapter drift to fail")
    }
    expect(response.systemFailure.code).toBe("UNSUPPORTED_RUNTIME_ADAPTER")
    expect(stringify(response)).not.toContain(passiveSource.trim())
  })

  it("returns a redacted systemFailure for malformed requests", () => {
    const response = executeRuntimeServiceRequest(
      {
        contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
        kind: "executeMatch",
        requestId: "runtime-request:bad",
      },
      runtimeConfig,
    )

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected malformed request to fail")
    }
    expect(response.systemFailure.code).toBe("MALFORMED_REQUEST")
    expect(stringify(response)).not.toContain("export default")
    expect(stringify(response)).not.toContain("strategyMemory")
  })

  it("fails closed when declared Strategy source hash does not match source", () => {
    const revision = buildStrategyRevision({ source: passiveSource })
    const mismatchedRevision: StrategyRevision = {
      ...revision,
      sourceHash: "not-the-real-source-hash",
      validation: {
        ...revision.validation,
        sourceHash: "not-the-real-source-hash",
      },
      metadata: {
        ...revision.metadata,
        sourceArtifact:
          revision.metadata.sourceArtifact === undefined
            ? undefined
            : {
                ...revision.metadata.sourceArtifact,
                sourceHash: "not-the-real-source-hash",
              },
      },
    }
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: mismatchedRevision }),
      runtimeConfig,
    )

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected source hash mismatch to fail")
    }
    expect(response.systemFailure.code).toBe("SOURCE_HASH_MISMATCH")
    expect(response.systemFailure.retryable).toBe(false)
    expect(stringify(response)).not.toContain(passiveSource.trim())
  })

  it("fails closed when declared Strategy source byte count does not match source", () => {
    const revision = buildStrategyRevision({ source: passiveSource })
    const mismatchedRevision: StrategyRevision = {
      ...revision,
      source: `${revision.source}\n`,
    }
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: mismatchedRevision }),
      runtimeConfig,
    )

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected source byte mismatch to fail")
    }
    expect(["SOURCE_BYTES_MISMATCH", "MALFORMED_REQUEST"]).toContain(
      response.systemFailure.code,
    )
    expect(response.systemFailure.retryable).toBe(false)
    expect(stringify(response)).not.toContain(passiveSource.trim())
  })

  it("rejects request-controlled limits above the service maximum", () => {
    const request = requestFor()
    const response = executeRuntimeServiceRequest(
      {
        ...request,
        limits: {
          ...request.limits,
          timeoutMs: request.limits.timeoutMs + 1_000_000,
        },
      },
      runtimeConfig,
    )

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected oversized limits to fail")
    }
    expect(response.systemFailure.code).toBe("MALFORMED_REQUEST")
  })

  it("redacts system failure diagnostics from execution exceptions", () => {
    const response = executeRuntimeServiceRequest(requestFor(), runtimeConfig, {
      createRuntimeForRevision() {
        throw new Error(
          `boom export default ${passiveSource} token=secret /Users/local/app.ts`,
        )
      },
    })

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected injected execution exception to fail")
    }
    const text = stringify(response)
    expect(response.systemFailure.code).toBe("EXECUTION_EXCEPTION")
    expect(text).not.toContain(passiveSource.trim())
    expect(text).not.toContain("token=secret")
    expect(text).not.toContain("/Users/local")
    expect(text).not.toContain("stack")
    expect(text).not.toContain("stderr")
  })

  it("keeps runtime-service imports and dependencies DB-free", () => {
    const appRoot = new URL("..", import.meta.url).pathname
    const srcRoot = join(appRoot, "src")
    const sourceFiles = readdirSync(srcRoot)
      .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
      .map((file) => join(srcRoot, file))
    const importLines = sourceFiles.flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => line.trimStart().startsWith("import ")),
    )
    const packageJson = JSON.parse(
      readFileSync(join(appRoot, "package.json"), "utf8"),
    ) as { dependencies?: Record<string, string> }
    const dependencyNames = Object.keys(packageJson.dependencies ?? {})

    const productionText = sourceFiles
      .map((file) => readFileSync(file, "utf8"))
      .join("\n")
    for (const forbiddenImportOrDependency of [
      "@cowards/persistence",
      "@cowards/service",
      "pg",
      "claimNextMatchJob",
      "completeMatch",
      "recordAttemptFailure",
      "createPostgresChronicleStore",
      "matchset-status",
      "governance",
      "session",
    ]) {
      expect(importLines.join("\n")).not.toContain(forbiddenImportOrDependency)
      expect(dependencyNames).not.toContain(forbiddenImportOrDependency)
    }
    for (const forbiddenAuthority of [
      "claimNextMatchJob",
      "completeMatch",
      "recordAttemptFailure",
      "createPostgresChronicleStore",
      "matchset-status",
      "MatchSet scoring",
      "public evidence",
      "retired TypeScript backend",
    ]) {
      expect(productionText).not.toContain(forbiddenAuthority)
    }
    expect(importLines.join("\n")).not.toMatch(/\bscoring\b/)
  })
})

describe("runtime execution service v1.17 candidate bridge", () => {
  it("passes one exact authenticated request and success outcome to the kernel", () => {
    const request = candidateRequest()
    const requestBytes = serializeRuntimeInvocationRequestV117(request)
    const outcome: RuntimeInvocationResultV117<SoldierBrainResult> = {
      kind: "success",
      value: {
        action: { type: "TURN_TO_STONE" },
        soldierMemory: { candidateCommitted: true },
      },
      trace: candidateTrace(request),
    }
    const authenticatedResponse =
      createAuthenticatedRuntimeInvocationResponseV117(
        request,
        outcome as unknown as RuntimeInvocationResultV117<JsonValue>,
        candidateReceiptForOutcome(
          request,
          outcome as unknown as RuntimeInvocationResultV117<JsonValue>,
        ),
        candidateIdentity,
      )
    const responseBytes = serializeRuntimeInvocationResponseV117(
      authenticatedResponse,
    )
    const observed: Uint8Array[] = []

    const result = executeCandidateRuntimeInvocationV117({
      request,
      identity: candidateIdentity,
      invoke(bytes) {
        observed.push(Uint8Array.from(bytes))
        return responseBytes
      },
      executeOutcome: executeCandidateOutcome,
    })

    expect(observed).toHaveLength(1)
    expect(Buffer.from(observed[0] ?? []).equals(Buffer.from(requestBytes))).toBe(
      true,
    )
    expect(result.internalExecution).toMatchObject({ kind: "completed" })
    expect(result.authenticatedAccounting).toEqual(
      authenticatedResponse.accounting,
    )
    expect(result.publicResult).toEqual({
      contractVersion: "runtime-invocation-v1.17",
      candidateStatus: "inactive-candidate",
      current: false,
      requestId: request.requestId,
      invocationId: request.invocationId,
      kernelRequestId: request.kernelRequestId,
      method: request.method,
      classification: "success",
    })
  })

  it.each([
    {
      name: "exact method wall boundary",
      delta: 50,
      expectedClassification: "success",
      expectedCode: undefined,
    },
    {
      name: "one over method wall boundary",
      delta: 51,
      expectedClassification: "player_violation",
      expectedCode: "TIMEOUT",
    },
  ] as const)(
    "verifies and exposes authenticated accounting at the $name",
    ({ delta, expectedClassification, expectedCode }) => {
      const request = candidateRequest()
      const evidence = candidateEvidence(request, {
        wallMilliseconds: delta,
        computeFuel: 0,
        payloadBytes: 0,
        stdoutBytes: 0,
        stderrBytes: 0,
        memoryBytes: 0,
      })
      const outcome: RuntimeInvocationResultV117<SoldierBrainResult> =
        expectedClassification === "success"
          ? {
              kind: "success",
              value: {
                action: { type: "TURN_TO_STONE" },
                soldierMemory: null,
              },
              trace: candidateTrace(request),
            }
          : {
              kind: "player_violation",
              violation: RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.TIMEOUT,
              trace: candidateTrace(request),
            }
      const authenticatedResponse =
        createAuthenticatedRuntimeInvocationResponseV117(
          request,
          outcome as RuntimeInvocationResultV117<JsonValue>,
          candidateReceiptForOutcome(
            request,
            outcome as RuntimeInvocationResultV117<JsonValue>,
            evidence,
          ),
          candidateIdentity,
        )
      const result = executeCandidateRuntimeInvocationV117({
        request,
        identity: candidateIdentity,
        invoke: () =>
          serializeRuntimeInvocationResponseV117(authenticatedResponse),
        executeOutcome: executeCandidateOutcome,
      })

      expect(result.publicResult.classification).toBe(expectedClassification)
      expect(result.publicResult.code).toBe(expectedCode)
      expect(result.authenticatedAccounting).toEqual(
        authenticatedResponse.accounting,
      )
      expect(result.authenticatedAccounting?.disposition).toBe("commit")
      expect(
        result.authenticatedAccounting?.poststate.cumulative.wallMilliseconds,
      ).toBe(delta)
    },
  )

  it.each([
    { priorWallMilliseconds: 12_950, expectedCode: undefined },
    { priorWallMilliseconds: 12_951, expectedCode: "TIMEOUT" },
  ] as const)(
    "honors signed cumulative prestate with prior wall $priorWallMilliseconds",
    ({ priorWallMilliseconds, expectedCode }) => {
      const prestate = candidatePrestateWithWallMilliseconds(
        priorWallMilliseconds,
      )
      const request = candidateRequest({ prestate })
      const evidence = candidateEvidence(request, {
        wallMilliseconds: 50,
        computeFuel: 0,
        payloadBytes: 0,
        stdoutBytes: 0,
        stderrBytes: 0,
        memoryBytes: 0,
      })
      const outcome: RuntimeInvocationResultV117<SoldierBrainResult> =
        expectedCode === undefined
          ? {
              kind: "success",
              value: {
                action: { type: "TURN_TO_STONE" },
                soldierMemory: null,
              },
              trace: candidateTrace(request),
            }
          : {
              kind: "player_violation",
              violation: RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.TIMEOUT,
              trace: candidateTrace(request),
            }
      const authenticatedResponse =
        createAuthenticatedRuntimeInvocationResponseV117(
          request,
          outcome as RuntimeInvocationResultV117<JsonValue>,
          candidateReceiptForOutcome(
            request,
            outcome as RuntimeInvocationResultV117<JsonValue>,
            evidence,
          ),
          candidateIdentity,
        )
      const result = executeCandidateRuntimeInvocationV117({
        request,
        identity: candidateIdentity,
        invoke: () =>
          serializeRuntimeInvocationResponseV117(authenticatedResponse),
        executeOutcome: executeCandidateOutcome,
      })

      expect(result.publicResult.code).toBe(expectedCode)
      expect(result.authenticatedAccounting?.disposition).toBe("commit")
      expect(
        result.authenticatedAccounting?.poststate.cumulative.wallMilliseconds,
      ).toBe(priorWallMilliseconds + 50)
      expect(result.authenticatedAccounting?.prestateSha256).toBe(
        request.accounting.prestateSha256,
      )
    },
  )

  it("keeps authenticated system failure accounting no-commit with exact prestate", () => {
    const request = candidateRequest()
    const measured = candidateEvidence(request)
    const evidence = { ...measured, attribution: "ambiguous" as const }
    const outcome: RuntimeInvocationResultV117 = {
      kind: "system_failure",
      failure: {
        code: "AMBIGUOUS_ATTRIBUTION",
        publicMessage: "Runtime system failure.",
        retryable: false,
      },
      trace: candidateTrace(request),
    }
    const authenticatedResponse =
      createAuthenticatedRuntimeInvocationResponseV117(
        request,
        outcome,
        candidateReceipt(request, evidence),
        candidateIdentity,
      )
    const result = executeCandidateRuntimeInvocationV117({
      request,
      identity: candidateIdentity,
      invoke: () =>
        serializeRuntimeInvocationResponseV117(authenticatedResponse),
      executeOutcome: executeCandidateOutcome,
    })

    expect(result.internalExecution).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        code: "AMBIGUOUS_ATTRIBUTION",
      },
    })
    expect(result.authenticatedAccounting).toMatchObject({
      disposition: "no_commit",
      poststate: request.accounting.prestate,
      idempotencyKeySha256: request.accounting.idempotencyKeySha256,
    })
    expect(JSON.stringify(result.publicResult)).not.toMatch(
      /accounting|receipt|prestate|poststate|idempotency/iu,
    )
  })

  it("replays one authenticated receipt idempotently without double debit", () => {
    const request = candidateRequest()
    const outcome: RuntimeInvocationResultV117<SoldierBrainResult> = {
      kind: "success",
      value: {
        action: { type: "TURN_TO_STONE" },
        soldierMemory: null,
      },
      trace: candidateTrace(request),
    }
    const authenticatedResponse =
      createAuthenticatedRuntimeInvocationResponseV117(
        request,
        outcome as unknown as RuntimeInvocationResultV117<JsonValue>,
        candidateReceiptForOutcome(
          request,
          outcome as unknown as RuntimeInvocationResultV117<JsonValue>,
        ),
        candidateIdentity,
      )
    const bytes = serializeRuntimeInvocationResponseV117(authenticatedResponse)
    const run = () =>
      executeCandidateRuntimeInvocationV117({
        request,
        identity: candidateIdentity,
        invoke: () => bytes,
        executeOutcome: executeCandidateOutcome,
      })

    const first = run()
    const second = run()
    expect(first.authenticatedAccounting).toEqual(
      second.authenticatedAccounting,
    )
    expect(first.authenticatedAccounting?.poststate.revision).toBe(1)
    expect(first.authenticatedAccounting?.poststate.commitments).toHaveLength(1)
    expect(first.authenticatedAccounting?.idempotencyKeySha256).toBe(
      request.accounting.idempotencyKeySha256,
    )
  })

  it("never retries a player violation or exposes discarded partial memory", () => {
    const request = candidateRequest()
    const outcome: RuntimeInvocationResultV117<SoldierBrainResult> = {
      kind: "player_violation",
      violation: RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.INVALID_OUTPUT,
      trace: candidateTrace(request),
    }
    const responseBytes = serializeRuntimeInvocationResponseV117(
      createAuthenticatedRuntimeInvocationResponseV117(
        request,
        outcome,
        candidateReceipt(request),
        candidateIdentity,
      ),
    )
    let calls = 0

    const result = executeCandidateRuntimeInvocationV117({
      request,
      identity: candidateIdentity,
      invoke() {
        calls += 1
        return responseBytes
      },
      executeOutcome: executeCandidateOutcome,
    })

    expect(calls).toBe(1)
    expect(result.internalExecution).toMatchObject({ kind: "completed" })
    expect(result.publicResult).toMatchObject({
      classification: "player_violation",
      code: "INVALID_OUTPUT",
    })
    expect(JSON.stringify(result.publicResult)).not.toContain("never-public")
    expect(JSON.stringify(result.publicResult)).not.toMatch(
      /strategyMemory|soldierMemory|objective|source|artifact|diagnostics|host/u,
    )
  })

  it.each([
    {
      name: "valid-prefix-invalid-tail",
      bytes: () =>
        Buffer.from(
          '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":{"retainedPrefix":true},"soldierMemory":null}',
        ),
      canonicalErrorCode: "DUPLICATE_KEY",
    },
    {
      name: "partial-nested-memory",
      bytes: () =>
        Buffer.from(
          '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":{"nested":',
        ),
      canonicalErrorCode: "INVALID_GRAMMAR",
    },
    {
      name: "oversized-nested-memory",
      bytes: () =>
        Buffer.from(
          `{"action":{"type":"TURN_TO_STONE"},"soldierMemory":"${"x".repeat(2_049)}"}`,
        ),
      canonicalErrorCode: undefined,
    },
    {
      name: "illegal-action",
      bytes: () =>
        Buffer.from(
          '{"action":{"direction":"UP","type":"TELEPORT"},"soldierMemory":{"attempt":"illegal"}}',
        ),
      canonicalErrorCode: undefined,
    },
  ] as const)(
    "carries the Plan-05 $name admission into one kernel-owned penalty",
    ({ name, bytes, canonicalErrorCode }) => {
      const admission = admitStrategyPayloadBytesV117(
        bytes(),
        "soldierBrain",
      )
      expect(admission).toMatchObject({
        kind: "player_violation",
        violation: { code: "INVALID_OUTPUT" },
      })
      if (admission.kind !== "player_violation") {
        throw new Error("malformed proposal unexpectedly passed Plan-05 admission")
      }
      if (canonicalErrorCode === undefined) {
        expect(admission).not.toHaveProperty("canonicalError")
      } else {
        expect(admission.canonicalError?.code).toBe(canonicalErrorCode)
      }

      const request = candidateRequest()
      const outcome: RuntimeInvocationResultV117<SoldierBrainResult> = {
        kind: "player_violation",
        violation: admission.violation,
        trace: candidateTrace(request, {
          safeCodes: [`PLAN05_${name.toUpperCase().replaceAll("-", "_")}`],
        }),
      }
      const responseBytes = serializeRuntimeInvocationResponseV117(
        createAuthenticatedRuntimeInvocationResponseV117(
          request,
          outcome,
          candidateReceipt(request),
          candidateIdentity,
        ),
      )
      const before = candidateState()
      const beforeMemories = {
        players: before.players.map(({ strategyMemory }) => strategyMemory),
        soldiers: before.soldiers.map(({ soldierMemory }) => soldierMemory),
      }

      const result = executeCandidateRuntimeInvocationV117({
        request,
        identity: candidateIdentity,
        invoke: () => responseBytes,
        executeOutcome: executeCandidateOutcome,
      })

      expect(result.internalExecution.kind).toBe("completed")
      if (
        result.internalExecution.kind !== "completed" ||
        !result.internalExecution.result
      ) {
        return
      }
      expect({
        players: result.internalExecution.result.state.players.map(
          ({ strategyMemory }) => strategyMemory,
        ),
        soldiers: result.internalExecution.result.state.soldiers.map(
          ({ soldierMemory }) => soldierMemory,
        ),
      }).toEqual(beforeMemories)
      expect(
        result.internalExecution.result.events.map(({ type }) => type),
      ).toEqual([
        "ACTIVATION_STARTED",
        "CYCLE_STARTED",
        "AWARENESS_GRID_OBSERVED",
        "RUNTIME_VIOLATION",
        "SOLDIER_STONED",
        "ACTIVATION_ENDED",
      ])
      expect(result.publicResult).toMatchObject({
        classification: "player_violation",
        code: "INVALID_OUTPUT",
      })
    },
  )

  it("makes wrong binding a no-mutation system failure with safe output", () => {
    const request = candidateRequest()
    const otherRequest = createAuthenticatedRuntimeInvocationRequestV117(
      {
        requestId: request.requestId,
        invocationId: request.invocationId,
        kernelRequestId: `${request.kernelRequestId}:other`,
        method: request.method,
        semanticTuple: {
          rules: request.semanticTuple.rules,
          engine: request.semanticTuple.engine,
          runtimeAbi: request.semanticTuple.runtimeAbi,
          chronicle: request.semanticTuple.chronicle,
          arenaCatalog: request.semanticTuple.arenaCatalog,
          setPolicy: request.semanticTuple.setPolicy,
        },
        sourceIdentity: request.sourceIdentity,
        budget: createRuntimeInvocationBudgetV117(request.method),
        accounting: { prestate: request.accounting.prestate },
        input: { value: request.input.value },
        retry: {
          retryId: request.retry.retryId,
          attempt: request.retry.attempt,
          previousRequestSha256: request.retry.previousRequestSha256,
        },
      },
      candidateIdentity,
    )
    const otherOutcome: RuntimeInvocationResultV117<SoldierBrainResult> = {
      kind: "success",
      value: {
        action: { type: "TURN_TO_STONE" },
        soldierMemory: { forged: true },
      },
      trace: candidateTrace(otherRequest),
    }
    const responseBytes = serializeRuntimeInvocationResponseV117(
      createAuthenticatedRuntimeInvocationResponseV117(
        otherRequest,
        otherOutcome as unknown as RuntimeInvocationResultV117<JsonValue>,
        candidateReceiptForOutcome(
          otherRequest,
          otherOutcome as unknown as RuntimeInvocationResultV117<JsonValue>,
        ),
        candidateIdentity,
      ),
    )

    const result = executeCandidateRuntimeInvocationV117({
      request,
      identity: candidateIdentity,
      invoke: () => responseBytes,
      executeOutcome: executeCandidateOutcome,
    })

    expect(result.internalExecution).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        code: "OUTER_FRAME_WRONG_BINDING",
      },
    })
    expect(result.publicResult).toMatchObject({
      classification: "system_failure",
      code: "OUTER_FRAME_WRONG_BINDING",
      retryable: false,
    })
    expect(JSON.stringify(result.publicResult)).not.toContain("forged")
  })

  it("pins the admitted request against adapter-side retry mutation", () => {
    const request = candidateRequest()
    const originalBytes = serializeRuntimeInvocationRequestV117(request)
    const mutated = createAuthenticatedRuntimeInvocationRequestV117(
      {
        requestId: request.requestId,
        invocationId: request.invocationId,
        kernelRequestId: request.kernelRequestId,
        method: request.method,
        semanticTuple: {
          rules: request.semanticTuple.rules,
          engine: request.semanticTuple.engine,
          runtimeAbi: request.semanticTuple.runtimeAbi,
          chronicle: request.semanticTuple.chronicle,
          arenaCatalog: request.semanticTuple.arenaCatalog,
          setPolicy: request.semanticTuple.setPolicy,
        },
        sourceIdentity: request.sourceIdentity,
        budget: createRuntimeInvocationBudgetV117(request.method),
        accounting: { prestate: request.accounting.prestate },
        input: { value: request.input.value },
        retry: {
          retryId: request.retry.retryId,
          attempt: 1,
          previousRequestSha256: sha256(originalBytes),
        },
      },
      candidateIdentity,
    )
    const mutatedOutcome: RuntimeInvocationResultV117<SoldierBrainResult> = {
      kind: "success",
      value: {
        action: { type: "TURN_TO_STONE" },
        soldierMemory: { mustNotCommit: true },
      },
      trace: candidateTrace(mutated),
    }
    const mutatedResponse = serializeRuntimeInvocationResponseV117(
      createAuthenticatedRuntimeInvocationResponseV117(
        mutated,
        mutatedOutcome as unknown as RuntimeInvocationResultV117<JsonValue>,
        candidateReceiptForOutcome(
          mutated,
          mutatedOutcome as unknown as RuntimeInvocationResultV117<JsonValue>,
        ),
        candidateIdentity,
      ),
    )

    const result = executeCandidateRuntimeInvocationV117({
      request,
      identity: candidateIdentity,
      invoke(bytes) {
        expect(Buffer.from(bytes).equals(Buffer.from(originalBytes))).toBe(true)
        Object.assign(request, mutated)
        return mutatedResponse
      },
      executeOutcome: executeCandidateOutcome,
    })

    expect(result.internalExecution).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        code: "OUTER_FRAME_WRONG_BINDING",
      },
    })
    expect(result.publicResult).toMatchObject({
      classification: "system_failure",
      code: "OUTER_FRAME_WRONG_BINDING",
    })
  })

  it("leaves retry to the caller and reuses byte-identical signed identity after adapter crash", () => {
    const request = candidateRequest()
    const expectedBytes = serializeRuntimeInvocationRequestV117(request)
    const attempts: Uint8Array[] = []
    const invoke = (bytes: Uint8Array): Uint8Array => {
      attempts.push(Uint8Array.from(bytes))
      throw new Error(
        "private adapter stack /Users/owner source token=secret stderr",
      )
    }
    const run = () =>
      executeCandidateRuntimeInvocationV117({
        request,
        identity: candidateIdentity,
        invoke,
        executeOutcome: executeCandidateOutcome,
      })

    const first = run()
    expect(attempts).toHaveLength(1)
    expect(first.internalExecution).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        code: "ADAPTER_CRASH",
        retryable: true,
      },
    })
    const second = run()
    expect(attempts).toHaveLength(2)
    for (const attempt of attempts) {
      expect(Buffer.from(attempt).equals(Buffer.from(expectedBytes))).toBe(true)
    }
    expect(first.publicResult).toEqual(second.publicResult)
    expect(JSON.stringify(first.publicResult)).not.toMatch(
      /Users|token=|stderr|stack|source|artifact|memory|objective|diagnostic/u,
    )
  })

  it("turns a non-byte adapter response into a registered no-mutation system failure", () => {
    const request = candidateRequest()

    const result = executeCandidateRuntimeInvocationV117({
      request,
      identity: candidateIdentity,
      invoke: () => null as unknown as Uint8Array,
      executeOutcome: executeCandidateOutcome,
    })

    expect(result.internalExecution).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        code: "TRANSPORT_CRASH",
        retryable: true,
      },
    })
    expect(result.publicResult).toMatchObject({
      classification: "system_failure",
      code: "TRANSPORT_CRASH",
      retryable: true,
    })
  })
})
