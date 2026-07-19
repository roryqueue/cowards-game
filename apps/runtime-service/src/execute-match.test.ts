import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  DEFAULT_RUNTIME_LIMITS,
  HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16,
  INITIAL_BOUNDS,
  RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256,
  RUNTIME_EXECUTION_SERVICE_VERSION,
  RUNTIME_INVOCATION_V1_17_INITIAL_EXECUTION_LEDGER_ROOT,
  RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS,
  RUNTIME_INVOCATION_V1_17_SELECTED_LIFECYCLE,
  RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  STRATEGY_RUNTIME_ABI_VERSION,
  VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
  VersionedRuntimeExecutionServiceRequestV117Schema,
  RuntimeExecutionServiceRequestSchema,
  HistoricalRuntimeExecutionServiceRequestV116Schema,
  HistoricalRuntimeExecutionServiceResponseV116Schema,
  isExactCommittedRuntimeExecutionServiceRequestV116,
  verifyHistoricalRuntimeExecutionServiceV116ProtectedBytes,
  createSelectedRuntimeInvocationRequestV117,
  createAuthenticatedRuntimeInvocationResponseV117,
  createRuntimeAbiV117ExecutionLedger,
  createRuntimeInvocationBudgetV117,
  createRuntimeInvocationExecutionReceiptV117,
  createRuntimeInvocationTraceV117,
  getRuntimeInvocationRequestAdmissionV117,
  encodeCanonicalJson,
  hashCanonicalIdentity,
  hashExecutableLaneIdentity,
  hashRuntimeIdentityManifest,
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
import {
  buildStrategyRevision,
  buildStrategyRevisionV117,
} from "@cowards/runtime-js"
import {
  buildPythonStrategyRevision,
  buildPythonStrategyRevisionV117,
} from "@cowards/runtime-python"
import {
  buildRustStrategyRevision,
  buildZigStrategyRevision,
  compileRustWasmArtifact,
  compileZigWasmArtifact,
} from "@cowards/runtime-wasm-wasi"
import {
  executeRuntimeServiceRequest as executeRuntimeServiceRequestWithAuthority,
  executeCandidateRuntimeInvocationV117,
  executePreparedRuntimeServiceRequestV117,
} from "./execute-match.js"
import {
  executeCurrentMatchServiceTestSupport,
  type CurrentMatchServiceTestOverrides,
} from "./runtime-execution-current-match.test-support.js"
import {
  bindFixtureCandidateMatchAuthorityV119,
  createFixtureRuntimeEvidenceAuthorityLoader,
  createFixtureRuntimeExecutionAuthorityContext,
  createFixtureDeploymentLaneIdentity,
  createFixtureRuntimeExecutionEvidenceSnapshot,
} from "./runtime-execution-evidence.test-support.js"
import {
  createRuntimeServiceConfig,
  RuntimeServiceConfigError,
  selectedRuntimeServiceContract,
} from "./runtime-config.js"
import { admitStrategyPayloadBytesV117 } from "./server.js"
import {
  SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_DOMAINS_V117,
  SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_PROFILE_V117,
  SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_SCHEMA_V117,
  composeSuccessorRuntimeIdentityV117,
} from "./successor-runtime-identity.js"

const runtimeConfig = createRuntimeServiceConfig({
  strategyExecutionAdapter: "worker-thread",
  semanticReceiptSecret: "fixture-semantic-receipt-secret-v1",
  resolveDeploymentLaneIdentity: createFixtureDeploymentLaneIdentity,
})

