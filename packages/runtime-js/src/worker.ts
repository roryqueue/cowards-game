export const runtimeJsWorkerEntrypoint = "@cowards/runtime-js/worker"
export { createRuntimeFromRevision } from "./executor.js"
export { RUNTIME_TIMEOUT_MS } from "./guards.js"
export {
  activeStrategyExecutionAdapter,
  getStrategyExecutionAdapterMetadata,
  workerThreadStrategyExecutionAdapterMetadata,
} from "./adapter.js"
export { createWorkerThreadStrategyExecutionAdapter } from "./worker-thread-adapter.js"
export type {
  StrategyExecutionAdapter,
  StrategyExecutionAdapterMetadata,
  StrategyExecutionAdapterOptions,
  StrategyExecutionRequest,
  StrategyMethodName,
} from "./adapter.js"
