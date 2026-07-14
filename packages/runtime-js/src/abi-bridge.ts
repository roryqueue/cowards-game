import { createHash } from "node:crypto"
import {
  RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS,
  STRATEGY_RUNTIME_ABI_VERSION,
  SoldierBrainResultV117Schema,
  StrategyRuntimeRequestEnvelopeSchema,
  StrategyRuntimeResponseEnvelopeSchema,
  StrategyResultV117Schema,
  admitCanonicalJsonBytes,
  createAuthenticatedRuntimeInvocationResponseV117,
  createRuntimeInvocationExecutionReceiptV117,
  createRuntimeInvocationTraceV117,
  serializeRuntimeInvocationResponseV117,
  verifyRuntimeInvocationRequestV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type JsonValue,
  type RuntimeInvocationPlayerViolationCodeV117,
  type RuntimeInvocationExecutionReceiptEvidenceV117,
  type RuntimeInvocationResultV117,
  type RuntimeInvocationSigningIdentityV117,
  type RuntimeInvocationSystemFailureCodeV117,
  type RuntimeInvocationTraceV117,
  type StrategyRevision,
} from "@cowards/spec"
import type { RuntimeResult } from "@cowards/engine"
import type {
  StrategyExecutionAdapter,
  StrategyExecutionAdapterOptions,
  StrategyMethodName,
} from "./adapter.js"
import { RUNTIME_OUTPUT_BYTES } from "./guards.js"
import { hashStrategySource } from "./hash.js"

export interface ExecuteStrategyRuntimeAbiBridgeInput extends StrategyExecutionAdapterOptions {
  adapter: StrategyExecutionAdapter
  revision: StrategyRevision
  executableSource: string
  methodName: StrategyMethodName
  input: unknown
}

export const executeStrategyRuntimeAbiV114 = (
  input: ExecuteStrategyRuntimeAbiBridgeInput,
): RuntimeResult<unknown> => {
  const request = StrategyRuntimeRequestEnvelopeSchema.parse({
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    methodName: input.methodName,
    runtime: input.revision.runtime,
    source: {
      text: input.revision.source,
      hash: input.revision.sourceHash,
      bytes: input.revision.sourceBytes,
      entrypoint: input.revision.runtime.package.entrypoint,
    },
    input: input.input,
  })
  if (request.source.text === undefined) {
    return {
      ok: false,
      violation: {
        type: "INVALID_OUTPUT",
        message: "Strategy Revision failed ABI source validation",
      },
    }
  }
  if (
    hashStrategySource(request.source.text) !== request.source.hash ||
    new TextEncoder().encode(request.source.text).length !==
      request.source.bytes
  ) {
    return {
      ok: false,
      violation: {
        type: "INVALID_OUTPUT",
        message: "Strategy Revision failed ABI source validation",
      },
    }
  }

  const result = input.adapter.execute({
    source: input.executableSource,
    methodName: request.methodName,
    input: request.input,
    timeoutMs: input.timeoutMs,
    outputByteLimit: input.outputByteLimit,
  })

  StrategyRuntimeResponseEnvelopeSchema.parse(
    result.ok
      ? {
          ok: true,
          abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
          value: result.value,
        }
        : "systemFailure" in result
          ? {
              ok: false,
              abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
              failureKind: "systemFailure",
              systemFailure: {
                code: result.systemFailure.code,
                message: "Runtime system failure.",
                publicMessage: "Runtime system failure.",
              },
            }
          : {
          ok: false,
          abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
          failureKind: "runtimeViolation",
          violation: {
            code: result.violation.type,
            message: result.violation.message,
            publicMessage: result.violation.message,
          },
        },
  )

  return result
}

const textEncoder = new TextEncoder()

export const RUNTIME_GUEST_FRAME_TAGS_V117 = Object.freeze({
  success: "S",
  invalidOutput: "I",
  thrownException: "X",
  forbiddenCapability: "F",
  oversizedOutput: "O",
  runtimeFailure: "R",
  transportFailure: "T",
} as const)

export type RuntimeGuestSystemFailureV117 = Readonly<{
  kind: "system_failure"
  code: Extract<
    RuntimeInvocationSystemFailureCodeV117,
    | "ADAPTER_CRASH"
    | "RUNTIME_CRASH"
    | "HOST_CRASH"
    | "TRANSPORT_CRASH"
    | "AMBIGUOUS_ATTRIBUTION"
  >
  retryable: boolean
}>

export type RuntimeGuestObservationV117 =
  | Readonly<{ kind: "raw_frame"; bytes: Uint8Array }>
  | RuntimeGuestSystemFailureV117

export interface ExecuteStrategyRuntimeAbiBridgeInputV117 {
  readonly requestBytes: Uint8Array
  readonly executableSource: string
  readonly signingIdentity: RuntimeInvocationSigningIdentityV117
  /**
   * Complete host-observed execution evidence. Current JS adapters cannot
   * produce equivalent evidence themselves, so omission fails closed.
   */
  readonly receiptEvidence?: RuntimeInvocationExecutionReceiptEvidenceV117
  readonly invokeGuest: (input: {
    readonly executableSource: string
    readonly methodName: AuthenticatedRuntimeInvocationRequestV117["method"]
    readonly input: JsonValue
    readonly timeoutMs: number
    readonly outputByteLimit: number
  }) => RuntimeGuestObservationV117
}

