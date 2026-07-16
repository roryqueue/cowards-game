import { createHash } from "node:crypto"
import {
  computeRecordedTransitionTraceRootV137,
  validateRecordedTransitionTraceRootsV137,
  type RecordedCanonicalTransitionV137,
} from "@cowards/replay"
import {
  ChronicleEventSchema,
  encodeCanonicalJson,
  type JsonValue,
} from "@cowards/spec"

export const CANONICAL_CONFORMANCE_TRACE_SCHEMA_VERSION =
  "v1.37-canonical-conformance-trace-v1" as const

export type CanonicalConformanceResultClass =
  | "success"
  | "player_violation"
  | "system_failure"

export interface CanonicalConformanceInvocation {
  readonly ordinal: number
  readonly invocationId: string
  readonly methodName: "selectActivations" | "soldierBrain"
  readonly resultClass: CanonicalConformanceResultClass
  readonly stableCode: string | null
  readonly failingBoundary: string
  readonly canonicalPayloadHash: string | null
  readonly strategyMemoryHash: string
  readonly soldierMemoryHash: string
  readonly objectiveHash: string
  readonly beforeStateHash: string
  readonly afterStateHash: string
  readonly beforeMemoryHash: string
  readonly afterMemoryHash: string
  readonly gameplayMutation: boolean
  readonly memoryMutation: boolean
  readonly terminalEffectHash: string | null
  readonly retryable: boolean
}

export interface CanonicalConformanceFailure {
  readonly resultClass: Exclude<CanonicalConformanceResultClass, "success">
  readonly stableCode: string
  readonly failingBoundary: string
  readonly invocationOrdinal: number | null
  readonly transitionOrdinal: number | null
  readonly gameplayMutation: boolean
  readonly memoryMutation: boolean
  readonly terminalEffectHash: string | null
  readonly retryable: boolean
}

export interface ProjectCanonicalConformanceTraceInput {
  readonly corpusVersion: string
  readonly corpusRootSha256: string
  readonly caseId: string
  readonly semanticTupleId: string
  readonly resultClass: CanonicalConformanceResultClass
  readonly invocations: readonly CanonicalConformanceInvocation[]
  readonly transitions: readonly RecordedCanonicalTransitionV137[]
  readonly finalStateHash: string
  readonly outcomeHash: string
  readonly failure: CanonicalConformanceFailure | null
}

export interface CanonicalConformanceTrace extends ProjectCanonicalConformanceTraceInput {
  readonly schemaVersion: typeof CANONICAL_CONFORMANCE_TRACE_SCHEMA_VERSION
  readonly transitionTraceRoot: string
  readonly traceRoot: string
}

export type CanonicalConformanceDivergenceField =
  | "schemaVersion"
  | "corpusVersion"
  | "corpusRootSha256"
  | "caseId"
  | "semanticTupleId"
  | "resultClass"
  | "invocations.length"
  | "invocation.ordinal"
  | "invocation.invocationId"
  | "invocation.methodName"
  | "invocation.resultClass"
  | "invocation.stableCode"
  | "invocation.failingBoundary"
  | "invocation.canonicalPayloadHash"
  | "invocation.strategyMemoryHash"
  | "invocation.soldierMemoryHash"
  | "invocation.objectiveHash"
  | "invocation.beforeStateHash"
  | "invocation.afterStateHash"
  | "invocation.beforeMemoryHash"
  | "invocation.afterMemoryHash"
  | "invocation.gameplayMutation"
  | "invocation.memoryMutation"
  | "invocation.terminalEffectHash"
  | "invocation.retryable"
  | "transitions.length"
  | "transition.ordinal"
  | "transition.kind"
  | "transition.semanticTupleId"
  | "transition.coordinates"
  | "transition.resultClass"
  | "transition.canonicalOutputHash"
  | "transition.strategyMemoryHash"
  | "transition.soldierMemoryHash"
  | "transition.objectiveHash"
  | "transition.orderedEvents"
  | "transition.orderedEventsHash"
  | "transition.beforeStateHash"
  | "transition.afterStateHash"
  | "transition.beforeMachineHash"
  | "transition.afterMachineHash"
  | "transition.terminalStatus"
  | "transition.failureStatus"
  | "transition.terminalHash"
  | "transition.accumulatedTraceRoot"
  | "finalStateHash"
  | "outcomeHash"
  | "failure"
  | "failure.resultClass"
  | "failure.stableCode"
  | "failure.failingBoundary"
  | "failure.invocationOrdinal"
  | "failure.transitionOrdinal"
  | "failure.gameplayMutation"
  | "failure.memoryMutation"
  | "failure.terminalEffectHash"
  | "failure.retryable"
  | "transitionTraceRoot"
  | "traceRoot"

