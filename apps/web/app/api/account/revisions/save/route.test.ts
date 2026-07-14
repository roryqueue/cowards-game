import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
}))

vi.mock("../../../../../lib/account-revision-write-boundary.js", () => ({
  saveAccountRevisionFromRequest: mocks.save,
}))

import { POST } from "./route.js"

describe("POST /api/account/revisions/save", () => {
  it("delegates the untouched request to the selected Go write boundary", async () => {
    const request = new Request("http://cowards.test/api/account/revisions/save", {
      method: "POST",
      body: JSON.stringify({ source: "a\r\nb\nc\r" }),
    })
    mocks.save.mockResolvedValue(Response.json({ ok: true }, { status: 201 }))

    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(mocks.save).toHaveBeenCalledWith(request)
  })
})
