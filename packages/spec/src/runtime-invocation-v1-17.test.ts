import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, expectTypeOf, it } from "vitest"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import type { JsonValue } from "./types.js"
import {
  RUNTIME_INVOCATION_V1_17_CANDIDATE,
  RUNTIME_INVOCATION_V1_17_OWNERSHIP_MATRIX,
  RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  RuntimeInvocationResultV117Schema,
  classifyRuntimeInvocationV117,
  createAuthenticatedRuntimeInvocationRequestV117,
  createAuthenticatedRuntimeInvocationResponseV117,
  serializeRuntimeInvocationRequestV117,
  serializeRuntimeInvocationResponseV117,
  verifyRuntimeInvocationRequestV117,
  verifyRuntimeInvocationResponseV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type RuntimeInvocationResultV117,
  type RuntimeInvocationTraceV117,
} from "./runtime-invocation-v1-17.js"
import { RUNTIME_EXECUTION_SERVICE_VERSION } from "./runtime-execution-service.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const repoRoot = path.resolve(import.meta.dirname, "../../..")
const fixtureSecret = "fixture-only:runtime-invocation-v1.17:secret"
const requestFixturePath = path.join(
  repoRoot,
  "packages/spec/artifacts/runtime-execution-service-request.v1.17.candidate.json",
)
const responseFixturePath = path.join(
  repoRoot,
  "packages/spec/artifacts/runtime-execution-service-response.v1.17.candidate.wire.json",
)

const sha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const candidateRequest = (): AuthenticatedRuntimeInvocationRequestV117 =>
  createAuthenticatedRuntimeInvocationRequestV117(
    {
      requestId: "request:candidate:v1.17:0001",
      invocationId: "invocation:candidate:v1.17:0001",
      kernelRequestId: "kernel-request:candidate:v1.17:0001",
      method: "selectActivations",
      semanticTuple: {
        rules: "cowards-rules-v1.4",
        engine: "engine-kernel-v1.37-candidate-1",
        runtimeAbi: "strategy-runtime-abi-v1.17",
        chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
        arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
        setPolicy: "canonical-set-policy-v1.4",
      },
      sourceIdentity: {
        strategyRevisionId: "strategy-revision:candidate:v1.17:bottom",
        originalSourceSha256: hash("b"),
        normalizedSourceSha256: hash("c"),
        artifactSha256: hash("d"),
      },
      budget: {
        profileId: "runtime-budget-profile-v1.17-candidate",
        wallMilliseconds: 50,
        computeFuel: 10_000_000,
        memoryBytes: 67_108_864,
        outputBytes: 262_144,
        processLimit: 1,
      },
      input: {
        value: { cycleIndex: 0, phase: "ROUND" },
      },
      retry: {
        retryId: "retry:candidate:v1.17:0001",
        attempt: 0,
        previousRequestSha256: null,
      },
    },
    {
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      secret: fixtureSecret,
    },
  )

const candidateResponse = (request = candidateRequest()) =>
  createAuthenticatedRuntimeInvocationResponseV117(
    request,
    {
      kind: "success",
      value: { activationOrders: [], strategyMemory: {} },
      trace: {
        requestId: request.requestId,
        invocationId: request.invocationId,
        kernelRequestId: request.kernelRequestId,
        method: request.method,
        requestSha256: sha256(serializeRuntimeInvocationRequestV117(request)),
        budgetProfileSha256: request.budget.profileSha256,
        inputSha256: request.input.canonicalSha256,
        retryIdentitySha256: request.retry.identitySha256,
        safeCodes: ["ADAPTER_AUTHENTICATED", "PAYLOAD_CANONICAL"],
      },
    },
    {
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      secret: fixtureSecret,
    },
  )

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

