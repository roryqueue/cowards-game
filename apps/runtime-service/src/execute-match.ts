import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  RuntimeExecutionServiceRequestSchema,
  RuntimeExecutionServiceResponseSchema,
  STRATEGY_RUNTIME_ABI_VERSION,
  findRuntimeBrokerRegistryEntry,
  validateStrategyLanguageProviderRuntimeCompatibility,
  type MatchId,
  type PlayerId,
  type RuntimeExecutionServiceRequest,
  type RuntimeExecutionServiceResponse,
  type RuntimeExecutionServiceSystemFailureCode,
  type StrategyRevision,
} from "@cowards/spec"
import { hashStrategySource } from "@cowards/runtime-js"
import { createRuntimeFromRevision } from "@cowards/runtime-js/worker"
import { createPythonRuntimeFromRevision } from "@cowards/runtime-python"
import { createWasmWasiRuntimeFromRevision } from "@cowards/runtime-wasm-wasi"
import { buildChronicleFromMatch } from "@cowards/replay"
import {
  violation,
  type RunMatchInput,
  type StrategyRuntime,
} from "@cowards/engine"
import type { RuntimeServiceConfig } from "./runtime-config.js"
import { publicSystemFailureMessage, redactedDiagnostics } from "./redaction.js"

type RuntimeExecutionServiceDependencies = {
  buildChronicleFromMatch: typeof buildChronicleFromMatch
}

const defaultDependencies: RuntimeExecutionServiceDependencies = {
  buildChronicleFromMatch,
}

const readRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined

const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined

const requestIdentity = (
  rawRequest: unknown,
): { requestId: string; matchId?: MatchId | undefined } => {
  const root = readRecord(rawRequest)
  const match = readRecord(root?.match)
  return {
    requestId: readString(root?.requestId) ?? "runtime-request:unknown",
    matchId: readString(match?.matchId),
  }
}

const systemFailureResponse = (input: {
  rawRequest: unknown
  code: RuntimeExecutionServiceSystemFailureCode
  message: string
  retryable: boolean
  diagnostics?: Record<string, unknown> | undefined
}): RuntimeExecutionServiceResponse => {
  const identity = requestIdentity(input.rawRequest)
  const response = {
    contractVersion: "runtime-execution-service-v1.15",
    ok: false,
    kind: "systemFailure",
    requestId: identity.requestId,
    ...(identity.matchId === undefined ? {} : { matchId: identity.matchId }),
    runtimeAbiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    systemFailure: {
      code: input.code,
      message: input.message,
      publicMessage: publicSystemFailureMessage(input.code),
      retryable: input.retryable,
      ...(input.diagnostics === undefined
        ? {}
        : { diagnostics: redactedDiagnostics(input.diagnostics) }),
    },
  } satisfies RuntimeExecutionServiceResponse

  return RuntimeExecutionServiceResponseSchema.parse(
    response,
  ) as RuntimeExecutionServiceResponse
}

const validateRevisionSource = (
  slot: "bottom" | "top",
  revision: StrategyRevision,
):
  | { ok: true }
  | {
      ok: false
      code: "SOURCE_HASH_MISMATCH" | "SOURCE_BYTES_MISMATCH"
      diagnostics: Record<string, unknown>
    } => {
  const actualBytes = new TextEncoder().encode(revision.source).length
  if (actualBytes !== revision.sourceBytes) {
    return {
      ok: false,
      code: "SOURCE_BYTES_MISMATCH",
      diagnostics: {
        reason: "source-bytes-mismatch",
        slot,
        revisionId: revision.id,
        declaredBytes: revision.sourceBytes,
        actualBytes,
      },
    }
  }

  const actualHash = hashStrategySource(revision.source)
  if (actualHash !== revision.sourceHash) {
    return {
      ok: false,
      code: "SOURCE_HASH_MISMATCH",
      diagnostics: {
        reason: "source-hash-mismatch",
        slot,
        revisionId: revision.id,
        declaredHash: revision.sourceHash,
        actualHash,
      },
    }
  }

  return { ok: true }
}

