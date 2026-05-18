import { describe, expect, it } from "vitest"
import { createWorkshopServer, isStorageUnavailableError } from "./server.js"

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
        status: "pending",
        matchIds: ["match:1"],
        matchCount: 1,
        matches: [
          {
            matchId: "match:1",
            status: "pending",
            bottomPlayerId: "player:workshop-local",
            topPlayerId: "player:opponent",
            hasReplay: false,
          },
        ],
        scoring: { complete: false, degraded: false, rankings: [] },
      }),
      getTestSummary: async (_pool, matchSetId) => ({
        matchSetId,
        status: "pending",
        matchCount: 1,
        matches: [
          {
            matchId: "match:1",
            status: "pending",
            bottomPlayerId: "player:workshop-local",
            topPlayerId: "player:opponent",
            hasReplay: false,
          },
        ],
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
      status: "pending",
      matchIds: ["match:1"],
      matchCount: 1,
      matches: [
        {
          matchId: "match:1",
          status: "pending",
          bottomPlayerId: "player:workshop-local",
          topPlayerId: "player:opponent",
          hasReplay: false,
        },
      ],
      scoring: { complete: false, degraded: false, rankings: [] },
    })
    await expect(server.getTestSummary("match-set:1")).resolves.toMatchObject({
      status: "pending",
      matchCount: 1,
    })
  })

  it("falls back to static Workshop data only for storage-unavailable errors", async () => {
    const server = createWorkshopServer({
      withPool: async () => {
        throw Object.assign(new Error("database is unavailable"), {
          code: "ECONNREFUSED",
        })
      },
    })

    await expect(server.getInitialData()).resolves.toMatchObject({
      revisions: [],
      opponents: expect.any(Array),
      presets: expect.any(Array),
      templates: expect.any(Array),
    })

    const unexpected = createWorkshopServer({
      withPool: async () => {
        throw Object.assign(new Error("schema drift"), { code: "42P01" })
      },
    })

    await expect(unexpected.getInitialData()).rejects.toThrow("schema drift")
  })

  it("recognizes storage errors through nested causes", () => {
    expect(
      isStorageUnavailableError({
        cause: Object.assign(new Error("refused"), { code: "ECONNREFUSED" }),
      }),
    ).toBe(true)
    expect(isStorageUnavailableError({ code: "42P01" })).toBe(false)
  })
})