describe("runtime invocation v1.17 authenticated candidate wire", () => {
  it("matches exact canonical request and response fixture bytes", () => {
    const requestBytes = serializeRuntimeInvocationRequestV117(candidateRequest())
    const responseBytes = serializeRuntimeInvocationResponseV117(candidateResponse())
    expect(Buffer.from(requestBytes)).toEqual(readFileSync(requestFixturePath))
    expect(Buffer.from(responseBytes)).toEqual(readFileSync(responseFixturePath))
    expect(sha256(requestBytes)).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(sha256(responseBytes)).toMatch(/^sha256:[0-9a-f]{64}$/u)
  })

  it("authenticates complete request, payload, and retry bindings", () => {
    const requestBytes = readFileSync(requestFixturePath)
    const request = verifyRuntimeInvocationRequestV117(requestBytes, {
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      secret: fixtureSecret,
    })
    expect(request.kind).toBe("success")
    if (request.kind !== "success") return
    const response = verifyRuntimeInvocationResponseV117(
      readFileSync(responseFixturePath),
      request.value,
      {
        keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
        secret: fixtureSecret,
      },
    )
    expect(response.kind).toBe("success")
    if (response.kind === "success") {
      expect(response.value.outcome.kind).toBe("success")
      if (response.value.outcome.kind !== "success") return
      const payload = encodeCanonicalJson(response.value.outcome.value, {
        context: "authenticated-outer-envelope",
      })
      expect(payload.ok).toBe(true)
      if (payload.ok) {
        expect(response.value.payloadBinding.sha256).toBe(sha256(payload.bytes))
        expect(response.value.payloadBinding.canonicalByteLength).toBe(
          payload.bytes.byteLength,
        )
      }
    }
  })

  it("owns tamper, wrong binding, wrong key, and truncation as system failures", () => {
    const requestBytes = readFileSync(requestFixturePath)
    const tamperedRequest = Buffer.from(requestBytes)
    const budgetMarker = Buffer.from(requestBytes).indexOf(
      Buffer.from(candidateRequest().budget.profileSha256),
    )
    expect(budgetMarker).toBeGreaterThanOrEqual(0)
    tamperedRequest[budgetMarker + 8] = "9".charCodeAt(0)
    const tampered = verifyRuntimeInvocationRequestV117(tamperedRequest, {
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      secret: fixtureSecret,
    })
    expect(tampered.kind).toBe("system_failure")
    if (tampered.kind === "system_failure") {
      expect(tampered.failure.code).toBe("OUTER_FRAME_UNAUTHENTICATED")
    }

    const request = candidateRequest()
    const wrongBudget = {
      ...request,
      budget: { ...request.budget, profileSha256: hash("9") },
    }
    const wrongBinding = verifyRuntimeInvocationResponseV117(
      readFileSync(responseFixturePath),
      wrongBudget,
      {
        keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
        secret: fixtureSecret,
      },
    )
    expect(wrongBinding.kind).toBe("system_failure")
    if (wrongBinding.kind === "system_failure") {
      expect(wrongBinding.failure.code).toBe("OUTER_FRAME_WRONG_BINDING")
    }

    const wrongKey = verifyRuntimeInvocationResponseV117(
      readFileSync(responseFixturePath),
      request,
      {
        keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
        secret: `${fixtureSecret}:wrong`,
      },
    )
    expect(wrongKey.kind).toBe("system_failure")
    if (wrongKey.kind === "system_failure") {
      expect(wrongKey.failure.code).toBe("OUTER_FRAME_UNAUTHENTICATED")
    }

    const truncated = verifyRuntimeInvocationResponseV117(
      readFileSync(responseFixturePath).subarray(0, -1),
      request,
      {
        keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
        secret: fixtureSecret,
      },
    )
    expect(truncated.kind).toBe("system_failure")
    if (truncated.kind === "system_failure") {
      expect(truncated.failure.code).toBe("OUTER_FRAME_TRUNCATED")
    }
  })

  it("preserves immutable v1.16 dispatch and protected verifier inputs", () => {
    expect(RUNTIME_EXECUTION_SERVICE_VERSION).toBe(
      "runtime-execution-service-v1.16",
    )
    expect(RUNTIME_INVOCATION_V1_17_CANDIDATE.current).toBe(false)
    const protectedHashes = {
      "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json":
        "9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97",
      "packages/spec/src/runtime-execution-service.ts":
        "9a0a0411056d06ce4b426b7749256460369124fa752c6c2f81912b8b0bfb31fc",
      "apps/go-backend/runtime_semantic_receipt.go":
        "36052047a870068ab81ced8c78f3b7f4e8130034a57ee8d16bc3873a50507d1d",
      "apps/go-backend/runtime_service_client.go":
        "8fdd3cbc206d2d7e1f77a3603a4f9ea5e664c5ab6f649c87d3e308d99556043f",
      "apps/go-backend/runtime_service_client_test.go":
        "4a52986d2a43598c0e9556504459143ab56d94d97b22b2296cf84067927e8185",
      "packages/persistence/migrations/0017_runtime_semantic_receipts.sql":
        "ac19e1d825217dfb72142685eb65e62933cea49541ceb39338235b32d2430a69",
    } as const
    for (const [relativePath, expected] of Object.entries(protectedHashes)) {
      expect(
        createHash("sha256")
          .update(readFileSync(path.join(repoRoot, relativePath)))
          .digest("hex"),
        relativePath,
      ).toBe(expected)
    }
  })
})