const validateRevisionArtifact = (
  slot: "bottom" | "top",
  revision: StrategyRevision,
):
  | { ok: true }
  | {
      ok: false
      diagnostics: Record<string, unknown>
    } => {
  if (revision.runtime.adapter.id !== "runtime-wasm-wasi-wasmtime-preview1") {
    return { ok: true }
  }
  const artifact = revision.metadata.compiledArtifact
  if (!artifact?.bytesBase64) {
    return {
      ok: false,
      diagnostics: {
        reason: "compiled-artifact-missing",
        slot,
        revisionId: revision.id,
        languageId: revision.runtime.language.id,
      },
    }
  }
  const expectedTargetTriple =
    revision.runtime.language.id === "zig" ? "wasm32-wasi" : "wasm32-wasip1"
  if (
    artifact.validationStatus !== "valid" ||
    artifact.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION ||
    artifact.wasiProfile !== "preview1" ||
    artifact.abiEnvelope !== "stdin-stdout-json" ||
    artifact.targetTriple !== expectedTargetTriple
  ) {
    return {
      ok: false,
      diagnostics: {
        reason: "compiled-artifact-metadata-invalid",
        slot,
        revisionId: revision.id,
        languageId: revision.runtime.language.id,
        validationStatus: artifact.validationStatus,
        targetTriple: artifact.targetTriple,
      },
    }
  }
  const bytes = Buffer.from(artifact.bytesBase64, "base64")
  const actualHash = createHash("sha256").update(bytes).digest("hex")
  if (bytes.byteLength !== artifact.bytes || actualHash !== artifact.hash) {
    return {
      ok: false,
      diagnostics: {
        reason: "compiled-artifact-mismatch",
        slot,
        revisionId: revision.id,
        declaredBytes: artifact.bytes,
        actualBytes: bytes.byteLength,
        declaredHash: artifact.hash,
        actualHash,
      },
    }
  }
  if (artifact.sourceHash !== revision.sourceHash) {
    return {
      ok: false,
      diagnostics: {
        reason: "compiled-artifact-source-hash-mismatch",
        slot,
        revisionId: revision.id,
      },
    }
  }
  return { ok: true }
}

const createRuntimeForRevision = (
  revision: StrategyRevision,
  runtimeConfig: RuntimeServiceConfig,
  limits: RuntimeExecutionServiceRequest["limits"],
):
  | { ok: true; runtime: StrategyRuntime }
  | {
      ok: false
      diagnostics: Record<string, unknown>
    } => {
  const providerIssues = validateStrategyLanguageProviderRuntimeCompatibility(
    revision.runtime,
  )
  if (providerIssues.length > 0) {
    return {
      ok: false,
      diagnostics: {
        reason: "language-provider-runtime-mismatch",
        revisionId: revision.id,
        languageId: revision.runtime.language.id,
        adapterId: revision.runtime.adapter.id,
        issues: providerIssues,
      },
    }
  }
  const registryEntry = findRuntimeBrokerRegistryEntry(revision.runtime)
  if (!registryEntry) {
    return {
      ok: false,
      diagnostics: {
        reason: "runtime-registry-mismatch",
        revisionId: revision.id,
        languageId: revision.runtime.language.id,
        adapterId: revision.runtime.adapter.id,
        adapterVersion: revision.runtime.adapter.version,
      },
    }
  }
  if (registryEntry.runtimeTarget === "runtime-python") {
    return {
      ok: true,
      runtime: createPythonRuntimeFromRevision(revision, {
        timeoutMs: Math.min(
          limits.timeoutMs,
          revision.runtime.limits.timeoutMs,
        ),
        stdoutBytes: Math.min(
          limits.stdoutBytes,
          revision.runtime.limits.stdoutBytes,
        ),
        stderrBytes: Math.min(
          limits.stderrBytes,
          revision.runtime.limits.stderrBytes,
        ),
      }),
    }
  }
  if (registryEntry.runtimeTarget === "runtime-wasm-wasi") {
    return {
      ok: true,
      runtime: createWasmWasiRuntimeFromRevision(revision, {
        timeoutMs: Math.min(
          limits.timeoutMs,
          revision.runtime.limits.timeoutMs,
        ),
        stdoutBytes: Math.min(
          limits.stdoutBytes,
          revision.runtime.limits.stdoutBytes,
        ),
        stderrBytes: Math.min(
          limits.stderrBytes,
          revision.runtime.limits.stderrBytes,
        ),
      }),
    }
  }
  const expectedJsAdapterId =
    runtimeConfig.metadata.id === "worker-thread"
      ? "runtime-js-worker-thread"
      : runtimeConfig.metadata.id === "subprocess"
        ? "runtime-js-subprocess"
        : runtimeConfig.metadata.id === "container-subprocess"
          ? "runtime-js-container-subprocess"
          : null
  if (revision.runtime.adapter.id !== expectedJsAdapterId) {
    return {
      ok: false,
      diagnostics: {
        reason: "runtime-js-adapter-mismatch",
        revisionId: revision.id,
        declaredAdapterId: revision.runtime.adapter.id,
        serviceAdapterId: runtimeConfig.metadata.id,
        expectedAdapterId: expectedJsAdapterId,
      },
    }
  }
  return {
    ok: true,
    runtime: createRuntimeFromRevision(revision, {
      adapter: runtimeConfig.adapter,
      timeoutMs: limits.timeoutMs,
      outputByteLimit: limits.stdoutBytes,
    }),
  }
}

export const createSideDispatchRuntime = (
  bottomRuntime: StrategyRuntime,
  topRuntime: StrategyRuntime,
  playerIds: { bottomPlayerId: PlayerId; topPlayerId: PlayerId },
): StrategyRuntime => ({
  selectActivations(input) {
    const playerId = input.mySoldiers[0]?.ownerPlayerId
    if (playerId === playerIds.bottomPlayerId) {
      return bottomRuntime.selectActivations(input)
    }
    if (playerId === playerIds.topPlayerId) {
      return topRuntime.selectActivations(input)
    }
    return violation("INVALID_OUTPUT", "Cannot resolve player runtime")
  },

  runSoldierBrain(input) {
    const playerId = input.self.ownerPlayerId
    if (playerId === playerIds.bottomPlayerId) {
      return bottomRuntime.runSoldierBrain(input)
    }
    if (playerId === playerIds.topPlayerId) {
      return topRuntime.runSoldierBrain(input)
    }
    return violation("INVALID_OUTPUT", "Cannot resolve soldier runtime")
  },
})

