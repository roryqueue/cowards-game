import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  RuntimeInvocationRequestV118Schema,
  RuntimeSupervisorRawReceiptV118Schema,
  admitCanonicalJsonBytes,
  admitCanonicalJsonValue,
  evaluateRuntimeSupervisorReceiptV118,
  type JsonValue,
  type RuntimeInvocationEvidenceFailureCodeV118,
  type RuntimeInvocationRequestV118,
  type RuntimeSupervisorRawReceiptV118,
} from "@cowards/spec"

const REQUEST_SCHEMA_VERSION =
  "runtime-supervisor-invocation-request-v1.18" as const
const RECEIPT_SCHEMA_VERSION =
  "runtime-supervisor-receipt-envelope-v1.18" as const
const VERIFIED_SCHEMA_VERSION =
  "runtime-supervisor-verified-evidence-v1.18" as const
const SHA256 = /^sha256:[0-9a-f]{64}$/u
const PUBLIC_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u
const NONCE = /^[A-Za-z0-9._:-]{24,255}$/u
const ENVIRONMENT_NAME = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/u
const EXECUTABLE_PATH_MAX_BYTES = 4096
const ARGUMENT_MAX_BYTES = 4096
const ARGUMENT_COUNT_MAX = 64
const ENVIRONMENT_VALUE_MAX_BYTES = 16_384
const ENVIRONMENT_COUNT_MAX = 128

const requestAuthority = new WeakSet<object>()
const verifiedAuthority = new WeakSet<object>()

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const sha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const canonicalBytes = (value: unknown): Uint8Array => {
  const admitted = admitCanonicalJsonValue(value, {
    profile: "authenticated-envelope",
  })
  if (!admitted.ok) {
    throw new TypeError(
      `Supervisor canonical JSON failed: ${admitted.error.code}`,
    )
  }
  return admitted.canonicalBytes
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const exactKeys = (
  value: unknown,
  keys: readonly string[],
): value is Record<string, unknown> =>
  isRecord(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key))

const decodeBase64 = (value: unknown): Uint8Array | undefined => {
  if (typeof value !== "string") return undefined
  const bytes = Buffer.from(value, "base64")
  return bytes.toString("base64") === value ? Uint8Array.from(bytes) : undefined
}

const isNonnegativeSafeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0

export interface SupervisorExecutionDescriptorV118 {
  readonly executablePath: string
  /**
   * Trusted-host SHA-256 of the exact resolved executable bytes. The native
   * launcher must rehash those bytes immediately before exec and fail closed
   * if they no longer match.
   */
  readonly executableBytesSha256: `sha256:${string}`
  readonly argv: readonly string[]
  readonly environment: readonly Readonly<{
    name: string
    value: string
  }>[]
}

export interface CreateSupervisorInvocationRequestV118Input {
  readonly invocation: RuntimeInvocationRequestV118
  readonly inputBytes: Uint8Array
  readonly execution: SupervisorExecutionDescriptorV118
  readonly cancellationChannel: Readonly<{
    channelId: string
    channelNonce: string
  }>
}

export interface SupervisorInvocationRequestV118 {
  readonly schemaVersion: typeof REQUEST_SCHEMA_VERSION
  readonly invocation: RuntimeInvocationRequestV118
  readonly input: Readonly<{
    bytesBase64: string
    byteLength: number
    sha256: `sha256:${string}`
  }>
  readonly cancellation: Readonly<{
    channelId: string
    channelNonce: string
  }>
  readonly execution: SupervisorExecutionDescriptorV118
  readonly expectedProcessGroupIdentitySha256: `sha256:${string}`
  readonly supervisorRequestSha256: `sha256:${string}`
}

export interface SupervisorObservedOutputV118 {
  readonly payloadBytes: Uint8Array
  readonly stdoutBytes: Uint8Array
  readonly stderrBytes: Uint8Array
}

