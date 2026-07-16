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
import * as publicPythonRuntime from "./index.js"
import {
  createCountedPythonSupervisedAdapterV118,
  createPythonAdapterBuildIdentityV118,
  createPythonRuntimeCompilerIdentityV118,
  type PythonLanguageIdentityObservationV118,
  type PythonSupervisorHostLaunchV118,
} from "./python-supervised-subprocess-adapter.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const canonicalBytes = (value: unknown): Uint8Array => {
  const encoded = encodeCanonicalJson(value as JsonValue, {
    context: "authenticated-outer-envelope",
  })
  if (!encoded.ok) throw new TypeError(encoded.error.code)
  return encoded.bytes
}

const executableIdentity = {
  pythonExecutableSha256: hash("a"),
  pythonVersion: "Python 3.13.5",
  stdlibSha256: hash("b"),
  adapterModuleSha256: hash("c"),
  pythonHostSha256: hash("d"),
  artifactSha256: hash("9"),
} as const

const execution = {
  executablePath: "/usr/local/bin/python3",
  executableBytesSha256: executableIdentity.pythonExecutableSha256,
  argv: ["-I", "/runtime/python_runtime_host.py"],
  environment: [] as const,
}

const identity = {
  supervisorBinarySha256: hash("1"),
  supervisorToolchainSha256: hash("2"),
  linuxKernelSha256: hash("3"),
  dockerEngineSha256: hash("4"),
  dockerImageDigest: hash("5"),
  cgroupDelegationSha256: hash("6"),
  adapterBuildSha256: createPythonAdapterBuildIdentityV118({
    adapterModuleSha256: executableIdentity.adapterModuleSha256,
    pythonHostSha256: executableIdentity.pythonHostSha256,
  }),
  runtimeCompilerSha256: createPythonRuntimeCompilerIdentityV118({
    pythonExecutableSha256: executableIdentity.pythonExecutableSha256,
    pythonVersion: executableIdentity.pythonVersion,
    stdlibSha256: executableIdentity.stdlibSha256,
  }),
  artifactSha256: executableIdentity.artifactSha256,
} as const

const inputBytes = canonicalBytes({
  source: "PRIVATE_PYTHON_SOURCE_POISON",
  method: "soldierBrain",
  input: {
    soldierMemory: { secret: "PRIVATE_PYTHON_MEMORY_POISON" },
    objective: { hidden: "PRIVATE_PYTHON_OBJECTIVE_POISON" },
  },
})
const payloadBytes = canonicalBytes({
  action: { type: "TURN_TO_STONE" },
  soldierMemory: {
    guestClaimedSignature: "PYTHON_GUEST_FORGED_EVIDENCE_POISON",
  },
})
const stdoutBytes = payloadBytes
const stderrBytes = new Uint8Array()

const invocation = (
  nonce = "host-nonce-v1-18-python-00000000000001",
): RuntimeInvocationRequestV118 =>
  createRuntimeInvocationRequestV118({
    requestId: "request:v1.18:python:test:0001",
    invocationId: "invocation:v1.18:python:test:0001",
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
    baselineUsageMicroseconds: 200,
    finalUsageMicroseconds: 350,
    computeFuel: 150_000,
  },
  memory: {
    peakBytes: 8192,
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
    currentPeak: 5,
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
  ): PythonSupervisorHostLaunchV118 =>
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
      languageIdentity: executableIdentity,
    }
  }

const signature = Buffer.alloc(64, 0x6b).toString("base64")

const execute = (input?: {
  launch?: PythonSupervisorHostLaunchV118
  invocation?: RuntimeInvocationRequestV118
  signer?: (bytes: Uint8Array) => {
    algorithm: "Ed25519"
    keyId: string
    signatureBase64: string
  }
  identityOverride?: Partial<PythonLanguageIdentityObservationV118>
}) => {
  const signEvidence =
    input?.signer ??
    vi.fn(() => ({
      algorithm: "Ed25519" as const,
      keyId: "runtime-evidence-key:test:python",
      signatureBase64: signature,
    }))
  const adapter = createCountedPythonSupervisedAdapterV118({
    launchSupervisor: input?.launch ?? launch(),
    signEvidence,
    execution,
    expectedLanguageIdentity: {
      ...executableIdentity,
      ...input?.identityOverride,
    },
  })
  return {
    result: adapter.execute({
      invocation: input?.invocation ?? invocation(),
      inputBytes,
      cancellationChannel: {
        channelId: "cancel-channel:v1.18:python:test:0001",
        channelNonce: "cancel-nonce-v1-18-python-00000000001",
      },
    }),
    signEvidence,
  }
}

