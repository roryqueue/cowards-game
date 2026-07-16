import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import type { SpawnSyncReturns } from "node:child_process"
import { createHash } from "node:crypto"
import {
  accessSync,
  constants,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  RUNTIME_INVOCATION_V1_17_CANDIDATE,
  RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS,
  SoldierBrainResultV117Schema,
  SoldierBrainResultSchema,
  STRATEGY_RUNTIME_ABI_VERSION,
  STRATEGY_WASM_ARTIFACT_BYTES,
  StrategyResultV117Schema,
  StrategyResultSchema,
  StrategyRuntimeResponseEnvelopeSchema,
  admitCanonicalJsonBytes,
  admitCanonicalJsonValue,
  classifyRuntimeInvocationV117,
  createAuthenticatedRuntimeInvocationResponseV117,
  createRuntimeInvocationExecutionReceiptV117,
  createRuntimeInvocationTraceV117,
  serializeRuntimeInvocationRequestV117,
  verifySelectedRuntimeInvocationRequestV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type AuthenticatedRuntimeInvocationResponseV117,
  type JsonValue,
  type RuntimeInvocationBoundaryEventV117,
  type RuntimeInvocationExecutionReceiptEvidenceV117,
  type RuntimeInvocationPlayerViolationCodeV117,
  type RuntimeInvocationResultV117,
  type RuntimeInvocationSigningIdentityV117,
  type RuntimeInvocationTraceV117,
  type SoldierBrainResult,
  type StrategyRuntimeMethodName,
  type StrategyRuntimeRequestEnvelope,
  type StrategyRuntimeResponseEnvelope,
  type StrategyRevision,
  type StrategyResult,
} from "@cowards/spec"
import {
  success,
  type RuntimeResult,
  type StrategyRuntime,
} from "@cowards/engine"
import {
  buildWasmWasiRequestSourceIdentityV117,
  buildWasmWasiSourceIdentityV117,
  collectWasmWasiCandidateIdentityV117,
  readWasmWasiSourceIdentityAttestationV117,
  validateWasmWasiImports,
  wasmWasiSourceIdentityFingerprintV117,
  type WasmWasiCandidateRevisionV117,
  type WasmWasiCandidateIdentityV117,
} from "./validation.js"
import { WASM_WASI_V1_17_EXECUTION_SETTINGS } from "./metadata.js"
export { WASM_WASI_V1_17_EXECUTION_SETTINGS } from "./metadata.js"

export type WasmWasiGuestAttributionV117 =
  | "none"
  | "proven_strategy_exception"
  | "proven_fuel_exhaustion"
  | "proven_memory_exhaustion"
  | "proven_output_exhaustion"
  | "ambiguous_trap"
  | "accounting_unavailable"
  | "host_crash"
  | "transport_crash"

export type WasmWasiGuestProvenanceV117 =
  | "none"
  | "host_stdout_byte_meter"
  | "structured_host_strategy_exception"
  | "structured_host_fuel_meter"
  | "structured_host_memory_meter"

export interface WasmWasiGuestObservationV117 {
  kind: "completed" | "failed"
  status: number | null
  signal: string | null
  stdout: Uint8Array
  stderr: Uint8Array
  attribution: WasmWasiGuestAttributionV117
  provenance: WasmWasiGuestProvenanceV117
}

export interface WasmWasiGuestExecutionInputV117 {
  artifactPath: string
  stdin: Uint8Array
  settings: typeof WASM_WASI_V1_17_EXECUTION_SETTINGS
  request: AuthenticatedRuntimeInvocationRequestV117
}

export interface WasmWasiGuestExecutionResultV117 {
  observation: WasmWasiGuestObservationV117
  executionReceiptEvidence?:
    | RuntimeInvocationExecutionReceiptEvidenceV117
    | undefined
}

export interface WasmWasiStrategyRequestV117 {
  revision: WasmWasiCandidateRevisionV117
  request: AuthenticatedRuntimeInvocationRequestV117
  signingIdentity: RuntimeInvocationSigningIdentityV117
  executionIdentity: WasmWasiCandidateIdentityV117
  executeGuest?:
    | ((
        input: WasmWasiGuestExecutionInputV117,
      ) => WasmWasiGuestExecutionResultV117)
    | undefined
  hostOperations?:
    | {
        validateImports?: typeof validateWasmWasiImports
        makeTempDirectory?: (prefix: string) => string
      }
    | undefined
}

export interface WasmWasiStrategyRequestInput {
  revision: StrategyRevision
  methodName: StrategyRuntimeMethodName
  input: JsonValue
  timeoutMs?: number | undefined
  stdoutBytes?: number | undefined
  stderrBytes?: number | undefined
}

export const wasmWasiSharedCaptureBufferBytesV117 = (
  stdoutBytes: number,
  stderrSafetyBytes: number,
): number => Math.max(stdoutBytes, stderrSafetyBytes) + 1

const hashBytes = (bytes: Buffer): string =>
  createHash("sha256").update(bytes).digest("hex")

const resolveCommandPath = (command: string): string | null => {
  for (const directory of (process.env.PATH ?? "").split(":")) {
    if (directory.length === 0) {
      continue
    }
    const candidate = join(directory, command)
    try {
      accessSync(candidate, constants.X_OK)
      return candidate
    } catch {
      // Continue scanning PATH entries.
    }
  }
  return null
}

