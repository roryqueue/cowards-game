import {
  RuntimeExecutionServiceRequestSchema,
  RuntimeExecutionServiceResponseSchema,
  STRATEGY_RUNTIME_ABI_VERSION,
  type MatchId,
  type PlayerId,
  type RuntimeExecutionServiceRequest,
  type RuntimeExecutionServiceResponse,
  type RuntimeExecutionServiceSystemFailureCode,
  type StrategyRevision,
} from "@cowards/spec"
import { hashStrategySource } from "@cowards/runtime-js"
import { createRuntimeFromRevision } from "@cowards/runtime-js/worker"
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
  }

  const bottomRuntime = createRuntimeFromRevision(request.strategies.bottom, {
    adapter: runtimeConfig.adapter,
    timeoutMs: request.limits.timeoutMs,
    outputByteLimit: request.limits.stdoutBytes,
  })
  const topRuntime = createRuntimeFromRevision(request.strategies.top, {
    adapter: runtimeConfig.adapter,
    timeoutMs: request.limits.timeoutMs,
    outputByteLimit: request.limits.stdoutBytes,
  })
  const runMatchInput: RunMatchInput = {
    ...request.match,
    runtime: createSideDispatchRuntime(bottomRuntime, topRuntime, {
      bottomPlayerId: request.match.bottomPlayerId,
      topPlayerId: request.match.topPlayerId,
    }),
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
