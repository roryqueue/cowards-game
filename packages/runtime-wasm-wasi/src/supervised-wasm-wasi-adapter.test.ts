import {
  createHash,
  generateKeyPairSync,
  sign,
  type KeyObject,
} from "node:crypto"
import { readFileSync, realpathSync } from "node:fs"
import { spawnSync } from "node:child_process"
import {
  createRuntimeInvocationRequestV118,
  encodeCanonicalJson,
  type JsonValue,
  type RuntimeInvocationRequestV118,
  type RuntimeSupervisorRawReceiptV118,
} from "@cowards/spec"
import {
  createSupervisorRawReceiptEnvelopeV118,
  deriveSupervisorExecutionIdentityV118,
  serializeSupervisorRawReceiptEnvelopeV118,
  type SupervisorExecutionDescriptorV118,
  type SupervisorInvocationRequestV118,
} from "@cowards/runtime-supervisor"
import { describe, expect, it } from "vitest"
import {
  WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18,
  createCountedWasmWasiSupervisedAdapterV118,
  createWasmWasiAdapterBuildIdentityV118,
  createWasmWasiManifestRootV118,
  createWasmWasiRuntimeCompilerIdentityV118,
  isVerifiedCountedWasmWasiSupervisedResultV118,
  type WasmWasiLanguageIdentityObservationV118,
  type WasmWasiLocalDefenseObservationV118,
} from "./supervised-wasm-wasi-adapter.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const sha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const canonicalBytes = (value: unknown): Uint8Array => {
  const encoded = encodeCanonicalJson(value as JsonValue, {
    context: "authenticated-outer-envelope",
  })
  if (!encoded.ok) throw new TypeError(encoded.error.code)
  return encoded.bytes
}

const wasmtimePath = realpathSync(
  spawnSync("sh", ["-c", "command -v wasmtime"], {
    encoding: "utf8",
  }).stdout.trim(),
)
const wasmtimeBytes = readFileSync(wasmtimePath)
const artifactPath = "/runtime/audited-rust-strategy.wasm"
const executionBase = {
  executablePath: wasmtimePath,
  executableBytesSha256: sha256(wasmtimeBytes),
  argv: [
    "run",
    "-W",
    `fuel=${WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18.fuel.maximum}`,
    "-W",
    `max-memory-size=${WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18.linearMemory.maximumBytes}`,
    "-W",
    `max-wasm-stack=${WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18.wasmStackBytes}`,
    "-W",
    "trap-on-grow-failure=y",
    artifactPath,
  ],
  environment: [],
} as const

const runtimeCompilerSha256 = createWasmWasiRuntimeCompilerIdentityV118({
  languageId: "rust",
  compilerExecutableSha256: hash("1"),
  compilerVersion: "rustc 1.95.0",
  targetTriple: "wasm32-wasip1",
  flagsSha256: hash("2"),
  sysrootSha256: hash("3"),
  wasmtimeExecutableSha256: executionBase.executableBytesSha256,
  wasmtimeVersion: "wasmtime 45.0.0",
})
const adapterBuildSha256 = createWasmWasiAdapterBuildIdentityV118({
  adapterModuleSha256: hash("4"),
  legacyAdapterSha256: hash("5"),
  supervisorContractSha256: hash("6"),
})
const artifactSha256 = hash("7")
const manifestRootSha256 = createWasmWasiManifestRootV118({
  languageId: "rust",
  sourceOriginalSha256: hash("8"),
  sourceNormalizedSha256: hash("9"),
  runtimeCompilerSha256,
  adapterBuildSha256,
  artifactSha256,
})
const languageIdentity: WasmWasiLanguageIdentityObservationV118 = {
  languageId: "rust",
  sourceOriginalSha256: hash("8"),
  sourceNormalizedSha256: hash("9"),
  compilerExecutableSha256: hash("1"),
  compilerVersion: "rustc 1.95.0",
  targetTriple: "wasm32-wasip1",
  flagsSha256: hash("2"),
  sysrootSha256: hash("3"),
  wasmtimeExecutableSha256: executionBase.executableBytesSha256,
  wasmtimeVersion: "wasmtime 45.0.0",
  adapterModuleSha256: hash("4"),
  legacyAdapterSha256: hash("5"),
  supervisorContractSha256: hash("6"),
  artifactSha256,
  manifestRootSha256,
}

