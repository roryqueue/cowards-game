import { describe, expect, it } from "vitest"
import {
  SERVICE_API_VERSION,
  publicStrategyPageExample,
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
