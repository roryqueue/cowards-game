import {
  ARENA_CATALOG_VERSION_V1_37,
  CANONICAL_ARENA_CATALOG_V1_37,
} from "@cowards/spec"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { randomUUID } from "node:crypto"
import { Pool } from "pg"
import { migrate } from "./migrations.js"
import { createRepositories } from "./repositories.js"

const databaseUrl = process.env.DATABASE_URL
const describeDatabase = databaseUrl ? describe : describe.skip

interface MutableArenaCatalog {
  catalogVersion: string
  arenas: Array<{
    name: string
    status: string
    aliasOf?: string
    semanticGeometryHash: string
  }>
}

describeDatabase("released arena catalog repositories", () => {
  let admin: Pool
  let pool: Pool
  let schema: string

  beforeAll(async () => {
    schema = `phase260_repositories_${randomUUID().replaceAll("-", "")}`
    admin = new Pool({ connectionString: databaseUrl!, max: 1 })
    await admin.query(`create schema ${schema}`)
    pool = new Pool({
      connectionString: databaseUrl!,
      max: 2,
      options: `-c search_path=${schema}`,
    })
    await migrate(pool)
  })

  afterAll(async () => {
    await pool.end()
    await admin.query(`drop schema if exists ${schema} cascade`)
    await admin.end()
  })

  it("installs the exact released catalog idempotently and resolves aliases explicitly", async () => {
    const repositories = createRepositories(pool)
    const first = await repositories.installReleasedArenaCatalog(
      CANONICAL_ARENA_CATALOG_V1_37,
    )
    const second = await repositories.installReleasedArenaCatalog(
      CANONICAL_ARENA_CATALOG_V1_37,
    )

    expect(second).toEqual(first)
    expect(first).toHaveLength(3)
    expect(Object.isFrozen(first[0])).toBe(true)
    await expect(
      repositories.getReleasedArenaCatalogEntry(
        ARENA_CATALOG_VERSION_V1_37,
        "arena:smoke:v1",
      ),
    ).resolves.toMatchObject({
      arenaId: "arena:smoke:v1",
      status: "active",
      schedulable: true,
      aliasOfArenaId: null,
    })
    await expect(
      repositories.getReleasedArenaCatalogEntry(
        ARENA_CATALOG_VERSION_V1_37,
        "arena:open-field:v1",
      ),
    ).resolves.toMatchObject({
      arenaId: "arena:open-field:v1",
      status: "historical_alias",
      schedulable: false,
      aliasOfArenaId: "arena:smoke:v1",
    })
    await expect(
      repositories.getSchedulableArenaCatalogEntry(
        ARENA_CATALOG_VERSION_V1_37,
        "arena:open-field:v1",
      ),
    ).resolves.toBeNull()
  })

  it.each<[string, (catalog: MutableArenaCatalog) => void]>([
    ["config", (catalog: MutableArenaCatalog) => (catalog.arenas[0]!.name = "Changed")],
    ["status", (catalog: MutableArenaCatalog) => (catalog.arenas[0]!.status = "historical_alias")],
    ["alias", (catalog: MutableArenaCatalog) => (catalog.arenas[2]!.aliasOf = "arena:standard-cross:v1")],
    ["hash", (catalog: MutableArenaCatalog) => (catalog.arenas[0]!.semanticGeometryHash = `sha256:${"0".repeat(64)}`)],
    ["version", (catalog: MutableArenaCatalog) => (catalog.catalogVersion = "canonical-arena-catalog-v1.38")],
  ])("rejects changed released %s", async (_name, mutate) => {
    const repositories = createRepositories(pool)
    const changed = globalThis.structuredClone(
      CANONICAL_ARENA_CATALOG_V1_37,
    ) as unknown as MutableArenaCatalog
    mutate(changed)
    await expect(
      repositories.installReleasedArenaCatalog(changed),
    ).rejects.toThrow(/catalog|arena|geometry|alias|shape|mismatch/iu)
  })
})
