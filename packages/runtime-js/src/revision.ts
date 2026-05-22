import {
  COMPATIBILITY_VERSIONS,
  defaultRuntimeMetadata,
  runtimeCompatibilityKey,
  StrategyRevisionSchema,
  type StrategyRevision,
  type StrategyRevisionMetadata,
  type StrategyRuntimeMetadata,
} from "@cowards/spec"
import { createStrategyRevisionId, hashStrategySource } from "./hash.js"
import { validateStrategySource } from "./validation.js"

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const entryValue of Object.values(value)) {
      deepFreeze(entryValue)
    }

    Object.freeze(value)
  }

  return value
}

export const buildStrategyRevision = (input: {
  source: string
  strategyId?: string | undefined
  metadata?: StrategyRevisionMetadata | undefined
  runtime?: StrategyRuntimeMetadata | undefined
}): StrategyRevision => {
  const validation = validateStrategySource(input.source)
  const sourceHash = hashStrategySource(input.source)
  const runtime = input.runtime ?? defaultRuntimeMetadata("typescript")
  const compatibilityKey = runtimeCompatibilityKey({
    runtime,
    sourceHash,
    specVersion: COMPATIBILITY_VERSIONS.spec,
    engineVersion: COMPATIBILITY_VERSIONS.engine,
  })
  const revision = StrategyRevisionSchema.parse({
    id: createStrategyRevisionId({
      sourceHash,
      runtimeVersion: runtime.adapter.version,
      specVersion: COMPATIBILITY_VERSIONS.spec,
      engineVersion: COMPATIBILITY_VERSIONS.engine,
      strategyRevisionVersion: COMPATIBILITY_VERSIONS.strategyRevision,
      strategyId: input.strategyId,
      runtimeCompatibility: compatibilityKey,
    }),
    ...(input.strategyId === undefined ? {} : { strategyId: input.strategyId }),
    source: input.source,
    sourceHash,
    sourceBytes: validation.sourceBytes,
    runtime,
    engineCompatibility: {
      spec: COMPATIBILITY_VERSIONS.spec,
      engine: COMPATIBILITY_VERSIONS.engine,
    },
    validation,
    metadata: input.metadata ?? {},
  })

  return deepFreeze(revision)
}

export const isValidStrategyRevision = (revision: unknown): boolean =>
  StrategyRevisionSchema.safeParse(revision).success
