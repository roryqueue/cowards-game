import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createAccountStrategyRevision: vi.fn(),
  listAccountStrategyRevisions: vi.fn(),
}))

vi.mock("@cowards/persistence/account-revisions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@cowards/persistence/account-revisions")>()),
  createAccountStrategyRevision: mocks.createAccountStrategyRevision,
  listAccountStrategyRevisions: mocks.listAccountStrategyRevisions,
}))

vi.mock("@cowards/service", () => ({
  createCowardsLocalService: () => ({}),
}))

import { createCompetitiveServer } from "./server.js"

describe("competitiveServer.saveAccountRevision exact source", () => {
  it("uses trimmed text only as an emptiness predicate", async () => {
    const source = "  alpha\r\nbeta\ngamma\r  "
    mocks.createAccountStrategyRevision.mockResolvedValue({ id: "revision:1" })
    mocks.listAccountStrategyRevisions.mockResolvedValue([{ id: "revision:1" }])
    const withPool = vi.fn(async (fn: (pool: never) => Promise<unknown>) => fn({} as never))
    const server = createCompetitiveServer({ withPool })

    await server.saveAccountRevision(
      { id: "user:1" } as never,
      { source, label: " label ", notes: " notes " },
    )

    expect(mocks.createAccountStrategyRevision).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ source, label: "label", notes: "notes" }),
    )
  })
})
