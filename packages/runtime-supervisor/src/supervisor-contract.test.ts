import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  createRuntimeInvocationRequestV118,
  encodeCanonicalJson,
  type JsonValue,
  type RuntimeInvocationRequestV118,
  type RuntimeSupervisorRawReceiptV118,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import {
  createSupervisorInvocationRequestV118,
  createSupervisorRawReceiptEnvelopeV118,
  deriveSupervisorExecutionIdentityV118,
  isVerifiedSupervisorEvidenceV118,
  parseSupervisorInvocationRequestV118,
  serializeSupervisorInvocationRequestV118,
  serializeSupervisorRawReceiptEnvelopeV118,
  verifySupervisorRawReceiptV118,
  type SupervisorInvocationRequestV118,
  type SupervisorRawReceiptEnvelopeV118,
} from "./supervisor-contract.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const execution = {
  executablePath: "/usr/local/bin/node",
  argv: ["--no-warnings", "/runtime/strategy-runner.mjs"],
  environment: [
    { name: "LANG", value: "C.UTF-8" },
    { name: "TZ", value: "UTC" },
  ],
} as const

const executionIdentity = deriveSupervisorExecutionIdentityV118(execution)

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

const canonicalBytes = (value: unknown): Uint8Array => {
  const encoded = encodeCanonicalJson(value as JsonValue, {
    context: "authenticated-outer-envelope",
  })
  if (!encoded.ok) throw new TypeError(encoded.error.code)
  return encoded.bytes
}

const clone = <T>(value: T): T => globalThis.structuredClone(value)

const invocation = (
  hostNonce = "host-nonce-v1-18-00000000000000000001",
): RuntimeInvocationRequestV118 =>
  createRuntimeInvocationRequestV118({
    requestId: "request:v1.18:supervisor:test:0001",
    invocationId: "invocation:v1.18:supervisor:test:0001",
    method: "soldierBrain",
    hostNonce,
    monotonicDeadlineNanoseconds: 9_000_000_000,
    executable: {
      executableSha256: executionIdentity.executableSha256,
      argvSha256: executionIdentity.argvSha256,
      environmentPolicySha256: executionIdentity.environmentPolicySha256,
    },
    expectedIdentity: identity,
  })

const inputBytes = canonicalBytes({
  activationId: "activation:test:0001",
  initiative: "bottom",
})
const payloadBytes = canonicalBytes({ action: { type: "WAIT" } })
const stdoutBytes = Uint8Array.from(["S".charCodeAt(0), ...payloadBytes])
const stderrBytes = new TextEncoder().encode("guest-safe-error")

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
  cgroup: {
    pathIdentitySha256: request.invocation.expectedCgroup.pathIdentitySha256,
    settingsSha256: request.invocation.expectedCgroup.settingsSha256,
  },
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
    payloadBytes: payloadBytes.byteLength,
    stdoutBytes: stdoutBytes.byteLength,
    stderrBytes: stderrBytes.byteLength,
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
})

const fixture = (): {
  request: SupervisorInvocationRequestV118
  receipt: RuntimeSupervisorRawReceiptV118
  envelope: SupervisorRawReceiptEnvelopeV118
  rawReceiptBytes: Uint8Array
} => {
  const request = createSupervisorInvocationRequestV118({
    invocation: invocation(),
    inputBytes,
    execution,
    cancellationChannel: {
      channelId: "cancel-channel:v1.18:test:0001",
      channelNonce: "cancel-nonce-v1-18-000000000000000001",
    },
  })
  const receipt = rawReceipt(request)
  receipt.containment.processGroupIdentitySha256 =
    request.expectedProcessGroupIdentitySha256
  const envelope = createSupervisorRawReceiptEnvelopeV118({
    request,
    receipt,
    observed: { payloadBytes, stdoutBytes, stderrBytes },
  })
  return {
    request,
    receipt,
    envelope,
    rawReceiptBytes: serializeSupervisorRawReceiptEnvelopeV118(envelope),
  }
}

const expectFailure = (
  result: Readonly<{
    ok: boolean
    gameplayDisposition?: string
    code?: string
  }>,
  code?: string,
): void => {
  expect(result).toMatchObject({
    ok: false,
    gameplayDisposition: "no_mutation",
    ...(code === undefined ? {} : { code }),
  })
}

