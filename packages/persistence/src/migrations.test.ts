import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"
import { createDevelopmentSeedData } from "./seed.js"
import { migrationsDirectory, readMigrationFiles } from "./migrations.js"

const requiredTables = [
  "users",
  "strategies",
  "strategy_revisions",
  "arena_variants",
  "matches",
  "match_sets",
  "match_set_matches",
  "chronicles",
  "match_jobs",
  "match_job_attempts",
]

describe("migrations", () => {
  it("reads migration files in lexical order", async () => {
    const files = await readMigrationFiles()
    const names = files.map((file) => file.name)

    expect(names).toContain("0001_initial.sql")
    expect(names).toContain("0002_match_side_completion_stats.sql")
    expect(names).toEqual([...names].sort())
  })

  it("initial schema defines every Phase 5 persistence table", async () => {
    const sql = await readFile(
      new URL("0001_initial.sql", migrationsDirectory),
      "utf8",
    )

    for (const table of requiredTables) {
      expect(sql).toContain(`create table ${table}`)
    }
  })
})

describe("development seed data", () => {
  it("includes deterministic local data for development smoke runs", () => {
    const seed = createDevelopmentSeedData()

    expect(seed.users).toHaveLength(1)
    expect(seed.strategies.map((strategy) => strategy.id)).toEqual([
      "strategy:cautious",
      "strategy:reckless",
    ])
    expect(seed.revisions).toHaveLength(2)
    expect(seed.arenas.map((arena) => arena.id)).toContain("arena:smoke:v1")
    expect(seed.matchSets[0]?.matrix[0]?.seed).toBe("seed:smoke:001")
  })
})