const candidateTrace = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  safeCodes: readonly string[],
): RuntimeInvocationTraceV117 =>
  createRuntimeInvocationTraceV117(request, safeCodes)

const candidateOutcome = (
  event: RuntimeInvocationBoundaryEventV117,
  request: AuthenticatedRuntimeInvocationRequestV117,
  value: JsonValue = null,
  safeCodes: readonly string[] = ["WASM_WASI_HOST_OUTER_AUTHORITY"],
): RuntimeInvocationResultV117 =>
  classifyRuntimeInvocationV117(
    event,
    candidateTrace(request, safeCodes),
    value,
  )

const candidatePlayerViolation = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  code: RuntimeInvocationPlayerViolationCodeV117,
  safeCodes: readonly string[],
): RuntimeInvocationResultV117 => ({
  kind: "player_violation",
  violation: RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS[code],
  trace: candidateTrace(request, safeCodes),
})

const authenticateCandidateOutcome = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  outcome: RuntimeInvocationResultV117,
  signingIdentity: RuntimeInvocationSigningIdentityV117,
  evidence?: RuntimeInvocationExecutionReceiptEvidenceV117 | undefined,
  observation?: WasmWasiGuestObservationV117 | undefined,
): AuthenticatedRuntimeInvocationResponseV117 => {
  const unavailableEvidence = {
    attribution: "ambiguous" as const,
    counters: {
      wallMilliseconds: { status: "unavailable" as const },
      computeFuel: { status: "unavailable" as const },
      payloadBytes: { status: "unavailable" as const },
      stdoutBytes: { status: "unavailable" as const },
      stderrBytes: { status: "unavailable" as const },
    },
    memory: { status: "unavailable" as const },
    process: { status: "unavailable" as const },
    capabilities: { status: "unavailable" as const },
    cancellation: { status: "unavailable" as const },
    accountingEvidence: { status: "unavailable" as const },
  } satisfies RuntimeInvocationExecutionReceiptEvidenceV117
  const failClosed = (): AuthenticatedRuntimeInvocationResponseV117 => {
    const safeCodes = [
      ...new Set([
        ...outcome.trace.safeCodes,
        "WASM_WASI_EQUIVALENT_ACCOUNTING_UNAVAILABLE",
      ]),
    ]
    return createAuthenticatedRuntimeInvocationResponseV117(
      request,
      observation === undefined && outcome.kind === "system_failure"
        ? outcome
        : candidateOutcome(
            "strategy_exhaustion_ambiguous",
            request,
            null,
            safeCodes,
          ),
      createRuntimeInvocationExecutionReceiptV117(request, unavailableEvidence),
      signingIdentity,
    )
  }
  if (evidence === undefined || observation === undefined) return failClosed()
  try {
    const complete =
      evidence.attribution !== "ambiguous" &&
      Object.values(evidence.counters).every(
        (counter) => counter.status === "measured",
      ) &&
      evidence.memory.status === "measured" &&
      evidence.process.status === "verified" &&
      evidence.capabilities.status === "verified" &&
      evidence.cancellation.status === "verified" &&
      evidence.accountingEvidence.status === "verified"
    if (!complete) return failClosed()
    const expectedAttribution =
      observation.stderr.byteLength >
        WASM_WASI_V1_17_EXECUTION_SETTINGS.stderrBytes ||
      observation.attribution === "host_crash" ||
      observation.attribution === "transport_crash"
        ? "host"
        : observation.attribution === "ambiguous_trap" ||
            observation.attribution === "accounting_unavailable" ||
            (observation.attribution === "proven_strategy_exception" &&
              observation.provenance !==
                "structured_host_strategy_exception") ||
            (observation.attribution === "proven_fuel_exhaustion" &&
              observation.provenance !== "structured_host_fuel_meter") ||
            (observation.attribution === "proven_memory_exhaustion" &&
              observation.provenance !== "structured_host_memory_meter")
          ? "ambiguous"
          : "proven_strategy"
    const canonicalStdoutFrameBytes =
      outcome.kind === "success"
        ? observation.stdout.byteLength + 1
        : observation.stdout.byteLength
    const directlyObservedCounters = {
      payloadBytes: observation.stdout.byteLength,
      stdoutBytes: canonicalStdoutFrameBytes,
      stderrBytes: observation.stderr.byteLength,
    } as const
    const evidenceMatchesObservation =
      evidence.attribution === expectedAttribution &&
      Object.entries(directlyObservedCounters).every(([name, delta]) => {
        const counter =
          evidence.counters[name as keyof typeof directlyObservedCounters]
        return counter.status === "measured" && counter.delta === delta
      })
    if (!evidenceMatchesObservation) return failClosed()
    return createAuthenticatedRuntimeInvocationResponseV117(
      request,
      outcome,
      createRuntimeInvocationExecutionReceiptV117(request, evidence),
      signingIdentity,
    )
  } catch {
    return failClosed()
  }
}

