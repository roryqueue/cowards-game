/* eslint-disable no-redeclare -- TypeScript overload signatures intentionally share implementation names. */
import {
  RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS,
  RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES,
  RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY,
  RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  CANONICAL_ARENA_CATALOG_V1_37,
  CURRENT_SEMANTIC_AUTHORITY_KEY,
  createRuntimeAbiV117ExecutionLedger,
  createRuntimeInvocationBudgetV117,
  createRuntimeInvocationTraceV117,
  createSelectedRuntimeInvocationRequestV117,
  type JsonValue,
  type RuntimeInvocationResultV117,
  type SoldierBrainInput,
  type SoldierBrainResult,
  type StrategyInput,
  type StrategyResult,
} from "@cowards/spec"
import {
  CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE,
  type CandidateBoundRuntimeInvocationV117,
  type CandidateRuntimeInvocationResult,
  type CandidateStrategyRuntime,
  type CandidateExecution,
  type KernelEffectRequest,
  type KernelSelectActivationsRequest,
  type KernelSoldierBrainRequest,
} from "../kernel/types.js"
import { MatchExecutionFailure, runMatch } from "../match.js"
import type { CanonicalStrategyRuntime, RunMatchInput } from "../types.js"

type CurrentMatchResult = CandidateExecution

const executeCurrentMatch = (input: RunMatchInput): CurrentMatchResult => {
  try {
    return runMatch(input).execution
  } catch (error) {
    if (!(error instanceof MatchExecutionFailure)) throw error
    return {
      kind: "failure",
      transitions: [],
      failure: error.failure,
      unchangedState: error.unchangedState,
    }
  }
}

const currentFixtureArena = () => {
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
    ({ status, schedulable, terrainStones }) =>
      status === "active" && schedulable && terrainStones.length === 0,
  )
  if (arena === undefined) {
    throw new Error("CURRENT_REPLAY_TEST_ARENA_UNAVAILABLE")
  }
  return arena
}

export const runCurrentMatchForReplayTestSupport = (
  input: RunMatchInput,
): CurrentMatchResult => {
  const arena = currentFixtureArena()
  return executeCurrentMatch({
    ...input,
    arenaVariant: {
      id: arena.id,
      name: arena.name,
      initialBounds: { ...arena.initialBounds },
      terrainStones: arena.terrainStones.map((position) => ({ ...position })),
    },
  })
}

export const runSelectedCurrentMatchForReplayTestSupport = (
  input: RunMatchInput,
): CurrentMatchResult =>
  String(CURRENT_SEMANTIC_AUTHORITY_KEY) !== "runtime-v1.19"
    ? executeCurrentMatch(input)
    : runCurrentMatchForReplayTestSupport(input)

const signingIdentity = {
  keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  secret: "fixture-only:current-kernel-runtime",
} as const

const requestFor = (request: KernelEffectRequest) =>
  createSelectedRuntimeInvocationRequestV117(
    {
      requestId: `runtime-request:${request.requestId}`,
      invocationId: `invocation:${request.requestId}`,
      kernelRequestId: request.requestId,
      method: request.kind,
      semanticTuple: {
        ...CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE,
        runtimeAbi: "strategy-runtime-abi-v1.17",
      },
      sourceIdentity: {
        strategyRevisionId: "strategy-revision:current-kernel-runtime",
        originalSourceSha256: `sha256:${"a".repeat(64)}`,
        normalizedSourceSha256: `sha256:${"b".repeat(64)}`,
        artifactSha256: `sha256:${"c".repeat(64)}`,
      },
      budget: createRuntimeInvocationBudgetV117(request.kind),
      accounting: { prestate: createRuntimeAbiV117ExecutionLedger() },
      input: { value: request.input as unknown as JsonValue },
      retry: {
        retryId: `retry:${request.requestId}`,
        attempt: 0,
        previousRequestSha256: null,
      },
    },
    signingIdentity,
  )

