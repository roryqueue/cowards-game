import type {
  ArenaCatalogRecordV137,
  ArenaCatalogV137,
  ArenaVariant,
  ArenaVariantId,
  MatchId,
  MatchSetId,
  StrategyRevision,
  StrategyRevisionId,
} from "@cowards/spec"
import {
  hashCanonicalIdentity,
  normalizeStrategyRuntimeMetadata,
  parseArenaCatalogV137,
} from "@cowards/spec"
import { Buffer } from "node:buffer"
import type { Pool, PoolClient } from "pg"

export type Queryable = Pick<Pool | PoolClient, "query">

export interface ReleasedArenaCatalogSnapshot {
  catalogVersion: string
  arenaId: string
  arenaVersion: string
  arenaName: string
  status: ArenaCatalogRecordV137["status"]
  schedulable: boolean
  aliasOfArenaId: string | null
  geometryHashProfile: string
  semanticGeometryHash: `sha256:${string}`
  config: ArenaCatalogRecordV137
}

interface ReleasedArenaCatalogRow {
  catalog_version: string
  arena_id: string
  arena_version: string
  arena_name: string
  arena_status: ArenaCatalogRecordV137["status"]
  schedulable: boolean
  alias_of_arena_id: string | null
  geometry_hash_profile: string
  semantic_geometry_hash: `sha256:${string}`
  config: ArenaCatalogRecordV137
}

const freezeReleasedArenaSnapshot = (
  row: ReleasedArenaCatalogRow,
): Readonly<ReleasedArenaCatalogSnapshot> =>
  Object.freeze({
    catalogVersion: row.catalog_version,
    arenaId: row.arena_id,
    arenaVersion: row.arena_version,
    arenaName: row.arena_name,
    status: row.arena_status,
    schedulable: row.schedulable,
    aliasOfArenaId: row.alias_of_arena_id,
    geometryHashProfile: row.geometry_hash_profile,
    semanticGeometryHash: row.semantic_geometry_hash,
    config: Object.freeze(globalThis.structuredClone(row.config)),
  })

const hasPoolConnection = (db: Queryable): db is Pool =>
  "connect" in db && typeof db.connect === "function"

const withRepositoryTransaction = async <T>(
  db: Queryable,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  if (!hasPoolConnection(db)) {
    throw new Error("Released catalog installation requires a database Pool.")
  }
  const client = await db.connect()
  try {
    await client.query("begin isolation level serializable")
    const result = await fn(client)
    await client.query("commit")
    return result
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    client.release()
  }
}

export interface SourceIdentityV2PersistenceRecord {
  sourceIdentityVersion: "strategy-source-identity-v2"
  originalSourceHash: string
  originalSourceBytes: number
  normalizedSourceHash: string
  normalizedSourceBytes: number
  sourceNormalizationPolicy: "source-line-endings-lf-v1.17"
  sourceLineEndings: {
    kind: "none" | "lf" | "crlf" | "cr" | "mixed"
    lf: number
    crlf: number
    cr: number
  }
  sourceHasFinalNewline: boolean
}

export const buildSourceIdentityV2PersistenceRecord = (
  source: string,
): SourceIdentityV2PersistenceRecord => {
  const original = Buffer.from(source, "utf8")
  let lf = 0
  let crlf = 0
  let cr = 0
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\r") {
      if (source[index + 1] === "\n") {
        crlf += 1
        index += 1
      } else {
        cr += 1
      }
    } else if (source[index] === "\n") {
      lf += 1
    }
  }
  const present = [lf > 0, crlf > 0, cr > 0].filter(Boolean).length
  const kind =
    present === 0
      ? "none"
      : present > 1
        ? "mixed"
        : lf > 0
          ? "lf"
          : crlf > 0
            ? "crlf"
            : "cr"
  const normalized = Buffer.from(source.replace(/\r\n?/gu, "\n"), "utf8")
  return {
    sourceIdentityVersion: "strategy-source-identity-v2",
    originalSourceHash: hashCanonicalIdentity("originalSource", [original]),
    originalSourceBytes: original.byteLength,
    normalizedSourceHash: hashCanonicalIdentity("normalizedSource", [
      normalized,
    ]),
    normalizedSourceBytes: normalized.byteLength,
    sourceNormalizationPolicy: "source-line-endings-lf-v1.17",
    sourceLineEndings: { kind, lf, crlf, cr },
    sourceHasFinalNewline: source.endsWith("\n") || source.endsWith("\r"),
  }
}