const candidateArtifactBytesFor = (
  revision: WasmWasiCandidateRevisionV117,
  request: AuthenticatedRuntimeInvocationRequestV117,
  validateImports: typeof validateWasmWasiImports,
):
  | { ok: true; bytes: Buffer }
  | {
      ok: false
      event: RuntimeInvocationBoundaryEventV117
      safeCode: string
    } => {
  const artifact = revision.metadata.compiledArtifact
  const requestSourceIdentity = buildWasmWasiRequestSourceIdentityV117(
    revision.source,
  )
  if (
    request.sourceIdentity.strategyRevisionId !== revision.id ||
    request.sourceIdentity.originalSourceSha256 !==
      requestSourceIdentity.originalSourceSha256 ||
    request.sourceIdentity.normalizedSourceSha256 !==
      requestSourceIdentity.normalizedSourceSha256 ||
    revision.runtime.abiVersion !==
      RUNTIME_INVOCATION_V1_17_CANDIDATE.runtimeAbiVersion ||
    revision.runtime.adapter.id !== "runtime-wasm-wasi-wasmtime-preview1" ||
    revision.runtime.adapter.version !== "v1.17-candidate" ||
    request.budget.methodLimit.process.processes !==
      WASM_WASI_V1_17_EXECUTION_SETTINGS.processLimit ||
    artifact?.bytesBase64 === undefined
  ) {
    return {
      ok: false,
      event: "outer_frame_wrong_binding",
      safeCode: "WASM_WASI_STALE_SOURCE_OR_ARTIFACT_IDENTITY",
    }
  }
  const bytes = Buffer.from(artifact.bytesBase64, "base64")
  if (bytes.byteLength > STRATEGY_WASM_ARTIFACT_BYTES) {
    return {
      ok: false,
      event: "outer_frame_wrong_binding",
      safeCode: "WASM_WASI_ARTIFACT_TOO_LARGE",
    }
  }
  let embeddedSourceIdentity
  try {
    embeddedSourceIdentity = readWasmWasiSourceIdentityAttestationV117(bytes)
  } catch {
    return {
      ok: false,
      event: "outer_frame_wrong_binding",
      safeCode: "WASM_WASI_SOURCE_ATTESTATION_INVALID",
    }
  }
  const embeddedSourceIdentitySha256 = wasmWasiSourceIdentityFingerprintV117(
    embeddedSourceIdentity,
  )
  const artifactSourceIdentitySha256 = wasmWasiSourceIdentityFingerprintV117(
    artifact.sourceIdentity,
  )
  const revisionSourceIdentitySha256 = wasmWasiSourceIdentityFingerprintV117(
    buildWasmWasiSourceIdentityV117(revision.source),
  )
  if (
    request.sourceIdentity.artifactSha256 !== `sha256:${artifact.hash}` ||
    artifact.sourceHash !== artifact.sourceIdentity.normalizedSourceSha256 ||
    embeddedSourceIdentitySha256 !== artifactSourceIdentitySha256 ||
    artifactSourceIdentitySha256 !== revisionSourceIdentitySha256 ||
    bytes.byteLength !== artifact.bytes ||
    hashBytes(bytes) !== artifact.hash ||
    artifact.validationStatus !== "valid" ||
    artifact.wasiProfile !== "preview1" ||
    artifact.abiEnvelope !==
      "stdin-canonical-request-stdout-raw-canonical-payload" ||
    artifact.abiVersion !==
      RUNTIME_INVOCATION_V1_17_CANDIDATE.runtimeAbiVersion ||
    artifact.toolchain.language !== revision.runtime.language.id ||
    !(
      (revision.runtime.language.id === "rust" &&
        artifact.targetTriple === "wasm32-wasip1") ||
      (revision.runtime.language.id === "zig" &&
        artifact.targetTriple === "wasm32-wasi")
    )
  ) {
    return {
      ok: false,
      event: "outer_frame_wrong_binding",
      safeCode: "WASM_WASI_STALE_SOURCE_OR_ARTIFACT_IDENTITY",
    }
  }
  const importErrors = validateImports(bytes)
  if (importErrors.some((error) => error.code !== "FORBIDDEN_PATTERN")) {
    return {
      ok: false,
      event: "outer_frame_wrong_binding",
      safeCode: "WASM_WASI_MALFORMED_ARTIFACT_PREFLIGHT",
    }
  }
  if (importErrors.length > 0) {
    return {
      ok: false,
      event: "payload_illegal",
      safeCode: "WASM_WASI_FORBIDDEN_IMPORT",
    }
  }
  return { ok: true, bytes }
}

const guestRequestBytes = (
  request: AuthenticatedRuntimeInvocationRequestV117,
): Uint8Array => {
  const admitted = admitCanonicalJsonValue(
    {
      input: request.input.value,
      method: request.method,
      runtimeAbi: RUNTIME_INVOCATION_V1_17_CANDIDATE.runtimeAbiVersion,
    },
    { profile: "host-api-value" },
  )
  if (!admitted.ok) {
    throw new TypeError(
      "Authenticated candidate request has no canonical guest input",
    )
  }
  return admitted.canonicalBytes
}