export interface SupervisorRawReceiptEnvelopeV118 {
  schemaVersion: typeof RECEIPT_SCHEMA_VERSION
  supervisorRequestSha256: `sha256:${string}`
  inputSha256: `sha256:${string}`
  cancellationChannelSha256: `sha256:${string}`
  output: {
    payloadSha256: `sha256:${string}`
    stdoutSha256: `sha256:${string}`
    stderrSha256: `sha256:${string}`
  }
  receipt: RuntimeSupervisorRawReceiptV118
}

export type SupervisorVerificationFailureCodeV118 =
  | "REQUEST_CANONICAL_JSON_INVALID"
  | "REQUEST_SHAPE_INVALID"
  | "REQUEST_INPUT_MISMATCH"
  | "REQUEST_BINDING_MISMATCH"
  | "REQUEST_NOT_VERIFIED"
  | "RAW_RECEIPT_INVALID"
  | "RECEIPT_BINDING_MISMATCH"
  | "OBSERVATION_MISMATCH"
  | RuntimeInvocationEvidenceFailureCodeV118

export interface SupervisorVerificationFailureV118 {
  readonly ok: false
  readonly gameplayDisposition: "no_mutation"
  readonly code: SupervisorVerificationFailureCodeV118
}

export type SupervisorInvocationRequestParseResultV118 =
  | Readonly<{
      ok: true
      value: SupervisorInvocationRequestV118
    }>
  | SupervisorVerificationFailureV118

export type VerifiedSupervisorResultV118 =
  | Readonly<{
      kind: "success"
      evidence: Readonly<{
        requestSha256: `sha256:${string}`
        budgetProfileSha256: `sha256:${string}`
        cgroupPathIdentitySha256: `sha256:${string}`
        cgroupSettingsSha256: `sha256:${string}`
        computeFuel: number
        wallMilliseconds: number
        memoryPeakBytes: number
        pidsPeak: number
        payloadBytes: number
        stdoutBytes: number
        stderrBytes: number
        identity: RuntimeSupervisorRawReceiptV118["identity"]
      }>
    }>
  | Readonly<{
      kind: "player_violation"
      code: "RESOURCE_EXHAUSTION"
      dimensions: readonly string[]
    }>

export interface VerifiedSupervisorEvidenceV118 {
  readonly schemaVersion: typeof VERIFIED_SCHEMA_VERSION
  readonly supervisorRequestSha256: `sha256:${string}`
  readonly invocationRequestSha256: `sha256:${string}`
  readonly rawReceiptSha256: `sha256:${string}`
  readonly observed: Readonly<{
    inputSha256: `sha256:${string}`
    payloadSha256: `sha256:${string}`
    stdoutSha256: `sha256:${string}`
    stderrSha256: `sha256:${string}`
    inputBytes: number
    payloadBytes: number
    stdoutBytes: number
    stderrBytes: number
  }>
  readonly result: VerifiedSupervisorResultV118
}

export type SupervisorVerificationResultV118 =
  | Readonly<{
      ok: true
      value: VerifiedSupervisorEvidenceV118
    }>
  | SupervisorVerificationFailureV118

const failure = (
  code: SupervisorVerificationFailureCodeV118,
): SupervisorVerificationFailureV118 =>
  Object.freeze({
    ok: false,
    gameplayDisposition: "no_mutation",
    code,
  })

const utf8Length = (value: string): number => Buffer.byteLength(value, "utf8")

const isBoundedText = (value: unknown, maximumBytes: number): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  !value.includes("\u0000") &&
  utf8Length(value) <= maximumBytes

