import { Buffer } from "node:buffer"
import { createHash, createHmac } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, expectTypeOf, it } from "vitest"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import { frameCanonicalIdentity } from "./canonical-identity-domains.js"
import type { JsonValue } from "./types.js"
import {
  RUNTIME_INVOCATION_V1_17_CANDIDATE,
  RUNTIME_INVOCATION_V1_17_OWNERSHIP_MATRIX,
  RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS,
  RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES,
  RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY,
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
import { RUNTIME_ABI_V1_17 } from "./runtime-abi-v1-17.js"
import * as publicRuntime from "./runtime.js"

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
        matchCumulative: RUNTIME_ABI_V1_17.budgets.matchCumulative,
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

const signedSystemFailureResponseBytes = (
  code: (typeof RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES)[number],
  retryable: boolean,
): Readonly<{
  request: AuthenticatedRuntimeInvocationRequestV117
  bytes: Uint8Array
}> => {
  const request = candidateRequest()
  const valid = candidateResponse(request)
  const { authentication: _authentication, ...validUnsigned } = valid
  const unsigned = {
    ...validUnsigned,
    outcome: {
      kind: "system_failure" as const,
      failure: {
        code,
        publicMessage: "Runtime system failure." as const,
        retryable,
      },
      trace: valid.outcome.trace,
    },
    payloadBinding: null,
  }
  const encodedUnsigned = encodeCanonicalJson(
    unsigned as unknown as JsonValue,
    {
      context: "authenticated-outer-envelope",
    },
  )
  if (!encodedUnsigned.ok) throw new Error(encodedUnsigned.error.code)
  const signatureInput = frameCanonicalIdentity("evidenceBundle", [
    new TextEncoder().encode("runtime-invocation-v1.17:response"),
    encodedUnsigned.bytes,
  ])
  const envelope = {
    ...unsigned,
    authentication: {
      algorithm: "hmac-sha256" as const,
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      signatureInputSha256: sha256(signatureInput),
      signature: `hmac-sha256:${createHmac("sha256", fixtureSecret)
        .update(signatureInput)
        .digest("hex")}` as const,
    },
  }
  const encoded = encodeCanonicalJson(envelope as unknown as JsonValue, {
    context: "authenticated-outer-envelope",
  })
  if (!encoded.ok) throw new Error(encoded.error.code)
  return { request, bytes: encoded.bytes }
}

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
      outer_frame_unauthenticated: [
        "system_failure",
        "OUTER_FRAME_UNAUTHENTICATED",
      ],
      outer_frame_wrong_binding: [
        "system_failure",
        "OUTER_FRAME_WRONG_BINDING",
      ],
      outer_frame_undecodable: ["system_failure", "OUTER_FRAME_UNDECODABLE"],
      adapter_crash: ["system_failure", "ADAPTER_CRASH"],
      runtime_crash: ["system_failure", "RUNTIME_CRASH"],
      host_crash: ["system_failure", "HOST_CRASH"],
      transport_crash: ["system_failure", "TRANSPORT_CRASH"],
      strategy_exception_ambiguous: ["system_failure", "AMBIGUOUS_ATTRIBUTION"],
      strategy_exhaustion_ambiguous: [
        "system_failure",
        "AMBIGUOUS_ATTRIBUTION",
      ],
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
      value: { activationOrders: [], strategyMemory: null },
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
    expect(RuntimeInvocationResultV117Schema.safeParse(success).success).toBe(
      true,
    )
    expect(RuntimeInvocationResultV117Schema.safeParse(player).success).toBe(
      true,
    )
    expect(RuntimeInvocationResultV117Schema.safeParse(system).success).toBe(
      true,
    )

    for (const invalid of [
      {},
      { ...success, violation: player.violation },
      { ...success, failure: system.failure },
      { ...player, failure: system.failure },
      { ...system, violation: player.violation },
      {
        ...player,
        violation: {
          code: "INVALID_OUTPUT",
          publicMessage: "private Strategy output",
        },
      },
      { value: success.value, trace: trace() },
      { kind: "player_violation", trace: trace() },
      { kind: "system_failure", trace: trace() },
      { ...system, failure: { ...system.failure, diagnostics: "private" } },
      { ...success, trace: { ...trace(), source: "private Strategy source" } },
    ]) {
      expect(RuntimeInvocationResultV117Schema.safeParse(invalid).success).toBe(
        false,
      )
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

  it("keeps every exported canonical ownership record deeply immutable", () => {
    expect(Object.isFrozen(RUNTIME_INVOCATION_V1_17_OWNERSHIP_MATRIX)).toBe(
      true,
    )
    expect(
      Object.values(RUNTIME_INVOCATION_V1_17_OWNERSHIP_MATRIX).every((row) =>
        Object.isFrozen(row),
      ),
    ).toBe(true)
    expect(Object.isFrozen(RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS)).toBe(
      true,
    )
    expect(
      Object.values(RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS).every((row) =>
        Object.isFrozen(row),
      ),
    ).toBe(true)
  })

  it("freezes one complete retryability contract for every system failure code", () => {
    expect(RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY).toEqual({
      OUTER_FRAME_MISSING: true,
      OUTER_FRAME_TRUNCATED: true,
      OUTER_FRAME_UNAUTHENTICATED: false,
      OUTER_FRAME_WRONG_BINDING: false,
      OUTER_FRAME_UNDECODABLE: false,
      ADAPTER_CRASH: true,
      RUNTIME_CRASH: true,
      HOST_CRASH: true,
      TRANSPORT_CRASH: true,
      AMBIGUOUS_ATTRIBUTION: false,
    })
    expect(
      Object.keys(RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY),
    ).toEqual([...RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES])
    expect(
      Object.isFrozen(RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY),
    ).toBe(true)
  })
})

