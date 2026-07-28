import { STRATEGY_RUNTIME_ABI_VERSION } from "@cowards/spec"
import {
  fourLanguageConformanceGateIds,
  fourLanguageGoldenSources,
  fourLanguagePrivateMarkers,
  type FourLanguageGoldenLanguageId,
  type FourLanguageGoldenStrategySource,
} from "./v1-32-language-corpus.js"

export const FOUR_LANGUAGE_CURRENT_CORPUS_VERSION =
  "four-language-current-corpus-v1.37" as const

export const fourLanguageCurrentPrivateMarkers = Object.freeze({
  strategyMemory: "V137_PRIVATE_STRATEGY_MEMORY",
  soldierMemory: "V137_PRIVATE_SOLDIER_MEMORY",
  objective: "V137_PRIVATE_OBJECTIVE",
})

export type FourLanguageCurrentLanguageId = FourLanguageGoldenLanguageId

const currentMarkerPairs = Object.freeze([
  [
    fourLanguagePrivateMarkers.strategyMemory,
    fourLanguageCurrentPrivateMarkers.strategyMemory,
  ],
  [
    fourLanguagePrivateMarkers.soldierMemory,
    fourLanguageCurrentPrivateMarkers.soldierMemory,
  ],
  [
    fourLanguagePrivateMarkers.objective,
    fourLanguageCurrentPrivateMarkers.objective,
  ],
] as const)

const projectCurrentSource = (
  source: FourLanguageGoldenStrategySource,
): Readonly<FourLanguageGoldenStrategySource> =>
  Object.freeze({
    ...source,
    source: currentMarkerPairs
      .reduce(
        (value, [historical, current]) => value.replaceAll(historical, current),
        source.source,
      )
      .replaceAll("strategy-runtime-abi-v1.14", STRATEGY_RUNTIME_ABI_VERSION),
  })

/**
 * Selected-current corpus derived without mutating the immutable v1.32 bytes.
 * The live ABI pointer is projected only into this explicitly versioned owner.
 */
export const fourLanguageCurrentSources = Object.freeze(
  fourLanguageGoldenSources.map(projectCurrentSource),
)

export const fourLanguageCurrentPairs = Object.freeze(
  fourLanguageCurrentSources.flatMap((bottom) =>
    fourLanguageCurrentSources.map((top) =>
      Object.freeze({
        bottomLanguageId: bottom.languageId,
        topLanguageId: top.languageId,
        pairId: bottom.languageId + "-vs-" + top.languageId,
      }),
    ),
  ),
)

export const fourLanguageCurrentConformanceGateIds = Object.freeze([
  ...fourLanguageConformanceGateIds,
])

export const fourLanguageCurrentConformanceRequirements = Object.freeze(
  fourLanguageCurrentConformanceGateIds.map((gateId) =>
    Object.freeze({
      gateId,
      requiredLanguageIds: Object.freeze(
        fourLanguageCurrentSources.map((source) => source.languageId),
      ),
      status: "required" as const,
    }),
  ),
)