export const classifyWasmtimeProcessObservationV117 = (
  result: SpawnSyncReturns<Buffer>,
  outputBytes: number,
  stderrBytes: number,
): WasmWasiGuestObservationV117 => {
  const stdout = result.stdout ?? Buffer.alloc(0)
  const stderr = result.stderr ?? Buffer.alloc(0)
  if (stdout.byteLength > outputBytes) {
    return {
      kind: "failed",
      status: result.status,
      signal: result.signal,
      stdout,
      stderr,
      attribution: "proven_output_exhaustion",
      provenance: "host_stdout_byte_meter",
    }
  }
  if (stderr.byteLength > stderrBytes) {
    return {
      kind: "failed",
      status: result.status,
      signal: result.signal,
      stdout,
      stderr,
      attribution: "transport_crash",
      provenance: "none",
    }
  }
  if (
    result.error?.message.includes("maxBuffer") ||
    result.error?.message.includes("ENOBUFS")
  ) {
    return {
      kind: "failed",
      status: result.status,
      signal: result.signal,
      stdout,
      stderr,
      attribution: "transport_crash",
      provenance: "none",
    }
  }
  if (result.error !== undefined) {
    return {
      kind: "failed",
      status: result.status,
      signal: result.signal,
      stdout,
      stderr,
      attribution:
        result.error.message.includes("ETIMEDOUT") ||
        result.error.name === "TimeoutError"
          ? "accounting_unavailable"
          : "host_crash",
      provenance: "none",
    }
  }
  if (result.status === 0) {
    return {
      kind: "completed",
      status: 0,
      signal: null,
      stdout,
      stderr,
      attribution: "none",
      provenance: "none",
    }
  }
  return {
    kind: "failed",
    status: result.status,
    signal: result.signal,
    stdout,
    stderr,
    attribution: "ambiguous_trap",
    provenance: "none",
  }
}

const executeCandidateGuest = (
  input: WasmWasiGuestExecutionInputV117,
): WasmWasiGuestObservationV117 => {
  const wasmtimePath = resolveCommandPath("wasmtime")
  if (wasmtimePath === null) {
    return {
      kind: "failed",
      status: null,
      signal: null,
      stdout: new Uint8Array(),
      stderr: new Uint8Array(),
      attribution: "host_crash",
      provenance: "none",
    }
  }
  const result = spawnSync(
    wasmtimePath,
    [
      "run",
      "-W",
      `fuel=${input.request.budget.methodLimit.counters.computeFuel.maximum}`,
      "-W",
      `timeout=${input.request.budget.methodLimit.counters.wallMilliseconds.maximum}ms`,
      "-W",
      `max-memory-size=${input.request.budget.methodLimit.memory.maximumBytes}`,
      "-W",
      `max-wasm-stack=${input.settings.wasmStackBytes}`,
      "-W",
      "trap-on-grow-failure=y",
      input.artifactPath,
    ],
    {
      input: Buffer.from(input.stdin),
      encoding: "buffer",
      env: {},
      shell: false,
      timeout:
        input.request.budget.methodLimit.counters.wallMilliseconds.maximum +
        250,
      maxBuffer: wasmWasiSharedCaptureBufferBytesV117(
        input.request.budget.methodLimit.counters.stdoutBytes.maximum,
        input.settings.stderrBytes,
      ),
    },
  )
  return classifyWasmtimeProcessObservationV117(
    result,
    input.request.budget.methodLimit.counters.stdoutBytes.maximum,
    input.settings.stderrBytes,
  )
}

const eventForObservation = (
  attribution: WasmWasiGuestAttributionV117,
): RuntimeInvocationBoundaryEventV117 => {
  switch (attribution) {
    case "proven_strategy_exception":
      return "strategy_exception_proven"
    case "proven_fuel_exhaustion":
    case "proven_memory_exhaustion":
      return "strategy_exhaustion_proven"
    case "proven_output_exhaustion":
      return "strategy_exhaustion_proven"
    case "host_crash":
      return "host_crash"
    case "transport_crash":
      return "transport_crash"
    case "ambiguous_trap":
      return "strategy_exception_ambiguous"
    case "accounting_unavailable":
      return "strategy_exhaustion_ambiguous"
    case "none":
      throw new TypeError("Completed observation does not have a failure event")
  }
}

