import { Buffer } from "node:buffer"
import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { z } from "zod"
import {
  frameCanonicalIdentity,
  hashCanonicalIdentityValue,
} from "./canonical-identity-domains.js"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import {
  admitCanonicalJsonBytes,
  admitCanonicalJsonValue,
  type CanonicalJsonBoundaryProfileId,
} from "./canonical-json.js"
import {
  SoldierBrainResultV117Schema,
  StrategyResultV117Schema,
} from "./runtime-payload-v1-17.js"
import type { JsonValue } from "./types.js"

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

export const RUNTIME_INVOCATION_V1_17_CANDIDATE = deepFreeze({
  contractVersion: "runtime-invocation-v1.17",
  runtimeAbiVersion: "strategy-runtime-abi-v1.17",
  lifecycle: "inactive-candidate",
  activationPlan: "258-14",
  current: false,
} as const)

export const RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATION_CODES = deepFreeze([
  "INVALID_OUTPUT",
  "TIMEOUT",
  "THROWN_EXCEPTION",
  "FORBIDDEN_CAPABILITY",
  "OVERSIZED_OUTPUT",
] as const)

export type RuntimeInvocationPlayerViolationCodeV117 =
  (typeof RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATION_CODES)[number]

export const RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS = deepFreeze({
  INVALID_OUTPUT: {
    code: "INVALID_OUTPUT",
    publicMessage: "Strategy returned an invalid payload.",
  },
  TIMEOUT: {
    code: "TIMEOUT",
    publicMessage: "Strategy exhausted its invocation budget.",
  },
  THROWN_EXCEPTION: {
    code: "THROWN_EXCEPTION",
    publicMessage: "Strategy threw an exception.",
  },
  FORBIDDEN_CAPABILITY: {
    code: "FORBIDDEN_CAPABILITY",
    publicMessage: "Strategy attempted a forbidden capability.",
  },
  OVERSIZED_OUTPUT: {
    code: "OVERSIZED_OUTPUT",
    publicMessage: "Strategy exceeded its output budget.",
  },
} as const)

export const RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES = deepFreeze([
  "OUTER_FRAME_MISSING",
  "OUTER_FRAME_TRUNCATED",
  "OUTER_FRAME_UNAUTHENTICATED",
  "OUTER_FRAME_WRONG_BINDING",
  "OUTER_FRAME_UNDECODABLE",
  "ADAPTER_CRASH",
  "RUNTIME_CRASH",
  "HOST_CRASH",
  "TRANSPORT_CRASH",
  "AMBIGUOUS_ATTRIBUTION",
] as const)

export type RuntimeInvocationSystemFailureCodeV117 =
  (typeof RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES)[number]

export type RuntimeInvocationMethodV117 =
  | "selectActivations"
  | "soldierBrain"

export interface RuntimeInvocationTraceV117 {
  readonly requestId: string
  readonly invocationId: string
  readonly kernelRequestId: string
  readonly method: RuntimeInvocationMethodV117
  readonly requestSha256: `sha256:${string}`
  readonly budgetProfileSha256: `sha256:${string}`
  readonly inputSha256: `sha256:${string}`
  readonly retryIdentitySha256: `sha256:${string}`
  readonly safeCodes: readonly string[]
}

export type RuntimeInvocationPlayerViolationV117 =
  (typeof RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS)[RuntimeInvocationPlayerViolationCodeV117]

export interface RuntimeInvocationSystemFailureV117 {
  readonly code: RuntimeInvocationSystemFailureCodeV117
  readonly publicMessage: "Runtime system failure."
  readonly retryable: boolean
}

export type RuntimeInvocationResultV117<
  TValue = JsonValue,
> =
  | Readonly<{
      kind: "success"
      value: TValue
      trace: RuntimeInvocationTraceV117
      violation?: never
      failure?: never
    }>
  | Readonly<{
      kind: "player_violation"
      violation: RuntimeInvocationPlayerViolationV117
      trace: RuntimeInvocationTraceV117
      value?: never
      failure?: never
    }>
  | Readonly<{
      kind: "system_failure"
      failure: RuntimeInvocationSystemFailureV117
      trace: RuntimeInvocationTraceV117
      value?: never
      violation?: never
    }>

const canonicalJsonValueSchema = (
  profile: CanonicalJsonBoundaryProfileId,
): z.ZodType<JsonValue> =>
  z.custom<JsonValue>(() => true).superRefine((value, ctx) => {
    const admitted = admitCanonicalJsonValue(value, { profile })
    if (admitted.ok) return
    ctx.addIssue({
      code: "custom",
      path: [...admitted.error.path],
      message: `canonical-json-v1:${admitted.error.code}`,
    })
  })

const HostApiJsonValueSchema = canonicalJsonValueSchema("host-api-value")
const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u)
const SafeCodeSchema = z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/u)
const PublicIdSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u)

export const RuntimeInvocationTraceV117Schema = z
  .object({
    requestId: PublicIdSchema,
    invocationId: PublicIdSchema,
    kernelRequestId: PublicIdSchema,
    method: z.enum(["selectActivations", "soldierBrain"]),
    requestSha256: Sha256Schema,
    budgetProfileSha256: Sha256Schema,
    inputSha256: Sha256Schema,
    retryIdentitySha256: Sha256Schema,
    safeCodes: z.array(SafeCodeSchema).max(32),
  })
  .strict()

