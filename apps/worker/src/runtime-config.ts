import {
  createSubprocessStrategyExecutionAdapter,
  createWorkerThreadStrategyExecutionAdapter,
  type StrategyExecutionAdapter,
  type StrategyExecutionAdapterMetadata,
} from "@cowards/runtime-js/worker"

const DEFAULT_STRATEGY_EXECUTION_ADAPTER_ID = "worker-thread"

export class WorkerRuntimeConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "WorkerRuntimeConfigError"
  }
}

export interface WorkerRuntimeConfigInput {
  strategyExecutionAdapter?: string | undefined
}

export interface WorkerRuntimeConfig {
  adapter: StrategyExecutionAdapter
  metadata: StrategyExecutionAdapterMetadata
}

export const createWorkerRuntimeConfig = (
  input: WorkerRuntimeConfigInput = {},
): WorkerRuntimeConfig => {
  const adapterId =
    input.strategyExecutionAdapter?.trim() ??
    DEFAULT_STRATEGY_EXECUTION_ADAPTER_ID
  const selectedId =
    adapterId.length > 0 ? adapterId : DEFAULT_STRATEGY_EXECUTION_ADAPTER_ID

  switch (selectedId) {
    case "worker-thread": {
      const adapter = createWorkerThreadStrategyExecutionAdapter()
      return { adapter, metadata: adapter.metadata }
    }
    case "subprocess": {
      const adapter = createSubprocessStrategyExecutionAdapter()
      return { adapter, metadata: adapter.metadata }
    }
    default:
      throw new WorkerRuntimeConfigError(
        `Unknown Strategy execution adapter: ${selectedId}`,
      )
  }
}

export const formatWorkerRuntimeConfigLogLines = (
  runtimeConfig: WorkerRuntimeConfig,
): readonly string[] => [
  `Strategy execution adapter: ${runtimeConfig.metadata.id} (${runtimeConfig.metadata.label})`,
  `Strategy isolation boundary: ${runtimeConfig.metadata.isolationBoundary}`,
]