const sha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const traceFor = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  safeCodes: readonly string[],
): RuntimeInvocationTraceV117 =>
  createRuntimeInvocationTraceV117(request, safeCodes)

const playerViolation = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  code: RuntimeInvocationPlayerViolationCodeV117,
  safeCode: string,
): RuntimeInvocationResultV117 => ({
  kind: "player_violation",
  violation: RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS[code],
  trace: traceFor(request, [
    "ADAPTER_AUTHENTICATED",
    "OUTER_BINDINGS_VERIFIED",
    safeCode,
  ]),
})

const systemFailure = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  code: RuntimeInvocationSystemFailureCodeV117,
  retryable: boolean,
): RuntimeInvocationResultV117 => ({
  kind: "system_failure",
  failure: {
    code,
    publicMessage: "Runtime system failure.",
    retryable,
  },
  trace: traceFor(request, [
    "ADAPTER_AUTHENTICATED",
    "OUTER_BINDINGS_VERIFIED",
    code,
  ]),
})

const successfulPayload = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  payloadBytes: Uint8Array,
): RuntimeInvocationResultV117 => {
  if (
    payloadBytes.byteLength >
    request.budget.methodLimit.counters.payloadBytes.maximum
  ) {
    return playerViolation(
      request,
      "OVERSIZED_OUTPUT",
      "PAYLOAD_CAP_EXCEEDED",
    )
  }
  const admitted = admitCanonicalJsonBytes(payloadBytes, {
    profile: "strategy-payload",
  })
  if (!admitted.ok) {
    return playerViolation(
      request,
      admitted.error.code === "FIELD_CAP_EXCEEDED"
        ? "OVERSIZED_OUTPUT"
        : "INVALID_OUTPUT",
      "PAYLOAD_REJECTED",
    )
  }
  const schema =
    request.method === "selectActivations"
      ? StrategyResultV117Schema
      : SoldierBrainResultV117Schema
  const parsed = schema.safeParse(admitted.value)
  if (!parsed.success) {
    return playerViolation(
      request,
      "INVALID_OUTPUT",
      "PAYLOAD_SCHEMA_REJECTED",
    )
  }
  return {
    kind: "success",
    value: parsed.data as JsonValue,
    trace: traceFor(request, [
      "ADAPTER_AUTHENTICATED",
      "OUTER_BINDINGS_VERIFIED",
      "PAYLOAD_CANONICAL",
      "PAYLOAD_SCHEMA_VALID",
    ]),
  }
}

const classifyGuestFrame = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  frame: Uint8Array,
): RuntimeInvocationResultV117 => {
  if (frame.byteLength === 0) {
    return systemFailure(request, "TRANSPORT_CRASH", true)
  }
  const tag = String.fromCharCode(frame[0] ?? 0)
  const payload = frame.subarray(1)
  if (
    tag !== RUNTIME_GUEST_FRAME_TAGS_V117.success &&
    payload.byteLength !== 0
  ) {
    return systemFailure(request, "TRANSPORT_CRASH", true)
  }
  switch (tag) {
    case RUNTIME_GUEST_FRAME_TAGS_V117.success:
      return successfulPayload(request, payload)
    case RUNTIME_GUEST_FRAME_TAGS_V117.invalidOutput:
      return playerViolation(
        request,
        "INVALID_OUTPUT",
        "PAYLOAD_INVALID",
      )
    case RUNTIME_GUEST_FRAME_TAGS_V117.thrownException:
      return playerViolation(
        request,
        "THROWN_EXCEPTION",
        "STRATEGY_EXCEPTION_PROVEN",
      )
    case RUNTIME_GUEST_FRAME_TAGS_V117.forbiddenCapability:
      return playerViolation(
        request,
        "FORBIDDEN_CAPABILITY",
        "FORBIDDEN_CAPABILITY_PROVEN",
      )
    case RUNTIME_GUEST_FRAME_TAGS_V117.oversizedOutput:
      return playerViolation(
        request,
        "OVERSIZED_OUTPUT",
        "PAYLOAD_CAP_EXCEEDED",
      )
    case RUNTIME_GUEST_FRAME_TAGS_V117.transportFailure:
      return systemFailure(request, "TRANSPORT_CRASH", true)
    case RUNTIME_GUEST_FRAME_TAGS_V117.runtimeFailure:
      return systemFailure(request, "RUNTIME_CRASH", true)
    default:
      return systemFailure(request, "TRANSPORT_CRASH", true)
  }
}

const ambiguousEvidence =
  (): RuntimeInvocationExecutionReceiptEvidenceV117 => ({
    attribution: "ambiguous",
    counters: {
      wallMilliseconds: { status: "ambiguous" },
      computeFuel: { status: "ambiguous" },
      payloadBytes: { status: "ambiguous" },
      stdoutBytes: { status: "ambiguous" },
      stderrBytes: { status: "ambiguous" },
    },
    memory: { status: "ambiguous" },
    process: { status: "ambiguous" },
    capabilities: { status: "ambiguous" },
    cancellation: { status: "ambiguous" },
    accountingEvidence: { status: "ambiguous" },
  })