const RuntimeInvocationSuccessV117Schema = z.union([
  z
    .object({
      kind: z.literal("success"),
      value: StrategyResultV117Schema,
      trace: RuntimeInvocationTraceV117Schema.extend({
        method: z.literal("selectActivations"),
      }),
    })
    .strict(),
  z
    .object({
      kind: z.literal("success"),
      value: SoldierBrainResultV117Schema,
      trace: RuntimeInvocationTraceV117Schema.extend({
        method: z.literal("soldierBrain"),
      }),
    })
    .strict(),
])

const RuntimeInvocationPlayerViolationV117Schema = z
  .union(
    RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATION_CODES.map((code) =>
      z
        .object({
          kind: z.literal("player_violation"),
          violation: z
            .object({
              code: z.literal(code),
              publicMessage: z.literal(
                RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS[code].publicMessage,
              ),
            })
            .strict(),
          trace: RuntimeInvocationTraceV117Schema,
        })
        .strict(),
    ) as unknown as readonly [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]],
  )

const RuntimeInvocationSystemFailureV117Schema = z
  .object({
    kind: z.literal("system_failure"),
    failure: z
      .object({
        code: z.enum(RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES),
        publicMessage: z.literal("Runtime system failure."),
        retryable: z.boolean(),
      })
      .strict(),
    trace: RuntimeInvocationTraceV117Schema,
  })
  .strict()

export const RuntimeInvocationResultV117Schema = z.union([
  RuntimeInvocationSuccessV117Schema,
  RuntimeInvocationPlayerViolationV117Schema,
  RuntimeInvocationSystemFailureV117Schema,
])

export const RUNTIME_INVOCATION_V1_17_OWNERSHIP_MATRIX = deepFreeze({
  success: { kind: "success" },
  payload_duplicate_key: {
    kind: "player_violation",
    code: "INVALID_OUTPUT",
    publicMessage:
      RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.INVALID_OUTPUT.publicMessage,
  },
  payload_non_canonical: {
    kind: "player_violation",
    code: "INVALID_OUTPUT",
    publicMessage:
      RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.INVALID_OUTPUT.publicMessage,
  },
  payload_schema_invalid: {
    kind: "player_violation",
    code: "INVALID_OUTPUT",
    publicMessage:
      RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.INVALID_OUTPUT.publicMessage,
  },
  payload_illegal: {
    kind: "player_violation",
    code: "INVALID_OUTPUT",
    publicMessage:
      RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.INVALID_OUTPUT.publicMessage,
  },
  strategy_exception_proven: {
    kind: "player_violation",
    code: "THROWN_EXCEPTION",
    publicMessage:
      RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.THROWN_EXCEPTION.publicMessage,
  },
  strategy_exhaustion_proven: {
    kind: "player_violation",
    code: "TIMEOUT",
    publicMessage:
      RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.TIMEOUT.publicMessage,
  },
  outer_frame_missing: {
    kind: "system_failure",
    code: "OUTER_FRAME_MISSING",
    retryable: true,
  },
  outer_frame_truncated: {
    kind: "system_failure",
    code: "OUTER_FRAME_TRUNCATED",
    retryable: true,
  },
  outer_frame_unauthenticated: {
    kind: "system_failure",
    code: "OUTER_FRAME_UNAUTHENTICATED",
    retryable: false,
  },
  outer_frame_wrong_binding: {
    kind: "system_failure",
    code: "OUTER_FRAME_WRONG_BINDING",
    retryable: false,
  },
  outer_frame_undecodable: {
    kind: "system_failure",
    code: "OUTER_FRAME_UNDECODABLE",
    retryable: false,
  },
  adapter_crash: {
    kind: "system_failure",
    code: "ADAPTER_CRASH",
    retryable: true,
  },
  runtime_crash: {
    kind: "system_failure",
    code: "RUNTIME_CRASH",
    retryable: true,
  },
  host_crash: {
    kind: "system_failure",
    code: "HOST_CRASH",
    retryable: true,
  },
  transport_crash: {
    kind: "system_failure",
    code: "TRANSPORT_CRASH",
    retryable: true,
  },
  strategy_exception_ambiguous: {
    kind: "system_failure",
    code: "AMBIGUOUS_ATTRIBUTION",
    retryable: false,
  },
  strategy_exhaustion_ambiguous: {
    kind: "system_failure",
    code: "AMBIGUOUS_ATTRIBUTION",
    retryable: false,
  },
} as const)

export type RuntimeInvocationBoundaryEventV117 =
  keyof typeof RUNTIME_INVOCATION_V1_17_OWNERSHIP_MATRIX

export const classifyRuntimeInvocationV117 = <
  TValue extends JsonValue,
>(
  event: RuntimeInvocationBoundaryEventV117,
  trace: RuntimeInvocationTraceV117,
  value: TValue,
): RuntimeInvocationResultV117<TValue> => {
  const classification = RUNTIME_INVOCATION_V1_17_OWNERSHIP_MATRIX[event]
  if (classification.kind === "success") {
    return { kind: "success", value, trace }
  }
  if (classification.kind === "player_violation") {
    return {
      kind: "player_violation",
      violation: RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS[
        classification.code
      ],
      trace,
    }
  }
  return {
    kind: "system_failure",
    failure: {
      code: classification.code,
      publicMessage: "Runtime system failure.",
      retryable: classification.retryable,
    },
    trace,
  }
}

