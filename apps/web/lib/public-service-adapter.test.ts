import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  getMatchExecutionContractFixtureByMatchSetId,
  publicStrategyPageExample,
  type PublicStrategyPageServiceDto,
} from "@cowards/spec"
import {
  createPublicReadService,
  resolvePublicReadRouteOwnership,
} from "./public-service-adapter.js"
import type { PublicGoReadClient } from "./public-go-read-client.js"

const publicStrategyPage =
  publicStrategyPageExample as PublicStrategyPageServiceDto
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
)

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
    const service = createPublicReadService({
      env: {
        COWARDS_GO_BACKEND_OWNER: "go",
        COWARDS_GO_BACKEND_URL: "http://go.test",
      },
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
  })

  it("keeps selected public adapters free of direct session persistence", () => {
    const source = readFileSync(
      path.join(repoRoot, "apps/web/lib/public-service-adapter.ts"),
      "utf8",
    )

    expect(source).not.toContain("@cowards/persistence/auth")
    expect(source).not.toContain("getSession(")
  })

  it("fails closed without a Go URL instead of defaulting to TypeScript service", async () => {
    const service = createPublicReadService({
      env: {},
    })

    await expect(
      service.getPublicStrategyPage("strategy:demo"),
    ).rejects.toThrow(
      "getPublicStrategyPage Go ownership requires COWARDS_GO_BACKEND_URL",
    )
    expect(resolvePublicReadRouteOwnership({}).selectedOwner).toBe("typescript")
  })

  it("routes only the public Strategy page to Go when the legacy strategy-scoped switch is enabled", async () => {
    const goCalls: string[] = []
    const service = createPublicReadService({
      env: { COWARDS_GO_PUBLIC_STRATEGY_READS: "1" },
      goClient: createGoClientStub({
        async getPublicStrategyPage(strategyId) {
          goCalls.push(`strategy:${strategyId}`)
          return publicStrategyPage
        },
        getPublicMatchSetSummary: async (matchSetId) => {
          goCalls.push(`matchset:${matchSetId}`)
          return null
        },
        getPublicReplayMetadata: async (matchId) => {
          goCalls.push(`replay:${matchId}`)
          return null
        },
        getPublicPlayerPage: async (handle) => {
          goCalls.push(`player:${handle}`)
          return null
        },
        getPublicLadderSeason: async (seasonId) => {
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
    ).rejects.toThrow("getPublicMatchSetSummary is not selected")
    await expect(service.getPublicReplayMetadata("match:demo")).rejects.toThrow(
      "getPublicReplayMetadata is not selected",
    )
    await expect(service.getPublicPlayerPage("local")).rejects.toThrow(
      "getPublicPlayerPage is not selected",
    )
    await expect(service.getPublicLadderSeason("season:demo")).rejects.toThrow(
      "getPublicLadderSeason is not selected",
    )

    expect(goCalls).toEqual(["strategy:strategy:demo"])
    expect(
      resolvePublicReadRouteOwnership({
        COWARDS_GO_PUBLIC_STRATEGY_READS: "1",
      }).selectedRoutes,
    ).toEqual(["getPublicStrategyPage"])
  })

  it("routes every public read to Go in no-TypeScript-backend mode", () => {
    expect(
      resolvePublicReadRouteOwnership({
        COWARDS_NO_TYPESCRIPT_BACKEND: "1",
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

  it("routes every public read to Go when the all-public cutover switch is enabled", async () => {
    const goCalls: string[] = []
    const service = createPublicReadService({
      env: { COWARDS_GO_PUBLIC_READS: "1" },
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
    const service = createPublicReadService({
      env: { COWARDS_GO_PUBLIC_STRATEGY_READS: "1" },
      goClient: createGoClientStub({
        async getPublicStrategyPage() {
          throw new Error("go unavailable")
        },
      }),
    })

    await expect(
      service.getPublicStrategyPage("strategy:demo"),
    ).rejects.toThrow("go unavailable")
  })

  it("requires a Go backend URL when the route switch is enabled", async () => {
    const service = createPublicReadService({
      env: { COWARDS_GO_PUBLIC_STRATEGY_READS: "1" },
    })

    await expect(
      service.getPublicStrategyPage("strategy:demo"),
    ).rejects.toThrow(
      "getPublicStrategyPage Go ownership requires COWARDS_GO_BACKEND_URL",
    )
  })

  it("serves explicit Match execution fixtures without requiring Go", async () => {
    const service = createPublicReadService({
      env: { COWARDS_ENABLE_MATCH_EXECUTION_FIXTURES: "1" },
    })
    const fixture = getMatchExecutionContractFixtureByMatchSetId(
      "match-set:fixture:unavailable-runtime",
    )

    await expect(
      service.getPublicMatchSetSummary(
        "match-set%3Afixture%3Aunavailable-runtime",
      ),
    ).resolves.toEqual(fixture?.service.matchSetSummary)
    await expect(
      service.getPublicMatchSetSummary("match-set:unknown"),
    ).rejects.toThrow(
      "getPublicMatchSetSummary Go ownership requires COWARDS_GO_BACKEND_URL",
    )
  })
})