export interface CanonicalConformanceDivergence {
  readonly code: "CANONICAL_CONFORMANCE_TRACE_DIVERGENCE"
  readonly caseId: string
  readonly field: CanonicalConformanceDivergenceField
  readonly invocationOrdinal: number | null
  readonly transitionOrdinal: number | null
  readonly expectedHash: string
  readonly actualHash: string
}

export type CanonicalConformanceTraceComparison =
  | {
      readonly status: "equal"
      readonly traceRoot: string
    }
  | {
      readonly status: "diverged"
      readonly disposition: "quarantine"
      readonly divergence: Readonly<CanonicalConformanceDivergence>
    }
  | {
      readonly status: "oracle_disputed"
      readonly disposition: "suspend_oracle"
      readonly code: "REVIEWED_ORACLE_ROOT_MISMATCH"
      readonly caseId: string
      readonly claimedRootHash: string
      readonly computedRootHash: string
    }

export type CanonicalConformanceTraceErrorCode =
  | "TRACE_SHAPE_INVALID"
  | "TRACE_IDENTIFIER_INVALID"
  | "TRACE_HASH_INVALID"
  | "TRACE_ORDER_INVALID"
  | "TRACE_RESULT_INVALID"
  | "TRACE_EVENT_INVALID"
  | "TRACE_TRANSITION_ROOT_INVALID"
  | "TRACE_TRANSITION_IDENTITY_INVALID"
  | "TRACE_CANONICAL_JSON_INVALID"

export class CanonicalConformanceTraceError extends Error {
  constructor(readonly code: CanonicalConformanceTraceErrorCode) {
    super(`Canonical conformance trace rejected: ${code}.`)
    this.name = "CanonicalConformanceTraceError"
  }
}

const fail = (code: CanonicalConformanceTraceErrorCode): never => {
  throw new CanonicalConformanceTraceError(code)
}

const HASH = /^sha256:[0-9a-f]{64}$/u
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u
const STABLE_CODE = /^[A-Z][A-Z0-9_:-]{0,127}$/u
const TRACE_ROOT_DOMAIN =
  "cowards-game:v1.37:canonical-conformance-trace:v1" as const
const DIVERGENCE_FIELD_DOMAIN =
  "cowards-game:v1.37:canonical-conformance-divergence:v1" as const
const textEncoder = new TextEncoder()

const inputKeys = [
  "corpusVersion",
  "corpusRootSha256",
  "caseId",
  "semanticTupleId",
  "resultClass",
  "invocations",
  "transitions",
  "finalStateHash",
  "outcomeHash",
  "failure",
] as const

const invocationKeys = [
  "ordinal",
  "invocationId",
  "methodName",
  "resultClass",
  "stableCode",
  "failingBoundary",
  "canonicalPayloadHash",
  "strategyMemoryHash",
  "soldierMemoryHash",
  "objectiveHash",
  "beforeStateHash",
  "afterStateHash",
  "beforeMemoryHash",
  "afterMemoryHash",
  "gameplayMutation",
  "memoryMutation",
  "terminalEffectHash",
  "retryable",
] as const

const failureKeys = [
  "resultClass",
  "stableCode",
  "failingBoundary",
  "invocationOrdinal",
  "transitionOrdinal",
  "gameplayMutation",
  "memoryMutation",
  "terminalEffectHash",
  "retryable",
] as const

const transitionKeys = [
  "ordinal",
  "kind",
  "semanticTupleId",
  "coordinates",
  "resultClass",
  "canonicalOutputHash",
  "strategyMemoryHash",
  "soldierMemoryHash",
  "objectiveHash",
  "orderedEvents",
  "orderedEventsHash",
  "beforeStateHash",
  "afterStateHash",
  "beforeMachineHash",
  "afterMachineHash",
  "terminalStatus",
  "failureStatus",
  "terminalHash",
  "accumulatedTraceRoot",
] as const

