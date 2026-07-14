import { Buffer } from "node:buffer"
import { spawn, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { clearTimeout, setTimeout } from "node:timers"
import { fileURLToPath } from "node:url"
import { TextDecoder } from "node:util"
import {
  RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS,
  SoldierBrainResultSchema,
  SoldierBrainResultV117Schema,
  STRATEGY_RUNTIME_ABI_VERSION,
  StrategyResultSchema,
  StrategyResultV117Schema,
  StrategyRuntimeResponseEnvelopeSchema,
  admitCanonicalJsonBytes,
  createAuthenticatedRuntimeInvocationResponseV117,
  serializeRuntimeInvocationResponseV117,
  verifyRuntimeInvocationRequestV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type JsonValue,
  type RuntimeInvocationResultV117,
  type RuntimeInvocationSigningIdentityV117,
  type RuntimeInvocationTraceV117,
  type RuntimeViolation,
  type SoldierBrainResult,
  type StrategyRuntimeMetadata,
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
  PYTHON_RUNTIME_ENVIRONMENT,
  PYTHON_RUNTIME_EXECUTABLE,
  pythonIsolatedHostArgs,
} from "./python-host-config.js"
import { pythonExperimentalRuntimeMetadata } from "./metadata.js"
import { buildPythonSourceIdentityV117 } from "./validation.js"

const hostPath = fileURLToPath(
  new URL("./python_runtime_host.py", import.meta.url),
)
const PYTHON_CANDIDATE_MAX_OUTPUT_BYTES = 262_144
export { PYTHON_RUNTIME_ENVIRONMENT, PYTHON_RUNTIME_EXECUTABLE }
export const pythonRuntimeHostArgs = (): readonly string[] => [
  ...pythonIsolatedHostArgs(hostPath),
]

export { pythonExperimentalRuntimeMetadata }

export type PythonCandidateHostResultV117 =
  | { readonly kind: "payload"; readonly payloadBytes: Uint8Array }
  | { readonly kind: "invalid_output" }
  | { readonly kind: "oversized_output" }
  | { readonly kind: "strategy_exception" }
  | { readonly kind: "strategy_timeout" }
  | { readonly kind: "host_crash" }
  | { readonly kind: "transport_crash" }
  | { readonly kind: "preflight_unavailable" }

export interface PythonCandidateInvocationAdapterOptionsV117 {
  readonly revision: StrategyRevision
  readonly identity: RuntimeInvocationSigningIdentityV117
  readonly hostRunner?: (
    request: AuthenticatedRuntimeInvocationRequestV117,
    normalizedSource: string,
  ) => PythonCandidateHostResultV117
}

const candidateTrace = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  requestBytes: Uint8Array,
  safeCodes: readonly string[],
): RuntimeInvocationTraceV117 => ({
  requestId: request.requestId,
  invocationId: request.invocationId,
  kernelRequestId: request.kernelRequestId,
  method: request.method,
  requestSha256: `sha256:${createHash("sha256").update(requestBytes).digest("hex")}`,
  budgetProfileSha256: request.budget.profileSha256,
  inputSha256: request.input.canonicalSha256,
  retryIdentitySha256: request.retry.identitySha256,
  safeCodes: [
    ...safeCodes,
    "COMPUTE_METER_UNAVAILABLE",
    "MEMORY_METER_UNAVAILABLE",
  ],
})

const pythonCandidateSystemFailure = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  requestBytes: Uint8Array,
  code:
    | "OUTER_FRAME_WRONG_BINDING"
    | "ADAPTER_CRASH"
    | "HOST_CRASH"
    | "TRANSPORT_CRASH"
    | "AMBIGUOUS_ATTRIBUTION",
): RuntimeInvocationResultV117 => ({
  kind: "system_failure",
  failure: {
    code,
    publicMessage: "Runtime system failure.",
    retryable:
      code !== "OUTER_FRAME_WRONG_BINDING" &&
      code !== "AMBIGUOUS_ATTRIBUTION",
  },
  trace: candidateTrace(request, requestBytes, [code]),
})

const pythonCandidatePlayerViolation = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  requestBytes: Uint8Array,
  code:
    | "INVALID_OUTPUT"
    | "OVERSIZED_OUTPUT"
    | "THROWN_EXCEPTION"
    | "TIMEOUT",
): RuntimeInvocationResultV117 => ({
  kind: "player_violation",
  violation: RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS[code],
  trace: candidateTrace(request, requestBytes, ["ADAPTER_AUTHENTICATED", code]),
})

