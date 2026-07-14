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
  serializeRuntimeInvocationResponseV117,
  verifyRuntimeInvocationRequestV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type JsonValue,
  type RuntimeInvocationPlayerViolationCodeV117,
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
  requestBytes: Uint8Array,
  safeCodes: readonly string[],
): RuntimeInvocationTraceV117 => ({
  requestId: request.requestId,
  invocationId: request.invocationId,
  kernelRequestId: request.kernelRequestId,
  method: request.method,
  requestSha256: sha256(requestBytes),
  budgetProfileSha256: request.budget.profileSha256,
  inputSha256: request.input.canonicalSha256,
  retryIdentitySha256: request.retry.identitySha256,
  safeCodes,
})

const playerViolation = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  requestBytes: Uint8Array,
  code: RuntimeInvocationPlayerViolationCodeV117,
  safeCode: string,
): RuntimeInvocationResultV117 => ({
  kind: "player_violation",
  violation: RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS[code],
  trace: traceFor(request, requestBytes, [
    "ADAPTER_AUTHENTICATED",
    "OUTER_BINDINGS_VERIFIED",
    safeCode,
  ]),
})

const systemFailure = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  requestBytes: Uint8Array,
  code: RuntimeInvocationSystemFailureCodeV117,
  retryable: boolean,
): RuntimeInvocationResultV117 => ({
  kind: "system_failure",
  failure: {
    code,
    publicMessage: "Runtime system failure.",
    retryable,
  },
  trace: traceFor(request, requestBytes, [
    "ADAPTER_AUTHENTICATED",
    "OUTER_BINDINGS_VERIFIED",
    code,
  ]),
})

const successfulPayload = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  requestBytes: Uint8Array,
  payloadBytes: Uint8Array,
): RuntimeInvocationResultV117 => {
  if (payloadBytes.byteLength > request.budget.outputBytes) {
    return playerViolation(
      request,
      requestBytes,
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
      requestBytes,
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
      requestBytes,
      "INVALID_OUTPUT",
      "PAYLOAD_SCHEMA_REJECTED",
    )
  }
  return {
    kind: "success",
    value: parsed.data as JsonValue,
    trace: traceFor(request, requestBytes, [
      "ADAPTER_AUTHENTICATED",
      "OUTER_BINDINGS_VERIFIED",
      "PAYLOAD_CANONICAL",
      "PAYLOAD_SCHEMA_VALID",
    ]),
  }
}

const classifyGuestFrame = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  requestBytes: Uint8Array,
  frame: Uint8Array,
): RuntimeInvocationResultV117 => {
  if (frame.byteLength === 0) {
    return systemFailure(request, requestBytes, "TRANSPORT_CRASH", true)
  }
  const tag = String.fromCharCode(frame[0] ?? 0)
  const payload = frame.subarray(1)
  if (
    tag !== RUNTIME_GUEST_FRAME_TAGS_V117.success &&
    payload.byteLength !== 0
  ) {
    return systemFailure(request, requestBytes, "TRANSPORT_CRASH", true)
  }
  switch (tag) {
    case RUNTIME_GUEST_FRAME_TAGS_V117.success:
      return successfulPayload(request, requestBytes, payload)
    case RUNTIME_GUEST_FRAME_TAGS_V117.invalidOutput:
      return playerViolation(
        request,
        requestBytes,
        "INVALID_OUTPUT",
        "PAYLOAD_INVALID",
      )
    case RUNTIME_GUEST_FRAME_TAGS_V117.thrownException:
      return playerViolation(
        request,
        requestBytes,
        "THROWN_EXCEPTION",
        "STRATEGY_EXCEPTION_PROVEN",
      )
    case RUNTIME_GUEST_FRAME_TAGS_V117.forbiddenCapability:
      return playerViolation(
        request,
        requestBytes,
        "FORBIDDEN_CAPABILITY",
        "FORBIDDEN_CAPABILITY_PROVEN",
      )
    case RUNTIME_GUEST_FRAME_TAGS_V117.oversizedOutput:
      return playerViolation(
        request,
        requestBytes,
        "OVERSIZED_OUTPUT",
        "PAYLOAD_CAP_EXCEEDED",
      )
    default:
      return systemFailure(request, requestBytes, "TRANSPORT_CRASH", true)
  }
}

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

  let outcome: RuntimeInvocationResultV117
  const executableBytes = textEncoder.encode(input.executableSource)
  if (sha256(executableBytes) !== request.sourceIdentity.artifactSha256) {
    outcome = systemFailure(
      request,
      requestBytes,
      "OUTER_FRAME_WRONG_BINDING",
      false,
    )
  } else {
    let observation: RuntimeGuestObservationV117
    try {
      observation = input.invokeGuest({
        executableSource: input.executableSource,
        methodName: request.method,
        input: request.input.value,
        timeoutMs: request.budget.wallMilliseconds,
        outputByteLimit: request.budget.outputBytes,
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
        ? classifyGuestFrame(request, requestBytes, observation.bytes)
        : systemFailure(
            request,
            requestBytes,
            observation.code,
            observation.retryable,
          )
  }
  const response = createAuthenticatedRuntimeInvocationResponseV117(
    request,
    outcome,
    input.signingIdentity,
  )
  return serializeRuntimeInvocationResponseV117(response)
}

export const encodeRuntimeGuestSuccessFrameV117 = (
  payloadBytes: Uint8Array,
): Uint8Array => {
  const frame = new Uint8Array(payloadBytes.byteLength + 1)
  frame.set(textEncoder.encode(RUNTIME_GUEST_FRAME_TAGS_V117.success), 0)
  frame.set(payloadBytes, 1)
  return frame
}