export const RUNTIME_INVOCATION_V1_17_TEST_KEY_ID =
  "fixture-only:runtime-adapter:v1.17-candidate" as const
export const RUNTIME_INVOCATION_V1_17_AUTH_ALGORITHM =
  "hmac-sha256" as const

export interface RuntimeInvocationAuthenticationV117 {
  readonly algorithm: typeof RUNTIME_INVOCATION_V1_17_AUTH_ALGORITHM
  readonly keyId: string
  readonly signatureInputSha256: `sha256:${string}`
  readonly signature: `hmac-sha256:${string}`
}

export interface RuntimeInvocationSigningIdentityV117 {
  readonly keyId: string
  readonly secret: string
}

export interface RuntimeInvocationSemanticTupleV117 {
  readonly tupleId: `sha256:${string}`
  readonly rules: string
  readonly engine: string
  readonly runtimeAbi: typeof RUNTIME_INVOCATION_V1_17_CANDIDATE.runtimeAbiVersion
  readonly chronicle: string
  readonly arenaCatalog: string
  readonly setPolicy: string
}

export interface RuntimeInvocationSourceIdentityV117 {
  readonly strategyRevisionId: string
  readonly originalSourceSha256: `sha256:${string}`
  readonly normalizedSourceSha256: `sha256:${string}`
  readonly artifactSha256: `sha256:${string}`
}

export interface RuntimeInvocationBudgetV117 {
  readonly profileId: string
  readonly profileSha256: `sha256:${string}`
  readonly wallMilliseconds: number
  readonly computeFuel: number
  readonly memoryBytes: number
  readonly outputBytes: number
  readonly processLimit: number
  readonly matchCumulative: RuntimeInvocationMatchCumulativeBudgetV117
}

export interface RuntimeInvocationMatchCumulativeBudgetV117 {
  readonly invocationCountMaximum: number
  readonly wallMilliseconds: number
  readonly computeFuel: number
  readonly payloadBytes: number
  readonly stdoutBytes: number
  readonly stderrBytes: number
  readonly memoryBytes: number
  readonly accounting: "signed-monotonic-per-invocation-deltas-plus-cumulative-total"
  readonly overflow: "stop-before-next-invocation-and-classify-by-proven-cause"
}

export interface RuntimeInvocationInputV117 {
  readonly value: JsonValue
  readonly canonicalSha256: `sha256:${string}`
  readonly canonicalByteLength: number
}

export interface RuntimeInvocationRetryV117 {
  readonly retryId: string
  readonly attempt: number
  readonly previousRequestSha256: `sha256:${string}` | null
  readonly identitySha256: `sha256:${string}`
}

export interface AuthenticatedRuntimeInvocationRequestV117 {
  readonly contractVersion: typeof RUNTIME_INVOCATION_V1_17_CANDIDATE.contractVersion
  readonly candidateStatus: typeof RUNTIME_INVOCATION_V1_17_CANDIDATE.lifecycle
  readonly current: false
  readonly envelopeKind: "runtime-invocation-request"
  readonly requestId: string
  readonly invocationId: string
  readonly kernelRequestId: string
  readonly method: RuntimeInvocationMethodV117
  readonly semanticTuple: RuntimeInvocationSemanticTupleV117
  readonly sourceIdentity: RuntimeInvocationSourceIdentityV117
  readonly budget: RuntimeInvocationBudgetV117
  readonly input: RuntimeInvocationInputV117
  readonly retry: RuntimeInvocationRetryV117
  readonly authentication: RuntimeInvocationAuthenticationV117
}

export interface CreateRuntimeInvocationRequestV117Input {
  readonly requestId: string
  readonly invocationId: string
  readonly kernelRequestId: string
  readonly method: RuntimeInvocationMethodV117
  readonly semanticTuple: Omit<RuntimeInvocationSemanticTupleV117, "tupleId">
  readonly sourceIdentity: RuntimeInvocationSourceIdentityV117
  readonly budget: Omit<RuntimeInvocationBudgetV117, "profileSha256">
  readonly input: Readonly<{ value: JsonValue }>
  readonly retry: Omit<RuntimeInvocationRetryV117, "identitySha256">
}

export interface RuntimeInvocationRequestBindingV117 {
  readonly requestId: string
  readonly invocationId: string
  readonly kernelRequestId: string
  readonly method: RuntimeInvocationMethodV117
  readonly requestSha256: `sha256:${string}`
  readonly semanticTupleId: `sha256:${string}`
  readonly runtimeAbiVersion: typeof RUNTIME_INVOCATION_V1_17_CANDIDATE.runtimeAbiVersion
  readonly strategyRevisionId: string
  readonly artifactSha256: `sha256:${string}`
  readonly budgetProfileSha256: `sha256:${string}`
  readonly inputSha256: `sha256:${string}`
  readonly retryIdentitySha256: `sha256:${string}`
}