const coordinateRequiredKeys = [
  "phaseNumber",
  "roundNumber",
  "stage",
  "ordinal",
] as const

const coordinateAllowedKeys = [
  ...coordinateRequiredKeys,
  "cycleIndex",
  "activationId",
  "activationIndex",
  "actingPlayerId",
  "soldierId",
] as const

const eventRequiredKeys = [
  "type",
  "sequence",
  "payload",
  "privacy",
  "privatePayloadHash",
] as const

const eventAllowedKeys = [...eventRequiredKeys, "context"] as const

const exactKeys = (
  value: unknown,
  expected: readonly string[],
): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return fail("TRACE_SHAPE_INVALID")
  }
  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
  if (
    keys.length !== expected.length ||
    expected.some((key) => !Object.hasOwn(record, key))
  ) {
    fail("TRACE_SHAPE_INVALID")
  }
  return record
}

const closedKeys = (
  value: unknown,
  required: readonly string[],
  allowed: readonly string[],
): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return fail("TRACE_SHAPE_INVALID")
  }
  const record = value as Record<string, unknown>
  if (
    required.some((key) => !Object.hasOwn(record, key)) ||
    Object.keys(record).some((key) => !allowed.includes(key))
  ) {
    fail("TRACE_SHAPE_INVALID")
  }
  return record
}

const requireIdentifier = (value: unknown): string => {
  if (
    typeof value !== "string" ||
    !IDENTIFIER.test(value) ||
    textEncoder.encode(value).byteLength > 256
  ) {
    return fail("TRACE_IDENTIFIER_INVALID")
  }
  return value
}

const requireStableCode = (value: unknown): string => {
  if (typeof value !== "string" || !STABLE_CODE.test(value)) {
    return fail("TRACE_IDENTIFIER_INVALID")
  }
  return value
}

const requireHash = (value: unknown): string => {
  if (typeof value !== "string" || !HASH.test(value)) {
    return fail("TRACE_HASH_INVALID")
  }
  return value
}

const requireNullableHash = (value: unknown): string | null => {
  if (value === null) return null
  return requireHash(value)
}

const requireOrdinal = (value: unknown): number => {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    return fail("TRACE_ORDER_INVALID")
  }
  return value as number
}

const isResultClass = (
  value: unknown,
): value is CanonicalConformanceResultClass =>
  value === "success" ||
  value === "player_violation" ||
  value === "system_failure"

const requireBoolean = (value: unknown): boolean => {
  if (typeof value !== "boolean") return fail("TRACE_SHAPE_INVALID")
  return value
}

const freezeClone = <T>(value: T): Readonly<T> => {
  const clone = globalThis.structuredClone(value)
  const pending: object[] =
    clone !== null && typeof clone === "object" ? [clone] : []
  while (pending.length > 0) {
    const current = pending.pop()!
    for (const child of Object.values(current)) {
      if (
        child !== null &&
        typeof child === "object" &&
        !Object.isFrozen(child)
      ) {
        pending.push(child)
      }
    }
    Object.freeze(current)
  }
  return clone
}

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) return fail("TRACE_CANONICAL_JSON_INVALID")
  return encoded.bytes
}

const canonicalValuesEqual = (left: JsonValue, right: JsonValue): boolean => {
  const leftBytes = canonicalBytes(left)
  const rightBytes = canonicalBytes(right)
  return (
    leftBytes.byteLength === rightBytes.byteLength &&
    leftBytes.every((byte, index) => byte === rightBytes[index])
  )
}

const frame = (value: Uint8Array): Uint8Array => {
  const output = new Uint8Array(8 + value.byteLength)
  new DataView(output.buffer).setBigUint64(0, BigInt(value.byteLength), false)
  output.set(value, 8)
  return output
}

const hashTraceMaterial = (
  material: Omit<CanonicalConformanceTrace, "traceRoot">,
): string => {
  const hash = createHash("sha256")
  hash.update(frame(textEncoder.encode(TRACE_ROOT_DOMAIN)))
  hash.update(frame(canonicalBytes(material as unknown as JsonValue)))
  return `sha256:${hash.digest("hex")}`
}

