import {
  STRATEGY_RUNTIME_ABI_VERSION,
  StrategyRuntimeRequestEnvelopeSchema,
  StrategyRuntimeResponseEnvelopeSchema,
  type StrategyRevision,
} from "@cowards/spec"
import type { RuntimeResult } from "@cowards/engine"
import type {
  StrategyExecutionAdapter,
  StrategyExecutionAdapterOptions,
  StrategyMethodName,
} from "./adapter.js"
import { hashStrategySource } from "./hash.js"

export interface ExecuteStrategyRuntimeAbiBridgeInput extends StrategyExecutionAdapterOptions {
  adapter: StrategyExecutionAdapter
  revision: StrategyRevision
  executableSource: string
  methodName: StrategyMethodName
  input: unknown
}

export const executeStrategyRuntimeAbiV114 = (
  input: ExecuteStrategyRuntimeAbiBridgeInput,
): RuntimeResult<unknown> => {
  const request = StrategyRuntimeRequestEnvelopeSchema.parse({
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    methodName: input.methodName,
    runtime: input.revision.runtime,
    source: {
      text: input.revision.source,
      hash: input.revision.sourceHash,
      bytes: input.revision.sourceBytes,
      entrypoint: input.revision.runtime.package.entrypoint,
    },
    input: input.input,
  })
  if (request.source.text === undefined) {
    return {
      ok: false,
      violation: {
        type: "INVALID_OUTPUT",
        message: "Strategy Revision failed ABI source validation",
      },
    }
  }
  if (
    hashStrategySource(request.source.text) !== request.source.hash ||
    new TextEncoder().encode(request.source.text).length !==
      request.source.bytes
  ) {
    return {
      ok: false,
      violation: {
        type: "INVALID_OUTPUT",
        message: "Strategy Revision failed ABI source validation",
      },
    }
  }

  const result = input.adapter.execute({
    source: input.executableSource,
    methodName: request.methodName,
    input: request.input,
    timeoutMs: input.timeoutMs,
    outputByteLimit: input.outputByteLimit,
  })

  StrategyRuntimeResponseEnvelopeSchema.parse(
    result.ok
      ? {
          ok: true,
          abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
          value: result.value,
        }
      : {
          ok: false,
          abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
          failureKind: "runtimeViolation",
          violation: {
            code: result.violation.type,
            message: result.violation.message,
            publicMessage: result.violation.message,
          },
        },
  )

  return result
}