const validateExecutionDescriptor = (
  value: unknown,
): SupervisorExecutionDescriptorV118 | undefined => {
  if (
    !exactKeys(value, [
      "executablePath",
      "executableBytesSha256",
      "argv",
      "environment",
    ]) ||
    !isBoundedText(value.executablePath, EXECUTABLE_PATH_MAX_BYTES) ||
    !value.executablePath.startsWith("/") ||
    typeof value.executableBytesSha256 !== "string" ||
    !SHA256.test(value.executableBytesSha256) ||
    !Array.isArray(value.argv) ||
    value.argv.length > ARGUMENT_COUNT_MAX ||
    !value.argv.every((argument) =>
      isBoundedText(argument, ARGUMENT_MAX_BYTES),
    ) ||
    !Array.isArray(value.environment) ||
    value.environment.length > ENVIRONMENT_COUNT_MAX
  ) {
    return undefined
  }
  const environment: Array<{ name: string; value: string }> = []
  for (const entry of value.environment) {
    if (
      !exactKeys(entry, ["name", "value"]) ||
      typeof entry.name !== "string" ||
      !ENVIRONMENT_NAME.test(entry.name) ||
      typeof entry.value !== "string" ||
      entry.value.includes("\u0000") ||
      utf8Length(entry.value) > ENVIRONMENT_VALUE_MAX_BYTES
    ) {
      return undefined
    }
    environment.push({ name: entry.name, value: entry.value })
  }
  environment.sort((left, right) =>
    left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
  )
  for (let index = 1; index < environment.length; index += 1) {
    if (environment[index - 1]?.name === environment[index]?.name) {
      return undefined
    }
  }
  return {
    executablePath: value.executablePath,
    executableBytesSha256:
      value.executableBytesSha256 as `sha256:${string}`,
    argv: [...value.argv],
    environment,
  }
}

export const deriveSupervisorExecutionIdentityV118 = (
  descriptor: SupervisorExecutionDescriptorV118,
): RuntimeInvocationRequestV118["executable"] => {
  const execution = validateExecutionDescriptor(descriptor)
  if (execution === undefined) {
    throw new TypeError("Supervisor execution descriptor is invalid")
  }
  return deepFreeze({
    executableSha256: execution.executableBytesSha256,
    argvSha256: sha256(
      canonicalBytes({
        identityDomain: "cowards-game:runtime-argv:v1.18",
        argv: execution.argv,
      }),
    ),
    environmentPolicySha256: sha256(
      canonicalBytes({
        identityDomain: "cowards-game:runtime-environment-allowlist:v1.18",
        environment: execution.environment,
      }),
    ),
  }) as RuntimeInvocationRequestV118["executable"]
}

const executionIdentityMatchesInvocation = (
  invocation: RuntimeInvocationRequestV118,
  execution: SupervisorExecutionDescriptorV118,
): boolean => {
  const identity = deriveSupervisorExecutionIdentityV118(execution)
  return (
    identity.executableSha256 === invocation.executable.executableSha256 &&
    identity.argvSha256 === invocation.executable.argvSha256 &&
    identity.environmentPolicySha256 ===
      invocation.executable.environmentPolicySha256
  )
}

const requestBody = (
  request: Omit<SupervisorInvocationRequestV118, "supervisorRequestSha256">,
): JsonValue => request as unknown as JsonValue

const requestHash = (
  request: Omit<SupervisorInvocationRequestV118, "supervisorRequestSha256">,
): `sha256:${string}` => sha256(canonicalBytes(requestBody(request)))

const cancellationHash = (
  cancellation: SupervisorInvocationRequestV118["cancellation"],
): `sha256:${string}` =>
  sha256(
    canonicalBytes({
      identityDomain: "cowards-game:runtime-cancellation-channel:v1.18",
      channelId: cancellation.channelId,
      channelNonce: cancellation.channelNonce,
    }),
  )

const processGroupIdentityHash = (input: {
  invocation: RuntimeInvocationRequestV118
  input: SupervisorInvocationRequestV118["input"]
  cancellation: SupervisorInvocationRequestV118["cancellation"]
  execution: SupervisorExecutionDescriptorV118
}): `sha256:${string}` =>
  sha256(
    canonicalBytes({
      identityDomain: "cowards-game:runtime-process-group-identity:v1.18",
      invocationRequestSha256: input.invocation.requestSha256,
      hostNonce: input.invocation.hostNonce,
      inputSha256: input.input.sha256,
      cancellationChannelSha256: cancellationHash(input.cancellation),
      execution: input.execution,
    }),
  )

