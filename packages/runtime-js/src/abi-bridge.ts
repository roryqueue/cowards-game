import { createHash } from "node:crypto"
import {
  RUNTIME_ABI_V1_17,
  RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS,
  STRATEGY_RUNTIME_ABI_VERSION,
  StrategyRuntimeRequestEnvelopeSchema,
  StrategyRuntimeResponseEnvelopeSchema,
  SoldierBrainInputV117Schema,
  SoldierBrainResultV117Schema,
  StrategyInputV117Schema,
  StrategyResultV117Schema,
  admitCanonicalJsonBytes,
  createAuthenticatedRuntimeInvocationResponseV117,
  createRuntimeInvocationExecutionReceiptV117,
  createRuntimeInvocationTraceV117,
  serializeRuntimeInvocationResponseV117,
  verifySelectedRuntimeInvocationRequestV117,
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
  StrategyExecutionAccountingObservationV117,
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

interface StrategyRuntimeAbiBridgeProfile {
  readonly abiVersion: string
  readonly parseRequest: (value: unknown) => {
    readonly methodName: StrategyMethodName
    readonly source: {
      readonly text?: string | undefined
      readonly hash: string
      readonly bytes: number
    }
    readonly input: unknown
  }
  readonly parseResponse: (value: unknown) => unknown
}

const executeStrategyRuntimeAbi = (
  input: ExecuteStrategyRuntimeAbiBridgeInput,
  profile: StrategyRuntimeAbiBridgeProfile,
): RuntimeResult<unknown> => {
  const request = profile.parseRequest({
    abiVersion: profile.abiVersion,
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

  profile.parseResponse(
    result.ok
      ? {
          ok: true,
          abiVersion: profile.abiVersion,
          value: result.value,
        }
      : "systemFailure" in result
        ? {
            ok: false,
            abiVersion: profile.abiVersion,
            failureKind: "systemFailure",
            systemFailure: {
              code: result.systemFailure.code,
              message: "Runtime system failure.",
              publicMessage: "Runtime system failure.",
            },
          }
        : {
            ok: false,
            abiVersion: profile.abiVersion,
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

/**
 * Test-support seam for the v1.16-shaped nested Match executor carried inside
 * the selected outer service. It follows the test process pointer and is not
 * historical v1.14 evidence. It is deliberately absent from every package
 * export map and production barrel.
 */
export const executeNestedMatchShapeRuntimeAbiTestSupport = (
  input: ExecuteStrategyRuntimeAbiBridgeInput,
): RuntimeResult<unknown> =>
  executeStrategyRuntimeAbi(input, {
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    parseRequest: (value) => StrategyRuntimeRequestEnvelopeSchema.parse(value),
    parseResponse: (value) =>
      StrategyRuntimeResponseEnvelopeSchema.parse(value),
  })

const normalizeVersionedV117EnvelopeForSelectedSchema = (
  value: unknown,
): unknown => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value
  }
  const normalized = globalThis.structuredClone(value) as Record<
    string,
    unknown
  >
  normalized.abiVersion = STRATEGY_RUNTIME_ABI_VERSION
  if (
    normalized.runtime !== null &&
    typeof normalized.runtime === "object" &&
    !Array.isArray(normalized.runtime)
  ) {
    const runtime = normalized.runtime as Record<string, unknown>
    runtime.abiVersion = STRATEGY_RUNTIME_ABI_VERSION
  }
  return normalized
}

const parseVersionedV117RequestForSelectedSchema = (value: unknown) => {
  const record = value as {
    abiVersion?: unknown
    methodName?: unknown
    runtime?: { abiVersion?: unknown }
    input?: unknown
  }
  if (
    record.abiVersion !== "strategy-runtime-abi-v1.17" ||
    record.runtime?.abiVersion !== "strategy-runtime-abi-v1.17"
  ) {
    throw new Error("Versioned v1.17 runtime request identity mismatch")
  }
  const versionedInput =
    record.methodName === "selectActivations"
      ? StrategyInputV117Schema.parse(record.input)
      : record.methodName === "soldierBrain"
        ? SoldierBrainInputV117Schema.parse(record.input)
        : (() => {
            throw new Error("Versioned v1.17 runtime method mismatch")
          })()
  const normalized = normalizeVersionedV117EnvelopeForSelectedSchema(
    value,
  ) as Record<string, unknown>
  normalized.input =
    record.methodName === "selectActivations"
      ? {
          ...versionedInput,
          initialInitiativePlayerId: "fixture-only:versioned-v1.17",
          hasInitialInitiative: false,
          roundInitiativePlayerId: "fixture-only:versioned-v1.17",
          hasRoundInitiative: false,
        }
      : { ...versionedInput, hasAdvancedThisActivation: false }
  const parsed = StrategyRuntimeRequestEnvelopeSchema.parse(normalized)
  return { ...parsed, input: versionedInput }
}

/**
 * Immutable v1.17 nested-Match fixture bridge. It verifies the exact historical
 * ABI before using the selected schema only as a structural validator.
 */
export const executeVersionedV117NestedMatchShapeRuntimeAbiTestSupport = (
  input: ExecuteStrategyRuntimeAbiBridgeInput,
): RuntimeResult<unknown> =>
  executeStrategyRuntimeAbi(input, {
    abiVersion: "strategy-runtime-abi-v1.17",
    parseRequest: parseVersionedV117RequestForSelectedSchema,
    parseResponse: (value) => {
      const record = value as { abiVersion?: unknown }
      if (record.abiVersion !== "strategy-runtime-abi-v1.17") {
        throw new Error("Versioned v1.17 runtime response identity mismatch")
      }
      return StrategyRuntimeResponseEnvelopeSchema.parse(
        normalizeVersionedV117EnvelopeForSelectedSchema(value),
      )
    },
  })

/** Selected-current bridge for new writes; its ABI follows the current pointer. */
export const executeSelectedStrategyRuntimeAbi = (
  input: ExecuteStrategyRuntimeAbiBridgeInput,
): RuntimeResult<unknown> => {
  if (String(STRATEGY_RUNTIME_ABI_VERSION) !== "strategy-runtime-abi-v1.14") {
    return {
      ok: false,
      violation: {
        type: "INVALID_OUTPUT",
        message: "Strategy runtime ABI is not selected",
      },
      systemFailure: { code: "MALFORMED_IPC", retryable: false },
    }
  }
  return executeNestedMatchShapeRuntimeAbiTestSupport(input)
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
  hostFailure: "H",
  deadlineExceeded: "D",
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
  stdoutBytes?: number
  stderrBytes?: number
  cancellation?: RuntimeGuestCancellationObservationV117
}>

export type RuntimeGuestCancellationObservationV117 = Readonly<{
  terminationRequired: boolean
  receiptPresent: boolean
  graceMilliseconds: number
}>

export type RuntimeGuestObservationV117 =
  | Readonly<{
      kind: "raw_frame"
      bytes: Uint8Array
      payloadBytes?: number
      stdoutBytes?: number
      stderrBytes?: number
      cancellation?: RuntimeGuestCancellationObservationV117
    }>
  | RuntimeGuestSystemFailureV117

export type RuntimeGuestExecutionV117 = Readonly<{
  observation: RuntimeGuestObservationV117
  receiptEvidence?: RuntimeInvocationExecutionReceiptEvidenceV117
}>

export interface ExecuteStrategyRuntimeAbiBridgeInputV117 {
  readonly requestBytes: Uint8Array
  readonly executableSource: string
  readonly signingIdentity: RuntimeInvocationSigningIdentityV117
  readonly invokeGuest: (input: {
    readonly executableSource: string
    readonly methodName: AuthenticatedRuntimeInvocationRequestV117["method"]
    readonly input: JsonValue
    readonly timeoutMs: number
    readonly startupTimeoutMs: number
    readonly cancellationGraceMilliseconds: number
    readonly outputByteLimit: number
    readonly stdoutByteLimit: number
    readonly stderrByteLimit: number
  }) => RuntimeGuestExecutionV117
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
  priorSafeCodes: readonly string[] = [],
): RuntimeInvocationResultV117 => ({
  kind: "system_failure",
  failure: {
    code,
    publicMessage: "Runtime system failure.",
    retryable,
  },
  trace: traceFor(
    request,
    Array.from(
      new Set([
        ...(priorSafeCodes.length > 0
          ? priorSafeCodes
          : ["ADAPTER_AUTHENTICATED", "OUTER_BINDINGS_VERIFIED"]),
        code,
      ]),
    ),
  ),
})

const successfulPayload = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  payloadBytes: Uint8Array,
): RuntimeInvocationResultV117 => {
  if (
    payloadBytes.byteLength >
    request.budget.methodLimit.counters.payloadBytes.maximum
  ) {
    return playerViolation(request, "OVERSIZED_OUTPUT", "PAYLOAD_CAP_EXCEEDED")
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
    return playerViolation(request, "INVALID_OUTPUT", "PAYLOAD_SCHEMA_REJECTED")
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
      return playerViolation(request, "INVALID_OUTPUT", "PAYLOAD_INVALID")
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
    case RUNTIME_GUEST_FRAME_TAGS_V117.hostFailure:
      return systemFailure(request, "HOST_CRASH", true)
    case RUNTIME_GUEST_FRAME_TAGS_V117.deadlineExceeded:
      return systemFailure(request, "TIMEOUT", false, [
        "ADAPTER_AUTHENTICATED",
        "OUTER_BINDINGS_VERIFIED",
        "WALL_DEADLINE_EXCEEDED",
      ])
    default:
      return systemFailure(request, "TRANSPORT_CRASH", true)
  }
}

export const observeRuntimeGuestAccountingV117 = (
  observation: RuntimeGuestObservationV117,
  outputByteLimit: number,
): StrategyExecutionAccountingObservationV117 => {
  if (observation.kind !== "raw_frame") {
    return {
      payloadBytes: 0,
      stdoutBytes: observation.stdoutBytes ?? 0,
      stderrBytes: observation.stderrBytes ?? 0,
      methodDeadlineExceeded: false,
      cancellation: observation.cancellation ?? {
        terminationRequired: false,
        receiptPresent: false,
        graceMilliseconds: 0,
      },
    }
  }
  const tag = String.fromCharCode(observation.bytes[0] ?? 0)
  return {
    payloadBytes:
      observation.payloadBytes ??
      (tag === RUNTIME_GUEST_FRAME_TAGS_V117.success
        ? Math.max(0, observation.bytes.byteLength - 1)
        : tag === RUNTIME_GUEST_FRAME_TAGS_V117.oversizedOutput
          ? outputByteLimit + 1
          : 0),
    stdoutBytes: observation.stdoutBytes ?? observation.bytes.byteLength,
    stderrBytes: observation.stderrBytes ?? 0,
    methodDeadlineExceeded:
      tag === RUNTIME_GUEST_FRAME_TAGS_V117.deadlineExceeded,
    cancellation:
      observation.cancellation ??
      (tag === RUNTIME_GUEST_FRAME_TAGS_V117.deadlineExceeded
        ? {
            terminationRequired: true,
            receiptPresent: false,
            graceMilliseconds: 0,
          }
        : {
            terminationRequired: false,
            receiptPresent: false,
            graceMilliseconds: 0,
          }),
  }
}

export const createRuntimeGuestExecutionV117 = (
  observation: RuntimeGuestObservationV117,
  receiptEvidence: RuntimeInvocationExecutionReceiptEvidenceV117 | undefined,
): RuntimeGuestExecutionV117 => {
  return receiptEvidence === undefined
    ? { observation }
    : { observation, receiptEvidence }
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
    const counterNames = [
      "wallMilliseconds",
      "computeFuel",
      "payloadBytes",
      "stdoutBytes",
      "stderrBytes",
    ] as const
    return (
      evidence !== undefined &&
      evidence.attribution !== "ambiguous" &&
      Object.keys(evidence.counters).length === counterNames.length &&
      counterNames.every(
        (counter) => evidence.counters[counter].status === "measured",
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

const accountingMatchesObservation = (
  evidence: RuntimeInvocationExecutionReceiptEvidenceV117,
  observation: StrategyExecutionAccountingObservationV117,
): boolean =>
  evidence.counters.payloadBytes.status === "measured" &&
  evidence.counters.payloadBytes.delta === observation.payloadBytes &&
  evidence.counters.stdoutBytes.status === "measured" &&
  evidence.counters.stdoutBytes.delta === observation.stdoutBytes &&
  evidence.counters.stderrBytes.status === "measured" &&
  evidence.counters.stderrBytes.delta === observation.stderrBytes &&
  evidence.cancellation.status === "verified" &&
  evidence.cancellation.terminationRequired ===
    observation.cancellation.terminationRequired &&
  evidence.cancellation.receiptPresent ===
    observation.cancellation.receiptPresent &&
  evidence.cancellation.graceMilliseconds ===
    observation.cancellation.graceMilliseconds

const hasBoundedTerminationReceipt = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  observation: RuntimeGuestObservationV117,
): boolean =>
  observation.cancellation?.terminationRequired === true &&
  observation.cancellation.receiptPresent &&
  observation.cancellation.graceMilliseconds >= 0 &&
  observation.cancellation.graceMilliseconds <=
    request.budget.methodLimit.cancellation.terminationGraceMilliseconds

const authenticatedResponse = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  outcome: RuntimeInvocationResultV117,
  evidence: RuntimeInvocationExecutionReceiptEvidenceV117,
  signingIdentity: RuntimeInvocationSigningIdentityV117,
): Uint8Array => {
  const receipt = createRuntimeInvocationExecutionReceiptV117(request, evidence)
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
  authenticatedResponse(request, outcome, ambiguousEvidence(), signingIdentity)

const incompatibleEvidenceResponse = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  signingIdentity: RuntimeInvocationSigningIdentityV117,
  observedOutcome: RuntimeInvocationResultV117,
  reason: "ACCOUNTING_EVIDENCE_UNAVAILABLE" | "ACCOUNTING_EVIDENCE_REJECTED",
): Uint8Array =>
  ambiguousResponse(
    request,
    signingIdentity,
    systemFailure(request, "AMBIGUOUS_ATTRIBUTION", false, [
      ...observedOutcome.trace.safeCodes,
      reason,
    ]),
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
  const admittedRequest = verifySelectedRuntimeInvocationRequestV117(
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
  const stdoutByteLimit = methodLimit.counters.stdoutBytes.maximum
  const stderrByteLimit = methodLimit.counters.stderrBytes.maximum
  if (outputByteLimit > RUNTIME_OUTPUT_BYTES) {
    return ambiguousResponse(
      request,
      input.signingIdentity,
      systemFailure(request, "OUTER_FRAME_WRONG_BINDING", false),
    )
  }
  let outcome: RuntimeInvocationResultV117
  let execution: RuntimeGuestExecutionV117
  try {
    execution = input.invokeGuest({
      executableSource: input.executableSource,
      methodName: request.method,
      input: request.input.value,
      timeoutMs: methodLimit.counters.wallMilliseconds.maximum,
      startupTimeoutMs:
        RUNTIME_ABI_V1_17.budgets.preflight.profiles.artifactValidation
          .wallMilliseconds,
      cancellationGraceMilliseconds:
        methodLimit.cancellation.terminationGraceMilliseconds,
      outputByteLimit,
      stdoutByteLimit,
      stderrByteLimit,
    })
  } catch {
    execution = {
      observation: {
        kind: "system_failure",
        code: "ADAPTER_CRASH",
        retryable: true,
      },
    }
  }
  const observation = execution.observation
  outcome =
    observation.kind === "raw_frame"
      ? observation.bytes.byteLength > stdoutByteLimit
        ? playerViolation(request, "OVERSIZED_OUTPUT", "STDOUT_CAP_EXCEEDED")
        : String.fromCharCode(observation.bytes[0] ?? 0) ===
              RUNTIME_GUEST_FRAME_TAGS_V117.deadlineExceeded &&
            !hasBoundedTerminationReceipt(request, observation)
          ? systemFailure(request, "AMBIGUOUS_ATTRIBUTION", false, [
              "ADAPTER_AUTHENTICATED",
              "OUTER_BINDINGS_VERIFIED",
              "WALL_DEADLINE_EXCEEDED",
              "TERMINATION_RECEIPT_UNAVAILABLE",
            ])
          : classifyGuestFrame(request, observation.bytes)
      : systemFailure(request, observation.code, observation.retryable)

  if (!hasCompleteAccounting(execution.receiptEvidence)) {
    return incompatibleEvidenceResponse(
      request,
      input.signingIdentity,
      outcome,
      execution.receiptEvidence === undefined
        ? "ACCOUNTING_EVIDENCE_UNAVAILABLE"
        : "ACCOUNTING_EVIDENCE_REJECTED",
    )
  }
  const accountingObservation = observeRuntimeGuestAccountingV117(
    observation,
    outputByteLimit,
  )
  if (
    !accountingMatchesObservation(
      execution.receiptEvidence,
      accountingObservation,
    )
  ) {
    return incompatibleEvidenceResponse(
      request,
      input.signingIdentity,
      outcome,
      "ACCOUNTING_EVIDENCE_REJECTED",
    )
  }
  try {
    createRuntimeInvocationExecutionReceiptV117(
      request,
      execution.receiptEvidence,
    )
  } catch {
    return incompatibleEvidenceResponse(
      request,
      input.signingIdentity,
      outcome,
      "ACCOUNTING_EVIDENCE_REJECTED",
    )
  }

  try {
    return authenticatedResponse(
      request,
      outcome,
      execution.receiptEvidence,
      input.signingIdentity,
    )
  } catch {
    // Invalid, unavailable, ambiguous, or outcome-inconsistent accounting can
    // never be translated into a player penalty or committed gameplay state.
    return incompatibleEvidenceResponse(
      request,
      input.signingIdentity,
      outcome,
      "ACCOUNTING_EVIDENCE_REJECTED",
    )
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
