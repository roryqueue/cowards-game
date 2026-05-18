import type { StrategyExecutionAdapter } from "./adapter.js"
import { workerThreadStrategyExecutionAdapterMetadata } from "./adapter.js"
import { runStrategyMethodInWorker } from "./worker-bridge.js"

export const createWorkerThreadStrategyExecutionAdapter =
  (): StrategyExecutionAdapter => ({
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
  })

export const workerThreadStrategyExecutionAdapter =
  createWorkerThreadStrategyExecutionAdapter()