const sourceIdentityMatches = (
  actual: SourceIdentityV2PersistenceRecord,
  expected: SourceIdentityV2PersistenceRecord,
): boolean =>
  actual.sourceIdentityVersion === expected.sourceIdentityVersion &&
  actual.originalSourceHash === expected.originalSourceHash &&
  actual.originalSourceBytes === expected.originalSourceBytes &&
  actual.normalizedSourceHash === expected.normalizedSourceHash &&
  actual.normalizedSourceBytes === expected.normalizedSourceBytes &&
  actual.sourceNormalizationPolicy === expected.sourceNormalizationPolicy &&
  actual.sourceLineEndings.kind === expected.sourceLineEndings.kind &&
  actual.sourceLineEndings.lf === expected.sourceLineEndings.lf &&
  actual.sourceLineEndings.crlf === expected.sourceLineEndings.crlf &&
  actual.sourceLineEndings.cr === expected.sourceLineEndings.cr &&
  actual.sourceHasFinalNewline === expected.sourceHasFinalNewline

export const REVISION_CONTENT_COLUMNS = [
  "source",
  "source_hash",
  "source_bytes",
  "runtime",
  "engine_compatibility",
  "validation",
  "compiled_artifact",
] as const

export const assertCanUpdateStrategyRevisionContent = (input: {
  lockedAt: Date | string | null | undefined
  changedColumns: readonly string[]
}): void => {
  if (!input.lockedAt) {
    return
  }
  const changedLockedColumn = input.changedColumns.find((column) =>
    REVISION_CONTENT_COLUMNS.includes(
      column as (typeof REVISION_CONTENT_COLUMNS)[number],
    ),
  )
  if (changedLockedColumn) {
    throw new Error(
      `Cannot update locked StrategyRevision content column: ${changedLockedColumn}`,
    )
  }
}

