import type { StrategyExecutionAdapterV117 } from "./adapter.js"
import { workerThreadStrategyExecutionAdapterMetadata } from "./adapter.js"
import {
  createRuntimeGuestExecutionV117,
  executeStrategyRuntimeAbiV117,
} from "./abi-bridge.js"
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
        requestBytes: request.requestBytes,
        executableSource: request.executableSource,
        signingIdentity: request.signingIdentity,
        invokeGuest(guest) {
          const observation = runStrategyMethodInWorkerV117(guest)
          return createRuntimeGuestExecutionV117(
            observation,
            guest.outputByteLimit,
            request.fixtureEvidenceAfterObservationForTestsOnly,
          )
        },
      })
    },
  })

export const workerThreadStrategyExecutionAdapter =
  createWorkerThreadStrategyExecutionAdapter()