const localDefense: WasmWasiLocalDefenseObservationV118 = {
  schemaVersion: "wasmtime-local-defense-observation-v1.18",
  runtimeExecutableSha256: executionBase.executableBytesSha256,
  artifactSha256,
  fuel: {
    configuredMaximum: WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18.fuel.maximum,
    unit: "wasmtime-fuel-units",
    enabled: true,
    exhausted: false,
  },
  linearMemory: {
    configuredMaximumBytes:
      WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18.linearMemory.maximumBytes,
    unit: "wasm-linear-memory-bytes",
    enabled: true,
    exhausted: false,
  },
  wasmStackBytes: WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18.wasmStackBytes,
  trapOnGrowFailure: true,
  trapKind: "none",
  usedAsCommonQuantitativeMeter: false,
}

const executionIdentity = deriveSupervisorExecutionIdentityV118(executionBase)
const expectedIdentity = {
  supervisorBinarySha256: hash("a"),
  supervisorToolchainSha256: hash("b"),
  linuxKernelSha256: hash("c"),
  dockerEngineSha256: hash("d"),
  dockerImageDigest: hash("e"),
  cgroupDelegationSha256: hash("f"),
  adapterBuildSha256,
  runtimeCompilerSha256,
  artifactSha256,
} as const

const invocation = (): RuntimeInvocationRequestV118 =>
  createRuntimeInvocationRequestV118({
    requestId: "request:v1.18:wasm:test:0001",
    invocationId: "invocation:v1.18:wasm:test:0001",
    method: "soldierBrain",
    hostNonce: "host-nonce-v1-18-wasm-000000000000000001",
    monotonicDeadlineNanoseconds: 9_000_000_000,
    executable: executionIdentity,
    expectedIdentity,
  })

const inputBytes = canonicalBytes({
  activationId: "activation:test:0001",
  initiative: "bottom",
})
const payloadBytes = canonicalBytes({
  action: { type: "TURN_TO_STONE" },
  soldierMemory: null,
})
const observed = {
  payloadBytes,
  stdoutBytes: payloadBytes,
  stderrBytes: new Uint8Array(),
}

const rawReceipt = (
  request: SupervisorInvocationRequestV118,
): RuntimeSupervisorRawReceiptV118 => ({
  schemaVersion: "runtime-supervisor-raw-receipt-v1.18",
  runtimeAbiVersion: "strategy-runtime-abi-v1.18",
  requestId: request.invocation.requestId,
  invocationId: request.invocation.invocationId,
  method: request.invocation.method,
  hostNonce: request.invocation.hostNonce,
  requestSha256: request.invocation.requestSha256,
  budgetProfileSha256: request.invocation.budgetProfileSha256,
  platform: {
    operatingSystem: "linux",
    cgroupVersion: 2,
    cgroupDriver: "cgroupfs",
    delegatedControllers: ["cpu", "memory", "pids"],
  },
  limits: request.invocation.limits,
  cgroup: request.invocation.expectedCgroup,
  wall: {
    supervisedSpawnMonotonicNanoseconds: 1_000_000,
    processGroupReapedMonotonicNanoseconds: 2_000_001,
    elapsedNanoseconds: 1_000_001,
    wallMilliseconds: 2,
  },
  cpu: {
    baselineUsageMicroseconds: 100,
    finalUsageMicroseconds: 200,
    computeFuel: 100_000,
  },
  memory: {
    peakBytes: 4096,
    eventsBefore: {
      low: 0,
      high: 0,
      max: 0,
      oom: 0,
      oomKill: 0,
      oomGroupKill: 0,
    },
    eventsAfter: {
      low: 0,
      high: 0,
      max: 0,
      oom: 0,
      oomKill: 0,
      oomGroupKill: 0,
    },
  },
  pids: {
    currentBefore: 0,
    currentPeak: 2,
    currentAfter: 0,
    eventsBefore: { max: 0 },
    eventsAfter: { max: 0 },
  },
  bytes: {
    payloadBytes: observed.payloadBytes.byteLength,
    stdoutBytes: observed.stdoutBytes.byteLength,
    stderrBytes: observed.stderrBytes.byteLength,
    payloadTruncated: false,
    stdoutTruncated: false,
    stderrTruncated: false,
  },
  lifecycle: {
    exitCode: 0,
    signal: null,
    cancellationRequested: false,
    cancellationWinner: "none",
    cgroupKillUsed: false,
    lateResultDiscarded: false,
  },
  containment: {
    processGroupIdentitySha256: request.expectedProcessGroupIdentitySha256,
    cgroupEmpty: true,
    escapedProcessCount: 0,
    lingeringProcessCount: 0,
  },
  identity: expectedIdentity,
  attribution: "proven_strategy",
})

