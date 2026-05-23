import { describe, expect, it } from "vitest"
import {
  EXHIBITION_SCORING_POLICY_V1,
  SERVICE_API_VERSION,
  STRATEGY_RUNTIME_ABI_VERSION,
  type PublicMatchSetResultDto,
  type PublicPlayerProfileDto,
  type PublicStrategyCardDto,
  type PublicTrialLadderSeasonDto,
} from "@cowards/spec"
import type { StoredChronicle } from "@cowards/persistence/chronicle-store"
import { createWorkshopAnalyticsDemoSnapshot } from "@cowards/persistence/workshop-analytics"
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

const publicPlayerProfile = {
  handle: "demo-player",
  displayName: "Demo Player",
  strategies: [publicStrategyCard],
  ladderHistory: [
    {
      seasonId: "ladder-season:demo",
      seasonName: "Demo Ladder",
      entryStatus: "active",
      points: 9,
      rank: 1,
    },
  ],
  results: [],
} satisfies PublicPlayerProfileDto

const publicTrialLadderSeason = {
  seasonId: "ladder-season:demo",
  slug: "demo-season",
  name: "Demo Trial Ladder",
  status: "open",
  statusLabel: "Open",
  seasonSeed: "trial-ladder-demo-seed",
  policy: {
    oneEntryPerUser: true,
    replacementPolicy: "next-season-only",
    staleRevisionPolicy:
      "Immutable revisions stay eligible for the current season.",
    standingsReset: true,
    noPermanentRatings: true,
    minimumEntries: 2,
    targetPodSize: 4,
  },
  entries: [],
  standings: [],
  matchSets: [
    {
      matchSetId: "match-set:ladder:demo",
      seasonId: "ladder-season:demo",
      status: "complete",
      countedStatus: "counted",
      publicExplanation: "Complete replay-backed ladder evidence.",
      entrantIds: [],
      resultHref: "/matchsets/match-set%3Aladder%3Ademo",
    },
  ],
  publication: {
    publicEntries: true,
    publicStandings: true,
    publicReplayEvidence: true,
    privateFieldsExcluded: [
      "Strategy source",
      "StrategyMemory",
      "SoldierMemory",
      "objective payloads",
      "owner debug",
      "private runtime internals",
    ],
  },
} satisfies PublicTrialLadderSeasonDto

const accountUser = {
  id: "user:demo",
  username: "demo-player",
  handle: "demo-player",
  displayName: "Demo Player",
  createdAt: "2026-05-22T00:00:00.000Z",
}

