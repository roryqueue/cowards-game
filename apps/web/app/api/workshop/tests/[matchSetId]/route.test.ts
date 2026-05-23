import { describe, expect, it } from "vitest"
import { SERVICE_API_VERSION } from "@cowards/spec"
import { createWorkshopTestSummaryGetHandler } from "./route.js"

describe("Workshop test summary route", () => {
  it("returns the legacy raw summary shape from the service DTO", async () => {
    const handler = createWorkshopTestSummaryGetHandler(async (matchSetId) => ({
      apiVersion: SERVICE_API_VERSION,
      kind: "workshopTestSummary",
      matchSetId,
      summary: {
        matchSetId,
        status: "complete",
        matchCount: 1,
        matchIds: ["match:demo"],
        matches: [
          {
            matchId: "match:demo",
            status: "complete",
            bottomPlayerId: "player:bottom",
            topPlayerId: "player:top",
            hasReplay: true,
          },
        ],
        scoring: { complete: true, degraded: false, rankings: [] },
      },
    }))

    const response = await handler(new Request("http://local"), {
      params: { matchSetId: "match-set:workshop:demo" },
    })

    await expect(response.json()).resolves.toEqual({
      matchSetId: "match-set:workshop:demo",
      status: "complete",
      matchCount: 1,
      matchIds: ["match:demo"],
      matches: [
        {
          matchId: "match:demo",
          status: "complete",
          bottomPlayerId: "player:bottom",
          topPlayerId: "player:top",
          hasReplay: true,
        },
      ],
      scoring: { complete: true, degraded: false, rankings: [] },
    })
  })

  it("preserves missing summary behavior", async () => {
    const handler = createWorkshopTestSummaryGetHandler(async () => null)
    const response = await handler(new Request("http://local"), {
      params: { matchSetId: "match-set:missing" },
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: "Match set not found",
    })
  })

  it("maps storage-unavailable failures to a public-safe 503", async () => {
    const error = Object.assign(new Error("connection refused"), {
      code: "ECONNREFUSED",
    })
    const handler = createWorkshopTestSummaryGetHandler(async () => {
      throw error
    })

    const response = await handler(new Request("http://local"), {
      params: { matchSetId: "match-set:storage-down" },
    })

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: "Storage is unavailable; start local services and retry.",
    })
  })
})
