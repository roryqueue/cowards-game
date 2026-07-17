import type {
  ArenaVariantId,
  MatchId,
  MatchSetId,
  PlayerId,
  StrategyRevisionId,
} from "@cowards/spec"
import {
  ARENA_CATALOG_VERSION_V1_37,
  CANONICAL_ARENA_CATALOG_V1_37,
  SET_CONDITION_POLICY_VERSION_V1_37,
  createSetScenarioV137,
  type SetConditionPolicyRowV137,
} from "@cowards/spec"
import type { Pool } from "pg"
import { withTransaction } from "./db.js"
import {
  IntegrityEvidenceInputError,
  createMatchExecutionEvidencePair,
  matchExecutionEvidencePairSqlValues,
  matchSetIntegritySqlValues,
  type MatchExecutionEvidencePair,
  type MatchSetIntegrityIdentity,
} from "./integrity-evidence.js"
import { createRepositories } from "./repositories.js"
import { DEFAULT_MAX_JOB_ATTEMPTS, type MatchStatus } from "./schema.js"
import {
  resolveExactSemanticAuthoritySelection,
  assertCountedSemanticAuthoritySelection,
  lockSemanticAuthoritySelectionHead,
} from "./semantic-authority-selection-head.js"
import {
  resolveFileCurrentSchedulingSemanticAuthority,
  resolveSchedulingSemanticAuthority,
} from "./presets.js"

export interface CreateMatchRecordInputV117 {
  id: MatchId
  bottomStrategyRevisionId: StrategyRevisionId
  topStrategyRevisionId: StrategyRevisionId
  arenaVariantId: ArenaVariantId
  seed: string
  bottomPlayerId: PlayerId
  topPlayerId: PlayerId
  bottomEntrantKey: string
  topEntrantKey: string
}

export interface CreateMatchRecordInputV119 extends CreateMatchRecordInputV117 {
  semanticAuthorityKey: "runtime-v1.19"
  setPolicyVersion: typeof SET_CONDITION_POLICY_VERSION_V1_37
  scenarioId: `set-scenario:sha256:${string}`
  conditionId: `set-condition:sha256:${string}`
  conditionOrdinal: 0 | 1 | 2 | 3
  conditionSuffix: SetConditionPolicyRowV137["suffix"]
  requestIdentity: `set-request:sha256:${string}`
  arenaCatalogVersion: typeof ARENA_CATALOG_VERSION_V1_37
  arenaSemanticGeometryHash: `sha256:${string}`
  initialInitiativeEntrantKey: string
  initialInitiativePlayerId: PlayerId
}

export type CreateMatchRecordInput =
  | CreateMatchRecordInputV117
  | CreateMatchRecordInputV119

export interface CreateMatchIntegrityIdentity {
  matchSetId: MatchSetId
  identity: Readonly<MatchSetIntegrityIdentity>
  evidencePair: Readonly<MatchExecutionEvidencePair>
}

export type CreateMatchInput = CreateMatchRecordInput & {
  integrityIdentity: Readonly<CreateMatchIntegrityIdentity>
}

export interface CreateMatchResult {
  matchId: MatchId
  jobId: string
  status: MatchStatus
}

export const createMatchJobId = (matchId: MatchId): string =>
  `match-job:${matchId}`

const requireCurrentExecutableEvidence = (
  pair: Readonly<MatchExecutionEvidencePair>,
  now: Date,
): void => {
  const instant = now.getTime()
  if (!Number.isFinite(instant)) {
    throw new IntegrityEvidenceInputError("Scheduling instant is invalid.")
  }
  for (const [side, entrant] of [
    ["bottom", pair.bottom],
    ["top", pair.top],
  ] as const) {
    const evaluatedAt = Date.parse(entrant.schedulingDecision.evaluatedAt)
    const freshUntil = Date.parse(entrant.schedulingDecision.freshUntil)
    if (
      entrant.schedulingDecision.status === "disabled" ||
      !Number.isFinite(evaluatedAt) ||
      !Number.isFinite(freshUntil) ||
      evaluatedAt > instant ||
      freshUntil < instant
    ) {
      throw new IntegrityEvidenceInputError(
        `${side} entrant execution evidence is disabled, stale, or not yet current.`,
      )
    }
  }
}