export interface RuntimeInvocationPayloadBindingV117 {
  readonly sha256: `sha256:${string}`
  readonly canonicalByteLength: number
}

type RuntimeInvocationResponseBaseV117 = Readonly<{
  contractVersion: typeof RUNTIME_INVOCATION_V1_17_CANDIDATE.contractVersion
  candidateStatus: typeof RUNTIME_INVOCATION_V1_17_CANDIDATE.lifecycle
  current: false
  envelopeKind: "runtime-invocation-response"
  requestBinding: RuntimeInvocationRequestBindingV117
  authentication: RuntimeInvocationAuthenticationV117
}>

export type AuthenticatedRuntimeInvocationResponseV117<
  TValue extends JsonValue = JsonValue,
> = RuntimeInvocationResponseBaseV117 &
  (
    | Readonly<{
        outcome: Extract<RuntimeInvocationResultV117<TValue>, { kind: "success" }>
        payloadBinding: RuntimeInvocationPayloadBindingV117
      }>
    | Readonly<{
        outcome: Exclude<RuntimeInvocationResultV117<TValue>, { kind: "success" }>
        payloadBinding: null
      }>
  )

const SemanticTupleWithoutIdSchema = z
  .object({
    rules: PublicIdSchema,
    engine: PublicIdSchema,
    runtimeAbi: z.literal(RUNTIME_INVOCATION_V1_17_CANDIDATE.runtimeAbiVersion),
    chronicle: PublicIdSchema,
    arenaCatalog: PublicIdSchema,
    setPolicy: PublicIdSchema,
  })
  .strict()

const RuntimeInvocationSemanticTupleV117Schema = SemanticTupleWithoutIdSchema.extend({
  tupleId: Sha256Schema,
}).strict()

const RuntimeInvocationSourceIdentityV117Schema = z
  .object({
    strategyRevisionId: PublicIdSchema,
    originalSourceSha256: Sha256Schema,
    normalizedSourceSha256: Sha256Schema,
    artifactSha256: Sha256Schema,
  })
  .strict()

const NonnegativeSafeIntegerSchema = z
  .number()
  .int()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER)

const RuntimeInvocationMatchCumulativeBudgetV117Schema = z
  .object({
    invocationCountMaximum: NonnegativeSafeIntegerSchema,
    wallMilliseconds: NonnegativeSafeIntegerSchema,
    computeFuel: NonnegativeSafeIntegerSchema,
    payloadBytes: NonnegativeSafeIntegerSchema,
    stdoutBytes: NonnegativeSafeIntegerSchema,
    stderrBytes: NonnegativeSafeIntegerSchema,
    memoryBytes: NonnegativeSafeIntegerSchema,
    accounting: z.literal(
      "signed-monotonic-per-invocation-deltas-plus-cumulative-total",
    ),
    overflow: z.literal(
      "stop-before-next-invocation-and-classify-by-proven-cause",
    ),
  })
  .strict()

const BudgetWithoutHashSchema = z
  .object({
    profileId: PublicIdSchema,
    wallMilliseconds: NonnegativeSafeIntegerSchema,
    computeFuel: NonnegativeSafeIntegerSchema,
    memoryBytes: NonnegativeSafeIntegerSchema,
    outputBytes: NonnegativeSafeIntegerSchema,
    processLimit: NonnegativeSafeIntegerSchema,
    matchCumulative: RuntimeInvocationMatchCumulativeBudgetV117Schema,
  })
  .strict()

const RuntimeInvocationBudgetV117Schema = BudgetWithoutHashSchema.extend({
  profileSha256: Sha256Schema,
}).strict()

const RuntimeInvocationInputV117Schema = z
  .object({
    value: HostApiJsonValueSchema,
    canonicalSha256: Sha256Schema,
    canonicalByteLength: NonnegativeSafeIntegerSchema,
  })
  .strict()

const RetryWithoutHashSchema = z
  .object({
    retryId: PublicIdSchema,
    attempt: NonnegativeSafeIntegerSchema,
    previousRequestSha256: Sha256Schema.nullable(),
  })
  .strict()

const RuntimeInvocationRetryV117Schema = RetryWithoutHashSchema.extend({
  identitySha256: Sha256Schema,
}).strict()

const RuntimeInvocationAuthenticationV117Schema = z
  .object({
    algorithm: z.literal(RUNTIME_INVOCATION_V1_17_AUTH_ALGORITHM),
    keyId: PublicIdSchema,
    signatureInputSha256: Sha256Schema,
    signature: z.string().regex(/^hmac-sha256:[0-9a-f]{64}$/u),
  })
  .strict()

export const AuthenticatedRuntimeInvocationRequestV117Schema = z
  .object({
    contractVersion: z.literal(
      RUNTIME_INVOCATION_V1_17_CANDIDATE.contractVersion,
    ),
    candidateStatus: z.literal(RUNTIME_INVOCATION_V1_17_CANDIDATE.lifecycle),
    current: z.literal(false),
    envelopeKind: z.literal("runtime-invocation-request"),
    requestId: PublicIdSchema,
    invocationId: PublicIdSchema,
    kernelRequestId: PublicIdSchema,
    method: z.enum(["selectActivations", "soldierBrain"]),
    semanticTuple: RuntimeInvocationSemanticTupleV117Schema,
    sourceIdentity: RuntimeInvocationSourceIdentityV117Schema,
    budget: RuntimeInvocationBudgetV117Schema,
    input: RuntimeInvocationInputV117Schema,
    retry: RuntimeInvocationRetryV117Schema,
    authentication: RuntimeInvocationAuthenticationV117Schema,
  })
  .strict()

