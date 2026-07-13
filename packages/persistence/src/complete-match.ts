import { isDeepStrictEqual } from "node:util"
import type { GameState } from "@cowards/engine"
import {
  RuntimeExecutionResolvedEvidenceSnapshotSchema,
  type Chronicle,
  type MatchId,
  type RuntimeExecutionResolvedEvidenceSnapshot,
} from "@cowards/spec"
import type { Pool } from "pg"
import { createPostgresChronicleStore } from "./chronicle-store.js"
import { withTransaction } from "./db.js"
import {
  createMatchExecutionEvidencePair,
  matchSetIntegritySqlValues,
  parseMatchSetIntegrityIdentityRows,
  type MatchExecutionEvidencePair,
  type MatchSetExecutionEntrantRow,
  type MatchSetIntegrityIdentity,
  type MatchSetIntegrityRow,
} from "./integrity-evidence.js"

export interface CompleteMatchInput {
  jobId: string
  leaseToken: string
  chronicle: Chronicle
  finalState: GameState
  integrityIdentity: RuntimeExecutionResolvedEvidenceSnapshot
}

export class MatchCompletionIntegritySystemFailure extends Error {
  readonly code = "EVIDENCE_IDENTITY_MISMATCH"
  readonly failureCategory = "system_failure"
  readonly playerPenalty = false
  readonly retryable = true

  constructor() {
    super("Match completion integrity identity no longer matches its locked scheduling snapshot.")
    this.name = "MatchCompletionIntegritySystemFailure"
  }
}

export const validateCompletionIntegritySnapshot = (
  locked: {
    identity: Readonly<MatchSetIntegrityIdentity>
    pair: Readonly<MatchExecutionEvidencePair>
  },
  response: RuntimeExecutionResolvedEvidenceSnapshot | unknown,
): void => {
  try {
    matchSetIntegritySqlValues(locked.identity)
    const expectedPair = createMatchExecutionEvidencePair(locked.identity, {
      bottomEntrantKey: locked.pair.bottom.entrantKey,
      topEntrantKey: locked.pair.top.entrantKey,
      bottomStrategyRevisionId: locked.pair.bottom.strategyRevisionId,
      topStrategyRevisionId: locked.pair.top.strategyRevisionId,
    })
    if (
      locked.pair.bottom !== expectedPair.bottom ||
      locked.pair.top !== expectedPair.top ||
      locked.pair.pairHash !== expectedPair.pairHash
    ) {
      throw new Error("locked pair mismatch")
    }
    const parsed = RuntimeExecutionResolvedEvidenceSnapshotSchema.parse(response)
    const expected: RuntimeExecutionResolvedEvidenceSnapshot = {
      compatibility: locked.identity.compatibility,
      authorityBundleHash: locked.identity.authorityBundleHash,
      registryGeneration: locked.identity.registryGeneration,
      entrants: {
        bottom: locked.pair.bottom,
        top: locked.pair.top,
      },
    }
    if (!isDeepStrictEqual(parsed, expected)) {
      throw new Error("response identity drift")
    }
  } catch {
    throw new MatchCompletionIntegritySystemFailure()
  }
}

export interface MatchCompletionFields {
  matchId: MatchId
  outcome: GameState["outcome"]
  winnerPlayerId: string | null
  survivingSoldiers: number
  bottomSurvivingSoldiers: number
  topSurvivingSoldiers: number
  survivalTurns: number
  bottomSurvivalTurns: number
  topSurvivalTurns: number
}

const countSurvivingSoldiers = (
  finalState: GameState,
  ownerPlayerId?: string | undefined,
): number =>
  finalState.soldiers.filter(
    (soldier) =>
      soldier.status !== "FALLEN" &&
      (ownerPlayerId === undefined || soldier.ownerPlayerId === ownerPlayerId),
  ).length

