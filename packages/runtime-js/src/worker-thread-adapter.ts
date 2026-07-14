import type { StrategyExecutionAdapterV117 } from "./adapter.js"
import { workerThreadStrategyExecutionAdapterMetadata } from "./adapter.js"
import { executeStrategyRuntimeAbiV117 } from "./abi-bridge.js"
import {
  runStrategyMethodInWorker,
  runStrategyMethodInWorkerV117,
} from "./worker-bridge.js"

export const createWorkerThreadStrategyExecutionAdapter =
  (): StrategyExecutionAdapterV117 => ({
    metadata: workerThreadStrategyExecutionAdapterMetadata,
    execute(request) {
      return runStrategyMethodInWorker({
        source: request.source,
        methodName: request.methodName,
        input: request.input,
        timeoutMs: request.timeoutMs,
        outputByteLimit: request.outputByteLimit,
      })
    },
    executeV117(request) {
      return executeStrategyRuntimeAbiV117({
        ...request,
        invokeGuest: runStrategyMethodInWorkerV117,
      })
    },
  })

export const workerThreadStrategyExecutionAdapter =
  createWorkerThreadStrategyExecutionAdapter()
