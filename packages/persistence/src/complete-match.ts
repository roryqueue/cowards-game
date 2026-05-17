import type { GameState } from "@cowards/engine"
import type { Chronicle, MatchId } from "@cowards/spec"
import type { Pool } from "pg"
import { createPostgresChronicleStore } from "./chronicle-store.js"
import { withTransaction } from "./db.js"

export interface CompleteMatchInput {
  jobId: string
  leaseToken: string
  chronicle: Chronicle
  finalState: GameState
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

export const completeMatch = async (
  pool: Pool,
  input: CompleteMatchInput,
): Promise<{ status: "complete"; matchId: MatchId; chronicleId: string }> => {
  const fields = deriveMatchCompletionFields(input.finalState)
  let chronicleId: string | undefined

  await withTransaction(pool, async (client) => {
    const job = await client.query(
      `
        select id from match_jobs
        where id = $1 and lease_token = $2 and status = 'running'
      `,
      [input.jobId, input.leaseToken],
    )
    if ((job.rowCount ?? 0) === 0) {
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
    const store = createPostgresChronicleStore(client)
    const stored = await store.put(input.chronicle)
    chronicleId = stored.metadata.id
    await client.query(
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
        where id = $9
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
