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
import { RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256 } from "./runtime-budget-profile-v1-17.js"
import {
  RUNTIME_ABI_V1_17,
  createRuntimeAbiV117ExecutionLedger,
  debitRuntimeAbiV117Ledger,
  type RuntimeAbiV117AccountingEvidence,
  type RuntimeAbiV117CancellationEvidence,
  type RuntimeAbiV117CounterEvidence,
  type RuntimeAbiV117ExecutionCapabilityEvidence,
  type RuntimeAbiV117ExecutionCounterName,
  type RuntimeAbiV117ExecutionLedger,
  type RuntimeAbiV117LedgerAttribution,
  type RuntimeAbiV117MemoryEvidence,
  type RuntimeAbiV117ProcessEvidence,
} from "./runtime-abi-v1-17.js"
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

/**
 * Activation-owned lifecycle projection for the selected v1.17 route. The
 * immutable candidate record above continues to own the signed preactivation
 * fixtures; Plan 258-14 changes only this projection when the current tuple is
 * switched atomically.
 */
export const RUNTIME_INVOCATION_V1_17_SELECTED_LIFECYCLE = deepFreeze({
  contractVersion: "runtime-invocation-v1.17",
  runtimeAbiVersion: "strategy-runtime-abi-v1.17",
  lifecycle: "active-current",
  activationPlan: "258-14",
  current: true,
} as const satisfies RuntimeInvocationLifecycleV117)

export type RuntimeInvocationLifecycleV117 =
  | Readonly<{
      contractVersion: "runtime-invocation-v1.17"
      runtimeAbiVersion: "strategy-runtime-abi-v1.17"
      lifecycle: "inactive-candidate"
      activationPlan: "258-14"
      current: false
    }>
  | Readonly<{
      contractVersion: "runtime-invocation-v1.17"
      runtimeAbiVersion: "strategy-runtime-abi-v1.17"
      lifecycle: "active-current"
      activationPlan: "258-14"
      current: true
    }>

