import { createHash } from "node:crypto"
import { z } from "zod"
import { StrategyRevisionSchema } from "./schemas.js"
import type {
  SourceLanguageStrategyArtifact,
  StrategyRevision,
  StrategyRevisionMetadata,
} from "./types.js"
import type { StrategyRuntimeMetadata } from "./runtime.js"
import { STRATEGY_RUNTIME_ABI_VERSION } from "./versions.js"

export const STRATEGY_RUNTIME_ABI_VERSION_V1_17 =
  "strategy-runtime-abi-v1.17" as const
export const STRATEGY_PROVIDER_VALIDATION_CONTRACT_V1_17 =
  "runtime-provider-validation-v1.17" as const

export interface StrategyProviderValidationInputV117 {
  providerId: string
  contractVersion: typeof STRATEGY_PROVIDER_VALIDATION_CONTRACT_V1_17
  sourceHash: string
  sourceBytes: number
  artifactHash: string
  artifactBytes: number
}

export const hashStrategyProviderValidationV117 = (
  input: StrategyProviderValidationInputV117,
): `sha256:${string}` =>
  `sha256:${createHash("sha256")
    .update("cowards-game:strategy-provider-validation:v1.17\0", "utf8")
    .update(JSON.stringify(input), "utf8")
    .digest("hex")}`

export type StrategyRuntimeMetadataV117 = Omit<
  StrategyRuntimeMetadata,
  "abiVersion"
> & {
  abiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION_V1_17
}

export type SourceLanguageStrategyArtifactV117 = Omit<
  SourceLanguageStrategyArtifact,
  "abiVersion"
> & {
  abiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION_V1_17
}

export type StrategyRevisionMetadataV117 = Omit<
  StrategyRevisionMetadata,
  "sourceArtifact"
> & {
  sourceArtifact: SourceLanguageStrategyArtifactV117
  providerValidation: NonNullable<
    StrategyRevisionMetadata["providerValidation"]
  >
}

export type StrategyRevisionV117 = Omit<
  StrategyRevision,
  "runtime" | "metadata"
> & {
  runtime: StrategyRuntimeMetadataV117
  metadata: StrategyRevisionMetadataV117
}

const toCurrentSchemaShape = (
  revision: StrategyRevisionV117,
): StrategyRevision => ({
  ...revision,
  runtime: {
    ...revision.runtime,
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
  },
  metadata: {
    ...revision.metadata,
    sourceArtifact: {
      ...revision.metadata.sourceArtifact,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    },
  },
})

/**
 * Candidate-only revision admission. This is intentionally separate from the
 * public StrategyRevisionSchema so preparing v1.17 evidence cannot activate
 * v1.17 submissions or defaults before the atomic pointer changes.
 */
export const StrategyRevisionV117Schema = z.custom<StrategyRevisionV117>(
  (input) => {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      return false
    }
    const revision = input as StrategyRevisionV117
    const artifact = revision.metadata?.sourceArtifact
    const validation = revision.metadata?.providerValidation
    if (
      revision.runtime?.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION_V1_17 ||
      revision.runtime.package?.mode !== "none" ||
      revision.runtime.requiredCapabilities?.length !== 0 ||
      revision.runtime.limits?.environment !== "empty" ||
      revision.runtime.limits.filesystem !== "none" ||
      revision.runtime.limits.network !== "disabled" ||
      revision.runtime.limits.shell !== "disabled" ||
      revision.runtime.limits.packagePolicy !== "none" ||
      artifact?.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION_V1_17 ||
      artifact.validationStatus !== "valid" ||
      validation === undefined ||
      validation.contractVersion !==
        STRATEGY_PROVIDER_VALIDATION_CONTRACT_V1_17 ||
      validation.sourceHash !== revision.sourceHash ||
      validation.sourceBytes !== revision.sourceBytes ||
      validation.artifactHash !== artifact.hash ||
      validation.artifactBytes !== artifact.bytes ||
      validation.proof !==
        hashStrategyProviderValidationV117({
          providerId: validation.providerId,
          contractVersion: validation.contractVersion,
          sourceHash: validation.sourceHash,
          sourceBytes: validation.sourceBytes,
          artifactHash: validation.artifactHash,
          artifactBytes: validation.artifactBytes,
        }) ||
      revision.validation.runtimeVersion !== revision.runtime.adapter.version ||
      revision.validation.engineCompatibility.spec !==
        revision.engineCompatibility.spec ||
      revision.validation.engineCompatibility.engine !==
        revision.engineCompatibility.engine
    ) {
      return false
    }
    return StrategyRevisionSchema.safeParse(toCurrentSchemaShape(revision))
      .success
  },
  { error: "v1.17 candidate Strategy Revision is invalid" },
)
