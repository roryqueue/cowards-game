import { describe, expect, expectTypeOf, it } from "vitest"
import type { JsonValue } from "./types.js"
import {
  RUNTIME_INVOCATION_V1_17_CANDIDATE,
  RUNTIME_INVOCATION_V1_17_OWNERSHIP_MATRIX,
  RuntimeInvocationResultV117Schema,
  classifyRuntimeInvocationV117,
  type RuntimeInvocationResultV117,
  type RuntimeInvocationTraceV117,
} from "./runtime-invocation-v1-17.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const trace = (): RuntimeInvocationTraceV117 => ({
  requestId: "request:v1.17:test",
  invocationId: "invocation:v1.17:test",
  kernelRequestId: "kernel-request:v1.17:test",
  method: "selectActivations",
  requestSha256: hash("1"),
  budgetProfileSha256: hash("2"),
  inputSha256: hash("3"),
  retryIdentitySha256: hash("4"),
  safeCodes: ["ADAPTER_AUTHENTICATED", "PAYLOAD_CANONICAL"],
})

describe("runtime invocation v1.17 exclusive ownership", () => {
  it("keeps the successor candidate inactive until Plan 14", () => {
    expect(RUNTIME_INVOCATION_V1_17_CANDIDATE).toEqual({
      contractVersion: "runtime-invocation-v1.17",
      runtimeAbiVersion: "strategy-runtime-abi-v1.17",
      lifecycle: "inactive-candidate",
      activationPlan: "258-14",
      current: false,
    })
  })

  it("classifies the complete boundary matrix with one exact owner", () => {
    const expected = {
      success: ["success", null],
      payload_duplicate_key: ["player_violation", "INVALID_OUTPUT"],
      payload_non_canonical: ["player_violation", "INVALID_OUTPUT"],
      payload_schema_invalid: ["player_violation", "INVALID_OUTPUT"],
      payload_illegal: ["player_violation", "INVALID_OUTPUT"],
      strategy_exception_proven: ["player_violation", "THROWN_EXCEPTION"],
      strategy_exhaustion_proven: ["player_violation", "TIMEOUT"],
      outer_frame_missing: ["system_failure", "OUTER_FRAME_MISSING"],
      outer_frame_truncated: ["system_failure", "OUTER_FRAME_TRUNCATED"],
      outer_frame_unauthenticated: ["system_failure", "OUTER_FRAME_UNAUTHENTICATED"],
      outer_frame_wrong_binding: ["system_failure", "OUTER_FRAME_WRONG_BINDING"],
      outer_frame_undecodable: ["system_failure", "OUTER_FRAME_UNDECODABLE"],
      adapter_crash: ["system_failure", "ADAPTER_CRASH"],
      runtime_crash: ["system_failure", "RUNTIME_CRASH"],
      host_crash: ["system_failure", "HOST_CRASH"],
      transport_crash: ["system_failure", "TRANSPORT_CRASH"],
      strategy_exception_ambiguous: ["system_failure", "AMBIGUOUS_ATTRIBUTION"],
      strategy_exhaustion_ambiguous: ["system_failure", "AMBIGUOUS_ATTRIBUTION"],
    } as const
    expect(Object.keys(RUNTIME_INVOCATION_V1_17_OWNERSHIP_MATRIX)).toEqual(
      Object.keys(expected),
    )
    for (const [event, [kind, code]] of Object.entries(expected)) {
      const result = classifyRuntimeInvocationV117(
        event as keyof typeof expected,
        trace(),
        { activationOrders: [] },
      )
      expect(result.kind, event).toBe(kind)
      expect(
        result.kind === "player_violation"
          ? result.violation.code
          : result.kind === "system_failure"
            ? result.failure.code
            : null,
        event,
      ).toBe(code)
    }
  })

  it("accepts only exact success, player, and system result shapes", () => {
    const success = {
      kind: "success",
      value: { activationOrders: [] },
      trace: trace(),
    }
    const player = {
      kind: "player_violation",
      violation: {
        code: "INVALID_OUTPUT",
        publicMessage: "Strategy returned an invalid payload.",
      },
      trace: trace(),
    }
    const system = {
      kind: "system_failure",
      failure: {
        code: "OUTER_FRAME_TRUNCATED",
        publicMessage: "Runtime system failure.",
        retryable: true,
      },
      trace: trace(),
    }
    expect(RuntimeInvocationResultV117Schema.safeParse(success).success).toBe(true)
    expect(RuntimeInvocationResultV117Schema.safeParse(player).success).toBe(true)
    expect(RuntimeInvocationResultV117Schema.safeParse(system).success).toBe(true)

    for (const invalid of [
      {},
      { ...success, violation: player.violation },
      { ...success, failure: system.failure },
      { ...player, failure: system.failure },
      { ...system, violation: player.violation },
      { value: success.value, trace: trace() },
      { kind: "player_violation", trace: trace() },
      { kind: "system_failure", trace: trace() },
      { ...system, failure: { ...system.failure, diagnostics: "private" } },
      { ...success, trace: { ...trace(), source: "private Strategy source" } },
    ]) {
      expect(RuntimeInvocationResultV117Schema.safeParse(invalid).success).toBe(false)
    }
  })

  it("makes mixed and absent discriminants type-invalid", () => {
    expectTypeOf<RuntimeInvocationResultV117<JsonValue>>().toBeObject()
    const playerWithFailure = {
      kind: "player_violation",
      violation: { code: "INVALID_OUTPUT", publicMessage: "Invalid payload." },
      failure: {
        code: "AMBIGUOUS_ATTRIBUTION",
        publicMessage: "Runtime system failure.",
        retryable: true,
      },
      trace: trace(),
    } as const
    // @ts-expect-error one result cannot carry player and system classifications
    const mixed: RuntimeInvocationResultV117 = playerWithFailure
    const missingKind = {
      violation: { code: "INVALID_OUTPUT", publicMessage: "Invalid payload." },
      trace: trace(),
    } as const
    // @ts-expect-error every result requires exactly one discriminant
    const absent: RuntimeInvocationResultV117 = missingKind
    void mixed
    void absent
  })
})
