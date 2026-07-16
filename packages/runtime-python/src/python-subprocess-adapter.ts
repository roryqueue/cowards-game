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
  STRATEGY_RUNTIME_ABI_VERSION_V1_17,
  StrategyResultSchema,
  StrategyResultV117Schema,
  StrategyRuntimeResponseEnvelopeSchema,
  admitCanonicalJsonBytes,
  createAuthenticatedRuntimeInvocationResponseV117,
  createRuntimeInvocationExecutionReceiptV117,
  createRuntimeInvocationTraceV117,
  serializeRuntimeInvocationResponseV117,
  verifyRuntimeInvocationRequestV117,
  verifySelectedRuntimeInvocationRequestV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type JsonValue,
  type RuntimeInvocationExecutionReceiptEvidenceV117,
  type RuntimeInvocationResultV117,
  type RuntimeInvocationSigningIdentityV117,
  type RuntimeViolation,
  type SoldierBrainResult,
  type StrategyRuntimeMetadata,
  type StrategyRuntimeMethodName,
  type StrategyRuntimeRequestEnvelope,
  type StrategyRuntimeResponseEnvelope,
  type StrategyRevision,
  type StrategyRevisionV117,
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
import {
  buildPythonRequestSourceIdentityV117,
  buildPythonSourceIdentityV117,
} from "./validation.js"

const hostPath = fileURLToPath(
  new URL("./python_runtime_host.py", import.meta.url),
)
export { PYTHON_RUNTIME_ENVIRONMENT, PYTHON_RUNTIME_EXECUTABLE }
export const pythonRuntimeHostArgs = (): readonly string[] => [
  ...pythonIsolatedHostArgs(hostPath),
]

export { pythonExperimentalRuntimeMetadata }

const PYTHON_CANDIDATE_PREFLIGHT_WATCHDOG_MS = 1_000
const PYTHON_CANDIDATE_HOST_SHUTDOWN_MARGIN_MS = 2_000
const LEGACY_PYTHON_RUNTIME_ABI_VERSION = "strategy-runtime-abi-v1.14"

const legacyPythonRuntimeIsSelected = (): boolean =>
  String(STRATEGY_RUNTIME_ABI_VERSION) === LEGACY_PYTHON_RUNTIME_ABI_VERSION

const legacyPythonRuntimeUnavailable = (): StrategyRuntimeResponseEnvelope => ({
  ok: false,
  abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
  failureKind: "systemFailure",
  systemFailure: {
    code: "MALFORMED_IPC",
    message: "The legacy Python JSON runtime is not the selected ABI lane.",
    publicMessage: "Runtime system failure.",
  },
})

type PythonCandidateObservedByteDimensionsV117 = Readonly<{
  stdoutBytes: number
  stderrBytes: number
}>

type PythonCandidateRawObservationV117 =
  | (PythonCandidateObservedByteDimensionsV117 & {
      readonly kind: "payload"
      readonly payloadBytes: Uint8Array
    })
  | (PythonCandidateObservedByteDimensionsV117 & {
      readonly kind: "oversized_output"
      readonly payloadBytes?: Uint8Array | undefined
    })
  | (PythonCandidateObservedByteDimensionsV117 & {
      readonly kind:
        | "invalid_output"
        | "strategy_exception"
        | "strategy_timeout"
        | "host_crash"
        | "transport_crash"
        | "preflight_unavailable"
        | "pre_method_host_failure"
    })

export type PythonCandidateHostResultV117 = Readonly<{
  observation: PythonCandidateRawObservationV117
  receiptEvidence?: RuntimeInvocationExecutionReceiptEvidenceV117 | undefined
}>

export interface PythonCandidateInvocationAdapterOptionsV117 {
  readonly revision: StrategyRevision | StrategyRevisionV117
  readonly identity: RuntimeInvocationSigningIdentityV117
}

export interface PythonCandidateInvocationAdapterFixtureOptionsV117 extends PythonCandidateInvocationAdapterOptionsV117 {
  readonly fixtureOnlyObservedExecution: () => PythonCandidateHostResultV117
}

const candidateTrace = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  safeCodes: readonly string[],
) => createRuntimeInvocationTraceV117(request, safeCodes)