const traceMaterial = (
  trace: CanonicalConformanceTrace,
): Omit<CanonicalConformanceTrace, "traceRoot"> => {
  const { traceRoot: _traceRoot, ...material } = trace
  return material
}

export const hashCanonicalConformanceTrace = (
  trace: CanonicalConformanceTrace,
): string => hashTraceMaterial(traceMaterial(trace))

const validateInvocation = (
  value: CanonicalConformanceInvocation,
  index: number,
): void => {
  exactKeys(value, invocationKeys)
  if (requireOrdinal(value.ordinal) !== index) fail("TRACE_ORDER_INVALID")
  requireIdentifier(value.invocationId)
  if (
    value.methodName !== "selectActivations" &&
    value.methodName !== "soldierBrain"
  ) {
    fail("TRACE_RESULT_INVALID")
  }
  if (!isResultClass(value.resultClass)) fail("TRACE_RESULT_INVALID")
  requireIdentifier(value.failingBoundary)
  requireHash(value.strategyMemoryHash)
  requireHash(value.soldierMemoryHash)
  requireHash(value.objectiveHash)
  requireHash(value.beforeStateHash)
  requireHash(value.afterStateHash)
  requireHash(value.beforeMemoryHash)
  requireHash(value.afterMemoryHash)
  requireNullableHash(value.terminalEffectHash)
  requireBoolean(value.gameplayMutation)
  requireBoolean(value.memoryMutation)
  requireBoolean(value.retryable)
  if (value.resultClass === "success") {
    if (
      value.stableCode !== null ||
      value.canonicalPayloadHash === null ||
      value.retryable
    ) {
      fail("TRACE_RESULT_INVALID")
    }
    requireHash(value.canonicalPayloadHash)
  } else {
    requireStableCode(value.stableCode)
    if (value.canonicalPayloadHash !== null) fail("TRACE_RESULT_INVALID")
  }
}

const validateFailure = (
  value: CanonicalConformanceFailure,
  input: ProjectCanonicalConformanceTraceInput,
): void => {
  exactKeys(value, failureKeys)
  if (
    !isResultClass(value.resultClass) ||
    value.resultClass !== input.resultClass
  ) {
    fail("TRACE_RESULT_INVALID")
  }
  requireStableCode(value.stableCode)
  requireIdentifier(value.failingBoundary)
  if (value.invocationOrdinal !== null) {
    const ordinal = requireOrdinal(value.invocationOrdinal)
    if (ordinal >= input.invocations.length) fail("TRACE_ORDER_INVALID")
  }
  if (value.transitionOrdinal !== null) {
    const ordinal = requireOrdinal(value.transitionOrdinal)
    if (ordinal >= input.transitions.length) fail("TRACE_ORDER_INVALID")
  }
  requireBoolean(value.gameplayMutation)
  requireBoolean(value.memoryMutation)
  requireNullableHash(value.terminalEffectHash)
  requireBoolean(value.retryable)
  if (
    value.resultClass === "system_failure" &&
    (value.gameplayMutation ||
      value.memoryMutation ||
      value.terminalEffectHash !== null)
  ) {
    fail("TRACE_RESULT_INVALID")
  }
  if (value.invocationOrdinal !== null) {
    const invocation = input.invocations[value.invocationOrdinal]!
    if (
      invocation.resultClass !== value.resultClass ||
      invocation.stableCode !== value.stableCode ||
      invocation.failingBoundary !== value.failingBoundary ||
      invocation.gameplayMutation !== value.gameplayMutation ||
      invocation.memoryMutation !== value.memoryMutation ||
      invocation.terminalEffectHash !== value.terminalEffectHash ||
      invocation.retryable !== value.retryable
    ) {
      fail("TRACE_RESULT_INVALID")
    }
    if (
      value.resultClass === "system_failure" &&
      (invocation.beforeStateHash !== invocation.afterStateHash ||
        invocation.beforeMemoryHash !== invocation.afterMemoryHash ||
        input.finalStateHash !== invocation.beforeStateHash)
    ) {
      fail("TRACE_RESULT_INVALID")
    }
  }
}

