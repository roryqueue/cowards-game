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
  StrategyResultV117Schema,
  StrategyResultSchema,
  StrategyRuntimeResponseEnvelopeSchema,
  admitCanonicalJsonBytes,
  admitCanonicalJsonValue,
  classifyRuntimeInvocationV117,
  createAuthenticatedRuntimeInvocationResponseV117,
  serializeRuntimeInvocationRequestV117,
  verifyRuntimeInvocationRequestV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type AuthenticatedRuntimeInvocationResponseV117,
  type JsonValue,
  type RuntimeInvocationBoundaryEventV117,
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
import { validateWasmWasiImports } from "./validation.js"

export const WASM_WASI_V1_17_EXECUTION_SETTINGS = Object.freeze({
  runtime: "wasmtime-cli",
  runtimeInterface: "wasi-preview1-command",
  environment: "empty",
  preopenedDirectories: Object.freeze([] as string[]),
  network: "unavailable",
  arguments: "none",
  fuel: "request-budget-computeFuel",
  wallTimeout: "request-budget-wallMilliseconds",
  linearMemory: "request-budget-memoryBytes",
  wasmStackBytes: 1_048_576,
  trapOnGrowFailure: true,
  stdout: "raw-canonical-strategy-payload",
  stderrBytes: 65_536,
  processLimit: 1,
  unsupportedMeters: Object.freeze([
    "portable-cross-runtime-compute-equivalence",
    "guest-process-tree-accounting",
    "per-invocation-peak-linear-memory-observation",
    "signed-match-cumulative-meter-readback",
  ]),
  certification: "uncertified",
} as const)

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

export interface WasmWasiGuestObservationV117 {
  kind: "completed" | "failed"
  status: number | null
  signal: string | null
  stdout: Uint8Array
  stderr: Uint8Array
  attribution: WasmWasiGuestAttributionV117
}

export interface WasmWasiGuestExecutionInputV117 {
  artifactPath: string
  stdin: Uint8Array
  settings: typeof WASM_WASI_V1_17_EXECUTION_SETTINGS
  request: AuthenticatedRuntimeInvocationRequestV117
}

export interface WasmWasiStrategyRequestV117 {
  revision: StrategyRevision
  request: AuthenticatedRuntimeInvocationRequestV117
  signingIdentity: RuntimeInvocationSigningIdentityV117
  executeGuest?:
    | ((input: WasmWasiGuestExecutionInputV117) => WasmWasiGuestObservationV117)
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
): RuntimeInvocationTraceV117 => ({
  requestId: request.requestId,
  invocationId: request.invocationId,
  kernelRequestId: request.kernelRequestId,
  method: request.method,
  requestSha256: `sha256:${createHash("sha256")
    .update(serializeRuntimeInvocationRequestV117(request))
    .digest("hex")}`,
  budgetProfileSha256: request.budget.profileSha256,
  inputSha256: request.input.canonicalSha256,
  retryIdentitySha256: request.retry.identitySha256,
  safeCodes,
})

const candidateOutcome = (
  event: RuntimeInvocationBoundaryEventV117,
  request: AuthenticatedRuntimeInvocationRequestV117,
  value: JsonValue = null,
  safeCodes: readonly string[] = ["WASM_WASI_HOST_OUTER_AUTHORITY"],
): RuntimeInvocationResultV117 =>
  classifyRuntimeInvocationV117(event, candidateTrace(request, safeCodes), value)

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
): AuthenticatedRuntimeInvocationResponseV117 =>
  createAuthenticatedRuntimeInvocationResponseV117(
    request,
    outcome,
    signingIdentity,
  )