const pythonCandidateSystemFailure = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  code:
    | "OUTER_FRAME_WRONG_BINDING"
    | "ADAPTER_CRASH"
    | "HOST_CRASH"
    | "TRANSPORT_CRASH"
    | "TIMEOUT"
    | "AMBIGUOUS_ATTRIBUTION",
  safeCodes: readonly string[] = [],
): RuntimeInvocationResultV117 => ({
  kind: "system_failure",
  failure: {
    code,
    publicMessage: "Runtime system failure.",
    retryable:
      code !== "OUTER_FRAME_WRONG_BINDING" &&
      code !== "TIMEOUT" &&
      code !== "AMBIGUOUS_ATTRIBUTION",
  },
  trace: candidateTrace(request, [...safeCodes, code]),
})

const pythonCandidatePlayerViolation = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  code:
    | "INVALID_OUTPUT"
    | "RESOURCE_EXHAUSTION"
    | "THROWN_EXCEPTION"
    | "OVERSIZED_OUTPUT",
): RuntimeInvocationResultV117 => ({
  kind: "player_violation",
  violation: RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS[code],
  trace: candidateTrace(request, ["ADAPTER_AUTHENTICATED", code]),
})

const unavailableExecutionEvidence =
  (): RuntimeInvocationExecutionReceiptEvidenceV117 => ({
    attribution: "ambiguous",
    counters: {
      wallMilliseconds: { status: "unavailable" },
      computeFuel: { status: "unavailable" },
      payloadBytes: { status: "unavailable" },
      stdoutBytes: { status: "unavailable" },
      stderrBytes: { status: "unavailable" },
    },
    memory: { status: "unavailable" },
    process: { status: "unavailable" },
    capabilities: { status: "unavailable" },
    cancellation: { status: "unavailable" },
    accountingEvidence: { status: "unavailable" },
  })

const rawObservationSafeCode = (
  observation: PythonCandidateRawObservationV117,
): string => {
  switch (observation.kind) {
    case "payload":
      return "RAW_PAYLOAD_OBSERVED"
    case "invalid_output":
      return "RAW_INVALID_OUTPUT_OBSERVED"
    case "oversized_output":
      return "RAW_OVERSIZED_OUTPUT_OBSERVED"
    case "strategy_exception":
      return "RAW_STRATEGY_EXCEPTION_OBSERVED"
    case "strategy_timeout":
      return "RAW_STRATEGY_TIMEOUT_OBSERVED"
    case "host_crash":
      return "RAW_HOST_CRASH_OBSERVED"
    case "transport_crash":
      return "RAW_TRANSPORT_CRASH_OBSERVED"
    case "preflight_unavailable":
      return "RAW_PREFLIGHT_UNAVAILABLE_OBSERVED"
    case "pre_method_host_failure":
      return "RAW_PRE_METHOD_HOST_FAILURE_OBSERVED"
  }
}

const rawOutcome = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  observation: PythonCandidateRawObservationV117,
): RuntimeInvocationResultV117 => {
  if (observation.kind === "payload") {
    if (
      observation.payloadBytes.byteLength >
      request.budget.methodLimit.counters.payloadBytes.maximum
    ) {
      return pythonCandidatePlayerViolation(request, "OVERSIZED_OUTPUT")
    }
    const payload = admitCanonicalJsonBytes(observation.payloadBytes, {
      profile: "strategy-payload",
    })
    const schema =
      request.method === "selectActivations"
        ? StrategyResultV117Schema
        : SoldierBrainResultV117Schema
    const parsed = payload.ok ? schema.safeParse(payload.value) : null
    return parsed?.success
      ? {
          kind: "success",
          value: parsed.data as JsonValue,
          trace: candidateTrace(request, [
            "ADAPTER_AUTHENTICATED",
            "PAYLOAD_CANONICAL",
          ]),
        }
      : pythonCandidatePlayerViolation(request, "INVALID_OUTPUT")
  }
  if (observation.kind === "strategy_exception") {
    return pythonCandidatePlayerViolation(request, "THROWN_EXCEPTION")
  }
  if (observation.kind === "strategy_timeout") {
    return pythonCandidateSystemFailure(request, "TIMEOUT", [
      "RAW_STRATEGY_TIMEOUT_OBSERVED",
    ])
  }
  if (observation.kind === "oversized_output") {
    return pythonCandidatePlayerViolation(request, "OVERSIZED_OUTPUT")
  }
  if (observation.kind === "invalid_output") {
    return pythonCandidatePlayerViolation(request, "INVALID_OUTPUT")
  }
  return pythonCandidateSystemFailure(
    request,
    observation.kind === "host_crash" ||
      observation.kind === "pre_method_host_failure"
      ? "HOST_CRASH"
      : observation.kind === "transport_crash"
        ? "TRANSPORT_CRASH"
        : "AMBIGUOUS_ATTRIBUTION",
    [rawObservationSafeCode(observation)],
  )
}