export const deriveMatchCompletionFields = (
  finalState: GameState,
): MatchCompletionFields => {
  const bottomPlayerId = finalState.players.find(
    (player) => player.side === "bottom",
  )?.id
  const topPlayerId = finalState.players.find(
    (player) => player.side === "top",
  )?.id
  const survivalTurns =
    finalState.phaseNumber * 16 +
    finalState.roundNumber * 4 +
    finalState.activationCount

  return {
    matchId: finalState.matchId,
    outcome: finalState.outcome,
    winnerPlayerId:
      finalState.outcome?.type === "WIN"
        ? finalState.outcome.winnerPlayerId
        : null,
    survivingSoldiers: countSurvivingSoldiers(finalState),
    bottomSurvivingSoldiers: countSurvivingSoldiers(finalState, bottomPlayerId),
    topSurvivingSoldiers: countSurvivingSoldiers(finalState, topPlayerId),
    survivalTurns,
    bottomSurvivalTurns: survivalTurns,
    topSurvivalTurns: survivalTurns,
  }
}

interface LockedCompletionRow extends MatchSetIntegrityRow {
  job_id: string
  match_id: MatchId
  integrity_match_set_id: string
  bottom_strategy_revision_id: string
  top_strategy_revision_id: string
  match_bottom_execution_entrant_key: string
  match_top_execution_entrant_key: string
  match_bottom_execution_evidence: unknown
  match_top_execution_evidence: unknown
  match_execution_evidence_pair_hash: string
  job_bottom_execution_entrant_key: string
  job_top_execution_entrant_key: string
  job_bottom_execution_evidence: unknown
  job_top_execution_evidence: unknown
  job_execution_evidence_pair_hash: string
}

const assertLockedOrderedPair = (
  row: LockedCompletionRow,
  pair: Readonly<MatchExecutionEvidencePair>,
): void => {
  if (
    row.match_bottom_execution_entrant_key !== pair.bottom.entrantKey ||
    row.match_top_execution_entrant_key !== pair.top.entrantKey ||
    row.job_bottom_execution_entrant_key !== pair.bottom.entrantKey ||
    row.job_top_execution_entrant_key !== pair.top.entrantKey ||
    row.match_execution_evidence_pair_hash !== pair.pairHash ||
    row.job_execution_evidence_pair_hash !== pair.pairHash ||
    !isDeepStrictEqual(row.match_bottom_execution_evidence, pair.bottom) ||
    !isDeepStrictEqual(row.match_top_execution_evidence, pair.top) ||
    !isDeepStrictEqual(row.job_bottom_execution_evidence, pair.bottom) ||
    !isDeepStrictEqual(row.job_top_execution_evidence, pair.top)
  ) {
    throw new MatchCompletionIntegritySystemFailure()
  }
}

