import {
  parseSetScenarioV137,
  type MatchId,
  type SetScenarioV137,
  type StrategyRevisionId,
} from "@cowards/spec"
import type { MatchStatus } from "./schema.js"

export const SCORING_POINTS = {
  win: 3,
  draw: 1,
  loss: 0,
  strategyFailurePenalty: -1,
} as const

export interface ScorePenalty {
  matchId: MatchId
  reason: "strategy_failure"
  points: number
}

export interface MatchScoreInput {
  matchId: MatchId
  bottomStrategyRevisionId: StrategyRevisionId
  topStrategyRevisionId: StrategyRevisionId
  winnerStrategyRevisionId?: StrategyRevisionId | undefined
  strategyFailureRevisionId?: StrategyRevisionId | undefined
  status: MatchStatus
  survivingSoldiers: number
  bottomSurvivingSoldiers: number
  topSurvivingSoldiers: number
  survivalTurns: number
  bottomSurvivalTurns: number
  topSurvivalTurns: number
}

export interface MatchSetStrategyScore {
  strategyRevisionId: StrategyRevisionId
  wins: number
  losses: number
  draws: number
  points: number
  penaltyPoints: number
  penalties: ScorePenalty[]
  failedSystemMatches: number
  survivingSoldiers: number
  survivalTurns: number
}

export interface MatchSetScore {
  degraded: boolean
  complete: boolean
  rankings: MatchSetStrategyScore[]
}

export interface SuccessorRevisionEvidenceV119 {
  strategyRevisionId: StrategyRevisionId
  scheduledRevalidationId: string
  currentRevalidationId: string | null
  scheduledRevalidationRoot: `sha256:${string}`
  currentRevalidationRoot: `sha256:${string}` | null
  revoked: boolean
}

export interface SuccessorMatchScoreInputV119 extends MatchScoreInput {
  semanticAuthorityKey: "runtime-v1.19"
  scenarioId: `set-scenario:sha256:${string}`
  conditionId: `set-condition:sha256:${string}`
  conditionOrdinal: 0 | 1 | 2 | 3
  requestIdentity: `set-request:sha256:${string}`
  bottomEntrantKey: string
  topEntrantKey: string
  initialInitiativeEntrantKey: string
  terminalKind?: "success" | "player_violation" | undefined
  attemptNumber: number
  retryableSystemFailure: boolean
  bottomRevisionEvidence: SuccessorRevisionEvidenceV119
  topRevisionEvidence: SuccessorRevisionEvidenceV119
}

export interface SuccessorMatchSetScoreV119 extends MatchSetScore {
  status: "pending" | "complete" | "degraded"
  counted: boolean
  canonicalConditionIds: `set-condition:sha256:${string}`[]
}

const emptyScore = (
  strategyRevisionId: StrategyRevisionId,
): MatchSetStrategyScore => ({
  strategyRevisionId,
  wins: 0,
  losses: 0,
  draws: 0,
  points: 0,
  penaltyPoints: 0,
  penalties: [],
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

    bottom.survivingSoldiers += match.bottomSurvivingSoldiers
    bottom.survivalTurns += match.bottomSurvivalTurns
    top.survivingSoldiers += match.topSurvivingSoldiers
    top.survivalTurns += match.topSurvivalTurns

    if (!match.winnerStrategyRevisionId) {
      bottom.draws += 1
      top.draws += 1
      bottom.points += SCORING_POINTS.draw
      top.points += SCORING_POINTS.draw
    } else if (match.winnerStrategyRevisionId === bottom.strategyRevisionId) {
      bottom.wins += 1
      top.losses += 1
      bottom.points += SCORING_POINTS.win
      top.points += SCORING_POINTS.loss
    } else if (match.winnerStrategyRevisionId === top.strategyRevisionId) {
      top.wins += 1
      bottom.losses += 1
      top.points += SCORING_POINTS.win
      bottom.points += SCORING_POINTS.loss
    } else {
      bottom.draws += 1
      top.draws += 1
      bottom.points += SCORING_POINTS.draw
      top.points += SCORING_POINTS.draw
    }

    if (match.strategyFailureRevisionId) {
      const failed = getScore(scores, match.strategyFailureRevisionId)
      const penalty = {
        matchId: match.matchId,
        reason: "strategy_failure" as const,
        points: SCORING_POINTS.strategyFailurePenalty,
      }
      failed.penalties.push(penalty)
      failed.penaltyPoints += penalty.points
      failed.points += penalty.points
    }
  }

  return {
    degraded,
    complete,
    rankings: [...scores.values()].sort(
      (left, right) =>
        right.points - left.points ||
        right.wins - left.wins ||
        right.survivingSoldiers - left.survivingSoldiers ||
        right.survivalTurns - left.survivalTurns ||
        left.strategyRevisionId.localeCompare(right.strategyRevisionId),
    ),
  }
}