const outcomeForObservation = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  observation: WasmWasiGuestObservationV117,
): RuntimeInvocationResultV117 => {
  if (
    observation.stderr.byteLength >
    WASM_WASI_V1_17_EXECUTION_SETTINGS.stderrBytes
  ) {
    return candidateOutcome("transport_crash", request, null, [
      "WASM_WASI_STDERR_CAP_EXCEEDED_UNATTRIBUTED",
    ])
  }
  if (
    observation.kind === "completed" &&
    observation.stdout.byteLength >
      request.budget.methodLimit.counters.stdoutBytes.maximum
  ) {
    return candidatePlayerViolation(request, "OVERSIZED_OUTPUT", [
      "WASM_WASI_HOST_OUTER_AUTHORITY",
      "WASM_WASI_PROVEN_OUTPUT_EXHAUSTION",
    ])
  }
  if (observation.kind === "failed") {
    if (
      observation.attribution === "proven_strategy_exception" &&
      observation.provenance !== "structured_host_strategy_exception"
    ) {
      return candidateOutcome("strategy_exception_ambiguous", request)
    }
    if (
      observation.attribution === "proven_fuel_exhaustion" &&
      observation.provenance !== "structured_host_fuel_meter"
    ) {
      return candidateOutcome("strategy_exhaustion_ambiguous", request)
    }
    if (
      observation.attribution === "proven_memory_exhaustion" &&
      observation.provenance !== "structured_host_memory_meter"
    ) {
      return candidateOutcome("strategy_exhaustion_ambiguous", request)
    }
    if (observation.attribution === "proven_output_exhaustion") {
      if (
        observation.provenance !== "host_stdout_byte_meter" ||
        observation.stdout.byteLength <=
          request.budget.methodLimit.counters.stdoutBytes.maximum
      ) {
        return candidateOutcome("transport_crash", request)
      }
      return candidatePlayerViolation(request, "OVERSIZED_OUTPUT", [
        "WASM_WASI_HOST_OUTER_AUTHORITY",
        "WASM_WASI_PROVEN_OUTPUT_EXHAUSTION",
      ])
    }
    return candidateOutcome(
      eventForObservation(observation.attribution),
      request,
    )
  }
  const admitted = admitCanonicalJsonBytes(observation.stdout, {
    profile: "strategy-payload",
  })
  if (!admitted.ok) {
    return candidateOutcome("payload_non_canonical", request)
  }
  if (
    admitted.canonicalBytes.byteLength >
    request.budget.methodLimit.counters.payloadBytes.maximum
  ) {
    return candidatePlayerViolation(request, "OVERSIZED_OUTPUT", [
      "WASM_WASI_HOST_OUTER_AUTHORITY",
      "WASM_WASI_PROVEN_PAYLOAD_EXHAUSTION",
    ])
  }
  if (
    !Buffer.from(observation.stdout).equals(
      Buffer.from(admitted.canonicalBytes),
    )
  ) {
    return candidateOutcome("payload_non_canonical", request)
  }
  const schema =
    request.method === "selectActivations"
      ? StrategyResultV117Schema
      : SoldierBrainResultV117Schema
  const parsed = schema.safeParse(admitted.value)
  if (!parsed.success) {
    return candidateOutcome("payload_schema_invalid", request)
  }
  const normalized = admitCanonicalJsonValue(parsed.data, {
    profile: "strategy-payload",
  })
  if (
    !normalized.ok ||
    !Buffer.from(normalized.canonicalBytes).equals(
      Buffer.from(admitted.canonicalBytes),
    )
  ) {
    return candidateOutcome("payload_schema_invalid", request)
  }
  return candidateOutcome("success", request, parsed.data as JsonValue, [
    "WASM_WASI_HOST_OUTER_AUTHORITY",
    "RAW_PAYLOAD_SCANNED",
    "PAYLOAD_CANONICAL",
  ])
}