const boundResult = <TValue extends StrategyResult | SoldierBrainResult>(
  request: KernelEffectRequest,
  legacy: CandidateRuntimeInvocationResult<TValue>,
  timeoutOwnership: "unproven_system" | "historical_player_resource",
): CandidateBoundRuntimeInvocationV117<TValue> => {
  if (!("ok" in legacy)) return legacy
  const authenticatedRequest = requestFor(request)
  const trace = createRuntimeInvocationTraceV117(authenticatedRequest, [])
  let outcome: RuntimeInvocationResultV117<JsonValue>
  if (legacy.ok) {
    outcome = {
      kind: "success",
      value: legacy.value as unknown as JsonValue,
      trace,
    }
  } else if ("systemFailure" in legacy) {
    const requestedCode = legacy.systemFailure.code
    const code =
      RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES.find(
        (candidate) => candidate === requestedCode,
      ) ?? "ADAPTER_CRASH"
    outcome = {
      kind: "system_failure",
      failure: {
        code,
        publicMessage: "Runtime system failure.",
        retryable: RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY[code],
      },
      trace,
    }
  } else if (legacy.violation.type === "TIMEOUT") {
    outcome =
      timeoutOwnership === "historical_player_resource"
        ? {
            kind: "player_violation",
            violation:
              RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.RESOURCE_EXHAUSTION,
            trace,
          }
        : {
            kind: "system_failure",
            failure: {
              code: "TIMEOUT",
              publicMessage: "Runtime system failure.",
              retryable:
                RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY.TIMEOUT,
            },
            trace,
          }
  } else {
    const violation =
      RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS[
        legacy.violation
          .type as keyof typeof RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS
      ] ?? RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.INVALID_OUTPUT
    outcome = { kind: "player_violation", violation, trace }
  }
  return {
    kind: "v1_17_bound",
    request: authenticatedRequest,
    outcome: outcome as RuntimeInvocationResultV117<TValue>,
  }
}

/**
 * Keeps a test runtime usable through explicit historical dispatch while
 * supplying the canonical v1.17 request/outcome binding whenever the kernel
 * provides a current request. Production adapters must authenticate through
 * their own containment boundary and must not import this fixture-only helper.
 */
export type CurrentKernelTestRuntime = CandidateStrategyRuntime &
  CanonicalStrategyRuntime

const adaptRuntimeForCurrentKernelWithTimeoutOwnership = (
  runtime: CandidateStrategyRuntime,
  timeoutOwnership: "unproven_system" | "historical_player_resource",
): CurrentKernelTestRuntime => {
  function selectActivations(
    input: StrategyInput,
    request: KernelSelectActivationsRequest,
  ): CandidateBoundRuntimeInvocationV117<StrategyResult>
  function selectActivations(
    input: StrategyInput,
    request?: KernelSelectActivationsRequest,
  ): CandidateRuntimeInvocationResult<StrategyResult>
  function selectActivations(
    input: StrategyInput,
    request?: KernelSelectActivationsRequest,
  ): CandidateRuntimeInvocationResult<StrategyResult> {
    const legacy = runtime.selectActivations(input)
    return request === undefined
      ? legacy
      : boundResult(request, legacy, timeoutOwnership)
  }

  function runSoldierBrain(
    input: SoldierBrainInput,
    request: KernelSoldierBrainRequest,
  ): CandidateBoundRuntimeInvocationV117<SoldierBrainResult>
  function runSoldierBrain(
    input: SoldierBrainInput,
    request?: KernelSoldierBrainRequest,
  ): CandidateRuntimeInvocationResult<SoldierBrainResult>
  function runSoldierBrain(
    input: SoldierBrainInput,
    request?: KernelSoldierBrainRequest,
  ): CandidateRuntimeInvocationResult<SoldierBrainResult> {
    const legacy = runtime.runSoldierBrain(input)
    return request === undefined
      ? legacy
      : boundResult(request, legacy, timeoutOwnership)
  }

  return { selectActivations, runSoldierBrain }
}

export const adaptRuntimeForCurrentKernel = (
  runtime: CandidateStrategyRuntime,
): CurrentKernelTestRuntime =>
  adaptRuntimeForCurrentKernelWithTimeoutOwnership(runtime, "unproven_system")

/**
 * Immutable historical-fixture replay only. The caller supplies evidence that
 * a legacy TIMEOUT represented player-owned resource exhaustion, allowing the
 * v1.17 private classification to retain v1.4 TIMEOUT gameplay vocabulary.
 */
export const adaptHistoricalRuntimeForCurrentKernel = (
  runtime: CandidateStrategyRuntime,
): CurrentKernelTestRuntime =>
  adaptRuntimeForCurrentKernelWithTimeoutOwnership(
    runtime,
    "historical_player_resource",
  )