const validateCoordinates = (
  value: RecordedCanonicalTransitionV137["coordinates"],
  index: number,
): void => {
  const coordinates = closedKeys(
    value,
    coordinateRequiredKeys,
    coordinateAllowedKeys,
  )
  if (
    requireOrdinal(coordinates.ordinal) !== index ||
    !Number.isSafeInteger(coordinates.phaseNumber) ||
    (coordinates.phaseNumber as number) < 1 ||
    !Number.isSafeInteger(coordinates.roundNumber) ||
    (coordinates.roundNumber as number) < 1 ||
    (coordinates.roundNumber as number) > 4 ||
    typeof coordinates.stage !== "string" ||
    coordinates.stage.length === 0
  ) {
    fail("TRACE_ORDER_INVALID")
  }
  if (coordinates.cycleIndex !== undefined) {
    requireOrdinal(coordinates.cycleIndex)
  }
  if (coordinates.activationIndex !== undefined) {
    requireOrdinal(coordinates.activationIndex)
  }
  for (const key of ["activationId", "actingPlayerId", "soldierId"] as const) {
    if (coordinates[key] !== undefined) requireIdentifier(coordinates[key])
  }
}

const validateEvent = (
  value: RecordedCanonicalTransitionV137["orderedEvents"][number],
): void => {
  const event = closedKeys(value, eventRequiredKeys, eventAllowedKeys)
  requireIdentifier(event.type)
  requireOrdinal(event.sequence)
  if (event.privacy !== "public" && event.privacy !== "owner") {
    fail("TRACE_RESULT_INVALID")
  }
  requireNullableHash(event.privatePayloadHash)
  const context = (event.context ?? {}) as unknown as JsonValue
  const parsed = ChronicleEventSchema.safeParse({
    type: event.type,
    sequence: event.sequence,
    context,
    privacy: event.privacy,
    payload: event.payload,
  })
  if (
    !parsed.success ||
    !canonicalValuesEqual(
      parsed.data.payload as unknown as JsonValue,
      event.payload as JsonValue,
    ) ||
    !canonicalValuesEqual(
      parsed.data.context as unknown as JsonValue,
      context,
    ) ||
    (event.privacy === "public" && event.privatePayloadHash !== null)
  ) {
    fail("TRACE_EVENT_INVALID")
  }
}

const validateTransition = (
  value: RecordedCanonicalTransitionV137,
  index: number,
  semanticTupleId: string,
): void => {
  exactKeys(value, transitionKeys)
  if (requireOrdinal(value.ordinal) !== index) fail("TRACE_ORDER_INVALID")
  if (value.semanticTupleId !== semanticTupleId) {
    fail("TRACE_TRANSITION_IDENTITY_INVALID")
  }
  requireIdentifier(value.kind)
  validateCoordinates(value.coordinates, index)
  if (
    value.resultClass !== "success" &&
    value.resultClass !== "player_violation"
  ) {
    fail("TRACE_RESULT_INVALID")
  }
  for (const digest of [
    value.canonicalOutputHash,
    value.strategyMemoryHash,
    value.soldierMemoryHash,
    value.objectiveHash,
    value.orderedEventsHash,
    value.beforeStateHash,
    value.afterStateHash,
    value.beforeMachineHash,
    value.afterMachineHash,
    value.accumulatedTraceRoot,
  ]) {
    requireHash(digest)
  }
  if (!Array.isArray(value.orderedEvents)) fail("TRACE_SHAPE_INVALID")
  value.orderedEvents.forEach(validateEvent)
  if (value.failureStatus !== null) fail("TRACE_RESULT_INVALID")
  requireNullableHash(value.terminalHash)
  canonicalBytes(value.terminalStatus as unknown as JsonValue)
}

