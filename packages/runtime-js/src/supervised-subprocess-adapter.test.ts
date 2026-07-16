import { Buffer } from "node:buffer"
import { readFileSync } from "node:fs"
import {
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
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
  type SupervisorInvocationRequestV118,
} from "@cowards/runtime-supervisor"
import { describe, expect, it, vi } from "vitest"
import * as publicRuntimeJs from "./index.js"
import {
  createCountedTypeScriptSupervisedAdapterV118,
  type TypeScriptSupervisorHostLaunchV118,
} from "./supervised-subprocess-adapter.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const canonicalBytes = (value: unknown): Uint8Array => {
  const encoded = encodeCanonicalJson(value as JsonValue, {
    context: "authenticated-outer-envelope",
  })
  if (!encoded.ok) throw new TypeError(encoded.error.code)
  return encoded.bytes
}

const execution = {
  executablePath: "/usr/local/bin/node",
  executableBytesSha256: hash("a"),
  argv: ["--input-type=module", "--eval", "host-owned-harness"],
  environment: [
    { name: "LANG", value: "C.UTF-8" },
    { name: "TZ", value: "UTC" },
  ],
} as const

const identity = {
  supervisorBinarySha256: hash("1"),
  supervisorToolchainSha256: hash("2"),
  linuxKernelSha256: hash("3"),
  dockerEngineSha256: hash("4"),
  dockerImageDigest: hash("5"),
  cgroupDelegationSha256: hash("6"),
  adapterBuildSha256: hash("7"),
  runtimeCompilerSha256: hash("8"),
  artifactSha256: hash("9"),
} as const

const inputBytes = canonicalBytes({
  source: "PRIVATE_SOURCE_POISON",
  method: "soldierBrain",
  input: {
    strategyMemory: { secret: "PRIVATE_MEMORY_POISON" },
    objective: { hidden: "PRIVATE_OBJECTIVE_POISON" },
  },
})
const payloadBytes = canonicalBytes({
  action: { type: "WAIT" },
  guestClaimedSignature: "GUEST_FORGED_EVIDENCE_POISON",
})
const stdoutBytes = payloadBytes
const stderrBytes = new Uint8Array()

const invocation = (
  nonce = "host-nonce-v1-18-typescript-000000000001",
): RuntimeInvocationRequestV118 =>
  createRuntimeInvocationRequestV118({
    requestId: "request:v1.18:typescript:test:0001",
    invocationId: "invocation:v1.18:typescript:test:0001",
    method: "soldierBrain",
    hostNonce: nonce,
    monotonicDeadlineNanoseconds: 9_000_000_000,
    executable: deriveSupervisorExecutionIdentityV118(execution),
    expectedIdentity: identity,
  })

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
  budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
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
    processGroupReapedMonotonicNanoseconds: 2_000_000,
    elapsedNanoseconds: 1_000_000,
    wallMilliseconds: 1,
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
    currentPeak: 4,
    currentAfter: 0,
    eventsBefore: { max: 0 },
    eventsAfter: { max: 0 },
  },
  bytes: {
    payloadBytes: payloadBytes.byteLength,
    stdoutBytes: stdoutBytes.byteLength,
    stderrBytes: 0,
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
  identity: { ...identity },
  attribution: "proven_strategy",
})

const launch =
  (
    mutate?: (
      receipt: RuntimeSupervisorRawReceiptV118,
      request: SupervisorInvocationRequestV118,
    ) => void,
  ): TypeScriptSupervisorHostLaunchV118 =>
  (request) => {
    const receipt = rawReceipt(request)
    mutate?.(receipt, request)
    const envelope = createSupervisorRawReceiptEnvelopeV118({
      request,
      receipt,
      observed: { payloadBytes, stdoutBytes, stderrBytes },
    })
    return {
      rawReceiptBytes: serializeSupervisorRawReceiptEnvelopeV118(envelope),
      observed: { payloadBytes, stdoutBytes, stderrBytes },
    }
  }

const signature = Buffer.alloc(64, 0x5a).toString("base64")

const execute = (input?: {
  launch?: TypeScriptSupervisorHostLaunchV118
  invocation?: RuntimeInvocationRequestV118
  signer?: (bytes: Uint8Array) => {
    algorithm: "Ed25519"
    keyId: string
    signatureBase64: string
  }
}) => {
  const signEvidence =
    input?.signer ??
    vi.fn(() => ({
      algorithm: "Ed25519" as const,
      keyId: "runtime-evidence-key:test:typescript",
      signatureBase64: signature,
    }))
  const adapter = createCountedTypeScriptSupervisedAdapterV118({
    launchSupervisor: input?.launch ?? launch(),
    signEvidence,
    expectedLanguageIdentity: {
      adapterBuildSha256: identity.adapterBuildSha256,
      runtimeCompilerSha256: identity.runtimeCompilerSha256,
      artifactSha256: identity.artifactSha256,
    },
  })
  return {
    result: adapter.execute({
      invocation: input?.invocation ?? invocation(),
      inputBytes,
      execution,
      cancellationChannel: {
        channelId: "cancel-channel:v1.18:typescript:test:0001",
        channelNonce: "cancel-nonce-v1-18-typescript-000000001",
      },
    }),
    signEvidence,
  }
}

