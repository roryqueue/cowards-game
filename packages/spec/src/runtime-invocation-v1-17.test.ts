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
  createRuntimeInvocationBudgetV117,
  createRuntimeInvocationExecutionReceiptV117,
  createRuntimeInvocationTraceV117,
  serializeRuntimeInvocationRequestV117,
  serializeRuntimeInvocationResponseV117,
  verifyRuntimeInvocationRequestV117,
  verifyRuntimeInvocationResponseV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type RuntimeInvocationExecutionReceiptEvidenceV117,
  type RuntimeInvocationExecutionReceiptV117,
  type RuntimeInvocationResultV117,
  type RuntimeInvocationTraceV117,
} from "./runtime-invocation-v1-17.js"
import { RUNTIME_EXECUTION_SERVICE_VERSION } from "./runtime-execution-service.js"
import { RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256 } from "./runtime-budget-profile-v1-17.js"
import { RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17 } from "./runtime-budget-capabilities-v1-17.js"
import {
  RUNTIME_ABI_V1_17,
  createRuntimeAbiV117ExecutionLedger,
  debitRuntimeAbiV117Ledger,
} from "./runtime-abi-v1-17.js"
import * as publicRuntime from "./runtime.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const repoRoot = path.resolve(import.meta.dirname, "../../..")
const fixtureSecret = "fixture-only:runtime-invocation-v1.17:secret"
const requestFixturePath = path.join(
  repoRoot,
  "packages/spec/artifacts/runtime-invocation-request.v1.17.candidate.json",
)
const responseFixturePath = path.join(
  repoRoot,
  "packages/spec/artifacts/runtime-invocation-response.v1.17.candidate.wire.json",
)

const sha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const candidateRequest = (
  method: "selectActivations" | "soldierBrain" = "selectActivations",
): AuthenticatedRuntimeInvocationRequestV117 =>
  createAuthenticatedRuntimeInvocationRequestV117(
    {
      requestId: "request:candidate:v1.17:0001",
      invocationId: "invocation:candidate:v1.17:0001",
      kernelRequestId: "kernel-request:candidate:v1.17:0001",
      method,
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
      budget: createRuntimeInvocationBudgetV117(method),
      accounting: { prestate: createRuntimeAbiV117ExecutionLedger() },
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

const measuredEvidenceFor = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  successValue?: JsonValue,
): RuntimeInvocationExecutionReceiptEvidenceV117 => {
  const prestate = request.accounting.prestate
  const successPayloadBytes =
    successValue === undefined
      ? undefined
      : canonicalFixtureBytes(successValue).byteLength
  const observedDeltas = {
    payloadBytes: successPayloadBytes ?? 1,
    stdoutBytes:
      successPayloadBytes === undefined ? 1 : successPayloadBytes + 1,
    stderrBytes: successPayloadBytes === undefined ? 1 : 0,
  }
  const counters = Object.fromEntries(
    [
      "wallMilliseconds",
      "computeFuel",
      "payloadBytes",
      "stdoutBytes",
      "stderrBytes",
    ].map((counter) => {
      const delta =
        counter in observedDeltas
          ? observedDeltas[counter as keyof typeof observedDeltas]
          : 1
      return [
        counter,
        {
          status: "measured" as const,
          delta,
          cumulative:
            prestate.cumulative[counter as keyof typeof prestate.cumulative] +
            delta,
        },
      ]
    }),
  ) as RuntimeInvocationExecutionReceiptEvidenceV117["counters"]
  return {
    attribution: "proven_strategy" as const,
    counters,
    memory: {
      status: "measured" as const,
      peakBytes: 1,
      cumulativePeakBytes: Math.max(prestate.cumulative.memoryBytes, 1),
    },
    process: {
      status: "verified" as const,
      processes: 1,
      threads: 1,
      children: 0,
    },
    capabilities: {
      status: "verified" as const,
      filesystem: "none",
      network: "disabled",
      environment: "empty",
      shell: "disabled",
    },
    cancellation: {
      status: "verified" as const,
      terminationRequired: false,
      receiptPresent: false,
      graceMilliseconds: 0,
    },
    accountingEvidence: {
      status: "verified" as const,
      signatureVerified: true,
      monotonic: true,
    },
  }
}

const measuredReceiptFor = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  successValue?: JsonValue,
): RuntimeInvocationExecutionReceiptV117 =>
  createRuntimeInvocationExecutionReceiptV117(
    request,
    measuredEvidenceFor(request, successValue),
  )

const ambiguousReceiptFor = (
  request: AuthenticatedRuntimeInvocationRequestV117,
): RuntimeInvocationExecutionReceiptV117 => {
  const evidence = {
    ...measuredEvidenceFor(request),
    attribution: "ambiguous" as const,
  }
  return createRuntimeInvocationExecutionReceiptV117(request, evidence)
}

const unavailableReceiptFor = (
  request: AuthenticatedRuntimeInvocationRequestV117,
): RuntimeInvocationExecutionReceiptV117 => {
  const measured = measuredEvidenceFor(request)
  return createRuntimeInvocationExecutionReceiptV117(request, {
    ...measured,
    attribution: "host",
    counters: {
      ...measured.counters,
      computeFuel: { status: "unavailable" },
    },
  })
}

const candidateResponse = (request = candidateRequest()) => {
  const value = { activationOrders: [], strategyMemory: {} }
  return createAuthenticatedRuntimeInvocationResponseV117(
    request,
    {
      kind: "success",
      value,
      trace: createRuntimeInvocationTraceV117(request, [
        "ADAPTER_AUTHENTICATED",
        "PAYLOAD_CANONICAL",
      ]),
    },
    measuredReceiptFor(request, value),
    {
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      secret: fixtureSecret,
    },
  )
}