const exactRevisionEvidenceV119 = (
  evidence: SuccessorRevisionEvidenceV119,
  strategyRevisionId: StrategyRevisionId,
): boolean =>
  !evidence.revoked &&
  evidence.strategyRevisionId === strategyRevisionId &&
  evidence.currentRevalidationId !== null &&
  evidence.currentRevalidationRoot !== null &&
  evidence.scheduledRevalidationId === evidence.currentRevalidationId &&
  evidence.scheduledRevalidationRoot === evidence.currentRevalidationRoot

const nonCountedSuccessorScoreV119 = (
  status: "pending" | "degraded",
  conditionIds: `set-condition:sha256:${string}`[],
): SuccessorMatchSetScoreV119 => ({
  status,
  counted: false,
  degraded: status === "degraded",
  complete: false,
  rankings: [],
  canonicalConditionIds: conditionIds,
})

/**
 * Candidate-only D-15/D-16 scorer. It validates membership before observing
 * outcome fields, then canonicalizes by scenario id and condition ordinal so
 * insertion and completion order cannot influence persisted score bytes.
 */
export const scoreSuccessorMatchSetV119 = (
  scenarioInput: SetScenarioV137 | readonly SetScenarioV137[] | unknown,
  matchesInput: readonly SuccessorMatchScoreInputV119[],
): SuccessorMatchSetScoreV119 => {
  const scenarios = (
    Array.isArray(scenarioInput) ? scenarioInput : [scenarioInput]
  )
    .map((scenario) => parseSetScenarioV137(scenario))
    .sort((left, right) => left.scenarioId.localeCompare(right.scenarioId))
  if (
    scenarios.length === 0 ||
    new Set(scenarios.map(({ scenarioId }) => scenarioId)).size !==
      scenarios.length
  ) {
    throw new Error("runtime-v1.19 scenario membership mismatch")
  }
  const expectedById = new Map(
    scenarios.flatMap((scenario) =>
      scenario.conditions.map(
        (condition) => [condition.conditionId, condition] as const,
      ),
    ),
  )
  const seen = new Set<string>()
  const matches = [...matchesInput]
  for (const match of matches) {
    const expected = expectedById.get(match.conditionId)
    if (
      match.semanticAuthorityKey !== "runtime-v1.19" ||
      match.scenarioId !== expected?.scenarioId ||
      !expected ||
      seen.has(match.conditionId) ||
      match.conditionOrdinal !== expected.ordinal ||
      match.requestIdentity !== expected.requestIdentity ||
      match.bottomEntrantKey !== expected.bottomEntrantKey ||
      match.topEntrantKey !== expected.topEntrantKey ||
      match.initialInitiativeEntrantKey !== expected.initialInitiativeEntrantKey
    ) {
      throw new Error("runtime-v1.19 condition membership mismatch")
    }
    seen.add(match.conditionId)
  }

  const canonicalConditionIds = scenarios.flatMap((scenario) =>
    scenario.conditions
      .slice()
      .sort((left, right) => left.ordinal - right.ordinal)
      .map(({ conditionId }) => conditionId),
  )
  const canonical = matches.sort(
    (left, right) =>
      left.scenarioId.localeCompare(right.scenarioId) ||
      left.conditionOrdinal - right.conditionOrdinal,
  )
  const invalidRevisionEvidence = canonical.some(
    (match) =>
      !exactRevisionEvidenceV119(
        match.bottomRevisionEvidence,
        match.bottomStrategyRevisionId,
      ) ||
      !exactRevisionEvidenceV119(
        match.topRevisionEvidence,
        match.topStrategyRevisionId,
      ),
  )
  const exhaustedSystemFailure = canonical.some(
    (match) =>
      match.status === "failed_system" && !match.retryableSystemFailure,
  )
  const completeTerminals = canonical.filter(
    (match) =>
      match.status === "complete" &&
      (match.terminalKind === "success" ||
        match.terminalKind === "player_violation"),
  )
  if (
    invalidRevisionEvidence ||
    canonical.length !== canonicalConditionIds.length ||
    completeTerminals.length !== canonicalConditionIds.length
  ) {
    return nonCountedSuccessorScoreV119(
      exhaustedSystemFailure ? "degraded" : "pending",
      canonicalConditionIds,
    )
  }

  const scoring = scoreMatchSet(canonical)
  return {
    ...scoring,
    status: "complete",
    counted: true,
    degraded: false,
    complete: true,
    canonicalConditionIds,
  }
}