const validateInputBinding = (
  input: unknown,
  maximumBytes: number,
): { binding: SupervisorInvocationRequestV118["input"] } | undefined => {
  if (
    !exactKeys(input, ["bytesBase64", "byteLength", "sha256"]) ||
    !isNonnegativeSafeInteger(input.byteLength) ||
    input.byteLength === 0 ||
    input.byteLength > maximumBytes ||
    typeof input.sha256 !== "string" ||
    !SHA256.test(input.sha256)
  ) {
    return undefined
  }
  const bytes = decodeBase64(input.bytesBase64)
  if (
    bytes === undefined ||
    bytes.byteLength !== input.byteLength ||
    sha256(bytes) !== input.sha256
  ) {
    return undefined
  }
  const admitted = admitCanonicalJsonBytes(bytes, {
    profile: "authenticated-envelope",
  })
  if (!admitted.ok) return undefined
  return {
    binding: {
      bytesBase64: input.bytesBase64 as string,
      byteLength: input.byteLength,
      sha256: input.sha256 as `sha256:${string}`,
    },
  }
}

const validateCancellation = (
  value: unknown,
): SupervisorInvocationRequestV118["cancellation"] | undefined => {
  if (
    !exactKeys(value, ["channelId", "channelNonce"]) ||
    typeof value.channelId !== "string" ||
    !PUBLIC_ID.test(value.channelId) ||
    typeof value.channelNonce !== "string" ||
    !NONCE.test(value.channelNonce)
  ) {
    return undefined
  }
  return {
    channelId: value.channelId,
    channelNonce: value.channelNonce,
  }
}

const authorizeRequest = (
  request: SupervisorInvocationRequestV118,
): SupervisorInvocationRequestV118 => {
  const frozen = deepFreeze(request) as SupervisorInvocationRequestV118
  requestAuthority.add(frozen)
  return frozen
}

export const createSupervisorInvocationRequestV118 = (
  input: CreateSupervisorInvocationRequestV118Input,
): SupervisorInvocationRequestV118 => {
  const parsedInvocation = RuntimeInvocationRequestV118Schema.safeParse(
    input.invocation,
  )
  if (!parsedInvocation.success) {
    throw new TypeError("Supervisor invocation request is invalid")
  }
  const admittedInput = admitCanonicalJsonBytes(input.inputBytes, {
    profile: "authenticated-envelope",
  })
  if (
    !admittedInput.ok ||
    input.inputBytes.byteLength === 0 ||
    input.inputBytes.byteLength > parsedInvocation.data.limits.payloadBytes
  ) {
    throw new TypeError("Supervisor input bytes are invalid")
  }
  const cancellation = validateCancellation(input.cancellationChannel)
  if (cancellation === undefined) {
    throw new TypeError("Supervisor cancellation channel is invalid")
  }
  const execution = validateExecutionDescriptor(input.execution)
  if (
    execution === undefined ||
    !executionIdentityMatchesInvocation(
      parsedInvocation.data as unknown as RuntimeInvocationRequestV118,
      execution,
    )
  ) {
    throw new TypeError("Supervisor execution identity is invalid")
  }
  const bodyWithoutProcessGroup = {
    schemaVersion: REQUEST_SCHEMA_VERSION,
    invocation:
      parsedInvocation.data as unknown as RuntimeInvocationRequestV118,
    input: {
      bytesBase64: Buffer.from(input.inputBytes).toString("base64"),
      byteLength: input.inputBytes.byteLength,
      sha256: sha256(input.inputBytes),
    },
    cancellation,
    execution,
  }
  const withoutHash = {
    ...bodyWithoutProcessGroup,
    expectedProcessGroupIdentitySha256: processGroupIdentityHash(
      bodyWithoutProcessGroup,
    ),
  }
  return authorizeRequest({
    ...withoutHash,
    supervisorRequestSha256: requestHash(withoutHash),
  })
}

