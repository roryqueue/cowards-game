import { describe, expect, it } from "vitest"
import {
  fourLanguageConformanceGateIds,
  fourLanguageConformanceRequirements,
  fourLanguageGoldenPairs,
  fourLanguageGoldenSources,
  fourLanguagePrivateMarkers,
  FOUR_LANGUAGE_GOLDEN_CORPUS_VERSION,
  type FourLanguageGoldenLanguageId,
} from "@cowards/golden"
import {
  DEFAULT_RUNTIME_LIMITS,
  INITIAL_BOUNDS,
  RUNTIME_EXECUTION_SERVICE_VERSION,
  type RuntimeExecutionServiceRequest,
  type StrategyRevision,
} from "@cowards/spec"
import { buildStrategyRevision } from "@cowards/runtime-js"
import { buildPythonStrategyRevision } from "@cowards/runtime-python"
import {
  buildRustStrategyRevision,
  buildZigStrategyRevision,
  compileRustWasmArtifact,
  compileZigWasmArtifact,
} from "@cowards/runtime-wasm-wasi"
import {
  createChronicleContentHash,
  projectPublicChronicle,
} from "@cowards/replay"
import { executeRuntimeServiceRequest } from "./execute-match.js"
import { createRuntimeServiceConfig } from "./runtime-config.js"

const runtimeConfig = createRuntimeServiceConfig({
  strategyExecutionAdapter: "worker-thread",
})

const sourceFor = (
  languageId: FourLanguageGoldenLanguageId,
): (typeof fourLanguageGoldenSources)[number] => {
  const source = fourLanguageGoldenSources.find(
    (candidate) => candidate.languageId === languageId,
  )
  if (!source) {
    throw new Error(`Missing golden source for ${languageId}.`)
  }
  return source
}

const rustCompileProbe = compileRustWasmArtifact(sourceFor("rust").source)
const zigCompileProbe = compileZigWasmArtifact(sourceFor("zig").source)

const availableLanguages = fourLanguageGoldenSources
  .filter((source) => {
    if (source.languageId === "rust") {
      return rustCompileProbe.ok
    }
    if (source.languageId === "zig") {
      return zigCompileProbe.ok
    }
    return true
  })
  .map((source) => source.languageId)

const buildRevision = (
  languageId: FourLanguageGoldenLanguageId,
): StrategyRevision => {
  const source = sourceFor(languageId).source
  switch (languageId) {
    case "typescript":
      return buildStrategyRevision({
        source,
        strategyId: "strategy:golden:typescript",
      })
    case "python":
      return buildPythonStrategyRevision({
        source,
        strategyId: "strategy:golden:python",
      })
    case "rust":
      return buildRustStrategyRevision({
        source,
        strategyId: "strategy:golden:rust",
      })
    case "zig":
      return buildZigStrategyRevision({
        source,
        strategyId: "strategy:golden:zig",
      })
  }
}

const requestForPair = (input: {
  pairId: string
  bottom: StrategyRevision
  top: StrategyRevision
}): RuntimeExecutionServiceRequest => ({
  contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
  kind: "executeMatch",
  requestId: `runtime-request:golden:v1.32:${input.pairId}`,
  match: {
    matchId: `match:golden:v1.32:${input.pairId}`,
    seed: "seed:golden:v1.32",
    arenaVariant: {
      id: "arena:golden:v1.32",
      name: "v1.32 Four-Language Golden Arena",
      initialBounds: INITIAL_BOUNDS,
      terrainStones: [],
    },
    bottomPlayerId: "player:bottom",
    topPlayerId: "player:top",
    bottomStrategyRevisionId: input.bottom.id,
    topStrategyRevisionId: input.top.id,
    maxPhases: 1,
  },
  strategies: { bottom: input.bottom, top: input.top },
  limits: {
    ...DEFAULT_RUNTIME_LIMITS,
    stdoutBytes: 32 * 1024,
  },
})

const markerValues = Object.values(fourLanguagePrivateMarkers)