export const runWasmWasiStrategyMethodV117Sync = (
  input: WasmWasiStrategyRequestV117,
): AuthenticatedRuntimeInvocationResponseV117 => {
  const requestBytes = serializeRuntimeInvocationRequestV117(input.request)
  const admittedRequest = verifySelectedRuntimeInvocationRequestV117(
    requestBytes,
    input.signingIdentity,
  )
  if (admittedRequest.kind !== "success") {
    throw new TypeError(
      "WASM/WASI candidate adapter requires an authenticated request",
    )
  }
  let artifact: ReturnType<typeof candidateArtifactBytesFor>
  try {
    artifact = candidateArtifactBytesFor(
      input.revision,
      input.request,
      input.hostOperations?.validateImports ?? validateWasmWasiImports,
    )
  } catch {
    return authenticateCandidateOutcome(
      input.request,
      candidateOutcome("adapter_crash", input.request, null, [
        "WASM_WASI_ARTIFACT_PREFLIGHT_CRASH",
      ]),
      input.signingIdentity,
    )
  }
  if (!artifact.ok) {
    const outcome =
      artifact.safeCode === "WASM_WASI_FORBIDDEN_IMPORT"
        ? candidatePlayerViolation(input.request, "FORBIDDEN_CAPABILITY", [
            artifact.safeCode,
          ])
        : candidateOutcome(artifact.event, input.request, null, [
            artifact.safeCode,
          ])
    return authenticateCandidateOutcome(
      input.request,
      outcome,
      input.signingIdentity,
    )
  }
  let observedIdentity: WasmWasiCandidateIdentityV117
  try {
    observedIdentity = collectWasmWasiCandidateIdentityV117(
      input.revision.runtime.language.id,
      input.revision.metadata.compiledArtifact,
    )
  } catch {
    return authenticateCandidateOutcome(
      input.request,
      candidateOutcome("host_crash", input.request, null, [
        "WASM_WASI_EXECUTION_IDENTITY_UNAVAILABLE",
      ]),
      input.signingIdentity,
    )
  }
  const expectedIdentity = admitCanonicalJsonValue(input.executionIdentity, {
    profile: "canonical-manifest",
  })
  const actualIdentity = admitCanonicalJsonValue(observedIdentity, {
    profile: "canonical-manifest",
  })
  if (
    !expectedIdentity.ok ||
    !actualIdentity.ok ||
    input.executionIdentity.identitySha256 !==
      observedIdentity.identitySha256 ||
    !Buffer.from(expectedIdentity.canonicalBytes).equals(
      Buffer.from(actualIdentity.canonicalBytes),
    )
  ) {
    return authenticateCandidateOutcome(
      input.request,
      candidateOutcome("outer_frame_wrong_binding", input.request, null, [
        "WASM_WASI_STALE_RUNTIME_TOOLCHAIN_OR_SETTINGS_IDENTITY",
      ]),
      input.signingIdentity,
    )
  }
  const compiledArtifact = input.revision.metadata.compiledArtifact
  const expectedCompiler =
    input.revision.runtime.language.id === "rust" ? "rustc" : "zig"
  const expectedCommandSummary =
    input.revision.runtime.language.id === "rust"
      ? "rustc --target wasm32-wasip1 -O strategy.rs -o strategy.wasm"
      : "zig build-exe strategy.zig -target wasm32-wasi -O ReleaseSmall --cache-dir <temp> --global-cache-dir <temp> -femit-bin=strategy.wasm"
  const observedCompilerVersion =
    observedIdentity.compiler.reportedVersion.split("\n", 1)[0]
  if (
    compiledArtifact.toolchain.compiler !== expectedCompiler ||
    compiledArtifact.toolchain.compilerVersion !== observedCompilerVersion ||
    compiledArtifact.toolchain.targetTriple !==
      observedIdentity.compiler.targetTriple ||
    compiledArtifact.toolchain.commandSummary !== expectedCommandSummary
  ) {
    return authenticateCandidateOutcome(
      input.request,
      candidateOutcome("outer_frame_wrong_binding", input.request, null, [
        "WASM_WASI_STALE_ARTIFACT_TOOLCHAIN_IDENTITY",
      ]),
      input.signingIdentity,
    )
  }
  let dir: string | null = null
  let outcome: RuntimeInvocationResultV117
  let executionResult: WasmWasiGuestExecutionResultV117 | undefined
  try {
    const makeTempDirectory =
      input.hostOperations?.makeTempDirectory ?? mkdtempSync
    dir = makeTempDirectory(join(tmpdir(), "cowards-wasmtime-v1-17-"))
    const artifactPath = join(dir, "strategy.wasm")
    writeFileSync(artifactPath, artifact.bytes)
    const executeGuest =
      input.executeGuest ??
      ((guestInput: WasmWasiGuestExecutionInputV117) => ({
        observation: executeCandidateGuest(guestInput),
      }))
    executionResult = executeGuest({
      artifactPath,
      stdin: guestRequestBytes(input.request),
      settings: WASM_WASI_V1_17_EXECUTION_SETTINGS,
      request: input.request,
    })
    outcome = outcomeForObservation(input.request, executionResult.observation)
  } catch {
    outcome = candidateOutcome("adapter_crash", input.request)
    executionResult = undefined
  }
  if (dir !== null) {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      outcome = candidateOutcome("adapter_crash", input.request, null, [
        "WASM_WASI_TEMP_CLEANUP_CRASH",
      ])
      executionResult = undefined
    }
  }
  return authenticateCandidateOutcome(
    input.request,
    outcome,
    input.signingIdentity,
    executionResult?.executionReceiptEvidence,
    executionResult?.observation,
  )
}

const artifactBytesFor = (
  revision: StrategyRevision,
): Buffer | StrategyRuntimeResponseEnvelope => {
  const artifact = revision.metadata.compiledArtifact
  if (!artifact?.bytesBase64) {
    return {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: "systemFailure",
      systemFailure: {
        code: "SPAWN_FAILED",
        message: "WASM/WASI artifact bytes are missing.",
        publicMessage: "Runtime system failure.",
      },
    }
  }
  const bytes = Buffer.from(artifact.bytesBase64, "base64")
  if (
    bytes.byteLength !== artifact.bytes ||
    hashBytes(bytes) !== artifact.hash
  ) {
    return {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: "systemFailure",
      systemFailure: {
        code: "MALFORMED_IPC",
        message: "WASM/WASI artifact hash or byte count mismatch.",
        publicMessage: "Runtime system failure.",
      },
    }
  }
  const expectedTargetTriple =
    revision.runtime.language.id === "zig" ? "wasm32-wasi" : "wasm32-wasip1"
  if (
    artifact.validationStatus !== "valid" ||
    artifact.wasiProfile !== "preview1" ||
    artifact.targetTriple !== expectedTargetTriple ||
    artifact.abiEnvelope !== "stdin-stdout-json" ||
    artifact.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION
  ) {
    return {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: "systemFailure",
      systemFailure: {
        code: "MALFORMED_IPC",
        message: "WASM/WASI artifact metadata is not executable.",
        publicMessage: "Runtime system failure.",
      },
    }
  }
  const importErrors = validateWasmWasiImports(bytes)
  if (importErrors.length > 0) {
    return {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: "runtimeViolation",
      violation: {
        code: "FORBIDDEN_CAPABILITY",
        message: "WASM/WASI artifact imports forbidden host capabilities.",
        publicMessage: "Strategy used a forbidden capability.",
        privateDiagnostics: {
          details: {
            issueCount: importErrors.length,
            patterns: importErrors.flatMap((error) =>
              error.pattern === undefined ? [] : [error.pattern],
            ),
          },
        },
      },
    }
  }
  return bytes
}