const keys = generateKeyPairSync("ed25519")
const keyId = "runtime-evidence:test:wasm:v1.18"
const publicKeyPem = keys.publicKey
  .export({ format: "pem", type: "spki" })
  .toString()

const signEvidence = (
  bytes: Uint8Array,
  privateKey: KeyObject = keys.privateKey,
) => ({
  algorithm: "Ed25519" as const,
  keyId,
  signatureBase64: sign(null, bytes, privateKey).toString("base64"),
})

const fixture = (
  overrides: {
    languageIdentity?: WasmWasiLanguageIdentityObservationV118
    localDefense?: WasmWasiLocalDefenseObservationV118
    mutateReceipt?: (receipt: RuntimeSupervisorRawReceiptV118) => void
    execution?: SupervisorExecutionDescriptorV118
    signEvidence?: typeof signEvidence
  } = {},
) => {
  const adapter = createCountedWasmWasiSupervisedAdapterV118({
    languageId: "rust",
    execution: overrides.execution ?? executionBase,
    expectedLanguageIdentity: languageIdentity,
    launchSupervisor(request) {
      const receipt = rawReceipt(request)
      overrides.mutateReceipt?.(receipt)
      const envelope = createSupervisorRawReceiptEnvelopeV118({
        request,
        receipt,
        observed,
      })
      return {
        rawReceiptBytes: serializeSupervisorRawReceiptEnvelopeV118(envelope),
        observed,
        languageIdentity: overrides.languageIdentity ?? languageIdentity,
        localDefense: overrides.localDefense ?? localDefense,
      }
    },
    signEvidence: overrides.signEvidence ?? signEvidence,
    evidenceSigningPublicKeyPem: publicKeyPem,
    expectedSigningKeyId: keyId,
  })
  return adapter.execute({
    invocation: invocation(),
    inputBytes,
    cancellationChannel: {
      channelId: "cancel-channel:v1.18:wasm:0001",
      channelNonce: "cancel-nonce-v1-18-wasm-00000000000001",
    },
  })
}

