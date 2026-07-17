import {
  createContainerSubprocessStrategyExecutionAdapter,
  createSubprocessStrategyExecutionAdapter,
  createWorkerThreadStrategyExecutionAdapter,
  type StrategyExecutionAdapter,
  type StrategyExecutionAdapterMetadata,
} from "@cowards/runtime-js/worker"
import type { ExecutableLaneIdentity, StrategyRevision } from "@cowards/spec"
import type { SuccessorRuntimeIdentityTemplateV117 } from "./successor-runtime-identity.js"
import {
  CURRENT_SEMANTIC_AUTHORITY_GENERATED,
  RUNTIME_ABI_V1_17,
  resolveSemanticAuthoritySelection,
  type SemanticAuthoritySelection,
} from "@cowards/spec"
import { isDeepStrictEqual } from "node:util"

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
  resolveSuccessorRuntimeIdentityTemplate?:
    | ((
        revision: StrategyRevision,
      ) => SuccessorRuntimeIdentityTemplateV117 | undefined)
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
  resolveSuccessorRuntimeIdentityTemplate(
    revision: StrategyRevision,
  ): SuccessorRuntimeIdentityTemplateV117 | undefined
  deploymentLaneRegistryId?: string | undefined
  semanticReceiptSecret: string
  contractSelection: RuntimeServiceContractSelection
  resolveContractSelectionForRequest(
    frozenSelection: unknown,
  ): RuntimeServiceContractSelection
}

export interface RuntimeServiceContractSelection {
  runtimeAbiVersion: string
  runtimeServiceVersion: string
  semanticReceiptVersion: string
  canonicalJsonVersion: string
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const runtimeServiceContractSelections = deepFreeze({
  "runtime-v1.17": {
    runtimeAbiVersion: RUNTIME_ABI_V1_17.versions.runtimeAbi,
    runtimeServiceVersion: RUNTIME_ABI_V1_17.versions.runtimeService,
    semanticReceiptVersion: RUNTIME_ABI_V1_17.versions.semanticReceipt,
    canonicalJsonVersion: RUNTIME_ABI_V1_17.versions.canonicalJson,
  },
  "runtime-v1.19": {
    runtimeAbiVersion: "strategy-runtime-abi-v1.19",
    runtimeServiceVersion: "runtime-execution-service-v1.18",
    semanticReceiptVersion: "runtime-semantic-receipt-v1.19",
    canonicalJsonVersion: "canonical-json-v1.1",
  },
} as const satisfies Record<string, RuntimeServiceContractSelection>)

const resolveExactSemanticAuthoritySelection = (
  value: unknown,
): SemanticAuthoritySelection | undefined => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return undefined
  }
  const semanticAuthorityKey = (value as Record<string, unknown>)[
    "semanticAuthorityKey"
  ]
  const canonical = resolveSemanticAuthoritySelection({ semanticAuthorityKey })
  return canonical !== undefined && isDeepStrictEqual(value, canonical)
    ? canonical
    : undefined
}

export const selectedRuntimeServiceContractForFrozenRequest = (
  fileCurrentSelection: unknown,
  frozenRequestSelection: unknown,
): RuntimeServiceContractSelection => {
  const fileCurrent =
    resolveExactSemanticAuthoritySelection(fileCurrentSelection)
  const requestCurrent = resolveExactSemanticAuthoritySelection(
    frozenRequestSelection,
  )
  if (fileCurrent === undefined || requestCurrent === undefined) {
    throw new RuntimeServiceConfigError(
      "Runtime semantic authority selection is missing or invalid.",
    )
  }
  if (!isDeepStrictEqual(fileCurrent, requestCurrent)) {
    throw new RuntimeServiceConfigError(
      "Runtime request semantic authority does not match file current.",
    )
  }
  return runtimeServiceContractSelections[fileCurrent.semanticAuthorityKey]
}

export const selectedRuntimeServiceContract =
  (): RuntimeServiceContractSelection =>
    selectedRuntimeServiceContractForFrozenRequest(
      CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection,
      CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection,
    )

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
  const resolveSuccessorRuntimeIdentityTemplate =
    input.resolveSuccessorRuntimeIdentityTemplate ?? (() => undefined)
  const contractSelection = selectedRuntimeServiceContract()
  const resolveContractSelectionForRequest = (frozenSelection: unknown) =>
    selectedRuntimeServiceContractForFrozenRequest(
      CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection,
      frozenSelection,
    )

  switch (selectedId) {
    case "worker-thread": {
      const adapter = createWorkerThreadStrategyExecutionAdapter()
      return {
        adapter,
        metadata: adapter.metadata,
        resolveDeploymentLaneIdentity,
        resolveSuccessorRuntimeIdentityTemplate,
        deploymentLaneRegistryId: input.deploymentLaneRegistryId,
        semanticReceiptSecret,
        contractSelection,
        resolveContractSelectionForRequest,
      }
    }
    case "subprocess": {
      const adapter = createSubprocessStrategyExecutionAdapter()
      return {
        adapter,
        metadata: adapter.metadata,
        resolveDeploymentLaneIdentity,
        resolveSuccessorRuntimeIdentityTemplate,
        deploymentLaneRegistryId: input.deploymentLaneRegistryId,
        semanticReceiptSecret,
        contractSelection,
        resolveContractSelectionForRequest,
      }
    }
    case "container-subprocess": {
      const adapter = createContainerSubprocessStrategyExecutionAdapter()
      return {
        adapter,
        metadata: adapter.metadata,
        resolveDeploymentLaneIdentity,
        resolveSuccessorRuntimeIdentityTemplate,
        deploymentLaneRegistryId: input.deploymentLaneRegistryId,
        semanticReceiptSecret,
        contractSelection,
        resolveContractSelectionForRequest,
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
  `Runtime contract tuple: ${runtimeConfig.contractSelection.runtimeAbiVersion} / ${runtimeConfig.contractSelection.runtimeServiceVersion} / ${runtimeConfig.contractSelection.semanticReceiptVersion} / ${runtimeConfig.contractSelection.canonicalJsonVersion}`,
]