const canonicalSha256 = (value: unknown): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(canonicalBytes(value)).digest("hex")}`

const recomputeSupervisorRequestHash = (
  request: SupervisorInvocationRequestV118,
): void => {
  const mutable = request as unknown as Record<string, unknown>
  const { supervisorRequestSha256: _ignored, ...body } = mutable
  mutable.supervisorRequestSha256 = canonicalSha256(body)
}

const setOverLimitWall = (
  receipt: RuntimeSupervisorRawReceiptV118,
  request: SupervisorInvocationRequestV118,
): void => {
  receipt.wall.elapsedNanoseconds =
    (request.invocation.limits.wallMilliseconds + 1) * 1_000_000
  receipt.wall.processGroupReapedMonotonicNanoseconds =
    receipt.wall.supervisedSpawnMonotonicNanoseconds +
    receipt.wall.elapsedNanoseconds
  receipt.wall.wallMilliseconds = request.invocation.limits.wallMilliseconds + 1
}

describe("shared runtime supervisor v1.18 contract", () => {
  it("creates and parses one canonical request bound to input and cancellation", () => {
    const request = fixture().request
    const bytes = serializeSupervisorInvocationRequestV118(request)
    const parsed = parseSupervisorInvocationRequestV118(bytes)
    expect(parsed).toEqual({ ok: true, value: request })
    expect(request.input.byteLength).toBe(inputBytes.byteLength)
    expect(request.input.sha256).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(request.supervisorRequestSha256).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(Object.isFrozen(request)).toBe(true)
    expect(Object.isFrozen(request.invocation)).toBe(true)

    const changedNonce = createSupervisorInvocationRequestV118({
      invocation: invocation("host-nonce-v1-18-substituted-000000000001"),
      inputBytes,
      execution,
      cancellationChannel: {
        channelId: request.cancellation.channelId,
        channelNonce: request.cancellation.channelNonce,
      },
    })
    expect(changedNonce.supervisorRequestSha256).not.toBe(
      request.supervisorRequestSha256,
    )
  })

  it("rejects noncanonical, extra, missing, substituted, and oversized requests", () => {
    const request = fixture().request
    const extra = { ...clone(request), guestClaim: "host-receipt" }
    expectFailure(
      parseSupervisorInvocationRequestV118(canonicalBytes(extra)),
      "REQUEST_SHAPE_INVALID",
    )

    const missing = clone(request) as unknown as Record<string, unknown>
    delete missing.cancellation
    expectFailure(
      parseSupervisorInvocationRequestV118(canonicalBytes(missing)),
      "REQUEST_SHAPE_INVALID",
    )

    expectFailure(
      parseSupervisorInvocationRequestV118(
        new TextEncoder().encode(JSON.stringify(request)),
      ),
      "REQUEST_CANONICAL_JSON_INVALID",
    )

    const substituted = clone(request) as unknown as {
      input: { bytesBase64: string }
    }
    substituted.input.bytesBase64 =
      Buffer.from('{"changed":true}').toString("base64")
    expectFailure(
      parseSupervisorInvocationRequestV118(canonicalBytes(substituted)),
      "REQUEST_INPUT_MISMATCH",
    )

    const oversized = new Uint8Array(request.invocation.limits.payloadBytes + 1)
    oversized.fill(" ".charCodeAt(0))
    expect(() =>
      createSupervisorInvocationRequestV118({
        invocation: invocation(),
        inputBytes: oversized,
        execution,
        cancellationChannel: {
          channelId: request.cancellation.channelId,
          channelNonce: request.cancellation.channelNonce,
        },
      }),
    ).toThrow(/input bytes/u)
  })

  it("produces immutable branded privacy-safe evidence from an exact receipt", () => {
    const current = fixture()
    const result = verifySupervisorRawReceiptV118({
      request: current.request,
      rawReceiptBytes: current.rawReceiptBytes,
      observed: { payloadBytes, stdoutBytes, stderrBytes },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.result.kind).toBe("success")
    expect(isVerifiedSupervisorEvidenceV118(result.value)).toBe(true)
    expect(isVerifiedSupervisorEvidenceV118(clone(result.value))).toBe(false)
    expect(Object.isFrozen(result.value)).toBe(true)
    const serialized = JSON.stringify(result.value)
    expect(serialized).not.toMatch(
      /strategySource|artifactBytes|strategyMemory|soldierMemory|objective|diagnostic|hostPath|stderrBase64|channelNonce/u,
    )
    expect(serialized).not.toContain(execution.executablePath)
    for (const argument of execution.argv) {
      expect(serialized).not.toContain(argument)
    }
    for (const entry of execution.environment) {
      expect(serialized).not.toContain(entry.value)
    }
  })

  it("never accepts a forged guest frame as host receipt evidence", () => {
    const current = fixture()
    expectFailure(
      verifySupervisorRawReceiptV118({
        request: current.request,
        rawReceiptBytes: stdoutBytes,
        observed: { payloadBytes, stdoutBytes, stderrBytes },
      }),
      "RAW_RECEIPT_INVALID",
    )
  })

  it("fails closed on nonce, request, path, settings, and envelope substitution", () => {
    const mutations: Array<
      (envelope: SupervisorRawReceiptEnvelopeV118) => void
    > = [
      (envelope) => {
        envelope.receipt.hostNonce = "host-nonce-v1-18-replayed-000000000001"
      },
      (envelope) => {
        envelope.receipt.requestSha256 = hash("0")
      },
      (envelope) => {
        envelope.receipt.cgroup.pathIdentitySha256 = hash("d")
      },
      (envelope) => {
        envelope.receipt.cgroup.settingsSha256 = hash("e")
      },
      (envelope) => {
        envelope.receipt.containment.processGroupIdentitySha256 = hash("f")
      },
      (envelope) => {
        envelope.supervisorRequestSha256 = hash("0")
      },
      (envelope) => {
        envelope.inputSha256 = hash("0")
      },
      (envelope) => {
        envelope.cancellationChannelSha256 = hash("0")
      },
    ]
    for (const mutate of mutations) {
      const current = fixture()
      const envelope = clone(current.envelope)
      mutate(envelope)
      expectFailure(
        verifySupervisorRawReceiptV118({
          request: current.request,
          rawReceiptBytes: canonicalBytes(envelope),
          observed: { payloadBytes, stdoutBytes, stderrBytes },
        }),
      )
    }
  })

  it("binds actual executable, argv, and environment values to public identities", () => {
    const mutations: Array<(request: SupervisorInvocationRequestV118) => void> =
      [
        (request) => {
          ;(
            request.execution as {
              executablePath: string
            }
          ).executablePath = "/tmp/substituted-runtime"
        },
        (request) => {
          ;(request.execution.argv as string[])[0] = "--inspect"
        },
        (request) => {
          ;(
            request.execution.environment as Array<{
              name: string
              value: string
            }>
          )[0] = { name: "LANG", value: "attacker-controlled" }
        },
      ]
    for (const mutate of mutations) {
      const request = clone(fixture().request)
      mutate(request)
      recomputeSupervisorRequestHash(request)
      expectFailure(
        parseSupervisorInvocationRequestV118(canonicalBytes(request)),
        "REQUEST_BINDING_MISMATCH",
      )
    }
  })

  it("independently rejects counter, unit, platform, event, and overflow contradictions", () => {
    const mutations: Array<
      (envelope: SupervisorRawReceiptEnvelopeV118) => void
    > = [
      (envelope) => {
        envelope.receipt.wall.wallMilliseconds = 1
      },
      (envelope) => {
        envelope.receipt.cpu.computeFuel += 1
      },
      (envelope) => {
        envelope.receipt.platform.cgroupVersion = 1
      },
      (envelope) => {
        envelope.receipt.memory.eventsBefore.oom = 1
      },
      (envelope) => {
        envelope.receipt.pids.currentBefore = 2
        envelope.receipt.pids.currentPeak = 1
      },
      (envelope) => {
        envelope.receipt.cpu.finalUsageMicroseconds =
          Number.MAX_SAFE_INTEGER + 1
      },
    ]
    for (const mutate of mutations) {
      const current = fixture()
      const envelope = clone(current.envelope)
      mutate(envelope)
      expectFailure(
        verifySupervisorRawReceiptV118({
          request: current.request,
          rawReceiptBytes: canonicalBytes(envelope),
          observed: { payloadBytes, stdoutBytes, stderrBytes },
        }),
      )
    }
  })

  it("recomputes output bytes and rejects exit, cancellation, and reap contradictions", () => {
    const current = fixture()
    expectFailure(
      verifySupervisorRawReceiptV118({
        request: current.request,
        rawReceiptBytes: current.rawReceiptBytes,
        observed: {
          payloadBytes: canonicalBytes({ action: { type: "MOVE" } }),
          stdoutBytes,
          stderrBytes,
        },
      }),
      "OBSERVATION_MISMATCH",
    )

    const mutations: Array<
      (envelope: SupervisorRawReceiptEnvelopeV118) => void
    > = [
      (envelope) => {
        envelope.receipt.bytes.stdoutBytes += 1
      },
      (envelope) => {
        envelope.receipt.lifecycle.signal = "SIGKILL"
      },
      (envelope) => {
        envelope.receipt.lifecycle.cancellationRequested = true
        envelope.receipt.lifecycle.cancellationWinner = "host"
      },
      (envelope) => {
        envelope.receipt.lifecycle.lateResultDiscarded = true
      },
      (envelope) => {
        envelope.receipt.containment.cgroupEmpty = false
        envelope.receipt.containment.lingeringProcessCount = 1
      },
    ]
    for (const mutate of mutations) {
      const envelope = clone(current.envelope)
      mutate(envelope)
      expectFailure(
        verifySupervisorRawReceiptV118({
          request: current.request,
          rawReceiptBytes: canonicalBytes(envelope),
          observed: { payloadBytes, stdoutBytes, stderrBytes },
        }),
      )
    }
  })

  it("keeps unresolved process results and incomplete reap system-owned even when over limit", () => {
    const cases: Array<
      Readonly<{
        expectedCode: string
        mutate: (receipt: RuntimeSupervisorRawReceiptV118) => void
      }>
    > = [
      {
        expectedCode: "PROCESS_RESULT_UNRESOLVED",
        mutate: (receipt) => {
          receipt.lifecycle.exitCode = null
          receipt.lifecycle.signal = "SIGKILL"
          receipt.lifecycle.cancellationRequested = true
          receipt.lifecycle.cancellationWinner = "host"
          receipt.lifecycle.cgroupKillUsed = true
          receipt.lifecycle.lateResultDiscarded = true
        },
      },
      {
        expectedCode: "PROCESS_RESULT_UNRESOLVED",
        mutate: (receipt) => {
          receipt.lifecycle.exitCode = null
          receipt.lifecycle.signal = "SIGSEGV"
        },
      },
      {
        expectedCode: "PROCESS_RESULT_UNRESOLVED",
        mutate: (receipt) => {
          receipt.lifecycle.exitCode = 1
        },
      },
      {
        expectedCode: "PROCESS_RESULT_UNRESOLVED",
        mutate: (receipt) => {
          receipt.lifecycle.exitCode = null
        },
      },
      {
        expectedCode: "CONTAINMENT_INCOMPLETE",
        mutate: (receipt) => {
          receipt.containment.cgroupEmpty = false
          receipt.containment.lingeringProcessCount = 1
        },
      },
    ]
    for (const testCase of cases) {
      const current = fixture()
      const receipt = clone(current.receipt)
      setOverLimitWall(receipt, current.request)
      testCase.mutate(receipt)
      const envelope = createSupervisorRawReceiptEnvelopeV118({
        request: current.request,
        receipt,
        observed: { payloadBytes, stdoutBytes, stderrBytes },
      })
      expectFailure(
        verifySupervisorRawReceiptV118({
          request: current.request,
          rawReceiptBytes: serializeSupervisorRawReceiptEnvelopeV118(envelope),
          observed: { payloadBytes, stdoutBytes, stderrBytes },
        }),
        testCase.expectedCode,
      )
    }
  })

  it("rejects private poison and any open raw-receipt shape", () => {
    const current = fixture()
    const poison = {
      ...clone(current.envelope),
      strategySource: "export default privateStrategy",
    }
    expectFailure(
      verifySupervisorRawReceiptV118({
        request: current.request,
        rawReceiptBytes: canonicalBytes(poison),
        observed: { payloadBytes, stdoutBytes, stderrBytes },
      }),
      "RAW_RECEIPT_INVALID",
    )

    const nestedPoison = clone(current.envelope) as unknown as {
      receipt: Record<string, unknown>
    }
    nestedPoison.receipt.hostPath = "/private/runtime/secret"
    expectFailure(
      verifySupervisorRawReceiptV118({
        request: current.request,
        rawReceiptBytes: canonicalBytes(nestedPoison),
        observed: { payloadBytes, stdoutBytes, stderrBytes },
      }),
      "RAW_RECEIPT_INVALID",
    )
  })
})
