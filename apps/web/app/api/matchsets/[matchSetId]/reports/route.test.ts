import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCurrentCompetitiveUser: vi.fn(),
  submitCompetitionReport: vi.fn(),
}))

vi.mock("../../../../competitive/server.js", () => ({
  getCurrentCompetitiveUser: mocks.getCurrentCompetitiveUser,
  competitiveServer: {
    submitCompetitionReport: mocks.submitCompetitionReport,
  },
}))

import { POST } from "./route.js"

describe("competition report route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentCompetitiveUser.mockResolvedValue({ id: "user:1" })
    mocks.submitCompetitionReport.mockResolvedValue({
      submissionId: "report:1",
      disposition: "created",
      publicMessage: "Report received.",
    })
  })

  it("requires sign in and rejects unknown private fields", async () => {
    mocks.getCurrentCompetitiveUser.mockResolvedValueOnce(null)
    const anonymous = await POST(
      new Request("http://local", { method: "POST", body: "{}" }),
      { params: { matchSetId: "matchset:1" } },
    )
    expect(anonymous.status).toBe(401)

    const invalid = await POST(
      new Request("http://local", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          submissionType: "report",
          category: "other",
          reporterUserId: "forged",
        }),
      }),
      { params: { matchSetId: "matchset:1" } },
    )
    expect(invalid.status).toBe(422)
  })

  it("delegates only typed intake and returns a constrained receipt", async () => {
    const response = await POST(
      new Request("http://local", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          submissionType: "report",
          category: "result_integrity",
          privateDetail: "Review this result.",
        }),
      }),
      { params: { matchSetId: "matchset:1" } },
    )
    expect(response.status).toBe(201)
    expect(mocks.submitCompetitionReport).toHaveBeenCalledWith(
      { id: "user:1" },
      {
        matchSetId: "matchset:1",
        submissionType: "report",
        category: "result_integrity",
        privateDetail: "Review this result.",
      },
    )
    expect(await response.json()).toEqual({
      submissionId: "report:1",
      disposition: "created",
      publicMessage: "Report received.",
    })
  })
})
