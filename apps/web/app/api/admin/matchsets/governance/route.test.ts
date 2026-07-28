import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCurrentCompetitiveUser: vi.fn(),
  applyCompetitionGovernanceAction: vi.fn(),
}))

vi.mock("../../../../competitive/server.js", () => ({
  getCurrentCompetitiveUser: mocks.getCurrentCompetitiveUser,
  competitiveServer: {
    applyCompetitionGovernanceAction: mocks.applyCompetitionGovernanceAction,
  },
}))

import { POST } from "./route.js"

describe("group governance route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentCompetitiveUser.mockResolvedValue({ id: "admin:1" })
    mocks.applyCompetitionGovernanceAction.mockResolvedValue(undefined)
  })

  it("rejects duplicates and arbitrary public copy", async () => {
    const response = await POST(
      new Request("http://local", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          matchSetIds: ["matchset:1", "matchset:1"],
          action: "invalid",
          category: "result_invalid",
          privateReason: "Reviewed evidence.",
          publicExplanation: "forged",
        }),
      }),
    )
    expect(response.status).toBe(422)
  })

  it("delegates a strict bounded action", async () => {
    const body = {
      matchSetIds: ["matchset:1", "matchset:2"],
      action: "under_review",
      category: "integrity_review",
      privateReason: "Integrity review requested.",
    }
    const response = await POST(
      new Request("http://local", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    )
    expect(response.status).toBe(200)
    expect(mocks.applyCompetitionGovernanceAction).toHaveBeenCalledWith(
      { id: "admin:1" },
      body,
    )
  })
})
