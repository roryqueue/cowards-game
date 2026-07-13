import {
  createDeploymentLaneIdentityResolver,
  loadDeploymentLaneRegistry,
} from "./deployment-lane-registry.js"
import { createRuntimeServiceConfig } from "./runtime-config.js"

export const runtimeServiceConfigFromEnvironment = (
  environment: Record<string, string | undefined> = process.env,
) => {
  const registry = loadDeploymentLaneRegistry(
    environment.COWARDS_RUNTIME_DEPLOYMENT_LANE_REGISTRY?.trim() ?? "",
  )
  return createRuntimeServiceConfig({
    strategyExecutionAdapter: environment.STRATEGY_EXECUTION_ADAPTER,
    allowLocalWorkerThreadFallback:
      environment.COWARDS_RUNTIME_SERVICE_ALLOW_LOCAL_WORKER_THREAD === "1",
    resolveDeploymentLaneIdentity:
      createDeploymentLaneIdentityResolver(registry),
    deploymentLaneRegistryId: registry.registryId,
    semanticReceiptSecret:
      environment.COWARDS_RUNTIME_SERVICE_SEMANTIC_RECEIPT_SECRET,
  })
}
