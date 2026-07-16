import {
  RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS,
  RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES,
  RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY,
  RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
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
  CANDIDATE_KERNEL_SEMANTIC_TUPLE,
  type CandidateBoundRuntimeInvocationV117,
  type CandidateRuntimeInvocationResult,
  type CandidateStrategyRuntime,
  type KernelEffectRequest,
  type KernelSelectActivationsRequest,
  type KernelSoldierBrainRequest,
} from "../kernel/types.js"
import type { CanonicalStrategyRuntime } from "../types.js"

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
        ...CANDIDATE_KERNEL_SEMANTIC_TUPLE,
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
    outcome = {
      kind: "system_failure",
      failure: {
        code: "TIMEOUT",
        publicMessage: "Runtime system failure.",
        retryable: RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY.TIMEOUT,
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

export const adaptRuntimeForCurrentKernel = (
  runtime: CandidateStrategyRuntime,
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
    return request === undefined ? legacy : boundResult(request, legacy)
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
    return request === undefined ? legacy : boundResult(request, legacy)
  }

  return { selectActivations, runSoldierBrain }
}
