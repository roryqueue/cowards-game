import {
  COMPATIBILITY_VERSIONS,
  StrategyRevisionSchema,
  type StrategyRevision,
  type StrategyRevisionMetadata,
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
}): StrategyRevision => {
  const validation = validateStrategySource(input.source)
  const sourceHash = hashStrategySource(input.source)
  const revision = StrategyRevisionSchema.parse({
    id: createStrategyRevisionId({
      sourceHash,
      runtimeVersion: COMPATIBILITY_VERSIONS.runtimeJs,
      specVersion: COMPATIBILITY_VERSIONS.spec,
      engineVersion: COMPATIBILITY_VERSIONS.engine,
      strategyRevisionVersion: COMPATIBILITY_VERSIONS.strategyRevision,
      strategyId: input.strategyId,
    }),
    ...(input.strategyId === undefined ? {} : { strategyId: input.strategyId }),
    source: input.source,
    sourceHash,
    sourceBytes: validation.sourceBytes,
    runtime: {
      name: "runtime-js",
      version: COMPATIBILITY_VERSIONS.runtimeJs,
    },
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