const signedSuccessResponseBytes = (
  method: "selectActivations" | "soldierBrain",
  value: JsonValue,
): Readonly<{
  request: AuthenticatedRuntimeInvocationRequestV117
  bytes: Uint8Array
}> => {
  const request = candidateRequest(method)
  const requestTrace = createRuntimeInvocationTraceV117(request, [
    "ADAPTER_AUTHENTICATED",
    "PAYLOAD_CANONICAL",
  ])
  const validValue =
    method === "selectActivations"
      ? { activationOrders: [], strategyMemory: null }
      : {
          action: { type: "TURN_TO_STONE" as const },
          soldierMemory: null,
        }
  const valid =
    method === "selectActivations"
      ? createAuthenticatedRuntimeInvocationResponseV117(
          request,
          {
            kind: "success",
            value: { activationOrders: [], strategyMemory: null },
            trace: requestTrace,
          },
          measuredReceiptFor(request, validValue),
          {
            keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
            secret: fixtureSecret,
          },
        )
      : createAuthenticatedRuntimeInvocationResponseV117(
          request,
          {
            kind: "success",
            value: {
              action: { type: "TURN_TO_STONE" },
              soldierMemory: null,
            },
            trace: requestTrace,
          },
          measuredReceiptFor(request, validValue),
          {
            keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
            secret: fixtureSecret,
          },
        )
  const payload = encodeCanonicalJson(value, {
    context: "authenticated-outer-envelope",
  })
  if (!payload.ok) throw new Error(payload.error.code)
  const { authentication: _authentication, ...validUnsigned } = valid
  const unsigned = {
    ...validUnsigned,
    outcome: {
      kind: "success" as const,
      value,
      trace: requestTrace,
    },
    payloadBinding: {
      sha256: sha256(payload.bytes),
      canonicalByteLength: payload.bytes.byteLength,
    },
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

const signedSystemFailureResponseBytes = (
  code: (typeof RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES)[number],
  retryable: boolean,
): Readonly<{
  request: AuthenticatedRuntimeInvocationRequestV117
  bytes: Uint8Array
}> => {
  const request = candidateRequest()
  const valid = createAuthenticatedRuntimeInvocationResponseV117(
    request,
    {
      kind: "system_failure",
      failure: {
        code,
        publicMessage: "Runtime system failure.",
        retryable: RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY[code],
      },
      trace: createRuntimeInvocationTraceV117(request, [
        "ADAPTER_AUTHENTICATED",
        "PAYLOAD_CANONICAL",
      ]),
    },
    ambiguousReceiptFor(request),
    {
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      secret: fixtureSecret,
    },
  )
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

type RawEnvelope = Record<string, JsonValue>

const canonicalFixtureBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, {
    context: "authenticated-outer-envelope",
  })
  if (!encoded.ok) throw new Error(encoded.error.code)
  return encoded.bytes
}

const framedFixtureHash = (
  label: string,
  value: JsonValue,
): `sha256:${string}` =>
  sha256(
    frameCanonicalIdentity("evidenceBundle", [
      new TextEncoder().encode(label),
      canonicalFixtureBytes(value),
    ]),
  )

const signRawFixture = (
  label: "request" | "response",
  unsigned: RawEnvelope,
): Readonly<{ envelope: RawEnvelope; bytes: Uint8Array }> => {
  const signatureInput = frameCanonicalIdentity("evidenceBundle", [
    new TextEncoder().encode(`runtime-invocation-v1.17:${label}`),
    canonicalFixtureBytes(unsigned),
  ])
  const envelope = {
    ...unsigned,
    authentication: {
      algorithm: "hmac-sha256",
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      signatureInputSha256: sha256(signatureInput),
      signature: `hmac-sha256:${createHmac("sha256", fixtureSecret)
        .update(signatureInput)
        .digest("hex")}`,
    },
  } as unknown as RawEnvelope
  return {
    envelope,
    bytes: canonicalFixtureBytes(envelope),
  }
}

const executionPrestateFixture = (input?: {
  readonly revision?: number
  readonly selectActivations?: number
  readonly soldierBrain?: number
  readonly invocationCount?: number
  readonly wallMilliseconds?: number
  readonly computeFuel?: number
  readonly payloadBytes?: number
  readonly stdoutBytes?: number
  readonly stderrBytes?: number
  readonly memoryBytes?: number
  readonly commitments?: readonly JsonValue[]
}) => ({
  schemaVersion: "runtime-budget-ledger-v1",
  domain: "execution",
  revision: input?.revision ?? 0,
  methodInvocations: {
    selectActivations: input?.selectActivations ?? 0,
    soldierBrain: input?.soldierBrain ?? 0,
  },
  cumulative: {
    invocationCount: input?.invocationCount ?? 0,
    wallMilliseconds: input?.wallMilliseconds ?? 0,
    computeFuel: input?.computeFuel ?? 0,
    payloadBytes: input?.payloadBytes ?? 0,
    stdoutBytes: input?.stdoutBytes ?? 0,
    stderrBytes: input?.stderrBytes ?? 0,
    memoryBytes: input?.memoryBytes ?? 0,
  },
  commitments: [...(input?.commitments ?? [])],
})

const methodLimitFixture = (method: "selectActivations" | "soldierBrain") => ({
  method,
  invocationCountMaximum: method === "selectActivations" ? 20 : 240,
  counters: {
    wallMilliseconds: { semantics: "counter", maximum: 50 },
    computeFuel: { semantics: "counter", maximum: 10_000_000 },
    payloadBytes: { semantics: "counter", maximum: 262_144 },
    stdoutBytes: { semantics: "counter", maximum: 262_144 },
    stderrBytes: { semantics: "counter", maximum: 65_536 },
  },
  memory: { semantics: "peak", maximumBytes: 67_108_864 },
  process: {
    semantics: "predicate",
    processes: 1,
    threads: 1,
    children: 0,
  },
  capabilities: {
    semantics: "predicate",
    filesystem: "none",
    network: "disabled",
    environment: "empty",
    shell: "disabled",
  },
  cancellation: {
    semantics: "predicate",
    terminationGraceMilliseconds: 100,
    evidence: "adapter-termination-receipt-required",
  },
  accountingEvidence: { semantics: "predicate", required: true },
})

const matchLimitFixture = () => ({
  methodInvocations: { selectActivations: 20, soldierBrain: 240 },
  counters: {
    invocationCount: { semantics: "counter", maximum: 260 },
    wallMilliseconds: { semantics: "counter", maximum: 13_000 },
    computeFuel: { semantics: "counter", maximum: 2_600_000_000 },
    payloadBytes: { semantics: "counter", maximum: 68_157_440 },
    stdoutBytes: { semantics: "counter", maximum: 68_157_440 },
    stderrBytes: { semantics: "counter", maximum: 17_039_360 },
  },
  memory: { semantics: "peak", maximumBytes: 67_108_864 },
  overflow: "stop-before-next-invocation-and-classify-by-proven-cause",
})

interface FutureRequestFixtureOptions {
  readonly method?: "selectActivations" | "soldierBrain"
  readonly inputValue?: JsonValue
  readonly prestate?: ReturnType<typeof executionPrestateFixture>
}

const futureRequestFixture = (
  options: FutureRequestFixtureOptions = {},
): Readonly<{
  envelope: RawEnvelope
  bytes: Uint8Array
}> => {
  const method = options.method ?? "selectActivations"
  const current = candidateRequest(method) as unknown as RawEnvelope
  const {
    authentication: _authentication,
    budget: _budget,
    input: _input,
    ...base
  } = current
  const inputValue =
    options.inputValue ?? ({ cycleIndex: 0, phase: "ROUND" } as JsonValue)
  const inputBytes = canonicalFixtureBytes(inputValue)
  const input = {
    value: inputValue,
    canonicalSha256: sha256(inputBytes),
    canonicalByteLength: inputBytes.byteLength,
  }
  const budgetWithoutHash = {
    profileId: "runtime-budget-profile-v1.17-candidate",
    methodLimit: methodLimitFixture(method),
    matchLimit: matchLimitFixture(),
  }
  const budget = {
    ...budgetWithoutHash,
    profileSha256: RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256,
  }
  const prestate = options.prestate ?? executionPrestateFixture()
  const prestateSha256 = framedFixtureHash(
    "runtime-invocation-v1.17:execution-ledger-prestate",
    prestate as unknown as JsonValue,
  )
  const requestIdentity = framedFixtureHash(
    "runtime-invocation-v1.17:execution-request-identity",
    {
      invocationId: base.invocationId,
      kernelRequestId: base.kernelRequestId,
      method,
      semanticTupleId: (base.semanticTuple as RawEnvelope).tupleId,
      strategyRevisionId: (base.sourceIdentity as RawEnvelope)
        .strategyRevisionId,
      artifactSha256: (base.sourceIdentity as RawEnvelope).artifactSha256,
      budgetProfileSha256: budget.profileSha256,
      inputSha256: input.canonicalSha256,
      prestateSha256,
    } as unknown as JsonValue,
  )
  const idempotencyKeySha256 = framedFixtureHash(
    "runtime-invocation-v1.17:execution-idempotency",
    {
      invocationId: base.invocationId,
      prestateRevision: prestate.revision,
      requestIdentity,
    } as unknown as JsonValue,
  )
  const accountingWithoutIdentity = {
    schemaVersion: "runtime-invocation-accounting-v1.17",
    domain: "execution",
    prestate,
    prestateSha256,
    requestIdentity,
    idempotencyKeySha256,
  }
  const accounting = {
    ...accountingWithoutIdentity,
    identitySha256: framedFixtureHash(
      "runtime-invocation-v1.17:execution-accounting-request",
      accountingWithoutIdentity as unknown as JsonValue,
    ),
  }
  return signRawFixture("request", {
    ...base,
    method,
    budget: budget as unknown as JsonValue,
    input: input as unknown as JsonValue,
    accounting: accounting as unknown as JsonValue,
  })
}

const resignRawRequestFixture = (
  request: RawEnvelope,
  mutate: (unsigned: RawEnvelope) => void,
) => {
  const copy = globalThis.structuredClone(request)
  delete copy.authentication
  mutate(copy)
  return signRawFixture("request", copy)
}

type FutureOutcomeKind = "success" | "player_violation" | "system_failure"

const futureResponseFixture = (
  requestFixture: ReturnType<typeof futureRequestFixture>,
  kind: FutureOutcomeKind,
  mutate?: (unsigned: RawEnvelope) => void,
  successByteDeltas?: Readonly<{
    payloadBytes: number
    stdoutBytes: number
    stderrBytes: number
  }>,
): Readonly<{ envelope: RawEnvelope; bytes: Uint8Array }> => {
  const request = requestFixture.envelope
  const requestAccounting = request.accounting as RawEnvelope
  const prestate = requestAccounting.prestate as RawEnvelope
  const cumulative = prestate.cumulative as RawEnvelope
  const methods = prestate.methodInvocations as RawEnvelope
  const method = request.method as "selectActivations" | "soldierBrain"
  const successValue = { activationOrders: [], strategyMemory: null }
  const successPayload = canonicalFixtureBytes(successValue)
  const observedSuccessDeltas =
    successByteDeltas ??
    ({
      payloadBytes: successPayload.byteLength,
      stdoutBytes: successPayload.byteLength + 1,
      stderrBytes: 0,
    } as const)
  const requestBinding = {
    requestId: request.requestId,
    invocationId: request.invocationId,
    kernelRequestId: request.kernelRequestId,
    method,
    requestSha256: sha256(requestFixture.bytes),
    semanticTupleId: (request.semanticTuple as RawEnvelope).tupleId,
    runtimeAbiVersion: (request.semanticTuple as RawEnvelope).runtimeAbi,
    strategyRevisionId: (request.sourceIdentity as RawEnvelope)
      .strategyRevisionId,
    artifactSha256: (request.sourceIdentity as RawEnvelope).artifactSha256,
    budgetProfileSha256: (request.budget as RawEnvelope).profileSha256,
    inputSha256: (request.input as RawEnvelope).canonicalSha256,
    retryIdentitySha256: (request.retry as RawEnvelope).identitySha256,
    accountingIdentitySha256: requestAccounting.identitySha256,
    idempotencyKeySha256: requestAccounting.idempotencyKeySha256,
  }
  const trace = {
    requestId: request.requestId,
    invocationId: request.invocationId,
    kernelRequestId: request.kernelRequestId,
    method,
    requestSha256: requestBinding.requestSha256,
    budgetProfileSha256: requestBinding.budgetProfileSha256,
    inputSha256: requestBinding.inputSha256,
    retryIdentitySha256: requestBinding.retryIdentitySha256,
    accountingIdentitySha256: requestBinding.accountingIdentitySha256,
    idempotencyKeySha256: requestBinding.idempotencyKeySha256,
    safeCodes: ["ADAPTER_AUTHENTICATED", "ACCOUNTING_EVIDENCE_BOUND"],
  }
  const measuredCounters = Object.fromEntries(
    [
      "wallMilliseconds",
      "computeFuel",
      "payloadBytes",
      "stdoutBytes",
      "stderrBytes",
    ].map((counter) => {
      const delta =
        kind === "success" && counter in observedSuccessDeltas
          ? observedSuccessDeltas[counter as keyof typeof observedSuccessDeltas]
          : 1
      return [
        counter,
        {
          status: "measured",
          delta,
          cumulative: (cumulative[counter] as number) + delta,
        },
      ]
    }),
  ) as RawEnvelope
  const receiptWithoutEvidenceIdentity = {
    domain: "execution",
    prestateRevision: prestate.revision,
    invocationId: request.invocationId,
    requestIdentity: requestAccounting.requestIdentity,
    method,
    attribution: kind === "system_failure" ? "ambiguous" : "proven_strategy",
    counters:
      kind === "system_failure"
        ? {
            ...measuredCounters,
            computeFuel: { status: "unavailable" },
          }
        : measuredCounters,
    memory: {
      status: "measured",
      peakBytes: 1,
      cumulativePeakBytes: Math.max(cumulative.memoryBytes as number, 1),
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
  const evidenceIdentity = framedFixtureHash(
    "runtime-invocation-v1.17:execution-evidence",
    receiptWithoutEvidenceIdentity as unknown as JsonValue,
  )
  const receipt = {
    ...receiptWithoutEvidenceIdentity,
    evidenceIdentity,
  }
  const committed = kind !== "system_failure"
  const poststate = committed
    ? {
        ...prestate,
        revision: (prestate.revision as number) + 1,
        methodInvocations: {
          ...methods,
          [method]: (methods[method] as number) + 1,
        },
        cumulative: {
          invocationCount: (cumulative.invocationCount as number) + 1,
          wallMilliseconds: (cumulative.wallMilliseconds as number) + 1,
          computeFuel: (cumulative.computeFuel as number) + 1,
          payloadBytes:
            (cumulative.payloadBytes as number) +
            ((measuredCounters.payloadBytes as RawEnvelope).delta as number),
          stdoutBytes:
            (cumulative.stdoutBytes as number) +
            ((measuredCounters.stdoutBytes as RawEnvelope).delta as number),
          stderrBytes:
            (cumulative.stderrBytes as number) +
            ((measuredCounters.stderrBytes as RawEnvelope).delta as number),
          memoryBytes: Math.max(cumulative.memoryBytes as number, 1),
        },
        commitments: [
          ...(prestate.commitments as JsonValue[]),
          {
            identity: request.invocationId,
            requestIdentity: requestAccounting.requestIdentity,
            evidenceIdentity,
            prestateRevision: prestate.revision,
            scope: method,
            outcome: "success",
            dimensions: [],
          },
        ],
      }
    : prestate
  const accountingWithoutIdentity = {
    schemaVersion: "runtime-invocation-accounting-v1.17",
    domain: "execution",
    prestateSha256: requestAccounting.prestateSha256,
    idempotencyKeySha256: requestAccounting.idempotencyKeySha256,
    disposition: committed ? "commit" : "no_commit",
    receipt,
    poststate,
    poststateSha256: framedFixtureHash(
      "runtime-invocation-v1.17:execution-ledger-poststate",
      poststate as unknown as JsonValue,
    ),
  }
  const accounting = {
    ...accountingWithoutIdentity,
    identitySha256: framedFixtureHash(
      "runtime-invocation-v1.17:execution-accounting-response",
      accountingWithoutIdentity as unknown as JsonValue,
    ),
  }
  const outcome =
    kind === "success"
      ? {
          kind,
          value: successValue,
          trace,
        }
      : kind === "player_violation"
        ? {
            kind,
            violation: {
              code: "INVALID_OUTPUT",
              publicMessage: "Strategy returned an invalid payload.",
            },
            trace,
          }
        : {
            kind,
            failure: {
              code: "AMBIGUOUS_ATTRIBUTION",
              publicMessage: "Runtime system failure.",
              retryable: false,
            },
            trace,
          }
  const payload = kind === "success" ? successPayload : undefined
  const unsigned = {
    contractVersion: request.contractVersion,
    candidateStatus: request.candidateStatus,
    current: false,
    envelopeKind: "runtime-invocation-response",
    requestBinding,
    outcome,
    payloadBinding:
      payload === undefined
        ? null
        : {
            sha256: sha256(payload),
            canonicalByteLength: payload.byteLength,
          },
    accounting,
  } as unknown as RawEnvelope
  mutate?.(unsigned)
  return signRawFixture("response", unsigned)
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
  accountingIdentitySha256: hash("5"),
  idempotencyKeySha256: hash("6"),
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
      strategy_exhaustion_proven: [
        "player_violation",
        "RESOURCE_EXHAUSTION",
      ],
      strategy_timeout: ["system_failure", "TIMEOUT"],
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
      {
        ...success,
        value: {
          activationOrders: [{ soldierId: "soldier", private: true }],
          strategyMemory: null,
        },
      },
      {
        ...success,
        value: {
          activationOrders: [],
          strategyMemory: null,
          private: true,
        },
      },
      {
        kind: "success",
        value: {
          action: { type: "TURN_TO_STONE", direction: "UP" },
          soldierMemory: null,
        },
        trace: { ...trace(), method: "soldierBrain" },
      },
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
      TIMEOUT: false,
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
  it.each([
    [
      "result",
      "selectActivations",
      {
        activationOrders: [],
        strategyMemory: null,
        private: true,
      },
    ],
    [
      "activation order",
      "selectActivations",
      {
        activationOrders: [{ soldierId: "soldier:1", private: true }],
        strategyMemory: null,
      },
    ],
    [
      "action",
      "soldierBrain",
      {
        action: { type: "TURN_TO_STONE", direction: "UP" },
        soldierMemory: null,
      },
    ],
  ] as const)(
    "rejects signed unknown nested %s keys",
    (_label, method, value) => {
      const signed = signedSuccessResponseBytes(
        method,
        value as unknown as JsonValue,
      )
      expect(
        verifyRuntimeInvocationResponseV117(signed.bytes, signed.request, {
          keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
          secret: fixtureSecret,
        }),
      ).toMatchObject({
        kind: "system_failure",
        failure: {
          code: "OUTER_FRAME_UNDECODABLE",
          retryable: false,
        },
      })
    },
  )

  it("rejects a signed success payload over the 256 KiB invocation cap", () => {
    const value = {
      activationOrders: Array.from({ length: 270 }, (_, index) => ({
        soldierId: `soldier:${index}`,
        objective: "x".repeat(1022),
      })),
      strategyMemory: null,
    }
    const payload = encodeCanonicalJson(value, {
      context: "decoded-strategy-payload",
    })
    expect(payload.ok).toBe(true)
    if (!payload.ok) return
    expect(payload.bytes.byteLength).toBeGreaterThan(
      RUNTIME_ABI_V1_17.fieldCaps.invocationOutput.value,
    )

    const signed = signedSuccessResponseBytes("selectActivations", value)
    expect(
      verifyRuntimeInvocationResponseV117(signed.bytes, signed.request, {
        keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
        secret: fixtureSecret,
      }),
    ).toMatchObject({
      kind: "system_failure",
      failure: {
        code: "OUTER_FRAME_UNDECODABLE",
        retryable: false,
      },
    })
  })

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

  it("keeps the generated candidate fixtures on the exact ledger wire", () => {
    const request = candidateRequest()
    const response = candidateResponse(request)
    const requestBytes = serializeRuntimeInvocationRequestV117(request)
    const responseBytes = serializeRuntimeInvocationResponseV117(response)
    const fixtureRequestBytes = readFileSync(requestFixturePath)
    const fixtureResponseBytes = readFileSync(responseFixturePath)
    expect(sha256(fixtureRequestBytes)).toBe(
      "sha256:76d4568f6b0e7f9760f9a0f72d1140212ff28e9a1b60897126f433d4a07f61ae",
    )
    expect(sha256(fixtureResponseBytes)).toBe(
      "sha256:94dcf3bb2b3c7437cecf7cd59493e6be7d4d0c0de3475c747e8af888228f099e",
    )
    expect(Buffer.from(requestBytes)).toEqual(fixtureRequestBytes)
    expect(Buffer.from(responseBytes)).toEqual(fixtureResponseBytes)
    expect(
      verifyRuntimeInvocationRequestV117(fixtureRequestBytes, {
        keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
        secret: fixtureSecret,
      }),
    ).toMatchObject({
      kind: "success",
      value: { accounting: request.accounting },
    })
    expect(request.authentication.signatureInputSha256).toMatch(
      /^sha256:[0-9a-f]{64}$/u,
    )
    expect(response.authentication.signatureInputSha256).toMatch(
      /^sha256:[0-9a-f]{64}$/u,
    )
  })

  it("authenticates complete request, payload, retry, and accounting bindings", () => {
    const expectedRequest = candidateRequest()
    const requestBytes = serializeRuntimeInvocationRequestV117(expectedRequest)
    const request = verifyRuntimeInvocationRequestV117(requestBytes, {
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      secret: fixtureSecret,
    })
    expect(request.kind).toBe("success")
    if (request.kind !== "success") return
    const { profileSha256: _profileSha256, ...verifiedBudget } =
      request.value.budget
    expect(verifiedBudget).toEqual(
      createRuntimeInvocationBudgetV117("selectActivations"),
    )
    expect(request.value.accounting).toEqual(expectedRequest.accounting)
    expect(request.trace.safeCodes).toEqual([
      "ADAPTER_AUTHENTICATED",
      "OUTER_BINDINGS_VERIFIED",
    ])
    const expectedResponse = candidateResponse(request.value)
    const response = verifyRuntimeInvocationResponseV117(
      serializeRuntimeInvocationResponseV117(expectedResponse),
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
      expect(responseValue.accounting).toMatchObject({
        domain: "execution",
        disposition: "commit",
        prestateSha256: request.value.accounting.prestateSha256,
        idempotencyKeySha256: request.value.accounting.idempotencyKeySha256,
        poststate: {
          revision: 1,
          cumulative: { invocationCount: 1 },
        },
      })
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

    const request = candidateRequest()
    const requestBytes = serializeRuntimeInvocationRequestV117(request)
    const tamperedRequest = Buffer.from(requestBytes)
    const budgetMarker = Buffer.from(requestBytes).indexOf(
      Buffer.from(request.budget.profileSha256),
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

    const responseBytes = serializeRuntimeInvocationResponseV117(
      candidateResponse(request),
    )
    const wrongBudget = {
      ...request,
      budget: { ...request.budget, profileSha256: hash("9") },
    }
    const wrongBinding = verifyRuntimeInvocationResponseV117(
      responseBytes,
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
      responseBytes,
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
      responseBytes,
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
      responseBytes.subarray(0, -1),
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
        accountingIdentitySha256: request.accounting.identitySha256,
        idempotencyKeySha256: request.accounting.idempotencyKeySha256,
      },
    }

    expect(() =>
      createAuthenticatedRuntimeInvocationResponseV117(
        request,
        mismatchedOutcome,
        measuredReceiptFor(request),
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
        "9c72e5b0ee3ddfb36a7aec51a5a1ead508b2fae29eace27a73b9fda7d55ce23c",
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
      "createRuntimeInvocationBudgetV117",
      "createRuntimeInvocationExecutionReceiptV117",
      "createRuntimeInvocationTraceV117",
      "createRuntimeAbiV117ExecutionLedger",
      "createRuntimeAbiV117PreflightLedger",
      "debitRuntimeAbiV117Ledger",
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

describe("runtime invocation v1.17 authenticated execution accounting", () => {
  const identity = {
    keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
    secret: fixtureSecret,
  } as const

  it("rejects the old generic output alias and missing execution ledger", () => {
    const current = futureRequestFixture()
    const invalidFixtures = [
      resignRawRequestFixture(current.envelope, (unsigned) => {
        const budget = unsigned.budget as RawEnvelope
        const methodLimit = budget.methodLimit as RawEnvelope
        const counters = methodLimit.counters as RawEnvelope
        delete counters.payloadBytes
        delete counters.stdoutBytes
        delete counters.stderrBytes
        counters.outputBytes = {
          semantics: "counter",
          maximum: 262_144,
        }
      }),
      resignRawRequestFixture(current.envelope, (unsigned) => {
        delete unsigned.accounting
      }),
    ]

    for (const invalid of invalidFixtures) {
      expect(
        verifyRuntimeInvocationRequestV117(invalid.bytes, identity),
      ).toMatchObject({
        kind: "system_failure",
        failure: { code: "OUTER_FRAME_UNDECODABLE" },
      })
    }
  })

  it("accepts one exact signed methodLimit, matchLimit, and execution prestate", () => {
    const fixture = futureRequestFixture()
    const verified = verifyRuntimeInvocationRequestV117(fixture.bytes, identity)
    expect(verified.kind).toBe("success")
  })

  it("binds both methods and every capability lane to one full ABI budget profile", () => {
    const selectRequest = candidateRequest("selectActivations")
    const soldierRequest = candidateRequest("soldierBrain")
    expect(selectRequest.budget.profileSha256).toBe(
      RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256,
    )
    expect(soldierRequest.budget.profileSha256).toBe(
      RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256,
    )
    expect(RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17.budgetProfileSha256).toBe(
      RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256,
    )
    const artifact = JSON.parse(
      readFileSync(
        path.join(
          repoRoot,
          "packages/spec/artifacts/runtime-abi-v1.17-budget-capabilities.json",
        ),
        "utf8",
      ),
    ) as {
      lanes: Array<{
        identityPins: Array<{
          pin: string
          bindingSafeId: string | null
        }>
      }>
    }
    for (const lane of artifact.lanes) {
      expect(
        lane.identityPins.find(({ pin }) => pin === "budgetProfileSha256")
          ?.bindingSafeId,
      ).toBe(RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256)
    }
  })

  it.each([
    ["measured", measuredReceiptFor, "success", undefined],
    [
      "unavailable",
      unavailableReceiptFor,
      "system_failure",
      "METER_EVIDENCE_UNAVAILABLE",
    ],
    [
      "ambiguous",
      ambiguousReceiptFor,
      "system_failure",
      "METER_EVIDENCE_AMBIGUOUS",
    ],
  ] as const)(
    "constructs one strict request-bound %s receipt",
    (_name, buildReceipt, expectedKind, expectedCode) => {
      const request = candidateRequest()
      const receipt = buildReceipt(request)
      expect(receipt).toMatchObject({
        domain: "execution",
        prestateRevision: request.accounting.prestate.revision,
        invocationId: request.invocationId,
        requestIdentity: request.accounting.requestIdentity,
        method: request.method,
      })
      const { evidenceIdentity, ...withoutEvidenceIdentity } = receipt
      expect(evidenceIdentity).toBe(
        framedFixtureHash(
          "runtime-invocation-v1.17:execution-evidence",
          withoutEvidenceIdentity as unknown as JsonValue,
        ),
      )
      const debit = debitRuntimeAbiV117Ledger(
        request.accounting.prestate,
        receipt,
      )
      expect(debit.kind).toBe(expectedKind)
      if (debit.kind === "system_failure") {
        expect(debit.failure.code).toBe(expectedCode)
      }
    },
  )

  it("constructs the complete trace from the authenticated request binding", () => {
    const request = candidateRequest()
    expect(
      createRuntimeInvocationTraceV117(request, [
        "ADAPTER_AUTHENTICATED",
        "ACCOUNTING_EVIDENCE_BOUND",
      ]),
    ).toEqual({
      requestId: request.requestId,
      invocationId: request.invocationId,
      kernelRequestId: request.kernelRequestId,
      method: request.method,
      requestSha256: sha256(serializeRuntimeInvocationRequestV117(request)),
      budgetProfileSha256: request.budget.profileSha256,
      inputSha256: request.input.canonicalSha256,
      retryIdentitySha256: request.retry.identitySha256,
      accountingIdentitySha256: request.accounting.identitySha256,
      idempotencyKeySha256: request.accounting.idempotencyKeySha256,
      safeCodes: ["ADAPTER_AUTHENTICATED", "ACCOUNTING_EVIDENCE_BOUND"],
    })
  })

  it("authenticates proven process excess as committed resource exhaustion", () => {
    const request = candidateRequest()
    const measured = measuredEvidenceFor(request)
    const receipt = createRuntimeInvocationExecutionReceiptV117(request, {
      ...measured,
      process: {
        status: "verified",
        processes: 1,
        threads: 2,
        children: 0,
      },
    })
    const response = createAuthenticatedRuntimeInvocationResponseV117(
      request,
      {
        kind: "player_violation",
        violation:
          RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.RESOURCE_EXHAUSTION,
        trace: createRuntimeInvocationTraceV117(request, [
          "ADAPTER_AUTHENTICATED",
          "ACCOUNTING_EVIDENCE_BOUND",
        ]),
      },
      receipt,
      identity,
    )
    expect(response).toMatchObject({
      outcome: {
        kind: "player_violation",
        violation: { code: "RESOURCE_EXHAUSTION" },
      },
      accounting: {
        disposition: "commit",
        poststate: {
          revision: 1,
          commitments: [
            {
              outcome: "player_violation",
              dimensions: ["invocation.process"],
            },
          ],
        },
      },
    })
    expect(
      verifyRuntimeInvocationResponseV117(
        serializeRuntimeInvocationResponseV117(response),
        request,
        identity,
      ),
    ).toMatchObject({ kind: "success" })
  })

  it("fails closed on signed accounting drift and a preflight-domain request", () => {
    const fixture = futureRequestFixture()
    const cases = [
      [
        "prestate",
        (root: RawEnvelope) => {
          const accounting = root.accounting as RawEnvelope
          const prestate = accounting.prestate as RawEnvelope
          prestate.revision = 1
        },
      ],
      [
        "idempotency",
        (root: RawEnvelope) => {
          const accounting = root.accounting as RawEnvelope
          accounting.idempotencyKeySha256 = hash("9")
        },
      ],
      [
        "accounting identity",
        (root: RawEnvelope) => {
          const accounting = root.accounting as RawEnvelope
          accounting.identitySha256 = hash("8")
        },
      ],
      [
        "method binding",
        (root: RawEnvelope) => {
          const budget = root.budget as RawEnvelope
          const methodLimit = budget.methodLimit as RawEnvelope
          methodLimit.method = "soldierBrain"
        },
      ],
      [
        "preflight domain",
        (root: RawEnvelope) => {
          const accounting = root.accounting as RawEnvelope
          accounting.domain = "preflight"
        },
      ],
    ] as const

    for (const [name, mutate] of cases) {
      const invalid = resignRawRequestFixture(fixture.envelope, mutate)
      expect(
        verifyRuntimeInvocationRequestV117(invalid.bytes, identity).kind,
        name,
      ).toBe("system_failure")
    }
  })

  it.each(["success", "player_violation", "system_failure"] as const)(
    "requires and accepts signed %s response accounting",
    (kind) => {
      const request = futureRequestFixture()
      const response = futureResponseFixture(request, kind)
      const verified = verifyRuntimeInvocationResponseV117(
        response.bytes,
        request.envelope as unknown as AuthenticatedRuntimeInvocationRequestV117,
        identity,
      )
      expect(verified.kind).toBe("success")
    },
  )

  it.each(["payloadBytes", "stdoutBytes", "stderrBytes"] as const)(
    "rejects fully re-bound %s accounting that contradicts the observed success frame",
    (counter) => {
      const request = futureRequestFixture()
      const payloadBytes = canonicalFixtureBytes({
        activationOrders: [],
        strategyMemory: null,
      }).byteLength
      const observed = {
        payloadBytes,
        stdoutBytes: payloadBytes + 1,
        stderrBytes: 0,
      }
      const response = futureResponseFixture(request, "success", undefined, {
        ...observed,
        [counter]: counter === "stderrBytes" ? 1 : observed[counter] - 1,
      })

      expect(
        verifyRuntimeInvocationResponseV117(
          response.bytes,
          request.envelope as unknown as AuthenticatedRuntimeInvocationRequestV117,
          identity,
        ),
      ).toMatchObject({
        kind: "system_failure",
        failure: { code: "OUTER_FRAME_WRONG_BINDING", retryable: false },
      })
    },
  )

  it("rejects a signed response with no accounting envelope", () => {
    const request = futureRequestFixture()
    const response = futureResponseFixture(request, "success", (unsigned) => {
      delete unsigned.accounting
    })
    expect(
      verifyRuntimeInvocationResponseV117(
        response.bytes,
        request.envelope as unknown as AuthenticatedRuntimeInvocationRequestV117,
        identity,
      ).kind,
    ).toBe("system_failure")
  })

  it("rejects invalid counter, peak, predicate, evidence, and ownership combinations", () => {
    const request = futureRequestFixture()
    const invalidResponses = [
      [
        "counter decrease",
        futureResponseFixture(request, "success", (root) => {
          const accounting = root.accounting as RawEnvelope
          const receipt = accounting.receipt as RawEnvelope
          const counters = receipt.counters as RawEnvelope
          const wall = counters.wallMilliseconds as RawEnvelope
          wall.cumulative = -1
        }),
      ],
      [
        "counter wrong sum",
        futureResponseFixture(request, "success", (root) => {
          const accounting = root.accounting as RawEnvelope
          const receipt = accounting.receipt as RawEnvelope
          const counters = receipt.counters as RawEnvelope
          const wall = counters.wallMilliseconds as RawEnvelope
          wall.delta = 2
          wall.cumulative = 1
        }),
      ],
      [
        "unsafe counter addition",
        futureResponseFixture(request, "success", (root) => {
          const accounting = root.accounting as RawEnvelope
          const receipt = accounting.receipt as RawEnvelope
          const counters = receipt.counters as RawEnvelope
          const wall = counters.wallMilliseconds as RawEnvelope
          wall.delta = Number.MAX_SAFE_INTEGER
          wall.cumulative = Number.MAX_SAFE_INTEGER
        }),
      ],
      [
        "peak summed",
        futureResponseFixture(request, "success", (root) => {
          const accounting = root.accounting as RawEnvelope
          const receipt = accounting.receipt as RawEnvelope
          const memory = receipt.memory as RawEnvelope
          memory.peakBytes = 1
          memory.cumulativePeakBytes = 2
        }),
      ],
      [
        "failed predicate with success",
        futureResponseFixture(request, "success", (root) => {
          const accounting = root.accounting as RawEnvelope
          const receipt = accounting.receipt as RawEnvelope
          const process = receipt.process as RawEnvelope
          process.threads = 2
        }),
      ],
      [
        "failed predicate with player violation",
        futureResponseFixture(request, "player_violation", (root) => {
          const accounting = root.accounting as RawEnvelope
          const receipt = accounting.receipt as RawEnvelope
          const capabilities = receipt.capabilities as RawEnvelope
          capabilities.network = "inherited"
        }),
      ],
      [
        "unavailable success",
        futureResponseFixture(request, "success", (root) => {
          const accounting = root.accounting as RawEnvelope
          const receipt = accounting.receipt as RawEnvelope
          const counters = receipt.counters as RawEnvelope
          counters.computeFuel = { status: "unavailable" }
        }),
      ],
      [
        "ambiguous player violation",
        futureResponseFixture(request, "player_violation", (root) => {
          const accounting = root.accounting as RawEnvelope
          const receipt = accounting.receipt as RawEnvelope
          receipt.attribution = "ambiguous"
        }),
      ],
      [
        "system failure commit",
        futureResponseFixture(request, "system_failure", (root) => {
          const accounting = root.accounting as RawEnvelope
          accounting.disposition = "commit"
        }),
      ],
      [
        "system failure changed poststate",
        futureResponseFixture(request, "system_failure", (root) => {
          const accounting = root.accounting as RawEnvelope
          const poststate = accounting.poststate as RawEnvelope
          poststate.revision = 1
        }),
      ],
    ] as const

    for (const [name, response] of invalidResponses) {
      expect(
        verifyRuntimeInvocationResponseV117(
          response.bytes,
          request.envelope as unknown as AuthenticatedRuntimeInvocationRequestV117,
          identity,
        ).kind,
        name,
      ).toBe("system_failure")
    }
  })

  it("rejects response replay under another method, input, or ledger prestate", () => {
    const original = futureRequestFixture()
    const response = futureResponseFixture(original, "success")
    const changedPrestate = executionPrestateFixture({
      revision: 1,
      selectActivations: 1,
      invocationCount: 1,
      wallMilliseconds: 1,
      commitments: [
        {
          identity: "invocation:prior",
          requestIdentity: hash("1"),
          evidenceIdentity: hash("2"),
          prestateRevision: 0,
          scope: "selectActivations",
          outcome: "success",
          dimensions: [],
        },
      ],
    })
    const replays = [
      ["method", futureRequestFixture({ method: "soldierBrain" })],
      ["input", futureRequestFixture({ inputValue: { different: true } })],
      ["prestate", futureRequestFixture({ prestate: changedPrestate })],
    ] as const
    for (const [name, expectedRequest] of replays) {
      expect(
        verifyRuntimeInvocationResponseV117(
          response.bytes,
          expectedRequest.envelope as unknown as AuthenticatedRuntimeInvocationRequestV117,
          identity,
        ).kind,
        name,
      ).toBe("system_failure")
    }
  })
})