export const serializeSupervisorInvocationRequestV118 = (
  request: SupervisorInvocationRequestV118,
): Uint8Array => {
  if (!requestAuthority.has(request)) {
    throw new TypeError("Supervisor invocation request is not verified")
  }
  return canonicalBytes(request)
}

export const parseSupervisorInvocationRequestV118 = (
  bytes: Uint8Array,
): SupervisorInvocationRequestParseResultV118 => {
  const admitted = admitCanonicalJsonBytes(bytes, {
    profile: "authenticated-envelope",
  })
  if (!admitted.ok) return failure("REQUEST_CANONICAL_JSON_INVALID")
  const value = admitted.value
  if (
    !exactKeys(value, [
      "schemaVersion",
      "invocation",
      "input",
      "cancellation",
      "execution",
      "expectedProcessGroupIdentitySha256",
      "supervisorRequestSha256",
    ]) ||
    value.schemaVersion !== REQUEST_SCHEMA_VERSION ||
    typeof value.expectedProcessGroupIdentitySha256 !== "string" ||
    !SHA256.test(value.expectedProcessGroupIdentitySha256) ||
    typeof value.supervisorRequestSha256 !== "string" ||
    !SHA256.test(value.supervisorRequestSha256)
  ) {
    return failure("REQUEST_SHAPE_INVALID")
  }
  const parsedInvocation = RuntimeInvocationRequestV118Schema.safeParse(
    value.invocation,
  )
  if (!parsedInvocation.success) return failure("REQUEST_SHAPE_INVALID")
  const input = validateInputBinding(
    value.input,
    parsedInvocation.data.limits.payloadBytes,
  )
  if (input === undefined) return failure("REQUEST_INPUT_MISMATCH")
  const cancellation = validateCancellation(value.cancellation)
  if (cancellation === undefined) return failure("REQUEST_SHAPE_INVALID")
  const execution = validateExecutionDescriptor(value.execution)
  if (execution === undefined) return failure("REQUEST_SHAPE_INVALID")
  const invocation =
    parsedInvocation.data as unknown as RuntimeInvocationRequestV118
  if (!executionIdentityMatchesInvocation(invocation, execution)) {
    return failure("REQUEST_BINDING_MISMATCH")
  }
  const bodyWithoutProcessGroup = {
    schemaVersion: REQUEST_SCHEMA_VERSION,
    invocation,
    input: input.binding,
    cancellation,
    execution,
  }
  const expectedProcessGroupIdentitySha256 = processGroupIdentityHash(
    bodyWithoutProcessGroup,
  )
  if (
    expectedProcessGroupIdentitySha256 !==
    value.expectedProcessGroupIdentitySha256
  ) {
    return failure("REQUEST_BINDING_MISMATCH")
  }
  const withoutHash = {
    ...bodyWithoutProcessGroup,
    expectedProcessGroupIdentitySha256,
  }
  if (requestHash(withoutHash) !== value.supervisorRequestSha256) {
    return failure("REQUEST_BINDING_MISMATCH")
  }
  return {
    ok: true,
    value: authorizeRequest({
      ...withoutHash,
      supervisorRequestSha256:
        value.supervisorRequestSha256 as `sha256:${string}`,
    }),
  }
}

const outputHashes = (
  observed: SupervisorObservedOutputV118,
): SupervisorRawReceiptEnvelopeV118["output"] => ({
  payloadSha256: sha256(observed.payloadBytes),
  stdoutSha256: sha256(observed.stdoutBytes),
  stderrSha256: sha256(observed.stderrBytes),
})