const failClosedResponse = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  code: "OUTER_FRAME_WRONG_BINDING" | "AMBIGUOUS_ATTRIBUTION",
  identity: RuntimeInvocationSigningIdentityV117,
  safeCodes: readonly string[] = [],
) => {
  const outcome = pythonCandidateSystemFailure(request, code, [
    ...safeCodes,
    "COMPUTE_METER_UNAVAILABLE",
    "MEMORY_METER_UNAVAILABLE",
  ])
  const receipt = createRuntimeInvocationExecutionReceiptV117(
    request,
    unavailableExecutionEvidence(),
  )
  return createAuthenticatedRuntimeInvocationResponseV117(
    request,
    outcome,
    receipt,
    identity,
  )
}

const responseForObservation = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  execution: PythonCandidateHostResultV117,
  identity: RuntimeInvocationSigningIdentityV117,
) => {
  const { observation } = execution
  const safeCode = rawObservationSafeCode(observation)
  if (execution.receiptEvidence !== undefined) {
    try {
      const evidence = execution.receiptEvidence
      const expectedPayloadBytes =
        observation.kind === "payload" ||
        observation.kind === "oversized_output"
          ? (observation.payloadBytes?.byteLength ?? 0)
          : 0
      const observedCountersMatch =
        evidence.counters.payloadBytes.status === "measured" &&
        evidence.counters.payloadBytes.delta === expectedPayloadBytes &&
        evidence.counters.stdoutBytes.status === "measured" &&
        evidence.counters.stdoutBytes.delta === observation.stdoutBytes &&
        evidence.counters.stderrBytes.status === "measured" &&
        evidence.counters.stderrBytes.delta === observation.stderrBytes
      const completeEvidence =
        evidence.attribution !== "ambiguous" &&
        Object.values(evidence.counters).every(
          (counter) => counter.status === "measured",
        ) &&
        evidence.memory.status === "measured" &&
        evidence.process.status === "verified" &&
        evidence.capabilities.status === "verified" &&
        evidence.cancellation.status === "verified" &&
        evidence.accountingEvidence.status === "verified"
      const strategyObservation =
        observation.kind === "payload" ||
        observation.kind === "invalid_output" ||
        observation.kind === "oversized_output" ||
        observation.kind === "strategy_exception" ||
        observation.kind === "strategy_timeout"
      if (
        !observedCountersMatch ||
        !completeEvidence ||
        (strategyObservation
          ? evidence.attribution !== "proven_strategy"
          : evidence.attribution !== "host")
      ) {
        throw new TypeError(
          "Observed execution does not match receipt evidence",
        )
      }
      const outcome = rawOutcome(request, observation)
      const receipt = createRuntimeInvocationExecutionReceiptV117(
        request,
        evidence,
      )
      return createAuthenticatedRuntimeInvocationResponseV117(
        request,
        outcome,
        receipt,
        identity,
      )
    } catch {
      return failClosedResponse(request, "AMBIGUOUS_ATTRIBUTION", identity, [
        safeCode,
        "ACCOUNTING_EVIDENCE_REJECTED",
      ])
    }
  }
  return failClosedResponse(request, "AMBIGUOUS_ATTRIBUTION", identity, [
    safeCode,
  ])
}

