import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createMatchSet: vi.fn(),
  getAccountSessionId: vi.fn(),
  requireSelectedGoBackendClient: vi.fn(),
}))

vi.mock("../../../lib/account-service-adapter.js", () => ({
  getAccountSessionId: mocks.getAccountSessionId,
  requireSelectedGoBackendClient: mocks.requireSelectedGoBackendClient,
}))

import { POST } from "./route.js"

const request = (body: unknown): Request =>
  new Request("http://test.local/api/exhibitions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })

describe("POST /api/exhibitions", () => {
  beforeEach(() => {
    mocks.createMatchSet.mockReset()
    mocks.getAccountSessionId.mockReset()
    mocks.requireSelectedGoBackendClient.mockReset()
    mocks.getAccountSessionId.mockResolvedValue("session:exhibition")
    mocks.requireSelectedGoBackendClient.mockReturnValue({
      createMatchSet: mocks.createMatchSet,
    })
  })

  it("keeps same-player multi-revision creation on the exhibition backend", async () => {
    mocks.createMatchSet.mockResolvedValue({
      matchSetId: "match-set:exhibition:test",
      matchCount: 2,
    })

    const response = await POST(
      request({
        presetId: "smoke-exhibition-v1",
        revisionIds: ["strategy-revision:a", "strategy-revision:b"],
        counted: true,
      }),
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      matchSetId: "match-set:exhibition:test",
      status: "queued",
      matchCount: 2,
      competitionImpact: "exhibition-only",
      standingsImpact: "none",
    })
    expect(mocks.createMatchSet).toHaveBeenCalledWith("session:exhibition", {
      presetId: "smoke-exhibition-v1",
      revisionIds: ["strategy-revision:a", "strategy-revision:b"],
    })
  })

  it("preserves the flexible non-counted evidence option without ladder entry", async () => {
    mocks.createMatchSet.mockResolvedValue({
      matchSetId: "match-set:exhibition:flexible",
      matchCount: 2,
    })

    await POST(
      request({
        presetId: "smoke-exhibition-v1",
        revisionIds: ["strategy-revision:a", "strategy-revision:b"],
        counted: false,
      }),
    )

    expect(mocks.createMatchSet).toHaveBeenCalledWith("session:exhibition", {
      presetId: "smoke-exhibition-v1",
      revisionIds: ["strategy-revision:a", "strategy-revision:b"],
      counted: false,
    })
  })
})
