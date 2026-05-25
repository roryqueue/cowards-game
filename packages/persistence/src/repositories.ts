import type {
  ArenaVariant,
  ArenaVariantId,
  MatchId,
  MatchSetId,
  StrategyRevision,
  StrategyRevisionId,
} from "@cowards/spec"
import { normalizeStrategyRuntimeMetadata } from "@cowards/spec"
import type { Pool, PoolClient } from "pg"

export type Queryable = Pick<Pool | PoolClient, "query">

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

  async insertStrategyRevision(revision: StrategyRevision): Promise<void> {
    await db.query(
      `
        insert into strategy_revisions (
          id, strategy_id, source, source_hash, source_bytes, runtime,
          engine_compatibility, validation, metadata, compiled_artifact
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