describe("Python supervised subprocess adapter v1.18", () => {
  it("runs the fixed isolated Python host through one verified supervisor seam", () => {
    const launchSupervisor = vi.fn(launch())
    const { result } = execute({ launch: launchSupervisor })
    expect(result).toMatchObject({
      kind: "success",
      gameplayDisposition: "accept_success",
      capability: {
        kind: "certificate_candidate",
        laneId: "python",
        countedEligible: false,
      },
      signedEvidence: {
        evidence: {
          laneId: "python",
          identityPins: {
            adapterBuildSha256: identity.adapterBuildSha256,
            runtimeCompilerSha256: identity.runtimeCompilerSha256,
            artifactSha256: identity.artifactSha256,
          },
        },
      },
    })
    expect(launchSupervisor).toHaveBeenCalledTimes(1)
    const request = launchSupervisor.mock.calls[0]![0]
    expect(request.execution).toEqual(execution)
    expect(request.execution.argv).toEqual([
      "-I",
      "/runtime/python_runtime_host.py",
    ])
    expect(request.execution.environment).toEqual([])
  })

  it("signs safe hashes only and ignores guest evidence claims", () => {
    const { result, signEvidence } = execute()
    expect(result.kind).toBe("success")
    expect(signEvidence).toHaveBeenCalledTimes(1)
    const signedText = new TextDecoder().decode(
      vi.mocked(signEvidence).mock.calls[0]![0],
    )
    for (const poison of [
      "PRIVATE_PYTHON_SOURCE_POISON",
      "PRIVATE_PYTHON_MEMORY_POISON",
      "PRIVATE_PYTHON_OBJECTIVE_POISON",
      "PYTHON_GUEST_FORGED_EVIDENCE_POISON",
      "/runtime/python_runtime_host.py",
      "/usr/local/bin/python3",
    ]) {
      expect(signedText).not.toContain(poison)
      if (result.kind !== "system_failure") {
        expect(JSON.stringify(result.signedEvidence)).not.toContain(poison)
      }
    }
  })

  it("accepts exact common limits with aggregate interpreter threads and descendants", () => {
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
        receipt.cpu.finalUsageMicroseconds = 100_201
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
    "classifies proven Python N+1 %s as player-owned",
    (_name, mutate) => {
      expect(execute({ launch: launch(mutate) }).result).toMatchObject({
        kind: "player_violation",
        gameplayDisposition: "apply_player_violation",
        code: "RESOURCE_EXHAUSTION",
      })
    },
  )

  it.each([
    ["Python executable", { pythonExecutableSha256: hash("0") }],
    ["Python version", { pythonVersion: "Python 3.13.6" }],
    ["stdlib", { stdlibSha256: hash("0") }],
    ["adapter", { adapterModuleSha256: hash("0") }],
    ["host", { pythonHostSha256: hash("0") }],
    ["source artifact", { artifactSha256: hash("0") }],
  ] as const)(
    "rejects stale or substituted %s identity before launch",
    (_name, identityOverride) => {
      const launchSupervisor = vi.fn(launch())
      const { result, signEvidence } = execute({
        launch: launchSupervisor,
        identityOverride,
      })
      expect(result).toEqual({
        kind: "system_failure",
        gameplayDisposition: "no_mutation",
        code: "LANGUAGE_IDENTITY_MISMATCH",
      })
      expect(launchSupervisor).not.toHaveBeenCalled()
      expect(signEvidence).not.toHaveBeenCalled()
    },
  )

  it("rejects launch-time Python and stdlib observation drift before receipt signing", () => {
    const observedLaunch = launch()
    const { result, signEvidence } = execute({
      launch: (request) => ({
        ...observedLaunch(request),
        languageIdentity: {
          ...executableIdentity,
          stdlibSha256: hash("0"),
        },
      }),
    })
    expect(result).toEqual({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
      code: "LANGUAGE_IDENTITY_MISMATCH",
    })
    expect(signEvidence).not.toHaveBeenCalled()
  })

  it("rejects cross-lane, replayed nonce, supervisor, Docker, and cgroup evidence", () => {
    const cases: PythonSupervisorHostLaunchV118[] = [
      launch((receipt) => {
        receipt.identity.artifactSha256 = hash("0")
      }),
      launch((receipt) => {
        receipt.platform.operatingSystem = "darwin"
      }),
      launch((receipt) => {
        receipt.identity.dockerEngineSha256 = hash("0")
      }),
      launch((receipt) => {
        receipt.containment.cgroupEmpty = false
        receipt.containment.lingeringProcessCount = 1
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

    let firstRequest: SupervisorInvocationRequestV118 | undefined
    const replay: PythonSupervisorHostLaunchV118 = (request) => {
      firstRequest ??= request
      const receipt = rawReceipt(firstRequest)
      const envelope = createSupervisorRawReceiptEnvelopeV118({
        request: firstRequest,
        receipt,
        observed: { payloadBytes, stdoutBytes, stderrBytes },
      })
      return {
        rawReceiptBytes: serializeSupervisorRawReceiptEnvelopeV118(envelope),
        observed: { payloadBytes, stdoutBytes, stderrBytes },
        languageIdentity: executableIdentity,
      }
    }
    execute({ launch: replay })
    const replayed = execute({
      launch: replay,
      invocation: invocation("host-nonce-v1-18-python-00000000000002"),
    })
    expect(replayed.result).toMatchObject({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
      code: "RECEIPT_BINDING_MISMATCH",
    })
    expect(replayed.signEvidence).not.toHaveBeenCalled()
  })

  it("keeps crash, cancellation, late output, malformed transport, and invalid payload system-owned", () => {
    const invalidPayload = canonicalBytes({ action: { type: "WAIT" } })
    const cases: PythonSupervisorHostLaunchV118[] = [
      launch((receipt) => {
        receipt.lifecycle.signal = "SIGKILL"
        receipt.lifecycle.exitCode = null
      }),
      launch((receipt) => {
        receipt.lifecycle.cancellationRequested = true
        receipt.lifecycle.cancellationWinner = "host"
        receipt.lifecycle.cgroupKillUsed = true
        receipt.lifecycle.lateResultDiscarded = true
        receipt.lifecycle.exitCode = null
        receipt.attribution = "host"
      }),
      () => ({
        rawReceiptBytes: new TextEncoder().encode("{malformed"),
        observed: { payloadBytes, stdoutBytes, stderrBytes },
        languageIdentity: executableIdentity,
      }),
      (request) => {
        const receipt = rawReceipt(request)
        receipt.bytes.payloadBytes = invalidPayload.byteLength
        receipt.bytes.stdoutBytes = invalidPayload.byteLength
        const envelope = createSupervisorRawReceiptEnvelopeV118({
          request,
          receipt,
          observed: {
            payloadBytes: invalidPayload,
            stdoutBytes: invalidPayload,
            stderrBytes,
          },
        })
        return {
          rawReceiptBytes: serializeSupervisorRawReceiptEnvelopeV118(envelope),
          observed: {
            payloadBytes: invalidPayload,
            stdoutBytes: invalidPayload,
            stderrBytes,
          },
          languageIdentity: executableIdentity,
        }
      },
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

  it("fails without evidence if host signing is unavailable or malformed", () => {
    expect(
      execute({
        signer: () => {
          throw new Error("PRIVATE_PYTHON_SIGNER_DIAGNOSTIC")
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
          keyId: "runtime-evidence-key:test:python",
          signatureBase64: "bad",
        }),
      }).result,
    ).toEqual({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
      code: "EVIDENCE_SIGNING_FAILED",
    })
  })

  it("uses public workspace imports and exports no direct spawn or supervisor authority mint", () => {
    expect(publicPythonRuntime).toHaveProperty(
      "createCountedPythonSupervisedAdapterV118",
    )
    expect(publicPythonRuntime).toHaveProperty("COUNTED_PYTHON_RUNTIME_V1_18")
    for (const forbidden of [
      "createVerifiedHardenedControllerContextV118",
      "runPinnedNativeSupervisorV118",
      "createDirectPythonCountedAdapterV118",
    ]) {
      expect(publicPythonRuntime).not.toHaveProperty(forbidden)
    }
    const source = readFileSync(
      new URL("./python-supervised-subprocess-adapter.ts", import.meta.url),
      "utf8",
    )
    expect(source).not.toMatch(
      /from\s+["']node:child_process["']|\bspawn(?:Sync)?\s*\(/u,
    )
    expect(source).toContain('from "@cowards/runtime-supervisor"')
    expect(source).not.toContain("@cowards/runtime-supervisor/src/")
  })
})