export const completeMatch = async (
  pool: Pool,
  input: CompleteMatchInput,
): Promise<{ status: "complete"; matchId: MatchId; chronicleId: string }> => {
  const fields = deriveMatchCompletionFields(input.finalState)
  let chronicleId: string | undefined

  await withTransaction(pool, async (client) => {
    const job = await client.query<LockedCompletionRow>(
      `
        select
          j.id as job_id,
          m.id as match_id,
          m.integrity_match_set_id,
          m.bottom_strategy_revision_id,
          m.top_strategy_revision_id,
          m.bottom_execution_entrant_key as match_bottom_execution_entrant_key,
          m.top_execution_entrant_key as match_top_execution_entrant_key,
          m.bottom_execution_evidence as match_bottom_execution_evidence,
          m.top_execution_evidence as match_top_execution_evidence,
          m.execution_evidence_pair_hash as match_execution_evidence_pair_hash,
          j.bottom_execution_entrant_key as job_bottom_execution_entrant_key,
          j.top_execution_entrant_key as job_top_execution_entrant_key,
          j.bottom_execution_evidence as job_bottom_execution_evidence,
          j.top_execution_evidence as job_top_execution_evidence,
          j.execution_evidence_pair_hash as job_execution_evidence_pair_hash,
          ms.compatibility_tuple_id,
          ms.compatibility_rules_version,
          ms.compatibility_engine_version,
          ms.compatibility_runtime_abi_version,
          ms.compatibility_chronicle_version,
          ms.compatibility_arena_catalog_version,
          ms.compatibility_set_policy_version,
          ms.authority_bundle_hash,
          ms.authority_registry_generation,
          ms.execution_evidence_set,
          ms.execution_evidence_set_hash
        from match_jobs j
        join matches m on m.id = j.match_id
        join match_sets ms on ms.id = m.integrity_match_set_id
        where j.id = $1
          and j.lease_token = $2
          and j.status = 'running'
          and m.id = $3
          and m.status = 'running'
          and j.integrity_match_set_id = m.integrity_match_set_id
        for update of j, m, ms
      `,
      [input.jobId, input.leaseToken, fields.matchId],
    )
    const locked = job.rows[0]
    if (!locked) {
      const existing = await client.query<{ id: string }>(
        `
          select c.id
          from matches m
          join chronicles c on c.match_id = m.id
          where m.id = $1 and m.status = 'complete'
        `,
        [fields.matchId],
      )
      const existingChronicleId = existing.rows[0]?.id
      if (!existingChronicleId) {
        throw new Error("Cannot complete Match without a valid running lease")
      }
      chronicleId = existingChronicleId
      return
    }
    const entrantRows = await client.query<MatchSetExecutionEntrantRow>(
      `
        select match_set_id, entrant_key, strategy_revision_id,
               execution_snapshot
        from match_set_execution_entrants
        where match_set_id = $1
        order by entrant_key
        for share
      `,
      [locked.integrity_match_set_id],
    )
    let identity: Readonly<MatchSetIntegrityIdentity>
    let pair: Readonly<MatchExecutionEvidencePair>
    try {
      identity = parseMatchSetIntegrityIdentityRows(locked, entrantRows.rows)
      pair = createMatchExecutionEvidencePair(identity, {
        bottomEntrantKey: locked.match_bottom_execution_entrant_key,
        topEntrantKey: locked.match_top_execution_entrant_key,
        bottomStrategyRevisionId: locked.bottom_strategy_revision_id,
        topStrategyRevisionId: locked.top_strategy_revision_id,
      })
      assertLockedOrderedPair(locked, pair)
    } catch {
      throw new MatchCompletionIntegritySystemFailure()
    }
    validateCompletionIntegritySnapshot({ identity, pair }, input.integrityIdentity)

    const store = createPostgresChronicleStore(client)
    const stored = await store.put({
      chronicle: input.chronicle,
      integrityIdentity: {
        matchSetId: locked.integrity_match_set_id,
        identity,
        evidencePair: pair,
      },
    })
    chronicleId = stored.metadata.id
    const completedMatch = await client.query(
      `
        update matches
        set status = 'complete',
            outcome = $1,
            winner_player_id = $2,
            surviving_soldiers = $3,
            bottom_surviving_soldiers = $4,
            top_surviving_soldiers = $5,
            survival_turns = $6,
            bottom_survival_turns = $7,
            top_survival_turns = $8,
            completed_at = now()
        where id = $9 and status = 'running'
        returning id
      `,
      [
        fields.outcome,
        fields.winnerPlayerId,
        fields.survivingSoldiers,
        fields.bottomSurvivingSoldiers,
        fields.topSurvivingSoldiers,
        fields.survivalTurns,
        fields.bottomSurvivalTurns,
        fields.topSurvivalTurns,
        fields.matchId,
      ],
    )
    if ((completedMatch.rowCount ?? 0) !== 1) {
      throw new MatchCompletionIntegritySystemFailure()
    }
    await client.query(
      `
        update match_jobs
        set status = 'complete',
            updated_at = now()
        where id = $1
      `,
      [input.jobId],
    )
    await client.query(
      `
        update match_job_attempts
        set finished_at = now(),
            status = 'complete'
        where job_id = $1
          and attempt_number = (
            select attempts from match_jobs where id = $1
          )
      `,
      [input.jobId],
    )
  })

  return {
    status: "complete",
    matchId: fields.matchId,
    chronicleId: chronicleId ?? "",
  }
}
