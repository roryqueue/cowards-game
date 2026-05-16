import type { MatchId, StrategyRevisionId } from "@cowards/spec"
import type { MatchStatus } from "./schema.js"

export interface MatchScoreInput {
  matchId: MatchId
  bottomStrategyRevisionId: StrategyRevisionId
  topStrategyRevisionId: StrategyRevisionId
  winnerStrategyRevisionId?: StrategyRevisionId | undefined
  status: MatchStatus
  survivingSoldiers: number
  survivalTurns: number
}

export interface MatchSetStrategyScore {
  strategyRevisionId: StrategyRevisionId
  wins: number
  losses: number
  draws: number
  failedSystemMatches: number
  survivingSoldiers: number
  survivalTurns: number
}

export interface MatchSetScore {
  degraded: boolean
  complete: boolean
  rankings: MatchSetStrategyScore[]
}

const emptyScore = (
  strategyRevisionId: StrategyRevisionId,
): MatchSetStrategyScore => ({
  strategyRevisionId,
  wins: 0,
  losses: 0,
  draws: 0,
  failedSystemMatches: 0,
  survivingSoldiers: 0,
  survivalTurns: 0,
})

const getScore = (
  scores: Map<StrategyRevisionId, MatchSetStrategyScore>,
  strategyRevisionId: StrategyRevisionId,
): MatchSetStrategyScore => {
  const existing = scores.get(strategyRevisionId)
  if (existing) {
    return existing
  }
  const created = emptyScore(strategyRevisionId)
  scores.set(strategyRevisionId, created)
  return created
}

export const scoreMatchSet = (matches: MatchScoreInput[]): MatchSetScore => {
  const scores = new Map<StrategyRevisionId, MatchSetStrategyScore>()
  let degraded = false
  let complete = true

  for (const match of matches) {
    const bottom = getScore(scores, match.bottomStrategyRevisionId)
    const top = getScore(scores, match.topStrategyRevisionId)
    if (match.status !== "complete") {
      complete = false
    }
    if (match.status === "failed_system") {
      degraded = true
      bottom.failedSystemMatches += 1
      top.failedSystemMatches += 1
      continue
    }
    if (match.status !== "complete") {
      continue
    }

    bottom.survivingSoldiers += match.survivingSoldiers
    bottom.survivalTurns += match.survivalTurns
    top.survivingSoldiers += match.survivingSoldiers
    top.survivalTurns += match.survivalTurns

    if (!match.winnerStrategyRevisionId) {
      bottom.draws += 1
      top.draws += 1
    } else if (match.winnerStrategyRevisionId === bottom.strategyRevisionId) {
      bottom.wins += 1
      top.losses += 1
    } else if (match.winnerStrategyRevisionId === top.strategyRevisionId) {
      top.wins += 1
      bottom.losses += 1
    } else {
      bottom.draws += 1
      top.draws += 1
    }
  }

  return {
    degraded,
    complete,
    rankings: [...scores.values()].sort(
      (left, right) =>
        right.wins - left.wins ||
        right.survivingSoldiers - left.survivingSoldiers ||
        right.survivalTurns - left.survivalTurns ||
        left.strategyRevisionId.localeCompare(right.strategyRevisionId),
    ),
  }
}
