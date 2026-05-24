import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  publicStrategyPageExample,
  type PublicStrategyPageServiceDto,
} from "@cowards/spec"
import type { CowardsService } from "@cowards/service"
import {
  createPublicReadService,
  resolvePublicReadRouteOwnership,
} from "./public-service-adapter.js"
import type { PublicGoReadClient } from "./public-go-read-client.js"

const publicStrategyPage =
  publicStrategyPageExample as PublicStrategyPageServiceDto

const createServiceStub = ({
  getPublicStrategyPage,
  getPublicMatchSetSummary = async () => null,
  getPublicReplayMetadata = async () => null,
  getPublicPlayerPage = async () => null,
  getPublicLadderSeason = async () => null,
}: {
  getPublicStrategyPage: CowardsService["getPublicStrategyPage"]
  getPublicMatchSetSummary?: CowardsService["getPublicMatchSetSummary"]
  getPublicReplayMetadata?: CowardsService["getPublicReplayMetadata"]
  getPublicPlayerPage?: CowardsService["getPublicPlayerPage"]
  getPublicLadderSeason?: CowardsService["getPublicLadderSeason"]
}): CowardsService => ({
  health: () => ({
    ok: true,
    service: "cowards-service",
    version: "service-api-v1.8",
  }),
  getPublicMatchSetSummary,
  getPublicReplayMetadata,
  getPublicStrategyPage,
  getPublicPlayerPage,
  getPublicLadderSeason,
  getAuthSession: async () => ({
    apiVersion: "service-api-v1.8",
    kind: "authSession",
    user: null,
  }),
  listStrategyRevisions: async () => null,
  getAnalyticsRunSummary: async () => null,
  getWorkshopAnalyticsSnapshot: async () => ({
    selectedProfileId: "analytics-profile:test",
    selectedRunId: "analytics-run:test",
    profiles: [],
    runs: [],
  }),
  getWorkshopTestSummary: async () => null,
  compareWorkshopAnalyticsRuns: async () => null,
})

const createGoClientStub = (
  overrides: Partial<PublicGoReadClient>,
): PublicGoReadClient => ({
  getPublicStrategyPage: async () => {
    throw new Error("unexpected getPublicStrategyPage Go call")
  },
  getPublicPlayerPage: async () => {
    throw new Error("unexpected getPublicPlayerPage Go call")
  },
  getPublicLadderSeason: async () => {
    throw new Error("unexpected getPublicLadderSeason Go call")
  },
  getPublicMatchSetSummary: async () => {
    throw new Error("unexpected getPublicMatchSetSummary Go call")
  },
  getPublicReplayMetadata: async () => {
    throw new Error("unexpected getPublicReplayMetadata Go call")
  },
  getPublicReplayEvidence: async () => {
    throw new Error("unexpected getPublicReplayEvidence Go call")
  },
  ...overrides,
})

