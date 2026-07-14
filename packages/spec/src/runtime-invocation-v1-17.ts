import { z } from "zod"
import type { JsonValue } from "./types.js"

export const RUNTIME_INVOCATION_V1_17_CANDIDATE = Object.freeze({
  contractVersion: "runtime-invocation-v1.17",
  runtimeAbiVersion: "strategy-runtime-abi-v1.17",
  lifecycle: "inactive-candidate",
  activationPlan: "258-14",
  current: false,
} as const)

export const RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATION_CODES = [
  "INVALID_OUTPUT",
  "TIMEOUT",
  "THROWN_EXCEPTION",
  "FORBIDDEN_CAPABILITY",
  "OVERSIZED_OUTPUT",
] as const

export type RuntimeInvocationPlayerViolationCodeV117 =
  (typeof RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATION_CODES)[number]

export const RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES = [
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
] as const

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

export interface RuntimeInvocationPlayerViolationV117 {
  readonly code: RuntimeInvocationPlayerViolationCodeV117
  readonly publicMessage: string
}

export interface RuntimeInvocationSystemFailureV117 {
  readonly code: RuntimeInvocationSystemFailureCodeV117
  readonly publicMessage: string
  readonly retryable: boolean
}

export type RuntimeInvocationResultV117<
  TValue extends JsonValue = JsonValue,
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

const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number().finite(),
    z.string(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
)

const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u)
const SafeCodeSchema = z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/u)

export const RuntimeInvocationTraceV117Schema = z
  .object({
    requestId: z.string().min(1).max(256),
    invocationId: z.string().min(1).max(256),
    kernelRequestId: z.string().min(1).max(256),
    method: z.enum(["selectActivations", "soldierBrain"]),
    requestSha256: Sha256Schema,
    budgetProfileSha256: Sha256Schema,
    inputSha256: Sha256Schema,
    retryIdentitySha256: Sha256Schema,
    safeCodes: z.array(SafeCodeSchema).max(32),
  })
  .strict()

const RuntimeInvocationSuccessV117Schema = z
  .object({
    kind: z.literal("success"),
    value: JsonValueSchema,
    trace: RuntimeInvocationTraceV117Schema,
  })
  .strict()

const RuntimeInvocationPlayerViolationV117Schema = z
  .object({
    kind: z.literal("player_violation"),
    violation: z
      .object({
        code: z.enum(RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATION_CODES),
        publicMessage: z.string().min(1).max(256),
      })
      .strict(),
    trace: RuntimeInvocationTraceV117Schema,
  })
  .strict()

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

export const RuntimeInvocationResultV117Schema = z.discriminatedUnion("kind", [
  RuntimeInvocationSuccessV117Schema,
  RuntimeInvocationPlayerViolationV117Schema,
  RuntimeInvocationSystemFailureV117Schema,
])

export const RUNTIME_INVOCATION_V1_17_OWNERSHIP_MATRIX = Object.freeze({
  success: { kind: "success" },
  payload_duplicate_key: {
    kind: "player_violation",
    code: "INVALID_OUTPUT",
    publicMessage: "Strategy returned an invalid payload.",
  },
  payload_non_canonical: {
    kind: "player_violation",
    code: "INVALID_OUTPUT",
    publicMessage: "Strategy returned an invalid payload.",
  },
  payload_schema_invalid: {
    kind: "player_violation",
    code: "INVALID_OUTPUT",
    publicMessage: "Strategy returned an invalid payload.",
  },
  payload_illegal: {
    kind: "player_violation",
    code: "INVALID_OUTPUT",
    publicMessage: "Strategy returned an invalid payload.",
  },
  strategy_exception_proven: {
    kind: "player_violation",
    code: "THROWN_EXCEPTION",
    publicMessage: "Strategy threw an exception.",
  },
  strategy_exhaustion_proven: {
    kind: "player_violation",
    code: "TIMEOUT",
    publicMessage: "Strategy exhausted its invocation budget.",
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
      violation: {
        code: classification.code,
        publicMessage: classification.publicMessage,
      },
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
