import { describe, expect, it } from "vitest"
import {
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  getRuntimeInvocationLimitsV118,
} from "./runtime-budget-profile-v1-18.js"
import {
  RuntimeInvocationRequestV118Schema,
  RuntimeSupervisorRawReceiptV118Schema,
  createRuntimeInvocationRequestV118,
  evaluateRuntimeSupervisorReceiptV118,
  serializeRuntimeInvocationRequestV118,
  type CreateRuntimeInvocationRequestV118Input,
  type RuntimeSupervisorRawReceiptV118,
} from "./runtime-invocation-v1-18.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

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

const requestInput = (
  method: "selectActivations" | "soldierBrain" = "soldierBrain",
): CreateRuntimeInvocationRequestV118Input => ({
  requestId: "request:v1.18:test:0001",
  invocationId: "invocation:v1.18:test:0001",
  method,
  hostNonce: "nonce-v1-18-000000000000000000000001",
  monotonicDeadlineNanoseconds: 9_000_000_000,
  executable: {
    executableSha256: hash("a"),
    argvSha256: hash("b"),
    environmentPolicySha256: hash("c"),
  },
  expectedIdentity: identity,
})

const validReceipt = (
  method: "selectActivations" | "soldierBrain" = "soldierBrain",
): RuntimeSupervisorRawReceiptV118 => {
  const request = createRuntimeInvocationRequestV118(requestInput(method))
  const limits = request.limits
  return {
    schemaVersion: "runtime-supervisor-raw-receipt-v1.18",
    runtimeAbiVersion: "strategy-runtime-abi-v1.18",
    requestId: request.requestId,
    invocationId: request.invocationId,
    method,
    hostNonce: request.hostNonce,
    requestSha256: request.requestSha256,
    budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
    platform: {
      operatingSystem: "linux",
      cgroupVersion: 2,
      cgroupDriver: "cgroupfs",
      delegatedControllers: ["cpu", "memory", "pids"],
    },
    limits,
    cgroup: {
      pathIdentitySha256: hash("d"),
      settingsSha256: identity.cgroupDelegationSha256,
    },
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
      peakBytes: limits.memoryMaxBytes,
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
      currentPeak: limits.pidsMax,
      currentAfter: 0,
      eventsBefore: { max: 0 },
      eventsAfter: { max: 0 },
    },
    bytes: {
      payloadBytes: limits.payloadBytes,
      stdoutBytes: limits.stdoutBytes,
      stderrBytes: limits.stderrBytes,
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
      processGroupIdentitySha256: hash("f"),
      cgroupEmpty: true,
      escapedProcessCount: 0,
      lingeringProcessCount: 0,
    },
    identity,
    attribution: "proven_strategy",
  }
}

const clone = <T>(value: T): T => structuredClone(value)