const accountRevision = {
  id: "strategy-revision:demo",
  strategyId: "strategy:account:user:demo:one",
  label: "Demo Revision",
  sourceHash: "sourcehash-demo",
  sourceBytes: 256,
  valid: true,
  runtime,
  runtimeSemantics: {
    languageLabel: "TypeScript",
    adapterLabel: "Worker thread",
    readiness: "production",
    readinessLabel: "Production",
    experimental: false,
    countedPlayEligible: true,
    countedPlayLabel: "Counted eligible",
    countedPlayReason: null,
    sourcePolicyLabel: "Inline source",
    packagePolicyLabel: "No packages",
    docsReference: "docs/runtime-js",
    examplesReference: "examples/runtime-js",
    warnings: [],
    validationIssueCodes: [],
  },
  engineCompatibility: {
    spec: "cowards-rules-v1.4",
    engine: "engine-v1",
  },
  createdAt: "2026-05-22T00:00:00.000Z",
}

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

  it("returns owner-safe auth sessions from session tokens", async () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      getSession: async (_pool, sessionId) =>
        sessionId === "session:demo"
          ? ({
              session: {
                id: "stored-session-id",
                userId: accountUser.id,
                expiresAt: "2026-06-22T00:00:00.000Z",
                createdAt: "2026-05-22T00:00:00.000Z",
              },
              user: accountUser,
            } as never)
          : null,
    })

    await expect(service.getAuthSession("session:demo")).resolves.toEqual({
      apiVersion: SERVICE_API_VERSION,
      kind: "authSession",
      user: {
        id: "user:demo",
        username: "demo-player",
        handle: "demo-player",
        displayName: "Demo Player",
      },
    })
    await expect(service.getAuthSession("")).resolves.toEqual({
      apiVersion: SERVICE_API_VERSION,
      kind: "authSession",
      user: null,
    })
  })

  it("lists only session-owned Strategy Revision metadata without source", async () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      getSession: async () =>
        ({
          session: {
            id: "stored-session-id",
            userId: accountUser.id,
            expiresAt: "2026-06-22T00:00:00.000Z",
            createdAt: "2026-05-22T00:00:00.000Z",
          },
          user: accountUser,
        }) as never,
      listAccountRevisions: async (_pool, userId) => {
        expect(userId).toBe("user:demo")
        return [
          {
            ...accountRevision,
            source: "export default hidden",
          },
        ] as never
      },
    })

    const list = await service.listStrategyRevisions("session:demo")

    expect(list).toMatchObject({
      apiVersion: SERVICE_API_VERSION,
      kind: "strategyRevisionList",
      revisions: [
        {
          apiVersion: SERVICE_API_VERSION,
          kind: "strategyRevisionSummary",
          strategyId: "strategy:account:user:demo:one",
          strategyRevisionId: "strategy-revision:demo",
          label: "Demo Revision",
          sourceHash: "sourcehash-demo",
          sourceBytes: 256,
          validationStatus: "valid",
          runtimeSemantics: {
            languageLabel: "TypeScript",
            countedPlayEligible: true,
          },
          engineCompatibility: {
            spec: "cowards-rules-v1.4",
            engine: "engine-v1",
          },
          createdAt: "2026-05-22T00:00:00.000Z",
        },
      ],
    })
    expect(JSON.stringify(list)).not.toContain("export default hidden")
    expect(JSON.stringify(list)).not.toContain("stored-session-id")
  })

  it("returns null for revision lists without a valid session", async () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      getSession: async () => null,
      listAccountRevisions: async () => {
        throw new Error("should not list revisions without a session")
      },
    })

    await expect(service.listStrategyRevisions("missing")).resolves.toBe(null)
    await expect(service.listStrategyRevisions("")).resolves.toBe(null)
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

  it("wraps public player profiles in a public page service envelope", async () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      buildPublicPlayerProfile: async (_pool, _handle) => publicPlayerProfile,
    })

    await expect(service.getPublicPlayerPage("demo-player")).resolves.toEqual({
      apiVersion: SERVICE_API_VERSION,
      kind: "publicPage",
      page: "player",
      canonicalHref: "/players/demo-player",
      payload: publicPlayerProfile,
    })
  })

  it("wraps public ladder seasons in a public page service envelope", async () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      buildPublicLadderSeason: async (_pool, _seasonId) =>
        publicTrialLadderSeason,
    })

    await expect(
      service.getPublicLadderSeason("ladder-season:demo"),
    ).resolves.toEqual({
      apiVersion: SERVICE_API_VERSION,
      kind: "publicPage",
      page: "ladder",
      canonicalHref: "/ladder/demo-season",
      payload: publicTrialLadderSeason,
    })
  })

  it("returns null for missing public ladder seasons", async () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      buildPublicLadderSeason: async () => null,
    })

    await expect(
      service.getPublicLadderSeason("ladder-season:missing"),
    ).resolves.toBe(null)
  })

  it("rejects public ladder DTOs with private fields", async () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      buildPublicLadderSeason: async () =>
        ({
          ...publicTrialLadderSeason,
          ownerDebug: { hidden: true },
        }) as unknown as PublicTrialLadderSeasonDto,
    })

    await expect(
      service.getPublicLadderSeason("ladder-season:demo"),
    ).rejects.toThrow("Public service DTO leaks private field")
  })

  it("returns null for missing public player profiles", async () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      buildPublicPlayerProfile: async () => null,
    })

    await expect(service.getPublicPlayerPage("missing-player")).resolves.toBe(
      null,
    )
  })

  it("rejects public player profile DTOs with private fields", async () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      buildPublicPlayerProfile: async () =>
        ({
          ...publicPlayerProfile,
          strategies: [
            {
              ...publicStrategyCard,
              strategyMemory: { hidden: true },
            },
          ],
        }) as unknown as PublicPlayerProfileDto,
    })

    await expect(service.getPublicPlayerPage("demo-player")).rejects.toThrow(
      "Public service DTO leaks private field",
    )
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

  it("returns parsed analytics run summaries through the service boundary", async () => {
    const snapshot = createWorkshopAnalyticsDemoSnapshot()
    const run = snapshot.runs.find(
      (candidate) => candidate.id === snapshot.selectedRunId,
    )
    if (!run) {
      throw new Error("Expected analytics demo run")
    }
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      getAnalyticsSnapshot: async () => snapshot,
    })

    await expect(
      service.getAnalyticsRunSummary(run.ownerUserId, run.id),
    ).resolves.toMatchObject({
      apiVersion: SERVICE_API_VERSION,
      kind: "analyticsRunSummary",
      runId: run.id,
      profileId: run.profileId,
      summary: {
        runId: run.id,
        profileId: run.profileId,
        privacy: {
          ownerSafe: true,
        },
      },
    })
    await expect(
      service.getAnalyticsRunSummary(run.ownerUserId, "analytics-run:missing"),
    ).resolves.toBe(null)
    await expect(
      service.getAnalyticsRunSummary("user:not-owner", run.id),
    ).resolves.toBe(null)
  })

  it("returns parsed Workshop analytics snapshots through the service boundary", async () => {
    const snapshot = createWorkshopAnalyticsDemoSnapshot()
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      getAnalyticsSnapshot: async () => snapshot,
    })

    await expect(service.getWorkshopAnalyticsSnapshot()).resolves.toEqual(
      expect.objectContaining({
        selectedProfileId: snapshot.selectedProfileId,
        selectedRunId: snapshot.selectedRunId,
        profiles: expect.arrayContaining([
          expect.objectContaining({ id: snapshot.selectedProfileId }),
        ]),
        runs: expect.arrayContaining([
          expect.objectContaining({
            summary: expect.objectContaining({
              privacy: expect.objectContaining({
                ownerSafe: true,
              }),
            }),
          }),
        ]),
      }),
    )
  })

  it("rejects Workshop analytics snapshots with private fields", async () => {
    const snapshot = createWorkshopAnalyticsDemoSnapshot()
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      getAnalyticsSnapshot: async () =>
        ({
          ...snapshot,
          runs: [
            {
              ...snapshot.runs[0]!,
              summary: {
                ...snapshot.runs[0]!.summary,
                ownerDebug: { hidden: true },
              },
            },
          ],
        }) as never,
    })

    await expect(service.getWorkshopAnalyticsSnapshot()).rejects.toThrow(
      "Analytics summary leaks private field",
    )
  })
})
