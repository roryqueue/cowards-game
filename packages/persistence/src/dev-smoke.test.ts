import { describe, expect, it } from "vitest"
import { defaultDatabaseUrl } from "./db.js"
import { runDevelopmentMatchSetSmoke } from "./dev-smoke.js"

describe("development smoke helper", () => {
  it("exports the local PostgreSQL smoke contract", () => {
    expect(defaultDatabaseUrl).toBe(
      "postgresql://cowards:cowards@localhost:5432/cowards_game",
    )
    expect(runDevelopmentMatchSetSmoke).toBeTypeOf("function")
  })

  it.skipIf(process.env.DATABASE_URL === undefined)(
    "can run against an explicit DATABASE_URL integration database",
    async () => {
      const { createDatabasePool } = await import("./db.js")
      const pool = createDatabasePool()
      try {
        const result = await runDevelopmentMatchSetSmoke(pool, {
          runQueuedMatch: async () => undefined,
        })
        expect(result.matchSetId).toBe("match-set:dev-smoke:v1")
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
