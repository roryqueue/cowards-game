import type { StrategyInputV119 } from "@cowards/spec"
import { compareTacticalRanks, scoreTacticalMission, type TacticalMission, type TacticalRank } from "./scoring.js"

export type TacticalSearchNode = Readonly<{
  selected: readonly TacticalMission[]
  remaining: readonly string[]
  rank: TacticalRank
}>

const combineRank = (missions: readonly TacticalMission[], scores: readonly TacticalRank[]): TacticalRank => ({
  hard: [scores.reduce((total, score) => total + (score.hard[0] ?? 0), 0), scores.reduce((total, score) => total + (score.hard[1] ?? 0), 0)],
  soft: scores.reduce((total, score) => total + score.soft, 0),
  key: missions.map((mission) => mission.soldierId).join("|"),
})

const rankNode = (input: StrategyInputV119, selected: readonly TacticalMission[], remaining: readonly string[]): TacticalSearchNode => {
  const scores = selected.map((mission) => scoreTacticalMission(input, mission.soldierId).rank)
  return { selected, remaining, rank: combineRank(selected, scores) }
}

/** Bounded deterministic beam expansion over tactical activation assignments. */
export const expandTacticalSearch = (input: StrategyInputV119, maxExpansions = 32, beamWidth = 3): readonly TacticalSearchNode[] => {
  if (!Number.isSafeInteger(maxExpansions) || maxExpansions < 1 || maxExpansions > 64) throw new TypeError("TACTICAL_SEARCH_BUDGET")
  if (!Number.isSafeInteger(beamWidth) || beamWidth < 1 || beamWidth > 4) throw new TypeError("TACTICAL_BEAM_WIDTH")
  const active = input.mySoldiers
    .filter((soldier) => soldier.status === "ACTIVE" && soldier.position !== null)
    .map((soldier) => soldier.id)
    .sort((left, right) => left.localeCompare(right))
  const desired = Math.min(input.activationCount, active.length)
  let expansions = 0
  let beam: readonly TacticalSearchNode[] = [rankNode(input, [], active)]
  for (let depth = 0; depth < desired && expansions < maxExpansions; depth++) {
    const candidates: TacticalSearchNode[] = []
    for (const node of beam) {
      for (const soldierId of node.remaining) {
        if (expansions >= maxExpansions) break
        expansions++
        const { mission } = scoreTacticalMission(input, soldierId)
        const selected = [...node.selected, mission]
        candidates.push(rankNode(input, selected, node.remaining.filter((id) => id !== soldierId)))
      }
    }
    if (candidates.length === 0) break
    beam = candidates.sort((left, right) => compareTacticalRanks(left.rank, right.rank)).slice(0, beamWidth)
  }
  return beam
}

export const selectTacticalSearchNode = (input: StrategyInputV119): TacticalSearchNode => {
  const nodes = expandTacticalSearch(input)
  if (nodes.length === 0) return rankNode(input, [], [])
  return nodes[0]!
}