describe("runtime invocation v1.18", () => {
  it("creates one closed canonical request bound to exact limits and identity", () => {
    const request = createRuntimeInvocationRequestV118(requestInput())
    expect(RuntimeInvocationRequestV118Schema.parse(request)).toEqual(request)
    expect(request).toMatchObject({
      schemaVersion: "runtime-invocation-request-v1.18",
      runtimeAbiVersion: "strategy-runtime-abi-v1.18",
      budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
      limits: getRuntimeInvocationLimitsV118("soldierBrain"),
      expectedIdentity: identity,
    })
    expect(request.requestSha256).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(serializeRuntimeInvocationRequestV118(request)).toEqual(
      serializeRuntimeInvocationRequestV118(request),
    )
    expect(Object.isFrozen(request)).toBe(true)
    expect(Object.isFrozen(request.expectedIdentity)).toBe(true)
  })

  it("accepts exact ceilings with complete Linux cgroup-v2 evidence", () => {
    const request = createRuntimeInvocationRequestV118(requestInput())
    const receipt = validReceipt()
    expect(RuntimeSupervisorRawReceiptV118Schema.parse(receipt)).toEqual(receipt)
    expect(evaluateRuntimeSupervisorReceiptV118(request, receipt)).toEqual({
      kind: "success",
      gameplayDisposition: "accept_success",
      evidence: expect.objectContaining({
        requestSha256: request.requestSha256,
        computeFuel: 100_000,
        wallMilliseconds: 1,
        memoryPeakBytes: request.limits.memoryMaxBytes,
        pidsPeak: request.limits.pidsMax,
      }),
    })
  })

  it.each([
    "wallMilliseconds",
    "computeFuel",
    "memoryPeakBytes",
    "pids",
    "payloadBytes",
    "stdoutBytes",
    "stderrBytes",
  ] as const)("classifies exact N+1 %s only from proven Strategy evidence", (dimension) => {
    const request = createRuntimeInvocationRequestV118(requestInput())
    const receipt = clone(validReceipt())
    if (dimension === "wallMilliseconds") {
      receipt.wall.elapsedNanoseconds =
        (request.limits.wallMilliseconds + 1) * 1_000_000
      receipt.wall.processGroupReapedMonotonicNanoseconds =
        receipt.wall.supervisedSpawnMonotonicNanoseconds +
        receipt.wall.elapsedNanoseconds
      receipt.wall.wallMilliseconds = request.limits.wallMilliseconds + 1
    } else if (dimension === "computeFuel") {
      receipt.cpu.finalUsageMicroseconds =
        receipt.cpu.baselineUsageMicroseconds +
        request.limits.computeFuel / 1000 +
        1
      receipt.cpu.computeFuel = request.limits.computeFuel + 1000
    } else if (dimension === "memoryPeakBytes") {
      receipt.memory.peakBytes = request.limits.memoryMaxBytes + 1
      receipt.memory.eventsAfter.max = 1
    } else if (dimension === "pids") {
      receipt.pids.currentPeak = request.limits.pidsMax + 1
      receipt.pids.eventsAfter.max = 1
    } else if (dimension === "payloadBytes") {
      receipt.bytes.payloadBytes = request.limits.payloadBytes + 1
    } else if (dimension === "stdoutBytes") {
      receipt.bytes.stdoutBytes = request.limits.stdoutBytes + 1
    } else {
      receipt.bytes.stderrBytes = request.limits.stderrBytes + 1
    }
    const result = evaluateRuntimeSupervisorReceiptV118(request, receipt)
    expect(result).toMatchObject({
      kind: "player_violation",
      gameplayDisposition: "apply_player_violation",
      code: "RESOURCE_EXHAUSTION",
      dimensions: [dimension],
    })

    receipt.attribution = "ambiguous"
    expect(evaluateRuntimeSupervisorReceiptV118(request, receipt)).toEqual({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
      code: "RESOURCE_ATTRIBUTION_UNPROVEN",
    })
  })

  it("never accepts a truncated success at or beyond a byte ceiling", () => {
    const request = createRuntimeInvocationRequestV118(requestInput())
    for (const field of [
      "payloadTruncated",
      "stdoutTruncated",
      "stderrTruncated",
    ] as const) {
      const receipt = clone(validReceipt())
      receipt.bytes[field] = true
      expect(evaluateRuntimeSupervisorReceiptV118(request, receipt)).toEqual({
        kind: "system_failure",
        gameplayDisposition: "no_mutation",
        code: "TRUNCATED_CAPTURE",
      })
    }
  })

  it.each([
    ["hostNonce", "nonce-v1-18-substituted-0001"],
    ["requestSha256", hash("0")],
    ["budgetProfileSha256", hash("0")],
    ["method", "selectActivations"],
  ] as const)("fails closed on %s substitution", (field, replacement) => {
    const request = createRuntimeInvocationRequestV118(requestInput())
    const receipt = clone(validReceipt()) as unknown as Record<string, unknown>
    receipt[field] = replacement
    expect(
      evaluateRuntimeSupervisorReceiptV118(
        request,
        receipt as unknown as RuntimeSupervisorRawReceiptV118,
      ),
    ).toEqual({
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
      code: "REQUEST_BINDING_MISMATCH",
    })
  })

  it("fails closed on identity, limits, platform, controller, and cgroup drift", () => {
    const request = createRuntimeInvocationRequestV118(requestInput())
    const mutations: Array<(receipt: RuntimeSupervisorRawReceiptV118) => void> =
      [
        (receipt) => {
          receipt.identity.supervisorBinarySha256 = hash("0")
        },
        (receipt) => {
          ;(receipt.limits as { memoryMaxBytes: number }).memoryMaxBytes += 1
        },
        (receipt) => {
          receipt.platform.operatingSystem = "darwin"
        },
        (receipt) => {
          receipt.platform.delegatedControllers = ["cpu", "memory"]
        },
        (receipt) => {
          receipt.containment.cgroupEmpty = false
          receipt.containment.lingeringProcessCount = 1
        },
      ]
    for (const mutate of mutations) {
      const receipt = clone(validReceipt())
      mutate(receipt)
      const result = evaluateRuntimeSupervisorReceiptV118(request, receipt)
      expect(result).toMatchObject({
        kind: "system_failure",
        gameplayDisposition: "no_mutation",
      })
    }
  })

  it("rejects counter, event, exit, and cancellation contradictions", () => {
    const request = createRuntimeInvocationRequestV118(requestInput())
    const mutations: Array<(receipt: RuntimeSupervisorRawReceiptV118) => void> =
      [
        (receipt) => {
          receipt.cpu.computeFuel += 1
        },
        (receipt) => {
          receipt.wall.wallMilliseconds += 1
        },
        (receipt) => {
          receipt.memory.eventsBefore.oom = 1
          receipt.memory.eventsAfter.oom = 0
        },
        (receipt) => {
          receipt.lifecycle.signal = "SIGKILL"
        },
        (receipt) => {
          receipt.lifecycle.cancellationRequested = true
          receipt.lifecycle.cancellationWinner = "host"
        },
      ]
    for (const mutate of mutations) {
      const receipt = clone(validReceipt())
      mutate(receipt)
      expect(evaluateRuntimeSupervisorReceiptV118(request, receipt)).toEqual(
        expect.objectContaining({
          kind: "system_failure",
          gameplayDisposition: "no_mutation",
        }),
      )
    }
  })

  it("rejects noncanonical, overflow, negative, and gameplay-bearing receipts", () => {
    const request = createRuntimeInvocationRequestV118(requestInput())
    const malformed = clone(validReceipt()) as unknown as Record<string, unknown>
    malformed.gameplay = { strategyMemory: { private: true } }
    expect(RuntimeSupervisorRawReceiptV118Schema.safeParse(malformed).success).toBe(
      false,
    )

    const negative = clone(validReceipt())
    negative.cpu.baselineUsageMicroseconds = -1
    expect(RuntimeSupervisorRawReceiptV118Schema.safeParse(negative).success).toBe(
      false,
    )

    const overflow = clone(validReceipt())
    overflow.wall.processGroupReapedMonotonicNanoseconds =
      Number.MAX_SAFE_INTEGER + 1
    expect(RuntimeSupervisorRawReceiptV118Schema.safeParse(overflow).success).toBe(
      false,
    )
  })
})