export const admitPythonCandidateHostResponseV117 = (
  stdout: Uint8Array,
): PythonCandidateHostResultV117 => {
  const admitted = admitCanonicalJsonBytes(stdout, {
    profile: "authenticated-envelope",
  })
  if (
    !admitted.ok ||
    admitted.value === null ||
    Array.isArray(admitted.value)
  ) {
    return { kind: "transport_crash" }
  }
  const envelope = admitted.value as Record<string, JsonValue>
  const keys = Object.keys(envelope)
  if (
    keys.length === 1 &&
    keys[0] === "kind" &&
    envelope.kind === "strategy_exception"
  ) {
    return { kind: "strategy_exception" }
  }
  if (
    keys.length === 1 &&
    keys[0] === "kind" &&
    envelope.kind === "invalid_output"
  ) {
    return { kind: "invalid_output" }
  }
  if (
    keys.length === 1 &&
    keys[0] === "kind" &&
    envelope.kind === "oversized_output"
  ) {
    return { kind: "oversized_output" }
  }
  if (
    keys.length === 1 &&
    keys[0] === "kind" &&
    envelope.kind === "strategy_timeout"
  ) {
    return { kind: "strategy_timeout" }
  }
  if (
    keys.length !== 2 ||
    keys[0] !== "kind" ||
    keys[1] !== "payloadBase64" ||
    envelope.kind !== "payload" ||
    typeof envelope.payloadBase64 !== "string"
  ) {
    return { kind: "transport_crash" }
  }
  const payloadBytes = Buffer.from(envelope.payloadBase64, "base64")
  if (
    payloadBytes.byteLength === 0 ||
    payloadBytes.toString("base64") !== envelope.payloadBase64
  ) {
    return { kind: "transport_crash" }
  }
  return { kind: "payload", payloadBytes }
}

export const runPythonCandidateHostV117 = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  normalizedSource: string,
): PythonCandidateHostResultV117 => {
  const result = spawnSync(PYTHON_RUNTIME_EXECUTABLE, pythonRuntimeHostArgs(), {
    input: JSON.stringify({
      abiVersion: "strategy-runtime-abi-v1.17",
      hostProtocol: "python-runtime-host-v1.17",
      methodName: request.method,
      source: {
        text: normalizedSource,
        hash: createHash("sha256").update(normalizedSource).digest("hex"),
        bytes: Buffer.byteLength(normalizedSource),
      },
      input: request.input.value,
      budget: {
        wallMilliseconds: request.budget.wallMilliseconds,
        outputBytes: request.budget.outputBytes,
        computeFuel: request.budget.computeFuel,
        memoryBytes: request.budget.memoryBytes,
        computeEnforcement: "unavailable",
        memoryEnforcement: "unavailable",
      },
    }),
    env: PYTHON_RUNTIME_ENVIRONMENT,
    shell: false,
    // Infrastructure watchdog only. The signed wall budget begins immediately
    // before the Strategy method inside the Python host and is classified there.
    timeout: 30_000,
    maxBuffer: Math.ceil((request.budget.outputBytes * 4) / 3) + 64 * 1024,
  })
  if (result.error || result.signal || result.status !== 0) {
    return { kind: "host_crash" }
  }
  return admitPythonCandidateHostResponseV117(
    new Uint8Array(result.stdout ?? Buffer.alloc(0)),
  )
}

