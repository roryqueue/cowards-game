import { describe, expect, it } from "vitest"
import {
  SERVICE_API_VERSION,
  publicLadderPageExample,
  publicMatchSetSummaryExample,
  publicPlayerPageExample,
  publicReplayEvidenceExample,
  publicReplayMetadataExample,
  publicStrategyPageExample,
  type PublicLadderPageServiceDto,
  type PublicMatchSetSummaryServiceDto,
  type PublicPlayerPageServiceDto,
  type PublicReplayEvidenceServiceDto,
  type PublicReplayMetadataServiceDto,
  type PublicStrategyPageServiceDto,
} from "@cowards/spec"
import {
  createPublicGoReadClient,
  isPublicGoReadError,
} from "./public-go-read-client.js"

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })

const publicStrategyPage =
  publicStrategyPageExample as PublicStrategyPageServiceDto
const encodedPublicStrategyPage: PublicStrategyPageServiceDto = {
  ...publicStrategyPage,
  canonicalHref: "/strategies/strategy%3Ademo",
}
const publicPlayerPage = publicPlayerPageExample as PublicPlayerPageServiceDto
const publicLadderPage = publicLadderPageExample as PublicLadderPageServiceDto
const publicMatchSetSummary =
  publicMatchSetSummaryExample as PublicMatchSetSummaryServiceDto
const publicReplayMetadata =
  publicReplayMetadataExample as PublicReplayMetadataServiceDto
const publicReplayEvidence =
  publicReplayEvidenceExample as PublicReplayEvidenceServiceDto