const runtimeViolationEventCount = (
  result: ReturnType<typeof buildChronicleFromMatch>,
): number =>
  result.chronicle.events.filter((event) => event.type === "RUNTIME_VIOLATION")
    .length

const executeParsedRequest = (
  request: RuntimeExecutionServiceRequest,
  runtimeConfig: RuntimeServiceConfig,
  dependencies: RuntimeExecutionServiceDependencies,
): RuntimeExecutionServiceResponse => {
  for (const slot of ["bottom", "top"] as const) {
    const validation = validateRevisionSource(slot, request.strategies[slot])
    if (!validation.ok) {
      return systemFailureResponse({
        rawRequest: request,
        code: validation.code,
        message: "Runtime execution request failed source validation.",
        retryable: false,
        diagnostics: validation.diagnostics,
      })
    }
    const artifactValidation = validateRevisionArtifact(
      slot,
      request.strategies[slot],
    )
    if (!artifactValidation.ok) {
      return systemFailureResponse({
        rawRequest: request,
        code: "SOURCE_HASH_MISMATCH",
        message:
          "Runtime execution request failed immutable artifact validation.",
        retryable: false,
        diagnostics: artifactValidation.diagnostics,
      })
    }
  }

  const bottomRuntime = createRuntimeForRevision(
    request.strategies.bottom,
    runtimeConfig,
    request.limits,
  )
  if (!bottomRuntime.ok) {
    return systemFailureResponse({
      rawRequest: request,
      code: "UNSUPPORTED_RUNTIME_ADAPTER",
      message: "Runtime broker could not select a bottom Strategy runtime.",
      retryable: false,
      diagnostics: bottomRuntime.diagnostics,
    })
  }
  const topRuntime = createRuntimeForRevision(
    request.strategies.top,
    runtimeConfig,
    request.limits,
  )
  if (!topRuntime.ok) {
    return systemFailureResponse({
      rawRequest: request,
      code: "UNSUPPORTED_RUNTIME_ADAPTER",
      message: "Runtime broker could not select a top Strategy runtime.",
      retryable: false,
      diagnostics: topRuntime.diagnostics,
    })
  }
  const runMatchInput: RunMatchInput = {
    ...request.match,
    runtime: createSideDispatchRuntime(
      bottomRuntime.runtime,
      topRuntime.runtime,
      {
        bottomPlayerId: request.match.bottomPlayerId,
        topPlayerId: request.match.topPlayerId,
      },
    ),
  }
  const result = dependencies.buildChronicleFromMatch(runMatchInput)
  const response = {
    contractVersion: request.contractVersion,
    ok: true,
    kind: "executionResult",
    requestId: request.requestId,
    matchId: request.match.matchId,
    runtimeAbiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    result: {
      privacy: "internal_runtime_result",
      chronicle: result.chronicle,
      finalState: result.finalState,
      runtimeViolationEventCount: runtimeViolationEventCount(result),
    },
  } satisfies RuntimeExecutionServiceResponse

  const parsed = RuntimeExecutionServiceResponseSchema.safeParse(response)
  if (!parsed.success) {
    return systemFailureResponse({
      rawRequest: request,
      code: "RESPONSE_SCHEMA_INVALID",
      message: "Runtime execution service produced an invalid response.",
      retryable: true,
      diagnostics: {
        reason: "response-schema-invalid",
        issueCount: parsed.error.issues.length,
      },
    })
  }

  return parsed.data as RuntimeExecutionServiceResponse
}

export const executeRuntimeServiceRequest = (
  rawRequest: unknown,
  runtimeConfig: RuntimeServiceConfig,
  dependencies: RuntimeExecutionServiceDependencies = defaultDependencies,
): RuntimeExecutionServiceResponse => {
  const parsedRequest =
    RuntimeExecutionServiceRequestSchema.safeParse(rawRequest)
  if (!parsedRequest.success) {
    return systemFailureResponse({
      rawRequest,
      code: "MALFORMED_REQUEST",
      message: "Runtime execution request failed schema validation.",
      retryable: false,
      diagnostics: {
        reason: "request-schema-invalid",
        issueCount: parsedRequest.error.issues.length,
      },
    })
  }

  try {
    return executeParsedRequest(parsedRequest.data, runtimeConfig, dependencies)
  } catch (error) {
    return systemFailureResponse({
      rawRequest: parsedRequest.data,
      code: "EXECUTION_EXCEPTION",
      message: "Runtime execution service raised an execution exception.",
      retryable: true,
      diagnostics: {
        reason: "execution-exception",
        errorName: error instanceof Error ? error.name : "UnknownError",
      },
    })
  }
}