const parseRawReceiptEnvelope = (
  value: unknown,
): SupervisorRawReceiptEnvelopeV118 | undefined => {
  if (
    !exactKeys(value, [
      "schemaVersion",
      "supervisorRequestSha256",
      "inputSha256",
      "cancellationChannelSha256",
      "output",
      "receipt",
    ]) ||
    value.schemaVersion !== RECEIPT_SCHEMA_VERSION ||
    typeof value.supervisorRequestSha256 !== "string" ||
    !SHA256.test(value.supervisorRequestSha256) ||
    typeof value.inputSha256 !== "string" ||
    !SHA256.test(value.inputSha256) ||
    typeof value.cancellationChannelSha256 !== "string" ||
    !SHA256.test(value.cancellationChannelSha256) ||
    !exactKeys(value.output, ["payloadSha256", "stdoutSha256", "stderrSha256"])
  ) {
    return undefined
  }
  for (const digest of Object.values(value.output)) {
    if (typeof digest !== "string" || !SHA256.test(digest)) return undefined
  }
  const parsedReceipt = RuntimeSupervisorRawReceiptV118Schema.safeParse(
    value.receipt,
  )
  if (!parsedReceipt.success) return undefined
  return {
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    supervisorRequestSha256:
      value.supervisorRequestSha256 as `sha256:${string}`,
    inputSha256: value.inputSha256 as `sha256:${string}`,
    cancellationChannelSha256:
      value.cancellationChannelSha256 as `sha256:${string}`,
    output: {
      payloadSha256: value.output.payloadSha256 as `sha256:${string}`,
      stdoutSha256: value.output.stdoutSha256 as `sha256:${string}`,
      stderrSha256: value.output.stderrSha256 as `sha256:${string}`,
    },
    receipt: parsedReceipt.data as unknown as RuntimeSupervisorRawReceiptV118,
  }
}

export const createSupervisorRawReceiptEnvelopeV118 = (input: {
  readonly request: SupervisorInvocationRequestV118
  readonly receipt: RuntimeSupervisorRawReceiptV118
  readonly observed: SupervisorObservedOutputV118
}): SupervisorRawReceiptEnvelopeV118 => {
  if (!requestAuthority.has(input.request)) {
    throw new TypeError("Supervisor invocation request is not verified")
  }
  const parsedReceipt = RuntimeSupervisorRawReceiptV118Schema.safeParse(
    input.receipt,
  )
  if (!parsedReceipt.success) {
    throw new TypeError("Supervisor raw receipt shape is invalid")
  }
  return deepFreeze({
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    supervisorRequestSha256: input.request.supervisorRequestSha256,
    inputSha256: input.request.input.sha256,
    cancellationChannelSha256: cancellationHash(input.request.cancellation),
    output: outputHashes(input.observed),
    receipt: parsedReceipt.data as unknown as RuntimeSupervisorRawReceiptV118,
  }) as SupervisorRawReceiptEnvelopeV118
}

export const serializeSupervisorRawReceiptEnvelopeV118 = (
  envelope: SupervisorRawReceiptEnvelopeV118,
): Uint8Array => {
  const parsed = parseRawReceiptEnvelope(envelope)
  if (parsed === undefined) {
    throw new TypeError("Supervisor raw receipt shape is invalid")
  }
  return canonicalBytes(parsed)
}

const observationsAreBytes = (
  observed: SupervisorObservedOutputV118,
): boolean =>
  observed.payloadBytes instanceof Uint8Array &&
  observed.stdoutBytes instanceof Uint8Array &&
  observed.stderrBytes instanceof Uint8Array