export const admitPythonCandidateHostResponseV117 = (
  stdout: Uint8Array,
  stderr: Uint8Array = new Uint8Array(),
): PythonCandidateRawObservationV117 => {
  const observedBytes = {
    stdoutBytes: stdout.byteLength,
    stderrBytes: stderr.byteLength,
  } as const
  const admitted = admitCanonicalJsonBytes(stdout, {
    profile: "authenticated-envelope",
  })
  if (
    !admitted.ok ||
    admitted.value === null ||
    Array.isArray(admitted.value)
  ) {
    return { kind: "transport_crash", ...observedBytes }
  }
  const envelope = admitted.value as Record<string, JsonValue>
  const keys = Object.keys(envelope)
  if (
    keys.length === 1 &&
    keys[0] === "kind" &&
    envelope.kind === "strategy_exception"
  ) {
    return { kind: "strategy_exception", ...observedBytes }
  }
  if (
    keys.length === 1 &&
    keys[0] === "kind" &&
    envelope.kind === "invalid_output"
  ) {
    return { kind: "invalid_output", ...observedBytes }
  }
  if (
    keys.length === 1 &&
    keys[0] === "kind" &&
    envelope.kind === "oversized_output"
  ) {
    return { kind: "oversized_output", ...observedBytes }
  }
  if (
    keys.length === 1 &&
    keys[0] === "kind" &&
    envelope.kind === "strategy_timeout"
  ) {
    return { kind: "strategy_timeout", ...observedBytes }
  }
  if (
    keys.length === 1 &&
    keys[0] === "kind" &&
    envelope.kind === "host_failure"
  ) {
    return { kind: "host_crash", ...observedBytes }
  }
  if (
    keys.length === 1 &&
    keys[0] === "kind" &&
    envelope.kind === "pre_method_host_failure"
  ) {
    return { kind: "pre_method_host_failure", ...observedBytes }
  }
  if (
    keys.length !== 2 ||
    keys[0] !== "kind" ||
    keys[1] !== "payloadBase64" ||
    envelope.kind !== "payload" ||
    typeof envelope.payloadBase64 !== "string"
  ) {
    return { kind: "transport_crash", ...observedBytes }
  }
  const payloadBytes = Buffer.from(envelope.payloadBase64, "base64")
  if (
    payloadBytes.byteLength === 0 ||
    payloadBytes.toString("base64") !== envelope.payloadBase64
  ) {
    return { kind: "transport_crash", ...observedBytes }
  }
  return { kind: "payload", payloadBytes, ...observedBytes }
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
        methodLimit: request.budget.methodLimit,
        meterStatus: {
          computeFuel: "unavailable",
          memoryBytes: "unavailable",
        },
      },
    }),
    env: PYTHON_RUNTIME_ENVIRONMENT,
    shell: false,
    // Infrastructure/preflight watchdog only. The signed wall begins after
    // module startup and function lookup inside the Python host.
    timeout:
      PYTHON_CANDIDATE_PREFLIGHT_WATCHDOG_MS +
      request.budget.methodLimit.counters.wallMilliseconds.maximum +
      PYTHON_CANDIDATE_HOST_SHUTDOWN_MARGIN_MS,
    maxBuffer:
      Math.ceil(
        (request.budget.methodLimit.counters.payloadBytes.maximum * 4) / 3,
      ) +
      64 * 1024,
  })
  const stdout = new Uint8Array(result.stdout ?? Buffer.alloc(0))
  const stderr = new Uint8Array(result.stderr ?? Buffer.alloc(0))
  const observedBytes = {
    stdoutBytes: stdout.byteLength,
    stderrBytes: stderr.byteLength,
  } as const
  if (result.error || result.signal || result.status !== 0) {
    return { observation: { kind: "host_crash", ...observedBytes } }
  }
  let observation = admitPythonCandidateHostResponseV117(stdout, stderr)
  if (
    stderr.byteLength > request.budget.methodLimit.counters.stderrBytes.maximum
  ) {
    observation = { kind: "host_crash", ...observedBytes }
  } else if (
    stdout.byteLength > request.budget.methodLimit.counters.stdoutBytes.maximum
  ) {
    observation =
      observation.kind === "payload"
        ? {
            kind: "oversized_output",
            payloadBytes: observation.payloadBytes,
            ...observedBytes,
          }
        : { kind: "transport_crash", ...observedBytes }
  }
  return { observation }
}

