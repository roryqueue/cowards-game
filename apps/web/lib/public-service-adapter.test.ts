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

const publicStrategyPage =
  publicStrategyPageExample as PublicStrategyPageServiceDto

const createServiceStub = (
  getPublicStrategyPage: CowardsService["getPublicStrategyPage"],
): CowardsService => ({
  health: () => ({
    ok: true,
    service: "cowards-service",
    version: "service-api-v1.8",
  }),
  getPublicMatchSetSummary: async () => null,
  getPublicReplayMetadata: async () => null,
  getPublicStrategyPage,
  getPublicPlayerPage: async () => null,
  getPublicLadderSeason: async () => null,
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

describe("public read route ownership", () => {
  it("defaults the public Strategy read to the TypeScript service", async () => {
    let typescriptCalls = 0
    const service = createPublicReadService({
      env: {},
      typescriptService: createServiceStub(async () => {
        typescriptCalls += 1
        return publicStrategyPage
      }),
      goClient: {
        async getPublicStrategyPage() {
          throw new Error("Go should not be called by default")
        },
      },
    })

    await expect(
      service.getPublicStrategyPage("strategy:demo"),
    ).resolves.toEqual(publicStrategyPage)
    expect(typescriptCalls).toBe(1)
    expect(resolvePublicReadRouteOwnership({}).selectedOwner).toBe("typescript")
  })

  it("routes only the selected public Strategy read to Go", async () => {
    let goCalls = 0
    let typescriptCalls = 0
    const service = createPublicReadService({
      env: { COWARDS_GO_PUBLIC_STRATEGY_READS: "1" },
      typescriptService: createServiceStub(async () => {
        typescriptCalls += 1
        return null
      }),
      goClient: {
        async getPublicStrategyPage(strategyId) {
          goCalls += 1
          expect(strategyId).toBe("strategy:demo")
          return publicStrategyPage
        },
      },
    })

    await expect(
      service.getPublicStrategyPage("strategy:demo"),
    ).resolves.toEqual(publicStrategyPage)
    expect(goCalls).toBe(1)
    expect(typescriptCalls).toBe(0)
    expect(await service.getPublicMatchSetSummary("match-set:demo")).toBeNull()
  })

  it("fails closed when Go is selected but unavailable", async () => {
    let typescriptCalls = 0
    const service = createPublicReadService({
      env: { COWARDS_GO_PUBLIC_STRATEGY_READS: "1" },
      typescriptService: createServiceStub(async () => {
        typescriptCalls += 1
        return publicStrategyPage
      }),
      goClient: {
        async getPublicStrategyPage() {
          throw new Error("go unavailable")
        },
      },
    })

    await expect(
      service.getPublicStrategyPage("strategy:demo"),
    ).rejects.toThrow("go unavailable")
    expect(typescriptCalls).toBe(0)
  })

  it("requires a Go backend URL when the route switch is enabled", async () => {
    const service = createPublicReadService({
      env: { COWARDS_GO_PUBLIC_STRATEGY_READS: "1" },
      typescriptService: createServiceStub(async () => publicStrategyPage),
    })

    await expect(
      service.getPublicStrategyPage("strategy:demo"),
    ).rejects.toThrow(
      "COWARDS_GO_PUBLIC_STRATEGY_READS requires COWARDS_GO_BACKEND_URL",
    )
  })
})