const verifyObservationBinding = (
  request: SupervisorInvocationRequestV118,
  envelope: SupervisorRawReceiptEnvelopeV118,
  observed: SupervisorObservedOutputV118,
): SupervisorVerificationFailureV118 | undefined => {
  if (
    envelope.supervisorRequestSha256 !== request.supervisorRequestSha256 ||
    envelope.inputSha256 !== request.input.sha256 ||
    envelope.cancellationChannelSha256 !==
      cancellationHash(request.cancellation) ||
    envelope.receipt.containment.processGroupIdentitySha256 !==
      request.expectedProcessGroupIdentitySha256
  ) {
    return failure("RECEIPT_BINDING_MISMATCH")
  }
  if (!observationsAreBytes(observed)) {
    return failure("OBSERVATION_MISMATCH")
  }
  const hashes = outputHashes(observed)
  if (
    hashes.payloadSha256 !== envelope.output.payloadSha256 ||
    hashes.stdoutSha256 !== envelope.output.stdoutSha256 ||
    hashes.stderrSha256 !== envelope.output.stderrSha256 ||
    observed.payloadBytes.byteLength !== envelope.receipt.bytes.payloadBytes ||
    observed.stdoutBytes.byteLength !== envelope.receipt.bytes.stdoutBytes ||
    observed.stderrBytes.byteLength !== envelope.receipt.bytes.stderrBytes
  ) {
    return failure("OBSERVATION_MISMATCH")
  }
  return undefined
}

export const verifySupervisorRawReceiptV118 = (input: {
  readonly request: SupervisorInvocationRequestV118
  readonly rawReceiptBytes: Uint8Array
  readonly observed: SupervisorObservedOutputV118
}): SupervisorVerificationResultV118 => {
  if (!requestAuthority.has(input.request)) {
    return failure("REQUEST_NOT_VERIFIED")
  }
  const admitted = admitCanonicalJsonBytes(input.rawReceiptBytes, {
    profile: "authenticated-envelope",
  })
  if (!admitted.ok) return failure("RAW_RECEIPT_INVALID")
  const envelope = parseRawReceiptEnvelope(admitted.value)
  if (envelope === undefined) return failure("RAW_RECEIPT_INVALID")
  const observationFailure = verifyObservationBinding(
    input.request,
    envelope,
    input.observed,
  )
  if (observationFailure !== undefined) return observationFailure

  const evaluated = evaluateRuntimeSupervisorReceiptV118(
    input.request.invocation,
    envelope.receipt,
  )
  if (evaluated.kind === "system_failure") {
    return failure(evaluated.code)
  }
  if (
    evaluated.kind === "player_violation" &&
    (envelope.receipt.lifecycle.exitCode !== 0 ||
      envelope.receipt.lifecycle.signal !== null ||
      envelope.receipt.lifecycle.cancellationRequested)
  ) {
    return failure("PROCESS_RESULT_UNRESOLVED")
  }
  const result: VerifiedSupervisorResultV118 =
    evaluated.kind === "success"
      ? {
          kind: "success",
          evidence: evaluated.evidence,
        }
      : {
          kind: "player_violation",
          code: evaluated.code,
          dimensions: [...evaluated.dimensions],
        }
  const verified = deepFreeze({
    schemaVersion: VERIFIED_SCHEMA_VERSION,
    supervisorRequestSha256: input.request.supervisorRequestSha256,
    invocationRequestSha256: input.request.invocation.requestSha256,
    rawReceiptSha256: sha256(input.rawReceiptBytes),
    observed: {
      inputSha256: input.request.input.sha256,
      payloadSha256: envelope.output.payloadSha256,
      stdoutSha256: envelope.output.stdoutSha256,
      stderrSha256: envelope.output.stderrSha256,
      inputBytes: input.request.input.byteLength,
      payloadBytes: input.observed.payloadBytes.byteLength,
      stdoutBytes: input.observed.stdoutBytes.byteLength,
      stderrBytes: input.observed.stderrBytes.byteLength,
    },
    result,
  }) as VerifiedSupervisorEvidenceV118
  verifiedAuthority.add(verified)
  return { ok: true, value: verified }
}

export const isVerifiedSupervisorEvidenceV118 = (
  value: unknown,
): value is VerifiedSupervisorEvidenceV118 =>
  typeof value === "object" &&
  value !== null &&
  verifiedAuthority.has(value as object)
