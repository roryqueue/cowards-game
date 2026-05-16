import { readdir, readFile } from "node:fs/promises"
import type { Pool } from "pg"
import { withTransaction } from "./db.js"

export interface MigrationFile {
  name: string
  sql: string
}

export interface MigrationResult {
  applied: string[]
  skipped: string[]
}

export const migrationsDirectory = new URL("../migrations/", import.meta.url)

export const readMigrationFiles = async (): Promise<MigrationFile[]> => {
  const names = (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right))

  return Promise.all(
    names.map(async (name) => ({
      name,
      sql: await readFile(new URL(name, migrationsDirectory), "utf8"),
    })),
  )
}

export const migrate = async (pool: Pool): Promise<MigrationResult> => {
  await pool.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `)

  const files = await readMigrationFiles()
  const result: MigrationResult = { applied: [], skipped: [] }

  for (const file of files) {
    const existing = await pool.query<{ filename: string }>(
      "select filename from schema_migrations where filename = $1",
      [file.name],
    )
    if ((existing.rowCount ?? 0) > 0) {
      result.skipped.push(file.name)
      continue
    }

    await withTransaction(pool, async (client) => {
      await client.query(file.sql)
      await client.query(
        "insert into schema_migrations (filename) values ($1)",
        [file.name],
      )
    })
    result.applied.push(file.name)
  }

  return result
}