describe("supervised Rust/Zig Wasmtime adapter v1.18", () => {
  it("accepts complete common evidence and signs separate local defense evidence", () => {
    const result = fixture()
    expect(result).toMatchObject({
      kind: "success",
      gameplayDisposition: "accept_success",
      capability: {
        kind: "certificate_candidate",
        laneId: "rust",
        countedEligible: false,
      },
      signedEvidence: {
        evidence: {
          laneId: "rust",
          localDefense: {
            usedAsCommonQuantitativeMeter: false,
          },
        },
      },
    })
    expect(isVerifiedCountedWasmWasiSupervisedResultV118(result)).toBe(true)
    expect(
      isVerifiedCountedWasmWasiSupervisedResultV118(
        globalThis.structuredClone(result),
      ),
    ).toBe(false)
    if (result.kind !== "success") throw new Error("expected success")
    expect(result.signedEvidence.evidence.commonMeter.result).toMatchObject({
      kind: "success",
      evidence: { computeFuel: 100_000 },
    })
    expect(result.signedEvidence.evidence.localDefense.fuel.unit).toBe(
      "wasmtime-fuel-units",
    )
  })

  it("fails closed when local fuel is substituted for the common compute meter", () => {
    expect(
      fixture({
        localDefense: {
          ...localDefense,
          usedAsCommonQuantitativeMeter: true,
        },
      }),
    ).toEqual({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
      code: "WASMTIME_METER_SUBSTITUTION",
    })
  })

  it("rejects missing, stale, contradictory, or cross-lane local evidence", () => {
    for (const mutation of [
      { ...localDefense, fuel: { ...localDefense.fuel, enabled: false } },
      {
        ...localDefense,
        linearMemory: {
          ...localDefense.linearMemory,
          configuredMaximumBytes:
            localDefense.linearMemory.configuredMaximumBytes + 1,
        },
      },
      { ...localDefense, artifactSha256: hash("0") },
      { ...localDefense, trapKind: "fuel_exhausted" as const },
    ]) {
      expect(fixture({ localDefense: mutation })).toMatchObject({
        kind: "system_failure",
        gameplayDisposition: "no_mutation",
      })
    }
    expect(
      fixture({
        languageIdentity: {
          ...languageIdentity,
          languageId: "zig",
          targetTriple: "wasm32-wasi",
        },
      }),
    ).toMatchObject({
      kind: "system_failure",
      code: "LANGUAGE_IDENTITY_MISMATCH",
    })
    expect(
      fixture({
        localDefense: {
          ...localDefense,
          diagnostics: "PRIVATE_DIAGNOSTICS_POISON",
        } as WasmWasiLocalDefenseObservationV118,
      }),
    ).toEqual({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
      code: "WASMTIME_DEFENSE_INCOMPLETE",
    })
  })

  it("rejects stale source/compiler/sysroot/artifact/manifest and alternate supervisor identity", () => {
    for (const mutation of [
      { ...languageIdentity, sourceNormalizedSha256: hash("0") },
      { ...languageIdentity, compilerExecutableSha256: hash("0") },
      { ...languageIdentity, sysrootSha256: hash("0") },
      { ...languageIdentity, artifactSha256: hash("0") },
      { ...languageIdentity, manifestRootSha256: hash("0") },
    ]) {
      expect(fixture({ languageIdentity: mutation })).toEqual({
        kind: "system_failure",
        gameplayDisposition: "no_mutation",
        code: "LANGUAGE_IDENTITY_MISMATCH",
      })
    }
    expect(
      fixture({
        mutateReceipt(receipt) {
          receipt.identity.supervisorBinarySha256 = hash("0")
        },
      }),
    ).toMatchObject({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
    })
  })

  it("requires the exact Wasmtime command, local limits, artifact path, and empty environment", () => {
    expect(
      fixture({
        execution: {
          ...executionBase,
          argv: [...executionBase.argv.slice(0, -1), "/runtime/other.wasm"],
        },
      }),
    ).toEqual({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
      code: "WASMTIME_EXECUTION_INVALID",
    })
    expect(
      fixture({
        execution: {
          ...executionBase,
          environment: [{ name: "HOME", value: "/private" }],
        },
      }),
    ).toEqual({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
      code: "WASMTIME_EXECUTION_INVALID",
    })
  })

  it("keeps supervisor launch, malformed receipt, cancellation, and trap failures no-mutation", () => {
    expect(
      fixture({
        mutateReceipt(receipt) {
          receipt.lifecycle.cancellationRequested = true
          receipt.lifecycle.cancellationWinner = "ambiguous"
          receipt.lifecycle.cgroupKillUsed = true
          receipt.lifecycle.lateResultDiscarded = true
        },
      }),
    ).toMatchObject({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
    })
    expect(
      fixture({
        localDefense: {
          ...localDefense,
          trapKind: "other",
        },
      }),
    ).toMatchObject({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
      code: "WASMTIME_TRAP_UNRESOLVED",
    })
  })

  it("accepts exact common N and rejects N+1 only through common host evidence", () => {
    const exact = fixture({
      mutateReceipt(receipt) {
        receipt.cpu.finalUsageMicroseconds =
          receipt.cpu.baselineUsageMicroseconds +
          receipt.limits.computeFuel / 1_000
        receipt.cpu.computeFuel = receipt.limits.computeFuel
      },
    })
    expect(exact.kind).toBe("success")

    const over = fixture({
      mutateReceipt(receipt) {
        receipt.cpu.finalUsageMicroseconds =
          receipt.cpu.baselineUsageMicroseconds +
          receipt.limits.computeFuel / 1_000 +
          1
        receipt.cpu.computeFuel = receipt.limits.computeFuel + 1_000
      },
    })
    expect(over).toMatchObject({
      kind: "player_violation",
      code: "RESOURCE_EXHAUSTION",
      dimensions: ["computeFuel"],
    })
  })

  it("verifies the host signature and exposes no raw receipt, paths, source, or diagnostics", () => {
    const otherKeys = generateKeyPairSync("ed25519")
    expect(
      fixture({
        signEvidence(bytes) {
          return signEvidence(bytes, otherKeys.privateKey)
        },
      }),
    ).toEqual({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
      code: "EVIDENCE_SIGNING_FAILED",
    })
    const result = fixture()
    expect(JSON.stringify(result)).not.toContain("rawReceiptBytes")
    expect(JSON.stringify(result)).not.toContain(artifactPath)
    expect(JSON.stringify(result)).not.toContain("sourceOriginal")
    expect(JSON.stringify(result)).not.toContain("PRIVATE_")
  })
})