export const RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATION_CODES = deepFreeze([
  "INVALID_OUTPUT",
  "RESOURCE_EXHAUSTION",
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
  RESOURCE_EXHAUSTION: {
    code: "RESOURCE_EXHAUSTION",
    publicMessage: "Strategy exhausted a measured resource budget.",
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
  "TIMEOUT",
  "AMBIGUOUS_ATTRIBUTION",
] as const)

export type RuntimeInvocationSystemFailureCodeV117 =
  (typeof RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES)[number]

export const RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY = deepFreeze({
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
} as const satisfies Record<RuntimeInvocationSystemFailureCodeV117, boolean>)

export type RuntimeInvocationMethodV117 = "selectActivations" | "soldierBrain"

export interface RuntimeInvocationTraceV117 {
  readonly requestId: string
  readonly invocationId: string
  readonly kernelRequestId: string
  readonly method: RuntimeInvocationMethodV117
  readonly requestSha256: `sha256:${string}`
  readonly budgetProfileSha256: `sha256:${string}`
  readonly inputSha256: `sha256:${string}`
  readonly retryIdentitySha256: `sha256:${string}`
  readonly accountingIdentitySha256: `sha256:${string}`
  readonly idempotencyKeySha256: `sha256:${string}`
  readonly safeCodes: readonly string[]
}

export type RuntimeInvocationPlayerViolationV117 =
  (typeof RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS)[RuntimeInvocationPlayerViolationCodeV117]

export interface RuntimeInvocationSystemFailureV117 {
  readonly code: RuntimeInvocationSystemFailureCodeV117
  readonly publicMessage: "Runtime system failure."
  readonly retryable: boolean
}

export type RuntimeInvocationResultV117<TValue = JsonValue> =
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
  z
    .custom<JsonValue>(() => true)
    .superRefine((value, ctx) => {
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
    accountingIdentitySha256: Sha256Schema,
    idempotencyKeySha256: Sha256Schema,
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

const RuntimeInvocationPlayerViolationV117Schema = z.union(
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
  .superRefine((outcome, ctx) => {
    const expected =
      RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY[outcome.failure.code]
    if (outcome.failure.retryable === expected) return
    ctx.addIssue({
      code: "custom",
      path: ["failure", "retryable"],
      message: `retryable must be ${String(expected)} for ${outcome.failure.code}`,
    })
  })

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
    code: "RESOURCE_EXHAUSTION",
    publicMessage:
      RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.RESOURCE_EXHAUSTION
        .publicMessage,
  },
  strategy_timeout: {
    kind: "system_failure",
    code: "TIMEOUT",
    retryable: RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY.TIMEOUT,
  },
  outer_frame_missing: {
    kind: "system_failure",
    code: "OUTER_FRAME_MISSING",
    retryable:
      RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY.OUTER_FRAME_MISSING,
  },
  outer_frame_truncated: {
    kind: "system_failure",
    code: "OUTER_FRAME_TRUNCATED",
    retryable:
      RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY.OUTER_FRAME_TRUNCATED,
  },
  outer_frame_unauthenticated: {
    kind: "system_failure",
    code: "OUTER_FRAME_UNAUTHENTICATED",
    retryable:
      RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY.OUTER_FRAME_UNAUTHENTICATED,
  },
  outer_frame_wrong_binding: {
    kind: "system_failure",
    code: "OUTER_FRAME_WRONG_BINDING",
    retryable:
      RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY.OUTER_FRAME_WRONG_BINDING,
  },
  outer_frame_undecodable: {
    kind: "system_failure",
    code: "OUTER_FRAME_UNDECODABLE",
    retryable:
      RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY.OUTER_FRAME_UNDECODABLE,
  },
  adapter_crash: {
    kind: "system_failure",
    code: "ADAPTER_CRASH",
    retryable:
      RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY.ADAPTER_CRASH,
  },
  runtime_crash: {
    kind: "system_failure",
    code: "RUNTIME_CRASH",
    retryable:
      RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY.RUNTIME_CRASH,
  },
  host_crash: {
    kind: "system_failure",
    code: "HOST_CRASH",
    retryable: RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY.HOST_CRASH,
  },
  transport_crash: {
    kind: "system_failure",
    code: "TRANSPORT_CRASH",
    retryable:
      RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY.TRANSPORT_CRASH,
  },
  strategy_exception_ambiguous: {
    kind: "system_failure",
    code: "AMBIGUOUS_ATTRIBUTION",
    retryable:
      RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY.AMBIGUOUS_ATTRIBUTION,
  },
  strategy_exhaustion_ambiguous: {
    kind: "system_failure",
    code: "AMBIGUOUS_ATTRIBUTION",
    retryable:
      RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY.AMBIGUOUS_ATTRIBUTION,
  },
} as const)

export type RuntimeInvocationBoundaryEventV117 =
  keyof typeof RUNTIME_INVOCATION_V1_17_OWNERSHIP_MATRIX

export const classifyRuntimeInvocationV117 = <TValue extends JsonValue>(
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
      violation:
        RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS[classification.code],
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
export const RUNTIME_INVOCATION_V1_17_AUTH_ALGORITHM = "hmac-sha256" as const

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

export interface RuntimeInvocationCounterLimitV117 {
  readonly semantics: "counter"
  readonly maximum: number
}

export interface RuntimeInvocationMemoryLimitV117 {
  readonly semantics: "peak"
  readonly maximumBytes: number
}

export interface RuntimeInvocationMethodLimitV117 {
  readonly method: RuntimeInvocationMethodV117
  readonly invocationCountMaximum: number
  readonly counters: Readonly<{
    wallMilliseconds: RuntimeInvocationCounterLimitV117
    computeFuel: RuntimeInvocationCounterLimitV117
    payloadBytes: RuntimeInvocationCounterLimitV117
    stdoutBytes: RuntimeInvocationCounterLimitV117
    stderrBytes: RuntimeInvocationCounterLimitV117
  }>
  readonly memory: RuntimeInvocationMemoryLimitV117
  readonly process: Readonly<{
    semantics: "predicate"
    processes: number
    threads: number
    children: number
  }>
  readonly capabilities: Readonly<{
    semantics: "predicate"
    filesystem: string
    network: string
    environment: string
    shell: string
  }>
  readonly cancellation: Readonly<{
    semantics: "predicate"
    terminationGraceMilliseconds: number
    evidence: string
  }>
  readonly accountingEvidence: Readonly<{
    semantics: "predicate"
    required: true
  }>
}

export interface RuntimeInvocationMatchLimitV117 {
  readonly methodInvocations: Readonly<
    Record<RuntimeInvocationMethodV117, number>
  >
  readonly counters: Readonly<{
    invocationCount: RuntimeInvocationCounterLimitV117
    wallMilliseconds: RuntimeInvocationCounterLimitV117
    computeFuel: RuntimeInvocationCounterLimitV117
    payloadBytes: RuntimeInvocationCounterLimitV117
    stdoutBytes: RuntimeInvocationCounterLimitV117
    stderrBytes: RuntimeInvocationCounterLimitV117
  }>
  readonly memory: RuntimeInvocationMemoryLimitV117
  readonly overflow: "stop-before-next-invocation-and-classify-by-proven-cause"
}

export interface RuntimeInvocationBudgetV117 {
  readonly profileId: string
  readonly profileSha256: `sha256:${string}`
  readonly methodLimit: RuntimeInvocationMethodLimitV117
  readonly matchLimit: RuntimeInvocationMatchLimitV117
}

export type RuntimeInvocationMatchCumulativeBudgetV117 =
  RuntimeInvocationMatchLimitV117

export interface RuntimeInvocationRequestAccountingV117 {
  readonly schemaVersion: "runtime-invocation-accounting-v1.17"
  readonly domain: "execution"
  readonly prestate: RuntimeAbiV117ExecutionLedger
  readonly prestateSha256: `sha256:${string}`
  readonly requestIdentity: `sha256:${string}`
  readonly idempotencyKeySha256: `sha256:${string}`
  readonly identitySha256: `sha256:${string}`
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

interface AuthenticatedRuntimeInvocationRequestBaseV117 {
  readonly contractVersion: typeof RUNTIME_INVOCATION_V1_17_CANDIDATE.contractVersion
  readonly envelopeKind: "runtime-invocation-request"
  readonly requestId: string
  readonly invocationId: string
  readonly kernelRequestId: string
  readonly method: RuntimeInvocationMethodV117
  readonly semanticTuple: RuntimeInvocationSemanticTupleV117
  readonly sourceIdentity: RuntimeInvocationSourceIdentityV117
  readonly budget: RuntimeInvocationBudgetV117
  readonly accounting: RuntimeInvocationRequestAccountingV117
  readonly input: RuntimeInvocationInputV117
  readonly retry: RuntimeInvocationRetryV117
  readonly authentication: RuntimeInvocationAuthenticationV117
}

export type AuthenticatedRuntimeInvocationRequestV117 =
  AuthenticatedRuntimeInvocationRequestBaseV117 &
    (
      | Readonly<{
          candidateStatus: "inactive-candidate"
          current: false
        }>
      | Readonly<{
          candidateStatus: "active-current"
          current: true
        }>
    )

export interface CreateRuntimeInvocationRequestV117Input {
  readonly requestId: string
  readonly invocationId: string
  readonly kernelRequestId: string
  readonly method: RuntimeInvocationMethodV117
  readonly semanticTuple: Omit<RuntimeInvocationSemanticTupleV117, "tupleId">
  readonly sourceIdentity: RuntimeInvocationSourceIdentityV117
  readonly budget: Omit<RuntimeInvocationBudgetV117, "profileSha256">
  readonly accounting: Readonly<{ prestate: RuntimeAbiV117ExecutionLedger }>
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
  readonly accountingIdentitySha256: `sha256:${string}`
  readonly idempotencyKeySha256: `sha256:${string}`
}

export interface RuntimeInvocationPayloadBindingV117 {
  readonly sha256: `sha256:${string}`
  readonly canonicalByteLength: number
}

export interface RuntimeInvocationResponseAccountingV117 {
  readonly schemaVersion: "runtime-invocation-accounting-v1.17"
  readonly domain: "execution"
  readonly prestateSha256: `sha256:${string}`
  readonly idempotencyKeySha256: `sha256:${string}`
  readonly disposition: "commit" | "no_commit"
  readonly receipt: RuntimeInvocationExecutionReceiptV117
  readonly poststate: RuntimeAbiV117ExecutionLedger
  readonly poststateSha256: `sha256:${string}`
  readonly identitySha256: `sha256:${string}`
}

export interface RuntimeInvocationExecutionReceiptEvidenceV117 {
  readonly attribution: RuntimeAbiV117LedgerAttribution
  readonly counters: Readonly<
    Record<RuntimeAbiV117ExecutionCounterName, RuntimeAbiV117CounterEvidence>
  >
  readonly memory: RuntimeAbiV117MemoryEvidence
  readonly process: RuntimeAbiV117ProcessEvidence
  readonly capabilities: RuntimeAbiV117ExecutionCapabilityEvidence
  readonly cancellation: RuntimeAbiV117CancellationEvidence
  readonly accountingEvidence: RuntimeAbiV117AccountingEvidence
}

export type RuntimeInvocationExecutionReceiptV117 = Readonly<{
  domain: "execution"
  prestateRevision: number
  invocationId: string
  requestIdentity: `sha256:${string}`
  evidenceIdentity: `sha256:${string}`
  method: RuntimeInvocationMethodV117
}> &
  RuntimeInvocationExecutionReceiptEvidenceV117

type RuntimeInvocationResponseBaseV117 = Readonly<{
  contractVersion: typeof RUNTIME_INVOCATION_V1_17_CANDIDATE.contractVersion
  envelopeKind: "runtime-invocation-response"
  requestBinding: RuntimeInvocationRequestBindingV117
  accounting: RuntimeInvocationResponseAccountingV117
  authentication: RuntimeInvocationAuthenticationV117
}> &
  (
    | Readonly<{
        candidateStatus: "inactive-candidate"
        current: false
      }>
    | Readonly<{
        candidateStatus: "active-current"
        current: true
      }>
  )

export type AuthenticatedRuntimeInvocationResponseV117<
  TValue extends JsonValue = JsonValue,
> = RuntimeInvocationResponseBaseV117 &
  (
    | Readonly<{
        outcome: Extract<
          RuntimeInvocationResultV117<TValue>,
          { kind: "success" }
        >
        payloadBinding: RuntimeInvocationPayloadBindingV117
      }>
    | Readonly<{
        outcome: Exclude<
          RuntimeInvocationResultV117<TValue>,
          { kind: "success" }
        >
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

const RuntimeInvocationSemanticTupleV117Schema =
  SemanticTupleWithoutIdSchema.extend({
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

const CounterLimitSchema = z
  .object({
    semantics: z.literal("counter"),
    maximum: NonnegativeSafeIntegerSchema,
  })
  .strict()

const MemoryLimitSchema = z
  .object({
    semantics: z.literal("peak"),
    maximumBytes: NonnegativeSafeIntegerSchema,
  })
  .strict()

const MethodLimitSchema = z
  .object({
    method: z.enum(["selectActivations", "soldierBrain"]),
    invocationCountMaximum: NonnegativeSafeIntegerSchema,
    counters: z
      .object({
        wallMilliseconds: CounterLimitSchema,
        computeFuel: CounterLimitSchema,
        payloadBytes: CounterLimitSchema,
        stdoutBytes: CounterLimitSchema,
        stderrBytes: CounterLimitSchema,
      })
      .strict(),
    memory: MemoryLimitSchema,
    process: z
      .object({
        semantics: z.literal("predicate"),
        processes: NonnegativeSafeIntegerSchema,
        threads: NonnegativeSafeIntegerSchema,
        children: NonnegativeSafeIntegerSchema,
      })
      .strict(),
    capabilities: z
      .object({
        semantics: z.literal("predicate"),
        filesystem: PublicIdSchema,
        network: PublicIdSchema,
        environment: PublicIdSchema,
        shell: PublicIdSchema,
      })
      .strict(),
    cancellation: z
      .object({
        semantics: z.literal("predicate"),
        terminationGraceMilliseconds: NonnegativeSafeIntegerSchema,
        evidence: PublicIdSchema,
      })
      .strict(),
    accountingEvidence: z
      .object({
        semantics: z.literal("predicate"),
        required: z.literal(true),
      })
      .strict(),
  })
  .strict()

const MatchLimitSchema = z
  .object({
    methodInvocations: z
      .object({
        selectActivations: NonnegativeSafeIntegerSchema,
        soldierBrain: NonnegativeSafeIntegerSchema,
      })
      .strict(),
    counters: z
      .object({
        invocationCount: CounterLimitSchema,
        wallMilliseconds: CounterLimitSchema,
        computeFuel: CounterLimitSchema,
        payloadBytes: CounterLimitSchema,
        stdoutBytes: CounterLimitSchema,
        stderrBytes: CounterLimitSchema,
      })
      .strict(),
    memory: MemoryLimitSchema,
    overflow: z.literal(
      "stop-before-next-invocation-and-classify-by-proven-cause",
    ),
  })
  .strict()

const BudgetWithoutHashSchema = z
  .object({
    profileId: PublicIdSchema,
    methodLimit: MethodLimitSchema,
    matchLimit: MatchLimitSchema,
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

const RuntimeAbiV117LedgerCommitmentSchema = z
  .object({
    identity: PublicIdSchema,
    requestIdentity: Sha256Schema,
    evidenceIdentity: Sha256Schema,
    prestateRevision: NonnegativeSafeIntegerSchema,
    scope: PublicIdSchema,
    outcome: z.enum(["success", "player_violation"]),
    dimensions: z.array(z.string().min(1).max(128)).max(32),
  })
  .strict()

const RuntimeAbiV117ExecutionLedgerSchema = z
  .object({
    schemaVersion: z.literal("runtime-budget-ledger-v1"),
    domain: z.literal("execution"),
    revision: NonnegativeSafeIntegerSchema,
    methodInvocations: z
      .object({
        selectActivations: NonnegativeSafeIntegerSchema,
        soldierBrain: NonnegativeSafeIntegerSchema,
      })
      .strict(),
    cumulative: z
      .object({
        invocationCount: NonnegativeSafeIntegerSchema,
        wallMilliseconds: NonnegativeSafeIntegerSchema,
        computeFuel: NonnegativeSafeIntegerSchema,
        payloadBytes: NonnegativeSafeIntegerSchema,
        stdoutBytes: NonnegativeSafeIntegerSchema,
        stderrBytes: NonnegativeSafeIntegerSchema,
        memoryBytes: NonnegativeSafeIntegerSchema,
      })
      .strict(),
    commitments: z.array(RuntimeAbiV117LedgerCommitmentSchema).max(1024),
  })
  .strict()

const RuntimeInvocationRequestAccountingV117Schema = z
  .object({
    schemaVersion: z.literal("runtime-invocation-accounting-v1.17"),
    domain: z.literal("execution"),
    prestate: RuntimeAbiV117ExecutionLedgerSchema,
    prestateSha256: Sha256Schema,
    requestIdentity: Sha256Schema,
    idempotencyKeySha256: Sha256Schema,
    identitySha256: Sha256Schema,
  })
  .strict()

const UnavailableEvidenceSchema = z
  .object({ status: z.enum(["unavailable", "ambiguous"]) })
  .strict()

const CounterEvidenceSchema = z.union([
  z
    .object({
      status: z.literal("measured"),
      delta: NonnegativeSafeIntegerSchema,
      cumulative: NonnegativeSafeIntegerSchema,
    })
    .strict(),
  UnavailableEvidenceSchema,
])

const MemoryEvidenceSchema = z.union([
  z
    .object({
      status: z.literal("measured"),
      peakBytes: NonnegativeSafeIntegerSchema,
      cumulativePeakBytes: NonnegativeSafeIntegerSchema,
    })
    .strict(),
  UnavailableEvidenceSchema,
])

const ProcessEvidenceSchema = z.union([
  z
    .object({
      status: z.literal("verified"),
      processes: NonnegativeSafeIntegerSchema,
      threads: NonnegativeSafeIntegerSchema,
      children: NonnegativeSafeIntegerSchema,
    })
    .strict(),
  UnavailableEvidenceSchema,
])

const CapabilityEvidenceSchema = z.union([
  z
    .object({
      status: z.literal("verified"),
      filesystem: PublicIdSchema,
      network: PublicIdSchema,
      environment: PublicIdSchema,
      shell: PublicIdSchema,
    })
    .strict(),
  UnavailableEvidenceSchema,
])

const CancellationEvidenceSchema = z.union([
  z
    .object({
      status: z.literal("verified"),
      terminationRequired: z.boolean(),
      receiptPresent: z.boolean(),
      graceMilliseconds: NonnegativeSafeIntegerSchema,
    })
    .strict(),
  UnavailableEvidenceSchema,
])

const AccountingEvidenceSchema = z.union([
  z
    .object({
      status: z.literal("verified"),
      signatureVerified: z.boolean(),
      monotonic: z.boolean(),
    })
    .strict(),
  UnavailableEvidenceSchema,
])

const RuntimeAbiV117ExecutionLedgerReceiptSchema = z
  .object({
    domain: z.literal("execution"),
    prestateRevision: NonnegativeSafeIntegerSchema,
    invocationId: PublicIdSchema,
    requestIdentity: Sha256Schema,
    evidenceIdentity: Sha256Schema,
    method: z.enum(["selectActivations", "soldierBrain"]),
    attribution: z.enum(["proven_strategy", "host", "ambiguous"]),
    counters: z
      .object({
        wallMilliseconds: CounterEvidenceSchema,
        computeFuel: CounterEvidenceSchema,
        payloadBytes: CounterEvidenceSchema,
        stdoutBytes: CounterEvidenceSchema,
        stderrBytes: CounterEvidenceSchema,
      })
      .strict(),
    memory: MemoryEvidenceSchema,
    process: ProcessEvidenceSchema,
    capabilities: CapabilityEvidenceSchema,
    cancellation: CancellationEvidenceSchema,
    accountingEvidence: AccountingEvidenceSchema,
  })
  .strict()

const RuntimeInvocationExecutionReceiptEvidenceV117Schema =
  RuntimeAbiV117ExecutionLedgerReceiptSchema.pick({
    attribution: true,
    counters: true,
    memory: true,
    process: true,
    capabilities: true,
    cancellation: true,
    accountingEvidence: true,
  })

const RuntimeInvocationResponseAccountingV117Schema = z
  .object({
    schemaVersion: z.literal("runtime-invocation-accounting-v1.17"),
    domain: z.literal("execution"),
    prestateSha256: Sha256Schema,
    idempotencyKeySha256: Sha256Schema,
    disposition: z.enum(["commit", "no_commit"]),
    receipt: RuntimeAbiV117ExecutionLedgerReceiptSchema,
    poststate: RuntimeAbiV117ExecutionLedgerSchema,
    poststateSha256: Sha256Schema,
    identitySha256: Sha256Schema,
  })
  .strict()

const RuntimeInvocationAuthenticationV117Schema = z
  .object({
    algorithm: z.literal(RUNTIME_INVOCATION_V1_17_AUTH_ALGORITHM),
    keyId: PublicIdSchema,
    signatureInputSha256: Sha256Schema,
    signature: z.string().regex(/^hmac-sha256:[0-9a-f]{64}$/u),
  })
  .strict()

const runtimeInvocationLifecycleMatches = (value: {
  readonly candidateStatus: "inactive-candidate" | "active-current"
  readonly current: boolean
}): boolean =>
  (value.candidateStatus === "inactive-candidate" && value.current === false) ||
  (value.candidateStatus === "active-current" && value.current === true)

const enforceRuntimeInvocationLifecycle = (
  value: {
    readonly candidateStatus: "inactive-candidate" | "active-current"
    readonly current: boolean
  },
  context: z.RefinementCtx,
): void => {
  if (runtimeInvocationLifecycleMatches(value)) return
  context.addIssue({
    code: "custom",
    path: ["current"],
    message: "runtime invocation lifecycle and current flag must agree",
  })
}

export const AuthenticatedRuntimeInvocationRequestV117Schema = z
  .object({
    contractVersion: z.literal(
      RUNTIME_INVOCATION_V1_17_CANDIDATE.contractVersion,
    ),
    candidateStatus: z.enum(["inactive-candidate", "active-current"]),
    current: z.boolean(),
    envelopeKind: z.literal("runtime-invocation-request"),
    requestId: PublicIdSchema,
    invocationId: PublicIdSchema,
    kernelRequestId: PublicIdSchema,
    method: z.enum(["selectActivations", "soldierBrain"]),
    semanticTuple: RuntimeInvocationSemanticTupleV117Schema,
    sourceIdentity: RuntimeInvocationSourceIdentityV117Schema,
    budget: RuntimeInvocationBudgetV117Schema,
    accounting: RuntimeInvocationRequestAccountingV117Schema,
    input: RuntimeInvocationInputV117Schema,
    retry: RuntimeInvocationRetryV117Schema,
    authentication: RuntimeInvocationAuthenticationV117Schema,
  })
  .strict()
  .superRefine(enforceRuntimeInvocationLifecycle)

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
    accountingIdentitySha256: Sha256Schema,
    idempotencyKeySha256: Sha256Schema,
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
  candidateStatus: z.enum(["inactive-candidate", "active-current"]),
  current: z.boolean(),
  envelopeKind: z.literal("runtime-invocation-response"),
  requestBinding: RuntimeInvocationRequestBindingV117Schema,
  accounting: RuntimeInvocationResponseAccountingV117Schema,
  authentication: RuntimeInvocationAuthenticationV117Schema,
} as const

export const AuthenticatedRuntimeInvocationResponseV117Schema = z.union([
  z
    .object({
      ...responseShape,
      outcome: RuntimeInvocationSuccessV117Schema,
      payloadBinding: RuntimeInvocationPayloadBindingV117Schema,
    })
    .strict()
    .superRefine(enforceRuntimeInvocationLifecycle),
  z
    .object({
      ...responseShape,
      outcome: RuntimeInvocationPlayerViolationV117Schema,
      payloadBinding: z.null(),
    })
    .strict()
    .superRefine(enforceRuntimeInvocationLifecycle),
  z
    .object({
      ...responseShape,
      outcome: RuntimeInvocationSystemFailureV117Schema,
      payloadBinding: z.null(),
    })
    .strict()
    .superRefine(enforceRuntimeInvocationLifecycle),
])

const textEncoder = new TextEncoder()

const sha256Bytes = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, {
    context: "authenticated-outer-envelope",
  })
  if (!encoded.ok) {
    throw new TypeError(
      `Candidate envelope is not canonical JSON: ${encoded.error.code}`,
    )
  }
  return encoded.bytes
}

const canonicalHash = (value: JsonValue): `sha256:${string}` =>
  sha256Bytes(canonicalBytes(value))

const sameCanonicalValue = (left: JsonValue, right: JsonValue): boolean =>
  Buffer.from(canonicalBytes(left)).equals(Buffer.from(canonicalBytes(right)))

const identityHash = (
  domain: "semanticTuple",
  value: JsonValue,
): `sha256:${string}` => `sha256:${hashCanonicalIdentityValue(domain, value)}`

const retryIdentityHash = (value: JsonValue): `sha256:${string}` =>
  sha256Bytes(
    frameCanonicalIdentity("evidenceBundle", [
      textEncoder.encode("runtime-invocation-v1.17:retry-identity"),
      canonicalBytes(value),
    ]),
  )

const framedValueHash = (label: string, value: JsonValue): `sha256:${string}` =>
  sha256Bytes(
    frameCanonicalIdentity("evidenceBundle", [
      textEncoder.encode(label),
      canonicalBytes(value),
    ]),
  )

export const runtimeInvocationExecutionLedgerPrestateRootV117 = (
  ledger: RuntimeAbiV117ExecutionLedger,
): `sha256:${string}` =>
  framedValueHash(
    "runtime-invocation-v1.17:execution-ledger-prestate",
    ledger as unknown as JsonValue,
  )

export const runtimeInvocationExecutionLedgerPoststateRootV117 = (
  ledger: RuntimeAbiV117ExecutionLedger,
): `sha256:${string}` =>
  framedValueHash(
    "runtime-invocation-v1.17:execution-ledger-poststate",
    ledger as unknown as JsonValue,
  )

export const RUNTIME_INVOCATION_V1_17_INITIAL_EXECUTION_LEDGER_ROOT =
  runtimeInvocationExecutionLedgerPrestateRootV117(
    createRuntimeAbiV117ExecutionLedger(),
  )

export const createRuntimeInvocationBudgetV117 = (
  method: RuntimeInvocationMethodV117,
): Omit<RuntimeInvocationBudgetV117, "profileSha256"> => {
  const profile = RUNTIME_ABI_V1_17.budgets[method]
  const vector = profile.vector
  const match = RUNTIME_ABI_V1_17.budgets.matchCumulative
  return deepFreeze({
    profileId: "runtime-budget-profile-v1.17-candidate",
    methodLimit: {
      method,
      invocationCountMaximum: profile.invocationCountMaximum,
      counters: {
        wallMilliseconds: { semantics: "counter", maximum: vector.wall.value },
        computeFuel: { semantics: "counter", maximum: vector.compute.value },
        payloadBytes: { semantics: "counter", maximum: vector.payload.value },
        stdoutBytes: { semantics: "counter", maximum: vector.stdout.value },
        stderrBytes: { semantics: "counter", maximum: vector.stderr.value },
      },
      memory: { semantics: "peak", maximumBytes: vector.memory.value },
      process: {
        semantics: "predicate",
        processes: vector.process.processes,
        threads: vector.process.threads,
        children: vector.process.children,
      },
      capabilities: {
        semantics: "predicate",
        filesystem: vector.capabilities.filesystem,
        network: vector.capabilities.network,
        environment: vector.capabilities.environment,
        shell: vector.capabilities.shell,
      },
      cancellation: {
        semantics: "predicate",
        terminationGraceMilliseconds:
          vector.cancellation.terminationGraceMilliseconds,
        evidence: vector.cancellation.evidence,
      },
      accountingEvidence: { semantics: "predicate", required: true },
    },
    matchLimit: {
      methodInvocations: {
        selectActivations:
          RUNTIME_ABI_V1_17.budgets.selectActivations.invocationCountMaximum,
        soldierBrain:
          RUNTIME_ABI_V1_17.budgets.soldierBrain.invocationCountMaximum,
      },
      counters: {
        invocationCount: {
          semantics: "counter",
          maximum: match.invocationCountMaximum,
        },
        wallMilliseconds: {
          semantics: "counter",
          maximum: match.wallMilliseconds,
        },
        computeFuel: { semantics: "counter", maximum: match.computeFuel },
        payloadBytes: { semantics: "counter", maximum: match.payloadBytes },
        stdoutBytes: { semantics: "counter", maximum: match.stdoutBytes },
        stderrBytes: { semantics: "counter", maximum: match.stderrBytes },
      },
      memory: { semantics: "peak", maximumBytes: match.memoryBytes },
      overflow: match.overflow,
    },
  })
}

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
  const expected = authenticate(
    label,
    unsigned as unknown as JsonValue,
    identity,
  )
  if (
    expected.signatureInputSha256 !==
    envelope.authentication.signatureInputSha256
  ) {
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
  return (
    actualBytes.byteLength === expectedBytes.byteLength &&
    timingSafeEqual(actualBytes, expectedBytes)
  )
}

const executionPrestateIsValid = (
  prestate: RuntimeAbiV117ExecutionLedger,
  nextInvocationId: string,
): boolean => {
  const match = RUNTIME_ABI_V1_17.budgets.matchCumulative
  const uniqueCommitments = new Set(
    prestate.commitments.map((commitment) => commitment.identity),
  )
  const selectCommitments = prestate.commitments.filter(
    (commitment) => commitment.scope === "selectActivations",
  ).length
  const soldierCommitments = prestate.commitments.filter(
    (commitment) => commitment.scope === "soldierBrain",
  ).length
  return (
    prestate.revision === prestate.commitments.length &&
    prestate.cumulative.invocationCount === prestate.revision &&
    prestate.methodInvocations.selectActivations === selectCommitments &&
    prestate.methodInvocations.soldierBrain === soldierCommitments &&
    selectCommitments + soldierCommitments === prestate.revision &&
    selectCommitments <=
      RUNTIME_ABI_V1_17.budgets.selectActivations.invocationCountMaximum &&
    soldierCommitments <=
      RUNTIME_ABI_V1_17.budgets.soldierBrain.invocationCountMaximum &&
    prestate.cumulative.invocationCount <= match.invocationCountMaximum &&
    prestate.cumulative.wallMilliseconds <= match.wallMilliseconds &&
    prestate.cumulative.computeFuel <= match.computeFuel &&
    prestate.cumulative.payloadBytes <= match.payloadBytes &&
    prestate.cumulative.stdoutBytes <= match.stdoutBytes &&
    prestate.cumulative.stderrBytes <= match.stderrBytes &&
    prestate.cumulative.memoryBytes <= match.memoryBytes &&
    uniqueCommitments.size === prestate.commitments.length &&
    !uniqueCommitments.has(nextInvocationId) &&
    prestate.commitments.every(
      (commitment, index) =>
        commitment.prestateRevision === index &&
        ((commitment.outcome === "success" &&
          commitment.dimensions.length === 0) ||
          (commitment.outcome === "player_violation" &&
            commitment.dimensions.length > 0)),
    )
  )
}

const createAuthenticatedRuntimeInvocationRequestForLifecycleV117 = (
  input: CreateRuntimeInvocationRequestV117Input,
  identity: RuntimeInvocationSigningIdentityV117,
  lifecycle: RuntimeInvocationLifecycleV117,
): AuthenticatedRuntimeInvocationRequestV117 => {
  const semanticTupleWithoutId = SemanticTupleWithoutIdSchema.parse(
    input.semanticTuple,
  )
  const sourceIdentity = RuntimeInvocationSourceIdentityV117Schema.parse(
    input.sourceIdentity,
  )
  const budgetWithoutHash = BudgetWithoutHashSchema.parse(input.budget)
  const expectedBudget = createRuntimeInvocationBudgetV117(input.method)
  if (
    !Buffer.from(
      canonicalBytes(budgetWithoutHash as unknown as JsonValue),
    ).equals(
      Buffer.from(canonicalBytes(expectedBudget as unknown as JsonValue)),
    )
  ) {
    throw new TypeError("Candidate request budget does not match its method")
  }
  const inputValue = HostApiJsonValueSchema.parse(input.input.value)
  const inputBytes = canonicalBytes(inputValue)
  const retryWithoutHash = RetryWithoutHashSchema.parse(input.retry)
  const semanticTuple = {
    tupleId: identityHash(
      "semanticTuple",
      semanticTupleWithoutId as unknown as JsonValue,
    ),
    ...semanticTupleWithoutId,
  }
  const budget = {
    ...budgetWithoutHash,
    profileSha256: RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256,
  }
  const requestInput = {
    value: inputValue,
    canonicalSha256: sha256Bytes(inputBytes),
    canonicalByteLength: inputBytes.byteLength,
  }
  const retry = {
    ...retryWithoutHash,
    identitySha256: retryIdentityHash(retryWithoutHash as unknown as JsonValue),
  }
  const prestate = RuntimeAbiV117ExecutionLedgerSchema.parse(
    input.accounting.prestate,
  ) as RuntimeAbiV117ExecutionLedger
  if (!executionPrestateIsValid(prestate, input.invocationId)) {
    throw new TypeError("Candidate request execution prestate is invalid")
  }
  const prestateSha256 =
    runtimeInvocationExecutionLedgerPrestateRootV117(prestate)
  const requestIdentity = framedValueHash(
    "runtime-invocation-v1.17:execution-request-identity",
    {
      invocationId: input.invocationId,
      kernelRequestId: input.kernelRequestId,
      method: input.method,
      semanticTupleId: semanticTuple.tupleId,
      strategyRevisionId: sourceIdentity.strategyRevisionId,
      artifactSha256: sourceIdentity.artifactSha256,
      budgetProfileSha256: budget.profileSha256,
      inputSha256: requestInput.canonicalSha256,
      prestateSha256,
    } as unknown as JsonValue,
  )
  const idempotencyKeySha256 = framedValueHash(
    "runtime-invocation-v1.17:execution-idempotency",
    {
      invocationId: input.invocationId,
      prestateRevision: prestate.revision,
      requestIdentity,
    } as unknown as JsonValue,
  )
  const accountingWithoutIdentity = {
    schemaVersion: "runtime-invocation-accounting-v1.17" as const,
    domain: "execution" as const,
    prestate,
    prestateSha256,
    requestIdentity,
    idempotencyKeySha256,
  }
  const accounting = {
    ...accountingWithoutIdentity,
    identitySha256: framedValueHash(
      "runtime-invocation-v1.17:execution-accounting-request",
      accountingWithoutIdentity as unknown as JsonValue,
    ),
  }
  const unsigned = {
    contractVersion: lifecycle.contractVersion,
    candidateStatus: lifecycle.lifecycle,
    current: lifecycle.current,
    envelopeKind: "runtime-invocation-request" as const,
    requestId: input.requestId,
    invocationId: input.invocationId,
    kernelRequestId: input.kernelRequestId,
    method: input.method,
    semanticTuple,
    sourceIdentity,
    budget,
    accounting,
    input: requestInput,
    retry,
  }
  const request = {
    ...unsigned,
    authentication: authenticate(
      "request",
      unsigned as unknown as JsonValue,
      identity,
    ),
  }
  const parsed = AuthenticatedRuntimeInvocationRequestV117Schema.parse(
    request,
  ) as AuthenticatedRuntimeInvocationRequestV117
  return registerRuntimeInvocationRequestV117(parsed)
}

/** Creates byte-stable inactive candidate evidence. */
export const createAuthenticatedRuntimeInvocationRequestV117 = (
  input: CreateRuntimeInvocationRequestV117Input,
  identity: RuntimeInvocationSigningIdentityV117,
): AuthenticatedRuntimeInvocationRequestV117 =>
  createAuthenticatedRuntimeInvocationRequestForLifecycleV117(
    input,
    identity,
    RUNTIME_INVOCATION_V1_17_CANDIDATE,
  )

/** Creates an invocation for the lifecycle selected by the atomic default. */
export const createSelectedRuntimeInvocationRequestV117 = (
  input: CreateRuntimeInvocationRequestV117Input,
  identity: RuntimeInvocationSigningIdentityV117,
): AuthenticatedRuntimeInvocationRequestV117 =>
  createAuthenticatedRuntimeInvocationRequestForLifecycleV117(
    input,
    identity,
    RUNTIME_INVOCATION_V1_17_SELECTED_LIFECYCLE,
  )

/**
 * Immutable, exact-object admission material for a request that has already
 * crossed the complete v1.17 construction or authenticated verification
 * boundary. Canonical bytes stay private so callers cannot mutate the cache.
 */
export interface RuntimeInvocationRequestAdmissionV117 {
  readonly binding: Readonly<RuntimeInvocationRequestBindingV117>
}

interface InternalRuntimeInvocationRequestAdmissionV117 {
  readonly request: AuthenticatedRuntimeInvocationRequestV117
  readonly public: RuntimeInvocationRequestAdmissionV117
  readonly canonicalBytes: Uint8Array
}

const runtimeInvocationRequestAdmissionsV117 = new WeakMap<
  object,
  InternalRuntimeInvocationRequestAdmissionV117
>()

const requestBindingFromCanonicalBytes = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  bytes: Uint8Array,
): RuntimeInvocationRequestBindingV117 => ({
  requestId: request.requestId,
  invocationId: request.invocationId,
  kernelRequestId: request.kernelRequestId,
  method: request.method,
  requestSha256: sha256Bytes(bytes),
  semanticTupleId: request.semanticTuple.tupleId,
  runtimeAbiVersion: request.semanticTuple.runtimeAbi,
  strategyRevisionId: request.sourceIdentity.strategyRevisionId,
  artifactSha256: request.sourceIdentity.artifactSha256,
  budgetProfileSha256: request.budget.profileSha256,
  inputSha256: request.input.canonicalSha256,
  retryIdentitySha256: request.retry.identitySha256,
  accountingIdentitySha256: request.accounting.identitySha256,
  idempotencyKeySha256: request.accounting.idempotencyKeySha256,
})

const registerRuntimeInvocationRequestV117 = (
  requestInput: AuthenticatedRuntimeInvocationRequestV117,
  knownCanonicalBytes?: Uint8Array,
): AuthenticatedRuntimeInvocationRequestV117 => {
  const existing = runtimeInvocationRequestAdmissionsV117.get(requestInput)
  if (existing !== undefined) return existing.request

  const request = deepFreeze(
    requestInput,
  ) as AuthenticatedRuntimeInvocationRequestV117
  const canonicalRequestBytes = Uint8Array.from(
    knownCanonicalBytes ?? canonicalBytes(request as unknown as JsonValue),
  )
  const binding = deepFreeze(
    requestBindingFromCanonicalBytes(request, canonicalRequestBytes),
  ) as Readonly<RuntimeInvocationRequestBindingV117>
  const admission = deepFreeze({
    binding,
  }) as RuntimeInvocationRequestAdmissionV117
  runtimeInvocationRequestAdmissionsV117.set(request, {
    request,
    public: admission,
    canonicalBytes: canonicalRequestBytes,
  })
  return request
}

/**
 * Returns admission only for the exact immutable object produced by a v1.17
 * constructor or successful verifier. Clones and reconstructed objects miss.
 */
export const getRuntimeInvocationRequestAdmissionV117 = (
  value: unknown,
): RuntimeInvocationRequestAdmissionV117 | undefined =>
  value !== null && typeof value === "object"
    ? runtimeInvocationRequestAdmissionsV117.get(value)?.public
    : undefined

const getInternalRuntimeInvocationRequestAdmissionV117 = (
  value: unknown,
): InternalRuntimeInvocationRequestAdmissionV117 | undefined =>
  value !== null && typeof value === "object"
    ? runtimeInvocationRequestAdmissionsV117.get(value)
    : undefined

export const serializeRuntimeInvocationRequestV117 = (
  request: AuthenticatedRuntimeInvocationRequestV117,
): Uint8Array => {
  const admitted = runtimeInvocationRequestAdmissionsV117.get(request)
  if (admitted !== undefined) {
    return Uint8Array.from(admitted.canonicalBytes)
  }
  const parsed = AuthenticatedRuntimeInvocationRequestV117Schema.parse(request)
  return canonicalBytes(parsed as unknown as JsonValue)
}

const requestBinding = (
  request: AuthenticatedRuntimeInvocationRequestV117,
): RuntimeInvocationRequestBindingV117 =>
  getRuntimeInvocationRequestAdmissionV117(request)?.binding ??
  requestBindingFromCanonicalBytes(
    request,
    serializeRuntimeInvocationRequestV117(request),
  )

const outcomeTraceMatchesRequest = (
  trace: RuntimeInvocationTraceV117,
  request: AuthenticatedRuntimeInvocationRequestV117,
): boolean => {
  const binding = requestBinding(request)
  return (
    trace.requestId === binding.requestId &&
    trace.invocationId === binding.invocationId &&
    trace.kernelRequestId === binding.kernelRequestId &&
    trace.method === binding.method &&
    trace.requestSha256 === binding.requestSha256 &&
    trace.budgetProfileSha256 === binding.budgetProfileSha256 &&
    trace.inputSha256 === binding.inputSha256 &&
    trace.retryIdentitySha256 === binding.retryIdentitySha256 &&
    trace.accountingIdentitySha256 === binding.accountingIdentitySha256 &&
    trace.idempotencyKeySha256 === binding.idempotencyKeySha256
  )
}

const receiptEvidenceIdentity = (
  receipt: RuntimeInvocationExecutionReceiptV117,
): `sha256:${string}` => {
  const { evidenceIdentity: _evidenceIdentity, ...withoutEvidenceIdentity } =
    receipt
  return framedValueHash(
    "runtime-invocation-v1.17:execution-evidence",
    withoutEvidenceIdentity as unknown as JsonValue,
  )
}

const budgetViolationCodeForDimensions = (
  dimensions: readonly string[],
): RuntimeInvocationPlayerViolationCodeV117 | undefined => {
  const codes = new Set<RuntimeInvocationPlayerViolationCodeV117>()
  for (const dimension of dimensions) {
    if (
      dimension.includes("payload") ||
      dimension.includes("stdout") ||
      dimension.includes("stderr")
    ) {
      codes.add("OVERSIZED_OUTPUT")
    } else if (dimension.includes("compute") || dimension.includes("memory")) {
      codes.add("RESOURCE_EXHAUSTION")
    } else if (dimension.includes("wall")) {
      return undefined
    } else if (dimension.includes("process")) {
      codes.add("RESOURCE_EXHAUSTION")
    } else {
      return undefined
    }
  }
  return codes.size === 1 ? [...codes][0] : undefined
}

const accountingDebitMatchesOutcome = (
  debit: ReturnType<typeof debitRuntimeAbiV117Ledger>,
  outcome: RuntimeInvocationResultV117,
): boolean => {
  if (debit.kind === "system_failure") {
    return outcome.kind === "system_failure"
  }
  if (debit.kind === "success") {
    return (
      outcome.kind === "success" ||
      (outcome.kind === "player_violation" &&
        (outcome.violation.code === "INVALID_OUTPUT" ||
          outcome.violation.code === "THROWN_EXCEPTION" ||
          outcome.violation.code === "FORBIDDEN_CAPABILITY"))
    )
  }
  return (
    outcome.kind === "player_violation" &&
    budgetViolationCodeForDimensions(debit.violation.dimensions) ===
      outcome.violation.code
  )
}

const deriveResponseAccounting = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  outcome: RuntimeInvocationResultV117,
  receiptInput: RuntimeInvocationExecutionReceiptV117,
): RuntimeInvocationResponseAccountingV117 | undefined => {
  const receipt =
    RuntimeAbiV117ExecutionLedgerReceiptSchema.safeParse(receiptInput)
  if (!receipt.success) return undefined
  const strictReceipt = receipt.data as RuntimeInvocationExecutionReceiptV117
  if (
    strictReceipt.domain !== "execution" ||
    strictReceipt.prestateRevision !== request.accounting.prestate.revision ||
    strictReceipt.invocationId !== request.invocationId ||
    strictReceipt.requestIdentity !== request.accounting.requestIdentity ||
    strictReceipt.method !== request.method ||
    strictReceipt.evidenceIdentity !== receiptEvidenceIdentity(strictReceipt)
  ) {
    return undefined
  }
  const debit = debitRuntimeAbiV117Ledger(
    request.accounting.prestate,
    strictReceipt,
  )
  if (!accountingDebitMatchesOutcome(debit, outcome)) return undefined
  const disposition =
    outcome.kind === "system_failure"
      ? ("no_commit" as const)
      : ("commit" as const)
  if (
    (disposition === "commit" && debit.kind === "system_failure") ||
    (disposition === "no_commit" &&
      (debit.kind !== "system_failure" ||
        !sameCanonicalValue(
          debit.ledger as unknown as JsonValue,
          request.accounting.prestate as unknown as JsonValue,
        )))
  ) {
    return undefined
  }
  const poststate = debit.ledger
  const accountingWithoutIdentity = {
    schemaVersion: "runtime-invocation-accounting-v1.17" as const,
    domain: "execution" as const,
    prestateSha256: request.accounting.prestateSha256,
    idempotencyKeySha256: request.accounting.idempotencyKeySha256,
    disposition,
    receipt: strictReceipt,
    poststate,
    poststateSha256:
      runtimeInvocationExecutionLedgerPoststateRootV117(poststate),
  }
  return {
    ...accountingWithoutIdentity,
    identitySha256: framedValueHash(
      "runtime-invocation-v1.17:execution-accounting-response",
      accountingWithoutIdentity as unknown as JsonValue,
    ),
  }
}

const successReceiptMatchesCanonicalGuestFrame = (
  receipt: RuntimeInvocationExecutionReceiptV117,
  payloadBytes: Uint8Array,
): boolean => {
  const payload = receipt.counters.payloadBytes
  const stdout = receipt.counters.stdoutBytes
  const stderr = receipt.counters.stderrBytes
  return (
    payload.status === "measured" &&
    payload.delta === payloadBytes.byteLength &&
    stdout.status === "measured" &&
    stdout.delta === payloadBytes.byteLength + 1 &&
    stderr.status === "measured" &&
    stderr.delta === 0
  )
}

export const createAuthenticatedRuntimeInvocationResponseV117 = <
  TValue extends JsonValue,
>(
  request: AuthenticatedRuntimeInvocationRequestV117,
  outcome: RuntimeInvocationResultV117<TValue>,
  receipt: RuntimeInvocationExecutionReceiptV117,
  identity: RuntimeInvocationSigningIdentityV117,
): AuthenticatedRuntimeInvocationResponseV117<TValue> => {
  if (
    !authenticationMatches("request", request, identity) ||
    !requestDerivedBindingsMatch(request)
  ) {
    throw new TypeError(
      "Cannot authenticate a response for an invalid candidate request",
    )
  }
  const parsedOutcome = RuntimeInvocationResultV117Schema.parse(
    outcome,
  ) as RuntimeInvocationResultV117<TValue>
  if (!outcomeTraceMatchesRequest(parsedOutcome.trace, request)) {
    throw new TypeError(
      "Cannot authenticate a response with an outcome trace outside the request binding",
    )
  }
  if (
    parsedOutcome.kind === "success" &&
    !successReceiptMatchesCanonicalGuestFrame(
      receipt,
      canonicalBytes(parsedOutcome.value),
    )
  ) {
    throw new TypeError(
      "Cannot authenticate a success response whose receipt contradicts the canonical guest frame",
    )
  }
  const accounting = deriveResponseAccounting(
    request,
    parsedOutcome as RuntimeInvocationResultV117,
    receipt,
  )
  if (accounting === undefined) {
    throw new TypeError(
      "Cannot authenticate a response with invalid execution accounting",
    )
  }
  const payloadBinding =
    parsedOutcome.kind === "success"
      ? {
          sha256: canonicalHash(parsedOutcome.value),
          canonicalByteLength: canonicalBytes(parsedOutcome.value).byteLength,
        }
      : null
  const unsigned = {
    contractVersion: request.contractVersion,
    candidateStatus: request.candidateStatus,
    current: request.current,
    envelopeKind: "runtime-invocation-response" as const,
    requestBinding: requestBinding(request),
    outcome: parsedOutcome,
    payloadBinding,
    accounting,
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
  const parsed =
    AuthenticatedRuntimeInvocationResponseV117Schema.parse(response)
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
  accountingIdentitySha256:
    partial?.accountingIdentitySha256 ?? sha256Bytes(bytes),
  idempotencyKeySha256: partial?.idempotencyKeySha256 ?? sha256Bytes(bytes),
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
    retryable: RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY[code],
  },
  trace: verificationTrace(bytes, partial),
})

const parseCanonicalEnvelope = <T>(
  bytes: Uint8Array,
  schema: z.ZodType<T>,
):
  | { ok: true; value: T }
  | { ok: false; code: RuntimeInvocationSystemFailureCodeV117 } => {
  if (bytes.byteLength === 0) return { ok: false, code: "OUTER_FRAME_MISSING" }
  const parsed = admitCanonicalJsonBytes(bytes, {
    profile: "authenticated-envelope",
  })
  if (!parsed.ok) {
    return {
      ok: false,
      code:
        parsed.error.byteOffset >= bytes.byteLength
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
  if (getRuntimeInvocationRequestAdmissionV117(request) !== undefined) {
    return true
  }
  const semanticTuple = withoutProperty(request.semanticTuple, "tupleId")
  const budget = withoutProperty(request.budget, "profileSha256")
  const retry = withoutProperty(request.retry, "identitySha256")
  const accounting = withoutProperty(request.accounting, "identitySha256")
  const inputBytes = canonicalBytes(request.input.value)
  const expectedBudget = createRuntimeInvocationBudgetV117(request.method)
  const prestateSha256 = framedValueHash(
    "runtime-invocation-v1.17:execution-ledger-prestate",
    request.accounting.prestate as unknown as JsonValue,
  )
  const requestIdentity = framedValueHash(
    "runtime-invocation-v1.17:execution-request-identity",
    {
      invocationId: request.invocationId,
      kernelRequestId: request.kernelRequestId,
      method: request.method,
      semanticTupleId: request.semanticTuple.tupleId,
      strategyRevisionId: request.sourceIdentity.strategyRevisionId,
      artifactSha256: request.sourceIdentity.artifactSha256,
      budgetProfileSha256: request.budget.profileSha256,
      inputSha256: request.input.canonicalSha256,
      prestateSha256,
    } as unknown as JsonValue,
  )
  const idempotencyKeySha256 = framedValueHash(
    "runtime-invocation-v1.17:execution-idempotency",
    {
      invocationId: request.invocationId,
      prestateRevision: request.accounting.prestate.revision,
      requestIdentity,
    } as unknown as JsonValue,
  )
  return (
    executionPrestateIsValid(
      request.accounting.prestate,
      request.invocationId,
    ) &&
    request.semanticTuple.tupleId ===
      identityHash("semanticTuple", semanticTuple as unknown as JsonValue) &&
    Buffer.from(canonicalBytes(budget as unknown as JsonValue)).equals(
      Buffer.from(canonicalBytes(expectedBudget as unknown as JsonValue)),
    ) &&
    request.budget.profileSha256 === RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256 &&
    request.input.canonicalSha256 === sha256Bytes(inputBytes) &&
    request.input.canonicalByteLength === inputBytes.byteLength &&
    request.retry.identitySha256 ===
      retryIdentityHash(retry as unknown as JsonValue) &&
    request.accounting.prestateSha256 === prestateSha256 &&
    request.accounting.requestIdentity === requestIdentity &&
    request.accounting.idempotencyKeySha256 === idempotencyKeySha256 &&
    request.accounting.identitySha256 ===
      framedValueHash(
        "runtime-invocation-v1.17:execution-accounting-request",
        accounting as unknown as JsonValue,
      )
  )
}

const receiptBindingFailureCodes: ReadonlySet<string> = new Set([
  "LEDGER_SCHEMA_INVALID",
  "RECEIPT_SCHEMA_INVALID",
  "LEDGER_DOMAIN_MISMATCH",
  "LEDGER_PRESTATE_MISMATCH",
  "LEDGER_IDENTITY_CONFLICT",
] as const)

export const createRuntimeInvocationExecutionReceiptV117 = (
  requestInput: AuthenticatedRuntimeInvocationRequestV117,
  evidenceInput: RuntimeInvocationExecutionReceiptEvidenceV117,
): RuntimeInvocationExecutionReceiptV117 => {
  const admitted = getRuntimeInvocationRequestAdmissionV117(requestInput)
  const internalAdmission =
    getInternalRuntimeInvocationRequestAdmissionV117(requestInput)
  const request =
    internalAdmission?.request ??
    (AuthenticatedRuntimeInvocationRequestV117Schema.parse(
      requestInput,
    ) as AuthenticatedRuntimeInvocationRequestV117)
  if (admitted === undefined && !requestDerivedBindingsMatch(request)) {
    throw new TypeError(
      "Cannot construct execution accounting for an invalid candidate request",
    )
  }
  const evidence =
    RuntimeInvocationExecutionReceiptEvidenceV117Schema.parse(evidenceInput)
  const withoutEvidenceIdentity = {
    domain: "execution" as const,
    prestateRevision: request.accounting.prestate.revision,
    invocationId: request.invocationId,
    requestIdentity: request.accounting.requestIdentity,
    method: request.method,
    ...evidence,
  }
  const receipt = RuntimeAbiV117ExecutionLedgerReceiptSchema.parse({
    ...withoutEvidenceIdentity,
    evidenceIdentity: framedValueHash(
      "runtime-invocation-v1.17:execution-evidence",
      withoutEvidenceIdentity as unknown as JsonValue,
    ),
  }) as RuntimeInvocationExecutionReceiptV117
  const validation = debitRuntimeAbiV117Ledger(
    request.accounting.prestate,
    receipt,
  )
  if (
    validation.kind === "system_failure" &&
    receiptBindingFailureCodes.has(validation.failure.code)
  ) {
    throw new TypeError(
      `Cannot construct execution accounting: ${validation.failure.code}`,
    )
  }
  return receipt
}

export const createRuntimeInvocationTraceV117 = (
  requestInput: AuthenticatedRuntimeInvocationRequestV117,
  safeCodes: readonly string[],
): RuntimeInvocationTraceV117 => {
  const admitted = getRuntimeInvocationRequestAdmissionV117(requestInput)
  const internalAdmission =
    getInternalRuntimeInvocationRequestAdmissionV117(requestInput)
  const request =
    internalAdmission?.request ??
    (AuthenticatedRuntimeInvocationRequestV117Schema.parse(
      requestInput,
    ) as AuthenticatedRuntimeInvocationRequestV117)
  if (admitted === undefined && !requestDerivedBindingsMatch(request)) {
    throw new TypeError(
      "Cannot construct an invocation trace for an invalid candidate request",
    )
  }
  const binding = requestBinding(request)
  return RuntimeInvocationTraceV117Schema.parse({
    requestId: binding.requestId,
    invocationId: binding.invocationId,
    kernelRequestId: binding.kernelRequestId,
    method: binding.method,
    requestSha256: binding.requestSha256,
    budgetProfileSha256: binding.budgetProfileSha256,
    inputSha256: binding.inputSha256,
    retryIdentitySha256: binding.retryIdentitySha256,
    accountingIdentitySha256: binding.accountingIdentitySha256,
    idempotencyKeySha256: binding.idempotencyKeySha256,
    safeCodes: [...safeCodes],
  }) as RuntimeInvocationTraceV117
}

function withoutProperty<T extends object, K extends keyof T>(
  value: T,
  key: K,
): Omit<T, K> {
  const { [key]: _removed, ...rest } = value
  return rest
}

const requestLifecycleMatches = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  lifecycle: RuntimeInvocationLifecycleV117,
): boolean =>
  request.contractVersion === lifecycle.contractVersion &&
  request.candidateStatus === lifecycle.lifecycle &&
  request.current === lifecycle.current

const verifyRuntimeInvocationRequestForLifecycleV117 = (
  bytes: Uint8Array,
  identity: RuntimeInvocationSigningIdentityV117,
  lifecycle: RuntimeInvocationLifecycleV117,
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
    accountingIdentitySha256: request.accounting.identitySha256,
    idempotencyKeySha256: request.accounting.idempotencyKeySha256,
  })
  if (!authenticationMatches("request", request, identity)) {
    return verificationFailure("OUTER_FRAME_UNAUTHENTICATED", bytes, trace)
  }
  if (!requestDerivedBindingsMatch(request)) {
    return verificationFailure("OUTER_FRAME_WRONG_BINDING", bytes, trace)
  }
  if (!requestLifecycleMatches(request, lifecycle)) {
    return verificationFailure("OUTER_FRAME_WRONG_BINDING", bytes, trace)
  }
  const admittedRequest = registerRuntimeInvocationRequestV117(request, bytes)
  return {
    kind: "success",
    value: admittedRequest,
    trace: {
      ...trace,
      safeCodes: ["ADAPTER_AUTHENTICATED", "OUTER_BINDINGS_VERIFIED"],
    },
  }
}

/** Verification-only admission for immutable inactive candidate evidence. */
export const verifyRuntimeInvocationRequestV117 = (
  bytes: Uint8Array,
  identity: RuntimeInvocationSigningIdentityV117,
): RuntimeInvocationResultV117<AuthenticatedRuntimeInvocationRequestV117> =>
  verifyRuntimeInvocationRequestForLifecycleV117(
    bytes,
    identity,
    RUNTIME_INVOCATION_V1_17_CANDIDATE,
  )

/** Executable admission bound to the atomic selected lifecycle authority. */
export const verifySelectedRuntimeInvocationRequestV117 = (
  bytes: Uint8Array,
  identity: RuntimeInvocationSigningIdentityV117,
): RuntimeInvocationResultV117<AuthenticatedRuntimeInvocationRequestV117> =>
  verifyRuntimeInvocationRequestForLifecycleV117(
    bytes,
    identity,
    RUNTIME_INVOCATION_V1_17_SELECTED_LIFECYCLE,
  )

const verifyRuntimeInvocationResponseV117Unsafe = (
  bytes: Uint8Array,
  expectedRequest: AuthenticatedRuntimeInvocationRequestV117,
  identity: RuntimeInvocationSigningIdentityV117,
): RuntimeInvocationResultV117<AuthenticatedRuntimeInvocationResponseV117> => {
  const admittedExpectedRequest =
    getRuntimeInvocationRequestAdmissionV117(expectedRequest)
  const internalExpectedRequest =
    getInternalRuntimeInvocationRequestAdmissionV117(expectedRequest)
  const parsedExpectedRequest =
    admittedExpectedRequest === undefined
      ? AuthenticatedRuntimeInvocationRequestV117Schema.safeParse(
          expectedRequest,
        )
      : undefined
  if (
    admittedExpectedRequest === undefined &&
    (parsedExpectedRequest === undefined || !parsedExpectedRequest.success)
  ) {
    return verificationFailure("OUTER_FRAME_WRONG_BINDING", bytes)
  }
  const request =
    internalExpectedRequest?.request ??
    (parsedExpectedRequest!.data as AuthenticatedRuntimeInvocationRequestV117)
  if (
    admittedExpectedRequest === undefined &&
    !requestDerivedBindingsMatch(request)
  ) {
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
    accountingIdentitySha256: expectedBinding.accountingIdentitySha256,
    idempotencyKeySha256: expectedBinding.idempotencyKeySha256,
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
    response.candidateStatus !== request.candidateStatus ||
    response.current !== request.current ||
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
      response.payloadBinding.canonicalByteLength !== payloadBytes.byteLength ||
      !successReceiptMatchesCanonicalGuestFrame(
        response.accounting.receipt,
        payloadBytes,
      )
    ) {
      return verificationFailure("OUTER_FRAME_WRONG_BINDING", bytes, partial)
    }
  } else if (response.payloadBinding !== null) {
    return verificationFailure("OUTER_FRAME_WRONG_BINDING", bytes, partial)
  }
  if (!outcomeTraceMatchesRequest(response.outcome.trace, request)) {
    return verificationFailure("OUTER_FRAME_WRONG_BINDING", bytes, partial)
  }
  const expectedAccounting = deriveResponseAccounting(
    request,
    response.outcome,
    response.accounting.receipt,
  )
  if (
    expectedAccounting === undefined ||
    !sameCanonicalValue(
      response.accounting as unknown as JsonValue,
      expectedAccounting as unknown as JsonValue,
    )
  ) {
    return verificationFailure("OUTER_FRAME_WRONG_BINDING", bytes, partial)
  }
  return {
    kind: "success",
    value: response,
    trace: {
      ...partial,
      safeCodes: ["ADAPTER_AUTHENTICATED", "OUTER_BINDINGS_VERIFIED"],
    },
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