const candidatePythonArtifact = (
  revision: StrategyRevision,
): { ok: true; normalizedSource: string } | { ok: false } => {
  const artifact = revision.metadata.sourceArtifact
  if (
    artifact === undefined ||
    artifact.format !== "python-source-bundle" ||
    artifact.sourceHash !== revision.sourceHash ||
    artifact.sourceBytes !== revision.sourceBytes ||
    artifact.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION ||
    artifact.validationStatus !== "valid" ||
    artifact.bytesBase64 === undefined
  ) {
    return { ok: false }
  }
  const artifactBytes = Buffer.from(artifact.bytesBase64, "base64")
  if (
    artifactBytes.toString("base64") !== artifact.bytesBase64 ||
    artifactBytes.byteLength !== artifact.bytes ||
    createHash("sha256").update(artifactBytes).digest("hex") !== artifact.hash
  ) {
    return { ok: false }
  }
  let artifactSource: string
  try {
    artifactSource = new TextDecoder("utf-8", { fatal: true }).decode(
      artifactBytes,
    )
  } catch {
    return { ok: false }
  }
  if (!Buffer.from(artifactSource, "utf8").equals(artifactBytes)) {
    return { ok: false }
  }
  const identity = buildPythonSourceIdentityV117(revision.source)
  const recordedIdentity = artifact.sourceIdentity
  if (
    identity.normalizedSource !== artifactSource ||
    revision.sourceHash !==
      createHash("sha256").update(revision.source).digest("hex") ||
    revision.sourceBytes !== Buffer.byteLength(revision.source) ||
    artifact.toolchain.language !== "python" ||
    artifact.toolchain.runtime !== PYTHON_RUNTIME_EXECUTABLE ||
    artifact.toolchain.runtimeVersion !==
      pythonExperimentalRuntimeMetadata().language.version ||
    artifact.toolchain.commandSummary !==
      "python isolated validation host, no packages/imports" ||
    artifact.toolchain.validationPolicy !== "python-source-validation-v1.33" ||
    recordedIdentity === undefined ||
    recordedIdentity.identityVersion !== identity.identityVersion ||
    recordedIdentity.normalizationPolicy !== identity.normalizationPolicy ||
    recordedIdentity.originalSourceSha256 !== identity.originalSourceSha256 ||
    recordedIdentity.originalSourceBytes !==
      Buffer.byteLength(revision.source) ||
    recordedIdentity.normalizedSourceSha256 !==
      identity.normalizedSourceSha256 ||
    recordedIdentity.normalizedSourceBytes !==
      Buffer.byteLength(identity.normalizedSource) ||
    recordedIdentity.hasFinalNewline !== identity.hasFinalNewline ||
    recordedIdentity.lineEndings.kind !== identity.lineEndings.kind ||
    recordedIdentity.lineEndings.lf !== identity.lineEndings.lf ||
    recordedIdentity.lineEndings.crlf !== identity.lineEndings.crlf ||
    recordedIdentity.lineEndings.cr !== identity.lineEndings.cr
  ) {
    return { ok: false }
  }
  return { ok: true, normalizedSource: identity.normalizedSource }
}

