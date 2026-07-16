import { describe, expect, it } from "vitest"
import {
  fourLanguageCurrentConformanceGateIds,
  fourLanguageCurrentConformanceRequirements,
  fourLanguageCurrentPairs,
  fourLanguageCurrentSources,
  fourLanguageCurrentPrivateMarkers,
  FOUR_LANGUAGE_CURRENT_CORPUS_VERSION,
  type FourLanguageCurrentLanguageId,
} from "@cowards/golden"
import {
  DEFAULT_RUNTIME_LIMITS,
  HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16,
  INITIAL_BOUNDS,
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
import { executeRuntimeServiceRequest as executeRuntimeServiceRequestWithAuthority } from "./execute-match.js"
import {
  createFixtureRuntimeEvidenceAuthorityLoader,
  createFixtureDeploymentLaneIdentity,
  createFixtureRuntimeExecutionEvidenceSnapshot,
} from "./runtime-execution-evidence.test-support.js"
import { createRuntimeServiceConfig } from "./runtime-config.js"
import { RETAINED_FOUR_LANGUAGE_PARITY_CERTIFICATION_STATUS } from "./four-language-conformance-runner.js"

const runtimeConfig = createRuntimeServiceConfig({
  strategyExecutionAdapter: "worker-thread",
  semanticReceiptSecret: "fixture-semantic-receipt-secret-v1",
  resolveDeploymentLaneIdentity: createFixtureDeploymentLaneIdentity,
})

const executeRuntimeServiceRequest = (
  request: RuntimeExecutionServiceRequest,
  _config = runtimeConfig,
) =>
  executeRuntimeServiceRequestWithAuthority(request, runtimeConfig, {
    authorityLoader: createFixtureRuntimeEvidenceAuthorityLoader(
      request.evidenceSnapshot,
      request.strategies,
    ),
  })

const sourceFor = (
  languageId: FourLanguageCurrentLanguageId,
): (typeof fourLanguageCurrentSources)[number] => {
  const source = fourLanguageCurrentSources.find(
    (candidate) => candidate.languageId === languageId,
  )
  if (!source) {
    throw new Error(`Missing golden source for ${languageId}.`)
  }
  return source
}

const rustCompileProbe = compileRustWasmArtifact(sourceFor("rust").source)
const zigCompileProbe = compileZigWasmArtifact(sourceFor("zig").source)

const availableLanguages = fourLanguageCurrentSources
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

const builtRevisionCache = new Map<
  FourLanguageCurrentLanguageId,
  StrategyRevision
>()

const buildRevision = (
  languageId: FourLanguageCurrentLanguageId,
): StrategyRevision => {
  const cached = builtRevisionCache.get(languageId)
  if (cached !== undefined) return cached

  const source = sourceFor(languageId).source
  const revision = (() => {
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
  })()
  builtRevisionCache.set(languageId, revision)
  return revision
}

const requestForPair = (input: {
  pairId: string
  bottom: StrategyRevision
  top: StrategyRevision
}): RuntimeExecutionServiceRequest => ({
  contractVersion:
    HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeServiceVersion,
  kind: "executeMatch",
  requestId: `runtime-request:golden:v1.37:${input.pairId}`,
  match: {
    matchId: `match:golden:v1.37:${input.pairId}`,
    seed: "seed:golden:v1.37",
    arenaVariant: {
      id: "arena:golden:v1.37",
      name: "v1.37 Current Four-Language Golden Arena",
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
  evidenceSnapshot: createFixtureRuntimeExecutionEvidenceSnapshot({
    fixtureId: `four-language:${input.pairId}`,
    bottom: input.bottom,
    top: input.top,
  }),
})

const markerValues = Object.values(fourLanguageCurrentPrivateMarkers)
const legacyMatchServiceIsSelected =
  runtimeConfig.contractSelection.runtimeServiceVersion ===
  HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeServiceVersion

describe("v1.37 retained four-language corpus readiness", () => {
  it("is explicitly retained as non-promoting regression evidence", () => {
    expect(RETAINED_FOUR_LANGUAGE_PARITY_CERTIFICATION_STATUS).toBe(
      "non_promoting_regression_only",
    )
  })

  it("declares equivalent golden Strategy sources and all pairwise combinations", () => {
    expect(FOUR_LANGUAGE_CURRENT_CORPUS_VERSION).toBe(
      "four-language-current-corpus-v1.37",
    )
    expect(
      fourLanguageCurrentSources.map((source) => source.languageId),
    ).toEqual(["typescript", "python", "rust", "zig"])
    expect(
      new Set(fourLanguageCurrentSources.map((source) => source.behavior)),
    ).toEqual(new Set(["first-active-turn-to-stone"]))
    expect(fourLanguageCurrentPairs).toHaveLength(
      fourLanguageCurrentSources.length * fourLanguageCurrentSources.length,
    )
    expect(Object.isFrozen(fourLanguageCurrentSources)).toBe(true)
    expect(
      fourLanguageCurrentSources.every((source) => Object.isFrozen(source)),
    ).toBe(true)
    expect(Object.isFrozen(fourLanguageCurrentPairs)).toBe(true)
    expect(
      fourLanguageCurrentPairs.every((pair) => Object.isFrozen(pair)),
    ).toBe(true)
  })

  it("declares required conformance gates for every supported language", () => {
    expect(fourLanguageCurrentConformanceGateIds).toEqual([
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
    for (const gate of fourLanguageCurrentConformanceRequirements) {
      expect(Object.isFrozen(gate)).toBe(true)
      expect(Object.isFrozen(gate.requiredLanguageIds)).toBe(true)
      expect(gate.status).toBe("required")
      expect(gate.requiredLanguageIds).toEqual([
        "typescript",
        "python",
        "rust",
        "zig",
      ])
    }
  })

  it("executes the pairwise matrix only through the selected service contract", () => {
    expect(availableLanguages).toEqual(["typescript", "python", "rust", "zig"])
    const revisions = new Map(
      availableLanguages.map((languageId) => [
        languageId,
        buildRevision(languageId),
      ]),
    )
    const expectedPairs = fourLanguageCurrentPairs.filter(
      (pair) =>
        revisions.has(pair.bottomLanguageId) &&
        revisions.has(pair.topLanguageId),
    )
    if (!legacyMatchServiceIsSelected) {
      const failures = expectedPairs.map((pair) => {
        const bottom = revisions.get(pair.bottomLanguageId)
        const top = revisions.get(pair.topLanguageId)
        if (!bottom || !top) {
          throw new Error(`Missing revisions for ${pair.pairId}.`)
        }
        return executeRuntimeServiceRequest(
          requestForPair({ pairId: pair.pairId, bottom, top }),
          runtimeConfig,
        )
      })
      expect(failures).toHaveLength(availableLanguages.length ** 2)
      for (const response of failures) {
        expect(response).toMatchObject({
          ok: false,
          kind: "systemFailure",
          systemFailure: {
            code: "UNSUPPORTED_RUNTIME_ADAPTER",
            retryable: false,
          },
        })
        expect(JSON.stringify(response)).not.toMatch(
          /source|artifact|memory|objective|diagnostics|\/Users\//u,
        )
      }
      return
    }
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
    expect(
      new Set(results.map((result) => result.response.result.privacy)),
    ).toEqual(new Set(["internal_runtime_result"]))
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
  }, 120_000)

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
        expect(JSON.stringify(response)).not.toContain(
          sourceFor(languageId).source,
        )
      }
    }
  }, 60_000)
})
