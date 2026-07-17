import {
  CURRENT_SEMANTIC_AUTHORITY_KEY,
  resolveCurrentSemanticAuthoritySelection,
} from "@cowards/spec"
import {
  createDeploymentLaneIdentityResolver,
  createSuccessorRuntimeIdentityTemplateResolver,
  loadDeploymentLaneRegistry,
} from "./deployment-lane-registry.js"
import { createRuntimeServiceConfig } from "./runtime-config.js"

export const runtimeServiceSemanticSelectionFromEnvironment = () => {
  const selection = resolveCurrentSemanticAuthoritySelection({
    semanticAuthorityKey: CURRENT_SEMANTIC_AUTHORITY_KEY,
  })
  if (selection === undefined) {
    throw new Error("Generated current semantic authority is unavailable.")
  }
  return selection
}

export const runtimeServiceConfigFromEnvironment = (
  environment: Record<string, string | undefined> = process.env,
) => {
  const registry = loadDeploymentLaneRegistry(
    environment.COWARDS_RUNTIME_DEPLOYMENT_LANE_REGISTRY?.trim() ?? "",
  )
  return {
    ...createRuntimeServiceConfig({
      strategyExecutionAdapter: environment.STRATEGY_EXECUTION_ADAPTER,
      allowLocalWorkerThreadFallback:
        environment.COWARDS_RUNTIME_SERVICE_ALLOW_LOCAL_WORKER_THREAD === "1",
      resolveDeploymentLaneIdentity:
        createDeploymentLaneIdentityResolver(registry),
      resolveSuccessorRuntimeIdentityTemplate:
        createSuccessorRuntimeIdentityTemplateResolver(registry),
      deploymentLaneRegistryId: registry.registryId,
      semanticReceiptSecret:
        environment.COWARDS_RUNTIME_SERVICE_SEMANTIC_RECEIPT_SECRET,
    }),
    semanticAuthoritySelection:
      runtimeServiceSemanticSelectionFromEnvironment(),
  }
}
