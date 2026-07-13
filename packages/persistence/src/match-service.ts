import type {
  ArenaVariantId,
  MatchId,
  MatchSetId,
  PlayerId,
  StrategyRevisionId,
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

export interface CreateMatchRecordInput {
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

export interface CreateMatchIntegrityIdentity {
  matchSetId: MatchSetId
  identity: Readonly<MatchSetIntegrityIdentity>
  evidencePair: Readonly<MatchExecutionEvidencePair>
}

export interface CreateMatchInput extends CreateMatchRecordInput {
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

    await withTransaction(pool, async (client) => {
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
            top_execution_evidence, execution_evidence_pair_hash
          )
          values (
            $1, $2, $3, $4, $5, $6, $7, 'pending',
            $8, $9, $10, $11, $12, $13
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
        ],
      )
      await client.query(
        `
          insert into match_jobs (
            id, match_id, status, attempts, max_attempts,
            integrity_match_set_id, bottom_execution_entrant_key,
            top_execution_entrant_key, bottom_execution_evidence,
            top_execution_evidence, execution_evidence_pair_hash
          )
          values (
            $1, $2, 'queued', 0, $3,
            $4, $5, $6, $7, $8, $9
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
