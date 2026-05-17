import { describe, expect, it } from "vitest"
import { createWorkshopServer } from "./server.js"

const validSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({ soldierId: soldier.id })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: input.soldierMemory }
  }
}
`.trim()

describe("Workshop server facade", () => {
  it("returns validation errors without inserting invalid source", async () => {
    let inserted = false
    const server = createWorkshopServer({
      withPool: async (fn) => fn({} as never),
      insertRevision: async () => {
        inserted = true
        throw new Error("should not insert invalid source")
      },
    })

    const response = await server.submitSource({ source: "export default {}" })

    expect(response.ok).toBe(false)
    expect(response.validation.valid).toBe(false)
    expect(inserted).toBe(false)
  })

  it("builds and inserts Workshop revisions without returning source text", async () => {
    const insertedIds: string[] = []
    const server = createWorkshopServer({
      withPool: async (fn) => fn({} as never),
      insertRevision: async (_pool, revision) => {
        insertedIds.push(revision.id)
        return revision
      },
    })

    const response = await server.submitSource({
      source: validSource,
      label: "Local test",
      notes: "Workshop note",
    })

    expect(response.ok).toBe(true)
    if (response.ok) {
      expect(insertedIds).toEqual([response.revision.id])
      expect(response.revision.metadata).toMatchObject({
        createdBy: "user:local",
        label: "Local test",
        notes: "Workshop note",
      })
      expect(response.revision).not.toHaveProperty("source")
    }
  })

  it("delegates source, launch, and status lookups through injected services", async () => {
    const server = createWorkshopServer({
      withPool: async (fn) => fn({} as never),
      getSource: async (_pool, revisionId) => `source:${revisionId}`,
      createTestMatchSet: async (_pool, input) => ({
        matchSetId: `match-set:${input.revisionId}`,
        matchIds: ["match:1"],
      }),
      getTestSummary: async (_pool, matchSetId) => ({
        matchSetId,
        status: "pending",
        matchCount: 1,
        matches: [{ matchId: "match:1", status: "pending" }],
        scoring: { complete: false, degraded: false, rankings: [] },
      }),
    })

    await expect(server.getRevisionSource("strategy-revision:1")).resolves.toBe(
      "source:strategy-revision:1",
    )
    await expect(
      server.launchTest({
        revisionId: "strategy-revision:1",
        opponentId: "opponent:cautious",
        presetId: "smoke-v1",
      }),
    ).resolves.toEqual({
      matchSetId: "match-set:strategy-revision:1",
      matchIds: ["match:1"],
    })
    await expect(server.getTestSummary("match-set:1")).resolves.toMatchObject({
      status: "pending",
      matchCount: 1,
    })
  })
})