const RuntimeInvocationRequestBindingV117Schema = z
  .object({
    requestId: PublicIdSchema,
    invocationId: PublicIdSchema,
    kernelRequestId: PublicIdSchema,
    method: z.enum(["selectActivations", "soldierBrain"]),
    requestSha256: Sha256Schema,
    semanticTupleId: Sha256Schema,
    runtimeAbiVersion: z.literal(
      RUNTIME_INVOCATION_V1_17_CANDIDATE.runtimeAbiVersion,
    ),
    strategyRevisionId: PublicIdSchema,
    artifactSha256: Sha256Schema,
    budgetProfileSha256: Sha256Schema,
    inputSha256: Sha256Schema,
    retryIdentitySha256: Sha256Schema,
  })
  .strict()

const RuntimeInvocationPayloadBindingV117Schema = z
  .object({
    sha256: Sha256Schema,
    canonicalByteLength: NonnegativeSafeIntegerSchema,
  })
  .strict()

const responseShape = {
  contractVersion: z.literal(
    RUNTIME_INVOCATION_V1_17_CANDIDATE.contractVersion,
  ),
  candidateStatus: z.literal(RUNTIME_INVOCATION_V1_17_CANDIDATE.lifecycle),
  current: z.literal(false),
  envelopeKind: z.literal("runtime-invocation-response"),
  requestBinding: RuntimeInvocationRequestBindingV117Schema,
  authentication: RuntimeInvocationAuthenticationV117Schema,
} as const

export const AuthenticatedRuntimeInvocationResponseV117Schema = z.union([
  z
    .object({
      ...responseShape,
      outcome: RuntimeInvocationSuccessV117Schema,
      payloadBinding: RuntimeInvocationPayloadBindingV117Schema,
    })
    .strict(),
  z
    .object({
      ...responseShape,
      outcome: RuntimeInvocationPlayerViolationV117Schema,
      payloadBinding: z.null(),
    })
    .strict(),
  z
    .object({
      ...responseShape,
      outcome: RuntimeInvocationSystemFailureV117Schema,
      payloadBinding: z.null(),
    })
    .strict(),
])

const textEncoder = new TextEncoder()

const sha256Bytes = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, {
    context: "authenticated-outer-envelope",
  })
  if (!encoded.ok) {
    throw new TypeError(`Candidate envelope is not canonical JSON: ${encoded.error.code}`)
  }
  return encoded.bytes
}

const canonicalHash = (value: JsonValue): `sha256:${string}` =>
  sha256Bytes(canonicalBytes(value))

const identityHash = (
  domain: "semanticTuple" | "budgetProfile",
  value: JsonValue,
): `sha256:${string}` =>
  `sha256:${hashCanonicalIdentityValue(domain, value)}`

const retryIdentityHash = (value: JsonValue): `sha256:${string}` =>
  sha256Bytes(
    frameCanonicalIdentity("evidenceBundle", [
      textEncoder.encode("runtime-invocation-v1.17:retry-identity"),
      canonicalBytes(value),
    ]),
  )

const withoutAuthentication = <T extends { authentication: unknown }>(
  envelope: T,
): Omit<T, "authentication"> => {
  const { authentication: _authentication, ...unsigned } = envelope
  return unsigned
}

const signatureInput = (
  label: "request" | "response",
  unsigned: JsonValue,
): Uint8Array =>
  frameCanonicalIdentity("evidenceBundle", [
    textEncoder.encode(`runtime-invocation-v1.17:${label}`),
    canonicalBytes(unsigned),
  ])

const authenticate = (
  label: "request" | "response",
  unsigned: JsonValue,
  identity: RuntimeInvocationSigningIdentityV117,
): RuntimeInvocationAuthenticationV117 => {
  const input = signatureInput(label, unsigned)
  return {
    algorithm: RUNTIME_INVOCATION_V1_17_AUTH_ALGORITHM,
    keyId: identity.keyId,
    signatureInputSha256: sha256Bytes(input),
    signature: `hmac-sha256:${createHmac("sha256", identity.secret)
      .update(input)
      .digest("hex")}`,
  }
}

const authenticationMatches = (
  label: "request" | "response",
  envelope: { authentication: RuntimeInvocationAuthenticationV117 },
  identity: RuntimeInvocationSigningIdentityV117,
): boolean => {
  if (envelope.authentication.keyId !== identity.keyId) return false
  const unsigned = withoutAuthentication(envelope)
  const expected = authenticate(label, unsigned as unknown as JsonValue, identity)
  if (expected.signatureInputSha256 !== envelope.authentication.signatureInputSha256) {
    return false
  }
  const actualBytes = Buffer.from(
    envelope.authentication.signature.slice("hmac-sha256:".length),
    "hex",
  )
  const expectedBytes = Buffer.from(
    expected.signature.slice("hmac-sha256:".length),
    "hex",
  )
  return actualBytes.byteLength === expectedBytes.byteLength &&
    timingSafeEqual(actualBytes, expectedBytes)
}

