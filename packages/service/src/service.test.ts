import { describe, expect, it } from "vitest"
import {
  EXHIBITION_SCORING_POLICY_V1,
  SERVICE_API_VERSION,
  STRATEGY_RUNTIME_ABI_VERSION,
  type PublicMatchSetResultDto,
  type PublicStrategyCardDto,
} from "@cowards/spec"
import type { StoredChronicle } from "@cowards/persistence/chronicle-store"
import { createCowardsLocalService } from "./index.js"

const publicResult = {
  matchSetId: "match-set:demo",
  preset: {
    id: "smoke-exhibition-v1",
    version: "v1",
    label: "Smoke exhibition",
  },
  status: "complete",
  visibility: "public",
  scoringPolicy: EXHIBITION_SCORING_POLICY_V1,
  entrants: [],
  standings: [],
  matches: [],
  provenance: {
    matchSetId: "match-set:demo",
    presetId: "smoke-exhibition-v1",
    scoringPolicyVersion: "v1",
    entrantSnapshotIds: [],
    chronicleHashes: [],
  },
  publication: {
    publicResults: true,
    publicReplayEvidence: true,
    privateFieldsExcluded: ["Strategy source"],
  },
} satisfies PublicMatchSetResultDto

const runtime = {
  abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
  language: { id: "typescript", version: "runtime-js-v1" },
  adapter: {
    id: "runtime-js-worker-thread",
    version: "runtime-js-v1",
  },
  package: { mode: "none", entrypoint: "default" },
  requiredCapabilities: [],
} satisfies PublicStrategyCardDto["runtime"]

const publicStrategyCard = {
  strategyId: "strategy:demo",
  strategyRevisionId: "strategy-revision:demo",
  name: "Demo Strategy",
  description: "Public strategy summary",
  tags: ["starter"],
  authorHandle: "demo-player",
  sourceHash: "sourcehash-demo",
  sourceBytes: 256,
  runtime,
  engineCompatibility: {
    spec: "cowards-rules-v1.4",
    engine: "engine-v1",
  },
  validationStatus: "valid",
  record: {
    wins: 2,
    losses: 1,
    draws: 0,
    points: 6,
  },
  resultLinks: ["/matchsets/match-set:demo"],
  replayLinks: ["/matches/match:demo/replay"],
} satisfies PublicStrategyCardDto

const storedChronicle = {
  metadata: {
    id: "chronicle:demo",
    matchId: "match:demo",
    schemaVersion: "chronicle-v1.4",
    hash: "chroniclehash-demo",
    outcome: { type: "DRAW" },
    eventCount: 2,
    snapshotCount: 1,
    bottomPlayerId: "player:bottom",
    topPlayerId: "player:top",
    bottomStrategyRevisionId: "strategy-revision:bottom",
    topStrategyRevisionId: "strategy-revision:top",
    arenaVariantId: "arena:standard",
  },
  artifact: {
    schemaVersion: "chronicle-v1.4",
    events: [{}, {}],
    snapshots: [{}],
  },
} as unknown as StoredChronicle

describe("createCowardsLocalService", () => {
  it("returns stable health metadata", () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
    })

    expect(service.health()).toEqual({
      ok: true,
      service: "cowards-service",
      version: SERVICE_API_VERSION,
    })
  })

  it("wraps public MatchSet summaries in a service envelope", async () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      buildPublicMatchSetResult: async (_pool, _matchSetId) => publicResult,
    })

    await expect(
      service.getPublicMatchSetSummary("match-set:demo"),
    ).resolves.toEqual({
      apiVersion: SERVICE_API_VERSION,
      kind: "publicMatchSetSummary",
      matchSetId: "match-set:demo",
      result: publicResult,
    })
  })

  it("parses public MatchSet summaries through the public service schema", async () => {
    const resultWithPrivateRuntimeLimits = {
      ...publicResult,
      entrants: [
        {
          entrantId: "entrant:demo",
          entrantIndex: 0,
          strategyRevisionId: "strategy-revision:demo",
          ownerUserId: "user:demo",
          ownerHandle: "demo-player",
          displayLabel: "Demo Strategy",
          sourceHash: "sourcehash-demo",
          sourceBytes: 256,
          runtime: {
            ...runtime,
            limits: {
              timeoutMs: 1000,
              memoryBytes: 64 * 1024 * 1024,
            },
          },
          engineCompatibility: {
            spec: "cowards-rules-v1.4",
            engine: "engine-v1",
          },
          lockedAt: "2026-05-22T00:00:00.000Z",
        },
      ],
    } as unknown as PublicMatchSetResultDto
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      buildPublicMatchSetResult: async () => resultWithPrivateRuntimeLimits,
    })

    const summary = await service.getPublicMatchSetSummary("match-set:demo")

    expect(summary?.result.entrants[0]?.runtime).toEqual(runtime)
    expect(JSON.stringify(summary)).not.toContain("timeoutMs")
    expect(JSON.stringify(summary)).not.toContain("memoryBytes")
  })

  it("wraps public Strategy cards in a public page service envelope", async () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      buildPublicStrategyCard: async (_pool, _strategyId) => publicStrategyCard,
    })

    await expect(
      service.getPublicStrategyPage("strategy:demo"),
    ).resolves.toEqual({
      apiVersion: SERVICE_API_VERSION,
      kind: "publicPage",
      page: "strategy",
      canonicalHref: "/strategies/strategy%3Ademo",
      payload: {
        strategy: publicStrategyCard,
      },
    })
  })

  it("returns null for missing public Strategy cards", async () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      buildPublicStrategyCard: async () => null,
    })

    await expect(
      service.getPublicStrategyPage("strategy:missing"),
    ).resolves.toBe(null)
  })

  it("rejects public Strategy page DTOs with private fields", async () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      buildPublicStrategyCard: async () =>
        ({
          ...publicStrategyCard,
          source: "export default strategy",
        }) as unknown as PublicStrategyCardDto,
    })

    await expect(
      service.getPublicStrategyPage("strategy:demo"),
    ).rejects.toThrow("Public service DTO leaks private field")
  })

  it("returns parsed public replay metadata and null for missing Chronicles", async () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async (matchId) =>
          matchId === "match:demo" ? storedChronicle : null,
        put: async () => storedChronicle,
      }),
    })

    await expect(
      service.getPublicReplayMetadata("match:demo"),
    ).resolves.toEqual({
      apiVersion: SERVICE_API_VERSION,
      kind: "publicReplayMetadata",
      matchId: "match:demo",
      metadata: {
        matchId: "match:demo",
        chronicleId: "chronicle:demo",
        hash: "chroniclehash-demo",
        schemaVersion: "chronicle-v1.4",
        eventCount: 2,
        snapshotCount: 1,
        bottomPlayerId: "player:bottom",
        topPlayerId: "player:top",
        arenaVariantId: "arena:standard",
      },
    })
    await expect(
      service.getPublicReplayMetadata("match:missing"),
    ).resolves.toBe(null)
  })
})