export const validateCreateMatchRecordInput = (
  input: CreateMatchRecordInput,
): void => {
  if (!input.seed.trim()) {
    throw new Error("Match seed is required")
  }
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string" && value.length === 0) {
      throw new Error(`CreateMatchInput.${key} is required`)
    }
  }
  if (input.bottomEntrantKey === input.topEntrantKey) {
    throw new IntegrityEvidenceInputError(
      "Match side entrant keys must be distinct.",
    )
  }
  if (!("semanticAuthorityKey" in input)) {
    return
  }
  if (input.semanticAuthorityKey !== "runtime-v1.19") {
    throw new IntegrityEvidenceInputError(
      "Unknown Match scheduling semantic authority.",
    )
  }
  if (
    input.setPolicyVersion !== SET_CONDITION_POLICY_VERSION_V1_37 ||
    input.arenaCatalogVersion !== ARENA_CATALOG_VERSION_V1_37
  ) {
    throw new IntegrityEvidenceInputError(
      "Successor Match policy or arena catalog version is not exact.",
    )
  }
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
    ({ id }) => id === input.arenaVariantId,
  )
  if (
    !arena ||
    arena.status !== "active" ||
    !arena.schedulable ||
    arena.semanticGeometryHash !== input.arenaSemanticGeometryHash
  ) {
    throw new IntegrityEvidenceInputError(
      "Successor Match requires an exact schedulable semantic arena.",
    )
  }

  const entrantAIsBottom = input.conditionOrdinal < 2
  const scenario = createSetScenarioV137({
    arenaCatalogVersion: input.arenaCatalogVersion,
    arenaSemanticGeometryHash: input.arenaSemanticGeometryHash,
    entrantA: entrantAIsBottom
      ? {
          entrantKey: input.bottomEntrantKey,
          playerId: input.bottomPlayerId,
        }
      : { entrantKey: input.topEntrantKey, playerId: input.topPlayerId },
    entrantB: entrantAIsBottom
      ? { entrantKey: input.topEntrantKey, playerId: input.topPlayerId }
      : {
          entrantKey: input.bottomEntrantKey,
          playerId: input.bottomPlayerId,
        },
    baseSeed: input.seed,
  })
  const expected = scenario.conditions[input.conditionOrdinal]
  if (
    scenario.scenarioId !== input.scenarioId ||
    !expected ||
    expected.conditionId !== input.conditionId ||
    expected.suffix !== input.conditionSuffix ||
    expected.requestIdentity !== input.requestIdentity ||
    expected.bottomEntrantKey !== input.bottomEntrantKey ||
    expected.topEntrantKey !== input.topEntrantKey ||
    expected.bottomPlayerId !== input.bottomPlayerId ||
    expected.topPlayerId !== input.topPlayerId ||
    expected.initialInitiativeEntrantKey !==
      input.initialInitiativeEntrantKey ||
    expected.initialInitiativePlayerId !== input.initialInitiativePlayerId
  ) {
    throw new IntegrityEvidenceInputError(
      "Successor Match condition identity is not canonical.",
    )
  }
}

export const validateCreateMatchInput = (
  input: CreateMatchInput,
  now = new Date(),
): void => {
  validateCreateMatchRecordInput(input)
  if (!input.integrityIdentity || typeof input.integrityIdentity !== "object") {
    throw new IntegrityEvidenceInputError(
      "Direct Match creation requires exact integrity identity.",
    )
  }
  const { identity, evidencePair, matchSetId } = input.integrityIdentity
  if (!matchSetId) {
    throw new IntegrityEvidenceInputError("Integrity MatchSet ID is required.")
  }
  // This call is intentionally used as the validator-brand gate. Structurally
  // similar tuples/evidence cannot authorize a writer.
  matchSetIntegritySqlValues(identity)
  const expectedPair = createMatchExecutionEvidencePair(identity, {
    bottomEntrantKey: input.bottomEntrantKey,
    topEntrantKey: input.topEntrantKey,
    bottomStrategyRevisionId: input.bottomStrategyRevisionId,
    topStrategyRevisionId: input.topStrategyRevisionId,
  })
  if (
    evidencePair.bottom !== expectedPair.bottom ||
    evidencePair.top !== expectedPair.top ||
    evidencePair.pairHash !== expectedPair.pairHash
  ) {
    throw new IntegrityEvidenceInputError(
      "Direct Match execution evidence pair is not the exact ordered pair.",
    )
  }
  requireCurrentExecutableEvidence(evidencePair, now)
}

