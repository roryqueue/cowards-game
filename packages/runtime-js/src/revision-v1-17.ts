import {
  CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE,
  COMPATIBILITY_VERSIONS,
  STRATEGY_RUNTIME_ABI_VERSION_V1_17,
  STRATEGY_PROVIDER_VALIDATION_CONTRACT_V1_17,
  StrategyRevisionV117Schema,
  defaultRuntimeMetadata,
  hashStrategyProviderValidationV117,
  runtimeCompatibilityKey,
  type StrategyRevisionMetadata,
  type SourceLanguageStrategyRevisionV117,
  type StrategyRuntimeMetadataV117,
} from "@cowards/spec"
import { createStrategyRevisionId, hashStrategySource } from "./hash.js"
import { buildTypeScriptSourceArtifactV117 } from "./source-artifact.js"
import { validateStrategySource } from "./validation.js"

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const entryValue of Object.values(value)) deepFreeze(entryValue)
    Object.freeze(value)
  }
  return value
}

export const buildStrategyRevisionV117 = (input: {
  source: string
  strategyId?: string | undefined
  providerId?: string | undefined
  metadata?: Omit<
    StrategyRevisionMetadata,
    "providerValidation" | "sourceArtifact" | "compiledArtifact"
  >
}): SourceLanguageStrategyRevisionV117 => {
  const currentRuntime = defaultRuntimeMetadata("typescript")
  const runtime: StrategyRuntimeMetadataV117 = {
    ...currentRuntime,
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION_V1_17,
    limits: {
      ...currentRuntime.limits,
      environment: "empty",
      filesystem: "none",
      network: "disabled",
      shell: "disabled",
      packagePolicy: "none",
    },
  }
  const validation = validateStrategySource(input.source, {
    runtimeVersion: runtime.adapter.version,
    specVersion: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.rules,
    engineVersion: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.engine,
  })
  if (!validation.valid) {
    throw new TypeError("v1.17 candidate Strategy source is invalid.")
  }
  const sourceArtifact = buildTypeScriptSourceArtifactV117({
    source: input.source,
    validation,
    runtime: currentRuntime,
  })
  if (sourceArtifact === null) {
    throw new TypeError("v1.17 candidate Strategy artifact is unavailable.")
  }
  const sourceHash = hashStrategySource(input.source)
  const compatibility = runtimeCompatibilityKey({
    runtime,
    sourceHash,
    artifactHash: sourceArtifact.hash,
    specVersion: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.rules,
    engineVersion: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.engine,
  })
  const providerId = input.providerId ?? "strategy-language-provider-js-ts"
  const contractVersion = STRATEGY_PROVIDER_VALIDATION_CONTRACT_V1_17
  const providerValidationInput = {
    providerId,
    contractVersion,
    sourceHash,
    sourceBytes: validation.sourceBytes,
    artifactHash: sourceArtifact.hash,
    artifactBytes: sourceArtifact.bytes,
  }
  const revision = {
    id: createStrategyRevisionId({
      sourceHash,
      runtimeVersion: runtime.adapter.version,
      specVersion: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.rules,
      engineVersion: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.engine,
      strategyRevisionVersion: COMPATIBILITY_VERSIONS.strategyRevision,
      strategyId: input.strategyId,
      runtimeCompatibility: compatibility,
    }),
    ...(input.strategyId === undefined ? {} : { strategyId: input.strategyId }),
    source: input.source,
    sourceHash,
    sourceBytes: validation.sourceBytes,
    runtime,
    engineCompatibility: {
      spec: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.rules,
      engine: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.engine,
    },
    validation,
    metadata: {
      ...input.metadata,
      providerValidation: {
        ...providerValidationInput,
        proof: hashStrategyProviderValidationV117(providerValidationInput),
      },
      sourceArtifact,
    },
  }
  return deepFreeze(
    StrategyRevisionV117Schema.parse(revision),
  ) as SourceLanguageStrategyRevisionV117
}
