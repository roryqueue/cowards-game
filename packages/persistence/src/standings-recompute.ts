import type {
  CompetitionCountedStateProjection,
  CompetitionEvidenceAvailability,
  PublicStandingDto,
  StrategyRevisionId,
} from "@cowards/spec"
import type { MatchSetStrategyScore } from "./scoring.js"

export interface SeasonStandingEntrant {
  entrantId: string
  strategyRevisionId: StrategyRevisionId
  ownerHandle: string
  displayLabel: string
  sourceHash: string
}

export interface ClassifiedSeasonMatchSet {
  matchSetId: string
  strategyRevisionIds: StrategyRevisionId[]
  countedState: CompetitionCountedStateProjection
  scoring: { rankings: MatchSetStrategyScore[] } | null
  resultHref: string
  replayHref?: string | undefined
}

interface MutableStanding {
  entrant: SeasonStandingEntrant
  wins: number
  losses: number
  draws: number
  points: number
  penalties: MatchSetStrategyScore["penalties"]
  survivingSoldiers: number
  survivalTurns: number
  countedMatchSetCount: number
  excludedMatchSetCount: number
  evidence: CompetitionEvidenceAvailability[]
  resultLinks: Set<string>
  replayLinks: Set<string>
}

const TIE_BREAKER_PATH = [
  "points",
  "wins",
  "survivingSoldiers",
  "survivalTurns",
  "strategyRevisionId",
] as const

const aggregateEvidenceAvailability = (
  values: CompetitionEvidenceAvailability[],
): CompetitionEvidenceAvailability => {
  if (values.length === 0 || values.every((value) => value === "unavailable")) {
    return "unavailable"
  }
  if (values.every((value) => value === "available")) return "available"
  return "partial"
}

const emptyStanding = (entrant: SeasonStandingEntrant): MutableStanding => ({
  entrant,
  wins: 0,
  losses: 0,
  draws: 0,
  points: 0,
  penalties: [],
  survivingSoldiers: 0,
  survivalTurns: 0,
  countedMatchSetCount: 0,
  excludedMatchSetCount: 0,
  evidence: [],
  resultLinks: new Set(),
  replayLinks: new Set(),
})

const addCountedScore = (
  standing: MutableStanding,
  score: MatchSetStrategyScore,
): void => {
  standing.wins += score.wins
  standing.losses += score.losses
  standing.draws += score.draws
  standing.points += score.points
  standing.penalties.push(...score.penalties)
  standing.survivingSoldiers += score.survivingSoldiers
  standing.survivalTurns += score.survivalTurns
}

export const recomputeSeasonStandings = (input: {
  entrants: SeasonStandingEntrant[]
  matchSets: ClassifiedSeasonMatchSet[]
}): PublicStandingDto[] => {
  const totals = new Map(
    [...input.entrants]
      .sort((left, right) =>
        left.strategyRevisionId.localeCompare(right.strategyRevisionId),
      )
      .map((entrant) => [entrant.strategyRevisionId, emptyStanding(entrant)]),
  )

  for (const matchSet of [...input.matchSets].sort((left, right) =>
    left.matchSetId.localeCompare(right.matchSetId),
  )) {
    for (const strategyRevisionId of [
      ...new Set(matchSet.strategyRevisionIds),
    ].sort()) {
      const standing = totals.get(strategyRevisionId)
      if (!standing) continue
      if (matchSet.countedState.state === "counted") {
        standing.countedMatchSetCount += 1
      } else {
        standing.excludedMatchSetCount += 1
      }
      standing.evidence.push(matchSet.countedState.evidenceAvailability)
      standing.resultLinks.add(matchSet.resultHref)
      if (matchSet.replayHref) standing.replayLinks.add(matchSet.replayHref)
    }

    if (matchSet.countedState.state !== "counted" || !matchSet.scoring) {
      continue
    }
    for (const score of matchSet.scoring.rankings) {
      const standing = totals.get(score.strategyRevisionId)
      if (standing) addCountedScore(standing, score)
    }
  }

  return [...totals.values()]
    .sort(
      (left, right) =>
        right.points - left.points ||
        right.wins - left.wins ||
        right.survivingSoldiers - left.survivingSoldiers ||
        right.survivalTurns - left.survivalTurns ||
        left.entrant.strategyRevisionId.localeCompare(
          right.entrant.strategyRevisionId,
        ),
    )
    .map((standing, index) => ({
      rank: index + 1,
      entrantId: standing.entrant.entrantId,
      strategyRevisionId: standing.entrant.strategyRevisionId,
      ownerHandle: standing.entrant.ownerHandle,
      displayLabel: standing.entrant.displayLabel,
      sourceHash: standing.entrant.sourceHash,
      points: standing.points,
      wins: standing.wins,
      draws: standing.draws,
      losses: standing.losses,
      penalties: [...standing.penalties].sort(
        (left, right) =>
          left.matchId.localeCompare(right.matchId) ||
          left.reason.localeCompare(right.reason) ||
          left.points - right.points,
      ),
      survivingSoldiers: standing.survivingSoldiers,
      survivalTurns: standing.survivalTurns,
      tieBreakerPath: [...TIE_BREAKER_PATH],
      competitionEvidence: {
        countedMatchSetCount: standing.countedMatchSetCount,
        excludedMatchSetCount: standing.excludedMatchSetCount,
        evidenceAvailability: aggregateEvidenceAvailability(standing.evidence),
        resultLinks: [...standing.resultLinks].sort(),
        replayLinks: [...standing.replayLinks].sort(),
      },
    }))
}