describe("public read route ownership", () => {
  it("does not construct the local TypeScript service when all selected public reads are Go-owned", async () => {
    let localCalls = 0
    const service = createPublicReadService({
      env: {
        COWARDS_GO_BACKEND_OWNER: "go",
        COWARDS_GO_BACKEND_URL: "http://go.test",
      },
      typescriptService: createServiceStub({
        getPublicStrategyPage: async () => {
          localCalls += 1
          return publicStrategyPage
        },
      }),
      goClient: createGoClientStub({
        async getPublicStrategyPage() {
          return publicStrategyPage
        },
        async getPublicPlayerPage() {
          return null
        },
        async getPublicLadderSeason() {
          return null
        },
        async getPublicMatchSetSummary() {
          return null
        },
        async getPublicReplayMetadata() {
          return null
        },
      }),
    })

    await expect(
      service.getPublicStrategyPage("strategy:demo"),
    ).resolves.toEqual(publicStrategyPage)
    await expect(service.getPublicPlayerPage("local")).resolves.toBeNull()
    await expect(
      service.getPublicLadderSeason("season:demo"),
    ).resolves.toBeNull()
    await expect(
      service.getPublicMatchSetSummary("match-set:demo"),
    ).resolves.toBeNull()
    await expect(
      service.getPublicReplayMetadata("match:demo"),
    ).resolves.toBeNull()

    expect(localCalls).toBe(0)
  })

  it("keeps selected public adapters free of direct session persistence", () => {
    const source = readFileSync("apps/web/lib/public-service-adapter.ts", "utf8")

    expect(source).not.toContain("@cowards/persistence/auth")
    expect(source).not.toContain("getSession(")
  })

  it("defaults the public Strategy read to the TypeScript service", async () => {
    let typescriptCalls = 0
    const service = createPublicReadService({
      env: {},
      typescriptService: createServiceStub({
        getPublicStrategyPage: async () => {
          typescriptCalls += 1
          return publicStrategyPage
        },
      }),
      goClient: createGoClientStub({
        async getPublicStrategyPage() {
          throw new Error("Go should not be called by default")
        },
      }),
    })

    await expect(
      service.getPublicStrategyPage("strategy:demo"),
    ).resolves.toEqual(publicStrategyPage)
    expect(typescriptCalls).toBe(1)
    expect(resolvePublicReadRouteOwnership({}).selectedOwner).toBe("typescript")
  })

  it("routes only the selected public Strategy read to Go", async () => {
    let goCalls = 0
    let typescriptStrategyCalls = 0
    const typescriptRouteCalls: string[] = []
    const service = createPublicReadService({
      env: { COWARDS_GO_PUBLIC_STRATEGY_READS: "1" },
      typescriptService: createServiceStub({
        getPublicStrategyPage: async () => {
          typescriptStrategyCalls += 1
          return null
        },
        getPublicMatchSetSummary: async (matchSetId) => {
          typescriptRouteCalls.push(`matchset:${matchSetId}`)
          return null
        },
        getPublicReplayMetadata: async (matchId) => {
          typescriptRouteCalls.push(`replay:${matchId}`)
          return null
        },
        getPublicPlayerPage: async (handle) => {
          typescriptRouteCalls.push(`player:${handle}`)
          return null
        },
        getPublicLadderSeason: async (seasonId) => {
          typescriptRouteCalls.push(`ladder:${seasonId}`)
          return null
        },
      }),
      goClient: createGoClientStub({
        async getPublicStrategyPage(strategyId) {
          goCalls += 1
          expect(strategyId).toBe("strategy:demo")
          return publicStrategyPage
        },
      }),
    })

    await expect(
      service.getPublicStrategyPage("strategy:demo"),
    ).resolves.toEqual(publicStrategyPage)
    await expect(
      service.getPublicMatchSetSummary("match-set:demo"),
    ).resolves.toBeNull()
    await expect(
      service.getPublicReplayMetadata("match:demo"),
    ).resolves.toBeNull()
    await expect(service.getPublicPlayerPage("local")).resolves.toBeNull()
    await expect(
      service.getPublicLadderSeason("season:demo"),
    ).resolves.toBeNull()

    expect(goCalls).toBe(1)
    expect(typescriptStrategyCalls).toBe(0)
    expect(typescriptRouteCalls).toEqual([
      "matchset:match-set:demo",
      "replay:match:demo",
      "player:local",
      "ladder:season:demo",
    ])
  })

  it("routes every public read to Go when the all-public cutover switch is enabled", async () => {
    const goCalls: string[] = []
    const service = createPublicReadService({
      env: { COWARDS_GO_PUBLIC_READS: "1" },
      typescriptService: createServiceStub({
        getPublicStrategyPage: async () => {
          throw new Error("TypeScript should not serve selected public reads")
        },
      }),
      goClient: createGoClientStub({
        async getPublicStrategyPage(strategyId) {
          goCalls.push(`strategy:${strategyId}`)
          return publicStrategyPage
        },
        async getPublicMatchSetSummary(matchSetId) {
          goCalls.push(`matchset:${matchSetId}`)
          return null
        },
        async getPublicReplayMetadata(matchId) {
          goCalls.push(`replay:${matchId}`)
          return null
        },
        async getPublicPlayerPage(handle) {
          goCalls.push(`player:${handle}`)
          return null
        },
        async getPublicLadderSeason(seasonId) {
          goCalls.push(`ladder:${seasonId}`)
          return null
        },
      }),
    })

    await expect(
      service.getPublicStrategyPage("strategy:demo"),
    ).resolves.toEqual(publicStrategyPage)
    await expect(
      service.getPublicMatchSetSummary("match-set:demo"),
    ).resolves.toBeNull()
    await expect(
      service.getPublicReplayMetadata("match:demo"),
    ).resolves.toBeNull()
    await expect(service.getPublicPlayerPage("local")).resolves.toBeNull()
    await expect(
      service.getPublicLadderSeason("season:demo"),
    ).resolves.toBeNull()

    expect(goCalls).toEqual([
      "strategy:strategy:demo",
      "matchset:match-set:demo",
      "replay:match:demo",
      "player:local",
      "ladder:season:demo",
    ])
    expect(
      resolvePublicReadRouteOwnership({
        COWARDS_GO_PUBLIC_READS: "1",
      }).selectedRoutes,
    ).toEqual([
      "getPublicStrategyPage",
      "getPublicPlayerPage",
      "getPublicLadderSeason",
      "getPublicMatchSetSummary",
      "getPublicReplayEvidence",
      "getPublicReplayMetadata",
    ])
  })

  it("fails closed when Go is selected but unavailable", async () => {
    let typescriptCalls = 0
    const service = createPublicReadService({
      env: { COWARDS_GO_PUBLIC_STRATEGY_READS: "1" },
      typescriptService: createServiceStub({
        getPublicStrategyPage: async () => {
          typescriptCalls += 1
          return publicStrategyPage
        },
      }),
      goClient: createGoClientStub({
        async getPublicStrategyPage() {
          throw new Error("go unavailable")
        },
      }),
    })

    await expect(
      service.getPublicStrategyPage("strategy:demo"),
    ).rejects.toThrow("go unavailable")
    expect(typescriptCalls).toBe(0)
  })

  it("requires a Go backend URL when the route switch is enabled", async () => {
    const service = createPublicReadService({
      env: { COWARDS_GO_PUBLIC_STRATEGY_READS: "1" },
      typescriptService: createServiceStub({
        getPublicStrategyPage: async () => publicStrategyPage,
      }),
    })

    await expect(
      service.getPublicStrategyPage("strategy:demo"),
    ).rejects.toThrow(
      "getPublicStrategyPage Go ownership requires COWARDS_GO_BACKEND_URL",
    )
  })
})
