import { describe, expect, it } from "vitest"
import type { Pool } from "pg"
import { defaultDatabaseUrl } from "./db.js"
import { runDevelopmentMatchSetSmoke } from "./dev-smoke.js"
import { createFixtureMatchSetEvidenceResolver } from "./matchset-service.js"

describe("development smoke helper", () => {
  it("exports the local PostgreSQL smoke contract", () => {
    expect(defaultDatabaseUrl).toBe(
      "postgresql://cowards:cowards@localhost:5432/cowards_game",
    )
    expect(runDevelopmentMatchSetSmoke).toBeTypeOf("function")
  })

  it("fails before touching PostgreSQL without explicit fixture authority", async () => {
    let touched = false
    const pool = {
      connect: async () => {
        touched = true
        throw new Error("database must not be reached")
      },
      query: async () => {
        touched = true
        throw new Error("database must not be reached")
      },
    } as unknown as Pool

    await expect(runDevelopmentMatchSetSmoke(pool)).rejects.toThrow(
      /explicit fixture-domain evidence/i,
    )
    expect(touched).toBe(false)
  })

  it.skipIf(process.env.DATABASE_URL === undefined)(
    "can run against an explicit DATABASE_URL integration database",
    async () => {
      const { createDatabasePool } = await import("./db.js")
      const pool = createDatabasePool()
      try {
        const result = await runDevelopmentMatchSetSmoke(pool, {
          matchSetId: `match-set:dev-smoke:${randomUUID()}`,
          evidenceResolver: createFixtureMatchSetEvidenceResolver(),
          runQueuedMatch: async () => undefined,
        })
        expect(result.matchSetId).toMatch(/^match-set:dev-smoke:/u)
        expect(result.matchIds.length).toBe(result.matchCount)
        expect(["complete", "degraded", "pending", "running"]).toContain(
          result.status,
        )
        expect(result.chronicleCount).toBeGreaterThanOrEqual(0)
      } finally {
        await pool.end()
      }
    },
  )
})
import { randomUUID } from "node:crypto"
