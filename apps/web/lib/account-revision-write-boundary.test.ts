import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createStrategyRevision: vi.fn(),
  getAccountSessionId: vi.fn(async () => "session:phase258"),
  listAccountReadRevisions: vi.fn(),
}))

vi.mock("./account-service-adapter.js", () => ({
  getAccountSessionId: mocks.getAccountSessionId,
  requireSelectedGoBackendClient: () => ({
    createStrategyRevision: mocks.createStrategyRevision,
  }),
}))

vi.mock("./account-service-boundary.js", () => ({
  listAccountReadRevisions: mocks.listAccountReadRevisions,
}))

import {
  exactStrategySource,
  saveAccountRevisionFromRequest,
} from "./account-revision-write-boundary.js"

describe("account revision exact-source write boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createStrategyRevision.mockResolvedValue({
      strategyRevisionId: "strategy-revision:phase258",
    })
    mocks.listAccountReadRevisions.mockResolvedValue([
      { id: "strategy-revision:phase258" },
    ])
  })

  it.each([
    ["LF", "alpha\nbeta\n"],
    ["CRLF", "alpha\r\nbeta\r\n"],
    ["CR", "alpha\rbeta\r"],
    ["mixed", "alpha\r\nbeta\ngamma\rdelta"],
    ["no final newline", "alpha\nbeta"],
    ["BOM", "\ufeffalpha\n"],
  ])("forwards %s bytes without trim or line-ending conversion", async (_name, source) => {
    await saveAccountRevisionFromRequest(
      new Request("http://cowards.test/api/account/revisions/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source, label: "  label  ", notes: " note " }),
      }),
    )

    expect(mocks.createStrategyRevision).toHaveBeenCalledWith(
      "session:phase258",
      expect.objectContaining({ source }),
    )
  })

  it("validates whitespace emptiness without changing accepted source", () => {
    expect(exactStrategySource("  pass\r\n")).toBe("  pass\r\n")
    expect(() => exactStrategySource(" \r\n\t ")).toThrow(/empty/i)
    expect(() => exactStrategySource(42)).toThrow(/string/i)
  })
})