const hasCompleteAccounting = (
  evidence: RuntimeInvocationExecutionReceiptEvidenceV117 | undefined,
): evidence is RuntimeInvocationExecutionReceiptEvidenceV117 => {
  try {
    return (
      evidence !== undefined &&
      evidence.attribution !== "ambiguous" &&
      Object.values(evidence.counters).every(
        (counter) => counter.status === "measured",
      ) &&
      evidence.memory.status === "measured" &&
      evidence.process.status === "verified" &&
      evidence.capabilities.status === "verified" &&
      evidence.cancellation.status === "verified" &&
      evidence.accountingEvidence.status === "verified" &&
      evidence.accountingEvidence.signatureVerified &&
      evidence.accountingEvidence.monotonic
    )
  } catch {
    return false
  }
}

const authenticatedResponse = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  outcome: RuntimeInvocationResultV117,
  evidence: RuntimeInvocationExecutionReceiptEvidenceV117,
  signingIdentity: RuntimeInvocationSigningIdentityV117,
): Uint8Array => {
  const receipt = createRuntimeInvocationExecutionReceiptV117(
    request,
    evidence,
  )
  const response = createAuthenticatedRuntimeInvocationResponseV117(
    request,
    outcome,
    receipt,
    signingIdentity,
  )
  return serializeRuntimeInvocationResponseV117(response)
}

const ambiguousResponse = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  signingIdentity: RuntimeInvocationSigningIdentityV117,
  outcome = systemFailure(request, "AMBIGUOUS_ATTRIBUTION", false),
): Uint8Array =>
  authenticatedResponse(
    request,
    outcome,
    ambiguousEvidence(),
    signingIdentity,
  )

/**
 * Host-only successor bridge. It authenticates raw request bytes before
 * materialization, gives the guest only source/method/input/budgets, admits
 * raw guest payload bytes, and signs exactly one exclusive response outcome.
 */
export const executeStrategyRuntimeAbiV117 = (
  input: ExecuteStrategyRuntimeAbiBridgeInputV117,
): Uint8Array => {
  const requestBytes = Uint8Array.from(input.requestBytes)
  const admittedRequest = verifyRuntimeInvocationRequestV117(
    requestBytes,
    input.signingIdentity,
  )
  // An invalid request has no authenticated request identity to which a host
  // response may be bound. Returning an empty frame makes the caller fail
  // closed without conferring adapter authority on malformed bytes.
  if (admittedRequest.kind !== "success") return new Uint8Array()
  const request = admittedRequest.value

  const executableBytes = textEncoder.encode(input.executableSource)
  if (sha256(executableBytes) !== request.sourceIdentity.artifactSha256) {
    return ambiguousResponse(
      request,
      input.signingIdentity,
      systemFailure(request, "OUTER_FRAME_WRONG_BINDING", false),
    )
  }
  const methodLimit = request.budget.methodLimit
  const outputByteLimit = methodLimit.counters.payloadBytes.maximum
  if (outputByteLimit > RUNTIME_OUTPUT_BYTES) {
    return ambiguousResponse(
      request,
      input.signingIdentity,
      systemFailure(request, "OUTER_FRAME_WRONG_BINDING", false),
    )
  }
  if (!hasCompleteAccounting(input.receiptEvidence)) {
    return ambiguousResponse(request, input.signingIdentity)
  }
  try {
    createRuntimeInvocationExecutionReceiptV117(
      request,
      input.receiptEvidence,
    )
  } catch {
    return ambiguousResponse(request, input.signingIdentity)
  }

  let outcome: RuntimeInvocationResultV117
  let observation: RuntimeGuestObservationV117
  try {
    observation = input.invokeGuest({
      executableSource: input.executableSource,
      methodName: request.method,
      input: request.input.value,
      timeoutMs: methodLimit.counters.wallMilliseconds.maximum,
      outputByteLimit,
    })
  } catch {
    observation = {
      kind: "system_failure",
      code: "ADAPTER_CRASH",
      retryable: true,
    }
  }
  outcome =
    observation.kind === "raw_frame"
      ? classifyGuestFrame(request, observation.bytes)
      : systemFailure(request, observation.code, observation.retryable)

  try {
    return authenticatedResponse(
      request,
      outcome,
      input.receiptEvidence,
      input.signingIdentity,
    )
  } catch {
    // Invalid, unavailable, ambiguous, or outcome-inconsistent accounting can
    // never be translated into a player penalty or committed gameplay state.
    return ambiguousResponse(request, input.signingIdentity)
  }
}

export const encodeRuntimeGuestSuccessFrameV117 = (
  payloadBytes: Uint8Array,
): Uint8Array => {
  const frame = new Uint8Array(payloadBytes.byteLength + 1)
  frame.set(textEncoder.encode(RUNTIME_GUEST_FRAME_TAGS_V117.success), 0)
  frame.set(payloadBytes, 1)
  return frame
}