export const createAuthenticatedRuntimeInvocationRequestV117 = (
  input: CreateRuntimeInvocationRequestV117Input,
  identity: RuntimeInvocationSigningIdentityV117,
): AuthenticatedRuntimeInvocationRequestV117 => {
  const semanticTupleWithoutId = SemanticTupleWithoutIdSchema.parse(input.semanticTuple)
  const sourceIdentity = RuntimeInvocationSourceIdentityV117Schema.parse(
    input.sourceIdentity,
  )
  const budgetWithoutHash = BudgetWithoutHashSchema.parse(input.budget)
  const inputValue = HostApiJsonValueSchema.parse(input.input.value)
  const inputBytes = canonicalBytes(inputValue)
  const retryWithoutHash = RetryWithoutHashSchema.parse(input.retry)
  const unsigned = {
    contractVersion: RUNTIME_INVOCATION_V1_17_CANDIDATE.contractVersion,
    candidateStatus: RUNTIME_INVOCATION_V1_17_CANDIDATE.lifecycle,
    current: false as const,
    envelopeKind: "runtime-invocation-request" as const,
    requestId: input.requestId,
    invocationId: input.invocationId,
    kernelRequestId: input.kernelRequestId,
    method: input.method,
    semanticTuple: {
      tupleId: identityHash(
        "semanticTuple",
        semanticTupleWithoutId as unknown as JsonValue,
      ),
      ...semanticTupleWithoutId,
    },
    sourceIdentity,
    budget: {
      ...budgetWithoutHash,
      profileSha256: identityHash(
        "budgetProfile",
        budgetWithoutHash as unknown as JsonValue,
      ),
    },
    input: {
      value: inputValue,
      canonicalSha256: sha256Bytes(inputBytes),
      canonicalByteLength: inputBytes.byteLength,
    },
    retry: {
      ...retryWithoutHash,
      identitySha256: retryIdentityHash(
        retryWithoutHash as unknown as JsonValue,
      ),
    },
  }
  const request = {
    ...unsigned,
    authentication: authenticate(
      "request",
      unsigned as unknown as JsonValue,
      identity,
    ),
  }
  return AuthenticatedRuntimeInvocationRequestV117Schema.parse(
    request,
  ) as AuthenticatedRuntimeInvocationRequestV117
}

export const serializeRuntimeInvocationRequestV117 = (
  request: AuthenticatedRuntimeInvocationRequestV117,
): Uint8Array => {
  const parsed = AuthenticatedRuntimeInvocationRequestV117Schema.parse(request)
  return canonicalBytes(parsed as unknown as JsonValue)
}

const requestBinding = (
  request: AuthenticatedRuntimeInvocationRequestV117,
): RuntimeInvocationRequestBindingV117 => ({
  requestId: request.requestId,
  invocationId: request.invocationId,
  kernelRequestId: request.kernelRequestId,
  method: request.method,
  requestSha256: sha256Bytes(serializeRuntimeInvocationRequestV117(request)),
  semanticTupleId: request.semanticTuple.tupleId,
  runtimeAbiVersion: request.semanticTuple.runtimeAbi,
  strategyRevisionId: request.sourceIdentity.strategyRevisionId,
  artifactSha256: request.sourceIdentity.artifactSha256,
  budgetProfileSha256: request.budget.profileSha256,
  inputSha256: request.input.canonicalSha256,
  retryIdentitySha256: request.retry.identitySha256,
})

const outcomeTraceMatchesRequest = (
  trace: RuntimeInvocationTraceV117,
  request: AuthenticatedRuntimeInvocationRequestV117,
): boolean => {
  const binding = requestBinding(request)
  return trace.requestId === binding.requestId &&
    trace.invocationId === binding.invocationId &&
    trace.kernelRequestId === binding.kernelRequestId &&
    trace.method === binding.method &&
    trace.requestSha256 === binding.requestSha256 &&
    trace.budgetProfileSha256 === binding.budgetProfileSha256 &&
    trace.inputSha256 === binding.inputSha256 &&
    trace.retryIdentitySha256 === binding.retryIdentitySha256
}

export const createAuthenticatedRuntimeInvocationResponseV117 = <
  TValue extends JsonValue,
>(
  request: AuthenticatedRuntimeInvocationRequestV117,
  outcome: RuntimeInvocationResultV117<TValue>,
  identity: RuntimeInvocationSigningIdentityV117,
): AuthenticatedRuntimeInvocationResponseV117<TValue> => {
  if (
    !authenticationMatches("request", request, identity) ||
    !requestDerivedBindingsMatch(request)
  ) {
    throw new TypeError("Cannot authenticate a response for an invalid candidate request")
  }
  const parsedOutcome = RuntimeInvocationResultV117Schema.parse(
    outcome,
  ) as RuntimeInvocationResultV117<TValue>
  if (!outcomeTraceMatchesRequest(parsedOutcome.trace, request)) {
    throw new TypeError(
      "Cannot authenticate a response with an outcome trace outside the request binding",
    )
  }
  const payloadBinding = parsedOutcome.kind === "success"
    ? {
        sha256: canonicalHash(parsedOutcome.value),
        canonicalByteLength: canonicalBytes(parsedOutcome.value).byteLength,
      }
    : null
  const unsigned = {
    contractVersion: RUNTIME_INVOCATION_V1_17_CANDIDATE.contractVersion,
    candidateStatus: RUNTIME_INVOCATION_V1_17_CANDIDATE.lifecycle,
    current: false as const,
    envelopeKind: "runtime-invocation-response" as const,
    requestBinding: requestBinding(request),
    outcome: parsedOutcome,
    payloadBinding,
  }
  const response = {
    ...unsigned,
    authentication: authenticate(
      "response",
      unsigned as unknown as JsonValue,
      identity,
    ),
  }
  return AuthenticatedRuntimeInvocationResponseV117Schema.parse(
    response,
  ) as AuthenticatedRuntimeInvocationResponseV117<TValue>
}