describe("runtime invocation v1.17 authenticated candidate wire", () => {
  it("accepts only signed system-failure responses with exact retryability", () => {
    for (const code of RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES) {
      const signed = signedSystemFailureResponseBytes(
        code,
        RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY[code],
      )
      const verified = verifyRuntimeInvocationResponseV117(
        signed.bytes,
        signed.request,
        {
          keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
          secret: fixtureSecret,
        },
      )
      expect(verified.kind, code).toBe("success")
      if (verified.kind === "success") {
        expect(verified.value.outcome).toMatchObject({
          kind: "system_failure",
          failure: {
            code,
            retryable:
              RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY[code],
          },
        })
      }
    }

    for (const [code, retryable] of [
      ["ADAPTER_CRASH", false],
      ["OUTER_FRAME_WRONG_BINDING", true],
      ["AMBIGUOUS_ATTRIBUTION", true],
    ] as const) {
      const signed = signedSystemFailureResponseBytes(code, retryable)
      const verified = verifyRuntimeInvocationResponseV117(
        signed.bytes,
        signed.request,
        {
          keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
          secret: fixtureSecret,
        },
      )
      expect(verified, code).toMatchObject({
        kind: "system_failure",
        failure: {
          code: "OUTER_FRAME_UNDECODABLE",
          retryable: false,
        },
      })
    }
  })

  it("matches exact canonical request and response fixture bytes", () => {
    const request = candidateRequest()
    const response = candidateResponse(request)
    const requestBytes = serializeRuntimeInvocationRequestV117(request)
    const responseBytes = serializeRuntimeInvocationResponseV117(response)
    expect(Buffer.from(requestBytes)).toEqual(readFileSync(requestFixturePath))
    expect(Buffer.from(responseBytes)).toEqual(
      readFileSync(responseFixturePath),
    )
    expect(sha256(requestBytes)).toBe(
      "sha256:94da776c5ef88992d126bd85ae325518303ba56fdf8d2b5568e0e0ce28db1fd7",
    )
    expect(sha256(responseBytes)).toBe(
      "sha256:d4aa58745e3d4305cc09854478dc38e31313b1e803b89f65a990bd8c52a74ebf",
    )
    expect(request.authentication.signatureInputSha256).toBe(
      "sha256:7a2b2ce2c3b8fed0af22911fea9430a51487db83796d068478a0db851ac2b19d",
    )
    expect(response.authentication.signatureInputSha256).toBe(
      "sha256:0a0c97b4f762608139b0e413fef120eee35ca4ee0c221398b00f94e92f342bcc",
    )
  })

  it("authenticates complete request, payload, and retry bindings", () => {
    const requestBytes = readFileSync(requestFixturePath)
    const request = verifyRuntimeInvocationRequestV117(requestBytes, {
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      secret: fixtureSecret,
    })
    expect(request.kind).toBe("success")
    if (request.kind !== "success") return
    expect(request.value.budget).toMatchObject({
      matchCumulative: RUNTIME_ABI_V1_17.budgets.matchCumulative,
    })
    expect(request.trace.safeCodes).toEqual([
      "ADAPTER_AUTHENTICATED",
      "OUTER_BINDINGS_VERIFIED",
    ])
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
      const responseValue = response.value
      expect(responseValue.outcome.kind).toBe("success")
      if (
        responseValue.outcome.kind !== "success" ||
        responseValue.payloadBinding === null
      )
        return
      const payload = encodeCanonicalJson(responseValue.outcome.value, {
        context: "authenticated-outer-envelope",
      })
      expect(payload.ok).toBe(true)
      if (payload.ok) {
        expect(responseValue.payloadBinding.sha256).toBe(sha256(payload.bytes))
        expect(responseValue.payloadBinding.canonicalByteLength).toBe(
          payload.bytes.byteLength,
        )
      }
    }
  })

  it("owns tamper, wrong binding, wrong key, and truncation as system failures", () => {
    const missing = verifyRuntimeInvocationRequestV117(new Uint8Array(), {
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      secret: fixtureSecret,
    })
    expect(missing.kind).toBe("system_failure")
    if (missing.kind === "system_failure") {
      expect(missing.failure.code).toBe("OUTER_FRAME_MISSING")
    }
    const undecodable = verifyRuntimeInvocationRequestV117(Buffer.from("{}"), {
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      secret: fixtureSecret,
    })
    expect(undecodable.kind).toBe("system_failure")
    if (undecodable.kind === "system_failure") {
      expect(undecodable.failure.code).toBe("OUTER_FRAME_UNDECODABLE")
    }

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
    expect(() => candidateResponse(wrongBudget)).toThrow(
      "invalid candidate request",
    )

    const wrongRequest = {
      ...request,
      requestId: "request:candidate:v1.17:wrong",
    }
    const wrongRequestBinding = verifyRuntimeInvocationResponseV117(
      readFileSync(responseFixturePath),
      wrongRequest,
      {
        keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
        secret: fixtureSecret,
      },
    )
    expect(wrongRequestBinding.kind).toBe("system_failure")
    if (wrongRequestBinding.kind === "system_failure") {
      expect(wrongRequestBinding.failure.code).toBe("OUTER_FRAME_WRONG_BINDING")
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

  it("refuses to authenticate an outcome trace outside the request binding", () => {
    const request = candidateRequest()
    const mismatchedOutcome = {
      kind: "success" as const,
      value: { activationOrders: [], strategyMemory: null },
      trace: {
        ...trace(),
        requestId: "request:candidate:v1.17:different",
        invocationId: request.invocationId,
        kernelRequestId: request.kernelRequestId,
        method: request.method,
        requestSha256: sha256(serializeRuntimeInvocationRequestV117(request)),
        budgetProfileSha256: request.budget.profileSha256,
        inputSha256: request.input.canonicalSha256,
        retryIdentitySha256: request.retry.identitySha256,
      },
    }

    expect(() =>
      createAuthenticatedRuntimeInvocationResponseV117(
        request,
        mismatchedOutcome,
        {
          keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
          secret: fixtureSecret,
        },
      ),
    ).toThrow("outcome trace outside the request binding")
  })

  it("fails closed without throwing for a malformed expected request", () => {
    const malformedExpectedRequest = {
      ...candidateRequest(),
      requestId: "private request id with spaces",
    } as AuthenticatedRuntimeInvocationRequestV117
    let result:
      | ReturnType<typeof verifyRuntimeInvocationResponseV117>
      | undefined

    expect(() => {
      result = verifyRuntimeInvocationResponseV117(
        readFileSync(responseFixturePath),
        malformedExpectedRequest,
        {
          keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
          secret: fixtureSecret,
        },
      )
    }).not.toThrow()
    expect(result?.kind).toBe("system_failure")
    if (result?.kind === "system_failure") {
      expect(result.failure).toEqual({
        code: "OUTER_FRAME_WRONG_BINDING",
        publicMessage: "Runtime system failure.",
        retryable: false,
      })
      expect(result.trace.requestId).toBe("unavailable")
      expect(JSON.stringify(result)).not.toContain("private request id")
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

  it("publishes the complete candidate envelope API through the package runtime surface", () => {
    for (const name of [
      "AuthenticatedRuntimeInvocationRequestV117Schema",
      "AuthenticatedRuntimeInvocationResponseV117Schema",
      "createAuthenticatedRuntimeInvocationRequestV117",
      "createAuthenticatedRuntimeInvocationResponseV117",
      "serializeRuntimeInvocationRequestV117",
      "serializeRuntimeInvocationResponseV117",
      "verifyRuntimeInvocationRequestV117",
      "verifyRuntimeInvocationResponseV117",
      "RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY",
    ]) {
      expect(publicRuntime, name).toHaveProperty(name)
    }
  })
})