describe("createPublicGoReadClient", () => {
  it("parses public Strategy pages through the canonical schema", async () => {
    const client = createPublicGoReadClient({
      baseUrl: "http://go.local",
      fetchImpl: async (url) => {
        expect(url.toString()).toBe(
          "http://go.local/public/strategies/strategy%3Ademo",
        )
        return jsonResponse(encodedPublicStrategyPage)
      },
    })

    await expect(
      client.getPublicStrategyPage("strategy:demo"),
    ).resolves.toEqual(encodedPublicStrategyPage)
  })

  it("parses multi-route public reads through route-specific schemas", async () => {
    const requests: string[] = []
    const encodedPlayerPage: PublicPlayerPageServiceDto = {
      ...publicPlayerPage,
      canonicalHref: "/players/demo-player",
    }
    const encodedLadderPage: PublicLadderPageServiceDto = {
      ...publicLadderPage,
      canonicalHref: "/ladder/ladder-season%3Ademo",
    }
    const encodedMatchSetSummary: PublicMatchSetSummaryServiceDto = {
      ...publicMatchSetSummary,
      matchSetId: "match-set:demo",
      result: {
        ...publicMatchSetSummary.result,
        matchSetId: "match-set:demo",
      },
    }
    const encodedReplayMetadata: PublicReplayMetadataServiceDto = {
      ...publicReplayMetadata,
      matchId: "match:demo",
      metadata: {
        ...publicReplayMetadata.metadata,
        matchId: "match:demo",
      },
    }
    const encodedReplayEvidence: PublicReplayEvidenceServiceDto = {
      ...publicReplayEvidence,
      matchId: "match:demo",
      metadata: {
        ...publicReplayEvidence.metadata,
        matchId: "match:demo",
      },
    }
    const responses = new Map<string, unknown>([
      ["/public/players/demo-player", encodedPlayerPage],
      ["/public/ladders/ladder-season%3Ademo", encodedLadderPage],
      ["/public/matchsets/match-set%3Ademo/summary", encodedMatchSetSummary],
      ["/public/replays/match%3Ademo/metadata", encodedReplayMetadata],
      ["/public/replays/match%3Ademo/evidence", encodedReplayEvidence],
    ])
    const client = createPublicGoReadClient({
      baseUrl: "http://go.local",
      fetchImpl: async (url) => {
        const pathname = new URL(url.toString()).pathname
        requests.push(pathname)
        const body = responses.get(pathname)
        if (!body) {
          throw new Error(`unexpected request ${pathname}`)
        }
        return jsonResponse(body)
      },
    })

    await expect(client.getPublicPlayerPage("demo-player")).resolves.toEqual(
      encodedPlayerPage,
    )
    await expect(
      client.getPublicLadderSeason("ladder-season:demo"),
    ).resolves.toEqual(encodedLadderPage)
    await expect(
      client.getPublicMatchSetSummary("match-set:demo"),
    ).resolves.toEqual(encodedMatchSetSummary)
    await expect(client.getPublicReplayMetadata("match:demo")).resolves.toEqual(
      encodedReplayMetadata,
    )
    await expect(client.getPublicReplayEvidence("match:demo")).resolves.toEqual(
      encodedReplayEvidence,
    )
    expect(requests).toEqual([
      "/public/players/demo-player",
      "/public/ladders/ladder-season%3Ademo",
      "/public/matchsets/match-set%3Ademo/summary",
      "/public/replays/match%3Ademo/metadata",
      "/public/replays/match%3Ademo/evidence",
    ])
  })

  it("keeps route ids in multi-route Go read diagnostics", async () => {
    const client = createPublicGoReadClient({
      baseUrl: "http://go.local",
      fetchImpl: async () => new Response("not-json", { status: 200 }),
    })

    await expect(
      client.getPublicReplayMetadata("match:demo"),
    ).rejects.toMatchObject({
      diagnostic: {
        routeId: "getPublicReplayMetadata",
        failureClass: "go_non_json",
      },
    })
  })

  it("rejects replay evidence with owner-private projection data", async () => {
    const leakedEvidence = {
      ...publicReplayEvidence,
      matchId: "match:demo",
      metadata: {
        ...publicReplayEvidence.metadata,
        matchId: "match:demo",
      },
      projection: {
        ...publicReplayEvidence.projection,
        ownerPrivate: {
          playerId: "player:bottom",
          data: { strategyMemory: "PRIVATE_STRATEGY_MEMORY" },
        },
      },
    }
    const client = createPublicGoReadClient({
      baseUrl: "http://go.local",
      fetchImpl: async () => jsonResponse(leakedEvidence),
    })

    await expect(
      client.getPublicReplayEvidence("match:demo"),
    ).rejects.toMatchObject({
      diagnostic: {
        routeId: "getPublicReplayEvidence",
        failureClass: "go_privacy_violation",
      },
    })
  })

  it("rejects replay reads whose returned Match id differs from the route", async () => {
    const mismatchedMetadata: PublicReplayMetadataServiceDto = {
      ...publicReplayMetadata,
      matchId: "match:other",
      metadata: {
        ...publicReplayMetadata.metadata,
        matchId: "match:demo",
      },
    }
    const mismatchedEvidence: PublicReplayEvidenceServiceDto = {
      ...publicReplayEvidence,
      matchId: "match:demo",
      metadata: {
        ...publicReplayEvidence.metadata,
        matchId: "match:other",
      },
    }

    const metadataClient = createPublicGoReadClient({
      baseUrl: "http://go.local",
      fetchImpl: async () => jsonResponse(mismatchedMetadata),
    })
    await expect(
      metadataClient.getPublicReplayMetadata("match:demo"),
    ).rejects.toMatchObject({
      diagnostic: {
        routeId: "getPublicReplayMetadata",
        failureClass: "go_body_divergent",
      },
    })

    const evidenceClient = createPublicGoReadClient({
      baseUrl: "http://go.local",
      fetchImpl: async () => jsonResponse(mismatchedEvidence),
    })
    await expect(
      evidenceClient.getPublicReplayEvidence("match:demo"),
    ).rejects.toMatchObject({
      diagnostic: {
        routeId: "getPublicReplayEvidence",
        failureClass: "go_body_divergent",
      },
    })
  })

  it("maps public not-found errors to null", async () => {
    const client = createPublicGoReadClient({
      baseUrl: "http://go.local",
      fetchImpl: async () =>
        jsonResponse(
          {
            code: "NOT_FOUND",
            message: "Resource not found.",
            status: 404,
            publicSafe: true,
          },
          404,
        ),
    })

    await expect(
      client.getPublicStrategyPage("strategy:missing"),
    ).resolves.toBeNull()
  })

  it("rejects mismatched not-found error bodies", async () => {
    const client = createPublicGoReadClient({
      baseUrl: "http://go.local",
      fetchImpl: async () =>
        jsonResponse(
          {
            code: "INTERNAL",
            message: "Internal error.",
            status: 500,
            publicSafe: true,
          },
          404,
        ),
    })

    await expect(
      client.getPublicStrategyPage("strategy:missing"),
    ).rejects.toMatchObject({
      diagnostic: {
        failureClass: "go_status_mismatch",
        status: 404,
      },
    })
  })

  it("fails closed on unavailable Go without TypeScript fallback", async () => {
    const client = createPublicGoReadClient({
      baseUrl: "http://go.local",
      fetchImpl: async () => {
        throw Object.assign(new Error("connect ECONNREFUSED"), {
          code: "ECONNREFUSED",
        })
      },
    })

    await expect(
      client.getPublicStrategyPage("strategy:demo"),
    ).rejects.toMatchObject({
      diagnostic: {
        routeId: "getPublicStrategyPage",
        selectedBackend: "go",
        status: null,
        failureClass: "go_unavailable",
      },
    })
  })

  it("classifies body read failures before falling back to the page", async () => {
    const client = createPublicGoReadClient({
      baseUrl: "http://go.local",
      fetchImpl: async () =>
        ({
          status: 200,
          text: async () => {
            throw new DOMException("timed out", "AbortError")
          },
        }) as unknown as Response,
    })

    await expect(
      client.getPublicStrategyPage("strategy:demo"),
    ).rejects.toMatchObject({
      diagnostic: {
        failureClass: "go_timeout",
        status: 200,
      },
    })
  })

  it("classifies non-JSON, schema drift, privacy leaks, and divergence", async () => {
    const cases: Array<{
      name: string
      response: Response
      failureClass: string
    }> = [
      {
        name: "non-json",
        response: new Response("not-json", { status: 200 }),
        failureClass: "go_non_json",
      },
      {
        name: "schema drift",
        response: jsonResponse({ apiVersion: SERVICE_API_VERSION }),
        failureClass: "go_schema_invalid",
      },
      {
        name: "privacy leak",
        response: jsonResponse({
          ...encodedPublicStrategyPage,
          payload: {
            strategy: {
              ...encodedPublicStrategyPage.payload.strategy,
              source: "private Strategy source",
            },
          },
        }),
        failureClass: "go_privacy_violation",
      },
      {
        name: "divergence",
        response: jsonResponse({
          ...encodedPublicStrategyPage,
          canonicalHref: "/strategies/another",
        }),
        failureClass: "go_body_divergent",
      },
      {
        name: "unsafe link",
        response: jsonResponse({
          ...encodedPublicStrategyPage,
          payload: {
            strategy: {
              ...encodedPublicStrategyPage.payload.strategy,
              resultLinks: ["javascript:alert(1)"],
            },
          },
        }),
        failureClass: "go_body_divergent",
      },
    ]

    for (const item of cases) {
      const client = createPublicGoReadClient({
        baseUrl: "http://go.local",
        fetchImpl: async () => item.response,
      })
      try {
        await client.getPublicStrategyPage("strategy:demo")
        throw new Error(`${item.name} unexpectedly passed`)
      } catch (error) {
        expect(isPublicGoReadError(error)).toBe(true)
        if (isPublicGoReadError(error)) {
          expect(error.diagnostic.failureClass).toBe(item.failureClass)
        }
      }
    }
  })
})
