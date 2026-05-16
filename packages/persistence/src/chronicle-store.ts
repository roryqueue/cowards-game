import {
  createChronicleContentHash,
  validateChronicle,
} from "@cowards/replay"
import type {
  ArenaVariantId,
  Chronicle,
  JsonValue,
  MatchId,
  PlayerId,
  StrategyRevisionId,
} from "@cowards/spec"
import type { Pool } from "pg"

export interface ChronicleMetadata {
  id: string
  matchId: MatchId
  schemaVersion: string
  hash: string
  outcome: JsonValue
  eventCount: number
  snapshotCount: number
  bottomPlayerId: PlayerId
  topPlayerId: PlayerId
  bottomStrategyRevisionId: StrategyRevisionId
  topStrategyRevisionId: StrategyRevisionId
  arenaVariantId: ArenaVariantId
}

export interface StoredChronicle {
  metadata: ChronicleMetadata
  artifact: Chronicle
}

export interface ChronicleStore {
  put(chronicle: Chronicle): Promise<StoredChronicle>
  getByMatchId(matchId: MatchId): Promise<StoredChronicle | null>
}

export class ChronicleValidationSystemFailure extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ChronicleValidationSystemFailure"
  }
}

const terminalOutcome = (chronicle: Chronicle): JsonValue => {
  const outcome = chronicle.snapshots.find(
    (snapshot) => snapshot.kind === "TERMINAL",
  )?.outcome
  if (!outcome) {
    throw new ChronicleValidationSystemFailure(
      "Chronicle terminal snapshot is missing an outcome.",
    )
  }
  return outcome as unknown as JsonValue
}

export const createChronicleMetadata = (
  chronicle: Chronicle,
): ChronicleMetadata => {
  const validation = validateChronicle(chronicle)
  if (!validation.ok) {
    throw new ChronicleValidationSystemFailure(
      validation.errors[0]?.message ?? "Chronicle validation failed.",
    )
  }
  const hash = createChronicleContentHash(chronicle).normalizedContentHash
  const [bottomStrategyRevisionId, topStrategyRevisionId] =
    chronicle.reproducibility.strategyRevisionIds
  const started = chronicle.events.find((event) => event.type === "MATCH_STARTED")
  const bottomPlayerId =
    typeof started?.payload === "object" && started.payload !== null
      ? "player:bottom"
      : "player:bottom"

  return {
    id: `chronicle:${hash}`,
    matchId: chronicle.reproducibility.matchId,
    schemaVersion: chronicle.schemaVersion,
    hash,
    outcome: terminalOutcome(chronicle),
    eventCount: chronicle.events.length,
    snapshotCount: chronicle.snapshots.length,
    bottomPlayerId,
    topPlayerId: "player:top",
    bottomStrategyRevisionId,
    topStrategyRevisionId,
    arenaVariantId: chronicle.reproducibility.arenaVariantId,
  }
}

const rowToStored = (row: {
  id: string
  match_id: string
  schema_version: string
  hash: string
  outcome: JsonValue
  event_count: number
  snapshot_count: number
  bottom_player_id: string
  top_player_id: string
  bottom_strategy_revision_id: string
  top_strategy_revision_id: string
  arena_variant_id: string
  artifact: Chronicle
}): StoredChronicle => ({
  metadata: {
    id: row.id,
    matchId: row.match_id,
    schemaVersion: row.schema_version,
    hash: row.hash,
    outcome: row.outcome,
    eventCount: row.event_count,
    snapshotCount: row.snapshot_count,
    bottomPlayerId: row.bottom_player_id,
    topPlayerId: row.top_player_id,
    bottomStrategyRevisionId: row.bottom_strategy_revision_id,
    topStrategyRevisionId: row.top_strategy_revision_id,
    arenaVariantId: row.arena_variant_id,
  },
  artifact: row.artifact,
})

export const createPostgresChronicleStore = (pool: Pool): ChronicleStore => ({
  async put(chronicle) {
    const metadata = createChronicleMetadata(chronicle)
    const result = await pool.query(
      `
        insert into chronicles (
          id, match_id, schema_version, hash, outcome, event_count,
          snapshot_count, bottom_player_id, top_player_id,
          bottom_strategy_revision_id, top_strategy_revision_id,
          arena_variant_id, artifact
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        on conflict (match_id) do nothing
      `,
      [
        metadata.id,
        metadata.matchId,
        metadata.schemaVersion,
        metadata.hash,
        metadata.outcome,
        metadata.eventCount,
        metadata.snapshotCount,
        metadata.bottomPlayerId,
        metadata.topPlayerId,
        metadata.bottomStrategyRevisionId,
        metadata.topStrategyRevisionId,
        metadata.arenaVariantId,
        chronicle,
      ],
    )
    if ((result.rowCount ?? 0) === 0) {
      const existing = await this.getByMatchId(metadata.matchId)
      if (!existing) {
        throw new Error(`Chronicle insert conflicted but no row was found.`)
      }
      return existing
    }
    return { metadata, artifact: chronicle }
  },

  async getByMatchId(matchId) {
    const result = await pool.query(
      "select * from chronicles where match_id = $1",
      [matchId],
    )
    const row = result.rows[0]
    return row ? rowToStored(row) : null
  },
})

export const createMemoryChronicleStoreForTests = (): ChronicleStore & {
  size(): number
} => {
  const rows = new Map<MatchId, StoredChronicle>()
  return {
    async put(chronicle) {
      const metadata = createChronicleMetadata(chronicle)
      const existing = rows.get(metadata.matchId)
      if (existing) {
        return existing
      }
      const stored = { metadata, artifact: chronicle }
      rows.set(metadata.matchId, stored)
      return stored
    },
    async getByMatchId(matchId) {
      return rows.get(matchId) ?? null
    },
    size() {
      return rows.size
    },
  }
}
