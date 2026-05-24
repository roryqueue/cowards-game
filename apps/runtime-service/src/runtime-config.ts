import {
  createContainerSubprocessStrategyExecutionAdapter,
  createSubprocessStrategyExecutionAdapter,
  createWorkerThreadStrategyExecutionAdapter,
  type StrategyExecutionAdapter,
  type StrategyExecutionAdapterMetadata,
} from "@cowards/runtime-js/worker"

const LOCAL_DEV_STRATEGY_EXECUTION_ADAPTER_ID = "worker-thread"

export class RuntimeServiceConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RuntimeServiceConfigError"
  }
}

export interface RuntimeServiceConfigInput {
  strategyExecutionAdapter?: string | undefined
  allowLocalWorkerThreadFallback?: boolean | undefined
}

export interface RuntimeServiceConfig {
  adapter: StrategyExecutionAdapter
  metadata: StrategyExecutionAdapterMetadata
}

export const createRuntimeServiceConfig = (
  input: RuntimeServiceConfigInput = {},
): RuntimeServiceConfig => {
  const adapterId =
    input.strategyExecutionAdapter?.trim() ??
    (input.allowLocalWorkerThreadFallback === true
      ? LOCAL_DEV_STRATEGY_EXECUTION_ADAPTER_ID
      : undefined)
  if (!adapterId) {
    throw new RuntimeServiceConfigError(
      "Runtime service requires STRATEGY_EXECUTION_ADAPTER; set COWARDS_RUNTIME_SERVICE_ALLOW_LOCAL_WORKER_THREAD=1 only for local development.",
    )
  }
  const selectedId = adapterId.length > 0 ? adapterId : undefined
  if (!selectedId) {
    throw new RuntimeServiceConfigError("Strategy execution adapter is empty")
  }

  switch (selectedId) {
    case "worker-thread": {
      const adapter = createWorkerThreadStrategyExecutionAdapter()
      return { adapter, metadata: adapter.metadata }
    }
    case "subprocess": {
      const adapter = createSubprocessStrategyExecutionAdapter()
      return { adapter, metadata: adapter.metadata }
    }
    case "container-subprocess": {
      const adapter = createContainerSubprocessStrategyExecutionAdapter()
      return { adapter, metadata: adapter.metadata }
    }
    default:
      throw new RuntimeServiceConfigError(
        `Unknown Strategy execution adapter: ${selectedId}`,
      )
  }
}

export const formatRuntimeServiceConfigLogLines = (
  runtimeConfig: RuntimeServiceConfig,
): readonly string[] => [
  `Strategy execution adapter: ${runtimeConfig.metadata.id} (${runtimeConfig.metadata.label})`,
  `Strategy isolation boundary: ${runtimeConfig.metadata.isolationBoundary}`,
]