const validateInput = (input: ProjectCanonicalConformanceTraceInput): void => {
  exactKeys(input, inputKeys)
  requireIdentifier(input.corpusVersion)
  requireHash(input.corpusRootSha256)
  requireIdentifier(input.caseId)
  requireIdentifier(input.semanticTupleId)
  if (!isResultClass(input.resultClass)) fail("TRACE_RESULT_INVALID")
  if (!Array.isArray(input.invocations) || !Array.isArray(input.transitions)) {
    fail("TRACE_SHAPE_INVALID")
  }
  input.invocations.forEach(validateInvocation)
  input.transitions.forEach((transition, index) =>
    validateTransition(transition, index, input.semanticTupleId),
  )
  const transitionRoots = validateRecordedTransitionTraceRootsV137(
    input.transitions,
  )
  if (!transitionRoots.ok) fail("TRACE_TRANSITION_ROOT_INVALID")
  requireHash(input.finalStateHash)
  requireHash(input.outcomeHash)
  if (input.resultClass === "success") {
    if (input.failure !== null) fail("TRACE_RESULT_INVALID")
  } else {
    const failure = input.failure
    if (failure !== null) {
      validateFailure(failure, input)
    } else {
      fail("TRACE_RESULT_INVALID")
    }
  }
}

export const projectCanonicalConformanceTrace = (
  input: ProjectCanonicalConformanceTraceInput,
): Readonly<CanonicalConformanceTrace> => {
  validateInput(input)
  const material = freezeClone({
    schemaVersion: CANONICAL_CONFORMANCE_TRACE_SCHEMA_VERSION,
    corpusVersion: input.corpusVersion,
    corpusRootSha256: input.corpusRootSha256,
    caseId: input.caseId,
    semanticTupleId: input.semanticTupleId,
    resultClass: input.resultClass,
    invocations: input.invocations,
    transitions: input.transitions,
    finalStateHash: input.finalStateHash,
    outcomeHash: input.outcomeHash,
    failure: input.failure,
    transitionTraceRoot: computeRecordedTransitionTraceRootV137(
      input.transitions,
    ),
  }) as Omit<CanonicalConformanceTrace, "traceRoot">
  return freezeClone({
    ...material,
    traceRoot: hashTraceMaterial(material),
  }) as Readonly<CanonicalConformanceTrace>
}

const digestDivergenceValue = (value: unknown): string => {
  const wrapped = {
    presence: value === undefined ? "absent" : "present",
    value: value === undefined ? null : value,
  } as JsonValue
  return `sha256:${createHash("sha256")
    .update(frame(textEncoder.encode(DIVERGENCE_FIELD_DOMAIN)))
    .update(frame(canonicalBytes(wrapped)))
    .digest("hex")}`
}

const divergence = (
  expected: CanonicalConformanceTrace,
  field: CanonicalConformanceDivergenceField,
  expectedValue: unknown,
  actualValue: unknown,
  invocationOrdinal: number | null = null,
  transitionOrdinal: number | null = null,
): Readonly<CanonicalConformanceTraceComparison> =>
  freezeClone({
    status: "diverged",
    disposition: "quarantine",
    divergence: {
      code: "CANONICAL_CONFORMANCE_TRACE_DIVERGENCE",
      caseId: expected.caseId,
      field,
      invocationOrdinal,
      transitionOrdinal,
      expectedHash: digestDivergenceValue(expectedValue),
      actualHash: digestDivergenceValue(actualValue),
    },
  }) as Readonly<CanonicalConformanceTraceComparison>

const valuesDiffer = (expected: unknown, actual: unknown): boolean =>
  digestDivergenceValue(expected) !== digestDivergenceValue(actual)

const topLevelFields = [
  "schemaVersion",
  "corpusVersion",
  "corpusRootSha256",
  "caseId",
  "semanticTupleId",
  "resultClass",
] as const

const invocationFields = [
  "ordinal",
  "invocationId",
  "methodName",
  "resultClass",
  "stableCode",
  "failingBoundary",
  "canonicalPayloadHash",
  "strategyMemoryHash",
  "soldierMemoryHash",
  "objectiveHash",
  "beforeStateHash",
  "afterStateHash",
  "beforeMemoryHash",
  "afterMemoryHash",
  "gameplayMutation",
  "memoryMutation",
  "terminalEffectHash",
  "retryable",
] as const

const transitionFields = [
  "ordinal",
  "kind",
  "semanticTupleId",
  "coordinates",
  "resultClass",
  "canonicalOutputHash",
  "strategyMemoryHash",
  "soldierMemoryHash",
  "objectiveHash",
  "orderedEvents",
  "orderedEventsHash",
  "beforeStateHash",
  "afterStateHash",
  "beforeMachineHash",
  "afterMachineHash",
  "terminalStatus",
  "failureStatus",
  "terminalHash",
  "accumulatedTraceRoot",
] as const