const executeRuntimeServiceRequest = (
  rawRequest: unknown,
  config = runtimeConfig,
  dependencies: CurrentMatchServiceTestOverrides = {},
) => {
  const selected = RuntimeExecutionServiceRequestSchema.safeParse(rawRequest)
  const versioned =
    VersionedRuntimeExecutionServiceRequestV117Schema.safeParse(rawRequest)
  const historical = isExactCommittedRuntimeExecutionServiceRequestV116(
    rawRequest,
  )
    ? HistoricalRuntimeExecutionServiceRequestV116Schema.safeParse(rawRequest)
    : selected
  const parsed = selected.success
    ? selected
    : versioned.success
      ? versioned
      : historical
  return executeCurrentMatchServiceTestSupport(rawRequest, config, {
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

const preparedSuccessorTemplate = (() => {
  const bindings = SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_DOMAINS_V117.map(
    (domain) => ({
      domain,
      publicId:
        domain === "canonicalJsonProfile"
          ? "canonical-json-v1.1"
          : domain === "containmentPolicy"
            ? "fixture-package-none-policy"
            : `fixture.${domain}.v1.17`,
      sha256:
        domain === "budgetProfile"
          ? RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256.slice("sha256:".length)
          : hashCanonicalIdentity(domain, [
              Buffer.from(`fixture:${domain}:v1.17`, "utf8"),
            ]),
    }),
  )
  const binding = (
    domain: (typeof SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_DOMAINS_V117)[number],
  ) => bindings.find((candidate) => candidate.domain === domain)!
  const exactPins = [
    [
      "runtimeExecutableDigest",
      `sha256:${binding("runtimeExecutable").sha256}`,
    ],
    ["reportedVersion", "fixture-runtime-v1"],
    ["targetAbi", "fixture-target-abi"],
    ["compilerFlags", hash("5")],
    ["adapterBuildDigest", `sha256:${binding("adapterBuild").sha256}`],
    [
      "standardLibraryOrSysrootDigest",
      `sha256:${binding("sysrootStdlib").sha256}`,
    ],
    ["containmentPolicyId", binding("containmentPolicy").publicId],
    ["budgetProfileSha256", RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256],
    ["canonicalJsonProfileId", "canonical-json-v1.1"],
    ["behaviorSettingsHash", hash("6")],
  ] as const
  return {
    schemaVersion: SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_SCHEMA_V117,
    profile: SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_PROFILE_V117,
    bindings,
    exactPins,
    laneProfileSha256: hash("7"),
  }
})()

const preparedSuccessorIdentity = (
  revision: StrategyRevision,
  compatibility = VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
) => {
  const deployed = createFixtureDeploymentLaneIdentity(
    revision,
    compatibility,
  )
  const composed = composeSuccessorRuntimeIdentityV117({
    revision,
    deployed,
    template: preparedSuccessorTemplate,
  })
  if (composed === undefined) throw new Error("successor identity unavailable")
  return {
    template: preparedSuccessorTemplate,
    request: {
      strategyRevisionId: revision.id,
      laneIdentityHash:
        `sha256:${hashExecutableLaneIdentity(deployed)}` as const,
      sourceIdentity: composed.sourceIdentity,
      identityManifestRoot:
        `sha256:${hashRuntimeIdentityManifest(composed.identityManifest)}` as const,
      evidenceGraphRoot: hash(revision.id.endsWith("bottom") ? "2" : "4"),
      exactPins: preparedSuccessorTemplate.exactPins,
    },
  }
}

const candidateBrainInput = (): SoldierBrainInput => {
  const self = {
    id: "soldier:service-candidate:v1.17",
    ownerPlayerId: "player:bottom",
    status: "ACTIVE" as const,
    position: { x: 5, y: 5 },
    facing: "UP" as const,
    lastSuccessfulMoveDirection: null,
  }
  const cells: SoldierBrainInput["awarenessGrid"]["cells"] = []
  for (const dy of [-2, -1, 0, 1, 2] as const) {
    for (const dx of [-2, -1, 0, 1, 2] as const) {
      cells.push({
        dx,
        dy,
        absoluteX: self.position.x + dx,
        absoluteY: self.position.y + dy,
        contents: dx === 0 && dy === 0 ? "FRIENDLY_ACTIVE" : "EMPTY",
      })
    }
  }
  return {
    self,
    awarenessGrid: { cells },
    cycleIndex: 0,
    maxCycles: 12,
    soldierMemory: {},
  }
}

const candidateRequest = (
  overrides: Partial<{
    invocationId: string
    kernelRequestId: string
    prestate: RuntimeAbiV117ExecutionLedger
  }> = {},
): AuthenticatedRuntimeInvocationRequestV117 => {
  return createSelectedRuntimeInvocationRequestV117(
    {
      requestId: "request:service-candidate:v1.17",
      invocationId:
        overrides.invocationId ?? "invocation:service-candidate:v1.17",
      kernelRequestId:
        overrides.kernelRequestId ?? "kernel-request:service-candidate:v1.17",
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
        prestate: overrides.prestate ?? createRuntimeAbiV117ExecutionLedger(),
      },
      input: { value: candidateBrainInput() as unknown as JsonValue },
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
          prestate.cumulative[counter as keyof typeof prestate.cumulative] +
          delta,
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
      stdoutBytes: measuredCounter("stdoutBytes", payload.bytes.byteLength + 1),
      stderrBytes: measuredCounter("stderrBytes", 0),
    },
  })
}

const executeCandidateOutcome = (
  outcome: RuntimeInvocationResultV117<SoldierBrainResult>,
  request: AuthenticatedRuntimeInvocationRequestV117,
) => ({ kind: "captured" as const, outcome, request })

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
        println!(r#"{{"ok":true,"abiVersion":"${STRATEGY_RUNTIME_ABI_VERSION}","value":{{"action":{{"type":"TURN_TO_STONE"}},"soldierMemory":null}}}}"#);
    } else if let Some(soldier_id) = first_active_soldier_id(&input) {
        println!(
            r#"{{"ok":true,"abiVersion":"${STRATEGY_RUNTIME_ABI_VERSION}","value":{{"activationOrders":[{{"soldierId":"{}","objective":{{"stance":"stone"}}}}],"strategyMemory":null}}}}"#,
            soldier_id
        );
    } else {
        println!(r#"{{"ok":true,"abiVersion":"${STRATEGY_RUNTIME_ABI_VERSION}","value":{{"activationOrders":[],"strategyMemory":null}}}}"#);
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
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"${STRATEGY_RUNTIME_ABI_VERSION}\\",\\"value\\":{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":null}}\\n");
    } else {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"${STRATEGY_RUNTIME_ABI_VERSION}\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":null}}\\n");
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
  return bindFixtureCandidateMatchAuthorityV119({
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
  })
}

