import { isDeepStrictEqual } from "node:util"
import {
  createChronicleContentHash,
  validateChronicle,
  validateHistoricalV14Chronicle,
} from "@cowards/replay"
import type {
  ArenaVariantId,
  Chronicle,
  ChronicleEvent,
  JsonValue,
  MatchId,
  PlayerId,
  StrategyRevisionId,
} from "@cowards/spec"
import { CANONICAL_COMPATIBILITY_TUPLES } from "@cowards/spec"
import type { Queryable } from "./repositories.js"
import {
  createMatchExecutionEvidencePair,
  matchSetIntegritySqlValues,
  type MatchExecutionEvidencePair,
  type MatchSetIntegrityIdentity,
} from "./integrity-evidence.js"

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

export interface ChronicleIntegrityIdentity {
  matchSetId: string
  identity: Readonly<MatchSetIntegrityIdentity>
  evidencePair: Readonly<MatchExecutionEvidencePair>
}

export interface CurrentPutChronicleInput {
  chronicle: Chronicle
  integrityIdentity: Readonly<ChronicleIntegrityIdentity>
}

export type PutChronicleInput = CurrentPutChronicleInput

export interface ChronicleStore {
  put(input: PutChronicleInput | unknown): Promise<StoredChronicle>
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

const hasExactKeys = (
  value: Record<string, unknown>,
  fields: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort()
  const expected = [...fields].sort()
  return (
    actual.length === expected.length &&
    actual.every((field, index) => field === expected[index])
  )
}

interface ValidatedPutInput {
  chronicle: Chronicle
  integrityIdentity: Readonly<ChronicleIntegrityIdentity>
}

const validatePutInput = (
  input: PutChronicleInput | unknown,
): ValidatedPutInput => {
  if (!isRecord(input)) {
    throw new ChronicleValidationSystemFailure(
      "Current Chronicle insertion requires one exact integrity identity.",
    )
  }
  const currentEnvelope = hasExactKeys(input, [
    "chronicle",
    "integrityIdentity",
  ])
  if (!currentEnvelope) {
    throw new ChronicleValidationSystemFailure(
      "Chronicle insertion requires one exact current integrity identity route.",
    )
  }
  const integrityIdentity = input.integrityIdentity
  if (
    !isRecord(integrityIdentity) ||
    !hasExactKeys(integrityIdentity, [
      "matchSetId",
      "identity",
      "evidencePair",
    ]) ||
    typeof integrityIdentity.matchSetId !== "string" ||
    integrityIdentity.matchSetId.length === 0 ||
    !isRecord(integrityIdentity.evidencePair)
  ) {
    throw new ChronicleValidationSystemFailure(
      "Current Chronicle integrity identity is partial or malformed.",
    )
  }
  const identity =
    integrityIdentity.identity as Readonly<MatchSetIntegrityIdentity>
  const evidencePair =
    integrityIdentity.evidencePair as Readonly<MatchExecutionEvidencePair>

  try {
    // The SQL-value helper is also the validator-brand gate. A caller cannot
    // authorize a Chronicle with a merely certificate-shaped identity.
    matchSetIntegritySqlValues(identity)
    const activeCurrent = CANONICAL_COMPATIBILITY_TUPLES[0]
    const currentTuple =
      activeCurrent !== undefined &&
      identity.compatibility.tupleId === activeCurrent.tupleId &&
      isDeepStrictEqual(identity.compatibility.tuple, activeCurrent.tuple)
    if (
      !currentTuple
    ) {
      throw new Error("route tuple mismatch")
    }
  } catch {
    throw new ChronicleValidationSystemFailure(
      "Current Chronicle integrity identity is not the exact ordered Match pair.",
    )
  }

  const chronicle = input.chronicle as Chronicle

  try {
    const [bottomStrategyRevisionId, topStrategyRevisionId] =
      chronicle.reproducibility.strategyRevisionIds
    const expectedPair = createMatchExecutionEvidencePair(identity, {
      bottomEntrantKey: evidencePair.bottom?.entrantKey ?? "",
      topEntrantKey: evidencePair.top?.entrantKey ?? "",
      bottomStrategyRevisionId,
      topStrategyRevisionId,
    })
    if (
      evidencePair.bottom !== expectedPair.bottom ||
      evidencePair.top !== expectedPair.top ||
      evidencePair.pairHash !== expectedPair.pairHash
    ) {
      throw new Error("pair mismatch")
    }
  } catch {
    throw new ChronicleValidationSystemFailure(
      "Current Chronicle integrity identity is not the exact ordered Match pair.",
    )
  }

  return {
    chronicle,
    integrityIdentity: {
      matchSetId: integrityIdentity.matchSetId,
      identity,
      evidencePair,
    },
  }
}

const playerIdFromEvent = (event: ChronicleEvent): PlayerId | undefined => {
  const payload =
    typeof event.payload === "object" && event.payload !== null
      ? event.payload
      : {}
  const playerId = "playerId" in payload ? payload.playerId : undefined
  return typeof playerId === "string" ? playerId : event.context.actingPlayerId
}

const playerIdsFromChronicle = (chronicle: Chronicle): [PlayerId, PlayerId] => {
  const distinct = [
    ...new Set(
      chronicle.events.flatMap((event) => {
        const playerId = playerIdFromEvent(event)
        return playerId ? [playerId] : []
      }),
    ),
  ]
  return [distinct[0] ?? "player:bottom", distinct[1] ?? "player:top"]
}

export const createChronicleMetadata = (
  chronicle: Chronicle,
): ChronicleMetadata => {
  const versions = chronicle.reproducibility.versions
  const historicalV14 =
    chronicle.schemaVersion === "chronicle-v1.4" &&
    versions.spec === "cowards-rules-v1.4" &&
    versions.engine === "0.1.4" &&
    versions.runtimeJs === "0.1.0" &&
    versions.chronicle === "chronicle-v1.4" &&
    versions.strategyRevision === "0.1.4" &&
    versions.arenaVariant === "0.1.0"
  const validation = historicalV14
    ? validateHistoricalV14Chronicle(chronicle)
    : validateChronicle(chronicle)
  if (!validation.ok) {
    throw new ChronicleValidationSystemFailure(
      validation.errors[0]?.message ?? "Chronicle validation failed.",
    )
  }
  const hash = createChronicleContentHash(chronicle).normalizedContentHash
  const [bottomStrategyRevisionId, topStrategyRevisionId] =
    chronicle.reproducibility.strategyRevisionIds
  const [bottomPlayerId, topPlayerId] = playerIdsFromChronicle(chronicle)

  return {
    id: `chronicle:${hash}`,
    matchId: chronicle.reproducibility.matchId,
    schemaVersion: chronicle.schemaVersion,
    hash,
    outcome: terminalOutcome(chronicle),
    eventCount: chronicle.events.length,
    snapshotCount: chronicle.snapshots.length,
    bottomPlayerId,
    topPlayerId,
    bottomStrategyRevisionId,
    topStrategyRevisionId,
    arenaVariantId: chronicle.reproducibility.arenaVariantId,
  }
}

interface ChronicleRow {
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
  integrity_match_set_id?: string | null
  bottom_execution_entrant_key?: string | null
  top_execution_entrant_key?: string | null
  bottom_execution_evidence?: unknown
  top_execution_evidence?: unknown
  execution_evidence_pair_hash?: string | null
  compatibility_tuple_id?: string | null
  compatibility_rules_version?: string | null
  compatibility_engine_version?: string | null
  compatibility_runtime_abi_version?: string | null
  compatibility_chronicle_version?: string | null
  compatibility_arena_catalog_version?: string | null
  compatibility_set_policy_version?: string | null
  authority_bundle_hash?: string | null
  authority_registry_generation?: string | null
  authority_publication_id?: string | null
  authority_install_receipt_id?: string | null
  authority_payload_sha256?: string | null
  authority_envelope_sha256?: string | null
  authority_source_manifest_hash?: string | null
  authority_source_set?: unknown
}

const metadataMatchesRow = (
  row: ChronicleRow,
  metadata: ChronicleMetadata,
): boolean =>
  row.id === metadata.id &&
  row.match_id === metadata.matchId &&
  row.schema_version === metadata.schemaVersion &&
  row.hash === metadata.hash &&
  isDeepStrictEqual(row.outcome, metadata.outcome) &&
  row.event_count === metadata.eventCount &&
  row.snapshot_count === metadata.snapshotCount &&
  row.bottom_player_id === metadata.bottomPlayerId &&
  row.top_player_id === metadata.topPlayerId &&
  row.bottom_strategy_revision_id === metadata.bottomStrategyRevisionId &&
  row.top_strategy_revision_id === metadata.topStrategyRevisionId &&
  row.arena_variant_id === metadata.arenaVariantId

const rowToStored = (row: ChronicleRow): StoredChronicle => ({
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

export const createPostgresChronicleStore = (
  pool: Queryable,
): ChronicleStore => ({
  async put(rawInput) {
    const { chronicle, integrityIdentity } = validatePutInput(rawInput)
    const metadata = createChronicleMetadata(chronicle)
    const identityValues = matchSetIntegritySqlValues(
      integrityIdentity.identity,
    )
    const pair = integrityIdentity.evidencePair
    const result = await pool.query(
      `
        insert into chronicles (
          id, match_id, schema_version, hash, outcome, event_count,
          snapshot_count, bottom_player_id, top_player_id,
          bottom_strategy_revision_id, top_strategy_revision_id,
          arena_variant_id, artifact,
          compatibility_tuple_id, compatibility_rules_version,
          compatibility_engine_version, compatibility_runtime_abi_version,
          compatibility_chronicle_version, compatibility_arena_catalog_version,
          compatibility_set_policy_version, authority_bundle_hash,
          authority_registry_generation, authority_publication_id,
          authority_install_receipt_id, authority_payload_sha256,
          authority_envelope_sha256, authority_source_manifest_hash,
          authority_source_set, integrity_match_set_id,
          bottom_execution_entrant_key, top_execution_entrant_key,
          bottom_execution_evidence, top_execution_evidence,
          execution_evidence_pair_hash
        )
        select
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          ms.compatibility_tuple_id, ms.compatibility_rules_version,
          ms.compatibility_engine_version, ms.compatibility_runtime_abi_version,
          ms.compatibility_chronicle_version, ms.compatibility_arena_catalog_version,
          ms.compatibility_set_policy_version, ms.authority_bundle_hash,
          ms.authority_registry_generation, ms.authority_publication_id,
          ms.authority_install_receipt_id, ms.authority_payload_sha256,
          ms.authority_envelope_sha256, ms.authority_source_manifest_hash,
          ms.authority_source_set,
          $14, $15, $16, $17, $18, $19
        from match_sets ms
        join match_set_execution_entrants bottom_entrant
          on bottom_entrant.match_set_id = ms.id
         and bottom_entrant.entrant_key = $15
        join match_set_execution_entrants top_entrant
          on top_entrant.match_set_id = ms.id
         and top_entrant.entrant_key = $16
        where ms.id = $14
          and ms.compatibility_tuple_id = $20
          and ms.compatibility_rules_version = $21
          and ms.compatibility_engine_version = $22
          and ms.compatibility_runtime_abi_version = $23
          and ms.compatibility_chronicle_version = $24
          and ms.compatibility_arena_catalog_version = $25
          and ms.compatibility_set_policy_version = $26
          and ms.authority_bundle_hash = $27
          and ms.authority_registry_generation = $28
          and bottom_entrant.strategy_revision_id = $10
          and top_entrant.strategy_revision_id = $11
          and bottom_entrant.execution_snapshot = $17::jsonb
          and top_entrant.execution_snapshot = $18::jsonb
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
        integrityIdentity.matchSetId,
        pair.bottom.entrantKey,
        pair.top.entrantKey,
        pair.bottom,
        pair.top,
        pair.pairHash,
        ...identityValues.slice(0, 9),
      ],
    )
    if ((result.rowCount ?? 0) === 0) {
      const existingResult = await pool.query<ChronicleRow>(
        `select c.* from chronicles c
         join match_sets ms on ms.id = $2
         where c.match_id = $1
           and c.integrity_match_set_id = ms.id
           and c.compatibility_tuple_id = ms.compatibility_tuple_id
           and c.compatibility_rules_version = ms.compatibility_rules_version
           and c.compatibility_engine_version = ms.compatibility_engine_version
           and c.compatibility_runtime_abi_version = ms.compatibility_runtime_abi_version
           and c.compatibility_chronicle_version = ms.compatibility_chronicle_version
           and c.compatibility_arena_catalog_version = ms.compatibility_arena_catalog_version
           and c.compatibility_set_policy_version = ms.compatibility_set_policy_version
           and c.authority_bundle_hash = ms.authority_bundle_hash
           and c.authority_registry_generation = ms.authority_registry_generation
           and c.authority_publication_id = ms.authority_publication_id
           and c.authority_install_receipt_id = ms.authority_install_receipt_id
           and c.authority_payload_sha256 = ms.authority_payload_sha256
           and c.authority_envelope_sha256 = ms.authority_envelope_sha256
           and c.authority_source_manifest_hash = ms.authority_source_manifest_hash
           and c.authority_source_set = ms.authority_source_set`,
        [metadata.matchId, integrityIdentity.matchSetId],
      )
      const existing = existingResult.rows[0]
      if (
        !existing ||
        !metadataMatchesRow(existing, metadata) ||
        !isDeepStrictEqual(existing.artifact, chronicle) ||
        existing.integrity_match_set_id !== integrityIdentity.matchSetId ||
        existing.bottom_execution_entrant_key !== pair.bottom.entrantKey ||
        existing.top_execution_entrant_key !== pair.top.entrantKey ||
        !isDeepStrictEqual(existing.bottom_execution_evidence, pair.bottom) ||
        !isDeepStrictEqual(existing.top_execution_evidence, pair.top) ||
        existing.execution_evidence_pair_hash !== pair.pairHash ||
        existing.compatibility_tuple_id !== identityValues[0] ||
        existing.compatibility_rules_version !== identityValues[1] ||
        existing.compatibility_engine_version !== identityValues[2] ||
        existing.compatibility_runtime_abi_version !== identityValues[3] ||
        existing.compatibility_chronicle_version !== identityValues[4] ||
        existing.compatibility_arena_catalog_version !== identityValues[5] ||
        existing.compatibility_set_policy_version !== identityValues[6] ||
        existing.authority_bundle_hash !== identityValues[7] ||
        existing.authority_registry_generation !== identityValues[8]
      ) {
        throw new ChronicleValidationSystemFailure(
          "Chronicle insertion did not match the exact persisted Match identity.",
        )
      }
      return rowToStored(existing)
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
  const rows = new Map<
    MatchId,
    { stored: StoredChronicle; integrityIdentity: ChronicleIntegrityIdentity }
  >()
  return {
    async put(rawInput) {
      const { chronicle, integrityIdentity } = validatePutInput(rawInput)
      const metadata = createChronicleMetadata(chronicle)
      const existing = rows.get(metadata.matchId)
      if (existing) {
        if (
          !isDeepStrictEqual(existing.stored.metadata, metadata) ||
          !isDeepStrictEqual(existing.stored.artifact, chronicle) ||
          !isDeepStrictEqual(existing.integrityIdentity, integrityIdentity)
        ) {
          throw new ChronicleValidationSystemFailure(
            "Existing Chronicle identity differs from the exact Match identity.",
          )
        }
        return existing.stored
      }
      const stored = { metadata, artifact: chronicle }
      rows.set(metadata.matchId, { stored, integrityIdentity })
      return stored
    },
    async getByMatchId(matchId) {
      return rows.get(matchId)?.stored ?? null
    },
    size() {
      return rows.size
    },
  }
}