export const createPythonCandidateInvocationAdapterV117 =
  (
    options: PythonCandidateInvocationAdapterOptionsV117,
  ): ((requestBytes: Uint8Array) => Uint8Array) =>
  (requestBytes) => {
    const admittedRequest = verifyRuntimeInvocationRequestV117(
      requestBytes,
      options.identity,
    )
    if (admittedRequest.kind !== "success") {
      return new Uint8Array()
    }
    const request = admittedRequest.value
    const artifact = candidatePythonArtifact(options.revision)
    const sourceIdentity = buildPythonSourceIdentityV117(
      options.revision.source,
    )
    const recordedArtifact = options.revision.metadata.sourceArtifact
    let outcome: RuntimeInvocationResultV117
    if (
      !artifact.ok ||
      recordedArtifact === undefined ||
      request.sourceIdentity.strategyRevisionId !== options.revision.id ||
      request.sourceIdentity.originalSourceSha256 !==
        sourceIdentity.originalSourceSha256 ||
      request.sourceIdentity.normalizedSourceSha256 !==
        sourceIdentity.normalizedSourceSha256 ||
      request.sourceIdentity.artifactSha256 !==
        `sha256:${recordedArtifact.hash}`
    ) {
      outcome = pythonCandidateSystemFailure(
        request,
        requestBytes,
        "OUTER_FRAME_WRONG_BINDING",
      )
    } else if (request.budget.outputBytes > PYTHON_CANDIDATE_MAX_OUTPUT_BYTES) {
      outcome = pythonCandidateSystemFailure(
        request,
        requestBytes,
        "OUTER_FRAME_WRONG_BINDING",
      )
    } else if (request.budget.wallMilliseconds === 0) {
      outcome = pythonCandidateSystemFailure(
        request,
        requestBytes,
        "AMBIGUOUS_ATTRIBUTION",
      )
    } else {
      try {
        const host = (options.hostRunner ?? runPythonCandidateHostV117)(
          request,
          artifact.normalizedSource,
        )
        if (host.kind === "payload") {
          if (host.payloadBytes.byteLength > request.budget.outputBytes) {
            outcome = pythonCandidatePlayerViolation(
              request,
              requestBytes,
              "OVERSIZED_OUTPUT",
            )
          } else {
            const payload = admitCanonicalJsonBytes(host.payloadBytes, {
              profile: "strategy-payload",
            })
            const schema =
              request.method === "selectActivations"
                ? StrategyResultV117Schema
                : SoldierBrainResultV117Schema
            const parsed = payload.ok ? schema.safeParse(payload.value) : null
            outcome = parsed?.success
              ? {
                  kind: "success",
                  value: parsed.data as JsonValue,
                  trace: candidateTrace(request, requestBytes, [
                    "ADAPTER_AUTHENTICATED",
                    "PAYLOAD_CANONICAL",
                  ]),
                }
              : pythonCandidatePlayerViolation(
                  request,
                  requestBytes,
                  "INVALID_OUTPUT",
                )
          }
        } else if (host.kind === "strategy_exception") {
          outcome = pythonCandidatePlayerViolation(
            request,
            requestBytes,
            "THROWN_EXCEPTION",
          )
        } else if (host.kind === "strategy_timeout") {
          outcome = pythonCandidatePlayerViolation(
            request,
            requestBytes,
            "TIMEOUT",
          )
        } else if (host.kind === "oversized_output") {
          outcome = pythonCandidatePlayerViolation(
            request,
            requestBytes,
            "OVERSIZED_OUTPUT",
          )
        } else if (host.kind === "invalid_output") {
          outcome = pythonCandidatePlayerViolation(
            request,
            requestBytes,
            "INVALID_OUTPUT",
          )
        } else {
          outcome = pythonCandidateSystemFailure(
            request,
            requestBytes,
            host.kind === "host_crash"
              ? "HOST_CRASH"
              : host.kind === "transport_crash"
                ? "TRANSPORT_CRASH"
                : "AMBIGUOUS_ATTRIBUTION",
          )
        }
      } catch {
        outcome = pythonCandidateSystemFailure(
          request,
          requestBytes,
          "ADAPTER_CRASH",
        )
      }
    }
    return serializeRuntimeInvocationResponseV117(
      createAuthenticatedRuntimeInvocationResponseV117(
        request,
        outcome,
        options.identity,
      ),
    )
  }

export interface PythonStrategyRequestInput {
  sourceText?: string | undefined
  sourceHash?: string | undefined
  methodName: StrategyRuntimeMethodName
  input: JsonValue
  timeoutMs?: number | undefined
  stdoutBytes?: number | undefined
  stderrBytes?: number | undefined
}

const sourceEnvelopeFor = (
  sourceText: string,
  sourceHash: string,
  runtime: StrategyRuntimeMetadata,
) => ({
  text: sourceText,
  hash: sourceHash,
  bytes: Buffer.byteLength(sourceText),
  entrypoint: runtime.package.entrypoint,
})

const hashStrategySource = (source: string): string =>
  createHash("sha256").update(source).digest("hex")

