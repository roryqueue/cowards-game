export const runtimeJsWorkerEntrypoint = "@cowards/runtime-js/worker"
export { createRuntimeFromRevision } from "./executor.js"
export { RUNTIME_TIMEOUT_MS } from "./guards.js"
export {
  activeStrategyExecutionAdapter,
  getStrategyExecutionAdapterMetadata,
  workerThreadStrategyExecutionAdapterMetadata,
} from "./adapter.js"
export {
  createSubprocessStrategyExecutionAdapter,
  subprocessStrategyExecutionAdapterMetadata,
} from "./subprocess-adapter.js"
export { createWorkerThreadStrategyExecutionAdapter } from "./worker-thread-adapter.js"
export {
  SUBPROCESS_STDERR_BYTES,
  SUBPROCESS_STDOUT_BYTES,
  SubprocessSystemFailure,
} from "./subprocess-ipc.js"
export type {
  StrategyExecutionAdapter,
  StrategyExecutionAdapterMetadata,
  StrategyExecutionAdapterOptions,
  StrategyExecutionRequest,
  StrategyMethodName,
} from "./adapter.js"
export type {
  SubprocessSystemFailureCode,
  SubprocessIpcRequest,
  SubprocessIpcResponse,
} from "./subprocess-ipc.js"
