import { describe, expect, it } from "vitest"
import { SERVICE_API_VERSION } from "@cowards/spec"
import { createWorkshopAnalyticsCompareGetHandler } from "./route.js"

describe("Workshop analytics compare route", () => {
  it("returns the legacy raw comparison shape from the service DTO", async () => {
    const handler = createWorkshopAnalyticsCompareGetHandler(
      async (profileId) => ({
        apiVersion: SERVICE_API_VERSION,
        kind: "workshopAnalyticsComparison",
        profileId,
        comparison: {
          profileId,
          baseRunId: "analytics-run:base",
          compareRunId: "analytics-run:compare",
          compatibilityEquivalent: true,
          delta: { wins: 1, losses: -1, draws: 0, points: 3 },
        },
      }),
      () => true,
    )

    const response = await handler(new Request("http://local"), {
      params: { profileId: "analytics-profile:demo" },
    })

    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({
      profileId: "analytics-profile:demo",
      baseRunId: "analytics-run:base",
      compareRunId: "analytics-run:compare",
      compatibilityEquivalent: true,
      delta: { wins: 1, losses: -1, draws: 0, points: 3 },
    })
  })

  it("preserves production availability, missing, and storage errors", async () => {
    const forbidden = await createWorkshopAnalyticsCompareGetHandler(
      async () => {
        throw new Error("should not read")
      },
      () => false,
    )(new Request("http://local"), {
      params: { profileId: "analytics-profile:demo" },
    })
    expect(forbidden.status).toBe(403)

    const missing = await createWorkshopAnalyticsCompareGetHandler(
      async () => null,
      () => true,
    )(new Request("http://local"), {
      params: { profileId: "analytics-profile:missing" },
    })
    expect(missing.status).toBe(404)
    await expect(missing.json()).resolves.toEqual({
      error: "Analytics profile not found",
    })

    const storageUnavailable = await createWorkshopAnalyticsCompareGetHandler(
      async () => {
        throw Object.assign(new Error("db unavailable"), {
          code: "ECONNREFUSED",
        })
      },
      () => true,
    )(new Request("http://local"), {
      params: { profileId: "analytics-profile:demo" },
    })
    expect(storageUnavailable.status).toBe(503)
    await expect(storageUnavailable.json()).resolves.toEqual({
      error: "Storage is unavailable; start local services and retry.",
    })
  })
})
