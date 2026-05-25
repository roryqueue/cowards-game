import { describe, expect, it } from "vitest"
import { SERVICE_API_VERSION, assertPublicOutputLeakSafe } from "@cowards/spec"
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
    const body = await response.json()
    expect(body).toEqual({
      profileId: "analytics-profile:demo",
      baseRunId: "analytics-run:base",
      compareRunId: "analytics-run:compare",
      compatibilityEquivalent: true,
      delta: { wins: 1, losses: -1, draws: 0, points: 3 },
    })
    expect(() => assertPublicOutputLeakSafe(body)).not.toThrow()
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
    const forbiddenBody = await forbidden.json()
    expect(forbiddenBody).toEqual({
      error: "Analytics comparison is available only locally or to owners.",
    })
    expect(() => assertPublicOutputLeakSafe(forbiddenBody)).not.toThrow()

    const missing = await createWorkshopAnalyticsCompareGetHandler(
      async () => null,
      () => true,
    )(new Request("http://local"), {
      params: { profileId: "analytics-profile:missing" },
    })
    expect(missing.status).toBe(404)
    const missingBody = await missing.json()
    expect(missingBody).toEqual({
      error: "Analytics profile not found",
    })
    expect(() => assertPublicOutputLeakSafe(missingBody)).not.toThrow()

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
    const storageUnavailableBody = await storageUnavailable.json()
    expect(storageUnavailableBody).toEqual({
      error: "Storage is unavailable; start local services and retry.",
    })
    expect(() =>
      assertPublicOutputLeakSafe(storageUnavailableBody),
    ).not.toThrow()
  })
})