const candidateArtifactBytesFor = (
  revision: StrategyRevision,
  request: AuthenticatedRuntimeInvocationRequestV117,
):
  | { ok: true; bytes: Buffer }
  | {
      ok: false
      event: RuntimeInvocationBoundaryEventV117
      safeCode: string
    } => {
  const artifact = revision.metadata.compiledArtifact
  if (
    request.sourceIdentity.strategyRevisionId !== revision.id ||
    request.sourceIdentity.originalSourceSha256 !==
      `sha256:${revision.sourceHash}` ||
    request.sourceIdentity.normalizedSourceSha256 !==
      `sha256:${revision.sourceHash}` ||
    request.budget.processLimit !==
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
  if (
    request.sourceIdentity.artifactSha256 !== `sha256:${artifact.hash}` ||
    bytes.byteLength !== artifact.bytes ||
    hashBytes(bytes) !== artifact.hash ||
    artifact.validationStatus !== "valid" ||
    artifact.wasiProfile !== "preview1" ||
    artifact.abiEnvelope !== "stdin-stdout-json" ||
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
  if (validateWasmWasiImports(bytes).length > 0) {
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
    throw new TypeError("Authenticated candidate request has no canonical guest input")
  }
  return admitted.canonicalBytes
}

const wasmtimeObservation = (
  result: SpawnSyncReturns<Buffer>,
  outputBytes: number,
): WasmWasiGuestObservationV117 => {
  const stdout = result.stdout ?? Buffer.alloc(0)
  const stderr = result.stderr ?? Buffer.alloc(0)
  const stderrText = stderr.toString("utf8").toLowerCase()
  if (
    stdout.byteLength > outputBytes ||
    result.error?.message.includes("maxBuffer") ||
    result.error?.message.includes("ENOBUFS")
  ) {
    return {
      kind: "failed",
      status: result.status,
      signal: result.signal,
      stdout,
      stderr,
      attribution:
        stdout.byteLength >= outputBytes
          ? "proven_output_exhaustion"
          : "transport_crash",
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
    }
  }
  const attribution: WasmWasiGuestAttributionV117 =
    stderrText.includes("all fuel consumed") ||
    stderrText.includes("fuel has been consumed")
      ? "proven_fuel_exhaustion"
      : stderrText.includes("memory out of bounds") ||
          stderrText.includes("failed to grow memory")
        ? "proven_memory_exhaustion"
      : result.signal !== null
          ? "ambiguous_trap"
          : stderrText.includes("wasm 'unreachable' instruction executed") ||
              stderrText.includes("integer divide by zero") ||
              stderrText.includes("integer overflow") ||
              stderrText.includes("out of bounds memory access") ||
              stderrText.includes("call stack exhausted") ||
              stderrText.includes("panicked at")
            ? "proven_strategy_exception"
            : "ambiguous_trap"
  return {
    kind: "failed",
    status: result.status,
    signal: result.signal,
    stdout,
    stderr,
    attribution,
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
    }
  }
  const result = spawnSync(
    wasmtimePath,
    [
      "run",
      "-W",
      `fuel=${input.request.budget.computeFuel}`,
      "-W",
      `timeout=${input.request.budget.wallMilliseconds}ms`,
      "-W",
      `max-memory-size=${input.request.budget.memoryBytes}`,
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
      timeout: input.request.budget.wallMilliseconds + 250,
      maxBuffer:
        input.request.budget.outputBytes + input.settings.stderrBytes,
    },
  )
  return wasmtimeObservation(result, input.request.budget.outputBytes)
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
      return "payload_illegal"
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
  if (observation.kind === "failed") {
    if (observation.attribution === "proven_output_exhaustion") {
      return candidatePlayerViolation(
        request,
        "OVERSIZED_OUTPUT",
        [
          "WASM_WASI_HOST_OUTER_AUTHORITY",
          "WASM_WASI_PROVEN_OUTPUT_EXHAUSTION",
        ],
      )
    }
    return candidateOutcome(eventForObservation(observation.attribution), request)
  }
  const admitted = admitCanonicalJsonBytes(observation.stdout, {
    profile: "strategy-payload",
  })
  if (!admitted.ok) {
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
  return candidateOutcome(
    "success",
    request,
    parsed.data as JsonValue,
    [
      "WASM_WASI_HOST_OUTER_AUTHORITY",
      "RAW_PAYLOAD_SCANNED",
      "PAYLOAD_CANONICAL",
    ],
  )
}

export const runWasmWasiStrategyMethodV117Sync = (
  input: WasmWasiStrategyRequestV117,
): AuthenticatedRuntimeInvocationResponseV117 => {
  const requestBytes = serializeRuntimeInvocationRequestV117(input.request)
  const admittedRequest = verifyRuntimeInvocationRequestV117(
    requestBytes,
    input.signingIdentity,
  )
  if (admittedRequest.kind !== "success") {
    throw new TypeError("WASM/WASI candidate adapter requires an authenticated request")
  }
  const artifact = candidateArtifactBytesFor(input.revision, input.request)
  if (!artifact.ok) {
    const outcome =
      artifact.safeCode === "WASM_WASI_FORBIDDEN_IMPORT"
        ? candidatePlayerViolation(
            input.request,
            "FORBIDDEN_CAPABILITY",
            [artifact.safeCode],
          )
        : candidateOutcome(artifact.event, input.request, null, [artifact.safeCode])
    return authenticateCandidateOutcome(
      input.request,
      outcome,
      input.signingIdentity,
    )
  }
  const dir = mkdtempSync(join(tmpdir(), "cowards-wasmtime-v1-17-"))
  const artifactPath = join(dir, "strategy.wasm")
  try {
    writeFileSync(artifactPath, artifact.bytes)
    const executeGuest = input.executeGuest ?? executeCandidateGuest
    const observation = executeGuest({
      artifactPath,
      stdin: guestRequestBytes(input.request),
      settings: WASM_WASI_V1_17_EXECUTION_SETTINGS,
      request: input.request,
    })
    const outcome = outcomeForObservation(input.request, observation)
    return authenticateCandidateOutcome(
      input.request,
      outcome,
      input.signingIdentity,
    )
  } catch {
    return authenticateCandidateOutcome(
      input.request,
      candidateOutcome("adapter_crash", input.request),
      input.signingIdentity,
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
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

export const runWasmWasiStrategyMethodSync = (
  request: WasmWasiStrategyRequestInput,
): StrategyRuntimeResponseEnvelope => {
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

export const createWasmWasiRuntimeFromRevision = (
  revision: StrategyRevision,
  options: {
    timeoutMs?: number | undefined
    stdoutBytes?: number | undefined
    stderrBytes?: number | undefined
  } = {},
): StrategyRuntime => ({
  selectActivations(input) {
    return normalizeStrategyOutput(
      runWasmWasiStrategyMethodSync({
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
      runWasmWasiStrategyMethodSync({
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