const runWasmWasiStrategyMethodSyncInternal = (
  request: WasmWasiStrategyRequestInput,
  allowNestedMatchTestSupport: boolean,
): StrategyRuntimeResponseEnvelope => {
  if (
    !allowNestedMatchTestSupport &&
    String(STRATEGY_RUNTIME_ABI_VERSION) !== "strategy-runtime-abi-v1.14"
  ) {
    return {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: "systemFailure",
      systemFailure: {
        code: "MALFORMED_IPC",
        message: "The legacy WASM/WASI JSON runtime is not selected.",
        publicMessage: "Runtime system failure.",
      },
    }
  }
  const artifactBytes = artifactBytesFor(request.revision)
  if (!Buffer.isBuffer(artifactBytes)) {
    return artifactBytes
  }
  const artifact = request.revision.metadata.compiledArtifact
  const wasmtimePath = resolveCommandPath("wasmtime")
  if (wasmtimePath === null) {
    return {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: "systemFailure",
      systemFailure: {
        code: "SPAWN_FAILED",
        message: "Wasmtime runtime failed to start.",
        publicMessage: "Runtime system failure.",
      },
    }
  }
  const envelope: StrategyRuntimeRequestEnvelope = {
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    methodName: request.methodName,
    runtime: request.revision.runtime,
    source: {
      hash: request.revision.sourceHash,
      bytes: request.revision.sourceBytes,
      entrypoint: request.revision.runtime.package.entrypoint,
    },
    input: request.input,
  }
  const dir = mkdtempSync(join(tmpdir(), "cowards-wasmtime-"))
  const artifactPath = join(dir, "strategy.wasm")
  try {
    writeFileSync(artifactPath, artifactBytes)
    const timeoutMs =
      request.timeoutMs ?? request.revision.runtime.limits.timeoutMs
    const result = spawnSync(
      wasmtimePath,
      [
        "run",
        "-W",
        "fuel=10000000",
        "-W",
        `timeout=${timeoutMs}ms`,
        "-W",
        "max-memory-size=67108864",
        "-W",
        "max-wasm-stack=1048576",
        "-W",
        "trap-on-grow-failure=y",
        artifactPath,
      ],
      {
        input: JSON.stringify(envelope),
        encoding: "utf8",
        env: {},
        shell: false,
        timeout: timeoutMs + 250,
        maxBuffer:
          (request.stdoutBytes ?? request.revision.runtime.limits.stdoutBytes) +
          (request.stderrBytes ?? request.revision.runtime.limits.stderrBytes),
      },
    )
    const stderr = result.stderr ?? ""
    const stdout = result.stdout ?? ""
    const stdoutCap =
      request.stdoutBytes ?? request.revision.runtime.limits.stdoutBytes
    const stderrCap =
      request.stderrBytes ?? request.revision.runtime.limits.stderrBytes
    if (
      Buffer.byteLength(stdout) > stdoutCap ||
      Buffer.byteLength(stderr) > stderrCap
    ) {
      return {
        ok: false,
        abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
        failureKind: "systemFailure",
        systemFailure: {
          code: "STDIO_CAP_EXCEEDED",
          message: "WASM/WASI runtime exceeded stdio byte cap.",
          publicMessage: "Runtime system failure.",
          privateDiagnostics: {
            details: {
              stdoutBytes: Buffer.byteLength(stdout),
              stderrBytes: Buffer.byteLength(stderr),
              stdoutCap,
              stderrCap,
            },
          },
        },
      }
    }
    if (result.error) {
      const message = result.error.message
      const isTimeout =
        message.includes("ETIMEDOUT") || result.error.name === "TimeoutError"
      const isStdioCap =
        message.includes("maxBuffer") || message.includes("ENOBUFS")
      return {
        ok: false,
        abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
        failureKind: isTimeout ? "runtimeViolation" : "systemFailure",
        ...(isTimeout
          ? {
              violation: {
                code: "TIMEOUT",
                message: "WASM/WASI Strategy exceeded its timeout.",
                publicMessage: "Strategy timed out.",
                privateDiagnostics: {
                  stderr,
                  details: { artifactHash: artifact?.hash },
                },
              },
            }
          : {
              systemFailure: {
                code: isStdioCap ? "STDIO_CAP_EXCEEDED" : "SPAWN_FAILED",
                message: isStdioCap
                  ? "WASM/WASI runtime exceeded stdio byte cap."
                  : "Wasmtime runtime failed to start.",
                publicMessage: "Runtime system failure.",
                privateDiagnostics: { stderr },
              },
            }),
      } as StrategyRuntimeResponseEnvelope
    }
    if (result.status !== 0) {
      return {
        ok: false,
        abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
        failureKind: result.signal ? "systemFailure" : "runtimeViolation",
        ...(result.signal
          ? {
              systemFailure: {
                code: "SUBPROCESS_SIGNAL",
                message: "Wasmtime stopped before producing a result.",
                publicMessage: "Runtime system failure.",
                privateDiagnostics: { stderr },
              },
            }
          : {
              violation: {
                code: "THROWN_EXCEPTION",
                message: "WASM/WASI Strategy trapped, panicked, or aborted.",
                publicMessage: "Strategy threw an exception.",
                privateDiagnostics: { stderr },
              },
            }),
      } as StrategyRuntimeResponseEnvelope
    }
    try {
      return StrategyRuntimeResponseEnvelopeSchema.parse(
        JSON.parse(stdout),
      ) as StrategyRuntimeResponseEnvelope
    } catch {
      return {
        ok: false,
        abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
        failureKind: "systemFailure",
        systemFailure: {
          code: "MALFORMED_IPC",
          message: "WASM/WASI runtime produced malformed IPC.",
          publicMessage: "Runtime system failure.",
          privateDiagnostics: { stderr },
        },
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

export const runWasmWasiStrategyMethodSync = (
  request: WasmWasiStrategyRequestInput,
): StrategyRuntimeResponseEnvelope =>
  runWasmWasiStrategyMethodSyncInternal(request, false)

/** Selected-pointer nested Match-shape test support; not historical evidence. */
export const runWasmWasiNestedMatchShapeMethodSyncTestSupport = (
  request: WasmWasiStrategyRequestInput,
): StrategyRuntimeResponseEnvelope =>
  runWasmWasiStrategyMethodSyncInternal(request, true)

const normalizeStrategyOutput = (
  envelope: StrategyRuntimeResponseEnvelope,
): RuntimeResult<StrategyResult> => {
  if (!envelope.ok) {
    if (envelope.failureKind === "systemFailure") {
      return {
        ok: false,
        violation: {
          type: "THROWN_EXCEPTION",
          message: "Runtime system failure.",
        },
        systemFailure: {
          code: envelope.systemFailure.code,
          retryable: true,
        },
      }
    }
    return {
      ok: false,
      violation: {
        type: envelope.violation.code,
        message: envelope.violation.publicMessage,
      },
    }
  }
  const parsed = StrategyResultSchema.safeParse(envelope.value)
  return parsed.success
    ? success(parsed.data as StrategyResult)
    : {
        ok: false,
        violation: {
          type: "INVALID_OUTPUT",
          message:
            "WASM/WASI Strategy returned an invalid selectActivations result.",
        },
      }
}

const normalizeSoldierBrainOutput = (
  envelope: StrategyRuntimeResponseEnvelope,
): RuntimeResult<SoldierBrainResult> => {
  if (!envelope.ok) {
    if (envelope.failureKind === "systemFailure") {
      return {
        ok: false,
        violation: {
          type: "THROWN_EXCEPTION",
          message: "Runtime system failure.",
        },
        systemFailure: {
          code: envelope.systemFailure.code,
          retryable: true,
        },
      }
    }
    return {
      ok: false,
      violation: {
        type: envelope.violation.code,
        message: envelope.violation.publicMessage,
      },
    }
  }
  const parsed = SoldierBrainResultSchema.safeParse(envelope.value)
  return parsed.success
    ? success(parsed.data)
    : {
        ok: false,
        violation: {
          type: "INVALID_OUTPUT",
          message:
            "WASM/WASI Strategy returned an invalid soldierBrain result.",
        },
      }
}

type WasmWasiSyncRunner = (
  request: WasmWasiStrategyRequestInput,
) => StrategyRuntimeResponseEnvelope

const createWasmWasiRuntimeFromRevisionWithRunner = (
  revision: StrategyRevision,
  options: {
    timeoutMs?: number | undefined
    stdoutBytes?: number | undefined
    stderrBytes?: number | undefined
  },
  runMethod: WasmWasiSyncRunner,
): StrategyRuntime => ({
  selectActivations(input) {
    return normalizeStrategyOutput(
      runMethod({
        revision,
        methodName: "selectActivations",
        input: input as unknown as JsonValue,
        timeoutMs: options.timeoutMs,
        stdoutBytes: options.stdoutBytes,
        stderrBytes: options.stderrBytes,
      }),
    )
  },
  runSoldierBrain(input) {
    return normalizeSoldierBrainOutput(
      runMethod({
        revision,
        methodName: "soldierBrain",
        input: input as unknown as JsonValue,
        timeoutMs: options.timeoutMs,
        stdoutBytes: options.stdoutBytes,
        stderrBytes: options.stderrBytes,
      }),
    )
  },
})

export const createWasmWasiRuntimeFromRevision = (
  revision: StrategyRevision,
  options: {
    timeoutMs?: number | undefined
    stdoutBytes?: number | undefined
    stderrBytes?: number | undefined
  } = {},
): StrategyRuntime =>
  createWasmWasiRuntimeFromRevisionWithRunner(
    revision,
    options,
    runWasmWasiStrategyMethodSync,
  )

/** Selected-pointer nested Match-shape test support; not historical evidence. */
export const createWasmWasiNestedMatchShapeRuntimeTestSupport = (
  revision: StrategyRevision,
  options: {
    timeoutMs?: number | undefined
    stdoutBytes?: number | undefined
    stderrBytes?: number | undefined
  } = {},
): StrategyRuntime =>
  createWasmWasiRuntimeFromRevisionWithRunner(
    revision,
    options,
    runWasmWasiNestedMatchShapeMethodSyncTestSupport,
  )