export const serializeRuntimeInvocationResponseV117 = (
  response: AuthenticatedRuntimeInvocationResponseV117,
): Uint8Array => {
  const parsed = AuthenticatedRuntimeInvocationResponseV117Schema.parse(response)
  return canonicalBytes(parsed as unknown as JsonValue)
}

const verificationTrace = (
  bytes: Uint8Array,
  partial?: Partial<RuntimeInvocationTraceV117>,
): RuntimeInvocationTraceV117 => ({
  requestId: partial?.requestId ?? "unavailable",
  invocationId: partial?.invocationId ?? "unavailable",
  kernelRequestId: partial?.kernelRequestId ?? "unavailable",
  method: partial?.method ?? "selectActivations",
  requestSha256: partial?.requestSha256 ?? sha256Bytes(bytes),
  budgetProfileSha256: partial?.budgetProfileSha256 ?? sha256Bytes(bytes),
  inputSha256: partial?.inputSha256 ?? sha256Bytes(bytes),
  retryIdentitySha256: partial?.retryIdentitySha256 ?? sha256Bytes(bytes),
  safeCodes: partial?.safeCodes ?? ["OUTER_ENVELOPE_REJECTED"],
})

const verificationFailure = (
  code: RuntimeInvocationSystemFailureCodeV117,
  bytes: Uint8Array,
  partial?: Partial<RuntimeInvocationTraceV117>,
): Extract<RuntimeInvocationResultV117, { kind: "system_failure" }> => ({
  kind: "system_failure",
  failure: {
    code,
    publicMessage: "Runtime system failure.",
    retryable: RUNTIME_INVOCATION_V1_17_OWNERSHIP_MATRIX[
      code === "OUTER_FRAME_MISSING"
        ? "outer_frame_missing"
        : code === "OUTER_FRAME_TRUNCATED"
          ? "outer_frame_truncated"
          : code === "OUTER_FRAME_UNAUTHENTICATED"
            ? "outer_frame_unauthenticated"
            : code === "OUTER_FRAME_WRONG_BINDING"
              ? "outer_frame_wrong_binding"
              : "outer_frame_undecodable"
    ].retryable,
  },
  trace: verificationTrace(bytes, partial),
})

const parseCanonicalEnvelope = <T>(
  bytes: Uint8Array,
  schema: z.ZodType<T>,
): { ok: true; value: T } | { ok: false; code: RuntimeInvocationSystemFailureCodeV117 } => {
  if (bytes.byteLength === 0) return { ok: false, code: "OUTER_FRAME_MISSING" }
  const parsed = admitCanonicalJsonBytes(bytes, {
    profile: "authenticated-envelope",
  })
  if (!parsed.ok) {
    return {
      ok: false,
      code: parsed.error.byteOffset >= bytes.byteLength
        ? "OUTER_FRAME_TRUNCATED"
        : "OUTER_FRAME_UNDECODABLE",
    }
  }
  const envelope = schema.safeParse(parsed.value)
  return envelope.success
    ? { ok: true, value: envelope.data }
    : { ok: false, code: "OUTER_FRAME_UNDECODABLE" }
}

const requestDerivedBindingsMatch = (
  request: AuthenticatedRuntimeInvocationRequestV117,
): boolean => {
  const semanticTuple = withoutProperty(request.semanticTuple, "tupleId")
  const budget = withoutProperty(request.budget, "profileSha256")
  const retry = withoutProperty(request.retry, "identitySha256")
  const inputBytes = canonicalBytes(request.input.value)
  return request.semanticTuple.tupleId ===
      identityHash("semanticTuple", semanticTuple as unknown as JsonValue) &&
    request.budget.profileSha256 ===
      identityHash("budgetProfile", budget as unknown as JsonValue) &&
    request.input.canonicalSha256 === sha256Bytes(inputBytes) &&
    request.input.canonicalByteLength === inputBytes.byteLength &&
    request.retry.identitySha256 ===
      retryIdentityHash(retry as unknown as JsonValue)
}

function withoutProperty<
  T extends object,
  K extends keyof T,
>(value: T, key: K): Omit<T, K> {
  const { [key]: _removed, ...rest } = value
  return rest
}