describe("TypeScript supervised subprocess adapter v1.18", () => {
  it("uses one public native-supervisor request and signs only verified evidence", () => {
    const { result, signEvidence } = execute()
    expect(result).toMatchObject({
      kind: "success",
      gameplayDisposition: "accept_success",
      capability: {
        kind: "certificate_candidate",
        laneId: "typescript",
        countedEligible: false,
      },
      signedEvidence: {
        schemaVersion: "runtime-language-evidence-signature-v1.18",
        evidence: {
          laneId: "typescript",
          runtimeAbiVersion: "strategy-runtime-abi-v1.18",
          identityPins: {
            budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
          },
        },
        signature: {
          algorithm: "Ed25519",
          keyId: "runtime-evidence-key:test:typescript",
        },
      },
    })
    expect(signEvidence).toHaveBeenCalledTimes(1)
    const signedText = new TextDecoder().decode(
      vi.mocked(signEvidence).mock.calls[0]![0],
    )
    for (const poison of [
      "PRIVATE_SOURCE_POISON",
      "PRIVATE_MEMORY_POISON",
      "PRIVATE_OBJECTIVE_POISON",
      "GUEST_FORGED_EVIDENCE_POISON",
      "/usr/local/bin/node",
      "host-owned-harness",
    ]) {
      expect(signedText).not.toContain(poison)
      expect(result.kind).not.toBe("system_failure")
      if (result.kind !== "system_failure") {
        expect(JSON.stringify(result.signedEvidence)).not.toContain(poison)
      }
    }
  })

  it("accepts exact limits and positively attributed descendants/threads", () => {
    const { result } = execute({
      launch: launch((receipt, request) => {
        receipt.wall.elapsedNanoseconds =
          request.invocation.limits.wallMilliseconds * 1_000_000
        receipt.wall.processGroupReapedMonotonicNanoseconds =
          receipt.wall.supervisedSpawnMonotonicNanoseconds +
          receipt.wall.elapsedNanoseconds
        receipt.wall.wallMilliseconds =
          request.invocation.limits.wallMilliseconds
        receipt.cpu.finalUsageMicroseconds =
          receipt.cpu.baselineUsageMicroseconds +
          request.invocation.limits.computeFuel / 1_000
        receipt.cpu.computeFuel = request.invocation.limits.computeFuel
        receipt.memory.peakBytes = request.invocation.limits.memoryMaxBytes
        receipt.pids.currentPeak = request.invocation.limits.pidsMax
      }),
    })
    expect(result.kind).toBe("success")
  })

  it.each([
    [
      "wall",
      (receipt: RuntimeSupervisorRawReceiptV118) => {
        receipt.wall.elapsedNanoseconds = 51_000_000
        receipt.wall.processGroupReapedMonotonicNanoseconds = 52_000_000
        receipt.wall.wallMilliseconds = 51
      },
    ],
    [
      "compute",
      (receipt: RuntimeSupervisorRawReceiptV118) => {
        receipt.cpu.finalUsageMicroseconds = 100_101
        receipt.cpu.computeFuel = 100_001_000
      },
    ],
    [
      "memory",
      (receipt: RuntimeSupervisorRawReceiptV118) => {
        receipt.memory.peakBytes = receipt.limits.memoryMaxBytes + 1
      },
    ],
    [
      "pids",
      (receipt: RuntimeSupervisorRawReceiptV118) => {
        receipt.pids.currentPeak = receipt.limits.pidsMax + 1
      },
    ],
  ] as const)(
    "classifies proven N+1 %s as a player violation",
    (_name, mutate) => {
      const { result } = execute({ launch: launch(mutate) })
      expect(result).toMatchObject({
        kind: "player_violation",
        gameplayDisposition: "apply_player_violation",
        code: "RESOURCE_EXHAUSTION",
      })
    },
  )

  it("fails closed without signing on replayed nonce/request evidence", () => {
    let firstRequest: SupervisorInvocationRequestV118 | undefined
    const replayLaunch: TypeScriptSupervisorHostLaunchV118 = (request) => {
      if (firstRequest === undefined) {
        firstRequest = request
      }
      const receipt = rawReceipt(firstRequest)
      const envelope = createSupervisorRawReceiptEnvelopeV118({
        request: firstRequest,
        receipt,
        observed: { payloadBytes, stdoutBytes, stderrBytes },
      })
      return {
        rawReceiptBytes: serializeSupervisorRawReceiptEnvelopeV118(envelope),
        observed: { payloadBytes, stdoutBytes, stderrBytes },
      }
    }
    execute({ launch: replayLaunch })
    const { result, signEvidence } = execute({
      launch: replayLaunch,
      invocation: invocation("host-nonce-v1-18-typescript-000000000002"),
    })
    expect(result).toMatchObject({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
      code: "RECEIPT_BINDING_MISMATCH",
    })
    expect(signEvidence).not.toHaveBeenCalled()
  })

  it.each([
    [
      "wrong platform",
      (receipt: RuntimeSupervisorRawReceiptV118) => {
        receipt.platform.operatingSystem = "darwin"
      },
    ],
    [
      "supervisor substitution",
      (receipt: RuntimeSupervisorRawReceiptV118) => {
        receipt.identity.supervisorBinarySha256 = hash("0")
      },
    ],
    [
      "stale adapter",
      (receipt: RuntimeSupervisorRawReceiptV118) => {
        receipt.identity.adapterBuildSha256 = hash("0")
      },
    ],
    [
      "unclean cgroup",
      (receipt: RuntimeSupervisorRawReceiptV118) => {
        receipt.containment.cgroupEmpty = false
        receipt.containment.lingeringProcessCount = 1
      },
    ],
  ] as const)("fails closed without a certificate on %s", (_name, mutate) => {
    const { result, signEvidence } = execute({ launch: launch(mutate) })
    expect(result).toMatchObject({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
    })
    expect(result).not.toHaveProperty("signedEvidence")
    expect(signEvidence).not.toHaveBeenCalled()
  })

  it("treats cancellation races, late output, crashes, and malformed receipts as system failures", () => {
    const cases: TypeScriptSupervisorHostLaunchV118[] = [
      launch((receipt) => {
        receipt.lifecycle.cancellationRequested = true
        receipt.lifecycle.cancellationWinner = "host"
        receipt.lifecycle.cgroupKillUsed = true
        receipt.lifecycle.lateResultDiscarded = true
        receipt.lifecycle.exitCode = null
        receipt.attribution = "host"
      }),
      launch((receipt) => {
        receipt.lifecycle.signal = "SIGKILL"
        receipt.lifecycle.exitCode = null
      }),
      () => ({
        rawReceiptBytes: new TextEncoder().encode("{malformed"),
        observed: { payloadBytes, stdoutBytes, stderrBytes },
      }),
    ]
    for (const candidate of cases) {
      const { result, signEvidence } = execute({ launch: candidate })
      expect(result).toMatchObject({
        kind: "system_failure",
        gameplayDisposition: "no_mutation",
      })
      expect(signEvidence).not.toHaveBeenCalled()
    }
  })

  it("fails closed if the host signer throws or returns a noncanonical signature", () => {
    expect(
      execute({
        signer: () => {
          throw new Error("PRIVATE_SIGNER_DIAGNOSTIC")
        },
      }).result,
    ).toEqual({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
      code: "EVIDENCE_SIGNING_FAILED",
    })
    expect(
      execute({
        signer: () => ({
          algorithm: "Ed25519",
          keyId: "runtime-evidence-key:test:typescript",
          signatureBase64: "not-canonical",
        }),
      }).result,
    ).toEqual({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
      code: "EVIDENCE_SIGNING_FAILED",
    })
  })

  it("exports only the supervised counted selector and no native authority mint", () => {
    expect(publicRuntimeJs).toHaveProperty(
      "createCountedTypeScriptSupervisedAdapterV118",
    )
    expect(publicRuntimeJs).toHaveProperty("COUNTED_TYPESCRIPT_RUNTIME_V1_18")
    for (const forbidden of [
      "createVerifiedHardenedControllerContextV118",
      "runPinnedNativeSupervisorV118",
      "createWorkerCountedAdapterV118",
      "createContainerCountedAdapterV118",
    ]) {
      expect(publicRuntimeJs).not.toHaveProperty(forbidden)
    }
    const source = readFileSync(
      new URL("./supervised-subprocess-adapter.ts", import.meta.url),
      "utf8",
    )
    expect(source).not.toMatch(
      /from\s+["']node:child_process["']|from\s+["']node:worker_threads["']|\bspawn(?:Sync)?\s*\(/u,
    )
    expect(source).toContain('from "@cowards/runtime-supervisor"')
    expect(source).not.toContain("@cowards/runtime-supervisor/src/")
  })

  it("rejects language identity drift before launch", () => {
    const launchSupervisor = vi.fn(launch())
    const adapter = createCountedTypeScriptSupervisedAdapterV118({
      launchSupervisor,
      signEvidence: () => ({
        algorithm: "Ed25519",
        keyId: "runtime-evidence-key:test:typescript",
        signatureBase64: signature,
      }),
      expectedLanguageIdentity: {
        adapterBuildSha256: hash("0"),
        runtimeCompilerSha256: identity.runtimeCompilerSha256,
        artifactSha256: identity.artifactSha256,
      },
    })
    const result = adapter.execute({
      invocation: invocation(),
      inputBytes,
      execution,
      cancellationChannel: {
        channelId: "cancel-channel:v1.18:typescript:test:0001",
        channelNonce: "cancel-nonce-v1-18-typescript-000000001",
      },
    })
    expect(result).toEqual({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
      code: "LANGUAGE_IDENTITY_MISMATCH",
    })
    expect(launchSupervisor).not.toHaveBeenCalled()
  })
})
