import { describe, expect, it } from "vitest"
import type { AccountReadRevisionSummary } from "./account-service-boundary.js"
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
          countedEntryEligibilityCategory: "provider_validated",
          runtimeSemantics: {
            languageId: "typescript",
            languageLabel: "JS/TS",
            adapterId: "runtime-js-worker-thread",
            adapterLabel: "Worker thread",
            readiness: "production-candidate",
            readinessLabel: "Provenance evidence only",
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

  it("projects counted ladder entry posture and public eligibility", async () => {
    const runtimeSemantics = {
      languageId: "typescript",
      languageLabel: "TypeScript",
      adapterId: "runtime-js-worker-thread",
      adapterLabel: "Worker thread",
      readiness: "production-candidate",
      readinessLabel: "Provider evidence available",
      experimental: false,
      countedPlayLabel: "Counted eligible",
      countedPlayEligible: true,
      countedPlayReason: null,
      sourcePolicyLabel: "Provider artifact",
      packagePolicyLabel: "No packages",
      docsReference: "docs/runtime-js",
      examplesReference: "examples/runtime-js",
      warnings: [],
      validationIssueCodes: [],
    } satisfies AccountReadRevisionSummary["runtimeSemantics"]
    const service = createPublicDiscoveryService({
      env: {},
      getLadderSeason: async (seasonId) =>
        ({
          seasonId,
          slug: "open-season",
          name: "Open Season",
          status: "open",
          statusLabel: "Open for entries",
          seasonSeed: "open-season",
          policy: {
            oneEntryPerUser: true,
            replacementPolicy: "next-season-only",
            staleRevisionPolicy: "locked snapshot remains active",
            standingsReset: true,
            noPermanentRatings: true,
            minimumEntries: 4,
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
        }) as any,
      getCurrentUser: async () => ({
        id: "user:test",
        username: "test",
        handle: "test",
        displayName: "Test Player",
      }),
      listRevisions: async () => [
        {
          id: "strategy-revision:ready",
          strategyId: "strategy:ready",
          label: "Ready",
          sourceHash: "hash-ready",
          sourceBytes: 120,
          valid: true,
          countedEntryEligibilityCategory: "provider_validated",
          runtimeSemantics,
          engineCompatibility: { spec: "cowards-rules-v1.4", engine: "0.1.4" },
          createdAt: "2026-07-11T00:00:00.000Z",
          lockedAt: "2026-07-11T00:00:00.000Z",
        },
        {
          id: "strategy-revision:proof-missing",
          strategyId: "strategy:proof-missing",
          label: "Needs proof",
          sourceHash: "hash-needs-proof",
          sourceBytes: 130,
          valid: true,
          countedEntryEligibilityCategory: "provider_proof_missing",
          runtimeSemantics: {
            ...runtimeSemantics,
            countedPlayEligible: false,
            countedPlayLabel: "Not counted",
            countedPlayReason:
              "TypeScript counted play requires provider-validated revision provenance.",
          },
          engineCompatibility: { spec: "cowards-rules-v1.4", engine: "0.1.4" },
          createdAt: "2026-07-11T00:00:00.000Z",
          lockedAt: "2026-07-11T00:00:00.000Z",
        },
      ],
    })

    const dashboard =
      await service.getSignedInCompetitionEntryDashboard("ladder:season:open")

    expect(dashboard?.entryMode).toBe("counted-ladder-season")
    expect(dashboard?.entryHref).toBe(
      "/api/ladder/seasons/season%3Aopen/entries",
    )
    expect(dashboard?.posture).toEqual({
      publicLabel: "public beta trial competition",
      standingsScope: "resettable Season-scoped standings",
      durableRatingPromise: "no durable permanent rating promise",
    })
    expect(dashboard?.eligibleRevisions[0]?.eligibility.category).toBe(
      "provider_validated",
    )
    expect(dashboard?.ineligibleRevisions[0]?.eligibility.category).toBe(
      "provider_proof_missing",
    )
    const serialized = JSON.stringify({
      posture: dashboard?.posture,
      eligibleRevisions: dashboard?.eligibleRevisions,
      ineligibleRevisions: dashboard?.ineligibleRevisions,
    })
    expect(serialized).not.toContain("StrategyMemory")
    expect(serialized).not.toContain("bytesBase64")
  })
})
