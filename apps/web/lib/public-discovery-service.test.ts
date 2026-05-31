import { describe, expect, it } from "vitest"
import { createPublicDiscoveryService } from "./public-discovery-service.js"

describe("public discovery service", () => {
  it("returns public-safe empty states without production fixture fallback", async () => {
    const service = createPublicDiscoveryService({
      env: { NODE_ENV: "production" },
      getMatchSetResult: async () => {
        throw new Error("fixtures should not be queried in production")
      },
      getLadderSeason: async () => null,
    })

    const home = await service.getPublicHomeDiscovery()

    expect(home.boundary.apiNamespace).toBe("public-discovery")
    expect(home.boundary.executionContract).toBe("not-match-execution-app-v1")
    expect(home.latestEvidence).toEqual([])
    expect(home.emptyStates.join(" ")).toContain("configured public index")
  })

  it("exposes exhibition competitions through the new discovery namespace", async () => {
    const service = createPublicDiscoveryService({
      env: {},
      getLadderSeason: async () => null,
    })

    const competitions = await service.getPublicCompetitionIndex()
    const standard = competitions.entryOpportunities.find(
      (competition) =>
        competition.competitionId === "exhibition:standard-exhibition-v1",
    )

    expect(standard?.href).toBe(
      "/competitions/exhibition%3Astandard-exhibition-v1",
    )
    expect(standard?.enterHref).toBe(
      "/competitions/exhibition%3Astandard-exhibition-v1/enter",
    )
  })

  it("keeps configured ladder discovery available when one season read fails", async () => {
    const service = createPublicDiscoveryService({
      env: {
        COWARDS_PUBLIC_DISCOVERY_LADDER_SEASON_IDS:
          "ladder-season:good,ladder-season:broken",
      },
      getLadderSeason: async (seasonId) => {
        if (seasonId === "ladder-season:broken") {
          throw new Error("ladder read unavailable")
        }
        return {
          seasonId,
          slug: "good",
          name: "Good Ladder",
          status: "active",
          statusLabel: "Active",
          seasonSeed: "seed",
          policy: {
            oneEntryPerUser: true,
            replacementPolicy: "next-season-only",
            staleRevisionPolicy: "latest valid revision only",
            standingsReset: true,
            noPermanentRatings: true,
            minimumEntries: 2,
            targetPodSize: 4,
          },
          entries: [],
          standings: [],
          matchSets: [],
          publication: {
            publicEntries: true,
            publicStandings: true,
            publicReplayEvidence: true,
            privateFieldsExcluded: [],
          },
        } as any
      },
    })

    const competitions = await service.getPublicCompetitionIndex()

    expect(
      competitions.activeCompetitions.some(
        (competition) =>
          competition.competitionId === "ladder:ladder-season:good",
      ),
    ).toBe(true)
  })

  it("filters exhibition detail MatchSets to the requested preset", async () => {
    const service = createPublicDiscoveryService({
      env: { COWARDS_ENABLE_MATCH_EXECUTION_FIXTURES: "1" },
      getLadderSeason: async () => null,
      getMatchSetResult: async (matchSetId) =>
        ({
          matchSetId,
          preset: {
            id:
              matchSetId === "match-set:fixture:complete"
                ? "smoke-exhibition-v1"
                : "standard-exhibition-v1",
            label:
              matchSetId === "match-set:fixture:complete"
                ? "Smoke Exhibition"
                : "Standard Exhibition",
          },
          status: "complete",
          lifecycle: {
            resultAvailability: "available",
            replayAvailability: "available",
          },
          entrants: [
            {
              displayLabel: "Alpha",
              ownerHandle: "alpha",
            },
            {
              displayLabel: "Beta",
              ownerHandle: "beta",
            },
          ],
          matches: [
            {
              replayHref: `/matches/${encodeURIComponent(
                `match:${matchSetId}`,
              )}/replay`,
            },
          ],
        }) as any,
    })

    const detail = await service.getPublicCompetitionDetail(
      "exhibition:smoke-exhibition-v1",
    )

    expect(detail?.matchSets).toHaveLength(1)
    expect(detail?.matchSets[0]?.presetId).toBe("smoke-exhibition-v1")
  })

  it("builds a signed-in source-free entry dashboard", async () => {
    const service = createPublicDiscoveryService({
      env: {},
      getLadderSeason: async () => null,
      getCurrentUser: async () => ({
        id: "user:test",
        username: "test",
        handle: "test",
        displayName: "Test Player",
      }),
      listRevisions: async () => [
        {
          id: "strategy-revision:test",
          strategyId: "strategy:test",
          label: "Public Test",
          sourceHash: "hash-test",
          sourceBytes: 120,
          valid: true,
          runtimeSemantics: {
            languageId: "typescript",
            languageLabel: "JS/TS",
            adapterId: "runtime-js-worker-thread",
            adapterLabel: "Worker thread",
            readiness: "production-candidate",
            readinessLabel: "Production candidate",
            experimental: false,
            countedPlayLabel: "Counted eligible",
            countedPlayEligible: true,
            countedPlayReason: null,
            sourcePolicyLabel: "Inline source",
            packagePolicyLabel: "No packages",
            docsReference: "docs/runtime-js",
            examplesReference: "examples/runtime-js",
            warnings: [],
            validationIssueCodes: [],
          },
          engineCompatibility: { spec: "spec", engine: "engine" },
          createdAt: "2026-05-30T00:00:00.000Z",
        },
      ],
    })

    const dashboard = await service.getSignedInCompetitionEntryDashboard(
      "exhibition:standard-exhibition-v1",
    )

    expect(dashboard?.eligibleRevisions).toHaveLength(1)
    expect(JSON.stringify(dashboard)).not.toContain("source:")
    expect(JSON.stringify(dashboard?.eligibleRevisions)).not.toContain(
      "StrategyMemory",
    )
  })
})