const requestForV117 = (): RuntimeExecutionServiceRequest => {
  const bottom = buildStrategyRevisionV117({
    source: passiveSource,
    strategyId: "strategy:v117:bottom",
  })
  const top = buildStrategyRevisionV117({
    source: passiveSource,
    strategyId: "strategy:v117:top",
  })
  return {
    contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
    kind: "executeMatch",
    requestId: "runtime-request:v117:test",
    match: {
      matchId: "match:runtime-service-v117-test",
      seed: "seed:runtime-service-v117-test",
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
      stdoutBytes: 32 * 1024,
    },
    evidenceSnapshot: createFixtureRuntimeExecutionEvidenceSnapshot({
      fixtureId: "execute-match-v117",
      bottom,
      top,
      compatibility: VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
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

  it("prepares v1.17 by wrapping the actual current Match path with exact authority and ledger roots", () => {
    const currentRequest = requestForV117()
    const match = JSON.parse(JSON.stringify(currentRequest)) as JsonValue
    const bottomSuccessor = preparedSuccessorIdentity(
      currentRequest.strategies.bottom,
    )
    const topSuccessor = preparedSuccessorIdentity(
      currentRequest.strategies.top,
    )
    const bottomRoots = bottomSuccessor.request
    const topRoots = topSuccessor.request
    const preparedRuntimeConfig = createRuntimeServiceConfig({
      strategyExecutionAdapter: "worker-thread",
      semanticReceiptSecret: "fixture-semantic-receipt-secret-v1",
      resolveDeploymentLaneIdentity: (revision) =>
        createFixtureDeploymentLaneIdentity(
          revision,
          VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
        ),
      resolveSuccessorRuntimeIdentityTemplate: (revision) =>
        revision.id === currentRequest.strategies.bottom.id
          ? bottomSuccessor.template
          : revision.id === currentRequest.strategies.top.id
            ? topSuccessor.template
            : undefined,
    })
    const budgetProfileSha256 = RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256
    const ledgerPrestateRoot =
      RUNTIME_INVOCATION_V1_17_INITIAL_EXECUTION_LEDGER_ROOT
    const ledgerPoststateRoot = `sha256:${"7".repeat(64)}` as const
    const candidateRequest = {
      contractVersion: "runtime-execution-service-v1.17",
      kind: "executeMatch",
      requestId: "request:prepared-full-service:v1.17",
      matchId: currentRequest.match.matchId,
      compatibilityTupleId:
        currentRequest.evidenceSnapshot.compatibility.tupleId,
      authority: {
        bundleHash: hash("a"),
        sourceManifestHash: hash("b"),
        registryGeneration: "17",
      },
      legacyAuthority: {
        bundleHash: currentRequest.evidenceSnapshot.authorityBundleHash,
        sourceManifestHash:
          currentRequest.evidenceSnapshot.publication.sourceManifestHash,
        registryGeneration: currentRequest.evidenceSnapshot.registryGeneration,
      },
      entrants: { bottom: bottomRoots, top: topRoots },
      accounting: { budgetProfileSha256, ledgerPrestateRoot },
      match,
    } as const
    const bindings = [bottomRoots, topRoots].map((roots, index) => ({
      attestationId: `attestation:prepared:${String(index)}`,
      binding: {
        identityManifestRoot: roots.identityManifestRoot,
        evidenceGraphRoot: roots.evidenceGraphRoot,
        exactPins: roots.exactPins,
      },
    }))
    const mountedAuthority = {
      authorityBundleHash: candidateRequest.authority.bundleHash,
      registryGeneration: candidateRequest.authority.registryGeneration,
      semanticTupleManifestHash: candidateRequest.compatibilityTupleId,
      sourceManifestHash: candidateRequest.authority.sourceManifestHash,
      payload: {
        attestations: bindings,
        certificates: bindings.map(({ attestationId, binding }) => ({
          certificateId:
            currentRequest.evidenceSnapshot.entrants[
              attestationId.endsWith(":0") ? "bottom" : "top"
            ].containmentCertificateId!,
          attestationId,
          certificateKind: "containment" as const,
          binding,
        })),
      },
    }
    let executions = 0
    const dependencies = {
      authorityLoader: { load: () => mountedAuthority },
      executeCurrentMatchWithAccounting: (nested: unknown) => {
        executions += 1
        return {
          response: executeRuntimeServiceRequest(nested),
          accounting: {
            budgetProfileSha256,
            ledgerPrestateRoot,
            ledgerPoststateRoot,
          },
        }
      },
    }

    const swappedRootsRequest = {
      ...candidateRequest,
      entrants: { bottom: topRoots, top: bottomRoots },
    }
    expect(
      executePreparedRuntimeServiceRequestV117(
        swappedRootsRequest,
        preparedRuntimeConfig,
        dependencies,
      ),
    ).toMatchObject({
      ok: false,
      systemFailure: { code: "AUTHORITY_BINDING_MISMATCH" },
    })
    expect(executions).toBe(0)

    const countedContext = createFixtureRuntimeExecutionAuthorityContext({
      fixtureId: "prepared-counted-v1.17",
      bottom: currentRequest.strategies.bottom,
      top: currentRequest.strategies.top,
      effectiveStatus: "counted",
    })
    const countedMatch = bindFixtureCandidateMatchAuthorityV119({
      ...currentRequest,
      evidenceSnapshot: countedContext.evidenceSnapshot,
    })
    const countedDependencies = {
      ...dependencies,
      authorityLoader: {
        load: () => ({
          ...mountedAuthority,
          payload: {
            attestations: bindings,
            certificates: bindings.map(({ attestationId, binding }, index) => ({
              certificateId:
                countedContext.evidenceSnapshot.entrants[
                  index === 0 ? "bottom" : "top"
                ].containmentCertificateId!,
              attestationId,
              certificateKind: "containment" as const,
              binding,
            })),
          },
        }),
      },
    }
    expect(
      executePreparedRuntimeServiceRequestV117(
        {
          ...candidateRequest,
          legacyAuthority: {
            bundleHash: countedContext.evidenceSnapshot.authorityBundleHash,
            sourceManifestHash:
              countedContext.evidenceSnapshot.publication.sourceManifestHash,
            registryGeneration:
              countedContext.evidenceSnapshot.registryGeneration,
          },
          match: countedMatch as unknown as JsonValue,
        },
        preparedRuntimeConfig,
        countedDependencies,
      ),
    ).toMatchObject({
      ok: false,
      systemFailure: { code: "AUTHORITY_BINDING_MISMATCH" },
    })
    expect(executions).toBe(0)

    const response = executePreparedRuntimeServiceRequestV117(
      candidateRequest,
      preparedRuntimeConfig,
      dependencies,
    )
    expect(executions).toBe(1)
    expect(response).toMatchObject({
      contractVersion: "runtime-execution-service-v1.17",
      ok: true,
      kind: "executionResult",
      result: {
        ledgerPoststateRoot,
        semanticReceipt: {
          schemaVersion: "runtime-semantic-receipt-v1.17",
          ledgerPrestateRoot,
          ledgerPoststateRoot,
        },
      },
    })

    const mismatch = executePreparedRuntimeServiceRequestV117(
      {
        ...candidateRequest,
        authority: {
          ...candidateRequest.authority,
          sourceManifestHash: `sha256:${"8".repeat(64)}`,
        },
      },
      preparedRuntimeConfig,
      dependencies,
    )
    expect(mismatch).toMatchObject({
      ok: false,
      kind: "systemFailure",
      systemFailure: {
        classification: "system_failure",
        playerPenalty: false,
      },
    })
    expect(executions).toBe(1)
  })

  it("requires an explicit adapter unless local fallback is enabled", () => {
    expect(() => createRuntimeServiceConfig()).toThrow(
      RuntimeServiceConfigError,
    )
    const config = createRuntimeServiceConfig({
      allowLocalWorkerThreadFallback: true,
      semanticReceiptSecret: "fixture-semantic-receipt-secret-v1",
    })
    expect(config.metadata.id).toBe("worker-thread")
    expect(config.contractSelection).toEqual(selectedRuntimeServiceContract())
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

  it("keeps nested Match-shape test support outside production imports", () => {
    const sourceDirectory = new URL(".", import.meta.url).pathname
    const productionSources = readdirSync(sourceDirectory).filter(
      (name) =>
        name.endsWith(".ts") &&
        !name.endsWith(".test.ts") &&
        !name.endsWith(".test-support.ts"),
    )
    for (const source of productionSources) {
      expect(readFileSync(join(sourceDirectory, source), "utf8")).not.toContain(
        "runtime-execution-nested-match.test-support",
      )
    }
    const workerBarrel = readFileSync(
      new URL("../../../packages/runtime-js/src/worker.ts", import.meta.url),
      "utf8",
    )
    expect(workerBarrel).not.toContain(
      "createNestedMatchShapeRuntimeFromRevisionTestSupport",
    )
    const pythonBarrel = readFileSync(
      new URL("../../../packages/runtime-python/src/index.ts", import.meta.url),
      "utf8",
    )
    expect(pythonBarrel).not.toContain(
      "createPythonNestedMatchShapeRuntimeTestSupport",
    )
    expect(pythonBarrel).not.toContain(
      "runPythonNestedMatchShapeMethodSyncTestSupport",
    )
    const wasmBarrel = readFileSync(
      new URL(
        "../../../packages/runtime-wasm-wasi/src/index.ts",
        import.meta.url,
      ),
      "utf8",
    )
    expect(wasmBarrel).not.toContain(
      "createWasmWasiNestedMatchShapeRuntimeTestSupport",
    )
    expect(wasmBarrel).not.toContain(
      "runWasmWasiNestedMatchShapeMethodSyncTestSupport",
    )
  })

  it("parses the shared v1.16 golden request fixture", () => {
    const repoRoot = new URL("../../..", import.meta.url).pathname
    for (const relativePath of Object.keys(
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.protectedFiles,
    ) as Array<
      keyof typeof HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.protectedFiles
    >) {
      expect(
        verifyHistoricalRuntimeExecutionServiceV116ProtectedBytes(
          relativePath,
          readFileSync(join(repoRoot, relativePath)),
        ),
      ).toBe(true)
    }
    const fixture = JSON.parse(
      readFileSync(
        join(
          repoRoot,
          "packages/spec/artifacts/runtime-execution-service-request.v1.16.json",
        ),
        "utf8",
      ),
    ) as unknown

    expect(
      HistoricalRuntimeExecutionServiceRequestV116Schema.parse(fixture),
    ).toEqual(fixture)
    expect(isExactCommittedRuntimeExecutionServiceRequestV116(fixture)).toBe(
      true,
    )
    const response = executeRuntimeServiceRequestWithAuthority(
      fixture,
      runtimeConfig,
    )
    expect(response.ok).toBe(false)
    if (response.ok) throw new Error("historical evidence executed gameplay")
    expect(response.runtimeAbiVersion).toBe(
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeAbiVersion,
    )
    expect(response).toMatchObject({
      contractVersion:
        HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeServiceVersion,
      systemFailure: {
        code: "EVIDENCE_UNVERIFIABLE",
        retryable: true,
      },
    })
    expect(
      HistoricalRuntimeExecutionServiceResponseV116Schema.parse(response),
    ).toEqual(response)

    const committedResponse = JSON.parse(
      readFileSync(
        join(
          repoRoot,
          "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json",
        ),
        "utf8",
      ),
    ) as unknown
    const verifiedCommittedResponse =
      HistoricalRuntimeExecutionServiceResponseV116Schema.parse(
        committedResponse,
      )
    expect(verifiedCommittedResponse.ok).toBe(true)
    if (!verifiedCommittedResponse.ok) {
      throw new Error("committed historical response is not successful")
    }
    expect(verifiedCommittedResponse.result.semanticReceipt).toMatchObject({
      serviceContractVersion:
        HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeServiceVersion,
      runtimeAbiVersion:
        HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeAbiVersion,
      compatibilityTupleId:
        HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.semanticTupleId,
    })

    const uncommittedOldRequest = {
      ...(fixture as Record<string, unknown>),
      requestId: "runtime-request:uncommitted-old-abi",
    }
    expect(
      isExactCommittedRuntimeExecutionServiceRequestV116(uncommittedOldRequest),
    ).toBe(false)
    if (
      String(STRATEGY_RUNTIME_ABI_VERSION) !==
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeAbiVersion
    ) {
      expect(executeRuntimeServiceRequest(uncommittedOldRequest)).toMatchObject(
        {
          ok: false,
          systemFailure: { code: "MALFORMED_REQUEST" },
        },
      )
    }
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

  it("executes the legacy Python broker only while its Match-shaped lane is selected", () => {
    const pythonRevision = (
      String(STRATEGY_RUNTIME_ABI_VERSION) === "strategy-runtime-abi-v1.17"
        ? buildPythonStrategyRevisionV117({
            source: pythonTacticalSource,
            strategyId: "strategy:python",
          })
        : buildPythonStrategyRevision({
            source: pythonTacticalSource,
            strategyId: "strategy:python",
          })
    ) as unknown as StrategyRevision
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: pythonRevision }),
      runtimeConfig,
    )

    if (String(STRATEGY_RUNTIME_ABI_VERSION) === "strategy-runtime-abi-v1.17") {
      expect(response).toMatchObject({
        ok: false,
        kind: "systemFailure",
        systemFailure: {
          code: "MATCH_EXECUTION_FAILED",
          diagnostics: { failureCode: "ADAPTER_CRASH" },
        },
      })
      return
    }
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
      createAdmittedRuntimeForRevision() {
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
  it("passes one exact authenticated request and success outcome to the configured executor", () => {
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
    expect(
      Buffer.from(observed[0] ?? []).equals(Buffer.from(requestBytes)),
    ).toBe(true)
    expect(result.internalExecution).toMatchObject({
      kind: "captured",
      outcome: { kind: "success" },
      request,
    })
    expect(result.internalExecution.request).not.toBe(request)
    expect(result.admittedRequest).toBe(result.internalExecution.request)
    expect(Object.isFrozen(result.internalExecution.request)).toBe(true)
    expect(
      getRuntimeInvocationRequestAdmissionV117(
        result.internalExecution.request,
      ),
    ).toBeDefined()
    expect(result.authenticatedAccounting).toEqual(
      authenticatedResponse.accounting,
    )
    expect(result.publicResult).toEqual({
      contractVersion: "runtime-invocation-v1.17",
      candidateStatus:
        RUNTIME_INVOCATION_V1_17_SELECTED_LIFECYCLE.lifecycle,
      current: RUNTIME_INVOCATION_V1_17_SELECTED_LIFECYCLE.current,
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
      expectedClassification: "system_failure",
      expectedCode: "TIMEOUT",
    },
  ] as const)(
    "verifies and exposes authenticated accounting at the $name",
    ({ delta, expectedClassification, expectedCode }) => {
      const request = candidateRequest()
      const evidence = candidateEvidence(request, {
        attribution:
          expectedClassification === "success"
            ? "proven_strategy"
            : "ambiguous",
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
              kind: "system_failure",
              failure: {
                code: "TIMEOUT",
                publicMessage: "Runtime system failure.",
                retryable: false,
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
      expect(result.authenticatedAccounting?.disposition).toBe(
        expectedClassification === "success" ? "commit" : "no_commit",
      )
      expect(
        result.authenticatedAccounting?.poststate.cumulative.wallMilliseconds,
      ).toBe(expectedClassification === "success" ? delta : 0)
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
      kind: "captured",
      outcome: {
        kind: "system_failure",
        failure: { code: "AMBIGUOUS_ATTRIBUTION" },
      },
      request,
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
    expect(result.internalExecution).toMatchObject({
      kind: "captured",
      outcome: {
        kind: "player_violation",
        violation: { code: "INVALID_OUTPUT" },
      },
      request,
    })
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
    "carries the Plan-05 $name admission into one verified violation outcome",
    ({ name, bytes, canonicalErrorCode }) => {
      const admission = admitStrategyPayloadBytesV117(bytes(), "soldierBrain")
      expect(admission).toMatchObject({
        kind: "player_violation",
        violation: { code: "INVALID_OUTPUT" },
      })
      if (admission.kind !== "player_violation") {
        throw new Error(
          "malformed proposal unexpectedly passed Plan-05 admission",
        )
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
      const result = executeCandidateRuntimeInvocationV117({
        request,
        identity: candidateIdentity,
        invoke: () => responseBytes,
        executeOutcome: executeCandidateOutcome,
      })

      expect(result.internalExecution).toMatchObject({
        kind: "captured",
        outcome: {
          kind: "player_violation",
          violation: { code: "INVALID_OUTPUT" },
        },
        request,
      })
      expect(result.publicResult).toMatchObject({
        classification: "player_violation",
        code: "INVALID_OUTPUT",
      })
    },
  )

  it("makes wrong binding a no-mutation system failure with safe output", () => {
    const request = candidateRequest()
    const otherRequest = createSelectedRuntimeInvocationRequestV117(
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
      kind: "captured",
      outcome: {
        kind: "system_failure",
        failure: { code: "OUTER_FRAME_WRONG_BINDING" },
      },
      request,
    })
    expect(result.publicResult).toMatchObject({
      classification: "system_failure",
      code: "OUTER_FRAME_WRONG_BINDING",
      retryable: false,
    })
    expect(JSON.stringify(result.publicResult)).not.toContain("forged")
  })

  it("pins the immutable admitted request against adapter-side retry mutation", () => {
    const request = candidateRequest()
    const admittedSnapshot = globalThis.structuredClone(request)
    const originalBytes = serializeRuntimeInvocationRequestV117(request)
    const mutated = createSelectedRuntimeInvocationRequestV117(
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
        expect(Reflect.set(request, "retry", mutated.retry)).toBe(false)
        return mutatedResponse
      },
      executeOutcome: executeCandidateOutcome,
    })

    expect(result.internalExecution).toMatchObject({
      kind: "captured",
      outcome: {
        kind: "system_failure",
        failure: { code: "OUTER_FRAME_WRONG_BINDING" },
      },
      request: admittedSnapshot,
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
      kind: "captured",
      outcome: {
        kind: "system_failure",
        failure: { code: "ADAPTER_CRASH", retryable: true },
      },
      request,
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
      kind: "captured",
      outcome: {
        kind: "system_failure",
        failure: { code: "TRANSPORT_CRASH", retryable: true },
      },
      request,
    })
    expect(result.publicResult).toMatchObject({
      classification: "system_failure",
      code: "TRANSPORT_CRASH",
      retryable: true,
    })
  })
})