describe("v1.32 four-language golden Strategy corpus", () => {
  it("declares equivalent golden Strategy sources and all pairwise combinations", () => {
    expect(FOUR_LANGUAGE_GOLDEN_CORPUS_VERSION).toBe(
      "four-language-golden-corpus-v1.32",
    )
    expect(fourLanguageGoldenSources.map((source) => source.languageId)).toEqual(
      ["typescript", "python", "rust", "zig"],
    )
    expect(
      new Set(fourLanguageGoldenSources.map((source) => source.behavior)),
    ).toEqual(new Set(["first-active-turn-to-stone"]))
    expect(fourLanguageGoldenPairs).toHaveLength(
      fourLanguageGoldenSources.length * fourLanguageGoldenSources.length,
    )
  })

  it("declares required conformance gates for every supported language", () => {
    expect(fourLanguageConformanceGateIds).toEqual([
      "valid-behavior",
      "invalid-output",
      "timeout",
      "oversized-output",
      "forbidden-capability",
      "memory-heavy-output",
      "deterministic-repeat",
      "runtime-unavailable",
      "malformed-runtime-result",
      "missing-or-stale-artifact",
      "no-silent-fallback",
      "public-result-replay-shape",
      "privacy-parity",
    ])
    for (const gate of fourLanguageConformanceRequirements) {
      expect(gate.status).toBe("required")
      expect(gate.requiredLanguageIds).toEqual([
        "typescript",
        "python",
        "rust",
        "zig",
      ])
    }
  })

  it(
    "executes locally available golden pairwise matrix with result/replay parity and public privacy",
    () => {
      expect(availableLanguages).toEqual([
        "typescript",
        "python",
        "rust",
        "zig",
      ])
      const revisions = new Map(
        availableLanguages.map((languageId) => [
          languageId,
          buildRevision(languageId),
        ]),
      )
      const expectedPairs = fourLanguageGoldenPairs.filter(
        (pair) =>
          revisions.has(pair.bottomLanguageId) &&
          revisions.has(pair.topLanguageId),
      )
      const results = expectedPairs.map((pair) => {
        const bottom = revisions.get(pair.bottomLanguageId)
        const top = revisions.get(pair.topLanguageId)
        if (!bottom || !top) {
          throw new Error(`Missing revisions for ${pair.pairId}.`)
        }
        const response = executeRuntimeServiceRequest(
          requestForPair({ pairId: pair.pairId, bottom, top }),
          runtimeConfig,
        )
        expect(response.ok).toBe(true)
        if (!response.ok) {
          throw new Error(response.systemFailure.message)
        }
        expect(response.result.runtimeViolationEventCount).toBe(0)
        return { pair, response }
      })

      expect(results.map((result) => result.pair.pairId)).toEqual(
        expectedPairs.map((pair) => pair.pairId),
      )
      expect(results).toHaveLength(availableLanguages.length ** 2)
      expect(new Set(results.map((result) => result.response.result.privacy))).toEqual(
        new Set(["internal_runtime_result"]),
      )
      expect(
        new Set(
          results.map((result) =>
            JSON.stringify(result.response.result.finalState.outcome),
          ),
        ).size,
      ).toBe(1)
      for (const { response } of results) {
        const eventTypes = response.result.chronicle.events.map(
          (event) => event.type,
        )
        expect(eventTypes).toContain("MATCH_STARTED")
        expect(eventTypes).toContain("STRATEGY_EVALUATED")
        expect(eventTypes).toContain("ACTION_EMITTED")
        expect(eventTypes).toContain("MATCH_ENDED")
        const publicChronicle = projectPublicChronicle({
          ...response.result.chronicle,
          integrity: createChronicleContentHash(response.result.chronicle),
        })
        expect(publicChronicle.schemaVersion).toBe("chronicle-v1.4")
        expect(publicChronicle.events.length).toBeGreaterThan(0)
        const serialized = JSON.stringify(publicChronicle)
        for (const marker of markerValues) {
          expect(serialized).not.toContain(marker)
        }
      }
    },
    120_000,
  )

  it("fails closed when locally available WASM corpus artifacts are missing", () => {
    for (const languageId of availableLanguages.filter(
      (candidate) => candidate === "rust" || candidate === "zig",
    )) {
      const revision = buildRevision(languageId)
      const brokenRevision: StrategyRevision = {
        ...revision,
        metadata: {
          ...revision.metadata,
          compiledArtifact: undefined,
        },
      }
      const response = executeRuntimeServiceRequest(
        requestForPair({
          pairId: `${languageId}-missing-artifact`,
          bottom: brokenRevision,
          top: brokenRevision,
        }),
        runtimeConfig,
      )

      expect(response.ok).toBe(false)
      if (!response.ok) {
        expect(response.systemFailure.code).toBe("MALFORMED_REQUEST")
        expect(JSON.stringify(response)).not.toContain(sourceFor(languageId).source)
      }
    }
  }, 60_000)
})