const candidatePythonArtifact = (
  revision: StrategyRevision | StrategyRevisionV117,
): { ok: true; normalizedSource: string } | { ok: false } => {
  const artifact = revision.metadata.sourceArtifact
  if (
    artifact === undefined ||
    artifact.format !== "python-source-bundle" ||
    artifact.sourceHash !== revision.sourceHash ||
    artifact.sourceBytes !== revision.sourceBytes ||
    artifact.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION_V1_17 ||
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
    artifact.toolchain.validationPolicy !== "python-source-validation-v1.17" ||
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

const createPythonCandidateInvocationAdapter =
  (
    options: PythonCandidateInvocationAdapterOptionsV117,
    fixtureOnlyObservedExecution?:
      | (() => PythonCandidateHostResultV117)
      | undefined,
  ): ((requestBytes: Uint8Array) => Uint8Array) =>
  (requestBytes) => {
    const verifyRequest =
      fixtureOnlyObservedExecution === undefined
        ? verifySelectedRuntimeInvocationRequestV117
        : verifyRuntimeInvocationRequestV117
    const admittedRequest = verifyRequest(requestBytes, options.identity)
    if (admittedRequest.kind !== "success") {
      return new Uint8Array()
    }
    const request = admittedRequest.value
    const artifact = candidatePythonArtifact(options.revision)
    const sourceIdentity = buildPythonRequestSourceIdentityV117(
      options.revision.source,
    )
    const recordedArtifact = options.revision.metadata.sourceArtifact
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
      return serializeRuntimeInvocationResponseV117(
        failClosedResponse(
          request,
          "OUTER_FRAME_WRONG_BINDING",
          options.identity,
        ),
      )
    }
    let response
    try {
      const host =
        fixtureOnlyObservedExecution?.() ??
        runPythonCandidateHostV117(request, artifact.normalizedSource)
      response = responseForObservation(request, host, options.identity)
    } catch {
      response = failClosedResponse(
        request,
        "AMBIGUOUS_ATTRIBUTION",
        options.identity,
        ["RAW_ADAPTER_CRASH_OBSERVED"],
      )
    }
    return serializeRuntimeInvocationResponseV117(response)
  }

export const createPythonCandidateInvocationAdapterV117 = (
  options: PythonCandidateInvocationAdapterOptionsV117,
): ((requestBytes: Uint8Array) => Uint8Array) =>
  createPythonCandidateInvocationAdapter(options)

export const createPythonCandidateInvocationAdapterFixtureV117 = (
  options: PythonCandidateInvocationAdapterFixtureOptionsV117,
): ((requestBytes: Uint8Array) => Uint8Array) =>
  createPythonCandidateInvocationAdapter(
    options,
    options.fixtureOnlyObservedExecution,
  )

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
  if (!legacyPythonRuntimeIsSelected()) {
    return legacyPythonRuntimeUnavailable()
  }
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

const runPythonStrategyMethodSyncInternal = (
  request: PythonStrategySyncRequestInput,
  allowNestedMatchTestSupport: boolean,
): StrategyRuntimeResponseEnvelope => {
  if (!allowNestedMatchTestSupport && !legacyPythonRuntimeIsSelected()) {
    return legacyPythonRuntimeUnavailable()
  }
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

export const runPythonStrategyMethodSync = (
  request: PythonStrategySyncRequestInput,
): StrategyRuntimeResponseEnvelope =>
  runPythonStrategyMethodSyncInternal(request, false)

/** Selected-pointer nested Match-shape test support; not historical evidence. */
export const runPythonNestedMatchShapeMethodSyncTestSupport = (
  request: PythonStrategySyncRequestInput,
): StrategyRuntimeResponseEnvelope =>
  runPythonStrategyMethodSyncInternal(request, true)

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
    revision.runtime.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION ||
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

type PythonSyncRunner = (
  request: PythonStrategySyncRequestInput,
) => StrategyRuntimeResponseEnvelope

const createPythonRuntimeFromRevisionWithRunner = (
  revision: StrategyRevision,
  options: {
    timeoutMs?: number | undefined
    stdoutBytes?: number | undefined
    stderrBytes?: number | undefined
  },
  runMethod: PythonSyncRunner,
): StrategyRuntime => ({
  selectActivations(input) {
    const artifact = pythonArtifactSource(revision)
    if (!artifact.ok) {
      return artifact
    }
    return normalizeStrategyOutput(
      runMethod({
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
      runMethod({
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

export const createPythonRuntimeFromRevision = (
  revision: StrategyRevision,
  options: {
    timeoutMs?: number | undefined
    stdoutBytes?: number | undefined
    stderrBytes?: number | undefined
  } = {},
): StrategyRuntime =>
  createPythonRuntimeFromRevisionWithRunner(
    revision,
    options,
    runPythonStrategyMethodSync,
  )

/** Selected-pointer nested Match-shape test support; not historical evidence. */
export const createPythonNestedMatchShapeRuntimeTestSupport = (
  revision: StrategyRevision,
  options: {
    timeoutMs?: number | undefined
    stdoutBytes?: number | undefined
    stderrBytes?: number | undefined
  } = {},
): StrategyRuntime =>
  createPythonRuntimeFromRevisionWithRunner(
    revision,
    options,
    runPythonNestedMatchShapeMethodSyncTestSupport,
  )