export const runPythonStrategyMethod = async (
  request: PythonStrategyRequestInput,
): Promise<StrategyRuntimeResponseEnvelope> => {
  const runtime = pythonExperimentalRuntimeMetadata()
  const sourceText = request.sourceText ?? ""
  const envelope: StrategyRuntimeRequestEnvelope = {
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    methodName: request.methodName,
    runtime,
    source: sourceEnvelopeFor(
      sourceText,
      request.sourceHash ?? hashStrategySource(sourceText),
      runtime,
    ),
    input: request.input,
  }

  return new Promise((resolve) => {
    let settled = false
    let stdioCapExceeded: "stdout" | "stderr" | null = null
    let timeout: ReturnType<typeof setTimeout> | null = null
    const finish = (envelope: StrategyRuntimeResponseEnvelope): void => {
      if (settled) {
        return
      }
      settled = true
      if (timeout !== null) {
        clearTimeout(timeout)
      }
      resolve(envelope)
    }
    const child = spawn(PYTHON_RUNTIME_EXECUTABLE, pythonRuntimeHostArgs(), {
      stdio: ["pipe", "pipe", "pipe"],
      env: PYTHON_RUNTIME_ENVIRONMENT,
      shell: false,
    })
    let stdout = ""
    let stderr = ""
    timeout = setTimeout(() => {
      child.kill("SIGKILL")
      finish({
        ok: false,
        abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
        failureKind: "runtimeViolation",
        violation: {
          code: "TIMEOUT",
          message: "Python Strategy exceeded its timeout.",
          publicMessage: "Strategy timed out.",
          privateDiagnostics: { stderr },
        },
      })
    }, request.timeoutMs ?? runtime.limits.timeoutMs)

    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")
    child.stdout.on("data", (chunk) => {
      stdout += chunk
      if (
        Buffer.byteLength(stdout) >
        (request.stdoutBytes ?? runtime.limits.stdoutBytes)
      ) {
        stdioCapExceeded = "stdout"
        child.kill("SIGKILL")
      }
    })
    child.stderr.on("data", (chunk) => {
      stderr += chunk
      if (
        Buffer.byteLength(stderr) >
        (request.stderrBytes ?? runtime.limits.stderrBytes)
      ) {
        stdioCapExceeded = "stderr"
        child.kill("SIGKILL")
      }
    })
    child.on("error", (error) => {
      finish({
        ok: false,
        abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
        failureKind: "systemFailure",
        systemFailure: {
          code: "SPAWN_FAILED",
          message: error.message,
          publicMessage: "Runtime system failure.",
          privateDiagnostics: { stderr },
        },
      })
    })
    child.on("close", (code, signal) => {
      if (settled) {
        return
      }
      if (stdioCapExceeded) {
        finish({
          ok: false,
          abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
          failureKind: "systemFailure",
          systemFailure: {
            code: "STDIO_CAP_EXCEEDED",
            message: `Python runtime exceeded ${stdioCapExceeded} byte cap.`,
            publicMessage: "Runtime system failure.",
            privateDiagnostics: { stderr },
          },
        })
        return
      }
      if (code !== 0) {
        finish({
          ok: false,
          abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
          failureKind: "systemFailure",
          systemFailure: {
            code: signal ? "SUBPROCESS_SIGNAL" : "SUBPROCESS_EXIT",
            message: `Python runtime exited with ${signal ?? code}.`,
            publicMessage: "Runtime system failure.",
            privateDiagnostics: { stderr },
          },
        })
        return
      }
      try {
        finish(
          StrategyRuntimeResponseEnvelopeSchema.parse(
            JSON.parse(stdout),
          ) as StrategyRuntimeResponseEnvelope,
        )
      } catch (error) {
        finish({
          ok: false,
          abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
          failureKind: "systemFailure",
          systemFailure: {
            code: "MALFORMED_IPC",
            message: error instanceof Error ? error.message : "Malformed IPC",
            publicMessage: "Runtime system failure.",
            privateDiagnostics: { stderr, details: { stdout } },
          },
        })
      }
    })
    child.stdin.end(JSON.stringify(envelope))
  })
}

export interface PythonStrategySyncRequestInput extends PythonStrategyRequestInput {
  sourceText: string
  sourceHash: string
}

