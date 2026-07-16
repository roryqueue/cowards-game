import {
  RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS,
  RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES,
  RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY,
  RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  createAuthenticatedRuntimeInvocationResponseV117,
  createRuntimeAbiV117ExecutionLedger,
  createRuntimeInvocationBudgetV117,
  createRuntimeInvocationExecutionReceiptV117,
  createRuntimeInvocationTraceV117,
  createSelectedRuntimeInvocationRequestV117,
  encodeCanonicalJson,
  type JsonValue,
  type RuntimeInvocationExecutionReceiptEvidenceV117,
  type RuntimeInvocationResultV117,
  type SoldierBrainResult,
  type StrategyResult,
} from "@cowards/spec"
import {
  CANDIDATE_KERNEL_SEMANTIC_TUPLE,
  type CandidateBoundRuntimeInvocationV117,
  type CandidateRuntimeInvocationResult,
  type CandidateStrategyRuntime,
  type KernelEffectRequest,
} from "../kernel/types.js"

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

const receiptFor = (
  request: ReturnType<typeof requestFor>,
  outcome: RuntimeInvocationResultV117<JsonValue>,
) => {
  const prestate = request.accounting.prestate
  const encoded =
    outcome.kind === "success"
      ? encodeCanonicalJson(outcome.value, {
          context: "authenticated-outer-envelope",
        })
      : undefined
  if (encoded !== undefined && !encoded.ok) {
    throw new Error(
      "current kernel runtime fixture produced non-canonical JSON",
    )
  }
  const payloadBytes = encoded?.bytes.byteLength ?? 1
  const evidence: RuntimeInvocationExecutionReceiptEvidenceV117 = {
    attribution:
      outcome.kind === "system_failure" ? "ambiguous" : "proven_strategy",
    counters: {
      wallMilliseconds: {
        status: "measured",
        delta: 1,
        cumulative: prestate.cumulative.wallMilliseconds + 1,
      },
      computeFuel: {
        status: "measured",
        delta: 1,
        cumulative: prestate.cumulative.computeFuel + 1,
      },
      payloadBytes: {
        status: "measured",
        delta: payloadBytes,
        cumulative: prestate.cumulative.payloadBytes + payloadBytes,
      },
      stdoutBytes: {
        status: "measured",
        delta: outcome.kind === "success" ? payloadBytes + 1 : 1,
        cumulative:
          prestate.cumulative.stdoutBytes +
          (outcome.kind === "success" ? payloadBytes + 1 : 1),
      },
      stderrBytes: {
        status: "measured",
        delta: outcome.kind === "success" ? 0 : 1,
        cumulative:
          prestate.cumulative.stderrBytes +
          (outcome.kind === "success" ? 0 : 1),
      },
    },
    memory: {
      status: "measured",
      peakBytes: 1,
      cumulativePeakBytes: Math.max(prestate.cumulative.memoryBytes, 1),
    },
    process: {
      status: "verified",
      processes: 1,
      threads: 1,
      children: 0,
    },
    capabilities: {
      status: "verified",
      filesystem: "none",
      network: "disabled",
      environment: "empty",
      shell: "disabled",
    },
    cancellation: {
      status: "verified",
      terminationRequired: false,
      receiptPresent: false,
      graceMilliseconds: 0,
    },
    accountingEvidence: {
      status: "verified",
      signatureVerified: true,
      monotonic: true,
    },
  }
  return createRuntimeInvocationExecutionReceiptV117(request, evidence)
}

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
  const authenticated = createAuthenticatedRuntimeInvocationResponseV117(
    authenticatedRequest,
    outcome,
    receiptFor(authenticatedRequest, outcome),
    signingIdentity,
  )
  return {
    kind: "v1_17_bound",
    request: authenticatedRequest,
    outcome: authenticated.outcome as RuntimeInvocationResultV117<TValue>,
  }
}

/**
 * Keeps a test runtime usable through explicit historical dispatch while
 * supplying the authenticated v1.17 envelope whenever the kernel provides a
 * current request. Production adapters must authenticate through their own
 * containment boundary and must not import this fixture-only helper.
 */
export const adaptRuntimeForCurrentKernel = (
  runtime: CandidateStrategyRuntime,
): CandidateStrategyRuntime => ({
  selectActivations(input, request) {
    const legacy = runtime.selectActivations(input)
    return request === undefined ? legacy : boundResult(request, legacy)
  },
  runSoldierBrain(input, request) {
    const legacy = runtime.runSoldierBrain(input)
    return request === undefined ? legacy : boundResult(request, legacy)
  },
})