export const verifyRuntimeInvocationRequestV117 = (
  bytes: Uint8Array,
  identity: RuntimeInvocationSigningIdentityV117,
): RuntimeInvocationResultV117<AuthenticatedRuntimeInvocationRequestV117> => {
  const parsed = parseCanonicalEnvelope(
    bytes,
    AuthenticatedRuntimeInvocationRequestV117Schema,
  )
  if (!parsed.ok) return verificationFailure(parsed.code, bytes)
  const request = parsed.value as AuthenticatedRuntimeInvocationRequestV117
  const trace = verificationTrace(bytes, {
    requestId: request.requestId,
    invocationId: request.invocationId,
    kernelRequestId: request.kernelRequestId,
    method: request.method,
    budgetProfileSha256: request.budget.profileSha256,
    inputSha256: request.input.canonicalSha256,
    retryIdentitySha256: request.retry.identitySha256,
  })
  if (!authenticationMatches("request", request, identity)) {
    return verificationFailure("OUTER_FRAME_UNAUTHENTICATED", bytes, trace)
  }
  if (!requestDerivedBindingsMatch(request)) {
    return verificationFailure("OUTER_FRAME_WRONG_BINDING", bytes, trace)
  }
  return {
    kind: "success",
    value: request,
    trace: {
      ...trace,
      safeCodes: ["ADAPTER_AUTHENTICATED", "OUTER_BINDINGS_VERIFIED"],
    },
  }
}

const sameCanonicalValue = (left: JsonValue, right: JsonValue): boolean =>
  Buffer.from(canonicalBytes(left)).equals(Buffer.from(canonicalBytes(right)))

const verifyRuntimeInvocationResponseV117Unsafe = (
  bytes: Uint8Array,
  expectedRequest: AuthenticatedRuntimeInvocationRequestV117,
  identity: RuntimeInvocationSigningIdentityV117,
): RuntimeInvocationResultV117<AuthenticatedRuntimeInvocationResponseV117> => {
  const parsedExpectedRequest =
    AuthenticatedRuntimeInvocationRequestV117Schema.safeParse(expectedRequest)
  if (!parsedExpectedRequest.success) {
    return verificationFailure("OUTER_FRAME_WRONG_BINDING", bytes)
  }
  const request =
    parsedExpectedRequest.data as AuthenticatedRuntimeInvocationRequestV117
  if (!requestDerivedBindingsMatch(request)) {
    return verificationFailure("OUTER_FRAME_WRONG_BINDING", bytes)
  }
  const expectedBinding = requestBinding(request)
  const partial = {
    requestId: expectedBinding.requestId,
    invocationId: expectedBinding.invocationId,
    kernelRequestId: expectedBinding.kernelRequestId,
    method: expectedBinding.method,
    requestSha256: expectedBinding.requestSha256,
    budgetProfileSha256: expectedBinding.budgetProfileSha256,
    inputSha256: expectedBinding.inputSha256,
    retryIdentitySha256: expectedBinding.retryIdentitySha256,
  } as const
  const parsed = parseCanonicalEnvelope(
    bytes,
    AuthenticatedRuntimeInvocationResponseV117Schema,
  )
  if (!parsed.ok) return verificationFailure(parsed.code, bytes, partial)
  const response = parsed.value as AuthenticatedRuntimeInvocationResponseV117
  if (!authenticationMatches("response", response, identity)) {
    return verificationFailure("OUTER_FRAME_UNAUTHENTICATED", bytes, partial)
  }
  if (
    !sameCanonicalValue(
      response.requestBinding as unknown as JsonValue,
      expectedBinding as unknown as JsonValue,
    )
  ) {
    return verificationFailure("OUTER_FRAME_WRONG_BINDING", bytes, partial)
  }
  if (!authenticationMatches("request", request, identity)) {
    return verificationFailure("OUTER_FRAME_WRONG_BINDING", bytes, partial)
  }
  if (response.outcome.kind === "success") {
    const payloadBytes = canonicalBytes(response.outcome.value)
    if (
      response.payloadBinding === null ||
      response.payloadBinding.sha256 !== sha256Bytes(payloadBytes) ||
      response.payloadBinding.canonicalByteLength !== payloadBytes.byteLength
    ) {
      return verificationFailure("OUTER_FRAME_WRONG_BINDING", bytes, partial)
    }
  } else if (response.payloadBinding !== null) {
    return verificationFailure("OUTER_FRAME_WRONG_BINDING", bytes, partial)
  }
  if (!outcomeTraceMatchesRequest(response.outcome.trace, request)) {
    return verificationFailure("OUTER_FRAME_WRONG_BINDING", bytes, partial)
  }
  return {
    kind: "success",
    value: response,
    trace: { ...partial, safeCodes: ["ADAPTER_AUTHENTICATED", "OUTER_BINDINGS_VERIFIED"] },
  }
}

export const verifyRuntimeInvocationResponseV117 = (
  bytes: Uint8Array,
  expectedRequest: AuthenticatedRuntimeInvocationRequestV117,
  identity: RuntimeInvocationSigningIdentityV117,
): RuntimeInvocationResultV117<AuthenticatedRuntimeInvocationResponseV117> => {
  try {
    return verifyRuntimeInvocationResponseV117Unsafe(
      bytes,
      expectedRequest,
      identity,
    )
  } catch {
    return verificationFailure("OUTER_FRAME_WRONG_BINDING", bytes)
  }
}