export const runPythonStrategyMethodSync = (
  request: PythonStrategySyncRequestInput,
): StrategyRuntimeResponseEnvelope => {
  const runtime = pythonExperimentalRuntimeMetadata()
  const envelope: StrategyRuntimeRequestEnvelope = {
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    methodName: request.methodName,
    runtime,
    source: sourceEnvelopeFor(request.sourceText, request.sourceHash, runtime),
    input: request.input,
  }
  const result = spawnSync(PYTHON_RUNTIME_EXECUTABLE, pythonRuntimeHostArgs(), {
    input: JSON.stringify(envelope),
    encoding: "utf8",
    env: PYTHON_RUNTIME_ENVIRONMENT,
    shell: false,
    timeout: request.timeoutMs ?? runtime.limits.timeoutMs,
    maxBuffer:
      (request.stdoutBytes ?? runtime.limits.stdoutBytes) +
      (request.stderrBytes ?? runtime.limits.stderrBytes),
  })
  const stderr = result.stderr ?? ""
  if (result.error) {
    const isTimeout =
      result.error.message.includes("ETIMEDOUT") ||
      result.error.name === "TimeoutError"
    const isStdioCap =
      result.error.message.includes("maxBuffer") ||
      result.error.message.includes("ENOBUFS")
    return {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: isTimeout ? "runtimeViolation" : "systemFailure",
      ...(isTimeout
        ? {
            violation: {
              code: "TIMEOUT",
              message: "Python Strategy exceeded its timeout.",
              publicMessage: "Strategy timed out.",
              privateDiagnostics: { stderr },
            },
          }
        : isStdioCap
          ? {
              systemFailure: {
                code: "STDIO_CAP_EXCEEDED",
                message: "Python runtime exceeded stdio byte cap.",
                publicMessage: "Runtime system failure.",
                privateDiagnostics: { stderr },
              },
            }
          : {
              systemFailure: {
                code: "SPAWN_FAILED",
                message: "Python runtime failed to start.",
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
              message: "Python runtime stopped before producing a result.",
              publicMessage: "Runtime system failure.",
              privateDiagnostics: { stderr },
            },
          }
        : {
            violation: {
              code: "THROWN_EXCEPTION",
              message: "Python Strategy failed during execution.",
              publicMessage: "Strategy threw an exception.",
              privateDiagnostics: { stderr },
            },
          }),
    } as StrategyRuntimeResponseEnvelope
  }
  try {
    return StrategyRuntimeResponseEnvelopeSchema.parse(
      JSON.parse(result.stdout ?? ""),
    ) as StrategyRuntimeResponseEnvelope
  } catch {
    return {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: "systemFailure",
      systemFailure: {
        code: "MALFORMED_IPC",
        message: "Python runtime produced malformed IPC.",
        publicMessage: "Runtime system failure.",
        privateDiagnostics: { stderr },
      },
    }
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
            "Python Strategy returned an invalid select_activations result.",
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
          message: "Python Strategy returned an invalid soldier_brain result.",
        },
      }
}

const pythonArtifactSource = (
  revision: StrategyRevision,
):
  | { ok: true; sourceText: string }
  | { ok: false; violation: RuntimeViolation } => {
  const artifact = revision.metadata.sourceArtifact
  if (
    artifact === undefined ||
    artifact.format !== "python-source-bundle" ||
    artifact.validationStatus !== "valid" ||
    artifact.sourceHash !== revision.sourceHash ||
    artifact.sourceBytes !== revision.sourceBytes ||
    artifact.abiVersion !== revision.runtime.abiVersion ||
    artifact.toolchain.language !== "python" ||
    artifact.bytesBase64 === undefined
  ) {
    return {
      ok: false,
      violation: {
        type: "INVALID_OUTPUT",
        message: "Python Strategy Revision failed artifact validation.",
      },
    }
  }
  const bytes = Buffer.from(artifact.bytesBase64, "base64")
  const hash = createHash("sha256").update(bytes).digest("hex")
  if (bytes.byteLength !== artifact.bytes || hash !== artifact.hash) {
    return {
      ok: false,
      violation: {
        type: "INVALID_OUTPUT",
        message: "Python Strategy Revision failed artifact validation.",
      },
    }
  }
  return { ok: true, sourceText: bytes.toString("utf8") }
}

export const createPythonRuntimeFromRevision = (
  revision: StrategyRevision,
  options: {
    timeoutMs?: number | undefined
    stdoutBytes?: number | undefined
    stderrBytes?: number | undefined
  } = {},
): StrategyRuntime => ({
  selectActivations(input) {
    const artifact = pythonArtifactSource(revision)
    if (!artifact.ok) {
      return artifact
    }
    return normalizeStrategyOutput(
      runPythonStrategyMethodSync({
        sourceText: artifact.sourceText,
        sourceHash: revision.sourceHash,
        methodName: "selectActivations",
        input: input as unknown as JsonValue,
        timeoutMs: options.timeoutMs,
        stdoutBytes: options.stdoutBytes,
        stderrBytes: options.stderrBytes,
      }),
    )
  },
  runSoldierBrain(input) {
    const artifact = pythonArtifactSource(revision)
    if (!artifact.ok) {
      return artifact
    }
    return normalizeSoldierBrainOutput(
      runPythonStrategyMethodSync({
        sourceText: artifact.sourceText,
        sourceHash: revision.sourceHash,
        methodName: "soldierBrain",
        input: input as unknown as JsonValue,
        timeoutMs: options.timeoutMs,
        stdoutBytes: options.stdoutBytes,
        stderrBytes: options.stderrBytes,
      }),
    )
  },
})