export const createMatchService = (pool: Pool) => ({
  async createMatch(input: CreateMatchInput): Promise<CreateMatchResult> {
    validateCreateMatchInput(input)
    const jobId = createMatchJobId(input.id)
    const isExplicitCandidate = "semanticAuthorityKey" in input
    const semanticAuthority = isExplicitCandidate
      ? resolveSchedulingSemanticAuthority("runtime-v1.19")
      : resolveFileCurrentSchedulingSemanticAuthority()
    const compatibility = input.integrityIdentity.identity.compatibility
    if (
      compatibility.tupleId !== semanticAuthority.selection.tupleId ||
      compatibility.tuple.rules !== semanticAuthority.selection.rulesVersion ||
      compatibility.tuple.engine !==
        semanticAuthority.selection.engineVersion ||
      compatibility.tuple.runtimeAbi !==
        semanticAuthority.selection.runtimeAbiVersion ||
      compatibility.tuple.chronicle !==
        semanticAuthority.selection.chronicleVersion ||
      compatibility.tuple.arenaCatalog !==
        semanticAuthority.selection.arenaCatalogVersion ||
      compatibility.tuple.setPolicy !==
        semanticAuthority.selection.setPolicyVersion
    ) {
      throw new IntegrityEvidenceInputError(
        "Direct Match compatibility tuple does not match its semantic authority selection.",
      )
    }

    await withTransaction(pool, async (client) => {
      if (!isExplicitCandidate) {
        const head = await lockSemanticAuthoritySelectionHead(client)
        assertCountedSemanticAuthoritySelection(
          head,
          semanticAuthority.selection,
          semanticAuthority.selectionRoot,
        )
      }
      const parent = await client.query<{
        semantic_authority_selection: unknown
        semantic_authority_selection_root: string | null
      }>(
        `select semantic_authority_selection, semantic_authority_selection_root
           from match_sets where id = $1 for share`,
        [input.integrityIdentity.matchSetId],
      )
      const parentRow = parent.rows[0]
      const parentSelection = resolveExactSemanticAuthoritySelection(
        parentRow?.semantic_authority_selection,
        parentRow?.semantic_authority_selection_root,
      )
      if (
        parentSelection !== semanticAuthority.selection ||
        parentRow?.semantic_authority_selection_root !==
          semanticAuthority.selectionRoot
      ) {
        throw new IntegrityEvidenceInputError(
          "Direct Match semantic authority must exactly match its frozen MatchSet.",
        )
      }
      const repositories = createRepositories(client)
      await repositories.assertStrategyRevisionCanBeUsed(
        input.bottomStrategyRevisionId,
      )
      await repositories.assertStrategyRevisionCanBeUsed(
        input.topStrategyRevisionId,
      )
      const arena = await repositories.getArenaVariant(input.arenaVariantId)
      if (!arena) {
        throw new Error(`ArenaVariant not found: ${input.arenaVariantId}`)
      }
      await repositories.lockStrategyRevision(input.bottomStrategyRevisionId)
      await repositories.lockStrategyRevision(input.topStrategyRevisionId)
      await client.query(
        `
          insert into matches (
            id, bottom_strategy_revision_id, top_strategy_revision_id,
            arena_variant_id, seed, bottom_player_id, top_player_id, status,
            integrity_match_set_id, bottom_execution_entrant_key,
            top_execution_entrant_key, bottom_execution_evidence,
            top_execution_evidence, execution_evidence_pair_hash,
            semantic_authority_selection_root
          )
          values (
            $1, $2, $3, $4, $5, $6, $7, 'pending',
            $8, $9, $10, $11, $12, $13, $14
          )
        `,
        [
          input.id,
          input.bottomStrategyRevisionId,
          input.topStrategyRevisionId,
          input.arenaVariantId,
          input.seed,
          input.bottomPlayerId,
          input.topPlayerId,
          ...matchExecutionEvidencePairSqlValues(
            input.integrityIdentity.matchSetId,
            input.integrityIdentity.evidencePair,
          ),
          semanticAuthority.selectionRoot,
        ],
      )
      await client.query(
        `
          insert into match_jobs (
            id, match_id, status, attempts, max_attempts,
            integrity_match_set_id, bottom_execution_entrant_key,
            top_execution_entrant_key, bottom_execution_evidence,
            top_execution_evidence, execution_evidence_pair_hash,
            semantic_authority_selection_root
          )
          values (
            $1, $2, 'queued', 0, $3,
            $4, $5, $6, $7, $8, $9, $10
          )
        `,
        [
          jobId,
          input.id,
          DEFAULT_MAX_JOB_ATTEMPTS,
          ...matchExecutionEvidencePairSqlValues(
            input.integrityIdentity.matchSetId,
            input.integrityIdentity.evidencePair,
          ),
          semanticAuthority.selectionRoot,
        ],
      )
    })

    return { matchId: input.id, jobId, status: "pending" }
  },

  async getMatchStatus(id: MatchId): Promise<MatchStatus | null> {
    const result = await pool.query<{ status: MatchStatus }>(
      "select status from matches where id = $1",
      [id],
    )
    return result.rows[0]?.status ?? null
  },
})
