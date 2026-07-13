import {
  createContainerSubprocessStrategyExecutionAdapter,
  createSubprocessStrategyExecutionAdapter,
  createWorkerThreadStrategyExecutionAdapter,
  type StrategyExecutionAdapter,
  type StrategyExecutionAdapterMetadata,
} from "@cowards/runtime-js/worker"
import type { ExecutableLaneIdentity, StrategyRevision } from "@cowards/spec"

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
  resolveDeploymentLaneIdentity?:
    | ((revision: StrategyRevision) => ExecutableLaneIdentity | undefined)
    | undefined
  deploymentLaneRegistryId?: string | undefined
  semanticReceiptSecret?: string | undefined
}

export interface RuntimeServiceConfig {
  adapter: StrategyExecutionAdapter
  metadata: StrategyExecutionAdapterMetadata
  resolveDeploymentLaneIdentity(
    revision: StrategyRevision,
  ): ExecutableLaneIdentity | undefined
  deploymentLaneRegistryId?: string | undefined
  semanticReceiptSecret: string
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
  const semanticReceiptSecret = input.semanticReceiptSecret?.trim()
  if (!semanticReceiptSecret) {
    throw new RuntimeServiceConfigError(
      "Runtime service requires COWARDS_RUNTIME_SERVICE_SEMANTIC_RECEIPT_SECRET.",
    )
  }

  const resolveDeploymentLaneIdentity =
    input.resolveDeploymentLaneIdentity ?? (() => undefined)

  switch (selectedId) {
    case "worker-thread": {
      const adapter = createWorkerThreadStrategyExecutionAdapter()
      return {
        adapter,
        metadata: adapter.metadata,
        resolveDeploymentLaneIdentity,
        deploymentLaneRegistryId: input.deploymentLaneRegistryId,
        semanticReceiptSecret,
      }
    }
    case "subprocess": {
      const adapter = createSubprocessStrategyExecutionAdapter()
      return {
        adapter,
        metadata: adapter.metadata,
        resolveDeploymentLaneIdentity,
        deploymentLaneRegistryId: input.deploymentLaneRegistryId,
        semanticReceiptSecret,
      }
    }
    case "container-subprocess": {
      const adapter = createContainerSubprocessStrategyExecutionAdapter()
      return {
        adapter,
        metadata: adapter.metadata,
        resolveDeploymentLaneIdentity,
        deploymentLaneRegistryId: input.deploymentLaneRegistryId,
        semanticReceiptSecret,
      }
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
  `Deployment lane registry: ${runtimeConfig.deploymentLaneRegistryId ?? "unconfigured (fail closed)"}`,
]