export const createRepositories = (db: Queryable) => ({
  async installReleasedArenaCatalog(
    input: unknown,
  ): Promise<ReadonlyArray<Readonly<ReleasedArenaCatalogSnapshot>>> {
    const catalog: ArenaCatalogV137 = parseArenaCatalogV137(input)
    return withRepositoryTransaction(db, async (client) => {
      await client.query(
        "select pg_advisory_xact_lock(hashtext($1), hashtext($2))",
        ["released-arena-catalog", catalog.catalogVersion],
      )
      const installed: Readonly<ReleasedArenaCatalogSnapshot>[] = []
      for (const arena of catalog.arenas) {
        await client.query(
          `insert into arena_catalog_entries (
             catalog_version, arena_id, arena_version, arena_name,
             arena_status, schedulable, alias_of_arena_id,
             geometry_hash_profile, semantic_geometry_hash, config
           ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           on conflict (catalog_version, arena_id) do nothing`,
          [
            catalog.catalogVersion,
            arena.id,
            arena.version,
            arena.name,
            arena.status,
            arena.schedulable,
            arena.aliasOf ?? null,
            catalog.geometryHashProfile,
            arena.semanticGeometryHash,
            arena,
          ],
        )
        const result = await client.query<ReleasedArenaCatalogRow>(
          `select * from arena_catalog_entries
            where catalog_version = $1 and arena_id = $2
              and arena_version = $3 and arena_name = $4
              and arena_status = $5 and schedulable = $6
              and alias_of_arena_id is not distinct from $7
              and geometry_hash_profile = $8
              and semantic_geometry_hash = $9
              and config = $10::jsonb
            for key share`,
          [
            catalog.catalogVersion,
            arena.id,
            arena.version,
            arena.name,
            arena.status,
            arena.schedulable,
            arena.aliasOf ?? null,
            catalog.geometryHashProfile,
            arena.semanticGeometryHash,
            arena,
          ],
        )
        const row = result.rows[0]
        if (!row) {
          throw new Error(
            `Released arena catalog identity mismatch: ${catalog.catalogVersion}/${arena.id}`,
          )
        }
        installed.push(freezeReleasedArenaSnapshot(row))
      }
      return Object.freeze(installed)
    })
  },

  async getReleasedArenaCatalogEntry(
    catalogVersion: string,
    arenaId: string,
  ): Promise<Readonly<ReleasedArenaCatalogSnapshot> | null> {
    const result = await db.query<ReleasedArenaCatalogRow>(
      `select * from arena_catalog_entries
        where catalog_version = $1 and arena_id = $2`,
      [catalogVersion, arenaId],
    )
    const row = result.rows[0]
    return row ? freezeReleasedArenaSnapshot(row) : null
  },

  async getSchedulableArenaCatalogEntry(
    catalogVersion: string,
    arenaId: string,
  ): Promise<Readonly<ReleasedArenaCatalogSnapshot> | null> {
    const result = await db.query<ReleasedArenaCatalogRow>(
      `select * from arena_catalog_entries
        where catalog_version = $1 and arena_id = $2
          and arena_status = 'active' and schedulable`,
      [catalogVersion, arenaId],
    )
    const row = result.rows[0]
    return row ? freezeReleasedArenaSnapshot(row) : null
  },

  async lockReleasedArenaCatalogEntry(
    catalogVersion: string,
    arenaId: string,
  ): Promise<Readonly<ReleasedArenaCatalogSnapshot>> {
    const result = await db.query<ReleasedArenaCatalogRow>(
      `select * from arena_catalog_entries
        where catalog_version = $1 and arena_id = $2
          and arena_status = 'active' and schedulable
        for key share`,
      [catalogVersion, arenaId],
    )
    const row = result.rows[0]
    if (!row) {
      throw new Error(
        `Released schedulable arena not found: ${catalogVersion}/${arenaId}`,
      )
    }
    return freezeReleasedArenaSnapshot(row)
  },

  async upsertUser(record: {
    id: string
    displayName: string
    metadata?: unknown
  }): Promise<void> {
    await db.query(
      `
        insert into users (id, display_name, metadata)
        values ($1, $2, $3)
        on conflict (id) do update
        set display_name = excluded.display_name,
            metadata = excluded.metadata
      `,
      [record.id, record.displayName, record.metadata ?? {}],
    )
  },

  async upsertStrategy(record: {
    id: string
    ownerUserId: string
    name: string
    metadata?: unknown
  }): Promise<void> {
    await db.query(
      `
        insert into strategies (id, owner_user_id, name, metadata)
        values ($1, $2, $3, $4)
        on conflict (id) do update
        set name = excluded.name,
            metadata = excluded.metadata
      `,
      [record.id, record.ownerUserId, record.name, record.metadata ?? {}],
    )
  },

  async insertStrategyRevision(
    revision: StrategyRevision,
    sourceIdentity?: SourceIdentityV2PersistenceRecord,
  ): Promise<void> {
    if (
      sourceIdentity !== undefined &&
      !sourceIdentityMatches(
        sourceIdentity,
        buildSourceIdentityV2PersistenceRecord(revision.source),
      )
    ) {
      throw new Error(
        "StrategyRevision source identity does not match revision source.",
      )
    }
    await db.query(
      `
        insert into strategy_revisions (
          id, strategy_id, source, source_hash, source_bytes, runtime,
          engine_compatibility, validation, metadata, compiled_artifact,
          source_identity_version, original_source_hash, original_source_bytes,
          normalized_source_hash, normalized_source_bytes,
          source_normalization_policy, source_line_endings,
          source_has_final_newline
        )
        values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18
        )
        on conflict (id) do nothing
      `,
      [
        revision.id,
        revision.strategyId ?? null,
        revision.source,
        revision.sourceHash,
        revision.sourceBytes,
        revision.runtime,
        revision.engineCompatibility,
        revision.validation,
        revision.metadata,
        revision.metadata.compiledArtifact ?? null,
        sourceIdentity?.sourceIdentityVersion ?? null,
        sourceIdentity?.originalSourceHash ?? null,
        sourceIdentity?.originalSourceBytes ?? null,
        sourceIdentity?.normalizedSourceHash ?? null,
        sourceIdentity?.normalizedSourceBytes ?? null,
        sourceIdentity?.sourceNormalizationPolicy ?? null,
        sourceIdentity?.sourceLineEndings ?? null,
        sourceIdentity?.sourceHasFinalNewline ?? null,
      ],
    )
  },

  async getStrategyRevision(
    id: StrategyRevisionId,
  ): Promise<StrategyRevision | null> {
    const result = await db.query<{
      id: string
      strategy_id: string | null
      source: string
      source_hash: string
      source_bytes: number
      runtime: StrategyRevision["runtime"]
      engine_compatibility: StrategyRevision["engineCompatibility"]
      validation: StrategyRevision["validation"]
      metadata: StrategyRevision["metadata"]
      compiled_artifact: NonNullable<
        StrategyRevision["metadata"]["compiledArtifact"]
      > | null
    }>("select * from strategy_revisions where id = $1", [id])
    const row = result.rows[0]
    if (!row) {
      return null
    }
    return {
      id: row.id,
      ...(row.strategy_id === null ? {} : { strategyId: row.strategy_id }),
      source: row.source,
      sourceHash: row.source_hash,
      sourceBytes: row.source_bytes,
      runtime: normalizeStrategyRuntimeMetadata(row.runtime),
      engineCompatibility: row.engine_compatibility,
      validation: row.validation,
      metadata: {
        ...row.metadata,
        ...(row.compiled_artifact === null
          ? {}
          : { compiledArtifact: row.compiled_artifact }),
      },
    }
  },

  async assertStrategyRevisionCanBeUsed(id: StrategyRevisionId): Promise<void> {
    const revision = await this.getStrategyRevision(id)
    if (!revision) {
      throw new Error(`StrategyRevision not found: ${id}`)
    }
  },

  async lockStrategyRevision(id: StrategyRevisionId): Promise<void> {
    await db.query(
      `
        update strategy_revisions
        set locked_at = coalesce(locked_at, now())
        where id = $1
      `,
      [id],
    )
  },

  async upsertArenaVariant(arena: ArenaVariant): Promise<void> {
    await db.query(
      `
        insert into arena_variants (id, name, config)
        values ($1, $2, $3)
        on conflict (id) do update
        set name = excluded.name,
            config = excluded.config
      `,
      [arena.id, arena.name, arena],
    )
  },

  async getArenaVariant(id: ArenaVariantId): Promise<ArenaVariant | null> {
    const result = await db.query<{ config: ArenaVariant }>(
      "select config from arena_variants where id = $1",
      [id],
    )
    return result.rows[0]?.config ?? null
  },

  async getMatch(id: MatchId): Promise<Record<string, unknown> | null> {
    const result = await db.query<Record<string, unknown>>(
      "select * from matches where id = $1",
      [id],
    )
    return result.rows[0] ?? null
  },

  async getMatchSet(id: MatchSetId): Promise<Record<string, unknown> | null> {
    const result = await db.query<Record<string, unknown>>(
      "select * from match_sets where id = $1",
      [id],
    )
    return result.rows[0] ?? null
  },
})