const failureFields = [
  "resultClass",
  "stableCode",
  "failingBoundary",
  "invocationOrdinal",
  "transitionOrdinal",
  "gameplayMutation",
  "memoryMutation",
  "terminalEffectHash",
  "retryable",
] as const

export const compareCanonicalConformanceTrace = ({
  expected,
  actual,
}: {
  readonly expected: CanonicalConformanceTrace
  readonly actual: CanonicalConformanceTrace
}): Readonly<CanonicalConformanceTraceComparison> => {
  const computedExpectedRoot = hashCanonicalConformanceTrace(expected)
  if (expected.traceRoot !== computedExpectedRoot) {
    return freezeClone({
      status: "oracle_disputed",
      disposition: "suspend_oracle",
      code: "REVIEWED_ORACLE_ROOT_MISMATCH",
      caseId: expected.caseId,
      claimedRootHash: digestDivergenceValue(expected.traceRoot),
      computedRootHash: digestDivergenceValue(computedExpectedRoot),
    }) as Readonly<CanonicalConformanceTraceComparison>
  }
  const computedActualRoot = hashCanonicalConformanceTrace(actual)
  if (actual.traceRoot !== computedActualRoot) {
    return divergence(
      expected,
      "traceRoot",
      computedActualRoot,
      actual.traceRoot,
    )
  }
  if (expected.traceRoot === actual.traceRoot) {
    return Object.freeze({ status: "equal", traceRoot: expected.traceRoot })
  }

  for (const field of topLevelFields) {
    if (valuesDiffer(expected[field], actual[field])) {
      return divergence(expected, field, expected[field], actual[field])
    }
  }
  if (expected.invocations.length !== actual.invocations.length) {
    return divergence(
      expected,
      "invocations.length",
      expected.invocations.length,
      actual.invocations.length,
    )
  }
  for (let index = 0; index < expected.invocations.length; index += 1) {
    const expectedInvocation = expected.invocations[index]!
    const actualInvocation = actual.invocations[index]!
    for (const field of invocationFields) {
      if (valuesDiffer(expectedInvocation[field], actualInvocation[field])) {
        return divergence(
          expected,
          `invocation.${field}`,
          expectedInvocation[field],
          actualInvocation[field],
          expectedInvocation.ordinal,
        )
      }
    }
  }
  if (expected.transitions.length !== actual.transitions.length) {
    return divergence(
      expected,
      "transitions.length",
      expected.transitions.length,
      actual.transitions.length,
    )
  }
  for (let index = 0; index < expected.transitions.length; index += 1) {
    const expectedTransition = expected.transitions[index]!
    const actualTransition = actual.transitions[index]!
    for (const field of transitionFields) {
      if (valuesDiffer(expectedTransition[field], actualTransition[field])) {
        return divergence(
          expected,
          `transition.${field}`,
          expectedTransition[field],
          actualTransition[field],
          null,
          expectedTransition.ordinal,
        )
      }
    }
  }
  for (const field of ["finalStateHash", "outcomeHash"] as const) {
    if (valuesDiffer(expected[field], actual[field])) {
      return divergence(expected, field, expected[field], actual[field])
    }
  }
  if (expected.failure === null || actual.failure === null) {
    if (expected.failure !== actual.failure) {
      return divergence(expected, "failure", expected.failure, actual.failure)
    }
  } else {
    for (const field of failureFields) {
      if (valuesDiffer(expected.failure[field], actual.failure[field])) {
        return divergence(
          expected,
          `failure.${field}`,
          expected.failure[field],
          actual.failure[field],
          expected.failure.invocationOrdinal,
          expected.failure.transitionOrdinal,
        )
      }
    }
  }
  if (valuesDiffer(expected.transitionTraceRoot, actual.transitionTraceRoot)) {
    return divergence(
      expected,
      "transitionTraceRoot",
      expected.transitionTraceRoot,
      actual.transitionTraceRoot,
    )
  }
  return divergence(expected, "traceRoot", expected.traceRoot, actual.traceRoot)
}
