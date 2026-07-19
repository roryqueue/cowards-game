import {
  CURRENT_SEMANTIC_AUTHORITY_KEY,
  resolveCurrentSemanticAuthoritySelection,
} from "@cowards/spec"
import { createPrivateKey, createPublicKey, sign } from "node:crypto"
import { readFileSync } from "node:fs"
import type { RuntimeSemanticReceiptSignerV118 } from "./semantic-receipt-v1-18-issuer.js"
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
      containerImage: environment.COWARDS_RUNTIME_TYPESCRIPT_CONTAINER_IMAGE,
      pythonContainerImage:
        environment.COWARDS_RUNTIME_PYTHON_CONTAINER_IMAGE,
    }),
    semanticAuthoritySelection:
      runtimeServiceSemanticSelectionFromEnvironment(),
  }
}

const requiredEnvironmentPath = (
  environment: Record<string, string | undefined>,
  name: string,
): string => {
  const value = environment[name]?.trim()
  if (!value) throw new Error(`Runtime service requires ${name}.`)
  return value
}

export const runtimeSemanticReceiptSignerV118FromEnvironment = (
  environment: Record<string, string | undefined> = process.env,
): RuntimeSemanticReceiptSignerV118 => {
  const keyId = requiredEnvironmentPath(
    environment,
    "COWARDS_RUNTIME_V118_RECEIPT_KEY_ID",
  )
  const privateKey = createPrivateKey(
    readFileSync(
      requiredEnvironmentPath(
        environment,
        "COWARDS_RUNTIME_V118_RECEIPT_PRIVATE_KEY_PATH",
      ),
    ),
  )
  const publicKeyPem = createPublicKey(privateKey)
    .export({ type: "spki", format: "pem" })
    .toString()
  return Object.freeze({
    keyId,
    publicKeyPem,
    sign: (bytes: Uint8Array) => new Uint8Array(sign(null, bytes, privateKey)),
  })
}
